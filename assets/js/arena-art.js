/* Native arena rendering reads encounter state; it never advances gameplay clocks. */
'use strict';
const ArenaArt=(()=>{
 const art=()=>ART_ARENA;
 function stamp(definition,index,x,feet,height,face=1){
  const frame=definition?.frames?.[index]||definition?.frames?.[0],image=Visuals.images[frame?.image||definition?.image];
  if(!frame||!image?.complete||!image.naturalWidth)return;
  const scale=height/frame.bodyHeight;ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.translate(x,feet);ctx.scale(face*(definition.facing||1),1);
  if(frame.outlines){ctx.beginPath();for(const outline of frame.outlines){outline.forEach(([px,py],i)=>ctx[i?'lineTo':'moveTo']((px-frame.anchorX)*scale,(py-frame.anchorY)*scale));ctx.closePath();}ctx.clip();}
  ctx.drawImage(image,frame.x,frame.y,frame.w,frame.h,(frame.x-frame.anchorX)*scale,(frame.y-frame.anchorY)*scale,frame.w*scale,frame.h*scale);ctx.restore();
 }
 function actors(){const definition=art().fia,frame=definition.frames[0],b=frame.visibleBounds;return {fiaCombat:{name:'fia.name',image:definition.image,rect:{...frame,x:b[0],y:b[1],w:b[2]-b[0],h:b[3]-b[1]}}};}
 const masks=new Map();
 function panel(image,incoming){
  if(!incoming)return image;if(masks.has(image))return masks.get(image);
  const surface=document.createElement('canvas');surface.width=image.naturalWidth;surface.height=image.naturalHeight;const paint=surface.getContext('2d');paint.drawImage(image,0,0);
  paint.globalCompositeOperation='destination-in';const fade=paint.createLinearGradient(0,0,surface.width,0);fade.addColorStop(0,'#fff0');fade.addColorStop(.06,'#fff');fade.addColorStop(1,'#fff');paint.fillStyle=fade;paint.fillRect(0,0,surface.width,surface.height);masks.set(image,surface);return surface;
 }
 function backdrop(){
  if(!ArenaChallenge.active()&&!ArenaChallenge.room())return false;
  const a=ArenaChallenge.active()?art().arena:art().chambers,keys=a.panels||[a.image],images=keys.map(key=>Visuals.images[key]);
  if(images.some(image=>!image?.complete||!image.naturalWidth))return false;
  const overlap=a.overlap||0,units=a.w*(keys.length-overlap*(keys.length-1)),scale=Math.max(1,viewW/units,H/790),width=units*scale,
   scroll=level.width>viewW?clamp(camera/(level.width-viewW),0,1)*(width-viewW):(width-viewW)/2,top=level.start.y-a.groundY*scale-cameraY;
  ctx.save();ctx.fillStyle='#100e1a';ctx.fillRect(0,0,viewW,H);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  images.forEach((image,i)=>ctx.drawImage(panel(image,i>0),i*a.w*(1-overlap)*scale-scroll,top,a.w*scale,a.h*scale));ctx.restore();return true;
 }
 function label(point,key,height){ctx.save();ctx.font='600 16px "Kiba UI", sans-serif';ctx.textAlign='center';const text=I18n.t(key),w=ctx.measureText(text).width+24,y=point.y-height-22;ctx.fillStyle='#101524ed';ctx.fillRect(point.x-w/2,y-22,w,32);ctx.fillStyle='#fff0cc';ctx.fillText(text,point.x,y);ctx.restore();}
 function portal(point,width=90){BossVFX.portal(point.x,point.y,width,.7);}
 function scenery(){
  if(Prologue.active||state==='menu')return;
  if(level===shadowDen){
   if(DevSession.active||sideLocationUnlocked('shadowArena',flags,defeated))Visuals.campPathMarker(level.arenaEntrance,I18n.t('arena.name'));
   if(DevSession.active||sideLocationUnlocked('fiaChambers',flags,defeated))Visuals.campPathMarker(level.chambersEntrance,I18n.t('arena.chambers.name'));return;
  }
  if(ArenaChallenge.room()){
   const npc=level.npcs[0];stamp(ART_KITSUNE.fia,0,npc.x,npc.y,npc.height);label(npc,npc.name,npc.height);portal(level.returnPoint);return;
  }
  if(!ArenaChallenge.active())return;
  if(!ArenaChallenge.running())portal(level.returnPoint);
  if(!ArenaChallenge.attempt&&!flags[3].includes('arenaChampion'))portal(level.challengePoint,110);
  for(const entry of ArenaChallenge.attempt?.pending||[]){BossCues.box({x:entry.x-45,y:entry.y-12,w:90,h:12},BossCues.color);BossVFX.portal(entry.x,entry.y,95,.85);}
  if(ArenaChallenge.running())for(const x of [level.arena.x,level.arena.x+level.arena.w])BossVFX.portal(x,level.arena.y,75,.75);
  const departure=ArenaChallenge.departure;if(departure){ctx.save();ctx.globalAlpha=clamp((2.4-departure.elapsed)/.5,0,1);stamp(art().fia,7,departure.x,departure.y,130);ctx.restore();}
 }
 function actor(enemy){
  if(!ArenaCombat.is(enemy)&&!enemy.arenaMinion)return false;if(enemy.dead)return true;
  const minion=enemy.arenaMinion,definition=minion?art().minions[enemy.arenaRole||'thief']:art()[({arenaCaptain:'captain',arenaSerpent:'serpent',arenaCyclops:'cyclops',arenaFia:'fia'})[enemy.miniboss]],
   index=minion?(enemy.windup>0?2:enemy.attackTime>0?3:Math.abs(enemy.walkSpeed)>1&&!reducedMotion.matches?Math.floor(enemy.animTime*4)%2:0):(reducedMotion.matches&&enemy.phase==='wait'?0:enemy.poseIndex||0);
  for(const part of minion?[enemy]:ArenaCombat.parts(enemy)){
   ctx.save();ctx.globalAlpha*=enemy.inv>0||enemy.stun>0?.72:1;
   if(enemy.miniboss==='arenaCyclops'&&part.index===1)ctx.filter='hue-rotate(140deg) saturate(.7)';
   stamp(definition,index,part.x+part.w/2,part.y+part.h,minion?100:enemy.h,part.face);ctx.restore();
  }
  if(minion){if(enemy.windup>0)BossVFX.marker(enemy.x+enemy.w/2,enemy.y+enemy.h,70,BossCues.color);return true;}
  if(enemy.phase==='windup'){
   for(const box of enemy.attackBoxes)BossCues.box(box,BossCues.color);
   if(!enemy.attackBoxes.length&&!enemy.hazards.length&&!enemy.summons.length)BossVFX.marker(enemy.targetX,enemy.targetY,95,BossCues.color);
   for(const summon of enemy.summons)BossCues.box({x:summon.x-45,y:summon.y-15,w:90,h:15},BossCues.color);
  }
  for(const hazard of enemy.hazards){
   if(!hazard.active){BossCues.box(hazard,BossCues.color);BossVFX.marker(hazard.x+hazard.w/2,hazard.y+hazard.h,hazard.w,BossCues.color);}
   else{ctx.save();ctx.filter='hue-rotate(245deg) saturate(.75)';BossVFX.impact(hazard.x+hazard.w/2,hazard.y+hazard.h,hazard.w*1.15,hazard.h*1.1);ctx.restore();}
  }
  if(enemy.phase==='strike'&&enemy.attackBoxes.length)for(const box of enemy.attackBoxes){
   const face=enemy.miniboss==='arenaCyclops'?enemy.parts[box.part].face:enemy.attackFace;BossVFX.slash('slashShadow',box.x+box.w/2,box.y+box.h/2,box.w,box.h,face,clamp(enemy.attackElapsed/enemy.attackDuration,0,1));
  }
  if(enemy.miniboss==='arenaFia'&&ArenaCombat.protects(enemy))BossVFX.portal(enemy.x+enemy.w/2,enemy.y+enemy.h*.9,130,.4);
  return true;
 }
 return Object.freeze({actors,backdrop,scenery,actor});
})();
