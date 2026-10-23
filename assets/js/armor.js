/* Shared mitigation rule for armored combatants; no equipment or save state. */
'use strict';
const Armor=(()=>{
 const K=100;
 const value=armor=>Number.isFinite(armor)&&armor>0?armor:0;
 function reduction(armor){const a=value(armor);return a/(a+K);}
 function damage(amount,armor=0){
  if(!Number.isFinite(amount)||amount<=0)return 0;
  // Calculate the retained share directly: subtracting reduction from one
  // loses small, valid damage at high armor. Do not round fractional hits.
  return amount*(K/(value(armor)+K));
 }
 return Object.freeze({K,reduction,damage});
})();
