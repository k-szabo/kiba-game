'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/fia-ritual-rules.js'),'utf8')+';globalThis.rules=FiaRitualRules;',context);
const r=context.rules,plain=value=>JSON.parse(JSON.stringify(value)),same=(a,b)=>assert.deepEqual(plain(a),plain(b));
const flags=(...ids)=>[[],[],[],ids],ready=flags(...r.relics,'unrelatedHistory');
const noReward=result=>same(result.rewards,{xp:0,points:0});
assert(Object.isFrozen(r));for(const value of [r.progress,r.rewards,r.relics,r.victory])assert(Object.isFrozen(value));
assert(r.validate(flags()));assert(r.validate(ready));assert(!r.pendingEscape(ready));assert.equal(r.token({}),null);
for(const bad of [null,{},[],[[],[],[]],new Array(4),[[],[],[],new Array(1)],[[],[],[],[],[]],[[],{},[],[]],flags('duplicate','duplicate'),flags(1)]){
 assert(!r.validate(bad));const result=r.accept(bad);assert(!result.ok);assert.equal(result.reason,'invalidProgress');noReward(result);
}
for(const id of r.relics){
 const missing=flags(...ready[3].filter(value=>value!==id));assert(r.validate(missing));assert.equal(r.accept(missing).reason,'questUnavailable');
}
// A former Fia victory cannot be turned into another quest or another reward.
const earlierVictory=flags(...ready[3],...r.victory);assert(r.validate(earlierVictory));assert.equal(r.accept(earlierVictory).reason,'questUnavailable');
assert.equal(r.accept(flags(...ready[3],'fiaMissed')).reason,'questUnavailable');
for(const result of [r.callAttendant(ready,'white'),r.sacrifice(ready),r.win(ready),r.escape(ready)]){assert(!result.ok);noReward(result);}
const startToken=r.token(ready),accepted=r.accept(ready,startToken);assert(accepted.ok);assert(r.validate(accepted.flags));noReward(accepted);same(ready,flags(...r.relics,'unrelatedHistory'));
assert.equal(r.accept(accepted.flags).reason,'alreadyAccepted');assert.equal(r.callAttendant(accepted.flags,'white',startToken).reason,'staleProgress');
for(const value of [null,0,{},'other'])assert.equal(r.callAttendant(accepted.flags,'white',value).reason,'staleProgress');
for(const colour of [undefined,null,'blue','WHITE',0])assert.equal(r.callAttendant(accepted.flags,colour).reason,'invalidAttendant');
const white=r.callAttendant(accepted.flags,'white',r.token(accepted.flags));assert(white.ok);assert(!accepted.flags[3].includes(r.progress.white));noReward(white);
assert.equal(r.callAttendant(white.flags,'white').reason,'alreadyCalled');assert.equal(r.sacrifice(white.flags).reason,'questUnavailable');assert.equal(r.win(white.flags).reason,'questUnavailable');
const red=r.callAttendant(white.flags,'red'),sacrificed=r.sacrifice(red.flags,r.token(red.flags));assert(red.ok&&sacrificed.ok);assert(r.validate(sacrificed.flags));noReward(red);noReward(sacrificed);
assert.equal(r.sacrifice(sacrificed.flags).reason,'alreadySacrificed');assert.equal(r.callAttendant(sacrificed.flags,'red').reason,'questUnavailable');assert.equal(r.win(sacrificed.flags,r.token(red.flags)).reason,'staleProgress');
// Attendants may be called in either order; the sacrifice still needs both.
const redFirst=r.callAttendant(accepted.flags,'red'),both=r.callAttendant(redFirst.flags,'white');assert(r.sacrifice(both.flags).ok);
// A later unrelated death preserves historical acceptance/sacrifice, but cannot advance.
for(const history of [accepted.flags,white.flags,red.flags,sacrificed.flags]){
 const slain=flags(...history[3],...r.victory);assert(r.validate(slain));assert.equal(r.callAttendant(slain,'red').reason,'questUnavailable');
 assert(!r.sacrifice(slain).ok);assert.equal(r.win(slain).reason,'questUnavailable');assert(!r.escape(slain).ok);assert(!r.pendingEscape(slain));
}
const partialReward=flags(...sacrificed.flags[3],'fiaRewardClaimed');assert.equal(r.win(partialReward).reason,'rewardAlreadyClaimed');
const won=r.win(sacrificed.flags,r.token(sacrificed.flags));assert(won.ok);assert(r.validate(won.flags));same(won.rewards,{xp:1800,points:1});assert(r.pendingEscape(won.flags));
assert(!sacrificed.flags[3].includes('fiaSlain'));for(const id of [...r.victory,r.progress.completed,r.progress.weapon])assert.equal(won.flags[3].filter(value=>value===id).length,1);
const duplicate=r.win(won.flags);assert(!duplicate.ok);assert.equal(duplicate.reason,'alreadyCompleted');noReward(duplicate);assert(!r.accept(won.flags).ok);assert(!r.callAttendant(won.flags,'white').ok);
const escaped=r.escape(won.flags,r.token(won.flags));assert(escaped.ok);assert(r.validate(escaped.flags));assert(!r.pendingEscape(escaped.flags));noReward(escaped);assert(r.pendingEscape(won.flags));
assert.equal(r.escape(escaped.flags).reason,'alreadyEscaped');assert.equal(r.escape(escaped.flags,r.token(won.flags)).reason,'staleProgress');
// Every ritual flag is confined to world 3 and must retain its causal history.
for(const id of Object.values(r.progress)){
 const misplaced=plain(won.flags);misplaced[0].push(id);assert(!r.validate(misplaced));
 if(id!==r.progress.accepted)assert(!r.validate(flags(...ready[3],id)));
}
for(const id of [...r.relics,r.progress.accepted,r.progress.white,r.progress.red,r.progress.sacrificed,r.progress.weapon,...r.victory]){
 const forged=flags(...won.flags[3].filter(value=>value!==id));assert(!r.validate(forged),'Missing required history: '+id);assert.equal(r.escape(forged).reason,'invalidProgress');
}
assert(!r.validate(flags(...accepted.flags[3],'fiaMissed')));assert(!r.validate(flags(...ready[3],r.progress.accepted,r.progress.sacrificed)));
assert(!r.validate(flags(...sacrificed.flags[3],r.progress.weapon)));assert(!r.validate(flags(...sacrificed.flags[3],r.progress.escaped)));
// Success and failure copies never alias even an unrelated realm's array.
const copied=r.copy(ready);copied[0].push('onlyCopy');assert.equal(ready[0].length,0);
const rejected=r.accept(accepted.flags);rejected.flags[0].push('onlyFailure');assert.equal(accepted.flags[0].length,0);rejected.flags[3].push('onlyFailure');assert(!accepted.flags[3].includes('onlyFailure'));
won.rewards.xp=0;assert.equal(r.rewards.xp,1800);assert.equal(r.win(sacrificed.flags).rewards.xp,1800);
const frozen=Object.freeze(sacrificed.flags.map(list=>Object.freeze([...list])));assert(r.win(frozen).ok);same(frozen,sacrificed.flags);
console.log('PASS: Fia ritual ordered relic/attendant lineage, immutable transactions, stale choices, one-time 1800 XP reward and escape history.');
