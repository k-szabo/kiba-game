const assert=require('node:assert/strict');
const h=require('./test-harness.cjs')(),{run}=h;
assert.equal(run('typeof CampMaster'),'object','Production loader includes the camp encounter module');
function setup(){
 run("Prologue.stop();defeated[0]=true;flags[0]=['forestBell','villageBell','campQuestAccepted','mayorExecuted'];enterRealm(0);level=samuraiCamp;platforms=level.platforms.map(p=>({...p,dx:0}));enemies=[CampMaster.create(level.enemies.find(e=>e.id==='campMaster'))];boss.dead=true;state='play';initPlayer({x:3860,y:1000});player.inv=0;var campTestEnemy=enemies[0];");
}
function step(count=1){run(`for(let n=0;n<${count};n++){updatePlayerTimers(1/120);CampMaster.update(campTestEnemy,1/120);}`);}
setup();
assert(run('CampMaster.is(campTestEnemy)'));
assert.equal(run('campTestEnemy.hp'),100);
assert.equal(run('campTestEnemy.dead'),false);
assert.equal(run('campTestEnemy.y+campTestEnemy.h'),1000);
// Every move has a full visible warning before damage, then a recovery window.
for(const [index,move,tellTime,pose] of [[0,'overhead',.7,3],[1,'lunge',.55,6],[2,'combo',.45,9]]){
 setup();run(`campTestEnemy.cycles=${index};campTestEnemy.clock=0;`);step();
 assert.equal(run('campTestEnemy.move'),move);
 assert.equal(run('campTestEnemy.phase'),'windup');
 assert.equal(run('campTestEnemy.clock'),tellTime);
 assert.equal(run('campTestEnemy.poseIndex'),pose);
 assert(run('campTestEnemy.attackBox.w>campTestEnemy.w'));
 assert.equal(run('player.hp'),5);
 const locked=run('campTestEnemy.attackFace');
 // A direction change during a tell must not snap its damage box around Momo.
 run('player.x=campTestEnemy.x-300;');step(8);
 assert.equal(run('campTestEnemy.attackFace'),locked);
 run('player.x=campTestEnemy.x+campTestEnemy.w+12;player.inv=0;');
 step(Math.ceil(tellTime*120)+3);
 assert.equal(run('player.hp'),move==='combo'?4:3,move+' deals its authored damage');
 assert.equal(run('campTestEnemy.phase'),'strike');
 step(180);
 assert(run("campTestEnemy.phase==='wait'||campTestEnemy.phase==='windup'||campTestEnemy.phase==='recover'"));
}
setup();run('campTestEnemy.cycles=1;campTestEnemy.clock=0;');step();const lungeStart=run('campTestEnemy.x');
step(90);assert(run('Math.abs(campTestEnemy.x-'+lungeStart+')>40'),'The lunge actually advances');
// Pauses and dialogs freeze pose, animation and attack timers.
for(const state of ['pause','dialog','developer','inventory']){
 setup();run(`state='${state}';`);
 const before=run('JSON.stringify(campTestEnemy)');step(120);
 assert.equal(run('JSON.stringify(campTestEnemy)'),before,state+' freezes the encounter');
}
setup();run("level=forestCamp;");const away=run('JSON.stringify(campTestEnemy)');step(120);assert.equal(run('JSON.stringify(campTestEnemy)'),away,'Other locations do not advance a stale boss');
setup();run('enemies=[];');const stale=run('JSON.stringify(campTestEnemy)');step(120);assert.equal(run('JSON.stringify(campTestEnemy)'),stale,'Removed entities do not advance');
// Two cuts respect the shared invulnerability clock; dodging the first still
// leaves the second live rather than treating the combo as one giant hit.
setup();run('campTestEnemy.cycles=2;campTestEnemy.clock=0;');step();step(170);
assert.equal(run('player.hp'),4,'First combo hit grants ordinary invulnerability');
setup();run('campTestEnemy.cycles=2;campTestEnemy.clock=0;player.x=campTestEnemy.x-300;');step();step(80);
assert.equal(run('player.hp'),5);assert.equal(run('campTestEnemy.comboStep'),1);
run('player.x=campTestEnemy.attackFace>0?campTestEnemy.x+campTestEnemy.w+12:campTestEnemy.x-70;player.inv=0;');step(50);
assert.equal(run('player.hp'),4,'Second combo cut remains a separate attack');
// A lethal hit replaces Momo and the encounter synchronously. No old attack
// can chase the new player at a shrine, and the execution remains remembered.
setup();run('checkpoint={...level.rests[1]};player.hp=1;campTestEnemy.clock=0;');step();step(100);
assert.equal(run('player.hp'),5);assert(run("flags[0].includes('mayorExecuted')"));
assert.equal(run('enemies.find(e=>e.id==="campMaster").active'),false);
// Optional boss rewards never touch main guardian ownership or bonus points.
setup();const coins=run('coins'),xp=run('progression.totalXp'),points=run('progression.points'),previousLevel=run('progression.level');
run('campTestEnemy.hp=0;CampMaster.defeat(campTestEnemy);');
assert(run("flags[0].includes('guardian:campMaster')"));assert.equal(run('coins'),coins+60);assert.equal(run('progression.totalXp'),xp+150);
assert.equal(run('progression.points'),points+run('progression.level')-previousLevel,'Only XP-earned levels grant points');
assert.equal(run("flags[0].includes('bossRewardClaimed')"),false);
run('CampMaster.defeat(campTestEnemy);');assert.equal(run('coins'),coins+60);assert.equal(run('progression.totalXp'),xp+150);
run('CampMaster.reset(campTestEnemy);');assert.equal(run('campTestEnemy.dead'),true);
run('campTestEnemy.replay=true;CampMaster.reset(campTestEnemy);campTestEnemy.hp=0;CampMaster.defeat(campTestEnemy);');
assert.equal(run('coins'),coins+60);assert.equal(run('progression.totalXp'),xp+150);
console.log('PASS: optional Camp Master telegraphs and locked facing, lunge movement, separate combo cuts, pause/location isolation, lethal respawn safety and once-only rewards.');
