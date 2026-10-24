const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const art=require('../assets/config/momo-heavy-art.json');
const close=(actual,expected)=>assert(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);
function target(){
 const h=harness();h.run("enterRealm(0);state='play';var victim=enemies.find(e=>e.kind==='guard');enemies=[victim];victim.hp=20;victim.cd=999;player.x=victim.x-40;player.y=victim.y;player.face=1;");return h;
}
// The two attacks retain their own windup, direction and single-impact latch.
for(const [kind,damage,impact,duration] of [['normal',1.5,.16,.42],['heavy',3.5,.38,.9]]){
 const h=target(),tempo=h.run('WeaponStyles.profile(weaponStyle).tempo');assert(h.run(`melee('${kind}')`));close(h.run('attack'),duration*tempo);
 h.run(`advanceSwordAttack(${impact*tempo-.01});player.face=-1;`);close(h.run('victim.hp'),20);
 assert(!h.run("melee('normal')"),'Cooldown blocks an input from cancelling the windup');
 h.run('advanceSwordAttack(.02)');close(h.run('victim.hp'),20-damage);assert.equal(h.run('attackFace'),1);
 h.run('advanceSwordAttack(.1)');close(h.run('victim.hp'),20-damage);
 const before=h.run('JSON.stringify({attack,attackElapsed,attackCooldown,attackFace,attackKind,victim: victim.hp})');
 h.run('pause()');h.tick(120);assert.equal(h.run('JSON.stringify({attack,attackElapsed,attackCooldown,attackFace,attackKind,victim: victim.hp})'),before);
 h.run('pause();initPlayer(level.start)');assert.equal(h.run('attackKind'),'normal');assert.equal(h.run('attack'),0);
}
// Strength and the earned sword affect both profiles, with no new save stat.
{
 const h=target();close(h.run('playerAttackDamage("normal")'),1.5);close(h.run('playerAttackDamage("heavy")'),3.5);
 h.run('progression.stats.strength=2;defeated[1]=true');close(h.run('playerAttackDamage("normal")'),3);close(h.run('playerAttackDamage("heavy")'),7);
 assert(!h.run('melee("unknown")'));assert.equal(h.run('attack'),0);
}
// Shields and miniboss invulnerability keep their existing combat rules.
{
 const h=harness();h.run("enterRealm(0);state='play';var shield=enemies.find(e=>e.kind==='shield');enemies=[shield];shield.face=-1;player.x=shield.x-40;player.y=shield.y;player.face=1;");
 const hp=h.run('shield.hp');h.run("melee('heavy');advanceSwordAttack(.4)");close(h.run('shield.hp'),hp);assert.equal(h.run('shield.blocks'),1);
 h.run("initPlayer(level.start);var mini=createEnemies().find(e=>e.miniboss);enemies=[mini];mini.active=true;mini.inv=0;player.x=mini.x-40;player.y=mini.y;player.face=1;");
 const miniHp=h.run('mini.hp');h.run("melee('heavy');advanceSwordAttack(.4)");close(h.run('mini.hp'),miniHp-3.5);
}
// Configured native mouse and remapped keyboard inputs share the attack path. Heavy wins
// simultaneous inputs deterministically; repeated inputs cannot shorten it.
{
 const h=target();h.press({action:'attack'});h.press({action:'heavyAttack'});h.tick();h.release({action:'attack'});h.release({action:'heavyAttack'});assert.equal(h.run('attackKind'),'heavy');
 const start=h.run('attackElapsed');h.press({action:'attack'});h.tick();h.release({action:'attack'});assert(h.run('attackElapsed')>start);assert.equal(h.run('attackKind'),'heavy');
 const oldHeavy=h.run("Bindings.read('heavyAttack')[0]");h.run("initPlayer(level.start);Bindings.setPrimary('heavyAttack','r')");h.press(oldHeavy);h.tick();h.release(oldHeavy);assert.equal(h.run('attack'),0);
 h.press('r');h.tick();h.release('r');assert.equal(h.run('attackKind'),'heavy');
 h.run("initPlayer(level.start);Bindings.setPrimary('heavyAttack','mouse2');handleMouseDown({button:2,pointerType:'mouse',target:canvas,preventDefault(){}});");h.tick();h.run('handleMouseUp({button:2,preventDefault(){}})');assert.equal(h.run('attackKind'),'heavy');
}
// Profile timing and movement clocks remain shared in normal/dream play at
// common frame rates, with acquired jump/dash rather than isolated bit checks.
for(const dream of [false,true])for(const fps of [30,60,120])for(const kind of ['normal','heavy']){
 const h=harness();h.run('DevTools.open();DevSession.begin();DevAbilities.acquire({ability:"double-jump"});DevAbilities.acquire({ability:"dash"})');
 if(dream)h.run('DevTeleport.teleport({realm:"dream",rest:"dream"})');h.run('DevTools.close()');
 const button={action:kind==='heavy'?'heavyAttack':'attack'};h.press(button);h.press({action:'dash'});h.press(' ');h.run(`update(${1/fps})`);h.release(button);h.release({action:'dash'});h.release(' ');
 assert.equal(h.run('attackKind'),kind);h.run(`for(let i=0;i<${fps*2};i++)update(${1/fps})`);
 assert(h.run('attack===0&&attackCooldown===0&&dash===0&&dashCooldown===0&&player.onGround'));
 h.press(button);h.run(`update(${1/fps})`);h.release(button);assert(h.run('attack>0'));
}
// Shadow accepts the selected attack's damage while remaining undefeatable.
{
 const h=harness({prologue:true});h.place(3160,720);h.tick(352);h.place(3420,720);h.run('player.face=1;boss.inv=0');
 const hp=h.run('boss.hp');h.run("melee('heavy');advanceSwordAttack(.4)");close(h.run('boss.hp'),hp-3.5);
 h.run('boss.hp=1;boss.inv=0;Prologue.hit(999999)');assert.equal(h.run('boss.hp'),1);assert(!h.run('boss.dead'));
}
// The painted strike reaches its impact pose at the same instant as damage.
// Source-space crops and constant scale keep complete weapons and grounded feet.
{
 const h=harness(),draws=[],moves=[],scales=[];
 const ctx=h.sandbox.document.getElementById('world').getContext('2d');
 ctx.drawImage=(...args)=>draws.push(args);ctx.translate=(...args)=>moves.push(args);ctx.scale=(...args)=>scales.push(args);
 assert.deepEqual(JSON.parse(h.run('JSON.stringify(ART_FRAMES.momoHeavy)')),art.frames);
 close(h.run('SWORD_ATTACKS.heavy.impact'),art.impactAt);close(h.run('SWORD_ATTACKS.heavy.duration'),art.duration);
 for(const [i,pose] of art.frames.entries()){
  assert(pose.x>=0&&pose.y>=0&&pose.x+pose.w<=art.width&&pose.y+pose.h<=art.height);
  assert(pose.anchorX>=pose.x&&pose.anchorX<pose.x+pose.w);assert(pose.anchorY>=pose.y&&pose.anchorY<pose.y+pose.h);
  assert.equal(pose.bodyHeight,art.frames[0].bodyHeight);
  for(const face of [-1,1]){
   draws.length=moves.length=scales.length=0;
   h.run(`Visuals.momoSlash(200,300,96,${pose.start},${face},'heavy')`);
   assert.deepEqual(draws[0].slice(1,5),[pose.x,pose.y,pose.w,pose.h]);
   assert.deepEqual(moves,[[200,300],[-pose.anchorX,-pose.anchorY]]);
   assert.deepEqual(scales,[[face,1],[96/pose.bodyHeight,96/pose.bodyHeight]]);
  }
  if(i)assert.equal(pose.start,art.frames[i-1].end);
 }
 h.run("melee('heavy');advanceSwordAttack(.39);pause()");h.tick(120);
 assert.equal(h.run('attackKind'),'heavy');close(h.run('attackElapsed'),.39);
 h.run("drawPlayer()");assert.deepEqual(draws.at(-1).slice(1,5),[0,512,548,512]);
}
console.log('PASS: normal/heavy balance, windup and single hit, direction/cooldown locks, upgrades, shields/minibosses, keyboard/remap/mouse, pause, registered art phases and dream/dash/jump at30/60/120fps.');
