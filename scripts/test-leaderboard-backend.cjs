'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{stripTypeScriptTypes}=require('node:module');
const source=stripTypeScriptTypes(fs.readFileSync('supabase/functions/tower-leaderboard/index.ts','utf8')).replace('export async function handle','async function handle');
const project='https://example.supabase.co',origin='https://k-szabo.github.io',token='abc.def.ghi';
const score={name:'Momo_牙',seed:123,weapon:'katana',cleared:5,kills:20,elapsedMs:60000,version:'0.9.67_1234abcd'};
function fixture(options={}){
 const calls=[],env={SUPABASE_URL:project,SUPABASE_PUBLISHABLE_KEYS:JSON.stringify({default:'sb_publishable_test'}),...options.env};let handler;
 const sandbox={Request,Response,Headers,AbortSignal,TextDecoder,Uint8Array,Error,console,
  Deno:{env:{get:key=>env[key]},serve:fn=>handler=fn},fetch:async(url,init)=>{
   calls.push({url,init});if(options.fail)throw Error('offline');
   if(url.endsWith('/auth/v1/user'))return new Response(JSON.stringify(options.user||{id:'11111111-1111-4111-8111-111111111111',role:'authenticated'}),{status:options.userStatus||200});
   if(url.endsWith('/rest/v1/rpc/list_tower_scores'))return new Response(JSON.stringify(options.rows||[]));
   if(url.endsWith('/rest/v1/rpc/submit_tower_score'))return new Response(JSON.stringify(options.outcome||{ok:true,improved:true}));
   throw Error('Unexpected URL');
  }};
 vm.createContext(sandbox);vm.runInContext(source,sandbox);
 const request=(method='POST',body=score,headers={})=>handler(new Request(project+'/functions/v1/tower-leaderboard',{method,headers:{origin,authorization:'Bearer '+token,'content-type':'application/json',...headers},...(method==='POST'?{body:typeof body==='string'?body:JSON.stringify(body)}:{})}));
 return {request,calls};
}
(async()=>{
 const f=fixture(),posted=await f.request();assert.equal(posted.status,200);assert.deepEqual(await posted.json(),{ok:true,improved:true});
 assert.equal(posted.headers.get('access-control-allow-origin'),origin);assert.equal(posted.headers.get('cache-control'),'no-store');assert.equal(f.calls.length,2);
 assert.equal(f.calls[0].url,project+'/auth/v1/user');assert.equal(f.calls[0].init.headers.Authorization,'Bearer '+token);
 assert.equal(f.calls[1].init.headers.Authorization,'Bearer '+token);assert.equal(f.calls[1].init.headers.apikey,'sb_publishable_test');
 const rpc=JSON.parse(f.calls[1].init.body);assert.equal(rpc.p_name,score.name);assert(!Object.hasOwn(rpc,'user_id'));assert(!Object.hasOwn(rpc,'ruleset'));
 const list=fixture({rows:[{rank:1,display_name:'Momo',cleared:5,elapsed_ms:60000,weapon:'katana'}]}),listed=await list.request('GET');assert.equal(listed.status,200);assert.equal((await listed.json()).scores.length,1);assert.equal(list.calls.length,1);assert(!list.calls[0].init.headers.Authorization,'Public reads use no user token');
 const cors=fixture();assert.equal((await cors.request('OPTIONS')).status,204);assert.equal(cors.calls.length,0);assert.equal((await cors.request('GET',null,{origin:'https://evil.example'})).status,403);assert.equal(cors.calls.length,0);
 for(const bad of ['', 'Bearer sb_publishable_test', 'Bearer sb_secret_test', 'Bearer malformed']){const h=fixture();assert.equal((await h.request('POST',score,{authorization:bad})).status,401);assert.equal(h.calls.length,0);}
 for(const body of [{...score,userId:'forged'},{...score,ruleset:'cheater'},[],{},null,'{bad json',...[
  {seed:0},{seed:4294967296},{seed:1.5},{weapon:'foxfireKatana'},{cleared:0},{cleared:10001},{kills:4},{kills:1000001},{elapsedMs:0},{elapsedMs:Infinity},{elapsedMs:31536000001},{version:'<script>'}
 ].map(change=>({...score,...change}))]){const h=fixture(),r=await h.request('POST',body);assert.equal(r.status,400,JSON.stringify(body));assert.equal(h.calls.length,0);}
 for(const name of ['a',' x ','a'.repeat(21),'<b>Momo</b>','Momo\n','Momo🐶']){const h=fixture(),r=await h.request('POST',{...score,name});assert.equal(r.status,400);assert.equal((await r.json()).error,'invalid_name');assert.equal(h.calls.length,0);}
 const tooLarge=fixture();assert.equal((await tooLarge.request('POST','x'.repeat(4097))).status,413);assert.equal(tooLarge.calls.length,0);
 assert.equal((await fixture().request('POST',score,{'content-type':'text/plain'})).status,415);
 const invalid=fixture({userStatus:401});assert.equal((await invalid.request()).status,401);assert.equal(invalid.calls.length,1,'Invalid user cannot reach the write RPC');
 const wrongRole=fixture({user:{id:'11111111-1111-4111-8111-111111111111',role:'anon'}});assert.equal((await wrongRole.request()).status,401);assert.equal(wrongRole.calls.length,1);
 const limited=await fixture({outcome:{error:'rate_limited'}}).request();assert.equal(limited.status,429);assert.equal(limited.headers.get('retry-after'),'60');
 assert.equal((await fixture({outcome:{ok:true,improved:false}}).request()).status,200);
 assert.equal((await fixture({fail:true}).request()).status,503);assert.equal((await fixture({env:{SUPABASE_URL:''}}).request()).status,503);
 const sql=fs.readFileSync('supabase/migrations/202611020001_tower_leaderboard.sql','utf8');
 assert(sql.startsWith('begin;')&&sql.trimEnd().endsWith('commit;'));
 assert.match(sql,/revoke all on schema leaderboard_private from public, anon, authenticated/);
 assert.match(sql,/alter table leaderboard_private\.tower_scores enable row level security/);
 assert.match(sql,/alter table leaderboard_private\.tower_submissions enable row level security/);
 assert.match(sql,/caller uuid := auth\.uid\(\)/);assert.match(sql,/auth\.role\(\) is distinct from 'authenticated'/);
 assert.match(sql,/pg_advisory_xact_lock\(hashtextextended\(caller::text, 0\)\)/);
 assert(sql.indexOf('pg_advisory_xact_lock')<sql.indexOf('select last_submit'),'Rate checking must happen under the lock');
 assert.match(sql,/interval '60 seconds'/);assert.match(sql,/limit 50/);
 assert.match(sql,/grant execute on function public\.submit_tower_score\([^;]+\) to authenticated;/);
 assert(!/grant (?:all|insert|update|delete|select) on .*tower_scores to (?:anon|authenticated)/i.test(sql),'Raw score tables have no client grants');
 assert.equal((sql.match(/security definer set search_path = ''/g)||[]).length,2);
 console.log('PASS: Edge auth precedes write, public top list, exact CORS, bounded JSON, strict names/scores, forged identity rejection, failure handling and migration security structure. SQL execution/race behaviour requires a real Supabase/Postgres instance.');
})().catch(error=>{console.error(error);process.exitCode=1;});
