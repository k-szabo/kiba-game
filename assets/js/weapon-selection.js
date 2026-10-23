/* New-journey choice is committed only when Begin is pressed. */
'use strict';
const WeaponSelection=(()=>{
 const styles=['katana','naginata','swordShield'];
 let selected='katana',initialized=false,returnFocus=null;
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
 function select(style,focus=false){if(!styles.includes(style))return;selected=style;refresh();if(focus)choices().find(button=>button.dataset.weaponStyle===style).focus();}
 function open(){
  if(state!=='menu'||resolutionBlocked)return false;
  returnFocus=document.activeElement;selected='katana';state='weaponSelection';keys.clear();pressed.clear();
  $('releaseNotes').open=false;$('menu').inert=true;root().hidden=false;refresh();
  root().querySelector('.weapon-selection-panel').scrollTop=0;choices()[0].focus({preventScroll:true});return true;
 }
 function close(){
  if(root().hidden)return;
  root().hidden=true;$('menu').inert=false;keys.clear();pressed.clear();state='menu';
  if(returnFocus?.isConnected)returnFocus.focus();else $('startButton').focus();
 }
 function keydown(event){
  if(state!=='weaponSelection'||resolutionBlocked)return;
  // Keep gameplay shortcuts and held keys out of this modal menu.
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
  $('weaponChooseBack').addEventListener('click',close);
  $('weaponChooseBegin').addEventListener('click',()=>{if(state!=='weaponSelection'||resolutionBlocked)return;const style=selected;close();startGame(false,style);});
  addEventListener('keydown',keydown,true);I18n.onChange(refresh);refresh();
 }
 return Object.freeze({init,open,close,refresh});
})();
