/* Portal guardian: combat authors every target and clock; rendering only reads them. */
'use strict';
const GatekeeperCombat=(()=>{
 const guardian='guardian:VoidGatekeeper',order=['crescentSweep','riftFan','voidEruption','piercingThrust'];
 const is=e=>e?.miniboss==='voidGatekeeper',source=e=>'mini:'+e.id;
 const current=e=>is(e)&&realm===3&&level.id==='zigguratDepths'&&enemies.includes(e)&&!e.dead;
 const enraged=e=>e.hp<=e.maxHp*.5;
 const eligible=e=>flags[3].includes('zigguratDescentAccepted')||e.replay&&DevSession.active;
 const enemy=()=>enemies.find(e=>current(e)&&e.active);
 const locked=()=>!!enemy();
 function phase(e,next,duration){
  Object.assign(e,{phase:next,clock:duration,phaseDuration:duration,windup:next==='windup'?duration:0,windupDuration:duration,
   attackTime:next==='strike'?duration:0,attackDuration:duration,attackElapsed:0,hitDone:false});
 }
 function clearShots(e){projectiles=projectiles.filter(p=>p.source!==source(e));}
 function reset(e){
  if(!is(e))return false;clearShots(e);
  Object.assign(e,{x:e.origin,y:e.baseY,hp:e.maxHp,active:false,dead:!e.replay&&flags[3].includes(guardian),face:-1,attackFace:-1,
   patrolFace:-1,cycles:0,move:null,inv:0,stun:0,walkSpeed:0,animTime:0,guardBreak:0,blockFlash:0,
   attackBox:null,hazards:[],poseIndex:0,targetX:null,targetY:null});phase(e,'wait',.85);return e;
 }
 function create(spec){
  const arena=spec.arena||level.arena;
  return reset({...spec,name:'descent.gatekeeper',w:110,h:190,maxHp:2200,origin:spec.x,baseY:spec.y-190,
   arena,patrolLeft:arena.x+25,patrolRight:arena.x+arena.w-135});
 }
 function enforceBounds(){
  const e=enemy();if(!e||state!=='play')return false;
  const left=e.arena.x+15,right=e.arena.x+e.arena.w-player.w-15;
  if(player.x<left){player.x=left;player.vx=Math.max(0,player.vx||0);}
  if(player.x>right){player.x=right;player.vx=Math.min(0,player.vx||0);}return true;
 }
 function tell(e){
  const distance=Math.abs(player.x+player.w/2-e.x-e.w/2);
  e.move=order[e.cycles++%order.length];
  if(distance>420&&(e.move==='crescentSweep'||e.move==='piercingThrust'))e.move='riftFan';
  e.attackFace=e.face;e.targetX=player.x+player.w/2;e.targetY=player.y+player.h*.5;e.attackBox=null;
  const duration=(e.move==='voidEruption'?1.1:e.move==='riftFan'?.95:.85)*(enraged(e)?.8:1);
  if(e.move==='crescentSweep'||e.move==='piercingThrust'){
   const reach=e.move==='crescentSweep'?310:430;
   e.attackBox={x:e.attackFace>0?e.x+e.w*.35:e.x-reach,y:e.move==='crescentSweep'?e.y-20:e.y+45,w:reach+e.w*.65,h:e.move==='crescentSweep'?e.h+30:100};
  }
  if(e.move==='voidEruption'){
   const count=enraged(e)?5:3;
   for(let i=0;i<count;i++){
    const x=clamp(e.targetX+(i-(count-1)/2)*170,e.arena.x+70,e.arena.x+e.arena.w-70);
    e.hazards.push({kind:'voidEruption',x:x-65,y:e.arena.y-180,w:130,h:180,warning:duration+i*.1,life:duration+i*.1+.45,active:false,damage:3,hitDone:false});
   }
  }
  phase(e,'windup',duration);e.poseIndex=e.move==='riftFan'||e.move==='voidEruption'?4:2;
 }
 function strike(e){
  if(e.hitDone||!e.attackBox||!overlap(player,e.attackBox))return true;
  const victim=player,accepted=damage(e.move==='piercingThrust'?4:3,e.attackFace,true);
  if(accepted!==false)e.hitDone=true;
  return victim===player&&current(e)&&state==='play';
 }
 function release(e){
  phase(e,'strike',e.move==='piercingThrust'?.36:.48);
  e.poseIndex=e.move==='crescentSweep'?3:e.move==='piercingThrust'?5:4;
  if(e.attackBox)return strike(e);
  if(e.move==='riftFan'){
   const x=e.x+e.w/2,y=e.y+e.h*.38,angle=Math.atan2(e.targetY-y,e.targetX-x),count=enraged(e)?7:5;
   for(let i=0;i<count;i++){
    const a=angle+(i-(count-1)/2)*.17;shoot(x,y,Math.cos(a)*(enraged(e)?350:290),Math.sin(a)*(enraged(e)?350:290),'#ba80ed',6,'shadowBolt');
    Object.assign(projectiles.at(-1),{source:source(e),damage:2,radius:11});
   }
  }
  return true;
 }
 function hazards(e,dt){
  for(const h of e.hazards){
   h.warning=Math.max(0,h.warning-dt);h.life-=dt;h.active=h.warning<=0;
   if(!h.hitDone&&h.active&&h.life>0&&overlap(player,h)){
    const victim=player,accepted=damage(h.damage,player.x+player.w/2>h.x+h.w/2?1:-1);
    if(accepted!==false)h.hitDone=true;
    if(victim!==player||!current(e)||state!=='play')return false;
   }
  }
  e.hazards=e.hazards.filter(h=>h.life>0);return true;
 }
 function update(e,dt){
  if(state!=='play'||!Number.isFinite(dt)||dt<=0||!current(e)||!eligible(e))return;
  if(!e.active){
   const feet=player.y+player.h;
   if(player.x+player.w<(e.arena.triggerX??e.arena.x)||player.x>e.arena.x+e.arena.w||feet<e.arena.y-220||feet>e.arena.y+30)return;
   e.active=true;
  }
  enforceBounds();e.inv=Math.max(0,e.inv-dt);e.stun=Math.max(0,e.stun-dt);e.clock-=dt;e.animTime+=dt;e.walkSpeed=0;
  if(!hazards(e,dt))return;
  if(e.phase==='wait'){
   const dx=player.x+player.w/2-e.x-e.w/2;e.face=Math.sign(dx)||e.face;
   if(Math.abs(dx)>230){const old=e.x;e.x=clamp(e.x+e.face*(enraged(e)?190:135)*dt,e.patrolLeft,e.patrolRight);e.walkSpeed=(e.x-old)/dt;}
   e.poseIndex=Math.abs(e.walkSpeed)>1?1:0;if(e.clock<=0)tell(e);
  }else if(e.phase==='windup'){
   e.windup=Math.max(0,e.clock);if(e.clock<=0&&!release(e))return;
  }else if(e.phase==='strike'){
   e.attackElapsed+=dt;e.attackTime=Math.max(0,e.clock);if(e.attackBox&&!strike(e))return;
   if(e.clock<=0){e.attackBox=null;phase(e,'recover',enraged(e)?.38:.65);e.poseIndex=0;}
  }else if(e.phase==='recover'&&e.clock<=0){phase(e,'wait',enraged(e)?.3:.5);e.poseIndex=0;}
 }
 function defeat(e){
  if(!current(e)||!e.active||e.hp>0)return false;
  e.dead=true;e.active=false;e.phase='dead';e.attackBox=null;e.hazards=[];e.windup=0;e.attackTime=0;e.walkSpeed=0;clearShots(e);
  if(e.replay)return false;
  return typeof ZigguratDescent!=='undefined'&&ZigguratDescent.gateVictory(e);
 }
 return Object.freeze({is,create,reset,update,defeat,locked,enforceBounds});
})();
