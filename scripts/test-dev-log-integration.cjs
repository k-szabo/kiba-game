'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const h=harness(),r=h.run,events=type=>Array.from(r('DevLog.samples')).filter(e=>e.type===type);
r('DevTools.open();DevSession.begin();DevLog.toggle();DevTools.close()');assert(!r('DevDamage.active'));
r('player.inv=0;damage(1)');assert.equal(events('received').at(-1).values[1],1,'Actual damage reaches the log with damage numbers OFF');
r('DevLog.clear();abilities=[true,true];player.inv=999');
for(const action of ['attack','heavyAttack','jump','dash']){
 r('attack=attackCooldown=dash=dashCooldown=0;player.stun=0;player.onGround=true;jumpBuffer=0');
 h.press({action});h.tick();h.release({action});
 assert(events('action').some(e=>e.values[1]==='binding.action.'+action),'Accepted '+action+' logged through real input');
}
r('DevLog.clear();enterRealm(0);enemies=[];bossStarted=true;boss.phase="wait";boss.clock=0;player.x=boss.x-80;player.y=boss.y;player.inv=999;');
h.tick(180);assert(events('preparing').length);assert(events('attack').length,'Real main-boss update logs committed moves');
r('enterRealm(0);DevLog.clear();globalThis.archer=enemies.find(e=>e.kind==="archer");enemies=[archer];player.x=archer.x+180;player.y=archer.y;archer.windup=.001;archer.cd=99;updateEnemies(.01);globalThis.shot=projectiles[0];archer.kind="renamed";archer.move="anotherMove";shot.x=player.x+20;shot.y=player.y+30;shot.vx=shot.vy=0;player.inv=0;player.hp=player.maxHp;');
h.tick();const hit=events('damage').find(e=>e.values[1]==='Momo');assert(hit);assert(String(hit.values[0]).includes('archer'),'Delayed impact retains emission-time archer identity');assert(!String(hit.values[0]).includes('anotherMove'));
r('DevLog.clear();CampQuest.enter("zigguratSummit");globalThis.hannah=enemies.find(HannahCombat.is);hannah.active=true;hannah.mode="drain";hannah.phase="drain";hannah.move="obsoleteMove";DevLog.scope(hannah,()=>{});DevLog.scope(hannah,()=>{});');
assert.equal(events('attack').filter(e=>e.values[1]==='drain').length,1,'Custom life-drain phase is logged once with its own ability ID');
r('pause()');const before=r('JSON.stringify(DevLog.samples)');h.tick(120);assert.equal(r('JSON.stringify(DevLog.samples)'),before,'Paused simulation creates no combat log');
r('DevSession.end()');assert.equal(r('DevLog.samples.length'),0);assert(!r('DevLog.active'));
console.log('PASS: real input, main/miniboss dispatch, custom drain phase and delayed projectile damage reach an isolated live log independently of damage numbers.');
