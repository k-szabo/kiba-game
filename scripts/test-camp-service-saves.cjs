/* Synthetic same-release schema checks; IndexedDB roundtrips need browser QA. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const validate=require('./test-save-validation.cjs');
const release=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/config/release.json'),'utf8')).version;
const context=vm.createContext({I18n:{t:key=>key}});
for(const name of ['dungeon-rules','ziggurat-maps','levels','camp-services'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/'+name+'.js'),'utf8'),context);
const read=expression=>JSON.parse(vm.runInContext('JSON.stringify('+expression+')',context));
const count=read('levels.length'),copy=value=>structuredClone(value),fresh=style=>({ownedWeapons:[style],weaponRank:0,armorRank:0,herbs:0,potions:0});
const quest=['campQuestAccepted','mayorExecuted','guardian:campMaster','smithRescued','herbalistRescued','enchanterRescued','herbalistQuestAccepted'];
function fixture({complete=true,style='katana'}={}){
 return {version:2,layout:2,release,weaponStyle:style,weaponChoicePending:false,realm:0,location:null,prologueComplete:true,
  shards:0,won:false,coins:0,meatCount:0,teaCount:0,quickHeal:'roastMeat',soldItems:[],campServices:fresh(style),
  abilities:[false,false],defeated:Array.from({length:count},(_,index)=>complete&&index===0),
  flags:Array.from({length:count},(_,index)=>complete&&index===0?['forestBell','villageBell',...quest]:[]),
  visitedRests:Array.from({length:count},(_,index)=>index===0?['start']:[]),checkpoint:read('japan.rests[0]'),
  progression:{level:1,xp:0,totalXp:0,points:0,stats:{vitality:0,strength:0,spirit:0}}};
}
function valid(save,message){const before=copy(save);assert.deepEqual(JSON.parse(JSON.stringify(validate(save))),save,message);assert.deepEqual(save,before,'Validation cannot mutate the snapshot');}
function rejects(mutate,message,base=fixture()){
 const save=copy(base);mutate(save);assert.throws(()=>validate(save),undefined,message);
}
const normal=fixture();valid(normal,'A completed rescue quest can retain default equipment');
for(const style of ['katana','naginata','swordShield'])valid(fixture({complete:false,style}),'Each unrescued starting style has an independent default service inventory');
const absent=fixture();delete absent.campServices;valid(absent,'Existing same-format fixtures may omit new service state');
for(const id of read('Object.keys(SIDE_LOCATIONS).filter(id=>SIDE_LOCATIONS[id].realm===0&&!SIDE_LOCATIONS[id].map.dungeon)')){
 const save=fixture(),rest=read('SIDE_LOCATIONS['+JSON.stringify(id)+'].map.rests[0]');
 save.location=id;save.checkpoint=rest;save.visitedRests[0].push(rest.id);valid(save,'Exact canonical checkpoint restores '+id);
 const elsewhere=copy(save);elsewhere.location=null;elsewhere.checkpoint=read('japan.rests[0]');valid(elsewhere,'Visited '+id+' remains recorded outside the side area');
 rejects(data=>{data.checkpoint.x++;},'Forged '+id+' checkpoint x',save);
 rejects(data=>{data.checkpoint.y++;},'Forged '+id+' checkpoint y',save);
 rejects(data=>{data.checkpoint=read('japan.rests[0]');},'Main-realm checkpoint cannot be used inside '+id,save);
 rejects(data=>{data.visitedRests[0]=['start'];},'Unvisited '+id+' checkpoint cannot restore',save);
 rejects(data=>{data.realm=1;},id+' must remain in its owning realm',save);
 rejects(data=>{data.prologueComplete=false;},'Dream cannot restore '+id,save);
 rejects(data=>{data.defeated[0]=false;},'Every side area requires Japan victory',save);
 for(const flag of read('SIDE_LOCATIONS['+JSON.stringify(id)+'].requiredFlags')){
  rejects(data=>{data.flags[0]=data.flags[0].filter(value=>value!==flag);},id+' requires its unlock flag',save);
 }
}
for(const id of ['constructor','__proto__','toString','unknown',false,1,{},[]])rejects(data=>{data.location=id;},'Only own string side-registry IDs are accepted');
for(const [flag,prerequisite]of [
 ['campQuestAccepted',null],['mayorExecuted','campQuestAccepted'],['guardian:campMaster','mayorExecuted'],
 ['smithRescued','guardian:campMaster'],['herbalistRescued','guardian:campMaster'],['enchanterRescued','guardian:campMaster'],['herbalistQuestAccepted','herbalistRescued']
]){
 const save=fixture();if(prerequisite)save.flags[0]=save.flags[0].filter(value=>value!==prerequisite);else save.defeated[0]=false;
 assert(save.flags[0].includes(flag));assert.throws(()=>validate(save),undefined,flag+' requires '+(prerequisite||'Japan victory'));
}
// Stages are individually saveable, not only the final all-rescued state.
for(let length=0;length<=quest.length;length++){
 const save=fixture();save.flags[0]=['forestBell','villageBell',...quest.slice(0,length)];valid(save,'Rescue progress stage '+length+' is resumable');
}
const developed=fixture();developed.campServices={ownedWeapons:['katana','naginata','swordShield'],weaponRank:5,armorRank:5,herbs:Number.MAX_SAFE_INTEGER,potions:Number.MAX_SAFE_INTEGER};developed.quickHeal='healingBrew';valid(developed,'All weapon styles, capped ranks and safe stock counts survive a roundtrip');
const emptyBrew=fixture();emptyBrew.quickHeal='healingBrew';valid(emptyBrew,'Quick-use brew selection can remain after its last charge is used');
for(const field of ['weaponRank','armorRank'])rejects(save=>{save.flags[0]=save.flags[0].filter(id=>id!=='smithRescued');save.campServices[field]=1;},field+' requires the rescued smith');
rejects(save=>{save.flags[0]=save.flags[0].filter(id=>id!=='smithRescued');save.campServices.ownedWeapons.push('naginata');},'Extra weapon ownership requires the smith');
for(const field of ['herbs','potions'])rejects(save=>{save.flags[0]=save.flags[0].filter(id=>id!=='herbalistQuestAccepted');save.campServices[field]=1;},field+' requires the accepted herbalist quest');
rejects(save=>{save.flags[0]=save.flags[0].filter(id=>id!=='herbalistQuestAccepted');save.quickHeal='healingBrew';},'Brew quick-use cannot precede its quest');
for(const item of ['unknown','potion','constructor',1])rejects(save=>{save.quickHeal=item;},'Unknown quick-heal IDs are rejected');
for(const invalid of [null,false,[],1,'camp',{}])rejects(save=>{save.campServices=invalid;},'Malformed service object rejected');
rejects(save=>{save.campServices.extra=1;},'Unexpected service fields rejected');
rejects(save=>{delete save.campServices.herbs;},'Incomplete service object rejected');
for(const field of ['weaponRank','armorRank','herbs','potions'])for(const invalid of [-1,.5,'1',null,Number.MAX_SAFE_INTEGER+1])rejects(save=>{save.campServices[field]=invalid;},field+' invalid bounds/type');
for(const field of ['weaponRank','armorRank'])rejects(save=>{save.campServices[field]=6;},field+' capped at five');
for(const weapons of [[],['katana','katana'],['katana','spear'],['naginata'],null,'katana'])rejects(save=>{save.campServices.ownedWeapons=weapons;},'Malformed or unequipped ownership rejected');
for(const mode of ['dream','pending']){
 const save=fixture({complete:false});if(mode==='dream')save.prologueComplete=false;else save.weaponChoicePending=true;
 valid(save,mode+' accepts fresh katana service state');
 const noField=copy(save);delete noField.campServices;valid(noField,mode+' permits old synthetic fixture omission');
 for(const field of ['weaponRank','armorRank','herbs','potions'])rejects(data=>{data.campServices[field]=1;},mode+' rejects progressed '+field,save);
 rejects(data=>{data.campServices.ownedWeapons.push('naginata');},mode+' rejects extra weapons',save);
 rejects(data=>{data.quickHeal='healingBrew';},mode+' rejects future quick-use brew',save);
}
rejects(save=>{save.progression.stats.strength=1;},'Purchased bonuses cannot inflate shrine stat points');
rejects(save=>{save.release='0.0.1_00000000';},'Service progress never migrates from another release');
console.log('PASS: current-release camp service schema, side checkpoints, rescue order, forge/stock bounds, owned equipment, herbalist quick use, fresh dream/pending state and unchanged legacy fixtures.');
