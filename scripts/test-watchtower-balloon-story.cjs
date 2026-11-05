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
interactAt(280,1000);assert(r('WatchtowerBalloon.cinematic()'));const vortexTime=r('WatchtowerBalloon.vortex().elapsed');r("state='pause';WatchtowerBalloon.update(1);");assert.equal(r('WatchtowerBalloon.vortex().elapsed'),vortexTime);r("state='play';WatchtowerBalloon.update(3.1);");h.dismiss();assert.equal(r('level.id'),'stormIslands');validate(r('captureProgress()'));
assert(r('WatchtowerBalloon.arrival().departing'));r("state='pause';WatchtowerBalloon.update(1)");assert.equal(r('WatchtowerBalloon.arrival().elapsed'),0);r("state='play';WatchtowerBalloon.update(4.1)");assert(r('flags[0].includes("westheruDeparted")'));assert.equal(r('WatchtowerBalloon.arrival()'),null);validate(r('captureProgress()'));
const bad=r('captureProgress()');bad.flags[0]=bad.flags[0].filter(id=>id!=='westheruRescued');assert.throws(()=>validate(bad),/watchtower/);
console.log('PASS watchtower/balloon story: actual entry/rescue/boarding inputs, stage retry, pause, Haru retention and strict saves.');
