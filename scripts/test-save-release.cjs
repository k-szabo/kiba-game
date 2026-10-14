// Synthetic integration coverage: real WebCrypto, serialized in-memory IDB.
// This does not replace a fresh-profile browser IndexedDB/reload check.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/save-vault.js'),'utf8');
const levelSource=fs.readFileSync(path.join(__dirname,'../assets/js/levels.js'),'utf8');
const current=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/config/release.json'),'utf8')).version;
const SAVE='momo-three-worlds-v2',LEGACY='kiba-three-worlds-v1';
const copy=value=>value===undefined?undefined:structuredClone(value);

function storageEnvironment(){
 const env={records:new Map(),local:new Map(),tail:Promise.resolve(),lockTail:Promise.resolve(),opened:[]};
 env.localStorage={getItem:key=>env.local.get(key)??null,setItem:(key,value)=>env.local.set(key,String(value)),removeItem:key=>env.local.delete(key)};
 const database={createObjectStore(){},transaction(name,mode){
  assert.equal(name,'vault');
  const tx={pending:0,generation:0,active:false,aborted:false,jobs:[]};
  let finish;
  const released=new Promise(resolve=>{finish=resolve;});
  const begin=env.tail;env.tail=released;
  function end(){
   if(tx.ended)return;tx.ended=true;
   if(!tx.aborted&&mode==='readwrite')env.records=tx.data;
   queueMicrotask(()=>{if(tx.aborted)tx.onabort?.();else tx.oncomplete?.();finish();});
  }
  function scheduleEnd(){const generation=tx.generation;setImmediate(()=>{if(!tx.pending&&generation===tx.generation)end();});}
  function run(job){setImmediate(()=>{
   if(tx.aborted)return;
   try{job.req.result=copy(job.action());job.req.onsuccess?.();}catch(error){job.req.error=error;job.req.onerror?.();tx.error=error;tx.aborted=true;}
   tx.pending--;if(tx.aborted)end();else scheduleEnd();
  });}
  function operation(action){
   if(tx.ended||tx.aborted)throw Error('Transaction inactive');
   const req={};tx.pending++;tx.generation++;
   const job={req,action};if(tx.active)run(job);else tx.jobs.push(job);return req;
  }
  tx.objectStore=()=>({get:key=>operation(()=>tx.data.get(key)),put:(value,key)=>{assert.equal(mode,'readwrite');return operation(()=>tx.data.set(key,copy(value)));},delete:key=>{assert.equal(mode,'readwrite');return operation(()=>tx.data.delete(key));}});
  tx.abort=()=>{tx.aborted=true;tx.error=Error('Storage aborted');end();};
  begin.then(()=>{tx.active=true;tx.data=new Map([...env.records].map(([key,value])=>[key,copy(value)]));for(const job of tx.jobs)run(job);scheduleEnd();});
  return tx;
 }};
 env.indexedDB={open(name,version){
  env.opened.push(name);assert.equal(name,'momo-save-v2');assert.equal(version,1);
  const req={};setImmediate(()=>{req.result=database;req.onsuccess?.();});return req;
 }};
 env.locks={request(name,action){assert.equal(name,'momo-save-v2');const next=env.lockTail.catch(()=>{}).then(action);env.lockTail=next;return next;}};
 return env;
}

function client(env,release=current,{locks=true,crypto=webcrypto}={}){
 const context={TextEncoder,TextDecoder,Uint8Array,BigInt,location:{origin:'http://localhost',pathname:'/kiba-game/'},btoa,atob,crypto,indexedDB:env.indexedDB,localStorage:env.localStorage,navigator:locks?{locks:env.locks}:{},I18n:{t:key=>key},GAME_RELEASE:{version:release,savePolicy:'reset-on-version-change'}};
 vm.createContext(context);vm.runInContext(levelSource,context);
 vm.runInContext(source+'\nglobalThis.vault=SaveVault;',context);
 return context;
}

function fixture(release=current){
 return {version:2,layout:2,release,realm:0,shards:7,won:false,abilities:[false,false],defeated:[false,false,false],flags:[[],[],[]],visitedRests:[['start'],[],[]],checkpoint:{id:'start',x:330,y:1000},progression:{level:1,xp:0,totalXp:0,points:0,stats:{vitality:0,strength:0,spirit:0}}};
}
function plain(value){return JSON.parse(JSON.stringify(value));}

