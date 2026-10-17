/* Encounter replays are restricted to the in-memory developer character. */
'use strict';
const DevBoss=(()=>{
 const available=()=>DevSession.active&&!!player&&(Prologue.active||level===levels[realm]);
 function revive(){
  if(!available()||state!=='developer'||!DevTools.isOpen)return false;
  if(Prologue.active){Prologue.start();state='developer';DevTools.setReturnState('play');return true;}
  clearEncounterEffects();defeated[realm]=false;resetBossBattle();
  const rest=level.rests.find(r=>r.id===level.arena.restId)||level.rests[0];
  checkpoint={...rest};initPlayer(rest);particles=[];projectiles=[];drops=[];visits.delete('boss');
  const a=level.arena;
  // Choose the arena floor on the approach side, with no teleport into the boss.
  const floor=platforms.find(p=>!p.broken&&Math.abs(p.y-a.y)<2&&p.x<=a.x+70&&p.x+p.w>=a.x+70);
  if(floor)initPlayer({x:a.x+70,y:floor.y});
  bossStarted=true;resetCamera();updateHUD();DevTools.setReturnState('play');return true;
 }
 function init(){DevTools.register({id:'boss-revive',labelKey:'dev.boss',available,run:revive});}
 return Object.freeze({init,revive});
})();
