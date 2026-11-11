'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=name=>fs.readFileSync(path.join(__dirname,'../assets/js/'+name+'.js'),'utf8');
function setup(shared=new Map()){
 const context=vm.createContext({localStorage:{getItem:key=>shared.get(key)??null,setItem:(key,value)=>shared.set(key,value)}});
 vm.runInContext(source('tower-rewards')+'\n'+source('tower-store'),context);
 const run=text=>vm.runInContext(text,context),json=text=>JSON.parse(JSON.stringify(run(text)));return {run,json,shared};
}
const a=setup(),r=a.run,j=a.json;r('var wallet=TowerRewards.fresh();');assert(r('TowerRewards.valid(wallet)'));assert.equal(r('TowerRewards.stats(wallet,"swordShield").maxHp'),22);
for(const relic of j('TowerRewards.rare')){
 const seed=r('Array.from({length:1000},(_,i)=>i+1).find(seed=>TowerRewards.choices(seed,1).includes('+JSON.stringify(relic)+'))');
 assert(seed,'Every rare card can appear in an offer');
 const choice=j('TowerRewards.claim(TowerRewards.award(TowerRewards.fresh(),1).wallet,'+JSON.stringify({seed,cleared:1,id:relic})+')');
 assert.equal(choice.wallet.relic,relic);
 assert.equal(r('TowerRewards.award('+JSON.stringify(choice.wallet)+',2).wallet.relic'),null);
}
for(let floor=1;floor<=20;floor++){
 r('var award=TowerRewards.award(wallet,'+floor+');wallet=award.wallet;');assert(r('award.ok'));assert.equal(r('award.coins'),20+floor*5);
 assert(!r('TowerRewards.award(wallet,'+floor+').ok'),'Duplicate clears cannot award coins again');
 const choices=j('TowerRewards.choices(137,'+floor+')');assert.equal(new Set(choices).size,3);assert.deepEqual(choices,j('TowerRewards.choices(137,'+floor+')'));
 assert(!r('TowerRewards.claim(wallet,{seed:137,cleared:'+floor+',id:"bogus"}).ok'));
 const id=choices.includes('revival')?'revival':choices[0],args=JSON.stringify({seed:137,cleared:floor,id});r('var choice=TowerRewards.claim(wallet,'+args+');wallet=choice.wallet;');assert(r('choice.ok'));
 assert(!r('TowerRewards.claim(wallet,'+args+').ok'),'An already selected card cannot be selected twice');
 if(floor%5)assert(!r('TowerRewards.buy(wallet,"roastMeat").ok'));else{
  for(const [item,price]of Object.entries(j('TowerRewards.items'))){const coins=r('wallet.coins');r('var purchase=TowerRewards.buy(wallet,'+JSON.stringify(item)+');wallet=purchase.wallet;');assert(r('purchase.ok'));assert.equal(r('wallet.coins'),coins-price);assert.equal(r('wallet.items['+JSON.stringify(item)+']'),floor/5);}
 }
}
assert(r('wallet.revivals>0'));const revivals=r('wallet.revivals');r('var revival=TowerRewards.revive(wallet);wallet=revival.wallet;');assert(r('revival.ok'));assert.equal(r('wallet.revivals'),revivals-1);assert.equal(r('revival.heal'),10);
const before=j('wallet');r('var duplicate=TowerRewards.copy(wallet);duplicate.items.tea++;duplicate.boosts.armor++;');assert.deepEqual(j('wallet'),before,'Copied nested state is detached');
for(const invalid of [null,{},[],{...before,coins:-1},{...before,claimedFloor:NaN},{...before,rewardedFloor:before.claimedFloor+2},{...before,items:{...before.items,unknown:1}},{...before,boosts:{...before.boosts,strength:Number.MAX_SAFE_INTEGER}},{...before,coins:Number.MAX_SAFE_INTEGER+1}])assert(!r('TowerRewards.valid('+JSON.stringify(invalid)+')'));
assert(!r('TowerRewards.award({...wallet,coins:Number.MAX_SAFE_INTEGER},21).ok'),'Coin overflow is rejected');
r('var empty=TowerRewards.fresh(20);');assert(!r('TowerRewards.buy(empty,"tea").ok'));assert(!r('TowerRewards.consume(empty,"tea").ok'));assert(!r('TowerRewards.revive(empty).ok'));r('empty.boosts.spirit=20;');assert.equal(r('TowerRewards.stats(empty,"katana").dashCooldown'),.2);
assert(r('TowerStore.start({seed:137,weapon:"katana"}).ok'));
const point={seed:137,weapon:'katana',cleared:20,kills:130,elapsed:400};assert(r('TowerStore.saveCheckpoint('+JSON.stringify(point)+',wallet).persisted'));
const reload=setup(a.shared);assert.deepEqual(reload.json('TowerStore.read().checkpointRewards'),j('wallet'));assert.deepEqual(Object.keys(reload.json('TowerStore.read().best')).sort(),['seed','weapon','cleared','kills','elapsed'].sort());
const key='kiba-infinite-tower-v1',raw=a.shared.get(key),legacy=JSON.parse(raw);delete legacy.checkpointRewards;
const old=setup(new Map([[key,JSON.stringify(legacy)]]));assert.equal(old.run('TowerStore.read().checkpointRewards.claimedFloor'),20);assert.equal(old.run('TowerStore.read().checkpointRewards.coins'),0);
assert(r('TowerStore.start({seed:9,weapon:"naginata"}).ok'));assert.equal(r('TowerStore.read().checkpointRewards.coins'),0);assert.equal(r('TowerStore.read().best.cleared'),20);
const corrupt=JSON.parse(raw);corrupt.checkpointRewards.items.tea=-1;const bad=setup(new Map([[key,JSON.stringify(corrupt)]]));bad.run('TowerStore.read()');assert.equal(bad.run('TowerStore.reason'),'invalid');
assert(r('TowerStore.saveCheckpoint('+JSON.stringify({...point,seed:9,weapon:'naginata'})+',{...TowerRewards.fresh(19),rewardedFloor:20}).ok'),'A checkpoint can preserve a pending card selection');
console.log('PASS: deterministic distinct tower cards, exactly-once coins and choice, all four vendor items, budgets, consumable revival, isolated reward checkpoints, legacy normalization, score shape and invalid-state rejection.');
