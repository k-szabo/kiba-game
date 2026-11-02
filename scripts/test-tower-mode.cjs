'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
function setup(weapon='katana'){
 const h=harness(),r=h.run;let seed=1200;h.sandbox.crypto={getRandomValues:array=>{array[0]=++seed;return array;}};
 r('persist();mainMenu();');const save=r('JSON.stringify(saved)'),writes=r('window.__saveSnapshots.length');
 assert(r('TowerMode.open()'));h.elements.get('towerWeapon').value=weapon;assert(r('TowerMode.start()'));
 return {...h,save,writes};
}
function clear(h){h.run('enemies.forEach(e=>{e.hp=0;killEnemy(e);});update(1/120);');assert.equal(h.run('TowerMode.phase'),'clear');}
for(const [weapon,hp]of [['katana',20],['naginata',20],['swordShield',22]]){
 const h=setup(weapon),r=h.run;assert.equal(r('player.maxHp'),hp);assert.equal(r('weaponStyle'),weapon);assert(r('abilities.every(Boolean)'));
 assert.equal(r('progression.level'),1);assert.equal(r('coins+meatCount+teaCount+chickenCount'),0);assert.equal(r('momoStats().armor'),0);
 assert(!r('Inventory.open()'));assert(!r('showMap()'));assert(!r('showTraining()'));assert(!r('DevTools.open()'));
 const before=r('JSON.stringify(saved)');r('persist()');assert.equal(r('JSON.stringify(saved)'),before);assert.equal(r('window.__saveSnapshots.length'),h.writes);
 r('player.hp=7');clear(h);assert.equal(r('player.hp'),9,'A normal clear heals exactly2');assert.equal(r('TowerMode.snapshot().cleared'),1);
 assert(r('TowerMode.enterFloor()'));assert.equal(r('player.hp'),9,'Nextfloor cannot heal again');assert(!r('TowerMode.enterFloor()'),'A stale next button cannot restart an uncleared floor');
 for(let n=2;n<=5;n++){clear(h);if(n<5)assert(r('TowerMode.enterFloor()'));}
 assert.equal(r('player.hp'),hp);assert.equal(r('TowerStore.read().checkpoint.cleared'),5);assert.equal(r('TowerMode.snapshot().floor'),6);
 assert(r('TowerMode.enterFloor()'));clear(h);assert(r('TowerMode.enterFloor()'));r('player.inv=0;damage(100000);');assert.equal(r('TowerMode.phase'),'result');assert.equal(r('TowerStore.read().best.cleared'),6);
 assert(r('TowerMode.resume()'));assert.equal(r('TowerMode.snapshot().floor'),6);assert.equal(r('player.hp'),hp);assert.equal(r('TowerMode.snapshot().cleared'),5,'Retry starts aftercheckpoint, not lastincomplete floor');
 r('pause()');const freeze=r('JSON.stringify([player,enemies,TowerMode.snapshot()])');r('update(3)');assert.equal(r('JSON.stringify([player,enemies,TowerMode.snapshot()])'),freeze);r('pause()');
 const permanent=r('JSON.stringify(saved)');assert.equal(permanent,h.save);assert.equal(r('window.__saveSnapshots.length'),h.writes);
 assert(r('TowerMode.leave()'));assert.equal(r('state'),'menu');assert.equal(r('JSON.stringify(saved)'),h.save);assert.equal(r('window.__saveSnapshots.length'),h.writes);
 r('startGame(true)');h.dismiss();assert(!r('level.tower'));assert(!r('TowerMode.active'));assert(!r('abilities.every(Boolean)'),'Tower abilities cannot leak to the untrained journey');
}
for(const fps of [30,60,120]){
 const h=setup(),r=h.run;h.press({action:'dash'});r('update(1/'+fps+')');h.release({action:'dash'});for(let i=0;i<fps;i++)r('update(1/'+fps+')');assert.equal(r('dash'),0);assert(Math.abs(r('player.vx'))<1,'Dash release returns to rest');
 h.press({action:'jump'});r('update(1/'+fps+')');h.release({action:'jump'});for(let i=0;i<fps*2;i++)r('update(1/'+fps+')');assert(r('player.onGround'));assert.equal(r('player.vy'),0);assert(r('TowerMode.snapshot().floorElapsed>2'));
}
{
 const h=setup(),r=h.run;r('enemies=[];player.y=level.height+200;movePlayer(1/120)');assert.equal(r('TowerMode.phase'),'result');assert.equal(r('TowerMode.snapshot().cleared'),0);assert.equal(r('TowerStore.read().checkpoint.cleared'),0);assert(r('TowerMode.resume()'));assert.equal(r('TowerMode.snapshot().floor'),1);
}
{
 const h=setup(),r=h.run;clear(h);assert(h.elements.get('towerCheckpoint').hidden);assert.equal(h.elements.get('realmLabel').textContent,r('I18n.format("tower.floor",[1])'));
 for(let n=2;n<=5;n++){assert(r('TowerMode.enterFloor()'));clear(h);}assert(!h.elements.get('towerCheckpoint').hidden);
 assert(r('TowerMode.lobby()'));assert(h.elements.get('towerHUD').hidden);h.elements.get('towerWeapon').value='naginata';assert(r('TowerMode.start()'));assert.equal(r('TowerMode.snapshot().floor'),1);assert.equal(r('weaponStyle'),'naginata');assert.equal(r('TowerStore.read().checkpoint.cleared'),0);assert.equal(r('TowerStore.read().best.cleared'),5);assert(r('TowerMode.leave()'));assert.equal(r('JSON.stringify(saved)'),h.save);
}
console.log('PASS: three normalizedloadouts, existingcombat/movement, isolatedjourneyvault, no out-of-mode tools, floorheals, checkpoint5 continuationafterdeath, preservedrecords, stalebutton guard, pause and dash/gravity at30/60/120FPS.');
