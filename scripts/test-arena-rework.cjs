'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
function setup(type='arenaFia'){
 const h=harness(),r=h.run;r("DevTools.open();DevSession.begin();DevTeleport.teleport({realm:'shadowArena',rest:'shadowArenaEntrance'});DevTools.close();initPlayer({x:1650,y:1700});projectiles=[];state='play';");
 r('enemies=[ArenaCombat.create({id:'+JSON.stringify(type)+',miniboss:'+JSON.stringify(type)+',x:1750,y:level.arena.y,replay:true})];var foe=enemies[0];foe.active=true;player.inv=999;');return h;
}
const ticks=(h,seconds,fps=120)=>h.run('for(let n=0;n<'+Math.round(seconds*fps)+';n++)updateEnemies('+1/fps+');');
const play=(h,seconds,fps=120)=>h.run('for(let n=0;n<'+Math.ceil(seconds*fps)+';n++)update('+1/fps+');');
for(const fps of [30,60,120]){
 const h=setup(),r=h.run;r('foe.immuneRemaining=0;');ticks(h,1/fps,fps);assert.equal(r('foe.phase'),'fall');assert(r('ArenaCombat.protects(foe)'));
 ticks(h,.8,fps);assert.equal(r('foe.phase'),'exhausted');assert.equal(r('foe.vulnerableRemaining'),5,'Five seconds begins only after landing');assert.equal(r('foe.y+foe.h'),r('level.arena.y'));
 for(const mode of ['pause','dialog','inventory','developer','map']){r('state='+JSON.stringify(mode));const before=r('JSON.stringify([foe,projectiles,player])');ticks(h,2,fps);assert.equal(r('JSON.stringify([foe,projectiles,player])'),before,'Final-hit timer freezes in '+mode);}
 r("state='play';");ticks(h,4.9,fps);assert.equal(r('foe.phase'),'exhausted');assert(!r('ArenaCombat.protects(foe)'));ticks(h,.1,fps);assert.equal(r('foe.shieldCycle'),1);assert.equal(r('foe.immuneRemaining'),90);assert.equal(r('foe.hp'),1);assert(r('ArenaCombat.protects(foe)'),'A missed final hit starts a fresh90-second shield');
 r('foe.clock=0;foe.cycles=0;');ticks(h,1/fps,fps);const initialTell=r('foe.windupDuration');ticks(h,1.4,fps);assert(r('projectiles.length>=11'),'Fia follows her first fan with committed combo shots');
 r('foe.immuneRemaining=0;');ticks(h,1/fps,fps);ticks(h,.8,fps);ticks(h,5,fps);assert.equal(r('foe.shieldCycle'),2);r('foe.clock=0;foe.cycles=0;');ticks(h,1/fps,fps);assert(r('foe.windupDuration')<initialTell,'Each missed opportunity increases aggression with a bounded readable tell');assert(r('foe.windupDuration>=.7'));
 const hit=setup(),x=hit.run;x('foe.immuneRemaining=0;');ticks(hit,1/fps,fps);ticks(hit,.8,fps);x('player.x=foe.x-35;player.face=1;');hit.press({action:'heavyAttack'});play(hit,.6,fps);hit.release({action:'heavyAttack'});assert(x('foe.dead&&foe.spared'),'Actual heavy input within the window ends the fight without killing Fia');
 const late=setup(),l=late.run;l('foe.immuneRemaining=0;');ticks(late,1/fps,fps);ticks(late,.8,fps);l('foe.vulnerableRemaining=.1;player.x=foe.x-35;player.face=1;');late.press({action:'heavyAttack'});play(late,.6,fps);late.release({action:'heavyAttack'});assert(l('foe.hp===1&&!foe.dead&&foe.shieldCycle===1'),'An attack impacting after the deadline cannot bypass renewed protection');
}
for(const fps of [30,60,120]){
 const h=setup('arenaCyclops'),r=h.run;r('foe.parts[0].clock=0;foe.parts[1].clock=.55;player.inv=0;');ticks(h,1/fps,fps);const locked=r('foe.parts[0].targetX');assert.equal(r('foe.parts[0].move'),'pairedStomp');assert.equal(r('foe.parts[1].phase'),'wait');
 assert(r('foe.parts[0].hazards.some(h=>h.x<=player.x+player.w/2&&h.x+h.w>=player.x+player.w/2)'),'A stomp warning is actually centered under Momo');
 const boxes=r('foe.parts[0].hazards.slice().sort((a,b)=>a.x-b.x)');for(let n=1;n<boxes.length;n++)assert(boxes[n].x-boxes[n-1].x-boxes[n-1].w>=65,'Stomps leave a dash-free escape gap');
 ticks(h,.65,fps);assert.equal(r('foe.parts[0].targetX'),locked);assert.equal(r('foe.parts[1].move'),'pairedLance');assert.notEqual(r('foe.parts[0].clock'),r('foe.parts[1].clock'));assert.notEqual(r('foe.parts[0].poseIndex'),r('foe.parts[1].poseIndex'),'Each guard owns its current pose');ticks(h,.55,fps);assert.equal(r('player.hp'),3,'Standing still inside the stomp now deals real damage');
 const dodge=setup('arenaCyclops'),d=dodge.run;d('foe.parts[0].clock=0;player.inv=0;');ticks(dodge,1/fps,fps);const warnings=d('JSON.stringify(foe.parts[0].hazards.map(h=>[h.x,h.y,h.w,h.h]))');d('player.x=900;');ticks(dodge,.7,fps);assert.equal(d('JSON.stringify(foe.parts[0].hazards.map(h=>[h.x,h.y,h.w,h.h]))'),warnings,'Committed stomp does not follow a dodge');ticks(dodge,.6,fps);assert.equal(d('player.hp'),5,'Moving to the visible safe floor avoids the stomp');
 for(const mode of ['pause','dialog','inventory','developer']){d('state='+JSON.stringify(mode));const before=d('JSON.stringify(foe)');ticks(dodge,1,fps);assert.equal(d('JSON.stringify(foe)'),before,'Both independent actors freeze');}
}
{
 const h=setup(),r=h.run;r('foe.summons=[{x:800,role:"cyclops"},{x:2100,role:"guard"}];');for(let i=0;i<5;i++)assert(r('ArenaChallenge.summon(foe)'));
 assert.equal(r('enemies.filter(e=>e.arenaRole==="cyclops"&&!e.dead).length'),1);assert(r('enemies.filter(e=>e.arenaMinion&&!e.dead).length<=4'));assert(r('enemies.find(e=>e.arenaRole==="cyclops").parts.length===1'),'Fia summons one guard, not another paired boss');
 r('var guard=enemies.find(e=>e.arenaRole==="cyclops");enemies=[guard,...enemies.filter(e=>e!==guard)];ArenaChallenge.hud();');assert(r('$("bossName").textContent.includes(I18n.format("arena.shield",[90]))'),'A summoned guard cannot replace Fia in the HUD');
 const ledger=r('JSON.stringify([flags,coins,progression])');r('guard.hp=0;killEnemy(guard);');assert.equal(r('JSON.stringify([flags,coins,progression])'),ledger,'Cyclops minions never grant arena rewards');assert(!r('ArenaChallenge.onBossDefeated(guard)'));
 r('ArenaChallenge.summon(foe);guard=enemies.find(e=>e.arenaRole==="cyclops"&&!e.dead);projectiles.push({source:ArenaCombat.source(guard)},{source:ArenaCombat.source(foe)},{source:"other"});foe.immuneRemaining=0;');ticks(h,1/120);
 assert(!r('enemies.some(e=>e.arenaOwner===foe.id)'),'The final-hit window removes Fia-owned summons');assert(r('projectiles.every(p=>p.source==="other")'),'Summon and Fia shots retire together');
 const stale=r('JSON.stringify(foe)');r('enemies=[];');ticks(h,1);assert.equal(r('JSON.stringify(foe)'),stale,'Removed final-boss identities stay inert');
}
{
 const h=setup(),r=h.run;r('ArenaChallenge.start();ArenaChallenge.attempt.round=5;enemies=[ArenaCombat.create({id:"pendingFia",miniboss:"arenaFia",x:1750,y:level.arena.y})];foe=enemies[0];foe.active=true;foe.attemptId=ArenaChallenge.attempt.id;foe.summons=[{x:800,role:"cyclops"},{x:2100,role:"guard"}];');
 for(let i=0;i<4;i++)assert(r('ArenaChallenge.summon(foe)'));
 assert.equal(r('ArenaChallenge.attempt.pending.filter(p=>p.role==="cyclops").length'),1,'Queued portals also count toward the single cyclops limit');r('ArenaCombat.reset(foe);');assert.equal(r('ArenaChallenge.attempt.pending.length'),0,'Reset removes pending summons before they can leak into a later cycle');
 r('foe.active=true;foe.clock=0;foe.cycles=1;updateEnemies(.01);');assert(r('foe.hazards.length>0&&foe.hazards.every(h=>h.w>=170)'),'Fia sigils are visibly wider');const sigils=r('foe.hazards.slice().sort((a,b)=>a.x-b.x)');for(let n=1;n<sigils.length;n++)assert(sigils[n].x-sigils[n-1].x-sigils[n-1].w>=65);
}
{
 const h=setup('arenaCyclops'),r=h.run;r('foe.parts[0].clock=0;foe.parts[1].clock=5;updateEnemies(.01);damage=function(){player={...player};enemies=[];};');ticks(h,1.1);const before=r('foe.parts[1].clock');r('updateEnemies(.1);');assert.equal(r('foe.parts[1].clock'),before,'Player replacement aborts the old pair update before the other actor can act');
}
for(const [type,w,height]of [['arenaCaptain',88,180],['arenaSerpent',380,360]]){
 const h=setup(type),r=h.run;assert.equal(r('foe.w'),w);assert.equal(r('foe.h'),height);assert.equal(r('foe.y+foe.h'),r('level.arena.y'));assert(r('foe.x>=foe.arena.x&&foe.x+foe.w<=foe.arena.x+foe.arena.w'));
 const hp=r('foe.hp');assert.equal(r('ArenaCombat.hit(foe,{x:foe.x+5,y:foe.y+5,w:10,h:10},1,"heavy")'),1,'The enlarged upper body has a matching hurtbox');assert.equal(r('foe.hp'),hp-1);
}
console.log('PASS: centered independent cyclops attacks, grounded larger hurtboxes, faster Fia combos,5-second final hits/renewed90-second shields, one reward-free cyclops summon and complete pause/death cleanup.');
