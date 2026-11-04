/* Shared faction profiles and releases; patrol, targeting and timers stay in combat.js. */
'use strict';
const ShadowNinjas=(()=>{
 const profiles=Object.freeze(Object.fromEntries(Object.entries({
  crossbow:{hp:100,damage:3,xp:65,speed:1.35,windup:.7,cooldown:1.9,recovery:.4},
  shuriken:{hp:90,damage:2,xp:65,speed:1.65,windup:.65,cooldown:2.1,recovery:.45},
  ninjutsu:{hp:85,damage:3,xp:75,speed:1.3,windup:.95,cooldown:2.8,recovery:.6},
  assassin:{hp:120,damage:4,xp:75,speed:1.85,windup:.6,cooldown:1.5,recovery:.45}
 }).map(([key,p])=>[key,Object.freeze({...p,w:46,h:82})])));
 const profile=e=>e&&Object.hasOwn(profiles,e.shadowNinjaRole)?profiles[e.shadowNinjaRole]:null;
 function release(e){
  const p=profile(e);if(!p)return false;
  e.attackTime=e.attackDuration;e.attackElapsed=0;e.recovery=p.recovery;e.cd=p.cooldown;
  const x=e.x+e.w/2,y=e.y+e.h*.35,angle=Math.atan2(e.targetY-y,e.targetX-x);
  function shot(offset,speed,kind,color){
   shoot(x,y,Math.cos(angle+offset)*speed,Math.sin(angle+offset)*speed,color,3.5,kind);
   Object.assign(projectiles.at(-1),{source:'shadow-ninja',damage:e.damageValue,radius:kind==='ninjaStar'?8:7});
  }
  if(e.shadowNinjaRole==='crossbow')shot(0,560,'arrow','#d5c7a8');
  else if(e.shadowNinjaRole==='shuriken')for(const offset of [-.13,0,.13])shot(offset,420,'ninjaStar','#c6d8d8');
  else if(e.shadowNinjaRole==='ninjutsu')for(const offset of [-.16,.16])shot(offset,280,'shadowBolt','#baa1e3');
  else if(overlap(player,enemyMeleeBox(e)))damage(e.damageValue,e.face,true);
  return true;
 }
 function projectile(p){
  if(p.kind!=='ninjaStar')return false;
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(reducedMotion.matches?0:time*12);
  ctx.fillStyle='#c6d8d8';ctx.strokeStyle='#24313b';ctx.lineWidth=1.5;ctx.beginPath();
  for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?3:12;ctx[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r);}
  ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#24313b';ctx.beginPath();ctx.arc(0,0,2,0,Math.PI*2);ctx.fill();ctx.restore();return true;
 }
 return Object.freeze({profiles,profile,release,projectile});
})();
