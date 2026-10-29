'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const h=harness(),r=h.run,node=h.sandbox.document.getElementById('devBossHealth');
r("bossStarted=true;$('bossHud').hidden=false;DevBossHealth.hud()");assert(node.hidden,'Normal play has no numeric boss diagnostics');
r('DevTools.open();DevSession.begin();DevTools.close();enterRealm(0);bossStarted=true;boss.hp=12.25;updateHUD();DevBossHealth.hud()');
assert(!node.hidden);assert.equal(node.textContent,r('DevBossHealth.value(boss)'));assert(node.textContent.includes('12,25'));
r('boss.dead=true;DevBossHealth.hud()');assert(node.hidden,'Defeated boss has no diagnostic value');
r('Prologue.start();bossStarted=true;boss.hp=99998;Prologue.hud();DevBossHealth.hud()');
// Walking phase deliberately hides the prologue bar.
assert(node.hidden);r("$('bossHud').hidden=false;DevBossHealth.hud()");assert.equal(node.textContent,'99 998 / 100 000');
r('Prologue.stop();CampQuest.enter("zigguratSummit");globalThis.hpBoss=enemies.find(HannahCombat.is);hpBoss.active=true;hpBoss.hp=101.5;updateHUD();DevBossHealth.hud()');
assert(!node.hidden);assert.equal(node.textContent,r('DevBossHealth.value(hpBoss)'));
r('HannahEncounter.clear();CampQuest.enter("fiaChambers");DevTools.open();FiaConflict.replay();DevTools.close();globalThis.fiaHP=FiaConflict.enemy;fiaHP.hp=123.5;updateHUD();DevBossHealth.hud()');
assert(!node.hidden);assert.equal(node.textContent,r('DevBossHealth.value(fiaHP)'),"The secret Fia encounter owns its numeric HUD independently of bossStarted");
const drawn=[];h.sandbox.document.getElementById('world').getContext('2d').fillText=(text)=>drawn.push(text);
for(const text of ["{hp:13,maxHp:20}","{hp:2.25,maxHp:88.5}"]){r('DevBossHealth.bar('+text+',200,100,180)');assert.equal(drawn.at(-1),r('DevBossHealth.value('+text+')'));}
r('DevSession.end();DevBossHealth.hud()');assert(node.hidden);const count=drawn.length;r('DevBossHealth.bar({hp:3,maxHp:5},200,100,180)');assert.equal(drawn.length,count);
assert.equal(r('DevBossHealth.value({hp:3,maxHp:0})'),'');assert.equal(r('DevBossHealth.value({hp:NaN,maxHp:5})'),'');
console.log('PASS: isolated current/max boss HP, phase maxima, prologue, hidden/dead states, fractional formatting and Canvas diagnostics.');
