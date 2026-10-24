/* Inner prison guardian. Rendering reads authored boxes; combat owns every clock. */
'use strict';
const PrisonWarden=(()=>{
 const flag='guardian:prisonWarden',order=['chainSweep','lanternBolts','gravePulse'];
 const is=enemy=>enemy?.miniboss==='prisonWarden';
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
   face:-1,attackFace:-1,patrolFace:-1,cycles:0,move:null,inv:0,stun:0,walkSpeed:0,animTime:0,
   guardBreak:0,blockFlash:0,attackBox:null,hazards:[],poseIndex:0,targetX:null,targetY:null});
  phase(enemy,'wait',.85);return enemy;
 }
 function create(spec){
  const arena=spec.arena||level.secrets?.find(area=>area.id===spec.secretArea)?.arena||level.arena;
  return reset({...spec,name:'zen.warden.name',w:105,h:170,maxHp:150,origin:spec.x,baseY:spec.y-170,
   patrolLeft:arena.x+25,patrolRight:Math.max(arena.x+25,arena.x+arena.w-130),arena});
 }
 function inside(enemy){
  const a=enemy.arena,feet=player.y+player.h;
  return player.x+player.w>a.x-80&&player.x<a.x+a.w+80&&feet>=a.y-350&&feet<=a.y+25;
 }
 function chainBox(enemy){
  return {x:enemy.attackFace>0?enemy.x+enemy.w*.4:enemy.x-220,y:enemy.y-10,w:220+enemy.w*.6,h:enemy.h+20};
 }
 function tell(enemy){
  enemy.move=order[enemy.cycles++%order.length];enemy.attackFace=enemy.face;
  enemy.targetX=player.x+player.w/2;enemy.targetY=player.y+player.h*.5;enemy.attackBox=null;
  const duration=enemy.move==='chainSweep'?1:enemy.move==='lanternBolts'?1.2:1.3;
  if(enemy.move==='chainSweep')enemy.attackBox=chainBox(enemy);
  if(enemy.move==='gravePulse')for(const offset of [-150,0,150]){
   const x=clamp(enemy.targetX+offset,enemy.arena.x+60,enemy.arena.x+enemy.arena.w-60);
   enemy.hazards.push({kind:'gravePulse',x:x-55,y:enemy.arena.y-110,w:110,h:110,warning:duration,life:duration+.38,active:false,damage:2});
  }
  phase(enemy,'windup',duration);enemy.poseIndex=enemy.move==='chainSweep'?2:enemy.move==='lanternBolts'?5:6;
 }
 function strike(enemy){
  if(enemy.hitDone||!enemy.attackBox||!overlap(player,enemy.attackBox))return true;
  enemy.hitDone=true;const victim=player;damage(2,enemy.attackFace,true);
  return player===victim&&current(enemy)&&state==='play';
 }
 function release(enemy){
  phase(enemy,'strike',enemy.move==='chainSweep'?.45:.4);
  enemy.poseIndex=enemy.move==='chainSweep'?3:enemy.move==='lanternBolts'?5:6;
  if(enemy.move==='chainSweep')return strike(enemy);
  if(enemy.move==='lanternBolts'){
   const x=enemy.x+enemy.w/2,y=enemy.y+enemy.h*.4,angle=Math.atan2(enemy.targetY-y,enemy.targetX-x),count=enraged(enemy)?5:3;
   for(let n=0;n<count;n++){
    const a=angle+(n-(count-1)/2)*.2;shoot(x,y,Math.cos(a)*240,Math.sin(a)*240,'#bd92e8',5,'shadowBolt');
    Object.assign(projectiles.at(-1),{source:source(enemy),damage:1,radius:10});
   }
  }
  return true;
 }
 function hazards(enemy,dt){
  for(const hazard of enemy.hazards){
   hazard.warning=Math.max(0,hazard.warning-dt);hazard.life-=dt;hazard.active=hazard.warning<=0;
   if(hazard.active&&hazard.life>0&&overlap(player,hazard)){
    const victim=player;damage(hazard.damage,player.x+player.w/2>hazard.x+hazard.w/2?1:-1);
    if(player!==victim||!current(enemy)||state!=='play')return false;
   }
  }
  enemy.hazards=enemy.hazards.filter(hazard=>hazard.life>0);return true;
 }
 function update(enemy,dt){
  if(state!=='play'||!Number.isFinite(dt)||dt<=0||!current(enemy))return;
  if(!inside(enemy)){if(enemy.active)reset(enemy);return;}
  if(!enemy.active){if(player.y+player.h<enemy.arena.y-200)return;enemy.active=true;}
  enemy.inv=Math.max(0,enemy.inv-dt);enemy.stun=Math.max(0,enemy.stun-dt);enemy.clock-=dt;enemy.animTime+=dt;enemy.walkSpeed=0;
  if(!hazards(enemy,dt))return;
  if(enemy.phase==='wait'){
   const dx=player.x+player.w/2-enemy.x-enemy.w/2;enemy.face=Math.sign(dx)||enemy.face;
   if(Math.abs(dx)>175){const old=enemy.x;enemy.x=clamp(enemy.x+enemy.face*(enraged(enemy)?90:65)*dt,enemy.patrolLeft,enemy.patrolRight);enemy.walkSpeed=(enemy.x-old)/dt;}
   enemy.poseIndex=Math.abs(enemy.walkSpeed)>1?1:0;
   if(enemy.clock<=0)tell(enemy);
  }else if(enemy.phase==='windup'){
   enemy.windup=Math.max(0,enemy.clock);if(enemy.clock<=0&&!release(enemy))return;
  }else if(enemy.phase==='strike'){
   enemy.attackElapsed+=dt;enemy.attackTime=Math.max(0,enemy.clock);
   if(enemy.move==='chainSweep'&&!strike(enemy))return;
   if(enemy.clock<=0){enemy.attackBox=null;phase(enemy,'recover',enraged(enemy)?.65:.9);enemy.poseIndex=4;}
  }else if(enemy.phase==='recover'&&enemy.clock<=0){phase(enemy,'wait',.55);enemy.poseIndex=0;}
 }
 function defeat(enemy){
  if(!current(enemy)||!enemy.active||enemy.hp>0)return false;
  const first=!enemy.replay&&!flags[3].includes(flag);
  enemy.dead=true;enemy.active=false;enemy.phase='dead';enemy.attackBox=null;enemy.hazards=[];enemy.windup=0;enemy.attackTime=0;enemy.walkSpeed=0;
  clearShots(enemy);
  if(first){
   flags[3].push(flag);Merchant.award(Merchant.rewards.miniboss);awardXP(180);persist();updateHUD();
   if(state==='play'&&level.id==='shadowPrison'&&enemies.includes(enemy)&&typeof PrisonQuest!=='undefined'&&typeof PrisonQuest.wardenVictory==='function')PrisonQuest.wardenVictory(enemy);
  }
  return first;
 }
 return Object.freeze({is,create,reset,update,defeat});
})();
