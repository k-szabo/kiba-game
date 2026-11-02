begin;

create schema if not exists leaderboard_private;
revoke all on schema leaderboard_private from public, anon, authenticated;

create table if not exists leaderboard_private.tower_scores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ruleset text not null default 'tower-v1' check (ruleset = 'tower-v1'),
  display_name text not null check (char_length(display_name) between 3 and 20 and display_name = btrim(display_name) and display_name !~ '[^[:alnum:] _-]'),
  seed bigint not null check (seed between 1 and 4294967295),
  weapon text not null check (weapon in ('katana', 'naginata', 'swordShield')),
  cleared integer not null check (cleared between 1 and 10000),
  kills integer not null check (kills between cleared and 1000000),
  elapsed_ms bigint not null check (elapsed_ms between 1 and 31536000000),
  version text not null check (version ~ '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}(_[a-f0-9]{8})?$'),
  submitted_at timestamptz not null default now()
);
create index if not exists tower_scores_order on leaderboard_private.tower_scores (cleared desc, elapsed_ms asc, submitted_at asc, user_id);

create table if not exists leaderboard_private.tower_submissions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_submit timestamptz not null
);
alter table leaderboard_private.tower_scores enable row level security;
alter table leaderboard_private.tower_submissions enable row level security;
revoke all on all tables in schema leaderboard_private from public, anon, authenticated;

-- No user IDs or authentication records are returned to public callers.
create or replace function public.list_tower_scores()
returns table (rank bigint, display_name text, cleared integer, elapsed_ms bigint, weapon text, submitted_at timestamptz, version text)
language sql stable security definer set search_path = ''
as $$
  select row_number() over (order by s.cleared desc, s.elapsed_ms, s.submitted_at, s.user_id),
    s.display_name, s.cleared, s.elapsed_ms, s.weapon, s.submitted_at, s.version
  from leaderboard_private.tower_scores s
  where s.ruleset = 'tower-v1'
  order by s.cleared desc, s.elapsed_ms, s.submitted_at, s.user_id
  limit 50;
$$;
revoke all on function public.list_tower_scores() from public, anon, authenticated;
grant execute on function public.list_tower_scores() to anon, authenticated;

create or replace function public.submit_tower_score(
  p_name text, p_seed bigint, p_weapon text, p_cleared integer,
  p_kills integer, p_elapsed_ms bigint, p_version text
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  prior_time timestamptz;
  prior leaderboard_private.tower_scores%rowtype;
  improved boolean;
begin
  if caller is null or auth.role() is distinct from 'authenticated' then
    return jsonb_build_object('error', 'unauthorized');
  end if;
  if p_name is null or char_length(p_name) not between 3 and 20
    or p_name <> btrim(p_name) or p_name ~ '[^[:alnum:] _-]' then
    return jsonb_build_object('error', 'invalid_name');
  end if;
  if p_seed is null or p_seed not between 1 and 4294967295
    or p_weapon is null or p_weapon not in ('katana','naginata','swordShield')
    or p_cleared is null or p_cleared not between 1 and 10000
    or p_kills is null or p_kills < p_cleared or p_kills > 1000000
    or p_elapsed_ms is null or p_elapsed_ms not between 1 and 31536000000
    or p_version is null or p_version !~ '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}(_[a-f0-9]{8})?$' then
    return jsonb_build_object('error', 'invalid_score');
  end if;

  -- Serialize per-user calls before checking time or updating the personal best.
  -- The lock also covers first submissions, when there is no row to lock yet.
  perform pg_advisory_xact_lock(hashtextextended(caller::text, 0));
  select last_submit into prior_time from leaderboard_private.tower_submissions where user_id = caller;
  if prior_time is not null and clock_timestamp() - prior_time < interval '60 seconds' then
    return jsonb_build_object('error', 'rate_limited');
  end if;
  insert into leaderboard_private.tower_submissions(user_id, last_submit)
    values(caller, clock_timestamp())
    on conflict (user_id) do update set last_submit = excluded.last_submit;

  select * into prior from leaderboard_private.tower_scores where user_id = caller;
  improved := prior.user_id is null or p_cleared > prior.cleared
    or p_cleared = prior.cleared and p_elapsed_ms < prior.elapsed_ms;
  if improved then
    insert into leaderboard_private.tower_scores(user_id, display_name, seed, weapon, cleared, kills, elapsed_ms, version)
      values(caller, p_name, p_seed, p_weapon, p_cleared, p_kills, p_elapsed_ms, p_version)
      on conflict (user_id) do update set display_name = excluded.display_name,
        seed = excluded.seed, weapon = excluded.weapon, cleared = excluded.cleared,
        kills = excluded.kills, elapsed_ms = excluded.elapsed_ms, version = excluded.version,
        submitted_at = clock_timestamp();
  else
    update leaderboard_private.tower_scores set display_name = p_name where user_id = caller;
  end if;
  return jsonb_build_object('ok', true, 'improved', improved);
end;
$$;
revoke all on function public.submit_tower_score(text,bigint,text,integer,integer,bigint,text) from public, anon, authenticated;
grant execute on function public.submit_tower_score(text,bigint,text,integer,integer,bigint,text) to authenticated;

commit;
