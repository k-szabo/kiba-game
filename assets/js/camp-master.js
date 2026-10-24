/* Optional camp encounter: its quest and rewards never replace Japan's guardian. */
'use strict';
const CampMaster=(()=>{
 const flag='guardian:campMaster',moves=['overhead','lunge','combo'];
 const is=enemy=>enemy?.miniboss==='campMaster';
 const current=enemy=>level===samuraiCamp&&enemies.includes(enemy)&&!enemy.dead;
 function phase(enemy,next,duration){
  enemy.phase=next;enemy.clock=duration;enemy.phaseDuration=duration;
  enemy.windup=next==='windup'?duration:0;enemy.windupDuration=duration;
  enemy.attackTime=next==='strike'?duration:0;enemy.attackDuration=duration;
  enemy.attackElapsed=0;enemy.hitDone=false;
 }
 function reset(enemy){
  Object.assign(enemy,{x:enemy.origin,y:enemy.baseY,hp:enemy.maxHp,active:false,
   dead:!enemy.replay&&flags[0].includes(flag),face:-1,attackFace:-1,patrolFace:-1,
   cycles:0,move:null,comboStep:0,inv:0,stun:0,walkSpeed:0,animTime:0,
   turnCooldown:0,guardBreak:0,blockFlash:0,hazards:[],attackBox:null,poseIndex:0});
  phase(enemy,'wait',.8);return enemy;
 }
 function create(spec){
  const arena=samuraiCamp.secrets.find(area=>area.id===spec.secretArea)?.arena||samuraiCamp.arena;
  return reset({...spec,w:70,h:100,maxHp:100,origin:spec.x,baseY:spec.y-100,
   patrolLeft:arena.x+25,patrolRight:arena.x+arena.w-95,arena});
 }
 function meleeBox(enemy,width=170,height=120){
  return {x:enemy.attackFace>0?enemy.x+enemy.w*.4:enemy.x-width,
   y:enemy.y-20,w:width+enemy.w*.6,h:height};
 }
 function tell(enemy,second=false){
  if(!second)enemy.attackFace=enemy.face;
  enemy.attackBox=meleeBox(enemy,enemy.move==='lunge'?270:170,enemy.move==='overhead'?145:120);
  phase(enemy,'windup',second?.35:enemy.move==='overhead'?.7:enemy.move==='lunge'?.55:.45);
  enemy.poseIndex=enemy.move==='overhead'?3:enemy.move==='lunge'?6:9;
 }
 function startStrike(enemy){
  if(enemy.move==='combo')enemy.comboStep++;
  phase(enemy,'strike',enemy.move==='overhead'?.2:enemy.move==='lunge'?.35:.18);
  enemy.poseIndex=enemy.move==='overhead'?4:enemy.move==='lunge'?7:enemy.comboStep===1?10:11;
 }
 function strike(enemy){
  if(enemy.hitDone)return true;
  const box=meleeBox(enemy,enemy.move==='lunge'?115:170,enemy.move==='overhead'?145:120);
  if(!overlap(player,box))return true;
  enemy.hitDone=true;
  const victim=player;
  damage(enemy.move==='combo'?1:2,enemy.attackFace,true);
  // Death may replace player/enemies synchronously. Do not continue the old
  // encounter against the shrine-spawned character or a different location.
  if(player!==victim||!current(enemy)||state!=='play'){reset(enemy);return false;}
  return true;
 }
 function update(enemy,dt){
  if(state!=='play'||!current(enemy)||!Number.isFinite(dt)||dt<=0)return;
  const a=enemy.arena,feet=player.y+player.h,
   inside=player.x+player.w>a.x-80&&player.x<a.x+a.w+80&&feet>=a.y-300&&feet<=a.y+25;
  if(!inside){if(enemy.active)reset(enemy);return;}
  if(!enemy.active){
   if(feet<a.y-180)return;
   if(!enemy.replay&&!flags[0].includes('mayorExecuted')){CampQuest.masterScene(enemy);return;}
   enemy.active=true;
  }
  enemy.inv=Math.max(0,enemy.inv-dt);enemy.stun=Math.max(0,enemy.stun-dt);
  enemy.clock-=dt;enemy.animTime+=dt;enemy.walkSpeed=0;
  if(enemy.phase==='wait'){
   const dx=player.x+player.w/2-enemy.x-enemy.w/2;
   enemy.face=Math.sign(dx)||enemy.face;
   if(Math.abs(dx)>115){const before=enemy.x;enemy.x=clamp(enemy.x+enemy.face*90*dt,enemy.patrolLeft,enemy.patrolRight);enemy.walkSpeed=(enemy.x-before)/dt;}
   enemy.poseIndex=Math.abs(enemy.walkSpeed)>1?Math.floor(enemy.animTime*7)%3:0;
   if(enemy.clock<=0){enemy.move=moves[enemy.cycles++%moves.length];enemy.comboStep=0;tell(enemy);}
  }else if(enemy.phase==='windup'){
   enemy.windup=Math.max(0,enemy.clock);if(enemy.clock<=0)startStrike(enemy);
  }else if(enemy.phase==='strike'){
   enemy.attackElapsed+=dt;enemy.attackTime=Math.max(0,enemy.clock);
   if(enemy.move==='lunge'){
    const before=enemy.x;enemy.x=clamp(enemy.x+enemy.attackFace*360*dt,enemy.patrolLeft,enemy.patrolRight);enemy.walkSpeed=(enemy.x-before)/dt;
   }
   if(!strike(enemy))return;
   if(enemy.clock<=0){
    if(enemy.move==='combo'&&enemy.comboStep===1)tell(enemy,true);
    else{phase(enemy,'recover',enemy.move==='combo'?.9:.8);enemy.attackBox=null;enemy.poseIndex=enemy.move==='overhead'?5:enemy.move==='lunge'?8:11;}
   }
  }else if(enemy.phase==='recover'&&enemy.clock<=0){enemy.attackBox=null;phase(enemy,'wait',.45);enemy.poseIndex=0;}
 }
 function defeat(enemy){
  if(enemy.dead)return false;
  enemy.dead=true;enemy.active=false;enemy.attackBox=null;enemy.hazards=[];
  enemy.poseIndex=0;enemy.move=null;enemy.attackTime=0;enemy.attackElapsed=0;enemy.windup=0;enemy.hitDone=false;enemy.walkSpeed=0;
  const first=!enemy.replay&&!flags[0].includes(flag);
  if(first){
   flags[0].push(flag);Merchant.award(60);awardXP(150);persist();
  }
  updateHUD();return first;
 }
 return Object.freeze({is,create,reset,update,defeat});
})();
