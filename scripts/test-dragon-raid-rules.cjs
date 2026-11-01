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
for(const fps of [30,60,120]){
 let attempt=state;
 for(let tick=0;tick<180*fps;tick++)attempt=r.update(attempt,1/fps);
 assert(attempt.failed,'All columns collapse at 180 active seconds at '+fps+' FPS');assert.equal(attempt.pillars,0);
 assert.equal(r.hit(attempt,'head',0,1e9).won,false,'A collapsed attempt cannot grant a victory');
}
assert.deepEqual(plain(r.update(state,1e9,{paused:true})),plain(state),'Pause does not consume the deadline');
for(const dt of [-1,0,NaN,Infinity])assert.deepEqual(plain(r.update(state,dt)),plain(state));
const victory=r.hit(state,'head',0,1e9);assert(victory.won);assert.equal(r.update(victory,1e9).failed,false,'A victory cannot later become a collapse');
assert.equal(r.fresh(1).phase,1,'Retry restarts all three phases');
console.log('PASS: chained wings, mandatory back combat, final head vulnerability, pause-safe pillar deadline at 30/60/120 FPS, collapse and retry.');
