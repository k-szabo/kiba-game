const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
function finishStory(h){for(let i=0;h.run("state==='dialog'")&&i<10;i++)h.elements.get('dialogOk').onclick();}
for(const rate of [30,60,120])for(const style of ['katana','naginata','swordShield']){
 const h=harness({prologue:true}),r=h.run;
 assert.equal(r('WeaponSelection.open()'),false,'No choice before awakening');
 assert.equal(r('weaponStyle'),'katana');assert.equal(r('saved.weaponChoicePending'),false);
 r('Prologue.wake()');assert.equal(r('state'),'dialog');assert.equal(r('saved.weaponChoicePending'),true);
 finishStory(h);assert.equal(r('state'),'weaponSelection');assert.equal(r('saved.weaponStyle'),'katana');
 const frozen=r('JSON.stringify([time,player,attack,attackCooldown,dash,dashCooldown,enemies,projectiles])');
 r('keys.add("d");pressed.add("j");for(let i=0;i<'+rate+';i++)update('+1/rate+');');
 assert.equal(r('JSON.stringify([time,player,attack,attackCooldown,dash,dashCooldown,enemies,projectiles])'),frozen,'Choice freezes gameplay at '+rate+' FPS');
 r('WeaponSelection.select('+JSON.stringify(style)+')');
 assert.equal(r('saved.weaponStyle'),'katana','Preview does not commit equipment');
 assert(r('WeaponSelection.confirm()'));assert.equal(r('state'),'play');assert.equal(r('saved.weaponStyle'),style);
 assert.equal(r('saved.weaponChoicePending'),false);assert.equal(r('player.hp'),style==='swordShield'?7:5);
 const writes=r('__saveSnapshots.length');assert.equal(r('WeaponSelection.confirm()'),false,'Stale confirmation cannot equip twice');
 assert.equal(r('__saveSnapshots.length'),writes);
 r('mainMenu();startGame(true)');assert.equal(r('state'),'play');assert.equal(r('weaponStyle'),style);
 r('startGame(false)');assert(r('Prologue.active'));assert.equal(r('weaponStyle'),'katana','Every new dream resets to katana');
}
{
 const h=harness({prologue:true}),r=h.run;r('Prologue.wake()');finishStory(h);
 r("WeaponSelection.select('naginata')");const pending=r('JSON.stringify(saved)');
 assert(r('WeaponSelection.close()'));assert.equal(r('state'),'menu');assert.equal(r('JSON.stringify(saved)'),pending);
 r('startGame(true)');assert.equal(r('state'),'weaponSelection');assert(!r('Prologue.active'));
 assert.equal(r('weaponStyle'),'katana');assert.equal(r("$('dialog').hidden"),true,'Reload resumes choice without replaying the story');
 r('resolutionBlocked=true');assert.equal(r('WeaponSelection.confirm()'),false);assert.equal(r('saved.weaponChoicePending'),true);
 r("resolutionBlocked=false;WeaponSelection.select('swordShield');WeaponSelection.confirm();");
 assert.equal(r('saved.weaponStyle'),'swordShield');assert.equal(r('player.maxHp'),7);
 r('DevTools.open();DevSession.begin();');assert.equal(r('weaponChoicePending'),false);
}
{
 const h=harness({prologue:true}),r=h.run;r('Prologue.wake()');
 const stale=h.elements.get('dialogOk').onclick;r('mainMenu();startGame(false)');stale();
 assert(r('Prologue.active'));assert.equal(r('state'),'play','Abandoned story cannot reopen a choice over a new dream');
}
console.log('PASS: katana-only dream, post-story three-style choice, pause at30/60/120 FPS, preview/confirmation, pending cancel/reload and stale callback isolation.');
