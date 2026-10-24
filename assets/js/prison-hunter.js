/* The lower prison hunter locks his aim before either spear or bow is released. */
'use strict';
const PrisonHunter=(()=>{
 const flag='guardian:prisonHunter';
 const is=enemy=>enemy?.miniboss==='prisonHunter';
 const source=enemy=>'mini:'+enemy.id;
 const current=enemy=>is(enemy)&&realm===3&&level.id==='shadowPrison'&&enemies.includes(enemy)&&!enemy.dead;
 const enraged=enemy=>enemy.hp<=enemy.maxHp*.5;
 function phase(enemy,next,duration){
  enemy.phase=next;enemy.clock=duration;enemy.phaseDuration=duration;
  enemy.windup=next==='windup'?duration:0;enemy.windupDuration=duration;
  enemy.attackTime=next==='strike'?duration:0;enemy.attackDuration=duration;
  enemy.attackElapsed=0;enemy.hitDone=false;
 }
 function clearShots(enemy){projectiles=projectiles.filter(shot=>shot.source!==source(enemy));}
 function reset(enemy){
  if(!is(enemy))return false;
  clearShots(enemy);
  Object.assign(enemy,{x:enemy.origin,y:enemy.baseY,hp:enemy.maxHp,active:false,dead:!enemy.replay&&flags[3].includes(flag),
   face:1,attackFace:1,patrolFace:1,cycles:0,move:null,inv:0,stun:0,walkSpeed:0,animTime:0,
   guardBreak:0,blockFlash:0,attackBox:null,hazards:[],poseIndex:0,targetX:null,targetY:null});
  phase(enemy,'wait',.75);return enemy;
 }
 function create(spec){
  const arena=spec.arena||level.secrets?.find(area=>area.id===spec.secretArea)?.arena||level.hunterArena;
  return reset({...spec,name:'fia.hunter.name',w:90,h:145,maxHp:140,origin:spec.x,baseY:spec.y-145,
   patrolLeft:arena.x+25,patrolRight:Math.max(arena.x+25,arena.x+arena.w-115),arena});
 }
 function inside(enemy){
  const a=enemy.arena,feet=player.y+player.h;
  return player.x+player.w>a.x-80&&player.x<a.x+a.w+80&&feet>=a.y-350&&feet<=a.y+25;
 }
 function tell(enemy){
  const distance=Math.abs(player.x+player.w/2-enemy.x-enemy.w/2);
  enemy.move=distance>260||enemy.cycles++%3===1?'bowVolley':'spearThrust';enemy.attackFace=enemy.face;
  enemy.targetX=player.x+player.w/2;enemy.targetY=player.y+player.h*.5;
  enemy.attackBox=enemy.move==='spearThrust'?{x:enemy.attackFace>0?enemy.x+enemy.w*.4:enemy.x-225,y:enemy.y+enemy.h-125,w:225+enemy.w*.6,h:125}:null;
  phase(enemy,'windup',enemy.move==='spearThrust'?.8:1);
  enemy.poseIndex=enemy.move==='spearThrust'?2:5;
 }
 function strike(enemy){
  if(enemy.hitDone||!enemy.attackBox||!overlap(player,enemy.attackBox))return true;
  enemy.hitDone=true;const victim=player;damage(2,enemy.attackFace,true);
  return player===victim&&current(enemy)&&state==='play';
 }
 function release(enemy){
  phase(enemy,'strike',enemy.move==='spearThrust'?.3:.35);
  enemy.poseIndex=enemy.move==='spearThrust'?3:6;
  if(enemy.move==='spearThrust')return strike(enemy);
  const x=enemy.x+enemy.w/2,y=enemy.y+enemy.h*.35,angle=Math.atan2(enemy.targetY-y,enemy.targetX-x),count=enraged(enemy)?5:3;
  for(let i=0;i<count;i++){
   const a=angle+(i-(count-1)/2)*.11;
   shoot(x,y,Math.cos(a)*420,Math.sin(a)*420,'#d5bb89',4,'arrow');
   Object.assign(projectiles.at(-1),{source:source(enemy),damage:2,radius:7});
  }
  return true;
 }
 function update(enemy,dt){
  if(state!=='play'||!Number.isFinite(dt)||dt<=0||!current(enemy))return;
  if(!inside(enemy)){if(enemy.active)reset(enemy);return;}
  if(!enemy.active){if(player.y+player.h<enemy.arena.y-200)return;enemy.active=true;}
  enemy.inv=Math.max(0,enemy.inv-dt);enemy.stun=Math.max(0,enemy.stun-dt);enemy.clock-=dt;enemy.animTime+=dt;enemy.walkSpeed=0;
  if(enemy.phase==='wait'){
   const dx=player.x+player.w/2-enemy.x-enemy.w/2;enemy.face=Math.sign(dx)||enemy.face;
   if(Math.abs(dx)>185&&Math.abs(dx)<420){const old=enemy.x;enemy.x=clamp(enemy.x+enemy.face*(enraged(enemy)?120:90)*dt,enemy.patrolLeft,enemy.patrolRight);enemy.walkSpeed=(enemy.x-old)/dt;}
   enemy.poseIndex=Math.abs(enemy.walkSpeed)>1?1:0;
   if(enemy.clock<=0)tell(enemy);
  }else if(enemy.phase==='windup'){
   enemy.windup=Math.max(0,enemy.clock);if(enemy.clock<=0&&!release(enemy))return;
  }else if(enemy.phase==='strike'){
   enemy.attackElapsed+=dt;enemy.attackTime=Math.max(0,enemy.clock);
   if(enemy.move==='spearThrust'&&!strike(enemy))return;
   if(enemy.clock<=0){enemy.attackBox=null;phase(enemy,'recover',enraged(enemy)?.65:.85);enemy.poseIndex=4;}
  }else if(enemy.phase==='recover'){
   // A short, bounded backstep gives the hunter room without a tracking attack.
   if(enemy.clock>enemy.phaseDuration-.35){const old=enemy.x;enemy.x=clamp(enemy.x-enemy.attackFace*100*dt,enemy.patrolLeft,enemy.patrolRight);enemy.walkSpeed=(enemy.x-old)/dt;enemy.poseIndex=Math.abs(enemy.walkSpeed)>1?7:4;}
   else enemy.poseIndex=4;
   if(enemy.clock<=0){phase(enemy,'wait',.45);enemy.poseIndex=0;}
  }
 }
 function defeat(enemy){
  if(!current(enemy)||!enemy.active||enemy.hp>0)return false;
  const first=!enemy.replay&&!flags[3].includes(flag);
  enemy.dead=true;enemy.active=false;enemy.phase='dead';enemy.attackBox=null;enemy.windup=0;enemy.attackTime=0;enemy.walkSpeed=0;
  clearShots(enemy);
  if(first){flags[3].push(flag);Merchant.award(Merchant.rewards.miniboss);awardXP(200);persist();updateHUD();}
  return first;
 }
 return Object.freeze({is,create,reset,update,defeat});
})();
