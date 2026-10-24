/* Painted variants share pose selection, health cues and attack outlines. */
'use strict';
const SerpentArt=(()=>{
 const areas={whiteSerpentCave:{image:'whiteSerpentBackdrop',sourceFloor:605,worldFloor:1790},wingedSerpentRoost:{image:'wingedSerpentBackdrop',sourceFloor:512,worldFloor:2500}};
 const hasBackdrop=area=>Object.hasOwn(areas,area?.id);
 let painted=null;
 function resetBackdrop(){painted=null;}
 function backdropState(){return painted?Object.freeze({area:painted.area,alpha:painted.alpha}):null;}
 function updateBackdrop(dt){
  if(state!=='play'||Prologue.active||!Number.isFinite(dt)||dt<=0)return;
  if(painted?.map!==level)painted=null;
  const selected=Visuals.secretBackdropState(),target=selected&&hasBackdrop(selected.area)?selected:null;
  if(target&&painted?.area!==target.area)painted={map:level,area:target.area,alpha:0};
  if(!painted)return;
  const wanted=target?.alpha||0,step=dt*2.8;
  painted.alpha=clamp(painted.alpha+clamp(wanted-painted.alpha,-step,step),0,1);
  if(!target&&painted.alpha===0)painted=null;
 }
 function backdrop(){
  if(state==='menu'||!painted||painted.map!==level||painted.alpha<=0)return;
  const a=areas[painted.area.id],image=Visuals.images[a.image];if(!image?.complete||!image.naturalWidth)return;
  // Secret scenery covers the viewport like the cave/tower backdrops. A world-
  // sized bitmap exposed its hard edges while the camera entered the arena.
  const s=Math.max(viewW/image.naturalWidth,H/image.naturalHeight),width=image.naturalWidth*s,height=image.naturalHeight*s,
   drift=clamp((camera+viewW/2-painted.area.x-painted.area.w/2)*.08,-(width-viewW)/2,(width-viewW)/2);
  ctx.save();ctx.globalAlpha*=painted.alpha;ctx.drawImage(image,(viewW-width)/2-drift,(H-height)*.35,width,height);ctx.restore();
 }
 function pose(e){
  const white=e.serpentType==='white';
  if(e.phase==='windup')return white?(e.move==='bite'?1:e.move==='groundBurst'?4:6):(e.move==='bite'?1:e.move==='holyFan'?4:5);
  if(e.phase==='strike')return white?(e.move==='bite'?2:e.move==='groundBurst'?5:6):e.move==='holyFan'?4:3;
  if(e.phase==='recover')return white?3:6;
  if(!white&&e.phase==='wait'&&Math.abs(e.walkSpeed)>1&&!reducedMotion.matches)return [1,2][Math.floor(e.animTime*5)%2];
  return reducedMotion.matches?0:[0,7][Math.floor(e.animTime*4)%2];
 }
 function outline(b,color){
  BossCues.box(b,color);
 }
 function actor(e){
  if(!Serpents.is(e)||e.serpentType==='lava')return false;
  if(e.dead)return true;
  const art=ART_REALM_SERPENTS[e.serpentType],r=art.frames[pose(e)],img=Visuals.images[art.image],height=e.h*1.4,s=height/r.bodyHeight,x=e.x+e.w/2,feet=e.y+e.h;
  if(img?.complete&&img.naturalWidth){ctx.save();ctx.globalAlpha*=e.inv>0?.85:1;ctx.translate(x,feet);ctx.scale(e.face*art.facing,1);ctx.drawImage(img,r.x,r.y,r.w,r.h,(r.x-r.anchorX)*s,(r.y-r.anchorY)*s,r.w*s,r.h*s);ctx.restore();}
  const white=e.serpentType==='white',color=white?'#c4f2ec':'#e0b9ff',label=I18n.t(e.name);
  ctx.save();ctx.font='600 15px "Kiba UI", "Kiba Story", sans-serif';ctx.textAlign='center';const width=Math.max(220,ctx.measureText(label).width+28),top=feet-height-64;
  ctx.fillStyle='#10283fee';ctx.fillRect(x-width/2,top,width,50);ctx.fillStyle='#fff0bd';ctx.fillText(label,x,top+20);ctx.fillStyle='#070e18';ctx.fillRect(x-width/2+8,top+31,width-16,9);ctx.fillStyle=color;ctx.fillRect(x-width/2+8,top+31,(width-16)*Math.max(0,e.hp/e.maxHp),9);
  if(e.phase==='windup'){
   const text=I18n.t('serpent.move.'+e.move),w=ctx.measureText(text).width+22;ctx.fillStyle='#10283fee';ctx.fillRect(x-w/2,feet+9,w,28);ctx.fillStyle='#fff0bd';ctx.fillText(text,x,feet+29);
   if(e.attackBox)outline(e.attackBox,BossCues.color);
  }
  for(const h of e.hazards){
   if(!h.active){outline(h,BossCues.color);BossVFX.marker(h.x+h.w/2,h.y+h.h,h.w,BossCues.color);}
   else{ctx.save();ctx.filter='hue-rotate(145deg) saturate(.65) brightness(1.15)';BossVFX.stamp('impact',h.x+h.w/2,h.y+h.h-h.h/2,h.w*1.2,h.h*1.3);ctx.restore();}
  }
  if(e.phase==='strike'&&['bite','shadowSweep'].includes(e.move))BossVFX.slash(white?'slashGold':'slashShadow',x+e.attackFace*75,feet-e.h*.45,190,115,e.attackFace,Math.min(1,e.attackElapsed/e.attackDuration));
  ctx.restore();return true;
 }
 function projectile(p){
  if(p.serpentType!=='white')return false;
  ctx.save();ctx.filter='hue-rotate(145deg) saturate(.65) brightness(1.15)';Visuals.projectile({...p,kind:'holyArrow'});ctx.restore();return true;
 }
 return Object.freeze({areas,hasBackdrop,backdrop,backdropState,updateBackdrop,resetBackdrop,actor,projectile,pose});
})();
