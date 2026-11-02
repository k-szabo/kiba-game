'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/void-encounter-rules.js'),'utf8')+';globalThis.rules=VoidEncounterRules;',context);
const rules=context.rules,plain=value=>JSON.parse(JSON.stringify(value)),same=(a,b)=>assert.deepEqual(plain(a),plain(b));
assert(Object.isFrozen(rules));assert(Object.isFrozen(rules.tuning));
for(const id of [undefined,null,0,-1,.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1,'1'])assert.equal(rules.fresh(id),null);
const original=rules.fresh(1),initial=plain(original),lieutenantOwner=rules.token(original);assert(rules.valid(original));assert(Object.isFrozen(lieutenantOwner));
same(lieutenantOwner,{attempt:1,generation:1});
const partial=rules.hit(original,100);assert(partial.ok);assert.equal(partial.state.hp,900);assert.equal(partial.event,null);same(original,initial);
for(const damage of [300,1e6,Number.MAX_SAFE_INTEGER]){
 const crossing=rules.hit(original,damage);assert(crossing.ok);assert.equal(crossing.event,'absorb');assert.equal(crossing.damage,300);assert.equal(crossing.state.hp,700);assert(crossing.state.gateConsumed);assert.equal(crossing.state.won,false);assert(rules.valid(crossing.state));
 const repeat=rules.hit(crossing.state,damage);assert.equal(repeat.ok,false);assert.equal(repeat.event,null);same(repeat.state,crossing.state);
}
const absorbing=rules.hit(partial.state,200).state;
assert.equal(rules.emerge(original).reason,'notAbsorbing');
assert.equal(rules.heal(absorbing,5,lieutenantOwner).reason,'notLive');
const transition=rules.emerge(absorbing);assert(transition.ok);assert.equal(transition.event,'emerge');assert.equal(transition.damage,0);assert.equal(transition.healed,0);
const demon=transition.state,demonOwner=rules.token(demon);assert(rules.valid(demon));assert.equal(demon.maxHp,2000);assert.equal(demon.hp,1000);assert.equal(demon.generation,2);assert(demon.gateConsumed);same(absorbing,{...initial,phase:'absorbing',hp:700,gateConsumed:true});
assert.equal(rules.emerge(demon).ok,false,'Transformation cannot refill the demon a second time');
for(const owner of [undefined,null,lieutenantOwner,{attempt:2,generation:2},{attempt:1,generation:2,extra:true}]){
 const stale=rules.heal(demon,50,owner);assert.equal(stale.ok,false);assert.equal(stale.reason,'staleOwner');same(stale.state,demon);
}
assert.equal(rules.hit(demon,5,lieutenantOwner).reason,'staleOwner');
for(const bad of [undefined,null,0,-1,NaN,Infinity,Number.MAX_VALUE,Number.MAX_SAFE_INTEGER+1,'4']){
 const hit=rules.hit(demon,bad),heal=rules.heal(demon,bad,demonOwner);assert.equal(hit.ok,false);assert.equal(heal.ok,false);assert.equal(hit.reason,'invalidAmount');assert.equal(heal.reason,'invalidAmount');same(hit.state,demon);same(heal.state,demon);
}
// The caller supplies actual HP loss after armor/shield/invulnerability. Zero
// restores nothing; a fractional remaining loss is healed exactly, not nominal damage.
const guarded=rules.heal(demon,0,demonOwner);assert.equal(guarded.healed,0);same(guarded.state,demon);
const actual=rules.heal(demon,.25,demonOwner);assert(actual.ok);assert.equal(actual.healed,.25);assert.equal(actual.state.hp,1000.25);same(demon,transition.state);
const wounded=rules.hit(demon,200).state,healed=rules.heal(wounded,150,demonOwner);assert.equal(healed.state.hp,950);assert.equal(healed.healed,150);assert.equal(healed.event,null);
for(const gain of [1000,1001,Number.MAX_SAFE_INTEGER]){
 const overwhelmed=rules.heal(demon,gain,demonOwner);assert(overwhelmed.ok);assert.equal(overwhelmed.healed,1000);assert.equal(overwhelmed.state.hp,2000);assert(overwhelmed.state.failed);assert.equal(overwhelmed.state.phase,'overwhelmed');assert.equal(overwhelmed.event,'overwhelmed');assert(rules.valid(overwhelmed.state));
 assert.equal(rules.hit(overwhelmed.state,1e6).ok,false);assert.equal(rules.heal(overwhelmed.state,1,demonOwner).ok,false);assert.equal(rules.emerge(overwhelmed.state).ok,false);
}
const victory=rules.hit(demon,10000);assert(victory.ok);assert.equal(victory.damage,1000);assert.equal(victory.event,'victory');assert(victory.state.won);assert(!victory.state.failed);assert(rules.valid(victory.state));assert.equal(rules.heal(victory.state,20,demonOwner).ok,false);assert.equal(rules.hit(victory.state,1).ok,false);
const retry=rules.fresh(2),retryDemon=rules.emerge(rules.hit(retry,300).state).state;assert.equal(retry.phase,'lieutenant');assert.equal(retry.hp,1000);assert.equal(rules.heal(retryDemon,50,demonOwner).reason,'staleOwner');assert.equal(rules.hit(retry,50,lieutenantOwner).reason,'staleOwner');
for(const bad of [null,{},[],{...initial,extra:0},{...initial,hp:700},{...initial,maxHp:999},{...initial,generation:2},{...initial,gateConsumed:true},{...initial,won:true},{...initial,failed:true},{...demon,hp:2000},{...demon,hp:NaN}]){
 assert.equal(rules.valid(bad),false);assert.equal(rules.copy(bad),null);assert.equal(rules.token(bad),null);assert.equal(rules.hit(bad,1).state,null);assert.equal(rules.emerge(bad).state,null);assert.equal(rules.heal(bad,1,demonOwner).state,null);
}
const frozen=Object.freeze({...demon});assert(rules.hit(frozen,1).ok);assert(rules.heal(frozen,1,demonOwner).ok);same(original,initial);
console.log('PASS: void lieutenant 70% gate, explicit half-health demon emergence, immutable state, actual-loss healing, stale-owner rejection, full-health failure, terminal outcomes and fresh retry.');
