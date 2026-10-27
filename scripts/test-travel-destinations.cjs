'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
function setup(){
 const h=harness(),r=h.run;
 r("Prologue.stop();abilities=[true,true];defeated=[true,true,true,true];flags=[['forestBell','villageBell'],['soulUpper','soulLower','councilKeyEarned','councilGateOpen','dungeonRunStarted','dungeonStage1Clear','dungeonCaptainReward','dungeonStage2Clear','dungeonNecromancerReward','dungeonStage3Clear','dungeonCouncilReward','councilSoul'],['dawnSeal','shadowEntered'],['guardian:cultJailer','prisonOpen','guardian:prisonHunter','fiaSeen','fiaRescued','shadowAltar','arenaQuestAccepted','arenaRewardCaptain','arenaRewardSerpent','arenaRewardGuards','arenaSerpentScale','arenaChampion']];dungeonState=DungeonRules.fresh();dungeonState.runs.yomiFall.run=1;progression=freshProgression();progression.points=bossBonusPoints(flags);visitedRests=levels.map(map=>map.rests.map(rest=>rest.id));enterRealm(0);state='play';");
 return h;
}
const snapshot=r=>r('JSON.stringify([level.id,player,checkpoint,flags,abilities,defeated,dungeonState,progression,coins,visitedRests,saved])');
const permanent=r=>r('JSON.stringify([flags,abilities,defeated,dungeonState,progression,coins])');
function button(r,realm,id){
 const target=r('realmRests('+realm+').find(rest=>rest.id==='+JSON.stringify(id)+')');
 return r('travelGrid('+realm+')').children.find(candidate=>candidate.textContent.endsWith(r('I18n.t('+JSON.stringify(target.name)+')')));
}
// The unlocked scroll entrance is a route, not a new shrine/checkpoint.
{
 const h=setup(),r=h.run;assert(!r('yomi.rests.some(rest=>rest.id===COUNCIL_TRAVEL.id)'));assert(!r('visitedRests[1].includes(COUNCIL_TRAVEL.id)'));
 r("flags[0].push('guardian:oldCultist','cultTempleDiscovered');");
 for(const [realm,id]of [[0,'cultTempleEntrance'],[1,'councilHallEntrance']]){
  const target=r('realmRests('+realm+').find(rest=>rest.id==='+JSON.stringify(id)+')');assert.equal(target.dungeonEntrance,true,'Explicit entrance metadata');
  const built=[],original=h.sandbox.document.createElement;h.sandbox.document.createElement=()=>{const entry=original();entry.attributes={};entry.setAttribute=(key,value)=>entry.attributes[key]=value;built.push(entry);return entry;};r('travelGrid('+realm+')');h.sandbox.document.createElement=original;
  const attributes=built.find(entry=>entry.textContent.endsWith(r('I18n.t('+JSON.stringify(target.name)+')'))).attributes;
  assert.equal(attributes['data-travel-kind'],'dungeon');assert.equal(attributes['data-type-label'],r("I18n.t('travel.dungeonEntrance')"));assert(attributes['aria-label'].startsWith(attributes['data-type-label']+' · '));
 }
 r('player.hp=2;showMap();');const entry=button(r,1,'councilHallEntrance');assert(entry&&!entry.disabled,'Gate unlock alone exposes the entrance');
 const before=permanent(r);assert(entry.onclick());assert.equal(r('level.id'),'councilHall');assert.equal(r('player.x+player.w/2'),r('councilHall.memoryScroll.x'));assert.equal(r('player.y+player.h'),r('councilHall.memoryScroll.y'));assert.equal(r('player.hp'),2,'A route anchor does not heal Momo');
 assert.equal(permanent(r),before);assert.equal(r('saved.location'),null);assert(r('yomi.rests.some(rest=>rest.id===saved.checkpoint.id)'));assert.doesNotThrow(()=>validate(r('saved')));
 const canonical=r('checkpoint.id');r('persist();mainMenu();startGame(true);');h.dismiss();assert.equal(r('level.id'),'yomi');assert.equal(r('checkpoint.id'),canonical,'Continue keeps the hall\'s existing outdoor checkpoint model');
 assert(r('fastTravel({id:COUNCIL_TRAVEL.id,x:1e9,y:-1e9},1)'));assert.equal(r('player.x+player.w/2'),r('councilHall.memoryScroll.x'),'Supplied coordinates never override the route');
 r('player.y=level.height+200;movePlayer(1/120);');assert.equal(r('level.id'),'yomi');assert.equal(r('checkpoint.id'),canonical,'A hall fall still uses the canonical outdoor respawn');
 const bad=JSON.parse(JSON.stringify(r('saved')));bad.checkpoint=r('({...COUNCIL_TRAVEL})');bad.visitedRests[1].push(bad.checkpoint.id);assert.throws(()=>validate(bad),/save location/i,'A virtual route cannot become a physical save checkpoint');
}
{
 const h=setup(),r=h.run;r("flags[1]=flags[1].filter(flag=>flag!=='councilGateOpen');");const before=snapshot(r);
 assert.equal(button(r,1,'councilHallEntrance'),undefined,'Locked optional entrances stay hidden');assert(!r('fastTravel(COUNCIL_TRAVEL,1)'));assert.equal(snapshot(r),before);
 r("flags[1].push('councilGateOpen');showMap();");const stale=button(r,1,'councilHallEntrance');r("flags[1]=flags[1].filter(flag=>flag!=='councilGateOpen');");const old=snapshot(r);assert(!stale.onclick(),'An old map callback cannot reopen a relocked route');assert.equal(snapshot(r),old);
}
// Arena/chambers are named, discoverable targets. Unlocking is separate from
// visiting their existing shrine; no travel can grant quest/reward flags.
{
 const h=setup(),r=h.run;
 for(const id of ['shadowArena','fiaChambers']){
  const spec=r('SIDE_LOCATIONS['+JSON.stringify(id)+']'),rest=spec.map.rests[0],unseen=button(r,3,rest.id);
  assert(unseen&&unseen.disabled,'An unlocked but unvisited side shrine remains visibly disabled');assert(unseen.textContent.includes(r('I18n.t('+JSON.stringify(spec.map.name)+')')),'Target label includes its actual location');assert(unseen.textContent.includes(r('I18n.t('+JSON.stringify(rest.name)+')')),'Target label retains its shrine name');
  const before=snapshot(r);assert(!unseen.onclick());assert.equal(snapshot(r),before);
  assert(r('CampQuest.enter('+JSON.stringify(id)+')'));assert.doesNotThrow(()=>validate(r('saved')));r('enterRealm(0);');const progress=permanent(r),ready=button(r,3,rest.id);assert(ready&&!ready.disabled);assert(ready.onclick());assert.equal(r('level.id'),id);assert.equal(r('checkpoint.id'),rest.id);assert.equal(permanent(r),progress);
  r('persist();mainMenu();startGame(true);');h.dismiss();assert.equal(r('level.id'),id);assert.equal(r('checkpoint.id'),rest.id);assert.doesNotThrow(()=>validate(r('saved')));
  r('player.y=level.height+200;movePlayer(1/120);');assert.equal(r('level.id'),id);assert.equal(r('checkpoint.id'),rest.id);assert.equal(permanent(r),progress,'Death preserves permanent rewards after new side travel');
 }
 r("flags[3]=flags[3].filter(flag=>flag!=='arenaChampion');");const locked=snapshot(r);assert.equal(button(r,3,'fiaChambersRest'),undefined);assert(!r('fastTravel({id:"fiaChambersRest"},3)'));assert.equal(snapshot(r),locked,'A visited shrine cannot bypass its current location unlock');
}
// Discovered dungeon shrines work within the same dungeon only. Both the UI
// and executor reject an old callback after leaving it.
{
 const h=setup(),r=h.run;r('visitedRests[1].push(...DUNGEON_FLOORS.map(map=>map.rests[0].id));');
 for(const origin of ['japan','yomi','councilHall','shadowDen']){
  if(origin==='japan')r('enterRealm(0);');else if(origin==='yomi')r('enterRealm(1);');else if(origin==='councilHall')r('enterRealm(1);enterCouncilHall();');else r('CampQuest.enter("shadowDen");');
  for(const floor of Array.from(r('DUNGEON_FLOORS'))){const before=snapshot(r);assert.equal(button(r,1,floor.rests[0].id),undefined,origin+' hides internal dungeon destinations');assert(!r('fastTravel('+JSON.stringify(floor.rests[0])+',1)'));assert.equal(snapshot(r),before);}
 }
 assert(r('CampQuest.enter("yomiDungeon1")'));
 for(const floor of Array.from(r('DUNGEON_FLOORS'))){const before=permanent(r),target=button(r,1,floor.rests[0].id);assert(target&&!target.disabled);assert(target.onclick());assert.equal(r('level.id'),floor.id);assert.equal(r('checkpoint.id'),floor.rests[0].id);assert.equal(permanent(r),before);assert.doesNotThrow(()=>validate(r('saved')));}
 r('showMap();');const stale=button(r,1,'yomiDungeon1Shrine');r('state="play";DungeonRun.leave();');const outside=snapshot(r);assert(!stale.onclick());assert.equal(snapshot(r),outside,'A cached dungeon callback is unusable after the scroll exit');
}
// Explicit dev teleport may enter the dungeon for tests; normal fast-travel
// still cannot use an internal shrine from outside or leak unlocks to a save.
{
 const h=setup(),r=h.run;r('persist();');const normal=r('JSON.stringify(saved)'),writes=r('window.__saveSnapshots.length');r('DevTools.open();DevSession.begin();DevTools.close();enterRealm(0);');
 assert(!r('fastTravel({id:"yomiDungeon1Shrine"},1)'));r('DevTools.open();');assert(r('DevTeleport.teleport({realm:"yomiDungeon1",rest:"yomiDungeon1Shrine"})'));r('DevTools.close();');assert(r('fastTravel({id:"yomiDungeon2Shrine"},1)'));assert.equal(r('level.id'),'yomiDungeon2');
 r('DevSession.end();');assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('window.__saveSnapshots.length'),writes);
}
console.log('PASS: canonical unlock-only council route without new shrine/heal/save semantics, named visited arena/chambers targets, strict dungeon-context UI/callback guards, death/continue persistence and dev isolation.');
