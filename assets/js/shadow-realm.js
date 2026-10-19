/* Fourth-realm state and encounter mechanics; all clocks run in active play. */
'use strict';
const ShadowRealm=(()=>{
 const active=()=>realm===3&&level===levels[3]&&!Prologue.active;
 const travelAllowed=(from,to)=>from!==3&&to!==3||flags[3].includes('shadowAltar');
 function enter(){
  if(realm!==2||!defeated[2]||!pointNear(level.father,110,100))return false;
  if(!flags[2].includes('shadowEntered'))flags[2].push('shadowEntered');
  enterRealm(3);persist();story('shadow.label','shadow.name','shadow.story.entry');return true;
 }
 function objective(){
  if(!hasFlag('prisonOpen'))return{point:level.prisonDoor,name:I18n.t('shadow.place.prison'),text:I18n.t('shadow.objective.prison')};
  if(!hasFlag('prisonTrace'))return{point:level.prisonTrace,name:I18n.t('HARU'),text:I18n.t('shadow.objective.search')};
  if(!defeated[3])return{point:level.boss,name:realms[3].boss,text:I18n.t('shadow.objective.priest')};
  return{point:level.rests.at(-1),compass:false,text:I18n.t('shadow.objective.search')};
 }
 function context(){
  if(!active())return null;
  if(pointNear(level.altar)&&!hasFlag('shadowAltar'))return{type:'shadowAltar',text:I18n.t('shadow.altar.prompt')};
  if(pointNear(level.prisonDoor,125,90)&&!hasFlag('prisonOpen'))return{type:'prisonDoor',text:I18n.t(hasFlag('prisonKey')?'shadow.prison.open':'shadow.prison.locked')};
  if(pointNear(level.prisonTrace)&&hasFlag('prisonOpen')&&!hasFlag('prisonTrace'))return{type:'prisonTrace',text:I18n.format('message.e.arg0.arg1',[I18n.t('text.recall'),I18n.t('HARU')])};
  return null;
 }
 function interact(c){
  if(!active())return false;
  if(c.type==='shadowAltar'){
   if(hasFlag('shadowAltar'))return true;
   flags[3].push('shadowAltar');
   persist();updateHUD();
   story('shadow.label','shadow.place.altar','shadow.altar.story',()=>toast(I18n.t('shadow.altar.unlocked')));return true;
  }
  if(c.type==='prisonDoor'){
   if(!hasFlag('prisonKey')){toast(I18n.t('shadow.prison.locked'));return true;}
   flags[3]=flags[3].filter(f=>f!=='prisonKey');flags[3].push('prisonOpen');
   persist();updateHUD();toast(I18n.t('shadow.prison.consumed'));return true;
  }
  if(c.type==='prisonTrace'){
   flags[3].push('prisonTrace');persist();updateHUD();return true;
  }
  if(c.type==='shadowItem'){
   const o=c.object;if(hasFlag(o.id)||!relicUnlocked(o)||o.id==='prisonKey'&&hasFlag('prisonOpen'))return true;
   flags[3].push(o.id);persist();updateHUD();toast(o.name);return true;
  }
  return false;
 }
 function interrupt(){
  if(active()&&boss.phase==='windup'&&boss.move==='bell'&&attackKind==='heavy'){
   boss.move=null;setBossPhase('recover',1.1);return true;
  }
  return false;
 }
 function bolts(entity,count,speed,source){
  const x=entity.x+entity.w/2,y=entity.y+entity.h*.4;
  const angle=Math.atan2(player.y+player.h*.5-y,player.x+player.w/2-x);
  for(let i=0;i<count;i++){
   const a=angle+(i-(count-1)/2)*.23;
   shoot(x,y,Math.cos(a)*speed,Math.sin(a)*speed,'#be96eb',5,'shadowBolt');
   Object.assign(projectiles.at(-1),{source,damage:1,radius:10});
  }
 }
 const currentEntity=entity=>entity===boss?bossStarted&&!entity.dead:enemies.includes(entity)&&entity.active&&!entity.dead;
 function hazards(entity,dt){
  for(const h of entity.hazards){
   h.warning-=dt;h.life-=dt;h.active=h.warning<=0;
   if(h.active&&overlap(player,h))damage(1,player.x>h.x?1:-1);
   if(!currentEntity(entity)||state!=='play')return;
  }
  entity.hazards=entity.hazards.filter(h=>h.life>0);
 }
 function sigils(entity,count,source){
  const a=entity.arena||level.arena,cx=player.x+player.w/2;
  for(let i=0;i<count;i++)entity.hazards.push({kind:'shadowPillar',source,x:clamp(cx+(i-(count-1)/2)*165,a.x+35,a.x+a.w-95),y:a.y-175,w:60,h:175,warning:1,life:1.65,active:false});
 }
 function updateBoss(dt){
  $('bossHud').hidden=!bossStarted||boss.dead;if(!bossStarted||boss.dead)return;
  if(boss.hp<=0){checkBossHealth();return;}
  const encounter=boss;
  $('bossName').textContent=I18n.t(realms[3].boss);$('bossHealth').style.width=`${Math.max(0,boss.hp/boss.max)*100}%`;
  boss.inv=Math.max(0,boss.inv-dt);boss.clock-=dt;boss.animClock+=dt;
  hazards(boss,dt);if(boss!==encounter||!bossStarted||boss.dead||state!=='play')return;
  if(boss.phase==='wait'){
   boss.face=Math.sign(player.x+player.w/2-boss.x-boss.w/2)||boss.face;
   if(Math.abs(player.x-boss.x)>370)boss.x=clamp(boss.x+boss.face*65*dt,level.arena.x+70,level.arena.x+level.arena.w-boss.w-70);
   if(boss.clock<=0){
    boss.move=['bolts','sigils','bell','cleave'][boss.cycles++%4];boss.targetX=player.x+player.w/2;
    setBossPhase('windup',boss.move==='bell'?1.5:boss.move==='cleave'?.85:1.1);
    if(boss.move==='bell')toast(I18n.t('shadow.bell.warning'));
   }
  }else if(boss.phase==='windup'&&boss.clock<=0){
   const move=boss.move;setBossPhase('strike',move==='bell'?.8:.55);boss.drainPending=false;
   if(move==='bolts')bolts(boss,5,260,'boss');
   if(move==='sigils')sigils(boss,5,'boss');
   if(move==='cleave'){
    const hit={x:boss.face>0?boss.x:boss.x-130,y:boss.y-10,w:boss.w+130,h:boss.h+20};
    if(overlap(player,hit))damage(2,boss.face);
   }
   if(move==='bell'){
    const caught=Math.abs(player.x+player.w/2-boss.targetX)<145&&Math.abs(player.y+player.h-level.arena.y)<110;
    if(caught&&dash<=0&&player.inv<=0&&!DevImmortality.active){
     player.stun=.65;player.vx=0;boss.drainPending=true;
     attack=0;attackElapsed=0;attackHit=true;jumpBuffer=0;
    }
   }
  }else if(boss.phase==='strike'){
   if(boss.move==='bell'&&boss.drainPending&&boss.clock<=.3){
    boss.drainPending=false;const hp=player.hp;
    damage(2,0);
    // A fatal drain may rebuild the encounter. Never heal its replacement.
    if(boss===encounter&&bossStarted&&!boss.dead)boss.hp=Math.min(boss.max,boss.hp+Math.max(0,hp-player.hp)*3);
   }
   if(boss===encounter&&bossStarted&&boss.clock<=0)setBossPhase('recover',1.1);
  }else if(boss.phase==='recover'&&boss.clock<=0)setBossPhase('wait',.7);
 }
 function miniDimensions(spec){return spec.miniboss==='organist'?{h:210,w:250,maxHp:105}:{h:110,w:82,maxHp:75};}
 function updateMini(e,dt){
  const a=e.arena,dy=player.y+player.h-a.y,inside=player.x+player.w>a.x-80&&player.x<a.x+a.w+80&&dy>=-340&&dy<=25;
  if(!inside){if(e.active)resetMiniboss(e);return;}
  if(!e.active){if(dy>12||dy< -180)return;e.active=true;}
  e.inv=Math.max(0,e.inv-dt);e.clock-=dt;e.animTime+=dt;e.walkSpeed=0;
  hazards(e,dt);if(!currentEntity(e)||state!=='play')return;
  if(e.phase==='wait'){
   const dx=player.x+player.w/2-e.x-e.w/2;e.face=Math.sign(dx)||e.face;
   if(e.miniboss==='jailer'&&Math.abs(dx)>120){const old=e.x;e.x=clamp(e.x+e.face*70*dt,e.patrolLeft,e.patrolRight);e.walkSpeed=(e.x-old)/dt;}
   if(e.clock<=0){
    e.move=(e.miniboss==='jailer'?['axe','stomp','axe']:['organFan','organPipes','organChord'])[e.cycles++%3];
    e.targetX=player.x+player.w/2;setMiniPhase(e,'windup',e.move==='axe'?1:1.3);
   }
  }else if(e.phase==='windup'){
   e.windup=Math.max(0,e.clock);if(e.clock>0)return;
   setMiniPhase(e,'strike',.7);e.attackTime=.7;e.attackElapsed=0;
   if(e.move==='axe')miniMelee(e,185,2);
   else if(e.move==='organFan')bolts(e,7,225,'mini:'+e.id);
   else sigils(e,e.move==='stomp'?3:e.move==='organPipes'?5:7,'mini:'+e.id);
  }else if(e.phase==='strike'){
   e.attackElapsed+=dt;e.attackTime=Math.max(0,e.clock);
   if(e.clock<=0)setMiniPhase(e,'recover',1);
  }else if(e.phase==='recover'&&e.clock<=0)setMiniPhase(e,'wait',.6);
 }
 return Object.freeze({active,enter,objective,context,interact,travelAllowed,interrupt,updateBoss,updateMini,miniDimensions});
})();
