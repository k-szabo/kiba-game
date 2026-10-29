/* Akash's shop and consumables share the persistent currency and item flags. */
'use strict';
const Merchant=(()=>{
 const catalogue=Object.freeze({
  roastMeat:Object.freeze({price:10,stack:true}),
  tea:Object.freeze({price:25,stack:true}),
  compass:Object.freeze({price:220}),
  minimap:Object.freeze({price:360}),
  phoneCase:Object.freeze({price:1500})
 });
 const rewards=Object.freeze({enemy:5,miniboss:20,boss:50});
 const healingItems=Object.freeze(['roastMeat','tea','healingBrew','roastChicken']);
 let initialized=false,returnFocus=null,renderId=0,teaElapsed=0,teaPulses=0;
 const rescued=()=>flags[1].includes('akashRescued');
 const dungeonItem=id=>typeof DungeonRules!=='undefined'&&Object.hasOwn(DungeonRules.items,id);
 const consumed=id=>{const by=ART_INVENTORY.items[id]?.consumedBy;return !!by&&flags[by.realm].includes(by.id);};
 const stock=id=>dungeonItem(id)?DungeonRun.stock(id):id==='roastMeat'?meatCount:id==='tea'?teaCount:id==='forestHerb'?campServices.herbs:id==='healingBrew'?campServices.potions:id==='roastChicken'?chickenCount:flags[1].includes(id)&&!soldItems.includes(id)&&!consumed(id)?1:0;
 function selectAvailable(){if(!healingItems.includes(quickHeal)||!stock(quickHeal))quickHeal=healingItems.find(id=>stock(id)>0)??null;return quickHeal;}
 function selectQuick(id){
  if(state!=='inventory'||!healingItems.includes(id)||!stock(id))return false;
  quickHeal=id;persist();Inventory.render();return true;
 }
 function useQuick(){if(state!=='play'||Prologue.active||!player||player.hp<=0)return false;selectAvailable();if(quickHeal===null)return false;return quickHeal==='roastChicken'?FiaQuest.eat():quickHeal==='healingBrew'?useBrew():quickHeal==='tea'?drink():eat();}
 function addStock(id){
  if(dungeonItem(id))return DungeonRun.addItem(id);
  if(![...healingItems,'forestHerb'].includes(id)||!Number.isSafeInteger(stock(id))||stock(id)<0||stock(id)>=Number.MAX_SAFE_INTEGER)return false;
  if(id==='roastMeat')meatCount++;else if(id==='tea')teaCount++;else if(id==='forestHerb')campServices.herbs++;else if(id==='healingBrew')campServices.potions++;else if(id==='roastChicken')chickenCount++;else return false;
  selectAvailable();
  return true;
 }
 const vendor=()=>forestCamp.npcs.find(n=>n.id==='akash');
 const nearVendor=()=>level===forestCamp&&rescued()&&pointNear(vendor(),95,85);
 function award(amount){
  if(!Number.isSafeInteger(amount)||amount<0)throw Error('Invalid coin reward');
  const gained=Math.min(amount,Number.MAX_SAFE_INTEGER-coins);coins+=gained;return gained;
 }
 function free(){
  if(state!=='play'||level!==yomi||rescued()||!pointNear(yomi.akash,100,85))return false;
  if(enemies.some(e=>e.group==='akash'&&!e.dead)){toast(I18n.t('merchant.guards'));return false;}
  flags[1].push('akashRescued');persist();updateHUD();
  story('merchant.name','camp.name','merchant.rescue.story',null,{right:'akash'});return true;
 }
 function description(id){return healingItems.includes(id)?I18n.format('inventory.description.'+id,[bindingKeyLabel(Bindings.read('useMeat')[0])]):I18n.t('inventory.description.'+id);}
 function purchase(id){
  if(state!=='shop'||$('shop').hidden||!nearVendor()||!Object.hasOwn(catalogue,id))return false;
  const product=catalogue[id];
  if(!product.stack&&stock(id))return false;
  if(coins<product.price||product.stack&&stock(id)===Number.MAX_SAFE_INTEGER)return false;
  coins-=product.price;if(product.stack)addStock(id);else{if(!flags[1].includes(id))flags[1].push(id);soldItems=soldItems.filter(item=>item!==id);}
  persist();updateHUD();render();$('shopStatus').textContent=I18n.t('merchant.purchased');return true;
 }
 function salePrice(id){return Object.hasOwn(MERCHANT_SALES,id)?MERCHANT_SALES[id].price:0;}
 function canSell(id){
  const price=salePrice(id);
  return state==='inventory'&&!$('inventory').hidden&&nearVendor()&&price>0&&Inventory.quantity(id)>0&&price<=Number.MAX_SAFE_INTEGER-coins;
 }
 function sell(id){
  if(!canSell(id))return false;
  const price=salePrice(id);
  if(dungeonItem(id)){if(!DungeonRun.removeItem(id))return false;}
  else if(id==='roastMeat')meatCount--;else if(id==='tea')teaCount--;else soldItems.push(id);
  selectAvailable();coins+=price;persist();updateHUD();Inventory.render();
  $('inventoryTradeStatus').textContent=I18n.t('merchant.sold');return true;
 }
 function eat(fromInventory=false){
  if(Prologue.active||!player||player.hp<=0||!meatCount||state!==(fromInventory?'inventory':'play'))return false;
  const delta=Math.random()<2/3?2:-1,before=player.hp;
  meatCount--;selectAvailable();player.hp=Math.max(Math.min(before,1),Math.min(player.maxHp,player.hp+delta));
  persist();updateHUD();
  toast(player.hp>before?I18n.format('merchant.health.up',[CampHealth.number(player.hp-before)]):I18n.t(player.hp<before?'merchant.health.down':'merchant.health.same'));
  if(fromInventory)Inventory.render();return true;
 }
 function canDrink(){return !Prologue.active&&!!player&&player.hp>0&&player.hp<player.maxHp&&teaCount>0&&teaPulses===0;}
 function drink(fromInventory=false){
  if(state!==(fromInventory?'inventory':'play')||!canDrink())return false;
  teaCount--;selectAvailable();teaElapsed=0;teaPulses=3;persist();updateHUD();if(fromInventory)Inventory.render();toast(I18n.t('merchant.tea.started'));return true;
 }
 function canUseBrew(){return !Prologue.active&&!!player&&player.hp>0&&player.hp<player.maxHp&&campServices.potions>0;}
 function useBrew(fromInventory=false){
  if(state!==(fromInventory?'inventory':'play')||!canUseBrew())return false;
  campServices.potions--;player.hp=Math.min(player.maxHp,player.hp+CampServiceRules.profile.brewHeal);selectAvailable();
  persist();updateHUD();if(fromInventory)Inventory.render();return true;
 }
 function resetTea(){teaElapsed=0;teaPulses=0;}
 function teaSnapshot(){return {elapsed:teaElapsed,pulses:teaPulses};}
 function restoreTea(value){if(!value||!Number.isFinite(value.elapsed)||value.elapsed<0||value.elapsed>=2||!Number.isInteger(value.pulses)||value.pulses<0||value.pulses>3)return false;teaElapsed=value.elapsed;teaPulses=value.pulses;return true;}
 function update(dt){
  if(state!=='play'||Prologue.active||!player||player.hp<=0||!teaPulses||!Number.isFinite(dt)||dt<=0)return;
  teaElapsed+=dt;
  while(teaPulses&&teaElapsed+1e-9>=2){teaElapsed=Math.max(0,teaElapsed-2);teaPulses--;player.hp=Math.min(player.maxHp,player.hp+1);updateHUD();}
  if(!teaPulses)teaElapsed=0;
 }
 function render(){
  const token=++renderId,focus=document.activeElement?.id;
  $('shopTitle').textContent=I18n.t('merchant.shop.title');$('shopIntro').textContent=I18n.t('merchant.greeting');
  $('shopCoins').textContent=I18n.t('merchant.coins')+': '+coins;
  $('closeShop').textContent=I18n.t('inventory.close');$('shopStatus').textContent='';
  $('shopSell').textContent=I18n.t('merchant.sell.title');
  const grid=$('shopItems');grid.replaceChildren();
  for(const [id,product]of Object.entries(catalogue)){
   const card=document.createElement('section');card.className='shop-item';
   if(Object.hasOwn(ART_INVENTORY.items,id))card.append(Inventory.itemIcon(id));
   const name=document.createElement('h3');name.textContent=I18n.t('item.'+id);
   const body=document.createElement('p');body.textContent=description(id);
   const button=document.createElement('button');button.id='buy-'+id;button.type='button';
   const owned=!product.stack&&stock(id)>0;
   button.disabled=!!owned||coins<product.price||product.stack&&stock(id)===Number.MAX_SAFE_INTEGER;
   button.textContent=owned?I18n.t('merchant.owned'):I18n.format('merchant.buy',[product.price]);
   button.onclick=()=>token===renderId&&purchase(id);card.append(name,body,button);grid.append(card);
  }
  if(focus){const next=document.getElementById(focus);if(next&&!next.disabled)next.focus();else if(focus.startsWith('buy-'))$('closeShop').focus();}
 }
 function open(){
  if(state!=='play'||!nearVendor())return false;
  returnFocus=document.activeElement;keys.clear();pressed.clear();state='shop';$('shop').hidden=false;render();$('shop').querySelector('.shop-panel').scrollTop=0;
  const focusTarget=$('shopItems').querySelector('button:not([disabled])')||$('closeShop');
  if(typeof focusTarget.focus==='function')focusTarget.focus({preventScroll:true});return true;
 }
 function close(){
  if(state!=='shop')return false;
  renderId++;$('shop').hidden=true;state='play';keys.clear();pressed.clear();
  if(returnFocus?.isConnected)returnFocus.focus();else $('pauseButton').focus();return true;
 }
 function init(){
  if(initialized)return;initialized=true;$('closeShop').onclick=close;
  $('shopSell').onclick=()=>{if(state==='shop'&&nearVendor()){close();Inventory.open();}};
  $('shop').addEventListener('keydown',event=>{
   if(state!=='shop'||event.key!=='Tab')return;
   const nodes=[...$('shop').querySelectorAll('button:not([disabled])')].filter(node=>node.getClientRects().length);
   const first=nodes[0],last=nodes.at(-1);if(!first)return;
   if(event.shiftKey&&(document.activeElement===first||!nodes.includes(document.activeElement))){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  I18n.onChange(()=>{if(state==='shop')render();});
 }
 function drawMinimap(){
  const box=$('minimap'),visible=!!player&&stock('minimap')>0&&!Prologue.active&&!['menu','won'].includes(state)&&!DevTools.menuBackground&&!(state==='help'&&helpOrigin==='menu');
  box.hidden=!visible;if(!visible||state!=='play')return;
  box.setAttribute('aria-label',I18n.t('item.minimap'));
  const canvas=$('minimapCanvas'),w=220,h=140,dpr=Math.max(1,Math.min(3,window.devicePixelRatio||1));
  if(canvas.width!==w*dpr||canvas.height!==h*dpr){canvas.width=w*dpr;canvas.height=h*dpr;}
  const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
  c.fillStyle='#101d29';c.fillRect(0,0,w,h);
  const scale=w/1100,X=x=>w/2+(x-player.x-player.w/2)*scale,Y=y=>h/2+(y-player.y-player.h)*scale;
  c.save();c.beginPath();c.rect(3,3,w-6,h-6);c.clip();
  c.strokeStyle='#d8c7a2';c.lineWidth=3;c.beginPath();
  for(const p of level.platforms){if(p.unmapped||p.secretArea&&!secretKnown(p.secretArea))continue;c.moveTo(X(p.x),Y(p.y));c.lineTo(X(p.x+p.w),Y(p.y));}c.stroke();
  c.fillStyle='#8ad8df';
  for(const rest of level.rests)if(visitedRests[realm].includes(rest.id)){c.beginPath();c.arc(X(rest.x),Y(rest.y),4,0,Math.PI*2);c.fill();}
  c.fillStyle='#ffcb74';c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.arc(w/2,h/2,4,0,Math.PI*2);c.fill();c.stroke();c.restore();
 }
 return Object.freeze({init,open,close,render,free,purchase,salePrice,canSell,sell,nearVendor,eat,drink,canDrink,useBrew,canUseBrew,healingItems,update,resetTea,addStock,selectQuick,selectAvailable,useQuick,teaSnapshot,restoreTea,award,stock,description,catalogue,rewards,rescued,drawMinimap});
})();
