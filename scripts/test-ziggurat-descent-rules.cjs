'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context=vm.createContext({});vm.runInContext(fs.readFileSync('assets/js/ziggurat-descent-rules.js','utf8')+';globalThis.rules=ZigguratDescentRules',context);
const rules=context.rules,defeated=[true,true,true,true],base=[['japan-unrelated'],[],[],['hannahDefeated','guardian:Hannah','dawnblade']];
const clone=value=>JSON.parse(JSON.stringify(value));
assert(rules.validate([[],[],[],[]],[false,false,false,false]),'Older journeys need no new milestone');
assert(!rules.eligible([[],[],[],[]],defeated));
assert(!rules.transition(base,defeated,'arrive').ok,'Portal cannot bypass its guardian');
assert(!rules.transition(base,defeated,'clearGate').ok,'Gate fight requires the accepted story');
let flags=clone(base);
for(const event of ['accept','clearGate','arrive','complete']){
 const before=clone(flags),result=rules.transition(flags,defeated,event);
 assert(result.ok,event);assert.deepEqual(clone(flags),before,'Transaction preserves its input');
 assert(rules.validate(result.flags,defeated));assert.equal(result.firstClear,event==='clearGate');
 assert.deepEqual(Array.from(result.flags[0]),base[0],'Other realm progress survives');
 assert(!rules.transition(result.flags,defeated,event).ok,'Repeated event has no reward right');flags=result.flags;
}
assert(rules.completed(flags));
assert(!rules.validate(flags,[true,true,true,false]));
for(const required of ['hannahDefeated','guardian:Hannah','dawnblade']){const bad=clone(flags);bad[3]=bad[3].filter(id=>id!==required);assert(!rules.validate(bad,defeated));}
for(const removed of [rules.progress.accepted,rules.progress.gate,rules.progress.guardian,rules.progress.arrived]){const bad=clone(flags);bad[3]=bad[3].filter(id=>id!==removed);assert(!rules.validate(bad,defeated));}
const duplicate=clone(flags);duplicate[3].push(duplicate[3][0]);assert(!rules.validate(duplicate,defeated));
assert(!rules.transition(base,defeated,'unknown').ok);
console.log('PASS: additive descent milestones, ordered portal progression, isolated flags and one-time clear rights.');
