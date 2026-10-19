const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {run,snap,tick,press,release,place,elements,storage}=require('./test-harness.cjs')();

// Reproduce the old clamped-edge chase bug for every normal enemy role in every realm.
for(let realm=0;realm<3;realm++)for(const kind of ['guard','archer','shield','mage']){
  run(`enterRealm(${realm});state='play';enemies=enemies.filter(e=>!e.miniboss&&e.kind==='${kind}').slice(0,1);var e=enemies[0];e.x=e.patrolRight;e.face=1;e.patrolFace=-1;e.cd=999;player.x=e.patrolRight+220;player.y=e.y;player.inv=999;`);
  let flips=0,lastFace=run('e.face'),minGap=999,lastFlip=-999;
  for(let i=0;i<1200;i++){run('updateEnemies(1/120);');const face=run('e.face');if(face!==lastFace){flips++;minGap=Math.min(minGap,i-lastFlip);lastFlip=i;}lastFace=face;}
  assert.equal(flips,0,`Spinning on ${realm}/${kind}`);
  assert(run('e.x>=e.patrolLeft&&e.x<=e.patrolRight'));
  // A patrol reverses once at the edge and actually leaves it.
  run('player.x=-5000;e.x=e.patrolRight;e.face=1;e.patrolFace=1;e.turnCooldown=0;e.edgePause=0;updateEnemies(1/120);');
  assert.equal(run('e.face'),-1);run('for(let i=0;i<80;i++)updateEnemies(1/120);');assert(run('e.x<e.patrolRight-2'));
}

// Healing at a shrine respawns enemies but keeps quest progress, XP and defeated bosses.
run("enterRealm(1);state='play';flags[1]=['soulUpper'];defeated[0]=true;progression=freshProgression();enemies.forEach(e=>e.dead=true);projectiles=[{source:'enemy',life:3}];");
place(1810,1790);run('awardXP(160);');const levelBefore=snap().progression.level;press('e');tick();release('e');
assert(run('enemies.every(e=>!e.dead&&e.hp===e.maxHp)'));assert.equal(run('projectiles.length'),0);assert(snap().flags[1].includes('soulUpper'));assert(snap().defeated[0]);assert.equal(snap().progression.level,levelBefore);assert.equal(snap().player.hp,snap().player.maxHp);

// Lethal damage resets normal enemies in every realm, preserving permanent progress.
{
  const deathTest=require('./test-harness.cjs')();
  for(let r=0;r<3;r++)for(const guardianDead of [false,true])for(const cause of ['combat','fall','fallFullHp']){
    deathTest.run(`flags=[['forestBell','guardian:oldAngel'],['soulUpper'],['dawnSeal'],[]];abilities=[true,true];defeated=[false,false,false,false];defeated[${r}]=${guardianDead};progression=freshProgression();enterRealm(${r});state='play';awardXP(160);checkpoint={...level.rests[1]};enemies.filter(e=>!e.miniboss).forEach((e,i)=>{e.dead=i!==0;e.hp=i===0?1:0;});projectiles=[{source:'enemy',life:3},{source:'boss',life:3}];player.hp=1;player.inv=0;`);
    if(cause==='fallFullHp')deathTest.run('player.hp=player.maxHp;player.inv=999;dash=.1;');
    const before=deathTest.snap();
    deathTest.run(cause==='combat'?'damage(100);':'player.y=level.height+200;movePlayer(1/120);');
    const after=deathTest.snap();
    assert(deathTest.run('enemies.filter(e=>!e.miniboss).every(e=>!e.dead&&e.hp===e.maxHp)'),`Death respawn in realm ${r}`);
    assert.equal(after.player.hp,after.player.maxHp);
    assert.equal(after.player.x+after.player.w/2,before.checkpoint.x);
    assert.equal(after.player.y+after.player.h,before.checkpoint.y);
    assert.deepEqual(after.progression,before.progression);
    assert.deepEqual(after.flags,before.flags);
    assert.deepEqual(after.abilities,before.abilities);
    assert.deepEqual(after.defeated,before.defeated);
    assert.equal(after.boss.dead,guardianDead);
    assert.equal(deathTest.run('projectiles.length'),0);
    if(r===0)assert(deathTest.run("enemies.find(e=>e.id==='oldAngel').dead"),'Defeated miniboss stays defeated');
  }
  deathTest.run('enemies.find(e=>!e.miniboss).dead=true;player.hp=3;player.y=level.height+200;movePlayer(1/120);');
  assert(deathTest.run('enemies.filter(e=>!e.miniboss).every(e=>!e.dead)'), 'Every fall must respawn normal enemies');
  assert.equal(deathTest.snap().player.hp,deathTest.snap().player.maxHp);
}

