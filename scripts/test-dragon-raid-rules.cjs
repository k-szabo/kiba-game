'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c=vm.createContext({});vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../assets/js/dragon-raid-rules.js'),'utf8')+';globalThis.rules=DragonRaidRules;',c);
const r=c.rules,plain=s=>JSON.parse(JSON.stringify(s));
assert.equal(r.fresh(0),null);assert.equal(r.fresh(.1),null);
let state=r.fresh(1),initial=plain(state);
assert.equal(r.hit(state,'head',0,1e9).hp,r.tuning.maxHp,'No head damage during the chained phase');
for(let i=0;i<4;i++){state=r.hit(state,'chain',i,1e9);assert.equal(state.phase,i===3?2:1);}
assert.equal(r.reachHead(state).phase,2,'Reaching the head cannot skip back combat');
for(let i=0;i<3;i++)state=r.hit(state,'tumor',i,1e9);
assert.equal(r.reachHead(state).phase,2,'Manifestations must also be defeated');
for(let i=0;i<2;i++)state=r.manifestationDefeated(state,i);
state=r.reachHead(state);assert.equal(state.phase,3);assert.equal(initial.chains[0],r.tuning.chainHp,'No mutation of previous state');
assert.deepEqual(plain(state.forelegs),[12,12]);assert.equal(state.stance,'standing');assert.equal(state.stanceTime,0);
assert.equal(r.hit(state,'head',0,10).hp,r.tuning.maxHp,'The standing head is protected');
function fallen(s){return r.hit(r.hit(s,'foreleg',0,1e9),'foreleg',1,1e9);}
function step(s,seconds,fps){const frames=Math.floor(seconds*fps+1e-9);for(let i=0;i<frames;i++)s=r.update(s,1/fps);const remainder=seconds-frames/fps;return remainder>1e-10?r.update(s,remainder):s;}
const broken=fallen(state);assert.equal(broken.stance,'falling');assert.equal(broken.stanceTime,r.tuning.fallDuration);assert.equal(broken.hp,r.tuning.maxHp,'Leg overkill never spills into boss HP');
assert.deepEqual(plain(state.forelegs),[12,12],'Each hit copies the legs');
for(const phase of [1,2]){const early={...state,phase};assert.deepEqual(plain(r.hit(early,'foreleg',0,100)),plain(early));}
for(const value of [-1,0,NaN,Infinity])assert.deepEqual(plain(r.hit(state,'foreleg',0,value)),plain(state));
for(const index of [-1,.5,2,NaN,null,undefined])assert.deepEqual(plain(r.hit(state,'foreleg',index,100)),plain(state));
const one=r.hit(state,'foreleg',0,12);assert.equal(one.stance,'standing');assert.deepEqual(plain(one.forelegs),[0,12]);assert.equal(one.hp,state.hp);
assert.equal(r.hit(broken,'head',0,100).hp,state.hp,'The falling head is protected');
assert.deepEqual(plain(r.hit(broken,'foreleg',1,1)),plain(broken),'Legs cannot restart a collapse while falling');
for(const fps of [30,60,120]){
 let cycle=step(broken,r.tuning.fallDuration,fps);assert.equal(cycle.stance,'exposed','Head opens after the fall at '+fps+' FPS');assert(Math.abs(cycle.stanceTime-r.tuning.headWindow)<1e-7);
 assert.equal(r.hit(cycle,'head',0,3).hp,state.hp-12,'An exposed head takes four times incoming damage');
 for(const index of [-1,1,.5,null,undefined])assert.equal(r.hit(cycle,'head',index,3).hp,state.hp,'Only the real head index can be struck');
 const frozen=plain(cycle);assert.deepEqual(plain(r.update(cycle,100,{paused:true})),frozen,'Pause freezes both exposed time and pillars');
 assert.deepEqual(plain(r.hit(cycle,'foreleg',0,1)),frozen,'Forelegs stay disabled during exposure');
 cycle=r.hit(cycle,'head',0,3);cycle=step(cycle,r.tuning.headWindow,fps);assert.equal(cycle.stance,'rising');assert.equal(cycle.hp,state.hp-12);assert.equal(r.hit(cycle,'head',0,100).hp,cycle.hp,'Rising closes the damage window');
 cycle=step(cycle,r.tuning.riseDuration,fps);assert.equal(cycle.stance,'standing');assert.deepEqual(plain(cycle.forelegs),[12,12]);assert.equal(cycle.stanceTime,0);assert.equal(cycle.hp,state.hp-12,'Standing restores legs, never boss HP');
 cycle=fallen(cycle);cycle=step(cycle,r.tuning.fallDuration,fps);assert.equal(cycle.stance,'exposed','The cycle repeats only after both fresh legs break');
}
const overshot=r.update(broken,r.tuning.fallDuration+2.75);assert.equal(overshot.stance,'exposed');assert(Math.abs(overshot.stanceTime-(r.tuning.headWindow-2.75))<1e-7,'A long frame consumes the next state time too');
const whole=r.update(broken,r.tuning.fallDuration+r.tuning.headWindow+r.tuning.riseDuration+2);assert.equal(whole.stance,'standing');assert.deepEqual(plain(whole.forelegs),[12,12]);
const frozenInput=Object.freeze({...state,forelegs:Object.freeze([...state.forelegs]),chains:Object.freeze([...state.chains]),tumors:Object.freeze([...state.tumors]),manifestations:Object.freeze([...state.manifestations])});assert.equal(fallen(frozenInput).stance,'falling');
for(const fps of [30,60,120]){
 let attempt=state;
 for(let tick=0;tick<180*fps;tick++)attempt=r.update(attempt,1/fps);
 assert(attempt.failed,'All columns collapse at 180 active seconds at '+fps+' FPS');assert.equal(attempt.pillars,0);
 assert.equal(r.hit(attempt,'head',0,1e9).won,false,'A collapsed attempt cannot grant a victory');
}
assert.deepEqual(plain(r.update(state,1e9,{paused:true})),plain(state),'Pause does not consume the deadline');
for(const dt of [-1,0,NaN,Infinity])assert.deepEqual(plain(r.update(state,dt)),plain(state));
const exposed=r.update(broken,r.tuning.fallDuration),victory=r.hit(exposed,'head',0,1e9);assert(victory.won);assert.equal(r.update(victory,1e9).failed,false,'A victory cannot later become a collapse');assert.deepEqual(plain(r.hit(victory,'foreleg',0,1)),plain(victory),'No new cycle after victory');
const late={...broken,elapsed:179.9},collapsed=r.update(late,100);assert(collapsed.failed);assert.equal(collapsed.elapsed,180);assert.equal(collapsed.stance,'falling','A long frame cannot expose the head after the vault has collapsed');assert(Math.abs(collapsed.stanceTime-(r.tuning.fallDuration-.1))<1e-7);
assert.equal(r.fresh(1).phase,1,'Retry restarts all three phases');
console.log('PASS: chained wings/back gates, two12HP forelegs, fall→6s fourfold head exposure→rise/reset cycles, immutable and pause-safe overshoot at30/60/120FPS, pillar collapse and once-only victory.');
