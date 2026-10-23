const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/armor.js'),'utf8'),context,{filename:'armor.js'});
const armor=vm.runInContext('Armor',context);
const close=(actual,expected,message)=>assert(Math.abs(actual-expected)<=Math.max(1,Math.abs(expected))*1e-12,message||String(actual)+' != '+String(expected));
assert.equal(armor.K,100);assert(Object.isFrozen(armor),'Shared armor rules cannot be reconfigured during combat');
for(const [rating,reduction] of [[0,0],[50,1/3],[100,.5],[400,.8]]){
 close(armor.reduction(rating),reduction,'Damage reduction at '+rating+' armor');
 close(armor.damage(12,rating),12*(1-reduction),'Mitigated damage at '+rating+' armor');
}
for(const invalid of [undefined,null,NaN,Infinity,-Infinity,-1,'100',{},[],true]){
 assert.equal(armor.reduction(invalid),0,'Malformed or negative armor provides no protection');
 assert.equal(armor.damage(5,invalid),5,'Malformed armor cannot create immunity or amplification');
}
for(const invalid of [undefined,null,NaN,Infinity,-Infinity,-1,0,'5',{},[],true])assert.equal(armor.damage(invalid,100),0,'Invalid damage cannot heal or poison HP');
close(armor.damage(.1,400),.02,'Fractional attacks retain proportional damage without the old 0.25 floor');
close(armor.damage(5e-8,400),1e-8,'Tiny damage must not be raised to an artificial floor');
let previousReduction=0,previousGain=Infinity;
for(let rating=50;rating<=1000;rating+=50){
 const reduction=armor.reduction(rating),gain=reduction-previousReduction;
 assert(reduction>previousReduction&&reduction<1,'Increasing armor improves protection without immunity');
 assert(gain<previousGain,'Equal armor increases have diminishing returns');
 previousReduction=reduction;previousGain=gain;
}
// Computing retained damage directly avoids cancellation at extreme armor.
for(const rating of [Number.MAX_SAFE_INTEGER,Number.MAX_VALUE]){
 const reduction=armor.reduction(rating),damage=armor.damage(Number.MAX_VALUE,rating);
 assert(Number.isFinite(reduction)&&reduction>=0&&reduction<=1);
 assert(Number.isFinite(damage)&&damage>0&&damage<=Number.MAX_VALUE,'Huge finite values retain finite positive damage');
 assert(armor.damage(1,rating)>0,'Extreme finite armor cannot round ordinary damage to zero');
}
assert.equal(armor.damage(Number.MAX_VALUE,0),Number.MAX_VALUE);
console.log('PASS: shared K=100 armor formula, documented examples, fractions, malformed inputs, diminishing returns and stable extremes.');
