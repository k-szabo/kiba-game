/* Native dungeon rendering is read-only; gameplay owns clocks and collision. */
'use strict';
const DungeonArt=(()=>{
 const art=id=>id==='sectFall'?ART_CULT_DUNGEON:ART_DUNGEON;
 const roles={dungeonCaptain:'captain',dungeonNecromancer:'necromancer',dungeonCouncil:'council',cultTempleGuard:'templeGuard',woundedAngel:'woundedAngel',cultHighPriestess:'highPriestess'};
 function stamp(definition,index,x,feet,height,face=1){
  const frame=definition?.frames?.[index]||definition?.frames?.[0]||definition,image=Visuals.images[frame?.image||definition?.image];
  if(!frame||!image?.complete||!image.naturalWidth)return;
  const scale=height/frame.bodyHeight;ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.translate(x,feet);ctx.scale(face*(definition.facing||1),1);
  if(frame.outlines){ctx.beginPath();for(const outline of frame.outlines){outline.forEach(([px,py],i)=>ctx[i?'lineTo':'moveTo']((px-frame.anchorX)*scale,(py-frame.anchorY)*scale));ctx.closePath();}ctx.clip();}
  ctx.drawImage(image,frame.x,frame.y,frame.w,frame.h,(frame.x-frame.anchorX)*scale,(frame.y-frame.anchorY)*scale,frame.w*scale,frame.h*scale);ctx.restore();
 }
 function actors(){
  const out={};for(const [key,role]of Object.entries(roles)){
   const definition=art(DungeonCombat.profiles[key].dungeon)[role],frame=definition.frames[0],b=frame.visibleBounds;out[key]={name:DungeonCombat.profiles[key].name,image:definition.image,rect:{...frame,x:b[0],y:b[1],w:b[2]-b[0],h:b[3]-b[1]}};
  }
  out.ninjaClanRitualist={name:'ninjaClan.ritualist',image:'ninjaRitualist',rect:{x:153,y:22,w:282,h:445}};
  const sentinel=ART_WATCHTOWER.sentinel,frame=sentinel.frames[0],b=frame.visibleBounds;
  out.reika={name:'ninjaClan.sentinel',image:sentinel.image,rect:{x:b[0],y:b[1],w:b[2]-b[0],h:b[3]-b[1]}};
  return out;
 }
 const masks=new Map();
 function faded(image){
  if(masks.has(image))return masks.get(image);const surface=document.createElement('canvas');surface.width=image.naturalWidth;surface.height=image.naturalHeight;
  const paint=surface.getContext('2d');paint.drawImage(image,0,0);paint.globalCompositeOperation='destination-in';const fade=paint.createLinearGradient(0,0,surface.width,0);fade.addColorStop(0,'#fff0');fade.addColorStop(.06,'#fff');fade.addColorStop(1,'#fff');paint.fillStyle=fade;paint.fillRect(0,0,surface.width,surface.height);BackgroundMotion.alias(surface,image,{fade:.06});masks.set(image,surface);return surface;
 }
 function backdrop(){
  const panel=level.dungeon?.id==='ninjaClan'?level.dungeon.floor:level.id==='ninjaClanCamp'?3:-1;
  if(panel>=0){
   const image=Visuals.images.ninjaDungeonBackdrops;
   if(!image?.complete||!image.naturalWidth)return false;
   const width=Math.floor(image.naturalWidth/2),height=Math.floor(image.naturalHeight/2);
   const scale=Math.max(viewW/width,H/height),w=width*scale,h=height*scale;
   const pan=clamp(camera/Math.max(1,level.width-viewW),0,1);
   const drawPanel=source=>BackgroundMotion.draw(source,panel%2*width,Math.floor(panel/2)*height,width,height,-(w-viewW)*pan,-(h-H)*.35,w,h);
   drawPanel(image);
   if(panel===2){
    const closed=Visuals.images.ninjaRiftClosed;
    const ritualist=enemies.find(e=>e.miniboss==='ninjaClanRitualist'&&e.phase==='banish');
    const alpha=DungeonRun.cleared(2)?1:ritualist&&!reducedMotion.matches?clamp(1-ritualist.clock/ritualist.phaseDuration,0,1):0;
    if(alpha&&closed?.complete&&closed.naturalWidth){ctx.save();ctx.globalAlpha*=alpha;drawPanel(closed);ctx.restore();}
   }
   return true;
  }
  if(!DungeonRun.active())return false;const a=art(DungeonRun.dungeonId()).backdrops[DungeonRun.floor()],keys=a.panels||[a.image],images=keys.map(key=>Visuals.images[key]);if(images.some(image=>!image?.complete||!image.naturalWidth))return false;
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.fillStyle='#15121c';ctx.fillRect(0,0,viewW,H);
  if(a.panels){
   BackgroundFraming.panels(images,(image,index)=>index?faded(image):image,{overlap:(a.overlap||0)*a.w/a.h});
  }else{
   // A covered interior backdrop follows depth gently; jumps never expose another realm or empty sky.
   BackgroundFraming.cover(images[0],{vertical:clamp(cameraY/Math.max(1,level.height-H),0,1)});
  }ctx.restore();return true;
 }
 function scenery(){
  if(Prologue.active||state==='menu')return;
  if(level.id==='ninjaClanCamp'){
   const art={healer:ART_NINJA_CLAN.healer,smith:ART_NINJA_CLAN.smith,akash:ART_CAMP.akash};
   for(const {id} of level.npcs){
    const npc=DungeonRun.campNpc(id);if(!npc)continue;
    const {x,y,name}=npc;
    if(art[npc.service||id])stamp(art[npc.service||id],0,x,y,126);
    else if(id==='reika')FiaVoidArt.stamp(ART_WATCHTOWER.sentinel,0,x,y,150,-1);
    else if(id==='zen')FiaVoidArt.stamp(ART_PRISON.zen,0,x,y,113,1);
    else if(id==='westheru')FiaVoidArt.stamp(ART_WATCHTOWER.pilot,0,x,y,110,-1);
    HannahArt.nameplate(x,y,id==='reika'?150:126,name);
    if(id==='zen'&&PrisonQuest.ninjaSealReady())CampArt.questMarker('zen',npc,145);
   }
   return;
  }
  if(level===councilHall){stamp(ART_DUNGEON.props.scroll,0,level.memoryScroll.x,level.memoryScroll.y-8,75);BossVFX.marker(level.memoryScroll.x,level.memoryScroll.y-4,95,'#d9bd80');return;}
  if(level===stormIslands&&(DevSession.active||flags[0].includes('balloonVortexArrived')))BossVFX.portal(level.endPoint.x,level.endPoint.y,95,.75);
  if(!DungeonRun.active())return;
  const index=DungeonRun.floor(),boss=enemies.find(e=>DungeonCombat.is(e)&&!e.dead&&e.active);
  if(!boss)BossVFX.portal(level.returnPoint.x,level.returnPoint.y,70,.45);
  if(DungeonRun.cleared(index))BossVFX.portal(level.nextPoint.x,level.nextPoint.y,80,.55);
  if(index===2){const opened=DungeonRun.owns(DungeonRules.definitions[DungeonRun.dungeonId()].chest);stamp(ART_DUNGEON.props[opened?'openChest':'closedChest'],0,level.rewardChest.x,level.rewardChest.y,opened?112:91);}
  for(const portal of DungeonRun.pending){BossCues.box({x:portal.x-45,y:portal.y-12,w:90,h:12},BossCues.color);BossVFX.portal(portal.x,portal.y,95,.65);}
  if(boss)for(const x of [level.arena.x,level.arena.x+level.arena.w])BossVFX.portal(x,level.arena.y,70,.55);
 }
 function actor(enemy){
  if(!DungeonCombat.is(enemy))return false;if(enemy.dead)return true;
  const profile=DungeonCombat.profiles[enemy.miniboss];
  const definition=art(profile.dungeon)[roles[enemy.miniboss]],pose=reducedMotion.matches&&enemy.phase==='wait'?0:enemy.miniboss==='dungeonCaptain'&&enemy.move==='captainLeap'&&enemy.phase==='strike'?5:enemy.poseIndex||0;
  const x=enemy.x+enemy.w/2,feet=enemy.y+enemy.h;
  ctx.save();ctx.globalAlpha*=enemy.inv>0?.72:1;
  if(profile.encounter==='leader'){
   const infected=['transforming','infected'].includes(enemy.attempt?.phase);
   if(enemy.attempt?.phase==='transforming'){
    const offset=enemy.face*100;
    FiaVoidArt.stamp(ART_NINJA_CLAN.ritualist,3,x+offset,feet,175,-enemy.face);
   }
   if(infected){BossVFX.portal(x,feet,155,.66);ctx.filter='hue-rotate(240deg) saturate(1.35)';}
   IslandsArt.actor({...enemy,miniboss:'shadowNinjaLeader',active:false});
  }else if(profile.encounter==='sentinel'){
   const move=({ninjaSigils:'sigils',ninjaNinjutsu:'ninjutsu'})[enemy.move]||enemy.move;
   WatchtowerBalloonArt.actor({...enemy,miniboss:'watchtowerSentinel',move,phase:enemy.phase==='windup'?'wait':enemy.phase,hazards:[]});
  }else if(profile.encounter==='ritualist'){
   const banishing=enemy.phase==='banish',cast=['priestessBolts','ritualRift'].includes(enemy.move);
   const frame=banishing?5:cast&&['windup','strike'].includes(enemy.phase)?4:pose===4?0:pose;
   const progress=banishing?clamp(1-enemy.clock/enemy.phaseDuration,0,1):0;
   if(banishing)BossVFX.portal(x,feet,190*(1-progress),1-progress);
   ctx.globalAlpha*=1-progress;
   FiaVoidArt.stamp(ART_NINJA_CLAN.ritualist,frame,x,feet-progress*65,175,enemy.face);
  }
  else stamp(definition,pose,x,feet,enemy.h,enemy.face);
  ctx.restore();
  if(enemy.phase==='windup'){
   for(const box of enemy.attackBoxes)BossCues.box(box,BossCues.color);
   if(!enemy.attackBoxes.length&&!enemy.hazards.length&&!enemy.summons.length)BossVFX.marker(enemy.targetX,enemy.targetY,95,BossCues.color);
   for(const summon of enemy.summons)BossCues.box({x:summon.x-45,y:summon.y-12,w:90,h:12},BossCues.color);
  }
  for(const hazard of enemy.hazards){if(!hazard.active){BossCues.box(hazard,BossCues.color);BossVFX.marker(hazard.x+hazard.w/2,hazard.y+hazard.h,hazard.w,BossCues.color);}else{ctx.save();ctx.filter='hue-rotate(245deg) saturate(.75)';BossVFX.impact(hazard.x+hazard.w/2,hazard.y+hazard.h,hazard.w*1.15,hazard.h*1.1);ctx.restore();}}
  if(enemy.phase==='strike')for(const box of enemy.attackBoxes)BossVFX.slash(enemy.miniboss==='dungeonCaptain'?'slashGold':'slashShadow',box.x+box.w/2,box.y+box.h/2,box.w,box.h,box.face||enemy.attackFace,clamp(enemy.attackElapsed/enemy.attackDuration,0,1));
  return true;
 }
 return Object.freeze({actors,backdrop,scenery,actor});
})();
