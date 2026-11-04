'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const variants=[
 ['campMaster','CampMaster'],['prisonWarden','PrisonWarden'],['prisonHunter','PrisonHunter'],
 ['serpent','Serpents','lava'],['whiteSerpent','Serpents','white'],['wingedSerpent','Serpents','winged'],
 ['slayer','DoomSlayer'],['shadowNinjaLeader','FloatingIslands'],['voidGatekeeper','GatekeeperCombat']
];
function setup(id,controller,species){
 const h=harness(),r=h.run;
 r(`persist();mainMenu();var nativeSeed=Array.from({length:100},(_,i)=>i+1).find(seed=>TowerRules.floor(1,seed).enemies[0].miniboss==='arenaCaptain');TowerStore.start({seed:nativeSeed,weapon:'katana'});TowerMode.open();TowerMode.resume();
  var nativeSave=JSON.stringify(saved),nativeFlags=JSON.stringify(flags),nativeWrites=window.__saveSnapshots.length;
  var nativeController=${controller},nativeEnemy=nativeController.create({id:'native-test-${id}',miniboss:'${id}',${species?`serpentType:'${species}',`:''}x:900,y:level.arena.y,arena:level.arena,towerBoss:true,replay:true,noReward:true,towerDamageScale:.5});
  enemies=[nativeEnemy];projectiles=[];player.x=700;player.y=level.arena.y-player.h;player.inv=999;state='play';`);
 return h;
}
for(const [id,controller,species]of variants)for(const fps of [30,60,120]){
 const h=setup(id,controller,species),r=h.run,update=controller==='FloatingIslands'?'updateEnemy':'update';
 const seen=new Set();
 for(let i=0;i<fps*30;i++){
  r(`nativeController.${update}(nativeEnemy,1/${fps});`);const move=r('nativeEnemy.move');if(move)seen.add(move);
 }
 assert.equal(r('state'),'play',id+' must not open a campaign scene');assert(r('nativeEnemy.active&&!nativeEnemy.dead'),id+' must fight in the tower');
 assert(seen.size>=2,id+' must use distinct native attacks at '+fps+' FPS');
 r("state='pause';var nativePaused=JSON.stringify([nativeEnemy,projectiles]);");r(`nativeController.${update}(nativeEnemy,2);`);
 assert.equal(r('JSON.stringify([nativeEnemy,projectiles])'),r('nativePaused'),id+' pauses');r("state='play';");
 if(id==='shadowNinjaLeader'){
  r('nativeEnemy.hp=nativeEnemy.maxHp*.69;');r(`nativeController.${update}(nativeEnemy,1/${fps});`);
  assert(r('!nativeEnemy.dead&&!FloatingIslands.cinematic()'),'Tower ninja does not abduct Haru or escape at 70%');
 }
 if(id==='campMaster'){
  r('nativeEnemy.hp=nativeEnemy.maxHp*.05;');for(let i=0;i<fps*2;i++)r(`nativeController.${update}(nativeEnemy,1/${fps});`);
  assert.equal(r('nativeEnemy.executionStarted'),false,'Tower has no captive-execution state');
  assert.equal(r('nativeEnemy.summonThresholds.length'),2,'Ordinary reinforcement thresholds remain active');
 }
 r("projectiles.push({source:'unrelated-owner',life:4});nativeEnemy.hp=0;nativeEnemy.active=true;nativeController.defeat(nativeEnemy);");
 assert(r('nativeEnemy.dead'),id+' can be defeated');assert(r("projectiles.some(p=>p.source==='unrelated-owner')"),id+' leaves other boss attacks intact');
 assert.equal(r('JSON.stringify(flags)'),r('nativeFlags'),id+' does not write campaign flags');
 assert.equal(r('window.__saveSnapshots.length'),r('nativeWrites'),id+' does not write campaign saves');
 assert.equal(r('JSON.stringify(saved)'),r('nativeSave'));assert.equal(r('coins'),0);assert.equal(r('progression.totalXp'),0);
}
// Owner-specific effects cannot leak between simultaneous Slayer instances.
{
 const h=setup('slayer','DoomSlayer'),r=h.run;
 r("var otherSlayer=nativeController.create({...nativeEnemy,id:'other-slayer',x:1200,y:level.arena.y});enemies.push(otherSlayer);projectiles=[{slayer:true,slayerOwner:nativeEnemy.id},{slayer:true,slayerOwner:otherSlayer.id}];nativeController.clear(nativeEnemy);");
 assert.equal(r('projectiles.length'),1);assert.equal(r('projectiles[0].slayerOwner'),'other-slayer');
}
console.log('PASS: nine native tower bosses use distinct attacks at30/60/120FPS, pause, die without campaign rewards, retain other owners\' shots, and omit captive/ninja story events.');
