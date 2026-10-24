/* Native prison sprites: state is read here, never advanced by rendering. */
'use strict';
const PrisonArt=(()=>{
 const art=()=>typeof ART_PRISON==='undefined'?null:ART_PRISON;
 function stamp(definition,index,x,feet,height,face=1){
  const rect=definition?.frames?.[index],image=Visuals.images[definition?.image];
  if(!rect||!image?.complete||!image.naturalWidth)return;
  const s=height/rect.bodyHeight;ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.translate(x,feet);ctx.scale(face*(definition.facing||1),1);
  ctx.drawImage(image,rect.x,rect.y,rect.w,rect.h,(rect.x-rect.anchorX)*s,(rect.y-rect.anchorY)*s,rect.w*s,rect.h*s);ctx.restore();
 }
 function portrait(definition){
  const frame=definition?.frames?.[0];if(!frame)return null;
  const b=frame.visibleBounds;
  return b?{...frame,x:b[0],y:b[1],w:b[2]-b[0],h:b[3]-b[1]}:frame;
 }
 function dialogueActors(){
  const a=art();if(!a)return {};
  return {zen:{name:'zen.name',image:a.zen.image,rect:portrait(a.zen)},prisonWarden:{name:'zen.warden.name',image:a.warden.image,rect:portrait(a.warden)}};
 }
 const masks=new Map();
 function backdrop(){
  const a=art(),panels=a?.backdrops;if(!panels?.length)return;
  const images=panels.map(key=>Visuals.images[key]);if(images.some(image=>!image?.complete||!image.naturalWidth))return;
  const heights=images.map(image=>image.naturalHeight),base=Math.max(...heights),widths=images.map(image=>image.naturalWidth/base),overlap=.07;
  const total=widths.reduce((sum,width)=>sum+width,0)-overlap*(images.length-1),height=Math.max(H,viewW/total),scroll=clamp(camera*.35,0,Math.max(0,total*height-viewW));
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.fillStyle='#161323';ctx.fillRect(0,0,viewW,H);
  let x=-scroll;
  for(let i=0;i<images.length;i++){
   const image=images[i];let source=image;
   if(i){
    if(!masks.has(image)){
     const surface=document.createElement('canvas');surface.width=image.naturalWidth;surface.height=image.naturalHeight;const paint=surface.getContext('2d');paint.drawImage(image,0,0);
     const fade=paint.createLinearGradient(0,0,surface.width,0);fade.addColorStop(0,'#fff0');fade.addColorStop(Math.min(.035,overlap/widths[i]),'#fff');fade.addColorStop(1,'#fff');
     paint.globalCompositeOperation='destination-in';paint.fillStyle=fade;paint.fillRect(0,0,surface.width,surface.height);masks.set(image,surface);
    }source=masks.get(image);
   }
   ctx.drawImage(source,x,(H-height)*.35,widths[i]*height,height);x+=(widths[i]-overlap)*height;
  }ctx.restore();
 }
 function zen(point,height=103){
  const pose=reducedMotion.matches?0:Math.floor(levelTime*.55)%4;stamp(art()?.zen,pose,point.x,point.y,height);
 }
 function scenery(){
  if(!PrisonQuest.active())return;
  if(!PrisonQuest.rescued()){
   zen(level.zen);const cage=ART_FRAMES.props.cage,image=Visuals.images.props;
   if(image?.complete&&image.naturalWidth){const height=155,s=height/cage.h;ctx.save();ctx.drawImage(image,cage.x,cage.y,cage.w,cage.h,level.zen.x-cage.w*s/2,level.zen.y-height,cage.w*s,height);ctx.restore();}
  }
  BossVFX.portal(level.returnPoint.x,level.returnPoint.y,95,.65);
 }
 function actor(enemy){
  const warden=PrisonWarden.is(enemy);if(!warden&&!enemy.undead)return false;
  if(enemy.dead)return true;
  const definition=warden?art()?.warden:art()?.undead;
  const index=warden?(reducedMotion.matches&&enemy.phase==='wait'?0:enemy.poseIndex||0):enemy.windup>0?2:enemy.attackTime>0?3:Math.abs(enemy.walkSpeed)>1&&!reducedMotion.matches?Math.floor(enemy.animTime*4)%2:0;
  ctx.save();ctx.globalAlpha*=enemy.inv>0||enemy.stun>0?.7:1;stamp(definition,index,enemy.x+enemy.w/2,enemy.y+enemy.h,warden?enemy.h:94,enemy.face);ctx.restore();
  if(!warden){
   if(enemy.windup>0)BossVFX.marker(enemy.x+enemy.w/2,enemy.y+enemy.h,60,BossCues.color);
   if(enemy.hp<enemy.maxHp){ctx.save();ctx.fillStyle='#0a172bcc';ctx.fillRect(enemy.x+enemy.w/2-19,enemy.y+enemy.h-108,38,4);ctx.fillStyle='#d99583';ctx.fillRect(enemy.x+enemy.w/2-19,enemy.y+enemy.h-108,38*clamp(enemy.hp/enemy.maxHp,0,1),4);ctx.restore();}
   return true;
  }
  const headroom=definition?.frames?.length?Math.max(...definition.frames.map(frame=>(frame.anchorY-(frame.visibleBounds?.[1]??frame.y))*enemy.h/frame.bodyHeight)):enemy.h,
   x=enemy.x+enemy.w/2,top=enemy.y+enemy.h-headroom-62,label=I18n.t('zen.warden.name');ctx.save();ctx.font='600 15px "Kiba UI", sans-serif';ctx.textAlign='center';const width=Math.max(220,ctx.measureText(label).width+24);
  ctx.fillStyle='#101725ed';ctx.fillRect(x-width/2,top,width,49);ctx.fillStyle='#fff0c4';ctx.fillText(label,x,top+19);ctx.fillStyle='#070d17';ctx.fillRect(x-width/2+8,top+30,width-16,9);ctx.fillStyle='#cea5ef';ctx.fillRect(x-width/2+8,top+30,(width-16)*clamp(enemy.hp/enemy.maxHp,0,1),9);ctx.restore();
  if(enemy.phase==='windup'&&enemy.attackBox)BossCues.box(enemy.attackBox,BossCues.color);
  for(const hazard of enemy.hazards){
   if(!hazard.active){BossCues.box(hazard,BossCues.color);BossVFX.marker(hazard.x+hazard.w/2,hazard.y+hazard.h,hazard.w,BossCues.color);}
   else{ctx.save();ctx.filter='hue-rotate(250deg) saturate(.65)';BossVFX.impact(hazard.x+hazard.w/2,hazard.y+hazard.h,hazard.w*1.1,hazard.h*1.1);ctx.restore();}
  }
  if(enemy.phase==='strike'&&enemy.move==='chainSweep')BossVFX.slash('slashShadow',x+enemy.attackFace*90,enemy.y+enemy.h*.5,270,140,enemy.attackFace,clamp(enemy.attackElapsed/enemy.attackDuration,0,1));
  return true;
 }
 return Object.freeze({dialogueActors,backdrop,zen,scenery,actor});
})();
