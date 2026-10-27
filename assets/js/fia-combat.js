/* The provoked kitsune is a separate encounter from the arena's surrender. */
'use strict';
const FiaCombat=(()=>{
 const moves=['foxfire','sigils','teleport','drain','charm','bolts'],tokens=new WeakMap(),owners=new WeakMap();let serial=0,charm=null;
 const is=e=>e?.miniboss==='fiaVengeance',source=e=>'fia:'+e.id+':'+tokens.get(e);
 const live=e=>is(e)&&state==='play'&&FiaConflict.current(e)&&e.active&&!e.dead;
 const parts=e=>e.parts||[];
 function sync(e){e.parts=[{x:e.x,y:e.y,w:e.w,h:e.h,face:e.face,poseIndex:e.poseIndex}];}
 function clean(e){const id=source(e);projectiles=projectiles.filter(p=>p.source!==id);particles=particles.filter(p=>p.source!==id);e.hazards=[];e.attackBoxes=[];e.summons=[];if(charm?.owner===e)charm=null;}
 function phase(e,next,duration){e.phase=next;e.clock=duration;e.phaseDuration=duration;e.windup=next==='windup'?duration:0;e.windupDuration=duration;e.attackTime=next==='strike'?duration:0;e.attackDuration=duration;e.attackElapsed=0;e.hitDone=false;}
 function reset(e){
  if(!is(e))return false;clean(e);tokens.set(e,++serial);
  Object.assign(e,{x:e.origin,y:e.baseY,hp:e.maxHp,dead:false,active:true,face:-1,attackFace:-1,inv:0,stun:0,cycles:0,move:null,poseIndex:0,walkSpeed:0,animTime:0,shieldRemaining:0,shieldClock:9,teleportTarget:null,blockFlash:0});phase(e,'wait',.75);sync(e);return e;
 }
 function create(spec){const e={...spec,name:'fia.name',w:76,h:140,maxHp:900,origin:spec.x,baseY:spec.y-140,arena:spec.arena};return reset(e);}
 function tell(e){
  e.move=moves[e.cycles++%moves.length];e.attackFace=e.face;e.targetX=player.x+player.w/2;e.targetY=player.y+player.h/2;e.attackBoxes=[];e.hazards=[];e.poseIndex=2;let duration=.65;
  if(e.move==='sigils'){
   duration=.85;e.poseIndex=4;const width=130,used=[];
   for(const offset of [-280,0,280]){const x=clamp(e.targetX+offset-width/2,e.arena.x+10,e.arena.x+e.arena.w-width-10);if(used.some(old=>Math.abs(old-x)<width+25))continue;used.push(x);e.hazards.push({x,y:e.arena.y-115,w:width,h:115,delay:duration,life:duration+.35,active:false,hitDone:false});}
  }
  if(e.move==='teleport'){
   const left=e.arena.x+20,right=e.arena.x+e.arena.w-e.w-20,candidates=[clamp(e.targetX-360,left,right),clamp(e.targetX+360,left,right)];
   e.teleportTarget=candidates.sort((a,b)=>Math.abs(b+e.w/2-e.targetX)-Math.abs(a+e.w/2-e.targetX))[0];
   e.attackBoxes=[{x:e.teleportTarget,y:e.arena.y-e.h,w:e.w,h:e.h}];
  }
  if(e.move==='drain'){duration=.9;e.attackBoxes=[{x:clamp(e.targetX-190,e.arena.x,e.arena.x+e.arena.w-380),y:e.arena.y-150,w:380,h:150}];}
  if(e.move==='charm'){duration=.85;e.attackBoxes=[{x:clamp(e.targetX-160,e.arena.x,e.arena.x+e.arena.w-320),y:e.arena.y-200,w:320,h:200}];}
  phase(e,'windup',duration);sync(e);
 }
 function shots(e,count,spread,speed,effect){
  const x=e.x+e.w/2,y=e.y+e.h*.35,angle=Math.atan2(e.targetY-y,e.targetX-x);
  for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*spread;shoot(x,y,Math.cos(a)*speed,Math.sin(a)*speed,'#cf9bf3',5,'orb');const p=projectiles.at(-1);Object.assign(p,{source:source(e),fiaEffect:effect,fiaLife:5,damage:3,radius:9});owners.set(p,e);}
 }
 function drain(e,box){
  if(!overlap(player,box))return true;const victim=player,hp=victim.hp;damage(3,e.attackFace,true);
  if(!live(e)||player!==victim||victim.hp<=0)return false;
  e.hp=Math.min(e.maxHp,e.hp+Math.max(0,hp-victim.hp));return true;
 }
 function release(e){
  phase(e,'strike',.32);e.poseIndex=e.move==='sigils'?4:2;
  if(e.move==='foxfire'||e.move==='bolts')shots(e,e.move==='foxfire'?5:7,e.move==='foxfire'?.18:.12,e.move==='foxfire'?360:420,'foxfire');
  if(e.move==='teleport'){e.teleportFrom={x:e.x+e.w/2,y:e.y+e.h};e.x=e.teleportTarget;e.y=e.baseY;e.teleportTarget=null;e.attackBoxes=[];phase(e,'recover',.35);e.poseIndex=1;}
  if(e.move==='drain'&&!drain(e,e.attackBoxes[0]))return false;
  if(e.move==='charm'&&overlap(player,e.attackBoxes[0])&&dash<=0&&player.inv<=0&&!DevImmortality.active)charm={owner:e,victim:player,remaining:1.25};
  sync(e);return true;
 }
 function update(e,dt){
  if(!live(e)||!Number.isFinite(dt)||dt<=0)return;
  e.inv=Math.max(0,e.inv-dt);e.blockFlash=Math.max(0,e.blockFlash-dt);e.shieldRemaining=Math.max(0,e.shieldRemaining-dt);e.shieldClock-=dt;
  if(e.shieldClock<=0){e.shieldRemaining=3;e.shieldClock=12;}
  e.animTime+=dt;e.walkSpeed=0;e.clock-=dt;
  for(const h of e.hazards){h.life-=dt;h.delay-=dt;h.active=h.delay<=0;if(h.active&&!h.hitDone&&overlap(player,h)){h.hitDone=true;const victim=player;damage(4,e.attackFace,true);if(!live(e)||victim!==player)return;}}
  e.hazards=e.hazards.filter(h=>h.life>0);
  if(e.phase==='wait'){
   const dx=player.x+player.w/2-e.x-e.w/2;if(Math.abs(dx)>18)e.face=Math.sign(dx);
   if(Math.abs(dx)>240){const old=e.x;e.x=clamp(e.x+e.face*480*dt,e.arena.x+15,e.arena.x+e.arena.w-e.w-15);e.walkSpeed=(e.x-old)/dt;}
   e.poseIndex=Math.abs(e.walkSpeed)>1?0:1;if(e.clock<=0)tell(e);
  }else if(e.phase==='windup'){e.windup=Math.max(0,e.clock);if(e.clock<=0&&!release(e))return;}
  else if(e.phase==='strike'){e.attackElapsed+=dt;e.attackTime=Math.max(0,e.clock);if(e.clock<=0){e.attackBoxes=[];phase(e,'recover',.3);e.poseIndex=1;}}
  else if(e.phase==='recover'&&e.clock<=0){phase(e,'wait',.2);e.poseIndex=0;}
  sync(e);
 }
 function hit(e,box,amount){
  if(!live(e)||e.inv>0||!box||!Number.isFinite(amount)||amount<=0||!parts(e).some(p=>overlap(p,box)))return 0;
  if(e.shieldRemaining>0){e.blockFlash=.2;return 0;}
  const before=e.hp;e.hp=Math.max(0,e.hp-amount);e.inv=.18;DevDamage.record('outgoing',e,before,e.hp);if(e.hp<=0)defeat(e);return before-e.hp;
 }
 function defeat(e){if(!live(e)||e.hp>0)return false;e.dead=true;e.active=false;clean(e);e.phase='dead';e.poseIndex=6;sync(e);return FiaConflict.onDefeated(e);}
 function impact(p,victim,before){
  const e=owners.get(p);if(!e||!live(e)||player!==victim||victim.hp<=0||p.source!==source(e)||!Number.isFinite(before))return false;
  particles.push({kind:'fiaSpark',source:p.source,x:p.x,y:p.y,vx:0,vy:0,life:.28,maxLife:.28});const lost=Math.max(0,before-victim.hp);if(p.fiaEffect==='drain'&&lost>0)e.hp=Math.min(e.maxHp,e.hp+lost);return lost>0;
 }
 function updateStatus(dt){if(state!=='play'||!Number.isFinite(dt)||dt<=0)return;if(charm){if(player!==charm.victim||!live(charm.owner))charm=null;else{charm.remaining=Math.max(0,charm.remaining-dt);if(!charm.remaining)charm=null;}}}
 function modifyMovement(target){if(!charm||!live(charm.owner)||player!==charm.victim||dash>0)return target;return target*.45+clamp((charm.owner.x+charm.owner.w/2-player.x-player.w/2)*1.2,-110,110);}
 function clear(){charm=null;particles=particles.filter(p=>!p.source?.startsWith('fia:'));projectiles=projectiles.filter(p=>!p.source?.startsWith('fia:'));}
 return Object.freeze({is,create,reset,update,hit,defeat,parts,source,impact,updateStatus,modifyMovement,clear,status:()=>charm?{remaining:charm.remaining}:null});
})();
