const assert=require('node:assert/strict');
const {run,snap,tick,press,release,dismiss,place,elements}=require('./test-harness.cjs')();
const validate=require('./test-save-validation.cjs');

function freshYomi(defeatedBoss=false){
 run(`Prologue.stop();flags=[['forestBell','villageBell'],['soulUpper','soulLower'],[]];abilities=[true,true];defeated=[true,${defeatedBoss},false];progression=freshProgression();shards=0;visitedRests=[['start'],['start','arena'],[]];enterRealm(1);state='play';`);
 place(1500,5800);
}
function killSummons(count){
 let remaining=count;
 while(remaining>0){
  let living=Array.from(run('enemies.filter(e=>e.summoned&&!e.dead).map(e=>e.id)'));
  if(!living.length){
   const target=[.8,.6,.4,.2][run('boss.summonThresholds.length')];assert(target,'Only eight minions exist in one fight');
   run(`boss.inv=0;hitBoss(Math.max(0,boss.hp-boss.max*${target}));`);
   if(run("boss.yomiStage==='shelter'"))run('boss.waveWarning=0;boss.lava.active=true;updateYomiWave(12);');
   run(`boss.inv=0;hitBoss(Math.max(0,boss.hp-boss.max*${target}));updateSummons(1);`);
   living=Array.from(run('enemies.filter(e=>e.summoned&&!e.dead).map(e=>e.id)'));assert(living.length);
  }
  for(const id of living.slice(0,remaining)){run(`var councilVictim=enemies.find(e=>e.id===${JSON.stringify(id)});councilVictim.hp=0;killEnemy(councilVictim);`);remaining--;}
 }
}
function defeatBoss(){
 for(let i=0;i<5&&!run('boss.dead');i++)run("if(boss.yomiStage==='shelter'){boss.waveWarning=0;boss.lava.active=true;updateYomiWave(12);}else{boss.inv=0;hitBoss(100000);}");
 assert(run('boss.dead'));dismiss();
}
function useAt(point){const hp=snap().player.hp;place(point.x,point.y);run(`player.hp=${hp};`);press('e');tick();release('e');dismiss();}

// Real sword kills count privately; boss label never exposes the secret condition.
freshYomi();const baseBossName=run('bossName()');
run('bossStarted=true;boss.inv=0;hitBoss(boss.max*.2);updateSummons(1);var swordMinion=enemies.find(e=>e.summoned);');
assert.equal(run('bossName()'),baseBossName);assert.equal(run('boss.councilMinionKills'),0);
place(run('swordMinion.x-35'),run('swordMinion.y+swordMinion.h'));run('player.face=1;');
for(let i=0;i<8&&!run('swordMinion.dead');i++)run('attackCooldown=0;melee();advanceSwordAttack(SWORD_IMPACT);');
assert(run('swordMinion.dead'));assert.equal(run('boss.councilMinionKills'),1);assert.equal(run('bossName()'),baseBossName);
run('boss.councilMinionKills=8;');assert.equal(run('bossName()'),baseBossName);

// Count only newly killed summons during one active, outdoor Yomi attempt.
freshYomi();
assert.equal(run('typeof startCouncilRematch'),'undefined','The removed boss retry API must stay absent');
assert(!run("Object.hasOwn(boss,'rematch')"));
run('scheduleMinions(.8);updateSummons(1);');assert.equal(run('enemies.filter(e=>e.summoned).length'),0,'Pre-encounter summons are forbidden');
run('resetBossBattle();bossStarted=true;');killSummons(2);
assert.equal(run('boss.councilMinionKills'),2);
const xp=snap().progression.totalXp,shards=snap().shards;
run('killEnemy(councilVictim);');
assert.equal(run('boss.councilMinionKills'),2);assert.equal(snap().progression.totalXp,xp);assert.equal(snap().shards,shards);
run('var ordinary=enemies.find(e=>!e.summoned&&!e.miniboss);ordinary.hp=0;killEnemy(ordinary);');
assert.equal(run('boss.councilMinionKills'),2,'Ordinary Yomi guards cannot count');
assert(!run('awardCouncilKeyDrop()'),'A living boss cannot drop the key');
run('boss.dead=true;scheduleMinions(.6);updateSummons(1);');assert.equal(run('boss.councilMinionKills'),2,'Post-victory minions cannot count');
run('resetBossBattle();');assert.equal(run('boss.councilMinionKills'),0);
run('enterRealm(0);bossStarted=true;scheduleMinions();updateSummons(1);for(const e of enemies.filter(e=>e.summoned)){e.hp=0;killEnemy(e);}');assert.equal(run('boss.councilMinionKills'),0,'Other realm summons cannot count');

