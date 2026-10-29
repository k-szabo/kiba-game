'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const h=harness(),r=h.run;
const thresholds=()=>Array.from(r('boss.summonThresholds'));
function fresh(){
 r("Prologue.stop();flags=[['forestBell','villageBell'],['soulUpper','soulLower'],[],[]];abilities=[true,true];defeated=[true,false,false,false];progression=freshProgression();visitedRests=[['start'],['start','arena'],[],[]];enterRealm(1);state='play';bossStarted=true;enemies=[];boss.autoCooldown=999;boss.phase='recover';boss.clock=999;");
 h.place(1300,5800);
}
function burst(target){r('boss.inv=0;hitBoss(boss.hp-boss.max*'+target+')');}

// Every accepted post-hit HP crossing must be captured before a lava phase
// restores HP to its mandatory boundary. This reproduces the lost40/20 case.
for(const [target,wanted]of [[.5,[.8,.6]],[.35,[.8,.6,.4]],[.05,[.8,.6,.4,.2]],[-2,[.8,.6,.4,.2]]]){
 fresh();burst(target);assert.deepEqual(thresholds(),wanted,'Raw burst target '+target);
 assert.equal(r('boss.hp'),24);assert.equal(r('boss.yomiStage'),'shelter');assert(!r('boss.dead'));
 assert.equal(r('boss.summons.length'),wanted.length*2);
 r('for(let i=0;i<8;i++){checkBossHealth();queueYomiThresholds();}');assert.deepEqual(thresholds(),wanted,'Phase-clamped HP cannot duplicate a crossed threshold');
 assert.equal(r('hitBoss(999)'),false,'Shelter immunity must not enqueue more summons');
 r('updateBossHazards(1)');assert.equal(r('enemies.filter(e=>e.summoned&&!e.dead).length'),wanted.length*2,'Queued portals materialize during the shelter');
 r('endYomiShelter();boss.inv=0;hitBoss(999);');assert.deepEqual(thresholds(),[.8,.6,.4,.2]);
 assert.equal(r('boss.yomiStage'),'race');assert(Math.abs(r('boss.hp')-4.8)<1e-8);
 r('updateSummons(1)');assert.equal(r('enemies.filter(e=>e.summoned&&!e.dead).length'),8);
}

// Real bound attack inputs use their ordinary impact windows and shared damage
// computation. Heavy attacks and Dawnblade can cross several milestones at once.
for(const fps of [30,60,120])for(const [action,strength,wanted]of [['attack',40,[.8]],['heavyAttack',40,[.8,.6,.4,.2]],['ultimate',8,[.8,.6,.4,.2]]]){
 fresh();r('progression.stats.strength='+strength+';flags[3].push("dawnblade");Dawnblade.awaken();');
 h.place(r('boss.x-45'),5800);r('player.face=1;boss.inv=0;');
 h.press({action});const elapsed=action==='ultimate'?.58:action==='heavyAttack'?.42:.19;r('for(let i=0;i<'+Math.ceil(elapsed*fps)+';i++)update('+1/fps+')');h.release({action});
 assert.deepEqual(thresholds(),wanted,action+' at '+fps+'fps actual input crosses all expected milestones');
}

// Existing support platforms, warning time, snake and arena lifecycle remain
// intact. All eight kills, not merely threshold crossings, still own the key.
fresh();r('var island=platforms.filter(p=>p.bossPlatform).at(-1);');h.place(r('island.x+20'),r('island.y'));burst(-1);
assert.equal(r('boss.serpent.hp'),24);assert(r('boss.summons.every(p=>p.supportId)'));
r('updateBossHazards(1);boss.inv=999;');assert.equal(r('enemies.filter(e=>e.summoned).length'),8);
r("for(const victim of [...enemies].filter(e=>e.summoned)){resolveMeleeHit({amount:99,hit:{x:victim.x,y:victim.y,w:victim.w,h:victim.h},kind:'heavy'});}");
assert.equal(r('boss.councilMinionKills'),8);assert(!r("flags[1].includes('councilKeyEarned')"));
r('endYomiShelter();boss.inv=0;hitBoss(999);boss.inv=0;hitBoss(999);');h.dismiss();assert(r('defeated[1]'));assert(r("flags[1].includes('councilKeyEarned')"));
assert.equal(r("flags[1].filter(f=>f==='councilKeyEarned').length"),1);assert(!r('awardCouncilKeyDrop()'));

// Thresholds and queued portals are attempt-local. Saved progression and the
// optional key's kill requirement remain untouched by resets or immediate kills.
for(const cleanup of ['resetBossBattle()','revive()','enterRealm(0);enterRealm(1)']){
 fresh();burst(-1);const oldId=r('boss.encounterId');r(cleanup);assert.equal(r('boss.summons.length'),0);assert.deepEqual(thresholds(),[]);assert.equal(r('boss.councilMinionKills'),0);assert(!r('enemies.some(e=>e.summoned)'));assert.notEqual(r('boss.encounterId'),oldId);
 r('bossStarted=true;boss.inv=0;hitBoss(999);');assert.deepEqual(thresholds(),[.8,.6,.4,.2]);
}
fresh();burst(-1);r('endYomiShelter();boss.inv=0;hitBoss(999);boss.inv=0;hitBoss(999);');h.dismiss();assert(r('boss.dead'));assert(!r("flags[1].includes('councilKeyEarned')"),'Unkilled or pending minions cannot award a key');assert.equal(r('boss.summons.length'),0);
fresh();r('boss.inv=1;');assert.equal(r('hitBoss(999)'),false);assert.deepEqual(thresholds(),[]);
console.log('PASS: raw burst thresholds, actual normal/heavy/ultimate input, lava/snake boundaries, eight actual kills, support portals, immunity and encounter reset/cleanup.');
