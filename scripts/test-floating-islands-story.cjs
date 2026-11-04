'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
function ready(){const h=harness();h.run("Prologue.stop();flags=levels.map(()=>[]);flags[0].push('forestBell','villageBell');flags[1].push('soulUpper','soulLower');flags[2].push('dawnSeal','shadowEntered');flags[3].push('hannahDefeated','guardian:Hannah','dawnblade','zigguratDescentAccepted','zigguratGateCleared','guardian:VoidGatekeeper','japanHeightsReached','zigguratReturnCompleted');defeated=[true,true,true,true];abilities=[true,true];progression=normalizeProgression(null,flags);progression.points=bossBonusPoints(flags);state='play';CampQuest.enter('japanHeights');");return h;}
const h=ready(),r=h.run;
h.place(3850,1100);assert.equal(r('getContext().type'),'islandsEnter');r('interact()');assert.equal(r('level.id'),'floatingIslands');assert(r('FloatingIslands.follower()'),'Haru follows before the ambush');
h.place(1000,2850);r("var leader=enemies.find(FloatingIslands.is);FloatingIslands.updateEnemy(leader,.1);");assert(r('FloatingIslands.locked()'));
assert.equal(r('CampQuest.leave()'),false);assert.equal(r('fastTravel(level.rests[0])'),false);
r('revive()');assert(!r('FloatingIslandsRules.abducted(flags)'));assert.equal(r('enemies.find(FloatingIslands.is).hp'),1800,'Death restarts the ambush');
h.place(1000,2850);r('leader=enemies.find(FloatingIslands.is);FloatingIslands.updateEnemy(leader,.1);var xpBefore=progression.totalXp,pointsBefore=progression.points;leader.hp=leader.maxHp*.7;FloatingIslands.updateEnemy(leader,.1);');
assert(r('FloatingIslandsRules.abducted(flags)'));assert(r('FloatingIslands.cinematic()'));r("state='pause';FloatingIslands.update(1);");assert.equal(r('FloatingIslands.departure().elapsed'),0);r("state='play';");h.tick(180);assert(!r('FloatingIslands.locked()'));assert.equal(r('FloatingIslands.follower()'),null);assert.equal(r('progression.totalXp'),r('xpBefore'));assert.equal(r('progression.points'),r('pointsBefore'),'Escape is not a rewarded boss kill');h.dismiss();
h.place(1250,2850);r("Bindings.setPrimary('grapple','g');");assert.equal(r('getContext().type'),'islandsHook');r('interact()');assert(r('Grapple.owned()'));
assert.equal(h.elements.get('toast').textContent,r("I18n.format('help.grapple',[bindingKeyLabel(Bindings.read('grapple')[0])])"),'Hook pickup shows instructions using the current binding');
assert.equal(r('getContext()?.type'),undefined,'Hook pickup cannot repeat');
validate(r('captureProgress()'));
for(const fps of [30,60,120]){
 h.place(1780,2850);r('state="play";');assert.equal(r('Grapple.selection().id'),'island-ring-1');
 h.press({action:'grapple'});r('update(1/'+fps+');');h.release({action:'grapple'});assert(r('Grapple.pullingPlayer()'));
 r("state='pause';var pausedPlayer=JSON.stringify(player),pausedHook=JSON.stringify(Grapple.snapshot());update(.5);");assert.equal(r('JSON.stringify(player)'),r('pausedPlayer'));assert.equal(r('JSON.stringify(Grapple.snapshot())'),r('pausedHook'));r("state='play';");
 for(let i=0;i<fps*2;i++)r('update(1/'+fps+');');
 assert(r('player.onGround&&Math.abs(player.y+player.h-2450)<1'),'Real R input traverses and lands at '+fps+' FPS');assert(r('player.x>=2480&&player.x+player.w<=3480'));assert(!r('Grapple.pullingPlayer()'));
}
h.place(2860,2450);r('interact()');assert.equal(r('checkpoint.id'),'floatingIslandsPath');validate(r('captureProgress()'));
r('revive()');assert(r('Grapple.owned()&&FloatingIslandsRules.abducted(flags)'));assert(r('enemies.find(FloatingIslands.is).dead'),'Escape persists after death');
const invalid=JSON.parse(r('JSON.stringify(captureProgress())'));invalid.flags[0]=invalid.flags[0].filter(id=>id!=='grapplingHook');assert.throws(()=>validate(invalid),/Invalid island route checkpoint/);
r("CampQuest.enter('japanHeights');");h.place(3200,1100);assert.notEqual(r('getContext()?.type'),'descentHaru');assert.equal(r('ZigguratDescent.showFollower()'),false,'Abducted Haru has no duplicate at the arrival map');
console.log('PASS: Haru abduction at 70%, retry, no kill rewards, once-only hook, real R traversal/pause at 30/60/120 FPS, strict checkpoint save validation and no duplicate Haru.');
