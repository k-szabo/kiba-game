/* Render-only return journey art. World geometry and companion motion are owned elsewhere. */
'use strict';
const ZigguratDescentArt=(()=>{
 const active=()=>level===zigguratDepths||level===japanHeights;
 function backdrop(){
  if(!active())return false;
  const image=Visuals.images[level===zigguratDepths?'descentBackdrop':'japanHeightsBackdrop'];
  if(!image?.complete||!image.naturalWidth)return false;
  const s=Math.max(viewW/image.naturalWidth,H/image.naturalHeight),w=image.naturalWidth*s,h=image.naturalHeight*s;
  const x=-(w-viewW)*clamp(camera/Math.max(1,level.width-viewW),0,1);
  const y=-(h-H)*clamp(cameraY/Math.max(1,level.height-H),0,1);
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  BackgroundMotion.draw(image,x,y,w,h);ctx.restore();return true;
 }
 function scenery(){
  if(level===zigguratInterior&&ZigguratDescentRules.accepted(flags)){
   const p=level.descentEntrance;
   BossVFX.portal(p.x,p.y,165,.82);
   Visuals.campPathMarker(p,I18n.t(zigguratDepths.name));
   return;
  }
  if(!active())return;
  const p=level===zigguratDepths?level.portalPoint:level.returnPoint;
  const open=ZigguratDescentRules.gateCleared(flags);
  BossVFX.portal(p.x,p.y,190,open?1:.32);
 }
 function companion(){
  const body=ZigguratDescent.follower();if(!body)return false;
  const moving=Math.abs(body.vx)>2&&!reducedMotion.matches;
  const index=!body.onGround?4:moving?1+Math.floor(body.animationTime*6)%2:0;
  ArenaArt.stamp(ART_ZIGGURAT_DESCENT.haru,index,body.x+body.w/2,body.y+body.h,125,body.face);
  HannahArt.nameplate(body.x+body.w/2,body.y+body.h,125,'HARU');return true;
 }
 function actor(enemy){
  if(!GatekeeperCombat.is(enemy))return false;
  ArenaArt.stamp(ART_ZIGGURAT_DESCENT.gatekeeper,reducedMotion.matches&&enemy.phase==='wait'?0:enemy.poseIndex,enemy.x+enemy.w/2,enemy.y+enemy.h,enemy.h,enemy.face);return true;
 }
 function effects(enemy){
  if(!GatekeeperCombat.is(enemy)||enemy.dead||!enemy.active)return;
  if(enemy.phase==='windup'&&enemy.attackBox)BossCues.box(enemy.attackBox);
  for(const h of enemy.hazards||[]){if(h.life<=0)continue;if(!h.active)BossCues.box(h,BossCues.color,'#ba80e626');else BossVFX.eruption(h);}
 }
 return Object.freeze({backdrop,scenery,companion,actor,effects});
})();
