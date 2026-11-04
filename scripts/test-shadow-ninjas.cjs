'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
for(const fps of [30,60,120])for(const [role,kind,count]of [['crossbow','archer',1],['shuriken','archer',3],['ninjutsu','mage',2],['assassin','guard',0]]){
 const h=harness(),r=h.run;
 r("platforms=[{id:'ninja-test-floor',x:0,y:500,w:2000,h:300}];initPlayer({x:800,y:500});player.hp=player.maxHp=100;player.inv=0;projectiles=[];state='play';");
 const spec={id:'test-ninja',x:role==='assassin'?720:500,y:500,patrol:600,kind,shadowNinjaRole:role,grappleable:true};
 r('var ninja=createEnemy('+JSON.stringify(spec)+');ninja.cd=0;ninja.face=1;enemies=[ninja];');
 assert.equal(r('ninja.h'),82);assert.equal(r('ninja.w'),46);assert(r('ninja.hp>=85'));
 r('updateEnemy(ninja,1/'+fps+');');
 assert(r('ninja.windup>0'),'Attack is telegraphed before release');
 const target=r('ninja.targetX');
 r("state='pause';var beforePause=JSON.stringify(ninja);update(1);");
 assert.equal(r('JSON.stringify(ninja)'),r('beforePause'),'The real paused loop freezes ninja state');r("state='play';");
 if(role!=='assassin')r('player.x+=50;');
 for(let i=0;i<fps*2&&r('ninja.attackTime<=0');i++)r('updateEnemy(ninja,1/'+fps+');');
 assert(r('ninja.attackTime>0'),'Attack releases at '+fps+' FPS');
 assert.equal(r('ninja.targetX'),target,'The windup target is locked');
 assert.equal(r('projectiles.length'),count);
 assert(r('ninja.recovery>0&&ninja.cd>0'),'Release has recovery and cooldown');
 if(count){assert(r("projectiles.every(p=>p.source==='shadow-ninja'&&p.damage===ninja.damageValue&&Number.isFinite(p.vx)&&Number.isFinite(p.vy))"));assert(r('projectiles.every(p=>p.vx>0)'));}
 else assert(r('player.hp<100'),'The close-range tanto strike deals actual HP damage');
}
{
 const h=harness();
 assert.equal(h.run("ShadowNinjas.profile({shadowNinjaRole:'toString'})"),null,'Inherited object properties cannot select a profile');
 assert.equal(h.run("createEnemy({id:'ordinary',x:500,y:940,kind:'guard',patrol:50}).maxHp"),4,'The new faction does not change existing Japan enemies');
}
console.log('PASS: four shared ninja profiles, locked telegraphs, pause, distinct projectiles/melee and recovery at 30/60/120 FPS; existing enemies unchanged.');
