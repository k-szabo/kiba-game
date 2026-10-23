/* Actor equipment mutation shared by journey choice and developer tools.
 * Future purchases can equip registered profiles through this same path. */
'use strict';
const WeaponEquipment=(()=>{
 function equip(id){
  if(!WeaponStyles.valid(id)||!player||player.hp<=0)return false;
  if(Prologue.active&&!DevSession.active&&id!=='katana')return false;
  if(weaponStyle===id)return true;
  const recovery=attack>0?playerAttackProfile().cooldown:0;
  weaponStyle=id;
  player.maxHp=momoStats().maxHp;
  // Equipping extra health capacity must never become repeatable healing.
  player.hp=Math.min(player.hp,player.maxHp);
  player.guardCooldown=Math.max(player.guardCooldown||0,WeaponStyles.profile(id).guardCooldown);
  attackCooldown=Math.max(attackCooldown,recovery);
  attack=0;attackElapsed=0;attackHit=false;attackKind='normal';attackFace=player.face;
  updateHUD();return true;
 }
 return Object.freeze({equip});
})();
