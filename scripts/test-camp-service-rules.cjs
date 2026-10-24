'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/camp-services.js'),'utf8'),context,{filename:'camp-services.js'});
const rules=vm.runInContext('CampServiceRules',context),plain=value=>JSON.parse(JSON.stringify(value));
const access=Object.freeze({equipped:'katana',smithRescued:true,herbalistRescued:true});
const deepFreeze=value=>{Object.freeze(value);for(const entry of Object.values(value))if(entry&&typeof entry==='object')deepFreeze(entry);return value;};
function transact(state,coins,action,options=access){
 const before=plain(state),frozen=deepFreeze(state),result=rules.transact(frozen,coins,Object.freeze(action),options);
 assert.deepEqual(plain(state),before,'Transactions never mutate the supplied state');
 if(result.state){assert.notEqual(result.state,state);assert.notEqual(result.state.ownedWeapons,state.ownedWeapons);}
 return result;
}
function fails(state,coins,action,reason,options=access){
 const result=transact(state,coins,action,options);
 assert.equal(result.ok,false);assert.equal(result.reason,reason);assert.equal(result.coins,coins);
 assert.deepEqual(plain(result.state),plain(state),'Rejected valid-state transactions are atomic');return result;
}
assert(Object.isFrozen(rules));assert(Object.isFrozen(rules.profile));
assert.deepEqual(plain(rules.profile),{rankLimit:5,weaponStep:.5,armorStep:20,weaponBuy:100,weaponSell:50,herbsPerBrew:3,brewHeal:3});
for(const id of ['katana','naginata','swordShield']){
 const state=rules.fresh(id);assert.deepEqual(plain(state),{ownedWeapons:[id],weaponRank:0,armorRank:0,herbs:0,potions:0});
 assert(rules.validate(state,id));assert.notEqual(rules.fresh(id).ownedWeapons,state.ownedWeapons);
}
for(const id of [undefined,null,'spear','constructor','__proto__',0,[],{}])assert.throws(()=>rules.fresh(id),/Unknown camp weapon style/);
for(const [rank,cost]of [[0,50],[1,100],[2,150],[3,200],[4,250],[5,null],[-1,null],[1.5,null],[Infinity,null],[NaN,null],['1',null]])assert.equal(rules.price(rank),cost);
for(const invalid of [null,undefined,[],false,0,'katana',{}])assert.equal(rules.validate(invalid,'katana'),false);
const invalidStates=[
 state=>{delete state.herbs;},state=>{state.extra=0;},state=>{state.ownedWeapons=[];},
 state=>{state.ownedWeapons=['katana','katana'];},state=>{state.ownedWeapons=['spear'];},
 state=>{state.ownedWeapons=['naginata'];},state=>{state.ownedWeapons=['katana',null];},
 state=>{state.ownedWeapons=['katana'];state.ownedWeapons.length=2;},state=>{state.ownedWeapons='katana';}
];
for(const field of ['weaponRank','armorRank','herbs','potions'])for(const bad of [-1,.5,NaN,Infinity,'1',null,Number.MAX_SAFE_INTEGER+1])invalidStates.push(state=>{state[field]=bad;});
for(const field of ['weaponRank','armorRank'])invalidStates.push(state=>{state[field]=6;});
for(const mutate of invalidStates){const state=rules.fresh('katana');mutate(state);assert.equal(rules.validate(state,'katana'),false);assert.equal(rules.transact(state,100,{type:'brew'},access).state,null);}
for(const equipped of [undefined,null,'naginata','spear',1,{}])assert.equal(rules.validate(rules.fresh('katana'),equipped),false);
const rich=rules.fresh('katana');rich.ownedWeapons=['katana','naginata','swordShield'];rich.weaponRank=5;rich.armorRank=5;rich.herbs=Number.MAX_SAFE_INTEGER;rich.potions=Number.MAX_SAFE_INTEGER;
assert(rules.validate(rich,'naginata'),'All ownership, maximum ranks and safe stock counts are supported');
let state=rules.fresh('katana'),coins=750;
for(let rank=1;rank<=5;rank++){
 const result=transact(state,coins,{type:'forgeWeapon'});assert(result.ok);assert.equal(result.state.weaponRank,rank);assert.equal(result.state.armorRank,0);assert.equal(result.reason,null);
 assert.equal(result.coins,coins-rules.price(rank-1));state=result.state;coins=result.coins;
}
assert.equal(coins,0);assert.equal(state.weaponRank*rules.profile.weaponStep,2.5);
fails(state,1000,{type:'forgeWeapon'},'maxRank');
state=rules.fresh('katana');coins=750;
for(let rank=1;rank<=5;rank++){const result=transact(state,coins,{type:'forgeArmor'});assert(result.ok);state=result.state;coins=result.coins;assert.equal(state.armorRank,rank);assert.equal(state.weaponRank,0);}
assert.equal(coins,0);assert.equal(state.armorRank*rules.profile.armorStep,100);
fails(state,1000,{type:'forgeArmor'},'maxRank');
for(const type of ['forgeWeapon','forgeArmor'])fails(rules.fresh('katana'),49,{type},'insufficientCoins');
state=rules.fresh('katana');fails(state,99,{type:'buyWeapon',weapon:'naginata'},'insufficientCoins');
let bought=transact(state,100,{type:'buyWeapon',weapon:'naginata'});assert(bought.ok);assert.equal(bought.coins,0);assert.deepEqual(plain(bought.state.ownedWeapons),['katana','naginata']);
fails(bought.state,100,{type:'buyWeapon',weapon:'naginata'},'alreadyOwned');
fails(bought.state,100,{type:'sellWeapon',weapon:'katana'},'equippedWeapon');
fails(rules.fresh('katana'),0,{type:'sellWeapon',weapon:'katana'},'lastWeapon');
fails(rules.fresh('katana'),0,{type:'sellWeapon',weapon:'naginata'},'notOwned');
let sold=transact(bought.state,bought.coins,{type:'sellWeapon',weapon:'naginata'});assert(sold.ok);assert.equal(sold.coins,50);assert.deepEqual(plain(sold.state.ownedWeapons),['katana']);
assert.equal(sold.coins-100,-50,'Buy/sell cycles consume coins rather than minting them');
fails(bought.state,Number.MAX_SAFE_INTEGER-49,{type:'sellWeapon',weapon:'naginata'},'coinOverflow');
const safeSale=transact(bought.state,Number.MAX_SAFE_INTEGER-50,{type:'sellWeapon',weapon:'naginata'});assert(safeSale.ok);assert.equal(safeSale.coins,Number.MAX_SAFE_INTEGER);
const forged=rules.fresh('katana');forged.weaponRank=4;const more=transact(forged,100,{type:'buyWeapon',weapon:'swordShield'});
assert(more.ok);assert.equal(more.state.weaponRank,4,'Shared forging rank does not change when another style is purchased');
const otherEquipped={...access,equipped:'swordShield'};assert(rules.validate(more.state,'swordShield'));const oldSold=transact(more.state,0,{type:'sellWeapon',weapon:'katana'},otherEquipped);assert(oldSold.ok);assert.equal(oldSold.state.weaponRank,4,'Shared forging survives weapon sales');
for(const type of ['buyWeapon','sellWeapon'])fails(rules.fresh('katana'),100,{type,weapon:'spear'},'invalidWeapon');
for(const type of ['buyWeapon','sellWeapon','forgeWeapon','forgeArmor'])fails(rules.fresh('katana'),100,{type,weapon:'naginata'},'smithUnavailable',{...access,smithRescued:false});
for(const missing of [undefined,false,1,'true'])fails(rules.fresh('katana'),100,{type:'forgeArmor'},'smithUnavailable',{...access,smithRescued:missing});
const herbs=rules.fresh('katana');herbs.herbs=6;
let brewed=transact(herbs,23,{type:'brew'},{...access,smithRescued:false});assert(brewed.ok);assert.equal(brewed.state.herbs,3);assert.equal(brewed.state.potions,1);assert.equal(brewed.coins,23);
brewed=transact(brewed.state,23,{type:'brew'});assert(brewed.ok);assert.equal(brewed.state.herbs,0);assert.equal(brewed.state.potions,2);
fails(brewed.state,23,{type:'brew'},'insufficientHerbs');
fails(herbs,23,{type:'brew'},'herbalistUnavailable',{...access,herbalistRescued:false});
const full=rules.fresh('katana');full.herbs=3;full.potions=Number.MAX_SAFE_INTEGER;fails(full,0,{type:'brew'},'stockOverflow');
const last=rules.fresh('katana');last.herbs=3;last.potions=Number.MAX_SAFE_INTEGER-1;const final=transact(last,0,{type:'brew'});assert(final.ok);assert.equal(final.state.potions,Number.MAX_SAFE_INTEGER);
for(const coins of [-1,.5,NaN,Infinity,'100',null,Number.MAX_SAFE_INTEGER+1]){
 const result=rules.transact(rules.fresh('katana'),coins,{type:'forgeWeapon'},access);assert.equal(result.ok,false);assert.equal(result.reason,'invalidCoins');
}
for(const action of [undefined,null,[],false,'brew',{}, {type:'constructor'},{type:'unknown'}]){
 const result=rules.transact(rules.fresh('katana'),100,action,access);assert.equal(result.ok,false);assert.equal(result.reason,'invalidAction');
}
for(const options of [undefined,null,{}, {equipped:'spear'}]){
 const result=rules.transact(rules.fresh('katana'),100,{type:'brew'},options);assert.equal(result.ok,false);assert.equal(result.reason,'invalidState');assert.equal(result.state,null);
}
console.log('PASS: strict camp service schema, shared forge ranks, exact costs, weapon ownership/sales, rescue gates, repeatable brewing, overflow prevention and immutable atomic transactions.');
