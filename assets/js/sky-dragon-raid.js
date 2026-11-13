/* The raid saves against the ninja camp's canonical shrine. Its combat maps are transient. */
'use strict';
const SkyDragonRaid=(()=>{
 const rules=SkyDragonRaidRules,{tuning}=rules;
 const maps=Object.fromEntries(['harbor','pursuit','back','rift'].map(phase=>[phase,MapCatalog.build('skyDragonRaid'+phase[0].toUpperCase()+phase.slice(1))]));
 const firstClear='skyDragonRaidFirstClear',ringReward='skyDragonRaidRingTurnedIn';
 const crashDuration=1.65;
 const hatchlingMoves={hover:['windup',.9],windup:['dive',.85],dive:['recover',1.2],recover:['hover',1.65]};
 let progress=rules.fresh(),attempt=null,clock=0,shotCooldown=0,target=0,pattern=0,cast=null,flightTime=0,reikaGuard=0,volley=0,crash=0;
 const active=()=>!!attempt&&level?.skyDragonRaid===attempt.phase;
 const available=()=>!Prologue.active&&flags[0].includes('ninjaClanRitualistReward')&&Grapple.owned();
 const entrance=()=>level===ninjaCamp&&available()&&pointNear(ninjaCamp.skyport,105,90);
 const snapshot=()=>progress.run>0?{skyDragonRaid:{...progress}}:{};
 function restore(data){progress=rules.validProgress(data)?{...data}:rules.fresh();attempt=null;}
 function enter(){
  const next=rules.resume(progress);
  if(!next||!available())return false;
  const map=maps[next.phase];
  const hp=player.hp;
  attempt=next;level=map;levelTime=0;platforms=map.platforms.map(platform=>({...platform,dx:0}));
  enemies=[];particles=[];drops=[];projectiles=[];visits=new Set();
  boss=createBoss();boss.dead=true;bossStarted=false;
  clock=next.phase==='rift'?3:5;shotCooldown=0;target=0;pattern=0;cast=null;flightTime=0;reikaGuard=0;volley=0;crash=0;
  initPlayer(map.start);player.hp=Math.min(hp||player.maxHp,player.maxHp);
  if(next.phase==='pursuit')spawnWave();
  if(next.phase==='back'){
   enemies=map.cultists.map((point,index)=>{
    const caster=index%2===1;
    return spawn(point,index,caster?'mage':'guard',tuning.backCultistHealth,caster?2.5:2);
   });
   const {x,y}=map.headGuard;
   enemies.push({...spawn(map.headGuard,tuning.backCultists,'shield',tuning.wardenHealth),
    x:x-53,y:y-154,w:106,h:154,raidWarden:true,wardClock:.9,wardCast:null,wardRecover:0,wardPattern:0,face:-1});
  }
  keys.clear();pressed.clear();context=null;resetCamera();persist();updateHUD();return true;
 }
 function spawn(point,index,kind,hp,damageValue=4){
  return createEnemy({...point,id:'skyRaidEnemy'+index,kind,patrol:180,skyRaidEnemy:true,noReward:true,
   grappleable:false,factionOverride:'shadowCult',combatStats:{hp,damage:damageValue,xp:0}},index);
 }
 function spawnWave(){
  const count=2+attempt.waves;
  enemies=Array.from({length:count},(_,index)=>({...spawn({x:1110+index*200,y:940-index%2*82},index,'fly',28),
   raidHatchling:true,raidClock:1.9+index*.72,raidMove:'hover',raidHit:false}));
 }
 function updateEnemy(enemy,dt){
  if(enemy.raidWarden&&active()){updateWarden(enemy,dt);return true;}
  if(!enemy.raidHatchling||!active())return false;
  if(attempt.outcome!==null)return true;
  enemy.animTime+=dt;enemy.stun=Math.max(0,enemy.stun-dt);
  if(enemy.stun>0)return true;
  enemy.raidClock-=dt;
  if(enemy.raidClock<=0){
   if(enemy.raidMove==='dive'&&Math.abs(enemy.x+enemy.w/2-level.reika.x)<100&&reikaGuard<=0){
    attempt=rules.hitReika(attempt);reikaGuard=3.2;
   }
   [enemy.raidMove,enemy.raidClock]=hatchlingMoves[enemy.raidMove];enemy.raidHit=false;
  }
  const diving=enemy.raidMove==='dive',recovering=enemy.raidMove==='recover';
  const x=diving||recovering?level.reika.x-enemy.w/2+(recovering?Math.sign(enemy.origin-level.reika.x)*48:0):enemy.origin;
  const y=diving||recovering?level.reika.y-enemy.h-(diving?25:4):enemy.baseY;
  const speed=diving?490:180;
  enemy.x+=clamp(x-enemy.x,-speed*dt,speed*dt);enemy.y+=clamp(y-enemy.y,-speed*dt,speed*dt);
  enemy.face=Math.sign(x-enemy.x)||enemy.face;
  if(diving&&!enemy.raidHit&&overlap(player,enemy))enemy.raidHit=damage(2,enemy.face,true);
  return true;
 }
 const warded=()=>enemies.slice(0,tuning.backCultists).some(e=>!e.dead);
 function updateWarden(enemy,dt){
  if(warded()||!pointNear(level.headGuard,520,200)||attempt.outcome!==null)return;
  enemy.inv=Math.max(0,(enemy.inv||0)-dt);
  enemy.wardRecover=Math.max(0,enemy.wardRecover-dt);
  enemy.wardClock-=dt;
  if(enemy.wardClock>0)return;
  if(enemy.wardCast){
   const spell=enemy.wardCast;enemy.wardCast=null;enemy.wardClock=1.6;enemy.wardRecover=1.05;
   if(overlap(player,spell))damage(spell.kind==='sweep'?3:4,enemy.face,spell.kind==='sweep',false,spell.kind==='sweep'?null:'spell');
   burst(spell.x+spell.w/2,spell.y+spell.h-15,'#bc75ed',22);return;
  }
  const center=enemy.x+enemy.w/2,feet=enemy.y+enemy.h;
  enemy.face=Math.sign(player.x+player.w/2-center)||enemy.face;
  const sweep=enemy.wardPattern++%2===0;
  enemy.wardCast=sweep?{kind:'sweep',x:enemy.face>0?center:center-220,y:feet-150,w:220,h:165}:
   {kind:'void',x:player.x+player.w/2-95,y:feet-170,w:190,h:185};
  enemy.wardClock=sweep?.95:1.1;
 }
 function finishPhase(){
  const result=rules.clearPhase(progress,attempt);
  if(!result)return;
  progress=result.progress;
  if(result.points){flags[0].push(firstClear);progression.points+=result.points;}
  persist();
  if(attempt.phase==='back'){
   crash=crashDuration;player.inv=Math.max(player.inv,crashDuration);Grapple.cancel();Dawnblade.resetPlayer();
  }
  else if(attempt.phase==='pursuit')enter();
  else updateHUD();
 }
 function leave(){
  if(!active())return false;
  attempt=null;
  return CampQuest.enter('ninjaClanCamp');
 }
 function retry(){
  if(!active())return false;
  if(!progress.phase)return leave();
  if(attempt.outcome==='cleared')return enter();
  player.hp=player.maxHp;
  return enter();
 }
 function menu(){
  if(state!=='play'||!entrance())return false;
  state='dungeonMenu';keys.clear();pressed.clear();$('dungeonMenu').hidden=false;
  $('dungeonMenuTitle').textContent=I18n.t('skyDragonRaid.name');$('dungeonMenuInfo').textContent='';
  $('dungeonContinue').textContent=I18n.t('fia.dragon.continue');$('dungeonNew').textContent=I18n.t('fia.dragon.new');
  $('dungeonBack').textContent=I18n.t('dungeon.back');$('dungeonContinue').disabled=!progress.phase;
  const close=()=>{if(state!=='dungeonMenu'||!entrance())return false;DungeonRun.cancel();state='play';return true;};
  $('dungeonBack').onclick=close;
  $('dungeonContinue').onclick=()=>{if(progress.phase&&close())enter();};
  $('dungeonNew').onclick=()=>{const next=rules.begin(progress);if(next&&close()){progress=next;enter();}};
  $(progress.phase?'dungeonContinue':'dungeonNew').focus();return true;
 }
 function interact(c){
  if(c.type==='skyRaidMenu')return menu();
  if(c.type==='skyRaidRing')return turnInRing();
  if(!active())return false;
  if(c.type==='skyRaidLeave')return leave();
  if(c.type==='skyRaidRetry')return retry();
  if(c.type==='skyRaidBoard')return enter();
  if(c.type!=='skyRaidBallista')return false;
  if(shotCooldown<=0){
   const next=rules.fireBallista(attempt,c.index);
   if(next!==attempt){attempt=next;shotCooldown=1.25;tone(240,.15);if(attempt.outcome==='cleared')finishPhase();}
  }
  return true;
 }
 function prompt(type,key,extra={}){return {type,text:bindingKeyLabel(Bindings.read('interact')[0])+' · '+I18n.t(key),...extra};}
 const ringReceiver=()=>StoryRaidRules.recoilFree(flags)?'westheru':'reika';
 const nearReceiver=id=>level===ninjaCamp&&!!DungeonRun.campProvider(id);
 function turnInRing(){
  const receiver=ringReceiver(),westheru=receiver==='westheru';
  if(state!=='play'||!nearReceiver(receiver)||!rules.turnInRing(progress))return false;
  story('skyDragonRaid.name',westheru?'balloon.pilot':'ninjaClan.sentinel',westheru?'storyRaid.ring.westheru':'skyDragonRaid.reika',()=>{
   if(ringReceiver()!==receiver||!nearReceiver(receiver))return;
   const result=rules.turnInRing(progress);if(!result)return;
   progress=result.progress;flags[0].push(ringReward);progression.points+=result.points;
   awardXP(result.xp);persist();updateHUD();toast(I18n.format('skyDragonRaid.reward',[result.xp,result.points]));
  },{right:westheru?null:'reika',speaker:receiver});
  return true;
 }
 const canForge=()=>!!rules.forgeArmor(progress,FiaJourneyRules.quantity(fiaJourney));
 function forge(){
  if(state!=='campService'||!DungeonRun.campProvider('smith'))return false;
  const result=rules.forgeArmor(progress,FiaJourneyRules.quantity(fiaJourney));if(!result)return false;
  progress=result.progress;fiaJourney={...fiaJourney,dragonScales:result.ancientScales};persist();updateHUD();return true;
 }
 function toggleArmor(){
  if(state!=='inventory'&&(state!=='campService'||!DungeonRun.campProvider('smith')))return false;
  const next=rules.equipArmor(progress,!progress.armorEquipped);if(!next)return false;
  progress=next;persist();updateHUD();return true;
 }
 function getContext(){
  if(entrance())return prompt('skyRaidMenu','skyDragonRaid.enter');
  if(progress.victories>0&&!progress.ringTurnedIn){
   const receiver=ringReceiver();
   if(nearReceiver(receiver))return prompt('skyRaidRing',receiver==='westheru'?'storyRaid.ring.give':'skyDragonRaid.ring');
  }
  if(!active()||crash>0)return null;
  if(attempt.outcome==='failed')return prompt('skyRaidRetry','camp.master.retry');
  if(attempt.outcome==='cleared'&&attempt.phase==='rift'||pointNear(level.returnPoint||level.start,90,80))return prompt('skyRaidLeave','skyDragonRaid.return');
  if(attempt.phase!=='harbor')return null;
  if(attempt.outcome==='cleared'&&pointNear(level.boardPoint,120,100))return prompt('skyRaidBoard','skyDragonRaid.board');
  const index=level.ballistas.findIndex((point,i)=>attempt.ballistas[i]>0&&pointNear(point,100,90));
  return attempt.outcome===null&&index>=0?prompt('skyRaidBallista','skyDragonRaid.fire',{index}):null;
 }
 function anchorReached(id){
  if(!active()||id!==(level.boardingRing||level.headRing))return;
  attempt=rules.reachDragon(attempt);if(attempt.outcome==='cleared')finishPhase();
 }
 const anchors=list=>active()&&attempt.phase==='pursuit'&&attempt.waves===tuning.pursuitWaves?
  list.map(anchor=>anchor.id===level.boardingRing?{...anchor,disabled:false}:anchor):list;
 function update(dt){
  if(state!=='play'||!active())return;
  if(crash>0){
   player.vx=0;player.vy=0;crash=Math.max(0,crash-dt);
   if(crash===0)enter();return;
  }
  if(attempt.outcome!==null)return;
  flightTime+=dt;shotCooldown=Math.max(0,shotCooldown-dt);clock-=dt;
  reikaGuard=Math.max(0,reikaGuard-dt);volley=Math.max(0,volley-dt);
  if(attempt.phase==='harbor'&&clock<=0){
   while(!attempt.ballistas[target])target=(target+1)%tuning.ballistaCount;
   const impact=level.ballistas[target];
   attempt=rules.hitBallista(attempt,target);target=(target+1)%tuning.ballistaCount;
   if(attempt.outcome===null)while(!attempt.ballistas[target])target=(target+1)%tuning.ballistaCount;
   clock=5;burst(impact.x,impact.y-45,'#bc75ed',24);
   if(pointNear(impact,125,105))damage(2,Math.sign(player.x-impact.x)||1,false,false,'spell');
  }else if(attempt.phase==='pursuit'&&attempt.waves<tuning.pursuitWaves){
   if(enemies.every(e=>e.dead)){
    attempt=rules.finishWave(attempt,attempt.waves);volley=.5;
    if(attempt.waves<tuning.pursuitWaves)spawnWave();
   }
  }else if(attempt.phase==='back'){
   for(let i=0;i<tuning.backCultists;i++)if(enemies[i].dead)attempt=rules.defeatCultist(attempt,i);
   if(enemies[tuning.backCultists].dead){attempt=rules.defeatHeadGuard(attempt);if(attempt.outcome==='cleared')finishPhase();}
  }else if(attempt.phase==='rift'){
   attempt=rules.standOnPlatform(attempt,level.fracturePlatforms.indexOf(player.support));
   const before=attempt;
   attempt=rules.update(attempt,dt);
   if(before.warning&&!attempt.warning){const id=level.fracturePlatforms[before.warning.index];platforms.find(p=>p.id===id).broken=true;}
   if(attempt.outcome===null)riftAttack();
  }
 }
 function riftAttack(){
  if(clock>0)return;
  if(!cast){
   const kind=['lightning','wind','void'][pattern++%3],width=kind==='lightning'?135:kind==='wind'?410:230;
   cast={kind,x:player.x+player.w/2-width/2,y:player.y+player.h-155,w:width,h:190};
   clock=1.05;return;
  }
  const impact=cast;cast=null;clock=2.45;
  if(overlap(impact,player)){
   const dir=player.x+player.w/2<impact.x+impact.w/2?-1:1;
   if(impact.kind==='wind'){player.vx+=dir*340;player.vy=Math.min(player.vy,-170);}
   else damage(impact.kind==='void'?4:3,dir,false,false,'spell');
  }
  burst(impact.x+impact.w/2,impact.y+impact.h-25,impact.kind==='lightning'?'#a8e4ff':'#bc75ed',18);
 }
 function warnings(){
  if(!active()||attempt.outcome!==null)return;
  const fracture=attempt.warning&&platforms.find(p=>p.id===level.fracturePlatforms[attempt.warning.index]);
  const ballista=attempt.phase==='harbor'&&clock<1.1&&level.ballistas[target];
  const warning=cast||(attempt.phase==='back'&&enemies[tuning.backCultists]?.wardCast);
  if(!warning&&!fracture&&!ballista)return;
  ctx.save();ctx.lineWidth=3;
  if(warning){ctx.fillStyle='#bf74ff29';ctx.strokeStyle='#d5a1ff';ctx.fillRect(warning.x,warning.y,warning.w,warning.h);ctx.strokeRect(warning.x,warning.y,warning.w,warning.h);}
  if(fracture){ctx.fillStyle='#e997f780';ctx.fillRect(fracture.x,fracture.y-7,fracture.w,12);}
  if(ballista){ctx.fillStyle='#bf74ff45';ctx.fillRect(ballista.x-110,ballista.y-13,220,13);}
  ctx.restore();
 }
 function backdrop(){
  if(!active())return false;
  const image=Visuals.images[ART_SKY_RAID.backdrops[attempt.phase]];
  if(!image?.complete||!image.naturalWidth)return false;
  BackgroundFraming.cover(image);return true;
 }
 function character(definition,point,height){
  const image=Visuals.images[definition.image],frame=definition.frames[0];
  if(!image?.complete||!image.naturalWidth)return;
  const scale=height/frame.bodyHeight;
  ctx.drawImage(image,frame.x,frame.y,frame.w,frame.h,point.x+(frame.x-frame.anchorX)*scale,
   point.y+(frame.y-frame.anchorY)*scale,frame.w*scale,frame.h*scale);
 }
 function drawEnemy(enemy){
  if(enemy.raidWarden){
   const frame=enemy.wardCast?(enemy.wardCast.kind==='sweep'?2:3):enemy.wardRecover>0?4:0;
   FiaVoidArt.stamp(ART_NINJA_CLAN.ritualist,frame,enemy.x+enemy.w/2,enemy.y+enemy.h,enemy.h,enemy.face);
   if(warded()){
    ctx.save();ctx.strokeStyle='#d5a1ff';ctx.lineWidth=3;ctx.beginPath();
    ctx.ellipse(enemy.x+enemy.w/2,enemy.y+enemy.h/2,enemy.w*.62,enemy.h*.59,0,0,Math.PI*2);ctx.stroke();ctx.restore();
   }
   return true;
  }
  if(!enemy.raidHatchling)return false;
  const atlas=ART_SKY_RAID.hatchlings,image=Visuals.images[atlas.image];
  if(!image?.complete||!image.naturalWidth)return false;
  const frame=atlas.frames[enemy.raidMove==='windup'||enemy.raidMove==='recover'?2:enemy.raidMove==='dive'?3:
   reducedMotion.matches?0:Math.floor(enemy.animTime*7)%2];
  ctx.save();ctx.translate(enemy.x+enemy.w/2,enemy.y+enemy.h/2);ctx.scale(-enemy.face,1);
  ctx.drawImage(image,frame.x,frame.y,frame.w,frame.h,-83,-66,166,138);ctx.restore();return true;
 }
 function prop(id,point,origin,scale,dim=false){
  const atlas=ART_SKY_RAID.props,image=Visuals.images[atlas.image];
  if(!image?.complete||!image.naturalWidth)return;
  ctx.save();ctx.translate(point.x,point.y);ctx.scale(scale,scale);ctx.translate(-origin.x,-origin.y);
  ctx.beginPath();atlas[id].forEach(([x,y],index)=>ctx[index?'lineTo':'moveTo'](x,y));ctx.closePath();ctx.clip();
  if(dim)ctx.globalAlpha*=.34;
  ctx.drawImage(image,0,0);ctx.restore();
 }
 function harborDeck(){
  const deck=platforms[0],image=Visuals.images[ART_SKY_RAID.props.image];
  if(!image?.complete||!image.naturalWidth)return;
  for(let x=deck.x;x<deck.x+deck.w;x+=250){
   if(!visiblePoint({x:x+125,y:deck.y},400))continue;
   const width=Math.min(251,deck.x+deck.w-x);
   ctx.drawImage(image,1260,528,500,68,x,deck.y+12,width,75);
   ctx.drawImage(image,1260,466,500,37,x,deck.y,width,29);
  }
 }
 function scenery(){
  if(!active())return;
  const phase=attempt.phase,image=Visuals.images[ART_SKY_RAID.image];
  if(phase==='back'){
   const body=Visuals.images[ART_SKY_RAID.body],fall=crash>0?1-crash/crashDuration:0;
   if(body?.complete&&body.naturalWidth){
    ctx.save();if(reducedMotion.matches)ctx.globalAlpha*=1-fall;
    ctx.drawImage(body,0,240+(reducedMotion.matches?0:fall*fall*1000),level.width,1690);ctx.restore();
    for(const platform of platforms){
     if(!visiblePoint(platform,platform.w+110))continue;
     const {x,y,w,h}=platform;
     ctx.save();ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.lineTo(x+w-22,y+h+7);
     ctx.lineTo(x+w*.61,y+h+26);ctx.lineTo(x+w*.27,y+h+15);ctx.lineTo(x+19,y+h+4);ctx.closePath();ctx.clip();
     ctx.drawImage(body,640,540,510,137,x,y,w,h+26);ctx.fillStyle='#9ac2c1';ctx.fillRect(x,y,w,4);ctx.restore();
    }
   }
  }
  IslandsArt.anchors(anchors(level.grappleAnchors).filter(anchor=>!anchor.disabled));
  if(phase==='harbor'){
   harborDeck();level.ballistas.forEach((point,index)=>prop('ballista',point,{x:435,y:684},.28,attempt.ballistas[index]===0));
   if(attempt.outcome==='cleared')Visuals.campPathMarker(level.boardPoint,I18n.t('skyDragonRaid.board'));
  }
  if(phase==='pursuit'){
   prop('ship',{x:200,y:1060},{x:1090,y:481},1.58);
   character(ART_WATCHTOWER.pilot,level.helm,128);character(ART_WATCHTOWER.sentinel,level.reika,135);
   if(attempt.waves<tuning.pursuitWaves){
    const {x,y}=level.reika;
    HannahArt.nameplate(x,y,142,'ninjaClan.sentinel');
    ctx.save();ctx.fillStyle='#0a172bcc';ctx.fillRect(x-38,y-157,76,6);
    ctx.fillStyle='#90d9b2';ctx.fillRect(x-38,y-157,76*attempt.reikaHealth/tuning.reikaHealth,6);ctx.restore();
   }
   if(volley){
    const t=1-volley/.5,x=level.reika.x+(2200-level.reika.x)*t,y=level.reika.y-93+(660-level.reika.y+93)*t;
    ctx.save();ctx.strokeStyle='#fff1bc';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-48,y+20);ctx.lineTo(x,y);ctx.stroke();ctx.restore();
   }
  }
  if(!image?.complete||!image.naturalWidth)return;
  if(phase==='rift'){
   const frame=ART_SKY_RAID.frames[cast?5:4],w=frame.w*1.82,h=frame.h*1.82,{x,y}=level.dragonHead;
   ctx.save();ctx.translate(x,y);ctx.scale(-1,1);
   ctx.drawImage(image,frame.x,frame.y,frame.w,frame.h,-w*.82,-h*.91,w,h);ctx.restore();
  }else if(phase==='harbor'||phase==='pursuit'){
   const reduced=reducedMotion.matches;
   const index=shotCooldown>1?3:phase==='harbor'&&clock<.8?2:reduced?0:Math.floor(flightTime*4)%2;
   const frame=ART_SKY_RAID.frames[index];
   const x=phase==='pursuit'?2300:level.ballistas[target].x;
   ctx.drawImage(image,frame.x,frame.y,frame.w,frame.h,x-600,
    phase==='pursuit'?420:645+(!reduced?Math.sin(flightTime*2)*35:0),1200,600);
  }
 }
 function hit(box,amount){
  if(!active())return false;
  if(attempt.phase==='back'){
   const warden=enemies[tuning.backCultists];
   if(!warden||warden.dead||!overlap(box,warden))return false;
   if(!warded()&&!(warden.inv>0)){
    const before=warden.hp;warden.hp=Math.max(0,warden.hp-amount);warden.inv=.16;
    DevDamage.record('outgoing',warden,before,warden.hp);
    if(!warden.hp)killEnemy(warden);
   }else if(warded())burst(warden.x+warden.w/2,warden.y+60,'#d5a1ff',7);
   return true;
  }
  if(attempt.phase!=='rift')return false;
  const {x,y}=level.dragonHead;
  if(overlap(box,{x:x-110,y:y-145,w:220,h:145})){
   attempt=rules.hitDragon(attempt,amount,{withinReach:pointNear(level.dragonHead,220,180)});
   if(attempt.outcome==='cleared')finishPhase();
  }
  return true;
 }
 function objective(){
  if(!active())return null;
  const key=crash>0?'riftGoal':attempt.outcome==='failed'?'retry':attempt.outcome==='cleared'?(attempt.phase==='harbor'?'board':'return'):
   attempt.phase==='pursuit'&&attempt.waves===tuning.pursuitWaves?'grapple':attempt.phase+'Goal';
  return {compass:false,text:attempt.warning&&attempt.outcome===null?'skyDragonRaid.crack':'skyDragonRaid.'+key};
 }
 function hud(){
  if(!active())return false;
  const phase=attempt.phase,rift=phase==='rift'&&attempt.outcome===null;
  const warden=phase==='back'&&enemies[tuning.backCultists],inWardenArena=warden&&pointNear(level.headGuard,550,220);
  $('bossHud').hidden=attempt.outcome!==null||phase==='back'&&!inWardenArena;
  if(!$('bossHud').hidden){
   const [hp,max]=warden?[warden.hp,warden.maxHp]:rift?[attempt.hp,tuning.riftHealth]:phase==='harbor'?[tuning.harborShots-attempt.shots,tuning.harborShots]:[tuning.pursuitWaves-attempt.waves,tuning.pursuitWaves];
   $('bossName').textContent=I18n.t(warden?'skyDragonRaid.warden':'skyDragonRaid.name');$('bossHealth').style.width=100*hp/max+'%';
   const warning=$('campExecutionWarning');warning.hidden=!!warden;
   if(warden)return true;
   warning.textContent=rift?I18n.format('skyDragonRaid.timer',[Math.ceil(attempt.timeLeft)]):phase==='harbor'?
    I18n.format('skyDragonRaid.ballistas',[attempt.ballistas.filter(Boolean).length]):I18n.format('skyDragonRaid.hatchlings',[enemies.filter(e=>!e.dead).length,enemies.length]);
  }
  return true;
 }
 function health(){
  if(!active()||attempt.outcome!==null)return null;
  if(attempt.phase==='rift')return {hp:attempt.hp,maxHp:tuning.riftHealth};
  if(attempt.phase==='back')return enemies[tuning.backCultists];
  return null;
 }
 const stock=id=>id==='cloudDragonScale'?rules.cloudScales(progress):id==='cloudNinjaRing'?+(progress.victories>0&&!progress.ringTurnedIn):id==='cloudscaleArmor'?+progress.armorOwned:0;
 return Object.freeze({active,available,snapshot,restore,clear(){attempt=null;crash=0;},crashing:()=>active()&&crash>0,context:getContext,interact,retry,anchorReached,anchors,update,updateEnemy,drawEnemy,hit,objective,hud,warnings,backdrop,scenery,drawProp:prop,
  health,stock,canForge,forge,toggleArmor,get armorEquipped(){return progress.armorEquipped;}});
})();
