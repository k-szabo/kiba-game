const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {run,snap,tick,press,release,place,elements,dismiss}=require('./test-harness.cjs')();

// Both UI and direct purchase reject spirit training until the actual ability is acquired.
run("abilities=[true,false];progression=freshProgression();awardXP(160);enterRealm(0);state='play';");place(330,1000);press('u');tick();release('u');
assert.match(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),/id="spiritTraining" hidden/);
assert(elements.get('spiritTraining').hidden);assert(elements.get('train-spirit').disabled);
const points=snap().progression.points;assert(!run("spendPoint('spirit')"));assert.equal(snap().progression.points,points);assert.equal(snap().progression.stats.spirit,0);
assert(run("spendPoint('strength')"));run("closeTraining();enterRealm(1);state='play';");const ability=run('level.ability');place(ability.x,ability.y);press('e');tick();release('e');dismiss();assert(snap().abilities[1]);
place(1730,2700);press('u');tick();release('u');assert(!elements.get('spiritTraining').hidden);assert(!elements.get('train-spirit').disabled);assert(run("spendPoint('spirit')"));run('closeTraining();persist();mainMenu();startGame(true);');assert.equal(snap().progression.stats.spirit,1);

// A legacy spirit investment survives, but cannot be extended without owning dash.
run("abilities=[false,false];progression=normalizeProgression({level:4,stats:{spirit:1}});enterRealm(0);state='play';");place(330,1000);run("showTraining();");assert(elements.get('spiritTraining').hidden);assert(!run("spendPoint('spirit')"));assert.equal(snap().progression.stats.spirit,1);run('closeTraining();');

// Optional relics are off the initial map and cannot be collected before their guardian dies.
run("flags=[[],[],[]];defeated=[false,false,false];abilities=[true,false];enterRealm(0);state='play';showMap();var initialMap=$('mapContent').children[0].innerHTML;closeMap();");
place(2800,530);run("var oldAngel=enemies.find(e=>e.id==='oldAngel');discoverSecrets();updateMiniboss(oldAngel,.1);player.face=1;attackCooldown=0;melee();advanceSwordAttack(.17);");assert(!run('oldAngel.active'));assert.equal(run('oldAngel.hp'),36);assert(!run("secretKnown('angelRuin')"),'Passing below the tower exposed its map');
for(const id of ['angelHalo','demonHorn']){
  const o=run(`level.objects.find(o=>o.id==='${id}')`);place(o.x,o.y);assert(!run(`relicUnlocked(level.objects.find(o=>o.id==='${id}'))`));press('e');tick();release('e');assert(!snap().relics.includes(id));
  const enemy=run(`enemies.find(e=>e.id==='${o.guardian}')`);assert(enemy.miniboss);assert(enemy.hp>=36);assert(run(`secretKnown('${o.secretArea}')`));
  const before=snap().progression.totalXp;run(`var guard=enemies.find(e=>e.id==='${o.guardian}');guard.phase='wait';guard.clock=999;`);place(run('guard.x-65'),run('guard.y+guard.h'));run('player.face=1;');
  for(let i=0;i<30&&!run('guard.dead');i++){press('j');tick(60);release('j');}
  assert(run('guard.dead'),'Timed Momo sword hits cannot defeat '+o.guardian);run('killEnemy(guard);');place(o.x,o.y);
  assert.equal(snap().progression.totalXp-before,id==='angelHalo'?80:95);
  press('e');tick();release('e');assert(snap().relics.includes(id));dismiss();
}
run("respawnEnemies();");assert(run('enemies.filter(e=>e.miniboss).every(e=>e.dead)'));assert(run('enemies.filter(e=>!e.miniboss).every(e=>!e.dead)'));
run('persist();mainMenu();startGame(true);');assert.deepEqual(Array.from(snap().relics),['angelHalo','demonHorn']);assert(run('enemies.filter(e=>e.miniboss).every(e=>e.dead)'));assert(run('relicRitualReady()'));
run("showMap();var discoveredMap=$('mapContent').children[0].innerHTML;closeMap();");assert(run('discoveredMap.length>initialMap.length'));

// The inconspicuous stone seal is solid until an ordinary, timed sword hit breaks it.
run("flags=[[],[],[]];defeated[0]=false;enterRealm(0);state='play';enemies=[];");place(4550,1510);run("player.face=-1;var wall=level.gates.find(g=>g.id==='cultEntrance');");assert(!run('gatePass(wall)'));press('j');tick(12);release('j');assert(!run('gatePass(wall)'));tick(12);assert(run('gatePass(wall)'));assert(snap().flags[0].includes('cultEntrance'));
run("defeated[0]=true;");assert(!run("gatePass(level.gates.find(g=>g.kind==='secretRock'))"),'Realm boss defeat must not erase the cave structure');

