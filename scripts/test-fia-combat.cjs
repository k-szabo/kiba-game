'use strict';
const assert=require('node:assert/strict'),setup=require('./test-fia-fixture.cjs');
function fight(room=true){const h=setup(room),r=h.run;r("var npc=level.npcs.find(n=>n.id==='fia');initPlayer({x:npc.x-240,y:npc.y});FiaConflict.provoke({x:npc.x-35,y:npc.y-130,w:70,h:130});");h.dismiss();r('var fury=FiaConflict.enemy;player.inv=999;');return h;}
function advance(h,seconds,fps=120){h.run('for(let i=0;i<'+Math.ceil(seconds*fps)+';i++)FiaCombat.update(fury,'+1/fps+');');}
for(const room of [false,true])for(const fps of [30,60,120])for(let move=0;move<6;move++){
 const h=fight(room),r=h.run;r('fury.phase="wait";fury.cycles='+move+';fury.clock=0;');advance(h,.01,fps);assert.equal(r('fury.phase'),'windup');assert(r('fury.windupDuration>=.65'));
 const locked=r('JSON.stringify([fury.targetX,fury.targetY,fury.attackBoxes,fury.teleportTarget])');r('player.x+=100;');advance(h,.2,fps);assert.equal(r('JSON.stringify([fury.targetX,fury.targetY,fury.attackBoxes,fury.teleportTarget])'),locked,'Aim and destination stay locked after the tell');
 const before=r('JSON.stringify([fury,projectiles,player])');r("state='pause';");advance(h,2,fps);r('FiaCombat.updateStatus(2);');assert.equal(r('JSON.stringify([fury,projectiles,player])'),before);r("state='play'");advance(h,.8,fps);
 assert.equal(r('enemies.filter(e=>e.summoned||e.arenaMinion||e.dungeonSummon).length'),0,'Provoked Fia never summons');assert(r('fury.x>=fury.arena.x&&fury.x+fury.w<=fury.arena.x+fury.arena.w'));
 if(move===0||move===5)assert.equal(r('projectiles.filter(p=>p.fiaEffect==="foxfire").length'),move===0?5:7);
 if(move===2)assert(r('Math.abs(fury.x+fury.w/2-fury.targetX)>=220'),'Teleport does not land on the locked player target');
}
for(const fps of [30,60,120]){
 const h=fight(),r=h.run;r('fury.hp=450;fury.phase="wait";fury.cycles=3;fury.clock=0;player.inv=0;');advance(h,.01,fps);advance(h,.95,fps);assert.equal(r('player.hp'),2);assert.equal(r('fury.hp'),453,'Drain heals only the actual HP lost');
 r('fury.hp=450;fury.phase="wait";fury.cycles=3;fury.clock=0;player.inv=999;');advance(h,.01,fps);advance(h,.95,fps);assert.equal(r('fury.hp'),450,'Invulnerability cannot feed drain');
 r('fury.phase="wait";fury.cycles=4;fury.clock=0;player.inv=0;');advance(h,.01,fps);advance(h,.9,fps);assert(r('FiaCombat.status()?.remaining>0'));assert(r('Math.abs(FiaCombat.modifyMovement(285))<285'));
 r("state='dialog';");const charm=r('FiaCombat.status().remaining');r('FiaCombat.updateStatus(20);');assert.equal(r('FiaCombat.status().remaining'),charm);r("state='play';dash=.2;");assert.equal(r('FiaCombat.modifyMovement(285)'),285,'Charm preserves dash movement');r('dash=0;FiaCombat.updateStatus(1.25);');assert.equal(r('FiaCombat.status()'),null);
 r('fury.shieldRemaining=1;fury.inv=0;var box={x:fury.x,y:fury.y,w:fury.w,h:fury.h};');const hp=r('fury.hp');assert.equal(r('FiaCombat.hit(fury,box,20)'),0);advance(h,1.1,fps);r('fury.inv=0;');assert.equal(r('FiaCombat.hit(fury,box,20)'),20);assert.equal(r('fury.hp'),hp-20);
 r('fury.phase="wait";fury.cycles=0;fury.clock=0;');advance(h,.8,fps);r('var oldProjectile=projectiles.find(p=>p.fiaEffect);var victim=player;var beforeHp=player.hp;FiaConflict.abort();');assert(!r('FiaCombat.impact(oldProjectile,victim,beforeHp)'),'A retired owner cannot heal/damage a restored encounter');assert.equal(r('projectiles.filter(p=>p.source?.startsWith("fia:")).length'),0);
}
{
 const h=setup(),r=h.run;r('DevTools.open();DevSession.begin();');assert(r('DevBoss.revive({encounter:"fiaVengeance"})'));r('DevTools.close();var replay=FiaConflict.enemy;replay.shieldRemaining=0;');const before=r('JSON.stringify([flags,progression,saved])');r('FiaCombat.hit(replay,{x:replay.x,y:replay.y,w:replay.w,h:replay.h},9999);');assert.equal(r('JSON.stringify([flags,progression,saved])'),before,'Developer replay cannot grant or remove normal quest rewards');
 r('DevTools.open();');assert(r('DevAbilities.acquire({ability:"kiba-shield"})'));assert.equal(r('abilities.length'),2,'New passive does not change movement ability indices');assert.equal(r('FiaConflict.shield'),2);r('DevSession.end();');
}
console.log('PASS: six distinct source-owned Fia moves and locked fair cues in both rooms at30/60/120FPS, no summons, finite shield windows, actual-loss drain, pause/dash-safe charm, stale-owner safety and reward-free developer replay/passive ability.');
