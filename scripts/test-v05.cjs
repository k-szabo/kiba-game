const assert=require('node:assert/strict');
const {run,snap,tick,press,release,place,dismiss,storage,elements}=require('./test-harness.cjs')();

// Kiba's visible windup precedes one synchronized hit, with a locked sword direction.
run("enterRealm(0);state='play';progression=freshProgression();var foe=enemies.find(e=>e.kind==='guard');enemies=[foe];foe.cd=999;");
place(run('foe.x-40'),run('foe.y+foe.h'));run('player.face=1;attackCooldown=0;melee();');assert.equal(run('foe.hp'),4);
run('advanceSwordAttack(.12);player.face=-1;');assert.equal(run('foe.hp'),4);
run('advanceSwordAttack(.05);');assert.equal(run('foe.hp'),2);assert.equal(snap().attack.face,1);
run('advanceSwordAttack(.1);');assert.equal(run('foe.hp'),2,'A single swing hit more than once');
run('var slashCalls=0;var slashFace=0;var originalSlash=Visuals.kibaSlash;Visuals.kibaSlash=(...args)=>{slashCalls++;slashFace=args[4];originalSlash(...args);};player.inv=0;player.onGround=false;player.vx=285;draw();');assert.equal(run('slashCalls'),1,'Air/running animation overrides the slash');assert.equal(run('slashFace'),1);
run('player.onGround=true;draw();');assert.equal(run('slashCalls'),2,'Running animation overrides the slash');
run('Visuals.kibaSlash=originalSlash;');

// Collectibles require E, persist across realms/save reload, and cannot be picked twice.
run("flags=[[],[],[]];enterRealm(0);state='play';");
for(const id of ['angelHalo','demonHorn']){
  run(`killEnemy(enemies.find(e=>e.id===level.objects.find(o=>o.id==='${id}').guardian));`);const point=run(`level.objects.find(o=>o.id==='${id}')`);place(point.x,point.y);press('e');tick();release('e');assert(snap().relics.includes(id));dismiss();
}
run("enterRealm(1);persist();mainMenu();startGame(true);");assert.deepEqual(Array.from(snap().relics),['angelHalo','demonHorn']);assert.equal(snap().realm,1);assert(run('relicRitualReady()'));
run("mainMenu();saved={version:1,layout:2,realm:0,abilities:[false,false],defeated:[false,false,false],flags:[[],[],[]],visitedRests:[[],[],[]],shards:0,progression:freshProgression()};startGame(true);");assert.equal(snap().relics.length,0);

// Oni has both normal hammer offense and spells. Lava does not disable the normal attack.
run("defeated[1]=false;enterRealm(1);state='play';bossStarted=true;var oniMoves=bossMoves();");
for(const move of ['hammer','slam','lava','embers','summon'])assert(run(`oniMoves.includes('${move}')`));
place(run('boss.x+180'),5695);run("player.inv=0;boss.phase='strike';boss.move='lava';boss.clock=6.8;boss.phaseDuration=6.8;boss.autoCooldown=0;demonAutoAttack(.01);");
assert.equal(run('boss.autoPhase'),'windup');const hp=snap().player.hp;run('demonAutoAttack(.68);');assert.equal(snap().player.hp,hp);run('demonAutoAttack(.03);');assert.equal(snap().player.hp,hp-2);assert.equal(run('boss.move'),'lava');assert.equal(run('boss.autoPhase'),'strike');

// Portal warning, guard+mage summons, cap, reduced XP-once, and cleanup after death/travel.
run("resetBossBattle();state='play';bossStarted=true;boss.cycles=0;chooseBossMove();startBossAttack();");assert.equal(run('boss.move'),'summon');assert.equal(run('boss.summons.length'),2);assert.equal(run('enemies.filter(e=>e.summoned).length'),0);
run('updateSummons(.9);');assert.equal(run('enemies.filter(e=>e.summoned).length'),0);run('updateSummons(.1);');assert.equal(run('enemies.filter(e=>e.summoned&&!e.dead).length'),2);
assert(run("enemies.some(e=>e.summoned&&e.kind==='mage')&&enemies.some(e=>e.summoned&&e.kind==='guard')"));
run('scheduleMinions();updateSummons(1);scheduleMinions();updateSummons(1);');assert.equal(run('enemies.filter(e=>e.summoned&&!e.dead).length'),4);assert.equal(run('boss.summons.length'),0);
const xpBefore=snap().progression.totalXp;run('var minion=enemies.find(e=>e.summoned);killEnemy(minion);killEnemy(minion);');assert.equal(snap().progression.totalXp,xpBefore+8);
run("projectiles.push({source:'minion',life:5});scheduleMinions();resetBossBattle();");assert.equal(run('enemies.filter(e=>e.summoned).length'),0);assert.equal(run('boss.summons.length'),0);assert(!run("projectiles.some(p=>p.source==='minion')"));

