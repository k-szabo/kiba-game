'use strict';
const assert=require('node:assert/strict');
const {run,snap,tick,place,dismiss}=require('./test-harness.cjs')();
function fresh(){
 run("Prologue.stop();flags=[['forestBell','villageBell'],['soulUpper','soulLower'],[]];abilities=[true,true];defeated=[true,false,false];progression=freshProgression();visitedRests=[['start'],['start','arena'],[]];enterRealm(1);state='play';bossStarted=true;");
 place(1300,5800);
}
function to(fraction){run(`boss.inv=0;hitBoss(boss.hp-boss.max*${fraction});`);}
function huge(){run('boss.inv=0;hitBoss(100000);');}
function flush(){run('updateSummons(1);');}
function killSnake(){run('var snake=boss.serpent;snake.hp=0;killEnemy(snake);');}
function killMinions(){run('for(const e of enemies.filter(e=>e.summoned&&!e.dead)){e.hp=0;killEnemy(e);}');}

fresh();assert(!run("bossMoves().includes('summon')||bossMoves().includes('lava')"));
run('scheduleMinions();scheduleMinions(.8);');assert.equal(run('boss.summons.length'),0,'A helper cannot bypass health milestones');
for(const [fraction,total] of [[.8,2],[.6,4]]){
 to(fraction);assert.equal(run('boss.summons.length'),2);flush();assert.equal(run('enemies.filter(e=>e.summoned).length'),total);
 run('queueYomiThresholds();checkBossHealth();scheduleMinions('+fraction+');');assert.equal(run('boss.summons.length'),0,'Thresholds fire exactly once');
}
to(.5);assert.equal(run('boss.yomiStage'),'shelter');assert.equal(run('boss.serpent.hp'),24);
run('endYomiShelter();');
for(const [fraction,total] of [[.4,6],[.2,8]]){to(fraction);flush();assert.equal(run('enemies.filter(e=>e.summoned&&!e.dead).length'),total,'All eight must spawn even when earlier minions are alive');}
assert.equal(run('boss.summonThresholds.length'),4);
run('for(let i=0;i<30;i++){chooseBossMove();startBossAttack();queueYomiThresholds();}');
assert.equal(run('boss.summons.length'),0);assert.equal(run('enemies.filter(e=>e.summoned).length'),8);
const name=run('bossName()');killMinions();assert.equal(run('boss.councilMinionKills'),8);assert.equal(run('bossName()'),name,'There is no visible fight counter');
huge();assert.equal(run('boss.yomiStage'),'race');huge();dismiss();assert(snap().defeated[1]);assert(snap().flags[1].includes('councilKeyEarned'));
assert.equal(run('enemies.filter(e=>e.serpent).length'),0,'Boss victory removes a surviving snake without loot');assert(!snap().flags[1].includes('serpentScale'));

// Burst damage cannot skip the invulnerable half-health interlude or the race.
fresh();huge();assert.equal(run('boss.hp'),24);assert.equal(run('boss.yomiStage'),'shelter');assert.equal(run('boss.summons.length'),4);
assert.equal(run('boss.shelterTriggered'),true);assert.equal(run('hitBoss(100000)'),false);assert.equal(run('boss.hp'),24);
run('boss.hp=-1000;checkBossHealth();');assert.equal(run('boss.hp'),24);assert(!snap().defeated[1]);
run('boss.serpent.hp=17;updateYomiWave(2);boss.waveClock=9.1;updateYomiWave(0);');
assert.equal(run('platforms.filter(p=>p.bossPlatform&&p.broken).length'),5);assert.equal(run('boss.yomiStage'),'shelter');
assert(!run('platforms.find(p=>p.id===boss.platformOrder.at(-1)).broken'));
run('updateYomiWave(.2);');assert.equal(run('boss.yomiStage'),'normal');assert.equal(run('boss.serpent.phase'),'dormant');assert.equal(run('boss.serpent.active'),false);assert.equal(run('boss.serpent.hp'),17);
assert.equal(run('platforms.filter(p=>p.bossPlatform&&p.broken).length'),0);
const dormant=run('boss.serpent.clock');run('updateEnemies(1);');assert.equal(run('boss.serpent.clock'),dormant);
huge();assert.equal(run('boss.hp'),4.800000000000001);assert.equal(run('boss.yomiStage'),'race');assert.equal(run('boss.serpent.hp'),17);assert(run('boss.serpent.active'));
assert.equal(run('boss.summons.length'),8,'Unflushed earlier portals are never a cap for later pairs');
const clock=run('boss.waveClock'),snakeClock=run('boss.serpent.clock');run("state='pause';");tick(120);assert.equal(run('boss.waveClock'),clock);assert.equal(run('boss.serpent.clock'),snakeClock);run("state='play';");

