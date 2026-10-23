const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
for(const style of ['katana','naginata','swordShield']){
 const h=harness({prologue:true});
 assert.equal(h.run('weaponStyle'),'katana');assert(h.run('Prologue.active'));
 assert.equal(h.run('player.maxHp'),5);assert.equal(h.run('saved.weaponStyle'),'katana');
 h.run('mainMenu();startGame(true)');assert.equal(h.run('weaponStyle'),'katana');
 h.run('Prologue.wake()');
 for(let i=0;h.run("state==='dialog'")&&i<10;i++)h.elements.get('dialogOk').onclick();
 assert.equal(h.run('state'),'weaponSelection');
 h.run("WeaponSelection.select('STYLE');WeaponSelection.confirm()".replace('STYLE',style));
 assert.equal(h.run('weaponStyle'),style);assert.equal(h.run('saved.weaponStyle'),style);
 assert.equal(h.run('player.maxHp'),style==='swordShield'?7:5);
 assert.equal(h.run('player.hp'),h.run('player.maxHp'));assert.equal(h.run('weaponChoicePending'),false);
 h.run('revive()');assert.equal(h.run('weaponStyle'),style);
 h.run('enterRealm(1);state="play";persist()');assert.equal(h.run('saved.weaponStyle'),style);
 h.run('mainMenu()');const saved=h.run('JSON.stringify(saved)'),writes=h.run('window.__saveSnapshots.length');
 assert(h.run('DevTools.open()&&DevSession.begin()'));assert.equal(h.run('weaponStyle'),style);
 h.run("weaponStyle='naginata';persist();DevSession.end()");
 assert.equal(h.run('JSON.stringify(saved)'),saved);assert.equal(h.run('window.__saveSnapshots.length'),writes);
 h.run('startGame(true)');assert.equal(h.run('weaponStyle'),style);
 h.run('startGame(false)');assert.equal(h.run('weaponStyle'),'katana');
}
// Shield blocks frontal attacks only, never lava, and recovers on the common clock.
{
 const h=harness();h.run("weaponStyle='swordShield';initPlayer(level.start);player.inv=0;player.face=1;player.onGround=true;damage(1,-1,true)");
 assert.equal(h.run('player.hp'),7);assert.equal(h.run('player.guardCooldown'),2);
 h.run('pause()');h.tick(120);assert.equal(h.run('player.guardCooldown'),2);
 h.run('pause();updatePlayerTimers(2);damage(1,-1,false)');assert.equal(h.run('player.hp'),6);
 h.run("initPlayer(level.start);player.inv=0;player.face=1;player.onGround=true;melee();damage(1,-1,true)");assert.equal(h.run('player.hp'),6);
}
// Reach and damage affect the actual single-impact combat path in either direction.
for(const face of [-1,1])for(const style of ['katana','naginata','swordShield']){
 const h=harness();h.run(`weaponStyle='${style}';initPlayer(level.start);player.face=${face};var victim=enemies.find(e=>e.kind==='guard');enemies=[victim];victim.hp=20;victim.x=player.x+${face>0?160:-160};victim.y=player.y;victim.stun=0;`);
 h.run("melee('heavy');advanceSwordAttack(playerAttackProfile().impact+.001)");
 near(h.run('victim.hp'),style==='naginata'?20-4.375:20);
 const after=h.run('victim.hp');h.run('advanceSwordAttack(.1)');near(h.run('victim.hp'),after);
}
console.log('PASS: starter choice persists across dream/wake/death/travel, dev isolation, fresh-run reset, live reach/damage and shield pause/hazard rules.');
