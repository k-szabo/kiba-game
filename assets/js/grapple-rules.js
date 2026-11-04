/* Geometry only. Input, rendering and transient ownership belong to the caller. */
'use strict';
const GrappleRules=(()=>{
 const range=900,speed=1100;
 const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
 function rayBox(from,to,box){
  if(!finite(from)||!finite(to)||!finite(box)||!Number.isFinite(box.w)||!Number.isFinite(box.h)||box.w<=0||box.h<=0)return null;
  let enter=0,leave=1;
  for(const [axis,size]of [['x','w'],['y','h']]){
   const delta=to[axis]-from[axis],low=box[axis],high=low+box[size];
   if(Math.abs(delta)<1e-9){if(from[axis]<low||from[axis]>high)return null;continue;}
   const a=(low-from[axis])/delta,b=(high-from[axis])/delta;
   enter=Math.max(enter,Math.min(a,b));leave=Math.min(leave,Math.max(a,b));
   if(enter>leave)return null;
  }
  return {t:enter,x:from.x+(to.x-from.x)*enter,y:from.y+(to.y-from.y)*enter};
 }
 function pullable(enemy){
  return !!enemy&&enemy.grappleable===true&&Number.isFinite(enemy.w)&&Number.isFinite(enemy.h)&&enemy.w>0&&enemy.w<=96&&enemy.h>0&&enemy.h<=110&&!enemy.dead&&!enemy.miniboss&&!enemy.boss&&!enemy.guardian&&!enemy.serpentType&&!enemy.serpent;
 }
 function target(from,face,{terrain=[],anchors=[],enemies=[]}={}){
  if(!finite(from)||(face!==1&&face!==-1))return null;
  function candidate(item,type){
   if(!finite(item)||!Number.isFinite(item.w)||!Number.isFinite(item.h)||item.w<=0||item.h<=0)return null;
   const point={x:item.x+item.w/2,y:item.y+item.h/2},dx=point.x-from.x,dy=point.y-from.y,distance=Math.hypot(dx,dy);
   if(dx*face<=0||distance>range||distance<1||type==='enemy'&&Math.abs(dy)>80)return null;
   if(terrain.some(p=>p&&!p.broken&&(()=>{const hit=rayBox(from,point,p);return hit&&hit.t<1-1e-6;})()))return null;
   return {...point,type,id:item.id,distance};
  }
  // Fixed-point aiming is independent of the locked mouse. In the horizontal
  // combat lane the first visible small enemy wins; otherwise highlight a ring.
  const foes=enemies.filter(pullable).map(e=>candidate(e,'enemy')).filter(Boolean).sort((a,b)=>Math.abs(a.x-from.x)-Math.abs(b.x-from.x));
  if(foes.length)return foes[0];
  return anchors.filter(a=>a&&!a.disabled).map(a=>candidate(a,'anchor')).filter(Boolean).sort((a,b)=>a.distance-b.distance)[0]||null;
 }
 function move(body,destination,dt,terrain=[]){
  if(!finite(body)||!finite(destination)||!Number.isFinite(body.w)||!Number.isFinite(body.h)||body.w<=0||body.h<=0||!Number.isFinite(dt)||dt<=0)return null;
  const center={x:body.x+body.w/2,y:body.y+body.h/2},dx=destination.x-center.x,dy=destination.y-center.y,distance=Math.hypot(dx,dy);
  if(distance<1)return {x:body.x,y:body.y,done:true,blocked:false};
  const fraction=Math.min(1,speed*dt/distance),to={x:center.x+dx*fraction,y:center.y+dy*fraction};
  let stop=1,blocked=false;
  for(const p of terrain){
   if(!p||p.broken)continue;
   // Minkowski expansion sweeps the full actor, including at low frame rates.
   const box={x:p.x-body.w/2,y:p.y-body.h/2,w:p.w+body.w,h:p.h+body.h};
   const hit=rayBox(center,to,box);if(!hit)continue;
   // A body touching a floor may travel away from it without sticking.
   if(hit.t===0){const inside=point=>point.x>box.x+1e-5&&point.x<box.x+box.w-1e-5&&point.y>box.y+1e-5&&point.y<box.y+box.h-1e-5;if(!inside(to))continue;}
   stop=Math.min(stop,Math.max(0,hit.t-1e-5));blocked=true;
  }
  return {x:center.x+(to.x-center.x)*stop-body.w/2,y:center.y+(to.y-center.y)*stop-body.h/2,done:blocked||fraction===1,blocked};
 }
 return Object.freeze({range,speed,rayBox,pullable,target,move});
})();
