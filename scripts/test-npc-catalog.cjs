'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),dir=path.join(root,'assets/config/npcs');
const data=Object.fromEntries(fs.readdirSync(dir).filter(f=>f.endsWith('.json')).map(file=>{const r=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));assert.equal(file,r.id+'.json');return [r.id,r];}));
const source=fs.readFileSync(path.join(root,'assets/js/npc-catalog.js'),'utf8'),h=require('./test-harness.cjs')(),r=h.run;
const locales=JSON.parse(fs.readFileSync(path.join(root,'assets/i18n/locales.json'),'utf8'));
for(const record of Object.values(data)){
 assert.equal(record.schema,1);assert(['npc','enemy','boss'].includes(record.kind));assert(record.selectors.length);
 assert(record.art.sprites.length||record.art.procedural,'Every character must declare body art or its existing procedural renderer');
 if(record.name)for(const locale of Object.values(locales))assert(Object.hasOwn(locale.dict,record.name),'Unknown locale key: '+record.name);
 for(const sprite of record.art.sprites){
  assert(sprite.metadata||sprite.renderer,'Missing sprite registration reference');
  if(sprite.metadata){const [name,...parts]=sprite.metadata.split('.');assert(r(name+parts.map(p=>'['+JSON.stringify(p)+']').join('')),'Missing metadata '+sprite.metadata);}
 }
 for(const image of [...record.art.sprites.map(s=>s.image),...record.art.effects]){
  const file=r('ART_MANIFEST['+JSON.stringify(image)+']');assert(file,'Unknown art key: '+image);assert(fs.existsSync(path.join(root,file)));
 }
 assert(r('Object.isFrozen(NpcCatalog.get('+JSON.stringify(record.id)+').art.sprites)'));
 if(record.bossConfig){const boss=JSON.parse(fs.readFileSync(path.join(root,record.bossConfig),'utf8'));assert.equal(record.name,boss.name);assert.equal(r('NpcCatalog.forEnemy({miniboss:'+JSON.stringify(boss.id)+'},"japan")'),record.id);}
}
// Cover real map spawns rather than a duplicate list of expected role names.
assert(r(`(()=>{for(const map of [...levels,...Object.values(SIDE_LOCATIONS).map(s=>s.map)]){
 const faction=['japan','yomi','heaven','shadowCult'][map.enemyRealm??Math.max(0,levels.indexOf(map))];
 for(const spec of map.enemies)if(!NpcCatalog.forEnemy(spec,faction))throw Error('Uncatalogued enemy '+map.id+':'+spec.id);
 for(const spec of [...(map.npcs||[]),...(map.residents||[])])if(!NpcCatalog.find({npcId:spec.id}))throw Error('Uncatalogued NPC '+spec.id);
}return true;})()`));
assert.equal(r(`NpcCatalog.forEnemy({kind:'guard',raisedSamurai:true},'japan')`),'raised-samurai');
assert.equal(r(`NpcCatalog.forEnemy({kind:'guard',denResidentRole:'shadowNinja'},'shadowCult')`),'shadowNinja');
assert.equal(r(`NpcCatalog.forEnemy({kind:'mage',underworldHostileRole:'smith'},'shadowCult')`),'underworldSmith');
assert.equal(r(`NpcCatalog.find({npcId:'does-not-exist'})`),null);
assert.throws(()=>r(`NpcCatalog.get('does-not-exist')`),/Unknown NPC/);
// Authored base data is consumed by the actual enemy constructor.
const changed=structuredClone(data);changed['japan-guard'].combat.baseHp=13;changed['japan-guard'].combat.w=43;
const context=vm.createContext({console});
vm.runInContext('const NPC_DATA='+JSON.stringify(changed)+';\n'+source+`;const BossCatalog={story:()=>({hp:1})};const levels=[{width:2000}],level=levels[0],platforms=[],realm=0;const clamp=(n,a,b)=>Math.max(a,Math.min(n,b));`,context);
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/combat.js'),'utf8'),context);
const enemy=vm.runInContext(`createEnemy({id:'catalog-fixture',kind:'guard',x:400,y:1000,patrol:20})`,context);
assert.equal(enemy.maxHp,13);assert.equal(enemy.w,43);assert.equal(enemy.npcCatalogId,'japan-guard');
console.log('PASS NPC JSON coverage, body art references, immutable identities, map spawns and authored constructor data');