// The eighth kill qualifies, but only the boss victory makes the drop permanent.
for(const count of [0,7,8]){
 freshYomi();run('bossStarted=true;');killSummons(count);
 assert.equal(run('boss.councilMinionKills'),count);
 assert(!snap().flags[1].includes('councilKeyEarned'));
 const firstVictory=snap();defeatBoss();
 assert.equal(snap().progression.totalXp,firstVictory.progression.totalXp+400);
 assert.equal(snap().shards,firstVictory.shards+20);
 assert(snap().defeated[1]);
 assert.equal(snap().flags[1].includes('councilKeyEarned'),count>=8,`${count} summon kills produced the wrong key result`);
 assert(!run('awardCouncilKeyDrop()'),'Repeated victory callbacks must not award another key');
 assert.equal(snap().flags[1].filter(f=>f==='councilKeyEarned').length,count>=8?1:0);
 validate(run('saved'));
}

// Death and shrine rest discard partial attempts without discarding permanent progress.
freshYomi();run('bossStarted=true;');killSummons(3);run('revive();');
assert.equal(run('boss.councilMinionKills'),0);assert(!run('bossStarted'));
assert(!snap().flags[1].includes('councilKeyEarned'));
run('bossStarted=true;');killSummons(3);useAt(run('level.rests[0]'));
assert.equal(run('boss.councilMinionKills'),0);assert(!run('bossStarted'));
run('bossStarted=true;');killSummons(1);defeatBoss();assert(!snap().flags[1].includes('councilKeyEarned'));

// A failed victory permanently misses the optional branch until a new game.
const missedProgress=JSON.stringify(snap().progression),missedShards=snap().shards;
for(const reset of ['revive();','resetBossBattle();','persist();mainMenu();startGame(true);']){
 run(reset);dismiss();useAt(run('level.boss'));
 assert(run('boss.dead'));assert(snap().defeated[1]);assert(!snap().flags[1].includes('councilKeyEarned'));
 assert.equal(run('getContext()?.type'),undefined,'The defeated boss must have no retry interaction');
 assert.equal(JSON.stringify(snap().progression),missedProgress);assert.equal(snap().shards,missedShards);
 assert(!run('enterCouncilHall()'));
}
run('boss.councilMinionKills=8;boss.hp=0;');assert(!run('awardCouncilKeyDrop()'));
run('startGame();');assert(run('Prologue.active'));assert(snap().defeated.every(v=>!v));assert(snap().flags.every(f=>!f.length));
run('Prologue.wake();');dismiss();

// The pickup survives a reload. The chained gate needs the actual key item.
freshYomi();run('bossStarted=true;');killSummons(8);defeatBoss();
run('persist();mainMenu();startGame(true);');dismiss();
assert(snap().flags[1].includes('councilKeyEarned'));
const key=run("level.objects.find(o=>o.id==='councilKey')");assert(key);
useAt(key);assert(snap().flags[1].includes('councilKey'));
run('persist();mainMenu();startGame(true);');dismiss();assert(snap().flags[1].includes('councilKey'));
useAt(key);assert.equal(snap().flags[1].filter(f=>f==='councilKey').length,1);

