/* Ziggurat transitions and story milestones; combat state is never serialized. */
'use strict';
const HannahEncounter=(()=>{
 let transformation=null,lift=0,scene=null,rescue=null,ending=null;
 const active=()=>!!level.ziggurat&&!Prologue.active;
 const summit=()=>level===zigguratSummit&&!Prologue.active;
 const enemy=()=>summit()?enemies.find(e=>HannahCombat.is(e)&&!e.dead):null;
 const completed=()=>flags[3].includes(HannahRules.progress.defeated);
 const cinematic=()=>!!scene||!!transformation||!!rescue||!!ending;
 const blocked=()=>!!scene||!!transformation||!!rescue||!!ending||!!enemy()?.active;
 const locked=()=>!!scene||!!transformation||!!rescue||!!ending||enemy()?.mode==='finisher';
 const finisherTarget=()=>{const e=enemy();return e?.active&&e.mode==='finisher'&&!cinematic()?e:null;};
 const finisherReady=()=>!!finisherTarget();
 const owned=(e,token)=>HannahCombat.current(e)&&e.encounterToken===token&&summit();
 function freeze(){attack=0;attackElapsed=0;attackHit=true;dash=0;player.vx=0;player.vy=0;jumpBuffer=0;keys.clear();pressed.clear();}
 function setLift(value){
  const delta=value-lift;if(!delta)return;
  for(const p of platforms)if(p.id==='ziggurat-summit-ground')p.y=1400-value;
  player.y-=delta;player.vy=0;
  const e=enemy();if(e){e.arena.y=1400-value;e.baseY=e.initialFeet-value-e.h;e.y=e.baseY;}
  lift=value;
 }
 function clear(){HannahCombat.clear();transformation=null;scene=null;rescue=null;ending=null;lift=0;Dawnblade.resetPlayer();}
 function reconcileRewards(){
  if(!completed())return false;let changed=false;
  for(const flag of ['demonLordSoul','demonLordHeart'])if(!flags[3].includes(flag)){flags[3].push(flag);changed=true;}
  return changed;
 }
 function giftPoint(){
  if(!flags[3].includes('demonLordHeart')||flags[3].includes('demonLordHeartGiven')||!flags[3].includes('fiaRescued')||flags[3].includes('fiaSlain'))return null;
  if(level===fiaChambers)return level.npcs.find(n=>n.id==='fia');
  if(level===shadowDen&&!flags[3].includes('arenaChampion'))return level.npcs.find(n=>n.id==='fia');
  if(summit()&&completed()&&flags[3].includes(HannahRules.progress.fiaRescue))return {x:1550,y:1400-lift};
  return null;
 }
 function resetAttempt({replay=false}={}){
  if(!summit())return false;
  clear();platforms=level.platforms.map(p=>({...p,dx:0}));
  enemies=createEnemies();particles=[];projectiles=[];drops=[];
  if(replay){for(const e of enemies.filter(HannahCombat.is))HannahCombat.clear(e);enemies=enemies.filter(e=>!HannahCombat.is(e));enemies.push(HannahCombat.create({...level.enemies.find(HannahCombat.is),replay:true}));}
  checkpoint={...level.rests[0]};initPlayer(checkpoint);player.inv=2;
  state='play';keys.clear();pressed.clear();resetCamera();updateHUD();return true;
 }
 function respawn(){const replay=enemy()?.replay===true;return summit()&&(replay||!completed())?resetAttempt({replay}):false;}
 function replay(){
  if(!DevSession.active||state!=='developer'||!DevTools.isOpen||!summit())return false;
  resetAttempt({replay:true});const e=enemy();initPlayer({x:e.arena.x+75,y:e.arena.y});e.active=true;
  state='developer';DevTools.setReturnState('play');resetCamera();updateHUD();return true;
 }
 function onFailure(e){
  if(!HannahCombat.current(e)||!summit())return false;
  freeze();const token=e.encounterToken;scene={e,token};
  story('shadow.label','ziggurat.hannah','ziggurat.failure',()=>{
   if(!owned(e,token))return;scene=null;resetAttempt({replay:e.replay===true});
  },{button:'camp.master.retry'});return true;
 }
 function onGate(e,gate){
  if(!HannahCombat.current(e)||!summit())return false;
  if(gate==='drain60'||gate==='drain40')return true;
  freeze();const token=e.encounterToken;scene={e,token};
  if(gate==='transform'){
   story('shadow.label','ziggurat.hannah','ziggurat.monologue',()=>{
    if(!owned(e,token))return;scene=null;transformation={e,token,elapsed:0};
   });return true;
  }
  if(gate==='rescue'){
   e.rescuedByFia=HannahRules.eligibleFia(flags[3]);
   story('shadow.label',e.rescuedByFia?'fia.name':'HARU',e.rescuedByFia?'ziggurat.fiaRescue':'ziggurat.lightningRescue',()=>{
    if(!owned(e,token))return;
    scene=null;rescue={e,token,elapsed:0};
    player.x=level.arena.x+660;player.y=1400-lift-player.h;player.face=1;resetCamera();
   });return true;
  }
  return false;
 }
 function update(dt){
  if(state!=='play'||!Number.isFinite(dt)||dt<=0)return;
  if(ending){
   freeze();ending.elapsed+=dt;
   if(ending.map!==level){ending=null;return;}
   if(ending.elapsed>=.8){const replay=ending.replay;ending=null;setLift(0);resetCamera();if(!replay)story('shadow.label','HARU','ziggurat.continuation');}
   return;
  }
  if(rescue){
   const current=rescue;if(!owned(current.e,current.token)){rescue=null;return;}
   freeze();current.elapsed+=dt;
   camera=clamp(1800-viewW/2,0,Math.max(0,level.width-viewW));
   if(current.elapsed>=3.6){
    current.e.haruRescued=true;rescue=null;scene={e:current.e,token:current.token};
    story('shadow.label','HARU','ziggurat.awakening',()=>{
     if(!owned(current.e,current.token))return;scene=null;
     HannahCombat.awaitFinisher(current.e);Dawnblade.awaken();
     if(!current.e.replay&&!flags[3].includes(HannahRules.progress.awakening))flags[3].push(HannahRules.progress.awakening);
     persist();updateHUD();
    },{right:'haru',speaker:'haru'});
   }return;
  }
  if(!transformation)return;
  const t=transformation;if(!owned(t.e,t.token)){transformation=null;return;}
  freeze();t.elapsed=Math.min(2.5,t.elapsed+dt);
  const f=t.elapsed/2.5;setLift(320*f*f*(3-2*f));
  if(t.elapsed>=2.5){transformation=null;HannahCombat.beginPhase2(t.e);player.inv=Math.max(player.inv,1);}
 }
 function onDefeated(e){
  if(!summit()||!enemies.includes(e)||!e.dead)return false;
  scene=null;transformation=null;rescue=null;
  if(e.replay){ending={map:level,elapsed:0,replay:true};return true;}
  if(completed())return false;
  for(const flag of [HannahRules.progress.awakening,HannahRules.progress.defeated,'guardian:Hannah',...(e.rescuedByFia?[HannahRules.progress.fiaRescue]:[])])if(!flags[3].includes(flag))flags[3].push(flag);
  reconcileRewards();progression.points++;awardXP(1600);persist();updateHUD();
  // Let the ultimate's impact and recovery finish before opening a modal.
  ending={map:level,elapsed:0};return true;
 }
 function objective(){
  if(!active())return null;
  const e=enemy(),point=level.nextPoint||{x:1800,y:1400-lift};
  const key=level.ziggurat==='approach'?'ziggurat.objective.approach':level.ziggurat==='interior'?'ziggurat.objective.interior':completed()?'ziggurat.objective.haru':e?.mode==='finisher'?'ziggurat.objective.ultimate':'ziggurat.objective.hannah';
  return {point,x:point.x,y:point.y,name:I18n.t(level.name),text:I18n.t(key),compass:true};
 }
 function context(){
  if(Prologue.active||blocked())return null;
  const gift=giftPoint();if(gift&&pointNear(gift,100,90))return {type:'hannahHeart',text:'fia.heart.give'};
  if(level===levels[3]&&defeated[3]&&pointNear(level.zigguratEntrance,105,90))return {type:'zigguratEnter',id:'zigguratApproach',text:I18n.format('ziggurat.enter',[I18n.t('ziggurat.name')])};
  if(!active())return null;
  if(level.nextPoint&&pointNear(level.nextPoint,105,85))return {type:'zigguratEnter',id:level.nextDestination.location,text:I18n.format('ziggurat.enter',[I18n.t(SIDE_LOCATIONS[level.nextDestination.location].map.name)])};
  if(summit()&&completed()&&pointNear({x:1800,y:1400-lift},100,100))return {type:'zigguratHaru',text:I18n.format('camp.talk',[I18n.t('HARU')])};
  if(pointNear(level.returnPoint,100,85))return {type:'zigguratReturn',text:I18n.format('ziggurat.return',[I18n.t(level.returnDestination.location?SIDE_LOCATIONS[level.returnDestination.location].map.name:'shadow.name')])};
  return null;
 }
 function interact(candidate){
  const actual=context();if(state!=='play'||!actual||candidate?.type!==actual.type||candidate.id!==actual.id)return false;
  if(actual.type==='zigguratEnter')return CampQuest.enter(actual.id);
  if(actual.type==='zigguratReturn')return CampQuest.leave();
  if(actual.type==='hannahHeart'){
   flags[3].push('demonLordHeartGiven');persist();updateHUD();
   story('item.demonLordHeart','fia.name','fia.heart.thanks',null,{right:'fia',speaker:'fia'});return true;
  }
  if(actual.type==='zigguratHaru'){story('shadow.label','HARU','ziggurat.continuation');return true;}
  return false;
 }
 function hud(){
  const e=enemy();if(!e?.active)return false;
  $('bossHud').hidden=false;$('bossName').textContent=I18n.t('ziggurat.hannah')+' · '+e.stage;
  $('bossHealth').style.width=(Math.max(0,e.hp/e.maxHp)*100)+'%';
  if(e.mode==='drain')$('bossName').textContent+=' · '+I18n.format('ziggurat.drain',[Math.round(e.drainDamage),Math.ceil(e.drainThreshold)])+' · '+I18n.format('ziggurat.haruHealth',[Math.ceil(e.haruHp/HannahRules.tuning.drain.haruMaxHp*100)]);
  return true;
 }
 const visual=()=>{
  const rescuedByFia=!!(rescue?.e.rescuedByFia||enemy()?.rescuedByFia||flags[3].includes(HannahRules.progress.fiaRescue));
  return {lift,storm:!enemy()&&completed()||!!transformation||enemy()?.stage===2,transform:transformation?.elapsed/2.5||0,haruFreed:!enemy()&&completed()||!!enemy()?.haruRescued||!!rescue&&rescue.elapsed>=1.8,rescueTime:rescue?.elapsed??null,rescuedByFia,fiaPresent:rescuedByFia&&!flags[3].includes('fiaSlain')};
 };
 return Object.freeze({active,summit,enemy,blocked,locked,cinematic,finisherTarget,finisherReady,clear,resetAttempt,respawn,replay,onFailure,onGate,onDefeated,update,objective,context,interact,hud,visual,reconcileRewards});
})();
