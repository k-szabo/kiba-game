/* Save-schema boundaries for the resumable post-dream weapon choice.
   This validator test does not claim encryption or browser-storage coverage. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const validate=require('./test-save-validation.cjs');
const release=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/config/release.json'),'utf8')).version;
const context=vm.createContext({I18n:{t:key=>key}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/dungeon-rules.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/levels.js'),'utf8'),context);
const count=vm.runInContext('levels.length',context),start=JSON.parse(vm.runInContext('JSON.stringify(levels[0].rests[0])',context));
const flags=()=>Array.from({length:count},()=>[]);
function fresh(){
 const visitedRests=flags();visitedRests[0].push(start.id);
 return {version:2,layout:2,release,weaponStyle:'katana',weaponChoicePending:true,prologueComplete:true,realm:0,location:null,shards:0,won:false,coins:0,meatCount:0,teaCount:0,quickHeal:'roastMeat',soldItems:[],abilities:[false,false],defeated:Array(count).fill(false),flags:flags(),visitedRests,checkpoint:start,progression:{level:1,xp:0,totalXp:0,points:0,stats:{vitality:0,strength:0,spirit:0}}};
}
const plain=value=>JSON.parse(JSON.stringify(value));
const pending=fresh();assert.deepEqual(plain(validate(pending)),pending,'Awakening can persist the unanswered weapon choice');
assert.deepEqual(pending,fresh(),'Validation does not mutate the source snapshot');
for(const weaponStyle of ['katana','naginata','swordShield']){
 const confirmed={...fresh(),weaponStyle,weaponChoicePending:false};
 assert.deepEqual(plain(validate(confirmed)),confirmed,'Confirmed '+weaponStyle+' persists after waking');
 const fixtureWithoutPending={...confirmed};delete fixtureWithoutPending.weaponChoicePending;
 assert.deepEqual(plain(validate(fixtureWithoutPending)),fixtureWithoutPending,'Existing current-release fixtures need no pending marker');
}
for(const pendingValue of [undefined,false]){
 const dream={...fresh(),prologueComplete:false,weaponChoicePending:pendingValue};
 if(pendingValue===undefined)delete dream.weaponChoicePending;
 assert.deepEqual(plain(validate(dream)),dream,'The unfinished normal dream is always katana and has no pending choice');
 for(const weaponStyle of ['naginata','swordShield'])assert.throws(()=>validate({...dream,weaponStyle}),/Invalid dream weapon style/,'A permanent style cannot precede awakening');
}
for(const value of [null,0,1,'true','false',{},[],['katana']])assert.throws(()=>validate({...fresh(),weaponChoicePending:value}),/Invalid pending weapon choice/,'Pending choice accepts only a boolean or an absent field');
for(const patch of [
 {prologueComplete:false},{prologueComplete:undefined},{weaponStyle:'naginata'},{weaponStyle:'swordShield'},
 {realm:1},{location:'forestCamp'},{abilities:[true,false]},{abilities:[false,true]},
 {defeated:[true,...Array(count-1).fill(false)]},{flags:[['forestBell'],...Array.from({length:count-1},()=>[])]},
 {coins:1},{meatCount:1},{teaCount:1},{soldItems:['compass']}
])assert.throws(()=>validate({...fresh(),...patch}),/Invalid pending weapon choice|Invalid camp location|Invalid merchant progress|Invalid sold inventory/,'An unanswered choice cannot coexist with journey advancement: '+JSON.stringify(patch));
const earned=fresh();const xp=vm.runInContext('PROGRESSION_RULES.xpForLevel(1)',context);
earned.progression={level:2,xp:0,totalXp:xp,points:1,stats:{vitality:0,strength:0,spirit:0}};
assert.throws(()=>validate(earned),/Invalid pending weapon choice/,'Level rewards cannot be earned while choosing a starting weapon');
console.log('Weapon choice saves: katana-only dream, resumable awakening, confirmed styles, optional current-release marker and invalid advancement passed.');
