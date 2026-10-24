/* Historical scale flags are retained; the talisman consumes their held view. */
'use strict';
const SerpentRelics=(()=>{
 const result='triuneSerpentTalisman';
 const scales=Object.freeze([{id:'whiteSerpentScale',realm:0,guardian:'whiteSerpent'},{id:'serpentScale',realm:1},{id:'wingedSerpentScale',realm:2,guardian:'wingedSerpent'}].map(Object.freeze));
 const united=()=>flags[0].includes(result);
 const held=spec=>!united()&&flags[spec.realm].includes(spec.id)&&!soldItems.includes(spec.id);
 function canUnite(){return state==='campService'&&!Prologue.active&&level===mysticTent&&(DevSession.active||flags[0].includes('enchanterRescued'))&&pointNear(level.servicePoint,120,100)&&!united()&&scales.every(held);}
 function unite(){
  if(!canUnite())return false;
  flags[0].push(result);persist();updateHUD();CampWorkshop.close();
  story('camp.dialogue.label','camp.npc.enchanter.name','serpent.fusion.dialogue',()=>toast(I18n.t('serpent.fusion.complete')),{right:'enchanter',speaker:'enchanter'});
  return true;
 }
 function equip(id){
  if(state!=='inventory'||Prologue.active&&!DevSession.active||id!==null&&id!==result||id===result&&(!united()||soldItems.includes(result)))return false;
  equippedTalisman=id;persist();updateHUD();return true;
 }
 return Object.freeze({scales,result,equip,united,held,canUnite,unite,armorBonus:()=>united()&&equippedTalisman===result?20:0});
})();
