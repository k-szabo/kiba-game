/* Explicit movement and attack states; an enemy never flips every frame at a patrol edge. */
'use strict';
function createEnemies() {
  return level.enemies.map(createEnemy);
}
function createEnemy(spec,i=0) {
    if(spec.miniboss)return createMiniboss(spec,i);
    const h=spec.kind==='shield'?62:spec.kind==='mage'?58:54,w=spec.kind==='shield'?48:40;
    const maxHp=spec.kind==='shield'?6:spec.kind==='archer'?3:spec.kind==='fly'?2:4;
    const support=spec.kind==='fly'?null:platforms.find(p=>Math.abs(p.y-spec.y)<4&&spec.x+w>p.x&&spec.x<p.x+p.w);
    const left=Math.max(spec.x-spec.patrol,support?support.x+4:0),right=Math.min(spec.x+spec.patrol,support?support.x+support.w-w-4:level.width-w);
    return {...spec,x:clamp(spec.x,left,Math.max(left,right)),y:spec.y-h,w,h,origin:spec.x,baseY:spec.y-h,
      patrolLeft:left,patrolRight:Math.max(left,right),face:i%2?-1:1,patrolFace:i%2?-1:1,hp:maxHp,maxHp,
      stun:0,cd:1+i*.13,contactCd:0,windup:0,windupDuration:0,attackTime:0,attackDuration:.42,
      recovery:0,turnCooldown:0,edgePause:0,blocks:0,guardBreak:0,blockFlash:0,walkSpeed:0,
      animTime:i*.17,attackElapsed:0,dead:false};
}
function respawnEnemies() {
  enemies=createEnemies();projectiles=projectiles.filter(p=>p.source==='boss');
  burst(player.x+20,player.y+30,realms[realm].gold,22);
}
function killEnemy(e) {
  if(e.dead||e.hp>0)return;
  if(e.serpent){defeatLavaSerpent(e);return;}
  if(e.miniboss){defeatMiniboss(e);return;}
  e.dead=true;shards+=e.summoned?1:2;
  if(e.summoned&&e.councilEligible&&e.encounterId===boss.encounterId&&realm===1&&level===levels[1]&&!defeated[1]&&bossStarted&&!boss.dead)boss.councilMinionKills++;
  const role=enemyRole(e);
  awardXP(e.summoned?8:({guard:20,archer:18,shield:26,mage:24}[role]||18));
  updateHUD();
}
function enemyRole(e) {return e.kind==='fly'?(realm===0?'mage':'archer'):e.kind;}
function turnEnemy(e,direction,delay=.6) {
  if(!direction||e.face===direction||e.turnCooldown>0)return;
  e.face=direction;e.turnCooldown=delay;
}
function moveEnemy(e,velocity,dt,patrolling=false) {
  if(e.patrolRight-e.patrolLeft<2||e.edgePause>0){e.walkSpeed=0;return;}
  const next=e.x+velocity*dt;
  // Only reverse when ACTUALLY moving outward, not merely standing at the boundary.
  if(next<e.patrolLeft||next>e.patrolRight){
    const atLeft=next<e.patrolLeft;
    e.x=atLeft?e.patrolLeft:e.patrolRight;e.walkSpeed=0;
    if(patrolling){e.patrolFace=atLeft?1:-1;e.face=e.patrolFace;e.turnCooldown=.8;e.edgePause=.24;}
  }else{e.x=next;e.walkSpeed=velocity;e.animTime+=dt*Math.min(1.5,Math.abs(velocity)/45);}
}
function releaseEnemyAttack(e) {
  const shotsBefore=projectiles.length;
  const palette=e.factionOverride==='yomi'?realms[1]:realms[realm];
  const role=enemyRole(e);e.attackTime=e.attackDuration;e.attackElapsed=0;
  e.recovery=e.kind==='shield'?.9:role==='mage'?.55:.35;
  if(role==='archer'){
    const x=e.x+e.w/2,y=e.y+24,dx=e.targetX-x,dy=e.targetY-y;
    const flight=Math.max(.2,Math.abs(dx)/330),angle=Math.atan2(dy-27.5*flight*flight,dx);
    shoot(x,y,Math.cos(angle)*330,Math.sin(angle)*330,palette.gold,4,'arrow');e.cd=2.4;
  }else if(role==='mage'){
    const angle=Math.atan2(e.targetY-(e.y+20),e.targetX-(e.x+e.w/2)),count=realm===0?1:2;
    for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*.22;shoot(e.x+e.w/2,e.y+20,Math.cos(a)*180,Math.sin(a)*180,palette.accent,4.5,'magic');}e.cd=3.3;
  }else{
    const hit={x:e.face>0?e.x+e.w*.5:e.x-78,y:e.y-4,w:e.w+78,h:e.h+8};
    if(overlap(player,hit))damage(1,e.face);e.cd=e.kind==='shield'?2.5:1.8;
  }
  if(e.summoned)for(let i=shotsBefore;i<projectiles.length;i++)projectiles[i].source='minion';
}
function updateEnemies(dt) {
  for(const e of enemies){
    if(e.dead)continue;
    if(e.serpent){updateLavaSerpent(e,dt);continue;}
    if(e.miniboss){updateMiniboss(e,dt);continue;}
    // An original-fight summon follows Momo across this arena, rather than
    // forgetting the target at its spawn-local patrol/detection boundary.
    const a=level.arena,yomiMinion=e.summoned&&realm===1&&level===levels[1]&&bossStarted&&!boss.dead&&e.encounterId===boss.encounterId;
    const arenaAggro=yomiMinion&&player.x+player.w>a.x&&player.x<a.x+a.w&&player.y+player.h>=a.y-220&&player.y+player.h<=a.y+25;
    const support=e.summoned&&platforms.find(p=>p.id===e.supportId);
    const leaveRefuge=arenaAggro&&support?.bossPlatform&&boss.yomiStage==='normal'&&
      (player.x+player.w<support.x||player.x>support.x+support.w||player.y+player.h>support.y+35);
    if(support?.broken||leaveRefuge){e.supportId='bottom';e.baseY=a.y-e.h;e.y=e.baseY;}
    if(e.summoned&&(support?.broken||leaveRefuge||arenaAggro&&(!support||e.supportId==='bottom'))){
      e.patrolLeft=a.x+8;e.patrolRight=a.x+a.w-e.w-8;
    }
    for(const key of ['stun','cd','contactCd','recovery','guardBreak','blockFlash','turnCooldown','edgePause'])e[key]=Math.max(0,e[key]-dt);
    e.attackTime=Math.max(0,e.attackTime-dt);if(e.attackTime>0)e.attackElapsed+=dt;e.walkSpeed=0;
    const dx=player.x+player.w/2-e.x-e.w/2,dy=player.y+player.h*.5-e.y-e.h*.5,role=enemyRole(e);
    const near=(arenaAggro||Math.abs(dx)<(role==='mage'?610:510))&&Math.abs(dy)<180;
    if(e.stun<=0){
      if(e.windup>0){e.windup-=dt;if(e.windup<=0)releaseEnemyAttack(e);}
      else if(e.recovery<=0&&e.attackTime<=0){
        const range=role==='mage'?580:role==='archer'?490:125;
        if(near&&Math.abs(dx)<range&&e.cd<=0){
          turnEnemy(e,Math.abs(dx)>18?Math.sign(dx):e.face);
          // Attack toward the facing side only. A delayed turn cannot attack through its own back.
          if(Math.abs(dx)<18||Math.sign(dx)===e.face){
            e.windupDuration=role==='mage'?1:role==='archer'?.7:e.kind==='shield'?.8:.55;
            e.windup=e.windupDuration;e.targetX=player.x+player.w/2;e.targetY=player.y+player.h*.5;
          }
        }else{
          const ranged=role==='mage'||role==='archer';let direction=e.patrolFace,speed=role==='mage'?14:role==='archer'?28:e.kind==='shield'?36:42;
          // Stay still inside the preferred range; do not jitter around the player's center.
          if(near){
            turnEnemy(e,Math.abs(dx)>35?Math.sign(dx):e.face);
            if(ranged&&Math.abs(dx)>150&&Math.abs(dx)<range-40)speed=0;
            else if(ranged&&Math.abs(dx)<110){direction=-Math.sign(dx||e.face);speed=32;}
            else if(Math.abs(dx)<70)speed=0;
            else{direction=Math.sign(dx);speed=ranged?26:e.kind==='shield'?42:76;}
            // A target outside the walkable patrol span is watched from the edge, without flipping.
            if(e.x<=e.patrolLeft+1&&direction<0||e.x>=e.patrolRight-1&&direction>0)speed=0;
          }
          if(speed&&!near&&e.turnCooldown<=0)e.face=direction;
          moveEnemy(e,direction*speed,dt,!near);
        }
      }
    }
    if(e.kind==='fly')e.y=e.baseY+Math.sin(time*2+e.origin)*18;
    if(overlap(player,e)&&e.contactCd<=0){damage(1,dx>0?1:-1);e.contactCd=1.1;}
    if(near&&Math.abs(dx)<270&&!visits.has('role:'+e.kind)){
      visits.add('role:'+e.kind);
      if(e.kind==='shield')toast(I18n.t("text.shield.bearer.strike.from.above.or.behind.three.blocked"));
      if(e.kind==='mage')toast(I18n.t("text.mage.a.gathering.glow.signals.an.attack.move.before"));
    }
  }
}

