'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),context=vm.createContext({});
vm.runInContext(require('./test-only-bootstrap.cjs').bossCatalog,context);vm.runInContext(fs.readFileSync(path.join(root,'assets/js/tower-rules.js'),'utf8')+';globalThis.rules=TowerRules;',context);
const rules=context.rules,classified=JSON.parse(fs.readFileSync(path.join(root,'data/boss-classification.json'),'utf8'));
const locales=JSON.parse(fs.readFileSync(path.join(root,'assets/i18n/locales.json'),'utf8'));
const plain=value=>JSON.parse(JSON.stringify(value));
assert(Object.isFrozen(rules.bossCatalog));assert(Object.isFrozen(rules.bossPool));
assert.equal(new Set(rules.bossPool).size,rules.bossPool.length,'No duplicate catalog IDs');
assert.deepEqual([...rules.bossPool].sort(),classified.map(entry=>entry.id).sort(),'Every classified boss, including new entries, needs a tower adapter');
const oldHealth={arenaCaptain:32,dungeonCaptain:36,cultTempleGuard:40,arenaSerpent:42,woundedAngel:38,dungeonCouncil:48,arenaCyclops:44};
assert.deepEqual([...rules.bossPool].slice(0,7),Object.keys(oldHealth),'Existing roster order is retained');
for(const entry of rules.bossCatalog){
 assert(Object.isFrozen(entry));assert.equal(entry.name,classified.find(item=>item.id===entry.id).name,'Names must follow the shared boss catalog');
 assert(Number.isSafeInteger(entry.baseHealth)&&entry.baseHealth>=32&&entry.baseHealth<=60);
 for(const language of ['hu','en'])assert.equal(typeof locales[language].dict[entry.name],'string','Existing localized name required for '+entry.id);
 if(Object.hasOwn(oldHealth,entry.id))assert.equal(entry.baseHealth,oldHealth[entry.id]);
}
const seeds=[1,2,7,33,34,35,0x12345678,0xffffffff];
for(const seed of seeds){
 for(const start of [1,11,26,1e6,0x100000000+11]){
  const primaries=[];
  for(let offset=0;offset<rules.bossPool.length;offset++){
   const floor=start+offset,spec=rules.floor(floor,seed),bosses=spec.enemies.filter(enemy=>enemy.towerBoss);
   assert.deepEqual(plain(spec),plain(rules.floor(floor,seed)),'Catalog rotation is deterministic');
   assert.equal(bosses.length,floor>=26?3:floor>=11?2:1);
   assert.equal(new Set(bosses.map(enemy=>enemy.towerEncounter)).size,bosses.length,'Simultaneous encounters must be different');
   assert.equal(spec.enemies.length,rules.enemyCount(floor),'Floor counts match actual boss-only or supported encounters');
   primaries.push(bosses[0].towerEncounter);
   for(const enemy of bosses){
    const entry=rules.bossCatalog.find(item=>item.id===enemy.towerEncounter);
    assert(entry);assert.equal(enemy.miniboss,entry.id);assert.equal(enemy.name,entry.name);
    assert(enemy.replay&&enemy.noReward&&enemy.towerEnemy&&!enemy.towerElite);
    assert.equal(enemy.maxHp,Math.min(Number.MAX_SAFE_INTEGER,Math.ceil(entry.baseHealth*(1+(floor-1)*.1))));
   }
  }
  assert.deepEqual(primaries.slice().sort(),[...rules.bossPool].sort(),'Every complete rotation reaches every boss from any floor/seed');
 }
}
for(const [cleared,kills]of [[5,17],[10,40],[25,145],[100,745]]){
 assert.equal(rules.legacyKillsThrough(cleared),kills,'Historical checkpoint enemy count remains recognizable');
 const checkpoint={seed:123,weapon:'katana',cleared,kills,elapsed:cleared*45};
 assert(rules.validCheckpoint(checkpoint));const run=rules.fromCheckpoint(checkpoint);assert(rules.valid(run));
 assert.equal(run.floor,cleared+1);assert.deepEqual(plain(run.checkpoint),{...checkpoint,legacyCleared:cleared});assert.equal(run.kills,kills);
 assert.equal(rules.advance(run,{kills:rules.floor(run.floor,run.seed).enemyCount,elapsed:30}).ok,true);
}
console.log('PASS: complete classified tower roster, existing localized names, full deterministic coverage, unique concurrent bosses and unchanged historical checkpoints.');
