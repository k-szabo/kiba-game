/* Fia's second request keeps quest history separate from the held talisman. */
'use strict';
const FiaQuest=(()=>{
 const has=id=>flags[3].includes(id),slain=()=>has('fiaSlain');
 const available=()=>!Prologue.active&&!slain()&&has('fiaRescued')&&has('arenaChampion');
 const near=()=>available()&&level===fiaChambers&&pointNear(level.npcs[0],95,85);
 function talk(){
  if(state!=='play'||!near())return false;
  const map=level;
  if(!has('fiaChambersHeard')){
   flags[3].push('fiaChambersHeard');persist();updateHUD();
   story('arena.chambers.name','fia.name','arena.chambers.dialogue',null,{right:'fia',speaker:'fia'});return true;
  }
  if(!has('fiaTalismanAccepted')){
   flags[3].push('fiaTalismanAccepted');persist();updateHUD();
   story('fia.quest.name','fia.name','fia.quest.offer',null,{right:'fia',speaker:'fia'});return true;
  }
  if(has('priestessTalisman')&&!has('fiaTalismanCompleted')){
   if(chickenCount>Number.MAX_SAFE_INTEGER-3)return false;
   flags[3].push('fiaTalismanCompleted');chickenCount+=3;Merchant.selectAvailable();awardXP(600);persist();updateHUD();
   story('fia.quest.name','Momo','fia.quest.handover',()=>{
    if(state==='play'&&level===map&&!slain())story('fia.quest.name','fia.name',()=>I18n.t('fia.quest.thanks')+'\n\n'+I18n.format('fia.quest.reward',[600,3]),null,{right:'fia',speaker:'fia'});
   },{right:'fia',speaker:'momo'});return true;
  }
  story('fia.quest.name','fia.name',has('fiaTalismanCompleted')?'fia.quest.thanks':'fia.quest.reminder',null,{right:'fia',speaker:'fia'});return true;
 }
 function onPriestessDefeated(enemy){
  if(state!=='play'||slain()||!has('fiaTalismanAccepted')||has('priestessTalisman')||has('fiaTalismanCompleted'))return false;
  if(level.dungeon?.id!=='sectFall'||enemy.miniboss!=='cultHighPriestess'||enemy.replay||!enemy.dead||!enemies.includes(enemy))return false;
  flags[3].push('priestessTalisman');return true;
 }
 function questMarker(id){
  if(id!=='fia'||!available()||level!==fiaChambers)return null;
  return !has('fiaTalismanAccepted')?'!':has('priestessTalisman')&&!has('fiaTalismanCompleted')?'?':null;
 }
 function objective(){
  if(!available()||level!==fiaChambers||!has('fiaTalismanAccepted')||has('fiaTalismanCompleted'))return null;
  return {point:level.npcs[0],compass:false,text:has('priestessTalisman')?'fia.quest.objective.return':'fia.quest.objective.retrieve'};
 }
 const canEat=()=>!Prologue.active&&!!player&&player.hp>0&&player.hp<player.maxHp&&chickenCount>0;
 function eat(fromInventory=false){
  if(state!==(fromInventory?'inventory':'play')||!canEat())return false;
  chickenCount--;player.hp=Math.min(player.maxHp,player.hp+4);Merchant.selectAvailable();persist();updateHUD();if(fromInventory)Inventory.render();return true;
 }
 return Object.freeze({available,slain,talk,onPriestessDefeated,questMarker,objective,canEat,eat});
})();
