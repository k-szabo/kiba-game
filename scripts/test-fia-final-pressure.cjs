'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),ordinaryFixture=require('./test-fia-fixture.cjs');
function setup(ritual=true){
 const h=ritual?harness():ordinaryFixture(),r=h.run;
 if(ritual)r("Prologue.stop();FiaRitual.clear();level=fiaRitual;realm=3;state='play';initPlayer({x:620,y:820});FiaRitual.begin(true);var trialBoss=FiaRitual.enemy;");
 else{r("var npc=level.npcs.find(n=>n.id==='fia');initPlayer({x:npc.x-240,y:npc.y});FiaConflict.provoke({x:npc.x-35,y:npc.y-130,w:70,h:130});");h.dismiss();r('var trialBoss=FiaConflict.enemy;');}
 r('player.inv=9999;');return h;
}
function until(h,condition,dt=1/120,max=1000){for(let i=0;i<max;i++){if(h.run(condition))return;h.run('FiaCombat.update(trialBoss,'+dt+');');}assert.fail('Timed out waiting for '+condition);}
for(const dt of [1/120,1/60,1/30,1/15,.1,.25]){
 const h=setup(),r=h.run;r('trialBoss.phase="wait";trialBoss.clock=0;trialBoss.cycles=2;');
 until(h,'trialBoss.phase==="windup"',dt);assert.equal(r('trialBoss.move'),'teleport');assert(r('trialBoss.windupDuration>=.65'));
 until(h,'trialBoss.phase==="recover"',dt);assert.equal(r('trialBoss.followup'),'bolts');const cycle=r('trialBoss.cycles');
 until(h,'trialBoss.phase==="windup"',dt);assert.equal(r('trialBoss.move'),'bolts');assert.equal(r('trialBoss.cycles'),cycle,'A follow-up does not skip a main-sequence move');assert(r('trialBoss.windupDuration>=.65'),'The follow-up has a full visible preparation');assert.equal(r('trialBoss.attackFace'),r('Math.sign(trialBoss.targetX-trialBoss.x-trialBoss.w/2)'),'Fia turns toward the locked shot direction after teleporting');
 const locked=r('JSON.stringify([trialBoss.targetX,trialBoss.targetY])');r('player.x+=300;');h.run('FiaCombat.update(trialBoss,'+dt+');');assert.equal(r('JSON.stringify([trialBoss.targetX,trialBoss.targetY])'),locked);
 until(h,'trialBoss.phase==="strike"',dt);assert.equal(r('projectiles.filter(p=>p.fiaEffect).length'),7,'A prepared teleport follow-up must release its entire fan');
 r('trialBoss.inv=0;trialBoss.shieldRemaining=0;FiaCombat.hit(trialBoss,trialBoss,100000);');h.dismiss();assert(r('trialBoss.ritualEmpowered'));assert.equal(r('trialBoss.followup'),null);assert.equal(r('projectiles.filter(p=>p.fiaEffect).length'),0,'The phase transition retires the whole previous combo');
 const paused=r('JSON.stringify([trialBoss,projectiles,player])');r('state="pause";');h.run('FiaCombat.update(trialBoss,5);FiaCombat.updateStatus(5);');assert.equal(r('JSON.stringify([trialBoss,projectiles,player])'),paused);
 r('state="play";trialBoss.clock=100;');const hp=r('trialBoss.hp');for(let i=0;i<Math.round(2/dt);i++)h.run('FiaCombat.update(trialBoss,'+dt+');');assert(Math.abs(r('trialBoss.hp')-(hp-Math.round(2/dt)*dt*2))<1e-7,'The empowered ritual consumes 2 HP per active second');
}
for(const move of [1,3]){
 const h=setup(),r=h.run;r('trialBoss.shieldRemaining=0;FiaCombat.hit(trialBoss,trialBoss,100000);');h.dismiss();r('trialBoss.hp=450;trialBoss.phase="wait";trialBoss.clock=0;trialBoss.ritualCycles='+move+';');
 until(h,'trialBoss.phase==="windup"');const aim=r('JSON.stringify([trialBoss.targetX,trialBoss.targetY])');until(h,'trialBoss.phase==="strike"');assert.equal(r('JSON.stringify([trialBoss.targetX,trialBoss.targetY])'),aim);
 assert.equal(r('projectiles.length'),3,'Hell/void casts keep ranged pressure as well as their ground attack');assert(r('projectiles.every(p=>p.source===FiaCombat.source(trialBoss)&&p.ritualEffect===trialBoss.ritualEffect)'));
 r('var retired=projectiles[0];FiaCombat.reset(trialBoss);');assert.equal(r('projectiles.length'),0);assert(!r('FiaCombat.impact(retired,player,player.hp+3)'),'A retry cannot receive damage/healing from the retired combination');
}
{
 const h=setup(),r=h.run;r('trialBoss.shieldRemaining=0;FiaCombat.hit(trialBoss,trialBoss,100000);');h.dismiss();r('trialBoss.hp=90;player.x=1000;trialBoss.phase="wait";trialBoss.clock=0;trialBoss.ritualCycles=1;');
 until(h,'trialBoss.phase==="windup"');r('var promised=trialBoss.hazards.at(-1);');until(h,'trialBoss.ritualCycles===3');assert(r('promised.life>0&&trialBoss.hazards.includes(promised)'),'A new spell cannot erase the previous spell’s still-active final eruption');
 r('player.x=promised.x+promised.w/2-player.w/2;player.y=promised.y;player.inv=0;var hpBefore=player.hp;FiaCombat.update(trialBoss,1/120);');assert(r('promised.hitDone&&player.hp<hpBefore'),'The remaining marked eruption can still hit');
 r('trialBoss.inv=0;FiaCombat.hit(trialBoss,trialBoss,100000);');assert.equal(r('trialBoss.hazards.length'),0,'Defeat cancels every outstanding hazard');
}
{
 const h=setup(false),r=h.run;r('trialBoss.phase="wait";trialBoss.clock=0;trialBoss.cycles=2;');until(h,'trialBoss.phase==="recover"');assert.equal(r('trialBoss.followup'),null);until(h,'trialBoss.phase==="wait"');assert.equal(r('trialBoss.phaseDuration'),.2);assert.equal(r('projectiles.length'),0,'The ordinary provoked fight does not gain the ritual-only combo');
}
console.log('PASS: final-only teleport combos with full locked tells, ranged ritual pressure, 2 HP/s active consumption, surviving eruptions, retired-owner cleanup and unchanged ordinary fight at 120/60/30/15 FPS and coarse steps.');
