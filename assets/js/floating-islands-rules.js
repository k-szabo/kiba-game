/* Additive Japan story flags; kidnapping is not a boss kill or repeat reward. */
'use strict';
const FloatingIslandsRules=(()=>{
 const progress=Object.freeze({escaped:'islandsAmbushEscaped',abducted:'haruAbducted',hook:'grapplingHook',trail:'islandsTrailReached'});
 const has=(flags,key)=>flags?.[0]?.includes(key)===true;
 const validShape=flags=>Array.isArray(flags)&&flags.length===4&&flags.every(list=>Array.isArray(list)&&list.every(id=>typeof id==='string')&&new Set(list).size===list.length);
 const eligible=flags=>validShape(flags)&&flags[3].includes('zigguratReturnCompleted');
 function validate(flags){
  if(!validShape(flags))return false;
  if(Object.values(progress).some(id=>has(flags,id))&&!eligible(flags))return false;
  if(has(flags,progress.escaped)!==has(flags,progress.abducted))return false;
  if(has(flags,progress.hook)&&!has(flags,progress.escaped))return false;
  return !has(flags,progress.trail)||has(flags,progress.hook);
 }
 function transition(flags,event){
  const result={ok:false,flags:validShape(flags)?flags.map(list=>[...list]):null};
  if(!validate(flags)||!eligible(flags))return result;
  const rules={escape:{requires:null,adds:[progress.escaped,progress.abducted]},takeHook:{requires:progress.escaped,adds:[progress.hook]},reachTrail:{requires:progress.hook,adds:[progress.trail]}};
  const rule=Object.hasOwn(rules,event)?rules[event]:null;
  if(!rule||rule.requires&&!has(flags,rule.requires)||rule.adds.some(id=>has(flags,id)))return result;
  result.flags[0].push(...rule.adds);result.ok=true;return result;
 }
 const shouldEscape=(hp,maxHp)=>Number.isFinite(hp)&&Number.isFinite(maxHp)&&maxHp>0&&hp<=maxHp*.7;
 return Object.freeze({progress,eligible,validate,transition,shouldEscape,abducted:flags=>has(flags,progress.abducted),hookOwned:flags=>has(flags,progress.hook)});
})();
