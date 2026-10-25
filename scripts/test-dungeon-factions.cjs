'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
function setup({kind='guard',target=true,ally=true,playerNear=false}={}){
 const h=harness(),r=h.run;
 r("Prologue.stop();defeated=[true,true,false,false];abilities=[false,false];flags=[['forestBell','villageBell'],['soulUpper','soulLower','councilKeyEarned','councilGateOpen','dungeonRunStarted'],[],[]];visitedRests=[['start'],['start'],[],[]];dungeonState=DungeonRules.fresh();dungeonState.run=1;progression=freshProgression();coins=0;CampQuest.enter('yomiDungeon1',{save:false});initPlayer({x:1450,y:1100});player.inv=999;projectiles=[];enemies=[];state='play';");
 r('var factionAttacker=createEnemy({id:"faction-attacker",x:500,y:1100,kind:'+JSON.stringify(kind)+',patrol:500,dungeonEnemy:true,dungeonSide:"japan",factionOverride:"japan"});factionAttacker.face=1;factionAttacker.cd=0;enemies.push(factionAttacker);');
 if(target)r('var factionTarget=createEnemy({id:"faction-target",x:570,y:1100,kind:"guard",patrol:500,dungeonEnemy:true,dungeonSide:"shadowCult",factionOverride:"shadowCult"});factionTarget.stun=999;enemies.push(factionTarget);');
 if(ally)r('var factionAlly=createEnemy({id:"faction-ally",x:570,y:1100,kind:"guard",patrol:500,dungeonEnemy:true,dungeonSide:"japan",factionOverride:"japan"});factionAlly.stun=999;enemies.push(factionAlly);');
 if(playerNear)r('player.x=570;player.y=1100-player.h;player.inv=0;');
 return h;
}
const ledger=h=>h.run('JSON.stringify([progression,coins,shards,flags,dungeonState,window.__saveSnapshots.length])');
const tickActor=(h,seconds,fps=120)=>h.run('for(let i=0;i<'+Math.ceil(seconds*fps)+';i++)DungeonRun.updateEnemy(factionAttacker,'+1/fps+');');
for(const fps of [30,60,120]){
 const h=setup(),r=h.run;r('factionTarget.hp=1;');const before=ledger(h),ally=r('factionAlly.hp');
 r('DungeonRun.updateEnemy(factionAttacker,'+1/fps+');');assert(r('factionAttacker.windup>0'),'Opposing faction starts an authored melee tell');assert.equal(r('factionAttacker.targetX'),r('factionTarget.x+factionTarget.w/2'),'A closer hostile NPC is selected instead of distant Momo');
 tickActor(h,.6,fps);assert.equal(r('factionTarget.hp'),1,'NPC melee cannot hit before the0.7s warning');tickActor(h,.12,fps);assert.equal(r('factionTarget.hp'),0);assert(r('factionTarget.dead'));assert.equal(r('factionAlly.hp'),ally,'Melee never damages the attacker\'s own faction');assert.equal(r('player.hp'),5);assert.equal(ledger(h),before,'An NPC-caused melee kill grants Momo noXP,coins,shards or save writes');
 r('killEnemy(factionTarget);');assert.equal(ledger(h),before,'The dead NPC cannot later be collected as a player kill');
}
{
 const h=setup({target:false}),r=h.run;const hp=r('factionAlly.hp');tickActor(h,2);assert.equal(r('factionAttacker.windup'),0,'A same-side NPC is not an attack target');assert.equal(r('factionAlly.hp'),hp);assert.equal(r('projectiles.length'),0);
}
for(const fps of [30,60,120]){
 const h=setup({target:false,playerNear:true}),r=h.run;const ally=r('factionAlly.hp');r('DungeonRun.updateEnemy(factionAttacker,'+1/fps+');');assert.equal(r('factionAttacker.targetX'),r('player.x+player.w/2'));tickActor(h,.6,fps);assert.equal(r('player.hp'),5);tickActor(h,.12,fps);assert.equal(r('player.hp'),4,'Dungeon faction melee can hit Momo at'+fps+'FPS');assert.equal(r('factionAlly.hp'),ally);
}
// Melee and ranged actors must enter through the real common enemy dispatcher.
for(const kind of ['archer','mage'])for(const fps of [30,60,120]){
 const h=setup({kind}),r=h.run;r('factionTarget.x=720;factionTarget.hp=1;factionAlly.x=620;');const before=ledger(h),ally=r('factionAlly.hp');
 r('for(let i=0;i<'+Math.ceil((kind==='mage'?1.1:.8)*fps)+';i++)update('+1/fps+');');assert(r('projectiles.length>0'),kind+' launches a projectile after its warning');assert(r('projectiles.every(shot=>shot.dungeonSide==="japan"&&shot.source==="dungeon-faction")'),'Projectiles retain their side/source tags');assert.equal(r('factionTarget.hp'),1,'A ranged attack requires actual travel time');
 r('for(let i=0;i<'+Math.ceil((kind==='mage'?1.6:1)*fps)+';i++)update('+1/fps+');');assert.equal(r('factionTarget.hp'),0,kind+' projectile kills opposing NPC through real collision dispatch');assert(r('factionTarget.dead'));assert.equal(r('factionAlly.hp'),ally,'Projectiles pass through their own faction');assert.equal(r('player.hp'),5);assert.equal(ledger(h),before,'NPC projectile kills grant no player reward');
}
for(const kind of ['archer','mage']){
 const h=setup({kind,target:false,playerNear:true}),r=h.run;r('player.x=720;factionAlly.x=620;');const ally=r('factionAlly.hp');h.tick(336);assert(r('player.hp<5'),kind+' can hit Momo after passing a friendly NPC');assert.equal(r('factionAlly.hp'),ally);
}
{
 const h=setup(),r=h.run;r('var hostileShot={life:2,damage:3,dungeonSide:"japan",source:"dungeon-faction"};factionTarget.hp=1;');const before=ledger(h),ally=r('factionAlly.hp');
 assert(r('DungeonRun.projectile(hostileShot,{...factionTarget})'));assert.equal(r('factionTarget.hp'),0);assert(r('factionTarget.dead'));assert.equal(r('factionAlly.hp'),ally);assert.equal(ledger(h),before);
 r('factionTarget.dead=true;');assert(!r('DungeonRun.projectile(hostileShot,{...factionAlly})'),'A same-side body does not intercept the shot');
 for(const values of ['{life:0,dungeonSide:"japan"}','{life:-1,dungeonSide:"japan"}','{life:2}']){const before=r('JSON.stringify(enemies)');assert(!r('DungeonRun.projectile('+values+',{...factionAlly})'));assert.equal(r('JSON.stringify(enemies)'),before);}
}
{
 const h=setup({target:false,ally:false,playerNear:true}),r=h.run;const beforeXp=r('progression.totalXp'),beforeCoins=r('coins');r('factionAttacker.hp=1;player.face=-1;player.inv=999;');h.press({action:'heavyAttack'});h.tick(80);h.release({action:'heavyAttack'});assert(r('factionAttacker.dead'));assert(r('progression.totalXp>0'));assert.equal(r('coins'),beforeCoins+5,'Control: a real Momo heavy attack still grants ordinary enemy rewards');assert(r('progression.totalXp')>beforeXp);
}
for(const state of ['pause','dialog','inventory','training','map','developer','dungeonMenu']){
 const h=setup(),r=h.run;r('factionAttacker.windup=.5;factionAttacker.windupDuration=.7;state='+JSON.stringify(state));const before=r('JSON.stringify([player,enemies,projectiles,progression,coins,flags])');tickActor(h,2);assert.equal(r('JSON.stringify([player,enemies,projectiles,progression,coins,flags])'),before,'Faction actor freezes in '+state);
 const frozen=r('JSON.stringify([player,enemies,projectiles,time,levelTime])');h.tick(240);assert.equal(r('JSON.stringify([player,enemies,projectiles,time,levelTime])'),frozen,'The game loop freezes faction projectile movement in '+state);
}
{
 const h=setup(),r=h.run;r('factionAttacker.windup=.01;var staleFactionActor=factionAttacker;enemies=enemies.filter(e=>e!==factionAttacker);');const before=r('JSON.stringify([staleFactionActor,factionTarget,player])');tickActor(h,1);assert.equal(r('JSON.stringify([staleFactionActor,factionTarget,player])'),before,'Removed actors cannot attack an old target');
 r('enemies.push(staleFactionActor);level=levels[0];realm=0;');const old=r('JSON.stringify([staleFactionActor,factionTarget,player])');tickActor(h,1);assert.equal(r('JSON.stringify([staleFactionActor,factionTarget,player])'),old,'Faction AI never runs in a stale non-dungeon location');assert(!r('DungeonRun.projectile({life:2,damage:5,dungeonSide:"japan"},{...factionTarget})'));assert.equal(r('JSON.stringify([staleFactionActor,factionTarget,player])'),old,'Old dungeon shots do nothing outside a dungeon');
}
{
 const h=setup({playerNear:true}),r=h.run;r('player.hp=1;factionTarget.hp=1;factionAttacker.windup=.001;');const before=ledger(h);r('DungeonRun.updateEnemy(factionAttacker,.01);');assert.equal(r('player.hp'),5,'A fatal melee hit respawns Momo through the normal controller');assert(!r('enemies.includes(factionAttacker)'));assert.equal(r('factionTarget.hp'),1,'Respawning mid-attack stops the stale NPC damage loop');assert.equal(r('factionTarget.dead'),false);assert.equal(r('progression.totalXp'),0);assert.equal(r('coins'),0);
}
// The controller is also called directly by collision code; a paused callback must be inert.
{
 const h=setup(),r=h.run;r('state="pause";');const before=r('JSON.stringify([player,enemies,progression,coins,flags])');assert(!r('DungeonRun.projectile({life:2,damage:1,dungeonSide:"japan"},{...factionTarget})'),'A direct projectile collision while paused must be rejected');assert.equal(r('JSON.stringify([player,enemies,progression,coins,flags])'),before);
}
console.log('PASS: faction melee/ranged targeting, no friendly fire, Momo attacks, reward-free NPC kills, pause and stale/death guards through actual update/collision dispatch.');