// Each mini has three actual attacks; tells lock facing, and spells/hazards release afterwards.
for(const id of ['oldAngel','oldCultist']){
  run("flags=[[],[],[]];defeated[0]=false;enterRealm(0);state='play';");run(`var mini=enemies.find(e=>e.id==='${id}');enemies=[mini];`);place(run('mini.x-130'),run('mini.y+mini.h'));run('mini.clock=0;player.inv=999;');
  const moves=[];
  for(let i=0;i<3;i++){
    run('mini.phase="wait";mini.clock=0;updateMiniboss(mini,.01);');assert.equal(run('mini.phase'),'windup');moves.push(run('mini.move'));const face=run('mini.face');const windup=run('mini.clock');
    run(`updateMiniboss(mini,${windup-.02});`);assert.equal(run('mini.phase'),'windup');assert.equal(run('mini.face'),face);
    run('updateMiniboss(mini,.03);');assert.equal(run('mini.phase'),'strike');run('draw();');
  }
  assert.equal(new Set(moves).size,3);assert(run("projectiles.some(p=>p.source==='mini:'+mini.id)"));if(id==='oldCultist')assert.equal(run('mini.hazards.length'),3);
  run('mini.hp=4;mini.hazards.push({warning:5,life:5});revive();');assert.equal(run('mini.hp'),run('mini.maxHp'));assert.equal(run('mini.hazards.length'),0);assert(!run('mini.active'));assert(!run("projectiles.some(p=>p.source.startsWith('mini:'))"));
}

// All angel forms have independent, telegraphed melee while the spell cycle continues.
for(const stage of [1,2,3]){
  run("flags=[['angelHalo','demonHorn'],[],[]];defeated[2]=false;enterRealm(2);state='play';bossStarted=true;");
  assert.equal(run('boss.max'),140);if(stage>1)run(`transformAngel(${stage});boss.inv=0;`);
  assert.equal(run('boss.max'),stage===3?180:140);run(`boss.stage=${stage};boss.move='${stage===1?'lightArrows':stage===2?'shadowBolts':'eclipse'}';boss.targetX=boss.x+160;startBossAttack();boss.autoCooldown=0;`);
  place(run('boss.x+170'),850);run('player.hp=player.maxHp=12;player.inv=0;');const hp=snap().player.hp;
  run('updateBoss(.01);');assert.equal(run('boss.autoPhase'),'windup');assert.equal(snap().player.hp,hp);const duration=run('boss.autoClock');
  run(`updateBoss(${duration-.02});`);assert.equal(snap().player.hp,hp);assert.equal(run('boss.autoPhase'),'windup');assert(run('boss.hazards.length>0||projectiles.length>0'),'Auto attack erased spells');
  // Isolate the announced melee impact from spell collision to check its exact damage.
  run('boss.hazards=[];projectiles=[];updateBoss(.03);');assert.equal(snap().player.hp,hp-(stage===3?3:2));assert.equal(run('boss.autoPhase'),'strike');run('draw();');
  run('resetBossBattle();');assert.equal(run('boss.autoPhase'),null);assert.equal(run('boss.max'),140);
}
run("flags=[['angelHalo','demonHorn'],[],[]];defeated[2]=false;enterRealm(2);state='play';bossStarted=true;hitBoss(70);updateBoss(1.81);boss.inv=0;hitBoss(70);");assert.equal(run('boss.stage'),3);assert.equal(run('boss.hp'),180);assert(!snap().defeated[2]);

// New atlas coordinates fit real PNG bounds, including every six-pose guard sprite.
const art=run('({manifest:ART_MANIFEST,frames:ART_FRAMES})');for(const key of ['oldAngel','oldCultist']){
  assert.equal(art.frames[key].length,6);const png=fs.readFileSync(path.join(__dirname,'..',art.manifest[key]));const w=png.readUInt32BE(16),h=png.readUInt32BE(20);
  for(const f of art.frames[key])assert(f.x>=0&&f.y>=0&&f.x+f.w<=w&&f.y+f.h<=h&&f.anchorX>=f.x&&f.anchorX<=f.x+f.w&&f.anchorY>=f.y&&f.anchorY<=f.y+f.h);
}
console.log('PASS: ability-gated training and legacy stats, discovered-only secrets, sealed and guarded relics, persistent miniboss rewards, three telegraphed moves each, death resets, stronger angel forms and simultaneous melee/spells, secret refill and complete atlas bounds.');
