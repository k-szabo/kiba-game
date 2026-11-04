'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
function ready(){const h=harness();h.run("Prologue.stop();flags=[['forestBell','villageBell'],['soulUpper','soulLower'],['dawnSeal','shadowEntered'],['guardian:cultJailer','prisonOpen','guardian:prisonWarden','zenRescued','guardian:madOrganist','corruptedHymn']];defeated=[true,true,true,false];progression=freshProgression();CampQuest.enter('forestCamp');initPlayer(forestCamp.npcs.find(n=>n.id==='zen'));state='play';");return h;}
{
 const h=ready(),r=h.run;assert.equal(r('Inventory.quantity("corruptedHymn")'),1);assert.equal(r('CampQuest.questMarker("zen")'),'?');assert.equal(r('getContext().type'),'zenPurify');
 const stale=r('getContext()');h.place(200,820);assert.equal(r('PrisonQuest.interact('+JSON.stringify(stale)+')'),false,'Stale interaction must recheck proximity');h.place(1390,820);
 h.press({action:'interact'});h.tick();h.release({action:'interact'});assert.equal(r('state'),'dialog');assert.equal(r('progression.points'),r('ZEN_PURIFICATION_POINTS'));assert.equal(r('Inventory.quantity("corruptedHymn")'),0);assert(r('flags[3].includes("corruptedHymn")'),'Keep acquisition history');assert.equal(r('CampQuest.questMarker("zen")'),null);
 const frozen=r('JSON.stringify([player,enemies,levelTime])');h.tick(120);assert.equal(r('JSON.stringify([player,enemies,levelTime])'),frozen);assert.doesNotThrow(()=>validate(r('captureProgress()')));h.dismiss();r('interact()');h.dismiss();assert.equal(r('progression.points'),r('ZEN_PURIFICATION_POINTS'),'Repeat conversation cannot duplicate reward');
 r('persist();mainMenu();startGame(true);');assert.equal(r('Inventory.quantity("corruptedHymn")'),0);assert.equal(r('progression.points'),r('ZEN_PURIFICATION_POINTS'));r('revive()');assert(r('flags[3].includes("zenHymnPurified")'),'Death keeps purification');
}
for(const missing of ['zenRescued','corruptedHymn']){const h=ready();h.run('flags[3]=flags[3].filter(id=>id!=='+JSON.stringify(missing)+');');assert.equal(h.run('PrisonQuest.purificationReady()'),false);assert.notEqual(h.run('getContext()?.type'),'zenPurify');}
console.log('PASS: actual Zen interaction, proximity, one-time points/item consumption, pause, reload/death persistence and prerequisites.');