// XP awards exactly once per kill; the player chooses real stats at a nearby shrine.
run("enterRealm(0);progression=freshProgression();var e=enemies.find(e=>!e.miniboss&&e.kind==='guard');e.dead=false;e.hp=0;killEnemy(e);killEnemy(e);");assert.equal(snap().progression.totalXp,20);
run('awardXP(140);');assert.equal(snap().progression.level,3);assert.equal(snap().progression.points,2);
press('u');tick();release('u');assert.equal(snap().state,'training');assert(run("spendPoint('vitality')"));assert(run("spendPoint('strength')"));assert(!run("spendPoint('spirit')"));assert.equal(snap().player.maxHp,6);assert.equal(snap().stats.damage,2.5);
run('closeTraining();persist();mainMenu();startGame(true);');assert.equal(snap().player.maxHp,6);assert.equal(snap().progression.stats.strength,1);assert.equal(snap().progression.points,0);
run('saved.progression=null;startGame(true);');assert.equal(snap().progression.level,1);assert.equal(snap().player.maxHp,5);
assert.equal(run('normalizeProgression({level:3,points:999,stats:{vitality:99,strength:99,spirit:99}}).points'),0);

// A shield gives readable blocking, guard-break and rear/air punish windows.
run("enterRealm(0);state='play';var e=enemies.find(e=>e.kind==='shield');enemies=[e];e.face=1;e.turnCooldown=999;e.cd=999;");
place(run('e.x+e.w+15'),run('e.y+e.h'));run('player.face=-1;attackCooldown=0;melee();advanceSwordAttack(.17);');assert.equal(run('e.hp'),6);
run('attackCooldown=0;melee();advanceSwordAttack(.17);attackCooldown=0;melee();advanceSwordAttack(.17);');assert(run('e.guardBreak>0'));run('attackCooldown=0;melee();advanceSwordAttack(.17);');assert(run('e.hp<6'));

// Windup locks facing and does not release projectiles before the advertised tell.
for(const kind of ['archer','mage']){
  run(`enterRealm(0);state='play';var e=enemies.find(e=>!e.miniboss&&e.kind==='${kind}');enemies=[e];player.x=e.x+180;player.y=e.y;e.cd=0;e.face=1;e.turnCooldown=0;projectiles=[];updateEnemies(.01);`);
  const duration=run('e.windupDuration');run(`updateEnemies(${duration-.04});`);assert.equal(run('projectiles.length'),0);run('updateEnemies(.05);');assert(run('projectiles.length>0'));assert(run('e.attackTime>0'));
}

// Every boss advertises three distinct moves; no offense is active during the initial tell.
const moves=[];
for(let realm=0;realm<3;realm++){
  run(`defeated[${realm}]=false;enterRealm(${realm});state='play';bossStarted=true;player.x=level.boss.x-280;player.y=level.boss.y-69;player.inv=999;`);
  const found=[];
  for(let i=0;i<3;i++){
    run('chooseBossMove();');found.push(run('boss.move'));
    const windup=run('boss.clock');assert(windup>=.8);assert.equal(run('projectiles.length'),0);
    run(`updateBoss(${windup-.02});`);assert.equal(run('boss.phase'),'windup');assert(run('!boss.lava||!boss.lava.active'));
    run('updateBoss(.03);');assert.equal(run('boss.phase'),'strike');run('finishBossBattle();projectiles=[];');
  }
  assert.equal(new Set(found).size,realm===0?3:2);moves.push(found);
}
assert.deepEqual(moves,[['cleave','dash','doubleCut'],['hammer','slam','hammer'],['lightArrows','holySweep','lightArrows']]);

