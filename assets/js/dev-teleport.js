'use strict';
const DevTeleport=(()=>{
 let destination='0',restId=levels[0].rests[0].id;
 const available=()=>DevSession.active;
 // The picker and executor share the same catalogue, including side areas
 // that deliberately are not additional realms in the main levels array.
 const destinations=()=>[
  ...levels.map((map,n)=>({id:String(n),label:realms[n].name,map,enter:rest=>{KitsuneQuest.leaveFor(map);Prologue.stop();enterRealm(n,rest);return true;}})),
  ...Object.entries(SIDE_LOCATIONS).map(([id,spec])=>({id,label:spec.map.name||'camp.name',map:spec.map,enter:rest=>CampQuest.enter(id,{point:rest,save:false,atShrine:true})})),
  {id:'dream',label:'prologue.label',rests:[{id:'dream',name:'prologue.place'}],enter:()=>{KitsuneQuest.leaveFor(null);Prologue.start();return true;}}
 ];
 const restsFor=target=>target.map?.rests||target.rests;
 function fields(){
  const catalogue=destinations(),target=catalogue.find(entry=>entry.id===destination),rests=restsFor(target);
  if(!rests.some(r=>r.id===restId))restId=rests[0].id;
  return [
   {id:'realm',type:'select',labelKey:'dev.realm',value:destination,options:catalogue.map(entry=>({value:entry.id,label:entry.label})),change:value=>{const next=destinations().find(entry=>entry.id===value);if(next){destination=value;restId=restsFor(next)[0].id;}}},
   {id:'rest',type:'select',labelKey:'dev.arrival',value:restId,options:rests.map(r=>({value:r.id,label:r.name})),change:value=>{restId=value;}}
  ];
 }
 function teleport(values){
  if(!available()||state!=='developer'||!DevTools.isOpen)return false;
  const target=destinations().find(entry=>entry.id===String(values?.realm));
  if(!target)return false;
  const rest=restsFor(target).find(r=>r.id===values?.rest);
  if(!rest||target.map&&!target.map.platforms.some(p=>!p.broken&&Math.abs(p.y-rest.y)<2&&rest.x>p.x&&rest.x<p.x+p.w))return false;
  FiaConflict.abort();if(!target.enter(rest))return false;
  if(target.map&&!visitedRests[realm].includes(rest.id))visitedRests[realm].push(rest.id);
  state='developer';DevTools.setReturnState('play');keys.clear();pressed.clear();context=null;$('prompt').hidden=true;showHUD(true);updateHUD();return true;
 }
 function init(){DevTools.register({id:'teleport',labelKey:'dev.teleport',available,fields,run:teleport});}
 return Object.freeze({init,teleport});
})();
