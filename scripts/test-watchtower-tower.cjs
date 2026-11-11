'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),types=['watchtowerJailer','watchtowerSentinel','balloonDragon','westheruSeal'];
function context(){
 const c=vm.createContext({console});
 vm.runInContext(require('./test-only-bootstrap.cjs').bossCatalog,c);vm.runInContext(`
 var level={tower:true,width:1800,arena:{x:0,y:760,w:1800,triggerX:0}},state='play',enemies=[],projectiles=[],flags=[[],[],[],[]],storyWrites=0;
 var player={x:200,y:690,w:42,h:70,hp:10000},TowerMode={running:true};
 const TowerSpecialBosses={is:()=>false},DungeonCombat={is:()=>false},ArenaCombat={is:()=>false},DoomSlayer={is:()=>false};
 const WatchtowerBalloon={active:()=>false,damageBalloon:()=>{throw Error('Tower must not damage journey balloon')},victory:()=>{throw Error('Tower must not write journey victory')}};
 const WatchtowerBalloonRules={progress:{},shouldEscape:(hp,max)=>hp<=max*.7};
 const DevDamage={record:()=>{}};
 const clamp=(n,a,b)=>Math.max(a,Math.min(n,b));
 const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 function damage(n){player.hp-=TowerBossCombat.damageAmount(n);return true;}
 function shoot(x,y,vx,vy,color,life,kind){projectiles.push({x,y,vx,vy,color,life,kind});}
 function createMiniboss(){throw Error('Native tower boss requires explicit adapter dispatch');}
 function updateMiniboss(){throw Error('Native tower boss requires explicit adapter dispatch');}
 function defeatMiniboss(){throw Error('Native tower boss requires explicit adapter defeat');}
 `,c);
 for(const file of ['tower-rules','watchtower-balloon-combat','tower-boss-combat'])vm.runInContext(fs.readFileSync(path.join(root,'assets/js/'+file+'.js'),'utf8'),c);
 return {run:s=>vm.runInContext(s,c)};
}
const classification=JSON.parse(fs.readFileSync(path.join(root,'data/boss-classification.json'),'utf8'));
for(const type of types){
 const h=context(),r=h.run,entry=r(`TowerRules.bossCatalog.find(p=>p.id==='${type}')`);
 assert(entry&&classification.some(c=>c.id===type&&c.name===entry.name));
 for(const fps of [30,60,120]){
  r(`enemies=[];projectiles=[];player.hp=10000;player.x=200;var boss=TowerBossCombat.create({id:'native-${type}',miniboss:'${type}',towerEncounter:'${type}',x:900,y:760,maxHp:100,towerBoss:true,towerDamageScale:.5,towerSpeed:1.2});enemies.push(boss);`);
  assert.equal(r('boss.hp'),100);assert.equal(r('boss.maxHp'),100);
  const before=r('JSON.stringify(flags)');
  if(type==='watchtowerSentinel'){
   r('boss.hp=60;TowerBossCombat.update(boss,.01)');assert.equal(r('boss.dead'),false,'Tower sentinel must remain until zero HP');
  }
  for(let i=0;i<fps*18;i++)r('TowerBossCombat.update(boss,1/'+fps+')');
  assert(r('boss.cycles>=2'),type+' must use native attack cycle at '+fps+' FPS');
  assert(r('projectiles.every(p=>p.towerOwner===boss.id&&p.towerScaled)'),type+' projectiles scoped and normalized');
  if(type==='balloonDragon')assert(r('projectiles.some(p=>p.damage===2)'), 'Dragon targets Momo with scaled shots');
  r("projectiles.push({source:'mini:'+boss.id});boss.hp=0;TowerBossCombat.defeat(boss)");
  assert(r('boss.dead&&!boss.active&&boss.hp===0'));
  assert.equal(r('projectiles.length'),0,'Defeat clears tagged and source-scoped shots');
  assert.equal(r('JSON.stringify(flags)'),before,'Tower fight preserves journey flags');
 }
}
const h=context(),r=h.run;
for(const [cycle,move,raw] of [[2,'windstorm',4],[4,'meteorShower',5]]){
 r(`
  enemies=[];player.x=250;player.hp=10000;
  var seal=TowerBossCombat.create({id:'seal',miniboss:'westheruSeal',x:800,y:760,maxHp:100,towerBoss:true,towerDamageScale:.5});
  enemies.push(seal);seal.cycles=${cycle};seal.clock=0;TowerBossCombat.update(seal,1/60);
  for(let i=0;i<120;i++)TowerBossCombat.update(seal,1/60);
 `);
 assert.equal(r('seal.move'),move);
 assert.equal(r('player.hp'),10000-raw*.5,move+' uses the tower damage scale');
 r('TowerBossCombat.defeat(seal)');
 assert.equal(r('seal.hazards.length'),0);
}
const checkpoint=r("var a=TowerRules.fresh(42,'katana');for(var i=0;i<5;i++)a=TowerRules.advance(a,{kills:TowerRules.enemyCount(a.floor),elapsed:10}).state;a.checkpoint");
assert.equal(checkpoint.cleared,5);assert.equal(checkpoint.kills,r('TowerRules.killsThrough(5)'));
assert.equal(r('TowerRules.validCheckpoint(a.checkpoint)'),true);
console.log('PASS: four native tower bosses at 30/60/120 FPS, zero-HP sentinel, scaled/scoped attacks, no journey writes and unchanged checkpoint accounting.');
