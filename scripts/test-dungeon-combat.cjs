'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const types=['dungeonCaptain','dungeonNecromancer','dungeonCouncil'];
function setup(type='dungeonCaptain'){
 const h=harness(),r=h.run,index=types.indexOf(type);
 r("Prologue.stop();realm=1;level=makeLevel('testDungeon',2900,2100,{x:250,y:1700});level.dungeon={id:'yomiFall',floor:"+index+"};level.arena={x:600,y:1700,w:1700,restId:'testDungeon'};ledge(level,'test-floor',0,1700,2900,'ground',400);rest(level,'testDungeon',250,1700,'dungeon.name');platforms=level.platforms.map(p=>({...p}));checkpoint={...level.rests[0]};flags=levels.map(()=>[]);state='play';boss={dead:true};bossStarted=false;projectiles=[];updateHUD=function(){};");
 r('initPlayer({x:1650,y:1700});enemies=[DungeonCombat.create({id:'+JSON.stringify(type)+',miniboss:'+JSON.stringify(type)+",x:1750,y:1700})];var dungeonEnemy=enemies[0];player.inv=999;dungeonEnemy.active=true;");
 return h;
}
const advance=(h,seconds,fps=120)=>h.run('for(let n=0;n<'+Math.ceil(seconds*fps)+';n++)DungeonCombat.update(dungeonEnemy,'+1/fps+');');
for(const [i,type]of types.entries()){
 const h=setup(type),r=h.run;
 assert.equal(r('dungeonEnemy.hp'),[220,280,400][i]);assert.equal(r('DungeonCombat.parts(dungeonEnemy).length'),1);
 r('flags[1].push("dungeonStage'+(i+1)+'Clear");var completed=DungeonCombat.create({id:"completed",miniboss:'+JSON.stringify(type)+',x:1750,y:1700});');
 assert(r('completed.dead&&completed.hp===0'),'A completed run stage does not respawn its boss');
 assert(r('!DungeonCombat.create({id:"replay",replay:true,miniboss:'+JSON.stringify(type)+',x:1750,y:1700}).dead'),'An explicit developer replay creates a fresh transient encounter');
 r('DungeonCombat.reset(completed);');assert(r('!completed.dead&&completed.hp===completed.maxHp&&!completed.active'),'Reset revives only its given transient enemy');
 for(const mode of ['pause','dialog','inventory','developer','map','dungeonMenu']){
  r('state='+JSON.stringify(mode));const before=r('JSON.stringify([dungeonEnemy,player,projectiles])');advance(h,2);
  assert.equal(r('JSON.stringify([dungeonEnemy,player,projectiles])'),before,type+' freezes in '+mode);
 }
}
for(const fps of [30,60,120]){
 const h=setup(),r=h.run;r('dungeonEnemy.clock=0;player.inv=0;');advance(h,1/fps,fps);
 assert.equal(r('dungeonEnemy.phase'),'windup');assert.equal(r('dungeonEnemy.move'),'captainReach');
 const locked=r('JSON.stringify([dungeonEnemy.x,dungeonEnemy.attackFace,dungeonEnemy.targetX,dungeonEnemy.targetY,dungeonEnemy.attackBoxes])');
 advance(h,.7,fps);assert.equal(r('player.hp'),5,'Naginata cannot deal contact or early windup damage');r('player.x=dungeonEnemy.x+dungeonEnemy.w+350;');advance(h,.05,fps);
 assert.equal(r('JSON.stringify([dungeonEnemy.x,dungeonEnemy.attackFace,dungeonEnemy.targetX,dungeonEnemy.targetY,dungeonEnemy.attackBoxes])'),locked,'Windup never tracks a dodge');advance(h,.6,fps);assert.equal(r('player.hp'),5);
 const strike=setup();strike.run('dungeonEnemy.clock=0;player.inv=0;');advance(strike,1.2,fps);assert.equal(strike.run('player.hp'),3,'Naginata deals2 after the complete tell');
 const leap=setup(),l=leap.run;l('dungeonEnemy.cycles=2;dungeonEnemy.clock=0;player.x=1450;');advance(leap,.01,fps);
 const warning=l('JSON.stringify(dungeonEnemy.attackBoxes)'),end=l('dungeonEnemy.travelEnd');assert(l('dungeonEnemy.windupDuration>=1.2'));advance(leap,1.25,fps);assert(l('dungeonEnemy.y<dungeonEnemy.baseY'),'Leap rises above the floor');
 assert.equal(l('JSON.stringify(dungeonEnemy.attackBoxes)'),warning,'Landing is committed to the warned region');advance(leap,1,fps);assert.equal(l('dungeonEnemy.y'),l('dungeonEnemy.baseY'));assert.equal(l('dungeonEnemy.x'),end,'Captain lands at its bounded locked endpoint');
}
for(const [type,cycle,count]of [['dungeonNecromancer',0,3],['dungeonCouncil',2,6]]){
 const h=setup(type),r=h.run;r('dungeonEnemy.cycles='+cycle+';dungeonEnemy.clock=0;');advance(h,.01);const tell=r('dungeonEnemy.windupDuration');assert(tell>=.8);assert.equal(r('projectiles.length'),0);advance(h,tell+.02);
 assert.equal(r('projectiles.length'),count);assert(r('projectiles.every(p=>p.source===DungeonCombat.source(dungeonEnemy)&&p.damage===2&&p.life>0)'),'Bolts have explicit source, damage and finite lifetime');
}
for(const [type,cycle,count]of [['dungeonNecromancer',1,3],['dungeonCouncil',1,4]]){
 const h=setup(type),r=h.run;r('dungeonEnemy.cycles='+cycle+';dungeonEnemy.clock=0;');advance(h,.01);assert.equal(r('dungeonEnemy.hazards.length'),count);
 assert(r('dungeonEnemy.hazards.every(h=>h.y+h.h===dungeonEnemy.arena.y&&h.warning>=1.2&&h.damage===2)'));
 const boxes=r('dungeonEnemy.hazards.map(h=>({x:h.x,w:h.w})).sort((a,b)=>a.x-b.x)');for(let i=1;i<boxes.length;i++)assert(boxes[i].x-boxes[i-1].x-boxes[i-1].w>=80,'Sigils leave usable floor gaps');
 r('DungeonCombat.reset(dungeonEnemy);dungeonEnemy.active=true;player.x=dungeonEnemy.arena.x;dungeonEnemy.cycles=1;dungeonEnemy.clock=0;');advance(h,.01);
 assert(r('dungeonEnemy.hazards.every((h,i,a)=>a.every((other,j)=>i===j||Math.abs(h.x-other.x)>=h.w+35))'),'Edge-clamped sigils cannot collapse into duplicate traps');
}
{
 const h=setup('dungeonNecromancer'),r=h.run;r('dungeonEnemy.cycles=2;dungeonEnemy.clock=0;');advance(h,.01);assert.equal(r('dungeonEnemy.summons.length'),2);assert(r('dungeonEnemy.summons.every(s=>s.warningDuration===1.4&&s.warning>1.38)'));
 advance(h,1.45);assert.equal(r('dungeonEnemy.summons.length'),0);r('DungeonRun.update(.81);');assert.equal(r('enemies.filter(e=>e.dungeonSummon&&!e.dead).length'),2,'Summon release delegates two visible delayed portals to the run controller');assert(r('enemies.filter(e=>e.dungeonSummon).every(e=>e.raisedSamurai&&e.noReward)'));
}
{
 const h=setup('dungeonCouncil'),r=h.run;r('dungeonEnemy.clock=0;player.inv=0;player.x=dungeonEnemy.x-80;');advance(h,1.4);assert.equal(r('player.hp'),2,'The fused council heavy arm sweep deals3');assert.equal(r('dungeonEnemy.attackBoxes.length'),2,'Four councilors form one boss with two timed arm boxes, one HP pool');
}
for(const type of types){
 const h=setup(type),r=h.run;r('dungeonEnemy.clock=0;DungeonCombat.update(dungeonEnemy,.01);projectiles=[{source:DungeonCombat.source(dungeonEnemy)},{source:"other"}];');
 const before=r('JSON.stringify(dungeonEnemy)');r('enemies=[];');advance(h,2);assert.equal(r('JSON.stringify(dungeonEnemy)'),before);assert.equal(r('DungeonCombat.hit(dungeonEnemy,dungeonEnemy,50,"heavy")'),0);assert.equal(r('DungeonCombat.defeat(dungeonEnemy)'),false,'Removed identity cannot damage, update or complete');
 const clean=setup(type),c=clean.run;c('projectiles=[{source:DungeonCombat.source(dungeonEnemy)},{source:"other"}];dungeonEnemy.hp=0;dungeonEnemy.replay=true;');const progress=c('JSON.stringify([flags,progression,coins])');assert(c('DungeonCombat.defeat(dungeonEnemy)'));assert.equal(c('JSON.stringify([flags,progression,coins])'),progress,'Dev replay cannot grant completion or rewards');assert(c('projectiles.length===1&&projectiles[0].source==="other"'));assert(!c('DungeonCombat.defeat(dungeonEnemy)'),'Death is idempotent');
}
{
 const h=setup(),r=h.run;r('dungeonEnemy.clock=0;DungeonCombat.update(dungeonEnemy,.01);damage=function(){player={...player};enemies=[];};');advance(h,1.1);assert.equal(r('dungeonEnemy.phase'),'strike');assert.equal(r('dungeonEnemy.attackElapsed'),0,'Death/respawn replacement immediately stops the old release');
 const hit=setup(),x=hit.run;x('player.x=dungeonEnemy.x-30;player.face=1;');const hp=x('dungeonEnemy.hp');hit.press({action:'heavyAttack'});x('input(1/120);pressed.clear();for(let n=0;n<60;n++){updatePlayerTimers(1/120);advanceSwordAttack(1/120);}');hit.release({action:'heavyAttack'});assert(x('dungeonEnemy.hp')<hp,'The actual remapped heavy input routes through the dungeon controller');
}
console.log('PASS:3 dungeon boss profiles, committed tells, bounded leaps, fair sigil gaps, samurai summon portals, pause/death identity safety and reward-free developer replays.');
