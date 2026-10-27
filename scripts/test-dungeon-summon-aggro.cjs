'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
function setup(){
 const h=harness(),r=h.run;
 r("Prologue.stop();defeated=[true,true,false,false];flags=[['forestBell','villageBell'],['soulUpper','soulLower','councilGateOpen','dungeonRunStarted','dungeonStage1Clear'],[],[]];dungeonState=DungeonRules.fresh();dungeonState.runs.yomiFall.run=1;CampQuest.enter('yomiDungeon2',{save:false});initPlayer({x:level.arena.x+level.arena.w-100,y:level.arena.y});player.inv=999;enemies=enemies.filter(DungeonCombat.is);var owner=enemies[0];owner.active=true;owner.cycles=2;owner.clock=0;state='play';");
 return h;
}
const advance=(h,seconds,fps=120)=>h.run('for(let i=0;i<'+Math.ceil(seconds*fps)+';i++)update('+1/fps+');');
function spawn(h,fps=120){
 advance(h,2.4,fps);
 h.run('owner.clock=999;var raised=enemies.filter(e=>e.dungeonSummon);var leftRaised=raised.reduce((a,b)=>a.x<b.x?a:b);');
 assert.equal(h.run('raised.length'),2,'The actual necromancer summon move creates two delayed soldiers');
 return h;
}
const ledger=h=>h.run('JSON.stringify([flags,progression,coins,shards,dungeonState,window.__saveSnapshots.length])');
for(const fps of [30,60,120]){
 const h=spawn(setup(),fps),r=h.run;
 assert(r('player.x-leftRaised.x>520'),'Regression starts beyond ambient sight range');
 r('leftRaised.face=-1;leftRaised.patrolFace=-1;leftRaised.turnCooldown=0;');const before=r('leftRaised.x');
 advance(h,1/fps,fps);
 assert(r('leftRaised.x')>before,'A fresh summon immediately pursues Momo instead of patrolling away at '+fps+' FPS');
 assert.equal(r('leftRaised.walkSpeed'),65);assert.equal(r('leftRaised.face'),1);
 assert(r('raised.every(e=>e.noReward&&e.raisedSamurai)'), 'The undead visual marker and reward-free summons are preserved');
 r('var temptingFaction=createEnemy({id:"tempting-faction",x:leftRaised.x-40,y:level.arena.y,kind:"guard",patrol:50,dungeonEnemy:true,dungeonSide:"japan"});temptingFaction.stun=999;enemies.push(temptingFaction);');
 const factionHP=r('temptingFaction.hp'),x=r('leftRaised.x');advance(h,.5,fps);
 assert(r('leftRaised.x')>x,'Nearby opposing NPCs cannot divert a necromancer summon from Momo');assert.equal(r('temptingFaction.hp'),factionHP);
 // A jump outside the ambient vertical sight band must not cancel pursuit.
 r('player.y=level.arena.y-player.h-250;player.vy=0;');const airborneX=r('leftRaised.x');advance(h,1/fps,fps);
 assert(r('leftRaised.x')>airborneX,'Summon keeps pursuing during Momo\'s high combat jump');
 r('player.y=level.arena.y-player.h;player.vy=0;player.inv=0;leftRaised.x=player.x-90;leftRaised.cd=0;leftRaised.turnCooldown=0;leftRaised.face=1;');
 advance(h,1/fps,fps);assert(r('leftRaised.windup>0'),'Pursuit still enters the authored melee warning');
 const hp=r('player.hp');advance(h,.6,fps);assert.equal(r('player.hp'),hp,'No early melee damage');advance(h,.15,fps);assert(r('player.hp')<hp,'Raised soldier damages Momo after the warning at '+fps+' FPS');
}
for(const state of ['pause','dialog','inventory','training','map','developer','dungeonMenu']){
 const h=spawn(setup()),r=h.run;r('state='+JSON.stringify(state));
 const before=r('JSON.stringify([player,enemies,projectiles,DungeonRun.pending,time,levelTime])');advance(h,2);
 assert.equal(r('JSON.stringify([player,enemies,projectiles,DungeonRun.pending,time,levelTime])'),before,'Summons freeze with the game in '+state);
}
{
 const h=setup(),r=h.run;advance(h,1.5);assert.equal(r('DungeonRun.pending.length'),2);
 r('state="pause";');const before=r('JSON.stringify(DungeonRun.pending)');advance(h,2);assert.equal(r('JSON.stringify(DungeonRun.pending)'),before,'Pending portals also freeze');
 r('state="play";DungeonCombat.reset(owner);');assert.equal(r('DungeonRun.pending.length'),0);advance(h,2);assert(!r('enemies.some(e=>e.dungeonSummon&&!e.dead)'),'Reset cancels pending portals');
}
for(const mutation of ['DungeonCombat.reset(owner)','owner.hp=0;killEnemy(owner)','enemies=enemies.filter(e=>e!==owner)','dungeonState.runs.yomiFall.run++']){
 const h=spawn(setup()),r=h.run;const before=ledger(h);r(mutation);const after=ledger(h);advance(h,1/120);
 assert(r('raised.every(e=>e.dead&&e.windup===0&&e.attackTime===0)'),mutation+' retires owned summons');
 if(!mutation.includes('killEnemy'))assert.equal(ledger(h),after,'Retiring summons grants no reward');
 if(mutation.includes('reset'))assert.equal(after,before,'Reset keeps permanent progression unchanged');
}
{
 const h=setup(),r=h.run;advance(h,1.5);r('var removedOwner=owner;enemies=enemies.filter(e=>e!==owner);var sameIdOwner=createEnemy({id:removedOwner.id,miniboss:"dungeonNecromancer",x:removedOwner.origin,y:removedOwner.arena.y});sameIdOwner.active=true;sameIdOwner.clock=999;enemies.push(sameIdOwner);');
 advance(h,1);assert(!r('enemies.some(e=>e.dungeonSummon&&!e.dead)'),'A same-ID replacement cannot inherit an old owner\'s pending portal');
}
{
 const h=spawn(setup()),r=h.run,before=ledger(h);r('for(const e of raised){e.hp=0;killEnemy(e);}');assert.equal(ledger(h),before,'Killing raised soldiers grants no XP, coins, points, flags or save writes');
}
{
 const h=spawn(setup()),r=h.run;r('player.hp=1;player.inv=0;leftRaised.x=player.x-70;leftRaised.face=1;leftRaised.windup=.001;leftRaised.windupDuration=.7;');
 advance(h,.02);assert(!r('enemies.includes(leftRaised)'),'A fatal hit replaces transient summon actors on normal respawn');assert.equal(r('DungeonRun.pending.length'),0);
 const before=r('JSON.stringify([player,enemies,flags,progression,coins])');r('DungeonRun.updateEnemy(leftRaised,1);');assert.equal(r('JSON.stringify([player,enemies,flags,progression,coins])'),before,'A stale post-death callback cannot attack the replacement player');
}
{
 const h=spawn(setup()),r=h.run;r('DungeonRun.leave();');assert.equal(r('level.id'),'councilHall');assert.equal(r('DungeonRun.pending.length'),0);
 const before=r('JSON.stringify([player,enemies,flags,progression,coins])');r('DungeonRun.updateEnemy(leftRaised,1);');assert.equal(r('JSON.stringify([player,enemies,flags,progression,coins])'),before,'Leaving the dungeon invalidates old summon callbacks');
}
console.log('PASS: actual necromancer release, immediate arena-wide Momo pursuit at 30/60/120 FPS, authored melee, no rewards, paused portals, owner reset/death/replacement/run cleanup and stale callbacks.');