// The boss is at the final island's height and can be struck by the real sword.
run('var refuge=platforms.find(p=>p.id===boss.platformOrder.at(-1));');
assert.equal(run('boss.y+boss.h'),run('refuge.y'));
place(run('boss.x-60'),run('refuge.y'));const raceHp=run('boss.hp');
run('boss.inv=0;attackFace=1;resolveMeleeHit();');assert(run('boss.hp')<raceHp,'The final refuge must permit an actual melee hit');

// Killing the snake ends the shelter immediately and grants one permanent scale.
fresh();huge();const xp=snap().progression.totalXp;killSnake();
assert.equal(run('boss.yomiStage'),'normal');assert(snap().flags[1].includes('serpentScale'));assert.equal(snap().progression.totalXp,xp+70);
run('killEnemy(snake);');assert.equal(snap().progression.totalXp,xp+70);assert.equal(snap().flags[1].filter(f=>f==='serpentScale').length,1);
huge();assert.equal(run('boss.serpent.dead'),true);assert.equal(run('boss.serpent.active'),false,'A killed snake does not return');
run("projectiles.push({source:'serpent:old',life:5});revive();");assert(snap().flags[1].includes('serpentScale'));assert.equal(run('boss.yomiStage'),'normal');assert.equal(run('boss.serpent'),null);
assert(!run("projectiles.some(p=>p.source?.startsWith('serpent:'))"));
run('bossStarted=true;');huge();assert.equal(run('boss.serpent.hp'),24,'A new attempt starts with a new full-health snake');killSnake();assert.equal(snap().flags[1].filter(f=>f==='serpentScale').length,1);

// The lava race has a finite last refuge and ignores damage immunity on contact.
fresh();huge();run('endYomiShelter();');huge();run('updateYomiWave(2);boss.waveClock=10.69;updateYomiWave(0);');
assert.equal(run('platforms.filter(p=>p.bossPlatform&&!p.broken).length'),1);
run('updateYomiWave(.02);');assert.equal(run('platforms.filter(p=>p.bossPlatform&&!p.broken).length'),0,'The last platform really collapses');
place(1300,5800);run('player.inv=999;dash=999;updateBossHazards(.01);');assert(!run('bossStarted'),'Race lava kills even through dash/invulnerability');assert.equal(snap().player.hp,snap().player.maxHp);
assert.equal(run('boss.summonThresholds.length'),0);assert.equal(run('boss.serpent'),null);

// Physical falling from the last island eventually reaches lethal lava.
fresh();huge();run('endYomiShelter();');huge();flush();
run('boss.autoCooldown=999;boss.serpent.active=false;for(const e of enemies)if(e.summoned)e.dead=true;var lastIsland=platforms.find(p=>p.id===boss.platformOrder.at(-1));');
place(run('lastIsland.x+20'),run('lastIsland.y'));run('player.inv=999;dash=0;player.vx=0;');tick(1750);
assert(!run('bossStarted'));assert.equal(run('boss.yomiStage'),'normal');assert.equal(run('enemies.filter(e=>e.serpent).length'),0);

