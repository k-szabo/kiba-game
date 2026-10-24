/* Optional camp encounter: its quest and rewards never replace Japan's guardian. */
'use strict';
const CampMaster=(()=>{
 const flag='guardian:campMaster',soul='campMasterSoul',moves=['overhead','lunge','combo','jumpCut'];
 const rules=Object.freeze({executionSeconds:15,summonWarning:.95,jumpHeight:250,jumpDuration:.95});
 let serial=0;
 const is=enemy=>enemy?.miniboss==='campMaster';
 const current=enemy=>level===samuraiCamp&&enemies.includes(enemy)&&!enemy.dead;
 function phase(enemy,next,duration){
  enemy.phase=next;enemy.clock=duration;enemy.phaseDuration=duration;
  enemy.windup=next==='windup'?duration:0;enemy.windupDuration=duration;
  enemy.attackTime=next==='strike'?duration:0;enemy.attackDuration=duration;
  enemy.attackElapsed=0;enemy.hitDone=false;
 }
 function clearSupport(enemy){
  for(const support of enemies)if(support.campMasterOwner===enemy.encounterToken)support.dead=true;
  enemies=enemies.filter(support=>support.campMasterOwner!==enemy.encounterToken);
  projectiles=projectiles.filter(shot=>shot.campMasterOwner!==enemy.encounterToken);
  enemy.summons=[];
 }
 function reset(enemy){
  clearSupport(enemy);
  Object.assign(enemy,{x:enemy.origin,y:enemy.baseY,hp:enemy.maxHp,active:false,
   dead:!enemy.replay&&flags[0].includes(flag),face:-1,attackFace:-1,patrolFace:-1,
   cycles:0,move:null,comboStep:0,inv:0,stun:0,walkSpeed:0,animTime:0,
   turnCooldown:0,guardBreak:0,blockFlash:0,hazards:[],attackBox:null,poseIndex:0,
   summonThresholds:[],summonSerial:0,executionStarted:false,executionResolved:false,
   executionRemaining:0,jumpStartX:null,jumpTargetX:null});
  phase(enemy,'wait',.8);return enemy;
 }
 function create(spec){
  const arena=samuraiCamp.secrets.find(area=>area.id===spec.secretArea)?.arena||samuraiCamp.arena;
  return reset({...spec,w:90,h:150,maxHp:100,origin:spec.x,baseY:spec.y-150,
   patrolLeft:arena.x+25,patrolRight:arena.x+arena.w-115,arena,encounterToken:++serial});
 }
 function meleeBox(enemy,width=170,height=120){
  return {x:enemy.attackFace>0?enemy.x+enemy.w*.4:enemy.x-width,
   y:enemy.y-20,w:width+enemy.w*.6,h:Math.max(height,enemy.h+20)};
 }
 function landingBox(enemy){return{x:enemy.jumpTargetX-45,y:enemy.arena.y-105,w:enemy.w+90,h:110};}
 function tell(enemy,second=false){
  if(!second)enemy.attackFace=enemy.face;
  if(enemy.move==='jumpCut'){
   enemy.jumpStartX=enemy.x;enemy.jumpTargetX=clamp(player.x+player.w/2-enemy.w/2,enemy.patrolLeft,enemy.patrolRight);
   enemy.attackBox=landingBox(enemy);phase(enemy,'windup',.85);enemy.poseIndex=15;return;
  }
  enemy.attackBox=meleeBox(enemy,enemy.move==='lunge'?270:170,enemy.move==='overhead'?145:120);
  phase(enemy,'windup',second?.35:enemy.move==='overhead'?.7:enemy.move==='lunge'?.55:.45);
  enemy.poseIndex=enemy.move==='overhead'?3:enemy.move==='lunge'?6:9;
 }
 function startStrike(enemy){
  if(enemy.move==='combo')enemy.comboStep++;
  phase(enemy,'strike',enemy.move==='jumpCut'?rules.jumpDuration:enemy.move==='overhead'?.2:enemy.move==='lunge'?.35:.18);
  enemy.poseIndex=enemy.move==='jumpCut'?16:enemy.move==='overhead'?4:enemy.move==='lunge'?7:enemy.comboStep===1?10:11;
 }
 function strike(enemy,box=null){
  if(enemy.hitDone)return true;
  const hit=box||meleeBox(enemy,enemy.move==='lunge'?115:170,enemy.move==='overhead'?145:120);
  if(!overlap(player,hit))return true;
  enemy.hitDone=true;const victim=player;
  damage(enemy.move==='combo'?1:enemy.move==='jumpCut'?3:2,enemy.attackFace,true);
  // Death may replace player/enemies synchronously. No attack may continue
  // against the shrine-spawned character or the replacement encounter.
  if(player!==victim||!current(enemy)||state!=='play'){reset(enemy);return false;}
  return true;
 }
 function summon(enemy,threshold){
  enemy.summonThresholds.push(threshold);
  const a=enemy.arena;
  for(let n=0;n<2;n++)enemy.summons.push({x:a.x+100+n*(a.w-250),y:a.y,
   kind:n?'shield':'guard',warning:rules.summonWarning,warningDuration:rules.summonWarning,
   threshold,executioner:false});
 }
 function beginExecution(enemy){
  enemy.executionStarted=true;enemy.executionRemaining=rules.executionSeconds;
  const a=enemy.arena;
  for(let n=0;n<3;n++)enemy.summons.push({x:a.x+85+n*(a.w-210)/2,y:a.y,
   kind:'archer',warning:rules.summonWarning,warningDuration:rules.summonWarning,
   executioner:true,cageId:samuraiCamp.cages[n]?.id});
 }
 function supportTick(enemy,dt){
  for(const threshold of [.6,.4])if(enemy.hp<=enemy.maxHp*threshold&&!enemy.summonThresholds.includes(threshold))summon(enemy,threshold);
  if(enemy.hp<=enemy.maxHp*.1&&!enemy.executionStarted)beginExecution(enemy);
  for(const portal of enemy.summons){
   portal.warning=Math.max(0,portal.warning-dt);if(portal.warning>0)continue;
   const index=++enemy.summonSerial,support=createEnemy({id:'camp-reinforcement-'+enemy.encounterToken+'-'+index,
    x:portal.x,y:portal.y,kind:portal.kind,patrol:enemy.arena.w,summoned:true,noReward:true,factionOverride:'japan'},index);
   Object.assign(support,{campMasterOwner:enemy.encounterToken,campExecutioner:portal.executioner,
    campCageId:portal.cageId,cd:portal.executioner?.65:.8,patrolLeft:enemy.arena.x+10,
    patrolRight:enemy.arena.x+enemy.arena.w-support.w-10,damageValue:1});
   enemies.push(support);
  }
  enemy.summons=enemy.summons.filter(portal=>portal.warning>0);
  if(!enemy.executionStarted||enemy.executionResolved||enemy.summons.some(portal=>portal.executioner))return true;
  const executioners=enemies.filter(support=>support.campMasterOwner===enemy.encounterToken&&support.campExecutioner&&!support.dead);
  if(!executioners.length){enemy.executionResolved=true;enemy.executionRemaining=0;return true;}
  enemy.executionRemaining=Math.max(0,enemy.executionRemaining-dt);
  if(enemy.executionRemaining>0)return true;
  // A failed attempt never writes permanent captive-loss or victory flags.
  // The quest layer presents the retry scene; this reset already clears damage.
  reset(enemy);
  if(typeof CampQuest.executionFailed==='function')CampQuest.executionFailed(enemy);
  return false;
 }
 function updateSupport(support,dt){
  if(!support?.campMasterOwner)return false;
  if(state!=='play'||!Number.isFinite(dt)||dt<=0||support.dead||!enemies.includes(support))return true;
  const owner=enemies.find(enemy=>is(enemy)&&enemy.encounterToken===support.campMasterOwner);
  if(!owner||!current(owner)||!owner.active){support.dead=true;return true;}
  for(const key of ['stun','cd','contactCd','recovery','guardBreak','blockFlash','turnCooldown','edgePause'])support[key]=Math.max(0,support[key]-dt);
  support.attackTime=Math.max(0,support.attackTime-dt);if(support.attackTime>0)support.attackElapsed+=dt;
  support.walkSpeed=0;
  if(support.stun>0)return true;
  if(support.windup>0){
   support.windup=Math.max(0,support.windup-dt);if(support.windup>0)return true;
   if(support.campExecutioner){
    const cage=samuraiCamp.cages.find(candidate=>candidate.id===support.campCageId);
    const tx=cage?.x??owner.arena.x,ty=(cage?.y??owner.arena.y)-45,x=support.x+support.w/2,y=support.y+24;
    const flight=Math.max(.25,Math.abs(tx-x)/650);
    shoot(x,y,(tx-x)/flight,(ty-y-27.5*flight*flight)/flight,'#f5cb83',Math.max(4,flight+.2),'arrow');
    Object.assign(projectiles.at(-1),{source:'campMaster',campMasterOwner:owner.encounterToken,damage:1});
    support.attackTime=.42;support.attackElapsed=0;support.cd=1.7;
   }else{
    const before=projectiles.length,victim=player;releaseEnemyAttack(support);
    for(let n=before;n<projectiles.length;n++)Object.assign(projectiles[n],{source:'campMaster',campMasterOwner:owner.encounterToken});
    if(player!==victim||!current(owner)||state!=='play')return true;
   }
   return true;
  }
  if(support.recovery>0||support.attackTime>0)return true;
  if(support.campExecutioner){
   const cage=samuraiCamp.cages.find(candidate=>candidate.id===support.campCageId);
   support.face=Math.sign((cage?.x??owner.arena.x)-support.x)||-1;
   if(support.cd<=0){support.windupDuration=.7;support.windup=.7;}
   return true;
  }
  const dx=player.x+player.w/2-support.x-support.w/2;
  turnEnemy(support,Math.abs(dx)>18?Math.sign(dx):support.face);
  if(Math.abs(dx)<125&&support.cd<=0&&Math.abs(player.y+player.h-owner.arena.y)<180){
   if(Math.abs(dx)<18||Math.sign(dx)===support.face){support.windupDuration=support.kind==='shield'?.8:.55;support.windup=support.windupDuration;}
  }else if(Math.abs(dx)>70)moveEnemy(support,Math.sign(dx)*(support.kind==='shield'?70:105),dt);
  if(overlap(player,support)&&support.contactCd<=0){support.contactCd=1.1;damage(1,dx>0?1:-1,true);}
  return true;
 }
 function update(enemy,dt){
  if(state!=='play'||!current(enemy)||!Number.isFinite(dt)||dt<=0)return;
  const a=enemy.arena,feet=player.y+player.h,
   inside=player.x+player.w>a.x-80&&player.x<a.x+a.w+80&&feet>=a.y-550&&feet<=a.y+25;
  if(!inside){if(enemy.active)reset(enemy);return;}
  if(!enemy.active){
   if(feet<a.y-180)return;
   if(!enemy.replay&&!flags[0].includes('mayorExecuted')){CampQuest.masterScene(enemy);return;}
   enemy.active=true;
  }
  if(enemy.hp<=0){defeat(enemy);return;}
  if(!supportTick(enemy,dt))return;
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
   if(enemy.move==='jumpCut'){
    const t=clamp(enemy.attackElapsed/rules.jumpDuration,0,1);
    enemy.x=enemy.jumpStartX+(enemy.jumpTargetX-enemy.jumpStartX)*t;
    enemy.y=enemy.baseY-Math.sin(Math.PI*t)*rules.jumpHeight;
    enemy.poseIndex=t<.2?16:t<.55?17:t<.9?18:19;
    if(t>=.92&&!strike(enemy,landingBox(enemy)))return;
   }else{
    if(enemy.move==='lunge'){
     const before=enemy.x;enemy.x=clamp(enemy.x+enemy.attackFace*360*dt,enemy.patrolLeft,enemy.patrolRight);enemy.walkSpeed=(enemy.x-before)/dt;
    }
    if(!strike(enemy))return;
   }
   if(enemy.clock<=0){
    if(enemy.move==='combo'&&enemy.comboStep===1)tell(enemy,true);
    else{enemy.y=enemy.baseY;phase(enemy,'recover',enemy.move==='combo'?.9:.8);enemy.attackBox=null;enemy.poseIndex=enemy.move==='jumpCut'?20:enemy.move==='overhead'?5:enemy.move==='lunge'?8:11;}
   }
  }else if(enemy.phase==='recover'&&enemy.clock<=0){enemy.attackBox=null;phase(enemy,'wait',.45);enemy.poseIndex=0;}
 }
 function defeat(enemy){
  if(!current(enemy)||enemy.hp>0)return false;
  enemy.dead=true;enemy.active=false;enemy.y=enemy.baseY;enemy.attackBox=null;enemy.hazards=[];
  clearSupport(enemy);enemy.executionRemaining=0;enemy.executionResolved=true;
  enemy.poseIndex=0;enemy.move=null;enemy.attackTime=0;enemy.attackElapsed=0;enemy.windup=0;enemy.hitDone=false;enemy.walkSpeed=0;
  const first=!enemy.replay&&!flags[0].includes(flag);
  if(first){
   flags[0].push(flag);if(!flags[0].includes(soul))flags[0].push(soul);
   Merchant.award(60);awardXP(150);persist();
  }
  updateHUD();if(first&&typeof CampQuest.masterVictory==='function')CampQuest.masterVictory(enemy);return first;
 }
 return Object.freeze({rules,is,create,reset,update,updateSupport,defeat});
})();
