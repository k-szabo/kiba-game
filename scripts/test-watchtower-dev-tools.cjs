'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
for(const fps of [30,60,120]){
 const h=harness(),r=h.run,normal=r('JSON.stringify(saved)'),writes=r('window.__saveSnapshots.length');
 r('DevTools.open();DevSession.begin();');
 for(const map of ['floatingIslands','ninjaWatchtower','balloonJourney','skyLanding','stormIslands']){
  const rest=r(`SIDE_LOCATIONS['${map}'].map.rests[0].id`);
  assert(r(`DevTeleport.teleport({realm:'${map}',rest:'${rest}'})`));
  const entries=r('(level.arenaEncounters||level.enemies).filter(e=>e.miniboss).map(e=>e.id)');
  for(const id of entries){
   // Existing permanent completion flags must neither disable the replay nor
   // be revoked to start it. The flight controller must not replace its actor.
   r('flags[0]=[...new Set([...flags[0],...Object.values(WatchtowerBalloonRules.progress)])];');
   const before=r('JSON.stringify({flags,progression,coins,defeated})');
   assert(r(`DevBoss.revive({encounter:'${id}'})`),map+' '+id);
   r(`globalThis.subject=enemies.find(e=>e.id==='${id}');player.inv=999;DevTools.close();`);
   let attacked=false;
   for(let i=0;i<fps*6;i++){r(`update(${1/fps})`);if(r("subject.phase==='strike'||projectiles.some(p=>p.source==='mini:'+subject.id)"))attacked=true;}
   assert(attacked,'Replay never attacked: '+id+' '+fps);
   assert(r('enemies.includes(subject)'), 'Campaign controller replaced the replay');
   assert.equal(r('level.id'),map,'Replay unexpectedly changed location');
   assert.equal(r('WatchtowerBalloon.cinematic()'),false,'Replay launched a story scene');
   r('subject.hp=0;');r(`update(${1/fps})`);
   assert(r('subject.dead'));
   assert.equal(r('JSON.stringify({flags,progression,coins,defeated})'),before,'Replay changed rewards/progression');
   r('DevTools.open();');
  }
 }
 assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('window.__saveSnapshots.length'),writes);
 r('DevSession.end();');assert.equal(r('JSON.stringify(saved)'),normal);
}
const h=harness(),r=h.run,normal=r('JSON.stringify(saved)'),writes=r('window.__saveSnapshots.length');
r("DevTools.open();DevSession.begin();DevTeleport.teleport({realm:'ninjaWatchtower',rest:'watchtowerRoof'});DevTools.close();globalThis.sentinel=enemies.find(e=>e.miniboss==='watchtowerSentinel');player.x=sentinel.arena.triggerX+40;player.y=sentinel.arena.y-player.h;player.inv=999;");
for(let i=0;i<360;i++)r('update(1/60)');assert(r('sentinel.active&&sentinel.cycles>0'),'A fresh dev rooftop visit must activate and attack without rescue flags');
r("DevTools.open();DevSession.begin();DevTeleport.teleport({realm:'ninjaWatchtower',rest:'watchtowerCellar'});flags=levels.map(()=>[]);for(const e of enemies)e.dead=true;");
assert(r("DevItems.add({item:'watchtowerCellKey'})"));
r("Bindings.setPrimary('interact','g');DevTools.close();");h.place(3250,3200);h.tick();
assert(r('Merchant.description("watchtowerCellKey")').includes('G'),'Key description must use the selected interaction binding');assert(!r('Merchant.description("watchtowerCellKey")').includes('{0}'));
assert.equal(r('WatchtowerBalloon.context().type'),'watchtowerRescue');
assert.equal(r('WatchtowerBalloon.context().locked'),false);
assert(r('WatchtowerBalloon.interact(WatchtowerBalloon.context())'));h.dismiss();
assert.equal(r('Inventory.quantity("watchtowerCellKey")'),0,'Cell key was not consumed');
assert.equal(r('window.__saveSnapshots.length'),writes);assert.equal(r('JSON.stringify(saved)'),normal);
r('DevTools.open();');assert(r("DevTeleport.teleport({realm:'balloonJourney',rest:'balloonDeck'})"));r('DevTools.close();WatchtowerBalloon.update(.01);WatchtowerBalloon.update(6.1);');assert.equal(r('enemies.filter(e=>e.balloonWasp).length'),5,'Unseeded dev flight still spawns its first stage');
console.log('PASS new-map dev teleport/replay combat at30/60/120FPS, no cutscenes/reward/save writes, usable isolated cell key.');
