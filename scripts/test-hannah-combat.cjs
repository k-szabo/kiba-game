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
 h.dismiss();r('HannahEncounter.update(3.7)');h.dismiss();assert(r('HannahEncounter.finisherReady()')); assert(r("flags[3].includes('dawnblade')"));
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
 const h=setup(),r=h.run;phase2(h);r('hannah.cycles=3;hannah.clock=0;');advance(h,.01);assert.equal(r('hannah.move'),'crossCombo');advance(h,.82);
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
// A held player can be struck by both legs without deleting global i-frames.
// The return waits for the longest protection from the outbound contact.
for(const fps of [30,60,120])for(const spirit of [0,12]){
 const h=setup(),r=h.run;r('progression.stats.spirit='+spirit+';player.x=hannah.x-100;player.y=hannah.arena.y-player.h;player.hp=player.maxHp=100;player.inv=0;hannah.cycles=2;hannah.clock=0;');advance(h,1/fps,fps);
 assert.equal(r('hannah.move'),'dashReturn');const duration=r('hannah.moveSnapshot.duration');
 advance(h,r('hannah.windupDuration')+duration+.04,fps);
 assert.equal(r('player.hp'),94,'Both dash directions land at '+fps+' FPS, spirit '+spirit);
 assert.deepEqual(Array.from(r('hannah.strikeHits')),[true,true]);
}
// An immune overlap does not consume the return hit before an accepted contact.
{
 const h=setup(),r=h.run;r('hannah.cycles=2;hannah.clock=0;player.x=hannah.x-100;player.hp=player.maxHp=100;player.inv=999;');advance(h,.01);
 advance(h,r('hannah.windupDuration')+.44+.1);assert.equal(r('hannah.strikeHits[0]'),undefined);
 r('player.inv=0;');advance(h,r('hannah.moveSnapshot.duration')-.44);
 assert.equal(r('player.hp'),97);assert.equal(r('hannah.strikeHits[1]'),true);
}
// A fully absorbed contact counts as accepted even when HP does not change.
{
 const h=setup(),r=h.run;r("flags[3].push('kibaShield');progression.stats.shield=12;FiaConflict.resetPlayer();player.x=hannah.x-100;player.y=hannah.arena.y-player.h;player.hp=player.maxHp=100;player.inv=0;hannah.cycles=2;hannah.clock=0;");advance(h,.01);advance(h,r('hannah.windupDuration')+.05);
 assert.equal(r('player.hp'),100);assert.equal(r('FiaConflict.shield'),2,'Accepted shield absorption consumes the strike only once');assert.equal(r('hannah.strikeHits[0]'),true);
}
// Echoes preserve captured targets and use 80% damage after ordinary protection.
for(const fps of [30,60,120]){
 const h=setup(),r=h.run;phase2(h,fps);
 r('hannah.cycles=0;hannah.clock=0;player.x=hannah.x-100;player.y=hannah.arena.y-player.h;player.hp=player.maxHp=100;player.inv=0;');advance(h,1/fps,fps);
 advance(h,r('hannah.windupDuration')+.03,fps);assert.equal(r('hannah.echoQueue.length'),1);
 const echoDelay=r('hannah.echoQueue[0].delay');assert(echoDelay>r('hannah.moveSnapshot.duration')+1.2);
 advance(h,1.05,fps);assert.equal(r('player.hp'),97);
 // Hold only the next primary move, not the independently running echo clock.
 r("hannah.phase='recover';hannah.clock=50;");advance(h,echoDelay+.3,fps);
 assert(Math.abs(r('player.hp')-94.6)<1e-9,'Echo deals2.4froma3damage source at '+fps+' FPS');
}
// Active-arena boundaries withstand real walking and dashing in either phase.
for(const fps of [30,60,120])for(const stage of [1,2])for(const [action,direction] of [['moveLeft',-1],['moveRight',1]]){
 const h=setup(),r=h.run;if(stage===2)phase2(h,fps);
 r('hannah.clock=999;hannah.phase="wait";abilities[1]=true;player.inv=999;player.x='+(direction<0?'hannah.arena.x+20':'hannah.arena.x+hannah.arena.w-player.w-20')+';player.y=hannah.arena.y-player.h;player.onGround=true;');
 h.press({action});h.press({action:'dash'});r('for(let n=0;n<'+fps*2+';n++)update('+1/fps+');');h.release({action});h.release({action:'dash'});
 assert.equal(r('state'),'play');assert(r('hannah.active&&!hannah.failurePending'));
 assert(r('player.x>=hannah.arena.x+8&&player.x+player.w<=hannah.arena.x+hannah.arena.w-8'),'Walking/dashing cannot leave active arena');
}
// Both added attacks use captured, finite telegraphs and never summon in phase2.
for(const stage of [1,2])for(const move of ['crossCombo','riftBurst']){
 const h=setup(),r=h.run;if(stage===2)phase2(h);
 const pattern=stage===1?r('HannahRules.tuning.combat.phase1Pattern'):r('HannahRules.tuning.combat.phase2Pattern');
 r('hannah.cycles='+Array.from(pattern).indexOf(move)+';hannah.clock=0;');advance(h,.01);
 assert.equal(r('hannah.move'),move);assert(r('hannah.attackBoxes.every(box=>[box.x,box.y,box.w,box.h].every(Number.isFinite)&&box.w>0&&box.h>0)'));
 const captured=r('JSON.stringify(hannah.moveSnapshot)');r('player.x+=250;');advance(h,.2);assert.equal(r('JSON.stringify(hannah.moveSnapshot)'),captured);
 advance(h,1);if(move==='riftBurst')assert(r('hannah.hazards.length>0&&hannah.hazards.every(box=>box.kind==="hannahRift")'));
}
// QA-HRP-002: the captured warning contains every damaging sweep, including
// the wider final combo and both return-dash directions. Instrument tests only.
{
 const fs=require('node:fs'),vm=require('node:vm');
 const source=fs.readFileSync('assets/js/hannah-combat.js','utf8').replace('return Object.freeze({is,create,','return Object.freeze({testWindows:attackWindows,testWarnings:warnings,testPosition:position,testBlade:blade,is,create,');
 const c=vm.runInNewContext(source+';HannahCombat',{clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),HannahRules:{tuning:{combat:{returnTravel:.42}}}});
 const contains=(a,b)=>b.x>=a.x-1e-6&&b.y>=a.y-1e-6&&b.x+b.w<=a.x+a.w+1e-6&&b.y+b.h<=a.y+a.h+1e-6;
 for(const face of [-1,1])for(const move of ['combo','crossCombo','jump','dashReturn','riftBurst'])for(const echo of [false,true]){
  const s=JSON.parse(JSON.stringify({move,face,fromX:1800,toX:1800+face*350,y:1172,w:120,h:228,height:220,duration:move==='dashReturn'?2.23:1.22,returnStart:1.81,zones:[{x:1600,y:1240,w:140,h:160,start:.12,end:.38},{x:1830,y:1240,w:140,h:160,start:.52,end:.78}]}));
  const warning=c.testWarnings(s);
  for(const [i,[start,end,direction,width]] of c.testWindows(s).entries())for(let n=0;n<=20;n++){
   const t=start+(end-start)*n/20;
   const box=move==='jump'?{x:s.toX+s.w/2-155,y:s.y+s.h-125,w:310,h:125}:move==='riftBurst'?s.zones[i]:c.testBlade(c.testPosition(s,move==='dashReturn'?t:0),direction,width,move==='dashReturn'?125:155);
   assert(warning.some(w=>contains(w,box)),`${move} face ${face}, echo ${echo}: damage is inside its captured warning`);
  }
  if(move==='crossCombo'&&face===1)assert(warning.some(w=>2150>=w.x&&2150<=w.x+w.w),'Original outside-warning hit is now visibly warned');
 }
}
console.log('Hannah combat checks passed: ordered gates, shared drains, pause/retry, captured attacks, owned cleanup, warning coverage, return/echo damage and real-input arena bounds at30/60/120FPS.');
