/* Arena encounters share one transient controller. The challenge owns rewards. */
'use strict';
const ArenaCombat=(()=>{
 const profiles=Object.freeze({
  arenaCaptain:Object.freeze({name:'arena.boss.captain',w:80,h:140,hp:180,speed:115,range:170,moves:Object.freeze(['captainCleave','captainCharge','captainBolts'])}),
  arenaSerpent:Object.freeze({name:'arena.boss.serpent',w:180,h:145,hp:220,speed:75,range:210,moves:Object.freeze(['serpentBite','serpentSpit','serpentRupture'])}),
  arenaCyclops:Object.freeze({name:'arena.boss.guards',w:400,h:180,hp:300,speed:75,range:240,moves:Object.freeze(['pairedLance','pairedStomp','pairedLance'])}),
  arenaFia:Object.freeze({name:'arena.boss.fia',w:75,h:130,hp:1,speed:65,range:350,moves:Object.freeze(['fiaBolts','fiaSigils','fiaBolts','fiaSummon'])})
 });
 const is=e=>!!e&&Object.hasOwn(profiles,e.miniboss);
 const profile=e=>profiles[e.miniboss];
 const source=e=>'arena:'+e.id;
 const current=e=>is(e)&&realm===3&&level.id==='shadowArena'&&enemies.includes(e)&&!e.dead;
 const protects=e=>is(e)&&e.miniboss==='arenaFia'&&e.phase!=='exhausted';
 function phase(e,next,duration){
  e.phase=next;e.clock=duration;e.phaseDuration=duration;e.windup=next==='windup'?duration:0;e.windupDuration=duration;
  e.attackTime=next==='strike'?duration:0;e.attackDuration=duration;e.attackElapsed=0;e.hitDone=false;
 }
 function syncParts(e){
  const paired=e.miniboss==='arenaCyclops';
  e.parts=(paired?[0,300]:[0]).map((offset,index)=>({x:e.x+offset,y:e.y,w:paired?100:e.w,h:e.h,face:paired?e.partFaces?.[index]||e.face:e.face,poseIndex:e.poseIndex,index}));
 }
 function clearEffects(e){projectiles=projectiles.filter(p=>p.source!==source(e));e.hazards=[];e.attackBox=null;e.attackBoxes=[];e.summons=[];}
 function reset(e){
  if(!is(e))return false;clearEffects(e);
  Object.assign(e,{x:e.origin,y:e.baseY,hp:e.maxHp,dead:false,active:false,face:-1,attackFace:-1,partFaces:[-1,-1],
   inv:0,stun:0,animTime:0,walkSpeed:0,cycles:0,move:null,poseIndex:0,guardBreak:0,blockFlash:0,blocks:0,
   targetX:null,targetY:null,immuneRemaining:e.miniboss==='arenaFia'?90:0,spared:false});
  if(e.miniboss==='arenaFia')e.y=e.baseY-170;
  phase(e,'wait',1);syncParts(e);return e;
 }
 function create(spec){
  if(!is(spec))throw new TypeError('Unknown arena encounter');
  const p=profile(spec),arena=spec.arena||level.arena;
  return reset({...spec,name:p.name,w:p.w,h:p.h,maxHp:p.hp,origin:spec.x,baseY:spec.y-p.h,arena,
   patrolLeft:arena.x+25,patrolRight:Math.max(arena.x+25,arena.x+arena.w-p.w-25)});
 }
 function inside(e){
  const a=e.arena,feet=player.y+player.h;
  return player.x+player.w>a.x-65&&player.x<a.x+a.w+65&&feet>=a.y-400&&feet<=a.y+30;
 }
 function box(body,face,width,height=body.h+10){return {x:face>0?body.x+body.w*.4:body.x-width,y:body.y+body.h-height,w:width+body.w*.6,h:height};}
 function follow(e,dt){
  const p=profile(e),dx=player.x+player.w/2-e.x-e.w/2;e.face=Math.abs(dx)>18?Math.sign(dx):e.face;
  const limit=e.miniboss==='arenaFia'?360:p.range;
  if(Math.abs(dx)>limit){const before=e.x;e.x=clamp(e.x+e.face*p.speed*dt,e.patrolLeft,e.patrolRight);e.walkSpeed=(e.x-before)/dt;}
  e.poseIndex=Math.abs(e.walkSpeed)>1&&e.miniboss!=='arenaFia'?1:0;
  if(e.miniboss==='arenaCyclops')e.partFaces=e.parts.map(part=>Math.abs(player.x+player.w/2-part.x-part.w/2)>18?Math.sign(player.x+player.w/2-part.x-part.w/2):part.face);
  syncParts(e);
 }
 function marks(e,offsets,width,height,tell,damageValue,kind){
  for(const offset of offsets){const x=clamp(e.targetX+offset,e.arena.x+width/2+20,e.arena.x+e.arena.w-width/2-20);e.hazards.push({kind,x:x-width/2,y:e.arena.y-height,w:width,h:height,warning:tell,life:tell+.38,active:false,damage:damageValue});}
 }
 function tell(e){
  const p=profile(e);e.move=p.moves[e.cycles++%p.moves.length];e.attackFace=e.face;e.targetX=player.x+player.w/2;e.targetY=player.y+player.h*.5;
  e.attackBox=null;e.attackBoxes=[];e.summons=[];let duration=.9;e.poseIndex=2;
  if(e.move==='captainCleave')e.attackBoxes=[box(e,e.attackFace,185,150)];
  if(e.move==='captainCharge'){
   duration=1.05;e.chargeStart=e.x;e.chargeEnd=clamp(e.x+e.attackFace*360,e.patrolLeft,e.patrolRight);
   const start=box(e,e.attackFace,140,100),end=box({...e,x:e.chargeEnd},e.attackFace,140,100),left=Math.min(start.x,end.x);
   e.attackBoxes=[{x:left,y:start.y,w:Math.max(start.x+start.w,end.x+end.w)-left,h:start.h}];
  }
  if(e.move==='captainBolts'){duration=1.1;e.poseIndex=5;}
  if(e.move==='serpentBite')e.attackBoxes=[box(e,e.attackFace,225,140)];
  if(e.move==='serpentSpit'){duration=1.1;e.poseIndex=5;}
  if(e.move==='serpentRupture'){duration=1.25;e.poseIndex=5;marks(e,[-190,0,190],95,85,duration,2,'arenaRupture');}
  if(e.move==='pairedLance')e.attackBoxes=e.parts.map((part,index)=>({...box(part,part.face,230,145),part:index,delay:index*.22,hitDone:false}));
  if(e.move==='pairedStomp'){duration=1.2;e.poseIndex=5;marks(e,[-160,160],140,95,duration,2,'arenaStomp');}
  if(e.move==='fiaBolts'){duration=1.05;e.poseIndex=1;}
  if(e.move==='fiaSigils'){duration=1.3;e.poseIndex=3;marks(e,[-220,0,220],100,100,duration,2,'arenaSigil');}
  if(e.move==='fiaSummon'){
   duration=1.2;e.poseIndex=4;
   e.summons=[e.arena.x+180,e.arena.x+e.arena.w-180].map(x=>({x,y:e.arena.y,warning:duration,warningDuration:duration}));
  }
  e.attackBox=e.attackBoxes[0]||null;phase(e,'windup',duration);syncParts(e);
 }
 function bolts(e,{count,speed,spread,damage:amount,kind='shadowBolt',originX=e.x+e.w/2,originY=e.y+e.h*.35}){
  const angle=Math.atan2(e.targetY-originY,e.targetX-originX);
  for(let i=0;i<count;i++){
   const a=angle+(i-(count-1)/2)*spread;shoot(originX,originY,Math.cos(a)*speed,Math.sin(a)*speed,'#ba88e9',4.5,kind);
   Object.assign(projectiles.at(-1),{source:source(e),damage:amount,radius:8});
  }
 }
 function strike(e){
  const boxes=e.move==='captainCharge'?[box(e,e.attackFace,140,100)]:e.attackBoxes;
  for(const hit of boxes){
   if((e.move==='pairedLance'?hit.hitDone:e.hitDone)||(hit.delay||0)>e.attackElapsed||!overlap(player,hit))continue;
   if(e.move==='pairedLance')hit.hitDone=true;else e.hitDone=true;
   const victim=player;damage(2,e.move==='pairedLance'?e.parts[hit.part].face:e.attackFace,true);
   if(player!==victim||!current(e)||state!=='play')return false;
  }return true;
 }
 function release(e){
  phase(e,'strike',e.move==='captainCharge'?.6:e.move==='pairedLance'?.6:.4);
  e.poseIndex=e.miniboss==='arenaFia'?(e.move==='fiaBolts'?2:e.move==='fiaSigils'?3:4):e.move==='captainBolts'||e.move==='serpentSpit'||e.move==='pairedStomp'||e.move==='serpentRupture'?5:3;
  if(e.move==='captainBolts')bolts(e,{count:3,speed:250,spread:.19,damage:1});
  if(e.move==='serpentSpit')for(const offset of [-55,55])bolts(e,{count:3,speed:245,spread:.2,damage:1,originX:e.x+e.w/2+offset});
  if(e.move==='fiaBolts')bolts(e,{count:5,speed:260,spread:.18,damage:1});
  if(e.move==='fiaSummon'&&typeof ArenaChallenge!=='undefined'&&typeof ArenaChallenge.summon==='function'){
   ArenaChallenge.summon(e);if(!current(e)||state!=='play')return false;
  }
  e.summons=[];syncParts(e);return strike(e);
 }
 function tickHazards(e,dt){
  for(const hazard of e.hazards){
   hazard.warning=Math.max(0,hazard.warning-dt);hazard.life-=dt;hazard.active=hazard.warning<=0;
   if(hazard.active&&hazard.life>0&&overlap(player,hazard)){
    const victim=player;damage(hazard.damage,player.x+player.w/2>hazard.x+hazard.w/2?1:-1);
    if(player!==victim||!current(e)||state!=='play')return false;
   }
  }e.hazards=e.hazards.filter(hazard=>hazard.life>0);
  for(const summon of e.summons)summon.warning=Math.max(0,summon.warning-dt);
  return true;
 }
 function startFall(e){clearEffects(e);e.fallStart=e.y;phase(e,'fall',.8);e.poseIndex=5;syncParts(e);}
 function update(e,dt){
  if(state!=='play'||!Number.isFinite(dt)||dt<=0||!current(e))return;
  if(!inside(e)){if(e.active)reset(e);return;}
  if(!e.active){if(player.y+player.h<e.arena.y-200)return;e.active=true;}
  e.inv=Math.max(0,e.inv-dt);e.stun=Math.max(0,e.stun-dt);e.guardBreak=Math.max(0,e.guardBreak-dt);e.blockFlash=Math.max(0,e.blockFlash-dt);e.walkSpeed=0;
  if(e.miniboss==='arenaFia'){
   if(e.phase==='exhausted'){e.y=e.baseY;e.poseIndex=6;syncParts(e);return;}
   if(e.phase==='fall'){
    e.clock=Math.max(0,e.clock-dt);const progress=1-e.clock/e.phaseDuration;e.y=e.fallStart+(e.baseY-e.fallStart)*progress*progress;
    if(e.clock<=0){phase(e,'exhausted',0);e.y=e.baseY;e.hp=1;e.inv=0;e.poseIndex=6;}
    syncParts(e);return;
   }
   e.immuneRemaining=Math.max(0,e.immuneRemaining-dt);if(e.immuneRemaining<1e-9)e.immuneRemaining=0;e.hp=1;
   if(e.immuneRemaining<=0){startFall(e);return;}
   e.y=e.baseY-170+Math.sin(e.animTime*1.8)*10;syncParts(e);
  }
  e.clock-=dt;e.animTime+=dt;
  if(!tickHazards(e,dt))return;
  if(e.phase==='wait'){follow(e,dt);if(e.clock<=0)tell(e);}
  else if(e.phase==='windup'){e.windup=Math.max(0,e.clock);if(e.clock<=0&&!release(e))return;}
  else if(e.phase==='strike'){
   e.attackElapsed+=dt;e.attackTime=Math.max(0,e.clock);
   if(e.move==='captainCharge'){const old=e.x;e.x=e.chargeStart+(e.chargeEnd-e.chargeStart)*clamp(e.attackElapsed/e.attackDuration,0,1);e.walkSpeed=(e.x-old)/dt;syncParts(e);}
   if(!strike(e))return;
   if(e.clock<=0){e.attackBox=null;e.attackBoxes=[];phase(e,'recover',e.miniboss==='arenaFia'?.8:1);e.poseIndex=e.miniboss==='arenaFia'?0:4;syncParts(e);}
  }else if(e.phase==='recover'&&e.clock<=0){phase(e,'wait',e.miniboss==='arenaFia'?.45:.55);e.poseIndex=0;syncParts(e);}
 }
 function hit(e,weaponBox,amount,kind='normal'){
  if(!current(e)||!e.active||e.inv>0||!Number.isFinite(amount)||amount<=0||!weaponBox)return 0;
  const body=e.parts.find(part=>overlap(weaponBox,part));if(!body)return 0;
  if(protects(e)){e.blockFlash=.25;return 0;}
  if(e.miniboss==='arenaCyclops'){
   const front=Math.sign(player.x+player.w/2-body.x-body.w/2)===body.face,above=player.y+player.h<body.y+body.h*.55;
   if(kind==='normal'&&front&&!above&&dash<=0&&e.guardBreak<=0&&e.phase==='wait'){
    e.blocks++;e.blockFlash=.3;if(e.blocks>=3){e.blocks=0;e.guardBreak=1.6;phase(e,'recover',1.2);e.poseIndex=4;syncParts(e);}return 0;
   }
   if(kind==='heavy')e.guardBreak=Math.max(e.guardBreak,.9);
  }
  const before=e.hp;e.hp=Math.max(0,e.hp-amount);e.inv=.22;
  DevDamage.record('outgoing',e,before,e.hp);burst(body.x+body.w/2,body.y+30,realms[realm].gold,9);
  if(e.hp<=0)killEnemy(e);return before-e.hp;
 }
 function defeat(e){
  if(!current(e)||!e.active||e.hp>0)return false;
  if(protects(e)){e.hp=1;return false;}
  e.dead=true;e.active=false;e.spared=e.miniboss==='arenaFia';clearEffects(e);e.windup=e.attackTime=e.walkSpeed=0;e.phase=e.spared?'spared':'dead';e.poseIndex=e.spared?7:4;syncParts(e);
  if(typeof ArenaChallenge!=='undefined'&&typeof ArenaChallenge.onBossDefeated==='function')ArenaChallenge.onBossDefeated(e);
  return true;
 }
 return Object.freeze({profiles,is,create,reset,update,defeat,protects,hit,parts:e=>e.parts||[],source});
})();
