'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const catalog=harness().run('TowerRules.bossCatalog.map(p=>p.id)');
for(const [index,id]of catalog.entries()){
 const h=harness(),r=h.run;
 r(`persist();mainMenu();TowerStore.start({seed:${index||catalog.length},weapon:'katana'});TowerMode.open();TowerMode.resume();var target=enemies[0];player.inv=999;`);
 assert.equal(r('target.towerEncounter'),id);
 const saved=r('JSON.stringify([saved,flags,defeated,progression,coins,visitedRests,window.__saveSnapshots])');
 r(`var reads=new Set(),planned=new Set(),oldScope=Visuals.scope;
  Visuals.scope=(token,keys)=>{planned=new Set(keys);return oldScope(token,keys)};
  for(const key of Object.keys(ART_MANIFEST))Visuals.images[key]={get complete(){reads.add(key);return true},naturalWidth:1536,naturalHeight:1024};
  AssetLoading.prepare();reads.clear();for(let i=0;i<120*36;i++){update(1/120);if(i%120===0)TowerMode.draw();}`);
 assert.deepEqual(JSON.parse(r('JSON.stringify([...reads].filter(key=>!planned.has(key)))')),[],id+' plans every future attack/phase/summon image before fighting');
 assert(r('target.active&&!target.dead'),id+' remains an independent combat actor');
 assert(r('target.cycles>0||target.parts?.some(p=>p.cycles>0)'),id+' performs attacks in the real tower loop');
 r(`var invalid=[],drawn=0;for(const method of ['translate','moveTo','lineTo','rect','fillRect','strokeRect'])ctx[method]=(...values)=>{if(!values.every(Number.isFinite))invalid.push(method);};ctx.drawImage=(image,...values)=>{drawn++;if(!values.every(Number.isFinite))invalid.push('image');};TowerMode.draw();`);
 assert.equal(r('invalid.length'),0,id+' renders finite geometry');assert(r('drawn>0'));
 r('target.inv=0;');const before=r('target.hp');
 if(id==='arenaFia')r('target.shieldRemaining=0;target.exposedRemaining=5;');
 if(id==='dragonRaid'){
  r('for(const leg of TowerSpecialBosses.legs(target)){target.inv=0;target.legInv=0;resolveMeleeHit({kind:"heavy",amount:12,hit:leg});}');assert.equal(r('target.exposedRemaining'),6);
 }
 r('target.inv=0;resolveMeleeHit({kind:"heavy",amount:4,hit:{...target}});');
 assert(r('target.hp')<before,id+' receives shared weapon damage');
 r('target.hp=0;killEnemy(target);');assert(r('target.dead'),id+' dies without a story transition');assert.equal(r('TowerMode.phase'),'fight');
 assert.equal(r('JSON.stringify([saved,flags,defeated,progression,coins,visitedRests,window.__saveSnapshots])'),saved,id+' cannot change journey state');
 r('for(const e of [...enemies]){e.active=true;e.hp=0;killEnemy(e);}update(1/120);');assert.equal(r('TowerMode.phase'),'clear');assert.equal(r('TowerMode.snapshot().kills'),3,'Summons do not alter historical floor kill totals');
 r('const unlock=Date.now()+3000;Date.now=()=>unlock;TowerMode.claim(TowerRewards.choices(TowerMode.snapshot().seed,1)[0]);TowerMode.enterFloor();');assert.equal(r('TowerMode.phase'),'fight');
}
// Minions inherit their owner's damage once, including shots and per-owner cleanup.
{
 const h=harness(),r=h.run;r("mainMenu();var i=TowerRules.bossPool.indexOf('dungeonNecromancer');TowerStore.start({seed:i,weapon:'katana'});TowerMode.open();TowerMode.resume();var owner=enemies[0];owner.move='necroSummon';owner.phase='windup';owner.clock=0;owner.targetX=player.x;owner.targetY=player.y;player.inv=999;update(1/120);");
 assert.equal(r('enemies.filter(e=>e.towerSummonOwner===owner.id).length'),2);
 r("var minion=enemies.find(e=>e.towerSummonOwner===owner.id);minion.kind='archer';minion.windup=.001;minion.targetX=player.x;minion.targetY=player.y;minion.stun=0;projectiles=[];TowerBossCombat.updateSupport(minion,.01);");
 assert(r('projectiles.length>0'));assert.equal(r('projectiles[0].damage'),r('minion.damageValue'),'Summoned projectile is not scaled twice');assert.equal(r('projectiles[0].towerOwner'),r('owner.id'));
 r('owner.hp=0;killEnemy(owner);');assert(r('enemies.filter(e=>e.towerSummonOwner===owner.id).every(e=>e.dead)'));assert.equal(r('projectiles.length'),0);
}
{
 const h=harness(),r=h.run;r("mainMenu();var i=TowerRules.bossPool.indexOf('voidDemon');TowerStore.start({seed:i,weapon:'katana'});TowerMode.open();TowerMode.resume();var owner=enemies[0];owner.hp-=10;player.inv=0;dash=0;var before=owner.hp;TowerBossCombat.projectile({towerOwner:owner.id,damage:2,vx:100});");
 assert.equal(r('player.hp'),18);assert(Math.abs(r('owner.hp-before')-2*20*r('owner.maxHp')/1800)<1e-8,'Real HP loss heals exactly once');
 r('var healed=owner.hp;TowerBossCombat.projectile({towerOwner:owner.id,damage:2,vx:100});');assert.equal(r('owner.hp'),r('healed'),'Invulnerable impact cannot heal the demon');
}
console.log('PASS: complete roster through the actual tower loop; planned art, shared hits, isolated journey, single-scaled summon shots, cleanup and actual-loss demon healing.');
