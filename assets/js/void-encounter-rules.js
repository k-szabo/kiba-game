/* Pure, transient void encounter rules. Controllers own actors and clocks. */
'use strict';
const VoidEncounterRules=(()=>{
 const tuning=Object.freeze({lieutenantMaxHp:BossCatalog.story('voidLieutenant').hp,absorptionRatio:BossCatalog.story('voidLieutenant').absorptionRatio,demonMaxHp:BossCatalog.story('voidDemon').hp,demonInitialHp:BossCatalog.story('voidDemon').initialHp,lifeStealMultiplier:BossCatalog.story('voidDemon').lifeStealMultiplier});
 const fields=Object.freeze(['attempt','generation','phase','hp','maxHp','gateConsumed','won','failed']);
 const positiveInteger=value=>Number.isSafeInteger(value)&&value>0;
 const amount=value=>Number.isFinite(value)&&value>0&&value<=Number.MAX_SAFE_INTEGER;
 const exact=(value,keys)=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
 const threshold=tuning.lieutenantMaxHp*tuning.absorptionRatio;
 function valid(state){
  if(!exact(state,fields)||!positiveInteger(state.attempt)||!Number.isFinite(state.hp)||typeof state.gateConsumed!=='boolean'||typeof state.won!=='boolean'||typeof state.failed!=='boolean')return false;
  if(state.phase==='lieutenant')return state.generation===1&&state.maxHp===tuning.lieutenantMaxHp&&state.hp>threshold&&state.hp<=state.maxHp&&!state.gateConsumed&&!state.won&&!state.failed;
  if(state.phase==='absorbing')return state.generation===1&&state.maxHp===tuning.lieutenantMaxHp&&state.hp===threshold&&state.gateConsumed&&!state.won&&!state.failed;
  if(state.generation!==2||state.maxHp!==tuning.demonMaxHp||!state.gateConsumed)return false;
  if(state.phase==='demon')return state.hp>0&&state.hp<state.maxHp&&!state.won&&!state.failed;
  if(state.phase==='victory')return state.hp===0&&state.won&&!state.failed;
  if(state.phase==='overwhelmed')return state.hp===state.maxHp&&!state.won&&state.failed;
  return false;
 }
 function fresh(attempt){return positiveInteger(attempt)?{attempt,generation:1,phase:'lieutenant',hp:tuning.lieutenantMaxHp,maxHp:tuning.lieutenantMaxHp,gateConsumed:false,won:false,failed:false}:null;}
 const copy=state=>valid(state)?{...state}:null;
 const token=state=>valid(state)?Object.freeze({attempt:state.attempt,generation:state.generation}):null;
 const owns=(state,owner)=>exact(owner,['attempt','generation'])&&owner.attempt===state.attempt&&owner.generation===state.generation;
 function transaction(state){return {ok:false,state:copy(state),event:null,damage:0,healed:0,reason:valid(state)?null:'invalidState'};}
 function fail(result,reason){result.reason=reason;return result;}
 function success(result,event=null){result.ok=true;result.event=event;return result;}
 function hit(state,damage,owner=token(state)){
  const result=transaction(state);if(result.reason)return result;
  if(!owns(state,owner))return fail(result,'staleOwner');
  if(!amount(damage))return fail(result,'invalidAmount');
  if(!['lieutenant','demon'].includes(state.phase))return fail(result,'notLive');
  const floor=state.phase==='lieutenant'?threshold:0;
  result.state.hp=Math.max(floor,state.hp-Math.min(damage,state.hp));result.damage=state.hp-result.state.hp;
  if(state.phase==='lieutenant'&&result.state.hp===threshold){
   result.state.phase='absorbing';result.state.gateConsumed=true;return success(result,'absorb');
  }
  if(state.phase==='demon'&&result.state.hp===0){result.state.phase='victory';result.state.won=true;return success(result,'victory');}
  return success(result);
 }
 function emerge(state,owner=token(state)){
  const result=transaction(state);if(result.reason)return result;
  if(!owns(state,owner))return fail(result,'staleOwner');
  if(state.phase!=='absorbing')return fail(result,'notAbsorbing');
  Object.assign(result.state,{generation:state.generation+1,phase:'demon',hp:tuning.demonInitialHp,maxHp:tuning.demonMaxHp});
  return success(result,'emerge');
 }
 function heal(state,actualHpLoss,owner){
  const result=transaction(state);if(result.reason)return result;
  // A controller must pass the captured attack owner, not obtain a fresh token
  // at impact time. Old lieutenant/projectile and previous-attempt owners fail.
  if(!owns(state,owner))return fail(result,'staleOwner');
  if(!amount(actualHpLoss))return fail(result,'invalidAmount');
  if(state.phase!=='demon')return fail(result,'notLive');
  result.healed=Math.min(state.maxHp-state.hp,actualHpLoss*tuning.lifeStealMultiplier);result.state.hp=state.hp+result.healed;
  if(result.state.hp===state.maxHp){result.state.phase='overwhelmed';result.state.failed=true;return success(result,'overwhelmed');}
  return success(result);
 }
 return Object.freeze({tuning,fresh,valid,copy,token,hit,emerge,heal});
})();
