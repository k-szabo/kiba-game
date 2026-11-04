/* Synthetic current-format saves: schema validation, not encrypted browser storage. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),validate=require('./test-save-validation.cjs');
const release=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/config/release.json'),'utf8')).version;
const context=vm.createContext({I18n:{t:key=>key}});
for(const name of ['dungeon-rules','fia-journey-rules','fia-ritual-rules','fia-void-maps','dragon-raid','haru-follower','floating-islands-rules','floating-islands-maps','watchtower-balloon-rules','watchtower-balloon-maps','ziggurat-descent-rules','ziggurat-descent-maps','ziggurat-maps','levels','camp-services'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/'+name+'.js'),'utf8'),context);
const read=s=>JSON.parse(vm.runInContext('JSON.stringify('+s+')',context)),copy=structuredClone;
function fixture(purified=false){
 const rest=read('forestCamp.rests[0]'),shadow=['guardian:cultJailer','prisonOpen','guardian:prisonWarden','zenRescued','guardian:madOrganist','corruptedHymn'];
 if(purified)shadow.push('zenHymnPurified');
 return {version:2,layout:2,release,weaponStyle:'katana',weaponChoicePending:false,prologueComplete:true,realm:0,location:'forestCamp',abilities:[false,false],defeated:[true,true,true,false],flags:[['forestBell','villageBell'],['soulUpper','soulLower'],['dawnSeal','shadowEntered'],shadow],visitedRests:[['start',rest.id],['start'],['start'],['start']],checkpoint:rest,shards:0,won:false,coins:0,meatCount:0,teaCount:0,quickHeal:null,soldItems:[],campServices:{ownedWeapons:['katana'],weaponRank:0,armorRank:0,herbs:0,potions:0},progression:{level:1,xp:0,totalXp:0,points:purified?read('ZEN_PURIFICATION_POINTS'):0,stats:{vitality:0,strength:0,spirit:0}}};
}
function valid(save,label){const before=copy(save);assert.deepEqual(JSON.parse(JSON.stringify(validate(save))),save,label);assert.deepEqual(save,before,'Validation is nonmutating');}
function reject(change,label,base=fixture(true)){const save=copy(base);change(save);assert.throws(()=>validate(save),undefined,label);}
const old=fixture(),purified=fixture(true);
valid(old,'Existing acquired hymn remains unconsumed and grants no retroactive points');valid(purified,'Purification adds the exact permanent budget');
assert.equal(read('ZEN_PURIFICATION_POINTS'),2);
context.worldFlags=purified.flags;assert.equal(read('bossBonusPoints(worldFlags)'),2);
for(const id of ['zenRescued','corruptedHymn','guardian:madOrganist'])reject(s=>{s.flags[3]=s.flags[3].filter(f=>f!==id);},'Missing prerequisite '+id);
reject(s=>s.soldItems.push('corruptedHymn'),'A sold hymn cannot also have been purified');
reject(s=>s.flags[3].push('zenHymnPurified'),'Duplicate purification history is malformed');
reject(s=>{s.flags[3]=s.flags[3].filter(f=>f!=='zenHymnPurified');s.flags[0].push('zenHymnPurified');},'Purification belongs only to realm three');
reject(s=>s.progression.points--,'The purification budget cannot be omitted');reject(s=>s.progression.points++,'The reward cannot be duplicated');
reject(s=>s.progression.points=2,'Owning the hymn alone grants no points',old);
const spent=copy(purified);spent.progression.points=0;spent.progression.stats.strength=2;valid(spent,'The purification reward can be spent normally');
const noHymn=copy(old);noHymn.flags[3]=noHymn.flags[3].filter(f=>!['corruptedHymn','guardian:madOrganist'].includes(f));valid(noHymn,'Existing rescue without an acquired hymn stays valid');
console.log('PASS: once-only Zen purification budget, prerequisite/sale/realm/duplicate rejection, spent rewards and unchanged pre-feature save snapshots.');
