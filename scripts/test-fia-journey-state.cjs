'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
const h=harness(),r=h.run,base=JSON.parse(r('JSON.stringify(captureProgress())'));
assert.doesNotThrow(()=>validate(base));
const legacy=JSON.parse(JSON.stringify(base));delete legacy.fiaJourney;
assert.doesNotThrow(()=>validate(legacy),'A valid older save needs no new quest field');
for(const value of [null,{},[],{dragon:{run:0,clear:false},dragonScales:0,voidInfection:10}]){
 const malformed=JSON.parse(JSON.stringify(base));malformed.fiaJourney=value;
 assert.throws(()=>validate(malformed),/Invalid Fia journey/,'Explicit malformed state must not silently default');
}
const forged=JSON.parse(JSON.stringify(base));forged.flags[3].push('dragonRaidFirstClear');forged.progression.points++;
assert.throws(()=>validate(forged),/Invalid Fia journey/,'A forged reward flag cannot create training points');
const clone=r('captureProgress()');clone.fiaJourney.dragon.run=9;
assert.equal(r('fiaJourney.dragon.run'),0,'Captures do not share nested raid state');
r('saved=JSON.parse('+JSON.stringify(JSON.stringify(legacy))+');startGame(true)');h.dismiss();
assert.equal(r('fiaJourney.dragon.run'),0,'Older progress receives an empty record on resume');
const before=r('JSON.stringify(saved)'),writes=r('__saveSnapshots.length');
assert(r('DevTools.open();DevSession.begin()'));
r('fiaJourney.dragon.run=4;fiaJourney.dragonScales=2;persist()');
assert.equal(r('JSON.stringify(saved)'),before);assert.equal(r('__saveSnapshots.length'),writes);
r('DevSession.end();startGame(true)');h.dismiss();
assert.equal(r('fiaJourney.dragon.run'),0);assert.equal(r('fiaJourney.dragonScales'),0);
console.log('PASS: optional legacy Fia state, strict malformed/forged record rejection, deep capture copies and developer-session restoration.');
