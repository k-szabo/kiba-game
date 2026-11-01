/* Transient raid progression. This record is never a journey save. */
'use strict';
const DragonRaidRules=(()=>{
 const tuning=Object.freeze({chainHp:6,tumorHp:12,chains:4,tumors:3,manifestations:2,maxHp:1200,pillars:4,pillarInterval:45});
 const positive=n=>Number.isFinite(n)&&n>0;
 function fresh(run){
  if(!Number.isSafeInteger(run)||run<1)return null;
  return {run,phase:1,chains:Array(tuning.chains).fill(tuning.chainHp),tumors:Array(tuning.tumors).fill(tuning.tumorHp),manifestations:Array(tuning.manifestations).fill(false),hp:tuning.maxHp,elapsed:0,pillars:tuning.pillars,failed:false,won:false};
 }
 const copy=s=>({...s,chains:[...s.chains],tumors:[...s.tumors],manifestations:[...s.manifestations]});
 function hit(state,target,index,amount){
  const next=copy(state);if(next.failed||next.won||!positive(amount))return next;
  if(target==='chain'&&next.phase===1&&Number.isInteger(index)&&index>=0&&index<next.chains.length){
   next.chains[index]=Math.max(0,next.chains[index]-amount);
   if(next.chains.every(hp=>hp===0))next.phase=2;
  }else if(target==='tumor'&&next.phase===2&&Number.isInteger(index)&&index>=0&&index<next.tumors.length){
   next.tumors[index]=Math.max(0,next.tumors[index]-amount);
  }else if(target==='head'&&next.phase===3){next.hp=Math.max(0,next.hp-amount);next.won=next.hp===0;}
  return next;
 }
 function manifestationDefeated(state,index){
  const next=copy(state);
  if(next.phase===2&&!next.failed&&!next.won&&Number.isInteger(index)&&index>=0&&index<next.manifestations.length)next.manifestations[index]=true;
  return next;
 }
 function reachHead(state){
  const next=copy(state);
  if(next.phase===2&&!next.failed&&next.tumors.every(hp=>hp===0)&&next.manifestations.every(Boolean)){next.phase=3;next.elapsed=0;}
  return next;
 }
 function update(state,dt,{paused=false}={}){
  const next=copy(state);
  if(paused||next.phase!==3||next.failed||next.won||!positive(dt))return next;
  next.elapsed=Math.min(tuning.pillars*tuning.pillarInterval,next.elapsed+dt);
  // Floating-point accumulation at common frame rates must not defer collapse.
  const destroyed=Math.min(tuning.pillars,Math.floor((next.elapsed+1e-7)/tuning.pillarInterval));
  next.pillars=tuning.pillars-destroyed;next.failed=next.pillars===0;return next;
 }
 return Object.freeze({tuning,fresh,hit,manifestationDefeated,reachHead,update});
})();
