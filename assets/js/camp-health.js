/* Shared health presentation retains fractional damage without inventing HP. */
'use strict';
const CampHealth=(()=>{
 function number(hp){return (Math.ceil(Math.max(0,hp)*10-1e-9)/10).toLocaleString(I18n.locale,{maximumFractionDigits:1});}
 function render(node,hp,maxHp){
  if(maxHp>20){node.innerHTML='<span aria-hidden="true">♥</span><span class="health-count">'+number(hp)+' / '+number(maxHp)+'</span>';node.setAttribute('aria-label',I18n.format('message.arg0.of.arg1.health',[number(hp),number(maxHp)]));return;}
  node.innerHTML=Array.from({length:Math.ceil(maxHp)},(_,i)=>{
   const fill=Math.max(0,Math.min(1,hp-i));
   if(fill>=1)return '<span>♥</span>';
   if(fill<=0)return '<span class="empty">♥</span>';
   return '<span style="position:relative;display:inline-block"><span class="empty">♥</span><span style="position:absolute;inset:0;clip-path:inset(0 '+((1-fill)*100)+'% 0 0)">♥</span></span>';
  }).join('');
  node.setAttribute('aria-label',I18n.format('message.arg0.of.arg1.health',[number(hp),number(maxHp)]));
 }
 return Object.freeze({number,render});
})();
