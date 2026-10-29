/* Painted ziggurat, final encounter and ultimate; drawing never advances clocks. */
'use strict';
const HannahArt=(()=>{
 function stamp(definition,index,x,feet,height,face=1,alpha=1){ctx.save();ctx.globalAlpha*=alpha;ArenaArt.stamp(definition,index,x,feet,height,face);ctx.restore();}
 function prop(key,x,feet,height,face=1){
  const image=Visuals.images[key];if(!image?.complete||!image.naturalWidth)return false;
  const s=height/image.naturalHeight;ctx.save();ctx.translate(x,feet);ctx.scale(face,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(image,0,0,image.naturalWidth,image.naturalHeight,-image.naturalWidth*s/2,-height,image.naturalWidth*s,height);ctx.restore();return true;
 }
 function haru(x,feet,height=125,face=1){return prop('haruElder',x,feet,height,face);}
 function nameplate(x,feet,height,key){
  ctx.save();ctx.font='600 16px "Kiba UI", "Kiba Story", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  const label=I18n.t(key),width=ctx.measureText(label).width+24,bottom=feet-height-16;
  ctx.fillStyle='#12101cf0';ctx.fillRect(x-width/2,bottom-28,width,28);
  ctx.fillStyle='#fff0cf';ctx.fillText(label,x,bottom-14);ctx.restore();
 }
 function backdrop(){
  if(!HannahEncounter.active())return false;
  const v=HannahEncounter.visual(),key=level.ziggurat==='approach'?'zigguratApproach':level.ziggurat==='interior'?'zigguratInterior':'zigguratThrone';
  const base=Visuals.images[key],storm=Visuals.images.zigguratStorm;
  if(!base?.complete||!base.naturalWidth)return false;
  ctx.save();ctx.fillStyle='#110e1c';ctx.fillRect(0,0,viewW,H);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  function paint(image,alpha=1){
   const tall=level.ziggurat==='interior',s=Math.max(viewW/image.naturalWidth,H/image.naturalHeight),w=image.naturalWidth*s,h=image.naturalHeight*s;
   const pan=clamp(camera/Math.max(1,level.width-viewW),0,1),x=-(w-viewW)*pan;
   const ground=level===zigguratSummit?1400-v.lift:1000;
   const y=tall?-(h-H)*clamp(cameraY/Math.max(1,level.height-H),0,1):clamp(ground-cameraY-image.naturalHeight*(level===zigguratSummit?.64:.78)*s,H-h,0);
   ctx.save();ctx.globalAlpha*=alpha;BackgroundMotion.draw(image,x,y,w,h);ctx.restore();
  }
  paint(base);if(level===zigguratSummit&&v.storm&&storm?.complete&&storm.naturalWidth)paint(storm,v.transform||1);
  ctx.restore();return true;
 }
 function pose(e){
  if(e.mode==='transform')return {definition:ART_HANNAH.ritual,index:1};
  if(e.mode==='drain')return {definition:ART_HANNAH.ritual,index:2};
  if(e.mode==='finisher')return {definition:ART_HANNAH.ritual,index:3};
  if(e.phase==='windup')return {definition:['summon','riftBurst'].includes(e.move)?ART_HANNAH.ritual:e.move==='jump'?ART_HANNAH.jump:ART_HANNAH.combo,index:['summon','riftBurst'].includes(e.move)?2:e.move==='jump'?0:1};
  if(e.phase==='strike')return {definition:e.move==='jump'?ART_HANNAH.jump:['summon','riftBurst'].includes(e.move)?ART_HANNAH.ritual:ART_HANNAH.combo,index:['summon','riftBurst'].includes(e.move)?2:Math.min(5,Math.floor(e.attackElapsed/Math.max(.001,e.attackDuration)*6))};
  if(e.phase==='recover')return {definition:ART_HANNAH.combo,index:5};
  if(Math.abs(e.walkSpeed)>1&&!reducedMotion.matches)return {definition:ART_HANNAH.walk,index:Math.floor(e.animTime*10)%6};
  return {definition:ART_HANNAH.ritual,index:0};
 }
 function actor(e){
  if(!HannahCombat.is(e))return false;if(e.dead)return true;
  const p=pose(e);ctx.save();if(e.stage===2)ctx.filter='drop-shadow(0px 0px 7px #8e42c7)';
  stamp(p.definition,p.index,e.x+e.w/2,e.y+e.h,e.h,e.face,e.inv>0?.82:1);ctx.restore();
  for(const echo of e.echoQueue){
   if(!echo.started){for(const box of echo.attackBoxes)BossCues.box(box,BossCues.color);continue;}
   for(const part of echo.parts){ctx.save();ctx.filter='hue-rotate(250deg) saturate(.8)';stamp(ART_HANNAH.combo,Math.min(5,Math.floor(echo.elapsed/echo.snapshot.duration*6)),part.x+part.w/2,part.y+part.h,e.h,part.face||echo.snapshot.face,.4);ctx.restore();}
  }
  for(const hazard of [...(e.hazards||[]),...e.echoQueue.flatMap(echo=>echo.hazards||[])]){
   if(hazard.active)BossVFX.impact(hazard.x+hazard.w/2,hazard.y+hazard.h,hazard.w*1.2,hazard.h*1.1);
   else BossCues.box(hazard,BossCues.color);
  }
  if(e.phase==='windup')for(const box of e.attackBoxes)BossCues.box(box,BossCues.color);
  for(const point of e.summons)BossCues.box({x:point.x-48,y:point.y-16,w:96,h:16},BossCues.color);
  if(e.phase==='strike'&&e.move!=='summon'){
   const frame=Math.min(1,e.attackElapsed/Math.max(.001,e.attackDuration));
   BossVFX.slash(e.stage===2?'slashShadow':'slashFire',e.x+e.w/2+e.attackFace*110,e.y+e.h*.5,300,200,e.attackFace,frame);
  }
  if(e.mode==='drain'){
   const x=e.x+e.w/2,y=e.y+65,dx=2280-x,dy=1400-HannahEncounter.visual().lift-160-y;
   ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(dy,dx));FiaArt.effect('drain',2,Math.hypot(dx,dy)/2,0,Math.hypot(dx,dy),75,.85);ctx.restore();
   BossCues.box({x:e.x-12,y:e.y-12,w:e.w+24,h:e.h+24},BossCues.color);
  }
  return true;
 }
 function scenery(){
  if(Prologue.active||state==='menu')return;
  if(level===levels[3]&&defeated[3])Visuals.campPathMarker(level.zigguratEntrance,I18n.t('ziggurat.name'));
  if(!HannahEncounter.active())return;
  if(!HannahEncounter.blocked())Visuals.campPathMarker(level.returnPoint,I18n.t(level.returnDestination.location?SIDE_LOCATIONS[level.returnDestination.location].map.name:'shadow.name'));
  if(level.nextPoint)Visuals.campPathMarker(level.nextPoint,I18n.t(SIDE_LOCATIONS[level.nextDestination.location].map.name));
  if(!HannahEncounter.summit())return;
  const v=HannahEncounter.visual(),e=HannahEncounter.enemy(),floor=1400-v.lift;
  const release=v.rescueTime===null?(v.haruFreed?1:0):clamp((v.rescueTime-1.8)/1.4,0,1);
  const x=2280+(1800-2280)*release,feet=floor-135*(1-release);
  prop('haruBindingPillar',2280,floor,350);
  if(e?.active)for(const edge of [e.arena.x,e.arena.x+e.arena.w])prop('haruBindingPillar',edge,floor,240);
  if(haru(x,feet,125,-1))nameplate(x,feet,125,'HARU');
  ctx.save();
  if(!v.haruFreed){
   for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(x+side*32,feet-55);ctx.lineTo(x+side*65,feet-110);ctx.lineWidth=7;ctx.strokeStyle='#15101d';ctx.stroke();ctx.lineWidth=3;ctx.strokeStyle='#bd9b72';ctx.setLineDash([6,3]);ctx.stroke();ctx.setLineDash([]);}
  }
  ctx.restore();
  if(v.fiaPresent&&(v.rescueTime!==null||v.haruFreed)){
   const t=v.rescueTime;
   stamp(ART_KITSUNE.fia,t!==null&&t>.6&&t<1.8?2:0,1550,floor,150,1);
   const image=Visuals.images[ART_KITSUNE.fia.image];
   if(image?.complete&&image.naturalWidth)nameplate(1550,floor,150,'fia.name');
   if(t!==null&&t<.8)FiaArt.effect('teleport',Math.min(3,Math.floor(t*5)),1550,floor-75,190,210,.8);
   if(t!==null&&t>=.8&&t<1.8){const p=(t-.8);FiaArt.effect('foxfire',1,1580+700*p,floor-80-105*p,135,135,.9);}
  }else if(v.rescueTime!==null&&v.rescueTime>=.8&&v.rescueTime<1.8){
   BossVFX.impact(2280,floor-140,150,330);
  }
 }
 function drawUltimatePlayer(){
  const status=Dawnblade.status();if(!status.casting)return false;
  const image=Visuals.images[ART_HANNAH.dawnblade.image];if(!image?.complete||!image.naturalWidth)return false;
  const index=Math.min(5,Math.floor(status.progress*6));
  stamp(ART_HANNAH.dawnblade,index,player.x+player.w/2,player.y+player.h+1,96,status.face);
  return true;
 }
 function dialogueActors(){const d=ART_HANNAH.ritual,f=d.frames[0];return {hannah:{name:'ziggurat.hannah',image:d.image,rect:{x:f.x,y:f.y,w:f.w,h:f.h}},haru:{name:'HARU',image:'haruElder',rect:{x:160,y:0,w:800,h:1050}}};}
 return Object.freeze({backdrop,actor,scenery,player:drawUltimatePlayer,dialogueActors,haru,nameplate});
})();
