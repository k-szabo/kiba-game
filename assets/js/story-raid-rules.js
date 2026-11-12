/* Durable first clears and the Mimic's per-attempt snapshot. */
'use strict';
const StoryRaidRules=(()=>{
 const encounters=Object.freeze(BossCatalog.ids.map(BossCatalog.get).filter(boss=>boss.story.raidOrder)
  .sort((a,b)=>a.story.raidOrder-b.story.raidOrder).map(({id,name,story},index)=>Object.freeze({
   id,name,kind:story.raidKind,soul:story.soul,tier:Math.floor(index/3),clear:'storyRaidClear:'+id
  })));
 const started='storyRaidStarted',rescued='storyRaidHaruRescued',crossed='storyRaidHeavenReached';
 const milestones=Object.freeze([started,...encounters.map(boss=>boss.clear),rescued,crossed]);
 const rescueTiming=Object.freeze({crossing:1,collapse:2.8,end:4.15});
 const has=(flags,id)=>flags?.[0]?.includes(id)===true;
 const available=flags=>has(flags,'thirdClanHaruTrailFound')&&flags?.[3]?.includes('dawnblade')===true;
 function validate(flags){
  const japan=flags?.[0];
  if(!Array.isArray(japan))return false;
  const count=japan.filter(id=>milestones.includes(id)).length;
  return count===0||available(flags)&&count<=milestones.length&&milestones.slice(0,count).every(id=>has(flags,id));
 }
 function next(flags){
  return validate(flags)&&available(flags)?milestones.find(id=>!has(flags,id))??null:null;
 }
 function checkpoint(flags){
  if(!validate(flags)||!has(flags,started))return null;
  return encounters.findIndex(boss=>!has(flags,boss.clear));
 }
 function advance(flags,id){
  if(typeof id!=='string'||next(flags)!==id)return null;
  const encounter=encounters.find(boss=>boss.clear===id);
  return {japan:[...flags[0],id],points:encounter?1:0,soul:encounter?.soul??null};
 }
 const bonusPoints=flags=>encounters.filter(boss=>has(flags,boss.clear)).length;
 const soulOwned=(flags,id)=>encounters.some(boss=>boss.soul===id&&has(flags,boss.clear));
 const recoilFree=flags=>validate(flags)&&has(flags,rescued);
 function rescueFrame(elapsed){
  return {
   crossing:Math.min(1,Math.max(0,(elapsed-rescueTiming.crossing)/(rescueTiming.collapse-rescueTiming.crossing))),
   collapse:Math.min(1,Math.max(0,(elapsed-rescueTiming.collapse)/.55)),
   finished:elapsed>=rescueTiming.end
  };
 }

 function snapshotMimic({weapon,stats,normal,heavy,gear,abilities}){
  return Object.freeze({weapon,stats:Object.freeze({...stats}),
   attacks:Object.freeze({normal:Object.freeze({...normal}),heavy:Object.freeze({...heavy})}),
   gear:Object.freeze({...gear}),abilities:Object.freeze({...abilities})});
 }
 function startMimic(loadout,maxHp=loadout.stats.maxHp){
  return {loadout,phase:1,hp:maxHp,maxHp,defeated:false};
 }
 function hitMimic(attempt,amount){
  if(attempt.defeated||!Number.isFinite(amount)||amount<=0)return attempt;
  const hp=Math.max(0,attempt.hp-amount);
  if(!hp&&attempt.phase===1)return {...attempt,phase:2,hp:attempt.maxHp};
  return {...attempt,hp,defeated:hp===0};
 }
 function startSignalKeeper(){return {marked:null,interrupts:0};}
 function markSignalKeeper(attempt,identity){
  return Number.isInteger(identity)&&identity>=0&&identity<3?{...attempt,marked:identity}:attempt;
 }
 function strikeSignalKeeper(attempt,identity){
  return attempt.marked!==null&&attempt.marked===identity?{marked:null,interrupts:attempt.interrupts+1}:attempt;
 }
 function startSiegeWarden(){return {signals:0,shot:false};}
 function lightSignal(attempt,index){
  return Number.isInteger(index)&&index>=0&&index<3&&!attempt.shot?{...attempt,signals:attempt.signals|(1<<index)}:attempt;
 }
 function fireWestheru(attempt){return attempt.signals===0b111&&!attempt.shot?{...attempt,shot:true}:attempt;}
 return Object.freeze({encounters,milestones,started,rescued,crossed,available,validate,next,checkpoint,advance,bonusPoints,soulOwned,recoilFree,rescueFrame,
  snapshotMimic,startMimic,hitMimic,startSignalKeeper,markSignalKeeper,strikeSignalKeeper,startSiegeWarden,lightSignal,fireWestheru});
})();
