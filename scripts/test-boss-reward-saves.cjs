// Synthetic save-schema coverage; actual browser storage is checked separately.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const validate=require('./test-save-validation.cjs');
const release=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/config/release.json'),'utf8')).version;
const context=vm.createContext({I18n:{t:key=>key}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/levels.js'),'utf8'),context);
const rewards=JSON.parse(vm.runInContext('JSON.stringify(BOSS_REWARDS)',context));
const realmCount=vm.runInContext('levels.length',context),allRewards=(1<<rewards.length)-1;
const start=JSON.parse(vm.runInContext('JSON.stringify(levels[2].rests[0])',context));
const copy=value=>structuredClone(value);
const rules=vm.runInContext('PROGRESSION_RULES',context);
function fixture(mask=0,{level=1,spent=false,xp=0}={}){
 const flags=Array.from({length:realmCount},()=>[]);flags[0]=['forestBell','villageBell'];flags[1]=['soulUpper','soulLower'];flags[2]=['dawnSeal'];
 if(realmCount>3)flags[2].push('shadowEntered');
 let bonus=0;for(const [realm,reward] of rewards.entries())if(mask&(1<<realm)){flags[realm].push(reward.claim,reward.id);bonus+=reward.points;}
 let totalXp=xp;for(let n=1;n<level;n++)totalXp+=rules.xpForLevel(n);
 let budget=level-1+bonus;const stats={vitality:0,strength:0,spirit:0};
 if(spent)for(const key of Object.keys(stats)){stats[key]=Math.min(rules.statLimit,budget);budget-=stats[key];}
 return {coins:0,meatCount:0,teaCount:0,quickHeal:'roastMeat',version:2,layout:2,release,realm:2,prologueComplete:true,shards:0,won:false,abilities:[true,true],defeated:Array(realmCount).fill(true),flags,visitedRests:Array.from({length:realmCount},()=>['start']),checkpoint:copy(start),progression:{level,xp,totalXp,points:budget,stats}};
}
for(let mask=0;mask<=allRewards;mask++)for(let level=1;level<=rules.levelLimit;level++)for(const spent of [false,true]){
 const data=fixture(mask,{level,spent});assert.deepEqual(JSON.parse(JSON.stringify(validate(data))),data,`Reward mask ${mask}, level ${level}, spent ${spent} is preserved`);
 const inflated=copy(data);inflated.progression.points++;assert.throws(()=>validate(inflated),/Invalid save schema/,'Only earned bonus points are spendable');
 const missing=copy(data);if(missing.progression.points)missing.progression.points--;else missing.progression.stats.vitality--;
 assert.throws(()=>validate(missing),/Invalid save schema/,'Allocated plus unspent points must equal the whole budget');
}
const capped=fixture(allRewards,{level:rules.levelLimit}),capBudget=rules.levelLimit-1+rewards.reduce((sum,reward)=>sum+reward.points,0);assert.equal(capped.progression.points,capBudget);assert.equal(validate(capped).progression.points,capBudget);
// Every XP interval is exact: the last point before a level-up remains legal,
// while crossing its boundary requires both the next level and its stat point.
for(let level=1;level<rules.levelLimit;level++){
 const partial=fixture(allRewards,{level,xp:rules.xpForLevel(level)-1});
 assert.deepEqual(JSON.parse(JSON.stringify(validate(partial))),partial,`Level ${level} accepts its full partial XP interval`);
 const overflow=copy(partial);overflow.progression.xp++;overflow.progression.totalXp++;
 assert.throws(()=>validate(overflow),/Invalid save schema/,'XP at a boundary must reconcile with level and earned points');
 const next=fixture(allRewards,{level:level+1});assert.equal(next.progression.totalXp,overflow.progression.totalXp);assert.doesNotThrow(()=>validate(next));
}
assert(fixture(allRewards,{level:29,xp:rules.xpForLevel(29)-1}).progression.xp>500,'Late levels can retain more than the former 500 XP bound');
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
 data=>{data.progression.stats={vitality:13,strength:0,spirit:0};data.progression.points=capBudget-13;},
 data=>{data.progression.level=31;},
 data=>{data.progression.xp++;},
 data=>{data.progression.points=.5;},
 data=>{data.release='0.0.1';}
]){const invalid=fixture(allRewards,{level:rules.levelLimit});mutate(invalid);assert.throws(()=>validate(invalid));}
// At the level cap extra total XP remains legal; displayed XP stays zero.
for(const totalXp of [capped.progression.totalXp+600,Number.MAX_SAFE_INTEGER]){
 const extraXP=fixture(allRewards,{level:rules.levelLimit});extraXP.progression.totalXp=totalXp;assert.equal(validate(extraXP).progression.xp,0);
}
for(const key of ['level','xp','totalXp','points'])for(const value of [-1,.5,Number.MAX_SAFE_INTEGER+1,Infinity,'1',null]){
 const invalid=copy(capped);invalid.progression[key]=value;assert.throws(()=>validate(invalid),undefined,`${key} rejects ${String(value)}`);
}
console.log('PASS: level 1–30 XP boundaries, safe integers, cap XP overflow, 12-point stats, exact boss reward budgets, spent/unspent allocations, soul/ledger agreement and release rejection.');
