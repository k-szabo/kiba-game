/* Pure permanent ritual history. Combat, actors and escape routing belong to controllers. */
'use strict';
const FiaRitualRules=(()=>{
 const progress=Object.freeze({accepted:'fiaRitualAccepted',white:'fiaWhiteCalled',red:'fiaRedCalled',sacrificed:'fiaAttendantsSacrificed',completed:'fiaRitualCompleted',weapon:'foxfireKatana',escaped:'fiaEscapeCompleted'});
 const rewards=Object.freeze({xp:1800,points:1});
 const relics=Object.freeze(['fiaTalismanCompleted','fiaDragonCompleted','demonLordHeartGiven','fiaVoidCompleted']);
 const victory=Object.freeze(['fiaSlain','fiaRewardClaimed','kitsuneSoul','kibaShield']);
 const managed=Object.freeze(Object.values(progress));
 const watched=Object.freeze([...relics,...managed,...victory,'fiaMissed']);
 const structure=flags=>Array.isArray(flags)&&flags.length===4&&Array.from(flags).every(list=>Array.isArray(list)&&Array.from(list).every(id=>typeof id==='string')&&new Set(list).size===list.length);
 const has=(flags,id)=>flags[3].includes(id);
 function validate(flags){
  if(!structure(flags)||flags.slice(0,3).some(list=>managed.some(id=>list.includes(id))))return false;
  const accepted=has(flags,progress.accepted),white=has(flags,progress.white),red=has(flags,progress.red),sacrificed=has(flags,progress.sacrificed),completed=has(flags,progress.completed);
  if(managed.slice(1).some(id=>has(flags,id))&&!accepted)return false;
  if(accepted&&(!relics.every(id=>has(flags,id))||has(flags,'fiaMissed')))return false;
  if(sacrificed&&(!white||!red)||completed&&(!sacrificed||!victory.every(id=>has(flags,id))))return false;
  if(has(flags,progress.weapon)!==completed||has(flags,progress.escaped)&&!completed)return false;
  return true;
 }
 const copy=flags=>structure(flags)?flags.map(list=>[...list]):null;
 // Capture this before opening a choice; pass it with the CURRENT flags when
 // resolving that choice. It detects changed relevant history, not wall time.
 const token=flags=>validate(flags)?'fia-ritual:'+watched.map(id=>has(flags,id)?'1':'0').join(''):null;
 function transaction(flags,expected){
  const result={ok:false,flags:copy(flags),rewards:{xp:0,points:0},reason:null};
  if(!validate(flags))result.reason='invalidProgress';
  else if(expected!==undefined&&expected!==token(flags))result.reason='staleProgress';
  return result;
 }
 function fail(result,reason){result.reason=reason;return result;}
 function success(result,id){result.flags[3].push(id);result.ok=true;return result;}
 const living=flags=>!has(flags,'fiaSlain')&&!has(flags,'fiaMissed');
 function accept(flags,expected){
  const result=transaction(flags,expected);if(result.reason)return result;
  if(has(flags,progress.accepted))return fail(result,'alreadyAccepted');
  if(!relics.every(id=>has(flags,id))||!living(flags)||victory.some(id=>has(flags,id)))return fail(result,'questUnavailable');
  return success(result,progress.accepted);
 }
 function callAttendant(flags,colour,expected){
  const result=transaction(flags,expected);if(result.reason)return result;
  if(!['white','red'].includes(colour))return fail(result,'invalidAttendant');
  if(!living(flags)||!has(flags,progress.accepted)||has(flags,progress.sacrificed))return fail(result,'questUnavailable');
  if(has(flags,progress[colour]))return fail(result,'alreadyCalled');
  return success(result,progress[colour]);
 }
 function sacrifice(flags,expected){
  const result=transaction(flags,expected);if(result.reason)return result;
  if(has(flags,progress.sacrificed))return fail(result,'alreadySacrificed');
  if(!living(flags)||!has(flags,progress.white)||!has(flags,progress.red))return fail(result,'questUnavailable');
  return success(result,progress.sacrificed);
 }
 function win(flags,expected){
  const result=transaction(flags,expected);if(result.reason)return result;
  if(has(flags,progress.completed))return fail(result,'alreadyCompleted');
  if(!living(flags)||!has(flags,progress.sacrificed))return fail(result,'questUnavailable');
  if(victory.some(id=>has(flags,id)))return fail(result,'rewardAlreadyClaimed');
  result.flags[3].push(...victory,progress.completed,progress.weapon);result.rewards={...rewards};result.ok=true;return result;
 }
 function escape(flags,expected){
  const result=transaction(flags,expected);if(result.reason)return result;
  if(has(flags,progress.escaped))return fail(result,'alreadyEscaped');
  if(!has(flags,progress.completed))return fail(result,'questUnavailable');
  return success(result,progress.escaped);
 }
 const pendingEscape=flags=>validate(flags)&&has(flags,progress.completed)&&!has(flags,progress.escaped);
 return Object.freeze({progress,rewards,relics,victory,validate,copy,token,accept,callAttendant,sacrifice,win,escape,pendingEscape});
})();
