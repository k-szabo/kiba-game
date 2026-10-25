/* Dungeon combat is transient; the run controller owns completion and rewards. */
'use strict';
const DungeonCombat=(()=>{
 const profiles=Object.freeze({
  dungeonCaptain:Object.freeze({name:'dungeon.boss.captain',floor:0,w:88,h:145,hp:220,speed:105,range:220,moves:Object.freeze(['captainReach','captainThrust','captainLeap'])}),
  dungeonNecromancer:Object.freeze({name:'dungeon.boss.necromancer',floor:1,w:82,h:145,hp:280,speed:70,range:350,moves:Object.freeze(['necroBolts','necroSigils','necroSummon'])}),
  dungeonCouncil:Object.freeze({name:'dungeon.boss.council',floor:2,w:180,h:190,hp:400,speed:65,range:240,moves:Object.freeze(['councilSweep','councilSigils','councilVolley'])})
 });
 const is=e=>!!e&&Object.hasOwn(profiles,e.miniboss);
 const profile=e=>profiles[e.miniboss];
 const source=e=>'dungeon:'+e.id;
 const current=e=>is(e)&&realm===1&&level.dungeon?.id==='yomiFall'&&level.dungeon.floor===profile(e).floor&&enemies.includes(e)&&!e.dead;
 function phase(e,next,duration){
  e.phase=next;e.clock=duration;e.phaseDuration=duration;e.windup=next==='windup'?duration:0;e.windupDuration=duration;
  e.attackTime=next==='strike'?duration:0;e.attackDuration=duration;e.attackElapsed=0;e.hitDone=false;
 }
 function syncParts(e){e.parts=[{x:e.x,y:e.y,w:e.w,h:e.h,face:e.face,poseIndex:e.poseIndex,index:0}];}
 function clearEffects(e){projectiles=projectiles.filter(p=>p.source!==source(e));e.hazards=[];e.summons=[];e.attackBox=null;e.attackBoxes=[];}
 function reset(e){
  if(!is(e))return false;clearEffects(e);
  Object.assign(e,{x:e.origin,y:e.baseY,hp:e.maxHp,dead:false,active:false,face:-1,attackFace:-1,inv:0,stun:0,
   cycles:0,move:null,animTime:0,walkSpeed:0,poseIndex:0,targetX:null,targetY:null,blockFlash:0,guardBreak:0});
  phase(e,'wait',1);syncParts(e);return e;
 }
 function create(spec){
  if(!is(spec))throw new TypeError('Unknown dungeon encounter');
  const p=profile(spec),arena=spec.arena||level.arena;
  const e=reset({...spec,name:p.name,w:p.w,h:p.h,maxHp:p.hp,origin:spec.x,baseY:spec.y-p.h,arena,
   patrolLeft:arena.x+25,patrolRight:Math.max(arena.x+25,arena.x+arena.w-p.w-25)});
  if(!spec.replay&&flags[1].includes('dungeonStage'+(p.floor+1)+'Clear')){e.dead=true;e.hp=0;e.phase='dead';e.poseIndex=4;syncParts(e);}
  return e;
 }
 function inside(e){const a=e.arena,feet=player.y+player.h;return player.x+player.w>a.x-65&&player.x<a.x+a.w+65&&feet>=a.y-420&&feet<=a.y+30;}
 function blade(e,face,width,height=150){return {x:face>0?e.x+e.w*.4:e.x-width,y:e.baseY+e.h-height,w:width+e.w*.6,h:height};}
 function follow(e,dt){
  const p=profile(e),dx=player.x+player.w/2-e.x-e.w/2;
  if(Math.abs(dx)>18)e.face=Math.sign(dx);
  if(Math.abs(dx)>p.range){const before=e.x;e.x=clamp(e.x+e.face*p.speed*dt,e.patrolLeft,e.patrolRight);e.walkSpeed=(e.x-before)/dt;}
  e.poseIndex=Math.abs(e.walkSpeed)>1?1:0;syncParts(e);
 }
 function marks(e,offsets,width,height,tell,kind){
  // Clamping near an arena edge must not collapse several warnings onto one spot.
  for(const offset of offsets){
   const x=clamp(e.targetX+offset,e.arena.x+width/2+25,e.arena.x+e.arena.w-width/2-25)-width/2;
   if(e.hazards.some(h=>Math.abs(h.x-x)<width+35))continue;
   e.hazards.push({kind,x,y:e.arena.y-height,w:width,h:height,warning:tell,warningDuration:tell,life:tell+.4,active:false,damage:2,hitDone:false});
  }
 }
 function tell(e){
  e.move=profile(e).moves[e.cycles++%profile(e).moves.length];e.attackFace=e.face;e.targetX=player.x+player.w/2;e.targetY=player.y+player.h*.5;
  e.attackBox=null;e.attackBoxes=[];e.summons=[];e.poseIndex=2;let duration=1;
  if(e.move==='captainReach')e.attackBoxes=[blade(e,e.attackFace,245)];
  if(e.move==='captainThrust'){
   duration=1.1;e.travelStart=e.x;e.travelEnd=clamp(e.x+e.attackFace*280,e.patrolLeft,e.patrolRight);
   const start=blade(e,e.attackFace,170,110),end=blade({...e,x:e.travelEnd},e.attackFace,170,110),left=Math.min(start.x,end.x);
   e.attackBoxes=[{x:left,y:start.y,w:Math.max(start.x+start.w,end.x+end.w)-left,h:start.h}];
  }
  if(e.move==='captainLeap'){
   duration=1.2;e.travelStart=e.x;e.travelEnd=clamp(e.targetX-e.w/2,Math.max(e.patrolLeft,e.x-360),Math.min(e.patrolRight,e.x+360));
   e.attackBoxes=[{x:e.travelEnd+e.w/2-130,y:e.arena.y-115,w:260,h:115}];
  }
  if(e.move==='necroBolts'){duration=1.1;e.poseIndex=5;}
  if(e.move==='necroSigils'){duration=1.25;e.poseIndex=5;marks(e,[-220,0,220],100,105,duration,'dungeonSigil');}
  if(e.move==='necroSummon'){
   duration=1.4;e.poseIndex=5;
   e.summons=[e.arena.x+170,e.arena.x+e.arena.w-170].map(x=>({x,y:e.arena.y,warning:duration,warningDuration:duration}));
  }
  if(e.move==='councilSweep'){
   duration=1.15;e.attackBoxes=[{...blade(e,-1,190,165),face:-1,delay:0,hitDone:false},{...blade(e,1,190,165),face:1,delay:.25,hitDone:false}];
  }
  if(e.move==='councilSigils'){duration=1.4;e.poseIndex=5;marks(e,[-300,-100,100,300],90,120,duration,'dungeonCouncilSigil');}
  if(e.move==='councilVolley'){duration=1.3;e.poseIndex=5;}
  e.attackBox=e.attackBoxes[0]||null;phase(e,'windup',duration);syncParts(e);
 }
 function bolts(e,count,speed,spread,originX=e.x+e.w/2){
  const y=e.y+e.h*.3,angle=Math.atan2(e.targetY-y,e.targetX-originX);
  for(let i=0;i<count;i++){
   const a=angle+(i-(count-1)/2)*spread;shoot(originX,y,Math.cos(a)*speed,Math.sin(a)*speed,'#bd82dc',4.5,'shadowBolt');
   Object.assign(projectiles.at(-1),{source:source(e),damage:2,radius:8});
  }
 }
 function strike(e){
  if(e.move==='captainLeap'&&e.attackElapsed<.65)return true;
  const boxes=e.move==='captainThrust'?[blade(e,e.attackFace,170,110)]:e.attackBoxes;
  for(const box of boxes){
   const paired=e.move==='councilSweep';
   if((paired?box.hitDone:e.hitDone)||(box.delay||0)>e.attackElapsed||!overlap(player,box))continue;
   if(paired)box.hitDone=true;else e.hitDone=true;
   const victim=player;damage(paired?3:2,box.face||e.attackFace,true);
   if(player!==victim||!current(e)||state!=='play')return false;
  }
  return true;
 }
 function release(e){
  phase(e,'strike',e.move==='captainLeap'?.85:e.move==='captainThrust'?.5:e.move==='councilSweep'?.65:.4);
  e.poseIndex=/Bolts|Sigils|Summon|Volley/.test(e.move)?5:3;syncParts(e);
  if(e.move==='necroBolts')bolts(e,3,255,.21);
  if(e.move==='councilVolley')for(const offset of [-55,55])bolts(e,3,265,.24,e.x+e.w/2+offset);
  if(e.move==='necroSummon'&&typeof DungeonRun!=='undefined'&&typeof DungeonRun.summon==='function'){
   DungeonRun.summon(e);if(!current(e)||state!=='play')return false;
  }
  e.summons=[];return strike(e);
 }
 function tickEffects(e,dt){
  for(const h of e.hazards){
   h.warning=Math.max(0,h.warning-dt);h.life-=dt;h.active=h.warning<=0;
   if(h.active&&h.life>0&&!h.hitDone&&overlap(player,h)){
    h.hitDone=true;const victim=player;damage(h.damage,player.x+player.w/2>h.x+h.w/2?1:-1);
    if(player!==victim||!current(e)||state!=='play')return false;
   }
  }
  e.hazards=e.hazards.filter(h=>h.life>0);for(const s of e.summons)s.warning=Math.max(0,s.warning-dt);return true;
 }
 function update(e,dt){
  if(state!=='play'||!Number.isFinite(dt)||dt<=0||!current(e))return;
  if(!inside(e)){if(e.active)reset(e);return;}
  if(!e.active){if(player.y+player.h<e.arena.y-200)return;e.active=true;}
  e.inv=Math.max(0,e.inv-dt);e.stun=Math.max(0,e.stun-dt);e.blockFlash=Math.max(0,e.blockFlash-dt);e.guardBreak=Math.max(0,e.guardBreak-dt);
  e.walkSpeed=0;e.animTime+=dt;e.clock-=dt;if(!tickEffects(e,dt))return;
  if(e.phase==='wait'){follow(e,dt);if(e.clock<=0)tell(e);}
  else if(e.phase==='windup'){e.windup=Math.max(0,e.clock);if(e.clock<=0&&!release(e))return;}
  else if(e.phase==='strike'){
   e.attackElapsed+=dt;e.attackTime=Math.max(0,e.clock);
   if(e.move==='captainThrust'||e.move==='captainLeap'){
    const old=e.x,progress=clamp(e.attackElapsed/e.attackDuration,0,1);e.x=e.travelStart+(e.travelEnd-e.travelStart)*progress;e.walkSpeed=(e.x-old)/dt;
    if(e.move==='captainLeap')e.y=e.baseY-Math.sin(progress*Math.PI)*160;syncParts(e);
   }
   if(!strike(e))return;
   if(e.clock<=0){e.y=e.baseY;e.attackBox=null;e.attackBoxes=[];phase(e,'recover',1.05);e.poseIndex=4;syncParts(e);}
  }else if(e.phase==='recover'&&e.clock<=0){phase(e,'wait',.55);e.poseIndex=0;syncParts(e);}
 }
 function hit(e,weaponBox,amount,kind='normal'){
  if(state!=='play'||!current(e)||!e.active||e.inv>0||!weaponBox||!Number.isFinite(amount)||amount<=0||!e.parts.some(part=>overlap(weaponBox,part)))return 0;
  const before=e.hp;e.hp=Math.max(0,e.hp-amount);e.inv=.22;
  DevDamage.record('outgoing',e,before,e.hp);burst(e.x+e.w/2,e.y+30,realms[realm].gold,9);
  if(e.hp<=0)killEnemy(e);return before-e.hp;
 }
 function defeat(e){
  if(!current(e)||!e.active||e.hp>0)return false;
  e.dead=true;e.active=false;clearEffects(e);e.y=e.baseY;e.phase='dead';e.poseIndex=4;e.windup=e.attackTime=e.walkSpeed=0;syncParts(e);
  if(typeof DungeonRun!=='undefined'&&typeof DungeonRun.onBossDefeated==='function')DungeonRun.onBossDefeated(e);
  return true;
 }
 return Object.freeze({profiles,is,create,reset,update,hit,defeat,parts:e=>e.parts||[],source});
})();
