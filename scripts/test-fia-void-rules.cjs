'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c=vm.createContext({});vm.runInContext(fs.readFileSync('assets/js/fia-journey-rules.js','utf8')+';globalThis.rules=FiaJourneyRules',c);const r=c.rules;
const defeated=[true,true,true,true],base=[[],[],[],['hannahDefeated','fiaTalismanCompleted']];
let a=r.accept(r.fresh(),base,defeated);a=r.begin(a.state,a.flags,defeated);a=r.clear(a.state,a.flags,defeated,1);
assert(!r.acceptVoid(a.state,a.flags,defeated).ok);a=r.handIn(a.state,a.flags,defeated);const initial=JSON.stringify(a);
let q=r.acceptVoid(a.state,a.flags,defeated);assert(q.ok);assert.equal(JSON.stringify(a),initial);assert(r.validate(q.state,q.flags,defeated));assert(!r.acceptVoid(q.state,q.flags,defeated).ok);
for(const id of ['trader','cook','smith']){q=r.meetService(q.state,q.flags,defeated,id);assert(q.ok);assert(!r.meetService(q.state,q.flags,defeated,id).ok);}
assert(!r.handInVoid(q.state,q.flags,defeated).ok);q=r.defeatVoid(q.state,q.flags,defeated);assert(q.ok);assert.equal(q.state.voidInfection,10);assert(r.validate(q.state,q.flags,defeated));assert(!r.defeatVoid(q.state,q.flags,defeated).ok);
const bad=JSON.parse(JSON.stringify(q.state));bad.voidInfection=0;assert(!r.validate(bad,q.flags,defeated));assert(!r.validate(q.state,q.flags.map(f=>f.filter(x=>x!=='rawVoidCrystal')),defeated));
q=r.handInVoid(q.state,q.flags,defeated);assert(q.ok);assert.equal(q.rewards.xp,1000);assert.equal(q.rewards.points,1);assert.equal(q.rewards.chicken,3);assert(!r.handInVoid(q.state,q.flags,defeated).ok);
assert(r.validate(q.state,q.flags,defeated));q.flags[3].push('fiaSlain');assert(r.validate(q.state,q.flags,defeated),'Later hostility must preserve historical purchases and completed quests');assert(!r.meetService(q.state,q.flags,defeated,'smith').ok);
console.log('PASS: quest3→quest4 ordering, copied service history, exact permanent infection/victory pair, protected crystal and once-only hand-in rewards.');
