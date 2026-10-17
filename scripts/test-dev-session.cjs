const assert=require('node:assert/strict');
const harness=require('./test-harness.cjs');

function saveState(h){
 return {
  saved:h.run('JSON.stringify(saved)'),
  writes:h.run('JSON.stringify(window.__saveSnapshots)'),
  storage:JSON.stringify([...h.storage.entries()]),
  continueHidden:h.elements.get('continueButton').hidden
 };
}
function assertSaveUnchanged(h,before,label){assert.deepEqual(saveState(h),before,label);}
function begin(h){assert(h.run('DevTools.open()'));assert(h.run('DevSession.ready'));assert.equal(h.run('DevSession.begin()'),true);assert(h.run('DevSession.active'));}
function permanent(h){return h.run('JSON.stringify({abilities,defeated,flags,visitedRests,shards,progression})');}
function seedProgress(h){
 h.run("Prologue.stop();abilities=[true,true];defeated=[true,false,false];flags=[['forestBell','villageBell','guardian:oldAngel','angelHalo'],['soulUpper','soulLower'],[]];visitedRests=levels.map(l=>l.rests.map(r=>r.id));progression=normalizeProgression({level:3,xp:12,totalXp:167,stats:{vitality:1,strength:1,spirit:0}});shards=17;enterRealm(1);state='play';persist();");
}

// A developer-session entry point is guarded by the open panel and readiness.
{
 const h=harness();h.run('mainMenu()');const before=saveState(h);
 assert.equal(h.run('DevSession.active'),false);
 assert.equal(h.run('DevSession.begin()'),false,'Calling begin outside the developer panel must fail');
 h.run("state='developer'");assert.equal(h.run('DevSession.begin()'),false,'A developer state string alone does not open the panel');h.run("state='menu'");
 assertSaveUnchanged(h,before,'Rejected entry must not change the normal save');
 assert(h.run('DevTools.open()'));
 for(const [invalidate,restore,label] of [
  ['storageReady=false','storageReady=true','save initialization'],
  ['loadingReady=false','loadingReady=true','Momo artwork'],
  ["var loadedDescriptor=Object.getOwnPropertyDescriptor(Visuals,'loaded');Object.defineProperty(Visuals,'loaded',{configurable:true,get:()=>Visuals.total-1})","Object.defineProperty(Visuals,'loaded',loadedDescriptor)",'world artwork']
 ]){
  h.run(invalidate);assert.equal(h.run('DevSession.ready'),false,label+' must finish first');
  assert.equal(h.run('DevSession.begin()'),false,label+' blocks test entry');
  assert.equal(h.run('DevSession.active'),false);assert.equal(h.snap().state,'developer');
  assertSaveUnchanged(h,before,'Unready entry does not change saves');h.run(restore);
 }
 h.run("Visuals.failures.push('missing-test-art')");assert.equal(h.run('DevSession.ready'),false);
 assert.equal(h.run('DevSession.begin()'),false,'Failed artwork blocks test entry');h.run('Visuals.failures.length=0');
 assert(h.run('DevSession.begin()'));const progress=permanent(h),player=h.run('JSON.stringify(player)');
 assert.equal(h.run('DevSession.begin()'),true,'Repeated entry is idempotent');
 assert.equal(permanent(h),progress);assert.equal(h.run('JSON.stringify(player)'),player);
 assertSaveUnchanged(h,before,'Starting a test must not create a normal save');
 h.run('DevSession.end()');assert.equal(h.run('DevSession.active'),false);assert.equal(h.snap().state,'menu');
 assertSaveUnchanged(h,before,'Ending an unchanged test must preserve the normal save');
 assert.equal(h.run('DevSession.end()'),false,'Repeated end is a harmless no-op');
}

// Menu entry clones progression, whereas live entry keeps the running encounter.
{
 const h=harness();seedProgress(h);const expected=permanent(h),before=saveState(h);
 h.run('mainMenu()');begin(h);
 assert.equal(h.run('level.id'),'japan','Menu tests start in Japan rather than replaying the dream');
 assert.equal(h.run('Prologue.active'),false);assert.equal(permanent(h),expected);
 assert(h.run('abilities!==saved.abilities&&defeated!==saved.defeated&&flags!==saved.flags&&flags.every((row,i)=>row!==saved.flags[i])&&visitedRests!==saved.visitedRests&&visitedRests.every((row,i)=>row!==saved.visitedRests[i])&&progression!==saved.progression&&progression.stats!==saved.progression.stats'),'Test progression must not share mutable save objects');
 h.run("abilities[0]=false;flags[0].push('test-only');visitedRests[0].push('test-only');progression.stats.strength++;shards++;persist()");
 assertSaveUnchanged(h,before,'Mutating cloned test progression cannot mutate the saved baseline');
 h.run('mainMenu();startGame(true)');assert.equal(h.snap().realm,1);assert.equal(permanent(h),expected);
 h.run('player.hp=2;player.x+=37;enemies[0].hp=1;projectiles.push({x:10,y:20,life:5});');
 const live=h.run('JSON.stringify({realm,level:level.id,checkpoint,player,enemies,boss,projectiles,progression,flags})');
 begin(h);assert.equal(h.run('JSON.stringify({realm,level:level.id,checkpoint,player,enemies,boss,projectiles,progression,flags})'),live,'Live entry preserves current gameplay as its test starting point');
 h.run('DevTools.close()');assert.equal(h.snap().state,'play');assert(h.run('DevSession.active'),'Closing the panel resumes the test instead of ending it');
 assert.equal(h.run('DevSession.begin()'),false,'Even an active test cannot invoke begin outside the open panel');
 h.run('mainMenu()');assert.equal(h.run('DevSession.active'),false);assert.equal(h.snap().state,'menu');
}

