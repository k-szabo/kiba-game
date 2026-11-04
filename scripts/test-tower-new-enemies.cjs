'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const probe=harness(),r=probe.run,roles=['crossbow','shuriken','ninjutsu','assassin','wasp'];
const found=new Map();
for(let seed=1;seed<=80;seed++){
 const spec=r('TowerRules.floor(11,'+seed+')');
 for(const e of spec.enemies){
  if(e.towerBoss){assert(!e.balloonWasp&&!e.shadowNinjaRole,'Boss slots cannot inherit regular-enemy dispatch flags');continue;}
  const role=e.balloonWasp?'wasp':e.shadowNinjaRole;if(role&&!found.has(role))found.set(role,{seed,id:e.id});
 }
}
assert.deepEqual([...found.keys()].sort(),[...roles].sort(),'Every new regular archetype appears in real floor generation');
for(const role of roles)for(const fps of [30,60,120]){
 const h=harness(),r=h.run,{seed,id}=found.get(role);
 r('persist();mainMenu();');const normal=r('JSON.stringify(saved)'),writes=r('window.__saveSnapshots.length');
 r(`TowerStore.start({seed:${seed},weapon:'katana'});TowerStore.saveCheckpoint({seed:${seed},weapon:'katana',cleared:10,kills:TowerRules.killsThrough(10),elapsed:10});TowerMode.open();TowerMode.resume();`);
 const spec=r('TowerRules.floor(11,'+seed+').enemies.find(e=>e.id==='+JSON.stringify(id)+')');
 r('var target=enemies.find(e=>e.id==='+JSON.stringify(id)+');for(const e of enemies)if(e!==target)e.dead=true;player.x=target.x-180;player.y=760-player.h;player.inv=999;target.cd=.01;');
 assert.equal(r('target.maxHp'),spec.maxHp,'Tower scaling replaces campaign HP');assert.equal(r('target.damageValue'),spec.damageValue);
 if(role==='wasp'){assert.equal(r('target.w'),82);assert.equal(r('target.h'),60);}
 const journey=r('JSON.stringify([flags,progression,coins])');
 r(`var shots=0,attacks=0,moved=false,startX=target.x;for(let i=0;i<${fps*4};i++){update(1/${fps});if(projectiles.length)shots++;if(target.windup>0||target.attackTime>0)attacks++;if(Math.abs(target.x-startX)>1)moved=true;}`);
 assert(r('attacks>0'),role+' attacks through TowerMode at'+fps+' FPS');
 if(['crossbow','shuriken','ninjutsu'].includes(role))assert(r('shots>0'),role+' fires its native projectile');
 if(role==='wasp')assert(r('moved'),'Wasp pursues rather than freezing outside the campaign map');
 const frozen=r('JSON.stringify([target,player,TowerMode.snapshot()])');r("state='pause';update(1);");assert.equal(r('JSON.stringify([target,player,TowerMode.snapshot()])'),frozen);
 assert.equal(r('JSON.stringify([flags,progression,coins])'),journey,'Enemy behaviour cannot grant campaign progression');
 r("state='play';target.hp=0;killEnemy(target);update(1/120);");assert.equal(r('TowerMode.phase'),'clear');assert.equal(r('TowerMode.snapshot().cleared'),11);assert.equal(r('TowerMode.snapshot().kills'),r('TowerRules.killsThrough(11)'));
 assert.equal(r('window.__saveSnapshots.length'),writes,'No adventure save writes');r('TowerMode.leave();');assert.equal(r('JSON.stringify(saved)'),normal);
}
console.log('PASS: all four ninja roles and giant wasps spawn and fight in real tower floors at30/60/120 FPS, with scaled stats, paused clocks, clean boss slots and compatible checkpoint kills.');
