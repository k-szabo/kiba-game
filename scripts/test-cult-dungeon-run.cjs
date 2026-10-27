'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs'),locales=require('../assets/i18n/locales.json');
function setup(){
 const h=harness(),r=h.run;h.sandbox.qaLocales=locales;
 r("Prologue.stop();abilities=[true,true];defeated=[true,true,false,false];flags=[['forestBell','villageBell','guardian:oldCultist'],['soulUpper','soulLower','councilKeyEarned','councilGateOpen'],[],[]];visitedRests=[['start'],['start'],[],[]];dungeonState=DungeonRules.fresh();progression=freshProgression();coins=0;enterRealm(0);state='play';initPlayer(japan.cultPassage.ruinedGate);");
 return h;
}
function begin(h,id='sectFall'){
 const r=h.run;r(id==='sectFall'?'enterRealm(0);initPlayer(japan.cultPassage.ruinedGate);':'enterRealm(1);enterCouncilHall();initPlayer(councilHall.memoryScroll);');
 h.press({action:'interact'});h.tick();h.release({action:'interact'});assert.equal(r('state'),'dungeonMenu');h.elements.get('dungeonNew').onclick();h.dismiss();assert.equal(r('level.dungeon.id'),id);
}
function shrine(h){h.run('initPlayer(level.rests[0]);interact();');}
function defeat(h){h.run('var testBoss=enemies.find(DungeonCombat.is);testBoss.active=true;testBoss.hp=0;killEnemy(testBoss);');h.dismiss();}
function next(h){h.run('initPlayer(level.nextPoint);interact();');h.dismiss();}
{
 const h=setup(),r=h.run;
 assert.equal(r('getContext().type'),'dungeonScroll');assert.equal(r('DungeonRun.context().id'),'sectFall');assert(!r('flags[0].includes("cultTempleDiscovered")'),'Reading the context is pure');
 h.press({action:'interact'});h.tick();h.release({action:'interact'});assert(r('flags[0].includes("cultTempleDiscovered")'));assert(r('travelDestination(CULT_TRAVEL,0)'));
 const old=h.elements.get('dungeonNew').onclick;h.elements.get('dungeonBack').onclick();const before=r('JSON.stringify([dungeonState,flags])');old();assert.equal(r('JSON.stringify([dungeonState,flags])'),before,'Closed memory menu callbacks are inert');
 r('player.hp=2;');assert(r('fastTravel(CULT_TRAVEL,0)'));assert.equal(r('player.hp'),2);assert.equal(r('player.x+player.w/2'),1150);assert(!r('japan.rests.includes(CULT_TRAVEL)'));
 begin(h);assert.equal(r('DungeonRun.runId()'),1);assert.equal(r('dungeonState.runs.yomiFall.run'),0);assert.equal(r('level.id'),'cultDungeon1');assert.doesNotThrow(()=>validate(r('saved')));
 for(let index=0;index<3;index++){
  assert.equal(r('level.rests.length'),1);shrine(h);const checkpoint=r('checkpoint.id');defeat(h);assert(r('DungeonRun.cleared('+index+')'));
  assert.doesNotThrow(()=>validate(r('saved')));assert.equal(r('bossBonusPoints(flags)'),index+1);
  if(index<2){next(h);assert.equal(r('checkpoint.id'),checkpoint);r('revive();');assert.equal(r('level.dungeon.floor'),index,'Death uses the previous real shrine');assert(r('DungeonRun.enterFloor('+(index+1)+')'));}
 }
 assert(r('flags[0].includes("highPriestessSoul")'));assert.equal(r('progression.totalXp'),1550);assert.equal(r('coins'),440);
 for(const lang of ['hu','en']){r('I18n.t=key=>qaLocales['+JSON.stringify(lang)+'].dict[key]??key;');assert.equal(r('DungeonRun.objective().text'),'cultDungeon.objective.chest');assert.equal(r('I18n.t(DungeonRun.objective().text)'),lang==='hu'?'Keresd meg a jutalomládát, majd térj vissza a betört templomkapuhoz.':'Find the reward chest, then return to the ruined temple gate.');}r('I18n.t=key=>qaLocales.hu.dict[key]??key;');
 r('initPlayer(level.nextPoint);');assert.equal(r('getContext().type'),'dungeonLeave','The final portal is distinct even before opening the chest');h.press({action:'interact'});h.tick();h.release({action:'interact'});assert.equal(r('level.id'),'japan');
 r('DungeonRun.resume();');assert.equal(r('level.id'),'cultDungeon3');r('initPlayer(level.rewardChest);');h.press({action:'interact'});h.tick();h.release({action:'interact'});
 assert.equal(r('DungeonRun.stock("sectSeal")'),1);assert.equal(r('coins'),690);assert(!r('DungeonRun.openChest()'));assert.equal(r('dungeonState.stock.dungeonSeal'),0);
 assert.equal(r('DungeonRun.objective().text'),'cultDungeon.objective.chest','Claimed chest keeps the sect-specific return destination');
 // Walk normally from the empty chest to the visible exit, then use the actual
 // bound interaction; a direct leave() call would miss overlapping prompts.
 h.press({action:'moveRight'});for(let i=0;i<180&&r('player.x+player.w/2<level.nextPoint.x');i++)h.tick();h.release({action:'moveRight'});
 assert.equal(r('getContext().type'),'dungeonLeave','The claimed chest cannot mask the final portal');h.press({action:'interact'});h.tick();h.release({action:'interact'});assert.equal(r('level.id'),'japan');r('DungeonRun.resume();');
 const sect=r('JSON.stringify([dungeonState.runs.sectFall,flags[0],dungeonState.stock,dungeonState.boosts])');r('persist();mainMenu();startGame(true);');h.dismiss();assert.equal(r('level.id'),'cultDungeon3');assert.equal(r('JSON.stringify([dungeonState.runs.sectFall,flags[0],dungeonState.stock,dungeonState.boosts])'),sect);
 begin(h,'yomiFall');assert.equal(r('dungeonState.runs.yomiFall.run'),1);assert.equal(r('JSON.stringify([dungeonState.runs.sectFall,flags[0],dungeonState.stock,dungeonState.boosts])'),sect,'The other memory cannot reset or reroll this dungeon');
 const xp=r('progression.totalXp'),budget=r('bossBonusPoints(flags)');begin(h);assert.equal(r('DungeonRun.runId()'),2);assert(!r('flags[0].includes("sectStage1Clear")'));assert.equal(r('dungeonState.runs.yomiFall.run'),1);assert.equal(r('dungeonState.stock.sectSeal'),1);
 for(let index=0;index<3;index++){defeat(h);if(index<2)next(h);}assert.equal(r('bossBonusPoints(flags)'),budget);assert.equal(r('flags[0].filter(id=>id==="highPriestessSoul").length'),1);assert.equal(r('progression.totalXp'),xp+1550,'XP and gold repeat, first-clear points and soul do not');
 assert(r('DungeonRun.leave()'));assert.equal(r('level.id'),'japan');assert.equal(r('player.y+player.h'),2620);assert.doesNotThrow(()=>validate(r('saved')));
}
{
 const h=setup(),r=h.run;begin(h,'yomiFall');for(let index=0;index<3;index++){defeat(h);if(index<2)next(h);}
 for(const lang of ['hu','en']){r('I18n.t=key=>qaLocales['+JSON.stringify(lang)+'].dict[key]??key;');assert.equal(r('DungeonRun.objective().text'),'dungeon.objective.chest');assert(r('I18n.t(DungeonRun.objective().text)').includes(lang==='hu'?'csarnokba':'hall'));}
 r('initPlayer(level.rewardChest);interact();');assert.equal(r('DungeonRun.objective().text'),'dungeon.objective.chest');
}
for(const mutation of ['abilities[1]=false','flags[0]=flags[0].filter(id=>id!=="guardian:oldCultist")']){
 const h=setup(),r=h.run;r(mutation);const before=r('JSON.stringify([dungeonState,flags,player])');assert(!r('DungeonRun.menu()'));assert(!r('DungeonRun.newRun()'));assert.equal(r('JSON.stringify([dungeonState,flags,player])'),before);
}
{
 const h=setup(),r=h.run;begin(h);shrine(h);const saved=r('JSON.stringify(saved)');
 r('DevTools.open();DevSession.begin();');assert(r('DevTeleport.teleport({realm:"cultDungeon3",rest:"cultDungeon3Shrine"})'));r('DevTools.close();');
 assert.equal(r('level.id'),'cultDungeon3');assert(!r('fastTravel({id:"yomiDungeon1Shrine"},1)'),'Dungeon boundaries hold even in general dev fast travel');r('DevSession.end();');assert.equal(r('JSON.stringify(saved)'),saved);
}
console.log('PASS: sect memory entrance, scoped independent runs/rolls/progress, real shrines/death/continue, once-only points/soul vs replay rewards, chest, discovery fast travel and dev isolation.');
