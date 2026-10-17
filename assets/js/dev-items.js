'use strict';
const DevItems=(()=>{
 const available=()=>DevSession.active&&!!player;
 function add(values){
  if(!available()||state!=='developer'||!DevTools.isOpen)return false;
  const id=values?.item;
  if(typeof id!=='string'||!Object.hasOwn(ART_INVENTORY.items,id))return false;
  const item=ART_INVENTORY.items[id];
  if(flags[item.realm].includes(id)||item.consumedBy&&flags[item.consumedBy.realm].includes(item.consumedBy.id))return 'dev.item.owned';
  flags[item.realm].push(id);updateHUD();return true;
 }
 function init(){DevTools.register({id:'inventory-item',labelKey:'dev.item.add',available,
  fields:()=>[{id:'item',type:'select',labelKey:'dev.item',value:Object.keys(ART_INVENTORY.items)[0],options:Object.entries(ART_INVENTORY.items).map(([value,item])=>({value,label:item.name}))}],run:add});}
 return Object.freeze({init,add});
})();
