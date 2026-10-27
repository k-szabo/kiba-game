'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const sandbox={};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/dungeon-rules.js'),'utf8')+';globalThis.rules=DungeonRules;',sandbox);const rules=sandbox.rules;
const plain=data=>JSON.parse(JSON.stringify(data)),same=(a,b,message)=>assert.deepEqual(plain(a),plain(b),message);
const flags=(...extra)=>[[],['councilGateOpen','dungeonRunStarted',...extra]],defeated=[true,true,false,false];
const first=['dungeonCaptainReward'],second=[...first,'dungeonNecromancerReward'],all=[...second,'dungeonCouncilReward','councilSoul'];
const staged=['dungeonStage1Clear','dungeonStage2Clear','dungeonStage3Clear'];
const initial=rules.fresh();assert(rules.validate(initial));assert(Object.isFrozen(rules));assert(Object.isFrozen(rules.items));assert(Object.isFrozen(rules.enhancements));
same(initial,{runs:{yomiFall:{run:0,roll:null},sectFall:{run:0,roll:null}},stock:{dungeonSeal:0,sectSeal:0,weaponEnhancement:0,armorEnhancement:0,spiritEnhancement:0},boosts:{weapon:0,armor:0,spirit:0}});
const independent=rules.fresh();independent.stock.dungeonSeal=7;independent.boosts.weapon=2;assert.equal(initial.stock.dungeonSeal,0);assert.equal(initial.boosts.weapon,0);
{
 const copy=rules.copy(initial);assert.notEqual(copy,initial);assert.notEqual(copy.stock,initial.stock);assert.notEqual(copy.boosts,initial.boosts);copy.stock.dungeonSeal++;assert.equal(initial.stock.dungeonSeal,0);
 const frozen=Object.freeze({...initial,stock:Object.freeze({...initial.stock}),boosts:Object.freeze({...initial.boosts})});assert(rules.begin(frozen,null).ok,'Transactions support immutable caller state');
}
for(const bad of [null,[],{},true,0,{...plain(initial),extra:0},{...plain(initial),run:-1},{...plain(initial),run:1.5},{...plain(initial),run:Number.MAX_SAFE_INTEGER+1},{...plain(initial),run:Infinity},{...plain(initial),roll:'weaponEnhancement'},{...plain(initial),run:1,roll:'unknown'},{...plain(initial),stock:[]},{...plain(initial),boosts:[]},{...plain(initial),stock:{...initial.stock,extra:0}},{...plain(initial),boosts:{weapon:0,armor:0}},{...plain(initial),stock:{...initial.stock,dungeonSeal:-1}},{...plain(initial),stock:{...initial.stock,weaponEnhancement:.5}},{...plain(initial),boosts:{weapon:6,armor:0,spirit:0}}]){
 assert.equal(rules.validate(bad),false);assert.equal(rules.copy(bad),null);assert.equal(rules.quantity(bad,'dungeonSeal'),0);same(rules.bonus(bad),{damage:0,armor:0,dashMultiplier:1});
 for(const fn of [()=>rules.begin(bad,null),()=>rules.addStock(bad,'dungeonSeal'),()=>rules.removeStock(bad,'dungeonSeal'),()=>rules.consume(bad,'weaponEnhancement',[true,true])])same(fn(),{ok:false,state:null,reason:'invalidState'});
}
{
 for(const roll of [null,...rules.enhancements]){const result=rules.begin(initial,roll);assert(result.ok);assert.equal(result.state.runs.yomiFall.run,1);assert.equal(result.state.runs.yomiFall.roll,roll);assert.equal(initial.runs.yomiFall.run,0);assert(rules.validate(result.state,flags(),defeated));}
 for(const roll of ['dungeonSeal','invalid',0,false,{},[],NaN]){const result=rules.begin(initial,roll);assert(!result.ok);same(result.state,initial);assert.equal(result.reason,'invalidRoll');}
 const full=rules.fresh();full.runs.yomiFall.run=Number.MAX_SAFE_INTEGER;assert.equal(rules.begin(full,null).reason,'runOverflow');assert.equal(full.runs.yomiFall.run,Number.MAX_SAFE_INTEGER);
}
const run=rules.begin(initial,'armorEnhancement').state;
assert(!rules.validate(run),'A positive run needs its matching world flag');assert(!rules.validate(initial,flags(),defeated),'Started requires a positive run');assert(!rules.validate(run,[[],['dungeonRunStarted']],defeated),'Normal started runs require the council gate');assert(!rules.validate(run,flags(),[true,false]),'Normal started runs require Yomi victory');
assert(!rules.validate(run,{},defeated));assert(!rules.validate(run,flags(),{}));assert(!rules.validate(run,[[],{}],defeated));assert(!rules.validate(run,[[],['councilGateOpen','dungeonRunStarted','dungeonRunStarted']],defeated));
for(let clear=0;clear<=3;clear++){
 const claims=clear===0?[]:clear===1?first:clear===2?second:all;
 assert(rules.validate(run,flags(...staged.slice(0,clear),...claims),defeated),'A correctly ordered active run is valid');
}
for(const extras of [['dungeonStage1Clear'],['dungeonStage2Clear',...second],['dungeonStage3Clear',...all],['dungeonCaptainReward','dungeonStage1Clear','dungeonStage3Clear',...all],['dungeonNecromancerReward'],['dungeonCouncilReward','councilSoul'],[...all.filter(id=>id!=='councilSoul')],['councilSoul'],['dungeonChestClaimed'],[...second,'dungeonChestClaimed',...staged.slice(0,2)]])assert(!rules.validate(run,flags(...new Set(extras)),defeated),'Reject impossible progress: '+extras.join(','));
assert(rules.validate(run,flags(...all),defeated),'New run can retain permanent first-clear rewards without current stage clears');assert(rules.validate(run,flags(...all,...staged,'dungeonChestClaimed'),defeated));
assert(!rules.validate(initial,[[],['councilGateOpen',...all]],defeated),'Permanent rewards need a historical run');
{
 let state=plain(run);for(const id of Object.keys(rules.items).filter(id=>id!=='sectSeal')){
  const before=plain(state),result=rules.addStock(state,id,3);assert(result.ok);assert.equal(rules.quantity(result.state,id),3);same(state,before,'Adding stock never mutates input');state=result.state;
  const remove=rules.removeStock(state,id,2);assert(remove.ok);assert.equal(rules.quantity(remove.state,id),1);assert.equal(state.stock[id],3);state=remove.state;
 }
 assert(rules.validate(state,flags(...all),defeated));assert(!rules.validate(state,flags(...second),defeated),'Chest stock cannot predate the final first-clear reward');
 state.boosts={weapon:2,armor:3,spirit:4};const before=plain(state),next=rules.begin(state,null);assert(next.ok);assert.equal(next.state.runs.yomiFall.run,2);assert.equal(next.state.runs.yomiFall.roll,null);same(next.state.stock,state.stock);same(next.state.boosts,state.boosts);same(state,before,'Explicit new run preserves inventory and consumed enhancements');
}
for(const id of ['unknown','__proto__','toString',null,4,{}])for(const method of ['addStock','removeStock']){
 const result=rules[method](run,id,1);assert(!result.ok);assert.equal(result.reason,'invalidItem');same(result.state,run);
}
for(const n of [0,-1,.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1,'1',null])for(const method of ['addStock','removeStock'])assert.equal(rules[method](run,'dungeonSeal',n).reason,'invalidQuantity');
{
 const stock=plain(run);stock.stock.dungeonSeal=Number.MAX_SAFE_INTEGER;assert.equal(rules.addStock(stock,'dungeonSeal').reason,'stockOverflow');assert.equal(stock.stock.dungeonSeal,Number.MAX_SAFE_INTEGER);
 const empty=rules.removeStock(run,'dungeonSeal');assert.equal(empty.reason,'insufficientStock');same(empty.state,run);assert.equal(rules.quantity(run,'unknown'),0);
}
for(const [id,key]of [['weaponEnhancement','weapon'],['armorEnhancement','armor'],['spiritEnhancement','spirit']]){
 let state=rules.addStock(run,id,6).state;
 for(let rank=1;rank<=5;rank++){
  const before=plain(state),result=rules.consume(state,id,[true,true]);assert(result.ok);assert.equal(result.state.boosts[key],rank);assert.equal(result.state.stock[id],6-rank);same(state,before);state=result.state;
 }
 const max=rules.consume(state,id,[true,true]);assert.equal(max.reason,'maxRank');same(max.state,state,'Cap rejects without consuming the extra item');
 const b=rules.bonus(state);assert.equal(b[key==='weapon'?'damage':key==='armor'?'armor':'dashMultiplier'],key==='weapon'?1.25:key==='armor'?25:.85);
 assert(rules.validate(state,flags(...all),defeated));assert(!rules.validate(state,flags(...second),defeated));
}
{
 const one=rules.addStock(run,'spiritEnhancement').state;for(const abilities of [undefined,[],[true,false],[true,1],null,{}]){const result=rules.consume(one,'spiritEnhancement',abilities);assert.equal(result.reason,'abilityRequired');same(result.state,one);}
 assert.equal(rules.consume(run,'weaponEnhancement').reason,'insufficientStock');assert.equal(rules.consume(run,'armorEnhancement').reason,'insufficientStock');assert.equal(rules.consume(run,'dungeonSeal',[true,true]).reason,'invalidItem');
}
{
 const spec=rules.definitions.sectFall,world=[['guardian:oldCultist','cultTempleDiscovered',spec.started,...spec.stages,...spec.rewards,spec.soul],[]];
 const sect=rules.begin(initial,'spiritEnhancement','sectFall');assert(sect.ok);assert.equal(sect.state.runs.sectFall.run,1);assert.equal(sect.state.runs.yomiFall.run,0);assert(rules.validate(sect.state,world,[true,false]));
 const held=rules.addStock(sect.state,'sectSeal').state;assert(rules.validate(held,world,[true,false]));
 const shared=rules.addStock(held,'armorEnhancement').state;assert(rules.validate(shared,world,[true,false]));const enhanced=rules.consume(shared,'armorEnhancement').state;assert.equal(enhanced.boosts.armor,1);
 const yomi=rules.begin(enhanced,null,'yomiFall').state;same(yomi.runs.sectFall,enhanced.runs.sectFall,'Starting Yomi cannot reroll the other memory');same(yomi.stock,enhanced.stock);same(yomi.boosts,enhanced.boosts);
 assert.equal(rules.begin(initial,null,'unknown').reason,'invalidDungeon');assert.equal(rules.runInfo(initial,'unknown'),null);
 for(const flag of [spec.started,...spec.requiredFlags,...spec.rewards,spec.soul]){const bad=plain(world);bad[0]=bad[0].filter(id=>id!==flag);assert(!rules.validate(held,bad,[true,false]),'Reject missing sect requirement '+flag);}
 for(const malformed of [{...plain(initial),run:0},{...plain(initial),runs:{}},{...plain(initial),runs:{...plain(initial.runs),extra:{run:0,roll:null}}}])assert.equal(rules.copy(malformed),null);
 for(const id of ['yomiFall','sectFall'])for(const bad of [-1,.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1]){const broken=plain(initial);broken.runs[id].run=bad;assert.equal(rules.copy(broken),null);}
 const detached=rules.copy(yomi);detached.runs.sectFall.run++;assert.notEqual(detached.runs.sectFall.run,yomi.runs.sectFall.run);
}
console.log('PASS: exact two-dungeon schema, independent immutable runs/rolls/reward chains, shared stock/capped boosts, strict IDs and preserved inventory.');
