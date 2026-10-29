/* Gameplay owns pointer lock only after a canvas gesture; UI always releases it. */
'use strict';
const Cursor=(()=>{
 let initialized=false,pending=null,owned=false,escapeUntil=0,duelFree=false;
 const locked=()=>document.pointerLockElement===canvas;
 const focused=()=>!document.hidden&&(typeof document.hasFocus!=='function'||document.hasFocus());
 const inDuel=()=>typeof DuelMode!=='undefined'&&DuelMode.active;
 const eligible=()=>!resolutionBlocked&&focused()&&(inDuel()?DuelMode.pointerPlayable:state==='play');
 const playing=()=>eligible()&&(!inDuel()||!duelFree);
 function clearInput(){keys.clear();pressed.clear();if(typeof DuelMode!=='undefined'&&DuelMode.active)DuelMode.releasePointer();}
 function release(){
  const hadInput=locked()||pending;pending=null;owned=false;
  if(hadInput)clearInput();
  if(locked())try{document.exitPointerLock?.();}catch{}
 }
 function request(event){
  if(event.isTrusted!==true||event.target!==canvas||!eligible()||locked()||pending||typeof canvas.requestPointerLock!=='function')return false;
  const token={};pending=token;duelFree=false;
  const failed=()=>{if(pending===token)pending=null;};
  try{const result=canvas.requestPointerLock();result?.catch?.(failed);}catch{failed();}
  return true;
 }
 function unlocked(){
  clearInput();escapeUntil=performance.now()+250;
  if(inDuel()){duelFree=true;DuelMode.releasePointer(true);}
  else if(state==='play')pause();
 }
 function changed(){
  if(locked()){
   // A request can finish after a dialog, blur or resize cancelled it. Even if
   // play has resumed, that stale grant must not capture the mouse again.
   if(!playing()||!owned&&!pending){release();update();return;}
   owned=true;pending=null;
  }else{const lost=owned;owned=false;if(lost)unlocked();}
  update();
 }
 function escape(event){
  if(event.key?.toLowerCase()!=='escape'||!locked()&&!pending&&performance.now()>=escapeUntil)return;
  event.preventDefault();event.stopImmediatePropagation?.();
  if(locked()||pending){release();unlocked();}
  update();
 }
 function suspend(){
  release();clearInput();if(state==='play')pause();update();
 }
 function update(){
  if(!inDuel())duelFree=false;
  if(!playing()&&(locked()||pending))release();
  const game=$('game');
  const mode=playing()?'hidden':'paw';
  if(game.dataset.gameCursor!==mode)game.dataset.gameCursor=mode;
 }
 function init(){
  if(initialized)return;initialized=true;
  document.addEventListener?.('pointerlockchange',changed);
  document.addEventListener?.('pointerlockerror',()=>{pending=null;});
  document.addEventListener?.('visibilitychange',()=>{if(document.hidden)suspend();});
  addEventListener('keydown',escape,true);
  addEventListener('keyup',event=>{if(event.key?.toLowerCase()==='escape')escapeUntil=0;});
  addEventListener('blur',suspend);addEventListener('pagehide',()=>{release();clearInput();});
  // Button actions run before bubbling reaches here, so menu transitions
  // cancel pending requests without waiting for the next animation frame.
  addEventListener('click',update);
 }
 function contextMenu(event){
  const game=$('game'),target=event.target;
  if(target!==canvas&&!game.contains?.(target))return false;
  event.preventDefault();return true;
 }
 return Object.freeze({init,update,request,escape,contextMenu});
})();
