/* Transient relic burns follow actual sword damage; never stored in a save. */
'use strict';
const Foxfire=(()=>{
 const tuning=Object.freeze({duration:3,interval:1,damage:1});
 const burns=new Map();
 const phase=e=>[e.stage,e.mode,e.ritualEmpowered,e.encounterId].join(':');
 function snapshot(){
  const all=enemies.filter(e=>!e.dead).map(target=>({target,hp:target.hp,kind:'enemy'}));
  if(bossStarted&&!boss.dead)all.push({target:boss,hp:boss.hp,kind:'boss'});
  if(VoidEncounter.actor&&!VoidEncounter.actor.dead)all.push({target:VoidEncounter.actor,hp:VoidEncounter.actor.hp,kind:'void',generation:VoidEncounter.snapshot?.generation});
  if(DragonRaid.running()&&DragonRaid.current.phase===3)all.push({target:DragonRaid,hp:DragonRaid.current.hp,kind:'dragon',run:DragonRaid.current.run});
  return all;
 }
 function health(record){return record.kind==='dragon'?DragonRaid.current?.hp:record.target.hp;}
 function valid(record){
  if(record.map!==level||record.player!==player||Prologue.active)return false;
  const e=record.target;
  if(record.kind==='dragon')return DragonRaid.running()&&DragonRaid.current.phase===3&&DragonRaid.current.run===record.run;
  if(e.dead||e.hp<=0||phase(e)!==record.phase)return false;
  if(record.kind==='boss')return e===boss&&bossStarted;
  if(record.kind==='void')return e===VoidEncounter.actor&&VoidEncounter.snapshot?.generation===record.generation&&VoidEncounter.locked();
  return enemies.includes(e);
 }
 function capture(before){
  if(Prologue.active)return;
  for(const record of before)if(health(record)<record.hp&&health(record)>0){
   const current=burns.get(record.target);
   const next={...record,map:level,player,phase:phase(record.target),remaining:tuning.duration,clock:current?.clock??tuning.interval};
   if(valid(next))burns.set(record.target,next);
  }
 }
 function hurt(record){
  const e=record.target,box=record.kind==='dragon'?DragonRaid.head.box:{x:e.x-1,y:e.y-1,w:e.w+2,h:e.h+2},amount=tuning.damage;
  if(record.kind==='dragon'){DragonRaid.hit(box,amount);return;}
  if(record.kind==='void'){VoidEncounter.hit(box,amount);return;}
  if(record.kind==='boss'){hitBoss(amount,'normal');return;}
  if(HannahCombat.is(e)){HannahCombat.hit(e,box,amount);return;}
  if(FiaCombat.is(e)){FiaCombat.hit(e,box,amount);return;}
  if(DoomSlayer.is(e)){DoomSlayer.hit(e,box,amount,'normal');return;}
  if(DungeonCombat.is(e)){DungeonCombat.hit(e,box,amount,'normal');return;}
  if(ArenaCombat.is(e)){ArenaCombat.hit(e,box,amount,'normal');return;}
  if(e.miniboss&&(!e.active||e.inv>0))return;
  const before=e.hp;e.hp=Math.max(0,e.hp-amount);DevDamage.record('outgoing',e,before,e.hp);if(e.hp<=0)killEnemy(e);
 }
 function update(dt){
  if(state!=='play'||!Number.isFinite(dt)||dt<=0)return;
  for(const [key,record]of burns){
   if(!valid(record)){burns.delete(key);continue;}
   const active=Math.min(dt,record.remaining);record.remaining=Math.max(0,record.remaining-active);record.clock-=active;
   while(record.clock<=1e-7&&valid(record)){
    record.clock+=tuning.interval;hurt(record);
    if(state!=='play')break;
   }
   if(record.remaining<=1e-7||!valid(record))burns.delete(key);
   if(state!=='play')break;
  }
 }
 function draw(){
  if(Prologue.active)return;
  for(const record of burns.values())if(valid(record)){
   const e=record.kind==='dragon'?DragonRaid.head.box:record.target;
   FiaArt.effect('foxfire',reducedMotion.matches?0:Math.floor(levelTime*5)%4,e.x+e.w/2,e.y+e.h*.65,Math.max(55,Math.min(130,e.w+35)),Math.max(50,Math.min(150,e.h)),.55);
  }
 }
 return Object.freeze({tuning,snapshot,capture,update,draw,get count(){return burns.size;}});
})();
