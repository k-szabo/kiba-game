# Tower leaderboard backend

This is an optional backend for the static GitHub Pages game. It stores community-submitted scores; it does not replay or authoritatively simulate tower gameplay.

## Dashboard deployment

1. Enable anonymous sign-ins under **Authentication → Sign In / Providers**. New sign-ups must also be allowed. Anonymous users use the `authenticated` database role.
2. Open **SQL Editor → New query**. Paste the complete contents of `migrations/202611020001_tower_leaderboard.sql` and run it. The transaction creates private score/rate tables and two narrowly granted public RPC functions. It does not read or reset adventure saves.
3. Open **Edge Functions → Deploy a new function → Via Editor**, name the function `tower-leaderboard`, and use the complete contents of `functions/tower-leaderboard/index.ts` as its `index.ts`. Deploy it.
4. In that function's configuration, turn off the platform **Verify JWT** check. This permits public reads and CORS preflight. POST still requires a user JWT: the function verifies it with Supabase Auth, then calls the write RPC using that same JWT. `config.toml` applies this setting when deploying with the CLI instead of the Dashboard.
5. The hosted function reads the automatic `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEYS` environment variables. The key named `default` is used; the automatic legacy `SUPABASE_ANON_KEY` is a compatibility fallback. No database password, secret API key, or service-role key is needed.
6. Optional: set the `ALLOWED_ORIGINS` Edge Function secret to a comma-separated list of exact browser origins. The defaults are `https://k-szabo.github.io`, `http://localhost:8799`, and `http://127.0.0.1:8799`. An origin contains no trailing slash or project path. Add the actual local test origin if using another port; keep the production origin when overriding this list.

Anonymous sign-in abuse protection can be configured under Auth attack protection with Turnstile/CAPTCHA. It must also be integrated into the game before enabling a required CAPTCHA challenge. An anonymous identity is tied to its browser session; clearing browser data creates a new player identity. Do not delete anonymous Auth users as routine cleanup without considering that their score rows are deleted by the foreign-key cascade.

## API contract

Endpoint: `<PROJECT_URL>/functions/v1/tower-leaderboard`.

Every browser call sends the project's public publishable key in `apikey`. POST also sends `Authorization: Bearer <user-access-token>`; an API key is never a user token.

- `GET`: returns `{scores:[...]}` with at most 50 rows, ordered by completed floors descending, active time ascending, then submission date and internal user ID for stable ordering. Public output contains `rank`, `display_name`, `cleared`, `elapsed_ms`, `weapon`, `submitted_at`, and `version`; no user IDs or Auth records are exposed.
- `POST`: exact JSON fields `{name,seed,weapon,cleared,kills,elapsedMs,version}`. Returns `{ok:true,improved:boolean}`. Ruleset is fixed to `tower-v1` and owner comes from the verified JWT. There is no client-supplied owner or season.
- Error codes: `unauthorized` (401), `origin_denied` (403), `invalid_name` / `invalid_score` (400), `rate_limited` (429 with `Retry-After: 60`), or `unavailable` (503). Unsupported content type is 415, oversized JSON is 413, unsupported method is 405.

Names allow 3–20 Unicode letters/numbers, spaces, `_`, and `-`, with no surrounding whitespace. Scores require a positive uint32 seed, one of the three starting weapons, 1–10,000 cleared floors, up to 1,000,000 kills, and 1–31,536,000,000 milliseconds. These are storage/abuse bounds, not proof that a score was achieved honestly.

Each user has one personal best for this ruleset. A valid submission is allowed once per 60 seconds, including an equal/worse result. A worse result may update the display name, but never replaces the stored better score. A transaction advisory lock serializes same-user submissions, including simultaneous first submissions. Display names are not unique account credentials.

## Verification and limits

`node scripts/test-leaderboard-backend.cjs` exercises the Edge handler with mocked Auth/REST responses, including forged owners, invalid tokens, oversized JSON, CORS, validation, rate responses, and outages. It also checks critical migration structure. It requires Node 24's TypeScript stripping support. It does not execute SQL or prove database concurrency. After deployment, verify the real SQL grants, anonymous Auth flow, one-minute rate limit, better/worse-score preservation, public top list, and simultaneous same-user submissions against a disposable test identity.

Live verification on 2026-11-02 confirmed public GET (an empty list), Pages-origin CORS and preflight, rejection of other browser origins and API keys used as user tokens, anonymous Auth signup/user verification, and authenticated RPC access. A deliberately invalid score returned `invalid_score` without creating a score row; an unauthenticated RPC call was denied. The disposable session was logged out. No test score was published. A browser also read the real hosted API with the Pages origin while a private route served the local game build/configuration. A successful score write, best-score replacement and concurrent/rate-limited writes have mock coverage but still require a real player submission or a disposable staging database for complete live coverage.

References: [anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous), [Edge Function environment](https://supabase.com/docs/guides/functions/secrets), [function authentication](https://supabase.com/docs/guides/functions/auth-headers), [Dashboard deployment](https://supabase.com/docs/guides/functions/quickstart-dashboard), [explicit Data API grants](https://supabase.com/docs/guides/api/securing-your-api).

## Git-free browser configuration

The publishable key is not committed or embedded in runtime.js. In GitHub open **Settings → Secrets and variables → Actions → Variables → New repository variable** and create `SUPABASE_PUBLISHABLE_KEY` with the project's `sb_publishable_…` value. The Pages job writes it directly into the deployment artifact. The published browser can read this value; it is not a secret, and RLS/RPC grants remain necessary.

Locally set the same process environment variable and run `node scripts/write-leaderboard-config.mjs`. This creates the ignored `assets/config/leaderboard-public.json`; never stage it. Without configuration the game still runs and the leaderboard shows its unavailable message. The generator rejects secret API keys. Database passwords, service keys and user tokens must never be supplied as repository variables or browser configuration.
