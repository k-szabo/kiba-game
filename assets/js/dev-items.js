'use strict';
const DevItems=(()=>{
 let selected=Object.keys(ART_INVENTORY.items)[0],amount=100;
 const available=()=>DevSession.active&&!!player;
 function add(values){
  if(!available()||state!=='developer'||!DevTools.isOpen)return false;
  const id=values?.item;
  if(typeof id!=='string'||!Object.hasOwn(ART_INVENTORY.items,id))return false;
  const item=ART_INVENTORY.items[id];
  if(item.stack){if(meatCount===Number.MAX_SAFE_INTEGER)return false;meatCount++;updateHUD();return true;}
  if(flags[item.realm].includes(id)||item.consumedBy&&flags[item.consumedBy.realm].includes(item.consumedBy.id))return 'dev.item.owned';
  flags[item.realm].push(id);updateHUD();return true;
 }
 function addCoins(values){
  if(!available()||state!=='developer'||!DevTools.isOpen)return false;
  const raw=String(values?.amount??'');if(!/^\d+$/.test(raw))return false;
  const count=Number(raw);
  if(!Number.isSafeInteger(count)||count<1||count>Number.MAX_SAFE_INTEGER-coins)return false;
  Merchant.award(count);amount=count;updateHUD();return true;
 }
 function init(){
  DevTools.register({id:'inventory-item',labelKey:'dev.item.add',available,
   fields:()=>[{id:'item',type:'select',labelKey:'dev.item',value:selected,options:Object.entries(ART_INVENTORY.items).map(([value,item])=>({value,label:item.name})),change:value=>{if(Object.hasOwn(ART_INVENTORY.items,value))selected=value;}}],run:add});
  DevTools.register({id:'coins',labelKey:'dev.coins.add',available,
   fields:()=>[{id:'amount',type:'number',labelKey:'dev.amount',value:amount,min:1,max:Number.MAX_SAFE_INTEGER}],run:addCoins});
 }
 return Object.freeze({init,add,addCoins});
})();
