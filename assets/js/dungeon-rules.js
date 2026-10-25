/* Pure dungeon inventory/run rules, shared by runtime and strict save validation.
 * World flags own current-floor progress and permanent first-clear rewards.
 * Transactions validate structure only; their caller commits flags and state together. */
'use strict';
const DungeonRules=(()=>{
 const items=Object.freeze({dungeonSeal:null,weaponEnhancement:'weapon',armorEnhancement:'armor',spiritEnhancement:'spirit'});
 const enhancements=Object.freeze(Object.keys(items).filter(id=>items[id]!==null)),boostKeys=Object.freeze(['weapon','armor','spirit']);
 const fields=Object.freeze(['run','roll','stock','boosts']),limit=5;
 const stageFlags=Object.freeze(['dungeonStage1Clear','dungeonStage2Clear','dungeonStage3Clear']);
 const rewardFlags=Object.freeze(['dungeonCaptainReward','dungeonNecromancerReward','dungeonCouncilReward']);
 const integer=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
 const exact=(data,keys)=>!!data&&typeof data==='object'&&!Array.isArray(data)&&Object.keys(data).length===keys.length&&keys.every(key=>Object.hasOwn(data,key));
 const validItem=id=>typeof id==='string'&&Object.hasOwn(items,id);
 function fresh(){return {run:0,roll:null,stock:{dungeonSeal:0,weaponEnhancement:0,armorEnhancement:0,spiritEnhancement:0},boosts:{weapon:0,armor:0,spirit:0}};}
 function structure(data){
  return exact(data,fields)&&integer(data.run)&&
   (data.roll===null||enhancements.includes(data.roll))&&(data.run!==0||data.roll===null)&&
   exact(data.stock,Object.keys(items))&&Object.keys(items).every(id=>integer(data.stock[id]))&&
   exact(data.boosts,boostKeys)&&boostKeys.every(key=>integer(data.boosts[key],0,limit));
 }
 function copy(data){return structure(data)?{run:data.run,roll:data.roll,stock:{...data.stock},boosts:{...data.boosts}}:null;}
 function validate(data,worldFlags=[],defeated=[]){
  if(!structure(data)||!Array.isArray(worldFlags)||!Array.isArray(defeated))return false;
  const known=worldFlags[1]??[];if(!Array.isArray(known)||known.some(id=>typeof id!=='string')||new Set(known).size!==known.length)return false;
  const has=id=>known.includes(id),started=has('dungeonRunStarted'),stages=stageFlags.map(has),rewards=rewardFlags.map(has),soul=has('councilSoul');
  if((data.run>0)!==started)return false;
  if(started&&(!has('councilGateOpen')||defeated[1]!==true))return false;
  if((stages.some(Boolean)||rewards.some(Boolean)||soul||has('dungeonChestClaimed'))&&!started)return false;
  if(stages.some((cleared,index)=>cleared&&(!rewards[index]||index>0&&!stages[index-1])))return false;
  if(rewards.some((claimed,index)=>claimed&&index>0&&!rewards[index-1]))return false;
  if(soul!==rewards[2]||has('dungeonChestClaimed')&&!stages[2])return false;
  if((Object.values(data.stock).some(n=>n>0)||Object.values(data.boosts).some(n=>n>0))&&!rewards[2])return false;
  return true;
 }
 function transaction(data){const state=copy(data);return {ok:false,state,reason:state?null:'invalidState'};}
 function fail(result,reason){result.reason=reason;return result;}
 function success(result){result.ok=true;result.reason=null;return result;}
 function begin(data,roll=null){
  const result=transaction(data);if(!result.state)return result;
  if(roll!==null&&!enhancements.includes(roll))return fail(result,'invalidRoll');
  if(result.state.run===Number.MAX_SAFE_INTEGER)return fail(result,'runOverflow');
  result.state.run++;result.state.roll=roll;return success(result);
 }
 function addStock(data,id,amount=1){
  const result=transaction(data);if(!result.state)return result;
  if(!validItem(id))return fail(result,'invalidItem');
  if(!integer(amount,1))return fail(result,'invalidQuantity');
  if(amount>Number.MAX_SAFE_INTEGER-result.state.stock[id])return fail(result,'stockOverflow');
  result.state.stock[id]+=amount;return success(result);
 }
 function removeStock(data,id,amount=1){
  const result=transaction(data);if(!result.state)return result;
  if(!validItem(id))return fail(result,'invalidItem');
  if(!integer(amount,1))return fail(result,'invalidQuantity');
  if(amount>result.state.stock[id])return fail(result,'insufficientStock');
  result.state.stock[id]-=amount;return success(result);
 }
 function consume(data,id,abilities=[]){
  const result=transaction(data);if(!result.state)return result;
  if(!validItem(id)||items[id]===null)return fail(result,'invalidItem');
  const key=items[id];
  if(key==='spirit'&&(!Array.isArray(abilities)||abilities[1]!==true))return fail(result,'abilityRequired');
  if(result.state.boosts[key]>=limit)return fail(result,'maxRank');
  if(!result.state.stock[id])return fail(result,'insufficientStock');
  result.state.stock[id]--;result.state.boosts[key]++;return success(result);
 }
 function quantity(data,id){return structure(data)&&validItem(id)?data.stock[id]:0;}
 function bonus(data){const ranks=structure(data)?data.boosts:fresh().boosts;return {damage:.25*ranks.weapon,armor:5*ranks.armor,dashMultiplier:1-.03*ranks.spirit};}
 return Object.freeze({items,catalogue:items,enhancements,limit,fresh,copy,validate,begin,addStock,removeStock,consume,quantity,bonus});
})();
