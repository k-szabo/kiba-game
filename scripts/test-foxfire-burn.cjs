'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
function setup(){const h=harness();h.run('enemies=[createEnemy({id:"burn-target",kind:"guard",x:700,y:960,patrol:200})];var foe=enemies[0];foe.hp=foe.maxHp=50;initPlayer({x:640,y:960});player.face=attackFace=1;weaponStyle="foxfireKatana";resolveMeleeHit();');return h;}
for(const fps of [30,60,120]){
 const h=setup(),r=h.run;assert.equal(r('Foxfire.count'),1);const hp=r('foe.hp');
 r('state="pause";Foxfire.update(10)');assert.equal(r('foe.hp'),hp);r('state="play"');
 r(`for(let i=0;i<${fps*3};i++)Foxfire.update(1/${fps})`);assert(Math.abs(r('foe.hp')-(hp-3))<1e-7,'Exactly three base damage ticks at '+fps+' FPS');assert.equal(r('Foxfire.count'),0);
}
{
 const h=setup(),r=h.run;r('Foxfire.update(1.5);foe.inv=0;resolveMeleeHit()');assert.equal(r('Foxfire.count'),1,'Hits refresh one burn instead of stacking');const hp=r('foe.hp');r('Foxfire.update(.5)');assert.equal(r('foe.hp'),hp-1,'Refreshing does not defer the next tick');r('Foxfire.update(2.5)');assert.equal(r('foe.hp'),hp-3);assert.equal(r('Foxfire.count'),0);
 r('foe.hp=1;foe.dead=false;foe.inv=0;var before=Foxfire.snapshot();foe.hp=.5;Foxfire.capture(before);Foxfire.update(1)');assert(r('foe.dead'),'Damage-over-time runs the ordinary defeat handler');
}
{
 const h=setup(),r=h.run;r('var before=foe.hp;initPlayer({x:640,y:960});Foxfire.update(1)');assert.equal(r('foe.hp'),r('before'));assert.equal(r('Foxfire.count'),0,'A fresh player/retry cannot inherit old burns');
 r('foe.hp=50;foe.kind="shield";foe.face=-1;foe.guardBreak=foe.recovery=0;foe.inv=0;resolveMeleeHit()');assert.equal(r('Foxfire.count'),0,'A blocked sword strike cannot ignite');
 r('foe.kind="guard";weaponStyle="katana";resolveMeleeHit()');assert.equal(r('Foxfire.count'),0,'Ordinary weapons do not ignite');
 r('weaponStyle="foxfireKatana";foe.inv=0;resolveMeleeHit({amount:1,kind:"heavy",hit:foe})');assert.equal(r('Foxfire.count'),0,'The ultimate is not an extra relic sword hit');
 r('resolveMeleeHit();var prior=foe.hp;enemies=[];Foxfire.update(1)');assert.equal(r('foe.hp'),r('prior'));assert.equal(r('Foxfire.count'),0,'Removed actors cannot be hit later');
}
console.log('PASS: Foxfire actual-hit ignition, three timed damage ticks, refresh without stacking, pause, defeat, shield rejection, weapon/ultimate isolation and retry/removal cleanup.');
