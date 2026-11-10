/* Native artwork uses world coordinates; rendering never advances encounter time. */
'use strict';
const WatchtowerBalloonArt=(()=>{
 const vortices=new WeakMap(),towerPanels=new WeakMap();
 function towerPanel(image){let panel=towerPanels.get(image);if(!panel){panel=BackgroundMotion.masked(image,{left:.1,right:.1,top:.06,bottom:.08});towerPanels.set(image,panel);}return panel;}
 function vortexPainting(){
  const image=Visuals.images.stormIslandsBackdrop;if(!image?.naturalWidth)return null;
  if(vortices.has(image))return vortices.get(image);
  const surface=document.createElement('canvas');surface.width=surface.height=512;
  const c=surface.getContext('2d');
  c.drawImage(image,image.naturalWidth*.08,0,image.naturalWidth*.28,image.naturalHeight*.38,0,0,512,512);
  const mask=c.createRadialGradient(256,256,150,256,256,256);mask.addColorStop(0,'rgba(0,0,0,1)');mask.addColorStop(1,'rgba(0,0,0,0)');
  c.globalCompositeOperation='destination-in';c.fillStyle=mask;c.fillRect(0,0,512,512);vortices.set(image,surface);return surface;
 }
 const stamp=(key,pose,x,feet,height,face=1)=>FiaVoidArt.stamp(ART_WATCHTOWER[key],pose,x,feet,height,face);
 function backdrop(){
  if(!WatchtowerBalloon.active())return false;
  const key=level===stormIslands?'stormIslandsBackdrop':'balloonSkyBackdrop',image=Visuals.images[key];
  if(image?.naturalWidth){
   const flight=WatchtowerBalloon.flight(),scroll=level===balloonJourney&&!reducedMotion.matches?(flight?.cruise||0)*55:0;
   if(level===balloonJourney){
    const sourceH=image.naturalHeight*.70,h=H,w=image.naturalWidth*h/sourceH,offset=scroll%w;
    for(let x=-offset;x<viewW;x+=w)BackgroundMotion.draw(image,0,0,image.naturalWidth,sourceH,x,0,w,h);
   // These paintings are distant panoramas. Keep the whole image steady on
   // jumps instead of repeating its sky/floor bands to follow world geometry.
   }else if(level===skyLanding||level===stormIslands){BackgroundFraming.cover(image,{vertical:.35});}
   else BackgroundFraming.cover(image,{vertical:.5});
  }
  if(level===ninjaWatchtower){
   const tower=Visuals.images.watchtowerBackdrop;
   if(tower?.naturalWidth){const h=level.height,w=h*tower.naturalWidth/tower.naturalHeight;BackgroundMotion.draw(towerPanel(tower),(level.width-w)/2-camera,-cameraY,w,h);}
  }
  return true;
 }
 function balloon(x,deck,width){
  const image=Visuals.images.balloonVehicle;if(!image?.naturalWidth)return;
  const s=width/1365;ctx.drawImage(image,x-85*s,deck-825*s,image.naturalWidth*s,image.naturalHeight*s);
 }
 function rings(){
  const selected=Grapple.selection();
  for(const ring of level.grappleAnchors||[]){
   const x=ring.x+ring.w/2,y=ring.y+ring.h/2;
   ctx.save();ctx.strokeStyle='#473322';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x,y+16);ctx.lineTo(x,y+75);ctx.stroke();
   ctx.strokeStyle=selected?.id===ring.id?'#fff2a5':'#d8b66d';ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,14,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
 }
 function pilot(x,y,pose=0,face=1){stamp('pilot',pose,x,y,110,face);HannahArt.nameplate(x,y,110,'balloon.pilot');}
 function morphActor(m){
  const e=m.actor,t=reducedMotion.matches?1:Math.min(1,m.elapsed/2),seal=m.kind==='transform'?t:1-t;
  ctx.save();ctx.globalAlpha=1-seal;stamp('pilot',5,e.x+e.w/2,e.y+e.h,110,e.face);ctx.globalAlpha=seal;stamp('seal',5,e.x+e.w/2,e.y+e.h,170,e.face);ctx.restore();
 }
 function scenery(){
  if(level===floatingIslands&&WatchtowerBalloonRules.eligible(flags))Visuals.campPathMarker(level.watchtowerEntrance,I18n.t('watchtower.name'));
  if(!WatchtowerBalloon.active())return;
  const p=WatchtowerBalloonRules.progress,owns=id=>flags[0].includes(id);
  rings();
  if(level===ninjaWatchtower){
   Visuals.campPathMarker(level.returnPoint,I18n.t('islands.name'));
   if(!owns(p.rescued)){
    const q=level.cellPoint;stamp('pilot',0,q.x,q.y,110);
    ArenaArt.stamp({image:'props',frames:[ART_FRAMES.props.cage],intersectOutlines:true},0,q.x,q.y,185);HannahArt.nameplate(q.x,q.y,195,'balloon.pilot');
   }
   if(owns(p.sentinel)){balloon(2850,400,700);Visuals.campPathMarker(level.boardPoint,I18n.t('balloon.board'));}
   const departure=WatchtowerBalloon.departure();
   if(departure){const e=departure.actor,t=Math.min(1,departure.elapsed/1.2);ctx.save();ctx.globalAlpha=1-t;stamp('sentinel',5,e.x+e.w/2+t*400,e.y+e.h-80*Math.sin(t*Math.PI),150,e.face);ctx.restore();}
  }else if(level===balloonJourney){balloon(220,850,1560);pilot(level.pilotPoint.x,level.pilotPoint.y);}
  else if(level===skyLanding&&owns(p.restored)&&!owns(p.arrived)){
   const changing=WatchtowerBalloon.morph();if(changing){balloon(70,1000,600);morphActor(changing);return;}
   const vortex=WatchtowerBalloon.vortex(),t=reducedMotion.matches?0:Math.min(1,(vortex?.elapsed||0)/3);
   if(vortex){
    const painting=vortexPainting();
    if(painting){ctx.save();ctx.globalAlpha=reducedMotion.matches?.25:.85;ctx.translate(420,650);ctx.rotate(reducedMotion.matches?0:t*.9);ctx.drawImage(painting,-520,-520,1040,1040);ctx.restore();}
   }
   balloon(70+t*300,1000-t*250,600*(1-t*.25));
   if(vortex)pilot(190+t*300,1000-t*250);
   if(!vortex){pilot(level.pilotPoint.x,level.pilotPoint.y);Visuals.campPathMarker(level.boardPoint,I18n.t('balloon.continue'));}
  }
  else if(level===stormIslands){
   const arrival=WatchtowerBalloon.arrival();if(arrival){const t=arrival.departing?Math.min(1,arrival.elapsed/4):0,move=reducedMotion.matches?0:t;
    ctx.save();ctx.globalAlpha*=reducedMotion.matches?1-t:1;balloon(arrival.x-180+move*420,arrival.y-move*700,500);pilot(arrival.x-80+move*420,arrival.y-move*700);ctx.restore();}
  }
 }
 function companion(){
  const e=WatchtowerBalloon.companion();if(!e)return;
  const rope=WatchtowerBalloon.ropeEscort(),pose=rope?4:Math.abs(e.vx)>1&&!reducedMotion.matches?1+Math.floor(e.animationTime*5)%2:0;
  if(rope){ctx.save();ctx.strokeStyle='#d8c49d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(e.x+e.w/2,e.y+25);ctx.lineTo(rope.target.x+29,rope.target.y+42);ctx.stroke();ctx.restore();}
  pilot(e.x+e.w/2,e.y+e.h,pose,e.face);
 }
 function actor(e){
  const morph=WatchtowerBalloon.morph();if(morph&&e.id===morph.actor.id){morphActor(morph);return true;}
  const key=e.balloonWasp?'wasp':({watchtowerJailer:'jailer',watchtowerSentinel:'sentinel',balloonDragon:'dragon',westheruSeal:'seal'})[e.miniboss];
  if(!key)return false;
  let pose=e.poseIndex||0;
  if(e.balloonWasp)pose=e.windup>0?3:e.attackTime>0?4:reducedMotion.matches?0:Math.floor(e.animTime*8)%2;
  else if(key==='jailer')pose=e.move==='belly'?(e.phase==='windup'?4:e.phase==='strike'?5:0):e.phase==='windup'?2:e.phase==='strike'?3:e.walkSpeed?1:0;
  else if(key==='sentinel'&&['sigils','ninjutsu'].includes(e.move)&&e.phase!=='wait')pose=4;
  else if(key==='dragon')pose=e.phase==='windup'?3:e.phase==='strike'?4:e.phase==='recover'?5:reducedMotion.matches?0:Math.floor(e.animTime*4)%2;
  const height=key==='jailer'?190:key==='dragon'?330:key==='seal'?170:e.balloonWasp?110:150;
  stamp(key,pose,e.x+e.w/2,e.y+e.h,height,e.face);
  if(e.balloonWasp){Visuals.healthBar(e);if(e.windup>0)BossCues.box({x:e.targetX-25,y:e.targetY-25,w:90,h:110});return true;}
  if(e.phase==='windup'){
   BossCues.box(e.attackBox||{x:e.targetX-35,y:e.targetY-45,w:70,h:90});
   if(e.move==='balloonBreath')BossCues.box({x:220,y:level.arena.y-30,w:1560,h:50});
  }
  for(const h of e.hazards||[])if(!h.active)BossCues.box(h);else if(h.kind==='lightning')BossVFX.lightning(h.x+h.w/2,h.y+h.h,h.h,h.w);else BossVFX.column(h);
  return true;
 }
 function playerOverlay(){
  const vortex=WatchtowerBalloon.vortex();if(!vortex)return false;
  const t=reducedMotion.matches?0:Math.min(1,vortex.elapsed/3);
  drawMomo(340+t*300,1000-t*250,96,0,0,1);return true;
 }
 function dialogueActors(){return Object.fromEntries([['westheru','pilot'],['westheruSeal','seal']].map(([id,key])=>{const a=ART_WATCHTOWER[key],f=a.frames[0],b=f.visibleBounds;return [id,{name:'balloon.pilot',image:a.image,rect:{x:b[0],y:b[1],w:b[2]-b[0],h:b[3]-b[1]}}];}));}
 return Object.freeze({backdrop,scenery,companion,actor,player:playerOverlay,dialogueActors});
})();
