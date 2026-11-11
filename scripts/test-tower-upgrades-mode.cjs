'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');

function setup(){
 const h=harness(),r=h.run;
 h.sandbox.crypto={getRandomValues:array=>{array[0]=1201;return array;}};
 r('var clock=1000;Date.now=()=>clock;persist();mainMenu();');
 assert(r('TowerMode.open()'));
 h.elements.get('towerWeapon').value='katana';
 return h;
}
const finishFloor=r=>r('for(const e of enemies){e.active=true;e.hp=0;killEnemy(e);}update(1/120);');
const unlock=r=>r('clock+=3000;TowerMode.render();');
const choose=r=>r('TowerMode.claim(TowerRewards.choices(TowerMode.snapshot().seed,TowerMode.snapshot().cleared).find(id=>id!=="revival"))');
{
 const h=setup(),r=h.run;assert(r('TowerMode.start()'));
 for(let floor=1;floor<=5;floor++){
  if(floor===5)assert(r('enemies.every(e=>e.towerBoss)'));
  finishFloor(r);
  assert.equal(r('TowerMode.wallet.coins'),20*floor+5*floor*(floor+1)/2);
  assert(h.elements.get('towerPower0').disabled);
  assert(h.elements.get('towerExit').disabled);
  assert(h.elements.get('towerResultLeaderboard').disabled);
  assert(!r('TowerLeaderboard.open()'));
  assert(!r('TowerMode.requestLeave()'));
  assert(!r('TowerMode.enterFloor()'));
  if(floor===5)assert.equal(r('TowerStore.read().checkpointRewards.claimedFloor'),4);
  assert(!r('TowerMode.claim(TowerRewards.choices(1201,'+floor+')[0])'));
  r('clock+=2999;TowerMode.render();');assert(h.elements.get('towerPower0').disabled);
  r('clock++;TowerMode.render();');assert(!h.elements.get('towerPower0').disabled);
  assert(!r('TowerMode.enterFloor()'));
  assert(choose(r));
  assert(!choose(r));
  if(floor<5)assert(r('TowerMode.enterFloor()'));
 }
 assert(!h.elements.get('towerVendor').hidden);
 for(const item of ['roastMeat','tea','healingBrew','roastChicken']){
  assert(r('TowerMode.buy('+JSON.stringify(item)+')'));
  assert(r('TowerMode.selectHealing('+JSON.stringify(item)+')'));
 }
 assert.equal(r('TowerMode.wallet.coins'),70);
 assert.equal(r('TowerStore.read().checkpointRewards.items.roastChicken'),1);
 assert(r('TowerMode.enterFloor()'));r('player.hp=10');
 h.press({action:'useMeat'});r('update(1/120)');h.release({action:'useMeat'});
 assert.equal(r('player.hp'),14);
 assert.equal(r('TowerMode.wallet.items.roastChicken'),0);
 r('player.inv=0;damage(100000);');assert.equal(r('TowerMode.phase'),'result');
 assert(!r('TowerMode.resume()'));assert(h.elements.get('towerRetry').disabled);
 unlock(r);assert(r('TowerMode.resume()'));
 assert.equal(r('TowerMode.snapshot().floor'),6);
 assert.equal(r('TowerMode.wallet.items.roastChicken'),1);
}
{
 const h=setup(),r=h.run;
 r('var pendingWallet=TowerRewards.award(TowerRewards.fresh(4),5).wallet;TowerStore.start({seed:1201,weapon:"katana"});TowerStore.saveCheckpoint({seed:1201,weapon:"katana",cleared:5,kills:TowerRules.killsThrough(5),elapsed:10},pendingWallet);');
 assert(r('TowerMode.resume()'));assert.equal(r('TowerMode.phase'),'clear');
 assert(!r('TowerMode.enterFloor()'));assert.equal(r('TowerMode.wallet.coins'),45);
 assert(choose(r));assert(r('TowerMode.enterFloor()'));assert.equal(r('TowerMode.snapshot().floor'),6);
}
for(const relic of ['dawnblade','shield','grapple']){
 const h=setup(),r=h.run;
 r(`var relicWallet=TowerRewards.fresh(5);relicWallet.relic=${JSON.stringify(relic)};
  TowerStore.start({seed:1201,weapon:'katana'});
  TowerStore.saveCheckpoint({seed:1201,weapon:'katana',cleared:5,kills:TowerRules.killsThrough(5),elapsed:10},relicWallet);`);
 assert(r('TowerMode.resume()'));
 assert(r('TowerMode.hasRelic('+JSON.stringify(relic)+')'));
 if(relic==='dawnblade'){
  h.press({action:'ultimate'});r('update(1/120)');h.release({action:'ultimate'});
  assert(r('Dawnblade.casting()'));assert.equal(r('Dawnblade.status().cooldown'),60);
  r('updatePlayerTimers(.6)');assert.equal(r('player.hp'),10);
  r('pause();update(60)');assert(r('Dawnblade.status().cooldown>59'));
  r('pause();updatePlayerTimers(60)');
  h.press({action:'ultimate'});r('update(1/120)');h.release({action:'ultimate'});
  assert(r('Dawnblade.casting()'),'The relic remains usable after recharge on its floor');
 }else if(relic==='shield'){
  r('player.inv=0;damage(2)');assert.equal(r('player.hp'),20);assert.equal(r('FiaConflict.shield'),0);
  r('updatePlayerTimers(12)');assert.equal(r('FiaConflict.shield'),2);
  r('player.inv=0;damage(2)');assert.equal(r('player.hp'),20);
 }else{
  h.press({action:'grapple'});r('update(1/120)');h.release({action:'grapple'});
  assert(r('Grapple.snapshot()'));r('Grapple.cancel()');assert(!r('Grapple.activate()'));
  r('updatePlayerTimers(2.5)');assert(r('Grapple.activate()'));
 }
 finishFloor(r);assert.equal(r('TowerMode.wallet.relic'),null);
 unlock(r);assert(choose(r));assert(r('TowerMode.enterFloor()'));
 assert(!r('Dawnblade.owned()||FiaConflict.owned()||Grapple.owned()'));
 assert(r('flags.every(list=>list.length===0)'));
}
console.log('PASS: tower result guards, deterministic rewards, boss floor and all four healing items, checkpoint rollback, and three reusable floor abilities with expiry.');
