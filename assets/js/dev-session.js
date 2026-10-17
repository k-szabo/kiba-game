/* In-memory developer runs never replace normal progression or stored records. */
'use strict';
const DevSession=(()=>{
 let active=false,normalSave=null,initialized=false;
 const endHandlers=new Set();
 const clone=value=>value?JSON.parse(JSON.stringify(value)):null;
 const ready=()=>storageReady&&loadingReady&&Visuals.loaded===Visuals.total&&!Visuals.failures.length;
 function refresh(){
  const badge=$('devTestNotice');badge.hidden=!active;badge.textContent=I18n.t('dev.session.active');
  $('devSessionInfo').textContent=I18n.t('dev.session.info');
 }
 function begin(){
  if(state!=='developer'||!DevTools.isOpen||!ready())return false;
  if(active)return true;
  normalSave=clone(saved);active=true;
  if(DevTools.returnState==='menu'){
   const old=normalSave;
   abilities=old?[...old.abilities]:[false,false];defeated=old?[...old.defeated]:[false,false,false];
   flags=old?old.flags.map(f=>[...f]):[[],[],[]];visitedRests=old?old.visitedRests.map(f=>[...f]):[[],[],[]];
   shards=old?old.shards:0;progression=normalizeProgression(old?.progression);
   Prologue.stop();enterRealm(0);
  }else if(Prologue.active){Prologue.stop();enterRealm(0);}
  $('menu').hidden=true;$('pause').hidden=true;showHUD(true);DevTools.setReturnState('play');
  refresh();updateHUD();return true;
 }
 function end(){
  if(!active)return false;
  active=false;saved=clone(normalSave);normalSave=null;
  for(const handler of endHandlers)handler();
  if(DevTools.isOpen)DevTools.close();
  refresh();mainMenu();return true;
 }
 function init(){
  if(initialized)return;initialized=true;
  DevTools.register({id:'test-start',labelKey:'dev.session.start',available:()=>!active&&ready(),run:begin});
  DevTools.register({id:'test-end',labelKey:'dev.session.end',available:()=>active,run:end});
  I18n.onChange(refresh);refresh();
 }
 return Object.freeze({begin,end,init,refresh,onEnd(handler){endHandlers.add(handler);},get active(){return active;},get ready(){return ready();}});
})();
