/* Story milestones survive death; flight, combat and escort clocks do not. */
'use strict';
const WatchtowerBalloon=(()=>{
 const rules=WatchtowerBalloonRules,p=rules.progress,owns=id=>flags[0].includes(id);
 let escort=HaruFollower.create({w:58,h:85,speed:185});
 let flight=null,tracked=null,departing=null,transfer=false,sealIntroduced=false,ropeEscort=null,vortex=null,morph=null;
 const active=()=>!!level.watchtowerBalloon&&!Prologue.active;
 const locked=()=>!transfer&&active()&&(level===balloonJourney&&!DevSession.active||!!departing||!!vortex||!!morph||enemies.some(e=>WatchtowerBalloonCombat.is(e)&&e.active&&!e.dead));
 function commit(event){const next=rules.transition(flags,event);if(!next.ok)return false;flags=next.flags;persist();updateHUD();return true;}
 function travel(id){transfer=true;try{return CampQuest.enter(id);}finally{transfer=false;}}
 function clear(){flight=null;tracked=null;departing=null;sealIntroduced=false;ropeEscort=null;vortex=null;morph=null;escort=HaruFollower.create({w:58,h:85,speed:185});}
 function companion(){return tracked===level&&active()&&level===ninjaWatchtower&&owns(p.rescued)&&!owns(p.boarded)?ropeEscort?.actor||escort.snapshot():null;}
 function resetEscort(){
  const support=platforms.find(s=>!s.broken&&Math.abs(player.y+player.h-s.y)<5&&player.x+player.w>s.x&&player.x<s.x+s.w);
  if(support)escort.reset({x:clamp(player.x-80,support.x+5,support.x+support.w-58),y:support.y-85,face:player.face},platforms);
 }
 function updateEscort(dt){
  if(level!==ninjaWatchtower||!owns(p.rescued)||owns(p.boarded))return;
  if(!escort.snapshot())resetEscort();
  if(ropeEscort){
   const a=ropeEscort.actor,t=ropeEscort.target,dx=t.x-a.x,dy=t.y-a.y,d=Math.hypot(dx,dy),step=450*dt;
   if(d<=step){escort.reset({x:t.x,y:t.y,face:player.face},platforms);ropeEscort=null;}
   else{a.x+=dx/d*step;a.y+=dy/d*step;a.onGround=false;a.vx=dx/d*450;a.animationTime+=dt;}
   return;
  }
  const a=escort.snapshot(),hook=Grapple.snapshot();
  if(a&&hook?.type==='anchor'&&Math.hypot(a.x-player.x,a.y-player.y)>80){
   ropeEscort={actor:a,target:{x:hook.point.x-29,y:hook.point.y-42}};return;
  }
  escort.update(dt,player,platforms);
 }
 function populate(){
  if(level!==balloonJourney)return;
  enemies=[];flight=rules.restart(flags,100);if(!flight)return;
  flight.cruise=0;flight.spawned=false;
 }
 function spawnFlight(){
  if(!flight||flight.spawned)return;flight.spawned=true;
  if(flight.stage==='wasps'){
   for(let i=0;i<5;i++){
    const e=createEnemy({id:'balloon-wasp-'+i,kind:'fly',x:700+i*180,y:700,patrol:240,name:'balloon.wasp',balloonWasp:true,grappleable:false},i);
    Object.assign(e,{w:82,h:60,hp:150,maxHp:150,damageValue:3,xpValue:25,origin:level.arena.x+level.arena.w/2-41,patrol:level.arena.w/2-51,patrolLeft:level.arena.x+10,patrolRight:level.arena.x+level.arena.w-92});enemies.push(e);
   }
  }else if(flight.stage==='dragon')enemies.push(WatchtowerBalloonCombat.create({id:'balloonDragon',miniboss:'balloonDragon',x:1400,y:850,name:'balloon.dragon',arena:level.arena,grappleable:false}));
 }
 function victory(e){
  if(!active()||e.replay||!enemies.includes(e))return false;
  const event={watchtowerJailer:'defeatJailer',watchtowerSentinel:'escapeSentinel',balloonDragon:'defeatDragon',westheruSeal:'restoreWestheru'}[e.miniboss];
  if(!event||!commit(event))return false;
  if(e.miniboss==='watchtowerSentinel')departing={actor:{...e},elapsed:0};
  else{awardXP(e.miniboss==='watchtowerJailer'?600:1200);persist();updateHUD();}
  if(e.miniboss==='westheruSeal'){morph={kind:'restore',elapsed:0,actor:{...e}};attack=0;}
  return true;
 }
 function damageBalloon(amount){
  if(level!==balloonJourney||!flight||state!=='play')return false;
  const next=rules.damageBalloon(flight,amount);if(!next)return false;
  Object.assign(flight,next);
  if(flight.failed){
   projectiles=[];const owner=player;
   story('balloon.journey','balloon.journey','balloon.failed',()=>{
    if(level!==balloonJourney||player!==owner)return;
    enemies=[];initPlayer(checkpoint);populate();
   });
  }
  return true;
 }
 function update(dt){
  if(!active()||state!=='play'||!Number.isFinite(dt)||dt<=0)return;
  if(tracked!==level){tracked=level;if(level===balloonJourney)populate();if(level===ninjaWatchtower)resetEscort();}
  if(morph){
   morph.elapsed+=dt;
   if(morph.elapsed>=2){const kind=morph.kind;morph=null;story('balloon.landing','balloon.pilot',kind==='restore'?'balloon.restoredStory':'balloon.transformStory',null,{right:kind==='restore'?'westheru':'westheruSeal',speaker:kind==='restore'?'westheru':null});}
   return;
  }
  if(vortex){
   vortex.elapsed+=dt;
   if(vortex.elapsed>=3){
    vortex=null;const previous=flags;
    if(!owns(p.arrived)&&!commit('arrive'))return;
    if(!travel('stormIslands')){flags=previous;persist();return;}
    story('balloon.stormIslands','balloon.pilot','balloon.arrivalStory');
   }
   return;
  }
  updateEscort(dt);
  if(departing){departing.elapsed+=dt;if(departing.elapsed>=1.2){departing=null;story('watchtower.name','watchtower.sentinel','watchtower.escapeStory');}return;}
  if(level===skyLanding&&!owns(p.restored)&&!sealIntroduced&&pointNear(level.pilotPoint,650,100)){
   sealIntroduced=true;morph={kind:'transform',elapsed:0,actor:{...enemies.find(e=>e.miniboss==='westheruSeal')}};attack=0;return;
  }
  if(level!==balloonJourney||!flight||flight.failed)return;
  if(owns(p.dragon)){travel('skyLanding');return;}
  flight.elapsed+=dt;
  if(!flight.spawned){flight.cruise+=dt;if(flight.cruise>=6)spawnFlight();return;}
  if(flight.stage==='wasps'&&enemies.every(e=>e.dead)){
   if(commit('clearWasps')){populate();flight.stage='dragon';}return;
  }
 }
 function context(){
  if(Prologue.active||locked()||!rules.eligible(flags))return null;
  if(level===floatingIslands&&pointNear(level.watchtowerEntrance,95,85))return {type:'watchtowerEnter',text:'watchtower.enter'};
  if(level===ninjaWatchtower){
   if(pointNear(level.returnPoint,95,85))return {type:'watchtowerReturn',text:'watchtower.return'};
   if(!owns(p.rescued)&&pointNear(level.cellPoint,95,85))return {type:'watchtowerRescue',text:owns(p.key)?'watchtower.free':'watchtower.cellLocked',locked:!owns(p.key)};
   if(owns(p.sentinel)&&pointNear(level.boardPoint,95,85))return {type:'watchtowerBoard',text:'balloon.board'};
  }
  if(level===skyLanding&&owns(p.restored)&&pointNear(level.boardPoint,100,85))return {type:'balloonContinue',text:'balloon.continue'};
  return null;
 }
 function interact(candidate){
  const c=context();if(state!=='play'||!c||candidate?.type!==c.type||c.locked)return false;
  if(c.type==='watchtowerEnter')return travel('ninjaWatchtower');
  if(c.type==='watchtowerReturn')return CampQuest.leave();
  if(c.type==='watchtowerRescue'){
   if(!commit('rescueWestheru'))return false;
   resetEscort();story('watchtower.name','balloon.pilot','watchtower.rescueStory',null,{right:'westheru',speaker:'westheru'});return true;
  }
  if(c.type==='watchtowerBoard'){
   if(!owns(p.boarded)&&!commit('board'))return false;
   return travel(owns(p.dragon)?'skyLanding':'balloonJourney');
  }
  if(c.type==='balloonContinue'){
   vortex={elapsed:0};attack=0;attackCooldown=0;player.inv=Math.max(player.inv,3.2);return true;
  }
  return false;
 }
 function objective({remote=true}={}){
  if(!rules.eligible(flags))return active()?{text:'watchtower.objective.rescue',compass:false}:null;
  let map=ninjaWatchtower,point=map.cellPoint,text='watchtower.objective.rescue';
  if(owns(p.arrived))return active()?{text:'story.journeyEnd',compass:false,journeyEnd:true}:null;
  if(owns(p.restored)){map=skyLanding;point=map.boardPoint;text='balloon.continue';}
  else if(owns(p.dragon)){map=skyLanding;point=map.pilotPoint;text='balloon.objective.seal';}
  else if(owns(p.boarded)){map=balloonJourney;point=map.pilotPoint;text=owns(p.wasps)?'balloon.objective.dragon':'balloon.objective.wasps';}
  else if(owns(p.sentinel)){point=map.boardPoint;text='balloon.board';}
  else if(owns(p.rescued)){point=map.boardPoint;text='watchtower.objective.escort';}
  if(level===floatingIslands){point=level.watchtowerEntrance;text='watchtower.enter';map=level;}
  return level===map?{point,text,name:map.name,compass:true}:remote?{text,name:map.name,remote:true,compass:false}:null;
 }
 function hud(){
  if(!active())return false;
  const e=enemies.find(e=>WatchtowerBalloonCombat.is(e)&&e.active&&!e.dead);
  $('bossHud').hidden=!e;if(e){$('bossName').textContent=I18n.t(e.name);$('bossHealth').style.width=Math.max(0,e.hp/e.maxHp)*100+'%';}
  if(level===balloonJourney&&flight){$('campExecutionWarning').hidden=false;$('campExecutionWarning').textContent=I18n.format('balloon.health',[flight.hp,flight.maxHp]);}
  return true;
 }
 function updateWasp(e,dt){
  if(!e.balloonWasp)return false;
  if(state!=='play'||e.dead||!(active()||e.towerEnemy&&level.tower&&TowerMode.running))return true;
  e.animTime+=dt;e.inv=Math.max(0,(e.inv||0)-dt);e.stun=Math.max(0,e.stun-dt);e.cd-=dt;
  if(e.stun>0)return true;
  e.face=Math.sign(player.x-e.x)||1;
  if(e.windup>0){e.windup=Math.max(0,e.windup-dt);if(!e.windup){e.attackTime=.35;e.attackElapsed=0;e.hitDone=false;const a=Math.atan2(e.targetY-e.y,e.targetX-e.x);e.vx=Math.cos(a)*480;e.vy=Math.sin(a)*480;}return true;}
  if(e.attackTime>0){
   e.attackTime=Math.max(0,e.attackTime-dt);e.attackElapsed+=dt;const before={x:e.x,y:e.y};e.x+=e.vx*dt;e.y+=e.vy*dt;
   const swept={x:Math.min(before.x,e.x),y:Math.min(before.y,e.y),w:Math.abs(e.x-before.x)+e.w,h:Math.abs(e.y-before.y)+e.h};
   if(!e.hitDone&&overlap(player,swept)){e.hitDone=true;damage(e.damageValue??3,e.face,true);}e.cd=.85;return true;
  }
  const tx=clamp(player.x+player.w/2,level.arena.x+70,level.arena.x+level.arena.w-70),ty=player.y-85;
  e.x+=clamp(tx-e.x,-100*dt,100*dt);e.y+=clamp(ty-e.y,-80*dt,80*dt);
  if(e.cd<=0){e.windup=e.windupDuration=.8;e.targetX=player.x;e.targetY=player.y;}
  return true;
 }
 return Object.freeze({active,locked,clear,update,updateWasp,context,interact,objective,hud,victory,damageBalloon,companion,ropeEscort:()=>ropeEscort,flight:()=>flight,morph:()=>morph,vortex:()=>vortex,departure:()=>departing,cinematic:()=>!!departing||!!vortex||!!morph});
})();
