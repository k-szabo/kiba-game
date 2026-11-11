/* Transient encounter state. A new attempt starts from the floor checkpoint. */
'use strict';
const NinjaDungeonEncounters=(()=>{
 const rules=Object.freeze({transformationRatio:.5,surrenderRatio:.1,ritualSeconds:90,lifeStealMultiplier:20});

 function begin(kind,maxHp){
  if(!['leader','sentinel','ritualist'].includes(kind)||!Number.isFinite(maxHp)||maxHp<=0)return null;
  return {kind,phase:kind==='leader'?'leader':kind,hp:maxHp,maxHp,
   remaining:kind==='ritualist'?rules.ritualSeconds:null};
 }

 function hit(attempt,damage){
  if(!attempt||!['leader','infected','sentinel','ritualist'].includes(attempt.phase)||
     !Number.isFinite(damage)||damage<=0)return attempt;
  const {phase,maxHp}=attempt;
  const threshold=phase==='leader'?maxHp*rules.transformationRatio:
   phase==='infected'?0:maxHp*rules.surrenderRatio;
  const hp=Math.max(threshold,attempt.hp-damage);
  if(hp>threshold)return {...attempt,hp};
  if(phase==='leader')return {...attempt,hp,phase:'transforming'};
  return {...attempt,hp,phase:'cleared'};
 }

 function finishTransformation(attempt){
  return attempt?.phase==='transforming'?{...attempt,phase:'infected'}:attempt;
 }

 function healFromHit(attempt,actualHpLost){
  if(attempt?.phase!=='infected'||!Number.isFinite(actualHpLost)||actualHpLost<=0)return attempt;
  const hp=Math.min(attempt.maxHp,attempt.hp+actualHpLost*rules.lifeStealMultiplier);
  return {...attempt,hp,phase:hp===attempt.maxHp?'failed':'infected'};
 }

 function tick(attempt,elapsed){
  if(attempt?.phase!=='ritualist'||!Number.isFinite(elapsed)||elapsed<=0)return attempt;
  const remaining=Math.max(0,attempt.remaining-elapsed);
  return {...attempt,remaining,phase:remaining===0?'failed':'ritualist'};
 }

 return Object.freeze({rules,begin,hit,finishTransformation,healFromHit,tick});
})();
