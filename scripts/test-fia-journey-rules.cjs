'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/fia-journey-rules.js'),'utf8')+';globalThis.rules=FiaJourneyRules;',context);
const r=context.rules,plain=value=>JSON.parse(JSON.stringify(value)),same=(a,b)=>assert.deepEqual(plain(a),plain(b));
const flags=(...ids)=>[[],[],[],ids],defeated=[true,true,true,true],ready=flags('hannahDefeated','fiaTalismanCompleted');
const initial=r.fresh();same(initial,{dragon:{run:0,clear:false},dragonScales:0,voidInfection:0});assert(r.validate(initial));assert(Object.isFrozen(r));
// Legacy omitted records are defaulted by the caller, never arbitrary invalid records.
assert(r.validate(r.fresh(),ready,defeated));assert.equal(r.copy(undefined),null);assert.equal(r.copy(null),null);
const independent=r.fresh();independent.dragon.run=10;assert.equal(initial.dragon.run,0);const copied=r.copy(initial);copied.dragon.run=2;assert.equal(initial.dragon.run,0);
for(const bad of [{},[],null,{...plain(initial),extra:0},{...plain(initial),dragon:{run:0,clear:false,extra:0}},{...plain(initial),dragon:{run:-1,clear:false}},{...plain(initial),dragon:{run:.1,clear:false}},{...plain(initial),dragon:{run:Infinity,clear:false}},{...plain(initial),dragon:{run:Number.MAX_SAFE_INTEGER+1,clear:false}},{...plain(initial),dragon:{run:0,clear:0}},{...plain(initial),dragonScales:-1},{...plain(initial),dragonScales:.5},{...plain(initial),voidInfection:10}]){
 assert.equal(r.validate(bad),false);assert.equal(r.copy(bad),null);assert.equal(r.begin(bad,ready,defeated).reason,'invalidProgress');
}
assert(!r.validate(initial,{}));assert(!r.validate(initial,flags('x','x'),defeated));assert(!r.validate(initial,[[],{},[],[]],defeated));assert(!r.validate(initial,[],[1]));
assert.equal(r.begin(initial,flags(),defeated).reason,'raidUnavailable');assert.equal(r.accept(initial,flags('hannahDefeated'),defeated).reason,'questUnavailable');
for(const id of ['fiaSlain','fiaMissed'])assert.equal(r.accept(initial,flags(...ready[3],id),defeated).reason,'questUnavailable');
const accepted=r.accept(initial,ready,defeated);assert(accepted.ok);assert(r.validate(accepted.state,accepted.flags,defeated));same(initial,r.fresh());same(ready,flags('hannahDefeated','fiaTalismanCompleted'));
assert.equal(r.accept(accepted.state,accepted.flags,defeated).reason,'alreadyAccepted');assert.equal(r.handIn(accepted.state,accepted.flags,defeated).reason,'questUnavailable');
const run=r.begin(accepted.state,accepted.flags,defeated);assert(run.ok);same(run.state.dragon,{run:1,clear:false});assert(r.validate(run.state,run.flags,defeated));
for(const token of [undefined,0,-1,.5,2,'1'])assert.equal(r.clear(run.state,run.flags,defeated,token).reason,'staleRun');
const victory=r.clear(run.state,run.flags,defeated,1);assert(victory.ok);same(victory.rewards,{xp:900,points:1,dragonScales:1});assert(r.validate(victory.state,victory.flags,defeated));assert(r.holdsEyes(victory.flags));
assert.equal(run.state.dragon.clear,false);assert.equal(run.state.dragonScales,0);assert(!run.flags[3].includes('dragonEyes'));
assert.equal(r.clear(victory.state,victory.flags,defeated,1).reason,'alreadyCleared');
const quest=r.handIn(victory.state,victory.flags,defeated);assert(quest.ok);same(quest.rewards,{xp:800,points:1,dragonScales:0});assert(r.validate(quest.state,quest.flags,defeated));assert(!r.holdsEyes(quest.flags));assert(quest.flags[3].includes('dragonEyes'),'Hand-in retains acquisition history');
assert.equal(r.handIn(quest.state,quest.flags,defeated).reason,'alreadyCompleted');
let farm=quest;for(let count=2;count<=8;count++){
 const next=r.begin(farm.state,farm.flags,defeated);assert(next.ok);assert.equal(next.state.dragonScales,count-1);assert.equal(r.clear(next.state,next.flags,defeated,count-1).reason,'staleRun');
 farm=r.clear(next.state,next.flags,defeated,count);assert(farm.ok);same(farm.rewards,{xp:900,points:0,dragonScales:1});assert.equal(r.quantity(farm.state),count);assert(r.validate(farm.state,farm.flags,defeated));
}
// Raid can be farmed without Fia's quest, including journeys where she was slain.
const solo=r.begin(initial,flags('hannahDefeated','fiaSlain'),defeated),soloClear=r.clear(solo.state,solo.flags,defeated,1);assert(soloClear.ok);assert(!soloClear.flags[3].includes('dragonEyes'));
const late=r.accept(soloClear.state,flags(...soloClear.flags[3].filter(id=>id!=='fiaSlain'),'fiaTalismanCompleted'),defeated);assert(late.ok);assert(!r.holdsEyes(late.flags),'Old clear cannot retroactively grant quest eyes');
const lateRun=r.begin(late.state,late.flags,defeated),lateClear=r.clear(lateRun.state,lateRun.flags,defeated,2);assert(lateClear.ok);assert(r.holdsEyes(lateClear.flags));assert.equal(lateClear.rewards.points,0);
for(const badFlags of [flags('fiaDragonAccepted'),flags('hannahDefeated','fiaDragonAccepted'),flags(...ready[3],'dragonRaidFirstClear'),flags(...ready[3],'dragonEyes'),flags(...ready[3],'fiaDragonCompleted')])assert(!r.validate(initial,badFlags,defeated));
assert(!r.validate({...plain(initial),dragon:{run:1,clear:true}},ready,defeated));assert(!r.validate({...plain(initial),dragonScales:1},ready,defeated));
const ceiling=plain(farm.state);ceiling.dragon.run=Number.MAX_SAFE_INTEGER;assert.equal(r.begin(ceiling,farm.flags,defeated).reason,'runOverflow');ceiling.dragonScales=Number.MAX_SAFE_INTEGER;ceiling.dragon.clear=false;assert.equal(r.clear(ceiling,farm.flags,defeated,Number.MAX_SAFE_INTEGER).reason,'stockOverflow');
const frozen=Object.freeze({...run.state,dragon:Object.freeze({...run.state.dragon})});assert(r.clear(frozen,run.flags,defeated,1).ok,'Caller data may be immutable');
console.log('PASS: Fia dragon journey strict optional-record shape, copied state, ordered quest, stale/duplicate rejection, repeatable scales and one-time training rewards.');