/* Phase-aware bosses. All transitions and summons belong to one encounter. */
function relicRitualReady(){return !flags[2].includes('eclipseRelic')&&flags[0].includes('angelHalo')&&flags[0].includes('demonHorn');}
function uniteVictoryRelics(){
  if(realm!==2||boss.stage!==3||!boss.secretTriggered||!defeated[2]||!boss.dead||boss.hp>0||!relicRitualReady())return false;
  // Original collection flags are historical: keep the tower/cave relics from respawning.
  flags[2].push('eclipseRelic');return true;
}
const ANGEL_HEALTH=140, ECLIPSE_HEALTH=180;
let yomiEncounterSerial=0;
function createBoss(){
  const max=[28,48,ANGEL_HEALTH][realm];
  return {x:level.boss.x,y:level.boss.y-115,w:96,h:115,hp:max,max,phase:'wait',clock:1.4,
    phaseDuration:1.4,vx:0,face:-1,inv:0,dead:defeated[realm],cycles:0,move:null,attackStep:0,targetX:0,
    hazards:[],lava:null,platformOrder:[],destroyedCount:0,animClock:0,stage:1,
    secretEligible:realm===2&&relicRitualReady(),secretTriggered:false,summons:[],summonSerial:0,councilMinionKills:0,
    autoPhase:null,autoClock:0,autoDuration:0,autoCooldown:1.5,autoFace:-1,extraCast:false,
    encounterId:realm===1?++yomiEncounterSerial:0,summonThresholds:[],yomiStage:'normal',shelterTriggered:false,raceTriggered:false,serpent:null,waveClock:0,waveWarning:0};
}
function setBossPhase(phase,duration){boss.phase=phase;boss.clock=duration;boss.phaseDuration=duration;boss.animClock=0;}
function clearEncounterEffects(){
  boss.hazards=[];boss.lava=null;boss.summons=[];boss.autoPhase=null;
  enemies=enemies.filter(e=>!e.summoned&&!e.serpent);boss.serpent=null;
  for(const p of platforms.filter(p=>p.bossPlatform)){p.broken=false;p.crumble=0;}
  projectiles=projectiles.filter(p=>p.source!=='boss'&&p.source!=='minion'&&!p.source?.startsWith('serpent:'));
}
function resetBossBattle(){clearEncounterEffects();boss=createBoss();bossStarted=false;$('bossHud').hidden=true;}
function finishBossBattle(){clearEncounterEffects();}
function awardCouncilKeyDrop(){
  if(realm!==1||level!==levels[1]||defeated[1]||!bossStarted||boss.dead||boss.hp>0||boss.councilMinionKills<8||flags[1].includes('councilKeyEarned'))return false;
  flags[1].push('councilKeyEarned');return true;
}
function bossProjectile(x,y,vx,vy,color,kind,life=5,extra={}){
  shoot(x,y,vx,vy,color,life,kind);Object.assign(projectiles[projectiles.length-1],{source:'boss',...extra});
}
function bossName(){
  if(realm!==2)return realms[realm].boss;
  return ['',I18n.t("text.angel.of.dawn.phase.i"),I18n.t("text.the.dark.angel.phase.ii"),I18n.t("text.lord.of.two.worlds.hidden.phase.iii")][boss.stage];
}
function transformAngel(stage){
  clearEncounterEffects();boss.stage=stage;boss.cycles=0;boss.move=null;boss.attackStep=0;boss.inv=1.8;
  boss.autoCooldown=1.1;
  if(stage===3){boss.secretTriggered=true;boss.max=ECLIPSE_HEALTH;boss.hp=boss.max;}
  else boss.hp=Math.max(1,boss.hp);
  setBossPhase('transform',1.8);shake=.25;
  burst(boss.x+boss.w/2,boss.y+30,stage===2?'#c89aff':'#ffe1a1',55);
  toast(stage===2?I18n.t("text.the.halo.cracks.the.angel.turns.to.shadow.magic"):I18n.t("text.the.halo.and.the.demon.lord.s.horn.awaken"));
}
function checkBossHealth(){
  if(boss.dead)return;
  if(realm===1&&level===levels[1]&&bossStarted&&!defeated[1]){
    // This also protects scripted/oversized damage paths that call health checks.
    if(!boss.shelterTriggered&&boss.hp<=boss.max*.5){boss.hp=boss.max*.5;queueYomiThresholds();startYomiLavaWave('shelter');return;}
    if(boss.yomiStage==='shelter'){boss.hp=Math.max(boss.max*.5,boss.hp);return;}
    if(!boss.raceTriggered&&boss.hp<=boss.max*.1){boss.hp=boss.max*.1;queueYomiThresholds();startYomiLavaWave('race');return;}
    queueYomiThresholds();
  }
  if(realm===2&&boss.stage===1&&boss.hp<=boss.max*.5){transformAngel(2);return;}
  if(boss.hp>0)return;
  if(realm===2&&boss.stage===2&&boss.secretEligible&&!boss.secretTriggered){transformAngel(3);return;}
  guardianDefeated();
}
function hitBoss(amount){
  if(Prologue.active)return Prologue.hit(amount);
  if(!bossStarted||boss.dead||boss.inv>0||boss.phase==='transform'||realm===1&&boss.yomiStage==='shelter')return false;
  boss.hp-=amount;boss.inv=.3;burst(boss.x+40,boss.y+30,realms[realm].gold,20);checkBossHealth();return true;
}
function bossMoves(){
  if(realm===0)return ['cleave','dash','doubleCut'];
  if(realm===1)return ['hammer','slam','hammer','embers'];
  if(boss.stage===1)return ['lightArrows','holySweep','lightArrows'];
  if(boss.stage===2)return ['shadowBolts','shadowNova','shadowRain'];
  return ['eclipse','hellfire','lightArrows','shadowBolts','summon'];
}
function chooseBossMove(){
  const patterns=bossMoves();boss.move=patterns[boss.cycles%patterns.length];boss.cycles++;
  boss.face=Math.abs(player.x+player.w/2-boss.x-boss.w/2)>20?Math.sign(player.x+player.w/2-boss.x-boss.w/2):boss.face;
  boss.vx=boss.face;boss.targetX=player.x+player.w/2;boss.attackStep=0;boss.extraCast=false;
  const duration={cleave:.9,dash:1,doubleCut:.85,hammer:.8,slam:1,lava:1.8,embers:1,summon:1.1,
    lightArrows:1.35,holySweep:1.05,shadowBolts:1,shadowNova:1.15,shadowRain:1.2,eclipse:1.5,hellfire:1.3}[boss.move];
  if(boss.move==='lava'){
    let available=platforms.filter(p=>p.bossPlatform&&!p.broken).sort((a,b)=>a.x-b.x);
    if(available.length<3){for(const p of platforms.filter(p=>p.bossPlatform)){p.broken=false;p.crumble=0;}available=platforms.filter(p=>p.bossPlatform).sort((a,b)=>a.x-b.x);}
    boss.platformOrder=available.map(p=>p.id);boss.destroyedCount=0;
    boss.lava={x:level.arena.x,y:level.arena.y-22,w:level.arena.w,h:35,active:false,warning:duration};
    toast(I18n.t("text.lava.is.rising.jump.onto.the.stone.islands.and"));
  }
  setBossPhase('windup',duration);
}
function scheduleMinions(threshold=null){
  const living=enemies.filter(e=>e.summoned&&!e.dead).length;
  // Only the four health milestones summon in Yomi. Other realms keep their cap.
  if(realm===1){
    if(![.8,.6,.4,.2].includes(threshold)||level!==levels[1]||!bossStarted||boss.dead||defeated[1]||boss.hp>boss.max*threshold||boss.summonThresholds.includes(threshold))return;
    boss.summonThresholds.push(threshold);
  }
  const slots=realm===1?2:Math.min(2,4-living-boss.summons.length);if(slots<=0)return;
  for(let i=0;i<slots;i++){
    const wanted=clamp(boss.targetX+(i?230:-230),level.arena.x+60,level.arena.x+level.arena.w-100);
    const refuge=realm===1&&player.y+player.h<level.arena.y-50?platforms.filter(p=>p.bossPlatform&&!p.broken).sort((a,b)=>Math.abs(a.x+a.w/2-wanted)-Math.abs(b.x+b.w/2-wanted))[0]:null;
    const x=refuge?clamp(wanted,refuge.x+10,refuge.x+refuge.w-55):wanted;
    boss.summons.push({x,y:refuge?refuge.y:level.arena.y,kind:i?'mage':'guard',warning:.95,life:.95,supportId:refuge?.id||null,councilEligible:realm===1&&bossStarted&&level===levels[1]&&!defeated[1],encounterId:boss.encounterId,threshold});
  }
  toast(I18n.t("text.the.demon.is.summoning.minions.move.away.from.the"));
}
function updateSummons(dt){
  for(const portal of boss.summons){
    portal.warning-=dt;if(portal.warning>0)continue;
    const support=platforms.find(p=>p.id===portal.supportId),feet=support?.broken?level.arena.y:portal.y;
    const minion=createEnemy({id:'summon-'+(++boss.summonSerial),x:portal.x,y:feet,kind:portal.kind,patrol:230,group:null},boss.summonSerial);
    Object.assign(minion,{summoned:true,factionOverride:'yomi',supportId:support?.broken?null:portal.supportId,hp:portal.kind==='mage'?3:4,maxHp:portal.kind==='mage'?3:4,cd:1.2,stun:.25,councilEligible:portal.councilEligible,encounterId:portal.encounterId,threshold:portal.threshold});
    enemies.push(minion);burst(portal.x+20,feet-30,'#df8568',22);
  }
  boss.summons=boss.summons.filter(p=>p.warning>0);
}
function queueYomiThresholds(){
  if(realm!==1||level!==levels[1]||!bossStarted||boss.dead||defeated[1])return;
  for(const threshold of [.8,.6,.4,.2])if(boss.hp<=boss.max*threshold&&!boss.summonThresholds.includes(threshold)){
    boss.targetX=player.x+player.w/2;scheduleMinions(threshold);
  }
}
function createLavaSerpent(){
  const feet=platforms.find(p=>p.bossPlatform)?.y||level.arena.y-105;
  return {id:'lava-serpent-'+boss.encounterId,name:I18n.t('yomi.serpent.name'),serpent:true,miniboss:'serpent',kind:'serpent',
    x:clamp(player.x+180,level.arena.x+30,level.arena.x+level.arena.w-150),y:feet-84,w:120,h:84,
    hp:24,maxHp:24,active:true,dead:false,phase:'windup',clock:1.1,phaseDuration:1.1,move:'emberFan',
    face:-1,inv:0,stun:0,animTime:0,walkSpeed:0,windup:1.1,windupDuration:1.1,attackTime:0,attackDuration:.42,attackElapsed:0,
    recovery:0,cycles:0,targetX:player.x+player.w/2,targetY:player.y+player.h*.5,encounterId:boss.encounterId,hazards:[]};
}
function startYomiLavaWave(stage){
  if(realm!==1||level!==levels[1]||!bossStarted||boss.dead)return;
  boss.yomiStage=stage;boss[stage==='shelter'?'shelterTriggered':'raceTriggered']=true;
  boss.hazards=[];boss.autoPhase=null;boss.autoCooldown=1.1;boss.move='lava';boss.attackStep=0;
  boss.waveWarning=2;boss.waveClock=0;boss.destroyedCount=0;
  const islands=platforms.filter(p=>p.bossPlatform).sort((a,b)=>a.x-b.x);
  for(const p of islands){p.broken=false;p.crumble=0;}
  boss.platformOrder=islands.map(p=>p.id);
  boss.lava={x:level.arena.x,y:level.arena.y-22,w:level.arena.w,h:35,active:false,warning:2,lethal:stage==='race',wave:stage};
  // Floating above the final refuge keeps both the demon and Momo's sword at
  // the same height during the race, rather than stranding the boss below it.
  const last=islands.at(-1);
  if(last){boss.x=last.x+last.w/2-boss.w/2;boss.y=last.y-boss.h;}
  if(stage==='shelter'){
    boss.serpent=createLavaSerpent();enemies.push(boss.serpent);
  }else if(boss.serpent&&!boss.serpent.dead){
    const e=boss.serpent;e.active=true;e.phase='windup';e.move='emberFan';e.clock=1.1;e.phaseDuration=1.1;e.windup=1.1;e.inv=.35;
    e.x=clamp(player.x+180,level.arena.x+30,level.arena.x+level.arena.w-e.w-30);e.y=(last?.y||level.arena.y)-e.h;
    toast(I18n.t('yomi.phase.return'));
  }
  projectiles=projectiles.filter(p=>p.source!=='boss'&&!p.source?.startsWith('serpent:'));
  setBossPhase('windup',2);toast(I18n.t(stage==='shelter'?'yomi.phase.shelter':'yomi.phase.race'));
}
function endYomiShelter(){
  if(boss.yomiStage!=='shelter'||boss.dead)return;
  if(boss.serpent&&!boss.serpent.dead){boss.serpent.active=false;boss.serpent.phase='dormant';boss.serpent.windup=0;}
  projectiles=projectiles.filter(p=>!p.source?.startsWith('serpent:'));
  boss.yomiStage='normal';boss.lava=null;boss.move=null;boss.autoPhase=null;boss.autoCooldown=1;
  boss.y=level.arena.y-boss.h;boss.inv=.6;
  for(const p of platforms.filter(p=>p.bossPlatform)){p.broken=false;p.crumble=0;}
  setBossPhase('recover',1.1);
}
function updateYomiWave(dt){
  const fight=boss;
  if(boss.waveWarning>0){
    boss.waveWarning=Math.max(0,boss.waveWarning-dt);
    if(boss.lava)boss.lava.warning=boss.waveWarning;
    if(boss.waveWarning===0){boss.lava.active=true;boss.waveClock=0;setBossPhase('strike',12.5);}
  }else{
    boss.waveClock+=dt;
    const count=boss.platformOrder.length-(boss.yomiStage==='shelter'?1:0);
    for(let i=0;i<count;i++){
      const p=platforms.find(p=>p.id===boss.platformOrder[i]),collapseAt=2+i*1.45;
      if(p&&!p.broken){p.crumble=clamp((boss.waveClock-collapseAt+1.1)/1.1,0,1);if(boss.waveClock>=collapseAt){p.broken=true;boss.destroyedCount++;burst(p.x+p.w/2,p.y,'#ffae60',22);}}
    }
    if(boss.yomiStage==='shelter'&&boss.destroyedCount>=count)endYomiShelter();
  }
  if(boss!==fight||!bossStarted||boss.dead)return;
  demonAutoAttack(dt);
}
function defeatLavaSerpent(e){
  if(e.dead||e!==boss.serpent||!e.active||realm!==1||level!==levels[1]||!bossStarted||boss.dead)return;
  e.dead=true;e.active=false;e.phase='dead';e.hazards=[];
  projectiles=projectiles.filter(p=>p.source!=='serpent:'+e.id);
  if(!flags[1].includes('serpentScale')){flags[1].push('serpentScale');awardXP(70);persist();updateHUD();toast(I18n.t('yomi.serpent.scale.gained'));}
  burst(e.x+e.w/2,e.y+e.h*.5,'#ffbd69',36);
  if(boss.yomiStage==='shelter')endYomiShelter();
}
function updateLavaSerpent(e,dt){
  if(!e.active||e.dead||e!==boss.serpent||realm!==1||!bossStarted||boss.dead)return;
  e.inv=Math.max(0,e.inv-dt);e.stun=Math.max(0,e.stun-dt);e.clock-=dt;e.animTime+=dt;e.walkSpeed=0;
  if(e.phase==='wait'){
    const dx=player.x+player.w/2-e.x-e.w/2;e.face=Math.sign(dx)||e.face;
    const feet=clamp(player.y+player.h,level.arena.y-220,level.arena.y-75);
    e.y+=(feet-e.h-e.y)*Math.min(1,dt*3);
    if(Math.abs(dx)>135){const old=e.x;e.x=clamp(e.x+e.face*115*dt,level.arena.x+25,level.arena.x+level.arena.w-e.w-25);e.walkSpeed=(e.x-old)/dt;}
    if(e.clock<=0){e.move=e.cycles++%2?'bite':'emberFan';e.targetX=player.x+player.w/2;e.targetY=player.y+player.h*.5;setMiniPhase(e,'windup',e.move==='bite'?.8:1.1);}
  }else if(e.phase==='windup'){
    e.windup=Math.max(0,e.clock);
    if(e.clock<=0){
      setMiniPhase(e,'strike',.42);e.attackTime=.42;e.attackElapsed=0;
      if(e.move==='bite')miniMelee(e,125,2);
      else{
        const angle=Math.atan2(e.targetY-e.y-e.h*.5,e.targetX-e.x-e.w*.5);
        for(const spread of [-.22,0,.22]){shoot(e.x+e.w/2,e.y+e.h*.5,Math.cos(angle+spread)*240,Math.sin(angle+spread)*240,'#ffa465',4,'ember');Object.assign(projectiles.at(-1),{source:'serpent:'+e.id,damage:1,radius:9});}
      }
      if(e!==boss.serpent||!bossStarted)return;
    }
  }else if(e.phase==='strike'){e.attackElapsed+=dt;if(e.clock<=0){e.attackTime=0;setMiniPhase(e,'recover',.65);}}
  else if(e.phase==='recover'&&e.clock<=0)setMiniPhase(e,'wait',.7);
}
function startBossAttack(){
  const duration={cleave:.28,dash:.55,doubleCut:.9,hammer:.35,slam:.3,lava:6.8,embers:1.2,summon:.45,
    lightArrows:1.4,holySweep:.85,shadowBolts:1.35,shadowNova:.7,shadowRain:1.4,eclipse:1.65,hellfire:1.5}[boss.move];
  setBossPhase('strike',duration);shake=.12;tone(realm===2?600:75,.2,'triangle',.04);
  if(boss.move==='lava'&&boss.lava)boss.lava.active=true;
  if(boss.move==='summon')scheduleMinions();
  if(boss.move==='slam'||boss.move==='hellfire'){
    const x=clamp(boss.targetX,level.arena.x+100,level.arena.x+level.arena.w-100);
    for(const d of [-1,0,1])boss.hazards.push({kind:'eruption',x:x+d*170-40,y:level.arena.y-130,w:80,h:130,warning:.75+Math.abs(d)*.18,life:1.85,active:false});
    if(boss.move==='hellfire')for(const d of [-1,1])lightArrowAt(x+d*330,.9);
  }
}
function bossMelee(width=145,height=115,amount=2,lift=0,face=boss.face){
  const hit={x:face>0?boss.x+boss.w*.4:boss.x-width,y:boss.y+10-lift,w:width+boss.w*.6,h:height+lift};
  if(overlap(player,hit))damage(amount,face);
}
function lightArrowAt(x,warning=.7){
  boss.hazards.push({kind:'lightPillar',x:clamp(x,level.arena.x+50,level.arena.x+level.arena.w-50)-18,y:level.arena.y-490,w:36,h:490,warning,life:warning+.7,active:false});
}
function aimedShadowPair(cx,cy,speed=245){
  const angle=Math.atan2(player.y+player.h*.5-cy,player.x+player.w/2-cx);
  for(const spread of [-.17,.17])bossProjectile(cx,cy,Math.cos(angle+spread)*speed,Math.sin(angle+spread)*speed,'#bb87f8','shadowBolt',5,{damage:1,radius:10});
}
function executeBossMove(dt){
  const elapsed=boss.phaseDuration-boss.clock,cx=boss.x+boss.w/2,cy=boss.y+35;
  if(boss.move==='dash'){boss.x=clamp(boss.x+boss.face*560*dt,level.arena.x+40,level.arena.x+level.arena.w-boss.w-40);bossMelee(90,100);}
  else if(boss.move==='cleave')bossMelee(180,110);
  else if(boss.move==='doubleCut'){if(elapsed<.2||elapsed>.58&&elapsed<.8)bossMelee(140,100);}
  else if(boss.move==='hammer')bossMelee(180,140,2,65);
  else if(boss.move==='slam')bossMelee(145,110);
  else if(boss.move==='lava'){
    for(let i=0;i<boss.platformOrder.length;i++){
      const p=platforms.find(p=>p.id===boss.platformOrder[i]),collapseAt=1.9+i*.95;
      if(p&&!p.broken){p.crumble=clamp((elapsed-(collapseAt-1.05))/1.05,0,1);if(elapsed>=collapseAt){p.broken=true;boss.destroyedCount++;burst(p.x+p.w/2,p.y,'#ffae60',22);}}
    }
    const last=platforms.find(p=>p.id===boss.platformOrder.at(-1));if(last&&elapsed>5.6){last.broken=false;last.crumble=.6;}
  }else if(boss.move==='embers'){
    if(elapsed>=boss.attackStep*.36&&boss.attackStep<3){const n=boss.attackStep++;for(const dir of [-1,1])bossProjectile(cx,boss.y+85,dir*(175+n*25),-90-n*18,'#ff9b51','ember',4,{gravity:160,damage:1});}
  }else if(boss.move==='lightArrows'){
    if(elapsed>=boss.attackStep*.36&&boss.attackStep<3)lightArrowAt(boss.targetX+(boss.attackStep++-1)*220);
    if(boss.stage===3&&!boss.extraCast){aimedShadowPair(cx,cy);boss.extraCast=true;}
  }else if(boss.move==='holySweep'){
    if(elapsed>=boss.attackStep*.23&&boss.attackStep<3){boss.attackStep++;for(const dy of [-100,50])bossProjectile(cx,cy,boss.face*270,dy,'#fff0a5','holyArrow',4,{damage:1,radius:10});}
  }else if(boss.move==='shadowBolts'){
    if(elapsed>=boss.attackStep*.3&&boss.attackStep<4){boss.attackStep++;aimedShadowPair(cx,cy);}
    if(boss.stage===3&&!boss.extraCast){lightArrowAt(boss.targetX+180,.85);boss.extraCast=true;}
  }else if(boss.move==='shadowNova'){
    if(!boss.attackStep){boss.attackStep=1;for(let i=0;i<8;i++){const angle=i*Math.PI/4+.2;bossProjectile(cx,cy,Math.cos(angle)*195,Math.sin(angle)*195,'#bb87f8','shadowBolt',4,{damage:1,radius:9});}}
  }else if(boss.move==='shadowRain'){
    if(elapsed>=boss.attackStep*.32&&boss.attackStep<4){const x=clamp(boss.targetX+(boss.attackStep++-1.5)*135,level.arena.x+70,level.arena.x+level.arena.w-70);boss.hazards.push({kind:'shadowPillar',x:x-16,y:level.arena.y-420,w:32,h:420,warning:.75,life:1.3,active:false});}
  }else if(boss.move==='eclipse'){
    if(!boss.attackStep){boss.attackStep=1;for(const d of [-1,1])bossProjectile(cx,boss.y+75,d*260,-22,'#b490ef','shadowBolt',5,{damage:1,radius:11});for(const d of [-1,1])lightArrowAt(boss.targetX+d*170,.85);}
  }else if(boss.move==='hellfire'){
    if(!boss.attackStep){boss.attackStep=1;aimedShadowPair(cx,cy,215);}
  }else if(boss.move==='summon'&&boss.stage===3&&!boss.extraCast){lightArrowAt(boss.targetX,.95);boss.extraCast=true;}
}
function demonAutoAttack(dt){
  if(realm!==1)return;
  boss.autoCooldown=Math.max(0,boss.autoCooldown-dt);
  const dx=player.x+player.w/2-boss.x-boss.w/2;
  const canAttack=boss.phase==='wait'||boss.phase==='recover'||boss.phase==='strike'&&boss.move==='lava';
  if(!boss.autoPhase){
    if(canAttack&&boss.autoCooldown<=0&&Math.abs(dx)<235&&Math.abs(player.y+player.h-level.arena.y)<220){boss.autoPhase='windup';boss.autoClock=.7;boss.autoDuration=.7;boss.autoFace=Math.sign(dx)||boss.face;}
    return;
  }
  boss.autoClock-=dt;
  if(boss.autoPhase==='windup'&&boss.autoClock<=0){boss.autoPhase='strike';boss.autoClock=.28;boss.autoDuration=.28;bossMelee(180,140,2,65,boss.autoFace);shake=.12;}
  else if(boss.autoPhase==='strike'&&boss.autoClock<=0){boss.autoPhase='recover';boss.autoClock=.6;boss.autoDuration=.6;}
  else if(boss.autoPhase==='recover'&&boss.autoClock<=0){boss.autoPhase=null;boss.autoCooldown=1.7;}
}
function angelAutoAttack(dt){
  if(realm!==2||boss.phase==='transform')return;
  boss.autoCooldown=Math.max(0,boss.autoCooldown-dt);
  const dx=player.x+player.w/2-boss.x-boss.w/2,dy=player.y+player.h-(boss.y+boss.h);
  if(!boss.autoPhase){
    if(boss.autoCooldown<=0&&Math.abs(dx)<245&&Math.abs(dy)<150){
      boss.autoPhase='windup';boss.autoClock=boss.stage===3?.65:.8;boss.autoDuration=boss.autoClock;boss.autoFace=Math.sign(dx)||boss.face;
    }
    return;
  }
  boss.autoClock-=dt;
  if(boss.autoPhase==='windup'&&boss.autoClock<=0){
    boss.autoPhase='strike';boss.autoClock=.3;boss.autoDuration=.3;
    bossMelee(175,125,boss.stage===3?3:2,30,boss.autoFace);shake=.1;
  }else if(boss.autoPhase==='strike'&&boss.autoClock<=0){boss.autoPhase='recover';boss.autoClock=.45;boss.autoDuration=.45;}
  else if(boss.autoPhase==='recover'&&boss.autoClock<=0){boss.autoPhase=null;boss.autoCooldown=[0,1.6,1.3,1.05][boss.stage];}
}
function updateBossHazards(dt){
  for(const h of boss.hazards){h.warning-=dt;h.life-=dt;h.active=h.warning<=0;if(h.active&&overlap(player,h))damage(h.kind==='lightPillar'?2:1,player.x>h.x?1:-1);}
  boss.hazards=boss.hazards.filter(h=>h.life>0);
  if(boss.lava){boss.lava.warning=Math.max(0,boss.lava.warning-dt);if(boss.lava.active&&overlap(player,boss.lava)){
    if(boss.lava.lethal){player.hp=0;revive();return;}
    damage(2,player.x>boss.x?1:-1);
  }}
  updateSummons(dt);
}
function updateBoss(dt){
  Visuals.updateAtmosphere(dt);
  $('bossHud').hidden=!bossStarted||boss.dead;if(!bossStarted||boss.dead)return;
  if((realm===1||realm===2)&&boss.phase!=='transform'){checkBossHealth();if(boss.dead||state!=='play')return;}
  $('bossName').textContent=I18n.t(bossName());$('bossHealth').style.width=`${Math.max(0,boss.hp/boss.max)*100}%`;
  boss.inv=Math.max(0,boss.inv-dt);boss.clock-=dt;boss.animClock+=dt;
  if(boss.phase==='transform'){if(boss.clock<=0)setBossPhase('wait',.85);return;}
  updateBossHazards(dt);if(!bossStarted||boss.dead)return;
  if(realm===1&&boss.yomiStage!=='normal'){updateYomiWave(dt);return;}
  demonAutoAttack(dt);
  angelAutoAttack(dt);
  if(!bossStarted||boss.dead)return;
  if(boss.phase==='wait'){
    if(!boss.autoPhase&&Math.abs(player.x-boss.x)>165)boss.x=clamp(boss.x+Math.sign(player.x-boss.x)*(realm===1?95:realm===2?85+boss.stage*10:65)*dt,level.arena.x+60,level.arena.x+level.arena.w-boss.w-60);
    // The lava wave leaves Yomi's demon at the final refuge. Keep approaching
    // before committing the next combo instead of spending every wait on a
    // distant hammer swing. Committed windups/strikes retain their timing.
    if(realm===1&&!boss.autoPhase)boss.face=Math.sign(player.x+player.w/2-boss.x-boss.w/2)||boss.face;
    if(boss.clock<=0&&!boss.autoPhase&&(realm!==1||Math.abs(player.x+player.w/2-boss.x-boss.w/2)<235))chooseBossMove();
  }else if(boss.phase==='windup'){if(boss.clock<=0)startBossAttack();}
  else if(boss.phase==='strike'){
    if(realm===1&&boss.move==='lava'&&!boss.autoPhase&&Math.abs(player.x-boss.x)>180)boss.x=clamp(boss.x+Math.sign(player.x-boss.x)*55*dt,level.arena.x+60,level.arena.x+level.arena.w-boss.w-60);
    executeBossMove(dt);if(boss.clock<=0){boss.lava=null;setBossPhase('recover',realm===1?1.25:1.1);}
  }else if(boss.phase==='recover'&&boss.clock<=0&&!boss.autoPhase)setBossPhase('wait',.6);
  if(overlap(player,boss)&&boss.phase!=='recover'&&boss.move!=='lava')damage(1,player.x>boss.x?1:-1);
}
/* Optional encounters are saved independently of the three realm guardians. */
function minibossFlag(id){return 'guardian:'+id;}
function secretKnown(id){return flags[realm].includes('discovered:'+id);}
function relicUnlocked(o){return !o.guardian||flags[realm].includes(minibossFlag(o.guardian));}
function createMiniboss(spec,i){
  const area=level.secrets.find(s=>s.id===spec.secretArea),a=area.arena,h=94,w=68,maxHp=spec.miniboss==='angel'?36:42;
  return {...spec,x:spec.x,y:spec.y-h,w,h,origin:spec.x,baseY:spec.y-h,hp:maxHp,maxHp,
    patrolLeft:a.x+25,patrolRight:a.x+a.w-w-25,face:-1,patrolFace:-1,phase:'wait',clock:1.2,phaseDuration:1.2,
    cycles:0,move:null,active:false,dead:flags[realm].includes(minibossFlag(spec.id)),inv:0,stun:0,
    windup:0,windupDuration:1,attackTime:0,attackDuration:.5,attackElapsed:0,recovery:0,animTime:0,walkSpeed:0,
    turnCooldown:0,guardBreak:0,blockFlash:0,hazards:[],hitDone:false,arena:a};
}
function resetMiniboss(e){
  e.x=e.origin;e.y=e.baseY;e.hp=e.maxHp;e.active=false;e.phase='wait';e.clock=1.2;e.phaseDuration=1.2;
  e.cycles=0;e.move=null;e.windup=0;e.inv=0;e.stun=0;e.hazards=[];e.hitDone=false;e.walkSpeed=0;
  projectiles=projectiles.filter(p=>p.source!=='mini:'+e.id);
}
function resetMinibosses(){for(const e of enemies)if(e.miniboss&&!e.serpent&&!e.dead)resetMiniboss(e);}
function discoverSecrets(){
  for(const area of level.secrets||[])if(!secretKnown(area.id)&&overlap(player,area)&&
    (platforms.some(p=>p.secretArea===area.id&&player.support===p.id)||player.x>=area.arena.x&&player.x+player.w<=area.arena.x+area.arena.w&&player.y+player.h<=area.arena.y+12&&player.y+player.h>=area.arena.y-180)){
    flags[realm].push('discovered:'+area.id);persist();toast(I18n.t('hint.hidden.area.prefix')+area.name);
  }
}
function defeatMiniboss(e){
  if(e.dead)return;
  e.dead=true;e.active=false;e.hazards=[];projectiles=projectiles.filter(p=>p.source!=='mini:'+e.id);
  const flag=minibossFlag(e.id),first=!flags[realm].includes(flag);
  if(first){flags[realm].push(flag);shards+=8;awardXP(e.miniboss==='angel'?80:95);persist();}
  burst(e.x+e.w/2,e.y+35,e.miniboss==='angel'?'#ffe9aa':'#cf8aff',36);
  toast(I18n.t("text.the.ancient.guardian.rests.the.altar.s.seal.has"));updateHUD();
}
function setMiniPhase(e,phase,duration){e.phase=phase;e.clock=duration;e.phaseDuration=duration;e.windup=phase==='windup'?duration:0;e.windupDuration=duration;e.hitDone=false;}
function miniMelee(e,width,amount=2){
  const hit={x:e.face>0?e.x+e.w*.4:e.x-width,y:e.y-8,w:width+e.w*.6,h:e.h+20};
  if(overlap(player,hit))damage(amount,e.face);
}
function miniShot(e,angle,speed,kind,color){
  shoot(e.x+e.w/2,e.y+30,Math.cos(angle)*speed,Math.sin(angle)*speed,color,4,kind);
  Object.assign(projectiles.at(-1),{source:'mini:'+e.id,damage:1,radius:kind==='holyArrow'?9:8});
}
function releaseMiniAttack(e){
  setMiniPhase(e,'strike',e.move==='lunge'?.45:.6);
  const angle=Math.atan2(e.targetY-e.y-30,e.targetX-e.x-e.w/2);
  if(e.move==='holyFan')for(const spread of [-.27,0,.27])miniShot(e,angle+spread,255,'holyArrow','#ffe6a2');
  if(e.move==='curse')for(const spread of [-.15,.15])miniShot(e,angle+spread,225,'shadowBolt','#b087dd');
  if(e.move==='sigils')for(const d of [-1,0,1])e.hazards.push({x:clamp(e.targetX+d*140,e.arena.x+40,e.arena.x+e.arena.w-40)-28,y:e.arena.y-145,w:56,h:145,warning:.9,life:1.55,active:false});
  if(e.move==='glaive'||e.move==='staff')miniMelee(e,e.move==='glaive'?155:125);
}
function updateMiniboss(e,dt){
  const a=e.arena,dy=player.y+player.h-a.y,inside=player.x+player.w>a.x-100&&player.x<a.x+a.w+100&&dy>=-320&&dy<=25;
  if(!inside){if(e.active)resetMiniboss(e);return;}
  if(!e.active){if(dy>12||dy< -180)return;e.active=true;toast(e.name+I18n.t("text.watch.the.attack.tells"));}
  e.inv=Math.max(0,e.inv-dt);e.stun=Math.max(0,e.stun-dt);e.clock-=dt;e.animTime+=dt;e.walkSpeed=0;
  for(const hazard of e.hazards){hazard.warning-=dt;hazard.life-=dt;hazard.active=hazard.warning<=0;if(hazard.active&&overlap(player,hazard)){damage(1,player.x>hazard.x?1:-1);if(!e.active)return;}}
  e.hazards=e.hazards.filter(h=>h.life>0);
  if(e.phase==='wait'){
    const dx=player.x+player.w/2-e.x-e.w/2;
    if(Math.abs(dx)>100){e.face=Math.sign(dx);const old=e.x;e.x=clamp(e.x+e.face*(e.miniboss==='angel'?65:48)*dt,e.patrolLeft,e.patrolRight);e.walkSpeed=(e.x-old)/dt;}
    if(e.clock<=0){
      const moves=e.miniboss==='angel'?['glaive','holyFan','lunge']:['staff','curse','sigils'];e.move=moves[e.cycles++%moves.length];
      e.face=Math.sign(dx)||e.face;e.targetX=player.x+player.w/2;e.targetY=player.y+player.h*.5;
      setMiniPhase(e,'windup',e.move==='sigils'?1.15:e.move==='holyFan'||e.move==='curse'?1:.8);
    }
  }else if(e.phase==='windup'){e.windup=Math.max(0,e.clock);if(e.clock<=0)releaseMiniAttack(e);}
  else if(e.phase==='strike'){
    if(e.move==='lunge'){e.x=clamp(e.x+e.face*400*dt,e.patrolLeft,e.patrolRight);if(!e.hitDone){const hp=player.hp;miniMelee(e,105);e.hitDone=player.hp<hp;if(!e.active)return;}}
    if(e.clock<=0)setMiniPhase(e,'recover',e.move==='sigils'?.85:.65);
  }else if(e.phase==='recover'&&e.clock<=0)setMiniPhase(e,'wait',.45);
}

