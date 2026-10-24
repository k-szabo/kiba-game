const assert=require('node:assert/strict');
const harness=require('./test-harness.cjs');
function encounter(){
 const h=harness();
 h.run("Prologue.stop();defeated[0]=true;flags[0]=['forestBell','villageBell','campQuestAccepted','mayorExecuted'];enterRealm(0);level=samuraiCamp;platforms=level.platforms.map(p=>({...p,dx:0}));enemies=[CampMaster.create(level.enemies.find(e=>e.id==='campMaster'))];boss.dead=true;state='play';initPlayer({x:3500,y:1000});player.inv=999;var master=enemies[0];master.active=true;");
 return h;
}
function advance(h,seconds,fps=120){h.run('for(let n=0;n<'+Math.ceil(seconds*fps)+';n++)CampMaster.update(master,'+(1/fps)+');');}
const supportCount=h=>h.run('enemies.filter(e=>e.campMasterOwner===master.encounterToken&&!e.dead).length');
for(const fps of [30,60,120]){
 const h=encounter();h.run('master.cycles=3;master.clock=0;');advance(h,1/fps,fps);
 assert.equal(h.run('master.move'),'jumpCut');assert.equal(h.run('master.phase'),'windup');
 const tx=h.run('master.jumpTargetX');
 h.run('player.x=4200;');advance(h,.4,fps);assert.equal(h.run('master.jumpTargetX'),tx,'Jump target locks during tell');
 assert.equal(h.run('master.y'),h.run('master.baseY'),'No takeoff during warning');
 advance(h,.65,fps);assert(h.run('master.y<master.baseY-75'),'Boss visibly rises at '+fps+' FPS');
 assert.equal(h.run('player.hp'),5,'Moving out of the landing cue avoids damage');
 advance(h,.9,fps);assert.equal(h.run('master.y'),h.run('master.baseY'),'Jump lands at authored floor');
 assert(h.run('master.x>=master.patrolLeft&&master.x<=master.patrolRight'),'Jump stays in arena');
 const hit=encounter();hit.run('master.cycles=3;master.clock=0;player.inv=0;');advance(hit,1/fps,fps);advance(hit,1.85,fps);
 assert.equal(hit.run('player.hp'),2,'Landing cut deals three damage at '+fps+' FPS');
}
// Large damage bursts cross each reinforcement milestone once, not one per frame.
{
 const h=encounter();h.run('master.hp=35;');advance(h,1/120);
 assert.deepEqual(JSON.parse(h.run('JSON.stringify(master.summonThresholds)')),[.6,.4]);
 assert.equal(h.run('master.summons.length'),4);assert.equal(supportCount(h),0,'Summons have a warning window');
 advance(h,1.05);assert.equal(supportCount(h),4);advance(h,1.1);assert.equal(supportCount(h),4,'No duplicate threshold reinforcements');
 h.run('var summoned=enemies.find(e=>e.campMasterOwner===master.encounterToken);var beforeSupportX=summoned.x;player.x=4000;CampMaster.updateSupport(summoned,.1);');
 assert(h.run('summoned.x!==beforeSupportX'),'Owned melee reinforcements actively pursue Momo');
 h.run('CampMaster.reset(master);');assert.equal(supportCount(h),0);assert.equal(h.run('master.hp'),100);assert.equal(h.run('master.summons.length'),0);
}
for(const fps of [30,60,120]){
 const h=encounter();h.run('master.hp=9;master.clock=99;');advance(h,1.1,fps);
 assert.equal(h.run('master.executionStarted'),true);assert.equal(h.run('enemies.filter(e=>e.campExecutioner&&!e.dead).length'),3);
 const time=h.run('master.executionRemaining');assert(time>14&&time<15,'Timer begins after the archer warning');
 h.run("state='pause';");advance(h,4,fps);assert.equal(h.run('master.executionRemaining'),time,'Pause freezes the execution countdown');
 h.run("state='play';for(const e of enemies)if(e.campExecutioner)e.dead=true;");advance(h,1/fps,fps);
 assert.equal(h.run('master.executionResolved'),true);assert.equal(h.run('master.executionRemaining'),0,'Defeating all archers stops execution');
 advance(h,18,fps);assert.equal(h.run('master.hp'),9,'No delayed failure after the archers die');
}
// Reaching the deadline resets this attempt and never persists captive loss.
{
 const h=encounter();h.run('master.hp=9;master.clock=99;');advance(h,17);
 assert.equal(h.run('master.hp'),100);assert.equal(supportCount(h),0);
 assert.equal(h.run("flags[0].includes('guardian:campMaster')"),false);
 assert.equal(h.run("flags[0].some(flag=>/Lost|Killed|Dead|Executed/.test(flag)&&flag!=='mayorExecuted')"),false);
 assert.equal(h.run("flags[0].includes('campMasterSoul')"),false);
 h.dismiss();h.place(3500,1000);h.run("state='play';master.hp=9;master.active=true;master.clock=99;");advance(h,1.1);
 assert.equal(h.run('enemies.filter(e=>e.campExecutioner&&!e.dead).length'),3,'A new attempt can spawn fresh archers');
 h.run('master.hp=0;CampMaster.defeat(master);');
 assert.equal(supportCount(h),0);assert(h.run("flags[0].includes('campMasterSoul')"));
 assert.equal(h.run('master.executionRemaining'),0,'Victory cancels the deadline');
 h.dismiss();const flags=h.run('JSON.stringify(flags)'),xp=h.run('progression.totalXp'),coins=h.run('coins');
 h.run('CampMaster.defeat(master);');assert.equal(h.run('JSON.stringify(flags)'),flags);assert.equal(h.run('progression.totalXp'),xp);assert.equal(h.run('coins'),coins);
 h.run("master.replay=true;CampMaster.reset(master);master.active=true;master.hp=0;CampMaster.defeat(master);");
 assert.equal(h.run('progression.totalXp'),xp);assert.equal(h.run('coins'),coins,'Developer replay cannot duplicate the rewards');
}
// Removed entities and other locations cannot mutate a replacement encounter.
{
 const h=encounter();h.run('master.hp=9;');advance(h,1.1);h.run('var oldSupport=enemies.find(e=>e.campExecutioner);enemies=enemies.filter(e=>e!==oldSupport);');
 const before=h.run('JSON.stringify(oldSupport)');h.run('CampMaster.updateSupport(oldSupport,1);');assert.equal(h.run('JSON.stringify(oldSupport)'),before);
 h.run('level=forestCamp;');const masterBefore=h.run('JSON.stringify(master)');advance(h,2);assert.equal(h.run('JSON.stringify(master)'),masterBefore);
}
console.log('PASS: Camp Master jump registration/damage at 30/60/120 FPS, exact HP-threshold reinforcements, live support aggro, interruptible paused execution, retry without permanent losses, once-only soul rewards and stale-entity isolation.');
