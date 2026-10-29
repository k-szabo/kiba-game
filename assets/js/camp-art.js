/* Camp art is a read-only view of quest and combat state. */
'use strict';
const CampArt=(()=>{
 const backgrounds={samuraiCamp:{image:'samuraiCampBackdrop',w:2172,h:724,ground:535},forgeInterior:{image:'forgeBackdrop',w:1536,h:1024,ground:800},herbalHut:{image:'herbalBackdrop',w:1536,h:1024,ground:800},mysticTent:{image:'mysticBackdrop',w:1536,h:1024,ground:800}};
 function stamp(art,x,feet,height,face=1){
  const img=Visuals.images[art?.image];if(!art||!img?.complete||!img.naturalWidth)return;
  const s=height/(art.bodyHeight||art.h);ctx.save();ctx.translate(x,feet);ctx.scale(face,1);
  ctx.drawImage(img,art.x,art.y,art.w,art.h,(art.x-art.anchorX)*s,(art.y-art.anchorY)*s,art.w*s,art.h*s);ctx.restore();
 }
 function dialogueActors(){return Object.fromEntries([...Object.keys(ART_CAMP).filter(id=>['smith','herbalist','enchanter','mayor'].includes(id)).map(id=>[id,{name:id==='mayor'?'camp.rescue.mayor':'camp.npc.'+id+'.name',image:ART_CAMP[id].image,rect:ART_CAMP[id]}]),['campMaster',{name:'camp.rescue.boss',image:ART_CAMP_MASTER.image,rect:ART_CAMP_MASTER.frames[0]}]]);}
 const panelCache=new Map();
 function panelImage(panel,index){
  if(panelCache.has(panel.image))return panelCache.get(panel.image);
  const image=Visuals.images[panel.image];if(!image?.complete||!image.naturalWidth)return null;
  const canvas=document.createElement('canvas');canvas.width=ART_SAMURAI_CAMP.w;canvas.height=ART_SAMURAI_CAMP.h;
  const paint=canvas.getContext('2d');paint.drawImage(image,0,0);paint.globalCompositeOperation='destination-in';
  const edge=Math.min(.04,ART_SAMURAI_CAMP.overlap/panel.w),gradient=paint.createLinearGradient(0,0,canvas.width,0);
  gradient.addColorStop(0,index===0?'#fff':'#fff0');gradient.addColorStop(edge,'#fff');
  // Only the incoming panel fades: two translucent edges would darken the overlap.
  gradient.addColorStop(1,'#fff');
  paint.fillStyle=gradient;paint.fillRect(0,0,canvas.width,canvas.height);BackgroundMotion.alias(canvas,image,{fade:index===0?0:edge});panelCache.set(panel.image,canvas);return canvas;
 }
 function backdrop(){
  if(level===samuraiCamp){
   ctx.save();ctx.fillStyle='#151e27';ctx.fillRect(0,0,viewW,H);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   // Distant scenery uses the whole native-height painting instead of enlarging
   // one tent over the full camera. Platforms remain in their world coordinates.
   const sourceOverlap=ART_SAMURAI_CAMP.overlap/ART_SAMURAI_CAMP.panels[0].w*ART_SAMURAI_CAMP.w,
    sourceWidth=ART_SAMURAI_CAMP.w*ART_SAMURAI_CAMP.panels.length-sourceOverlap*(ART_SAMURAI_CAMP.panels.length-1),
    scale=Math.max(H/ART_SAMURAI_CAMP.h,viewW/sourceWidth),width=ART_SAMURAI_CAMP.w*scale,
    overlap=ART_SAMURAI_CAMP.overlap/ART_SAMURAI_CAMP.panels[0].w*width,
    step=width-overlap,total=width+step*(ART_SAMURAI_CAMP.panels.length-1),
    scroll=clamp(camera*.4,0,Math.max(0,total-viewW));
   ART_SAMURAI_CAMP.panels.forEach((panel,index)=>{const image=panelImage(panel,index);if(!image)return;BackgroundMotion.draw(image,index*step-scroll,Math.min(0,H-ART_SAMURAI_CAMP.h*scale)*.35,width,ART_SAMURAI_CAMP.h*scale);});ctx.restore();return;
  }
  const a=backgrounds[level.id];if(!a)return;const img=Visuals.images[a.image];
  ctx.fillStyle='#0e202c';ctx.fillRect(0,0,viewW,H);if(!img?.complete||!img.naturalWidth)return;
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';BackgroundFraming.interior(img,{ground:a.ground});ctx.restore();
 }
 function terrain(platform){
  if(level!==samuraiCamp)return false;
  const art=ART_CAMP_TERRAIN,image=Visuals.images[art.image];if(!image?.complete||!image.naturalWidth)return false;
  const p=platform,ground=p.kind==='ground',rect=ground?art.middle:art.roof,s=ground?.9:.55,width=rect.w*s;
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.beginPath();ctx.rect(p.x,p.y-55,p.w,ground?p.h+55:125);ctx.clip();
  if(ground){const b=art.body,bw=b.w*s,bh=b.h*s;for(let y=p.y+160;y<p.y+p.h;y+=bh-1)for(let x=p.x;x<p.x+p.w;x+=bw-1)ctx.drawImage(image,b.x,b.y,b.w,b.h,x,y,bw,bh);}
  for(let x=p.x;x<p.x+p.w;x+=width-1)ctx.drawImage(image,rect.x,rect.y,rect.w,rect.h,x,p.y-(rect.surfaceY-rect.y)*s,width,rect.h*s);
  if(ground)for(const [cap,x]of [[art.left,p.x],[art.right,p.x+p.w-art.right.w*s]])ctx.drawImage(image,cap.x,cap.y,cap.w,cap.h,x,p.y-(cap.surfaceY-cap.y)*s,cap.w*s,cap.h*s);
  ctx.restore();return true;
 }
 function label(point,text,height=145){
  const textValue=I18n.t(text);ctx.save();ctx.font='600 15px "Kiba UI", "Kiba Story", sans-serif';ctx.textAlign='center';const w=ctx.measureText(textValue).width+22,y=point.y-height-22;
  ctx.fillStyle='#0d1b29ed';ctx.fillRect(point.x-w/2,y-20,w,30);ctx.fillStyle='#fff0cc';ctx.fillText(textValue,point.x,y);ctx.restore();
 }
 function questMarker(id,point,height){
  const marker=CampQuest.questMarker(id);if(!marker)return;
  const y=point.y-height-55;ctx.save();ctx.fillStyle='#0a1828f2';ctx.strokeStyle=marker==='?'?'#a9e5eb':'#ffe2a0';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(point.x,y-12,20,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.font='800 30px "Kiba UI", sans-serif';ctx.textAlign='center';ctx.fillStyle=marker==='?'?'#c0f6ff':'#ffe2a0';ctx.fillText(marker,point.x,y-1);ctx.restore();
 }
 function prop(name,point,height){stamp({image:'props',...ART_FRAMES.props[name]},point.x,point.y,height);}
 function scenery(){
  if(Prologue.active||state==='menu')return;
  if(level===levels[0]&&flags[0].includes('campQuestAccepted')&&defeated[0])Visuals.campPathMarker(level.samuraiCampEntrance,I18n.t('camp.rescue.name'));
  if(level===forestCamp){
   for(const entry of forestCamp.serviceEntrances)if(DevSession.active||sideLocationUnlocked(entry.id,flags,defeated))Visuals.campPathMarker(entry,I18n.t(entry.name));
   if(CampQuest.daisyPlaced()){
    const art=ART_INVENTORY.items.daisyPlush,point=forestCamp.daisy;
    stamp({...art,anchorX:art.x+art.w/2,anchorY:art.y+art.h,bodyHeight:art.h},point.x,point.y,point.height);
   }
   return;
  }
  if(level===samuraiCamp){
   Visuals.campPathMarker(level.returnPoint,I18n.t('camp.name'));
   for(const cage of level.cages)if(!flags[0].includes(cage.flag)){
    stamp(ART_CAMP[cage.id],cage.x,cage.y,90);prop('cage',cage,145);label(cage,cage.name,150);
   }
   if(!flags[0].includes('mayorExecuted')||CampQuest.execution?.stage<2)stamp(ART_CAMP.mayor,level.mayor.x,level.mayor.y,98);
  }else if(level.service){const id=level.service==='forge'?'smith':level.service==='herbal'?'herbalist':'enchanter';stamp(ART_CAMP[id],level.servicePoint.x,level.servicePoint.y,115);label(level.servicePoint,'camp.npc.'+id+'.name',130);questMarker(id,level.servicePoint,145);Visuals.campPathMarker(level.returnPoint,I18n.t('camp.name'));}
 }
 function actor(enemy){
  if(!CampMaster.is(enemy))return false;
  const frame=ART_CAMP_MASTER.frames[enemy.poseIndex]||ART_CAMP_MASTER.frames[0];
  stamp({...frame,image:frame.image||ART_CAMP_MASTER.image},enemy.x+enemy.w/2,enemy.y+enemy.h,enemy.h,enemy.face||1);
  if(enemy.phase==='windup'&&enemy.attackBox)BossCues.box(enemy.attackBox,'#f5cb83','#f5cb831c');
  for(const portal of enemy.summons||[])BossVFX.portal(portal.x,portal.y,100,clamp(1-portal.warning/portal.warningDuration,.3,1));
  if(enemy.phase==='strike'&&(enemy.move!=='jumpCut'||enemy.attackElapsed/enemy.attackDuration>=.9)){const progress=enemy.attackElapsed/Math.max(.01,enemy.attackDuration);BossVFX.slash('slashGold',enemy.x+enemy.w/2,enemy.y+enemy.h*.5,enemy.move==='lunge'?210:165,110,enemy.attackFace,enemy.move==='jumpCut'?clamp((progress-.9)/.1,0,1):Math.min(1,progress));}
  return true;
 }
 return Object.freeze({dialogueActors,backdrop,scenery,actor,questMarker,terrain});
})();
