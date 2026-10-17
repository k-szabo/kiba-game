'use strict';
const DevImmortality=(()=>{
 let enabled=false;
 const active=()=>DevSession.active&&enabled;
 function refresh(){const notice=$('devInvincibleNotice');notice.hidden=!active();notice.textContent=I18n.t('dev.immortal')+' · '+I18n.t('dev.on');}
 function toggle(){if(!DevSession.active||state!=='developer'||!DevTools.isOpen)return false;enabled=!enabled;refresh();return true;}
 function init(){
  DevTools.register({id:'invincibility',labelKey:'dev.immortal',available:()=>DevSession.active,toggled:active,run:toggle});
  DevSession.onEnd(()=>{enabled=false;refresh();});I18n.onChange(refresh);refresh();
 }
 return Object.freeze({init,toggle,get active(){return active();}});
})();
