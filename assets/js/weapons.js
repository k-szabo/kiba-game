/* Starting loadouts: pure combat rules shared by selection, simulation and UI. */
'use strict';
const WeaponStyles=(()=>{
 const profiles=Object.freeze({
  katana:Object.freeze({tempo:.85,damage:1,reach:0,health:0,guardCooldown:0}),
  naginata:Object.freeze({tempo:1.3,damage:1.25,reach:55,health:0,guardCooldown:0}),
  swordShield:Object.freeze({tempo:1,damage:1,reach:0,health:2,guardCooldown:2})
 });
 const valid=id=>typeof id==='string'&&Object.hasOwn(profiles,id);
 function profile(id){if(!valid(id))throw new TypeError('Unknown weapon style');return profiles[id];}
 function attack(id,base){
  const p=profile(id);
  return {duration:base.duration*p.tempo,impact:base.impact*p.tempo,cooldown:base.cooldown*p.tempo,damageScale:base.damageScale*p.damage};
 }
 function hitbox(id,body,face){
  const width=125+profile(id).reach;
  return {x:face>0?body.x+20:body.x+20-width,y:body.y-14,w:width,h:105};
 }
 // Incoming direction is the push direction, opposite to the attacker's side.
 // Callers explicitly distinguish hazards; a direction alone never makes lava blockable.
 function guard(id,amount,{face,direction,grounded,attacking,dashing,cooldown,environmental=false}){
  const p=profile(id);
  const blocked=p.guardCooldown>0&&Number.isFinite(amount)&&amount>0&&!environmental&&
   grounded&&!attacking&&!dashing&&cooldown<=0&&Math.abs(face)===1&&direction===-face;
  return {damage:blocked?Math.max(0,amount-1):amount,cooldown:blocked?p.guardCooldown:cooldown,blocked};
 }
 return Object.freeze({ids:Object.freeze(Object.keys(profiles)),valid,profile,attack,hitbox,guard});
})();
