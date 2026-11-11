'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context=vm.createContext({});vm.runInContext(require('./test-only-bootstrap.cjs').bossCatalog,context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/tower-rules.js'),'utf8')+';globalThis.rules=TowerRules;',context);
const r=context.rules;
for(const seed of [1,42,0xffffffff])for(let n=1;n<=150;n++){
 const floor=r.floor(n,seed),bosses=r.bossCount(n);
 assert.equal(floor.enemies.length,r.enemyCount(n));assert.equal(floor.bossCount,bosses);
 if(n%5===0){assert.equal(floor.enemyCount,bosses);assert(floor.enemies.every(e=>e.towerBoss));}
 else assert(floor.enemies.length>bosses,'Support enemies remain outside checkpoint floors');
}
let total=0;for(let n=1;n<=10000;n++){total+=r.enemyCount(n);assert.equal(r.killsThrough(n),total);}
for(const cleared of [5,10,25,100,100000]){
 const oldKills=r.legacyKillsThrough(cleared),old={seed:42,weapon:'katana',cleared,kills:oldKills,elapsed:cleared};
 assert(r.validCheckpoint(old));let run=r.fromCheckpoint(old);assert.equal(run.legacyCleared,cleared);assert.equal(run.kills,oldKills);
 for(let step=1;step<=10;step++){
  const count=r.floor(run.floor,run.seed).enemyCount,result=r.advance(run,{kills:count,elapsed:1});
  assert(result.ok);assert.equal(result.state.kills,run.kills+count);run=result.state;assert(r.valid(run));
 }
 assert.equal(run.kills,oldKills+r.killsThrough(cleared+10)-r.killsThrough(cleared));
 assert.equal(run.checkpoint.legacyCleared,cleared);assert(r.validCheckpoint(run.checkpoint));assert(r.valid(r.fromCheckpoint(run.checkpoint)));
 assert.deepEqual(Object.keys(r.score(run)),['seed','weapon','cleared','kills','elapsed'],'Leaderboard score shape stays unchanged');
 for(const marker of [0,1,cleared+15,NaN,'5'])assert(!r.validCheckpoint({...run.checkpoint,legacyCleared:marker}));
 assert(!r.validCheckpoint({...run.checkpoint,kills:run.kills+1}));
 const current={...old,kills:r.killsThrough(cleared)};assert(r.validCheckpoint(current));assert.equal(r.fromCheckpoint(current).legacyCleared,undefined);
}
assert.equal(r.killsThrough(Number.MAX_SAFE_INTEGER),null);assert.equal(r.legacyKillsThrough(Number.MAX_SAFE_INTEGER),null);
console.log('PASS: boss-only fifth floors, actual encounter totals, bounded prefix sums and exact legacy checkpoint transitions preserve historical kills without accepting arbitrary records.');
