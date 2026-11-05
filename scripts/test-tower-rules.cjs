'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context=vm.createContext({});vm.runInContext(require('./test-only-bootstrap.cjs').bossCatalog,context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/tower-rules.js'),'utf8')+';globalThis.rules=TowerRules;',context);
const rules=context.rules,plain=value=>JSON.parse(JSON.stringify(value)),same=(a,b)=>assert.deepEqual(plain(a),plain(b));
assert(Object.isFrozen(rules));assert(Object.isFrozen(rules.profile));assert(Object.isFrozen(rules.layout));
for(const seed of [undefined,null,0,-1,.2,NaN,Infinity,0x100000000,'1']){assert.equal(rules.fresh(seed),null);assert.equal(rules.floor(1,seed),null);}
for(const floor of [undefined,null,0,-1,.2,NaN,Infinity,Number.MAX_SAFE_INTEGER+1,'1'])assert.equal(rules.floor(floor,1),null);
for(const weapon of [undefined,null,'foxfireKatana','constructor','toString',{},1])assert.equal(rules.validWeapon(weapon),false);
for(const weapon of ['katana','naginata','swordShield']){const run=rules.fresh(1,weapon);assert(rules.valid(run));assert.equal(rules.maxHp(weapon),weapon==='swordShield'?22:20);}
assert.equal(rules.maxHp('foxfireKatana'),null);
const first=rules.floor(1,42);same(first,rules.floor(1,42));assert.notDeepEqual(plain(first),plain(rules.floor(1,43)));
assert.equal(first.enemyCount,3);assert.equal(rules.floor(4,42).enemyCount,4);assert.equal(rules.floor(20,42).enemyCount,8);assert.equal(rules.floor(500,42).enemyCount,8);
for(const number of [1,2,3,4,5,6,7,10,20,100,1e6,Number.MAX_SAFE_INTEGER]){
 const spec=rules.floor(number,0xffffffff);same(spec,rules.floor(number,0xffffffff));assert(spec.enemies.length>=3&&spec.enemies.length<=8);
 assert.equal(spec.elite,number%5===0);assert.equal(spec.enemies.filter(e=>e.towerElite).length,0);assert.equal(spec.enemies.filter(e=>e.towerBoss).length,rules.bossCount(number));
 assert.equal(new Set(spec.enemies.map(e=>e.id)).size,spec.enemies.length);
 for(const e of spec.enemies){assert(e.noReward&&e.towerEnemy);assert.equal(!!e.miniboss,!!e.towerBoss);if(e.towerBoss){assert(rules.bossPool.includes(e.miniboss));assert(e.towerSpeed>=1&&e.towerSpeed<=1.6);assert(e.towerDamageScale>0);}assert(Number.isSafeInteger(e.maxHp)&&e.maxHp>0);assert(Number.isFinite(e.damageValue)&&e.damageValue>0);assert(e.x>=500&&e.x<rules.layout.width-80);assert.equal(e.y,rules.layout.groundY);assert(e.patrol>=400);assert.equal(e.factionOverride,e.shadowNinjaRole?'shadowNinjas':spec.faction);}
}
assert.equal(new Set(Array.from({length:rules.bossPool.length},(_,i)=>rules.floor(i+1,3).enemies[0].miniboss)).size,rules.bossPool.length);
assert.equal(rules.floor(10,3).bossCount,1);assert.equal(rules.floor(11,3).bossCount,2);assert.equal(rules.floor(25,3).bossCount,2);assert.equal(rules.floor(26,3).bossCount,3);
assert.notDeepEqual(plain(rules.floor(21,3)),plain(rules.floor(21+0x100000000,3)),'High integer words take part in deterministic floor identity');
const regular=rules.floor(1,42).enemies[0],later=rules.floor(101,42).enemies.find(e=>e.kind===regular.kind)||rules.floor(101,42).enemies[0];assert(later.maxHp>regular.maxHp);assert(later.damageValue>regular.damageValue);
let run=rules.fresh(0x12345678,'naginata'),kills=0,elapsed=0;
for(let floor=1;floor<=60;floor++){
 const before=plain(run),spec=rules.floor(floor,run.seed),result=rules.advance(run,{kills:spec.enemyCount,elapsed:floor/3});
 same(run,before);assert(result.ok);run=result.state;kills+=spec.enemyCount;elapsed+=floor/3;assert(rules.valid(run));assert.equal(run.floor,floor+1);assert.equal(run.cleared,floor);assert.equal(run.kills,kills);assert(Math.abs(run.elapsed-elapsed)<1e-8);assert.equal(result.heal,2);assert.equal(result.fullHeal,floor%5===0);assert.equal(result.checkpoint,floor%5===0);assert.equal(rules.killsThrough(floor),kills);
 if(floor<5){assert.equal(run.checkpoint,null);same(rules.resume(run),rules.fresh(run.seed,run.weapon));}
 else{assert(rules.validCheckpoint(run.checkpoint));assert.equal(run.checkpoint.cleared,Math.floor(floor/5)*5);const restored=rules.resume(run);assert(rules.valid(restored));assert.equal(restored.floor,Math.floor(floor/5)*5+1);assert.equal(restored.cleared,restored.checkpoint.cleared);assert.equal(restored.kills,restored.checkpoint.kills);assert.equal(restored.elapsed,restored.checkpoint.elapsed);same(restored,rules.fromCheckpoint(run.checkpoint));}
}
assert.equal(run.checkpoint.cleared,60);same(rules.score(run),{seed:run.seed,weapon:run.weapon,cleared:run.cleared,kills:run.kills,elapsed:run.elapsed});
const copied=rules.copy(run);copied.checkpoint.kills=0;assert.notEqual(copied.checkpoint.kills,run.checkpoint.kills,'Copied checkpoints never alias the original');
const six=rules.advance(rules.fromCheckpoint({...run.checkpoint,cleared:5,kills:rules.killsThrough(5),elapsed:5}),{kills:rules.enemyCount(6),elapsed:2}).state;
same(rules.resume(six).checkpoint,{seed:run.seed,weapon:run.weapon,cleared:5,kills:rules.killsThrough(5),elapsed:5});assert.equal(rules.resume(six).elapsed,5,'Partial-block time is discarded on checkpoint retry');
for(const patch of [{floor:0},{cleared:6},{kills:run.kills+1},{elapsed:NaN},{elapsed:Infinity},{extra:true},{checkpoint:null},{checkpoint:{...run.checkpoint,cleared:59}},{checkpoint:{...run.checkpoint,seed:5}},{checkpoint:{...run.checkpoint,weapon:'katana'}},{checkpoint:{...run.checkpoint,kills:0}},{checkpoint:{...run.checkpoint,elapsed:run.elapsed+1}}]){const bad={...run,...patch};assert(!rules.valid(bad));assert.equal(rules.copy(bad),null);assert.equal(rules.resume(bad),null);assert.equal(rules.advance(bad,{kills:8,elapsed:1}).ok,false);}
for(const value of [null,{},[],{...run.checkpoint,extra:true},{...run.checkpoint,cleared:0},{...run.checkpoint,cleared:6},{...run.checkpoint,kills:-1},{...run.checkpoint,elapsed:'1'}]){assert(!rules.validCheckpoint(value));assert.equal(rules.fromCheckpoint(value),null);}
for(const input of [{kills:2,elapsed:1},{kills:4,elapsed:1},{kills:3,elapsed:-1},{kills:3,elapsed:NaN},{kills:3,elapsed:Infinity},{}]){const fresh=rules.fresh(1),before=plain(fresh),result=rules.advance(fresh,input);assert(!result.ok);same(fresh,before);same(result.state,before);}
const saturated=rules.fresh(1);saturated.elapsed=Number.MAX_SAFE_INTEGER;assert.equal(rules.advance(saturated,{kills:3,elapsed:1}).reason,'counterOverflow');assert.equal(rules.killsThrough(Number.MAX_SAFE_INTEGER),null);
assert.equal(rules.heal(13,20,1),15);assert.equal(rules.heal(19,20,4),20);assert.equal(rules.heal(1,22,5),22);assert.equal(rules.heal(0,20,5),0,'A defeated player cannot be resurrected by a floor heal');
for(const args of [[-1,20,1],[21,20,1],[NaN,20,1],[1,Infinity,1],[1,0,1],[1,20,0]])assert.equal(rules.heal(...args),null);
console.log('PASS: deterministic bounded tower floors, escalating finite health/damage, no-reward archetypes, exact five-floor checkpoints, nonmutating clear/resume transactions, discarded partial blocks, strict hostile-record rejection and safe healing.');
