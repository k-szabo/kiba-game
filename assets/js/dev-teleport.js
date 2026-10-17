'use strict';
const DevTeleport=(()=>{
 let destination='0',restId=levels[0].rests[0].id;
 const available=()=>DevSession.active;
 function fields(){
  const dream=destination==='dream',rests=dream?[]:levels[Number(destination)].rests;
  if(!dream&&!rests.some(r=>r.id===restId))restId=rests[0].id;
  return [
   {id:'realm',type:'select',labelKey:'dev.realm',value:destination,options:[...realms.map((r,n)=>({value:n,label:r.name})),{value:'dream',label:'prologue.label'}],change:value=>{if(value==='dream'||['0','1','2'].includes(value)){destination=value;restId=value==='dream'?'dream':levels[Number(value)].rests[0].id;}}},
   {id:'rest',type:'select',labelKey:'dev.arrival',value:dream?'dream':restId,options:dream?[{value:'dream',label:'prologue.place'}]:rests.map(r=>({value:r.id,label:r.name})),change:value=>{restId=value;}}
  ];
 }
 function teleport(values){
  if(!available()||state!=='developer'||!DevTools.isOpen)return false;
  const n=values?.realm;
  if(n==='dream'){
   if(values.rest!=='dream')return false;
   Prologue.start();
  }else{
   if(!['0','1','2'].includes(String(n)))return false;
   const target=levels[Number(n)],rest=target.rests.find(r=>r.id===values.rest);
   if(!rest||!target.platforms.some(p=>Math.abs(p.y-rest.y)<2&&rest.x>p.x&&rest.x<p.x+p.w))return false;
   Prologue.stop();enterRealm(Number(n),rest);
   if(!visitedRests[realm].includes(rest.id))visitedRests[realm].push(rest.id);
  }
  state='developer';DevTools.setReturnState('play');keys.clear();pressed.clear();context=null;$('prompt').hidden=true;showHUD(true);updateHUD();return true;
 }
 function init(){DevTools.register({id:'teleport',labelKey:'dev.teleport',available,fields,run:teleport});}
 return Object.freeze({init,teleport});
})();
