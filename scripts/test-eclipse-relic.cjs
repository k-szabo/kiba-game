const assert=require('node:assert/strict');
const {run,snap,tick,dismiss,elements}=require('./test-harness.cjs')();
const validate=require('./test-save-validation.cjs');
function setup(items){
 run(`Prologue.stop();flags=[['forestBell','villageBell','guardian:oldAngel','guardian:oldCultist',...${JSON.stringify(items)}],['soulUpper','soulLower'],['dawnSeal']];abilities=[true,true];defeated=[true,true,false];visitedRests=[['start'],['start'],['start','arena']];progression=freshProgression();shards=0;enterRealm(2);state='play';bossStarted=true;`);
}
for(const relics of [[],['angelHalo'],['demonHorn'],['angelHalo','demonHorn']]){
 setup(relics);const secret=relics.length===2;
 run('hitBoss(boss.max/2);updateBoss(1.81);boss.inv=0;hitBoss(boss.hp);');
 if(secret){
  assert.equal(run('boss.stage'),3);assert.equal(run('boss.hp'),run('boss.max'));
  assert(!run("flags[2].includes('eclipseRelic')"),'Transformation is not victory');
  assert.deepEqual(Array.from(run('Inventory.contents()')),relics);
  run('updateBoss(1.81);boss.inv=0;hitBoss(boss.hp);');
 }else assert.equal(run('boss.stage'),2);
 assert(run('boss.dead&&defeated[2]'));assert.equal(snap().progression.totalXp,600);
 assert.equal(run("flags[2].includes('eclipseRelic')"),secret);
 assert.deepEqual(Array.from(run('Inventory.contents()')),secret?['seraphSoul','eclipseRelic']:['seraphSoul',...relics]);
 if(secret){
  assert.deepEqual(Array.from(snap().relics),['eclipseRelic']);
  assert.equal(elements.get('dialogTitle').textContent,run("I18n.t('relic.eclipse.name')"));
  assert(elements.get('dialogText').children.length>=5,'Victory dialogue retains paragraph breaks');
  assert(run("['angelHalo','demonHorn'].every(id=>flags[0].includes(id))"),'Historical flags prevent relic respawns');
  const xp=snap().progression.totalXp,shards=snap().shards;
  run('guardianDefeated();uniteVictoryRelics();');assert.equal(snap().progression.totalXp,xp);assert.equal(snap().shards,shards);
  assert.equal(run("flags[2].filter(id=>id==='eclipseRelic').length"),1);
 }
 dismiss();
 const saved=JSON.parse(run('JSON.stringify(saved)'));assert.deepEqual(JSON.parse(JSON.stringify(validate(saved))),saved);
 if(secret){
  for(const mutate of [data=>data.defeated[2]=false,data=>data.flags[0]=data.flags[0].filter(id=>id!=='angelHalo'),data=>data.flags[0]=data.flags[0].filter(id=>id!=='demonHorn'),data=>data.flags[0]=data.flags[0].filter(id=>id!=='guardian:oldAngel')]){
   const invalid=structuredClone(saved);mutate(invalid);assert.throws(()=>validate(invalid));
  }
  run('mainMenu();startGame(true);');assert.deepEqual(Array.from(run('Inventory.contents()')),['seraphSoul','eclipseRelic']);
  run('player.y=level.height+1000;player.inv=999;');tick();assert.deepEqual(Array.from(run('Inventory.contents()')),['seraphSoul','eclipseRelic']);assert(snap().defeated[2]);
  run("enterRealm(0);state='play';");assert.deepEqual(Array.from(run('Inventory.contents()')),['seraphSoul','eclipseRelic']);
  for(const id of ['angelHalo','demonHorn'])assert(run(`hasFlag('${id}')`),'Consumed original must stay collected on its map');
  run('persist();');assert.doesNotThrow(()=>validate(JSON.parse(run('JSON.stringify(saved)'))));
 }
}
// Holding both relics after a regular victory must not retroactively mint a reward.
setup([]);run("boss.stage=2;boss.hp=0;guardianDefeated();flags[0].push('angelHalo','demonHorn');");
assert(!run('uniteVictoryRelics()'));assert(!run("flags[2].includes('eclipseRelic')"));
console.log('PASS: fusion only on final hidden-form victory, no premature/regular reward, one XP/reward/dialog, inventory substitution, reload/death/travel persistence, no relic respawn and strict save prerequisites.');
