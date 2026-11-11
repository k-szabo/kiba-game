/* Dungeon combat is transient; the run controller owns completion and rewards. */
'use strict';
const DungeonCombat=(()=>{
 const profiles=Object.freeze({
  ...Object.fromEntries(['dungeonCaptain','dungeonNecromancer','dungeonCouncil','cultTempleGuard','woundedAngel','cultHighPriestess'].map(id=>[id,BossCatalog.story(id)])),
  ninjaClanLeader:{...BossCatalog.story('shadowNinjaLeader'),dungeon:'ninjaClan',realm:0,floor:0,encounter:'leader',speed:220,range:190,
   name:'islands.ninjaLeader',moves:['ninjaDagger','ninjaStars','ninjaPoison','ninjaHook','ninjaSmoke']},
  ninjaClanSentinel:{...BossCatalog.story('watchtowerSentinel'),dungeon:'ninjaClan',realm:0,floor:1,encounter:'sentinel',speed:0,range:450,
   name:'ninjaClan.sentinel',moves:['ninjaCrossbow','ninjaSigils','ninjaCrossbow','ninjaNinjutsu']},
  ninjaClanRitualist:{dungeon:'ninjaClan',realm:0,floor:2,encounter:'ritualist',w:85,h:138,hp:2500,speed:135,range:190,
   name:'ninjaClan.ritualist',moves:['ritualSword','priestessBolts','ritualRift']}
 });
 const is=e=>!!e&&Object.hasOwn(profiles,e.miniboss);
 const profile=e=>profiles[e.miniboss];
 function healInfected(e,victim,before){
  if(!current(e)||player!==victim||state!=='play'||e.attempt?.phase!=='infected')return;
  e.attempt=NinjaDungeonEncounters.healFromHit(e.attempt,before-victim.hp);
  e.hp=e.attempt.hp;
  if(e.attempt.phase==='failed')revive();
 }
 function hurt(e,amount,dir,blockable=false){
  const victim=player,before=victim.hp;
  const accepted=damage(amount*(e.towerBoss?e.towerDamageScale:1),dir,blockable);
  healInfected(e,victim,before);
  return accepted;
 }
 function projectileHit(shot,victim,before){
  if(level.dungeon?.id!=='ninjaClan'||!shot.ninjaDungeonOwner)return;
  const e=enemies.find(enemy=>enemy===shot.ninjaDungeonOwner);
  if(e)healInfected(e,victim,before);
 }
 const source=e=>'dungeon:'+e.id;
 const current=e=>is(e)&&(e.towerBoss&&level.tower&&TowerMode.running||(realm===(profile(e).realm??1)&&level.dungeon?.id===(profile(e).dungeon||'yomiFall')&&level.dungeon.floor===profile(e).floor))&&enemies.includes(e)&&!e.dead&&(e.towerBoss||e.runId==null||e.runId===DungeonRun.runId(profile(e).dungeon||'yomiFall'));
 const rage=e=>e.miniboss==='woundedAngel'?1-clamp(e.hp/e.maxHp,0,1):0;
 function phase(e,next,duration){
  e.phase=next;e.clock=duration;e.phaseDuration=duration;e.windup=next==='windup'?duration:0;e.windupDuration=duration;
  e.attackTime=next==='strike'?duration:0;e.attackDuration=duration;e.attackElapsed=0;e.hitDone=false;
 }
 function syncParts(e){e.parts=[{x:e.x,y:e.y,w:e.w,h:e.h,face:e.face,poseIndex:e.poseIndex,index:0}];}
 function clearEffects(e){projectiles=projectiles.filter(p=>p.source!==source(e));e.hazards=[];e.summons=[];e.attackBox=null;e.attackBoxes=[];e.chantRemaining=0;
  if(typeof DungeonRun!=='undefined'&&typeof DungeonRun.cleanupSummons==='function')DungeonRun.cleanupSummons(e);
 }
 function reset(e){
  if(!is(e))return false;clearEffects(e);
  Object.assign(e,{x:e.origin,y:e.baseY,hp:e.maxHp,dead:false,active:false,face:-1,attackFace:-1,inv:0,stun:0,
   cycles:0,move:null,animTime:0,walkSpeed:0,poseIndex:0,targetX:null,targetY:null,blockFlash:0,guardBreak:0,chantRemaining:0,moveRage:0,moveDamage:2});
  if(profile(e).encounter)e.attempt=NinjaDungeonEncounters.begin(profile(e).encounter,e.maxHp);
  phase(e,'wait',1);syncParts(e);return e;
 }
 function create(spec){
  if(!is(spec))throw new TypeError('Unknown dungeon encounter');
  const p=profile(spec),arena=spec.arena||level.arena;
  const e=reset({...spec,name:p.name,w:p.w,h:p.h,maxHp:p.hp,origin:spec.x,baseY:spec.y-p.h,arena,
   patrolLeft:arena.x+25,patrolRight:Math.max(arena.x+25,arena.x+arena.w-p.w-25)});
  if(!spec.replay&&flags[p.realm??1].includes(level.dungeon?.stage||'dungeonStage'+(p.floor+1)+'Clear')){e.dead=true;e.hp=0;e.phase='dead';e.poseIndex=4;syncParts(e);}
  return e;
 }
 function inside(e){const a=e.arena,feet=player.y+player.h;return player.x+player.w>a.x-65&&player.x<a.x+a.w+65&&feet>=a.y-420&&feet<=a.y+30;}
 function blade(e,face,width,height=150){return {x:face>0?e.x+e.w*.4:e.x-width,y:e.baseY+e.h-height,w:width+e.w*.6,h:height};}
 function follow(e,dt){
  const p=profile(e),dx=player.x+player.w/2-e.x-e.w/2;
  if(Math.abs(dx)>18)e.face=Math.sign(dx);
  if(Math.abs(dx)>p.range){const before=e.x;e.x=clamp(e.x+e.face*p.speed*(1+.6*rage(e))*dt,e.patrolLeft,e.patrolRight);e.walkSpeed=(e.x-before)/dt;}
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
  const moves=e.attempt?.phase==='infected'?['voidClaw','ritualRift','priestessBolts']:profile(e).moves;
  e.move=moves[e.cycles++%moves.length];e.attackFace=e.face;e.targetX=player.x+player.w/2;e.targetY=player.y+player.h*.5;
  if(e.move==='ninjaDagger'&&Math.abs(player.x-e.x)>300)e.move='ninjaStars';
  e.attackBox=null;e.attackBoxes=[];e.summons=[];e.poseIndex=2;let duration=1;
  e.moveRage=rage(e);e.moveDamage=e.moveRage>=.65?3:2;
  if(e.move==='ninjaDagger'){duration=.75;e.attackBoxes=[blade(e,e.attackFace,150,100)];e.moveDamage=4;}
  if(e.move==='ninjaSmoke'){duration=.95;e.attackBoxes=[{x:e.targetX-100,y:e.arena.y-140,w:200,h:140}];}
  if(e.move==='ninjaSigils')marks(e,[-170,0,170],100,160,duration,'dungeonSigil');
  if(e.move==='voidClaw'||e.move==='ritualSword'){duration=.95;e.attackBoxes=[blade(e,e.attackFace,230,140)];e.moveDamage=5;}
  if(e.move==='ritualRift'){duration=1.2;marks(e,[-230,0,230],120,160,duration,'dungeonSigil');}
  if(profile(e).encounter==='leader')e.poseIndex=({ninjaDagger:2,ninjaHook:5,ninjaSmoke:6})[e.move]??4;
  if(e.move==='guardFlail'){duration=1.15;e.attackBoxes=[blade(e,e.attackFace,265,145)];}
  if(e.move==='guardBash'){
   duration=1.25;e.travelStart=e.x;e.travelEnd=clamp(e.x+e.attackFace*240,e.patrolLeft,e.patrolRight);
   const start=blade(e,e.attackFace,105,120),end=blade({...e,x:e.travelEnd},e.attackFace,105,120),left=Math.min(start.x,end.x);
   e.attackBoxes=[{x:left,y:start.y,w:Math.max(start.x+start.w,end.x+end.w)-left,h:start.h}];
  }
  if(e.move==='guardCircle'){duration=1.35;e.attackBoxes=[{...blade(e,-1,190,145),face:-1,delay:0,hitDone:false},{...blade(e,1,190,145),face:1,delay:.25,hitDone:false}];}
  if(e.move==='angelCut'){duration=1.2-.2*e.moveRage;e.attackBoxes=[blade(e,e.attackFace,215+45*e.moveRage,150)];}
  if(e.move==='angelLance'){duration=1.3-.2*e.moveRage;e.poseIndex=5;}
  if(e.move==='angelDive'){
   duration=1.3-.2*e.moveRage;e.travelStart=e.x;e.travelEnd=clamp(e.targetX-e.w/2,Math.max(e.patrolLeft,e.x-420),Math.min(e.patrolRight,e.x+420));
   e.attackBoxes=[{x:e.travelEnd+e.w/2-145,y:e.arena.y-125,w:290,h:125}];
  }
  if(e.move==='priestessSummon'){duration=1.4;e.poseIndex=5;e.summons=[e.arena.x+180,e.arena.x+e.arena.w-180].map(x=>({x,y:e.arena.y,warning:duration,warningDuration:duration}));}
  if(e.move==='priestessBolts'){duration=1.15;e.poseIndex=5;}
  if(e.move==='priestessChant'){duration=1.3;e.poseIndex=5;}
  if(e.move==='priestessSigils'){duration=1.4;e.poseIndex=5;marks(e,[-260,0,260],110,110,duration,'dungeonSigil');}
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
 function bolts(e,count,speed,spread,originX=e.x+e.w/2,kind='shadowBolt',damageValue=2){
  const y=e.y+e.h*.3,angle=Math.atan2(e.targetY-y,e.targetX-originX);
  for(let i=0;i<count;i++){
   const a=angle+(i-(count-1)/2)*spread;shoot(originX,y,Math.cos(a)*speed,Math.sin(a)*speed,'#bd82dc',4.5,kind);
   const shot=projectiles.at(-1);
   Object.assign(shot,{source:source(e),damage:damageValue,radius:8});
   if(e.attempt?.phase==='infected')shot.ninjaDungeonOwner=e;
   if(e.move==='ninjaPoison'||e.move==='ninjaHook')Object.assign(shot,{islandEffect:e.move==='ninjaPoison'?'poison':'hook',ownerId:e.id});
  }
 }
 function strike(e){
  if(['captainLeap','angelDive'].includes(e.move)&&e.attackElapsed<.65)return true;
  const boxes=e.move==='captainThrust'?[blade(e,e.attackFace,170,110)]:e.move==='guardBash'?[blade(e,e.attackFace,105,120)]:e.attackBoxes;
  for(const box of boxes){
   const paired=['councilSweep','guardCircle'].includes(e.move);
   if((paired?box.hitDone:e.hitDone)||(box.delay||0)>e.attackElapsed||!overlap(player,box))continue;
   if(paired)box.hitDone=true;else e.hitDone=true;
   if(e.move==='ninjaSmoke'){if(dash<=0)player.stun=Math.max(player.stun||0,.7);continue;}
   const victim=player;hurt(e,e.move==='councilSweep'?3:e.moveDamage||2,box.face||e.attackFace,true);
   if(player!==victim||!current(e)||state!=='play')return false;
  }
  return true;
 }
 function release(e){
  phase(e,'strike',['captainLeap','angelDive'].includes(e.move)?.85:['captainThrust','guardBash'].includes(e.move)?.5:['councilSweep','guardCircle'].includes(e.move)?.65:.4);
  e.poseIndex=/Bolts|Sigils|Summon|Volley/.test(e.move)?5:3;syncParts(e);
  if(profile(e).encounter==='leader')e.poseIndex=({ninjaDagger:3,ninjaHook:5,ninjaSmoke:6})[e.move]??4;
  if(e.move==='necroBolts')bolts(e,3,255,.21);
  if(e.move==='priestessBolts')bolts(e,5,285,.17);
  const ninjaShot={ninjaStars:[5,450,.13,'ninjaStar',3],ninjaPoison:[1,450,0,'shadowBolt',3],ninjaHook:[1,450,0,'arrow',2],
   ninjaCrossbow:[5,450,.12,'arrow',3],ninjaNinjutsu:[7,320,.16,'shadowBolt',3]}[e.move];
  if(ninjaShot){const [count,speed,spread,kind,amount]=ninjaShot;bolts(e,count,speed,spread,undefined,kind,amount);}
  if(e.move==='priestessChant')e.chantRemaining=6;
  if(e.move==='angelLance'){
   const x=e.x+e.w/2,y=e.y+e.h*.3,angle=Math.atan2(e.targetY-y,e.targetX-x),count=e.moveRage>=.65?5:3;
   for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*.17;shoot(x,y,Math.cos(a)*(275+100*e.moveRage),Math.sin(a)*(275+100*e.moveRage),'#ffdb8c',4.5,'holyArrow');Object.assign(projectiles.at(-1),{source:source(e),damage:e.moveDamage,radius:10});}
  }
  if(e.move==='councilVolley')for(const offset of [-55,55])bolts(e,3,265,.24,e.x+e.w/2+offset);
  if(['necroSummon','priestessSummon'].includes(e.move)&&typeof DungeonRun!=='undefined'&&typeof DungeonRun.summon==='function'){
   DungeonRun.summon(e);if(!current(e)||state!=='play')return false;
  }
  e.summons=[];return strike(e);
 }
 function tickEffects(e,dt){
  for(const h of e.hazards){
   h.warning=Math.max(0,h.warning-dt);h.life-=dt;h.active=h.warning<=0;
   if(h.active&&h.life>0&&!h.hitDone&&overlap(player,h)){
    h.hitDone=true;const victim=player;hurt(e,h.damage,player.x+player.w/2>h.x+h.w/2?1:-1);
    if(player!==victim||!current(e)||state!=='play')return false;
   }
  }
  e.hazards=e.hazards.filter(h=>h.life>0);for(const s of e.summons)s.warning=Math.max(0,s.warning-dt);return true;
 }
 function update(e,dt){
  if(state!=='play'||!Number.isFinite(dt)||dt<=0||!current(e))return;
  if(e.attempt&&e.active)player.x=clamp(player.x,e.arena.x+10,e.arena.x+e.arena.w-player.w-10);
  if(!inside(e)){if(e.active)reset(e);return;}
  if(!e.active){if(player.y+player.h<e.arena.y-200)return;e.active=true;}
  if(e.phase==='banish'){
   e.clock-=dt;
   if(e.clock<=0){e.hp=0;killEnemy(e);}
   return;
  }
  if(e.attempt?.phase==='transforming'){
   e.clock-=dt;
   if(e.clock<=0){e.attempt=NinjaDungeonEncounters.finishTransformation(e.attempt);phase(e,'wait',.5);}
   return;
  }
  if(e.attempt?.phase==='ritualist'){
   e.attempt=NinjaDungeonEncounters.tick(e.attempt,dt);
   if(e.attempt.phase==='failed'){revive();return;}
  }
  e.inv=Math.max(0,e.inv-dt);e.stun=Math.max(0,e.stun-dt);e.blockFlash=Math.max(0,e.blockFlash-dt);e.guardBreak=Math.max(0,e.guardBreak-dt);
  e.chantRemaining=Math.max(0,e.chantRemaining-dt);
  e.walkSpeed=0;e.animTime+=dt;e.clock-=dt;if(!tickEffects(e,dt))return;
  if(e.phase==='wait'){follow(e,dt);if(e.clock<=0)tell(e);}
  else if(e.phase==='windup'){e.windup=Math.max(0,e.clock);if(e.clock<=0&&!release(e))return;}
  else if(e.phase==='strike'){
   e.attackElapsed+=dt;e.attackTime=Math.max(0,e.clock);
   if(['captainThrust','captainLeap','guardBash','angelDive'].includes(e.move)){
    const old=e.x,progress=clamp(e.attackElapsed/e.attackDuration,0,1);e.x=e.travelStart+(e.travelEnd-e.travelStart)*progress;e.walkSpeed=(e.x-old)/dt;
    if(['captainLeap','angelDive'].includes(e.move))e.y=e.baseY-Math.sin(progress*Math.PI)*(e.move==='angelDive'?190:160);syncParts(e);
   }
   if(!strike(e))return;
   if(e.clock<=0){e.y=e.baseY;e.attackBox=null;e.attackBoxes=[];phase(e,'recover',1.05-.5*rage(e));e.poseIndex=4;syncParts(e);}
  }else if(e.phase==='recover'&&e.clock<=0){phase(e,'wait',.55-.3*rage(e));e.poseIndex=0;syncParts(e);}
 }
 function hit(e,weaponBox,amount,kind='normal'){
  if(state!=='play'||!current(e)||!e.active||e.inv>0||e.phase==='banish'||!weaponBox||!Number.isFinite(amount)||amount<=0||!e.parts.some(part=>overlap(weaponBox,part)))return 0;
  if(e.miniboss==='cultTempleGuard'&&['wait','windup'].includes(e.phase)&&e.guardBreak<=0&&Math.sign(player.x+player.w/2-e.x-e.w/2)===e.face){
   if(kind==='heavy')e.guardBreak=3;
   else{amount*=.3;e.blockFlash=.3;}
  }
  const before=e.hp;
  if(e.attempt){
   e.attempt=NinjaDungeonEncounters.hit(e.attempt,amount);
   e.hp=e.attempt.hp;
   if(e.attempt.phase==='transforming'&&before>e.hp){
    clearEffects(e);phase(e,'transform',1.25);e.poseIndex=4;
    story('ninjaClan.name','ninjaClan.ritualist','ninjaClan.transform',null,{right:'ninjaClanRitualist',speaker:'ninjaClanRitualist'});
   }
   if(e.attempt.phase==='cleared'){
    const damageDealt=before-e.hp;
    DevDamage.record('outgoing',e,before,e.hp);
    if(e.attempt.kind==='ritualist'){
     clearEffects(e);phase(e,'banish',1.1);e.poseIndex=5;return damageDealt;
    }
    e.hp=0;killEnemy(e);return damageDealt;
   }
  }else e.hp=Math.max(0,e.hp-amount);
  e.inv=.22;
  DevDamage.record('outgoing',e,before,e.hp);burst(e.x+e.w/2,e.y+30,realms[realm].gold,9);
  if(e.hp<=0)killEnemy(e);return before-e.hp;
 }
 function defeat(e){
  if(!current(e)||!e.active||e.hp>0)return false;
  e.dead=true;e.active=false;clearEffects(e);e.y=e.baseY;e.phase='dead';e.poseIndex=4;e.windup=e.attackTime=e.walkSpeed=0;syncParts(e);
  if(!e.towerBoss&&typeof DungeonRun!=='undefined'&&typeof DungeonRun.onBossDefeated==='function')DungeonRun.onBossDefeated(e);
  return true;
 }
 return Object.freeze({profiles,is,create,reset,update,hit,defeat,parts:e=>e.parts||[],source,projectileHit});
})();
