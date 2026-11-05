/* Combat owns fixed targets, active-time clocks and source-scoped projectiles. */
'use strict';
const WatchtowerBalloonCombat=(()=>{
 const profiles=Object.freeze(Object.fromEntries(["watchtowerJailer","watchtowerSentinel","balloonDragon","westheruSeal"].map(id=>[id,BossCatalog.story(id)])));
 const is=e=>!!e&&Object.hasOwn(profiles,e.miniboss),source=e=>'mini:'+e.id;
 const tower=e=>!!e?.towerBoss&&level.tower&&TowerMode.running;
 const current=e=>is(e)&&(WatchtowerBalloon.active()||tower(e))&&enemies.includes(e)&&!e.dead;
 const progressKey={watchtowerJailer:'jailer',watchtowerSentinel:'sentinel',balloonDragon:'dragon',westheruSeal:'restored'};
 const completed=e=>flags[0].includes(WatchtowerBalloonRules.progress[progressKey[e.miniboss]]);
 function clearShots(e){projectiles=projectiles.filter(p=>p.source!==source(e));}
 function phase(e,next,duration){
  Object.assign(e,{phase:next,clock:duration,phaseDuration:duration,windup:next==='windup'?duration:0,windupDuration:duration,
   attackTime:next==='strike'?duration:0,attackDuration:duration,attackElapsed:0,hitDone:false});
 }
 function reset(e){
  if(!is(e))return false;clearShots(e);
  Object.assign(e,{x:e.origin,y:e.baseY,hp:e.maxHp,active:false,dead:!e.replay&&completed(e),face:-1,attackFace:-1,
   patrolFace:-1,cycles:0,move:null,inv:0,stun:0,walkSpeed:0,animTime:0,guardBreak:0,blockFlash:0,
   attackBox:null,hazards:[],poseIndex:0,targetX:null,targetY:null,victoryIssued:false,windupHp:null});
  phase(e,'wait',.8);return e;
 }
 function create(spec){
  const p=profiles[spec.miniboss],arena=spec.arena||level.arena;
  return reset({...spec,w:p.w,h:p.h,maxHp:p.hp,origin:spec.x,baseY:spec.y-p.h,arena,
   patrolLeft:arena.x+20,patrolRight:Math.max(arena.x+20,arena.x+arena.w-p.w-20)});
 }
 function enforceBounds(){
  if(state!=='play')return false;
  const e=enemies.find(e=>current(e)&&e.active);if(!e)return false;
  const left=e.arena.x+12,right=Math.max(left,e.arena.x+e.arena.w-player.w-12);
  if(player.x<left){player.x=left;player.vx=Math.max(0,player.vx||0);}
  if(player.x>right){player.x=right;player.vx=Math.min(0,player.vx||0);}return true;
 }
 function pillars(e,count,width,height,warning,damageAmount,spacing){
  for(let i=0;i<count;i++){
   const x=clamp(e.targetX+(i-(count-1)/2)*spacing,e.arena.x+width/2,e.arena.x+e.arena.w-width/2);
   e.hazards.push({kind:e.miniboss==='westheruSeal'?'lightning':'ninjutsu',x:x-width/2,y:e.arena.y-height,w:width,h:height,
    warning,life:warning+.42,active:false,damage:damageAmount,hitDone:false});
  }
 }
 function tell(e){
  const p=profiles[e.miniboss];e.move=p.moves[e.cycles++%p.moves.length];
  const dx=player.x+player.w/2-e.x-e.w/2;
  if(e.move==='club'&&Math.abs(dx)>300)e.move='belly';
  if(e.move==='claw'&&Math.abs(dx)>430)e.move='dragonFan';
  e.attackFace=e.face;e.targetX=player.x+player.w/2;e.targetY=player.y+player.h*.5;e.attackBox=null;e.windupHp=e.hp;
  const duration=e.move==='balloonBreath'?1.5:e.move==='lightning'?1.05:e.move==='sigils'?1:.8;
  if(e.move==='club'||e.move==='claw'){
   const reach=e.move==='claw'?320:230;
   e.attackBox={x:e.attackFace>0?e.x+e.w*.35:e.x-reach,y:e.y-15,w:reach+e.w*.65,h:e.h+25};
  }else if(e.move==='belly'){
   e.attackBox={x:e.x+e.w/2-245,y:e.arena.y-130,w:490,h:130};
  }else if(e.move==='sigils')pillars(e,3,100,160,duration,3,170);
  else if(e.move==='lightning')pillars(e,e.hp<=e.maxHp*.5?5:3,90,440,duration,4,155);
  phase(e,'windup',duration);e.poseIndex=2;
 }
 function hit(e){
  if(e.hitDone||!e.attackBox||!overlap(player,e.attackBox))return true;
  const victim=player,accepted=damage(e.move==='claw'?5:4,e.attackFace,true);
  if(accepted!==false)e.hitDone=true;
  return victim===player&&current(e)&&state==='play';
 }
 function fan(e,count,spread,speed,amount,kind,color){
  const x=e.x+e.w/2,y=e.y+e.h*.4,angle=Math.atan2(e.targetY-y,e.targetX-x);
  for(let i=0;i<count;i++){
   const a=angle+(i-(count-1)/2)*spread;
   shoot(x,y,Math.cos(a)*speed,Math.sin(a)*speed,color,5,kind);
   Object.assign(projectiles.at(-1),{source:source(e),ownerId:e.id,damage:amount,radius:kind==='arrow'?7:11});
  }
 }
 function release(e){
  phase(e,'strike',.42);e.poseIndex=3;
  if(e.attackBox)return hit(e);
  if(e.move==='crossbow')fan(e,5,.12,450,3,'arrow','#c6d8d8');
  else if(e.move==='ninjutsu')fan(e,7,.16,320,3,'shadowBolt','#b597df');
  else if(e.move==='dragonFan')fan(e,5,.17,330,4,'shadowBolt','#e8a15d');
  else if(e.move==='stormFan')fan(e,7,.15,360,3,'shadowBolt','#b9d6ff');
  else if(e.move==='balloonBreath'){
   if(!tower(e))WatchtowerBalloon.damageBalloon(24);
   if(!current(e)||state!=='play')return false;
   fan(e,3,.16,300,4,'shadowBolt','#e8a15d');
  }
  return true;
 }
 function hazards(e,dt){
  for(const h of e.hazards){
   h.warning=Math.max(0,h.warning-dt);h.life-=dt;h.active=h.warning<=0;
   if(h.hitDone||!h.active||h.life<=0||!overlap(player,h))continue;
   const victim=player,accepted=damage(h.damage,player.x+player.w/2>h.x+h.w/2?1:-1,true);
   if(accepted!==false)h.hitDone=true;
   if(victim!==player||!current(e)||state!=='play')return false;
  }
  e.hazards=e.hazards.filter(h=>h.life>0);return true;
 }
 function defeat(e){
  if(!current(e)||!e.active||e.victoryIssued)return false;
  const escape=!tower(e)&&e.miniboss==='watchtowerSentinel'&&WatchtowerBalloonRules.shouldEscape(e.hp,e.maxHp);
  if(!escape&&e.hp>0)return false;
  e.victoryIssued=true;e.dead=true;e.active=false;e.phase=escape?'escaped':'dead';e.poseIndex=escape?5:0;
  e.attackBox=null;e.hazards=[];e.windup=0;e.attackTime=0;e.walkSpeed=0;clearShots(e);
  return e.replay?true:WatchtowerBalloon.victory(e);
 }
 function update(e,dt){
  if(state!=='play'||!Number.isFinite(dt)||dt<=0||!current(e))return;
  if(!tower(e)&&WatchtowerBalloon.morph?.())return;
  if(!e.active){
   if(e.miniboss==='watchtowerSentinel'&&!e.replay&&!flags[0].includes(WatchtowerBalloonRules.progress.rescued))return;
   const feet=player.y+player.h;
   if(player.x+player.w<(e.arena.triggerX??e.arena.x)||player.x>e.arena.x+e.arena.w||feet<e.arena.y-260||feet>e.arena.y+35)return;
   e.active=true;
  }
  if(e.hp<=0||!tower(e)&&e.miniboss==='watchtowerSentinel'&&WatchtowerBalloonRules.shouldEscape(e.hp,e.maxHp)){defeat(e);return;}
  enforceBounds();e.inv=Math.max(0,e.inv-dt);e.stun=Math.max(0,e.stun-dt);e.clock-=dt;e.animTime+=dt;e.walkSpeed=0;
  if(!hazards(e,dt))return;
  if(e.phase==='wait'){
   const dx=player.x+player.w/2-e.x-e.w/2;e.face=Math.sign(dx)||e.face;
   const ranged=e.miniboss==='watchtowerSentinel'||e.miniboss==='balloonDragon';
   if(!ranged&&Math.abs(dx)>170){const old=e.x;e.x=clamp(e.x+e.face*(e.miniboss==='watchtowerJailer'?100:145)*dt,e.patrolLeft,e.patrolRight);e.walkSpeed=(e.x-old)/dt;}
   e.poseIndex=Math.abs(e.walkSpeed)>1?1:0;if(e.clock<=0)tell(e);
  }else if(e.phase==='windup'){
   if(e.move==='balloonBreath'&&e.windupHp-e.hp>=45){e.attackBox=null;e.hazards=[];phase(e,'recover',1);e.poseIndex=4;return;}
   e.windup=Math.max(0,e.clock);if(e.clock<=0&&!release(e))return;
  }else if(e.phase==='strike'){
   e.attackElapsed+=dt;e.attackTime=Math.max(0,e.clock);if(e.attackBox&&!hit(e))return;
   if(e.clock<=0){e.attackBox=null;phase(e,'recover',e.miniboss==='watchtowerJailer'?.75:.5);e.poseIndex=4;}
  }else if(e.phase==='recover'&&e.clock<=0){phase(e,'wait',.4);e.poseIndex=0;}
 }
 return Object.freeze({is,create,reset,update,defeat,enforceBounds});
})();
