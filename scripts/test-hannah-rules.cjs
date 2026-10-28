/* Pure damage gates and ability arithmetic, without browser/render mocks. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/hannah-rules.js'),'utf8'),context);
const rules=vm.runInContext('HannahRules',context),plain=value=>JSON.parse(JSON.stringify(value));
const hit=(state,amount)=>plain(rules.planHit(state,amount));

assert.equal(rules.tuning.phase1.maxHp,1200);
assert.equal(rules.tuning.phase2.maxHp,1600);
for(const value of [rules,rules.tuning,rules.tuning.phase1,rules.tuning.phase2,rules.tuning.phase2.gates,rules.tuning.phase2.gates[0],rules.tuning.drain,rules.tuning.ultimate,rules.progress])assert.ok(Object.isFrozen(value));

const first=Object.freeze({stage:1,hp:1200,gateIndex:0});
assert.deepEqual(hit(first,1e9),{ok:true,hp:120,damage:1080,gate:'transform',gateIndex:1});
assert.equal(first.hp,1200);
assert.deepEqual(hit({stage:1,hp:120,gateIndex:1},500),{ok:true,hp:120,damage:0,gate:null,gateIndex:1});

let state={stage:2,hp:1600,gateIndex:0};
for(const [gate,hp,index] of [['drain60',960,1],['drain40',640,2],['rescue',160,3]]){
 const result=hit(state,1e9);
 assert.equal(result.gate,gate);assert.equal(result.hp,hp);assert.equal(result.gateIndex,index);
 state={...state,hp:result.hp,gateIndex:result.gateIndex};
}
assert.deepEqual(hit(state,1e9),{ok:true,hp:160,damage:0,gate:null,gateIndex:3});

// Drain interruption damage remains usable, but cannot skip the next story
// gate. Finishing the drain permits that gate on the next hit, even at its floor.
const drained=hit({stage:2,hp:960,gateIndex:1,draining:true},1000);
assert.deepEqual(drained,{ok:true,hp:640,damage:320,gate:null,gateIndex:1});
assert.deepEqual(hit({stage:2,hp:640,gateIndex:1},1),{ok:true,hp:640,damage:0,gate:'drain40',gateIndex:2});
// Healing above 60% does not repeat its already consumed drain.
assert.equal(hit({stage:2,hp:1500,gateIndex:1},1000).gate,'drain40');
assert.equal(hit({stage:2,hp:1500,gateIndex:2},2000).gate,'rescue');
assert.deepEqual(hit({stage:2,hp:961,gateIndex:0},1),{ok:true,hp:960,damage:1,gate:'drain60',gateIndex:1});
assert.equal(hit({stage:2,hp:961,gateIndex:0},.5).gate,null);
assert.equal(hit({stage:2,hp:959,gateIndex:0},1).gate,'drain60');

for(const amount of [0,-1,NaN,Infinity,-Infinity,undefined,null,'5'])assert.equal(hit(first,amount).ok,false);
for(const bad of [null,{}, {stage:0,hp:100}, {stage:2,hp:0}, {stage:2,hp:Infinity}, {stage:1,hp:1201}, {stage:2,hp:1000,gateIndex:-1}, {stage:2,hp:1000,gateIndex:.5}, {stage:2,hp:1000,gateIndex:4}, {stage:2,hp:1000,draining:'yes'}])assert.equal(hit(bad,5).ok,false);

const complete=['fiaRescued','arenaChampion','fiaTalismanCompleted'];
assert.equal(rules.eligibleFia(complete),true);
for(const omitted of complete)assert.equal(rules.eligibleFia(complete.filter(id=>id!==omitted)),false);
for(const excluded of ['fiaSlain','fiaMissed'])assert.equal(rules.eligibleFia([...complete,excluded]),false);
for(const bad of [null,undefined,{},'fiaRescued'])assert.equal(rules.eligibleFia(bad),false);

assert.equal(rules.ultimateDamage(2),16);assert.equal(rules.ultimateDamage(9.75),78);
assert.equal(rules.tuning.ultimate.cooldown,60);
assert.equal(rules.drainThreshold(1),12);assert.equal(rules.drainThreshold(9.75),58.5);
assert.equal(rules.tuning.drain.duration,8);
assert.equal(rules.tuning.drain.haruMaxHp/rules.tuning.drain.haruPerSecond,12.5);
assert.equal(rules.tuning.ultimate.recoil,10);
for(const [hp,after] of [[1,1],[2,1],[3,1],[5,1],[10,1],[11,1],[12,2],[17,7],[11.25,1.25],[1.25,1]])assert.equal(rules.recoil(hp),after);
for(const bad of [NaN,Infinity,-1,0,null,undefined,'2']){assert.equal(rules.ultimateDamage(bad),0);assert.equal(rules.drainThreshold(bad),null);assert.equal(rules.recoil(bad),null);}
assert.equal(rules.ultimateDamage(Number.MAX_VALUE),0);
assert.equal(rules.drainThreshold(Number.MAX_VALUE),null);
console.log('Hannah pure rules checks passed.');
