/* Additive Japan milestones. Encounter clocks and balloon damage are transient. */
'use strict';
const WatchtowerBalloonRules=(()=>{
 const progress=Object.freeze({jailer:'watchtowerJailerDefeated',key:'watchtowerCellKey',rescued:'westheruRescued',sentinel:'watchtowerSentinelEscaped',boarded:'balloonJourneyStarted',wasps:'balloonWaspsCleared',dragon:'balloonDragonDefeated',restored:'westheruRestored',arrived:'balloonVortexArrived',departed:'westheruDeparted'});
 const has=(flags,key)=>flags?.[0]?.includes(key)===true;
 const eligible=flags=>FloatingIslandsRules.validate(flags)&&has(flags,FloatingIslandsRules.progress.trail);
 const sequence=Object.freeze([
  {event:'defeatJailer',requires:null,adds:[progress.jailer,progress.key]},
  {event:'rescueWestheru',requires:progress.key,adds:[progress.rescued]},
  {event:'escapeSentinel',requires:progress.rescued,adds:[progress.sentinel]},
  {event:'board',requires:progress.sentinel,adds:[progress.boarded]},
  {event:'clearWasps',requires:progress.boarded,adds:[progress.wasps]},
  {event:'defeatDragon',requires:progress.wasps,adds:[progress.dragon]},
  {event:'restoreWestheru',requires:progress.dragon,adds:[progress.restored]},
  {event:'arrive',requires:progress.restored,adds:[progress.arrived]},
  {event:'depart',requires:progress.arrived,adds:[progress.departed]}
 ].map(rule=>Object.freeze({...rule,adds:Object.freeze(rule.adds)})));
 function validate(flags){
  if(!FloatingIslandsRules.validate(flags))return false;
  if(Object.values(progress).some(id=>has(flags,id))&&!eligible(flags))return false;
  if(has(flags,progress.jailer)!==has(flags,progress.key))return false;
  return sequence.every(rule=>!rule.adds.some(id=>has(flags,id))||!rule.requires||has(flags,rule.requires));
 }
 function transition(flags,event){
  const result={ok:false,flags:Array.isArray(flags)&&flags.every(Array.isArray)?flags.map(list=>[...list]):null};
  if(!validate(flags)||!eligible(flags))return result;
  const rule=sequence.find(rule=>rule.event===event);
  if(!rule||rule.requires&&!has(flags,rule.requires)||rule.adds.some(id=>has(flags,id)))return result;
  result.flags[0].push(...rule.adds);result.ok=true;return result;
 }
 function journeyStage(flags){
  if(!validate(flags)||!has(flags,progress.boarded))return null;
  return has(flags,progress.arrived)?'complete':has(flags,progress.restored)?'portal':has(flags,progress.dragon)?'westheru':has(flags,progress.wasps)?'dragon':'wasps';
 }
 function restart(flags,maxHp){
  const stage=journeyStage(flags);
  return stage&&Number.isFinite(maxHp)&&maxHp>0?{stage,hp:maxHp,maxHp,elapsed:0,failed:false}:null;
 }
 const validEncounter=s=>s&&['wasps','dragon','westheru','portal','complete'].includes(s.stage)&&Number.isFinite(s.maxHp)&&s.maxHp>0&&Number.isFinite(s.hp)&&s.hp>=0&&s.hp<=s.maxHp&&Number.isFinite(s.elapsed)&&s.elapsed>=0&&typeof s.failed==='boolean'&&s.failed===(s.hp===0);
 function tick(encounter,dt,active){
  if(!validEncounter(encounter)||!Number.isFinite(dt)||dt<0)return null;
  return {...encounter,elapsed:encounter.elapsed+(active===true&&!encounter.failed&&encounter.stage!=='complete'?dt:0)};
 }
 function damageBalloon(encounter,amount){
  if(!validEncounter(encounter)||!Number.isFinite(amount)||amount<0)return null;
  if(encounter.stage!=='dragon'||encounter.failed)return {...encounter};
  const hp=Math.max(0,encounter.hp-amount);
  return {...encounter,hp,failed:hp===0};
 }
 const shouldEscape=(hp,maxHp)=>Number.isFinite(hp)&&Number.isFinite(maxHp)&&maxHp>0&&hp<=maxHp*.7;
 return Object.freeze({progress,eligible,validate,transition,journeyStage,restart,tick,damageBalloon,shouldEscape});
})();
