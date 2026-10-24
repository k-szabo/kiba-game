/* Strict synthetic same-release validation; real encrypted reload is browser QA. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),validate=require('./test-save-validation.cjs');
const release=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/config/release.json'),'utf8')).version;
const ctx=vm.createContext({I18n:{t:key=>key}});for(const name of ['levels','camp-services'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/'+name+'.js'),'utf8'),ctx);
const read=source=>JSON.parse(vm.runInContext('JSON.stringify('+source+')',ctx)),copy=value=>structuredClone(value),scales=[[0,'whiteSerpentScale'],[1,'serpentScale'],[2,'wingedSerpentScale']],result='triuneSerpentTalisman';
function fixture(){return {version:2,layout:2,release,weaponStyle:'katana',weaponChoicePending:false,equippedTalisman:null,realm:0,location:null,prologueComplete:true,
 abilities:[true,true],defeated:[true,true,true,false],flags:[['forestBell','villageBell','campQuestAccepted','mayorExecuted','guardian:campMaster','enchanterRescued','guardian:whiteSerpent','whiteSerpentScale'],['soulUpper','soulLower','serpentScale'],['dawnSeal','guardian:wingedSerpent','wingedSerpentScale'],[]],
 visitedRests:[['start'],['start'],['start'],[]],shards:0,coins:0,meatCount:0,teaCount:0,quickHeal:'roastMeat',soldItems:[],campServices:read("CampServiceRules.fresh('katana')"),checkpoint:read('japan.rests[0]'),won:false,
 progression:{level:1,xp:0,totalXp:0,points:0,stats:{vitality:0,strength:0,spirit:0}}};}
function valid(save,message){const before=copy(save);assert.deepEqual(JSON.parse(JSON.stringify(validate(save))),before,message);assert.deepEqual(save,before,'Validation is read-only');}
function rejects(change,message,base=fixture()){const save=copy(base);change(save);assert.throws(()=>validate(save),undefined,message);}
valid(fixture(),'All three earned scales persist before fusion');
const oldLava=fixture();oldLava.flags[0]=['forestBell','villageBell'];oldLava.flags[2]=['dawnSeal'];valid(oldLava,'The existing serpentScale flag remains independently recognizable without the new snakes');
for(const [realm,id]of [[0,'white'],[2,'winged']]){
 rejects(save=>{save.flags[realm]=save.flags[realm].filter(flag=>flag!=='guardian:'+id+'Serpent');},'A scale requires its own guardian');
 rejects(save=>{save.flags[realm]=save.flags[realm].filter(flag=>flag!==id+'SerpentScale');},'An earned guardian cannot lose its historical reward');
}
for(const [realm,id]of scales)rejects(save=>{save.soldItems.push(id);},'Protected scale cannot be sold: '+id);
const fused=fixture();fused.flags[0].push(result);valid(fused,'Fusion keeps all three historical scale flags');
for(const [realm,id]of scales)rejects(save=>{save.flags[realm]=save.flags[realm].filter(flag=>flag!==id);},'Fused item requires historical '+id,fused);
rejects(save=>{save.flags[0]=save.flags[0].filter(flag=>flag!=='enchanterRescued');},'Fumi must have been rescued before normal fusion',fused);
rejects(save=>{save.flags[0].push(result);},'Fusion cannot duplicate its result flag',fused);
const worn=copy(fused);worn.equippedTalisman=result;valid(worn,'Equipment is distinct from artifact ownership');
rejects(save=>{save.equippedTalisman=result;},'An unowned talisman cannot be equipped');
for(const invalid of ['unknown','serpentScale','__proto__',false,0,{},[]])rejects(save=>{save.equippedTalisman=invalid;},'Unknown/malformed accessory is rejected',fused);
rejects(save=>{save.soldItems.push(result);},'The talisman is protected from sale',worn);
const atFumi=copy(worn);atFumi.location='mysticTent';atFumi.checkpoint=read('mysticTent.rests[0]');atFumi.visitedRests[0].push(atFumi.checkpoint.id);valid(atFumi,'Equipped talisman resumes at the real Fumi checkpoint');
rejects(save=>{save.release='0.0.1_00000000';},'A previous release cannot be migrated',worn);
rejects(save=>{save.progression.points++;},'Artifact armor cannot invent shrine training points',worn);
console.log('PASS: historical lava-scale recognition, guarded white/winged rewards, protected scales, once-only fusion prerequisites, equipped ownership, Fumi checkpoint and release/stat-budget rejection.');