// Stale summons, ordinary enemies and other realms do not earn council credit.
fresh();to(.8);flush();run('var stale=enemies.find(e=>e.summoned);resetBossBattle();bossStarted=true;stale.hp=0;killEnemy(stale);');assert.equal(run('boss.councilMinionKills'),0);
to(.8);flush();run('var fake=enemies.find(e=>e.summoned);fake.councilEligible=false;fake.hp=0;killEnemy(fake);');assert.equal(run('boss.councilMinionKills'),0);
run('enterRealm(0);');assert.equal(run('enemies.filter(e=>e.serpent).length'),0);run('enterRealm(1);');assert.equal(run('boss.serpent'),null);assert.equal(run('boss.summonThresholds.length'),0);
// Both shelter exits retain arena pursuit, even beyond the old detection/patrol span.
for(const ending of ['serpent','survival'])for(const raised of [false,true]){
 fresh();if(raised)place(1300,5695);huge();flush();
 if(ending==='serpent')killSnake();
 else run('updateYomiWave(2);boss.waveClock=10;updateYomiWave(0);');
 place(2800,5800);
 const attempts=run(`var minionAttacks=new Set();for(let i=0;i<2400;i++){updateEnemies(1/60);for(const e of enemies)if(e.summoned&&e.attackTime>0)minionAttacks.add(e.kind);}Array.from(minionAttacks);`);
 assert(attempts.includes('guard')&&attempts.includes('mage'),`${ending}/${raised}: both minion roles must pursue and attack a distant target`);
 run('player.inv=0;for(let i=0;i<240&&player.hp===player.maxHp;i++)updateEnemies(1/60);');
 assert(run('player.hp<player.maxHp'),'The pursuing minions can actually damage Momo');
 assert(run('enemies.filter(e=>e.summoned).every(e=>e.baseY+e.h===level.arena.y)'), 'Minions leave old island supports when Momo returns to the floor');
 assert.equal(run('boss.councilMinionKills'),0,'Pursuit changes do not award secret credit');
 // Keep Momo far from the boss after either exit: it must approach rather than
 // cycling empty melee attacks on the other side of the arena.
 place(400,5800);const beforeX=run('boss.x');
 run('for(let i=0;i<600;i++)updateBoss(1/60);');
 assert(beforeX-run('boss.x')>750,`${ending}: boss should continue pursuing during its wait phase`);
 assert.equal(run('boss.cycles'),0,'Distant melee cycles cannot stall pursuit');
 run('for(let i=0;i<1800;i++)updateBoss(1/60);');
 assert(run('boss.cycles>0'),'Normal telegraphed offense resumes after approaching');
 const enemyX=run('enemies.find(e=>e.summoned).x'),bossX=run('boss.x');run("state='pause';");tick(120);
 assert.equal(run('boss.x'),bossX);assert.equal(run('enemies.find(e=>e.summoned).x'),enemyX);
 run("state='play';resetBossBattle();");assert(!run('enemies.some(e=>e.summoned)'));
}
// Encounter pursuit is neither a global detection buff nor inherited by stale summons.
for(const context of ['outside','stale','ordinary']){
 fresh();to(.8);flush();
 run(`var isolated=enemies.find(e=>e.summoned&&e.kind==='guard');enemies=[isolated];if('${context}'==='stale')isolated.encounterId--;if('${context}'==='ordinary')isolated.summoned=false;`);
 place(context==='outside'?run('level.arena.x+level.arena.w+150'):2800,5800);
 run('for(let i=0;i<600;i++)updateEnemies(1/60);');
 assert(run('isolated.x>=isolated.patrolLeft&&isolated.x<=isolated.patrolRight'));
 assert(run('isolated.patrolRight-isolated.patrolLeft<=460'),'Unengaged/stale/ordinary units keep their patrol limits');
 assert.equal(run('isolated.attackTime'),0);assert.equal(run('isolated.windup'),0);
}
// Already-released embers outlive their caster, but never the encounter.
function fireEmbers(){
 fresh();huge();
 run("enemies=[boss.serpent];boss.summons=[];boss.autoCooldown=999;boss.serpent.targetX=player.x+player.w/2;boss.serpent.targetY=player.y+player.h*.5;updateLavaSerpent(boss.serpent,1.11);");
 assert.equal(run("projectiles.filter(p=>p.source?.startsWith('serpent:')).length"),3);
}
for(const ending of ['survival','defeat']){
 fireEmbers();
 if(ending==='survival')run('updateYomiWave(2);boss.waveClock=10;updateYomiWave(0);');
 else killSnake();
 assert.equal(run('boss.yomiStage'),'normal');
 assert.equal(run('projectiles.length'),3,`${ending}: emitted embers survive the serpent disappearing`);
 const emberX=run('projectiles[1].x'),emberLife=run('projectiles[1].life');
 run("state='pause';");tick(120);
 assert.equal(run('projectiles[1].x'),emberX);assert.equal(run('projectiles[1].life'),emberLife);
 run("state='play';boss.inv=0;boss.autoCooldown=999;boss.clock=999;");tick(1);
 assert.notEqual(run('projectiles[1].x'),emberX,'An orphaned ember keeps moving');
 // Arrange impact on the following real game update, with all other damage sources removed.
 run("var ember=projectiles[1];projectiles=[ember];enemies=[];level={...level,hazards:[]};player.x=ember.x-player.w/2;player.y=ember.y-player.h/2;player.vx=0;player.vy=0;player.inv=0;dash=0;");
 const before=snap().player.hp;tick(1);
 assert.equal(snap().player.hp,before-1,'An orphaned ember still damages Momo');
 assert.equal(run('projectiles.length'),0,'The ember is consumed on impact');
}
fireEmbers();run('endYomiShelter();');huge();assert.equal(run('projectiles.length'),3,'Returning serpent does not cancel earlier embers');
fireEmbers();run('endYomiShelter();enemies=[];boss.clock=999;boss.autoCooldown=999;player.inv=999;projectiles.forEach(p=>{p.vx=0;p.vy=0;p.x=0;p.y=0;});');tick(500);
assert.equal(run('projectiles.length'),0,'Orphaned embers expire normally');
for(const cleanup of ['resetBossBattle()','finishBossBattle()','revive()','enterRealm(0)']){
 fireEmbers();run(cleanup);assert(!run("projectiles.some(p=>p.source?.startsWith('serpent:'))"),`${cleanup}: encounter cleanup still removes serpent attacks`);
}
console.log('PASS: Yomi milestones, secret rewards, shelter/race, pursuit, persistent serpent projectiles, impact/expiry/pause and encounter cleanup.');
