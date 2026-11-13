'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'../assets/js/'+name+'.js'),'utf8');
const context=vm.createContext({});
vm.runInContext(require('./test-only-bootstrap.cjs').bossCatalog,context);
const mapDir=path.join(__dirname,'../assets/config/maps');context.MAP_DATA=Object.fromEntries(fs.readdirSync(mapDir).filter(name=>name.endsWith('.json')).map(name=>{const value=JSON.parse(fs.readFileSync(path.join(mapDir,name),'utf8'));return [value.id,value];}));
for(const name of ['story-raid-rules','map-catalog','story-raid-combat'])vm.runInContext(read(name),context);
const rules=vm.runInContext('StoryRaidRules',context);
let flags=[[],[],[],[]];
assert(rules.validate(flags),'Pre-raid saves do not need any new fields');
assert(!rules.available(flags)&&rules.advance(flags,rules.started)===null);
flags[0].push('thirdClanHaruTrailFound');
flags[3].push('dawnblade');
assert(rules.available(flags));
assert.equal(rules.encounters.length,9);
assert.equal(rules.encounters.filter(boss=>boss.soul).length,3);
assert.equal(new Set(rules.milestones).size,rules.milestones.length);
assert.equal(new Set(rules.encounters.filter(boss=>boss.soul).map(boss=>boss.soul)).size,3);
const commit=id=>{
 const before=JSON.stringify(flags),step=rules.advance(flags,id);
 assert(step);
 assert.equal(JSON.stringify(flags),before,'Transition never mutates the current save');
 flags=[step.japan,...flags.slice(1)];
 assert(rules.validate(flags));
 assert.equal(rules.advance(flags,id),null,'A committed reward cannot be earned twice');
 return step;
};
assert.equal(rules.advance(flags,rules.encounters[0].clear),null);
assert.equal(commit(rules.started).points,0);
for(const [index,boss] of rules.encounters.entries()){
 assert.equal(rules.checkpoint(flags),index);
 assert.equal(boss.tier,Math.floor(index/3));
 assert.equal(!!boss.soul,index%3===2);
 assert.equal(rules.advance(flags,rules.rescued),null);
 const reward=commit(boss.clear);
 assert.equal(reward.points,1);
 assert.equal(reward.soul,boss.soul??null);
 assert.equal(rules.bonusPoints(flags),index+1);
}
assert.equal(rules.checkpoint(flags),-1);
assert(!rules.recoilFree(flags),'A boss victory alone cannot grant the Dawnblade upgrade');
assert.equal(rules.advance(flags,rules.crossed),null);
commit(rules.rescued);
assert(rules.recoilFree(flags));
assert.equal(commit(rules.crossed).points,0);
assert.equal(rules.next(flags),null);
assert.equal(rules.rescueFrame(0).crossing,0);
assert.equal(rules.rescueFrame(2).collapse,0,'The gate stays raised while Haru crosses');
assert.equal(rules.rescueFrame(2.8).crossing,1,'Haru clears the gate before it falls');
assert.equal(rules.rescueFrame(4.15).collapse,1);
assert(rules.rescueFrame(4.15).finished);
for(const missing of rules.milestones.slice(0,-1)){
 assert(!rules.validate([flags[0].filter(id=>id!==missing),...flags.slice(1)]),missing+' is required');
}
assert(!rules.validate([[...flags[0],rules.crossed],...flags.slice(1)]),'Duplicate progression is invalid');
const loadout={weapon:'naginata',stats:{maxHp:28,damage:12.5,armor:55,dashCooldown:.41},
 normal:{duration:.6,impact:.27,damageScale:.9},heavy:{duration:1.12,impact:.49,damageScale:2.18},
 gear:{talisman:'triuneSerpentTalisman',spellArmor:true,weaponRank:9,armorRank:8},abilities:{dash:true,dawnblade:true}};
