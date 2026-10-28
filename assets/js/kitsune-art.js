/* Native kitsune/hunter art; all cinematic and combat clocks are owned elsewhere. */
'use strict';
const KitsuneArt=(()=>{
 const art=()=>typeof ART_KITSUNE==='undefined'?null:ART_KITSUNE;
 function stamp(definition,index,x,feet,height,face=1){
  const rect=definition?.frames?.[index]||definition?.frames?.[0],image=Visuals.images[definition?.image];
  if(!rect||!image?.complete||!image.naturalWidth)return;
  const s=height/rect.bodyHeight;ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.translate(x,feet);ctx.scale(face*(definition.facing||1),1);
  ctx.drawImage(image,rect.x,rect.y,rect.w,rect.h,(rect.x-rect.anchorX)*s,(rect.y-rect.anchorY)*s,rect.w*s,rect.h*s);ctx.restore();
 }
 function dialogueActors(){
  const a=art();if(!a)return {};
  const actors={fia:{name:'fia.name',definition:a.fia},shadowNinja:{name:'fia.ninja.name',definition:a.residents?.shadowNinja},shadowThief:{name:'fia.thief.name',definition:a.residents?.shadowThief}};
  return Object.fromEntries(Object.entries(actors).flatMap(([id,actor])=>{
   const frame=actor.definition?.frames?.[0];if(!frame)return [];
   const bounds=frame.visibleBounds,rect=bounds?{...frame,x:bounds[0],y:bounds[1],w:bounds[2]-bounds[0],h:bounds[3]-bounds[1]}:frame;
   return [[id,{name:actor.name,image:actor.definition.image,rect}]];
  }));
 }
 const masks=new Map();
 function panelSource(image,incoming){
  if(!incoming)return image;if(masks.has(image))return masks.get(image);
  const surface=document.createElement('canvas');surface.width=image.naturalWidth;surface.height=image.naturalHeight;
  const paint=surface.getContext('2d');paint.drawImage(image,0,0);paint.globalCompositeOperation='destination-in';
  const fade=paint.createLinearGradient(0,0,surface.width,0);fade.addColorStop(0,'#fff0');fade.addColorStop(.035,'#fff');fade.addColorStop(1,'#fff');paint.fillStyle=fade;paint.fillRect(0,0,surface.width,surface.height);BackgroundMotion.alias(surface,image,{fade:.035});masks.set(image,surface);return surface;
 }
 function backdrop(){
  const a=art()?.den;if(!a)return;
  const images=a.panels.map(key=>Visuals.images[key]);if(images.some(image=>!image?.complete||!image.naturalWidth))return;
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.fillStyle='#161120';ctx.fillRect(0,0,viewW,H);
  BackgroundFraming.panels(images,(image,index)=>panelSource(image,index>0),{overlap:(a.overlap??.06)*a.w/a.h});ctx.restore();
 }
 function depthsBackdrop(){
  const a=art()?.depths,image=Visuals.images[a?.image],alpha=clamp((cameraY-1300)/400,0,1);
  if(!alpha||!image?.complete||!image.naturalWidth)return;
  const groundY=a.groundY??790,floor=level.hunterArena.y-cameraY,s=Math.max(H/a.h,viewW/a.w,floor/groundY),w=a.w*s,height=a.h*s;
  ctx.save();ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const top=floor-groundY*s;
  BackgroundMotion.draw(image,(viewW-w)*clamp(camera/Math.max(1,level.width-viewW),0,1),top,w,height);ctx.restore();
 }
 function label(point,key,height){
  const text=I18n.t(key);ctx.save();ctx.font='600 16px "Kiba UI", sans-serif';ctx.textAlign='center';const w=ctx.measureText(text).width+24,y=point.y-height-25;
  ctx.fillStyle='#101524ed';ctx.fillRect(point.x-w/2,y-21,w,32);ctx.fillStyle='#fff0cc';ctx.fillText(text,point.x,y+1);ctx.restore();
 }
 function scenery(){
  if(Prologue.active||state==='menu')return;
  const a=art();
  if(level===shadowRealm&&defeated[3])Visuals.campPathMarker(level.denEntrance,I18n.t('fia.den.name'));
  if(KitsuneQuest.den()){
   for(const npc of level.npcs){
    if(!campNPCVisible(npc)||!visiblePoint(npc,210))continue;
    stamp(npc.id==='fia'?a?.fia:a?.residents?.[npc.id],0,npc.x,npc.y,npc.height);label(npc,npc.name,npc.height);CampArt.questMarker(npc.id,npc,npc.height);
   }
   Visuals.campPathMarker(level.returnPoint,I18n.t('shadow.name'));return;
  }
  if(!KitsuneQuest.prison())return;
  const departing=KitsuneQuest.departure;
  if(departing){
   const t=departing.elapsed;ctx.save();ctx.globalAlpha=clamp((3-t)/.35,0,1);
   if(reducedMotion.matches)stamp(a?.fox,0,departing.x,departing.y,53);
   else if(t<.85)stamp(a?.fia,Math.min(3,Math.floor(t/.22)),departing.x,departing.y,136);
   else stamp(a?.fox,1+Math.floor((t-.85)*7)%3,departing.x,departing.y,53);
   ctx.restore();return;
  }
  if(KitsuneQuest.missed()||KitsuneQuest.rescued()&&!KitsuneQuest.rescueScene)return;
  stamp(a?.fia,0,level.fia.x,level.fia.y,136);
  if(!KitsuneQuest.rescued()){
   const cage=ART_FRAMES.props.cage,image=Visuals.images.props;
   if(image?.complete&&image.naturalWidth){const height=190,s=height/cage.h;ctx.save();ctx.drawImage(image,cage.x,cage.y,cage.w,cage.h,level.fia.x-cage.w*s/2,level.fia.y-height,cage.w*s,height);ctx.restore();}
  }
  label(level.fia,'fia.name',195);
 }
 function actor(enemy){
  if(!PrisonHunter.is(enemy))return false;if(enemy.dead)return true;
  const definition=art()?.hunter,poses=[0,1,2,3,4,6,7,1];
  let index=reducedMotion.matches&&enemy.phase==='wait'?0:poses[enemy.poseIndex||0];
  if(enemy.phase==='windup'&&enemy.move==='bowVolley')index=enemy.windup>enemy.windupDuration*.55?5:6;
  ctx.save();ctx.globalAlpha=enemy.inv>0||enemy.stun>0?.7:1;stamp(definition,index,enemy.x+enemy.w/2,enemy.y+enemy.h,enemy.h,enemy.face);ctx.restore();
  const headroom=definition?.frames?.length?Math.max(...definition.frames.map(frame=>(frame.anchorY-(frame.visibleBounds?.[1]??frame.y))*enemy.h/frame.bodyHeight)):enemy.h;
  const x=enemy.x+enemy.w/2,top=enemy.y+enemy.h-headroom-61,text=I18n.t('fia.hunter.name');ctx.save();ctx.font='600 16px "Kiba UI", sans-serif';ctx.textAlign='center';const w=Math.max(220,ctx.measureText(text).width+24);
  ctx.fillStyle='#101524ed';ctx.fillRect(x-w/2,top,w,49);ctx.fillStyle='#fff0cc';ctx.fillText(text,x,top+19);ctx.fillStyle='#070d17';ctx.fillRect(x-w/2+8,top+30,w-16,9);ctx.fillStyle='#d4a06b';ctx.fillRect(x-w/2+8,top+30,(w-16)*clamp(enemy.hp/enemy.maxHp,0,1),9);ctx.restore();
  if(enemy.phase==='windup'){
   if(enemy.attackBox)BossCues.box(enemy.attackBox,BossCues.color);
   else BossVFX.marker(enemy.targetX,enemy.targetY+player.h/2,105,BossCues.color);
  }
  if(enemy.phase==='strike'&&enemy.move==='spearThrust')BossVFX.slash('slashGold',x+enemy.attackFace*125,enemy.y+enemy.h*.55,240,80,enemy.attackFace,clamp(enemy.attackElapsed/enemy.attackDuration,0,1));
  return true;
 }
 return Object.freeze({dialogueActors,backdrop,depthsBackdrop,scenery,actor});
})();
