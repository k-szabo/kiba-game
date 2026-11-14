/* World interaction and combat orchestration for the story raid. */
'use strict';
const StoryRaid=(()=>{
 const rules=StoryRaidRules,combat=StoryRaidCombat;
 function atlas(image,anchors,bodyHeight){
  return {image,frames:anchors.map(([feetX,feetY],index)=>{
   const x=index%3*512,y=Math.floor(index/3)*512;
   return {x,y,w:512,h:512,anchorX:x+feetX,anchorY:y+feetY,bodyHeight};
  })};
 }
 const actorArt={
  mistSentry:atlas('storyRaidMistSentry',[[270,486],[260,482],[267,482],[273,487],[254,486],[266,487]],460),
  signalKeeper:atlas('storyRaidSignalKeeper',[[268,481],[266,471],[269,472],[270,486],[268,486],[273,486]],463),
  thirdClanLeader:atlas('storyRaidClanLeader',[[270,479],[256,478],[266,478],[271,478],[251,478],[247,474]],451),
  siegeWarden:atlas('storyRaidSiegeWarden',[[233,446],[232,445],[232,445],[254,437],[226,437],[260,436]],355),
  kibaBinder:atlas('storyRaidKibaBinder',[[268,445],[259,441],[266,440],[257,458],[287,457],[260,457]],377),
  cultWarMarshal:atlas('storyRaidWarMarshal',[[247,462],[256,461],[254,461],[242,451],[229,447],[250,453]],376),
  riftSentinel:atlas('storyRaidRiftSentinel',[[268,413],[266,411],[264,412],[268,395],[239,393],[267,393]],251),
  sanctuaryCustodian:atlas('storyRaidCustodian',[[267,416],[255,415],[254,415],[265,416],[230,415],[258,416]],350),
  secondDemonLord:atlas('storyRaidMimicPhase2',[[273,470],[271,466],[278,470],[263,461],[270,455],[286,459]],442)
 };
 for(const [index,x,w] of [[3,0,476],[4,480,580],[5,1070,466]])Object.assign(actorArt.cultWarMarshal.frames[index],{x,w});
 const mimicGrips=[[357,297,.72],[368,240,.25],[371,210,.1],[425,145,-1.21],[409,172,-.04],[368,302,.9]];
 const mimicWeapons={
  katana:{image:'inventoryKatana',gripX:329,gripY:1190,length:1730,angle:-1.06},
  foxfireKatana:{image:'foxfireKatanaArt',gripX:1280,gripY:231,length:1630,angle:2.6},
  naginata:ART_LOADOUTS.naginata.prop,swordShield:ART_LOADOUTS.swordShield.prop
 };
 const backgrounds=['storyRaidCaveBackdrop','storyRaidTerraceBackdrop','storyRaidSanctuaryBackdrop'];
 const gateArt={image:'storyRaidGates',frames:[
  {x:110,y:30,w:530,h:815,anchorX:370,anchorY:835,bodyHeight:782},
  {x:654,y:30,w:1110,h:815,anchorX:1200,anchorY:829,bodyHeight:778}
 ]};
 const reikaBrace={image:'storyRaidReikaBrace',frames:[
  {x:330,y:0,w:890,h:1010,anchorX:782,anchorY:1000,bodyHeight:995}
 ]};
 const background=()=>active()?Visuals.images[backgrounds[level.storyRaidTier]]:null;
 let foe=null,rescueClock=null,replay=rules.freshReplay();
 const active=()=>Number.isInteger(level?.storyRaidTier)&&!Prologue.active;
 const cinematic=()=>active()&&rescueClock!==null;
 const locked=()=>active()&&(cinematic()||!!foe&&!foe.dead);
 const entered=()=>flags[0].includes(rules.started);
 const replaying=()=>replay.active;
 const pending=()=>replaying()?rules.encounters[replay.index]||null:rules.encounters[rules.checkpoint(flags)];
 const currentArena=()=>active()&&level.arenas.find(arena=>arena.encounter===pending());
 function reset(){
  foe=null;rescueClock=null;
 }
 function record(id,beforeSave){
  if(replaying()){
   if(rules.encounters[replay.index]?.clear!==id)return false;
   replay={active:replay.index+1<rules.encounters.length,index:replay.index+1};if(!replay.active)replay=rules.freshReplay();
   beforeSave?.();persist();updateHUD();return true;
  }
  const result=rules.advance(flags,id);
  if(!result)return false;
  flags[0]=result.japan;progression.points+=result.points;
  beforeSave?.();persist();updateHUD();return true;
 }
 function setCheckpoint(restId){
  const rest=level.rests.find(point=>point.id===restId);
  if(!rest)return;
  checkpoint={...rest};
  if(!visitedRests[realm].includes(restId))visitedRests[realm].push(restId);
 }
 function enter(map,resume=false){
  const arena=map.arenas.find(candidate=>candidate.encounter===pending());
  const point=resume?(arena?map.rests.find(r=>r.id===arena.restId):map.rests.at(-1)):null;
  return CampQuest.enter(map.id,{point,atShrine:!!point});
 }
 function resume(){
  const tier=pending()?.tier??storyRaidMaps.length-1;
  return enter(storyRaidMaps[tier],true);
 }
 const request=(type,key)=>({type,text:I18n.t(key)});
 function context(){
  if(Prologue.active)return null;
  if(cinematic())return null;
  if(level===thirdClanCave&&rules.available(flags)&&pointNear(level.haruTrail,100,90))return request('storyRaidEnter','storyRaid.enter');
  if(!active())return null;
  if(locked()){
   if(foe.siege&&!foe.siege.shot&&foe.shipTimer==null){
    const index=foe.arena.signals.findIndex((p,i)=>!(foe.siege.signals&(1<<i))&&pointNear(p,67,85));
    if(index>=0)return {...request('storyRaidBeacon','storyRaid.beacon'),index};
   }
   return null;
  }
  if(level.haru&&rules.next(flags)===rules.rescued&&pointNear(level.haru,95,85))return request('storyRaidFreeHaru','storyRaid.freeHaru');
  if(pointNear(level.exitPoint,90,85)&&!currentArena()){
   if(level.nextLocation)return {type:'storyRaidNext',text:I18n.format('ziggurat.enter',[I18n.t(SIDE_LOCATIONS[level.nextLocation].map.name)])};
   if(rules.recoilFree(flags))return request('storyRaidHeaven','storyRaid.heaven');
  }
  if(pointNear(level.returnPoint,90,85)){
   const destination=SIDE_LOCATIONS[level.returnDestination.location].map;
   return {type:'storyRaidReturn',text:I18n.format('ziggurat.return',[I18n.t(destination.name)])};
  }
  return null;
 }
 function interact(candidate){
  if(state!=='play'||!candidate?.type?.startsWith('storyRaid'))return false;
  const current=context();
  if(candidate.type!==current?.type)return false;
  switch(current.type){
   case 'storyRaidEnter':
    if(replaying())return resume();
    if(entered()&&rules.recoilFree(flags)&&rules.checkpoint(flags)===-1){replay={active:true,index:0};persist();return enter(storyRaidMaps[0]);}
    if(entered())return resume();
    story('storyRaid.name','ninjaClan.sentinel','storyRaid.intro',()=>{
     if(record(rules.started))enter(storyRaidMaps[0]);
    },{right:'reika',speaker:'reika'});return true;
   case 'storyRaidReturn':return CampQuest.leave();
   case 'storyRaidNext':return enter(SIDE_LOCATIONS[level.nextLocation].map);
   case 'storyRaidBeacon':
    foe.siege=rules.lightSignal(foe.siege,current.index);
    if(foe.siege.signals===7)foe.shipTimer=1.65;
    updateHUD();return true;
   case 'storyRaidFreeHaru':
    rescueClock=0;player.vx=0;player.vy=0;dash=0;attack=0;Grapple.cancel();projectiles=[];
    keys.clear();pressed.clear();updateHUD();return true;
   case 'storyRaidHeaven':
    if(!flags[0].includes(rules.crossed))return record(rules.crossed,()=>enterRealm(2,heaven.rests[0]));
    enterRealm(2,heaven.rests[0]);persist();return true;
   default:return false;
  }
 }
 function loadout(){
  const shield=FiaConflict.owned()?FiaConflict.profile():null;
  return rules.snapshotMimic({
   weapon:weaponStyle,stats:momoStats(),normal:playerAttackProfile('normal'),heavy:playerAttackProfile('heavy'),
   gear:{talisman:equippedTalisman,weaponRank:campServices.weaponRank,armorRank:campServices.armorRank,
    spellArmor:SkyDragonRaid.armorEquipped,shield:shield?.capacity??0,shieldRecharge:shield?.recharge??0},
   abilities:{jump:abilities[0],dash:abilities[1],grapple:Grapple.owned(),dawnblade:Dawnblade.owned()}
  });
 }
 function reduceMimicDamage(foe,amount,mirror){
  const direction=Math.sign(foe.x+foe.w/2-player.x-player.w/2);
  const guard=WeaponStyles.guard(mirror.weapon,amount,{face:foe.face,direction,grounded:true,
   attacking:!!foe.cast||foe.strikeTime>0,dashing:false,cooldown:foe.guardCooldown});
  foe.guardCooldown=guard.cooldown;
  const hit=Armor.playerDamage(guard.damage,mirror.stats.armor);
  const absorbed=Math.min(hit,foe.shieldRemaining);
  if(absorbed>0){
   foe.shieldRemaining-=absorbed;
   if(!foe.shieldRemaining)foe.shieldRecharge=mirror.gear.shieldRecharge;
   burst(foe.x+foe.w/2,foe.y+30,'#c3b6ea',8);
  }
  return hit-absorbed;
 }
 function resolveHit(box,amount){
  if(!locked()||cinematic())return false;
  const identity=foe.keeper?.marked;
  const target=combat.hitTarget(foe);
  if(!target||!overlap(box,target))return false;
  const before=foe.hp;
  if(combat.damage(foe,amount,{identity,reduce:(hit,mirror)=>reduceMimicDamage(foe,hit,mirror)})){
   DevDamage.record('outgoing',foe,before,foe.hp);
   burst(target.x+target.w/2,target.y+25,'#d4a8eb',12);
   if(foe.dead){
    const arena=foe.arena;
    projectiles=[];
    record(arena.encounter.clear,()=>setCheckpoint(currentArena()?.restId??arena.restId));
   }else updateHUD();
  }
  return true;
 }
 function update(dt){
  if(!active()||state!=='play')return;
  if(cinematic()){
   const previous=rules.rescueFrame(rescueClock);
   rescueClock+=dt;
   const frame=rules.rescueFrame(rescueClock),travel=reducedMotion.matches?Number(frame.crossing===1):frame.crossing;
   player.face=1;player.x=level.haru.x-154+travel*210;player.y=level.haru.y-player.h;
   player.vx=!reducedMotion.matches&&frame.crossing>0&&frame.crossing<1?150:0;
   if(previous.collapse===0&&frame.collapse>0)burst(level.haru.x-35,level.haru.y-18,'#b7a5ba',34);
   if(frame.finished){
    rescueClock=null;player.vx=0;
    story('storyRaid.name','ninjaClan.sentinel','storyRaid.rescue',()=>{
     if(record(rules.rescued))story('storyRaid.name','Haru','storyRaid.haru',null,{right:'haru',speaker:'haru'});
    },{right:'reika',speaker:'reika'});
   }
   return;
  }
  if(!locked()){
   const arena=currentArena();
   if(!arena||player.x+player.w/2<arena.triggerX||player.x>arena.x+arena.w)return;
   foe=combat.start(arena,arena.encounter.kind==='mimic'?loadout():null);
   setCheckpoint(arena.restId);persist();updateHUD();
  }
  const arena=foe.arena;
  player.x=clamp(player.x,arena.x+8,arena.x+arena.w-player.w-8);
  if(foe.shipTimer!=null){
   foe.shipTimer-=dt;
   if(foe.shipTimer<=0){
    foe.shipTimer=null;foe.siege=rules.fireWestheru(foe.siege);foe.hitFlash=.24;
    burst(foe.x+foe.w/2,foe.y+55,'#ecc27e',32);tone(130,.2,'triangle',.04);
   }
  }
  const cast=combat.tick(foe,dt,player);
  if(cast&&overlap(player,cast))damage(cast.damage,foe.face,!cast.spell,false,cast.spell?'spell':null);
 }
 function objective({remote=false}={}){
  if(active()&&DevSession.active&&!rules.available(flags))return {point:level.exitPoint,compass:false,text:'storyRaid.objective.guardian'};
  if(!rules.available(flags)||flags[0].includes(rules.crossed))return null;
  if(!active()){
   if(level===thirdClanCave)return {point:level.haruTrail,name:'storyRaid.name',text:'storyRaid.objective.enter'};
   return remote?{remote:true,compass:false,name:'storyRaid.name',text:'storyRaid.objective.enter'}:null;
  }
  const arena=currentArena();
  if(arena)return {point:arena.spawn,name:arena.encounter.name,
   text:locked()&&foe.keeper?.marked!=null?'storyRaid.objective.mark':'storyRaid.objective.guardian'};
  if(level.haru&&!rules.recoilFree(flags))return {point:level.haru,name:'Haru',text:'storyRaid.objective.haru'};
  return {point:level.exitPoint,name:level.nextLocation?SIDE_LOCATIONS[level.nextLocation].map.name:realms[2].name,
   text:level.nextLocation?'dungeon.next':'storyRaid.objective.heaven'};
 }
 function hud(){
  if(!active())return false;
  const showBoss=locked()&&!cinematic();
  $('bossHud').hidden=!showBoss;
  if(showBoss){
   const extra=foe.siege?' · '+I18n.format('storyRaid.beacons',[foe.arena.signals.filter((_,i)=>foe.siege.signals&(1<<i)).length]):'';
   $('bossName').textContent=I18n.t(foe.arena.encounter.name)+extra;
   $('bossHealth').style.width=100*foe.hp/foe.maxHp+'%';
  }
  return true;
 }
 function drawCues(){
  if(!active())return;
  if(locked()&&!cinematic()){
   const arena=foe.arena;
   if(foe.cast)BossCues.box(foe.cast,BossCues.color);
   drawEncounter(foe);
   if(foe.keeper){
    const x=arena.x+38;
    FiaVoidArt.stamp(ART_WATCHTOWER.sentinel,0,x,arena.y,120,1);
    if(foe.keeper.marked!==null){
     const point=arena.decoys[foe.keeper.marked];
     BossVFX.marker(point.x,point.y-foe.h-25,52,'#ffe1a2');
    }
   }
   if(foe.siege&&!foe.siege.shot){
    for(const [index,point] of arena.signals.entries()){
     drawShrine(point.x,point.y,realms[0],false);
     if(foe.siege.signals&(1<<index))BossVFX.marker(point.x,point.y-32,64,'#ffe1a2');
    }
    if(foe.shipTimer!=null){
     const {x,y}=arena.shipAnchor,offset=reducedMotion.matches?0:Math.max(0,(foe.shipTimer-.45)/1.2)*480;
     SkyDragonRaid.drawProp('ship',{x:x-offset-360,y},{x:1090,y:481},.62);
     SkyDragonRaid.drawProp('ballista',{x:x-offset-115,y:y+10},{x:435,y:684},.22);
     if(foe.shipTimer<.45){
      const progress=1-foe.shipTimer/.45;
      const boltX=x+(foe.x+foe.w/2-x)*progress,boltY=y-92+(foe.y+45-y+92)*progress;
      ctx.save();ctx.strokeStyle='#ffe0a9';ctx.lineWidth=5;ctx.beginPath();
      ctx.moveTo(boltX-36,boltY-8);ctx.lineTo(boltX,boltY);ctx.stroke();ctx.restore();
     }
    }
   }
  }
  if(level.haru&&rules.checkpoint(flags)===-1){
   const frame=cinematic()?rules.rescueFrame(rescueClock):null;
   const crossed=frame?(reducedMotion.matches?Number(frame.crossing===1):frame.crossing):
    rules.recoilFree(flags)||state==='dialog'?1:0;
   const x=level.haru.x-79+crossed*183;
   const gateX=level.haru.x-37;
   const raised=frame?(reducedMotion.matches?Number(frame.collapse<1):1-frame.collapse):0;
   if(frame||rules.recoilFree(flags)||state==='dialog'){
    FiaVoidArt.stamp(gateArt,0,gateX,level.haru.y-138*raised,193);
   }
   if(rules.recoilFree(flags))FiaVoidArt.stamp(gateArt,1,level.exitPoint.x,level.exitPoint.y,176);
   if(frame&&frame.collapse===0)FiaVoidArt.stamp(reikaBrace,0,gateX,level.haru.y,138);
   HannahArt.haru(x,level.haru.y,110,crossed>0?1:-1);
   if(!frame)HannahArt.nameplate(x,level.haru.y,110,'Haru');
  }
 }
 function drawEncounter(foe){
  const x=foe.x+foe.w/2,feet=foe.y+foe.h;
  const frame=foe.cast?(foe.raidBossId==='kibaBinder'?0:3):foe.strikeTime>0?4:foe.hitFlash>0?5:
   foe.walkSpeed&&!reducedMotion.matches?1+Math.floor(foe.animTime*7)%2:0;
  if(foe.mimic?.phase===1){
   const style=foe.mimic.loadout.weapon,move=foe.cast?.move??(foe.strikeTime>0?foe.lastMove:null);
   ctx.save();ctx.filter='brightness(.61) saturate(.8) hue-rotate(240deg)';
   if(move==='normal'||move==='heavy'){
    const profile=foe.mimic.loadout.attacks[move];
    const elapsed=foe.cast?profile.impact*clamp(1-foe.clock/foe.cast.windup,0,1):profile.impact+(.22-foe.strikeTime);
    Visuals.momoSlash(x,feet,170,elapsed/WeaponStyles.profile(style).tempo,foe.face,move,style);
   }else{
    if(style==='naginata')Visuals.momoCarry(x,feet,170,foe.face,style);
    drawMomo(x,feet,170,foe.walkSpeed?(foe.face>0?1:2):0,reducedMotion.matches?0:Math.floor(foe.animTime*8)%6,foe.face);
    if(style==='swordShield')Visuals.momoCarry(x,feet,170,foe.face,style);
   }
   ctx.restore();return;
  }
  const art=actorArt[foe.raidBossId];
  if(!art)return;
  if(foe.keeper){
   for(const [index,point] of foe.arena.decoys.entries()){
    ctx.save();ctx.globalAlpha=foe.keeper.marked===null||foe.keeper.marked===index?1:.48;
    FiaVoidArt.stamp(art,frame,point.x,point.y,Math.max(185,foe.h*1.35),foe.face);ctx.restore();
   }
  }else{
   if(foe.mimic)drawMimicWeapon(foe,x,feet,frame);
   if(foe.mimic)drawDistortedMimic(foe,art,frame,x,feet);
   else FiaVoidArt.stamp(art,frame,x,feet,Math.max(185,foe.h*1.35),foe.face);
   if(foe.mimic?.loadout.weapon==='swordShield'){
    ctx.save();ctx.filter='brightness(.75) hue-rotate(235deg)';
    Visuals.momoCarry(x,feet,190,foe.face,'swordShield');ctx.restore();
   }
  }
 }
 function drawDistortedMimic(foe,art,frame,x,feet){
  const pulse=foe.animTime%1.4;
  if(reducedMotion.matches||pulse>=.16){FiaVoidArt.stamp(art,frame,x,feet,190,foe.face);return;}
  const y=feet-155+Math.floor(pulse*25)*22;
  for(const [top,bottom,offset] of [[feet-175,y,0],[y,y+9,5],[y+9,feet+12,0]]){
   ctx.save();ctx.beginPath();ctx.rect(x-175,top,350,bottom-top);ctx.clip();
   FiaVoidArt.stamp(art,frame,x+offset*foe.face,feet,190,foe.face);ctx.restore();
  }
 }
 function drawMimicWeapon(foe,x,feet,frame){
  const style=foe.mimic.loadout.weapon,prop=mimicWeapons[style],image=Visuals.images[prop.image];
  if(!image?.complete||!image.naturalWidth)return;
  const pose=actorArt.secondDemonLord.frames[frame],[gx,gy,angle]=mimicGrips[frame];
  const body=190/pose.bodyHeight,scale=(style==='naginata'?222:126)/prop.length;
  ctx.save();ctx.filter='brightness(.73) hue-rotate(230deg)';ctx.translate(x,feet);ctx.scale(foe.face,1);
  ctx.translate((pose.x+gx-pose.anchorX)*body,(pose.y+gy-pose.anchorY)*body);
  ctx.rotate(angle-prop.angle);ctx.scale(scale,scale);ctx.drawImage(image,-prop.gripX,-prop.gripY);ctx.restore();
 }
 function backdrop(){
  const image=background();
  return !!image&&BackgroundFraming.cover(image,{ground:image.naturalHeight*.74,floor:level.start.y-cameraY,scaleFloor:0});
 }
 function restore(value){replay=rules.copyReplay(value,flags)||rules.freshReplay();}
 return Object.freeze({active,locked,cinematic,reset,context,interact,resolveHit,update,objective,hud,drawCues,backdrop,drawEncounter,loadout,reduceMimicDamage,restore,snapshot:()=>({...replay}),
  paintedFloor:()=>background()?.naturalWidth>0,get foe(){return foe;}});
})();
