/* Pure camp transactions. Rescue/location/UI checks remain separate concerns:
 * transact enforces rescue access; its caller must also verify proximity/state.
 * validate returns a boolean. price returns null when no next rank exists.
 * Valid input states always produce an independent state copy, even on failure;
 * malformed states produce state:null. No function mutates the supplied state. */
'use strict';
const CampServiceRules=(()=>{
 const profile=Object.freeze({rankLimit:5,weaponStep:.5,armorStep:20,weaponBuy:100,weaponSell:50,herbsPerBrew:3,brewHeal:3});
 const styles=Object.freeze(['katana','naginata','swordShield']);
 const fields=Object.freeze(['ownedWeapons','weaponRank','armorRank','herbs','potions']);
 const integer=(value,min,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(value)&&value>=min&&value<=max;
 const validStyle=style=>typeof style==='string'&&styles.includes(style);
 function fresh(style){
  if(!validStyle(style))throw new TypeError('Unknown camp weapon style');
  return {ownedWeapons:[style],weaponRank:0,armorRank:0,herbs:0,potions:0};
 }
 function validate(data,equipped){
  return !!data&&typeof data==='object'&&!Array.isArray(data)&&Object.keys(data).length===fields.length&&fields.every(key=>Object.hasOwn(data,key))&&
   Array.isArray(data.ownedWeapons)&&data.ownedWeapons.length>0&&data.ownedWeapons.length<=styles.length&&
   Array.from(data.ownedWeapons).every(validStyle)&&new Set(data.ownedWeapons).size===data.ownedWeapons.length&&
   validStyle(equipped)&&data.ownedWeapons.includes(equipped)&&
   integer(data.weaponRank,0,profile.rankLimit)&&integer(data.armorRank,0,profile.rankLimit)&&
   integer(data.herbs,0)&&integer(data.potions,0);
 }
 function price(rank){return integer(rank,0,profile.rankLimit-1)?50*(rank+1):null;}
 function copy(data){return {ownedWeapons:[...data.ownedWeapons],weaponRank:data.weaponRank,armorRank:data.armorRank,herbs:data.herbs,potions:data.potions};}
 function transact(data,coins,action,context={}){
  const state=validate(data,context?.equipped)?copy(data):null;
  const fail=reason=>({ok:false,state,coins,reason});
  if(!state)return fail('invalidState');
  if(!integer(coins,0))return fail('invalidCoins');
  if(!action||typeof action!=='object'||Array.isArray(action)||!['buyWeapon','sellWeapon','forgeWeapon','forgeArmor','brew'].includes(action.type))return fail('invalidAction');
  const success=()=>({ok:true,state,coins,reason:null});
  if(action.type==='brew'){
   if(context.herbalistRescued!==true)return fail('herbalistUnavailable');
   if(state.herbs<profile.herbsPerBrew)return fail('insufficientHerbs');
   if(state.potions===Number.MAX_SAFE_INTEGER)return fail('stockOverflow');
   state.herbs-=profile.herbsPerBrew;state.potions++;return success();
  }
  if(context.smithRescued!==true)return fail('smithUnavailable');
  if(action.type==='buyWeapon'||action.type==='sellWeapon'){
   const weapon=action.weapon;
   if(!validStyle(weapon))return fail('invalidWeapon');
   const owned=state.ownedWeapons.includes(weapon);
   if(action.type==='buyWeapon'){
    if(owned)return fail('alreadyOwned');
    if(coins<profile.weaponBuy)return fail('insufficientCoins');
    state.ownedWeapons.push(weapon);coins-=profile.weaponBuy;
   }else{
    if(!owned)return fail('notOwned');
    if(state.ownedWeapons.length===1)return fail('lastWeapon');
    if(weapon===context.equipped)return fail('equippedWeapon');
    if(coins>Number.MAX_SAFE_INTEGER-profile.weaponSell)return fail('coinOverflow');
    state.ownedWeapons=state.ownedWeapons.filter(id=>id!==weapon);coins+=profile.weaponSell;
   }
   return success();
  }
  const rank=action.type==='forgeWeapon'?'weaponRank':'armorRank',cost=price(state[rank]);
  if(cost===null)return fail('maxRank');
  if(coins<cost)return fail('insufficientCoins');
  state[rank]++;coins-=cost;return success();
 }
 return Object.freeze({profile,fresh,validate,price,transact});
})();
