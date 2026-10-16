/* Optional client-side developer gate. It is not an authoritative security boundary. */
'use strict';
const DevTools=(()=>{
 const tools=new Map();
 let initialized=false,opened=false,authenticated=false,busy=false,epoch=0,origin='menu',returnFocus=null,message='',timer=null;
 let inertSiblings=[];
 const node=id=>document.getElementById(id);
 const configured=()=>DEV_AUTH.enabled===true&&DEV_AUTH.version===1&&DEV_AUTH.algorithm==='PBKDF2-SHA256'&&DEV_AUTH.iterations===600000&&/^[A-Za-z0-9+/]{22}==$/.test(DEV_AUTH.salt)&&/^[A-Za-z0-9+/]{43}=$/.test(DEV_AUTH.verifier);
 const supported=()=>typeof crypto!=='undefined'&&!!crypto.subtle;
 function text(id,key){node(id).textContent=I18n.t(key);}
 function refresh(){
  if(!initialized)return;
  for(const [id,key] of Object.entries({devEyebrow:'dev.eyebrow',devTitle:'dev.title',devIntro:'dev.intro',devPasswordLabel:'dev.password',devUnlock:'dev.unlock',devClose:'dev.close',devLock:'dev.lock',devEmpty:'dev.empty'}))text(id,key);
  node('devVersion').textContent=I18n.format('dev.version',[GAME_RELEASE.version]);
  node('devLogin').hidden=authenticated;node('devWorkspace').hidden=!authenticated;
  node('devPassword').disabled=busy||!configured()||!supported();node('devUnlock').disabled=busy||!configured()||!supported();
  node('devPanel').setAttribute('aria-busy',String(busy));
  node('devStatus').textContent=I18n.t(message||(!configured()?'dev.unconfigured':!supported()?'dev.unsupported':authenticated?'dev.authenticated':'dev.locked'));
  const list=node('devToolsList');list.replaceChildren();
  if(authenticated)for(const tool of tools.values()){
   const button=document.createElement('button');button.type='button';button.textContent=I18n.t(tool.labelKey);
   button.disabled=!!tool.available&&!tool.available();
   button.onclick=()=>{
    if(!opened||!authenticated||state!=='developer'||busy||tool.available&&!tool.available())return;
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
 function lock(){
  epoch++;authenticated=false;busy=false;message='';clearTimeout(timer);timer=null;
  node('devPassword').value='';refresh();if(opened)(configured()&&supported()?node('devPassword'):node('devClose')).focus();
 }
 async function unlock(event){
  event.preventDefault();if(!opened||authenticated||busy||!configured()||!supported())return;
  const password=node('devPassword').value;node('devPassword').value='';
  if(!password||password.length>1024){message='dev.invalid';refresh();return;}
  const attempt=++epoch;busy=true;message='dev.checking';refresh();
  try{
   const decode=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
   const bytes=new TextEncoder().encode(password);
   let key;try{key=await crypto.subtle.importKey('raw',bytes,'PBKDF2',false,['deriveBits']);}finally{bytes.fill(0);}
   const actual=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:decode(DEV_AUTH.salt),iterations:DEV_AUTH.iterations},key,256)),expected=decode(DEV_AUTH.verifier);
   let mismatch=actual.length^expected.length;for(let i=0;i<actual.length;i++)mismatch|=actual[i]^expected[i];actual.fill(0);expected.fill(0);
   if(!opened||attempt!==epoch)return;
   if(mismatch){message='dev.invalid';refresh();timer=setTimeout(()=>{if(opened&&epoch===attempt){busy=false;refresh();node('devPassword').focus();}},2000);return;}
   authenticated=true;busy=false;message='';refresh();node('devLock').focus();
  }catch{
   if(!opened||attempt!==epoch)return;busy=false;message='dev.unsupported';refresh();node('devClose').focus();
  }
 }
 function open(){
  if(!initialized)return false;if(opened)return true;
  if(!['menu','play','pause'].includes(state))return false;
  origin=state;returnFocus=document.activeElement;opened=true;state='developer';keys.clear();pressed.clear();
  inertSiblings=[...node('game').children].filter(child=>child!==node('devPanel')).map(child=>[child,child.inert]);
  for(const [child] of inertSiblings)child.inert=true;
  node('devPanel').hidden=false;node('devPanel').scrollTop=0;lock();return true;
 }
 function close(){
  if(!opened)return false;opened=false;lock();node('devPanel').hidden=true;
  for(const [child,wasInert] of inertSiblings)child.inert=wasInert;inertSiblings=[];
  state=origin;keys.clear();pressed.clear();
  if(window.location?.hash==='#devtools')window.history.replaceState(null,'',window.location.pathname+window.location.search);
  if(returnFocus?.isConnected&&returnFocus.matches?.('button,a[href],input,select,textarea,summary,[tabindex]')&&!returnFocus.disabled&&!returnFocus.closest('[inert]')&&returnFocus.getClientRects().length)returnFocus.focus();
  else node(origin==='menu'?'startButton':origin==='pause'?'resumeButton':'pauseButton').focus();
  return true;
 }
 function init(){
  if(initialized)return;initialized=true;
  node('devLogin').addEventListener('submit',unlock);node('devClose').onclick=close;node('devLock').onclick=lock;
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
 return Object.freeze({init,open,close,register,lock,refresh,get menuBackground(){return opened&&origin==='menu';}});
})();