// Lava islands collapse in order, retain a safe final refuge, and reset after death/victory.
run("defeated[1]=false;enterRealm(1);state='play';bossStarted=true;startYomiLavaWave('shelter');player.inv=999;boss.autoCooldown=999;boss.serpent.active=false;");
const first=run('boss.platformOrder[0]'),last=run('boss.platformOrder.at(-1)');
run('for(let i=0;i<492;i++)updateBoss(1/120);');assert(run(`platforms.find(p=>p.id==='${first}').broken`));assert(!run(`platforms.find(p=>p.id==='${last}').broken`));
run('for(let i=0;i<600;i++)updateBoss(1/120);');assert(run('boss.destroyedCount>=4'));assert(!run(`platforms.find(p=>p.id==='${last}').broken`));
run('resetBossBattle();');assert(run('platforms.filter(p=>p.bossPlatform).every(p=>!p.broken&&!p.crumble)'));assert.equal(run('boss.lava'),null);assert(!run('bossStarted'));
// The refuge is safe with actual gravity/collision and no invulnerability cheat.
run("state='play';bossStarted=true;startYomiLavaWave('shelter');boss.autoCooldown=999;boss.serpent.active=false;var refuge=platforms.find(p=>p.id===boss.platformOrder.at(-1));initPlayer({x:refuge.x+refuge.w/2,y:refuge.y});player.inv=0;player.onGround=true;player.support=refuge.id;keys.clear();pressed.clear();var safeHp=player.hp;for(let i=0;i<810;i++){movePlayer(1/120);updateBoss(1/120);player.inv=Math.max(0,player.inv-1/120);}");assert.equal(snap().player.hp,run('safeHp'));assert.equal(snap().player.support,run('refuge.id'));
// A destroyed ledge ceases to support the player immediately.
run('var p=platforms.find(p=>p.bossPlatform);p.broken=true;initPlayer({x:p.x+120,y:p.y});player.onGround=true;player.support=p.id;movePlayer(.15);');assert(snap().player.y+69>run('p.y'));assert.notEqual(snap().player.support,run('p.id'));
run("bossStarted=true;boss.hp=0;boss.lava={active:true};platforms.find(p=>p.bossPlatform).broken=true;boss.hazards=[{life:9}];guardianDefeated();");assert(run('boss.dead'));assert.equal(run('boss.hazards.length'),0);assert.equal(run('boss.lava'),null);assert(run('platforms.filter(p=>p.bossPlatform).every(p=>!p.broken)'));

// Corrupted angel combines huge descending light arrows and aimed shadow bolts.
run("defeated[2]=false;enterRealm(2);state='play';bossStarted=true;boss.cycles=0;chooseBossMove();startBossAttack();updateBoss(.05);");assert.equal(run('boss.hazards[0].kind'),'lightPillar');assert(run('boss.hazards[0].h>=480'));assert(run('boss.hazards[0].warning>0'));
run("boss.stage=2;boss.cycles=0;chooseBossMove();startBossAttack();updateBoss(.05);");assert(run("projectiles.some(p=>p.kind==='shadowBolt'&&p.source==='boss')"));

// Atlas frames remain valid; each role has six movement and six attack pictures.
const art=run('({manifest:ART_MANIFEST,frames:ART_FRAMES})');
for(const faction of ['japan','yomi','heaven'])for(const action of ['walk','attack'])for(const kind of ['guard','archer','shield','mage']){
  const rows=art.frames.animations[faction][action][kind];assert.equal(rows.length,6);
  const png=fs.readFileSync(path.join(__dirname,'..',art.manifest[faction+action[0].toUpperCase()+action.slice(1)]));const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
  for(const f of rows){assert(f.x>=0&&f.y>=0&&f.w>0&&f.h>0&&f.x+f.w<=width&&f.y+f.h<=height);}
}
for(let realm=0;realm<3;realm++){run(`enterRealm(${realm});state='play';bossStarted=true;chooseBossMove();draw();startBossAttack();updateBoss(.1);draw();`);}
// Check the real HTML declares every fixed DOM target rather than relying on permissive stubs.
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
for(const file of ['game','progression','combat'])for(const m of fs.readFileSync(path.join(__dirname,'../assets/js',file+'.js'),'utf8').matchAll(/\$\('([^']+)'\)/g))assert(ids.has(m[1]),`Missing HTML element ${m[1]}`);
console.log('PASS: stable edge chase and patrol turns for all factions/roles, shrine respawns, XP-once, training and saved progression, shields, attack windups, three distinct boss movesets, sequential lava-platform collapse/reset, corrupted angel spells and animation-frame bounds.');
