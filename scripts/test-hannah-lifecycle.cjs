/* Cross-module lifecycle coverage beyond the encounter's own attack clocks. */
'use strict';
const assert=require('node:assert/strict'),test=require('node:test'),harness=require('./test-harness.cjs');
const near=(actual,expected,message)=>assert(Math.abs(actual-expected)<1e-7,message||actual+' is near '+expected);
function setup(){
 const h=harness();h.run("HannahEncounter.clear();Dawnblade.resetJourney();Prologue.stop();realm=3;level=zigguratSummit;platforms=level.platforms.map(p=>({...p,dx:0}));flags=levels.map(()=>[]);defeated=levels.map(()=>false);enemies=[];projectiles=[];particles=[];checkpoint={...level.rests[0]};boss={dead:true};bossStarted=false;state='play';initPlayer({x:1450,y:1400});enemies=createEnemies();var hannah=enemies.find(HannahCombat.is);HannahCombat.update(hannah,.001);player.inv=999;");return h;
}
function transform(h){h.run('HannahCombat.hit(hannah,hannah.parts[0],1e9);');h.dismiss();h.run('for(let n=0;n<312;n++)HannahEncounter.update(1/120);');assert.equal(h.run('hannah.stage'),2);}
function dev(h){h.run('DevTools.open();DevSession.begin();DevTools.close();');assert(h.run('DevSession.active'));}

test('ultimate cooldown advances once per active frame in journey and prologue',()=>{
 for(const fps of [30,60,120]){
  const h=harness(),r=h.run;r("flags[3].push('dawnblade');Dawnblade.resetJourney();player.inv=999;Dawnblade.activate();");h.tick(1);near(r('Dawnblade.status().cooldown'),60-1/120);
  r('initPlayer(level.start);');assert.equal(r('Dawnblade.casting()'),false);near(r('Dawnblade.status().cooldown'),60-1/120,'Player reset preserves cooldown');
  r('Prologue.start();');const before=r('Dawnblade.status().cooldown');r('for(let n=0;n<'+fps+';n++)update('+1/fps+');');near(r('Dawnblade.status().cooldown'),before-1);
  for(const state of ['pause','dialog','developer']){r('state='+JSON.stringify(state)+';');const frozen=r('Dawnblade.status().cooldown');h.tick(120);assert.equal(r('Dawnblade.status().cooldown'),frozen);}
  r("state='play';resolutionBlocked=true;");const frozen=r('Dawnblade.status().cooldown');h.tick(120);assert.equal(r('Dawnblade.status().cooldown'),frozen);
 }
});

test('teleport and player replacement cancel pending ultimate impact without resetting cooldown',()=>{
 for(const operation of ['initPlayer(level.start)','enterRealm(0)']){
  const h=harness(),r=h.run;r("flags[3].push('dawnblade');Dawnblade.resetJourney();var impacts=0;resolveMeleeHit=()=>impacts++;Dawnblade.activate();Dawnblade.update(.3);");const cooldown=r('Dawnblade.status().cooldown');r(operation+';');assert.equal(r('Dawnblade.casting()'),false);near(r('Dawnblade.status().cooldown'),cooldown);
  r('Dawnblade.update(1);');assert.equal(r('impacts'),0);near(r('Dawnblade.status().cooldown'),cooldown-1);
 }
});

test('ultimate impact opening a story stops the rest of the active frame',()=>{
 const h=setup(),r=h.run;r("flags[3].push('dawnblade');hannah.hp=121;player.x=hannah.x-100;player.face=1;Dawnblade.activate();Dawnblade.update(.54);projectiles=[{source:'sentinel',x:player.x,y:player.y,vx:0,vy:0,life:9}];player.vx=180;var beforeX=player.x;");
 r('update(.02);');assert.equal(r('state'),'dialog');assert.equal(r('hannah.mode'),'transform');assert.equal(r('projectiles[0].life'),9);assert.equal(r('player.x'),r('beforeX'));
 const frozen=r('JSON.stringify([player,hannah,projectiles,Dawnblade.status()])');h.tick(120);assert.equal(r('JSON.stringify([player,hannah,projectiles,Dawnblade.status()])'),frozen);
});

test('main menu clears pending ultimate and encounter scene ownership',()=>{
 const h=setup(),r=h.run;r("flags[3].push('dawnblade');Dawnblade.activate();mainMenu();");assert.equal(r('Dawnblade.casting()'),false);assert.equal(r('HannahCombat.current(hannah)'),false);assert.equal(r('HannahEncounter.blocked()'),false);
 const scene=setup();scene.run('HannahCombat.hit(hannah,hannah.parts[0],1e9);mainMenu();');assert.equal(scene.run('HannahEncounter.locked()'),false);
});

test('developer dream teleport clears an interrupted summit scene',()=>{
 const h=setup(),r=h.run;r('HannahCombat.hit(hannah,hannah.parts[0],1e9);');dev(h);
 assert(r('DevTools.open()'));assert(r("DevTeleport.teleport({realm:'dream',rest:'dream'})"));r('DevTools.close();');
 assert(r('Prologue.active'));assert.equal(r('HannahEncounter.locked()'),false);assert.equal(r('HannahCombat.current(hannah)'),false);
});

test('developer Hannah revive restores phase-one geometry and has no persistent reward',()=>{
 const h=setup(),r=h.run;transform(h);dev(h);r('DevTools.open();');assert(r("DevBoss.revive({encounter:'Hannah'})"));r('DevTools.close();');
 assert.equal(r("platforms.find(p=>p.id==='ziggurat-summit-ground').y"),1400);assert.equal(r('HannahEncounter.visual().lift'),0);
 assert(r('enemies.find(HannahCombat.is).replay'));assert.equal(r('enemies.find(HannahCombat.is).stage'),1);assert.equal(r('enemies.find(HannahCombat.is).hp'),1200);
 const before=r('JSON.stringify([flags,progression,coins,shards,saved])');
 r("var replay=enemies.find(HannahCombat.is);replay.stage=2;replay.gateIndex=3;replay.mode='finisher';replay.active=true;replay.hp=160;HannahCombat.finishWithUltimate(replay);");
 assert.equal(r('JSON.stringify([flags,progression,coins,shards,saved])'),before,'Finishing the dev replay grants no flags, XP, points, coins, or save changes');
});

test('ultimate heavy-hit metadata reaches custom guard rules',()=>{
 const h=harness(),r=h.run;
 r("Prologue.stop();realm=0;level=makeLevel('testTemple',2500,1900,{x:100,y:1400});level.dungeon={id:'sectFall',floor:0};level.arena={x:600,y:1400,w:1600};ledge(level,'floor',0,1400,2500,'ground',400);platforms=level.platforms.map(p=>({...p}));boss={dead:true};bossStarted=false;enemies=[];initPlayer({x:1600,y:1400});enemies=[DungeonCombat.create({id:'guard',miniboss:'cultTempleGuard',x:1700,y:1400})];var guard=enemies[0];guard.active=true;guard.face=-1;player.face=1;attackKind='normal';flags[3].push('dawnblade');Dawnblade.resetJourney();var before=guard.hp;var expected=HannahRules.ultimateDamage(momoStats().damage);Dawnblade.activate();Dawnblade.update(.6);");
 near(r('before-guard.hp'),r('expected'),'Ultimate keeps its full shared damage against a guarded custom boss');assert(r('guard.guardBreak>0'));
});
