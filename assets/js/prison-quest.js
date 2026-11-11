/* Optional prison rescue; all lasting flags belong to the Shadow Realm. */
'use strict';
const PrisonQuest=(()=>{
 const active=()=>realm===3&&level===shadowPrison&&!Prologue.active;
 const rescued=()=>flags[3].includes('zenRescued');
 const won=()=>flags[3].includes('guardian:prisonWarden');
 const purificationReady=()=>!Prologue.active&&level===forestCamp&&rescued()&&!flags[3].includes('zenHymnPurified')&&Inventory.quantity('corruptedHymn')>0;
 const ninjaSealReady=()=>!Prologue.active&&(level===forestCamp||level.id==='ninjaClanCamp')&&rescued()&&
  flags[0].includes('ninjaCorruptedSeal')&&!flags[0].includes('ninjaSealPurified');
 function context(){
  if(Prologue.active)return null;
  const zen=level===forestCamp?level.npcs.find(npc=>npc.id==='zen'):DungeonRun.campNpc('zen');
  if(zen&&purificationReady()&&pointNear(zen,95,85))return {type:'zenPurify',text:'zen.purify'};
  if(zen&&ninjaSealReady()&&pointNear(zen,95,85))return {type:'zenNinjaPurify',text:I18n.format('camp.talk',[I18n.t('zen.name')])};
  if(level===shadowRealm&&hasFlag('prisonOpen')&&pointNear(level.prisonDoor,125,90))return {type:'prisonEnter',text:I18n.t('zen.prison.enter')};
  if(!active())return null;
  if(pointNear(level.returnPoint,100,85))return {type:'prisonReturn',text:I18n.t('zen.prison.return')};
  if(!rescued()&&pointNear(level.zen,95,85))return {type:'zenRescue',locked:!won(),text:I18n.t(won()?'zen.free':'zen.locked')};
  return null;
 }
 function interact(candidate){
  if(state!=='play'||!candidate)return false;
  const actual=context();if(!actual||actual.type!==candidate.type)return false;
  if(actual.type==='zenPurify'){
   flags[3].push('zenHymnPurified');progression.points+=ZEN_PURIFICATION_POINTS;persist();updateHUD();
   story('camp.dialogue.label','zen.name','zen.purify.dialogue',()=>toast(I18n.format('zen.purify.reward',[ZEN_PURIFICATION_POINTS])),{right:'zen',speaker:'zen'});return true;
  }
  if(actual.type==='zenNinjaPurify'){
   flags[0].push('ninjaSealPurified');
   progression.points+=ZEN_PURIFICATION_POINTS;persist();updateHUD();
   story('camp.dialogue.label','zen.name','ninjaClan.zenSeal',null,{right:'zen',speaker:'zen'});return true;
  }
  if(actual.type==='prisonEnter')return CampQuest.enter('shadowPrison');
  if(actual.type==='prisonReturn')return CampQuest.leave();
  if(actual.type==='zenRescue'){
   if(actual.locked||rescued())return true;
   flags[3].push('zenRescued');persist();updateHUD();
   story('zen.prison.name','zen.name','zen.rescue.dialogue',null,{right:'zen',speaker:'zen'});return true;
  }
  return false;
 }
 function objective(){
  if(!active())return null;
  const point=!won()?level.arena:!rescued()?level.zen:level.returnPoint;
  return {point,x:point.x,y:point.y,compass:false,text:!won()?'zen.objective.warden':!rescued()?'zen.objective.rescue':'zen.objective.return'};
 }
 function wardenVictory(enemy){
  if(!active()||state!=='play'||!enemies.includes(enemy)||!enemy.dead||!won())return false;
  story('shadow.label','zen.warden.name','zen.warden.victory',null,{right:'prisonWarden'});return true;
 }
 return Object.freeze({active,rescued,purificationReady,ninjaSealReady,context,interact,objective,wardenVictory});
})();
