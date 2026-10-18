// Synthetic save-schema coverage; actual browser storage is checked separately.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const validate=require('./test-save-validation.cjs');
const release=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/config/release.json'),'utf8')).version;
const context=vm.createContext({I18n:{t:key=>key}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/levels.js'),'utf8'),context);
const rewards=JSON.parse(vm.runInContext('JSON.stringify(BOSS_REWARDS)',context));
const start=JSON.parse(vm.runInContext('JSON.stringify(levels[2].rests[0])',context));
const copy=value=>structuredClone(value);
function fixture(mask=0,{level=1,spent=false}={}){
 const flags=[['forestBell','villageBell'],['soulUpper','soulLower'],['dawnSeal']];
 let bonus=0;for(const [realm,reward] of rewards.entries())if(mask&(1<<realm)){flags[realm].push(reward.claim,reward.id);bonus+=reward.points;}
 let totalXp=0;for(let n=1;n<level;n++)totalXp+=60+(n-1)*35;
 let budget=level-1+bonus;const stats={vitality:0,strength:0,spirit:0};
 if(spent)for(const key of Object.keys(stats)){stats[key]=Math.min(8,budget);budget-=stats[key];}
 return {coins:0,meatCount:0,version:2,layout:2,release,realm:2,prologueComplete:true,shards:0,won:false,abilities:[true,true],defeated:[true,true,true],flags,visitedRests:[['start'],['start'],['start']],checkpoint:copy(start),progression:{level,xp:0,totalXp,points:budget,stats}};
}
for(let mask=0;mask<8;mask++)for(const level of [1,5,12])for(const spent of [false,true]){
 const data=fixture(mask,{level,spent});assert.deepEqual(JSON.parse(JSON.stringify(validate(data))),data,`Reward mask ${mask}, level ${level}, spent ${spent} is preserved`);
 const inflated=copy(data);inflated.progression.points++;assert.throws(()=>validate(inflated),/Invalid save schema/,'Only earned bonus points are spendable');
 const missing=copy(data);if(missing.progression.points)missing.progression.points--;else missing.progression.stats.vitality--;
 assert.throws(()=>validate(missing),/Invalid save schema/,'Allocated plus unspent points must equal the whole budget');
}
const capped=fixture(7,{level:12});assert.equal(capped.progression.points,14);assert.equal(validate(capped).progression.points,14);
for(const [realm,reward] of rewards.entries()){
 for(const missing of [reward.claim,reward.id]){
  const orphan=fixture(1<<realm);orphan.flags[realm]=orphan.flags[realm].filter(id=>id!==missing);
  if(missing===reward.claim)orphan.progression.points=0;
  assert.throws(()=>validate(orphan),/Invalid boss reward/,'A stored boss soul and its reward ledger must agree');
 }
 const unearned=fixture(1<<realm);unearned.defeated[realm]=false;
 // Keep ordinary progression independently valid so the reward guard is tested.
 if(realm===0){unearned.realm=0;unearned.checkpoint=JSON.parse(vm.runInContext('JSON.stringify(levels[0].rests[0])',context));}
 if(realm===1){unearned.realm=1;unearned.checkpoint=JSON.parse(vm.runInContext('JSON.stringify(levels[1].rests[0])',context));}
 assert.throws(()=>validate(unearned),/Invalid boss reward/,'A reward cannot precede its boss victory');
 const duplicate=fixture(1<<realm);duplicate.flags[realm].push(reward.claim);assert.throws(()=>validate(duplicate),/Invalid quest flags/);
}
for(const flags of [null,{},[[],[]],[null,[],[]],[[],{},[]],[[],[],['not-a-real-flag']]]){
 for(const dream of [false,true]){
  const malformed=fixture();malformed.flags=flags;malformed.prologueComplete=!dream;assert.throws(()=>validate(malformed),/Invalid world progress|Invalid quest flags/,'Malformed flag arrays are rejected before bonus or dream-progress calculation');
 }
}
for(const mutate of [
 data=>{data.progression.points=18;},
 data=>{data.progression.stats={vitality:9,strength:0,spirit:0};data.progression.points=8;},
 data=>{data.progression.xp++;},
 data=>{data.progression.points=.5;},
 data=>{data.release='0.0.1';}
]){const invalid=fixture(7,{level:12});mutate(invalid);assert.throws(()=>validate(invalid));}
// At the level cap extra total XP remains legal; displayed XP stays zero.
const extraXP=fixture(7,{level:12});extraXP.progression.totalXp+=600;assert.equal(validate(extraXP).progression.xp,0);
console.log('PASS: boss reward save budgets, spent/unspent allocations, soul/ledger agreement, malformed flags, duplicate claims and release rejection.');