// Normal angel has only holy attacks; 50% changes form without refilling health or paying XP.
run("flags=[[],[],[]];defeated[2]=false;enterRealm(2);state='play';bossStarted=true;");assert.equal(run('boss.stage'),1);assert(run("bossMoves().every(m=>m==='lightArrows'||m==='holySweep')"));
const xpPhase=snap().progression.totalXp;run('hitBoss(boss.max/2-1);');assert.equal(run('boss.stage'),1);run('boss.inv=0;hitBoss(1);');assert.equal(run('boss.stage'),2);assert.equal(run('boss.hp'),run('boss.max/2'));assert.equal(run('boss.phase'),'transform');assert.equal(snap().progression.totalXp,xpPhase);assert(!snap().defeated[2]);
assert(run("bossMoves().every(m=>m.startsWith('shadow'))"));run('hitBoss(100);');assert.equal(run('boss.hp'),run('boss.max/2'),'Transformation should resist further hits');
run('updateBoss(1.81);boss.inv=0;hitBoss(boss.hp);');assert(run('boss.dead'));assert(snap().defeated[2]);dismiss();

// The secret is triggered only by BOTH relics; full HP refill happens once, with no premature win.
for(const items of [[],['angelHalo'],['demonHorn'],['angelHalo','demonHorn']]){
  run(`flags=[${JSON.stringify(items)},[],[]];defeated[2]=false;enterRealm(2);state='play';bossStarted=true;`);
  const eligible=items.length===2,xpStart=snap().progression.totalXp;assert.equal(run('boss.secretEligible'),eligible);
  run('hitBoss(boss.max/2);updateBoss(1.81);boss.inv=0;hitBoss(boss.hp);');
  if(eligible){
    assert.equal(run('boss.stage'),3);assert.equal(run('boss.hp'),run('boss.max'));assert(run('boss.secretTriggered'));assert(!snap().boss.dead&&!snap().defeated[2]);assert.equal(snap().progression.totalXp,xpStart);
    assert(!run('level.winds.find(w=>w.afterBoss)&&defeated[2]'));
    run("updateBoss(1.81);boss.move='eclipse';boss.targetX=player.x;startBossAttack();executeBossMove(0);");assert(run("boss.hazards.some(h=>h.kind==='lightPillar')&&projectiles.some(p=>p.kind==='shadowBolt')"));
    run('boss.inv=0;hitBoss(boss.max);');assert(run('boss.dead'));assert.equal(run('boss.stage'),3);assert.equal(snap().progression.totalXp,xpStart+200);dismiss();
  }else{assert(run('boss.dead'));assert.equal(run('boss.stage'),2);assert.equal(snap().progression.totalXp,xpStart+200);dismiss();}
}
// An overpowered hit cannot bypass the mandatory second form; resets start a fresh encounter.
run("flags=[['angelHalo','demonHorn'],[],[]];defeated[2]=false;enterRealm(2);state='play';bossStarted=true;hitBoss(500);");assert.equal(run('boss.stage'),2);assert(!snap().boss.dead);assert(run('boss.hp>=1'));
run('resetBossBattle();');assert.equal(run('boss.stage'),1);assert.equal(run('boss.hp'),run('boss.max'));assert(!run('boss.secretTriggered'));assert(run('boss.secretEligible'));

// Exact blade regression: follow-through/recovery use full source regions with no clip masks.
assert(run("ART_MANIFEST.samurai.endsWith('samurai-v5.png')"));assert(run('ART_FRAMES.samurai.every(f=>!f.outlines)'));
assert(run('ART_FRAMES.samurai[4].x+ART_FRAMES.samurai[4].w>=1040'));assert(run('ART_FRAMES.samurai[5].x+ART_FRAMES.samurai[5].w>=1490'));assert.equal(run('ART_FRAMES.kibaSlash.length'),8);assert(run('ART_FRAMES.kibaSlash[4].x+ART_FRAMES.kibaSlash[4].w>=532'));
for(const stage of [1,2,3])run(`enterRealm(2);state='play';bossStarted=true;boss.stage=${stage};chooseBossMove();draw();startBossAttack();executeBossMove(0);draw();`);
console.log('PASS: timed eight-frame Kiba slashes during movement/air, locked attack direction and single impact, saved relics, demon auto attacks during lava, telegraphed capped minions/cleanup/XP, 50% angel transformation, both-item secret full-heal phase exactly once, delayed victory/rewards, oversized-hit protection, full sword source regions and all three forms rendered.');
