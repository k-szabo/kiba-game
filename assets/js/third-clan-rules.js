/* Permanent route milestones and transient armor for the cave encounter. */
'use strict';
const ThirdClanRules=(()=>{
 const progress=Object.freeze({accepted:'thirdClanAccepted',ballistae:Object.freeze([
  'thirdClanBallistaWest','thirdClanBallistaCenter','thirdClanBallistaEast'
 ]),guardian:'thirdClanGuardianDefeated',trail:'thirdClanHaruTrailFound'});
 const flagIds=Object.freeze([progress.accepted,...progress.ballistae,progress.guardian,progress.trail]);
 const armorLayers=4;
 const ballistaHealth=36;
 const airship=Object.freeze({fireAt:2.05,impactAt:2.55,finishAt:3.65});
 const has=(flags,id)=>flags?.[0]?.includes(id)===true;
 const available=flags=>has(flags,'ninjaClanRitualistReward')&&has(flags,'ninjaClanDebrief');
 const disabled=flags=>progress.ballistae.filter(id=>has(flags,id)).length;
 function valid(flags){
  const japan=flags?.[0];
  if(!Array.isArray(japan))return false;
  if(!flagIds.some(id=>has(flags,id)))return true;
  return available(flags)&&has(flags,progress.accepted)&&
   (!has(flags,progress.guardian)||disabled(flags)===progress.ballistae.length)&&
   (!has(flags,progress.trail)||has(flags,progress.guardian));
 }
 function stage(flags){
  if(!valid(flags)||!available(flags))return null;
  if(!has(flags,progress.accepted))return 'briefing';
  if(disabled(flags)<progress.ballistae.length)return 'ballistae';
  if(!has(flags,progress.guardian))return 'guardian';
  return has(flags,progress.trail)?'complete':'trail';
 }
 function advance(flags,id){
  const current=stage(flags);
  if(!current||has(flags,id))return null;
  const permitted=current==='briefing'?id===progress.accepted:
   current==='ballistae'?progress.ballistae.includes(id):
   current==='guardian'?id===progress.guardian:current==='trail'&&id===progress.trail;
  return permitted?[...flags[0],id]:null;
 }
 function strikeArmor(layers,kind){
  return kind==='heavy'&&Number.isInteger(layers)&&layers>0&&layers<=armorLayers?layers-1:layers;
 }
 function stepAirship(elapsed,dt){
  const next=Math.min(airship.finishAt,elapsed+dt);
  const crossed=threshold=>elapsed<threshold&&next>=threshold;
  return {elapsed:next,fired:crossed(airship.fireAt),impact:crossed(airship.impactAt),finished:crossed(airship.finishAt)};
 }
 return Object.freeze({progress,flagIds,armorLayers,ballistaHealth,airship,available,disabled,valid,stage,advance,strikeArmor,stepAirship});
})();
