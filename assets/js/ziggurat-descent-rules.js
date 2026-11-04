/* Persistent main-story milestones; transient companion and combat state stay out of saves. */
'use strict';
const ZigguratDescentRules=(()=>{
 const progress=Object.freeze({accepted:'zigguratDescentAccepted',gate:'zigguratGateCleared',guardian:'guardian:VoidGatekeeper',arrived:'japanHeightsReached',completed:'zigguratReturnCompleted'});
 const known=Object.values(progress);
 const has=(flags,key)=>flags?.[3]?.includes(key)===true;
 const flagsValid=flags=>Array.isArray(flags)&&flags.length===4&&flags.every(list=>Array.isArray(list)&&list.every(id=>typeof id==='string')&&new Set(list).size===list.length);
 const eligible=(flags,defeated)=>flagsValid(flags)&&defeated?.[3]===true&&['hannahDefeated','guardian:Hannah','dawnblade'].every(id=>has(flags,id));
 function validate(flags,defeated){
  if(!flagsValid(flags))return false;
  if(known.some(id=>has(flags,id))&&!eligible(flags,defeated))return false;
  if(has(flags,progress.gate)!==has(flags,progress.guardian))return false;
  if(has(flags,progress.gate)&&!has(flags,progress.accepted))return false;
  if(has(flags,progress.arrived)&&!has(flags,progress.gate))return false;
  if(has(flags,progress.completed)&&!has(flags,progress.arrived))return false;
  return true;
 }
 function transition(flags,defeated,event){
  const result={ok:false,flags:flagsValid(flags)?flags.map(list=>[...list]):null,firstClear:false,reason:'invalidProgress'};
  if(!validate(flags,defeated)||!eligible(flags,defeated))return result;
  const prerequisite={accept:null,clearGate:progress.accepted,arrive:progress.gate,complete:progress.arrived};
  const added={accept:[progress.accepted],clearGate:[progress.gate,progress.guardian],arrive:[progress.arrived],complete:[progress.completed]};
  if(!Object.hasOwn(added,event)){result.reason='unknownEvent';return result;}
  if(prerequisite[event]&&!has(flags,prerequisite[event])){result.reason='missingPrerequisite';return result;}
  if(has(flags,added[event][0])){result.reason='alreadyCompleted';return result;}
  result.flags[3].push(...added[event]);result.ok=true;result.reason=null;result.firstClear=event==='clearGate';return result;
 }
 return Object.freeze({progress,eligible,validate,transition,accepted:flags=>has(flags,progress.accepted),gateCleared:flags=>has(flags,progress.gate),arrived:flags=>has(flags,progress.arrived),completed:flags=>has(flags,progress.completed)});
})();
