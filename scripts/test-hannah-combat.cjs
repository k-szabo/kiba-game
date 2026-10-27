/* Final-encounter lifecycle through shared runtime modules and real dt clocks. */
'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
function setup(){
 const h=harness(),r=h.run;
 assert.equal(r('typeof HannahCombat'),'object','The shared harness loads the production controller');
 r("Prologue.stop();HannahEncounter.clear();realm=3;level=zigguratSummit;platforms=level.platforms.map(p=>({...p,dx:0}));flags=levels.map(()=>[]);defeated=levels.map(()=>false);checkpoint={...level.rests[0]};enemies=[];boss={dead:true};bossStarted=false;projectiles=[];particles=[];state='play';initPlayer({x:1400,y:1400});enemies=createEnemies();var hannah=enemies.find(HannahCombat.is);player.inv=999;HannahCombat.update(hannah,.001);");
 assert(r('hannah.active'));return h;
}
function advance(h,seconds,fps=120){
 const frames=Math.round(seconds*fps);
 h.run('for(let n=0;n<'+frames+';n++){if(state===\'play\')updatePlayerTimers('+1/fps+');HannahEncounter.update('+1/fps+');HannahCombat.update(hannah,'+1/fps+');}');
}
function hit(h,amount){return h.run('hannah.inv=0;HannahCombat.hit(hannah,hannah.parts[0],'+amount+');');}
function phase2(h,fps=120){
 hit(h,1e9);assert.equal(h.run('hannah.mode'),'transform');assert.equal(h.run('hannah.hp'),120);assert.equal(h.run('state'),'dialog');
 h.dismiss();advance(h,2.6,fps);
 assert.equal(h.run('hannah.stage'),2);assert.equal(h.run('hannah.hp'),1600);assert.equal(h.run('hannah.gateIndex'),0);
 assert.equal(h.run("platforms.find(p=>p.id==='ziggurat-summit-ground').y"),1080);
 assert.equal(h.run('hannah.baseY+hannah.h'),1080);
}
for(const fps of [30,60,120]){
 const h=setup(),r=h.run;phase2(h,fps);
 assert.equal(hit(h,1e9),640);assert.equal(r('hannah.mode'),'drain');assert.equal(r('hannah.gateIndex'),1);
 advance(h,1,fps);assert(Math.abs(r('hannah.haruHp')-46)<1e-8);assert(Math.abs(r('hannah.hp')-1008)<1e-8,'Drain heals Hannah');
 hit(h,120);assert.equal(r('hannah.mode'),'combat');assert.equal(r('hannah.drainRemaining'),0);
 hit(h,1e9);assert.equal(r('hannah.mode'),'drain');assert.equal(r('hannah.gateIndex'),2);
 advance(h,1,fps);assert(Math.abs(r('hannah.haruHp')-42)<1e-8,'Both windows share one Haru health pool');
 hit(h,120);assert.equal(r('hannah.mode'),'combat');
 hit(h,1e9);assert.equal(r('hannah.mode'),'finisher');assert.equal(r('hannah.hp'),160);assert.equal(r('hannah.gateIndex'),3);
 assert.equal(hit(h,1e9),0,'Ordinary damage cannot finish Hannah');
 h.dismiss();assert(r('HannahEncounter.finisherReady()'));assert(r("flags[3].includes('dawnblade')"));
 assert(r('HannahCombat.finishWithUltimate(hannah)'));const progress=r('JSON.stringify([flags,progression,coins])');
 assert.equal(r('HannahCombat.finishWithUltimate(hannah)'),false);assert.equal(r('JSON.stringify([flags,progression,coins])'),progress,'Completion rewards are idempotent');
 assert(r("flags[3].includes('hannahDefeated')"));
}
// At the next HP floor a drain interruption must wait for the next hit to
// consume the gate, rather than skipping into a second drain during update.
{
 const h=setup(),r=h.run;phase2(h);hit(h,1e9);hit(h,1e9);
 assert.equal(r('hannah.hp'),640);assert.equal(r('hannah.mode'),'combat');assert.equal(r('hannah.gateIndex'),1);
 advance(h,.3);assert.equal(r('hannah.gateIndex'),1);hit(h,1);assert.equal(r('hannah.mode'),'drain');assert.equal(r('hannah.gateIndex'),2);
}
for(const mode of ['pause','dialog','inventory','map','developer']){
 const h=setup(),r=h.run;phase2(h);hit(h,1e9);r('state='+JSON.stringify(mode)+';');
 const before=r('JSON.stringify([hannah,player,projectiles,HannahEncounter.visual()])');
 advance(h,2);assert.equal(r('JSON.stringify([hannah,player,projectiles,HannahEncounter.visual()])'),before,'Drain and shared player clocks freeze in '+mode);
 r('for(let n=0;n<60;n++)update(1/30);');assert.equal(r('JSON.stringify([hannah,player,projectiles,HannahEncounter.visual()])'),before,'The outer loop also freezes in '+mode);
}
for(const fps of [30,60,120]){
 const h=setup(),r=h.run;phase2(h,fps);hit(h,1e9);const token=r('hannah.encounterToken');advance(h,8.1,fps);
 assert.equal(r('state'),'dialog');assert(r('hannah.failurePending'));assert.equal(r('hannah.active'),false);assert.equal(r("flags[3].includes('hannahDefeated')"),false);
 const stopped=r('JSON.stringify([hannah,player,projectiles])');advance(h,2,fps);assert.equal(r('JSON.stringify([hannah,player,projectiles])'),stopped);
 h.dismiss();assert.equal(r("platforms.find(p=>p.id==='ziggurat-summit-ground').y"),1400);assert.equal(r('HannahEncounter.visual().lift'),0);
 assert(r('enemies.find(HannahCombat.is).encounterToken!=='+token));assert.equal(r('enemies.find(HannahCombat.is).stage'),1);assert.equal(r('enemies.find(HannahCombat.is).hp'),1200);assert.equal(r('enemies.find(HannahCombat.is).haruHp'),50);
}
// A second slow drain can exhaust Haru's cumulative health before its own
// timeout, even though the first window was interrupted in time.
{
 const h=setup(),r=h.run;phase2(h);hit(h,1e9);advance(h,6);hit(h,100);hit(h,1e9);advance(h,6.6);
 assert(r('hannah.haruHp<1e-9'));assert(r('hannah.failurePending'));assert.equal(r('state'),'dialog');
}
// Warning snapshots remain captured, and phase two never enters summon.
for(const [cycle,move] of [[0,'combo'],[1,'jump'],[2,'dashReturn'],[3,'summon']]){
 const h=setup(),r=h.run;r('hannah.cycles='+cycle+';hannah.clock=0;');advance(h,1/120);
 assert.equal(r('hannah.move'),move);assert.equal(r('hannah.phase'),'windup');assert(r('hannah.windupDuration>=.8'));
 const locked=r('JSON.stringify([hannah.moveSnapshot,hannah.attackFace,hannah.attackBoxes])');r('player.x=hannah.x+400;');advance(h,.2);
 assert.equal(r('JSON.stringify([hannah.moveSnapshot,hannah.attackFace,hannah.attackBoxes])'),locked);
 if(move==='summon'){
  advance(h,1.1);assert.equal(r('enemies.filter(e=>e.hannahOwner===hannah.encounterToken&&!e.dead).length'),2);
  assert(r('enemies.filter(e=>e.hannahOwner===hannah.encounterToken).every(e=>e.noReward)'));
  const before=r('JSON.stringify([flags,progression,coins,shards])');r('for(const support of enemies.filter(e=>e.hannahOwner===hannah.encounterToken)){support.hp=0;killEnemy(support);}');
  assert.equal(r('JSON.stringify([flags,progression,coins,shards])'),before,'Disposable summons award no progress');
 }
}
{
 const h=setup(),r=h.run;phase2(h);r('hannah.cycles=3;hannah.clock=0;');advance(h,.01);assert.equal(r('hannah.move'),'combo');advance(h,.82);
 assert.equal(r('hannah.echoQueue.length'),1);assert(r('Object.isFrozen(hannah.echoQueue[0].snapshot)'));
 const captured=r('JSON.stringify(hannah.echoQueue[0].snapshot)');r('player.x=hannah.x+450;');advance(h,.15);assert.equal(r('JSON.stringify(hannah.echoQueue[0].snapshot)'),captured);
 assert.equal(r('enemies.filter(e=>e.hannahOwner).length'),0);
}
// Source cleanup must not depend on the current map or remove unrelated work.
{
 const h=setup(),r=h.run;r("var ownedToken=hannah.encounterToken;enemies.push({id:'owned',hannahOwner:ownedToken,dead:false},{id:'other',dead:false});projectiles.push({source:HannahCombat.source(hannah)},{source:'other'});particles.push({hannahOwner:ownedToken},{source:'other'});level=forestCamp;HannahCombat.clear(hannah);");
 assert.equal(r('enemies.some(e=>e.hannahOwner===ownedToken)'),false);assert(r("enemies.some(e=>e.id==='other'&&!e.dead)"));
 assert(r("projectiles.length===1&&projectiles[0].source==='other'"));assert(r("particles.length===1&&particles[0].source==='other'"));
 const stale=r('JSON.stringify(hannah)');advance(h,2);assert.equal(r('JSON.stringify(hannah)'),stale);assert.equal(r('HannahCombat.current(hannah)'),false);
}
// A synchronous fatal strike cannot continue against the replacement player.
{
 const h=setup(),r=h.run;r("hannah.cycles=0;hannah.clock=0;HannahCombat.update(hannah,.01);player.x=hannah.x-80;player.inv=0;var replaced=0;damage=function(){replaced++;player={...player};enemies=[];};");advance(h,1.1);
 assert.equal(r('replaced'),1);assert.equal(r('HannahCombat.current(hannah)'),false);
}
console.log('Hannah combat checks passed: ordered gates, shared drains, pause/retry, captured attacks, owned summons/cleanup, and idempotent completion.');
