/* Test-only unlocks; add catalogue entries when introducing new abilities. */
'use strict';
const DevAbilities=(()=>{
 const catalogue=Object.freeze([
  Object.freeze({id:'double-jump',index:0,label:'text.blessing.of.the.wind'}),
  Object.freeze({id:'dash',index:1,label:'text.spirit.dash'}),
  Object.freeze({id:'kiba-shield',flag:'kibaShield',label:'ability.kibaShield'}),
  Object.freeze({id:'dawnblade',flag:'dawnblade',label:'ability.dawnblade'})
 ]);
 let selected=catalogue[0].id;
 const available=()=>DevSession.active&&!!player;
 function acquire(values){
  if(!available()||state!=='developer'||!DevTools.isOpen)return false;
  const ability=catalogue.find(entry=>entry.id===values?.ability);
  if(!ability)return false;
  if(ability.flag){if(flags[3].includes(ability.flag))return 'dev.ability.owned';flags[3].push(ability.flag);FiaConflict.resetPlayer();updateHUD();return true;}
  if(abilities[ability.index])return 'dev.ability.owned';
  abilities[ability.index]=true;updateHUD();return true;
 }
 function init(){DevTools.register({id:'ability',labelKey:'dev.ability.acquire',available,
  fields:()=>[{id:'ability',type:'select',labelKey:'dev.ability',value:selected,
   options:catalogue.map(entry=>({value:entry.id,label:entry.label})),
   change:value=>{if(catalogue.some(entry=>entry.id===value))selected=value;}}],run:acquire});}
 return Object.freeze({init,acquire});
})();
