/* Explicit movement and attack states; an enemy never flips every frame at a patrol edge. */
'use strict';
function createEnemies() {
  return level.enemies.map((spec,i)=>{
    const h=spec.kind==='shield'?62:spec.kind==='mage'?58:54,w=spec.kind==='shield'?48:40;
    const maxHp=spec.kind==='shield'?6:spec.kind==='archer'?3:spec.kind==='fly'?2:4;
    const support=spec.kind==='fly'?null:platforms.find(p=>Math.abs(p.y-spec.y)<4&&spec.x+w>p.x&&spec.x<p.x+p.w);
    const left=Math.max(spec.x-spec.patrol,support?support.x+4:0),right=Math.min(spec.x+spec.patrol,support?support.x+support.w-w-4:level.width-w);
    return {...spec,x:clamp(spec.x,left,Math.max(left,right)),y:spec.y-h,w,h,origin:spec.x,baseY:spec.y-h,
      patrolLeft:left,patrolRight:Math.max(left,right),face:i%2?-1:1,patrolFace:i%2?-1:1,hp:maxHp,maxHp,
      stun:0,cd:1+i*.13,contactCd:0,windup:0,windupDuration:0,attackTime:0,attackDuration:.42,
      recovery:0,turnCooldown:0,edgePause:0,blocks:0,guardBreak:0,blockFlash:0,walkSpeed:0,
      animTime:i*.17,attackElapsed:0,dead:false};
  });
}
function respawnEnemies() {
  enemies=createEnemies();projectiles=projectiles.filter(p=>p.source==='boss');
  burst(player.x+20,player.y+30,realms[realm].gold,22);
}
function killEnemy(e) {
  if(e.dead)return;
  e.dead=true;shards+=2;
  const role=enemyRole(e);
  awardXP({guard:20,archer:18,shield:26,mage:24}[role]||18);
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
  const role=enemyRole(e);e.attackTime=e.attackDuration;e.attackElapsed=0;
  e.recovery=e.kind==='shield'?.9:role==='mage'?.55:.35;
  if(role==='archer'){
    const x=e.x+e.w/2,y=e.y+24,dx=e.targetX-x,dy=e.targetY-y;
    const flight=Math.max(.2,Math.abs(dx)/330),angle=Math.atan2(dy-27.5*flight*flight,dx);
    shoot(x,y,Math.cos(angle)*330,Math.sin(angle)*330,realms[realm].gold,4,'arrow');e.cd=2.4;
  }else if(role==='mage'){
    const angle=Math.atan2(e.targetY-(e.y+20),e.targetX-(e.x+e.w/2)),count=realm===0?1:2;
    for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*.22;shoot(e.x+e.w/2,e.y+20,Math.cos(a)*180,Math.sin(a)*180,realms[realm].accent,4.5,'magic');}e.cd=3.3;
  }else{
    const hit={x:e.face>0?e.x+e.w*.5:e.x-78,y:e.y-4,w:e.w+78,h:e.h+8};
    if(overlap(player,hit))damage(1,e.face);e.cd=e.kind==='shield'?2.5:1.8;
  }
}
function updateEnemies(dt) {
  for(const e of enemies){
    if(e.dead)continue;
    for(const key of ['stun','cd','contactCd','recovery','guardBreak','blockFlash','turnCooldown','edgePause'])e[key]=Math.max(0,e[key]-dt);
    e.attackTime=Math.max(0,e.attackTime-dt);if(e.attackTime>0)e.attackElapsed+=dt;e.walkSpeed=0;
    const dx=player.x+player.w/2-e.x-e.w/2,dy=player.y+player.h*.5-e.y-e.h*.5,role=enemyRole(e);
    const near=Math.abs(dx)<(role==='mage'?610:510)&&Math.abs(dy)<180;
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
      if(e.kind==='shield')toast('Pajzsos: támadj felülről vagy hátulról; három csapás megtöri a pajzsát.');
      if(e.kind==='mage')toast('Varázsló: a feltöltődő fény támadást jelez. Mozdulj el, mielőtt elsül.');
    }
  }
}

