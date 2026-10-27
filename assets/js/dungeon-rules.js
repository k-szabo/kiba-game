/* Pure dungeon inventory/run rules, shared by runtime and strict save validation.
 * World flags own current-floor progress and permanent first-clear rewards.
 * Transactions validate structure only; their caller commits flags and state together. */
'use strict';
const DungeonRules=(()=>{
 const items=Object.freeze({dungeonSeal:null,sectSeal:null,weaponEnhancement:'weapon',armorEnhancement:'armor',spiritEnhancement:'spirit'});
 const enhancements=Object.freeze(Object.keys(items).filter(id=>items[id]!==null)),boostKeys=Object.freeze(['weapon','armor','spirit']);
 const fields=Object.freeze(['runs','stock','boosts']),limit=5;
 const freeze=spec=>Object.freeze(Object.fromEntries(Object.entries(spec).map(([key,value])=>[key,Array.isArray(value)?Object.freeze(value):value])));
 const definitions=Object.freeze({
  yomiFall:freeze({realm:1,started:'dungeonRunStarted',stages:['dungeonStage1Clear','dungeonStage2Clear','dungeonStage3Clear'],rewards:['dungeonCaptainReward','dungeonNecromancerReward','dungeonCouncilReward'],chest:'dungeonChestClaimed',soul:'councilSoul',loot:'dungeonSeal',requiredFlags:['councilGateOpen'],requiresRealmBoss:true}),
  sectFall:freeze({realm:0,started:'sectRunStarted',stages:['sectStage1Clear','sectStage2Clear','sectStage3Clear'],rewards:['sectGuardReward','sectAngelReward','sectPriestessReward'],chest:'sectChestClaimed',soul:'highPriestessSoul',loot:'sectSeal',requiredFlags:['guardian:oldCultist','cultTempleDiscovered'],requiresRealmBoss:true})
 });
 const ids=Object.freeze(Object.keys(definitions));
 const integer=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
 const exact=(data,keys)=>!!data&&typeof data==='object'&&!Array.isArray(data)&&Object.keys(data).length===keys.length&&keys.every(key=>Object.hasOwn(data,key));
 const validItem=id=>typeof id==='string'&&Object.hasOwn(items,id);
 function fresh(){return {runs:Object.fromEntries(ids.map(id=>[id,{run:0,roll:null}])),stock:Object.fromEntries(Object.keys(items).map(id=>[id,0])),boosts:{weapon:0,armor:0,spirit:0}};}
 function structure(data){
  return exact(data,fields)&&exact(data.runs,ids)&&ids.every(id=>{const run=data.runs[id];return exact(run,['run','roll'])&&integer(run.run)&&(run.roll===null||enhancements.includes(run.roll))&&(run.run!==0||run.roll===null);})&&
   exact(data.stock,Object.keys(items))&&Object.keys(items).every(id=>integer(data.stock[id]))&&
   exact(data.boosts,boostKeys)&&boostKeys.every(key=>integer(data.boosts[key],0,limit));
 }
 function copy(data){return structure(data)?{runs:Object.fromEntries(ids.map(id=>[id,{...data.runs[id]}])),stock:{...data.stock},boosts:{...data.boosts}}:null;}
 function runInfo(data,id='yomiFall'){return structure(data)&&Object.hasOwn(definitions,id)?{...data.runs[id]}:null;}
 function validate(data,worldFlags=[],defeated=[]){
  if(!structure(data)||!Array.isArray(worldFlags)||!Array.isArray(defeated))return false;
  let completed=false;
  for(const id of ids){
   const spec=definitions[id],known=worldFlags[spec.realm]??[];if(!Array.isArray(known)||known.some(flag=>typeof flag!=='string')||new Set(known).size!==known.length)return false;
   const has=flag=>known.includes(flag),started=has(spec.started),stages=spec.stages.map(has),rewards=spec.rewards.map(has),soul=has(spec.soul);
   if((data.runs[id].run>0)!==started)return false;
   if(started&&(!spec.requiredFlags.every(has)||spec.requiresRealmBoss&&defeated[spec.realm]!==true))return false;
   if((stages.some(Boolean)||rewards.some(Boolean)||soul||has(spec.chest))&&!started)return false;
   if(stages.some((cleared,index)=>cleared&&(!rewards[index]||index>0&&!stages[index-1])))return false;
   if(rewards.some((claimed,index)=>claimed&&index>0&&!rewards[index-1]))return false;
   if(soul!==rewards[2]||has(spec.chest)&&!stages[2])return false;
   if(data.stock[spec.loot]>0&&!rewards[2])return false;
   completed||=rewards[2];
  }
  if((enhancements.some(id=>data.stock[id]>0)||Object.values(data.boosts).some(n=>n>0))&&!completed)return false;
  return true;
 }
 function transaction(data){const state=copy(data);return {ok:false,state,reason:state?null:'invalidState'};}
 function fail(result,reason){result.reason=reason;return result;}
 function success(result){result.ok=true;result.reason=null;return result;}
 function begin(data,roll=null,id='yomiFall'){
  const result=transaction(data);if(!result.state)return result;
  if(roll!==null&&!enhancements.includes(roll))return fail(result,'invalidRoll');
  if(!Object.hasOwn(definitions,id))return fail(result,'invalidDungeon');
  if(result.state.runs[id].run===Number.MAX_SAFE_INTEGER)return fail(result,'runOverflow');
  result.state.runs[id].run++;result.state.runs[id].roll=roll;return success(result);
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
 return Object.freeze({items,catalogue:items,definitions,enhancements,limit,fresh,copy,runInfo,validate,begin,addStock,removeStock,consume,quantity,bonus});
})();
