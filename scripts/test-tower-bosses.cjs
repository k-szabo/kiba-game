const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
function setup(seed=7,cleared=0){
 const h=harness(),r=h.run;r('persist();mainMenu();');
 const save=r('JSON.stringify(saved)'),flags=r('JSON.stringify(flags)'),writes=r('window.__saveSnapshots.length');
 r(`TowerStore.start({seed:${seed},weapon:'katana'});`);
 if(cleared)r(`TowerStore.saveCheckpoint({seed:${seed},weapon:'katana',cleared:${cleared},kills:TowerRules.killsThrough(${cleared}),elapsed:50});`);
 assert(r('TowerMode.open()'));assert(r('TowerMode.resume()'));
 return {...h,save,flags,writes};
}
// Distant support enemies engage from spawn; ordinary journey patrols stay local.
for(const fps of [30,60,120]){
 const h=setup(7),r=h.run;r('var distant=enemies[enemies.length-1];player.inv=999;');
 assert(r('distant.x-player.x>1000'));
 const x=r('distant.x');r(`updateEnemy(distant,1/${fps})`);assert(r('distant.x')<x,'Tower support immediately pursues Momo');
 r('distant.x=1600;distant.towerEnemy=false;distant.patrolFace=1;distant.face=1;distant.turnCooldown=0;');
 r(`updateEnemy(distant,1/${fps})`);assert(r('distant.x')>1600,'Journey enemy retains distance detection');
}
// The actual tower drawing path honors numeric health, including simultaneous bosses.
{
 const h=setup(13,25),r=h.run;r("var labels=[];ctx.fillText=text=>labels.push(text);CombatDisplay.set('bossHealth',true);TowerMode.draw();");
 assert(r('enemies.filter(e=>e.towerBoss).every(e=>labels.includes(DevBossHealth.value(e)))'));
 r("labels=[];CombatDisplay.set('bossHealth',false);TowerMode.draw();");
 assert(r('enemies.filter(e=>e.towerBoss).every(e=>!labels.includes(DevBossHealth.value(e)))'));
}
for(const seed of [1,2,3,4,5,6,7]){
 const h=setup(seed),r=h.run;r('var enemy=enemies[0];player.inv=999;');assert(r('enemy.towerBoss'));
 const seen=new Set();for(let n=0;n<30*120;n++){r('update(1/120)');const move=r('enemy.move');if(move)seen.add(move);}
 assert(seen.size>=2,r('enemy.miniboss')+' must perform its actual attacks');
 const before=r('enemy.hp');r("enemy.inv=0;enemy.active=true;player.face=1;player.x=enemy.x-15;player.y=level.arena.y-player.h;resolveMeleeHit({kind:'heavy',amount:2,hit:{...enemy}})");assert(r('enemy.hp')<before,'Shared melee reaches the real boss body');
 r('enemy.hp=0;killEnemy(enemy)');assert(r('enemy.dead'));assert.equal(r('TowerMode.phase'),'fight','A boss alone does not complete a floor with living supports');
 assert.equal(r('JSON.stringify(flags)'),h.flags);assert.equal(r('coins'),0);assert.equal(r('progression.level'),1);assert.equal(r('progression.xp'),0);assert.equal(r('window.__saveSnapshots.length'),h.writes);
 r('TowerMode.leave()');assert.equal(r('JSON.stringify(saved)'),h.save);
}
for(const fps of [30,60,120]){
 const h=setup(13,25),r=h.run;assert.equal(r('enemies.filter(e=>e.towerBoss).length'),3);r('player.inv=999;');
 const positions=r('enemies.filter(e=>e.towerBoss).map(e=>e.x)');assert.equal(new Set(positions).size,3);
 for(let i=0;i<fps*3;i++)r('update(1/'+fps+')');assert(r('enemies.filter(e=>e.towerBoss).every(e=>e.active&&e.cycles>0)'));
 r('pause()');const frozen=r('JSON.stringify([enemies,projectiles,TowerMode.snapshot()])');r('update(2)');assert.equal(r('JSON.stringify([enemies,projectiles,TowerMode.snapshot()])'),frozen);r('pause()');
 r('enemies.forEach(e=>{e.active=true;e.hp=0;killEnemy(e)});update(1/120)');assert.equal(r('TowerMode.phase'),'clear');assert.equal(r('TowerMode.snapshot().cleared'),26);assert.equal(r('TowerMode.snapshot().kills'),r('TowerRules.killsThrough(26)'));
}
// Damage scales inside the shared controllers, without changing ordinary fights.
{
 const h=setup(7),r=h.run;r("var enemy=enemies[0];enemy.active=true;enemy.move='captainCleave';enemy.phase='strike';enemy.clock=.3;enemy.attackElapsed=0;enemy.attackBoxes=[{...player}];enemy.hitDone=false;player.inv=0;player.guardCooldown=1;ArenaCombat.update(enemy,.01)");assert.equal(r('player.hp'),19,'First-floor boss melee is normalized to 1 HP');
 r("enemy.inv=0;enemy.active=true;enemy.phase='windup';enemy.move='captainBolts';enemy.clock=0;enemy.targetX=player.x;enemy.targetY=player.y;player.inv=999;update(1/120)");assert(r('projectiles.length>=3'));assert(r('projectiles.every(p=>p.damage===.5)'),'Each base 1-damage bolt is scaled once');
 r("enemies.forEach(e=>{e.active=true;e.hp=0;killEnemy(e)});update(1/120)");assert.equal(r('projectiles.length'),0,'Floor completion removes leftover attacks');
}
// The 26th-floor captain moves/attacks faster and uses the higher damage scale.
{
 const h=setup(3,25),r=h.run;r("var enemy=enemies[0];enemy.active=true;enemy.phase='wait';enemy.clock=5;player.x=1000;player.inv=999;");assert.equal(r('enemy.miniboss'),'arenaCaptain');const x=r('enemy.x'),speed=r('enemy.towerSpeed');r('update(1/120)');assert(Math.abs(r('enemy.x')-x-115*speed/120)<1e-6);
 r("enemy.move='captainCleave';enemy.phase='strike';enemy.clock=.3;enemy.attackElapsed=0;enemy.attackBoxes=[{...player}];enemy.hitDone=false;player.inv=0;ArenaCombat.update(enemy,.01)");assert.equal(r('player.hp'),20-2*r('enemy.towerDamageScale'));
}
console.log('PASS: seven rotating real boss controllers/attacks, shared melee, isolated rewards/saves, three concurrent bosses at30/60/120FPS, pause, normalized melee/projectiles and historical checkpoint kill totals.');