// Save schemas stay on the three original realms and reject impossible key chains.
run('persist();');const valid=JSON.parse(JSON.stringify(run('saved')));
for(const extra of [[],['councilKeyEarned'],['councilKeyEarned','councilKey'],['councilKeyEarned','councilGateOpen']]){
 const data=JSON.parse(JSON.stringify(valid));data.flags[1]=['soulUpper','soulLower','bossRewardClaimed','yomiGuardianSoul',...extra];
 assert.equal(validate(data).flags[1].length,4+extra.length);
}
for(const extra of [['councilKey'],['councilGateOpen'],['councilKeyEarned','councilKey','councilGateOpen']]){
 const data=JSON.parse(JSON.stringify(valid));data.flags[1]=['soulUpper','soulLower','bossRewardClaimed','yomiGuardianSoul',...extra];assert.throws(()=>validate(data),/Invalid council progress/);
}
const unearned=JSON.parse(JSON.stringify(valid));unearned.defeated[1]=false;unearned.flags[1]=['soulUpper','soulLower','councilKeyEarned'];
unearned.progression.points-=2;
assert.throws(()=>validate(unearned),/Invalid council progress/);
const unknown=JSON.parse(JSON.stringify(valid));unknown.flags[1].push('councilInvented');assert.throws(()=>validate(unknown),/Invalid quest flags/);
assert.equal(valid.release,run('GAME_RELEASE.version'));
for(const release of [undefined,'0.9.0','future-release']){
 const old=JSON.parse(JSON.stringify(valid));if(release===undefined)delete old.release;else old.release=release;
 assert.throws(()=>validate(old),'Different release payloads must be rejected by the vault');
 run(`saved=${JSON.stringify(old)};mainMenu();startGame(true);`);
 assert(run('Prologue.active'));assert.equal(snap().realm,0);assert(snap().abilities.every(v=>!v));assert(snap().defeated.every(v=>!v));assert(snap().flags.every(f=>!f.length));
 assert.equal(snap().progression.totalXp,0);assert.equal(snap().shards,0);assert.equal(run('saved.release'),run('GAME_RELEASE.version'));
 assert.equal(elements.get('toast').textContent,run("I18n.t('text.save.reset.new.version')"));
 run('Prologue.wake();');dismiss();
}

// Main progression never bypasses the chained side gate, and key possession does.
freshYomi(true);const gate=run('yomi.councilGate');
assert(!run('enterCouncilHall()'));assert.equal(run('level.id'),'yomi');
assert(!run("gatePass(level.gates.find(g=>g.kind==='council'))"),'A defeated guardian must not bypass the chain');
useAt(key);assert(!snap().flags[1].includes('councilKey'),'The key must stay hidden before it is earned');
useAt(gate);assert.equal(run('level.id'),'yomi');assert(!snap().flags[1].includes('councilGateOpen'));
run("flags[1].push('councilKeyEarned');");useAt(gate);
assert.equal(run('level.id'),'yomi');assert(!snap().flags[1].includes('councilGateOpen'));
useAt(key);assert(snap().flags[1].includes('councilKey'));
run('var outsideEnemy=enemies.find(e=>!e.miniboss);outsideEnemy.hp=1;player.hp=3;');
useAt(gate);assert(snap().flags[1].includes('councilGateOpen'));
assert(!snap().flags[1].includes('councilKey'),'The first unlock must consume the inventory key');
if(run('level===yomi'))useAt(gate);
assert.equal(run('level.id'),'councilHall');assert.equal(snap().realm,1);assert.equal(run('levels.length'),3);
assert.equal(run('enemies.length'),0);assert(run('boss.dead'));assert.equal(run('level.objects.length'),0);
assert.equal(run('level.width'),2400);assert.equal(run('level.height'),1100);
assert(run('platforms.some(p=>p.y===820)'));
assert.equal(snap().player.hp,3);const outdoorCheckpoint=JSON.stringify(snap().checkpoint);
const hallFlags=JSON.stringify(snap().flags);useAt(run('level.inscription'));
assert.equal(JSON.stringify(snap().flags),hallFlags,'Reading the hall inscription changed progression');
run('persist();');assert.equal(run('saved.realm'),1);validate(run('saved'));
assert.equal(JSON.stringify(run('saved.checkpoint')),outdoorCheckpoint);
const permanent=JSON.stringify({abilities:snap().abilities,defeated:snap().defeated,flags:snap().flags,progression:snap().progression,shards:snap().shards});
run('showMap();');assert.equal(snap().state,'map');
const shrineGrid=elements.get('mapContent').children.find(c=>c.className==='travel-grid');
assert(shrineGrid);assert.equal(shrineGrid.children.length,run('yomi.rests.length'),'Hall map must show the outdoor shrines');
run('closeMap();');useAt(run('level.returnPoint'));
assert.equal(run('level.id'),'yomi');assert.equal(snap().player.hp,3);
assert(run("gatePass(level.gates.find(g=>g.kind==='council'))"));
assert.equal(run('enemies.find(e=>e.id===outsideEnemy.id).hp'),1,'Returning from the hall respawned outdoor enemies');
assert.equal(JSON.stringify(snap().checkpoint),outdoorCheckpoint);
assert.equal(Math.round(snap().player.x+snap().player.w/2),2650);assert.equal(Math.round(snap().player.y+snap().player.h),3400);
useAt(key);assert(!snap().flags[1].includes('councilKey'),'A spent key must not respawn as a pickup');
assert(!run("objectVisible(yomi.objects.find(o=>o.id==='councilKey'))"));
useAt(gate);assert.equal(run('level.id'),'councilHall','The opened gate must permit repeat entry without the consumed key');
run('leaveCouncilHall();');

