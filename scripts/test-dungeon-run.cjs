'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
const has=(r,id)=>r('flags[1].includes('+JSON.stringify(id)+')');
function setup(){
 const h=harness(),r=h.run;
 r("Prologue.stop();defeated=[true,true,false,false];abilities=[true,true];flags=[['forestBell','villageBell'],['soulUpper','soulLower','councilKeyEarned','councilGateOpen'],[],[]];visitedRests=[['start'],['start'],[],[]];dungeonState=DungeonRules.fresh();progression=freshProgression();coins=0;enterRealm(1);state='play';");
 assert(r('enterCouncilHall()'));r('initPlayer(level.memoryScroll);');h.sandbox.Math=Object.create(Math);h.sandbox.Math.random=()=>.9;return h;
}
function random(h,values){const queue=[...values];h.sandbox.Math.random=()=>queue.shift()??.9;}
function begin(h,values=[.9]){const r=h.run;random(h,values);r('interact();');assert.equal(r('state'),'dungeonMenu');assert(!h.elements.get('dungeonMenu').hidden);h.elements.get('dungeonNew').onclick();assert.equal(r('state'),'dialog');h.dismiss();assert.equal(r('level.id'),'yomiDungeon1');assert.equal(r('checkpoint.id'),'yomiDungeon1Entry');r('player.inv=999;');}
function shrine(h){const r=h.run;r('initPlayer(level.rests[0]);interact();player.inv=999;');assert.equal(r('checkpoint.id'),r('level.rests[0].id'));assert.doesNotThrow(()=>validate(r('saved')));}
function defeat(h){const r=h.run;r('var dungeonVictim=enemies.find(DungeonCombat.is);dungeonVictim.active=true;dungeonVictim.hp=0;killEnemy(dungeonVictim);');h.dismiss();return r('dungeonVictim');}
function next(h){const r=h.run;r('initPlayer(level.nextPoint);interact();player.inv=999;');}
function scroll(h){const r=h.run;assert(r('DungeonRun.leave()'));assert.equal(r('level.id'),'councilHall');assert.equal(r('getContext().type'),'dungeonScroll');}
function current(h){return h.run('JSON.stringify([dungeonState,flags,progression,coins,visitedRests])');}
{
 const h=setup(),r=h.run;r('interact();');assert.equal(r('state'),'dungeonMenu');assert(h.elements.get('dungeonContinue').disabled);const before=current(h);h.elements.get('dungeonBack').onclick();assert.equal(r('state'),'play');assert.equal(current(h),before);
 r('interact();');const stale=h.elements.get('dungeonNew').onclick;h.elements.get('dungeonBack').onclick();stale();assert.equal(current(h),before,'Closed scroll callback cannot start a run');
 r('player.x=0;');assert(!r('DungeonRun.newRun()'));assert(!r('DungeonRun.menu()'));assert.equal(r('dungeonState.run'),0);
 r('initPlayer(level.memoryScroll);interact();');h.press('Escape');h.release('Escape');assert.equal(r('state'),'play');assert(h.elements.get('dungeonMenu').hidden,'Escape closes the actual scroll menu');
}
{
 const h=setup(),r=h.run;begin(h);assert(has(r,'dungeonRunStarted'));assert.equal(r('dungeonState.run'),1);assert.equal(r('dungeonState.roll'),null);assert.equal(r('level.dungeon.floor'),0);assert.equal(r('checkpoint.checkpointOnly'),true);assert.doesNotThrow(()=>validate(r('saved')));
 for(let index=1;index<3;index++)assert(!r('DungeonRun.enterFloor('+index+')'),'Normal floor cannot skip a locked predecessor');
 const before=current(h);assert(!r('DungeonRun.openChest()'));assert.equal(current(h),before);assert.equal(r('travelDestination(checkpoint,1)'),null,'Entry checkpoint is not a fast travel target');
 r('showMap();');assert.equal(r('state'),'map');const travelLabels=h.elements.get('mapContent').children.flatMap(node=>node.children||[]).map(node=>node.textContent);assert(!travelLabels.includes(r('I18n.t(checkpoint.name)')),'Hidden entry is never offered as an extra shrine');r("state='play';$('map').hidden=true;");
}
{
 const h=setup(),r=h.run;begin(h,[0,.6]);const roll=r('dungeonState.roll');assert.equal(roll,'armorEnhancement');
 const rewards=r('DUNGEON_REWARDS.map(reward=>({xp:reward.xp,coins:reward.coins,points:reward.points,claim:reward.claim,stage:reward.stage}))');let xp=0,coins=0;
 for(let index=0;index<3;index++){
  assert.equal(r('level.dungeon.floor'),index);shrine(h);const budget=r('progression.points+Object.values(progression.stats).reduce((a,b)=>a+b,0)'),beforeXp=r('progression.totalXp'),beforeCoins=r('coins');
  defeat(h);xp+=rewards[index].xp;coins+=rewards[index].coins;assert.equal(r('progression.totalXp'),beforeXp+rewards[index].xp);assert.equal(r('coins'),beforeCoins+rewards[index].coins);assert(has(r,rewards[index].claim));assert(has(r,rewards[index].stage));assert.equal(r('progression.points+Object.values(progression.stats).reduce((a,b)=>a+b,0)'),r('progression.level')-1+index+1,'Each first-clear adds exactly one permanent point');assert(r('progression.points+Object.values(progression.stats).reduce((a,b)=>a+b,0)')>budget);
  const once=current(h);r('killEnemy(dungeonVictim);DungeonRun.onBossDefeated(dungeonVictim);');assert.equal(current(h),once,'Duplicate boss completion awards nothing');assert.doesNotThrow(()=>validate(r('saved')));
  if(index<2)next(h);
 }
 assert.equal(r('progression.totalXp'),1400);assert.equal(r('coins'),400);assert(has(r,'councilSoul'));assert.equal(r('bossBonusPoints(flags)'),3);
 const before=current(h);assert(!r('DungeonRun.openChest()'),'Clearing the dungeon does not remotely open its chest');assert.equal(current(h),before);
 r('initPlayer(level.rewardChest);interact();');assert(has(r,'dungeonChestClaimed'));assert.equal(r('coins'),650);assert.equal(r('dungeonState.stock.dungeonSeal'),1);assert.equal(r('dungeonState.stock.armorEnhancement'),1);assert.equal(r('dungeonState.stock.weaponEnhancement+dungeonState.stock.spiritEnhancement'),0);assert.equal(r('dungeonState.roll'),roll,'Opening chest never rerolls its preselected drop');assert.doesNotThrow(()=>validate(r('saved')));
 const claimed=current(h);r('interact();DungeonRun.openChest();');assert.equal(current(h),claimed,'Only one chest payout per run');
 r("dungeonState.stock.weaponEnhancement=2;dungeonState.boosts.weapon=1;persist();");const permanent=r('JSON.stringify([dungeonState.stock,dungeonState.boosts,progression,flags[1].filter(f=>/Reward$|Soul$/.test(f))])');scroll(h);
 begin(h,[.25]);assert.equal(r('dungeonState.run'),2);assert.equal(r('dungeonState.roll'),null,'The25% boundary excludes a bonus enhancement');assert.equal(r('JSON.stringify([dungeonState.stock,dungeonState.boosts,progression,flags[1].filter(f=>/Reward$|Soul$/.test(f))])'),permanent);assert(!r('flags[1].some(id=>/^dungeonStage|^dungeonChest/.test(id))'));assert(!r('visitedRests[1].some(id=>/Dungeon[23]/.test(id))'),'Explicit new run removes only obsolete dungeon checkpoints');assert(r('visitedRests[1].includes("start")'));
 const points=r('bossBonusPoints(flags)'),oldXp=r('progression.totalXp'),oldCoins=r('coins');defeat(h);assert.equal(r('progression.totalXp'),oldXp+300);assert.equal(r('coins'),oldCoins+80);assert.equal(r('bossBonusPoints(flags)'),points);assert.equal(r('flags[1].filter(id=>id==="dungeonCaptainReward").length'),1,'Repeat run grants XP/gold without another point');assert.doesNotThrow(()=>validate(r('saved')));
}
{
 const h=setup(),r=h.run;begin(h,[.249999,.999]);assert.equal(r('dungeonState.roll'),'spiritEnhancement');shrine(h);defeat(h);next(h);assert.equal(r('level.id'),'yomiDungeon2');assert.equal(r('checkpoint.id'),'yomiDungeon1Shrine','Crossing a floor preserves the last real boss shrine');assert.equal(r('saved.location'),'yomiDungeon1');assert.equal(r('saved.checkpoint.id'),'yomiDungeon1Shrine');assert.doesNotThrow(()=>validate(r('saved')));
 const reward=r('JSON.stringify([flags,dungeonState,progression,coins])');r('revive();');assert.equal(r('level.id'),'yomiDungeon1');assert.equal(r('checkpoint.id'),'yomiDungeon1Shrine');assert.equal(r('JSON.stringify([flags,dungeonState,progression,coins])'),reward);assert(r('enemies.find(DungeonCombat.is).dead'),'Cleared stage boss stays defeated after death');
 assert(r('DungeonRun.enterFloor(1)'));r('persist();mainMenu();startGame(true);');assert.equal(r('level.id'),'yomiDungeon1','Same-release continue restores saved shrine floor');assert.equal(r('dungeonState.roll'),'spiritEnhancement');assert(has(r,'dungeonStage1Clear'));assert(r('DungeonRun.enterFloor(1)'));shrine(h);defeat(h);next(h);assert.equal(r('checkpoint.id'),'yomiDungeon2Shrine');
 r('revive();');assert.equal(r('level.id'),'yomiDungeon2');assert(has(r,'dungeonStage2Clear'));scroll(h);r('interact();');assert(!h.elements.get('dungeonContinue').disabled);h.elements.get('dungeonContinue').onclick();assert.equal(r('level.id'),'yomiDungeon2');assert.equal(r('checkpoint.id'),'yomiDungeon2Shrine','Scroll continue chooses deepest discovered physical shrine');assert.equal(r('dungeonState.run'),1);assert.doesNotThrow(()=>validate(r('saved')));
}
{
 const h=setup(),r=h.run;begin(h);r('var staleDungeonBoss=enemies.find(DungeonCombat.is);');scroll(h);begin(h);r('staleDungeonBoss.dead=true;staleDungeonBoss.active=false;enemies.push(staleDungeonBoss);');const before=current(h);assert(!r('DungeonRun.onBossDefeated(staleDungeonBoss)'));assert.equal(current(h),before,'Old-run completion cannot mutate a new run');
 r('var replayDungeonBoss=enemies.find(enemy=>enemy!==staleDungeonBoss&&DungeonCombat.is(enemy));replayDungeonBoss.dead=true;replayDungeonBoss.replay=true;');assert(!r('DungeonRun.onBossDefeated(replayDungeonBoss)'));assert.equal(current(h),before,'Replay callback cannot give dungeon progression');
}
for(const [chance,pick,expected]of [[.25,0,null],[.999,0,null],[.24999,0,'weaponEnhancement'],[0,.4,'armorEnhancement'],[0,.999,'spiritEnhancement']]){
 const h=setup();begin(h,[chance,pick]);assert.equal(h.run('dungeonState.roll'),expected);const before=h.run('JSON.stringify(dungeonState)');h.run('persist();mainMenu();startGame(true);');assert.equal(h.run('JSON.stringify(dungeonState)'),before,'Reload preserves the predetermined chance outcome');
}
{
 const h=harness(),r=h.run,normal=r('JSON.stringify(saved)'),writes=r('window.__saveSnapshots.length');r('DevTools.open();');assert(r('DevSession.begin()'));
 for(let index=0;index<3;index++){
  const map=r('DUNGEON_FLOORS['+index+'].id'),rest=r('DUNGEON_FLOORS['+index+'].rests[0].id');assert(r('DevTeleport.teleport({realm:'+JSON.stringify(map)+',rest:'+JSON.stringify(rest)+'})'));assert.equal(r('level.id'),map);assert.equal(r('checkpoint.id'),rest);const encounter=r('DUNGEON_REWARDS['+index+'].type');assert(r('DevBoss.revive({encounter:'+JSON.stringify(encounter)+'})'));r('DevTools.close();');const before=current(h);defeat(h);assert.equal(current(h),before,'Isolated dungeon replay never awards progression');r('DevTools.open();');
 }
 for(const id of ['dungeonSeal','weaponEnhancement','armorEnhancement','spiritEnhancement','councilSoul'])assert(r('DevItems.add({item:'+JSON.stringify(id)+'})'));
 assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('window.__saveSnapshots.length'),writes);r('DevSession.end();');assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('window.__saveSnapshots.length'),writes);
}
// DUN-QA-001 r1: immortality must use the actual checkpoint floor after crossing a floor.
for(const previousFloor of [0,1]){
 const h=setup(),r=h.run;begin(h);shrine(h);defeat(h);next(h);
 if(previousFloor===1){shrine(h);defeat(h);next(h);}
 const previous=r('DUNGEON_FLOORS['+previousFloor+'].id'),point=r('checkpoint.id'),normal=r('JSON.stringify(saved)'),writes=r('window.__saveSnapshots.length');
 r('DevTools.open();');assert(r('DevSession.begin()'));assert(r('DevImmortality.toggle()'));r('DevTools.close();');
 const progress=r('JSON.stringify([flags,dungeonState,progression,coins])');r('player.hp=1;player.y=level.height+300;update(1/60);');
 assert.equal(r('level.id'),previous);assert.equal(r('checkpoint.id'),point);assert(r('player.x>=0&&player.x+player.w<=level.width&&player.y+player.h<=level.height'));assert.equal(r('player.hp'),r('player.maxHp'));
 assert.equal(r('JSON.stringify([flags,dungeonState,progression,coins])'),progress,'Invincible fall retains cleared stages/rewards/stocks');assert(r('enemies.find(DungeonCombat.is).dead'));
 r('for(let i=0;i<240;i++)update(1/120);');assert.equal(r('level.id'),previous);assert(r('player.y+player.h<=level.height'),'No off-map repeat-fall loop');assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('window.__saveSnapshots.length'),writes);
 r('DevTools.open();DevSession.end();');assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('window.__saveSnapshots.length'),writes);assert(!r('DevImmortality.active'));
}
for(const fps of [30,60,120])for(const [map,rest]of [['yomiDungeon1','yomiDungeon1Shrine'],['yomiDungeon2','yomiDungeon2Shrine'],['yomiDungeon3','yomiDungeon3Shrine'],['dream','dream']]){
 const h=harness(),r=h.run;r('DevTools.open();DevSession.begin();DevAbilities.acquire({ability:"double-jump"});DevAbilities.acquire({ability:"dash"});');assert(r('DevTeleport.teleport({realm:'+JSON.stringify(map)+',rest:'+JSON.stringify(rest)+'})'));r('DevTools.close();if(!Prologue.active)initPlayer(level.checkpoints[0]);player.inv=999;');
 const dt=1/fps,tick=seconds=>r('for(let i=0;i<'+Math.ceil(seconds*fps)+';i++)update('+dt+');');h.press({action:'jump'});tick(dt);h.release({action:'jump'});tick(.16);h.press({action:'jump'});tick(dt);h.release({action:'jump'});assert.equal(r('player.jumps'),2,map+' second jump at'+fps+'FPS');h.press({action:'dash'});tick(dt);h.release({action:'dash'});assert(r('dash>0'));tick(.3);assert.equal(r('dash'),0,map+' dash expires at'+fps+'FPS');assert(r('player.vy>0'));tick(.8);assert(r('Math.abs(player.vx)<1050&&Math.abs(player.vy)<2000'),'No runaway jump/dash in '+map);
}
console.log('PASS: council scroll/new/continue guards, three persistent floors/checkpoints, repeat XP/gold vs permanent points/soul, fixed one-shot chest, explicit new-run reset, reload/death/leave, stale/replay rejection, dev isolation and30/60/120FPS movement.');
