/* A pending journey choice is committed only after awakening and confirmation. */
'use strict';
const WeaponSelection=(()=>{
 const styles=WeaponStyles.ids;
 let selected='katana',initialized=false,inertSiblings=[];
 const root=()=>$('weaponSelection');
 const choices=()=>[...root().querySelectorAll('[data-weapon-style]')];
 function refresh(){
  if(!root())return;
  for(const id of ['title','help','begin','back'])$('weaponChoose'+id[0].toUpperCase()+id.slice(1)).textContent=I18n.t('weapon.choose.'+id);
  for(const button of choices()){
   const style=button.dataset.weaponStyle,checked=style===selected;
   button.setAttribute('aria-checked',String(checked));button.tabIndex=checked?0:-1;
   button.querySelector('strong').textContent=I18n.t('weapon.'+style+'.name');
   button.querySelector('span').textContent=I18n.t('weapon.'+style+'.description');
  }
 }
 function select(style,focus=false){if(!styles.includes(style))return false;selected=style;refresh();if(focus)choices().find(button=>button.dataset.weaponStyle===style)?.focus();return true;}
 function cancel(){
  root().hidden=true;
  for(const [child,wasInert] of inertSiblings)child.inert=wasInert;
  inertSiblings=[];keys.clear();pressed.clear();
 }
 function open(){
  if(state!=='play'||resolutionBlocked||!weaponChoicePending||Prologue.active||DevSession.active)return false;
  selected='katana';state='weaponSelection';keys.clear();pressed.clear();
  $('releaseNotes').open=false;
  inertSiblings=[...$('game').children].filter(child=>child!==root()).map(child=>[child,child.inert]);
  for(const [child] of inertSiblings)child.inert=true;
  root().hidden=false;refresh();root().querySelector('.weapon-selection-panel').scrollTop=0;choices()[0]?.focus({preventScroll:true});return true;
 }
 function close(){
  if(state!=='weaponSelection'||root().hidden)return false;
  cancel();mainMenu();$('startButton').focus();return true;
 }
 function confirm(){
  if(state!=='weaponSelection'||root().hidden||resolutionBlocked||!weaponChoicePending||DevSession.active||Prologue.active)return false;
  if(!WeaponEquipment.equip(selected))return false;
  campServices=CampServiceRules.fresh(selected);weaponChoicePending=false;cancel();
  // This is the fresh journey's initial loadout, before Momo can move or fight.
  initPlayer(checkpoint);state='play';persist();updateHUD();$('pauseButton').focus();return true;
 }
 function keydown(event){
  if(state!=='weaponSelection'||resolutionBlocked)return;
  event.stopImmediatePropagation();
  if(event.repeat){event.preventDefault();return;}
  if(event.key==='Escape'){event.preventDefault();close();return;}
  const nodes=[...choices().filter(button=>button.tabIndex===0),$('weaponChooseBegin'),$('weaponChooseBack')];
  if(event.key==='Tab'){
   event.preventDefault();const current=nodes.indexOf(document.activeElement);
   nodes[(current+(event.shiftKey?-1:1)+nodes.length)%nodes.length].focus();return;
  }
  const button=document.activeElement;
  if(button?.hasAttribute('data-weapon-style')&&['ArrowLeft','ArrowUp','ArrowRight','ArrowDown','Home','End'].includes(event.key)){
   event.preventDefault();let index=styles.indexOf(selected);
   index=event.key==='Home'?0:event.key==='End'?styles.length-1:(index+(['ArrowLeft','ArrowUp'].includes(event.key)?-1:1)+styles.length)%styles.length;
   select(styles[index],true);
  }
 }
 function init(){
  if(initialized)return;initialized=true;
  for(const button of choices())button.addEventListener('click',()=>select(button.dataset.weaponStyle));
  $('weaponChooseBack').addEventListener('click',close);$('weaponChooseBegin').addEventListener('click',confirm);
  addEventListener('keydown',keydown,true);I18n.onChange(refresh);refresh();
 }
 return Object.freeze({init,open,close,cancel,refresh,select,confirm});
})();
