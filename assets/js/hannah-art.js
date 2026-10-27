/* Painted ziggurat, final encounter and ultimate; drawing never advances clocks. */
'use strict';
const HannahArt=(()=>{
 function stamp(definition,index,x,feet,height,face=1,alpha=1){ctx.save();ctx.globalAlpha*=alpha;ArenaArt.stamp(definition,index,x,feet,height,face);ctx.restore();}
 function backdrop(){
  if(!HannahEncounter.active())return false;
  const v=HannahEncounter.visual(),key=level.ziggurat==='approach'?'zigguratApproach':level.ziggurat==='interior'?'zigguratInterior':'zigguratThrone';
  const base=Visuals.images[key],storm=Visuals.images.zigguratStorm;
  if(!base?.complete||!base.naturalWidth)return false;
  ctx.save();ctx.fillStyle='#110e1c';ctx.fillRect(0,0,viewW,H);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  function paint(image,alpha=1){
   const tall=level.ziggurat==='interior',s=Math.max(viewW/image.naturalWidth,(H+(tall?160:430))/image.naturalHeight),w=image.naturalWidth*s,h=image.naturalHeight*s;
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
  if(e.phase==='windup')return {definition:e.move==='summon'?ART_HANNAH.ritual:e.move==='jump'?ART_HANNAH.jump:ART_HANNAH.combo,index:e.move==='summon'?2:e.move==='jump'?0:1};
  if(e.phase==='strike')return {definition:e.move==='jump'?ART_HANNAH.jump:e.move==='summon'?ART_HANNAH.ritual:ART_HANNAH.combo,index:e.move==='summon'?2:Math.min(5,Math.floor(e.attackElapsed/Math.max(.001,e.attackDuration)*6))};
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
   for(const part of echo.parts){ctx.save();ctx.filter='hue-rotate(250deg) saturate(.8)';stamp(ART_HANNAH.combo,Math.min(5,Math.floor(echo.elapsed/echo.snapshot.duration*6)),part.x+part.w/2,part.y+part.h,e.h,echo.snapshot.face,.4);ctx.restore();}
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
  const v=HannahEncounter.visual(),e=HannahEncounter.enemy(),x=v.haruFreed?1800:2280,feet=1400-v.lift-(v.haruFreed?0:135);
  drawMomo(x,feet,110,0,0,-1);
  ctx.save();ctx.font='600 16px "Kiba UI", sans-serif';ctx.textAlign='center';const label=I18n.t('HARU'),w=ctx.measureText(label).width+20;
  ctx.fillStyle='#12101cf0';ctx.fillRect(x-w/2,feet-135,w,28);ctx.fillStyle='#fff0cf';ctx.fillText(label,x,feet-115);
  if(!v.haruFreed){
   for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(x+side*32,feet-55);ctx.lineTo(x+side*65,feet-110);ctx.lineWidth=7;ctx.strokeStyle='#15101d';ctx.stroke();ctx.lineWidth=3;ctx.strokeStyle='#bd9b72';ctx.setLineDash([6,3]);ctx.stroke();ctx.setLineDash([]);}
  }
  ctx.restore();
  if(e?.rescuedByFia&&e.mode==='finisher'){
   stamp(ART_KITSUNE.fia,0,1350,1400-v.lift,150,1);
   FiaArt.effect('foxfire',2,2280,feet-55,125,125,.75);
  }
 }
 function player(){
  const status=Dawnblade.status();if(!status.casting)return false;
  const index=Math.min(5,Math.floor(status.progress*6));
  stamp(ART_HANNAH.dawnblade,index,player.x+player.w/2,player.y+player.h+1,96,status.face);
  return true;
 }
 function dialogueActors(){const d=ART_HANNAH.ritual,f=d.frames[0];return {hannah:{name:'ziggurat.hannah',image:d.image,rect:{x:f.x,y:f.y,w:f.w,h:f.h}}};}
 return Object.freeze({backdrop,actor,scenery,player,dialogueActors});
})();
