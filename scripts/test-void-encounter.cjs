'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),good=require('./test-dragon-raid-saves.cjs'),validate=require('./test-save-validation.cjs');
for(const fps of [30,60,120]){
 const h=harness(),r=h.run;r('saved='+JSON.stringify(good)+';startGame(true);');h.dismiss();
 r("FiaVoidJourney.apply(FiaJourneyRules.acceptVoid(fiaJourney,flags,defeated));CampQuest.enter('voidForbidden');enemies=[];initPlayer({x:1800,y:940});player.maxHp=player.hp=100;player.inv=0;VoidEncounter.update(.01);");
 assert(r('VoidEncounter.locked()'));assert(!r("CampQuest.enter('shadowDen')"));assert(!r("fastTravel(level.rests[0])"));
 r('var b=VoidEncounter.actor;VoidEncounter.hit({x:b.x,y:b.y,w:b.w,h:b.h},10000);');assert.equal(r('VoidEncounter.snapshot.hp'),700);assert.equal(r('VoidEncounter.snapshot.phase'),'absorbing');
 assert(!r('VoidEncounter.hit(VoidEncounter.actor,10000)'));r(`for(let i=0;i<${fps*2};i++)VoidEncounter.update(1/${fps});`);assert.equal(r('VoidEncounter.snapshot.phase'),'demon');assert.equal(r('VoidEncounter.snapshot.hp'),1000);assert.equal(r('VoidEncounter.snapshot.maxHp'),2000);
 const before=r('JSON.stringify(VoidEncounter.snapshot)');r('state="pause";VoidEncounter.update(10);state="play";');assert.equal(r('JSON.stringify(VoidEncounter.snapshot)'),before);
 // A real warned projectile carries an attempt/generation owner into impact.
 r('initPlayer({x:1550,y:940});player.hp=player.maxHp=100;player.inv=0;');
 for(let i=0;i<fps*10&&r('projectiles.length')===0;i++)r(`VoidEncounter.update(1/${fps});`);
 assert(r('projectiles.length>0'));r('var projectile=projectiles[0],victim=player,priorHp=player.hp;damage(4,1,true);VoidEncounter.projectile(projectile,victim,priorHp);');assert.equal(r('VoidEncounter.snapshot.hp'),1004);
 r('var savedHp=VoidEncounter.snapshot.hp;VoidEncounter.projectile(projectile,player,player.hp);');assert.equal(r('VoidEncounter.snapshot.hp'),r('savedHp'),'Invulnerable/zero-loss impacts cannot heal');
 r('var oldProjectile=projectile,oldVictim=player;revive();');assert.equal(r('VoidEncounter.snapshot.phase'),'lieutenant');r('var currentHp=VoidEncounter.snapshot.hp;VoidEncounter.projectile(oldProjectile,oldVictim,100);');assert.equal(r('VoidEncounter.snapshot.hp'),r('currentHp'));
 r('VoidEncounter.hit(VoidEncounter.actor,10000);VoidEncounter.update(2);VoidEncounter.hit(VoidEncounter.actor,10000);');assert(r("flags[3].includes('voidDemonDefeated')"));assert.equal(r('fiaJourney.voidInfection'),10);assert(!r('VoidEncounter.locked()'));assert.doesNotThrow(()=>validate(r('captureProgress()')));
}
{
 const h=harness(),r=h.run;r('saved='+JSON.stringify(good)+';startGame(true);');h.dismiss();
 r("FiaVoidJourney.apply(FiaJourneyRules.acceptVoid(fiaJourney,flags,defeated));CampQuest.enter('voidForbidden');enemies=[];initPlayer({x:1550,y:940});VoidEncounter.begin();VoidEncounter.hit(VoidEncounter.actor,10000);VoidEncounter.update(2);");
 for(let i=0;i<600&&r('projectiles.length')===0;i++)r('VoidEncounter.update(1/60)');
 assert(r('projectiles.length>0'));r('player.maxHp=player.hp=3000;player.inv=0;var target=player,before=player.hp,ownedShot=projectiles[0];damage(1500,1,true);VoidEncounter.projectile(ownedShot,target,before);');
 assert.equal(r('VoidEncounter.snapshot.phase'),'overwhelmed');assert.equal(r('VoidEncounter.pose'),7);assert.equal(r('state'),'dialog');assert(!r("flags[3].includes('voidDemonDefeated')"));h.dismiss();assert.equal(r('VoidEncounter.snapshot.phase'),'lieutenant');assert.equal(r('fiaJourney.voidInfection'),0);
}
console.log('PASS: real void encounter at30/60/120 FPS, 70% overkill clamp, half-health transformation, pause, actual-damage drain, full-health failure/retry, stale retry isolation, locked arena and strictly saved permanent victory.');
