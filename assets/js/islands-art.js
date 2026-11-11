/* World-space scenery/ropes and native alpha atlases; rendering advances no clocks. */
'use strict';
const IslandsArt=(()=>{
 const definitions=()=>typeof ART_SHADOW_NINJAS==='undefined'?{}:ART_SHADOW_NINJAS;
 const leaderHeight=180,blended=new WeakMap();
 function panel(image){
  let surface=blended.get(image);if(surface)return surface;
  surface=BackgroundMotion.masked(image,{left:.14,right:.14,top:.08,bottom:.1});blended.set(image,surface);return surface;
 }
 function backdrop(){
  if(!FloatingIslands.active())return false;
  const image=Visuals.images.islandsRouteBackdrop;if(!image?.naturalWidth)return false;
  BackgroundFraming.cover(image,{vertical:.4});
  // Native-density feathered panels blend all four edges into the cloud layer.
  // Keep their original world projection: architecture stays on its island and
  // painted floors never bridge a collision gap. The motion alias shares masks.
  for(const [id,key]of [['floating-island-0','islandsArrivalBackdrop'],['floating-island-3','islandsWatchtowerBackdrop']]){
   const island=platforms.find(p=>p.id===id&&!p.broken),art=Visuals.images[key];
   if(!island||!art?.naturalWidth)continue;
   const x=island.x-camera,left=Math.max(0,x),right=Math.min(viewW,x+island.w);if(right<=left)continue;
   const height=art.naturalHeight*island.w/art.naturalWidth,y=island.y-cameraY-height*.8;
   BackgroundMotion.draw(panel(art),x,y,island.w,height);
  }
  return true;
 }
 function stamp(key,index,x,feet,height,face){const def=definitions()[key];if(!def)return false;FiaVoidArt.stamp(def,index,x,feet,height,face);return true;}
 function actor(e){
  const leader=FloatingIslands.is(e),role=leader?'leader':e.shadowNinjaRole;if(!role)return false;
  const index=leader?(reducedMotion.matches&&e.phase==='wait'?0:e.poseIndex):e.windup>0?3:e.attackTime>0?4:e.recovery>0?5:Math.abs(e.walkSpeed)>1&&!reducedMotion.matches?1+Math.floor(e.animTime*7)%2:0;
  if(!stamp(role,index,e.x+e.w/2,e.y+e.h,leader?leaderHeight:e.h,e.face))return false;
  if(!leader){Visuals.healthBar(e);if(e.windup>0)BossCues.box(enemyRole(e)==='guard'?enemyMeleeBox(e):{x:e.targetX-45,y:e.targetY-45,w:90,h:90});}
  else if(e.active&&e.phase==='windup')BossCues.box(e.attackBox||{x:e.targetX-45,y:e.targetY-45,w:90,h:90});
  return true;
 }
 function hook(point,size=42){
  const item=ART_INVENTORY.items.grapplingHook,img=Visuals.images[item?.image];if(!item||!img?.naturalWidth)return;
  const s=size/Math.max(item.w,item.h);ctx.drawImage(img,item.x,item.y,item.w,item.h,point.x-item.w*s/2,point.y-item.h*s/2,item.w*s,item.h*s);
 }
 function scenery(){
  if(level===japanHeights&&FloatingIslandsRules.eligible(flags))Visuals.campPathMarker(level.islandsEntrance,I18n.t('islands.name'));
  if(!FloatingIslands.active())return;
  const departure=FloatingIslands.departure();
  if(departure){
   const e=departure.actor,t=Math.max(0,(departure.elapsed-.3)/1.1),x=e.x+e.w/2+t*650,y=e.y+e.h-Math.sin(t*Math.PI)*110;
   stamp('leader',departure.elapsed<.3?6:7,x,y,leaderHeight,1);
   const h=departure.haru;if(h){const hx=h.x+h.w/2+(x-h.x-h.w/2)*Math.min(1,t*1.5),hy=h.y+h.h-Math.sin(t*Math.PI)*75;ArenaArt.stamp(ART_ZIGGURAT_DESCENT.haru,t>0?4:0,hx,hy,125,1);ctx.save();ctx.strokeStyle='#c9b384';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y-e.h*.55);ctx.lineTo(hx,hy-60);ctx.stroke();ctx.restore();}
  }
  anchors();
  if(FloatingIslandsRules.abducted(flags)&&!Grapple.owned())hook({x:level.hookPoint.x,y:level.hookPoint.y-25},52);
  if(!FloatingIslands.locked())Visuals.campPathMarker(level.returnPoint,I18n.t('descent.heights'));
 }
 function anchors(){
  const selected=Grapple.selection();
  for(const anchor of level.grappleAnchors){
   const x=anchor.x+anchor.w/2,y=anchor.y+anchor.h/2,focus=selected?.id===anchor.id;
   ctx.save();ctx.strokeStyle='#49392b';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x,y+16);ctx.lineTo(x,anchor.y+96);ctx.stroke();
   ctx.fillStyle='#8d7b5b';ctx.fillRect(x-14,anchor.y+86,28,18);ctx.strokeStyle=focus?'#fff0a8':'#ccac65';ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,13,0,Math.PI*2);ctx.stroke();
   if(focus){ctx.strokeStyle='#fff5c4';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,24,0,Math.PI*2);ctx.stroke();}ctx.restore();
  }
 }
 function companion(){const e=FloatingIslands.follower();if(!e)return;const index=!e.onGround?4:Math.abs(e.vx)>2&&!reducedMotion.matches?1+Math.floor(e.animationTime*6)%2:0;ArenaArt.stamp(ART_ZIGGURAT_DESCENT.haru,index,e.x+e.w/2,e.y+e.h,125,e.face);HannahArt.nameplate(e.x+e.w/2,e.y+e.h,125,'HARU');}
 function playerOverlay(){
  const pull=Grapple.snapshot();if(!pull)return false;
  const x=player.x+player.w/2,y=player.y+player.h*.4;
  ctx.save();ctx.strokeStyle='#33281f';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(pull.point.x,pull.point.y);ctx.stroke();ctx.strokeStyle='#ddc69c';ctx.lineWidth=2;ctx.stroke();ctx.restore();hook(pull.point,30);
  return pull.type==='anchor'&&stamp('momoHook',reducedMotion.matches?2:pull.pose,player.x+player.w/2,player.y+player.h,100,player.face);
 }
 function projectile(p){
  if(p.islandEffect!=='hook')return false;const e=enemies.find(e=>e.id===p.ownerId&&!e.dead);
  if(e){ctx.save();ctx.strokeStyle='#c9b384';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(e.x+e.w/2,e.y+e.h*.4);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.restore();}
  hook(p,32);return true;
 }
 return Object.freeze({backdrop,actor,scenery,anchors,companion,player:playerOverlay,projectile,leaderHeight});
})();
