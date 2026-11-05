'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const h=harness(),r=h.run;h.sandbox.crypto={getRandomValues:a=>{a[0]=42;return a;}};
r('persist();mainMenu();TowerMode.open();');h.elements.get('towerWeapon').value='katana';assert(r('TowerMode.start()'));
r('var effectDraws=[];ctx.drawImage=(...args)=>effectDraws.push(args);');
for(const id of r('TowerRules.bossCatalog.map(p=>p.id)')){
 r(`var subject=TowerBossCombat.create({id:'vfx-${id}',miniboss:'${id}',towerEncounter:'${id}',x:900,y:TowerRules.layout.groundY,maxHp:100,towerBoss:true,towerDamageScale:1,towerSpeed:1});enemies=[subject];`);
 for(const phase of ['wait','windup','strike','recover']){
  r(`subject.phase='${phase}';subject.attackElapsed=.2;subject.attackDuration=.6;subject.attackBoxes=subject.attackBoxes||[];effectDraws=[];`);
  const before=r('JSON.stringify(subject)');
  assert(r('TowerBossArt.actor(subject)'),id+' has a visible registered native presentation');r('TowerBossArt.effects(subject)');
  assert.equal(r('JSON.stringify(subject)'),before,id+' rendering never advances combat state');
  assert(r('effectDraws.length>0'),id+' draws painted art during '+phase);
 }
}
for(const tower of [false,true]){
 r(`var seal=WatchtowerBalloonCombat.create({id:'seal-vfx',miniboss:'westheruSeal',x:900,y:760,arena:{x:100,y:760,w:1600},towerBoss:${tower}});seal.hazards=[{kind:'lightning',x:500,y:200,w:150,h:560,active:true,life:.4}];effectDraws=[];`);
 r(tower?'seal.towerEncounter="westheruSeal";TowerBossArt.actor(seal)':'WatchtowerBalloonArt.actor(seal)');
 assert(r('effectDraws.some(call=>call[0]===Visuals.peek("slayerLightning"))'),'Both story and tower use the approved painted lightning');
 assert(r('effectDraws.some(call=>call[0]===Visuals.peek("westheruSealArt"))'),'Both modes retain the complete native seal sprite');
}
// Special-boss adapters must preserve native projectile identity so the common
// projectile renderer selects the same artwork used by the campaign.
for(const [id,move,kind]of [['main-2','lightArrows','holyArrow'],['main-1','embers','ember'],['main-2','shadowBolts','shadowBolt']]){
 r(`projectiles=[];var caster=TowerBossCombat.create({id:'shots-${id}',miniboss:'${id}',towerEncounter:'${id}',x:900,y:760,arena:{x:100,y:760,w:1600},maxHp:100,towerBoss:true,towerDamageScale:1,towerSpeed:1});enemies=[caster];caster.move='${move}';caster.phase='windup';caster.clock=0;caster.targetX=300;caster.targetY=690;TowerBossCombat.update(caster,.01);`);
 assert(r(`projectiles.length>0&&projectiles.every(p=>p.kind==='${kind}')`),move+' uses its native projectile renderer');
}
console.log('PASS: every tower boss paints all phases without simulation writes; story/tower Westheru share the native lightning sprite; special projectiles preserve campaign artwork identity.');
