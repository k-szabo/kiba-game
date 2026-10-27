'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
const setup=require('./test-fia-fixture.cjs');
function cult(h){const r=h.run;r('enterRealm(0);initPlayer(japan.cultPassage.ruinedGate);DungeonRun.menu();');h.elements.get('dungeonNew').onclick();h.dismiss();for(let i=0;i<3;i++){r('var priestess=enemies.find(DungeonCombat.is);priestess.active=true;priestess.hp=0;killEnemy(priestess);');h.dismiss();if(i<2)r('initPlayer(level.nextPoint);interact();');}}
function talk(h){h.run('initPlayer(level.npcs[0]);interact();');h.dismiss();}
{
 const h=setup(),r=h.run;cult(h);assert(!r('flags[3].includes("priestessTalisman")'),'Earlier clears cannot retroactively drop a quest item');
 r('DungeonRun.leave();CampQuest.enter("fiaChambers");');assert.equal(r('CampQuest.questMarker("fia")'),'!');talk(h);assert(r('flags[3].includes("fiaChambersHeard")'));assert(!r('flags[3].includes("fiaTalismanAccepted")'),'Haru clue comes before the second request');talk(h);assert(r('flags[3].includes("fiaTalismanAccepted")'));
 cult(h);assert(r('flags[3].includes("priestessTalisman")'));assert.doesNotThrow(()=>validate(r('saved')));
 r('DungeonRun.leave();CampQuest.enter("fiaChambers");');assert.equal(r('CampQuest.questMarker("fia")'),'?');const xp=r('progression.totalXp');talk(h);assert.equal(r('chickenCount'),3);assert.equal(r('progression.totalXp'),xp+600);talk(h);assert.equal(r('chickenCount'),3);assert.equal(r('progression.totalXp'),xp+600);assert.doesNotThrow(()=>validate(r('saved')));
 r("quickHeal='roastChicken';player.hp=player.maxHp;player.inv=0;");assert(!r('Merchant.useQuick()'));assert.equal(r('chickenCount'),3);r('player.hp=1;');h.press({action:'useMeat'});h.tick();h.release({action:'useMeat'});assert.equal(r('chickenCount'),2);assert.equal(r('player.hp'),5);
 r('chickenCount=1;meatCount=2;player.hp=1;');assert(r('Merchant.useQuick()'));assert.equal(r('quickHeal'),'roastMeat','Shared fallback chooses another available healing item');
}
for(const room of [false,true])for(const fps of [30,60,120]){
 const h=setup(room),r=h.run;r("var fiaNPC=level.npcs.find(n=>n.id==='fia');initPlayer({x:fiaNPC.x-75,y:fiaNPC.y});player.face=1;player.hp=2;player.inv=0;teaCount=2;Merchant.drink();Merchant.update(.4);meatCount=3;");
 h.press({action:'attack'});for(let i=0;i<fps&&r("state==='play'");i++)r('update('+1/fps+')');h.release({action:'attack'});assert.equal(r('state'),'dialog','Normal bound attack provokes visible Fia');
 const baseline=JSON.parse(r('JSON.stringify(FiaConflict.pendingSave())'));assert.doesNotThrow(()=>validate(baseline));h.dismiss();assert(r('FiaConflict.enemy?.active'));assert.equal(r('getContext()'),null);assert(!r('fastTravel(level.rests[0],3)'));assert(!r('showTraining()'));
 r('Merchant.eat();player.inv=0;damage(99,1,true);');assert(!r('FiaConflict.blocked()'));assert.equal(r('player.hp'),baseline.fiaRecovery.hp);assert.equal(r('player.x+player.w/2'),baseline.fiaRecovery.x);assert.equal(r('player.y+player.h'),baseline.fiaRecovery.feet);assert.equal(r('meatCount'),baseline.meatCount);assert.equal(r('teaCount'),baseline.teaCount);assert.deepEqual(JSON.parse(r('JSON.stringify(Merchant.teaSnapshot())')),baseline.fiaRecovery.tea);assert(r('campNPCVisible(level.npcs.find(n=>n.id==="fia"))'));
 assert(!r('flags[3].includes("fiaSlain")'));assert.doesNotThrow(()=>validate(r('saved')));
}
for(const room of [false,true]){
 const h=setup(room),r=h.run;r("var npc=level.npcs.find(n=>n.id==='fia');initPlayer({x:npc.x-70,y:npc.y});FiaConflict.provoke({x:npc.x-35,y:npc.y-130,w:70,h:130});");h.dismiss();r('player.y=level.height+200;movePlayer(.01);');assert(!r('FiaConflict.blocked()'),'Fatal falls restore the same baseline');
 r("var npc=level.npcs.find(n=>n.id==='fia');FiaConflict.provoke({x:npc.x-35,y:npc.y-130,w:70,h:130});");h.dismiss();r('var fury=FiaConflict.enemy;fury.shieldRemaining=0;FiaCombat.hit(fury,{x:fury.x,y:fury.y,w:fury.w,h:fury.h},10000);');h.dismiss();
 assert(r('flags[3].includes("fiaSlain")'));assert.equal(r('bossBonusPoints(flags)'),1);assert.equal(r('progression.totalXp'),1200);assert(r('FiaConflict.owned()'));assert.equal(r('enemies.filter(e=>e.denRetaliation).length'),2);assert.equal(r('campNPCVisible(level.npcs[0])'),false);assert(!r('FiaQuest.available()'));assert.doesNotThrow(()=>validate(r('saved')));
 const reward=r('JSON.stringify([flags,progression,coins])');r('FiaConflict.onDefeated(fury);revive();');assert.equal(r('JSON.stringify([flags,progression,coins])'),reward);assert.equal(r('enemies.filter(e=>e.denRetaliation).length'),2,'Bodyguards respawn while permanent hostility persists');
 r('player.inv=0;damage(1,1,true);');assert.equal(r('FiaConflict.shield'),1);r('player.inv=0;damage(1,1,true);');assert.equal(r('FiaConflict.shield'),0);const hp=r('player.hp');r("state='pause';FiaConflict.update(20)");assert.equal(r('FiaConflict.shield'),0);r("state='play';FiaConflict.update(11.9)");assert.equal(r('FiaConflict.shield'),0);r('FiaConflict.update(.1);');assert.equal(r('FiaConflict.shield'),2);assert.equal(r('player.hp'),hp);
}
console.log('PASS: Fia quest-only new-clear drop, prior clue, once-only turn-in/chicken quick use, real provocation at30/60/120FPS, full HP/position/tea/stock rollback including falls, permanent hostility and one-time shield/XP/point reward.');