// Hall death/fall, fast travel, and a fresh load return through canonical Yomi state.
for(const fall of [false,true]){
 run('enterCouncilHall();player.hp=3;');assert.equal(run('level.id'),'councilHall');
 run(fall?'player.y=level.height+200;movePlayer(1/120);':'revive();');assert.equal(run('level.id'),'yomi');
 assert.equal(snap().player.hp,snap().player.maxHp,'Every hall fall/death restores full health');
 assert.equal(Math.round(snap().player.x+snap().player.w/2),snap().checkpoint.x);
 assert.equal(Math.round(snap().player.y+snap().player.h),snap().checkpoint.y);
 assert.equal(JSON.stringify({abilities:snap().abilities,defeated:snap().defeated,flags:snap().flags,progression:snap().progression,shards:snap().shards}),permanent);
 useAt(gate);
 if(run('level===councilHall'))run('leaveCouncilHall();');
}
run('enterCouncilHall();showMap();fastTravel(yomi.rests[0]);');
assert.equal(run('level.id'),'yomi');assert.equal(snap().state,'play');assert.equal(snap().checkpoint.id,'start');
useAt(gate);if(run('level===yomi'))run('enterCouncilHall();');
run('persist();mainMenu();startGame(true);');dismiss();
assert.equal(run('level.id'),'yomi');assert(snap().flags[1].includes('councilGateOpen'));validate(run('saved'));
assert(!snap().flags[1].includes('councilKey'));useAt(gate);assert.equal(run('level.id'),'councilHall');

// Registered art must fit the source PNG and meet the physical interior floor.
const councilFs=require('node:fs'),councilPath=require('node:path');
const councilArt=run('({parts:ART_COUNCIL,manifest:ART_MANIFEST})');
for(const [name,part] of Object.entries(councilArt.parts)){
 const png=councilFs.readFileSync(councilPath.join(__dirname,'..',councilArt.manifest[part.image]));
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(part.w,png.readUInt32BE(16));assert.equal(part.h,png.readUInt32BE(20));
 if(name==='hall'){assert(part.floorY>0&&part.floorY<part.h);assert.equal(part.worldFloorY,run("councilHall.platforms[0].y"));}
 else{assert.equal(png[25],6,'Gate and key must retain PNG alpha');assert(part.anchorX>=0&&part.anchorX<=part.w&&part.anchorY>=0&&part.anchorY<=part.h);}
}
console.log('PASS: original-fight council thresholds, permanent missed branch, consumed key and repeat entry, release reset/resume, empty transient hall, canonical return/death/map/reload and registered alpha art.');
