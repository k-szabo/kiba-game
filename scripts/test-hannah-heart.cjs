'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
function setup(history=[]){
 const h=harness();h.run(`Prologue.stop();realm=3;level=zigguratSummit;platforms=level.platforms.map(p=>({...p}));flags=levels.map(()=>[]);flags[3]=${JSON.stringify(history)};defeated=[true,true,true,true];boss={dead:true};enemies=[];projectiles=[];particles=[];state='play';initPlayer({x:1450,y:1400});enemies=createEnemies();var hannah=enemies.find(HannahCombat.is);`);return h;
}
const eligible=['fiaRescued','arenaChampion','fiaTalismanCompleted'];
// Reward ownership is determined by the ending that actually ran, even if
// Fia's eligibility changes before a reconciliation or a later realm entry.
for(const currentFlags of [[],['fiaSeen','fiaMissed'],['fiaRescued'],eligible,[...eligible,'fiaSlain']]){
 const h=setup(currentFlags),r=h.run;
 const points=r('progression.points'),xp=r('progression.totalXp');
 r('hannah.dead=true;hannah.rescuedByFia=false;HannahEncounter.onDefeated(hannah)');
 assert(r("flags[3].includes('demonLordSoul')"));
 assert(!r("flags[3].includes('demonLordHeart')"),'Lightning ending never gives a heart, regardless of current Fia eligibility');
 assert(!r("flags[3].includes('hannahFiaRescue')"));
 assert.equal(r('progression.totalXp'),xp+1600);
 assert.equal(r('progression.points'),points+1+r('progression.level')-1,'Victory retains the point bonus and normal XP level-up points');
 const once=r('JSON.stringify([flags,progression])');
 r('HannahEncounter.reconcileRewards();HannahEncounter.reconcileRewards();HannahEncounter.onDefeated(hannah)');
 assert.equal(r('JSON.stringify([flags,progression])'),once,'Repeated reconciliation cannot invent a heart or repeat XP/points');
}
{
 const h=setup(eligible),r=h.run;r('hannah.dead=true;hannah.rescuedByFia=true;HannahEncounter.onDefeated(hannah)');
 assert(r("flags[3].includes('hannahFiaRescue')&&flags[3].includes('demonLordHeart')"));
 r("flags[3].push('fiaSlain');flags[3]=flags[3].filter(id=>id!=='demonLordHeart');");
 assert.equal(r('HannahEncounter.reconcileRewards()'),true,'Historical rescue remains authoritative after Fia later dies');
 assert(r("flags[3].includes('demonLordHeart')"));
 assert.equal(r('HannahEncounter.reconcileRewards()'),false);
}
{
 const h=harness(),r=h.run,saved=r('JSON.stringify(saved)'),writes=r('__saveSnapshots.length');
 assert(r('DevTools.open();DevSession.begin()'));assert(r("DevItems.add({item:'demonLordHeart'})"));
 r('persist()');assert(r("Inventory.contents().includes('demonLordHeart')"),'Test mode can still spawn the reward directly');
 assert.equal(r('JSON.stringify(saved)'),saved);assert.equal(r('__saveSnapshots.length'),writes,'Direct test grants never write to the normal save');
 r('DevSession.end();startGame(true)');h.dismiss();assert(!r("flags[3].includes('demonLordHeart')"));
}
console.log('PASS: Hannah heart follows the actual Fia ending; lightning, eligibility changes, repeated rewards and developer grants remain isolated.');
