'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{webcrypto}=require('node:crypto');
const validate=require('./test-save-validation.cjs'),cryptoHelpers=require('./test-save-release.cjs');
const copy=value=>JSON.parse(JSON.stringify(value));
const release=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/config/release.json'),'utf8'));
const registry=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/releases.json'),'utf8'));
const registeredHistory={};for(const {baseVersion,code} of [...registry.releases,...registry.bugfixes])(registeredHistory[baseVersion]??=[]).push(code);
const definitions=vm.createContext({I18n:{t:key=>key}});
for(const file of ['dungeon-rules','ziggurat-maps','levels'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js',file+'.js'),'utf8'),definitions);
const read=source=>copy(vm.runInContext(source,definitions));
function baseline(){
 const data=cryptoHelpers.fixture();Object.assign(data,{realm:3,prologueComplete:true,abilities:[false,false],defeated:[true,true,true,true],flags:[['forestBell','villageBell'],['soulUpper','soulLower'],['dawnSeal','shadowEntered'],[]],visitedRests:[['start'],['start'],['start'],['start']],checkpoint:read('levels[3].rests[0]')});return data;
}
function victory(){const data=baseline();data.flags[3].push('dawnblade','guardian:Hannah','hannahDefeated');data.progression.points=1;return data;}
function fiaVictory({laterSlain=false}={}){
 const data=victory();data.abilities[1]=true;
 data.flags[0].push('guardian:oldCultist','cultTempleDiscovered','sectRunStarted','sectStage1Clear','sectStage2Clear','sectStage3Clear','sectGuardReward','sectAngelReward','sectPriestessReward','highPriestessSoul');
 data.flags[3].push('guardian:cultJailer','prisonOpen','guardian:prisonHunter','fiaSeen','fiaRescued','arenaQuestAccepted','arenaRewardCaptain','arenaRewardSerpent','arenaSerpentScale','arenaRewardGuards','arenaChampion','fiaChambersHeard','fiaTalismanAccepted','priestessTalisman','fiaTalismanCompleted','hannahFiaRescue','demonLordSoul','demonLordHeart');
 data.dungeon=read('DungeonRules.fresh()');data.dungeon.runs.sectFall.run=1;data.progression.points+=3;
 if(laterSlain){data.flags[3].push('fiaSlain','fiaRewardClaimed','kitsuneSoul','kibaShield');data.progression.points++;}
 return data;
}
function rejectChange(record,change,label){const invalid=copy(record);change(invalid);assert.throws(()=>validate(invalid),/Invalid/,label);}
// Reproduce an old release's authenticated output directly. The new public
// writer intentionally rejects these records, so it cannot create this fixture.
async function historicalRecord(env,data){
 const profile=env.records.get('profile'),salt=webcrypto.getRandomValues(new Uint8Array(16)),iv=webcrypto.getRandomValues(new Uint8Array(12)),revision=profile.revision+1;
 const base='momo-save-v2|http://localhost/kiba-game/|'+profile.release+'|'+profile.device;
 const key=await webcrypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt,info:new TextEncoder().encode(base)},profile.key,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 const ciphertext=await webcrypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(base+'|'+revision),tagLength:128},key,new TextEncoder().encode(JSON.stringify(data)));
 const encode=value=>Buffer.from(value).toString('base64');
 const sealed='MOMO2.'+btoa(JSON.stringify({v:2,release:profile.release,device:profile.device,revision,salt:encode(salt),iv:encode(iv),data:encode(ciphertext)}));
 env.records.set('profile',{...profile,revision});env.records.set('save',sealed);env.local.set('momo-three-worlds-v2',sealed);return sealed;
}
async function main(){
 const old=baseline();assert.doesNotThrow(()=>validate(old),'Existing fourth-realm saves require none of the optional new flags');
 const awakened=copy(old);awakened.flags[3].push('dawnblade');assert.doesNotThrow(()=>validate(awakened),'Story awakening can persist before Hannah victory');
 rejectChange(awakened,s=>s.defeated[3]=false,'Awakening requires the Mad Priest');
 const discovered=copy(old);discovered.flags[3].push('discovered:hannahCourt');assert.doesNotThrow(()=>validate(discovered));
 rejectChange(discovered,s=>s.defeated[3]=false,'Discovery requires the Mad Priest');

 const won=victory();assert.doesNotThrow(()=>validate(won));
 for(const removed of ['dawnblade','guardian:Hannah','hannahDefeated'])rejectChange(won,s=>{s.flags[3]=s.flags[3].filter(id=>id!==removed);if(removed==='hannahDefeated')s.progression.points--;},'Reject incomplete Hannah chain: '+removed);
 rejectChange(won,s=>s.defeated[3]=false,'Victory requires prior guardian progression');
 for(const points of [0,2])rejectChange(won,s=>s.progression.points=points,'Exactly one additional permanent point belongs to Hannah victory');
 rejectChange(old,s=>{s.flags[3].push('guardian:Hannah');},'A forged guardian flag cannot appear before the Hannah victory');
 rejectChange(old,s=>{s.flags[3].push('hannahFiaRescue');},'A forged Fia rescue cannot appear before Hannah victory');

 const fia=fiaVictory(),slain=fiaVictory({laterSlain:true});
 assert.doesNotThrow(()=>validate(fia),'Completed historical Fia journey permits her Hannah rescue');
 assert.doesNotThrow(()=>validate(slain),'Later Fia death preserves the historical rescue rather than invalidating saves');
 const given=copy(fia);given.flags[3].push('demonLordHeartGiven');assert.doesNotThrow(()=>validate(given),'A legitimately earned heart can remain recorded after gifting it');
 rejectChange(won,s=>s.flags[3].push('demonLordHeart'),'Current saves reject a heart without an actual historical Fia ending');
 const unsupported=copy(fia);unsupported.flags[3]=unsupported.flags[3].filter(id=>id!=='hannahFiaRescue');
 assert.throws(()=>validate(unsupported),/Invalid demon lord heart/,'Current Fia eligibility does not prove that the Fia ending occurred');
 for(const removed of ['hannahDefeated','fiaRescued','arenaChampion','fiaTalismanCompleted'])rejectChange(fia,s=>{s.flags[3]=s.flags[3].filter(id=>id!==removed);if(removed==='hannahDefeated')s.progression.points--;},'Reject unsupported historical Fia rescue: '+removed);

 // Every new physical shrine is a legitimate checkpoint only in its own map;
 // exact saved coordinates and the visited catalog remain mandatory.
 const arrivals=[];
 for(const location of ['zigguratApproach','zigguratInterior','zigguratSummit'])for(const rest of read(`SIDE_LOCATIONS[${JSON.stringify(location)}].map.rests`)){
  const at=baseline();at.location=location;at.checkpoint=rest;at.visitedRests[3].push(rest.id);arrivals.push(at);
  assert.doesNotThrow(()=>validate(at),rest.id+' is a legal registered checkpoint');
  rejectChange(at,s=>s.checkpoint.x+=1,rest.id+' rejects altered coordinates');
  rejectChange(at,s=>{s.visitedRests[3]=s.visitedRests[3].filter(id=>id!==rest.id);},rest.id+' requires visitation');
  rejectChange(at,s=>s.defeated[3]=false,rest.id+' requires the Mad Priest');
  rejectChange(at,s=>s.location='forestCamp',rest.id+' cannot claim another map');
 }

 // Actual WebCrypto and serialized IDB exercise optional flags, checkpoint
 // registry and the extra point together. Browser storage needs separate QA.
 const env=cryptoHelpers.storageEnvironment(),first=cryptoHelpers.client(env);await first.vault.ready;
 for(const record of [old,awakened,won,fia,given,slain,...arrivals]){
  await first.vault.write(record);assert.deepEqual(copy(await cryptoHelpers.client(env).vault.ready),record,'Same-release authenticated roundtrip preserves optional story progress');
 }
 const stale=copy(won);stale.release='0.0.0_00000000';assert.throws(()=>first.vault.write(stale),/Invalid/);

 // Compatible upgrade retains old saves that have never visited the optional
 // branch, and later preserves the complete victory without an epoch reset.
 const epoch=release.saveCompatibility,options={policy:'preserve-compatible',compatibility:epoch,history:registeredHistory};
 const upgradeEnv=cryptoHelpers.storageEnvironment();
 const sourceRelease='0.9.52_1234abcd',targetRelease='0.9.53_2345bcde';
 const previous=cryptoHelpers.client(upgradeEnv,sourceRelease,options);await previous.vault.ready;
 const previousData=baseline();previousData.release=sourceRelease;await previous.vault.write(previousData);
 const device=upgradeEnv.records.get('profile').device;
 const upgraded=cryptoHelpers.client(upgradeEnv,targetRelease,options);
 assert.deepEqual(copy(await upgraded.vault.ready),{...previousData,release:targetRelease});
 assert.equal(upgradeEnv.records.get('profile').device,device,'Compatible migration retains the profile key/device');
 assert.equal(upgradeEnv.records.get('profile').compatibility,epoch);assert.equal(upgraded.vault.notice,'');
 await assert.rejects(previous.vault.write(previousData),undefined,'Stale pre-upgrade tab cannot overwrite migrated progress');
 const upgradedVictory=copy(won);upgradedVictory.release=targetRelease;await upgraded.vault.write(upgradedVictory);
 assert.deepEqual(copy(await cryptoHelpers.client(upgradeEnv,targetRelease,options).vault.ready),upgradedVictory);
 // The old heart bug is repaired only after the source envelope authenticates,
 // and only for known releases through the last affected published version.
 const lastAffected='0.9.57_b9f518f8',fixed='0.9.58_1234abcd';
 for(const original of [won,unsupported,given,slain]){
  const source=copy(original);source.release=lastAffected;
  if(!source.flags[3].includes('demonLordHeart'))source.flags[3].push('demonLordHeart');
  if(original===unsupported)source.flags[3].push('demonLordHeartGiven');
  const env=cryptoHelpers.storageEnvironment(),previous=cryptoHelpers.client(env,lastAffected,options);await previous.vault.ready;
  await historicalRecord(env,source);const device=env.records.get('profile').device,profileKey=env.records.get('profile').key;
  const expected=copy(source);expected.release=fixed;
  if(!expected.flags[3].includes('hannahFiaRescue'))expected.flags[3]=expected.flags[3].filter(id=>!['demonLordHeart','demonLordHeartGiven'].includes(id));
  const next=cryptoHelpers.client(env,fixed,options);assert.deepEqual(copy(await next.vault.ready),expected,'Legacy repair preserves every field except an unearned heart/gift');
  assert.equal(next.vault.notice,'');assert.equal(env.records.get('profile').device,device);assert.deepEqual(env.records.get('profile').key,profileKey);assert.equal(env.records.get('profile').compatibility,epoch);
  const sealed=env.records.get('save'),revision=env.records.get('profile').revision;
  assert.deepEqual(copy(await cryptoHelpers.client(env,fixed,options).vault.ready),expected);assert.equal(env.records.get('save'),sealed);assert.equal(env.records.get('profile').revision,revision,'A repaired reload is idempotent');
  assert.throws(()=>next.vault.write({...unsupported,release:fixed}),/Invalid demon lord heart/,'The old migration exemption cannot be used by a new public write');
  await assert.rejects(previous.vault.write({...won,release:lastAffected}),undefined,'Old tabs cannot overwrite migrated progress');
 }
 for(const [sourceRelease,destination,history] of [
  [fixed,fixed,{}],
  ['0.9.57_cccccccc','0.9.57_dddddddd',{'0.9.57':['b9f518f8','cccccccc','dddddddd']}],
  ['0.9.57_aaaaaaaa','0.9.57_dddddddd',{'0.9.57':['b9f518f8','aaaaaaaa','dddddddd']}],
  ['0.9.57_zzzzzzzz',fixed,{}],
  ['0.9.56_12345678',fixed,registeredHistory],
  ['0.9.56',fixed,registeredHistory]
 ]){
  const env=cryptoHelpers.storageEnvironment(),source=cryptoHelpers.client(env,sourceRelease,{...options,history});await source.vault.ready;
  const wrong=copy(won);wrong.release=sourceRelease;wrong.flags[3].push('demonLordHeart');const sealed=await historicalRecord(env,wrong),profile=env.records.get('profile');
  const next=cryptoHelpers.client(env,destination,{...options,history});assert.equal(await next.vault.ready,null);assert.equal(next.vault.isReady,false,'Same/fixed or newer-than-cutoff records cannot request legacy correction');
  assert.equal(env.records.get('save'),sealed);assert.deepEqual(env.records.get('profile'),profile,'Rejected records remain untouched');
 }
 {
  const env=cryptoHelpers.storageEnvironment(),sourceRelease='0.9.57_zzzzzzzz',history={'0.9.57':['zzzzzzzz','b9f518f8']};
  const source=cryptoHelpers.client(env,sourceRelease,{...options,history});await source.vault.ready;
  const wrong={...copy(won),release:sourceRelease};wrong.flags[3].push('demonLordHeart');await historicalRecord(env,wrong);
  const next=cryptoHelpers.client(env,fixed,{...options,history}),expected={...copy(won),release:fixed};
  assert.deepEqual(copy(await next.vault.ready),expected,'Recorded release order, rather than hash spelling, authorizes an older repair');
 }
 // QA-HEART-001 r1: a smaller semver base is not proof of publication. The
 // exact older code must be registered; a plain ID needs an explicit anchor.
 for(const [sourceRelease,compatibility] of [['0.9.56_e40a77c8',epoch],['0.9.56','0.9.56']]){
  const env=cryptoHelpers.storageEnvironment(),policy={...options,compatibility};
  const source=cryptoHelpers.client(env,sourceRelease,policy);await source.vault.ready;
  const wrong={...copy(won),release:sourceRelease};wrong.flags[3].push('demonLordHeart');await historicalRecord(env,wrong);
  const next=cryptoHelpers.client(env,fixed,policy),expected={...copy(won),release:fixed};
  assert.deepEqual(copy(await next.vault.ready),expected,'Explicit historical identity authorizes the bounded repair: '+sourceRelease);
  assert.equal(env.records.get('profile').compatibility,compatibility);
 }
 {
  const env=cryptoHelpers.storageEnvironment(),source=cryptoHelpers.client(env,lastAffected,options);await source.vault.ready;
  const wrong={...copy(won),release:lastAffected};wrong.flags[3].push('demonLordHeart');wrong.progression.points++;
  const sealed=await historicalRecord(env,wrong),profile=env.records.get('profile');
  const next=cryptoHelpers.client(env,fixed,options);assert.equal(await next.vault.ready,null);assert.equal(next.vault.isReady,false);assert.equal(env.records.get('save'),sealed);assert.deepEqual(env.records.get('profile'),profile,'Migration cannot hide unrelated invalid progression');
 }
 {
  const env=cryptoHelpers.storageEnvironment(),source=cryptoHelpers.client(env,lastAffected,options);await source.vault.ready;
  const wrong={...copy(won),release:lastAffected};wrong.flags[3].push('demonLordHeart');await historicalRecord(env,wrong);
  const entry=JSON.parse(atob(env.records.get('save').slice(6))),cipher=Buffer.from(entry.data,'base64');cipher[0]^=1;entry.data=cipher.toString('base64');const tampered='MOMO2.'+btoa(JSON.stringify(entry));env.records.set('save',tampered);
  const profile=env.records.get('profile'),next=cryptoHelpers.client(env,fixed,options);assert.equal(await next.vault.ready,null);assert.equal(next.vault.isReady,false);assert.equal(env.records.get('save'),tampered);assert.deepEqual(env.records.get('profile'),profile,'Unauthenticated old records cannot trigger normalization');
 }
 console.log('PASS: strict Hannah/Fia history, one-point budget, exact checkpoints, authenticated roundtrips, bounded legacy heart repair, registered release order, forgery rejection and stale-tab protection.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
