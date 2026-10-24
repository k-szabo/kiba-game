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
 function backdrop(){
  const a=backgrounds[level.id];if(!a)return;const img=Visuals.images[a.image],s=level.width/a.w,top=level.start.y-a.ground*s;
  ctx.fillStyle='#0e202c';ctx.fillRect(0,0,viewW,H);if(!img?.complete||!img.naturalWidth)return;
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(img,-camera,top-cameraY,level.width,a.h*s);ctx.restore();
 }
 function label(point,text,height=145){
  const textValue=I18n.t(text);ctx.save();ctx.font='600 15px "Kiba UI", "Kiba Story", sans-serif';ctx.textAlign='center';const w=ctx.measureText(textValue).width+22,y=point.y-height-22;
  ctx.fillStyle='#0d1b29ed';ctx.fillRect(point.x-w/2,y-20,w,30);ctx.fillStyle='#fff0cc';ctx.fillText(textValue,point.x,y);ctx.restore();
 }
 function prop(name,point,height){stamp({image:'props',...ART_FRAMES.props[name]},point.x,point.y,height);}
 function scenery(){
  if(Prologue.active||state==='menu')return;
  if(level===levels[0]&&flags[0].includes('campQuestAccepted')&&defeated[0])Visuals.campPathMarker(level.samuraiCampEntrance,I18n.t('camp.rescue.name'));
  if(level===forestCamp){for(const entry of forestCamp.serviceEntrances)if(DevSession.active||sideLocationUnlocked(entry.id,flags,defeated))Visuals.campPathMarker(entry,I18n.t(entry.name));return;}
  if(level===samuraiCamp){
   Visuals.campPathMarker(level.returnPoint,I18n.t('camp.name'));
   for(const cage of level.cages)if(!flags[0].includes(cage.flag)){
    stamp(ART_CAMP[cage.id],cage.x,cage.y,90);prop('cage',cage,145);label(cage,cage.name,150);
   }
   if(!flags[0].includes('mayorExecuted')||CampQuest.execution?.stage<2)stamp(ART_CAMP.mayor,level.mayor.x,level.mayor.y,98);
  }else if(level.service){const id=level.service==='forge'?'smith':level.service==='herbal'?'herbalist':'enchanter';stamp(ART_CAMP[id],level.servicePoint.x,level.servicePoint.y,115);label(level.servicePoint,'camp.npc.'+id+'.name',130);Visuals.campPathMarker(level.returnPoint,I18n.t('camp.name'));}
 }
 function actor(enemy){
  if(!CampMaster.is(enemy))return false;
  const frame=ART_CAMP_MASTER.frames[enemy.poseIndex]||ART_CAMP_MASTER.frames[0];
  stamp({...frame,image:ART_CAMP_MASTER.image},enemy.x+enemy.w/2,enemy.y+enemy.h,enemy.h,enemy.face||1);
  if(enemy.phase==='windup'&&enemy.attackBox){const b=enemy.attackBox;ctx.save();ctx.lineWidth=3;ctx.strokeStyle='#0d1b29';ctx.strokeRect(b.x,b.y,b.w,b.h);ctx.strokeStyle='#f5cb83';ctx.setLineDash([10,7]);ctx.strokeRect(b.x,b.y,b.w,b.h);ctx.restore();}
  if(enemy.phase==='strike')BossVFX.slash('slashGold',enemy.x+enemy.w/2,enemy.y+enemy.h*.5,enemy.move==='lunge'?210:165,110,enemy.attackFace,Math.min(1,enemy.attackElapsed/Math.max(.01,enemy.attackDuration)));
  return true;
 }
 return Object.freeze({dialogueActors,backdrop,scenery,actor});
})();
