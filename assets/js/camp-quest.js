/* Optional Japan rescue journey and registered side-location transitions. */
'use strict';
const CampQuest=(()=>{
 let execution=null;
 const rescueFlags=['smithRescued','herbalistRescued','enchanterRescued'];
 const owns=id=>flags[0].includes(id);
 const eligible=id=>DevSession.active||sideLocationUnlocked(id,flags,defeated);
 function locationId(){return Object.keys(SIDE_LOCATIONS).find(id=>SIDE_LOCATIONS[id].map===level)||null;}
 const isSide=()=>['samuraiCamp','forgeInterior','herbalHut','mysticTent'].includes(locationId());
 function materializeRoute(){
  if(level!==levels[0]||!defeated[0]||!owns('campQuestAccepted'))return false;
  for(const step of levels[0].campRescueSteps)if(!platforms.some(platform=>platform.id===step.id))platforms.push({...step,dx:0});
  return true;
 }
 function restoreHp(hp){if(Number.isFinite(hp)&&hp>0)player.hp=Math.min(hp,player.maxHp);}
 function finishEntry(save){
  if(!visitedRests[0].includes(checkpoint.id))visitedRests[0].push(checkpoint.id);
  state='play';keys.clear();pressed.clear();context=null;
  $('prompt').hidden=true;$('bossHud').hidden=true;
  resetCamera();updateHUD();if(save)persist();return true;
 }
 function enter(id,{point=null,atShrine=false,save=true}={}){
  if(typeof id!=='string'||!Object.hasOwn(SIDE_LOCATIONS,id)||Prologue.active&&!DevSession.active||!eligible(id))return false;
  const map=SIDE_LOCATIONS[id].map,rest=point==null?map.rests[0]:map.rests.find(candidate=>candidate.id===point.id);
  if(!rest)return false;
  if(DevSession.active)Prologue.stop();
  if(id==='forestCamp')return enterForestCamp({save,atShrine});
  const hp=player?.hp;
  enterRealm(0);level=map;platforms=map.platforms.map(platform=>({...platform,dx:0}));levelTime=0;
  checkpoint={...rest};enemies=createEnemies();boss=createBoss();boss.dead=true;bossStarted=false;
  initPlayer(atShrine?checkpoint:map.start);if(!atShrine)restoreHp(hp);
  return finishEntry(save);
 }
 function leave(){
  if(state!=='play'||!isSide())return false;
  const map=level,hp=player.hp,destination=map.returnDestination;
  if(destination.location==='forestCamp'){
   if(!enterForestCamp({save:false}))return false;
   initPlayer(destination);
  }else{
   enterRealm(0,levels[0].rests.find(rest=>rest.id==='temple'));
   initPlayer(destination);
  }
  restoreHp(hp);return finishEntry(true);
 }
 function talkDaichi(){
  const npc=forestCamp.npcs.find(candidate=>candidate.id==='daichi');
  if(state!=='play'||level!==forestCamp||Prologue.active||!defeated[0]||!pointNear(npc,95,85))return false;
  const complete=rescueFlags.every(owns);
  if(!owns('campQuestAccepted')){flags[0].push('campQuestAccepted');persist();updateHUD();}
  if(complete&&!owns('campQuestCompleted')){flags[0].push('campQuestCompleted');persist();updateHUD();}
  story('camp.dialogue.label',npc.name,complete?'camp.rescue.complete.story':'camp.rescue.quest.story',null,{right:'daichi',speaker:'daichi'});
  return true;
 }
 function getContext(){
  if(Prologue.active)return null;
  if(level===levels[0])return defeated[0]&&owns('campQuestAccepted')&&pointNear(level.samuraiCampEntrance,105,90)?{type:'campRescueEnter',text:I18n.t('camp.rescue.enter')}:null;
  if(level===forestCamp){
   const entry=level.serviceEntrances.find(candidate=>eligible(candidate.id)&&pointNear(candidate,95,85));
   return entry?{type:'campServiceEnter',id:entry.id,text:I18n.format('service.enter',[I18n.t(entry.name)])}:null;
  }
  if(!isSide())return null;
  if(pointNear(level.returnPoint,100,85))return {type:'campSideReturn',text:I18n.t(level===samuraiCamp?'camp.return':'service.return')};
  if(level===samuraiCamp){
   const cage=level.cages.find(candidate=>!owns(candidate.flag)&&pointNear(candidate,90,85));
   if(cage){const locked=!owns('guardian:campMaster');return {type:'campCage',cage,locked,text:locked?I18n.t('camp.rescue.cage.locked'):I18n.format('camp.rescue.cage.open',[I18n.t(cage.name)])};}
  }else if(pointNear(level.servicePoint,95,85))return {type:'campServiceOpen',service:level.service,text:I18n.format('service.enter',[I18n.t(level.name)])};
  const rest=level.rests.find(candidate=>pointNear(candidate,90,80));
  return rest?{type:'checkpoint',rest,text:I18n.t('text.e.rest.heal.and.save')}:null;
 }
 function rescue(cage){
  if(state!=='play'||level!==samuraiCamp||!owns('guardian:campMaster'))return false;
  const captive=level.cages.find(candidate=>candidate.id===cage?.id);
  if(!captive||owns(captive.flag)||!pointNear(captive,90,85))return false;
  flags[0].push(captive.flag);persist();updateHUD();
  story('camp.dialogue.label',captive.name,'camp.npc.'+captive.id+'.rescue',null,{right:captive.id,speaker:captive.id});
  return true;
 }
 function interact(candidate){
  if(state!=='play'||!candidate)return false;
  const actual=getContext();if(!actual||candidate.type!==actual.type)return false;
  if(actual.type==='campRescueEnter')return enter('samuraiCamp');
  if(actual.type==='campServiceEnter')return candidate.id===actual.id&&enter(actual.id);
  if(actual.type==='campSideReturn')return leave();
  if(actual.type==='campCage')return candidate.cage?.id===actual.cage.id&&!actual.locked&&rescue(actual.cage);
  if(actual.type==='campServiceOpen')return candidate.service===actual.service&&CampWorkshop.open(actual.service);
  return false;
 }
 function masterScene(enemy){
  if(state!=='play'||level!==samuraiCamp||!enemies.includes(enemy)||!CampMaster.is(enemy)||enemy.dead||owns('mayorExecuted'))return false;
  flags[0].push('mayorExecuted');enemy.active=false;enemy.poseIndex=12;persist();
  enemy.face=1;enemy.attackFace=1;enemy.x=level.mayor.x-enemy.w/2-70;
  camera=clamp(level.mayor.x-viewW*.64,0,Math.max(0,level.width-viewW));cameraY=clamp(level.arena.y-H*.36,level.top??0,Math.max(0,level.height-H));
  const map=level;
  execution={enemy,stage:0};
  story('camp.rescue.quest','camp.rescue.boss',()=>I18n.t('camp.rescue.execution').replace(/(?<=[.!?])\s+/g,'\n\n'),()=>{
   execution=null;
   if(state!=='play'||level!==map||!enemies.includes(enemy)||enemy.dead)return;
   CampMaster.reset(enemy);resetCamera();if(!enemy.dead)enemy.active=true;
  },{onPage:page=>{execution={enemy,stage:Math.min(2,page)};enemy.poseIndex=12+execution.stage;},right:'campMaster',speaker:'campMaster'});
  return true;
 }
 function masterVictory(enemy){
  if(state!=='play'||level!==samuraiCamp||!enemies.includes(enemy)||!enemy.dead||!owns('guardian:campMaster'))return false;
  story('camp.dialogue.label','camp.rescue.boss','camp.master.victory',null,{right:'campMaster'});return true;
 }
 function executionFailed(enemy){
  if(state!=='play'||level!==samuraiCamp||!enemies.includes(enemy)||enemy.dead||owns('guardian:campMaster'))return false;
  const map=level,rest=map.rests.find(point=>point.id==='samuraiCampCourt');
  initPlayer(rest);resetCamera();updateHUD();
  story('camp.dialogue.label','camp.rescue.boss','camp.master.failed',()=>{
   if(level!==map||!enemies.includes(enemy)||enemy.dead)return;
   CampMaster.reset(enemy);initPlayer(rest);resetCamera();updateHUD();
  },{right:'campMaster',button:'camp.master.retry'});return true;
 }
 function questMarker(id){
  if(Prologue.active||state==='menu')return null;
  if(id==='daichi'&&level===forestCamp&&defeated[0])return !owns('campQuestAccepted')?'!':rescueFlags.every(owns)&&!owns('campQuestCompleted')?'?':null;
  if(id==='herbalist'&&level===herbalHut&&(DevSession.active||owns('herbalistRescued'))){
   if(campServices.herbs>=CampServiceRules.profile.herbsPerBrew)return '?';
   return !owns('herbalistQuestAccepted')||owns('herbalistQuestTurnedIn')?'!':null;
  }
  if(id==='enchanter'&&level===mysticTent&&(DevSession.active||owns('enchanterRescued'))&&!SerpentRelics.united())return SerpentRelics.scales.every(SerpentRelics.held)?'?':!owns('serpentRitualKnown')?'!':null;
  return null;
 }
 function objective(){
  if(level===samuraiCamp){
   const cage=level.cages.find(candidate=>!owns(candidate.flag));
   const target=!owns('guardian:campMaster')?{point:level.arena,text:'camp.rescue.objective.master'}:cage?{point:cage,text:'camp.rescue.objective.rescue'}:{point:level.returnPoint,text:'camp.rescue.objective.return'};
   return {...target,x:target.point.x,y:target.point.y,compass:false};
  }
  if(level===forestCamp&&owns('campQuestAccepted')&&!owns('campQuestCompleted')&&rescueFlags.every(owns)){
   const point=level.npcs.find(candidate=>candidate.id==='daichi');return {point,x:point.x,y:point.y,text:'camp.rescue.objective.daichi',compass:false};
  }
  if(isSide()){const point=level.servicePoint;return {point,x:point.x,y:point.y,text:'camp.objective',compass:false};}
  return null;
 }
 return Object.freeze({get execution(){return state==='dialog'&&level===samuraiCamp&&enemies.includes(execution?.enemy)?execution:null;},locationId,isSide,enter,leave,materializeRoute,talkDaichi,context:getContext,interact,rescue,masterScene,masterVictory,executionFailed,questMarker,objective});
})();
