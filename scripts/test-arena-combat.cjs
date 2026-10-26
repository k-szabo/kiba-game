'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
function setup(type='arenaCaptain'){
 const h=harness(),r=h.run;
 r("Prologue.stop();realm=3;level=makeLevel('shadowArena',2900,2100,{x:250,y:1700});level.arena={x:600,y:1700,w:1700,restId:'testArena'};ledge(level,'test-floor',0,1700,2900,'ground',400);rest(level,'testArena',250,1700,'arena.name');platforms=level.platforms.map(p=>({...p}));checkpoint={...level.rests[0]};state='play';flags=levels.map(()=>[]);defeated=levels.map(()=>false);boss={dead:true};bossStarted=false;projectiles=[];updateHUD=function(){};");
 r('initPlayer({x:1650,y:1700});enemies=[ArenaCombat.create({id:'+JSON.stringify(type)+',miniboss:'+JSON.stringify(type)+",x:1750,y:1700})];var arenaEnemy=enemies[0];player.inv=999;arenaEnemy.active=true;");return h;
}
const advance=(h,seconds,fps=120)=>h.run('for(let n=0;n<'+Math.ceil(seconds*fps)+';n++)ArenaCombat.update(arenaEnemy,'+1/fps+');');
for(const fps of [30,60,120]){
 const h=setup(),r=h.run;r('arenaEnemy.clock=0;player.inv=0;');advance(h,1/fps,fps);assert.equal(r('arenaEnemy.phase'),'windup');assert.equal(r('arenaEnemy.move'),'captainCleave');
 const lock=r('JSON.stringify([arenaEnemy.x,arenaEnemy.attackFace,arenaEnemy.targetX,arenaEnemy.targetY,arenaEnemy.attackBoxes])');advance(h,.7,fps);assert.equal(r('player.hp'),5,'No damage before the authored tell');
 r('player.x=arenaEnemy.x+arenaEnemy.w+200;');advance(h,.05,fps);assert.equal(r('JSON.stringify([arenaEnemy.x,arenaEnemy.attackFace,arenaEnemy.targetX,arenaEnemy.targetY,arenaEnemy.attackBoxes])'),lock,'Aim and warning stay locked');advance(h,.4,fps);assert.equal(r('player.hp'),5,'Leaving the warning dodges damage');
 const strike=setup();strike.run('arenaEnemy.clock=0;player.inv=0;');advance(strike,1.1,fps);assert.equal(strike.run('player.hp'),3,'Committed captain cleave deals2 only after the tell');
}
for(const type of ['arenaCaptain','arenaSerpent','arenaCyclops','arenaFia'])for(const mode of ['pause','dialog','inventory','developer','map']){
 const h=setup(type),r=h.run;r("arenaEnemy.clock=0;ArenaCombat.update(arenaEnemy,.01);state='"+mode+"';");const before=r('JSON.stringify([arenaEnemy,player,projectiles])');advance(h,2);assert.equal(r('JSON.stringify([arenaEnemy,player,projectiles])'),before,type+' freezes in '+mode);
}
for(const fps of [30,60,120]){
 const h=setup('arenaFia'),r=h.run;assert.equal(r('arenaEnemy.hp'),1);assert(r('ArenaCombat.protects(arenaEnemy)'));assert(r('arenaEnemy.y<arenaEnemy.baseY-150'));
 r('var immuneBox={x:arenaEnemy.x-10,y:arenaEnemy.y-20,w:120,h:200};');assert.equal(r('ArenaCombat.hit(arenaEnemy,immuneBox,999,"heavy")'),0);assert.equal(r('arenaEnemy.hp'),1);
 r('arenaEnemy.hp=0;');assert.equal(r('ArenaCombat.defeat(arenaEnemy)'),false);assert.equal(r('arenaEnemy.hp'),1,'Forced defeat cannot skip immunity');
 advance(h,89,fps);assert(r('arenaEnemy.immuneRemaining>0&&arenaEnemy.phase!=="exhausted"'));
 r("projectiles.push({source:ArenaCombat.source(arenaEnemy),life:5},{source:'unrelated',life:5});");advance(h,1,fps);assert.equal(r('arenaEnemy.phase'),'fall');assert.equal(r('arenaEnemy.immuneRemaining'),0);assert(r('ArenaCombat.protects(arenaEnemy)'));
 assert(!r('projectiles.some(p=>p.source===ArenaCombat.source(arenaEnemy))'));assert(r("projectiles.some(p=>p.source==='unrelated')"));
 advance(h,.81,fps);assert.equal(r('arenaEnemy.phase'),'exhausted');assert.equal(r('arenaEnemy.y'),r('arenaEnemy.baseY'));assert.equal(r('arenaEnemy.hp'),1);assert(!r('ArenaCombat.protects(arenaEnemy)'));
 const clock=r('JSON.stringify([arenaEnemy.phase,arenaEnemy.immuneRemaining,arenaEnemy.y,arenaEnemy.move,arenaEnemy.hazards,projectiles])');advance(h,4,fps);assert.equal(r('JSON.stringify([arenaEnemy.phase,arenaEnemy.immuneRemaining,arenaEnemy.y,arenaEnemy.move,arenaEnemy.hazards,projectiles])'),clock,'The five-second final-hit window starts no new attacks');
 r('arenaEnemy.hp=0;');assert(r('ArenaCombat.defeat(arenaEnemy)'));assert(r('arenaEnemy.spared&&arenaEnemy.dead&&arenaEnemy.phase==="spared"'));assert(!r('ArenaCombat.defeat(arenaEnemy)'),'Fia yields exactly once rather than dying/rewarding twice');
}
{
 const h=setup('arenaCyclops'),r=h.run;assert.equal(r('arenaEnemy.parts.length'),2);assert.equal(r('enemies.length'),1);const hp=r('arenaEnemy.hp');
 assert.equal(r('ArenaCombat.hit(arenaEnemy,{x:arenaEnemy.x+150,y:arenaEnemy.y,w:80,h:180},40,"heavy")'),0,'The empty space between guards is not a body');assert.equal(r('arenaEnemy.hp'),hp);
 assert.equal(r('ArenaCombat.hit(arenaEnemy,{x:arenaEnemy.x-10,y:arenaEnemy.y,w:420,h:180},40,"heavy")'),40,'One swing spanning both bodies deals one shared hit');assert.equal(r('arenaEnemy.hp'),hp-40);
 assert.equal(r('ArenaCombat.hit(arenaEnemy,{x:arenaEnemy.x-10,y:arenaEnemy.y,w:420,h:180},40,"heavy")'),0,'Shared invulnerability prevents duplicate body damage');
 r('arenaEnemy.inv=0;');assert.equal(r('ArenaCombat.hit(arenaEnemy,arenaEnemy.parts[1],10,"heavy")'),10);assert.equal(r('arenaEnemy.hp'),hp-50,'Both bodies use the same health pool');
 const block=setup('arenaCyclops');for(let i=0;i<3;i++)assert.equal(block.run('ArenaCombat.hit(arenaEnemy,arenaEnemy.parts[0],10,"normal")'),0);assert(block.run('arenaEnemy.guardBreak>0'));assert.equal(block.run('ArenaCombat.hit(arenaEnemy,arenaEnemy.parts[0],10,"normal")'),10,'A broken shared guard is vulnerable');
}
for(const [type,cycle,expected]of [['arenaCaptain',2,3],['arenaSerpent',1,6],['arenaFia',0,5]]){
 const h=setup(type),r=h.run;r('arenaEnemy.cycles='+cycle+';arenaEnemy.clock=0;');advance(h,.01);const tell=r('arenaEnemy.windupDuration');assert(tell>=.7);assert.equal(r('projectiles.length'),0);advance(h,tell+.02);assert.equal(r('projectiles.length'),expected);assert(r('projectiles.every(p=>p.source===ArenaCombat.source(arenaEnemy)&&p.damage===1)'),'All bolts are source-scoped and damage-valued');
}
{
 const h=setup('arenaSerpent'),r=h.run;r('arenaEnemy.cycles=2;arenaEnemy.clock=0;');advance(h,.01);assert.equal(r('arenaEnemy.hazards.length'),3);assert(r('arenaEnemy.hazards.every(h=>h.y+h.h===arenaEnemy.arena.y&&h.warning>=1.2&&h.w===95)'));
 const gaps=r('arenaEnemy.hazards.map(h=>h.x).sort((a,b)=>a-b)');assert(gaps[1]-gaps[0]>95&&gaps[2]-gaps[1]>95,'Ground ruptures leave real escape gaps');
}
{
 const h=setup(),r=h.run;r("arenaEnemy.clock=0;ArenaCombat.update(arenaEnemy,.01);projectiles=[{source:ArenaCombat.source(arenaEnemy)},{source:'other'}];");const stale=r('JSON.stringify(arenaEnemy)');r('enemies=[];');advance(h,2);assert.equal(r('JSON.stringify(arenaEnemy)'),stale);assert.equal(r('ArenaCombat.defeat(arenaEnemy)'),false);
 const fatal=setup();fatal.run('arenaEnemy.clock=0;ArenaCombat.update(arenaEnemy,.01);damage=function(){player={...player};enemies=[];};');advance(fatal,1);assert.equal(fatal.run('arenaEnemy.phase'),'strike');assert.equal(fatal.run('arenaEnemy.attackElapsed'),0,'A synchronous death/respawn ends the stale release immediately');
 const clean=setup(),c=clean.run;c("projectiles=[{source:ArenaCombat.source(arenaEnemy)},{source:'other'}];arenaEnemy.hp=0;");const progress=c('JSON.stringify([flags,progression,coins])');assert(c('ArenaCombat.defeat(arenaEnemy)'));assert.equal(c('JSON.stringify([flags,progression,coins])'),progress,'Combat controller never owns rewards');assert(c("projectiles.length===1&&projectiles[0].source==='other'"));
}
// Once integrated, actual key/mouse sword dispatch must enforce the same immunity.
{
 const h=setup('arenaFia'),r=h.run;r('player.x=arenaEnemy.x-30;player.y=arenaEnemy.y;player.face=1;');h.press({action:'heavyAttack'});r('input(1/120);pressed.clear();for(let n=0;n<60;n++){updatePlayerTimers(1/120);advanceSwordAttack(1/120);}');h.release({action:'heavyAttack'});assert(r('attackHit'),'The actual heavy input reaches its impact');assert.equal(r('arenaEnemy.hp'),1,'Actual heavy attack cannot bypass Fia immunity');
}
console.log('PASS: source-scoped arena bosses, locked fair warnings, pause/death guards,90-second Fia immunity/fall/exhaustion, two real cyclops bodies with one HP/reward and pure reward handoff.');
