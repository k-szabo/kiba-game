/* Encounter replays are restricted to the in-memory developer character. */
'use strict';
const DevBoss=(()=>{
 let encounter='main';
 const available=()=>DevSession.active&&!!player&&(Prologue.active||level===levels[realm]||level===samuraiCamp||level===shadowPrison||level===shadowArena);
 const encounters=()=>[...(Prologue.active||level===levels[realm]?[{id:'main',name:Prologue.active?'prologue.boss':realms[realm].boss}]:[]),
  ...(Prologue.active?[]:(level.arenaEncounters||level.enemies).filter(spec=>spec.miniboss).map(spec=>({id:spec.id,name:spec.name})))];
 function fields(){
  const options=encounters();if(!options.some(entry=>entry.id===encounter))encounter=options[0]?.id??'main';
  return [{id:'encounter',type:'select',labelKey:'dev.boss',value:encounter,options:options.map(entry=>({value:entry.id,label:entry.name})),change:value=>{if(encounters().some(entry=>entry.id===value))encounter=value;}}];
 }
 function revive(values){
  if(!available()||state!=='developer'||!DevTools.isOpen)return false;
  const target=values?.encounter??encounters()[0]?.id;if(!encounters().some(entry=>entry.id===target))return false;
  if(target!=='main')return reviveMiniboss(target);
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
 function reviveMiniboss(id){
  const specs=level.arenaEncounters||level.enemies,index=specs.findIndex(spec=>spec.id===id&&spec.miniboss);if(index<0)return false;
  const spec=specs[index];if(CampMaster.is(spec)&&level!==samuraiCamp)return false;
  const replay=CampMaster.is(spec)?CampMaster.create(spec):createEnemy(spec,index),a=replay.arena;
  const floor=platforms.find(p=>!p.broken&&Math.abs(p.y-a.y)<2&&p.x<=a.x+70&&p.x+p.w>=a.x+70);
  if(!floor)return false;
  clearEncounterEffects();if(!boss.dead)resetBossBattle();
  resetMinibosses();projectiles=[];
  // Preserve permanent guardian/reward flags: only this in-memory encounter is replaced.
  if(ArenaCombat.is(replay)||PrisonHunter.is(replay)||PrisonWarden.is(replay)||DoomSlayer.is(replay)||CampMaster.is(replay)||Serpents.is(replay))replay.replay=true;
  if(CampMaster.is(replay))CampMaster.reset(replay);else resetMiniboss(replay);replay.dead=false;
  if(DoomSlayer.is(replay))DoomSlayer.start(replay);else replay.active=true;
  initPlayer({x:a.x+70,y:floor.y});
  const existing=enemies.findIndex(enemy=>enemy.id===id);if(existing<0)enemies.push(replay);else enemies[existing]=replay;particles=[];drops=[];keys.clear();pressed.clear();
  resetCamera();updateHUD();DevTools.setReturnState('play');return true;
 }
 function init(){DevTools.register({id:'boss-revive',labelKey:'dev.boss',available,fields,run:revive});}
 return Object.freeze({init,revive});
})();
