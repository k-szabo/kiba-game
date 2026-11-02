/* Approved ritual sprites and powers are views of simulation state only. */
'use strict';
const FiaRitualArt=(()=>{
 const kinds=['hymn','hell','dragon','void'];
 const stamp=(definition,index,x,feet,height,face=1)=>FiaVoidArt.stamp(definition,index,x,feet,height,face);
 function effect(type,index,x,y,w,h=w,alpha=1,angle=0){
  const a=ART_FIA_RITUAL[type],f=a?.frames[index],image=Visuals.images[a?.image];if(!f||!image?.complete||!image.naturalWidth)return;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(image,f.x,f.y,f.w,f.h,-(f.anchorX-f.x)/f.w*w,-(f.anchorY-f.y)/f.h*h,w,h);ctx.restore();
 }
 function actors(){return Object.fromEntries([['fiaWhite','white','fia.ritual.white'],['fiaRed','red','fia.ritual.red'],['fiaRitual','fia','fia.name']].map(([id,key,name])=>{const a=ART_FIA_RITUAL[key],f=a.frames[0];return [id,{name,image:a.image,rect:f}];}));}
 function label(npc){ctx.save();ctx.font='600 15px "Kiba UI", sans-serif';ctx.textAlign='center';const text=I18n.t(npc.name),w=ctx.measureText(text).width+20,y=npc.y-npc.height-24;ctx.fillStyle='#100d1bed';ctx.fillRect(npc.x-w/2,y-22,w,30);ctx.fillStyle='#fff0cc';ctx.fillText(text,npc.x,y);ctx.restore();}
 function scenery(){
  if(Prologue.active||state==='menu')return;
  const accepted=flags[3].includes('fiaRitualAccepted'),dead=flags[3].includes('fiaSlain'),sacrificed=flags[3].includes('fiaAttendantsSacrificed');
  if(accepted&&!dead&&!sacrificed)for(const npc of FiaRitual.attendants())if(level===npc.map&&!flags[3].includes(FiaRitualRules.progress[npc.colour])){stamp(ART_FIA_RITUAL[npc.colour],0,npc.x,npc.y,npc.height);label(npc);}
  if(!FiaRitual.active()||!accepted||dead)return;
  const scene=FiaRitual.scene;
  if(!sacrificed||scene){
   for(const [i,colour]of ['white','red'].entries())if(flags[3].includes(FiaRitualRules.progress[colour])){
    const x=870+i*320,t=scene?.elapsed||0,fade=scene?.kind==='sacrifice'?(i===0?clamp((2.5-t)/1.5,0,1):clamp((4-t)/1.5,0,1)):scene?0:1;
    if(fade>0){ctx.save();ctx.globalAlpha*=fade;stamp(ART_FIA_RITUAL[colour],scene?(t>(i===0?1:2.5)?3:2):0,x,820,132);ctx.restore();}
    if(scene)effect('chains',0,x,755,135,110,.8);
    if(scene?.kind==='sacrifice'&&t>1+i*1.5&&t<2.5+i*1.5){const p=(t-1-i*1.5)/1.5;effect('chains',1+i,x+(1050-x)*p,700-p*80,220,90,Math.sin(p*Math.PI));}
   }
  }
  if(scene){
   effect('chains',scene.kind==='broken'?3:0,player.x+player.w/2,player.y+player.h*.55,130,115,.85);
   stamp(ART_FIA_RITUAL.fia,2,1550,820,145);
   if(FiaRitual.breakReady()){
    const text=bindingKeyLabel(Bindings.read('ultimate')[0])+' · '+I18n.t('ziggurat.objective.ultimate'),x=player.x+player.w/2,y=player.y-36;
    ctx.save();ctx.font='700 17px "Kiba UI", sans-serif';ctx.textAlign='center';const w=ctx.measureText(text).width+28;
    ctx.fillStyle='#100d1bf5';ctx.fillRect(x-w/2,y-25,w,38);ctx.strokeStyle='#ffe0a2';ctx.lineWidth=2;ctx.strokeRect(x-w/2,y-25,w,38);ctx.fillStyle='#fff0cc';ctx.fillText(text,x,y);ctx.restore();
   }
  }
 }
 function actor(e){
  if(e.ritual&&e.ritualEmpowered){
   if(e.dead)return true;const pose=e.phase==='windup'||e.phase==='strike'?1:e.phase==='recover'?0:0;
   stamp(ART_FIA_RITUAL.fia,pose,e.x+e.w/2,e.y+e.h,e.h,e.face);
   const index=Math.max(0,kinds.indexOf(e.ritualEffect));effect('powers',index,e.x+e.w/2,e.y+e.h*.45,110,150,.28);
   if(e.phase==='windup'){for(const b of e.attackBoxes||[])BossCues.box(b,BossCues.color);if(!e.attackBoxes?.length&&!e.hazards?.length)BossVFX.marker(e.x+e.w/2,e.y+e.h*.4,90,BossCues.color);}
   for(const h of e.hazards||[]){if(!h.active)BossCues.box(h,BossCues.color);else effect('powers',4+Math.max(0,kinds.indexOf(h.ritualEffect)),h.x+h.w/2,h.y+h.h*.5,h.w,h.h,.9);}
   if(e.phase==='strike'&&e.ritualEffect==='void')for(const b of e.attackBoxes)effect('powers',7,b.x+b.w/2,b.y+b.h/2,b.w,b.h,.85);
   return true;
  }
  if(!FiaRitual.corrupted(e)||e.dead)return false;
  effect('powers',3,e.x+e.w/2,e.y+e.h*.5,e.w+70,e.h+35,.22);
  if(e.denResidentRole){const a=ART_FIA[e.denResidentRole==='shadowNinja'?'ninja':'thief'],p=e.windup>0?3:e.attackTime>0?4:e.recovery>0?5:Math.abs(e.walkSpeed)>1&&!reducedMotion.matches?1+Math.floor(e.animTime*8)%2:0;ctx.save();ctx.filter='hue-rotate(25deg) brightness(.82)';ArenaArt.stamp(a,p,e.x+e.w/2,e.y+e.h,100,e.face);ctx.restore();return true;}
  if(e.underworldHostileRole){const pose=e.windup>0?2:e.attackTime>0?3:Math.abs(e.walkSpeed)>1&&!reducedMotion.matches?1:0;stamp(ART_FIA_RITUAL.services[e.underworldHostileRole],pose,e.x+e.w/2,e.y+e.h,e.h,e.face);Visuals.healthBar(e);if(e.windup>0)BossCues.box({x:e.targetX-50,y:e.targetY-50,w:100,h:100},BossCues.color);return true;}
  return false;
 }
 function projectile(p){const index=kinds.indexOf(p.ritualEffect);if(index<0)return false;effect('powers',4+index,p.x,p.y,95,65,1,Math.atan2(p.vy,p.vx));return true;}
 function weapon(){
  if(weaponStyle!=='foxfireKatana'||!player||Prologue.active)return;
  // Attack art includes the relic blade and its native fox-shaped flame.
  if(attack<=0)FiaArt.effect('foxfire',0,player.x+player.w/2+player.face*24,player.y+player.h*.65,40,35,.16);
 }
 return Object.freeze({actors,scenery,actor,projectile,weapon,effect});
})();
