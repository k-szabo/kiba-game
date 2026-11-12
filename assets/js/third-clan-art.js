/* Draw the third clan route using world-space props and viewport-scale scenery. */
'use strict';
const ThirdClanArt=(()=>{
 const guardianArt={image:'thirdClanGuardianArt',frames:[
  [94,67,389,352,237,412],[600,66,382,354,743,412],[1117,66,380,351,1249,409],
  [58,535,368,421,273,947],[538,603,484,353,702,947],[1044,581,472,375,1248,947]
 ].map(([x,y,w,h,anchorX,anchorY])=>({x,y,w,h,anchorX,anchorY,bodyHeight:325}))};
 const staggerArt={image:'thirdClanGuardianStagger',frames:[{x:202,y:0,w:1200,h:1008,anchorX:795,anchorY:980,bodyHeight:1160}]};
 const hasCaveArt=()=>ThirdClan.isCave()&&Visuals.images.thirdClanCaveBackdrop?.naturalWidth>0;
 function backdrop(){
  if(ThirdClan.isPath())return BackgroundFraming.cover(Visuals.images.thirdClanPathBackdrop);
  if(!ThirdClan.isCave())return false;
  const image=Visuals.images.thirdClanCaveBackdrop;
  return BackgroundFraming.cover(image,{ground:image?.naturalHeight*.73,floor:level.start.y-cameraY,scaleFloor:0});
 }
 function scenery(){
  if(level===ninjaCamp&&flags[0].includes(ThirdClanRules.progress.accepted)){
   Visuals.campPathMarker(ninjaCamp.thirdClanExit,I18n.t('thirdClan.path'));
  }
  if(!ThirdClan.isPath())return;
  IslandsArt.anchors();
  Visuals.campPathMarker(level.caveEntrance,I18n.t('thirdClan.cave'));
  for(const point of level.ballistae){
   if(!visiblePoint(point,300))continue;
   const hp=ThirdClan.ballistaHp(point);
   SkyDragonRaid.drawProp('ballista',point,{x:435,y:684},.44,!hp);
   if(!hp)continue;
   HannahArt.nameplate(point.x,point.y,171,'thirdClan.ballista');
   ctx.save();ctx.fillStyle='#251e2a';ctx.fillRect(point.x-43,point.y-183,86,5);
   ctx.fillStyle='#e8b680';ctx.fillRect(point.x-43,point.y-183,86*hp/ThirdClanRules.ballistaHealth,5);ctx.restore();
  }
 }
 function encounter(){
  if(!ThirdClan.isCave())return;
  const demon=ThirdClan.guardian;
  if(!demon||demon.dead){
   if(!flags[0].includes(ThirdClanRules.progress.trail))Visuals.campPathMarker(level.haruTrail,I18n.t('thirdClan.trail.inspect'));
   return;
  }
  const elapsed=demon.airshipTime,{fireAt,impactAt}=ThirdClanRules.airship;
  const x=demon.x+demon.w/2,feet=demon.y+demon.h;
  if(demon.cast)BossCues.box(demon.cast,BossCues.color);
  if(elapsed!==null)drawAirship(demon,elapsed,x,feet);
  const frame=demon.cast?(demon.cast.spell?5:3):demon.clock>1.01&&demon.attackIndex?4:
   demon.walkSpeed&&!reducedMotion.matches?1+Math.floor(demon.animTime*6)%2:0;
  ctx.save();ctx.translate(x,feet);
  if(elapsed!==null&&elapsed>=impactAt){
   const fall=clamp((elapsed-impactAt)/.6,0,1);
   if(!reducedMotion.matches)ctx.rotate(demon.face*fall*Math.PI*.39);
   ctx.globalAlpha*=1-fall*.8;
  }
  FiaVoidArt.stamp(elapsed===null?guardianArt:staggerArt,frame,0,0,demon.h,demon.face);
  ctx.restore();
 }
 function drawAirship(demon,elapsed,targetX,feet){
  const {fireAt,impactAt}=ThirdClanRules.airship;
  const approach=1-clamp(elapsed/1.6,0,1),bowX=demon.bowX-(reducedMotion.matches?0:approach*approach*660);
  const deckY=feet-172;
  ctx.save();if(reducedMotion.matches)ctx.globalAlpha*=1-approach;
  SkyDragonRaid.drawProp('ship',{x:bowX-365,y:deckY},{x:1090,y:481},.61);
  SkyDragonRaid.drawProp('ballista',{x:bowX-123,y:deckY+10},{x:435,y:684},.22);
  ctx.restore();
  if(elapsed<fireAt||elapsed>=impactAt)return;
  const travel=(elapsed-fireAt)/(impactAt-fireAt),startX=bowX-30,startY=deckY-92,targetY=feet-94;
  const at=t=>[startX+(targetX-startX)*t,startY+(targetY-startY)*t*t-128*t*(1-t)];
  ctx.save();ctx.strokeStyle='#ffe0a9';ctx.lineWidth=6;ctx.beginPath();
  ctx.moveTo(...at(Math.max(0,travel-.11)));ctx.lineTo(...at(travel));ctx.stroke();ctx.restore();
 }
 return Object.freeze({backdrop,scenery,encounter,hasCaveArt});
})();
