/* Equip registered weapon styles only within an isolated developer run. */
'use strict';
const DevWeapons=(()=>{
 let selected=null,observedStyle=null,observedPlayer=null;
 const available=()=>DevSession.active&&!!player;
 function equip(values){
  if(!available()||state!=='developer'||!DevTools.isOpen)return false;
  const id=values?.weapon;
  if(!WeaponStyles.valid(id))return false;
  if(!WeaponEquipment.equip(id))return false;
  if(!campServices.ownedWeapons.includes(id))campServices.ownedWeapons.push(id);
  return true;
 }
 function fields(){
  // Keep an unsubmitted selection through panel re-renders, while synchronizing
  // after a fresh test character or another equipment action changes the loadout.
  if(observedStyle!==weaponStyle||observedPlayer!==player){
   observedStyle=weaponStyle;observedPlayer=player;selected=weaponStyle;
  }
  return [{id:'weapon',type:'select',labelKey:'weapon.training.title',value:selected,
   options:WeaponStyles.ids.map(id=>({value:id,label:'weapon.'+id+'.item'})),
   change:value=>{if(WeaponStyles.valid(value))selected=value;}}];
 }
 function init(){DevTools.register({id:'weapon',labelKey:'dev.weapon.equip',available,fields,run:equip});}
 return Object.freeze({init,equip});
})();
