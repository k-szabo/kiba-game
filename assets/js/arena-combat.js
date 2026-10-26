/* Arena encounters share one transient controller. The challenge owns rewards. */
'use strict';
const ArenaCombat=(()=>{
 const profiles=Object.freeze({
  arenaCaptain:Object.freeze({name:'arena.boss.captain',w:88,h:180,hp:180,speed:115,range:170,moves:Object.freeze(['captainCleave','captainCharge','captainBolts'])}),
  arenaSerpent:Object.freeze({name:'arena.boss.serpent',w:380,h:360,hp:220,speed:75,range:260,moves:Object.freeze(['serpentBite','serpentSpit','serpentRupture'])}),
  arenaCyclops:Object.freeze({name:'arena.boss.guards',w:400,h:180,hp:300,speed:75,range:240,moves:Object.freeze(['pairedStomp','pairedLance'])}),
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
  if(paired){
   if(!e.parts?.length)e.parts=(e.singleGuard?[0]:[0,300]).map((offset,index)=>{
    const actor={x:e.origin+offset,y:e.baseY,w:100,h:e.h,face:-1,poseIndex:0,index,cycles:0,arena:e.arena,hazards:[],attackBoxes:[],walkSpeed:0,animTime:0};phase(actor,'wait',1+index*.55);return actor;
   });
   e.x=Math.min(...e.parts.map(p=>p.x));e.w=Math.max(...e.parts.map(p=>p.x+p.w))-e.x;e.y=e.baseY;
   e.attackBoxes=e.parts.flatMap(p=>p.attackBoxes);e.attackBox=e.attackBoxes[0]||null;e.hazards=e.parts.flatMap(p=>p.hazards);return;
  }
  e.parts=[{x:e.x,y:e.y,w:e.w,h:e.h,face:e.face,poseIndex:e.poseIndex,index:0}];
 }
 function clearEffects(e){projectiles=projectiles.filter(p=>p.source!==source(e));e.hazards=[];e.attackBox=null;e.attackBoxes=[];e.summons=[];e.comboShots=[];for(const part of e.parts||[]){part.hazards=[];part.attackBoxes=[];}}
 function reset(e){
  if(!is(e))return false;clearEffects(e);clearSummons(e);
  Object.assign(e,{x:e.origin,y:e.baseY,hp:e.maxHp,dead:false,active:false,face:-1,attackFace:-1,partFaces:[-1,-1],
   inv:0,stun:0,animTime:0,walkSpeed:0,cycles:0,move:null,poseIndex:0,guardBreak:0,blockFlash:0,blocks:0,
   targetX:null,targetY:null,immuneRemaining:e.miniboss==='arenaFia'?90:0,vulnerableRemaining:0,shieldCycle:0,spared:false,parts:[]});
  if(e.miniboss==='arenaFia')e.y=e.baseY-170;
  phase(e,'wait',1);syncParts(e);return e;
 }
 function create(spec){
  if(!is(spec))throw new TypeError('Unknown arena encounter');
  const p=profile(spec),arena=spec.arena||level.arena,w=spec.singleGuard?100:p.w,x=clamp(spec.x,arena.x+25,Math.max(arena.x+25,arena.x+arena.w-w-25));
  return reset({...spec,name:p.name,w,h:p.h,maxHp:spec.singleGuard?90:p.hp,origin:x,baseY:spec.y-p.h,arena,
   patrolLeft:arena.x+25,patrolRight:Math.max(arena.x+25,arena.x+arena.w-w-25)});
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
  syncParts(e);
 }
 function marks(e,offsets,width,height,tell,damageValue,kind){
  for(const offset of offsets){const x=clamp(e.targetX+offset,e.arena.x+width/2+20,e.arena.x+e.arena.w-width/2-20)-width/2;if(e.hazards.some(h=>Math.abs(h.x-x)<width+65))continue;e.hazards.push({kind,x,y:e.arena.y-height,w:width,h:height,warning:tell,warningDuration:tell,life:tell+.38,active:false,damage:damageValue,part:e.index});}
 }
 function tell(e){
  const p=profile(e);e.move=p.moves[e.cycles++%p.moves.length];e.attackFace=e.face;e.targetX=player.x+player.w/2;e.targetY=player.y+player.h*.5;
  e.attackBox=null;e.attackBoxes=[];e.summons=[];let duration=.9;e.poseIndex=2;
  if(e.move==='captainCleave')e.attackBoxes=[box(e,e.attackFace,185,190)];
  if(e.move==='captainCharge'){
   duration=1.05;e.chargeStart=e.x;e.chargeEnd=clamp(e.x+e.attackFace*360,e.patrolLeft,e.patrolRight);
   const start=box(e,e.attackFace,140,100),end=box({...e,x:e.chargeEnd},e.attackFace,140,100),left=Math.min(start.x,end.x);
   e.attackBoxes=[{x:left,y:start.y,w:Math.max(start.x+start.w,end.x+end.w)-left,h:start.h}];
  }
  if(e.move==='captainBolts'){duration=1.1;e.poseIndex=5;}
  if(e.move==='serpentBite')e.attackBoxes=[box(e,e.attackFace,260,240)];
  if(e.move==='serpentSpit'){duration=1.1;e.poseIndex=5;}
  if(e.move==='serpentRupture'){duration=1.25;e.poseIndex=5;marks(e,[-190,0,190],95,85,duration,2,'arenaRupture');}
  if(e.move==='fiaBolts'){duration=Math.max(.7,.85-e.shieldCycle*.05);e.poseIndex=1;}
  if(e.move==='fiaSigils'){duration=Math.max(.8,1.05-e.shieldCycle*.05);e.poseIndex=3;marks(e,[0,-320,320],Math.min(190,170+e.shieldCycle*10),110,duration,2,'arenaSigil');}
  if(e.move==='fiaSummon'){
   duration=1.1;e.poseIndex=4;
   e.summons=[{x:e.arena.x+180,role:'cyclops'},{x:e.arena.x+e.arena.w-180,role:'guard'}].map(p=>({...p,y:e.arena.y,warning:duration,warningDuration:duration}));
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
   if(e.hitDone||!overlap(player,hit))continue;
   e.hitDone=true;
   const victim=player;damage(2,e.attackFace,true);
   if(player!==victim||!current(e)||state!=='play')return false;
  }return true;
 }
 function release(e){
  phase(e,'strike',e.move==='captainCharge'?.6:e.move==='fiaBolts'?.65:.3);
  e.poseIndex=e.miniboss==='arenaFia'?(e.move==='fiaBolts'?2:e.move==='fiaSigils'?3:4):e.move==='captainBolts'||e.move==='serpentSpit'||e.move==='serpentRupture'?5:3;
  if(e.move==='captainBolts')bolts(e,{count:3,speed:250,spread:.19,damage:1});
  if(e.move==='serpentSpit')for(const offset of [-55,55])bolts(e,{count:3,speed:245,spread:.2,damage:1,originX:e.x+e.w/2+offset});
  if(e.move==='fiaBolts'){bolts(e,{count:5,speed:280+Math.min(4,e.shieldCycle)*20,spread:.18,damage:1});e.comboShots=[{delay:.25},{delay:.5}];}
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
 function clearSummons(e){if(typeof ArenaChallenge!=='undefined')ArenaChallenge.cleanupSummons(e);}
 function startFall(e){clearEffects(e);clearSummons(e);e.fallStart=e.y;phase(e,'fall',.8);e.poseIndex=5;syncParts(e);}
 function restartShield(e){clearEffects(e);clearSummons(e);e.shieldCycle++;e.hp=1;e.inv=0;e.immuneRemaining=90;e.vulnerableRemaining=0;e.y=e.baseY-170;phase(e,'wait',.15);e.poseIndex=0;syncParts(e);}
 function updatePair(e,dt){
  for(const actor of e.parts){
   actor.clock-=dt;actor.animTime+=dt;actor.walkSpeed=0;
   for(const h of actor.hazards){h.warning=Math.max(0,h.warning-dt);h.life-=dt;h.active=h.warning<=0;if(h.active&&h.life>0&&overlap(player,h)){const victim=player;damage(h.damage,player.x>h.x?1:-1);if(player!==victim||!current(e)||state!=='play')return;}}
   actor.hazards=actor.hazards.filter(h=>h.life>0);
   if(actor.phase==='wait'){
    const dx=player.x+player.w/2-actor.x-actor.w/2;if(Math.abs(dx)>18)actor.face=Math.sign(dx);
    if(Math.abs(dx)>165+actor.index*45){
     const other=e.parts.find(p=>p!==actor),left=other&&actor.index>other.index?other.x+other.w+40:e.arena.x+25,right=other&&actor.index<other.index?other.x-actor.w-40:e.arena.x+e.arena.w-actor.w-25;
     const old=actor.x;actor.x=clamp(actor.x+actor.face*75*dt,left,right);actor.walkSpeed=(actor.x-old)/dt;
    }
    actor.poseIndex=Math.abs(actor.walkSpeed)>1?1:0;
    if(actor.clock<=0){
     actor.move=profile(e).moves[(actor.cycles++ + actor.index)%2];actor.attackFace=actor.face;actor.targetX=player.x+player.w/2;actor.targetY=player.y+player.h/2;actor.attackBoxes=[];
     const duration=actor.move==='pairedStomp'?1.15:.9;actor.poseIndex=actor.move==='pairedStomp'?5:2;
     if(actor.move==='pairedStomp')marks(actor,[0,-260,260],150,110,duration,2,'arenaStomp');else actor.attackBoxes=[{...box(actor,actor.attackFace,230,145),part:actor.index}];phase(actor,'windup',duration);
    }
   }else if(actor.phase==='windup'){
    actor.windup=Math.max(0,actor.clock);if(actor.clock<=0){phase(actor,'strike',.4);actor.poseIndex=actor.move==='pairedStomp'?5:3;}
   }else if(actor.phase==='strike'){
    actor.attackElapsed+=dt;actor.attackTime=Math.max(0,actor.clock);
    for(const hit of actor.attackBoxes)if(!actor.hitDone&&overlap(player,hit)){actor.hitDone=true;const victim=player;damage(2,actor.attackFace,true);if(player!==victim||!current(e)||state!=='play')return;}
    if(actor.clock<=0){actor.attackBoxes=[];phase(actor,'recover',.85+actor.index*.1);actor.poseIndex=4;}
   }else if(actor.phase==='recover'&&actor.clock<=0){phase(actor,'wait',.45+actor.index*.15);actor.poseIndex=0;}
  }
  const leader=e.parts.find(p=>p.phase==='windup')||e.parts.find(p=>p.phase==='strike')||e.parts[0];
  e.phase=leader.phase;e.clock=leader.clock;e.poseIndex=leader.poseIndex;e.windup=leader.windup;e.windupDuration=leader.windupDuration;e.move=leader.move;e.attackFace=leader.attackFace;e.attackElapsed=leader.attackElapsed;e.attackDuration=leader.attackDuration;
  syncParts(e);
 }
 function update(e,dt){
  if(state!=='play'||!Number.isFinite(dt)||dt<=0||!current(e))return;
  if(!inside(e)){if(e.active)reset(e);return;}
  if(!e.active){if(player.y+player.h<e.arena.y-200)return;e.active=true;}
  e.inv=Math.max(0,e.inv-dt);e.stun=Math.max(0,e.stun-dt);e.guardBreak=Math.max(0,e.guardBreak-dt);e.blockFlash=Math.max(0,e.blockFlash-dt);e.walkSpeed=0;
  if(e.miniboss==='arenaCyclops'){updatePair(e,dt);return;}
  if(e.miniboss==='arenaFia'){
   if(e.phase==='exhausted'){e.y=e.baseY;e.poseIndex=6;e.vulnerableRemaining=Math.max(0,e.vulnerableRemaining-dt);if(e.vulnerableRemaining<1e-9)e.vulnerableRemaining=0;if(e.vulnerableRemaining<=0)restartShield(e);else syncParts(e);return;}
   if(e.phase==='fall'){
    e.clock=Math.max(0,e.clock-dt);const progress=1-e.clock/e.phaseDuration;e.y=e.fallStart+(e.baseY-e.fallStart)*progress*progress;
    if(e.clock<1e-9){phase(e,'exhausted',0);e.y=e.baseY;e.hp=1;e.inv=0;e.poseIndex=6;e.vulnerableRemaining=5;}
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
   if(e.miniboss==='arenaFia')for(const shot of e.comboShots||[]){shot.delay-=dt;if(shot.delay<=0&&!shot.fired){shot.fired=true;bolts(e,{count:3,speed:300+Math.min(4,e.shieldCycle)*20,spread:.23,damage:1});}}
   if(e.move==='captainCharge'){const old=e.x;e.x=e.chargeStart+(e.chargeEnd-e.chargeStart)*clamp(e.attackElapsed/e.attackDuration,0,1);e.walkSpeed=(e.x-old)/dt;syncParts(e);}
   if(!strike(e))return;
   if(e.clock<=0){e.attackBox=null;e.attackBoxes=[];phase(e,'recover',e.miniboss==='arenaFia'?Math.max(.15,.3-e.shieldCycle*.04):1);e.poseIndex=e.miniboss==='arenaFia'?0:4;syncParts(e);}
  }else if(e.phase==='recover'&&e.clock<=0){phase(e,'wait',e.miniboss==='arenaFia'?.15:.55);e.poseIndex=0;syncParts(e);}
 }
 function hit(e,weaponBox,amount,kind='normal'){
  if(state!=='play'||!current(e)||!e.active||e.inv>0||!Number.isFinite(amount)||amount<=0||!weaponBox)return 0;
  const body=e.parts.find(part=>overlap(weaponBox,part));if(!body)return 0;
  if(protects(e)){e.blockFlash=.25;return 0;}
  if(e.miniboss==='arenaCyclops'){
   const front=Math.sign(player.x+player.w/2-body.x-body.w/2)===body.face,above=player.y+player.h<body.y+body.h*.55;
   if(kind==='normal'&&front&&!above&&dash<=0&&e.guardBreak<=0&&body.phase==='wait'){
    e.blocks++;e.blockFlash=.3;if(e.blocks>=3){e.blocks=0;e.guardBreak=1.6;phase(body,'recover',1.2);body.poseIndex=4;body.attackBoxes=[];syncParts(e);}return 0;
   }
   if(kind==='heavy')e.guardBreak=Math.max(e.guardBreak,.9);
  }
  const before=e.hp;e.hp=Math.max(0,e.hp-amount);e.inv=.22;
  DevDamage.record('outgoing',e,before,e.hp);burst(body.x+body.w/2,body.y+30,realms[realm].gold,9);
  if(e.hp<=0)killEnemy(e);return before-e.hp;
 }
 function defeat(e){
  if(state!=='play'||!current(e)||!e.active||e.hp>0)return false;
  if(protects(e)){e.hp=1;return false;}
  e.dead=true;e.active=false;e.spared=e.miniboss==='arenaFia';clearEffects(e);clearSummons(e);e.windup=e.attackTime=e.walkSpeed=0;e.phase=e.spared?'spared':'dead';e.poseIndex=e.spared?7:4;syncParts(e);
  if(typeof ArenaChallenge!=='undefined'&&typeof ArenaChallenge.onBossDefeated==='function')ArenaChallenge.onBossDefeated(e);
  return true;
 }
 return Object.freeze({profiles,is,create,reset,update,defeat,protects,hit,parts:e=>e.parts||[],source});
})();
