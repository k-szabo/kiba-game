/* Painted encounter presentation. Rendering never advances combat clocks. */
const SlayerArt=(()=>{
 const inRealm=()=>level===yomi&&!Prologue.active;
 const guardian=()=>inRealm()?enemies.find(DoomSlayer.is):null;
 function stamp(art,x,feet,height,face=1,alpha=1){
  const image=Visuals.images[art?.image];if(!art||!image?.complete||!image.naturalWidth)return;
  const s=height/art.bodyHeight;
  ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,feet);ctx.scale(face,1);
  ctx.drawImage(image,art.x,art.y,art.w,art.h,(art.x-art.anchorX)*s,(art.y-art.anchorY)*s,art.w*s,art.h*s);ctx.restore();
 }
 function backdrop(){
  if(!inRealm()||!player)return;
  const alpha=clamp((-850-player.y-player.h)/450,0,1),image=Visuals.images.slayerArena;
  if(!alpha||!image?.complete||!image.naturalWidth)return;
  const s=Math.max(viewW/image.naturalWidth,H/image.naturalHeight),w=image.naturalWidth*s,h=image.naturalHeight*s;
  const arena=yomi.secrets.find(area=>area.id==='slayerGrave').arena;
  const pan=clamp((player.x-arena.x)/arena.w,0,1);
  ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(image,-(w-viewW)*pan,-(h-H)*.5,w,h);ctx.restore();
 }
 function icon(id,x,feet,height){
  const a=ART_INVENTORY.items[id],image=Visuals.images[a.image];if(!image?.complete||!image.naturalWidth)return;
  const w=height*a.w/a.h;ctx.drawImage(image,a.x,a.y,a.w,a.h,x-w/2,feet-height,w,height);
 }
 function objects(){
  if(!inRealm()||!visiblePoint(yomi.slayerGrave,330))return;
  const g=yomi.slayerGrave;stamp(ART_SLAYER.grave,g.x,g.y+2,235);
  if(!hasFlag('guardian:doomSlayer')){icon('daisyPlush',g.x-5,g.y-210,62);icon('slayerCrossbow',g.x+70,g.y-12,74);}
 }
 function scenery(){
  const e=guardian();if(!e||!e.graveAwake||e.dead)return;
  for(const b of e.barrels){
   stamp(ART_SLAYER.barrel,b.x,b.y+2,80,1,b.punctured?.6:1);
   if(b.punctured)BossVFX.fissure(b.x,b.y,64,.8);
  }
  for(const o of e.oils){
   ctx.save();ctx.fillStyle='#090e16ed';ctx.strokeStyle=o.lit?'#ffbc69':'#9badd7';ctx.lineWidth=2;
   ctx.beginPath();ctx.ellipse(o.x+o.w/2,o.y+8,o.w/2,10,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
   if(o.lit)for(let x=o.x+28;x<o.x+o.w;x+=65)BossVFX.stamp('ember',x,o.y+6,100,70,{angle:-Math.PI/2,alpha:o.warning>0?.45:.95});
  }
  for(const h of e.hazards){
   const x=h.x+h.w/2,feet=h.y+h.h,color=h.kind==='lightning'?'#a3e9ff':h.kind==='arrowWarning'?'#ffdd91':'#ffb07a';
   BossVFX.marker(x,feet,h.w+4,color);
   if(!h.active){
    BossCues.box(h,color);
    BossVFX.fissure(x,feet,h.w+8,.55);continue;
   }
   if(h.kind==='lightning')stamp(ART_SLAYER.lightning,x,feet,h.h);
   else if(h.kind==='explosion'||h.kind==='landing')BossVFX.impact(x,feet,h.w,h.h,.95);
  }
 }
 function pose(e){
  const phase=e.phase,move=e.move;
  if(phase==='retreat')return 21;
  if(phase==='cast')return 22;
  if((phase==='wait'||phase==='recover')&&Math.abs(e.walkSpeed)>2)return e.sawReady?23:Math.floor(e.animTime*Math.min(13,Math.max(7,Math.abs(e.walkSpeed)/45)))%2;
  if(phase==='wait')return e.sawReady?23:0;
  if(move==='saw')return phase==='strike'?23:22;
  if(move==='doubleJump')return phase==='windup'?18:phase==='recover'||e.landed?20:e.jumps===2?19:18;
  if(move==='flail'||move==='oil')return phase==='windup'?3:phase==='strike'?4:5;
  if(move==='kick')return phase==='windup'?6:phase==='strike'?7:8;
  if(move==='grab')return phase==='windup'?9:e.victim?11:phase==='strike'?10:0;
  if(move==='fireArrows')return phase==='windup'?12:13;
  if(move==='arrows')return phase==='windup'?12:14;
  if(move==='lightning'||move==='explosion')return phase==='windup'?15:move==='lightning'?16:17;
  return 0;
 }
 function actor(e){
  // A summoned guardian remains visible between attempts; before the first
  // incantation the grave still appears empty.
  if(!e.graveAwake||e.dead)return;
  const x=e.x+e.w/2,feet=e.y+e.h,progress=clamp(1-e.clock/e.phaseDuration,0,1);
  const index=e.blockFlash>0?2:pose(e);
  stamp(ART_SLAYER.frames[index],x,feet+1,168,['wait','recover'].includes(e.phase)?e.face:e.attackFace,e.inv>0?.78:1);
  if(!e.active)return;
  if(e.phase==='windup'&&['flail','kick','grab','saw'].includes(e.move)){
   const width=e.move==='flail'?185:e.move==='grab'?105:140,left=e.attackFace>0?e.x+e.w*.4:e.x-width;
   BossCues.box({x:left,y:e.y-4,w:width+e.w*.6,h:e.h+12},'#ffe1ad','#ffe0a225');
  }
  if(e.phase==='windup'&&['lightning','explosion'].includes(e.move)){
   BossVFX.marker(e.targetX,e.arena.y,e.move==='lightning'?420:260,e.move==='lightning'?'#a3e9ff':'#ffbd79');
  }
  if(e.phase==='strike'&&['flail','oil','kick','saw'].includes(e.move))BossVFX.slash('slashGold',x+e.attackFace*80,feet-65,180,110,e.attackFace,progress);
  if(e.phase==='cast')BossVFX.portal(x,feet+3,160,.6);
  const width=Math.min(290,viewW-16),height=84,hudX=clamp(x,camera+width/2+8,camera+viewW-width/2-8);
  let top=clamp(feet-245,cameraY+8,cameraY+H-height-8);
  for(const id of ['hud','quest']){
   const panel=$(id);if(panel.hidden||!panel.getBoundingClientRect)continue;
   const b=panel.getBoundingClientRect(),box={x:camera+b.left/scale,y:cameraY+b.top/scale,w:b.width/scale,h:b.height/scale};
   if(overlap({x:hudX-width/2,y:top,w:width,h:height},box))top=Math.min(cameraY+H-height-8,cameraY+(b.bottom+8)/scale);
  }
  ctx.save();ctx.textAlign='center';ctx.font='bold 14px "Kiba UI", "Kiba Story", sans-serif';
  ctx.fillStyle='#0e1927ee';ctx.fillRect(hudX-width/2,top,width,height);ctx.strokeStyle='#d3bd8a';ctx.lineWidth=1.5;ctx.strokeRect(hudX-width/2,top,width,height);
  ctx.fillStyle='#fff0ca';ctx.fillText(I18n.t('slayer.name'),hudX,top+19);
  ctx.font='bold 12px "Kiba UI", "Kiba Story", sans-serif';
  const steam=e.phase==='cast'?Math.round(progress*100)+'%':e.sawReady?'100%':'0%';
  ctx.fillText(I18n.format('slayer.armor',[e.armor]),hudX,top+37);ctx.fillText(I18n.format('slayer.steam',[steam]),hudX,top+53);
  ctx.fillStyle='#06101b';ctx.fillRect(hudX-width/2+12,top+64,width-24,9);ctx.fillStyle='#dd9b69';ctx.fillRect(hudX-width/2+12,top+64,(width-24)*clamp(e.hp/e.maxHp,0,1),9);ctx.restore();
 }
 return Object.freeze({backdrop,objects,scenery,actor,pose});
})();
