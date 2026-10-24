/* Current-release synthetic validator checks; real encryption/storage needs browser QA. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const validate=require('./test-save-validation.cjs'),release=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/config/release.json'),'utf8')).version;
const context=vm.createContext({I18n:{t:key=>key}});for(const name of ['levels','camp-services'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/'+name+'.js'),'utf8'),context);
const read=expression=>JSON.parse(vm.runInContext('JSON.stringify('+expression+')',context)),copy=value=>structuredClone(value),count=read('levels.length');
function fixture(stage='open',restIndex=0){
 const progress=['guardian:cultJailer','prisonOpen'];if(stage==='warden'||stage==='rescued')progress.push('guardian:prisonWarden');if(stage==='rescued')progress.push('zenRescued');
 const rest=read('shadowPrison.rests['+restIndex+']');
 return{version:2,layout:2,release,weaponStyle:'katana',weaponChoicePending:false,prologueComplete:true,realm:3,location:'shadowPrison',
  abilities:[false,false],defeated:Array.from({length:count},(_,n)=>n<3),flags:[['forestBell','villageBell'],['soulUpper','soulLower'],['dawnSeal','shadowEntered'],progress],
  visitedRests:Array.from({length:count},(_,n)=>n===3?['start',rest.id]:['start']),checkpoint:rest,shards:0,won:false,coins:0,meatCount:0,teaCount:0,quickHeal:'roastMeat',soldItems:[],campServices:{ownedWeapons:['katana'],weaponRank:0,armorRank:0,herbs:0,potions:0},
  progression:{level:1,xp:0,totalXp:0,points:0,stats:{vitality:0,strength:0,spirit:0}}};
}
function valid(save,label){const before=copy(save);assert.deepEqual(JSON.parse(JSON.stringify(validate(save))),save,label);assert.deepEqual(save,before,'Validation leaves the snapshot untouched');}
function reject(change,label,base=fixture()){const value=copy(base);change(value);assert.throws(()=>validate(value),undefined,label);}
assert.equal(read('SIDE_LOCATIONS.shadowPrison.realm'),3);assert.equal(read('SIDE_LOCATIONS.shadowPrison.requiresRealmBoss'),false);
assert.deepEqual(read('SIDE_LOCATIONS.shadowPrison.requiredFlags'),['prisonOpen']);
for(const stage of ['open','warden','rescued'])for(let rest=0;rest<read('shadowPrison.rests.length');rest++){
 const save=fixture(stage,rest);valid(save,'Canonical checkpoint preserves stage '+stage);
 assert.equal(save.defeated[3],false,'An optional prison never requires the main priest victory');
 reject(data=>{data.flags[3]=data.flags[3].filter(id=>id!=='prisonOpen');},'Prison interior cannot restore before the key lock opens',save);
 reject(data=>{data.checkpoint.x++;},'Forged prison checkpoint X',save);reject(data=>{data.checkpoint.y++;},'Forged prison checkpoint Y',save);
 reject(data=>{data.visitedRests[3]=['start'];},'Undiscovered side checkpoint cannot restore',save);
 reject(data=>{data.visitedRests[0].push(data.checkpoint.id);data.visitedRests[3]=['start'];},'Prison rest belongs to Shadow Realm, never Japan',save);
 reject(data=>{data.realm=0;},'Side map must match its owning realm',save);
 reject(data=>{data.checkpoint=read('shadowRealm.rests[0]');},'Main-realm checkpoint is not valid inside the prison',save);
 const outside=copy(save);outside.location=null;outside.checkpoint=read('shadowRealm.rests[0]');valid(outside,'Interior discovery/quest flags remain after returning outside');
 const camp=copy(save);camp.realm=0;camp.location='forestCamp';camp.checkpoint=read('forestCamp.rests[0]');camp.visitedRests[0].push(camp.checkpoint.id);valid(camp,'Rescue flags and prison visits persist while in the refuge');
}
reject(data=>{data.flags[3]=['guardian:cultJailer','guardian:prisonWarden'];},'The inner Warden cannot be defeated before opening the outer prison');
reject(data=>{data.flags[3]=['guardian:cultJailer','prisonOpen','zenRescued'];},'Zen rescue requires Warden defeat');
reject(data=>{data.flags[3]=['prisonOpen'];},'The original outer jailer still guards the key');
reject(data=>{data.flags[3].push('prisonKey');},'The outer key remains consumed after unlocking');
reject(data=>{data.flags[2]=data.flags[2].filter(id=>id!=='shadowEntered');},'Prison cannot skip the Shadow Realm story transition');
reject(data=>{data.defeated[2]=false;},'Prison cannot skip the celestial guardian');
reject(data=>{data.flags[0].push('zenRescued');},'Zen progress belongs only to the Shadow Realm');
reject(data=>{data.flags[3].push('zenRescued','zenRescued');},'Duplicate rescue flags are malformed');
reject(data=>{data.location='constructor';},'Prototype names cannot select side locations');
reject(data=>{data.release='0.0.1_00000000';},'Previous-release progress must reset, not migrate');
reject(data=>{data.prologueComplete=false;},'The prologue cannot resume an advanced prison save');
// Keeping rescue progress on another map does not waive its prerequisites.
{
 const save=fixture('rescued');save.location=null;save.checkpoint=read('shadowRealm.rests[0]');
 reject(data=>{data.flags[3]=data.flags[3].filter(id=>id!=='guardian:prisonWarden');},'Rescued Zen remains dependent on the Warden after leaving',save);
 const camp=copy(save);camp.realm=0;camp.location='forestCamp';camp.checkpoint=read('forestCamp.rests[0]');camp.visitedRests[0].push(camp.checkpoint.id);valid(camp,'Rescued Zen can remain at camp before the main priest is defeated');
 reject(data=>{data.flags[3]=data.flags[3].filter(id=>id!=='prisonOpen');},'Historical rescue never bypasses its outer lock',camp);
}
console.log('PASS: current-release prison checkpoints and visits, partial Warden/Zen stages, optional main priest, refuge roundtrip flags, strict rescue/key/story prerequisites and previous-release rejection.');
