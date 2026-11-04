/* Haru's return journey owns only permanent milestones and transient following. */
'use strict';
const ZigguratDescent=(()=>{
 const rules=ZigguratDescentRules,progress=rules.progress,companion=HaruFollower.create();
 let trackedMap=null,portalIntroduced=false;
 const eligible=()=>rules.eligible(flags,defeated);
 const accepted=()=>rules.accepted(flags);
 const completed=()=>rules.completed(flags);
 const gate=()=>level===zigguratDepths?enemies.find(e=>e.miniboss==='voidGatekeeper'&&!e.dead):null;
 const locked=()=>!!gate()?.active;
 const following=()=>accepted()&&!completed()&&[zigguratSummit,zigguratInterior,zigguratDepths,japanHeights].includes(level)&&!Prologue.active;
 function transition(event){const next=rules.transition(flags,defeated,event);if(!next.ok)return false;flags=next.flags;return true;}
 function clear(){trackedMap=null;portalIntroduced=false;}
 function resetCompanion(){
  trackedMap=level;
  if(!following()||!player)return;
  const support=platforms.find(p=>!p.broken&&Math.abs(player.y+player.h-p.y)<4&&player.x+player.w>p.x&&player.x<p.x+p.w);
  if(!support){trackedMap=null;return;}
  const x=clamp(player.x-78,support.x+4,support.x+support.w-46);
  companion.reset({x,y:support.y-70,face:player.face},platforms);
 }
 function showFollower(){return following()||accepted()&&completed()&&level===japanHeights;}
 function follower(){
  if(!showFollower())return null;
  if(completed())return {x:japanHeights.haruPoint.x-21,y:japanHeights.haruPoint.y-70,w:42,h:70,vx:0,vy:0,face:-1,onGround:true,animationTime:0};
  return trackedMap===level?companion.snapshot():null;
 }
 function update(dt){
  if(state!=='play'||!Number.isFinite(dt)||dt<=0)return;
  if(following()){
   if(trackedMap!==level||!companion.snapshot())resetCompanion();
   if(trackedMap===level)companion.update(dt,player,platforms);
  }
  if(level===zigguratDepths&&!rules.gateCleared(flags)&&!portalIntroduced&&player.x>level.arena.x-90&&player.y+player.h>level.arena.y-100){
   portalIntroduced=true;story('descent.depths','HARU','descent.portalStory',null,{right:'haru',speaker:'haru'});
  }
 }
 function gateVictory(enemy){
  if(state!=='play'||level!==zigguratDepths||!enemies.includes(enemy)||enemy.miniboss!=='voidGatekeeper'||!enemy.dead||enemy.replay||!transition('clearGate'))return false;
  progression.points++;awardXP(1800);persist();updateHUD();return true;
 }
 function context(){
  if(Prologue.active||!eligible()||locked())return null;
  if(level===zigguratSummit&&pointNear({x:1800,y:1400},110,100)&&!accepted())return {type:'descentAccept',text:I18n.format('camp.talk',[I18n.t('HARU')])};
  if(level===zigguratInterior&&accepted()&&pointNear(level.descentEntrance,95,80))return {type:'descentEnter',text:'descent.enter'};
  if(level===zigguratDepths&&pointNear(level.portalPoint,95,85))return {type:'descentPortal',text:rules.gateCleared(flags)?'descent.portal':'descent.locked',locked:!rules.gateCleared(flags)};
  if(level===japanHeights&&pointNear(level.haruPoint,100,85))return {type:'descentHaru',text:I18n.format('camp.talk',[I18n.t('HARU')])};
  return null;
 }
 function interact(candidate){
  const actual=context();if(state!=='play'||!actual||candidate?.type!==actual.type||actual.locked)return false;
  if(actual.type==='descentAccept'){
   const map=level;story('descent.path','HARU','descent.quest',()=>{if(level!==map||!transition('accept'))return;resetCompanion();persist();updateHUD();},{right:'haru',speaker:'haru'});return true;
  }
  if(actual.type==='descentEnter')return CampQuest.enter('zigguratDepths');
  if(actual.type==='descentPortal'){
   const previous=flags;transition('arrive');if(!CampQuest.enter('japanHeights',{save:false})){flags=previous;return false;}
   persist();story('descent.heights','HARU','descent.arrival',null,{right:'haru',speaker:'haru'});return true;
  }
  if(actual.type==='descentHaru'){
   transition('complete');persist();updateHUD();story('descent.heights','HARU','descent.arrival',null,{right:'haru',speaker:'haru'});return true;
  }
  return false;
 }
 function objective({remote=true}={}){
  if(!eligible())return level.descent?{compass:false,text:'descent.objective.descend'}:null;
  if(completed())return remote||level.descent||level.ziggurat?{compass:false,journeyEnd:true,text:'story.journeyEnd'}:null;
  let map,point,text;
  if(!accepted()){map=zigguratSummit;point={x:1800,y:1400};text='descent.objective.haru';}
  else if(rules.arrived(flags)){map=japanHeights;point=japanHeights.haruPoint;text='descent.objective.arrival';}
  else if(level===zigguratSummit){map=level;point=level.returnPoint;text='descent.objective.descend';}
  else if(level===zigguratInterior){map=level;point=level.descentEntrance;text='descent.objective.descend';}
  else{map=zigguratDepths;point=rules.gateCleared(flags)?map.portalPoint:{x:2650,y:2920};text=rules.gateCleared(flags)?'descent.objective.portal':'descent.objective.gate';}
  return level===map?{point,name:map.name,text,compass:true}:remote?{compass:false,remote:true,name:map.name,text}:null;
 }
 function hud(){
  if(level!==zigguratDepths)return false;
  const enemy=gate(),active=enemy?.active===true;$('bossHud').hidden=!active;
  if(active){$('bossName').textContent=I18n.t('descent.gatekeeper');$('bossHealth').style.width=Math.max(0,enemy.hp/enemy.maxHp)*100+'%';}
  return true;
 }
 return Object.freeze({context,interact,update,objective,hud,gateVictory,follower,showFollower,locked,clear,resetCompanion});
})();
