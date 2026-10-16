/* Developer utilities, reached outside the player menus. */
'use strict';
const DevTools=(()=>{
 const tools=new Map();
 let initialized=false,opened=false,session=0,origin='menu',returnFocus=null,message='';
 let inertSiblings=[];
 const node=id=>document.getElementById(id);
 function text(id,key){node(id).textContent=I18n.t(key);}
 function refresh(){
  if(!initialized)return;
  for(const [id,key] of Object.entries({devEyebrow:'dev.eyebrow',devTitle:'dev.title',devIntro:'dev.intro',devClose:'dev.close',devEmpty:'dev.empty'}))text(id,key);
  node('devVersion').textContent=I18n.format('dev.version',[GAME_RELEASE.version]);
  node('devStatus').textContent=message?I18n.t(message):'';node('devStatus').hidden=!message;
  const list=node('devToolsList');list.replaceChildren();
  const currentSession=session;
  if(opened)for(const tool of tools.values()){
   const button=document.createElement('button');button.type='button';button.textContent=I18n.t(tool.labelKey);
   button.disabled=!!tool.available&&!tool.available();
   button.onclick=()=>{
    if(!opened||currentSession!==session||state!=='developer'||tool.available&&!tool.available())return;
    try{tool.run();refresh();}catch{message='dev.toolError';refresh();}
   };
   list.append(button);
  }
  node('devEmpty').hidden=tools.size>0;
 }
 function register(tool){
  if(!tool||!/^[-a-z0-9]+$/.test(tool.id)||typeof tool.labelKey!=='string'||typeof tool.run!=='function'||tool.available!==undefined&&typeof tool.available!=='function'||tools.has(tool.id))throw Error('Invalid developer tool registration');
  tools.set(tool.id,Object.freeze({...tool}));if(opened)refresh();
 }
 function open(){
  if(!initialized)return false;if(opened)return true;
  if(!['menu','play','pause'].includes(state))return false;
  origin=state;returnFocus=document.activeElement;opened=true;session++;message='';state='developer';keys.clear();pressed.clear();
  inertSiblings=[...node('game').children].filter(child=>child!==node('devPanel')).map(child=>[child,child.inert]);
  for(const [child] of inertSiblings)child.inert=true;
  node('devPanel').hidden=false;node('devPanel').scrollTop=0;refresh();node('devClose').focus();return true;
 }
 function close(){
  if(!opened)return false;opened=false;session++;message='';refresh();node('devPanel').hidden=true;
  for(const [child,wasInert] of inertSiblings)child.inert=wasInert;inertSiblings=[];
  state=origin;keys.clear();pressed.clear();
  if(window.location?.hash==='#devtools')window.history.replaceState(null,'',window.location.pathname+window.location.search);
  if(returnFocus?.isConnected&&returnFocus.matches?.('button,a[href],input,select,textarea,summary,[tabindex]')&&!returnFocus.disabled&&!returnFocus.closest('[inert]')&&returnFocus.getClientRects().length)returnFocus.focus();
  else node(origin==='menu'?'startButton':origin==='pause'?'resumeButton':'pauseButton').focus();
  return true;
 }
 function init(){
  if(initialized)return;initialized=true;
  node('devClose').onclick=close;
  node('devPanel').addEventListener('keydown',event=>{
   if(!opened)return;
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();return;}
   if(event.key!=='Tab')return;
   const controls=[...node('devPanel').querySelectorAll('input:not([disabled]),button:not([disabled])')].filter(control=>control.getClientRects().length);
   if(!controls.length)return;const first=controls[0],last=controls[controls.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  const fromHash=()=>{if(window.location?.hash==='#devtools')open();};
  window.addEventListener('hashchange',fromHash);I18n.onChange(refresh);refresh();fromHash();
 }
 return Object.freeze({init,open,close,register,refresh,get menuBackground(){return opened&&origin==='menu';}});
})();
