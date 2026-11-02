/* One lazily loaded menu theme, governed by the shared sound switch. */
'use strict';
const MenuMusic=(()=>{
 const source='assets/audio/main-menu-theme-v1.mp3';
 let track=null,eligible=()=>false,pending=false,blocked=false;
 function sync(gesture=false){
  const wanted=eligible()&&!document.hidden;
  if(!wanted){if(track){track.pause();}return;}
  if(blocked&&!gesture||pending)return;
  if(!track){
   if(typeof Audio!=='function')return;
   track=new Audio(source);track.loop=true;track.volume=.35;track.preload='none';
  }
  if(!track.paused)return;
  blocked=false;pending=true;
  try{Promise.resolve(track.play()).then(()=>{
   pending=false;
   // Loading can finish after leaving the menu or muting the game.
   if(!eligible()||document.hidden)track.pause();
  },()=>{pending=false;blocked=true;});}catch{pending=false;blocked=true;}
 }
 function init(allowed){
  eligible=allowed;
  document.addEventListener('visibilitychange',()=>sync());
  document.addEventListener('pointerdown',()=>sync(true));
  document.addEventListener('keydown',()=>sync(true));
  window.addEventListener('pagehide',()=>track?.pause());
 }
 return {init,sync};
})();
