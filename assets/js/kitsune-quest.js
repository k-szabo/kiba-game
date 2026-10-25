/* Fia's optional rescue. Only explicit world departures can close her story. */
'use strict';
const KitsuneQuest=(()=>{
 let departure=null,rescueScene=false;
 const owns=id=>flags[3].includes(id);
 const prison=()=>realm===3&&level===shadowPrison&&!Prologue.active;
 const den=()=>realm===3&&level===shadowDen&&!Prologue.active;
 const rescued=()=>owns('fiaRescued'),missed=()=>owns('fiaMissed');
 const hunterDefeated=()=>owns('guardian:prisonHunter');
 function rememberSeen(){
  if(!prison()||!hunterDefeated()||owns('fiaSeen')||rescued()||missed()||!overlap(player,level.fiaDetection))return false;
  flags[3].push('fiaSeen');persist();return true;
 }
 // Call only after validating a deliberate travel destination, never for death,
 // menu presentation, save loading or enterRealm's internal side-map bootstrap.
 function leaveFor(destination){
  if(!prison()||destination===shadowPrison||!hunterDefeated()||!owns('fiaSeen')||rescued()||missed())return false;
  flags[3].push('fiaMissed');return true;
 }
 function reset(){departure=null;rescueScene=false;}
 function update(dt){
  if(state!=='play'||!Number.isFinite(dt)||dt<=0)return;
  rememberSeen();
  if(!departure)return;
  if(!prison()||departure.map!==level){reset();return;}
  departure.elapsed+=dt;
  if(departure.elapsed>=3){departure=null;return;}
  if(!reducedMotion.matches&&departure.elapsed>.85)departure.x+=190*dt;
 }
 function context(){
  if(Prologue.active)return null;
  if(level===shadowRealm&&defeated[3]&&pointNear(level.denEntrance,110,85))return {type:'fiaDenEnter',text:I18n.t('fia.den.enter')};
  if(prison()&&!rescued()&&!missed()&&pointNear(level.fia,95,85))return {type:'fiaRescue',locked:!hunterDefeated(),text:I18n.t(hunterDefeated()?'fia.free':'fia.locked')};
  if(!den())return null;
  if(pointNear(level.returnPoint,100,85))return {type:'fiaDenReturn',text:I18n.t('zen.prison.return')};
  const npc=level.npcs.find(candidate=>campNPCVisible(candidate)&&pointNear(candidate,95,85));
  return npc?{type:'fiaDenTalk',id:npc.id,text:I18n.format('camp.talk',[I18n.t(npc.name)])}:null;
 }
 function interact(candidate){
  if(state!=='play'||!candidate)return false;
  const actual=context();if(!actual||actual.type!==candidate.type)return false;
  if(actual.type==='fiaDenEnter')return CampQuest.enter('shadowDen');
  if(actual.type==='fiaDenReturn')return CampQuest.leave();
  if(actual.type==='fiaDenTalk'){
   if(actual.id!==candidate.id)return false;
   const npc=level.npcs.find(entry=>entry.id===actual.id);
   story('fia.den.name',npc.name,npc.dialogue,null,{right:npc.id,speaker:npc.id});return true;
  }
  if(actual.type!=='fiaRescue')return false;
  if(actual.locked)return true;
  if(!owns('fiaSeen'))flags[3].push('fiaSeen');
  flags[3].push('fiaRescued');persist();updateHUD();rescueScene=true;
  const map=level,origin={...level.fia};
  story('zen.prison.name','fia.name','fia.rescue.dialogue',()=>{
   rescueScene=false;
   if(state==='play'&&level===map)departure={map,x:origin.x,y:origin.y,elapsed:0};
  },{right:'fia',speaker:'fia'});return true;
 }
 function objective(){
  if(den())return {point:level.rests[0],compass:false,text:'fia.den.objective'};
  if(!prison()||player.y+player.h<1850)return null;
  const point=!hunterDefeated()?level.hunterArena:!rescued()&&!missed()?level.fia:level.returnPoint;
  return {point,compass:false,text:!hunterDefeated()?'fia.objective.hunter':!rescued()&&!missed()?'fia.objective.rescue':'zen.objective.return'};
 }
 return Object.freeze({prison,den,rescued,missed,context,interact,update,leaveFor,reset,objective,
  get departure(){return departure;},get rescueScene(){return rescueScene;}});
})();
