// Synthetic integration coverage: real WebCrypto, serialized in-memory IDB.
// This does not replace a fresh-profile browser IndexedDB/reload check.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/save-vault.js'),'utf8');
const levelSource=fs.readFileSync(path.join(__dirname,'../assets/js/levels.js'),'utf8');
const levelContext=vm.createContext({I18n:{t:key=>key}});vm.runInContext(levelSource,levelContext);
const realmCount=vm.runInContext('levels.length',levelContext);
const rules=vm.runInContext('PROGRESSION_RULES',levelContext);
const worldArrays=(first=[])=>Array.from({length:realmCount},(_,index)=>first[index]?[...first[index]]:[]);
const victories=(first=[])=>Array.from({length:realmCount},(_,index)=>first[index]===true);
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

function client(env,release=current,{locks=true,crypto=webcrypto,history={}}={}){
 const context={TextEncoder,TextDecoder,Uint8Array,BigInt,location:{origin:'http://localhost',pathname:'/kiba-game/'},btoa,atob,crypto,indexedDB:env.indexedDB,localStorage:env.localStorage,navigator:locks?{locks:env.locks}:{},I18n:{t:key=>key},GAME_RELEASE:{version:release,savePolicy:'reset-on-version-change',bugfixHistory:history}};
 vm.createContext(context);vm.runInContext(levelSource,context);
 vm.runInContext(source+'\nglobalThis.vault=SaveVault;',context);
 return context;
}

