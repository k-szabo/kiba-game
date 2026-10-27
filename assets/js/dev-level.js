'use strict';
const DevLevel=(()=>{
 const available=()=>DevSession.active&&!!player;
 function setLevel(values){
  if(!available()||state!=='developer'||!DevTools.isOpen)return false;
  const raw=String(values?.level??'');
  if(!/^\d+$/.test(raw))return false;
  const target=Number(raw);if(!Number.isSafeInteger(target)||target<1||target>LEVEL_LIMIT)return false;
  let totalXp=0;for(let n=1;n<target;n++)totalXp+=xpForLevel(n);
  // Preserve affordable allocations and refund the remainder through the
  // same budget normalization used by ordinary progression.
  progression=normalizeProgression({level:target,xp:0,totalXp,stats:progression.stats},flags);
  player.maxHp=momoStats().maxHp;player.hp=Math.max(1,Math.min(player.hp,player.maxHp));
  FiaConflict.clampProfile();
  updateHUD();return true;
 }
 function init(){DevTools.register({id:'player-level',labelKey:'dev.level.set',available,
  fields:()=>[{id:'level',type:'number',labelKey:'dev.level',value:player?progression.level:1,min:1,max:LEVEL_LIMIT}],run:setLevel});}
 return Object.freeze({init,setLevel});
})();
