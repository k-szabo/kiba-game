/* Rescued villagers' services use atomic rules and recheck their live location. */
'use strict';
const CampWorkshop=(()=>{
 let opened=false,revision=0,returnFocus=null,initialized=false;
 const owner=()=>level.service==='forge'?'smith':level.service==='herbal'?'herbalist':'enchanter';
 const accessible=()=>!!level.service&&!Prologue.active&&(DevSession.active||flags[0].includes(owner()+'Rescued'))&&pointNear(level.servicePoint,120,100);
 const kind=()=>level.service;
 function cancel(){opened=false;revision++;$('campService').hidden=true;}
 function close(){if(!opened)return false;cancel();state='play';keys.clear();pressed.clear();if(returnFocus?.isConnected)returnFocus.focus();else $('pauseButton').focus();return true;}
 function equipOwned(id){
  if(!['inventory','campService'].includes(state)||Prologue.active||!campServices.ownedWeapons.includes(id)||!WeaponEquipment.equip(id))return false;
  persist();updateHUD();if(state==='inventory')Inventory.render();else render();return true;
 }
 function action(request){
  if(!opened||state!=='campService'||$('campService').hidden||!accessible())return false;
  if(request.type==='uniteScales')return kind()==='mystic'&&SerpentRelics.unite();
  if(request.type==='equip')return equipOwned(request.weapon);
  const outcome=CampServiceRules.transact(campServices,coins,request,{equipped:weaponStyle,smithRescued:(flags[0].includes('smithRescued')||DevSession.active)&&kind()==='forge',herbalistRescued:(flags[0].includes('herbalistRescued')||DevSession.active)&&kind()==='herbal'});
  if(!outcome.ok){if(outcome.reason==='insufficientCoins')$('campServiceStatus').textContent=I18n.t('merchant.insufficient');if(outcome.reason==='insufficientHerbs')$('campServiceStatus').textContent=I18n.t('service.herbs.insufficient');return false;}
  campServices=outcome.state;coins=outcome.coins;persist();updateHUD();render();return true;
 }
 function button(parent,label,request,disabled=false){
  const node=document.createElement('button'),token=revision;node.type='button';node.id='campAction-'+(request.type||'placeholder')+'-'+(request.weapon||'');node.textContent=label;node.disabled=disabled;
  node.onclick=()=>{if(token!==revision)return;action(request);};parent.append(node);return node;
 }
 function render(){
  if(!opened)return;const focused=document.activeElement?.id;revision++;
  const content=$('campServiceContent');content.replaceChildren();$('campServiceTitle').textContent=I18n.t(level.name);
  $('campServiceCoins').textContent=I18n.t('merchant.coins')+': '+coins;$('closeCampService').textContent=I18n.t('inventory.close');$('campServiceStatus').textContent='';
  if(kind()==='forge'){
   for(const [field,label,type] of [['weaponRank','service.forge.weapon','forgeWeapon'],['armorRank','service.forge.armor','forgeArmor']]){
    const rank=campServices[field],price=CampServiceRules.price(rank),row=document.createElement('section');row.className='camp-service-row';
    const title=document.createElement('h3');title.textContent=I18n.t(label)+' · '+I18n.format('service.rank',[rank]);row.append(title);
    button(row,price===null?I18n.format('service.rank',[rank]):I18n.format('merchant.buy',[price]),{type},price===null||coins<price);content.append(row);
   }
   const protection=document.createElement('p');protection.textContent=I18n.format('service.armor',[momoStats().armor,Math.round(Armor.reduction(momoStats().armor)*100)]);content.append(protection);
   for(const id of WeaponStyles.ids){
    const row=document.createElement('section');row.className='camp-service-row';const title=document.createElement('h3');title.textContent=I18n.t('weapon.'+id+'.item');row.append(title);
    if(campServices.ownedWeapons.includes(id)){
     button(row,I18n.t('service.equip'),{type:'equip',weapon:id},id===weaponStyle);
     button(row,I18n.format('service.sell',[CampServiceRules.profile.weaponSell]),{type:'sellWeapon',weapon:id},id===weaponStyle||campServices.ownedWeapons.length<2);
     if(id===weaponStyle){const hint=document.createElement('p');hint.textContent=I18n.t('service.sell.equipped');row.append(hint);}
    }else button(row,I18n.format('merchant.buy',[CampServiceRules.profile.weaponBuy]),{type:'buyWeapon',weapon:id},coins<CampServiceRules.profile.weaponBuy);
    content.append(row);
   }
   button(content,I18n.t('service.relics'),{},true);
  }else if(kind()==='herbal'){
   const text=document.createElement('p');text.textContent=I18n.t('camp.herbal.quest');content.append(text);
   const stock=document.createElement('p');stock.textContent=I18n.t('item.forestHerb')+' ×'+campServices.herbs+' · '+I18n.t('item.healingBrew')+' ×'+campServices.potions;content.append(stock);
   button(content,I18n.t('service.brew'),{type:'brew'},campServices.herbs<3||campServices.potions>=Number.MAX_SAFE_INTEGER);
  }else{button(content,I18n.t('service.enchant'),{},true);const text=document.createElement('p');text.textContent=I18n.t(SerpentRelics.united()?'serpent.fusion.complete':'serpent.fusion.requires');content.append(text);button(content,I18n.t('serpent.fusion.action'),{type:'uniteScales'},!SerpentRelics.canUnite());}
  if(focused?.startsWith('campAction-')){const node=$(focused);if(node?.isConnected&&!node.disabled)node.focus();else $('closeCampService').focus();}
 }
 function open(service){
  if(state!=='play'||!accessible()||service!==kind())return false;
  if(service==='herbal'&&!flags[0].includes('herbalistQuestAccepted')){flags[0].push('herbalistQuestAccepted');persist();}
  returnFocus=document.activeElement;opened=true;state='campService';keys.clear();pressed.clear();$('campService').hidden=false;render();$('closeCampService').focus();return true;
 }
 function init(){
  if(initialized)return;initialized=true;$('closeCampService').onclick=close;
  $('campService').addEventListener('keydown',event=>{
   if(state!=='campService')return;
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();return;}
   if(event.key==='Tab'){
    const nodes=[...$('campService').querySelectorAll('button:not([disabled]),[tabindex="0"]')].filter(n=>n.getClientRects().length);
    const index=nodes.indexOf(document.activeElement);if(nodes.length){event.preventDefault();nodes[(index+(event.shiftKey?-1:1)+nodes.length)%nodes.length].focus();}
   }
  });I18n.onChange(()=>{if(opened)render();});
 }
 return Object.freeze({init,open,close,cancel,render,action,equipOwned});
})();