function fixture(release=current){
 return {coins:0,meatCount:0,version:2,layout:2,release,realm:0,shards:7,won:false,abilities:[false,false],defeated:victories(),flags:worldArrays(),visitedRests:worldArrays([['start']]),checkpoint:{id:'start',x:330,y:1000},progression:{level:1,xp:0,totalXp:0,points:0,stats:{vitality:0,strength:0,spirit:0}}};
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
 const council=fixture();Object.assign(council,{realm:1,abilities:[true,true],defeated:victories([true,true]),flags:worldArrays([['forestBell','villageBell'],['soulUpper','soulLower']]),visitedRests:worldArrays([['start'],['start']])});
 const councilClient=reload;
 const councilRest=vm.runInContext('levels[1].rests[0]',councilClient);council.checkpoint=plain(councilRest);
 const summoned=copy(council);summoned.flags[1].push('slayerSeal','slayerSummoned');
 await councilClient.vault.write(summoned);assert.deepEqual(plain(await client(env).vault.ready),summoned,'Confirmed grave summoning survives encrypted reload');
 const noSeal=copy(summoned);noSeal.flags[1]=noSeal.flags[1].filter(id=>id!=='slayerSeal');assert.throws(()=>councilClient.vault.write(noSeal),/Invalid grave progress/);
 for(const flags of [['councilKeyEarned'],['councilKeyEarned','councilKey'],['councilKeyEarned','councilGateOpen']]){
  const data=copy(council);data.flags[1].push(...flags);await councilClient.vault.write(data);
 }
 for(const flags of [['councilKey'],['councilGateOpen'],['councilKeyEarned','councilKey','councilGateOpen']]){
  const data=copy(council);data.flags[1].push(...flags);assert.throws(()=>councilClient.vault.write(data),/Invalid council progress/);
 }
 const unearned=copy(council);unearned.defeated[1]=false;unearned.flags[1].push('councilKeyEarned');assert.throws(()=>councilClient.vault.write(unearned),/Invalid council progress/);

 // Defeating Yomi without visiting the dash shrine is a legal permanent state,
 // including the next realm. Encryption/reload must not invent the ability.
 for(const realm of [1,2]){
  const skipped=copy(council);skipped.realm=realm;skipped.abilities[1]=false;
  skipped.checkpoint=plain(vm.runInContext(`levels[${realm}].rests[0]`,councilClient));skipped.visitedRests[realm]=['start'];
  await councilClient.vault.write(skipped);assert.deepEqual(plain(await client(env).vault.ready),skipped);
  const missingGuardian=copy(skipped);missingGuardian.defeated[0]=false;assert.throws(()=>councilClient.vault.write(missingGuardian),/Invalid realm sequence/);
  if(realm===2){missingGuardian.defeated[0]=true;missingGuardian.defeated[1]=false;assert.throws(()=>councilClient.vault.write(missingGuardian),/Invalid realm sequence/);}
  const acquired=copy(skipped);acquired.abilities[1]=true;
  await councilClient.vault.write(acquired);assert.deepEqual(plain(await client(env).vault.ready),acquired);
 }

 // Japan victory and later realms do not imply double-jump ownership. Keep
 // both abilities independent through real encryption and profile reloads.
 for(const realm of [0,1,2])for(const dashOwned of [false,true]){
  const skipped=copy(council);skipped.realm=realm;skipped.abilities=[false,dashOwned];
  skipped.checkpoint=plain(vm.runInContext(`levels[${realm}].rests[0]`,councilClient));skipped.visitedRests[realm]=['start'];
  await councilClient.vault.write(skipped);assert.deepEqual(plain(await client(env).vault.ready),skipped);
  const atCamp=copy(skipped);atCamp.realm=0;atCamp.location='forestCamp';atCamp.prologueComplete=true;
  atCamp.checkpoint=plain(vm.runInContext('forestCamp.rests[0]',councilClient));atCamp.visitedRests[0]=['start','forestCamp'];
  await councilClient.vault.write(atCamp);assert.deepEqual(plain(await client(env).vault.ready),atCamp);
  const acquired=copy(skipped);acquired.abilities[0]=true;
  await councilClient.vault.write(acquired);assert.deepEqual(plain(await client(env).vault.ready),acquired);
 }

 // Snake loot can be earned before the guardian dies, even without collecting
 // the optional dash shrine first. It is permanent across encrypted reloads.
 const scale=copy(council);scale.abilities[1]=false;scale.defeated[1]=false;scale.flags[1].push('serpentScale');
 await councilClient.vault.write(scale);assert.deepEqual(plain(await client(env).vault.ready),scale);
 const invalidScale=copy(scale);invalidScale.flags[1]=['serpentScale'];assert.throws(()=>councilClient.vault.write(invalidScale),/Invalid serpent reward/);

 // The united relic survives actual AES-GCM roundtrips and realm changes.
 const united=fixture();Object.assign(united,{realm:2,abilities:[true,true],defeated:victories([true,true,true]),flags:worldArrays([['forestBell','villageBell','guardian:oldAngel','guardian:oldCultist','angelHalo','demonHorn'],['soulUpper','soulLower'],['dawnSeal','eclipseRelic']]),visitedRests:worldArrays([['start'],['start'],['start']]),checkpoint:{id:'start',x:420,y:6300}});
 await reload.vault.write(united);assert.deepEqual(plain(await client(env).vault.ready),united);
 const invalidUnited=copy(united);invalidUnited.flags[0]=invalidUnited.flags[0].filter(id=>id!=='angelHalo');assert.throws(()=>reload.vault.write(invalidUnited),/Invalid united relic/);

 // Claimed boss souls and their extra training budget survive real WebCrypto
 // serialization, including allocated stats and a reload after each victory.
 const rewards=plain(vm.runInContext('BOSS_REWARDS',councilClient));
 const rewarded=copy(united);rewarded.flags[2]=['dawnSeal'];
 let rewardXP=0,bonusPoints=0;
 for(const [realm,reward] of rewards.entries()){
  if(realm===3){rewarded.flags[2].push('shadowEntered');rewarded.defeated[3]=true;rewarded.visitedRests[3]=[vm.runInContext('levels[3].rests[0].id',councilClient)];}
  rewarded.flags[realm].push(reward.claim,reward.id);rewardXP+=reward.xp;bonusPoints+=reward.points;
  let level=1,xp=rewardXP;while(level<rules.levelLimit&&xp>=rules.xpForLevel(level)){xp-=rules.xpForLevel(level);level++;}
  const budget=level-1+bonusPoints,vitality=Math.min(3,budget),strength=Math.min(2,budget-vitality);
  rewarded.progression={level,xp:level===rules.levelLimit?0:xp,totalXp:rewardXP,points:budget-vitality-strength,stats:{vitality,strength,spirit:0}};
  await reload.vault.write(rewarded);
  const restored=plain(await client(env).vault.ready);assert.deepEqual(restored,rewarded);
  assert(restored.flags[realm].includes(reward.id));assert.equal(restored.progression.points+vitality+strength,budget);
  const inflated=copy(rewarded);inflated.progression.points++;assert.throws(()=>reload.vault.write(inflated),/Invalid save schema/);
  const missingSoul=copy(rewarded);missingSoul.flags[realm]=missingSoul.flags[realm].filter(id=>id!==reward.id);
  assert.throws(()=>reload.vault.write(missingSoul),/Invalid boss reward/);
 }

 // Same-release high-level saves keep exact partial XP and every training
 // point through authenticated encryption, IDB transactions and client reload.
 // The synthetic IDB implementation above is not actual browser storage.
 const highEnv=storageEnvironment(),highClient=client(highEnv);await highClient.vault.ready;
 let capThreshold=0;for(let level=1;level<rules.levelLimit;level++)capThreshold+=rules.xpForLevel(level);
 for(const level of [rules.levelLimit-1,rules.levelLimit])for(const spent of [false,true]){
  const high=copy(rewarded),xp=level===rules.levelLimit?0:rules.xpForLevel(level)-1;
  let totalXp=xp;for(let n=1;n<level;n++)totalXp+=rules.xpForLevel(n);
  // Total XP may continue accumulating at cap without a new level or point.
  if(level===rules.levelLimit)totalXp+=12345;
  let points=level-1+bonusPoints;const stats={vitality:0,strength:0,spirit:0};
  if(spent)for(const stat of Object.keys(stats)){stats[stat]=Math.min(rules.statLimit,points);points-=stats[stat];}
  high.progression={level,xp,totalXp,points,stats};
  if(level===rules.levelLimit-1)assert(xp>500);
  else assert(totalXp>capThreshold);
  await highClient.vault.write(high);
  const sealed=highEnv.records.get('save');assert.match(sealed,/^MOMO2\./);assert(!sealed.includes('totalXp'));
  assert.deepEqual(plain(await client(highEnv).vault.ready),high,`Level ${level} ${spent?'spent':'unspent'} allocation reloads exactly`);
 }

 // Fourth-realm entry, shrine discovery and altar activation are separate
 // persistent states. Reload must never activate fast travel implicitly.
 const shadowIndex=vm.runInContext("levels.findIndex(map=>map.id==='shadowRealm')",councilClient);
 if(shadowIndex>=0){
  const shadow=copy(united);shadow.realm=shadowIndex;shadow.flags[2].push('shadowEntered');
  shadow.checkpoint=plain(vm.runInContext(`levels[${shadowIndex}].rests[0]`,councilClient));
  shadow.visitedRests[shadowIndex]=[shadow.checkpoint.id];
  for(const activated of [false,true]){
   const data=copy(shadow);if(activated)data.flags[shadowIndex].push('shadowAltar');
   await reload.vault.write(data);const restored=plain(await client(env).vault.ready);assert.deepEqual(restored,data);
   assert.equal(restored.flags[shadowIndex].includes('shadowAltar'),activated,'Discovering a rest must not activate the shadow altar');
   for(const returnedRealm of [0,2]){
    const returned=copy(data);returned.realm=returnedRealm;returned.checkpoint=plain(vm.runInContext(`levels[${returnedRealm}].rests[0]`,councilClient));
    await reload.vault.write(returned);assert.deepEqual(plain(await client(env).vault.ready),returned,'Shadow progress survives returning to an earlier realm');
   }
  }
  for(const fourthFlags of [
   ['guardian:cultJailer','prisonKey'],['guardian:cultJailer','prisonOpen'],
   ['guardian:madOrganist','corruptedHymn'],['guardian:cultJailer','prisonOpen','guardian:madOrganist','corruptedHymn','shadowAltar']
  ]){
   const data=copy(shadow);data.flags[shadowIndex]=fourthFlags;
   await reload.vault.write(data);assert.deepEqual(plain(await client(env).vault.ready),data,'Miniboss rewards and consumed prison keys survive encrypted reloads');
  }
  for(const [mutate,error] of [
   [data=>{data.flags[2]=data.flags[2].filter(flag=>flag!=='shadowEntered');},/Invalid shadow entry/],
   [data=>{data.defeated[2]=false;},/Invalid shadow entry/],
   [data=>{data.flags[shadowIndex]=['prisonKey'];},/Invalid prison progress/],
   [data=>{data.flags[shadowIndex]=['prisonOpen'];},/Invalid prison progress/],
   [data=>{data.flags[shadowIndex]=['guardian:cultJailer','prisonKey','prisonOpen'];},/Invalid prison progress/],
   [data=>{data.flags[shadowIndex]=['corruptedHymn'];},/Invalid shadow item/],
   [data=>{data.flags[shadowIndex]=['inventedShadowFlag'];},/Invalid quest flags/],
   [data=>{data.visitedRests[shadowIndex].push('inventedShrine');},/Invalid checkpoints/],
   [data=>{data.won=true;},/Invalid victory/]
  ]){const invalid=copy(shadow);mutate(invalid);assert.throws(()=>reload.vault.write(invalid),error);}
  const premature=fixture();premature.flags[2].push('shadowEntered');assert.throws(()=>reload.vault.write(premature),/Invalid shadow entry/);
  const oldEnding=copy(united);oldEnding.won=true;assert.throws(()=>reload.vault.write(oldEnding),/Invalid victory/,'Heaven no longer ends the fourth-realm journey');
  for(const key of ['flags','visitedRests','defeated']){
   const truncated=copy(shadow);truncated[key].pop();assert.throws(()=>reload.vault.write(truncated),/Invalid world progress|Invalid abilities/,'Three-world snapshots are invalid in the current release');
  }
 }

 // A separate safe camp still belongs to Japan's world progress. Its own
 // canonical checkpoint and exact location survive encryption and reloading.
 const camp=copy(rewarded);camp.realm=0;camp.location='forestCamp';camp.prologueComplete=true;
 camp.checkpoint=plain(vm.runInContext('forestCamp.rests[0]',councilClient));camp.visitedRests[0].push(camp.checkpoint.id);
 await reload.vault.write(camp);assert.deepEqual(plain(await client(env).vault.ready),camp);
 for(const realm of [0,1,2]){
  const travelling=copy(camp);travelling.realm=realm;travelling.location=null;
  travelling.checkpoint=plain(vm.runInContext(`levels[${realm}].rests[0]`,councilClient));
  await reload.vault.write(travelling);assert.deepEqual(plain(await client(env).vault.ready),travelling);
  await reload.vault.write(camp);assert.deepEqual(plain(await client(env).vault.ready),camp);
 }
 const unlocatedCamp=copy(camp);unlocatedCamp.location=null;
 assert.throws(()=>reload.vault.write(unlocatedCamp),/Invalid save location/);
 const campUpdate=storageEnvironment(),campOld=client(campUpdate);await campOld.vault.ready;await campOld.vault.write(camp);
 campUpdate.local.set('momo-language','en');campUpdate.local.set('momo-keybindings-v1','custom');
 const campNext=client(campUpdate,(BigInt(current.split('.')[0])+1n)+'.0.0');
 assert.equal(await campNext.vault.ready,null);assert.equal(campNext.vault.notice,'text.save.reset.new.version');
 assert.equal(campUpdate.records.has('save'),false);assert.equal(campUpdate.local.has(SAVE),false);
 assert.equal(campUpdate.local.get('momo-language'),'en');assert.equal(campUpdate.local.get('momo-keybindings-v1'),'custom');

 // Currency, stacked food and permanent purchases are one authenticated save,
 // including when the merchant was rescued before Yomi's guardian was beaten.
 const shopEnv=storageEnvironment(),shopClient=client(shopEnv);await shopClient.vault.ready;
 const merchant=copy(council);merchant.defeated[1]=false;merchant.flags[1]=['akashRescued','compass','minimap'];
 merchant.coins=540;merchant.meatCount=3;merchant.prologueComplete=true;
 for(const realm of [0,1]){
  const shopping=copy(merchant);shopping.realm=realm;
  shopping.checkpoint=plain(vm.runInContext(`levels[${realm}].rests[0]`,shopClient));
  await shopClient.vault.write(shopping);assert.deepEqual(plain(await client(shopEnv).vault.ready),shopping);
 }
 const heavenlyShop=copy(merchant);heavenlyShop.realm=2;heavenlyShop.defeated[1]=true;
 heavenlyShop.flags[1].push('soulUpper','soulLower');heavenlyShop.visitedRests[2]=['start'];
 heavenlyShop.checkpoint=plain(vm.runInContext('levels[2].rests[0]',shopClient));
 await shopClient.vault.write(heavenlyShop);assert.deepEqual(plain(await client(shopEnv).vault.ready),heavenlyShop);
 const campShop=copy(merchant);campShop.realm=0;campShop.location='forestCamp';
 campShop.checkpoint=plain(vm.runInContext('forestCamp.rests[0]',shopClient));campShop.visitedRests[0].push('forestCamp');
 await shopClient.vault.write(campShop);assert.deepEqual(plain(await client(shopEnv).vault.ready),campShop);
 const purchased=copy(campShop);purchased.coins-=10;purchased.meatCount++;
 await shopClient.vault.write(purchased);assert.deepEqual(plain(await client(shopEnv).vault.ready),purchased,'A purchase reloads its currency debit and food credit together');
 const consumed=copy(purchased);consumed.meatCount--;
 await shopClient.vault.write(consumed);assert.deepEqual(plain(await client(shopEnv).vault.ready),consumed,'Consumed food stays consumed after an encrypted reload');
 for(const amount of [0,Number.MAX_SAFE_INTEGER]){
  const boundary=copy(campShop);boundary.coins=amount;boundary.meatCount=amount;
  await shopClient.vault.write(boundary);assert.deepEqual(plain(await client(shopEnv).vault.ready),boundary,'There is no smaller arbitrary currency or stack cap');
 }
 const untouched=shopEnv.records.get('save'),revision=shopEnv.records.get('profile').revision;
 for(const key of ['coins','meatCount']){
  for(const value of [-1,.5,Number.MAX_SAFE_INTEGER+1,'1',null,undefined,NaN,Infinity,false]){
   const invalid=copy(campShop);invalid[key]=value;
   assert.throws(()=>shopClient.vault.write(invalid),/Invalid merchant inventory/,`${key}: ${String(value)} is not a valid safe integer`);
  }
  const missing=copy(campShop);delete missing[key];
  assert.throws(()=>shopClient.vault.write(missing),/Invalid merchant inventory/,`${key} is required for the current release`);
 }
 for(const item of ['compass','minimap','roastMeat']){
  const unrescued=copy(campShop);unrescued.flags[1]=item==='roastMeat'?[]:[item];unrescued.meatCount=item==='roastMeat'?1:0;
  assert.throws(()=>shopClient.vault.write(unrescued),/Invalid merchant progress/,'Purchases cannot predate Akash rescue');
 }
 const earlyRescue=fixture();earlyRescue.flags[1]=['akashRescued'];
 assert.throws(()=>shopClient.vault.write(earlyRescue),/Invalid merchant progress/,'Akash cannot be rescued before Japan is completed');
 const dream=fixture();dream.prologueComplete=false;await shopClient.vault.write(dream);
 assert.deepEqual(plain(await client(shopEnv).vault.ready),dream);
 dream.coins=1;assert.throws(()=>shopClient.vault.write(dream),/Invalid dream inventory/);
 dream.coins=0;dream.meatCount=1;assert.throws(()=>shopClient.vault.write(dream),/Invalid merchant progress|Invalid dream inventory/);
 // Invalid write calls are rejected before they can enqueue or seal a record.
 assert.equal(shopEnv.records.get('profile').revision,revision+1);assert.notEqual(shopEnv.records.get('save'),untouched);
 assert.deepEqual(plain(await client(shopEnv).vault.ready),{...fixture(),prologueComplete:false});
 await shopClient.vault.write(campShop);shopEnv.local.set('momo-language','en');shopEnv.local.set('momo-keybindings-v1','custom');
 const resetShop=client(shopEnv,(BigInt(current.split('.')[0])+1n)+'.0.0');
 assert.equal(await resetShop.vault.ready,null);assert.equal(resetShop.vault.notice,'text.save.reset.new.version');
 assert.equal(shopEnv.records.has('save'),false);assert.equal(shopEnv.local.has(SAVE),false);
 assert.equal(shopEnv.local.get('momo-language'),'en');assert.equal(shopEnv.local.get('momo-keybindings-v1'),'custom');

 // Hashes have no lexical time order: append order governs same-base updates.
 const fixEnv=storageEnvironment(),base='0.9.10',firstFix=base+'_ffffffff',nextFix=base+'_00000000';
 fixEnv.local.set('momo-language','en');fixEnv.local.set('momo-keybindings-v1','custom');
 const baseClient=client(fixEnv,base);await baseClient.vault.ready;await baseClient.vault.write(fixture(base));
 const firstHistory={[base]:['ffffffff']},nextHistory={[base]:['ffffffff','00000000']};
 const firstClient=client(fixEnv,firstFix,{history:firstHistory});assert.equal(await firstClient.vault.ready,null);assert.equal(firstClient.vault.notice,'text.save.reset.new.version');
 await firstClient.vault.write(fixture(firstFix));assert.deepEqual(plain(await client(fixEnv,firstFix,{history:firstHistory}).vault.ready),fixture(firstFix));
 const nextClient=client(fixEnv,nextFix,{history:nextHistory});assert.equal(await nextClient.vault.ready,null);assert.equal(nextClient.vault.notice,'text.save.reset.new.version');
 await nextClient.vault.write(fixture(nextFix));const nextCipher=fixEnv.records.get('save'),nextDevice=fixEnv.records.get('profile').device;
 for(const [version,history] of [[base,{}],[firstFix,firstHistory],[firstFix,nextHistory]]){
  const stale=client(fixEnv,version,{history});assert.equal(await stale.vault.ready,null);assert.equal(stale.vault.isReady,false);assert.equal(stale.vault.notice,'text.save.newer.version');
  await assert.rejects(stale.vault.write(fixture(version)));assert.equal(fixEnv.records.get('save'),nextCipher);assert.equal(fixEnv.records.get('profile').device,nextDevice);
 }
 assert.deepEqual(plain(await client(fixEnv,nextFix,{history:nextHistory}).vault.ready),fixture(nextFix));
 assert.equal(fixEnv.local.get('momo-language'),'en');assert.equal(fixEnv.local.get('momo-keybindings-v1'),'custom');
 const futureCode=storageEnvironment();futureCode.records.set('profile',{...fixEnv.records.get('profile'),release:base+'_1234abcd'});futureCode.records.set('save',nextCipher);
 const unknownFix=client(futureCode,nextFix,{history:nextHistory});await unknownFix.vault.ready;assert.equal(unknownFix.vault.isReady,false);assert.equal(futureCode.records.get('save'),nextCipher);
 const laterBase=client(fixEnv,'0.9.11');await laterBase.vault.ready;assert(laterBase.vault.isReady);assert.equal(laterBase.vault.notice,'text.save.reset.new.version');

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
 console.log('Save release: reload, merchant currency/food/purchases and invalid saves, forest camp travel/checkpoint/reset, boss souls and bonus points, version reset, legacy discard, preferences, consumed key, stale clients, crypto binding, and concurrent initialization passed.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
