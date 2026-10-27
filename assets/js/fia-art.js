/* All native Fia effects read simulation clocks; rendering never advances them. */
'use strict';
const FiaArt=(()=>{
 function effect(key,index,x,y,width,height=width,alpha=1){
  const definition=ART_FIA.effects[key],frame=definition.frames[index],image=Visuals.images[definition.image];if(!image?.complete||!image.naturalWidth)return;
  const sx=width/420,sy=height/420;ctx.save();ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(image,frame.x,frame.y,frame.w,frame.h,x-frame.w*sx/2,y-frame.h*sy/2,frame.w*sx,frame.h*sy);ctx.restore();
 }
 function actor(enemy){
  const boss=FiaCombat.is(enemy),resident=!!enemy.denResidentRole;if(!boss&&!resident)return false;if(enemy.dead)return true;
  if(resident){const art=ART_FIA[enemy.denResidentRole==='shadowNinja'?'ninja':'thief'],pose=enemy.windup>0?3:enemy.attackTime>0?4:enemy.recovery>0?5:Math.abs(enemy.walkSpeed)>1&&!reducedMotion.matches?1+Math.floor(enemy.animTime*8)%2:0;ArenaArt.stamp(art,pose,enemy.x+enemy.w/2,enemy.y+enemy.h,100,enemy.face);return true;}
  if(enemy.shieldRemaining>0)effect('shield',enemy.blockFlash>0?1:0,enemy.x+enemy.w/2,enemy.y+enemy.h*.5,170,185,.55);
  if(enemy.phase==='wait'&&Math.abs(enemy.walkSpeed)>1&&!reducedMotion.matches)ArenaArt.stamp(ART_ARENA.fiaWalk,Math.floor(enemy.animTime*8)%4,enemy.x+enemy.w/2,enemy.y+enemy.h,enemy.h,enemy.face);
  else ArenaArt.stamp(ART_ARENA.fia,enemy.poseIndex||0,enemy.x+enemy.w/2,enemy.y+enemy.h,enemy.h,enemy.face);
  if(enemy.phase==='windup'){
   for(const box of enemy.attackBoxes)BossCues.box(box,BossCues.color);
   if(!enemy.attackBoxes.length&&!enemy.hazards.length)BossVFX.marker(enemy.x+enemy.w/2,enemy.y+enemy.h*.4,100,BossCues.color);
   if(enemy.move==='teleport')effect('teleport',enemy.clock<enemy.phaseDuration*.5?1:0,enemy.x+enemy.w/2,enemy.y+enemy.h*.5,115,170,.7);
   if(enemy.move==='drain'||enemy.move==='charm')effect(enemy.move,0,enemy.x+enemy.w/2+enemy.attackFace*40,enemy.y+enemy.h*.4,95,95,.7);
  }
  for(const h of enemy.hazards){if(!h.active){BossCues.box(h,BossCues.color);BossVFX.marker(h.x+h.w/2,h.y+h.h,h.w,BossCues.color);}else effect('foxfire',2,h.x+h.w/2,h.y+h.h*.5,h.w,h.h,.85);}
  if(enemy.phase==='strike'&&enemy.move==='drain'){
   const x=enemy.x+enemy.w/2,y=enemy.y+enemy.h*.4,dx=enemy.targetX-x,dy=enemy.targetY-y;ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(dy,dx));effect('drain',enemy.attackElapsed<.1?1:2,Math.hypot(dx,dy)/2,0,Math.max(50,Math.hypot(dx,dy)),85,.85);ctx.restore();
  }
  if(enemy.phase==='recover'&&enemy.move==='drain')effect('drain',3,enemy.x+enemy.w/2,enemy.y+enemy.h*.4,120,75,.5);
  if(enemy.phase==='strike'&&enemy.move==='charm')effect('charm',1,enemy.targetX,enemy.targetY,160,150,.7);
  if(enemy.phase==='recover'&&enemy.move==='teleport'){
   if(enemy.teleportFrom)effect('teleport',2,enemy.teleportFrom.x,enemy.teleportFrom.y-65,120,160,.65);
   effect('teleport',3,enemy.x+enemy.w/2,enemy.y+enemy.h*.5,110,170,.65);
  }
  return true;
 }
 function projectile(p){
  if(p.fiaEffect!=='foxfire'&&p.fiaEffect!=='drain')return false;
  const d=ART_FIA.effects.foxfire,f=d.frames[(p.fiaLife-p.life)<.08?0:1],image=Visuals.images[d.image];if(!image?.complete||!image.naturalWidth)return true;
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.vy,p.vx));ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const scale=.19;ctx.drawImage(image,f.x,f.y,f.w,f.h,-510*scale,-370*scale,f.w*scale,f.h*scale);ctx.restore();return true;
 }
 function playerEffects(){
  if(FiaConflict.owned()){
   const index=FiaConflict.shield>0?(FiaConflict.shieldFlash>0?1:0):FiaConflict.shieldBreak>0?2:FiaConflict.recharge<=1?3:-1;
   if(index>=0)effect('shield',index,player.x+player.w/2,player.y+player.h*.45,130,145,reducedMotion.matches?.25:.45);
  }
  if(FiaCombat.status())effect('charm',FiaCombat.status().remaining<.25?3:2,player.x+player.w/2,player.y+player.h*.5,115,105,.4);
 }
 function particle(p){if(p.kind!=='fiaSpark')return false;effect('foxfire',p.life>.14?2:3,p.x,p.y,85,85,clamp(p.life/.14,0,1));return true;}
 return Object.freeze({actor,projectile,player:playerEffects,effect,particle});
})();