/* Three different boss state machines share explicit anticipation and recovery windows. */
function createBoss() {
  const max=[28,42,50][realm];
  return {x:level.boss.x,y:level.boss.y-115,w:96,h:115,hp:max,max,phase:'wait',clock:1.4,
    phaseDuration:1.4,vx:0,face:-1,inv:0,dead:defeated[realm],cycles:0,move:null,attackStep:0,targetX:0,
    hazards:[],lava:null,platformOrder:[],destroyedCount:0,animClock:0};
}
function setBossPhase(phase,duration) {boss.phase=phase;boss.clock=duration;boss.phaseDuration=duration;boss.animClock=0;}
function resetBossBattle() {
  boss=createBoss();bossStarted=false;
  for(const p of platforms.filter(p=>p.bossPlatform)){p.broken=false;p.crumble=0;}
  projectiles=projectiles.filter(p=>p.source!=='boss');$('bossHud').hidden=true;
}
function finishBossBattle() {
  boss.hazards=[];boss.lava=null;
  for(const p of platforms.filter(p=>p.bossPlatform)){p.broken=false;p.crumble=0;}
  projectiles=projectiles.filter(p=>p.source!=='boss');
}
function bossProjectile(x,y,vx,vy,color,kind,life=5,extra={}) {
  shoot(x,y,vx,vy,color,life,kind);Object.assign(projectiles[projectiles.length-1],{source:'boss',...extra});
}
function chooseBossMove() {
  const patterns=realm===0?['cleave','dash','doubleCut']:realm===1?['slam','lava','embers']:['lightArrows','shadowBolts','eclipse'];
  boss.move=patterns[boss.cycles%patterns.length];boss.cycles++;
  boss.face=Math.abs(player.x+player.w/2-boss.x-boss.w/2)>20?Math.sign(player.x+player.w/2-boss.x-boss.w/2):boss.face;
  boss.vx=boss.face;boss.targetX=player.x+player.w/2;boss.attackStep=0;
  const duration={cleave:.9,dash:1,doubleCut:.85,slam:1,lava:1.8,embers:1,lightArrows:1.35,shadowBolts:1,eclipse:1.5}[boss.move];
  if(boss.move==='lava'){
    const available=platforms.filter(p=>p.bossPlatform&&!p.broken).sort((a,b)=>a.x-b.x);
    boss.platformOrder=available.map(p=>p.id);boss.destroyedCount=0;
    // New safe ledges return before every lava cycle. The floor stays solid beneath the lava.
    if(available.length<3){for(const p of platforms.filter(p=>p.bossPlatform)){p.broken=false;p.crumble=0;}boss.platformOrder=platforms.filter(p=>p.bossPlatform).sort((a,b)=>a.x-b.x).map(p=>p.id);}
    boss.lava={x:level.arena.x,y:level.arena.y-22,w:level.arena.w,h:35,active:false,warning:duration};
    toast('Láva tör fel! Ugorj a kőszigetekre; a repedező platformról időben lépj tovább.');
  }
  setBossPhase('windup',duration);
}
function startBossAttack() {
  const duration={cleave:.28,dash:.55,doubleCut:.9,slam:.3,lava:6.8,embers:1.2,lightArrows:1.4,shadowBolts:1.35,eclipse:1.65}[boss.move];
  setBossPhase('strike',duration);shake=.12;tone(realm===2?600:75,.2,'triangle',.04);
  if(boss.move==='lava')boss.lava.active=true;
  if(boss.move==='slam'){
    const x=clamp(boss.targetX,level.arena.x+100,level.arena.x+level.arena.w-100);
    for(const d of [-1,0,1])boss.hazards.push({kind:'eruption',x:x+d*170-40,y:level.arena.y-130,w:80,h:130,warning:.55+Math.abs(d)*.18,life:1.6,active:false});
  }
}
function bossMelee(width=145,height=115,amount=2) {
  const hit={x:boss.face>0?boss.x+boss.w*.4:boss.x-width,y:boss.y+10,w:width+boss.w*.6,h:height};
  if(overlap(player,hit))damage(amount,boss.face);
}
function executeBossMove(dt) {
  const elapsed=boss.phaseDuration-boss.clock,cx=boss.x+boss.w/2,cy=boss.y+35;
  if(boss.move==='dash'){
    boss.x=clamp(boss.x+boss.face*560*dt,level.arena.x+40,level.arena.x+level.arena.w-boss.w-40);bossMelee(90,100);
  }else if(boss.move==='cleave')bossMelee(180,110);
  else if(boss.move==='doubleCut'){
    if(elapsed<.2||elapsed>.58&&elapsed<.8)bossMelee(140,100);
  }else if(boss.move==='slam')bossMelee(145,110);
  else if(boss.move==='lava'){
    for(let i=0;i<boss.platformOrder.length;i++){
      const p=platforms.find(p=>p.id===boss.platformOrder[i]);
      const collapseAt=1.9+i*.95;
      if(!p.broken){p.crumble=clamp((elapsed-(collapseAt-1.05))/1.05,0,1);if(elapsed>=collapseAt){p.broken=true;boss.destroyedCount++;burst(p.x+p.w/2,p.y,'#ffae60',22);}}
    }
    // The final safe ledge lasts until the lava recedes, even if all previous ones broke.
    const last=platforms.find(p=>p.id===boss.platformOrder.at(-1));if(last&&elapsed>5.6){last.broken=false;last.crumble=.6;}
  }else if(boss.move==='embers'){
    if(elapsed>=boss.attackStep*.36&&boss.attackStep<3){
      const n=boss.attackStep++;for(const dir of [-1,1])bossProjectile(cx,boss.y+85,dir*(175+n*25),-90-n*18,'#ff9b51','ember',4,{gravity:160,damage:1});
    }
  }else if(boss.move==='lightArrows'){
    if(elapsed>=boss.attackStep*.36&&boss.attackStep<3){
      const x=clamp(boss.targetX+(boss.attackStep++-1)*220,level.arena.x+70,level.arena.x+level.arena.w-70);
      boss.hazards.push({kind:'lightPillar',x:x-18,y:level.arena.y-490,w:36,h:490,warning:.7,life:1.4,active:false});
    }
  }else if(boss.move==='shadowBolts'){
    if(elapsed>=boss.attackStep*.3&&boss.attackStep<4){
      boss.attackStep++;const angle=Math.atan2(player.y+player.h*.5-cy,player.x+player.w/2-cx);
      for(const spread of [-.17,.17])bossProjectile(cx,cy,Math.cos(angle+spread)*245,Math.sin(angle+spread)*245,'#bb87f8','shadowBolt',5,{damage:1,radius:10});
    }
  }else if(boss.move==='eclipse'){
    if(!boss.attackStep){
      boss.attackStep=1;
      for(const d of [-1,1])bossProjectile(cx,boss.y+95,d*260,-22,'#b490ef','shadowBolt',5,{damage:1,radius:11});
      for(const d of [-1,1])boss.hazards.push({kind:'lightPillar',x:clamp(boss.targetX+d*170,level.arena.x+60,level.arena.x+level.arena.w-60)-18,y:level.arena.y-480,w:36,h:480,warning:.85,life:1.55,active:false});
    }
  }
}
function updateBossHazards(dt) {
  for(const h of boss.hazards){h.warning-=dt;h.life-=dt;h.active=h.warning<=0;
    if(h.active&&overlap(player,h))damage(h.kind==='lightPillar'?2:1,player.x>h.x?1:-1);
  }
  boss.hazards=boss.hazards.filter(h=>h.life>0);
  if(boss.lava){boss.lava.warning=Math.max(0,boss.lava.warning-dt);if(boss.lava.active&&overlap(player,boss.lava))damage(2,player.x>boss.x?1:-1);}
}
function updateBoss(dt) {
  $('bossHud').hidden=!bossStarted||boss.dead;if(!bossStarted||boss.dead)return;
  $('bossName').textContent=realms[realm].boss;$('bossHealth').style.width=`${Math.max(0,boss.hp/boss.max)*100}%`;
  boss.inv=Math.max(0,boss.inv-dt);boss.clock-=dt;boss.animClock+=dt;
  updateBossHazards(dt);
  if(boss.phase==='wait'){
    // Samurai repositions; the demon guards the floor; the angel glides above its altar.
    if(realm===0&&Math.abs(player.x-boss.x)>190)boss.x=clamp(boss.x+Math.sign(player.x-boss.x)*65*dt,level.arena.x+60,level.arena.x+level.arena.w-boss.w-60);
    if(boss.clock<=0)chooseBossMove();
  }else if(boss.phase==='windup'){if(boss.clock<=0)startBossAttack();}
  else if(boss.phase==='strike'){
    executeBossMove(dt);
    if(boss.clock<=0){boss.lava=null;setBossPhase('recover',realm===1?1.5:1.25);}
  }else if(boss.phase==='recover'&&boss.clock<=0)setBossPhase('wait',.75);
  if(overlap(player,boss)&&boss.phase!=='recover'&&boss.move!=='lava')damage(1,player.x>boss.x?1:-1);
}
