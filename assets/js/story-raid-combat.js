/* Encounter state. The raid controller owns collision, time and persistence. */
'use strict';
const StoryRaidCombat=(()=>{
 const rules=StoryRaidRules;
 const profiles=Object.freeze({
  mistSentry:{hp:185,speed:170,damage:5,range:170,windup:.75,recovery:.65,moves:['fan','step']},
  signalKeeper:{hp:3,speed:0,damage:6,range:0,windup:1,recovery:1,moves:['mirage']},
  thirdClanLeader:{hp:425,speed:155,damage:7,range:215,windup:.86,recovery:.78,moves:['fan','fissure','step']},
  siegeWarden:{hp:340,speed:113,damage:8,range:180,windup:1,recovery:.75,moves:['sweep','fissure']},
  kibaBinder:{hp:310,speed:135,damage:7,range:205,windup:.9,recovery:.8,moves:['fissure','fan']},
  cultWarMarshal:{hp:620,speed:150,damage:9,range:245,windup:.86,recovery:.7,moves:['sweep','step','fissure']},
  riftSentinel:{hp:380,speed:235,damage:8,range:190,windup:.79,recovery:.68,moves:['step','fan']},
  sanctuaryCustodian:{hp:510,speed:95,damage:10,range:245,windup:1.1,recovery:.78,moves:['sweep','fissure','fan']}
 });
 function start(arena,loadout){
  const id=arena.encounter.id,kind=arena.encounter.kind;
  const mimic=kind==='mimic'?rules.startMimic(loadout):null;
  const profile=mimic?null:profiles[id],maxHp=mimic?.maxHp??profile.hp;
  const size=id==='riftSentinel'?[128,103]:id==='sanctuaryCustodian'||arena.encounter.soul?[110,152]:
   id==='siegeWarden'?[100,130]:[78,115];
  const [w,h]=mimic?[43,69]:size;
  return {arena,id,kind,profile,mimic,x:arena.spawn.x-w/2,y:arena.spawn.y-h,w,h,hp:maxHp,maxHp,
   face:-1,clock:1.1,pattern:0,cast:null,hitFlash:0,animTime:0,walkSpeed:0,dead:false,
   guardCooldown:0,shieldRemaining:mimic?.loadout.gear.shield??0,shieldRecharge:0,
   keeper:kind==='reikaMarks'?rules.startSignalKeeper():null,siege:kind==='westheruShot'?rules.startSiegeWarden():null};
 }
 function chooseMove(foe,target){
  if(foe.mimic){
   const i=foe.pattern++,loadout=foe.mimic.loadout,dist=Math.abs(target.x+target.w/2-foe.x-foe.w/2);
   const move=foe.mimic.phase===2&&i%4===3?'fissure':
    dist>200&&loadout.abilities.dash?'step':i%3===2?'heavy':'normal';
   const profile=loadout.attacks[move]||loadout.attacks.heavy;
   return {move,windup:move==='fissure'?1.02:Math.max(.24,profile.impact),
    recovery:move==='step'?loadout.stats.dashCooldown:Math.max(.22,profile.duration-profile.impact),
    damage:loadout.stats.damage*profile.damageScale};
  }
  const p=foe.profile,move=p.moves[foe.pattern++%p.moves.length];
  return {move,windup:p.windup,recovery:p.recovery,damage:p.damage};
 }
 function damage(foe,amount,{identity=null,reduce=hit=>hit}={}){
  if(foe.dead||foe.hitFlash>0||!Number.isFinite(amount)||amount<=0||foe.siege&&!foe.siege.shot)return false;
  if(foe.keeper){
   const next=rules.strikeSignalKeeper(foe.keeper,identity);
   if(next===foe.keeper)return false;
   foe.keeper=next;foe.hp=Math.max(0,foe.maxHp-next.interrupts);
  }else if(foe.mimic){
   const next=rules.hitMimic(foe.mimic,reduce(amount,foe.mimic.loadout));
   if(next===foe.mimic)return false;
   if(next.phase!==foe.mimic.phase){
    foe.cast=null;foe.clock=1.35;foe.pattern=0;foe.strikeTime=0;
    const x=foe.x+foe.w/2,feet=foe.y+foe.h;
    foe.w=55;foe.h=103;foe.x=x-foe.w/2;foe.y=feet-foe.h;
   }
   foe.mimic=next;foe.hp=next.hp;
  }else foe.hp=Math.max(0,foe.hp-amount);
  foe.hitFlash=.18;foe.dead=foe.hp===0;
  return true;
 }
 return Object.freeze({start,chooseMove,damage});
})();
