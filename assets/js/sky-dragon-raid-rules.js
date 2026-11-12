/* Pure raid transitions. Only the phase checkpoint and reward ledger are saved. */
'use strict';
const SkyDragonRaidRules=(()=>{
 const phases=Object.freeze(['harbor','pursuit','back','rift']);
 const tuning=Object.freeze({ballistaCount:3,ballistaHealth:3,harborShots:6,pursuitWaves:3,reikaHealth:5,
  reikaVolleyDamage:8,backCultists:4,wardenHealth:160,riftSeconds:135,riftHealth:960,headDamageMultiplier:1.5,
  platformCount:6,platformWarning:1.25});
 const rewards=Object.freeze({firstClearPoints:1,ringXP:1200,ringPoints:1,craftCost:3,spellReduction:.2});
 const positive=value=>Number.isFinite(value)&&value>0;
 const counter=value=>Number.isSafeInteger(value)&&value>=0;
 const validIndex=(index,length)=>Number.isInteger(index)&&index>=0&&index<length;
 const playable=(state,phase)=>state.phase===phase&&state.outcome===null;
 function start(phase,run){
  if(!phases.includes(phase)||!counter(run)||run===0)return null;
  const state={phase,run,outcome:null};
  switch(phase){
   case 'harbor':return {...state,ballistas:Array(tuning.ballistaCount).fill(tuning.ballistaHealth),shots:0};
   case 'pursuit':return {...state,waves:0,reikaHealth:tuning.reikaHealth};
   case 'back':return {...state,cultists:Array(tuning.backCultists).fill(false)};
   case 'rift':return {...state,timeLeft:tuning.riftSeconds,hp:tuning.riftHealth-tuning.pursuitWaves*tuning.reikaVolleyDamage,grappled:false,
    collapsed:Array(tuning.platformCount).fill(false),warning:null};
  }
 }
 function fireBallista(state,index){
  if(!playable(state,'harbor')||!validIndex(index,state.ballistas.length)||state.ballistas[index]===0)return state;
  const shots=state.shots+1;
  return {...state,shots,outcome:shots===tuning.harborShots?'cleared':null};
 }
 function hitBallista(state,index){
  if(!playable(state,'harbor')||!validIndex(index,state.ballistas.length)||state.ballistas[index]===0)return state;
  const ballistas=[...state.ballistas];ballistas[index]--;
  return {...state,ballistas,outcome:ballistas.every(hp=>hp===0)?'failed':null};
 }
 function finishWave(state,index){
  if(!playable(state,'pursuit')||index!==state.waves||state.waves===tuning.pursuitWaves)return state;
  return {...state,waves:state.waves+1};
 }
 function hitReika(state){
  if(!playable(state,'pursuit')||state.waves===tuning.pursuitWaves)return state;
  const reikaHealth=state.reikaHealth-1;
  return {...state,reikaHealth,outcome:reikaHealth===0?'failed':null};
 }
 function reachDragon(state){
  if(playable(state,'pursuit')&&state.waves===tuning.pursuitWaves)return {...state,outcome:'cleared'};
  if(playable(state,'rift')&&!state.grappled)return {...state,grappled:true};
  return state;
 }
 function defeatCultist(state,index){
  if(!playable(state,'back')||!validIndex(index,state.cultists.length)||state.cultists[index])return state;
  const cultists=[...state.cultists];cultists[index]=true;
  return {...state,cultists};
 }
 function defeatHeadGuard(state){
  return playable(state,'back')&&state.cultists.every(Boolean)?{...state,outcome:'cleared'}:state;
 }
 function standOnPlatform(state,index){
  if(!playable(state,'rift')||state.warning||!validIndex(index,state.collapsed.length)||state.collapsed[index])return state;
  return {...state,warning:{index,left:tuning.platformWarning}};
 }
 function hitDragon(state,amount,{withinReach=false}={}){
  if(!playable(state,'rift')||!state.grappled||!withinReach||!positive(amount))return state;
  const hp=Math.max(0,state.hp-amount*tuning.headDamageMultiplier);
  return {...state,hp,outcome:hp===0?'cleared':null};
 }
 function update(state,dt,{paused=false}={}){
  if(paused||!playable(state,'rift')||!positive(dt))return state;
  const timeLeft=Math.max(0,state.timeLeft-dt);
  if(timeLeft<=1e-7)return {...state,timeLeft:0,outcome:'failed'};
  if(!state.warning)return {...state,timeLeft};
  const {index,left}=state.warning;
  if(left-dt>1e-7)return {...state,timeLeft,warning:{index,left:left-dt}};
  const collapsed=[...state.collapsed];collapsed[index]=true;
  return {...state,timeLeft,collapsed,warning:null};
 }
 function nextPhase(state){
  if(state.outcome!=='cleared')return null;
  return phases[phases.indexOf(state.phase)+1]??null;
 }
 const fresh=()=>({run:0,phase:null,victories:0,ringTurnedIn:false,armorOwned:false,armorEquipped:false});
 function validProgress(data){
  if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).length!==6)return false;
  const {run,phase,victories,ringTurnedIn,armorOwned,armorEquipped}=data;
  if(!counter(run)||!counter(victories)||phase!==null&&!phases.includes(phase)||
   [ringTurnedIn,armorOwned,armorEquipped].some(value=>typeof value!=='boolean'))return false;
  if(phase!==null?run===0||victories>=run:victories>run||run>0&&victories===0)return false;
  return (!ringTurnedIn||victories>0)&&(!armorOwned||victories>=rewards.craftCost)&&(!armorEquipped||armorOwned);
 }
 function begin(data){
  if(!validProgress(data)||data.run===Number.MAX_SAFE_INTEGER)return null;
  return {...data,run:data.run+1,phase:phases[0]};
 }
 function resume(data){return validProgress(data)?start(data.phase,data.run):null;}
 function clearPhase(data,state){
  if(!validProgress(data)||data.phase===null||state?.run!==data.run||state.phase!==data.phase||state.outcome!=='cleared')return null;
  const phase=nextPhase(state);
  if(phase)return {progress:{...data,phase},points:0};
  return {progress:{...data,phase:null,victories:data.victories+1},points:data.victories===0?rewards.firstClearPoints:0};
 }
 function turnInRing(data){
  if(!validProgress(data)||data.victories===0||data.ringTurnedIn)return null;
  return {progress:{...data,ringTurnedIn:true},xp:rewards.ringXP,points:rewards.ringPoints};
 }
 const cloudScales=data=>data.victories-(data.armorOwned?rewards.craftCost:0);
 function forgeArmor(data,ancientScales){
  if(!validProgress(data)||data.armorOwned||cloudScales(data)<rewards.craftCost||!counter(ancientScales)||ancientScales<rewards.craftCost)return null;
  return {progress:{...data,armorOwned:true},ancientScales:ancientScales-rewards.craftCost};
 }
 function equipArmor(data,equipped){
  return validProgress(data)&&data.armorOwned&&typeof equipped==='boolean'?{...data,armorEquipped:equipped}:null;
 }
 return Object.freeze({phases,tuning,rewards,start,fireBallista,hitBallista,finishWave,hitReika,reachDragon,
  defeatCultist,defeatHeadGuard,standOnPlatform,hitDragon,update,fresh,validProgress,begin,resume,
  clearPhase,turnInRing,cloudScales,forgeArmor,equipArmor});
})();
