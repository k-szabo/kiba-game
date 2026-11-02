'use strict';
const assert=require('node:assert/strict'),setup=require('./test-fia-fixture.cjs'),validate=require('./test-save-validation.cjs');
const h=setup(),r=h.run;
r("flags[3].push('fiaChambersHeard','fiaTalismanAccepted');enterRealm(0);initPlayer(japan.cultPassage.ruinedGate);DungeonRun.menu();");
h.elements.get('dungeonNew').onclick();h.dismiss();
for(let i=0;i<3;i++){
 r('var guardian=enemies.find(DungeonCombat.is);guardian.active=true;guardian.hp=0;killEnemy(guardian);');h.dismiss();
 if(i<2)r('initPlayer(level.nextPoint);interact();');
}
r("DungeonRun.leave();CampQuest.enter('fiaChambers');initPlayer(level.npcs[0]);FiaQuest.talk();");h.dismiss();
assert(r("flags[3].includes('fiaTalismanCompleted')"));
r("CampQuest.enter('zigguratSummit');var guardian=enemies.find(HannahCombat.is);guardian.dead=true;guardian.hp=0;guardian.rescuedByFia=true;HannahEncounter.onDefeated(guardian);");h.dismiss();
assert.doesNotThrow(()=>validate(r('captureProgress()')));
r("CampQuest.enter('fiaChambers');initPlayer(level.npcs[0]);FiaQuest.talk();");h.dismiss();assert(r("flags[3].includes('fiaDragonAccepted')"));
r("CampQuest.enter('zigguratInterior');initPlayer(level.dragonRaidEntrance);DragonRaid.begin();");
assert.doesNotThrow(()=>validate(r('captureProgress()')));
for(let i=0;i<4;i++)r(`DragonRaid.hit(DragonRaid.targets().find(t=>t.type==='chain'&&t.index===${i}),10000)`);
for(let i=0;i<3;i++)r(`DragonRaid.hit(DragonRaid.targets().find(t=>t.type==='tumor'&&t.index===${i}),10000)`);
for(let i=0;i<2;i++)r(`DragonRaid.hit(DragonRaid.targets().find(t=>t.type==='manifestation'&&t.index===${i}),10000)`);
r('initPlayer(level.headPoint);DragonRaid.update(.01);for(const target of DragonRaid.targets().filter(t=>t.type==="foreleg"))DragonRaid.hit(target,10000);player.inv=999;for(let i=0;i<80;i++)update(1/120);DragonRaid.hit(DragonRaid.targets().find(t=>t.type==="head"),10000);');
assert.doesNotThrow(()=>validate(r('captureProgress()')));assert.equal(r("Inventory.quantity('dragonEyes')"),1);assert.equal(r("Inventory.quantity('dragonScale')"),1);
r("CampQuest.enter('fiaChambers');initPlayer(level.npcs[0]);FiaQuest.talk();");h.dismiss();
assert.doesNotThrow(()=>validate(r('saved')));assert.equal(r("Inventory.quantity('dragonEyes')"),0);assert(r("flags[3].includes('dragonEyes')&&flags[3].includes('fiaDragonCompleted')"));
const good=JSON.parse(r('JSON.stringify(saved)')),bad=JSON.parse(JSON.stringify(good));bad.fiaJourney.dragonScales=bad.fiaJourney.dragon.run+1;assert.throws(()=>validate(bad),/Invalid Fia journey/);
const noHistory=JSON.parse(JSON.stringify(good));delete noHistory.fiaJourney;assert.throws(()=>validate(noHistory),/Invalid Fia journey/);
r('startGame(true)');h.dismiss();assert.equal(r('fiaJourney.dragonScales'),1);assert(r("flags[3].includes('fiaDragonCompleted')"));
console.log('PASS: real quest2/Hannah/dragon/turn-in writers produce strictly valid saves, preserve scale/consumption history, and reject forged or missing raid records.');
module.exports=good;
