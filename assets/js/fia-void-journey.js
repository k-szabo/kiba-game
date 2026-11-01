/* Fia's fourth request owns choices, access and service history, not combat. */
'use strict';
const FiaVoidJourney=(()=>{
 const has=id=>flags[3].includes(id),alive=()=>!has('fiaSlain');
 const active=()=>!Prologue.active&&level.fiaJourney===true;
 const available=()=>has('fiaDragonCompleted')&&alive();
 const npc=()=>level===fiaRitual?level.npcs[0]:null;
 const nearFia=()=>available()&&!!npc()&&pointNear(npc(),100,90)&&!FiaConflict.blocked();
 function apply(result){
  if(!result.ok||result.rewards.chicken&&chickenCount>Number.MAX_SAFE_INTEGER-result.rewards.chicken)return false;
  fiaJourney=result.state;flags=result.flags;progression.points+=result.rewards.points;chickenCount+=result.rewards.chicken||0;
  Merchant.selectAvailable();awardXP(result.rewards.xp);persist();updateHUD();return true;
 }
 function talk(){
  if(state!=='play'||!nearFia())return false;
  if(!has('fiaVoidAccepted')){if(!apply(FiaJourneyRules.acceptVoid(fiaJourney,flags,defeated)))return false;story('fia.void.quest','fia.name','fia.void.offer',null,{right:'fia',speaker:'fia'});return true;}
  if(has('rawVoidCrystal')&&!has('fiaVoidCompleted')){const origin=level;story('fia.void.quest','fia.name','fia.void.return',()=>{if(level===origin&&state==='play'&&nearFia())choice();},{right:'fia',speaker:'fia'});return true;}
  story('fia.void.quest','fia.name',has('fiaVoidCompleted')?'fia.void.thanks':'fia.void.offer',null,{right:'fia',speaker:'fia'});return true;
 }
 function give(){
  if(state!=='play'||!nearFia()||!apply(FiaJourneyRules.handInVoid(fiaJourney,flags,defeated)))return false;
  story('fia.void.quest','fia.name','fia.void.thanks',null,{right:'fia',speaker:'fia'});return true;
 }
 function choice(){
  if(state!=='play'||!nearFia()||!has('rawVoidCrystal')||has('fiaVoidCompleted'))return false;
  const origin=level;state='dungeonMenu';keys.clear();pressed.clear();$('dungeonMenu').hidden=false;
  $('dungeonMenuTitle').textContent=I18n.t('fia.void.quest');$('dungeonMenuInfo').textContent=I18n.t('fia.void.return');
  $('dungeonContinue').textContent=I18n.t('fia.void.give');$('dungeonContinue').disabled=false;$('dungeonNew').textContent=I18n.t('fia.void.keep');$('dungeonBack').textContent=I18n.t('dungeon.back');
  const valid=()=>state==='dungeonMenu'&&level===origin&&nearFia()&&has('rawVoidCrystal')&&!has('fiaVoidCompleted');
  const close=()=>{$('dungeonMenu').hidden=true;state='play';keys.clear();pressed.clear();};
  $('dungeonContinue').onclick=()=>{if(valid()){close();give();}};
  $('dungeonNew').onclick=()=>{if(valid()){close();FiaConflict.refuse();}};
  $('dungeonBack').onclick=()=>{if(state==='dungeonMenu'&&level===origin)close();};$('dungeonContinue').focus();return true;
 }
 function service(){return level===shadowUnderworld&&available()&&has('fiaVoidAccepted')?level.npcs.find(n=>pointNear(n,95,85)):null;}
 function meet(kind){if(state!=='play'||service()?.service!==kind)return false;const id=FiaJourneyRules.progress[kind];return has(id)||apply(FiaJourneyRules.meetService(fiaJourney,flags,defeated,kind));}
 function context(){
  if(Prologue.active)return null;
  const entry=level===fiaChambers&&has('fiaDragonCompleted')?{point:level.ritualEntrance,id:'fiaRitual'}:level===shadowDen&&has('fiaVoidAccepted')?{point:level.underworldEntrance,id:'shadowUnderworld'}:level===shadowUnderworld&&has('fiaVoidAccepted')?{point:level.forbiddenEntrance,id:'voidForbidden'}:null;
  if(entry&&pointNear(entry.point,95,85))return {type:'fiaVoidEnter',id:entry.id,text:I18n.format('ziggurat.enter',[I18n.t(SIDE_LOCATIONS[entry.id].map.name)])};
  if(!active())return null;
  if(pointNear(level.returnPoint,95,85))return {type:'fiaVoidReturn',text:I18n.format('ziggurat.return',[I18n.t(SIDE_LOCATIONS[level.returnDestination.location].map.name)])};
  if(nearFia())return {type:'fiaVoidTalk',text:I18n.format('camp.talk',[I18n.t('fia.name')])};
  const vendor=service();return vendor?{type:'fiaVoidService',service:vendor.service,text:I18n.format('camp.talk',[I18n.t(vendor.name)])}:null;
 }
 function interact(candidate){
  if(state!=='play'||!candidate||FiaConflict.blocked())return false;const actual=context();if(!actual||candidate.type!==actual.type)return false;
  if(actual.type==='fiaVoidEnter')return actual.id===candidate.id&&CampQuest.enter(actual.id);
  if(actual.type==='fiaVoidReturn')return CampQuest.leave();
  if(actual.type==='fiaVoidTalk')return talk();
  if(actual.type==='fiaVoidService'&&candidate.service===actual.service){if(!meet(actual.service))return false;return actual.service==='smith'?CampWorkshop.open('forge'):Merchant.open();}
  return false;
 }
 function objective(){
  if(!active())return null;
  if(!available())return {compass:false,text:'story.journeyEnd'};
  if(level===fiaRitual)return {point:npc(),name:'fia.name',text:has('rawVoidCrystal')&&!has('fiaVoidCompleted')?'fia.void.objective.return':'fia.void.quest'};
  if(has('voidDemonDefeated'))return {point:level.returnPoint,name:'fia.name',text:'fia.void.objective.return'};
  return {point:level===shadowUnderworld?level.forbiddenEntrance:level.rift,name:level===shadowUnderworld?'fia.void.forbidden':'fia.void.demon',text:level===shadowUnderworld?'fia.void.objective.explore':'fia.void.objective.fight'};
 }
 function questMarker(id){return id==='fia'&&level===fiaRitual&&available()?has('rawVoidCrystal')&&!has('fiaVoidCompleted')?'?':!has('fiaVoidAccepted')?'!':null:null;}
 const provider=()=>service();
 return Object.freeze({active,available,nearFia,apply,talk,give,choice,context,interact,objective,questMarker,provider,meet});
})();
