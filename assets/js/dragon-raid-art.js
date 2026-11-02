/* Raid art only reads combat state; actor motion never advances the fight. */
'use strict';
const DragonRaidArt=(()=>{
 function backdrop(){
  if(!DragonRaid.active())return false;
  const image=Visuals.images.dragonRaidHall;if(!image?.complete||!image.naturalWidth)return false;
  ctx.save();ctx.fillStyle='#15121c';ctx.fillRect(0,0,viewW,H);
  if(DragonRaid.current?.phase===2&&!reducedMotion.matches){
   const s=Math.max(viewW/image.naturalWidth,H/image.naturalHeight),w=image.naturalWidth*s,h=image.naturalHeight*s;
   const offset=(levelTime*35+camera*.12)%(w*2),first=Math.floor(offset/w);
   for(let i=first;i<=first+2;i++){const x=i*w-offset;ctx.save();ctx.translate(x,0);if(i%2){ctx.translate(w,0);ctx.scale(-1,1);}BackgroundMotion.draw(image,0,H-h,w,h);ctx.restore();}
  }else BackgroundFraming.cover(image,{vertical:clamp(cameraY/Math.max(1,level.height-H),0,1)});
  ctx.restore();return true;
 }
 function whole(key,x,y,width){
  const image=Visuals.images[key];if(!image?.complete||!image.naturalWidth)return;
  ctx.drawImage(image,x,y,width,width*image.naturalHeight/image.naturalWidth);
 }
 function frontPose(index=0){
  const a=DragonRaid.current,t=DragonRaidRules.tuning;
  if(a?.phase===3&&a.stance!=='standing'){
   const progress=a.stance==='falling'?clamp(1-a.stanceTime/t.fallDuration,0,1):a.stance==='rising'?clamp(1-a.stanceTime/t.riseDuration,0,1):0;
   const pose=a.stance==='falling'?Math.min(2,Math.floor(progress*3)):a.stance==='exposed'?2:progress<.4?2:progress<.85?3:0;
   return {definition:ART_DRAGON.stagger,index:pose};
  }
  return {definition:ART_DRAGON.front,index};
 }
 function front(index){
  const pose=frontPose(index),f=pose.definition.frames[pose.index],image=Visuals.images[pose.definition.image];if(!image?.complete||!image.naturalWidth)return;
  const g=DragonRaid.frontGeometry(),s=g.scale;
  ctx.drawImage(image,f.x,f.y,f.w,f.h,g.x-(f.anchorX-f.x)*s,g.feet-(f.anchorY-f.y)*s,f.w*s,f.h*s);
 }
 function flight(){
  const image=Visuals.images.dragonFlight;if(!image?.complete||!image.naturalWidth)return;
  const wing=[[890,280],[1110,295],[1320,425],[1300,740],[1020,790],[420,790],[550,590],[710,445]];
  const path=()=>{wing.forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](x,y));ctx.closePath();};
  ctx.save();ctx.translate(4050,460);ctx.scale(DRAGON_RAID_ART_SCALE.flightWidth/image.naturalWidth,DRAGON_RAID_ART_SCALE.flightWidth/image.naturalWidth);
  ctx.save();ctx.beginPath();ctx.rect(0,0,image.naturalWidth,image.naturalHeight);path();ctx.clip('evenodd');ctx.drawImage(image,0,0);ctx.restore();
  // The torso/back registration stays fixed for collision. Only painted wing
  // pixels move; the source wing is cut out first to prevent a duplicate limb.
  ctx.save();ctx.translate(1110,295);ctx.rotate(reducedMotion.matches?0:Math.sin(levelTime*1.8)*.018);ctx.translate(-1110,-295);
  ctx.beginPath();path();ctx.clip();ctx.drawImage(image,0,0);ctx.restore();ctx.restore();
 }
 function scenery(){
  if(!Prologue.active&&level===zigguratInterior&&flags[3].includes('hannahDefeated')){const p=level.dragonRaidEntrance;BossVFX.portal(p.x,p.y,150,.8);}
  if(!DragonRaid.active())return;
  const attempt=DragonRaid.current,phase=attempt?.phase||1,w=DragonRaid.warning,hit=DragonRaid.impact;
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  if(phase===3){
   const destroyed=DragonRaidRules.tuning.pillars-(attempt?.pillars??DragonRaidRules.tuning.pillars);
   for(const [i,x]of [8700,9200,11300,11800].entries())if(i>=destroyed)whole('haruBindingPillar',x-433,0,866);else BossVFX.fissure(x,1300,180,.8);
  }
  if(phase===1&&!(attempt===null&&fiaJourney.dragon.clear))whole((w?.kind==='fire'&&w.remaining<.65||hit?.kind==='fire')?'dragonBreath':'dragonIdle',450,100,DRAGON_RAID_ART_SCALE.idleWidth);
  else if(phase===2)flight();
  else if(phase===3)front(attempt?.won?2:hit?hit.kind==='fire'?3:2:w?w.kind==='fire'&&w.remaining<.45?3:1:0);
  if(!attempt||attempt.won)BossVFX.portal(DragonRaid.exitPoint().x,DragonRaid.exitPoint().y,90,.6);
  for(const target of DragonRaid.targets()){
   if(target.type==='foreleg'){
    const x=target.x+target.w/2,y=target.y-25;ctx.save();ctx.font='600 15px "Kiba UI", sans-serif';ctx.textAlign='center';const label=I18n.t(target.name),width=Math.max(150,ctx.measureText(label).width+18);ctx.fillStyle='#100d1bed';ctx.fillRect(x-width/2,y-24,width,40);ctx.fillStyle='#fff0cc';ctx.fillText(label,x,y-6);ctx.fillStyle='#221a2e';ctx.fillRect(x-width/2+8,y+3,width-16,6);ctx.fillStyle='#d99583';ctx.fillRect(x-width/2+8,y+3,(width-16)*clamp(target.hp/target.maxHp,0,1),6);ctx.restore();continue;
   }
   if(target.hp<=0)continue;
   if(target.type==='chain'){
    ctx.save();ctx.lineWidth=9;ctx.strokeStyle='#17121c';ctx.beginPath();ctx.moveTo(target.x+target.w/2,target.y-280);ctx.lineTo(target.x+target.w/2,target.y+target.h);ctx.stroke();
    ctx.lineWidth=5;ctx.strokeStyle='#bca084';ctx.setLineDash([9,6]);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    BossVFX.portal(target.x+target.w/2,target.y+target.h/2,70,.7);
   }else if(target.type==='tumor'){
    BossVFX.stamp('shadowColumn',target.x+target.w/2,target.y+target.h,130,160,{alpha:.9});
   }else if(target.type==='manifestation'){
    ctx.save();ctx.translate(target.x+target.w/2,target.y+55);ctx.scale(.27,.27);
    const pose=ShadowAnimation.sample({idleTime:reducedMotion.matches?0:levelTime,cast:w?{stage:'windup',duration:w.duration,remaining:w.remaining}:null,release:hit?{elapsed:hit.strikeDuration-hit.remaining,duration:hit.strikeDuration}:null});
    ShadowAnimation.draw(pose,0,0,1);ctx.restore();
   }
  }
  if(w)BossCues.box(w.box);
  if(w?.kind==='fire'&&w.remaining<=.45){
   const mouth=phase===1?{x:3070,y:450}:{x:DragonRaid.head.x-50,y:700+DragonRaid.head.y},target={x:w.box.x+w.box.w/2,y:w.box.y+w.box.h/2},t=clamp(1-w.remaining/.45,0,1);
   BossVFX.stamp('ember',mouth.x+(target.x-mouth.x)*t,mouth.y+(target.y-mouth.y)*t,155,70,{angle:Math.atan2(target.y-mouth.y,target.x-mouth.x)});
  }
  if(hit){const b=hit.box,physical=hit.kind==='headSlam'||hit.kind==='bite';BossVFX.stamp(physical||hit.kind==='fire'?'impact':'shadowColumn',b.x+b.w/2,b.y+b.h,b.w,b.h,{alpha:Math.min(1,hit.remaining*4)});}
  ctx.restore();
 }
 return Object.freeze({backdrop,scenery,frontPose});
})();
