'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
const h=harness(),r=h.run;
r("Prologue.stop();flags=levels.map(()=>[]);flags[0].push('forestBell','villageBell',...Object.values(FloatingIslandsRules.progress));flags[1].push('soulUpper','soulLower');flags[2].push('dawnSeal','shadowEntered');flags[3].push('hannahDefeated','guardian:Hannah','dawnblade','zigguratDescentAccepted','zigguratGateCleared','guardian:VoidGatekeeper','japanHeightsReached','zigguratReturnCompleted');defeated=[true,true,true,true];abilities=[true,true];progression=normalizeProgression(null,flags);progression.points=bossBonusPoints(flags);state='play';CampQuest.enter('floatingIslands');");
function interactAt(x,y){h.place(x,y);h.press({action:'interact'});h.tick();h.release({action:'interact'});}
function win(kind){r(`var foe=enemies.find(e=>e.miniboss==='${kind}');player.x=foe.arena.triggerX+30;player.y=foe.arena.y-player.h;WatchtowerBalloonCombat.update(foe,.01);foe.hp=0;WatchtowerBalloonCombat.update(foe,.01);`);}
interactAt(6800,1650);assert.equal(r('level.id'),'ninjaWatchtower');
const legacy=r('captureProgress()');legacy.checkpoint={id:'watchtowerEntrance',x:1000,y:2000};if(!legacy.visitedRests[0].includes('watchtowerEntrance'))legacy.visitedRests[0].push('watchtowerEntrance');assert.equal(validate(legacy).checkpoint.x,1300,'Only the exact old shrine coordinate migrates');legacy.checkpoint.x=1001;assert.throws(()=>validate(legacy),/save location/);
interactAt(3250,3200);assert(!r('flags[0].includes("westheruRescued")'),'Cell rejects missing key');
win('watchtowerJailer');assert(r('flags[0].includes("watchtowerCellKey")'));h.dismiss();
interactAt(3250,3200);assert(r('flags[0].includes("westheruRescued")'));h.dismiss();
assert(r('flags[0].includes("haruAbducted")'),'Haru is still abducted');
validate(r('captureProgress()'));
win('watchtowerSentinel');assert(r('WatchtowerBalloon.cinematic()'));r("state='pause';WatchtowerBalloon.update(1);");assert.equal(r('WatchtowerBalloon.departure().elapsed'),0);r("state='play';WatchtowerBalloon.update(1.3);");h.dismiss();
interactAt(3160,400);assert.equal(r('level.id'),'balloonJourney');assert.equal(r('CampQuest.leave()'),false,'Cannot abandon flight through generic travel');
r('WatchtowerBalloon.update(.01);WatchtowerBalloon.update(6.1);');assert.equal(r('enemies.filter(e=>e.balloonWasp).length'),5);
r('var wasp=enemies[4];wasp.x=450;wasp.y=700;attackFace=1;resolveMeleeDamage({amount:1,hit:{x:450,y:700,w:82,h:60}});');assert(Math.abs(r('wasp.x')-450)<=20,'Wasp knockback never snaps to spawn');
r('for(const e of enemies){e.hp=0;killEnemy(e);}WatchtowerBalloon.update(.01);WatchtowerBalloon.update(6.1);');assert(r('enemies.some(e=>e.miniboss==="balloonDragon")'));
r('WatchtowerBalloon.damageBalloon(100);');assert.equal(r('state'),'dialog');h.dismiss();r('WatchtowerBalloon.update(.01);WatchtowerBalloon.update(6.1);');assert.equal(r('WatchtowerBalloon.flight().hp'),100);assert(r('flags[0].includes("balloonWaspsCleared")'),'Balloon failure preserves the cleared wasp stage');
win('balloonDragon');r('WatchtowerBalloon.update(.01);');assert.equal(r('level.id'),'skyLanding');r('WatchtowerBalloon.update(.01);');h.dismiss();
r('player.x=1050;player.y=1000-player.h;WatchtowerBalloon.update(.01);');assert.equal(r('WatchtowerBalloon.morph().kind'),'transform');r("state='pause';WatchtowerBalloon.update(1);");assert.equal(r('WatchtowerBalloon.morph().elapsed'),0);r("state='play';WatchtowerBalloon.update(2.1);");h.dismiss();
win('westheruSeal');assert.equal(r('WatchtowerBalloon.morph().kind'),'restore');r('WatchtowerBalloon.update(2.1);');h.dismiss();assert(r('flags[0].includes("westheruRestored")'));
interactAt(r('skyLanding.boardPoint.x'),1000);assert(r('WatchtowerBalloon.cinematic()'));const vortexTime=r('WatchtowerBalloon.vortex().elapsed');r("state='pause';WatchtowerBalloon.update(1);");assert.equal(r('WatchtowerBalloon.vortex().elapsed'),vortexTime);r("state='play';WatchtowerBalloon.update(3.1);");h.dismiss();assert.equal(r('level.id'),'stormIslands');validate(r('captureProgress()'));
assert(r('WatchtowerBalloon.arrival().departing'));r("state='pause';WatchtowerBalloon.update(1)");assert.equal(r('WatchtowerBalloon.arrival().elapsed'),0);r("state='play';WatchtowerBalloon.update(4.1)");assert(r('flags[0].includes("westheruDeparted")'));assert.equal(r('WatchtowerBalloon.arrival()'),null);validate(r('captureProgress()'));
const bad=r('captureProgress()');bad.flags[0]=bad.flags[0].filter(id=>id!=='westheruRescued');assert.throws(()=>validate(bad),/watchtower/);
assert.equal(r('nextObjective().point.x'),r('stormIslands.endPoint.x'));
interactAt(r('stormIslands.endPoint.x'),r('stormIslands.endPoint.y'));
assert.equal(r('state'),'dungeonMenu');h.elements.get('dungeonNew').onclick();
for(let floor=0;floor<3;floor++){
 assert.equal(r('DungeonRun.floor()'),floor);
 r('initPlayer(level.rests[0]);interact();');
 r('var ninjaBoss=enemies.find(DungeonCombat.is);player.x=ninjaBoss.arena.x+170;player.y=ninjaBoss.arena.y-player.h;ninjaBoss.active=true;');
 if(floor===2){
  r('DungeonCombat.update(ninjaBoss,90);');
  assert(!r('flags[0].includes("ninjaClanRitualistReward")'),'The ritual finishing gives no reward');
  r('ninjaBoss=enemies.find(DungeonCombat.is);player.x=ninjaBoss.arena.x+170;player.y=ninjaBoss.arena.y-player.h;ninjaBoss.active=true;');
 }
 r('DungeonCombat.hit(ninjaBoss,ninjaBoss.parts[0],9999);');
 if(floor===0){h.dismiss();r('DungeonCombat.update(ninjaBoss,1.3);ninjaBoss.inv=0;DungeonCombat.hit(ninjaBoss,ninjaBoss.parts[0],9999);');}
 if(floor===1)h.dismiss();
 if(floor===2)r('DungeonCombat.update(ninjaBoss,1.2);initPlayer(level.rewardChest);interact();');
 assert(r('DungeonRun.cleared(DungeonRun.floor())'));validate(r('captureProgress()'));
 r('initPlayer(level.nextPoint);interact();');
}
assert.equal(r('level.id'),'ninjaClanCamp');
assert.equal(r('Inventory.quantity("ninjaClanLeaderSoul")'),1);
assert.equal(r('Inventory.quantity("ninjaCorruptedSeal")'),1);
assert.equal(r('Inventory.quantity("ninjaCampSpoils")'),1);
r('initPlayer(level.npcs.find(npc=>npc.id==="reika"));interact();');h.dismiss();
assert(r('flags[0].includes("ninjaClanDebrief")'));
r("flags[1].push('akashRescued');flags[3].push('guardian:cultJailer','prisonOpen','guardian:prisonWarden','zenRescued');initPlayer(level.npcs.find(npc=>npc.id==='zen'));interact();");
h.dismiss();assert.equal(r('Inventory.quantity("ninjaCorruptedSeal")'),0);validate(r('captureProgress()'));
r('persist();mainMenu();startGame(true);');assert.equal(r('level.id'),'ninjaClanCamp');
assert(r('flags[0].includes("ninjaSealPurified")'));validate(r('captureProgress()'));
interactAt(r('ninjaCamp.skyport.x'),r('ninjaCamp.skyport.y'));
assert.equal(r('state'),'dungeonMenu');h.elements.get('dungeonNew').onclick();
assert.equal(r('level.skyDragonRaid'),'harbor');
assert.equal(r('nextObjective().text'),'skyDragonRaid.harborGoal');
assert.equal(r('captureProgress().location'),'ninjaClanCamp');
validate(r('captureProgress()'));
for(let shot=0;shot<6;shot++){
 interactAt(r('level.ballistas[0].x'),r('level.ballistas[0].y'));
 r('SkyDragonRaid.update(1.3)');
}
assert.equal(r('captureProgress().skyDragonRaid.phase'),'pursuit');
r('mainMenu();startGame(true);');assert.equal(r('level.id'),'ninjaClanCamp');
interactAt(r('ninjaCamp.skyport.x'),r('ninjaCamp.skyport.y'));h.elements.get('dungeonContinue').onclick();
assert.equal(r('level.skyDragonRaid'),'pursuit');
for(let wave=0;wave<3;wave++)r('for(const e of enemies){e.hp=0;killEnemy(e);}SkyDragonRaid.update(.02);');
r('initPlayer({x:1720,y:1060});');h.press({action:'grapple'});h.tick(100);h.release({action:'grapple'});
assert.equal(r('level.skyDragonRaid'),'back');
r('for(const e of enemies){e.hp=0;killEnemy(e);}SkyDragonRaid.update(.02);');
assert.equal(r('level.skyDragonRaid'),'rift');
r('player.hp=0;revive();');assert.equal(r('level.skyDragonRaid'),'rift');
r('initPlayer({x:6260,y:1090});');h.press({action:'grapple'});h.tick(135);h.release({action:'grapple'});
r('initPlayer({x:level.dragonHead.x,y:level.dragonHead.y});resolveMeleeDamage({amount:2000,hit:{x:7200,y:850,w:150,h:130}});');
assert.equal(r('captureProgress().skyDragonRaid.victories'),1);validate(r('captureProgress()'));
assert.equal(r('Inventory.quantity("cloudDragonScale")'),1);assert.equal(r('Inventory.quantity("cloudNinjaRing")'),1);
r('interact();initPlayer(level.npcs.find(npc=>npc.id==="reika"));interact();');h.dismiss();
assert(r('flags[0].includes("skyDragonRaidRingTurnedIn")'));validate(r('captureProgress()'));
assert.equal(r('Inventory.quantity("cloudNinjaRing")'),0);
r('SkyDragonRaid.restore({...captureProgress().skyDragonRaid,run:3,victories:3});flags[3].push("dragonRaidFirstClear");progression.points++;fiaJourney.dragon.run=3;fiaJourney.dragonScales=3;initPlayer(DungeonRun.campNpc("smith"));CampWorkshop.open("forge");');
assert(r('SkyDragonRaid.forge()'));assert(!r('SkyDragonRaid.forge()'));
assert.equal(r('Inventory.quantity("cloudDragonScale")'),0);assert.equal(r('Inventory.quantity("cloudscaleArmor")'),1);
assert(r('SkyDragonRaid.toggleArmor()'));validate(r('captureProgress()'));
r('CampWorkshop.close();persist();mainMenu();startGame(true);');assert(r('SkyDragonRaid.armorEquipped'));
r('player.hp=20;player.inv=0;damage(10,0,false,true,"spell");');assert.equal(r('player.hp'),12);
r('player.hp=20;player.inv=0;damage(10,0,false,true);');assert.equal(r('player.hp'),10);
console.log('PASS watchtower, balloon and Sky Dragon raid: actual entry/boarding/grapple inputs, retry, pause, raid rewards and strict saves.');
