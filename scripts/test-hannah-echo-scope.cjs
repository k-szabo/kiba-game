'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
function setup(stage,move){
 const h=harness(),r=h.run;
 r("Prologue.stop();HannahEncounter.clear();realm=3;level=zigguratSummit;platforms=level.platforms.map(p=>({...p,dx:0}));flags=levels.map(()=>[]);defeated=levels.map(()=>false);enemies=[];boss={dead:true};state='play';initPlayer({x:1400,y:1400});enemies=createEnemies();var hannah=enemies.find(HannahCombat.is);player.inv=999;HannahCombat.update(hannah,.001);");
 r(`hannah.stage=${stage};hannah.cycles=HannahRules.tuning.combat.phase${stage}Pattern.indexOf('${move}');hannah.clock=0;HannahCombat.update(hannah,.001);`);
 assert.equal(r('hannah.move'),move);
 r('HannahCombat.update(hannah,hannah.windupDuration+.001)');assert.equal(r('hannah.phase'),'strike');return h;
}
for(const stage of [1,2])for(const move of ['combo','jump','dashReturn','crossCombo','riftBurst']){
 const h=setup(stage,move),r=h.run,expected=stage===2&&['jump','dashReturn'].includes(move)?1:0;
 assert.equal(r('hannah.echoQueue.length'),expected,`Only phase2 dash/jump get echoes: ${stage}/${move}`);
 if(expected){
  assert(r('Object.isFrozen(hannah.echoQueue[0].snapshot)'));const captured=r('JSON.stringify(hannah.echoQueue[0].snapshot)');
  r('player.x+=200;HannahCombat.update(hannah,.1)');assert.equal(r('JSON.stringify(hannah.echoQueue[0].snapshot)'),captured);
 }
}
// A stale queued ordinary swing must never survive the eligibility filter and
// deal delayed damage after the restricted moveset has been selected.
{
 const h=setup(2,'jump'),r=h.run;
 r("var echo=hannah.echoQueue[0];echo.snapshot=Object.freeze({...echo.snapshot,move:'combo'});echo.delay=0;hannah.phase='recover';hannah.clock=99;player.x=hannah.x-100;player.y=hannah.arena.y-player.h;player.hp=player.maxHp=100;player.inv=0;HannahCombat.update(hannah,.1)");
 assert.equal(r('player.hp'),100);assert.equal(r('hannah.echoQueue.length'),0);
}
console.log('PASS: phase2 echoes limited to captured dash/jump attacks; regular slash/combo/rift and stale forbidden echoes cannot replay.');
