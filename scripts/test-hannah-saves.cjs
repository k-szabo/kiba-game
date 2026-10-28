'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const validate=require('./test-save-validation.cjs'),cryptoHelpers=require('./test-save-release.cjs');
const copy=value=>JSON.parse(JSON.stringify(value));
const release=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/config/release.json'),'utf8'));
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
 data.flags[3].push('guardian:cultJailer','prisonOpen','guardian:prisonHunter','fiaSeen','fiaRescued','arenaQuestAccepted','arenaRewardCaptain','arenaRewardSerpent','arenaSerpentScale','arenaRewardGuards','arenaChampion','fiaChambersHeard','fiaTalismanAccepted','priestessTalisman','fiaTalismanCompleted','hannahFiaRescue');
 data.dungeon=read('DungeonRules.fresh()');data.dungeon.runs.sectFall.run=1;data.progression.points+=3;
 if(laterSlain){data.flags[3].push('fiaSlain','fiaRewardClaimed','kitsuneSoul','kibaShield');data.progression.points++;}
 return data;
}
function rejectChange(record,change,label){const invalid=copy(record);change(invalid);assert.throws(()=>validate(invalid),/Invalid/,label);}
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
 for(const record of [old,awakened,won,fia,slain,...arrivals]){
  await first.vault.write(record);assert.deepEqual(copy(await cryptoHelpers.client(env).vault.ready),record,'Same-release authenticated roundtrip preserves optional story progress');
 }
 const stale=copy(won);stale.release='0.0.0_00000000';assert.throws(()=>first.vault.write(stale),/Invalid/);

 // Compatible upgrade retains old saves that have never visited the optional
 // branch, and later preserves the complete victory without an epoch reset.
 const epoch=release.saveCompatibility,options={policy:'preserve-compatible',compatibility:epoch};
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
 console.log('PASS: optional Hannah flags and strict guardian/awakening/Fia history, one-point budget, all new exact checkpoints, authenticated same-release roundtrips, compatible old-save migration and stale-tab rejection.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
