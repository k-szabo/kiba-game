/* Inventory is a view of persistent quest flags; opening it never writes a save. */
'use strict';
const Inventory=(()=>{
 let initialized=false,returnFocus=null,selected=null,pendingSale=null,renderId=0;
 const catalogue=ART_INVENTORY.items,ids=Object.keys(catalogue),talisman=SerpentRelics.result;
 const isTalisman=id=>id===talisman||id==='equippedTalisman';
 const weaponStyleFor=id=>typeof id==='string'&&id.startsWith('weapon-')&&WeaponStyles.valid(id.slice(7))?id.slice(7):null;
 const itemArt=id=>weaponStyleFor(id)?ART_INVENTORY[weaponStyleFor(id)]:catalogue[id];
 const itemName=id=>id==='equippedTalisman'?I18n.t(catalogue[talisman].name):weaponStyleFor(id)?weaponName(weaponStyleFor(id)):I18n.t(catalogue[id].name);
 function quantity(id){const style=weaponStyleFor(id);if(style)return style!==weaponStyle&&campServices.ownedWeapons.includes(style)?1:0;const item=catalogue[id];if(!item||id===talisman&&equippedTalisman===talisman)return 0;if(item.stack)return Merchant.stock(id);return !soldItems.includes(id)&&flags[item.realm].includes(id)&&!(item.consumedBy&&flags[item.consumedBy.realm].includes(item.consumedBy.id))?1:0;}
 function contents(){return [...ids.filter(id=>quantity(id)>0),...WeaponStyles.ids.filter(style=>style!==weaponStyle&&campServices.ownedWeapons.includes(style)).map(style=>'weapon-'+style)];}
 function image(canvas,image,rect,size){
  const ratio=size?Math.max(1,Math.min(3,window.devicePixelRatio||1)):1;
  if(size){canvas.width=Math.round(size.w*ratio);canvas.height=Math.round(size.h*ratio);}
  const c=canvas.getContext('2d');c.globalAlpha=1;c.globalCompositeOperation='source-over';c.filter='none';c.clearRect(0,0,canvas.width,canvas.height);
  if(!image?.complete||!image.naturalWidth)return;
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  const pad=8*ratio,s=Math.min((canvas.width-pad*2)/rect.w,(canvas.height-pad*2)/rect.h),w=rect.w*s,h=rect.h*s;
  c.drawImage(image,rect.x||0,rect.y||0,rect.w,rect.h,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
 }
 function equipmentArt(){
  $('inventoryTalismanLabel').textContent=I18n.t('inventory.talisman.slot');
  const talismanArt=catalogue[talisman];image($('inventoryTalismanArt'),equippedTalisman&&talismanArt?Visuals.images[talismanArt.image]:null,talismanArt,{w:108,h:108});
  $('inventoryTalisman').disabled=!equippedTalisman;$('inventoryTalismanName').textContent=equippedTalisman?I18n.t(talismanArt.name):'—';
  $('inventoryTalisman').setAttribute('aria-label',I18n.t('inventory.talisman.slot')+(equippedTalisman?' · '+I18n.t(talismanArt.name):''));
  image($('inventoryMomo'),Visuals.images.inventoryMomoPortrait,ART_INVENTORY.momo,{w:384,h:416});
  const weaponArt=ART_INVENTORY[weaponStyle];
  image($('inventoryWeaponArt'),Visuals.images[weaponArt.image],weaponArt,{w:108,h:144});
 }
 // Stats use the same combat profiles as hit resolution, rather than the
 // currently highlighted backpack weapon or a cached equipment snapshot.
 function characterStats(){
  const stats=momoStats(),number=value=>Number(value.toFixed(2)).toLocaleString(I18n.locale,{maximumFractionDigits:2}),
   rows=[['text.health',CampHealth.number(player.hp)+' / '+CampHealth.number(player.maxHp)],
    ['binding.action.attack',number(playerAttackDamage('normal'))],['binding.action.heavyAttack',number(playerAttackDamage('heavy'))]],
   list=$('inventoryStats');
  list.replaceChildren();
  for(const [key,value] of rows){
   const row=document.createElement('div'),label=document.createElement('span'),amount=document.createElement('strong');
   row.className='inventory-stat';row.dataset.stat=key;label.textContent=I18n.t(key);amount.textContent=value;
   row.append(label,amount);list.append(row);
  }
  const armor=document.createElement('div');armor.className='inventory-stat inventory-stat-armor';armor.dataset.stat='service.armor';
  armor.textContent=I18n.format('service.armor',[number(stats.armor),number(Armor.reduction(stats.armor)*100)]);list.append(armor);
 }
 function itemIcon(id){
  const canvas=document.createElement('canvas');canvas.className='inventory-icon';canvas.setAttribute('aria-hidden','true');
  const art=itemArt(id);image(canvas,Visuals.images[art.image],art,{w:112,h:112});
  return canvas;
 }
 function weaponName(style=weaponStyle){return I18n.t(style==='katana'&&defeated[1]?'item.dawnblade':'weapon.'+style+'.item');}
 function details(id){
  const style=id==='weapon'?weaponStyle:weaponStyleFor(id),weapon=!!style,item=catalogue[id==='equippedTalisman'?talisman:id],healing=Merchant.healingItems.includes(id);
  $('inventoryDetailName').textContent=weapon?weaponName(style):id?itemName(id):I18n.t('inventory.empty.title');
  $('inventoryDetailType').textContent=I18n.t(weapon?(id==='weapon'?'inventory.type.equipped':'inventory.weapon.slot'):isTalisman(id)?'inventory.talisman.slot':id==='forestHerb'?'inventory.type.backpack':item?.stack?'inventory.type.consumable':item?.category==='travelGear'?'inventory.type.travelGear':item?.category==='trinket'?'inventory.type.trinket':id?'inventory.type.quest':'inventory.type.backpack');
  const damage=kind=>momoStats().damage*WeaponStyles.attack(style,SWORD_ATTACKS[kind]).damageScale;
  $('inventoryDetailText').textContent=weapon?I18n.format('weapon.description',[damage('normal'),damage('heavy')]):id?Merchant.description(id==='equippedTalisman'?talisman:id):I18n.t('inventory.empty.body');
  $('inventoryQuantity').hidden=!item?.stack;
  $('inventoryQuantity').textContent=item?.stack?I18n.format('merchant.quantity',[quantity(id)]):'';
  $('useInventoryItem').hidden=!healing&&!(weapon&&id!=='weapon')&&!isTalisman(id);
  $('useInventoryItem').disabled=isTalisman(id)?false:id==='tea'?!Merchant.canDrink():id==='healingBrew'?!Merchant.canUseBrew():!quantity(id);
  $('useInventoryItem').textContent=I18n.t(isTalisman(id)?(equippedTalisman?'inventory.talisman.unequip':'service.equip'):weapon?'service.equip':id==='tea'||id==='healingBrew'?'merchant.drink':'merchant.eat');
  $('assignQuickHeal').hidden=!healing;$('assignQuickHeal').disabled=id===quickHeal||!quantity(id);
  $('assignQuickHeal').textContent=I18n.t('merchant.quick.assign');
  $('inventoryQuickHeal').textContent=I18n.format('merchant.quick.selected',[bindingKeyLabel(Bindings.read('useMeat')[0])+' · '+I18n.t('item.'+quickHeal)+' ×'+Merchant.stock(quickHeal)]);
  pendingSale=null;$('inventorySaleConfirm').hidden=true;
  const price=Merchant.salePrice(id);
  $('sellInventoryItem').hidden=!id||weapon||!price;
  $('sellInventoryItem').disabled=!Merchant.canSell(id);
  $('sellInventoryItem').textContent=I18n.format('merchant.sell.price',[price]);
  $('inventorySellHint').textContent=!id||weapon?'':!price?I18n.t('merchant.unsellable'):!Merchant.nearVendor()?I18n.t('merchant.sell.visit'):'';
  $('confirmInventorySale').textContent=I18n.t('merchant.sell.confirm');$('cancelInventorySale').textContent=I18n.t('merchant.sell.cancel');
 }
 function choose(id){selected=id;for(const button of document.querySelectorAll('#inventory [data-inventory-item]'))button.setAttribute('aria-pressed',String(button.dataset.inventoryItem===id));details(id);}
 function render(){
  renderId++;
  const saleFocused=['sellInventoryItem','confirmInventorySale','cancelInventorySale'].includes(document.activeElement?.id);
  const items=contents(),active=document.activeElement?.dataset?.inventoryItem,useFocused=document.activeElement?.id==='useInventoryItem',assignFocused=document.activeElement?.id==='assignQuickHeal';
  $('inventoryTradeStatus').textContent='';
  const labels={inventoryTitle:'inventory.title',inventoryPaused:'inventory.paused',inventoryBagTitle:'inventory.bag.title',inventoryCapacity:'inventory.capacity',inventoryEquipmentTitle:'inventory.equipment.title',inventoryWeaponLabel:'inventory.weapon.slot',inventoryEquipped:'inventory.equipped',closeInventory:'inventory.close'};
  for(const [id,key] of Object.entries(labels))$(id).textContent=I18n.t(key);
  $('inventoryButton').setAttribute('aria-label',I18n.t('inventory.open'));
  $('inventoryButton').title=`${I18n.t('inventory.open')} (${bindingKeyLabel(Bindings.read('inventory')[0])})`;
  $('inventoryMomo').setAttribute('aria-label',I18n.t('inventory.character'));
  equipmentArt();characterStats();
  $('inventoryCount').textContent=I18n.format('inventory.count',[items.length]);
  const grid=$('inventoryGrid');grid.replaceChildren();
  for(const id of items){
   const button=document.createElement('button');button.type='button';button.className='inventory-item';button.dataset.inventoryItem=id;
   const label=document.createElement('span');label.textContent=itemName(id);button.append(itemIcon(id),label);
   if(catalogue[id]?.stack){const count=document.createElement('span');count.className='inventory-quantity';count.textContent='×'+quantity(id);button.append(count);button.setAttribute('aria-label',itemName(id)+' · '+I18n.format('merchant.quantity',[quantity(id)]));}
   button.addEventListener('click',()=>choose(id));grid.append(button);
  }
  $('inventoryEmpty').hidden=items.length>0;$('inventoryEmpty').textContent=I18n.t('inventory.empty.title');
  $('inventoryWeaponName').textContent=weaponName();$('inventoryWeapon').setAttribute('aria-label',I18n.format('inventory.weapon.label',[weaponName()]));
  choose(selected==='weapon'||selected==='equippedTalisman'&&equippedTalisman||items.includes(selected)?selected:items[0]||null);
  if(useFocused&&(Merchant.healingItems.includes(selected)||weaponStyleFor(selected))&&!$('useInventoryItem').disabled&&!$('useInventoryItem').hidden)$('useInventoryItem').focus();
  else if(active||useFocused||assignFocused||saleFocused){const next=document.querySelector(`#inventory [data-inventory-item="${active||selected}"]`)||document.querySelector(`#inventory [data-inventory-item="${selected}"]`);(next||$('closeInventory')).focus();}
 }
 function open(){
  if(state!=='play'||!player)return false;
  returnFocus=document.activeElement;keys.clear();pressed.clear();state='inventory';$('inventory').hidden=false;render();$('closeInventory').focus();return true;
 }
 function close(){
  if(state!=='inventory')return false;
  pendingSale=null;renderId++;$('inventory').hidden=true;state='play';keys.clear();pressed.clear();
  if(returnFocus?.isConnected&&typeof returnFocus.focus==='function')returnFocus.focus();else $('inventoryButton').focus();return true;
 }
 function init(){
  if(initialized)return;initialized=true;
  $('inventoryButton').onclick=open;$('closeInventory').onclick=close;$('inventoryWeapon').onclick=()=>choose('weapon');$('inventoryTalisman').onclick=()=>{if(equippedTalisman)choose('equippedTalisman');};
  $('useInventoryItem').onclick=()=>{
   if(state!=='inventory')return;
   const style=weaponStyleFor(selected);
   if(isTalisman(selected)){const next=equippedTalisman?null:talisman;if(SerpentRelics.equip(next)){selected=next?'equippedTalisman':talisman;render();}}
   else if(style){const previous=selected;selected='weapon';if(!CampWorkshop.equipOwned(style))choose(previous);}
   else if(selected==='roastMeat')Merchant.eat(true);else if(selected==='tea')Merchant.drink(true);else if(selected==='healingBrew')Merchant.useBrew(true);
  };
  $('sellInventoryItem').onclick=()=>{
   if(!Merchant.canSell(selected))return;
   pendingSale={id:selected,token:renderId};$('inventorySalePrompt').textContent=I18n.format('merchant.sell.question',[I18n.t(catalogue[selected].name)]);
   $('inventorySaleConfirm').hidden=false;$('confirmInventorySale').focus();
  };
  $('confirmInventorySale').onclick=()=>{const sale=pendingSale;pendingSale=null;if(sale&&sale.token===renderId&&sale.id===selected)Merchant.sell(sale.id);};
  $('cancelInventorySale').onclick=()=>{pendingSale=null;$('inventorySaleConfirm').hidden=true;$('sellInventoryItem').focus();};
  $('assignQuickHeal').onclick=()=>Merchant.selectQuick(selected);
  $('inventory').addEventListener('keydown',event=>{
   if(event.key!=='Tab'||state!=='inventory')return;
   const nodes=[...$('inventory').querySelectorAll('button:not([disabled]),[tabindex="0"]')].filter(node=>!node.hidden&&node.getClientRects().length);
   if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  const repaint=()=>{if(state==='inventory')render();};Visuals.ready.then(repaint);
  window.addEventListener('resize',()=>{if(state==='inventory')render();});
 }
 return Object.freeze({init,open,close,render,contents,quantity,itemIcon});
})();
