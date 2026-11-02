const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const config={url:'https://example.supabase.co',keyFile:'assets/config/leaderboard-public.json',function:'tower-leaderboard'};
function fixture(){
 const records=new Map([['momo-three-worlds-v2','sealed-adventure'],['kiba-infinite-tower-v1','local-best']]),calls=[];let failure=false;
 const box={LEADERBOARD_CONFIG:config,GAME_RELEASE:{version:'0.9.67_75122992'},AbortController,setTimeout,clearTimeout,Date,localStorage:{getItem:k=>records.get(k),setItem:(k,v)=>records.set(k,v)},fetch:async(url,options)=>{
  calls.push({url,options});if(failure)throw Error('offline');
  const data=url===config.keyFile?{publishableKey:'sb_publishable_public'}:url.includes('/auth/')?{access_token:'user.jwt.token',refresh_token:'refresh-value',expires_in:3600}:options.method==='POST'?{ok:true,improved:true}:{scores:[{rank:1,display_name:'Momo',cleared:5,elapsed_ms:10000,weapon:'katana'}]};
  return {ok:true,json:async()=>data};
 }};vm.createContext(box);vm.runInContext(fs.readFileSync('assets/js/tower-leaderboard-api.js','utf8')+';this.api=TowerLeaderboardAPI;',box);
 return {api:box.api,records,calls,offline:()=>failure=true};
}
(async()=>{
 const f=fixture(),score={seed:123,weapon:'katana',cleared:5,kills:20,elapsed:12.345};
 assert.equal((await f.api.list()).length,1);assert(!f.calls.some(c=>c.url.includes('/auth/')),'Reading a public list does not create accounts');
 await assert.rejects(()=>f.api.submit('<script>',score));assert.equal(f.calls.length,2,'Invalid names cannot sign up or write');
 await assert.rejects(()=>f.api.submit('Momo',{...score,cleared:0}));assert.equal(f.calls.length,2);
 await f.api.submit('Momo',score);await f.api.submit('Momo',score);
 assert.equal(f.calls.filter(c=>c.url.endsWith('/auth/v1/signup')).length,1,'Same browser reuses its anonymous identity');
 const post=f.calls.at(-1);assert.equal(post.options.headers.Authorization,'Bearer user.jwt.token');assert.equal(post.options.headers.apikey,'sb_publishable_public');
 assert.equal(JSON.parse(post.options.body).elapsedMs,12345);assert.equal(Object.hasOwn(JSON.parse(post.options.body),'userId'),false);
 assert.equal(f.records.get('momo-three-worlds-v2'),'sealed-adventure');assert.equal(f.records.get('kiba-infinite-tower-v1'),'local-best');
 f.offline();await assert.rejects(()=>f.api.list(),e=>e.code==='unavailable');assert.equal(f.records.get('momo-three-worlds-v2'),'sealed-adventure');
 const g=fixture();await g.api.list();g.records.set('kiba-tower-auth:'+config.url,JSON.stringify({access_token:'old.jwt.token',refresh_token:'keep-identity',expires_at:1}));g.offline();await assert.rejects(()=>g.api.submit('Momo',score));assert(g.calls.at(-1).url.includes('grant_type=refresh_token'));assert(!g.calls.some(c=>c.url.endsWith('/signup')),'A failed refresh never creates a replacement identity');
 const {spawnSync}=require('node:child_process'),os=require('node:os'),path=require('node:path');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'kiba-leaderboard-config-')),output=path.join(temp,'public.json');
 try{
  const run=value=>spawnSync(process.execPath,['scripts/write-leaderboard-config.mjs',output],{encoding:'utf8',env:{...process.env,SUPABASE_PUBLISHABLE_KEY:value}});
  const publicValue='sb_publishable_generator_fixture';const good=run(publicValue);assert.equal(good.status,0);assert(!good.stdout.includes(publicValue));assert.equal(JSON.parse(fs.readFileSync(output)).publishableKey,publicValue);
  const snapshot=fs.readFileSync(output,'utf8'),bad=run('sb_secret_forbidden_fixture');assert.notEqual(bad.status,0);assert.equal(fs.readFileSync(output,'utf8'),snapshot,'A secret key cannot overwrite browser configuration');
  assert.equal(run('').status,0);assert.deepEqual(JSON.parse(fs.readFileSync(output)),{});
  const runtime=fs.readFileSync('assets/js/runtime.js','utf8');assert(!/sb_(?:publishable|secret)_[A-Za-z0-9_-]{20,}/.test(runtime),'Generated runtime must never embed a real project key');
 }finally{const resolved=path.resolve(temp);assert(resolved.startsWith(path.resolve(os.tmpdir())+path.sep+'kiba-leaderboard-config-'));fs.rmSync(resolved,{recursive:true});}
 console.log('PASS: opt-in anonymous identity, reuse, validation, request credentials, milliseconds, failures and save isolation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
