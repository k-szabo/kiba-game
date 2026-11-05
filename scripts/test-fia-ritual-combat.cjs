'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function setup(ritual=true){
 const c=vm.createContext({});vm.runInContext(require('./test-only-bootstrap.cjs').bossCatalog,c);vm.runInContext(`
 let state='play',projectiles=[],particles=[],dash=0,player={x:620,y:751,w:43,h:69,hp:500,maxHp:500,inv:0},currentEnemy=null,empowered=0,victories=0,hits=[];
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 const DevImmortality={active:false},DevDamage={record(){}};
 const FiaConflict={current:e=>e===currentEnemy,onDefeated:e=>{victories++;return true;}};
 const FiaRitual={current:e=>e===currentEnemy&&e.ritual,onEmpowered:e=>{empowered++;state='dialog';},onDefeated:e=>{victories++;return true;}};
 function damage(amount,dir){if(player.inv>0||dash>0||DevImmortality.active)return false;player.hp=Math.max(0,player.hp-amount);hits.push({amount,dir});player.inv=.1;return true;}
 function shoot(x,y,vx,vy,color,life,kind){projectiles.push({x,y,vx,vy,color,life,kind});}
 `+fs.readFileSync(path.join(__dirname,'../assets/js/fia-combat.js'),'utf8'),c);
 const r=s=>vm.runInContext(s,c);r(`currentEnemy=FiaCombat.create({id:'trial',miniboss:'fiaVengeance',ritual:${ritual},x:1000,y:820,arena:{x:20,y:820,w:1800}});var boss=currentEnemy;`);return r;
}
for(const fps of [30,60,120]){
 const r=setup();assert.equal(r('boss.maxHp'),1800);
 // Capture a phase1 shot, then cross the halfway gate with an overkill hit.
 r('boss.phase="wait";boss.cycles=0;boss.clock=0;');for(let i=0;i<fps;i++)r(`FiaCombat.update(boss,1/${fps});player.inv=Math.max(0,player.inv-1/${fps});`);
 assert(r('projectiles.length>0'));r('var oldProjectile=projectiles[0],oldSource=FiaCombat.source(boss);boss.inv=0;boss.shieldRemaining=0;');
 assert.equal(r('FiaCombat.hit(boss,boss,100000)'),900);assert.equal(r('boss.hp'),900);assert.equal(r('empowered'),1);assert.equal(r('state'),'dialog');assert(r('boss.ritualEmpowered'));assert.equal(r('projectiles.length'),0);assert(r('FiaCombat.source(boss)!==oldSource'));
 const paused=r('JSON.stringify([boss,projectiles,player])');r('FiaCombat.update(boss,20);FiaCombat.updateStatus(20);');assert.equal(r('JSON.stringify([boss,projectiles,player])'),paused);
 r('state="play";');assert(!r('FiaCombat.impact(oldProjectile,player,player.hp+3)'),'Pre-empowerment attacks cannot affect the empowered owner');
 r('boss.inv=0;');assert.equal(r('FiaCombat.hit(boss,boss,1)'),1);assert.equal(r('empowered'),1);
 const start=r('boss.hp');r('boss.clock=10;boss.shieldRemaining=100;boss.shieldClock=-100;');for(let i=0;i<fps;i++)r(`FiaCombat.update(boss,1/${fps});`);assert(Math.abs(r('boss.hp')-(start-2))<1e-8);assert.equal(r('boss.shieldRemaining'),0);assert.equal(r('boss.shieldClock'),0);
 r('boss.hp=2;boss.clock=100;');r('FiaCombat.update(boss,10)');assert.equal(r('boss.hp'),1);assert.equal(r('victories'),0);r('boss.inv=0;');assert.equal(r('FiaCombat.hit(boss,boss,1)'),1);assert.equal(r('victories'),1);assert(r('boss.dead'));
 assert(!r('FiaCombat.hit(boss,boss,10)'));assert(!r('FiaCombat.impact(oldProjectile,player,player.hp+3)'));
}
for(const fps of [30,60,120])for(const [index,name,effect]of [[0,'ritualHymn','hymn'],[1,'ritualHell','hell'],[2,'ritualDragon','dragon'],[3,'ritualVoid','void']]){
 const r=setup();r('boss.shieldRemaining=0;FiaCombat.hit(boss,boss,100000);state="play";boss.inv=0;boss.hp=450;boss.phase="wait";boss.clock=0;boss.ritualCycles='+index+';');r(`FiaCombat.update(boss,1/${fps})`);
 assert.equal(r('boss.move'),name);assert.equal(r('boss.ritualEffect'),effect);assert(r('boss.windupDuration>=.6'));assert(r('boss.attackBoxes.length+boss.hazards.length>0'));
 const locked=r('JSON.stringify([boss.targetX,boss.targetY,boss.attackBoxes,boss.hazards.map(h=>[h.x,h.y,h.w,h.h])])');r('player.x+=200;');for(let i=0;i<Math.floor(fps*.2);i++)r(`FiaCombat.update(boss,1/${fps})`);assert.equal(r('JSON.stringify([boss.targetX,boss.targetY,boss.attackBoxes,boss.hazards.map(h=>[h.x,h.y,h.w,h.h])])'),locked);r('player.x-=200;');
 if(effect==='hell')r('player.x=boss.hazards[0].x+boss.hazards[0].w/2-player.w/2;');
 for(let i=0;i<Math.ceil(fps*1.25);i++)r(`FiaCombat.update(boss,1/${fps});player.inv=Math.max(0,player.inv-1/${fps});`);
 if(effect==='hymn'||effect==='dragon'){assert(r('projectiles.some(p=>p.ritualEffect==="'+effect+'")'));r('var p=projectiles.find(p=>p.ritualEffect),victim=player,before=player.hp;player.hp-=p.damage;');assert(r('FiaCombat.impact(p,victim,before)'));r('var prior=player.hp;currentEnemy=null;');assert(!r('FiaCombat.impact(p,victim,prior+3)'));}
 else assert(r('hits.length>0'),'Telegraphed '+effect+' area must actually hit the locked target');
 assert.equal(r('boss.shieldRemaining'),0);
}
{
 const r=setup(false);assert.equal(r('boss.maxHp'),900);r('boss.clock=100;FiaCombat.update(boss,9);');assert.equal(r('boss.hp'),900);assert.equal(r('boss.shieldRemaining'),3);assert.equal(r('empowered'),0);r('boss.shieldRemaining=0;boss.inv=0;');assert.equal(r('FiaCombat.hit(boss,boss,10000)'),900);assert.equal(r('victories'),1);assert.equal(r('empowered'),0);
}
for(const value of [0,-1,NaN,Infinity]){const r=setup();assert.equal(r('FiaCombat.hit(boss,boss,'+String(value)+')'),0);assert.equal(r('empowered'),0);assert.equal(r('boss.hp'),1800);}
{
 const samples=[];
 for(const hp of [900,90]){
  const r=setup();r('FiaCombat.hit(boss,boss,100000);state="play";boss.hp='+hp+';boss.phase="wait";boss.clock=0;boss.ritualCycles=2;FiaCombat.update(boss,.001);');
  const windup=r('boss.windupDuration');for(let i=0;i<120;i++)r('FiaCombat.update(boss,1/120)');
  samples.push({windup,count:r('projectiles.length'),speed:r('Math.hypot(projectiles[0].vx,projectiles[0].vy)'),damage:r('projectiles[0].damage')});
  assert(!r('FiaCombat.impact({},player,player.hp+3)'),'Unowned lookalike projectiles are rejected');
 }
 assert(samples[1].windup<samples[0].windup);assert(samples[1].count>samples[0].count);assert(samples[1].speed>samples[0].speed);assert(samples[1].damage>samples[0].damage);
}
console.log('PASS: ritual50% overkill gate, owner-generation retirement, paused empowerment, shield-free draining phase with final-hit floor, four locked telegraphed powers at30/60/120FPS and unchanged ordinary fight.');
