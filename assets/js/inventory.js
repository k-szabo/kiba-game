/* Inventory is a view of persistent quest flags; opening it never writes a save. */
'use strict';
const Inventory=(()=>{
 let initialized=false,returnFocus=null,selected=null;
 const ids=['angelHalo','demonHorn','councilKey'];
 const names={angelHalo:'text.angel.s.halo',demonHorn:'text.demon.lord.s.horn',councilKey:'council.key.name'};
 function contents(){return ids.filter(id=>id==='councilKey'?flags[1].includes(id)&&!flags[1].includes('councilGateOpen'):flags[0].includes(id));}
 function image(canvas,image,rect){
  const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);
  if(!image?.complete||!image.naturalWidth)return;
  const pad=8,s=Math.min((canvas.width-pad*2)/rect.w,(canvas.height-pad*2)/rect.h),w=rect.w*s,h=rect.h*s;
  c.drawImage(image,rect.x||0,rect.y||0,rect.w,rect.h,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
 }
 function itemIcon(id){
  const canvas=document.createElement('canvas');canvas.width=112;canvas.height=112;canvas.setAttribute('aria-hidden','true');
  if(id==='councilKey')image(canvas,Visuals.images.councilKey,ART_COUNCIL.key);
  else image(canvas,Visuals.images.relics,ART_FRAMES.relics[id]);
  return canvas;
 }
 function weaponName(){return I18n.t(defeated[1]?'item.dawnblade':'inventory.weapon.sword');}
 function details(id){
  $('inventoryDetailName').textContent=id==='weapon'?weaponName():id?I18n.t(names[id]):I18n.t('inventory.empty.title');
  $('inventoryDetailType').textContent=I18n.t(id==='weapon'?'inventory.type.equipped':id?'inventory.type.quest':'inventory.type.backpack');
  $('inventoryDetailText').textContent=id==='weapon'?I18n.format('inventory.weapon.description',[momoStats().damage]):id?I18n.t('inventory.description.'+id):I18n.t('inventory.empty.body');
 }
 function choose(id){selected=id;for(const button of document.querySelectorAll('#inventory [data-inventory-item]'))button.setAttribute('aria-pressed',String(button.dataset.inventoryItem===id));details(id);}
 function render(){
  const items=contents(),active=document.activeElement?.dataset?.inventoryItem;
  const labels={inventoryTitle:'inventory.title',inventoryPaused:'inventory.paused',inventoryBagTitle:'inventory.bag.title',inventoryCapacity:'inventory.capacity',inventoryEquipmentTitle:'inventory.equipment.title',inventoryWeaponLabel:'inventory.weapon.slot',inventoryEquipped:'inventory.equipped',closeInventory:'inventory.close'};
  for(const [id,key] of Object.entries(labels))$(id).textContent=I18n.t(key);
  $('inventoryButton').setAttribute('aria-label',I18n.t('inventory.open'));
  $('inventoryButton').title=`${I18n.t('inventory.open')} (${bindingKeyLabel(Bindings.read('inventory')[0])})`;
  $('inventoryMomo').setAttribute('aria-label',I18n.t('inventory.character'));
  image($('inventoryMomo'),sheet,{x:0,y:0,w:192,h:208});
  $('inventoryCount').textContent=I18n.format('inventory.count',[items.length]);
  const grid=$('inventoryGrid');grid.replaceChildren();
  for(const id of items){
   const button=document.createElement('button');button.type='button';button.className='inventory-item';button.dataset.inventoryItem=id;
   const label=document.createElement('span');label.textContent=I18n.t(names[id]);button.append(itemIcon(id),label);
   button.addEventListener('click',()=>choose(id));grid.append(button);
  }
  $('inventoryEmpty').hidden=items.length>0;$('inventoryEmpty').textContent=I18n.t('inventory.empty.title');
  $('inventoryWeaponName').textContent=weaponName();$('inventoryWeapon').setAttribute('aria-label',I18n.format('inventory.weapon.label',[weaponName()]));
  choose(selected==='weapon'||items.includes(selected)?selected:items[0]||null);
  if(active)document.querySelector(`#inventory [data-inventory-item="${active}"]`)?.focus();
 }
 function open(){
  if(state!=='play'||!player)return false;
  returnFocus=document.activeElement;keys.clear();pressed.clear();state='inventory';render();$('inventory').hidden=false;$('closeInventory').focus();return true;
 }
 function close(){
  if(state!=='inventory')return false;
  $('inventory').hidden=true;state='play';keys.clear();pressed.clear();
  if(returnFocus?.isConnected&&typeof returnFocus.focus==='function')returnFocus.focus();else $('inventoryButton').focus();return true;
 }
 function init(){
  if(initialized)return;initialized=true;
  $('inventoryButton').onclick=open;$('closeInventory').onclick=close;$('inventoryWeapon').onclick=()=>choose('weapon');
  $('inventory').addEventListener('keydown',event=>{
   if(event.key!=='Tab'||state!=='inventory')return;
   const nodes=[...$('inventory').querySelectorAll('button:not([disabled]),[tabindex="0"]')].filter(node=>!node.hidden&&node.getClientRects().length);
   if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  const repaint=()=>{if(state==='inventory')render();};Visuals.ready.then(repaint);sheet.addEventListener('load',repaint);
 }
 return Object.freeze({init,open,close,render,contents});
})();
