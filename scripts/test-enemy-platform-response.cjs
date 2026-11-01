'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
// Actual reported Japan road-10 shield and the authored bamboo platform.
{
 const h=harness(),r=h.run;
 r("var e=enemies.find(e=>e.id==='road-10'),ledge=platforms.find(p=>p.id==='bamboo-bridge');enemies=[e];player.x=ledge.x+40;player.y=ledge.y-player.h;player.inv=999;e.x=e.patrolLeft;e.face=-1;e.patrolFace=-1;e.turnCooldown=0;e.cd=0;var positions=[];for(let n=0;n<720;n++){updateEnemies(1/120);positions.push(e.x);}");
 assert(r('Math.max(...positions)-Math.min(...positions)>30'),'The shield below the bamboo bridge must keep patrolling instead of staying clamped at its left edge');
 assert(r('e.x>=e.patrolLeft&&e.x<=e.patrolRight'),'No navigation teleport or fall off the authored span');
}
// All four realm factions and ground roles; elevated, out-of-reach melee
// targets are not a reason to attempt repeated empty swings or freeze patrol.
for(const realm of [0,1,2,3])for(const role of ['guard','shield','archer','mage'])for(const fps of [30,60,120]){
 const h=harness(),r=h.run;
 r(`enterRealm(${realm});state='play';var e=enemies.find(e=>!e.miniboss&&e.kind==='${role}');enemies=[e];e.x=e.patrolLeft;e.face=-1;e.patrolFace=-1;e.turnCooldown=0;e.cd=0;e.windup=0;e.recovery=0;e.attackTime=0;player.x=e.patrolLeft-200;player.y=e.y-145;player.inv=999;projectiles=[];var turns=0,oldFace=e.face,windups=0,positions=[];`);
 for(let i=0;i<fps*8;i++)r(`updateEnemies(${1/fps});positions.push(e.x);if(e.face!==oldFace)turns++;oldFace=e.face;if(e.windup>0)windups++;`);
 if(role==='guard'||role==='shield'){
  assert(r('Math.max(...positions)-Math.min(...positions)>10'),`${realm}/${role}/${fps} responds to unreachable elevation`);
  assert.equal(r('windups'),0,'Melee cannot swing at a player outside its actual vertical reach');
  assert(r('turns<16'),'Patrol does not regress into rapid spinning');
 }else assert(r('projectiles.length>0'),`${realm}/${role} keeps aiming at an elevated player`);
 assert(r('e.x>=e.patrolLeft&&e.x<=e.patrolRight'));
 if(role==='guard'||role==='shield'){
  r('player.x=e.x+80;player.y=e.y; e.cd=0;e.turnCooldown=0;e.edgePause=0;e.recovery=0;e.attackTime=0;e.face=1;updateEnemies(.01)');
  assert(r('e.windup>0'),'A reachable same-height target still starts an attack');
 }
 r("state='pause';var paused=JSON.stringify(e);for(let n=0;n<60;n++)update(1/60)");assert.equal(r('JSON.stringify(e)'),r('paused'),'Pause freezes enemy response');
}
console.log('PASS: actual pre-boss shield/platform repro and all realm ground roles at30/60/120fps; reachable attacks, ranged aiming, patrol bounds and pause preserved.');