const copy=rules.snapshotMimic(loadout);
loadout.stats.maxHp=42;loadout.weapon='katana';loadout.heavy.damageScale=8;loadout.gear.spellArmor=false;
assert.equal(copy.weapon,'naginata');assert.equal(copy.stats.maxHp,28);
assert.equal(copy.heavy,undefined);assert.equal(copy.attacks.heavy.damageScale,2.18);
assert.equal(copy.gear.spellArmor,true);
let mimic=rules.startMimic(copy);
mimic=rules.hitMimic(mimic,99999);
assert.equal(mimic.phase,2);assert.equal(mimic.hp,28);assert(!mimic.defeated,'One hit cannot skip the second phase');
assert.equal(mimic.loadout,copy);
mimic=rules.hitMimic(mimic,28);assert(mimic.defeated);
assert.equal(rules.hitMimic(mimic,50),mimic);
let keeper=rules.startSignalKeeper();
assert.equal(rules.strikeSignalKeeper(keeper,1),keeper);
keeper=rules.markSignalKeeper(keeper,2);
assert.equal(rules.strikeSignalKeeper(keeper,1),keeper);
keeper=rules.strikeSignalKeeper(keeper,2);
assert.equal(keeper.interrupts,1);
assert.equal(rules.strikeSignalKeeper(keeper,2),keeper,'A mark can be used once');
let siege=rules.startSiegeWarden();
for(const index of [1,1,0])siege=rules.lightSignal(siege,index);
assert.equal(rules.fireWestheru(siege),siege,'Repeated use of a signal cannot replace the third signal');
siege=rules.fireWestheru(rules.lightSignal(siege,2));
assert(siege.shot);assert.equal(rules.fireWestheru(siege),siege);
const cave=vm.runInContext("MapCatalog.build('thirdClanCave')",context);
const maps=[1,2,3].map(tier=>vm.runInContext(`MapCatalog.build('storyRaidTier${tier}')`,context));
const grounded=(map,{x,y})=>map.platforms.some(platform=>x>=platform.x&&x<=platform.x+platform.w&&y===platform.y);
for(const [tier,map] of maps.entries()){
 assert.equal(map.storyRaidTier,tier);
 assert.equal(map.returnDestination.location,tier?maps[tier-1].id:cave.id);
 assert.equal(map.nextLocation,maps[tier+1]?.id);
 assert(grounded(map,map.start)&&grounded(map,map.returnPoint)&&grounded(map,map.exitPoint));
 assert.equal(map.arenas.length,3);
 for(const [index,arena] of map.arenas.entries()){
  assert.equal(arena.encounter,rules.encounters[tier*3+index]);
  assert(grounded(map,arena.spawn)&&grounded(map,arena.checkpoint));
  assert(arena.checkpoint.x<arena.triggerX&&arena.triggerX<arena.spawn.x&&arena.spawn.x<arena.x+arena.w);
  assert(index===0||map.arenas[index-1].x+map.arenas[index-1].w<arena.checkpoint.x);
  assert(map.rests.some(rest=>rest.id===arena.restId&&rest.x===arena.checkpoint.x));
  for(const point of arena.signals||arena.decoys||[])assert(grounded(map,point)&&point.x>arena.triggerX&&point.x<arena.x+arena.w);
 }
}
const combat=vm.runInContext('StoryRaidCombat',context);
const mimicBoss=combat.start(maps[2].arenas[2],copy);
assert.equal(mimicBoss.maxHp,28);
assert.equal(combat.chooseMove(mimicBoss,{x:mimicBoss.x+80,w:43}).damage,copy.stats.damage*copy.attacks.normal.damageScale);
assert(combat.damage(mimicBoss,100,{reduce:(amount,mirror)=>amount/(1+mirror.stats.armor/100)}));
assert.equal(mimicBoss.mimic.phase,2);
assert(!mimicBoss.dead);
assert(!combat.damage(mimicBoss,100),'The new phase has a brief hit guard');
mimicBoss.hitFlash=0;
assert(combat.damage(mimicBoss,28)&&mimicBoss.dead);
const siegeBoss=combat.start(maps[1].arenas[0]);
assert(!combat.damage(siegeBoss,9999),'Attacks cannot bypass Westheru’s shot');
for(const index of [2,0,1])siegeBoss.siege=rules.lightSignal(siegeBoss.siege,index);
siegeBoss.siege=rules.fireWestheru(siegeBoss.siege);
assert(combat.damage(siegeBoss,1));
const keeperBoss=combat.start(maps[0].arenas[1]);
for(const identity of [2,0,1]){
 keeperBoss.keeper=rules.markSignalKeeper(keeperBoss.keeper,identity);keeperBoss.hitFlash=0;
 assert(!combat.damage(keeperBoss,999,{identity:(identity+1)%3}));
 assert(combat.damage(keeperBoss,1,{identity}));
}
assert(keeperBoss.dead);
console.log('PASS: nine ordered raid checkpoints, one-time points and souls, rescue-gated Dawnblade, two Mimic phases and companion mechanics.');
