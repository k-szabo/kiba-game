'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),h=harness(),r=h.run;
const normal=r('JSON.stringify(saved)'),writes=r('__saveSnapshots.length');
assert(!r('DragonRaid.replay(3)'));
assert(r('DevTools.open();DevSession.begin();DevTeleport.teleport({realm:"dragonCatacombs",rest:"dragonRaidEntrance"});'));
for(const phase of [1,2,3]){
 assert(r(`DevBoss.revive({encounter:'dragonRaid${phase}'})`));assert.equal(r('DragonRaid.current.phase'),phase);assert.equal(r('state'),'developer');assert.equal(r('DragonRaid.current.test'),true);
}
r("DevTools.close();DragonRaid.hit(DragonRaid.targets()[0],100000);persist();");
assert.equal(r('fiaJourney.dragonScales'),0);assert(!r("flags[3].includes('dragonRaidFirstClear')"));assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('__saveSnapshots.length'),writes);
r('DevTools.open();DevSession.end();');assert.equal(r('fiaJourney.dragon.run'),0);assert.equal(r('state'),'menu');
console.log('PASS: dev-only three-stage raid replay, pause, no rewards/journey mutation, normal-save isolation and cleanup.');
