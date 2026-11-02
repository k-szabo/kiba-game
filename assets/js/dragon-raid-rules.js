/* Transient raid progression. This record is never a journey save. */
'use strict';
const DragonRaidRules=(()=>{
 const tuning=Object.freeze({chainHp:6,tumorHp:12,chains:4,tumors:3,manifestations:2,maxHp:1200,pillars:4,pillarInterval:45,forelegHp:120,fallDuration:.65,headWindow:6,riseDuration:1,headMultiplier:4});
 const positive=n=>Number.isFinite(n)&&n>0;
 function fresh(run){
  if(!Number.isSafeInteger(run)||run<1)return null;
  return {run,phase:1,chains:Array(tuning.chains).fill(tuning.chainHp),tumors:Array(tuning.tumors).fill(tuning.tumorHp),manifestations:Array(tuning.manifestations).fill(false),forelegs:[tuning.forelegHp,tuning.forelegHp],stance:'standing',stanceTime:0,hp:tuning.maxHp,elapsed:0,pillars:tuning.pillars,failed:false,won:false};
 }
 const copy=s=>({...s,chains:[...s.chains],tumors:[...s.tumors],manifestations:[...s.manifestations],forelegs:[...s.forelegs]});
 function hit(state,target,index,amount){
  const next=copy(state);if(next.failed||next.won||!positive(amount))return next;
  if(target==='chain'&&next.phase===1&&Number.isInteger(index)&&index>=0&&index<next.chains.length){
   next.chains[index]=Math.max(0,next.chains[index]-amount);
   if(next.chains.every(hp=>hp===0))next.phase=2;
  }else if(target==='tumor'&&next.phase===2&&Number.isInteger(index)&&index>=0&&index<next.tumors.length){
   next.tumors[index]=Math.max(0,next.tumors[index]-amount);
  }else if(target==='foreleg'&&next.phase===3&&next.stance==='standing'&&Number.isInteger(index)&&index>=0&&index<2){
   next.forelegs[index]=Math.max(0,next.forelegs[index]-amount);
   if(next.forelegs.every(hp=>hp===0)){next.stance='falling';next.stanceTime=tuning.fallDuration;}
  }else if(target==='head'&&index===0&&next.phase===3&&next.stance==='exposed'){next.hp=Math.max(0,next.hp-amount*tuning.headMultiplier);next.won=next.hp===0;}
  return next;
 }
 function manifestationDefeated(state,index){
  const next=copy(state);
  if(next.phase===2&&!next.failed&&!next.won&&Number.isInteger(index)&&index>=0&&index<next.manifestations.length)next.manifestations[index]=true;
  return next;
 }
 function reachHead(state){
  const next=copy(state);
  if(next.phase===2&&!next.failed&&next.tumors.every(hp=>hp===0)&&next.manifestations.every(Boolean)){next.phase=3;next.elapsed=0;next.forelegs=[tuning.forelegHp,tuning.forelegHp];next.stance='standing';next.stanceTime=0;}
  return next;
 }
 function update(state,dt,{paused=false}={}){
  const next=copy(state);
  if(paused||next.phase!==3||next.failed||next.won||!positive(dt))return next;
  const previousElapsed=next.elapsed;
  next.elapsed=Math.min(tuning.pillars*tuning.pillarInterval,next.elapsed+dt);
  // Resolve the full active slice, including an overshooting frame, without
  // starting the next cycle early or advancing beyond the collapse deadline.
  let remaining=next.elapsed-previousElapsed;
  while(next.stance!=='standing'&&remaining>0){
   const step=Math.min(remaining,next.stanceTime);next.stanceTime=Math.max(0,next.stanceTime-step);remaining-=step;
   if(next.stanceTime>1e-7)break;
   if(next.stance==='falling'){next.stance='exposed';next.stanceTime=tuning.headWindow;}
   else if(next.stance==='exposed'){next.stance='rising';next.stanceTime=tuning.riseDuration;}
   else{next.stance='standing';next.stanceTime=0;next.forelegs=[tuning.forelegHp,tuning.forelegHp];}
  }
  // Floating-point accumulation at common frame rates must not defer collapse.
  const destroyed=Math.min(tuning.pillars,Math.floor((next.elapsed+1e-7)/tuning.pillarInterval));
  next.pillars=tuning.pillars-destroyed;next.failed=next.pillars===0;return next;
 }
 return Object.freeze({tuning,fresh,hit,manifestationDefeated,reachHead,update});
})();
