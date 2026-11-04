'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),harness=require('./test-harness.cjs');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/tower-special-bosses.js'),'utf8');
function setup(type='hannah',speed=1){
 const h=harness(),r=h.run;
 if(r('typeof TowerSpecialBosses')==='undefined')r(source);
 r("persist();mainMenu();TowerStore.start({seed:7,weapon:'katana'});TowerMode.open();TowerMode.resume();");
 r(`var special=TowerSpecialBosses.create({id:'special-test',miniboss:${JSON.stringify(type)},towerEncounter:${JSON.stringify(type)},towerBoss:true,noReward:true,replay:true,maxHp:48,towerSpeed:${speed},towerDamageScale:1,x:900,y:760,arena:level.arena});enemies=[special];player.inv=999;`);
 return h;
}
const ids=Object.keys(setup().run('TowerSpecialBosses.profiles'));
for(const fps of [30,60,120])for(const id of ids){
 const h=setup(id,1.4),r=h.run,before=r('JSON.stringify([flags,defeated,progression,coins,saved,window.__saveSnapshots])');
 r(`var seen=new Set();for(let step=0;step<${fps*24};step++){TowerSpecialBosses.update(special,1.4/${fps});if(special.move)seen.add(special.move);}`);
 assert(r('seen.size>=2'),id+' exercises distinct attacks at '+fps+' FPS');
 assert(r('Number.isFinite(special.x)&&Number.isFinite(special.y)&&special.parts.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))'));
 r("state='pause';var frozen=JSON.stringify(special);TowerSpecialBosses.update(special,2);");assert.equal(r('JSON.stringify(special)'),r('frozen'));r("state='play';");
 r('special.hp=0;TowerSpecialBosses.defeat(special);');assert(r('special.dead&&!special.active'));assert.equal(r('projectiles.filter(p=>p.towerSpecialOwner===special.id).length'),0);
 assert.equal(r('JSON.stringify([flags,defeated,progression,coins,saved,window.__saveSnapshots])'),before,'No journey event/reward for '+id);
}
{
 const h=setup('dragonRaid',1.6),r=h.run;
 assert(r('TowerSpecialBosses.protects(special)'));
 r("var wrong=TowerSpecialBosses.hit(special,99,'heavy',{x:special.x+special.w/2-5,y:special.y,w:10,h:10});");assert.equal(r('wrong.damage'),0);assert(r('special.legs.every(l=>l.hp===12)'));
 for(let i=0;i<2;i++)r(`special.legInv=0;TowerSpecialBosses.hit(special,12,'heavy',TowerSpecialBosses.legs(special)[${i}]);`);
 assert.equal(r('special.exposedRemaining'),6);assert.equal(r("TowerSpecialBosses.hit(special,2,'normal',special).damage"),8);assert(!r('TowerSpecialBosses.protects(special)'));
 assert.equal(r("TowerSpecialBosses.hit(special,2,'normal',{x:special.x,y:special.y,w:10,h:10}).damage"),0,'Only the fallen head is vulnerable');
 r('for(let i=0;i<359;i++)TowerSpecialBosses.update(special,1.6/60);');assert(r('special.exposedRemaining>0'));
 r('TowerSpecialBosses.update(special,1.6/30);');assert.equal(r('special.exposedRemaining'),0);assert(r('special.legs.every(l=>l.hp===12)&&special.stance==="standing"'));
}
{
 const h=setup('arenaFia',1.6),r=h.run;
 assert.equal(r("TowerSpecialBosses.hit(special,2,'normal',special).damage"),0);
 r('for(let i=0;i<361;i++)TowerSpecialBosses.update(special,1.6/60);');assert(r('special.exposedRemaining>4.9'));assert.equal(r("TowerSpecialBosses.hit(special,2,'normal',special).damage"),2);
 r('for(let i=0;i<301;i++)TowerSpecialBosses.update(special,1.6/60);');assert(r('special.shieldRemaining>0'));
}
{
 const h=setup('voidDemon'),r=h.run;r('special.hp=20;player.hp=18;var healed=TowerSpecialBosses.contact(special,player,20);');assert.equal(r('healed'),2*20*48/1800);assert.equal(r('TowerSpecialBosses.contact(special,player,20)'),0,'One damage event heals once');
 const hp=r('special.hp');assert.equal(r('TowerSpecialBosses.contact(special,player,18)'),0,'Fully blocked damage cannot heal');assert.equal(r('special.hp'),hp);
}
{
 const h=setup('hannah'),r=h.run;r('special.hp=20;for(let i=0;i<60*16;i++)TowerSpecialBosses.update(special,1/60);');assert.equal(r('special.stage'),2);assert(r('special.cycles>3'));
 const h2=setup('fiaRitual'),s=h2.run;s('special.hp=20;var spiritSeen=false,ritualMoves=new Set();for(let i=0;i<60*28;i++){TowerSpecialBosses.update(special,1/60);if(special.spirits.length)spiritSeen=true;if(special.ritualEffect)ritualMoves.add(special.ritualEffect);}');assert(s('spiritSeen'));assert(s('ritualMoves.size===4'));
}
console.log('PASS: all isolated special tower controllers, distinct attacks at30/60/120FPS, pause/rewards, shield windows, foreleg cycles, actual-loss lifesteal, Hannah phase and ritual spirits.');
