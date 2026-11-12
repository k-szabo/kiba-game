/* Encounter state. The raid controller owns collision, time and persistence. */
'use strict';
const StoryRaidCombat=(()=>{
 const rules=StoryRaidRules;
 function start(arena,loadout,towerHp){
  const id=arena.encounter.id,kind=arena.encounter.kind;
  const profile=BossCatalog.story(id),{w,h}=profile;
  const mimic=kind==='mimic'?rules.startMimic(loadout,towerHp):null;
  const maxHp=towerHp??mimic?.maxHp??profile.hp;
  return {arena,id,raidBossId:id,kind,profile,mimic,x:arena.spawn.x-w/2,y:arena.spawn.y-h,w,h,hp:maxHp,maxHp,
   face:-1,clock:1.1,pattern:0,cast:null,hitFlash:0,animTime:0,walkSpeed:0,dead:false,
   guardCooldown:0,shieldRemaining:mimic?.loadout.gear.shield??0,shieldRecharge:0,
   keeper:kind==='reikaMarks'?rules.startSignalKeeper():null,siege:kind==='westheruShot'&&towerHp===undefined?rules.startSiegeWarden():null};
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
  if(foe.keeper&&!foe.towerBoss){
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
  foe.hitFlash=.18;if(!foe.towerBoss)foe.dead=foe.hp===0;
  return true;
 }
 function hitTarget(foe){
  if(!foe.keeper)return foe;
  const point=foe.arena.decoys[foe.keeper.marked];
  return point?{x:point.x-36,y:foe.y,w:72,h:foe.h}:null;
 }
 function telegraph(foe,spec,target){
  const center=foe.x+foe.w/2,feet=foe.y+foe.h,px=target.x+target.w/2;
  if(spec.move==='fissure'||spec.move==='mirage')return {...spec,x:px-96,y:feet-145,w:192,h:145,spell:true};
  const w=foe.mimic?WeaponStyles.hitbox(foe.mimic.loadout.weapon,foe,foe.face).w:foe.profile.range;
  const reach=spec.move==='step'?Math.max(300,w):w;
  return {...spec,x:foe.face>0?center:center-reach,y:feet-foe.h-12,w:reach,h:foe.h+12,spell:spec.move==='fan'};
 }
 function tick(foe,dt,target){
  foe.hitFlash=Math.max(0,foe.hitFlash-dt);foe.clock-=dt;foe.animTime+=dt;
  foe.guardCooldown=Math.max(0,foe.guardCooldown-dt);
  if(foe.shieldRecharge>0){
   foe.shieldRecharge=Math.max(0,foe.shieldRecharge-dt);
   if(!foe.shieldRecharge)foe.shieldRemaining=foe.mimic.loadout.gear.shield;
  }
  foe.strikeTime=Math.max(0,(foe.strikeTime||0)-dt);
  if(foe.cast){
   if(foe.clock>0)return null;
   const cast=foe.cast;foe.cast=null;foe.clock=cast.recovery;
   foe.strikeTime=.22;foe.lastMove=cast.move;
   return cast;
  }
  const arena=foe.arena,delta=target.x+target.w/2-foe.x-foe.w/2;
  foe.face=Math.sign(delta)||foe.face;
  const range=foe.mimic?foe.profile.range:Math.max(90,foe.profile.range-25);
  foe.walkSpeed=Math.abs(delta)>range?foe.face*foe.profile.speed:0;
  foe.x=clamp(foe.x+foe.walkSpeed*dt,arena.x+22,arena.x+arena.w-foe.w-22);
  if(foe.clock>0)return null;
  if(foe.keeper){
   if(foe.towerBoss){
    foe.keeper=rules.markSignalKeeper(foe.keeper,foe.pattern%3);
    foe.x=arena.decoys[foe.keeper.marked].x-foe.w/2;
   }
   else if(foe.keeper.marked===null)foe.keeper=rules.markSignalKeeper(foe.keeper,(foe.keeper.interrupts*2+1)%3);
  }
  foe.cast=telegraph(foe,chooseMove(foe,target),target);
  foe.clock=foe.cast.windup;foe.walkSpeed=0;
  return null;
 }
 return Object.freeze({start,chooseMove,damage,hitTarget,tick});
})();
