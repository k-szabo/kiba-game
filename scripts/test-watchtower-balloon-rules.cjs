'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context=vm.createContext({});
for(const name of ['floating-islands-rules','watchtower-balloon-rules'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/'+name+'.js'),'utf8'),context);
const rules=vm.runInContext('WatchtowerBalloonRules',context),islands=vm.runInContext('FloatingIslandsRules',context);
const old=[[],[],[],[]];
assert(rules.validate(old),'Pre-feature progress remains valid without migration or reset');
assert(!rules.eligible(old));assert(!rules.transition(old,'defeatJailer').ok);
let flags=[[...Object.values(islands.progress)],[],[],['zigguratReturnCompleted']];
assert(rules.validate(flags)&&rules.eligible(flags));assert.equal(rules.journeyStage(flags),null);
const events=['defeatJailer','rescueWestheru','escapeSentinel','board','clearWasps','defeatDragon','restoreWestheru','arrive'];
for(let i=0;i<events.length;i++){
 for(const later of events.slice(i+1))assert(!rules.transition(flags,later).ok,`${later} cannot skip its prerequisite`);
 const before=JSON.stringify(flags),result=rules.transition(flags,events[i]);
 assert(result.ok&&rules.validate(result.flags));assert.equal(JSON.stringify(flags),before,'Transitions preserve source flags');
 assert.notEqual(result.flags,flags);for(let realm=0;realm<4;realm++)assert.notEqual(result.flags[realm],flags[realm]);
 assert(!rules.transition(result.flags,events[i]).ok,'Committed milestones cannot replay');
 flags=result.flags;
}
assert.equal(rules.journeyStage(flags),'complete');
for(const id of Object.values(rules.progress)){
 const invalid=[[],[],[],[]];invalid[0].push(id);assert(!rules.validate(invalid),'Every new flag requires the island route');
}
for(const malformed of [null,[],[[],[],[]],[[1],[],[],[]],[[],[],[],[],[]]])assert(!rules.validate(malformed));
const noJailer=flags.map(list=>list.filter(id=>id!==rules.progress.jailer));assert(!rules.validate(noJailer),'Key and jailer outcome commit atomically');
const noKey=flags.map(list=>list.filter(id=>id!==rules.progress.key));assert(!rules.validate(noKey),'The key stays as consumed acquisition history');
const duplicate=flags.map(list=>[...list]);duplicate[0].push(rules.progress.arrived);assert(!rules.validate(duplicate));
assert(!rules.transition(flags,'__proto__').ok);assert(!rules.transition(flags,'fail').ok);
assert(rules.shouldEscape(700,1000));assert(rules.shouldEscape(0,1000));assert(!rules.shouldEscape(701,1000));assert(!rules.shouldEscape(7,0));
const dragonFlags=flags.map(list=>list.filter(id=>![rules.progress.dragon,rules.progress.restored,rules.progress.arrived].includes(id)));
let encounter=rules.restart(dragonFlags,100);assert.equal(encounter.stage,'dragon');
const snapshot=JSON.stringify(dragonFlags),first=rules.damageBalloon(encounter,30);assert.equal(encounter.hp,100);assert.equal(first.hp,70);
encounter=rules.damageBalloon(first,1000);assert(encounter.failed&&encounter.hp===0);assert.equal(rules.tick(encounter,10,true).elapsed,0,'A failed encounter cannot advance');
assert.equal(JSON.stringify(dragonFlags),snapshot,'Failure never erases earned milestones');
assert.equal(rules.restart(dragonFlags,100).stage,'dragon','A failed dragon encounter resumes after cleared wasps');
assert.equal(rules.restart(dragonFlags,100).hp,100);
for(const fps of [30,60,120]){
 encounter=rules.restart(dragonFlags,100);
 for(let i=0;i<fps;i++)encounter=rules.tick(encounter,1/fps,true);
 assert(Math.abs(encounter.elapsed-1)<1e-10);
 assert.equal(rules.tick(encounter,5,false).elapsed,encounter.elapsed,'Pause/dialog time does not advance');
 assert.equal(rules.tick(encounter,0,true).elapsed,encounter.elapsed);
}
for(const invalid of [-1,NaN,Infinity]){assert.equal(rules.damageBalloon(encounter,invalid),null);assert.equal(rules.tick(encounter,invalid,true),null);assert.equal(rules.restart(dragonFlags,invalid),null);}
assert.equal(rules.damageBalloon({...encounter,hp:101},1),null);
assert.equal(rules.restart(old,100),null);
const completed=rules.restart(flags,100);assert.equal(rules.tick(completed,10,true).elapsed,0);
console.log('PASS: ordered immutable watchtower/balloon milestones, compatible legacy progress, once-only outcomes, retained checkpoints on balloon failure and active clocks at 30/60/120 FPS.');
