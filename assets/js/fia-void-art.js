/* Native silhouettes and world-registered scenery; this module advances no clocks. */
'use strict';
const FiaVoidArt=(()=>{
 const backgrounds={fiaRitual:['fiaRitualBackdrop',600],shadowUnderworld:['shadowUnderworldBackdrop',null],voidForbidden:['voidForbiddenBackdrop',650]};
 function roomLayout(image,ground){
  const scale=Math.max(viewW/image.naturalWidth,H/image.naturalHeight),width=image.naturalWidth*scale,height=image.naturalHeight*scale;
  return {scale,width,height,x:-(width-viewW)*clamp(camera/Math.max(1,level.width-viewW),0,1),top:level.start.y-cameraY-ground*scale};
 }
 function stamp(definition,index,x,feet,height,face=1){
  const f=definition?.frames?.[index]||definition?.frames?.[0],image=Visuals.images[definition?.image];if(!f||!image?.complete||!image.naturalWidth)return;
  const s=height/f.bodyHeight;ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.translate(x,feet);ctx.scale(face,1);
  if(f.outlines?.length){ctx.beginPath();for(const outline of f.outlines){outline.forEach(([px,py],i)=>ctx[i?'lineTo':'moveTo']((px-f.anchorX)*s,(py-f.anchorY)*s));ctx.closePath();}ctx.clip();}
  ctx.drawImage(image,f.x,f.y,f.w,f.h,(f.x-f.anchorX)*s,(f.y-f.anchorY)*s,f.w*s,f.h*s);ctx.restore();
 }
 function backdrop(){
  const b=backgrounds[level.id];if(!b)return false;const image=Visuals.images[b[0]];ctx.fillStyle='#100d1b';ctx.fillRect(0,0,viewW,H);
  if(image?.complete&&image.naturalWidth){
   if(b[1]===null)BackgroundMotion.draw(image,-camera,-cameraY,level.width,level.height);
   else{
    const {width,height,x,top}=roomLayout(image,b[1]),floor=level.start.y-cameraY;
    BackgroundMotion.draw(image,x,top,width,height);
    if(top+height<H){ctx.save();ctx.beginPath();ctx.rect(0,Math.max(0,floor),viewW,H-Math.max(0,floor));ctx.clip();const stretch=(H-floor)/(image.naturalHeight-b[1]);BackgroundMotion.draw(image,x,floor-b[1]*stretch,width,image.naturalHeight*stretch);ctx.restore();}
   }
  }return true;
 }
 function marker(point,name){Visuals.campPathMarker(point,I18n.t(name));}
 function label(npc){const text=I18n.t(npc.name);ctx.save();ctx.font='600 15px "Kiba UI", sans-serif';ctx.textAlign='center';const w=ctx.measureText(text).width+22,y=npc.y-npc.height-24;ctx.fillStyle='#100d1bed';ctx.fillRect(npc.x-w/2,y-22,w,30);ctx.fillStyle='#fff0cc';ctx.fillText(text,npc.x,y);ctx.restore();}
 function attack(warning,impact){
  if(warning)BossCues.box(warning.box,BossCues.color);
  if(impact)BossVFX.stamp(impact.kind==='rift'?'shadowColumn':'impact',impact.box.x+impact.box.w/2,impact.box.y+impact.box.h,impact.box.w,impact.box.h,{alpha:Math.min(1,impact.remaining*4)});
 }
 function scenery(){
  if(Prologue.active||state==='menu')return;
  if(level===fiaChambers&&(flags[3].includes('fiaDragonCompleted')||DevSession.active))marker(level.ritualEntrance,'fia.ritual.location');
  if(level===shadowDen&&(flags[3].includes('fiaVoidAccepted')||DevSession.active))marker(level.underworldEntrance,'fia.void.underworld');
  if(!FiaVoidJourney.active())return;
  // These maps own their floor rendering; drawLandscape omits them because
  // painted interiors used to supply the ground. Use the collision platforms.
  Visuals.terrain(realms[realm],platforms.filter(p=>level!==shadowUnderworld||/^underworld-floor-/.test(p.id)));
  if(!VoidEncounter.locked())marker(level.returnPoint,SIDE_LOCATIONS[level.returnDestination.location].map.name);
  if(level===fiaRitual){
   const npc=level.npcs[0];if(campNPCVisible(npc)){stamp(ART_KITSUNE.fia,0,npc.x,npc.y,npc.height);label(npc);CampArt.questMarker('fia',npc,npc.height);}
   const image=Visuals.images.fiaRitualBackdrop;if(image?.naturalWidth){const {scale,x,top:screenTop}=roomLayout(image,600),left=x+camera,top=screenTop+cameraY;
    for(const [i,[flag,item]]of [['priestessTalisman','priestessTalisman'],['demonLordHeartGiven','demonLordHeart'],['fiaDragonCompleted','dragonEyes'],['fiaVoidCompleted','rawVoidCrystal']].entries())if(!flags[3].includes('fiaRitualCompleted')&&!FiaRitual.enemy?.ritualEmpowered&&flags[3].includes(flag)){
     const a=ART_INVENTORY.items[item],img=Visuals.images[a?.image];if(!a||!img?.naturalWidth)continue;const s=48/Math.max(a.w,a.h);ctx.drawImage(img,a.x,a.y,a.w,a.h,left+(850+i*105)*scale-a.w*s/2,top+350*scale-a.h*s,a.w*s,a.h*s);
    }
   }
  }else if(level===shadowUnderworld){
   if(FiaVoidJourney.available())for(const npc of level.npcs){stamp(ART_FIA_VOID[npc.service],0,npc.x,npc.y,npc.height);label(npc);CampArt.questMarker(npc.id,npc,npc.height);}
   if(FiaVoidJourney.available())for(const npc of level.residents){stamp(ART_KITSUNE.residents[npc.id],0,npc.x,npc.y,npc.height);label(npc);}
   if(!flags[3].includes('fiaSlain'))for(const npc of level.guards){ArenaArt.stamp(ART_ARENA.cyclops,0,npc.x,npc.y,npc.height,-1);}
   marker(level.forbiddenEntrance,'fia.void.forbidden');
  }else{
   if(!flags[3].includes('voidDemonDefeated')){BossVFX.stamp('shadowColumn',level.rift.x,level.rift.y-100,300,510);BossVFX.portal(level.rift.x,level.rift.y,190,.9);}
   const actor=VoidEncounter.actor;if(actor&&VoidEncounter.snapshot?.phase!=='victory'){const definition=ART_FIA_VOID[VoidEncounter.snapshot.generation===2?'demon':'lieutenant'];stamp(definition,VoidEncounter.pose,actor.x+actor.w/2,actor.y+actor.h,actor.h,actor.face);}
   attack(VoidEncounter.warning,VoidEncounter.impact);
   if(VoidEncounter.locked())for(const x of [level.voidArena.x,level.voidArena.x+level.voidArena.w])BossVFX.portal(x,level.voidArena.y,100,.8);
  }
 }
 function actor(e){
  if(!e.voidKeeperRole)return false;if(e.dead)return true;
  const pose=e.windup>0?3:e.attackTime>0?4:e.recovery>0?5:Math.abs(e.walkSpeed)>1&&!reducedMotion.matches?1+Math.floor(e.animTime*7)%2:0;
  stamp(ART_FIA_VOID[e.voidKeeperRole],pose,e.x+e.w/2,e.y+e.h,e.h,e.face);Visuals.healthBar(e);
  if(e.windup>0)BossCues.box(enemyRole(e)==='guard'?enemyMeleeBox(e):{x:e.targetX-55,y:e.targetY-55,w:110,h:110},BossCues.color);return true;
 }
 return Object.freeze({backdrop,scenery,actor,stamp,roomLayout,attack});
})();
