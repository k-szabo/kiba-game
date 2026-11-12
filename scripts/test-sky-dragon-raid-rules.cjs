'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'../assets/js',name+'.js'),'utf8');
const {raid,grapple,createMaps}=vm.runInNewContext(['sky-dragon-raid-rules','sky-dragon-raid-maps','grapple-rules'].map(read).join('\n')+
 '\n({raid:SkyDragonRaidRules,grapple:GrappleRules,createMaps:createSkyDragonRaidMaps})');
const {tuning,rewards}=raid;

function clear(encounter){
 switch(encounter.phase){
  case 'harbor':
   for(let shot=0;shot<tuning.harborShots;shot++)encounter=raid.fireBallista(encounter,0);
   return encounter;
  case 'pursuit':
   for(let wave=0;wave<tuning.pursuitWaves;wave++)encounter=raid.finishWave(encounter,wave);
   return raid.reachDragon(encounter);
  case 'back':
   for(let cultist=0;cultist<tuning.backCultists;cultist++)encounter=raid.defeatCultist(encounter,cultist);
   return raid.defeatHeadGuard(encounter);
  case 'rift':return raid.hitDragon(raid.reachDragon(encounter),tuning.riftHealth,{withinReach:true});
 }
}

const fresh=raid.fresh();
const started=raid.begin(fresh);
let harbor=raid.resume(started);
for(let index=0;index<tuning.ballistaCount;index++){
 for(let hit=0;hit<tuning.ballistaHealth;hit++)harbor=raid.hitBallista(harbor,index);
 assert.equal(raid.fireBallista(harbor,index),harbor,'Destroyed ballistas cannot fire');
}
assert.equal(harbor.outcome,'failed');
assert.equal(raid.clearPhase(started,harbor),null);
assert.equal(raid.resume(started).ballistas[0],tuning.ballistaHealth);
assert.equal(raid.clearPhase(raid.begin(started),clear(raid.resume(started))),null,'Stale run cannot advance a new run');
const pursuit=raid.start('pursuit',1);
assert.equal(raid.finishWave(pursuit,1),pursuit);
assert.equal(raid.reachDragon(pursuit),pursuit);
const wounded=raid.hitReika(raid.hitReika(pursuit));
assert.equal(raid.finishWave(wounded,0).reikaHealth,tuning.reikaHealth-1);
assert.equal(raid.finishWave(pursuit,0).reikaHealth,tuning.reikaHealth);
let undefended=pursuit;
for(let hit=0;hit<tuning.reikaHealth;hit++)undefended=raid.hitReika(undefended);
assert.equal(undefended.outcome,'failed');
assert.equal(raid.finishWave(undefended,0),undefended);
assert.equal(raid.start('pursuit',1).reikaHealth,tuning.reikaHealth);
const back=raid.start('back',1);
assert.equal(raid.defeatHeadGuard(back),back);

const rift=raid.start('rift',1);
assert.equal(raid.hitDragon(rift,50,{withinReach:true}),rift,'Must reach the head via grapple first');
const latched=raid.reachDragon(rift);
assert.equal(raid.hitDragon(latched,50),latched,'Being out of range blocks damage after grappling');
const warning=raid.standOnPlatform(latched,2);
assert.equal(raid.standOnPlatform(warning,3),warning);
assert.equal(raid.update(warning,100,{paused:true}),warning);
for(const fps of [30,60,120]){
 let encounter=warning;
 const frames=Math.ceil(tuning.platformWarning*fps);
 for(let i=0;i<frames-1;i++)encounter=raid.update(encounter,1/fps);
 assert.equal(encounter.collapsed[2],false);
 encounter=raid.update(encounter,1/fps);
 assert.equal(encounter.collapsed.filter(Boolean).length,1);
 assert.equal(encounter.collapsed[2],true);
 assert.equal(raid.standOnPlatform(encounter,2),encounter);
}
const timedOut=raid.update(warning,tuning.riftSeconds+10);
assert.equal(timedOut.outcome,'failed');
assert.equal(timedOut.timeLeft,0);
assert.equal(raid.hitDragon(timedOut,10000,{withinReach:true}),timedOut);

let progress=fresh;
for(let run=1;run<=3;run++){
 progress=raid.begin(progress);
 for(const phase of raid.phases){
  assert.equal(raid.validProgress(progress),true);
  assert.equal(raid.resume(progress).phase,phase);
  const result=raid.clearPhase(progress,clear(raid.resume(progress)));
  assert.equal(result.points,run===1&&phase==='rift'?1:0);
  progress=result.progress;
 }
 assert.equal(progress.phase,null);
 assert.equal(raid.resume(progress),null);
 assert.equal(progress.victories,run);
}
assert.equal(raid.validProgress({...progress,armorEquipped:true}),false);
assert.equal(raid.validProgress({...fresh,victories:1}),false);
assert.equal(raid.forgeArmor(progress,2),null);
const forged=raid.forgeArmor(progress,4);
assert.equal(forged.ancientScales,1);
assert.equal(raid.cloudScales(forged.progress),0);
assert.equal(raid.forgeArmor(forged.progress,10),null);
assert.equal(raid.equipArmor(forged.progress,true).armorEquipped,true);
const ring=raid.turnInRing(forged.progress);
assert.equal(ring.xp,rewards.ringXP);
assert.equal(ring.points,rewards.ringPoints);
assert.equal(raid.turnInRing(ring.progress),null);
assert.equal(fresh.victories,0,'Transitions must preserve the input snapshot');

const maps=createMaps({makeLevel:(id,width,height,start)=>({id,width,height,start,platforms:[]}),
 ledge:(map,id,x,y,w,kind,h)=>map.platforms.push({id,x,y,w,h}),zone:()=>{}});
assert.equal(maps.harbor.ballistas.length,tuning.ballistaCount);
assert.equal(maps.back.cultists.length,tuning.backCultists);
assert.equal(maps.rift.fracturePlatforms.length,tuning.platformCount);
function pullFromEdge(platform,map,targetId){
 const body={x:platform.x+platform.w-60,y:platform.y-64,w:44,h:64};
 const origin={x:body.x+body.w/2,y:body.y+body.h/2};
 const target=grapple.target(origin,1,{terrain:map.platforms,anchors:map.grappleAnchors});
 assert.equal(target?.id,targetId);
 for(const fps of [30,60,120]){
  let current={...body};
  for(let frame=0;frame<fps*2;frame++){
   const step=grapple.move(current,target,1/fps,map.platforms);
   assert.equal(step.blocked,false,`${targetId} must clear terrain at ${fps} FPS`);
   current={...current,x:step.x,y:step.y};
   if(step.done)break;
  }
  assert(Math.hypot(current.x+body.w/2-target.x,current.y+body.h/2-target.y)<1);
 }
}
for(const map of [maps.back,maps.rift]){
 for(const [i,anchor] of map.grappleAnchors.entries())pullFromEdge(map.platforms[i],map,anchor.id);
}
const boarding=maps.pursuit.grappleAnchors[0];
assert.equal(grapple.target({x:1720,y:1028},1,{anchors:[boarding]}),null);
boarding.disabled=false;
pullFromEdge(maps.pursuit.platforms[0],maps.pursuit,maps.pursuit.boardingRing);
console.log('PASS: sky dragon phases, checkpoint retry, platform collapse, one-time rewards, and grapple routes at 30/60/120 FPS.');
