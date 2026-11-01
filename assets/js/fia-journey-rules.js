/* Fia's later journey: pure, copy-on-write progress shared with save validation.
 * Run completion and permanent reward history are deliberately independent. */
'use strict';
const FiaJourneyRules=(()=>{
 const progress=Object.freeze({accepted:'fiaDragonAccepted',firstClear:'dragonRaidFirstClear',eyes:'dragonEyes',completed:'fiaDragonCompleted',voidAccepted:'fiaVoidAccepted',voidDefeated:'voidDemonDefeated',crystal:'rawVoidCrystal',voidCompleted:'fiaVoidCompleted',trader:'underworldTraderMet',cook:'underworldCookMet',smith:'underworldSmithMet'});
 const rewards=Object.freeze({raidXP:900,firstClearPoints:1,questXP:800,questPoints:1});
 const integer=value=>Number.isSafeInteger(value)&&value>=0;
 const exact=(data,keys)=>!!data&&typeof data==='object'&&!Array.isArray(data)&&Object.keys(data).length===keys.length&&keys.every(key=>Object.hasOwn(data,key));
 const fresh=()=>({dragon:{run:0,clear:false},dragonScales:0,voidInfection:0});
 function structure(data){return exact(data,['dragon','dragonScales','voidInfection'])&&exact(data.dragon,['run','clear'])&&integer(data.dragon.run)&&typeof data.dragon.clear==='boolean'&&integer(data.dragonScales)&&[0,10].includes(data.voidInfection);}
 function copy(data){return structure(data)?{dragon:{...data.dragon},dragonScales:data.dragonScales,voidInfection:data.voidInfection}:null;}
 const validFlags=flags=>Array.isArray(flags)&&flags.every(list=>Array.isArray(list)&&list.every(id=>typeof id==='string')&&new Set(list).size===list.length);
 const has=(flags,id)=>flags[3]?.includes(id)===true;
 const raidAvailable=(flags,defeated)=>Array.isArray(defeated)&&defeated[3]===true&&has(flags,'hannahDefeated');
 function validate(data,flags=[],defeated=[]){
  if(!structure(data)||!validFlags(flags)||!Array.isArray(defeated)||defeated.some(value=>typeof value!=='boolean'))return false;
  const accepted=has(flags,progress.accepted),first=has(flags,progress.firstClear),eyes=has(flags,progress.eyes),completed=has(flags,progress.completed);
  if((data.dragon.run>0||accepted||first||eyes||completed)&&!raidAvailable(flags,defeated))return false;
  if(accepted&&!has(flags,'fiaTalismanCompleted')||first&&data.dragon.run===0||data.dragon.clear&&!first)return false;
  if(eyes&&(!accepted||!first)||completed&&(!accepted||!eyes))return false;
  if(data.dragonScales>data.dragon.run||data.dragonScales>0&&!first||data.dragon.run===0&&data.dragon.clear)return false;
  const voidAccepted=has(flags,progress.voidAccepted),voidDefeated=has(flags,progress.voidDefeated),crystal=has(flags,progress.crystal),voidCompleted=has(flags,progress.voidCompleted);
  if(voidAccepted&&!completed||voidDefeated&&!voidAccepted||crystal!==voidDefeated||voidCompleted&&!crystal)return false;
  if((data.voidInfection===10)!==voidDefeated)return false;
  if(['trader','cook','smith'].some(key=>has(flags,progress[key])&&!voidAccepted))return false;
  return true;
 }
 function transaction(data,flags,defeated){return {ok:false,state:copy(data),flags:validFlags(flags)?flags.map(list=>[...list]):null,rewards:{xp:0,points:0,dragonScales:0},reason:validate(data,flags,defeated)?null:'invalidProgress'};}
 function fail(result,reason){result.reason=reason;return result;}
 function success(result){result.ok=true;return result;}
 function accept(data,flags,defeated){
  const result=transaction(data,flags,defeated);if(result.reason)return result;
  if(!raidAvailable(flags,defeated)||!has(flags,'fiaTalismanCompleted')||has(flags,'fiaSlain')||has(flags,'fiaMissed'))return fail(result,'questUnavailable');
  if(has(flags,progress.accepted))return fail(result,'alreadyAccepted');
  result.flags[3].push(progress.accepted);return success(result);
 }
 function begin(data,flags,defeated){
  const result=transaction(data,flags,defeated);if(result.reason)return result;
  if(!raidAvailable(flags,defeated))return fail(result,'raidUnavailable');
  if(data.dragon.run===Number.MAX_SAFE_INTEGER)return fail(result,'runOverflow');
  result.state.dragon={run:data.dragon.run+1,clear:false};return success(result);
 }
 function clear(data,flags,defeated,expectedRun){
  const result=transaction(data,flags,defeated);if(result.reason)return result;
  if(!integer(expectedRun)||expectedRun===0||expectedRun!==data.dragon.run)return fail(result,'staleRun');
  if(data.dragon.clear)return fail(result,'alreadyCleared');
  if(data.dragonScales===Number.MAX_SAFE_INTEGER)return fail(result,'stockOverflow');
  result.state.dragon.clear=true;result.state.dragonScales++;result.rewards={xp:rewards.raidXP,points:0,dragonScales:1};
  if(!has(flags,progress.firstClear)){result.flags[3].push(progress.firstClear);result.rewards.points=rewards.firstClearPoints;}
  if(has(flags,progress.accepted)&&!has(flags,progress.completed)&&!has(flags,progress.eyes)&&!has(flags,'fiaSlain'))result.flags[3].push(progress.eyes);
  return success(result);
 }
 function handIn(data,flags,defeated){
  const result=transaction(data,flags,defeated);if(result.reason)return result;
  if(has(flags,progress.completed))return fail(result,'alreadyCompleted');
  if(!has(flags,progress.eyes)||has(flags,'fiaSlain')||has(flags,'fiaMissed'))return fail(result,'questUnavailable');
  result.flags[3].push(progress.completed);result.rewards={xp:rewards.questXP,points:rewards.questPoints,dragonScales:0};return success(result);
 }
 const quantity=data=>structure(data)?data.dragonScales:0;
 const holdsEyes=flags=>validFlags(flags)&&has(flags,progress.eyes)&&!has(flags,progress.completed);
 function acceptVoid(data,flags,defeated){
  const result=transaction(data,flags,defeated);if(result.reason)return result;
  if(!has(flags,progress.completed)||has(flags,'fiaSlain')||has(flags,'fiaMissed'))return fail(result,'questUnavailable');
  if(has(flags,progress.voidAccepted))return fail(result,'alreadyAccepted');
  result.flags[3].push(progress.voidAccepted);return success(result);
 }
 function defeatVoid(data,flags,defeated){
  const result=transaction(data,flags,defeated);if(result.reason)return result;
  if(!has(flags,progress.voidAccepted)||has(flags,'fiaSlain'))return fail(result,'questUnavailable');
  if(has(flags,progress.voidDefeated))return fail(result,'alreadyDefeated');
  result.flags[3].push(progress.voidDefeated,progress.crystal);result.state.voidInfection=10;return success(result);
 }
 function handInVoid(data,flags,defeated){
  const result=transaction(data,flags,defeated);if(result.reason)return result;
  if(has(flags,progress.voidCompleted))return fail(result,'alreadyCompleted');
  if(!has(flags,progress.crystal)||has(flags,'fiaSlain'))return fail(result,'questUnavailable');
  result.flags[3].push(progress.voidCompleted);result.rewards={xp:1000,points:1,dragonScales:0,chicken:3};return success(result);
 }
 function meetService(data,flags,defeated,service){
  const result=transaction(data,flags,defeated);if(result.reason)return result;
  if(!['trader','cook','smith'].includes(service)||!has(flags,progress.voidAccepted)||has(flags,'fiaSlain'))return fail(result,'serviceUnavailable');
  if(has(flags,progress[service]))return fail(result,'alreadyMet');
  result.flags[3].push(progress[service]);return success(result);
 }
 return Object.freeze({progress,rewards,fresh,structure,copy,validate,accept,begin,clear,handIn,quantity,holdsEyes,acceptVoid,defeatVoid,handInVoid,meetService});
})();
