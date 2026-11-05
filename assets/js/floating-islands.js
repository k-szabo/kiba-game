/* Opening ambush, escape and companion state share one owner; no guardian reward. */
'use strict';
const FloatingIslands=(()=>{
 const rules=FloatingIslandsRules,companion=HaruFollower.create(),is=e=>e?.miniboss==='shadowNinjaLeader';
 let tracked=null,poison=null,tether=null,departing=null;
 const active=()=>level===floatingIslands&&!Prologue.active;
 const tower=e=>e?.towerBoss&&level.tower&&typeof TowerMode!=='undefined'&&TowerMode.running;
 const abducted=()=>rules.abducted(flags);
 const current=e=>(active()||tower(e))&&is(e)&&enemies.includes(e)&&!e.dead;
 const enemy=()=>active()?enemies.find(e=>is(e)&&!e.dead&&e.active):null;
 const locked=()=>!!departing||!!enemy();
 const source=e=>'mini:'+e.id;
 function reset(e){
  projectiles=projectiles.filter(p=>p.source!==source(e));
  if(e.towerBoss){if(poison?.sourceId===e.id)poison=null;if(tether?.sourceId===e.id)tether=null;}
  Object.assign(e,{x:e.origin,y:e.baseY,hp:e.maxHp,active:false,dead:!e.replay&&abducted(),face:-1,attackFace:-1,cycles:0,phase:'wait',clock:.7,windup:0,windupDuration:.8,attackTime:0,attackElapsed:0,attackDuration:.4,inv:0,stun:0,animTime:0,walkSpeed:0,poseIndex:0,move:null,attackBox:null,hitDone:false,hazards:[],guardBreak:0,blockFlash:0});return e;
 }
 function create(spec){const a=spec.arena||level.arena;return reset({...spec,w:BossCatalog.story('shadowNinjaLeader').w,h:BossCatalog.story('shadowNinjaLeader').h,maxHp:BossCatalog.story('shadowNinjaLeader').hp,origin:spec.x,baseY:spec.y-BossCatalog.story('shadowNinjaLeader').h,arena:a,patrolLeft:a.x+20,patrolRight:a.x+a.w-90});}
 function enforceBounds(){const e=enemy();if(!e||state!=='play')return;player.x=clamp(player.x,e.arena.x+10,e.arena.x+e.arena.w-player.w-10);}
 function escape(e){
  if(!current(e)||!e.active)return false;
  if(tower(e)){
   e.dead=true;e.active=false;e.phase='dead';e.attackBox=null;e.hazards=[];e.windup=0;e.attackTime=0;
   projectiles=projectiles.filter(p=>p.source!==source(e));if(poison?.sourceId===e.id)poison=null;if(tether?.sourceId===e.id)tether=null;return true;
  }
  e.dead=true;e.active=false;e.phase='escaped';e.poseIndex=7;e.attackBox=null;e.hazards=[];projectiles=projectiles.filter(p=>p.source!==source(e));poison=tether=null;
  if(e.replay||DevSession.active)return true;
  const next=rules.transition(flags,'escape');if(!next.ok)return false;
  departing={actor:{...e},haru:companion.snapshot(),elapsed:0,map:level};flags=next.flags;attack=0;attackCooldown=0;burst(e.x+e.w/2,e.y+e.h*.6,'#8c909b',24);persist();updateHUD();return true;
 }
 function tell(e){
  e.move=['dagger','shuriken','poison','hook','smoke'][e.cycles++%5];
  if(Math.abs(player.x-e.x)>300&&e.move==='dagger')e.move='shuriken';
  e.targetX=player.x+player.w/2;e.targetY=player.y+player.h/2;e.attackFace=e.face;
  e.clock=e.move==='smoke'?.95:.75;e.phase='windup';e.windup=e.windupDuration=e.clock;e.hitDone=false;
  e.attackBox=e.move==='dagger'?{x:e.attackFace>0?e.x+e.w/2:e.x-150,y:e.y+15,w:185,h:100}:e.move==='smoke'?{x:e.targetX-100,y:e.arena.y-140,w:200,h:140}:null;
  e.poseIndex=e.move==='dagger'?2:e.move==='hook'?5:e.move==='smoke'?6:4;
 }
 function release(e){
  e.phase='recover';e.clock=.45;e.windup=0;e.attackTime=.4;
  if(e.move==='dagger'){e.poseIndex=3;if(overlap(player,e.attackBox))damage(4,e.attackFace,true);}
  else if(e.move==='smoke'){
   if(dash<=0&&overlap(player,e.attackBox)){player.stun=Math.max(player.stun||0,.7);toast(I18n.t('islands.stunned'));}
   burst(e.targetX,e.arena.y-50,'#8c909b',18);e.poseIndex=6;
  }else{
   const x=e.x+e.w/2,y=e.y+e.h*.4,a=Math.atan2(e.targetY-y,e.targetX-x),count=e.move==='shuriken'?5:1;
   for(let i=0;i<count;i++){const angle=a+(i-(count-1)/2)*.13;shoot(x,y,Math.cos(angle)*450,Math.sin(angle)*450,e.move==='poison'?'#95c485':'#c6d8d8',e.move==='hook'?2:4,e.move==='shuriken'?'ninjaStar':e.move==='hook'?'arrow':'shadowBolt');Object.assign(projectiles.at(-1),{source:source(e),damage:e.move==='hook'?2:3,islandEffect:e.move,ownerId:e.id});}
  }
  e.attackBox=null;
 }
 function updateEnemy(e,dt){
  if(!current(e)||state!=='play'||!Number.isFinite(dt)||dt<=0)return;
  if(!tower(e)&&!rules.eligible(flags)&&!DevSession.active)return;
  if(!e.active){if(player.x+player.w<e.arena.triggerX||player.x>e.arena.x+e.arena.w)return;e.active=true;}
  if(tower(e)){if(e.hp<=0){escape(e);return;}if(!tickEffects(dt,e.id))return;}
  else if(rules.shouldEscape(e.hp,e.maxHp)){escape(e);return;}
  enforceBounds();e.clock-=dt;e.inv=Math.max(0,e.inv-dt);e.stun=Math.max(0,e.stun-dt);e.attackTime=Math.max(0,e.attackTime-dt);e.animTime+=dt;e.walkSpeed=0;
  if(e.phase==='wait'){
   const dx=player.x+player.w/2-e.x-e.w/2;e.face=Math.sign(dx)||e.face;
   if(Math.abs(dx)>190){const old=e.x;e.x=clamp(e.x+e.face*220*dt,e.patrolLeft,e.patrolRight);e.walkSpeed=(e.x-old)/dt;}
   e.poseIndex=Math.abs(e.walkSpeed)>1?1:0;if(e.clock<=0)tell(e);
  }else if(e.phase==='windup'){e.windup=Math.max(0,e.clock);if(e.clock<=0)release(e);}
  else if(e.clock<=0){e.phase='wait';e.clock=.35;e.poseIndex=0;}
 }
 function clear(){tracked=null;poison=tether=departing=null;}
 function resetFollower(){
  tracked=null;if(!active()||abducted()||!player)return;
  const p=platforms.find(p=>!p.broken&&Math.abs(player.y+player.h-p.y)<4&&player.x+player.w>p.x&&player.x<p.x+p.w);if(!p)return;
  companion.reset({x:clamp(player.x-78,p.x+4,p.x+p.w-46),y:p.y-70,face:player.face},platforms);tracked=level;
 }
 function update(dt){
  if(!active()||state!=='play'||!Number.isFinite(dt)||dt<=0)return;
  if(departing){departing.elapsed+=dt;player.inv=Math.max(player.inv,.15);if(departing.elapsed>=1.4){departing=null;story('islands.name','islands.ninjaLeader','islands.abduction');}return;}
  if(!abducted()){if(tracked!==level)resetFollower();if(tracked===level)companion.update(dt,player,platforms);}
  if(!tickEffects(dt))return;
  if(rules.hookOwned(flags)&&!flags[0].includes(rules.progress.trail)&&pointNear(level.trailPoint,90,100)){const next=rules.transition(flags,'reachTrail');if(next.ok){flags=next.flags;persist();updateHUD();}}
 }
 function tickEffects(dt,sourceId=null){
  if(poison&&(sourceId===null||poison.sourceId===sourceId)){
   if(poison.owner!==player){poison=null;}else{poison.left-=dt;poison.tick-=dt;if(poison.tick<=0){poison.tick+=1;const owner=player;damage(1,0,false);if(owner!==player)return;}if(poison&&poison.left<=0)poison=null;}
  }
  if(state!=='play')return false;
  if(tether&&(sourceId===null||tether.sourceId===sourceId)){if(tether.owner!==player){tether=null;}else{tether.left-=dt;const step=GrappleRules.move(player,tether.point,dt,platforms);if(step){player.x=step.x;player.y=step.y;}if(!step||step.done||tether.left<=0)tether=null;}}
  return true;
 }
 function projectile(p,victim,before){
  const leader=active()?enemy():enemies.find(e=>is(e)&&tower(e)&&e.id===p.ownerId&&!e.dead);
  if((!active()&&!leader)||victim!==player||state!=='play'||before<=victim.hp)return;
  if(p.islandEffect==='poison'){poison={owner:player,sourceId:p.ownerId,left:3,tick:1};toast(I18n.t('islands.poison'));}
  if(p.islandEffect==='hook'){
   const e=leader;if(e&&e.id===p.ownerId)tether={owner:player,sourceId:e.id,left:.35,point:{x:e.x+e.w/2+e.face*100,y:e.arena.y-player.h/2}};
  }
 }
 function context(){
  if(Prologue.active||locked()||!rules.eligible(flags))return null;
  if(level===japanHeights&&pointNear(level.islandsEntrance,95,80))return {type:'islandsEnter',text:'islands.enter'};
  if(active()&&pointNear(level.returnPoint,95,80))return {type:'islandsReturn',text:I18n.format('ziggurat.return',[I18n.t('descent.heights')])};
  if(active()&&abducted()&&!rules.hookOwned(flags)&&pointNear(level.hookPoint,95,80))return {type:'islandsHook',text:'islands.takeHook'};
  return null;
 }
 function interact(candidate){
  const actual=context();if(state!=='play'||!actual||candidate?.type!==actual.type)return false;
  if(actual.type==='islandsEnter')return CampQuest.enter('floatingIslands');
  if(actual.type==='islandsReturn')return CampQuest.leave();
  const next=rules.transition(flags,'takeHook');if(!next.ok)return false;flags=next.flags;persist();updateHUD();toast(I18n.format('help.grapple',[bindingKeyLabel(Bindings.read('grapple')[0])]));return true;
 }
 function objective({remote=true}={}){
  if(!rules.eligible(flags)&&!(DevSession.active&&active()))return null;
  if(flags[0].includes(rules.progress.trail))return {text:'story.journeyEnd',compass:false,journeyEnd:true};
  const map=active()?floatingIslands:japanHeights;
  const point=active()?(!abducted()?{x:1250,y:2850}:!rules.hookOwned(flags)?level.hookPoint:level.trailPoint):japanHeights.islandsEntrance;
  const text=!abducted()?'islands.objective.protect':!rules.hookOwned(flags)?'islands.objective.hook':'islands.objective.trail';
  return level===map?{point,text,name:'islands.name',compass:true}:remote?{text,name:'islands.name',remote:true,compass:false}:null;
 }
 function hud(){if(!active())return false;const e=enemy();$('bossHud').hidden=!e;if(e){$('bossName').textContent=I18n.t(e.name);$('bossHealth').style.width=Math.max(0,e.hp/e.maxHp)*100+'%';}return true;}
 const follower=()=>active()&&!abducted()&&tracked===level?companion.snapshot():null;
 return Object.freeze({is,create,reset,updateEnemy,defeat:escape,enforceBounds,active,locked,clear,resetFollower,update,projectile,context,interact,objective,hud,follower,departure:()=>departing,cinematic:()=>!!departing});
})();
