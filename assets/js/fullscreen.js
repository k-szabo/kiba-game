/* Native fullscreen is an interface preference, independent of saves or combat. */
'use strict';
const Fullscreen=(()=>{
 let initialized=false,pending=null,leaving=null,owned=false,escapeUntil=0;
 // Several game dialogs and the viewport warning are siblings of #game.
 const target=()=>document.documentElement;
 const active=()=>!!target()&&document.fullscreenElement===target();
 const focused=()=>!document.hidden&&(typeof document.hasFocus!=='function'||document.hasFocus());
 const inDuel=()=>typeof DuelMode!=='undefined'&&DuelMode.active;
 function clearInput(){keys.clear();pressed.clear();if(inDuel())DuelMode.releasePointer();}
 function pauseAdventure(){if(!inDuel()&&state==='play')pause();}
 function releasePointer(){if(document.pointerLockElement===canvas)try{document.exitPointerLock?.();}catch{}}
 function exit(){
  if(!active()||leaving)return false;
  // The property can reflect a grant before its queued change event arrives.
  // An immediate toggle/Escape still exits our own successful request.
  if(pending&&!pending.cancelled){owned=true;pending=null;}
  const token={};leaving=token;
  const failed=()=>{if(leaving===token)leaving=null;};
  try{const result=document.exitFullscreen?.();result?.catch?.(failed);}catch{failed();}
  return true;
 }
 function toggle(){
  if(!focused())return false;
  clearInput();
  if(active())return exit();
  if(pending||leaving||document.fullscreenElement||document.fullscreenEnabled===false||typeof target()?.requestFullscreen!=='function')return false;
  const token={cancelled:false};pending=token;
  const failed=()=>{if(pending===token)pending=null;};
  try{const result=target().requestFullscreen();result?.catch?.(failed);}catch{failed();}
  return true;
 }
 function changed(){
  if(active()){
   if(pending?.cancelled||pending&&!focused()){pending=null;exit();return;}
   if(pending){owned=true;pending=null;clearInput();}
  }else{
   // Native Escape can enter and leave between the two queued notifications.
   const lost=owned||!!pending&&!pending.cancelled;owned=false;pending=null;leaving=null;
   if(lost){clearInput();releasePointer();pauseAdventure();escapeUntil=performance.now()+250;}
  }
  if(typeof Cursor!=='undefined')Cursor.update();
 }
 const editing=event=>{const element=event.target||document.activeElement;return !!element?.isContentEditable||!!element?.closest?.('input,textarea,select,[contenteditable="true"],[contenteditable=""]');};
 function keydown(event){
  if(event.key?.toLowerCase()==='escape'&&(active()||pending||performance.now()<escapeUntil)){
   event.preventDefault();event.stopImmediatePropagation?.();clearInput();
   if(active())exit();else{if(pending)pending.cancelled=true;pauseAdventure();}
   return true;
  }
  if(!Bindings.shortcut('fullscreen',event)||editing(event)||typeof captureAction!=='undefined'&&captureAction)return false;
  event.preventDefault();event.stopImmediatePropagation?.();
  // Consume repeated chords too, without opening browser search or using F.
  if(!event.repeat)toggle();return true;
 }
 function cancelPending(){if(pending)pending.cancelled=true;}
 function init(){
  if(initialized)return;initialized=true;
  addEventListener('keydown',keydown,true);
  addEventListener('keyup',event=>{if(event.key?.toLowerCase()==='escape')escapeUntil=0;});
  addEventListener('blur',cancelPending);addEventListener('pagehide',cancelPending);
  document.addEventListener?.('visibilitychange',()=>{if(document.hidden)cancelPending();});
  document.addEventListener?.('fullscreenchange',changed);
  document.addEventListener?.('fullscreenerror',()=>{pending=null;leaving=null;});
 }
 return Object.freeze({init,toggle,keydown,active});
})();
