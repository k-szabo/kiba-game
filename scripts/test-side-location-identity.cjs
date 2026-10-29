'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
for(let context=0;context<12;context++){
 const h=harness(),r=h.run,ids=Array.from(r('Object.keys(SIDE_LOCATIONS)'));
 for(let cycle=0;cycle<24;cycle++)for(const id of ids){
  r('level=SIDE_LOCATIONS['+JSON.stringify(id)+'].map');assert.equal(r('CampQuest.locationId()'),id,'Every registered map retains its exact location identity across contexts and transitions');
 }
 for(const map of ['levels[0]','levels[1]','levels[2]','levels[3]','null','{}','{id:"constructor"}','{id:"toString"}','{id:"__proto__"}','{id:"unknown"}','{...SIDE_LOCATIONS.forgeInterior.map}','Object.create(SIDE_LOCATIONS.herbalHut.map)']){
  r('level='+map);assert.equal(r('CampQuest.locationId()'),null,'Only the exact catalogue map object is a side location: '+map);
 }
}
console.log('PASS: all registered side-map identities across fresh VM contexts, repeated transitions, main realms, unknown/prototype keys and counterfeit map objects.');