async function main(){
 const env=storageEnvironment();env.local.set('language','en');env.local.set('bindings','custom');env.local.set('other-app','keep');
 const first=client(env);assert.equal(await first.vault.ready,null);assert.equal(first.vault.isReady,true);assert.equal(first.vault.notice,'');
 const initial=env.records.get('profile');assert.equal(initial.release,current);assert.equal(initial.key.extractable,false);assert.equal(initial.key.algorithm.name,'HKDF');
 await first.vault.write(fixture());const encrypted=env.records.get('save');assert.match(encrypted,/^MOMO2\./);assert.ok(!encrypted.includes('shards'));
 const envelope=JSON.parse(atob(encrypted.slice(6)));assert.equal(envelope.release,current);assert.equal(envelope.revision,1);
 const reload=client(env);assert.deepEqual(plain(await reload.vault.ready),fixture());assert.equal(reload.vault.notice,'');assert.equal(env.records.get('profile').device,initial.device);
 assert.throws(()=>first.vault.write({...fixture(),release:'0.0.1'}),/Invalid save schema/);
 assert.throws(()=>first.vault.write({...fixture(),version:1}),/Invalid save schema/);
 const noRelease=fixture();delete noRelease.release;assert.throws(()=>first.vault.write(noRelease),/Invalid save schema/);

 // Council key is consumed at the gate; an earned key can also lie on the floor.
 const council=fixture();Object.assign(council,{realm:1,abilities:[true,true],defeated:[true,true,false],flags:[['forestBell','villageBell'],['soulUpper','soulLower'],[]],visitedRests:[['start'],['start'],[]]});
 const councilClient=reload;
 const councilRest=vm.runInContext('levels[1].rests[0]',councilClient);council.checkpoint=plain(councilRest);
 for(const flags of [['councilKeyEarned'],['councilKeyEarned','councilKey'],['councilKeyEarned','councilGateOpen']]){
  const data=copy(council);data.flags[1].push(...flags);await councilClient.vault.write(data);
 }
 for(const flags of [['councilKey'],['councilGateOpen'],['councilKeyEarned','councilKey','councilGateOpen']]){
  const data=copy(council);data.flags[1].push(...flags);assert.throws(()=>councilClient.vault.write(data),/Invalid council progress/);
 }
 const unearned=copy(council);unearned.defeated[1]=false;unearned.flags[1].push('councilKeyEarned');assert.throws(()=>councilClient.vault.write(unearned),/Invalid council progress/);

 // A real encrypted older release resets once, preserves preferences, and an
 // already-open old tab cannot write over the replacement profile or mirror.
 const update=storageEnvironment();for(const [key,value] of env.local)if(key!==SAVE)update.local.set(key,value);
 const old=client(update,'0.0.1');await old.vault.ready;await old.vault.write(fixture('0.0.1'));
 const oldProfile=copy(update.records.get('profile')),oldCipher=update.records.get('save');
 update.local.set(LEGACY,JSON.stringify({...fixture('0.0.1'),version:1}));
 const upgraded=client(update);assert.equal(await upgraded.vault.ready,null);assert.equal(upgraded.vault.notice,'text.save.reset.new.version');assert.equal(upgraded.vault.isReady,true);
 const upgradedProfile=copy(update.records.get('profile'));assert.notEqual(upgradedProfile.device,oldProfile.device);assert.equal(upgradedProfile.revision,0);assert.equal(update.records.has('save'),false);assert.equal(update.local.has(SAVE),false);assert.equal(update.local.has(LEGACY),false);
 for(const key of ['language','bindings','other-app'])assert.equal(update.local.get(key),env.local.get(key));
 assert.equal((await client(update).vault.ready),null);const freshReload=client(update);await freshReload.vault.ready;assert.equal(freshReload.vault.notice,'');
 await upgraded.vault.write(fixture());const newCipher=update.records.get('save');
 await assert.rejects(old.vault.write(fixture('0.0.1')),/another game release/);
 assert.equal(update.records.get('profile').device,upgradedProfile.device);assert.equal(update.records.get('save'),newCipher);assert.equal(update.local.get(SAVE),newCipher);
 const cached=client(update,'0.0.1');assert.equal(await cached.vault.ready,null);assert.equal(cached.vault.isReady,false);assert.equal(cached.vault.notice,'text.save.newer.version');assert.equal(update.records.get('save'),newCipher);assert.equal(update.local.get(SAVE),newCipher);
 const nextMajor=BigInt(current.split('.')[0])+1n;
 for(const future of [nextMajor+'.0.0',nextMajor+'.0.0-beta.1','unrecognised-future-version']){
  const futureEnv=storageEnvironment();futureEnv.records.set('profile',{...upgradedProfile,release:future});futureEnv.records.set('save',newCipher);futureEnv.local.set(SAVE,newCipher);
  const stale=client(futureEnv);assert.equal(await stale.vault.ready,null);assert.equal(stale.vault.isReady,false);assert.equal(stale.vault.notice,'text.save.newer.version');assert.equal(futureEnv.records.get('profile').release,future);assert.equal(futureEnv.local.get(SAVE),newCipher);
 }

 // Profiles from before release stamping and former plaintext/mirror-only
 // records are discarded, rather than restored or migrated into this release.
 for(const kind of ['plaintext','mirror','unstamped']){
  const previous=storageEnvironment();previous.local.set('language','en');
  if(kind==='plaintext')previous.local.set(LEGACY,JSON.stringify({...fixture(),version:1}));
  if(kind==='mirror')previous.local.set(SAVE,oldCipher);
  if(kind==='unstamped'){const profile=copy(oldProfile);delete profile.release;previous.records.set('profile',profile);previous.records.set('save',oldCipher);}
  const now=client(previous);assert.equal(await now.vault.ready,null);assert.equal(now.vault.notice,'text.save.reset.new.version');assert.equal(now.vault.isReady,true);assert.equal(previous.records.has('save'),false);assert.equal(previous.local.has(SAVE),false);assert.equal(previous.local.has(LEGACY),false);assert.equal(previous.local.get('language'),'en');
 }

 // Merely relabeling an old envelope/profile cannot bypass release-bound
 // HKDF/AAD authentication, even with the original non-exportable profile key.
 const relabeled=storageEnvironment(),entry=JSON.parse(atob(oldCipher.slice(6)));
 relabeled.records.set('profile',{...oldProfile,release:current});entry.release=current;relabeled.records.set('save','MOMO2.'+btoa(JSON.stringify(entry)));
 const tampered=client(relabeled);assert.equal(await tampered.vault.ready,null);assert.equal(tampered.vault.isReady,false);assert.equal(tampered.vault.notice,'text.save.unavailable');

 // Without Web Locks, concurrent initializers still converge on one current
 // profile via the IndexedDB transaction recheck.
 const race=storageEnvironment();const a=client(race,current,{locks:false}),b=client(race,current,{locks:false});await Promise.all([a.vault.ready,b.vault.ready]);
 assert.ok(a.vault.isReady&&b.vault.isReady);await a.vault.write(fixture());assert.deepEqual(plain(await client(race).vault.ready),fixture());

 // An old write already encrypting before rotation must lose its atomic
 // profile comparison, including when Web Locks are unavailable.
 const inflight=storageEnvironment();const prior=client(inflight,'0.0.1',{locks:false});await prior.vault.ready;await prior.vault.write(fixture('0.0.1'));
 let entered,continueEncryption;const encrypting=new Promise(resolve=>{entered=resolve;}),resume=new Promise(resolve=>{continueEncryption=resolve;});
 const pausedCrypto={getRandomValues:value=>webcrypto.getRandomValues(value),subtle:new Proxy(webcrypto.subtle,{get(target,key){if(key==='encrypt')return async(...args)=>{entered();await resume;return target.encrypt(...args);};const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}})};
 const slow=client(inflight,'0.0.1',{locks:false,crypto:pausedCrypto});await slow.vault.ready;const writing=slow.vault.write(fixture('0.0.1'));await encrypting;
 const replacement=client(inflight,current,{locks:false});await replacement.vault.ready;assert.equal(replacement.vault.isReady,true);const replacementDevice=inflight.records.get('profile').device;
 continueEncryption();await assert.rejects(writing,/Storage aborted/);assert.equal(inflight.records.get('profile').device,replacementDevice);assert.equal(inflight.records.has('save'),false);assert.equal(inflight.local.has(SAVE),false);
 assert.ok([...env.opened,...update.opened,...race.opened].every(name=>name==='momo-save-v2'));
 console.log('Save release: reload, version reset, legacy discard, preferences, consumed key, stale clients, crypto binding, and concurrent initialization passed.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
