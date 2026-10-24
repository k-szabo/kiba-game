'use strict';
const assert=require('node:assert/strict');
const harness=require('./test-harness.cjs');
function encounter(){
 const h=harness();
 h.run("Prologue.stop();enterRealm(3);flags[3]=[];level={...levels[3],id:'shadowPrison',width:4400,height:1600,start:{x:3000,y:1040},arena:{x:3000,y:1040,w:1200},secrets:[],objects:[],gates:[],rests:[{id:'wardenTest',x:3100,y:1040,name:'zen.prison.name'}],enemies:[{id:'prisonWarden',miniboss:'prisonWarden',x:3650,y:1040,kind:'guard'}]};platforms=[{id:'wardenTestFloor',x:0,y:1040,w:4400,h:560,kind:'ground'}];checkpoint={...level.rests[0]};boss.dead=true;enemies=[PrisonWarden.create(level.enemies[0])];state='play';initPlayer({x:3510,y:1040});player.inv=999;var warden=enemies[0];warden.active=true;");
 return h;
}
function advance(h,seconds,fps=120){h.run('for(let n=0;n<'+Math.ceil(seconds*fps)+';n++)PrisonWarden.update(warden,'+1/fps+');');}
for(const fps of [30,60,120]){
 const h=encounter();h.run('warden.clock=0;player.inv=0;');advance(h,1/fps,fps);
 assert.equal(h.run('warden.phase'),'windup');assert.equal(h.run('warden.move'),'chainSweep');
 const tell=h.run('JSON.stringify({target:warden.targetX,face:warden.attackFace,box:warden.attackBox,x:warden.x})');
 advance(h,.9,fps);assert.equal(h.run('player.hp'),5,'Chain cannot deal damage during its one-second tell');
 h.run('player.x=warden.x+300;');advance(h,.04,fps);
 assert.equal(h.run('JSON.stringify({target:warden.targetX,face:warden.attackFace,box:warden.attackBox,x:warden.x})'),tell,'Telegraph, direction and target remain locked');
 advance(h,.3,fps);assert.equal(h.run('player.hp'),5,'Leaving the marked side dodges the chain');
 const hit=encounter();hit.run('warden.clock=0;player.inv=0;');advance(hit,1.2,fps);assert.equal(hit.run('player.hp'),3,'Chain deals two HP after tell at '+fps+' FPS');advance(hit,.25,fps);assert.equal(hit.run('player.hp'),3,'Chain hits at most once per strike');
 const frost=encounter();frost.run('warden.cycles=2;warden.clock=0;player.inv=0;');advance(frost,1/fps,fps);
 assert.equal(frost.run('warden.move'),'gravePulse');assert.equal(frost.run('warden.hazards.length'),3);
 const boxes=frost.run('JSON.stringify(warden.hazards.map(h=>({x:h.x,y:h.y,w:h.w,h:h.h})))');
 assert(frost.run('warden.hazards.every(h=>h.y+h.h===warden.arena.y&&h.warning===1.3&&!h.active)'));
 advance(frost,1.1,fps);assert.equal(frost.run('player.hp'),5,'Ground pulses do not damage during warning');
 frost.run('player.x=warden.arena.x+60;');advance(frost,.15,fps);
 assert.equal(frost.run('JSON.stringify(warden.hazards.map(h=>({x:h.x,y:h.y,w:h.w,h:h.h})))'),boxes,'Moving cannot retarget already warned ground pulses');
 advance(frost,.2,fps);assert.equal(frost.run('player.hp'),5,'Leaving all marked ground pulses avoids damage');
 const pulseHit=encounter();pulseHit.run('warden.cycles=2;warden.clock=0;player.inv=0;');advance(pulseHit,1.5,fps);assert.equal(pulseHit.run('player.hp'),3,'Active ground pulse deals two HP');
}
for(const hp of [150,75,30]){
 const h=encounter();h.run('warden.cycles=1;warden.clock=0;warden.hp='+hp+';');advance(h,.01);
 const target=h.run('JSON.stringify([warden.targetX,warden.targetY,warden.attackFace])');h.run('player.x=warden.x+250;');advance(h,1.3);
 const shots=h.run("projectiles.filter(p=>p.source==='mini:prisonWarden').length");assert.equal(shots,hp<=75?5:3,'Half-health lantern fan gains two bolts');
 assert.equal(h.run('JSON.stringify([warden.targetX,warden.targetY,warden.attackFace])'),target);
 assert(h.run("projectiles.filter(p=>p.source==='mini:prisonWarden').every(p=>p.kind==='shadowBolt'&&p.damage===1&&p.radius===10)"));
 advance(h,.5);assert.equal(h.run('warden.phase'),'recover');assert.equal(h.run('warden.phaseDuration'),hp<=75?.65:.9);
}
// Menus pause every animation and attack clock, including partially warned AoE.
for(const state of ['pause','dialog','inventory','developer','map']){
 const h=encounter();h.run("warden.cycles=2;warden.clock=0;PrisonWarden.update(warden,.01);state='"+state+"';");
 const before=h.run('JSON.stringify([warden,player,projectiles])');advance(h,3);assert.equal(h.run('JSON.stringify([warden,player,projectiles])'),before);
}
// Leaving/respawning clears only this encounter, keeping permanent progress.
{
 const h=encounter();h.run("warden.cycles=1;warden.clock=0;projectiles.push({source:'other',life:3});");advance(h,1.4);assert(h.run("projectiles.some(p=>p.source==='mini:prisonWarden')"));
 h.run('player.x=100;PrisonWarden.update(warden,.1);');assert.equal(h.run('warden.active'),false);assert.equal(h.run('warden.hp'),150);assert.equal(h.run('warden.hazards.length'),0);assert(h.run("projectiles.some(p=>p.source==='other')"));assert(!h.run("projectiles.some(p=>p.source==='mini:prisonWarden')"));
}
// Stale encounters and fatal damage must not continue against a replacement Momo.
{
 const h=encounter();h.run('warden.clock=0;PrisonWarden.update(warden,.01);var stale=warden;enemies=[];');const before=h.run('JSON.stringify([stale,player,flags,projectiles])');advance(h,2);assert.equal(h.run('JSON.stringify([stale,player,flags,projectiles])'),before);assert.equal(h.run('PrisonWarden.defeat(stale)'),false);
 const fatal=encounter();fatal.run('warden.clock=0;PrisonWarden.update(warden,.01);damage=function(){player={...player,hp:5};enemies=[];};');advance(fatal,1.4);assert.equal(fatal.run('warden.phase'),'strike');assert.equal(fatal.run('warden.attackElapsed'),0,'Dead encounter does not advance after synchronous replacement');
}
{
 const h=encounter();h.run('warden.hp=0;');const xp=h.run('progression.totalXp'),coins=h.run('coins');
 assert.equal(h.run('PrisonWarden.defeat(warden)'),true);assert(h.run("flags[3].includes('guardian:prisonWarden')"));assert.equal(h.run('progression.totalXp'),xp+180);assert.equal(h.run('coins'),coins+h.run('Merchant.rewards.miniboss'));
 assert.equal(h.run('PrisonWarden.defeat(warden)'),false);assert.equal(h.run('progression.totalXp'),xp+180);
 h.run('PrisonWarden.reset(warden);');assert.equal(h.run('warden.dead'),true,'Permanent defeat survives a regular reset');
 h.run('warden.replay=true;PrisonWarden.reset(warden);warden.active=true;warden.hp=0;');const before=h.run('JSON.stringify([progression,coins,flags])');assert.equal(h.run('PrisonWarden.defeat(warden)'),false);assert.equal(h.run('JSON.stringify([progression,coins,flags])'),before,'Dev replay neither mutates flags nor awards rewards');
}
console.log('PASS: Warden locked chain/ground tells at30/60/120FPS, timed damage/dodging, enraged fan/recovery, pause, stale/fatal guards, encounter cleanup and one-time replay-safe rewards.');
