'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),classified=Object.values(require('./test-only-bootstrap.cjs').bossData).sort((a,b)=>a.classificationOrder-b.classificationOrder);
const dir=path.join(root,'assets/config/bosses'),files=fs.readdirSync(dir).filter(f=>f.endsWith('.json'));
assert.equal(files.length,classified.length);
const h=require('./test-harness.cjs')(),r=h.run;
for(const record of classified){
 const data=JSON.parse(fs.readFileSync(path.join(dir,record.id+'.json'),'utf8'));
 assert.equal(data.id,record.id);assert.equal(data.name,record.name);assert.equal(data.schema,1);
 assert((data.story.hp>0||data.story.raidKind==='mimic')&&data.tower.baseHealth>0);
 assert.equal(r(`BossCatalog.get('${record.id}').name`),record.name);
 assert.equal(r(`TowerRules.bossCatalog.find(b=>b.id==='${record.id}').baseHealth`),data.tower.baseHealth);
 for(const key of data.assets)assert(r(`Object.hasOwn(ART_MANIFEST,${JSON.stringify(key)})`),'Missing asset '+key);
 assert(r(`Object.isFrozen(BossCatalog.story('${record.id}'))`));
}
for(const [controller,ids] of Object.entries({DungeonCombat:['dungeonCaptain','dungeonNecromancer','dungeonCouncil','cultTempleGuard','woundedAngel','cultHighPriestess'],ArenaCombat:['arenaCaptain','arenaSerpent','arenaCyclops','arenaFia']}))
 for(const id of ids)assert(r(`${controller}.profiles['${id}']===BossCatalog.story('${id}')`));
// A changed authored value must affect the actual constructor and the tower
// floor generator in a fresh VM; the config is not documentation-only.
const context=vm.createContext({console});const changed=Object.fromEntries(files.map(file=>{const b=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));return [b.id,b];}));
changed.watchtowerJailer.story.hp=1873;changed.watchtowerJailer.tower.baseHealth=47;
changed['main-0'].story.w=123;changed['main-0'].story.h=177;
changed.angel.story.w=99;changed.angel.story.h=166;
const source='const BOSS_DATA='+JSON.stringify(changed)+';\n'+fs.readFileSync(path.join(root,'assets/js/boss-catalog.js'),'utf8');
vm.runInContext(source,context);
vm.runInContext(`var level={arena:{x:0,y:760,w:1800}},flags=[[],[],[],[]],projectiles=[],enemies=[],state='play';const WatchtowerBalloonRules={progress:{}};const WatchtowerBalloon={};const clamp=(n,a,b)=>Math.max(a,Math.min(n,b));`,context);
for(const name of ['tower-rules','watchtower-balloon-combat'])vm.runInContext(fs.readFileSync(path.join(root,'assets/js/'+name+'.js'),'utf8'),context);
assert.equal(vm.runInContext("WatchtowerBalloonCombat.create({miniboss:'watchtowerJailer',x:800,y:760}).maxHp",context),1873);
assert.equal(vm.runInContext("TowerRules.bossCatalog.find(b=>b.id==='watchtowerJailer').baseHealth",context),47);
vm.runInContext(`var realm=0,defeated=[false,false,false,false];level.boss={x:100,y:760};level.secrets=[{id:'test',arena:level.arena}];const noBoss={is:()=>false};const FloatingIslands=noBoss,HannahCombat=noBoss,FiaCombat=noBoss,DungeonCombat=noBoss,ArenaCombat=noBoss,PrisonHunter=noBoss,PrisonWarden=noBoss,Serpents=noBoss,CampMaster=noBoss,DoomSlayer=noBoss;`,context);
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/combat.js'),'utf8'),context);
assert.equal(vm.runInContext('createBoss().w',context),123);
assert.equal(vm.runInContext('createBoss().h',context),177);
assert.equal(vm.runInContext('createBoss().y+createBoss().h',context),760);
vm.runInContext("var mini=createMiniboss({id:'changed',miniboss:'angel',secretArea:'test',x:500,y:760},0)",context);
assert.equal(vm.runInContext('mini.w',context),99);
assert.equal(vm.runInContext('mini.h',context),166);
assert.equal(vm.runInContext('mini.y+mini.h',context),760);
console.log('PASS canonical boss JSON coverage, immutable profiles, assets, story constructors and tower scaling');
