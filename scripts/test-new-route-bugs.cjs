'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs'),{fixture}=require('./test-save-release.cjs');
for(const realm of [0,2])for(const fps of [30,60,120]){
 const h=harness(),r=h.run;r('Prologue.stop();enterRealm('+realm+');state="play";var area=level.secrets.find(a=>SerpentArt.hasBackdrop(a));');
 for(const x of [r('area.arena.x')+1,r('area.arena.x+area.arena.w/2'),r('area.arena.x+area.arena.w')-1])for(const jump of realm===2?[0,300]:[0]){
  r('initPlayer({x:'+x+',y:area.arena.y-'+jump+'});');assert.equal(r('Visuals.secretBackdropState().alpha'),1,'Every actual arena edge/jump is fully covered');
  r('for(let i=0;i<'+fps+';i++)SerpentArt.updateBackdrop('+1/fps+')');assert.equal(r('SerpentArt.backdropState().alpha'),1);
 }
 r('initPlayer({x:area.x+1,y:area.arena.y});');assert(r('Visuals.secretBackdropState().alpha<1'),'Entry corridor still blends');
}
{
 const h=harness(),r=h.run;r('Prologue.stop();defeated=[true,true,true,true];flags=[["forestBell","villageBell"],["soulUpper","soulLower"],["dawnSeal","shadowEntered"],["prisonTrace","shadowAltar","guardian:cultJailer","prisonOpen"]];enterRealm(3);state="play";initPlayer(level.denEntrance);');
 assert.equal(r('sideLocationUnlocked("shadowDen",flags,defeated)'),false);assert.notEqual(r('getContext()?.type'),'fiaDenEnter');assert(!r('CampQuest.enter("shadowDen")'));
 assert(r('CampQuest.enter("shadowPrison")'));const snapshot=r('JSON.stringify(saved)');r('revive();');assert(!r('KitsuneQuest.missed()'));r('persist();mainMenu();startGame(true)');h.dismiss();assert(!r('KitsuneQuest.missed()'));
 r('initPlayer(level.returnPoint);interact()');assert(r('KitsuneQuest.missed()'));assert(!r('flags[3].includes("fiaSeen")'));assert(!r('flags[3].includes("guardian:prisonHunter")'));assert.doesNotThrow(()=>validate(r('saved')));
 r('CampQuest.enter("shadowPrison");initPlayer(level.fia)');assert.notEqual(r('getContext()?.type'),'fiaRescue');assert(!r('CampQuest.enter("shadowDen")'));
}
{
 const h=harness(),r=h.run;const data=fixture();Object.assign(data,{realm:3,location:'shadowDen',prologueComplete:true,defeated:[true,true,true,true],flags:[['forestBell','villageBell'],['soulUpper','soulLower'],['dawnSeal','shadowEntered'],['prisonTrace','shadowAltar']],checkpoint:JSON.parse(r('JSON.stringify(shadowDen.rests[0])')),visitedRests:[[],[],[],['shadowDenCamp']]});
 assert.throws(()=>validate(data),'Current saves cannot visit the den without rescue');const source=JSON.stringify(data),migrated=validate(data,{legacyDen:true});assert.equal(JSON.stringify(data),source);assert.equal(migrated.location,undefined);assert.equal(migrated.checkpoint.id,'cathedral');assert(!migrated.visitedRests[3].includes('shadowDenCamp'));assert.deepEqual(validate(migrated),migrated);assert.deepEqual(JSON.parse(JSON.stringify(migrated.flags)),data.flags,'Compatibility repair cannot invent rescue or guardian rewards');
 const bad=structuredClone(data);bad.progression.points=1;assert.throws(()=>validate(bad,{legacyDen:true}),'Legacy location migration cannot launder invalid progression');bad.progression.points=0;bad.checkpoint.x++;assert.throws(()=>validate(bad,{legacyDen:true}),'Legacy checkpoint must remain exact');
}
console.log('PASS: opaque serpent arena edges and jumps; rescued-only den; first prison departure vs death/reload; strict legacy den evacuation without invented progress.');