// Common progression writers remain isolated for the entire session, including
// a new-game reset, travel and a guardian reward rather than just direct persist.
{
 const h=harness();seedProgress(h);const baseline=saveState(h);begin(h);h.run('DevTools.close()');
 h.run('awardXP(300);persist()');assertSaveUnchanged(h,baseline,'XP rewards stay in the test');
 assert(h.run('fastTravel(japan.rests[0],0)'));assertSaveUnchanged(h,baseline,'Fast travel stays in the test');
 h.run('enterRealm(1);state="play";bossStarted=true;boss.hp=0;guardianDefeated()');
 assert(h.snap().defeated[1],'Guardian reward actually ran in the test');
 assertSaveUnchanged(h,baseline,'Guardian progression and item/XP rewards cannot write normal saves');
 h.run('startGame(false);persist()');assert(h.run('DevSession.active'),'New-game reset cannot silently disable save isolation');
 assertSaveUnchanged(h,baseline,'Resetting a test game does not overwrite normal progress');
 h.run('mainMenu()');assert.equal(h.run('DevSession.active'),false);assertSaveUnchanged(h,baseline,'Main menu discards all test writes');
 const writes=h.run('window.__saveSnapshots.length');h.run('startGame(true)');
 assert(h.run('window.__saveSnapshots.length')>writes,'Continuing after a test resumes normal persistence');
 assert.equal(h.snap().realm,1);assert.equal(h.snap().defeated[1],false,'Discarded guardian rewards do not leak into Continue');
 const totalXp=h.snap().progression.totalXp;h.run('awardXP(7)');
 assert.equal(h.run('saved.progression.totalXp'),totalXp+7,'Normal XP changes save after the test ends');
}

// First-time users may experiment without gaining a Continue save, even after
// calling new-game/persist, and can subsequently start a normal fresh game.
{
 const h=harness();h.run('mainMenu();saved=null;window.__saveSnapshots=[]');h.storage.clear();h.elements.get('continueButton').hidden=true;
 const baseline=saveState(h);begin(h);assert.equal(h.run('level.id'),'japan');assert.equal(h.run('Prologue.active'),false);
 assert.equal(h.snap().progression.level,1);assert.equal(h.snap().progression.totalXp,0);
 h.run('DevTools.close();awardXP(120);persist();startGame(false);persist()');
 assertSaveUnchanged(h,baseline,'A no-save test must not create a Continue save or vault record');
 h.run('mainMenu()');assertSaveUnchanged(h,baseline,'Discarding a first-time test leaves no save');
 assert.equal(h.run('DevSession.active'),false);h.run('startGame(false)');
 assert(h.run('Prologue.active'),'A real fresh game still starts with the prologue');
 assert(h.run('saved!==null&&window.__saveSnapshots.length>0'),'Normal new game saves once the test has ended');
 assert.equal(h.elements.get('continueButton').hidden,false);
}

// Starting from the prologue is safe, and ordinary panel use never creates a
// test session or changes paused-world state.
{
 const h=harness({prologue:true});const before=saveState(h);assert(h.run('Prologue.active'));begin(h);
 assert.equal(h.run('Prologue.active'),false,'Developer tests leave the nightmare safely');
 assert.equal(h.run('level.id'),'japan');h.run('DevTools.close();persist();mainMenu()');
 assertSaveUnchanged(h,before,'Testing from the prologue must preserve its real saved state');
 h.run('startGame(true)');assert(h.run('Prologue.active'),'Continue still restores the unfinished prologue');
 h.run('Prologue.wake()');h.dismiss();h.run("state='pause'");
 const world=h.run('JSON.stringify({player,enemies,boss,platforms,projectiles,particles,time,levelTime})'),normal=saveState(h);
 assert(h.run('DevTools.open()'));h.tick(120);h.run('DevTools.close()');
 assert.equal(h.snap().state,'pause');assert.equal(h.run('DevSession.active'),false);
 assert.equal(h.run('JSON.stringify({player,enemies,boss,platforms,projectiles,particles,time,levelTime})'),world,'Opening and closing the panel preserves the paused game');
 assertSaveUnchanged(h,normal,'Panel-only use never changes the save');
}

console.log('PASS: guarded developer test sessions, readiness, idempotency, menu/live/prologue entry, deep save isolation across real progression writers, no-save tests, discard, pause preservation and normal save recovery.');
