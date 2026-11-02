'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context=vm.createContext({});
for(const name of ['weapons','camp-services'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/'+name+'.js'),'utf8'),context);
const {styles,rules}=vm.runInContext('({styles:WeaponStyles,rules:CampServiceRules})',context),plain=value=>JSON.parse(JSON.stringify(value));
assert.deepEqual(plain(styles.ids),['katana','naginata','swordShield']);
assert.deepEqual(plain(styles.allIds),[...plain(styles.ids),'foxfireKatana']);
assert(Object.isFrozen(styles.ids));assert(Object.isFrozen(styles.allIds));assert(Object.isFrozen(styles.profile('foxfireKatana')));
assert.equal(styles.baseStyle('foxfireKatana'),'katana');
for(const id of styles.ids)assert.equal(styles.baseStyle(id),id);
for(const id of ['__proto__','constructor','unknown',null,{},[]]){assert(!styles.valid(id));assert.throws(()=>styles.baseStyle(id),/Unknown weapon style/);}
const normal={duration:.42,impact:.16,cooldown:.34,damageScale:.75},heavy={duration:.9,impact:.38,cooldown:.9,damageScale:1.75};
for(const base of [normal,heavy]){
 const katana=styles.attack('katana',base),foxfire=styles.attack('foxfireKatana',base);
 assert.equal(foxfire.duration,katana.duration);assert.equal(foxfire.impact,katana.impact);assert.equal(foxfire.cooldown,katana.cooldown);
 assert(Math.abs(foxfire.damageScale-katana.damageScale*1.2)<1e-12);
}
for(const face of [-1,1])assert.deepEqual(plain(styles.hitbox('foxfireKatana',{x:400,y:200},face)),plain(styles.hitbox('katana',{x:400,y:200},face)));
assert.equal(styles.profile('foxfireKatana').health,0);
assert(!styles.guard('foxfireKatana',3,{face:1,direction:-1,grounded:true,attacking:false,dashing:false,cooldown:0}).blocked);
assert.throws(()=>rules.fresh('foxfireKatana'),/Unknown camp weapon style/);
const owned=rules.fresh('katana');owned.ownedWeapons.push('foxfireKatana');
assert(rules.validate(owned,'foxfireKatana'));assert(rules.validate(owned,'katana'));
assert(!rules.validate(rules.fresh('katana'),'foxfireKatana'));
const all=rules.fresh('katana');all.ownedWeapons=plain(styles.allIds);assert(rules.validate(all,'foxfireKatana'));
const snapshot=JSON.stringify(owned);Object.freeze(owned.ownedWeapons);Object.freeze(owned);
for(const type of ['buyWeapon','sellWeapon']){
 for(const equipped of ['katana','foxfireKatana']){
  const result=rules.transact(owned,1000,{type,weapon:'foxfireKatana'},{equipped,smithRescued:true});
  assert(!result.ok);assert.equal(result.reason,'invalidWeapon');assert.equal(result.coins,1000);
  assert.equal(JSON.stringify(owned),snapshot);assert.deepEqual(plain(result.state),plain(owned));
  assert.notEqual(result.state,owned);assert.notEqual(result.state.ownedWeapons,owned.ownedWeapons);
 }
}
const forged=rules.transact(owned,50,{type:'forgeWeapon'},{equipped:'foxfireKatana',smithRescued:true});assert(forged.ok);assert.equal(forged.state.weaponRank,1);assert.equal(forged.coins,0);assert.deepEqual(plain(forged.state.ownedWeapons),['katana','foxfireKatana']);assert.equal(JSON.stringify(owned),snapshot);
const ordinary=rules.transact(owned,100,{type:'buyWeapon',weapon:'naginata'},{equipped:'foxfireKatana',smithRescued:true});assert(ordinary.ok);assert.deepEqual(plain(ordinary.state.ownedWeapons),['katana','foxfireKatana','naginata']);
console.log('PASS: Foxfire Katana has katana timing/reach and +20% damage; starter/duel IDs stay unchanged, quest ownership validates, forging works, and commerce/fresh-loadout paths cannot create or sell the relic.');
