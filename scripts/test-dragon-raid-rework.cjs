'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const fs=require('node:fs'),path=require('node:path');
{
 const h=harness(),r=h.run,png=fs.readFileSync(path.join(__dirname,'..',r('ART_MANIFEST.dragonFront')));
 assert.equal(png.readUInt32BE(16),1536,'Frontal atlas retains its registered width');assert.equal(png.readUInt32BE(20),1024,'Frontal atlas retains its registered height');assert.equal(png[25],6,'Native source alpha is preserved');
 for(const [i,f]of Array.from(r('ART_DRAGON.front.frames')).entries())assert.deepEqual([f.x,f.y,f.w,f.h,f.anchorX,f.anchorY,f.bodyHeight],[i%2*768,Math.floor(i/2)*512,768,512,i%2*768+384,Math.floor(i/2)*512+475,400],'Frontal pose '+i+' keeps the existing gameplay registration');
}
function entry(){const h=harness();h.run("Prologue.stop();defeated=[true,true,true,true];flags[3]=['hannahDefeated','fiaTalismanCompleted','fiaRescued','arenaChampion'];CampQuest.enter('zigguratInterior',{save:false});enemies=[];state='play';");return h;}
{
 const h=entry(),r=h.run;r('initPlayer(level.dragonRaidEntrance)');assert.equal(r('getContext().type'),'dragonRaidEnter');
 h.press({action:'interact'});h.tick();h.release({action:'interact'});assert.equal(r('state'),'dungeonMenu');h.elements.get('dungeonNew').onclick();assert.equal(r('level.id'),'dragonCatacombs');
}
{
 const h=entry(),r=h.run;r('initPlayer(level.returnPoint)');assert.equal(r('getContext().type'),'zigguratReturn');h.press({action:'interact'});h.tick();h.release({action:'interact'});assert.equal(r('level.id'),'zigguratApproach');
}
{
 const h=entry(),r=h.run;assert.equal(r('nextObjective().text'),'story.journeyEnd');r("flags[3].push('fiaDragonAccepted')");
 for(const id of ['zigguratInterior','zigguratSummit','fiaChambers']){r(`CampQuest.enter('${id}',{save:false});`);assert.equal(r('nextObjective().text'),'fia.dragon.location');}
 r("flags[3].push('dragonEyes');CampQuest.enter('zigguratInterior',{save:false})");assert.equal(r('nextObjective().text'),'fia.dragon.objective.return');
 r("flags[3].push('fiaDragonCompleted')");assert.equal(r('nextObjective().text'),'story.journeyEnd');
 r("flags[3]=flags[3].filter(id=>id!=='fiaDragonCompleted');flags[3].push('fiaSlain')");assert.equal(r('nextObjective().text'),'story.journeyEnd');
}
for(const fps of [30,60,120])for(const near of [true,false]){
 const h=entry(),r=h.run;r(`initPlayer(level.dragonRaidEntrance);DragonRaid.begin();
 for(let i=0;i<4;i++)DragonRaid.hit(DragonRaid.targets().find(t=>t.type==='chain'&&t.index===i),10000);
 for(let i=0;i<3;i++)DragonRaid.hit(DragonRaid.targets().find(t=>t.type==='tumor'&&t.index===i),10000);
 for(let i=0;i<2;i++)DragonRaid.hit(DragonRaid.targets().find(t=>t.type==='manifestation'&&t.index===i),10000);
 initPlayer(level.headPoint);DragonRaid.update(.01);initPlayer({x:${near?10250:8750},y:1300});player.hp=player.maxHp=100;player.inv=0;
 var observed=new Set(),physicalHits=0,frozenTargets=new Map();
 for(let i=0;i<${fps}*15;i++){
  const before=player.hp;update(1/${fps});const w=DragonRaid.warning,hit=DragonRaid.impact;
  if(w){observed.add(w.kind);const signature=JSON.stringify(w.box);if(frozenTargets.has(w))if(frozenTargets.get(w)!==signature)throw Error('Moving telegraph');frozenTargets.set(w,signature);}
  if(hit&&(hit.kind==='bite'||hit.kind==='headSlam')){
   const p=1-hit.remaining/hit.strikeDuration;
   if(p>=.5&&p<=.8){if(Math.abs(DragonRaid.head.x-hit.toX)>.001||Math.abs(DragonRaid.head.y-hit.toY)>.001)throw Error('Actor and strike projection differ');}
   if(player.hp<before)physicalHits++;
  }
  const target=DragonRaid.targets()[0];if(Math.abs(target.x+230-DragonRaid.head.x)>.001||Math.abs(target.y-1060-DragonRaid.head.y)>.001)throw Error('Weakspot registration drift');
 }
 `);
 const kinds=Array.from(r('[...observed]'));assert(kinds.includes('fire')&&kinds.includes('shadow'));
 if(near){assert(kinds.includes('bite')&&kinds.includes('headSlam'),'Both physical attacks at '+fps+' FPS');assert(r('physicalHits>0'),'Physical strikes deal real damage at '+fps+' FPS');}
 else assert(!kinds.some(k=>k==='bite'||k==='headSlam'),'No remote physical attack at '+fps+' FPS');
 r("var pausedRaid=JSON.stringify([DragonRaid.current,DragonRaid.head,DragonRaid.warning,DragonRaid.impact,DragonRaid.attackState]);state='pause';for(let i=0;i<120;i++)update(1/60)");assert.equal(r('JSON.stringify([DragonRaid.current,DragonRaid.head,DragonRaid.warning,DragonRaid.impact,DragonRaid.attackState])'),r('pausedRaid'));
}
console.log('PASS: QA-FIA3-ENTRY-001 r1 actual E/old-exit dispatch; OBJECTIVE-002 r1 active/returned/ended story; MOVESET-003 r1 near physical/far ranged, registered head/cue/weakspot and pause at 30/60/120 FPS.');
