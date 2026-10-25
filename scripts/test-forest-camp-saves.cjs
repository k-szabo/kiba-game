// Synthetic schema coverage; browser IndexedDB/reload is verified separately.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const validate=require('./test-save-validation.cjs');
const release=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/config/release.json'),'utf8')).version;
const context=vm.createContext({I18n:{t:key=>key}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/dungeon-rules.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/levels.js'),'utf8'),context);
const read=expression=>JSON.parse(vm.runInContext(`JSON.stringify(${expression})`,context)),copy=value=>structuredClone(value);
const rewards=read('BOSS_REWARDS'),campRest=read('forestCamp.rests[0]'),realmCount=read('levels.length');
const rules=vm.runInContext('PROGRESSION_RULES',context);
function fixture(){
 const flags=Array.from({length:realmCount},()=>[]);flags[0]=['forestBell','villageBell'];flags[1]=['soulUpper','soulLower'];flags[2]=['dawnSeal'];if(realmCount>3)flags[2].push('shadowEntered');
 let totalXp=0,bonus=0;for(const [realm,reward] of rewards.entries()){flags[realm].push(reward.claim,reward.id);totalXp+=reward.xp;bonus+=reward.points;}
 let level=1,xp=totalXp;while(level<rules.levelLimit&&xp>=rules.xpForLevel(level)){xp-=rules.xpForLevel(level);level++;}
 return {weaponStyle:'katana',coins:0,meatCount:0,teaCount:0,quickHeal:'roastMeat',soldItems:[],version:2,layout:2,release,realm:0,location:'forestCamp',prologueComplete:true,shards:31,won:false,
  abilities:[true,true],defeated:Array(realmCount).fill(true),flags,visitedRests:Array.from({length:realmCount},(_,index)=>index===0?['start',campRest.id]:['start']),checkpoint:copy(campRest),
  progression:{level,xp:level===rules.levelLimit?0:xp,totalXp,points:level-1+bonus-2,stats:{vitality:1,strength:1,spirit:0}}};
}
const data=fixture();assert.deepEqual(JSON.parse(JSON.stringify(validate(data))),data,'Camp retains the exact current-release progress and reward budget');
assert.equal(read('levels.includes(forestCamp)'),false,'Camp remains a side area rather than a realm');
for(let realm=0;realm<realmCount;realm++){
 const elsewhere=copy(data);elsewhere.realm=realm;elsewhere.location=null;elsewhere.checkpoint=read(`levels[${realm}].rests[0]`);
 assert.deepEqual(JSON.parse(JSON.stringify(validate(elsewhere))),elsewhere,'Camp visitation remains valid while exploring another realm');
 delete elsewhere.location;assert.deepEqual(JSON.parse(JSON.stringify(validate(elsewhere))),elsewhere,'Existing ordinary save fixtures may omit location');
}
const firstVisit=fixture();firstVisit.defeated=Array.from({length:realmCount},(_,index)=>index===0);firstVisit.abilities=[false,false];firstVisit.flags=Array.from({length:realmCount},(_,index)=>index===0?['forestBell','villageBell']:[]);
firstVisit.visitedRests=Array.from({length:realmCount},(_,index)=>index===0?['start',campRest.id]:[]);firstVisit.progression={level:1,xp:0,totalXp:0,points:0,stats:{vitality:0,strength:0,spirit:0}};
assert.doesNotThrow(()=>validate(firstVisit),'First visit needs Japan victory, not later-world progress or a dash');
for(const [name,mutate] of [
 ['unknown location',save=>{save.location='councilHall';}],
 ['location object',save=>{save.location={id:'forestCamp'};}],
 ['location false',save=>{save.location=false;}],
 ['wrong realm',save=>{save.realm=1;}],
 ['dream location',save=>{save.prologueComplete=false;}],
 ['missing completed prologue',save=>{delete save.prologueComplete;}],
 ['undiscovered camp',save=>{save.visitedRests[0]=['start'];}],
 ['ordinary shrine in camp',save=>{save.checkpoint=read('levels[0].rests[0]');}],
 ['camp shrine without location',save=>{delete save.location;}],
 ['camp shrine with null location',save=>{save.location=null;}],
 ['forged horizontal coordinate',save=>{save.checkpoint.x++;}],
 ['forged vertical coordinate',save=>{save.checkpoint.y++;}],
 ['duplicate discovery',save=>{save.visitedRests[0].push(campRest.id);}],
 ['camp visited as Yomi shrine',save=>{save.visitedRests[1].push(campRest.id);}],
 ['inflated stat budget',save=>{save.progression.points++;}],
 ['wrong release',save=>{save.release='0.0.1';}]
]){const invalid=fixture();mutate(invalid);assert.throws(()=>validate(invalid),undefined,name);}
for(const location of [null,'forestCamp']){
 const locked=copy(firstVisit);locked.location=location;locked.defeated[0]=false;
 if(location===null)locked.checkpoint=read('levels[0].rests[0]');
 assert.throws(()=>validate(locked),/Invalid camp progress/,'Camp cannot be discovered or restored before Japan victory');
}
console.log('PASS: persistent camp location, canonical checkpoints, world travel visitation, reward/stat preservation, progression prerequisites and forged save rejection.');
