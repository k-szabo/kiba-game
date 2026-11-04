'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');

// Daichi grants XP only on the first completion. The existing durable flag
// protects repeat dialogue, reloads and saves completed before this fix.
{
 const h=harness(),r=h.run;
 r("defeated[0]=true;flags[0]=['forestBell','villageBell'];CampQuest.enter('forestCamp');initPlayer(forestCamp.npcs.find(n=>n.id==='daichi'));var beforeQuestXP=progression.totalXp;");
 assert(r('CampQuest.talkDaichi()'));h.dismiss();assert.equal(r('progression.totalXp'),r('beforeQuestXP'),'Accepting the quest gives no completion XP');
 r("flags[0].push('mayorExecuted','guardian:campMaster','campMasterSoul','smithRescued','herbalistRescued','enchanterRescued');");
 assert(r('CampQuest.talkDaichi()'));assert.equal(r('progression.totalXp'),r('beforeQuestXP')+600);assert(r("flags[0].includes('campQuestCompleted')"));
 const persisted=JSON.parse(r('JSON.stringify(saved)'));validate(persisted);assert.equal(persisted.progression.totalXp,r('beforeQuestXP')+600,'The completion and XP are persisted together');
 h.dismiss();assert(r('CampQuest.talkDaichi()'));h.dismiss();assert.equal(r('progression.totalXp'),persisted.progression.totalXp);
 r('startGame(true);initPlayer(forestCamp.npcs.find(n=>n.id==="daichi"));');assert(r('CampQuest.talkDaichi()'));h.dismiss();assert.equal(r('progression.totalXp'),persisted.progression.totalXp,'Reload cannot repeat a claimed reward');
 // An older save could already have the completion flag without this XP.
 persisted.progression={level:1,xp:0,totalXp:0,points:0,stats:{vitality:0,strength:0,spirit:0,shield:0}};
 validate(persisted);r('saved='+JSON.stringify(persisted)+';startGame(true);initPlayer(forestCamp.npcs.find(n=>n.id==="daichi"));');
 assert(r('CampQuest.talkDaichi()'));h.dismiss();assert.equal(r('progression.totalXp'),0,'Previously completed saves are not retroactively rewarded');
}

// Reuse the strict, gameplay-written full quest prerequisite fixture. Its
// completed flag is removed to model a pending eye hand-in, with its point
// removed from the exact budget; accumulated XP may also come from combat.
const completed=require('./test-dragon-raid-saves.cjs');
function fiaFixture(){
 const h=harness(),r=h.run,data=JSON.parse(JSON.stringify(completed));
 data.flags[3]=data.flags[3].filter(id=>id!=='fiaDragonCompleted');data.progression.points--;validate(data);
 r('saved='+JSON.stringify(data)+';startGame(true);initPlayer(level.npcs[0]);');h.dismiss();
 return h;
}
{
 const h=fiaFixture(),r=h.run,xp=r('progression.totalXp'),points=r('progression.points'),startingLevel=r('progression.level');
 assert(r('campNPCVisible(level.npcs[0])'));assert.equal(r("Inventory.quantity('dragonEyes')"),1);assert(r('DragonRaid.talk()'));
 assert.equal(r('state'),'dialog');assert(!r("flags[3].includes('fiaDragonCompleted')"));assert(r('campNPCVisible(level.npcs[0])'),'Fia stays in the scene on the first page');
 assert.equal(r('progression.totalXp'),xp);assert.equal(r('progression.points'),points);assert.equal(r("Inventory.quantity('dragonEyes')"),1);
 assert.equal(r('DragonRaid.talk()'),false,'Reentrant turn-in is rejected during dialogue');
 const pending=JSON.parse(r('JSON.stringify(captureProgress())'));validate(pending);
 assert(!pending.flags[3].includes('fiaDragonCompleted'),'A save taken while reading can resume the unfinished hand-in');
 h.elements.get('dialogOk').onclick();assert.equal(r('state'),'dialog','The hand-in contains multiple pages');assert(r('campNPCVisible(level.npcs[0])'),'Fia stays until the final page');
 const staleNext=h.elements.get('dialogOk').onclick;h.dismiss();
 assert(r("flags[3].includes('fiaDragonCompleted')"));assert(!r('campNPCVisible(level.npcs[0])'));assert.equal(r("Inventory.quantity('dragonEyes')"),0);
 assert.equal(r('progression.totalXp'),xp+800);assert.equal(r('progression.points'),points+1+r('progression.level')-startingLevel);validate(r('saved'));
 staleNext();assert.equal(r('progression.totalXp'),xp+800,'An old Next callback cannot award twice');assert.equal(r('DragonRaid.talk()'),false);
 r('startGame(true);');h.dismiss();assert(!r('campNPCVisible(level.npcs[0])'),'Reload preserves the move to the ritual chamber');assert.equal(r('progression.totalXp'),xp+800);
}
{
 const h=fiaFixture(),r=h.run,xp=r('progression.totalXp');assert(r('DragonRaid.talk()'));
 const stale=h.elements.get('dialogOk').onclick;r('mainMenu();');stale();
 assert(!r("flags[3].includes('fiaDragonCompleted')"));assert.equal(r('progression.totalXp'),xp,'Cancelling a conversation grants no reward');
 r('startGame(true);initPlayer(level.npcs[0]);');h.dismiss();assert(r('campNPCVisible(level.npcs[0])'));assert(r('DragonRaid.talk()'));h.dismiss();assert.equal(r('progression.totalXp'),xp+800,'The cancelled hand-in remains available');
}
{
 const h=fiaFixture(),r=h.run,xp=r('progression.totalXp');assert(r('DragonRaid.talk()'));
 const stale=h.elements.get('dialogOk').onclick;r("CampQuest.enter('zigguratInterior');");stale();
 assert(!r("flags[3].includes('fiaDragonCompleted')"));assert.equal(r('progression.totalXp'),xp,'Changing maps invalidates the old dialogue');
}
{
 const h=fiaFixture(),r=h.run,xp=r('progression.totalXp');
 r("CampQuest.enter('zigguratSummit');initPlayer({x:1550,y:1400});");
 assert(r('HannahEncounter.visual().fiaPresent'));assert(r('DragonRaid.talk()'));
 while(r('state')==='dialog'){
  assert(r('HannahEncounter.visual().fiaPresent'),'The summit Fia also stays for every page');
  assert.equal(r('progression.totalXp'),xp);h.elements.get('dialogOk').onclick();
 }
 assert(!r('HannahEncounter.visual().fiaPresent'));assert.equal(r('progression.totalXp'),xp+800);validate(r('saved'));
}
{
 const h=fiaFixture(),r=h.run;
 r('DevTools.open();DevSession.begin();DevTools.close();initPlayer(level.npcs[0]);');
 const stored=h.storage.get('momo-three-worlds-v2');assert(r('DragonRaid.talk()'));h.dismiss();
 assert(r("flags[3].includes('fiaDragonCompleted')"));assert.equal(h.storage.get('momo-three-worlds-v2'),stored,'Dev turn-in never writes normal progress');
 r('DevSession.end();startGame(true);');h.dismiss();assert(!r("flags[3].includes('fiaDragonCompleted')"),'Leaving test mode restores the pending normal quest');
}
console.log('PASS: one-time Daichi XP, compatible completed saves, Fia present through every eye hand-in page, guarded final-page reward, cancellation/reload and developer isolation.');
