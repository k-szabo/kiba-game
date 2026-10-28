/* Pure final-encounter rules; controllers own clocks, scenes and persistence. */
'use strict';
const HannahRules=(()=>{
 const gate=(id,ratio)=>Object.freeze({id,ratio});
 const tuning=Object.freeze({
  phase1:Object.freeze({maxHp:1200,gates:Object.freeze([gate('transform',.1)])}),
  phase2:Object.freeze({maxHp:1600,gates:Object.freeze([gate('drain60',.6),gate('drain40',.4),gate('rescue',.1)])}),
  drain:Object.freeze({duration:8,interruptMultiplier:6,interruptMinimum:12,haruMaxHp:50,haruPerSecond:4}),
  ultimate:Object.freeze({damageMultiplier:8,cooldown:60,recoil:10,recoilFloor:1})
 });
 const progress=Object.freeze({awakening:'dawnblade',defeated:'hannahDefeated',fiaRescue:'hannahFiaRescue'});
 const positive=value=>Number.isFinite(value)&&value>0;
 const profile=stage=>stage===1?tuning.phase1:stage===2?tuning.phase2:null;
 // gateIndex counts consumed gates in this stage. The caller starts stage 2 at
 // zero after its full heal. Healing never rewinds this index.
 function planHit(state,amount){
  const spec=profile(state?.stage),index=state?.gateIndex??0;
  const result={ok:false,hp:state?.hp??null,damage:0,gate:null,gateIndex:index};
  if(!spec||!positive(state.hp)||state.hp>spec.maxHp||!positive(amount)||!Number.isInteger(index)||index<0||index>spec.gates.length||state.draining!==undefined&&typeof state.draining!=='boolean')return result;
  result.ok=true;
  const next=spec.gates[index];
  // Once the last story gate is consumed, ordinary damage must not complete
  // the encounter. The controller alone authorizes the ultimate finisher.
  if(!next)return result;
  const floor=spec.maxHp*next.ratio;
  result.hp=Math.max(Math.min(state.hp,floor),state.hp-amount);
  result.damage=state.hp-result.hp;
  if(result.hp<=floor&&!state.draining){result.gate=next.id;result.gateIndex=index+1;}
  return result;
 }
 function eligibleFia(flags){
  return Array.isArray(flags)&&['fiaRescued','arenaChampion','fiaTalismanCompleted'].every(id=>flags.includes(id))&&!['fiaSlain','fiaMissed'].some(id=>flags.includes(id));
 }
 function ultimateDamage(base){const amount=base*tuning.ultimate.damageMultiplier;return positive(base)&&Number.isFinite(amount)?amount:0;}
 function drainThreshold(base){const amount=base*tuning.drain.interruptMultiplier;return positive(base)&&Number.isFinite(amount)?Math.max(tuning.drain.interruptMinimum,amount):null;}
 function recoil(hp){return positive(hp)?Math.max(tuning.ultimate.recoilFloor,hp-tuning.ultimate.recoil):null;}
 return Object.freeze({tuning,progress,planHit,eligibleFia,ultimateDamage,drainThreshold,recoil});
})();
