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
  }return out;
 }
 const masks=new Map();
 function faded(image){
  if(masks.has(image))return masks.get(image);const surface=document.createElement('canvas');surface.width=image.naturalWidth;surface.height=image.naturalHeight;
  const paint=surface.getContext('2d');paint.drawImage(image,0,0);paint.globalCompositeOperation='destination-in';const fade=paint.createLinearGradient(0,0,surface.width,0);fade.addColorStop(0,'#fff0');fade.addColorStop(.06,'#fff');fade.addColorStop(1,'#fff');paint.fillStyle=fade;paint.fillRect(0,0,surface.width,surface.height);masks.set(image,surface);return surface;
 }
 function backdrop(){
  if(!DungeonRun.active())return false;const a=art(DungeonRun.dungeonId()).backdrops[DungeonRun.floor()],keys=a.panels||[a.image],images=keys.map(key=>Visuals.images[key]);if(images.some(image=>!image?.complete||!image.naturalWidth))return false;
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.fillStyle='#15121c';ctx.fillRect(0,0,viewW,H);
  if(a.panels){
   const overlap=a.overlap||0,units=a.w*(keys.length-overlap*(keys.length-1)),scale=Math.max(1,viewW/units,H/790),width=units*scale,scroll=clamp(camera/Math.max(1,level.width-viewW),0,1)*(width-viewW),top=Math.min(0,level.start.y-a.groundY*scale-cameraY);
   images.forEach((image,i)=>ctx.drawImage(i?faded(image):image,i*a.w*(1-overlap)*scale-scroll,top,a.w*scale,a.h*scale));
  }else{
   // A covered interior backdrop follows depth gently; jumps never expose another realm or empty sky.
   const scale=Math.max(viewW/a.w,(H+120)/a.h),w=a.w*scale,h=a.h*scale,x=-(w-viewW)*clamp(camera/Math.max(1,level.width-viewW),0,1),y=-(h-H)*clamp(cameraY/Math.max(1,level.height-H),0,1);
   ctx.drawImage(images[0],x,y,w,h);
  }ctx.restore();return true;
 }
 function scenery(){
  if(Prologue.active||state==='menu')return;
  if(level===councilHall){stamp(ART_DUNGEON.props.scroll,0,level.memoryScroll.x,level.memoryScroll.y-8,75);BossVFX.marker(level.memoryScroll.x,level.memoryScroll.y-4,95,'#d9bd80');return;}
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
  const definition=art(DungeonCombat.profiles[enemy.miniboss].dungeon)[roles[enemy.miniboss]],pose=reducedMotion.matches&&enemy.phase==='wait'?0:enemy.miniboss==='dungeonCaptain'&&enemy.move==='captainLeap'&&enemy.phase==='strike'?5:enemy.poseIndex||0;
  ctx.save();ctx.globalAlpha*=enemy.inv>0?.72:1;stamp(definition,pose,enemy.x+enemy.w/2,enemy.y+enemy.h,enemy.h,enemy.face);ctx.restore();
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
