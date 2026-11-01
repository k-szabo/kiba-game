'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),harness=require('./test-harness.cjs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../assets/js/combat-display.js'),'utf8');
function preferences(raw,{blocked=false}={}){
 const nodes={},writes=[],tools=[],end=[];let active=false;
 const context={localStorage:{getItem(){if(blocked)throw Error('blocked');return raw;},setItem(key,value){if(blocked)throw Error('blocked');writes.push([key,value]);raw=value;}},$:(id)=>nodes[id]||(nodes[id]={}),DevSession:{get active(){return active;},onEnd(fn){end.push(fn);}},DevTools:{register(tool){tools.push(tool);}},I18n:{onChange(){}},console};
 vm.createContext(context);vm.runInContext(source,context);const run=s=>vm.runInContext(s,context);run('CombatDisplay.init()');
 return {run,nodes,writes,tools,begin(){active=true;},end(){active=false;for(const fn of end)fn();},get stored(){return raw;}};
}
for(const raw of [null,'bad','null','[]','true','{"incoming":"true","outgoing":1,"bossHealth":null}']){
 const h=preferences(raw);for(const key of ['incoming','outgoing','bossHealth'])assert.equal(h.run(`CombatDisplay.get('${key}')`),false);
}
const saved=preferences('{"incoming":true,"outgoing":false,"bossHealth":true,"unexpected":true}');
assert(saved.run('CombatDisplay.get("incoming")'));assert(!saved.run('CombatDisplay.set("unexpected",true)'));assert(!saved.run('CombatDisplay.set("incoming",1)'));assert.equal(saved.writes.length,0);
saved.nodes.combatOutgoing.checked=true;saved.nodes.combatOutgoing.onchange();
assert.deepEqual(JSON.parse(saved.stored),{incoming:true,outgoing:true,bossHealth:true});assert.equal(saved.writes[0][0],'momo-combat-display');
const reload=preferences(saved.stored);assert(reload.run('CombatDisplay.get("outgoing")'),'A fresh page restores normal display preferences');
saved.begin();assert(!saved.run('CombatDisplay.get("incoming")'));assert(!saved.run('CombatDisplay.get("outgoing")'));assert(saved.run('CombatDisplay.get("bossHealth")'));
const normal=saved.stored;assert(saved.run('CombatDisplay.set("bossHealth",false)'));saved.run('CombatDisplay.set("incoming",true)');assert.equal(saved.stored,normal,'Test overrides never write normal preferences');
saved.end();assert(saved.run('CombatDisplay.get("bossHealth")'));assert(saved.nodes.combatIncoming.checked);saved.begin();assert(!saved.run('CombatDisplay.get("incoming")'),'A new test run gets clean defaults');
const blocked=preferences(null,{blocked:true});assert(blocked.run('CombatDisplay.set("incoming",true)'));assert(blocked.run('CombatDisplay.get("incoming")'),'Blocked storage still permits in-memory preferences');

const h=harness(),r=h.run;
r('CombatDisplay.set("incoming",true);player.hp=5;player.inv=0;damage(1.25)');
assert.equal(r('DevDamage.samples.length'),1);assert.equal(r('DevDamage.samples[0].amount'),1.25);
r('DevDamage.record("outgoing",{x:10,y:100,w:30},10,7)');assert.equal(r('DevDamage.samples.length'),1,'Outgoing is independent of incoming');
r('CombatDisplay.set("incoming",false);CombatDisplay.set("outgoing",true);DevDamage.record("outgoing",{x:10,y:100},10,7)');assert.equal(r('DevDamage.samples[0].amount'),3);
const before=r('JSON.stringify(DevDamage.samples)');r('state="pause";DevDamage.update(.5)');assert.equal(r('JSON.stringify(DevDamage.samples)'),before);
r('state="play";DevDamage.update(1)');assert.equal(r('DevDamage.samples.length'),0);
r('bossStarted=true;boss.hp=10.25;$("bossHud").hidden=false;CombatDisplay.set("bossHealth",true);DevBossHealth.hud()');assert(!h.elements.get('devBossHealth').hidden);
assert.equal(h.elements.get('devBossHealth').textContent,r('DevBossHealth.value(boss)'));
r('CombatDisplay.set("bossHealth",false);DevBossHealth.hud()');assert(h.elements.get('devBossHealth').hidden);
const normalSettings=h.storage.get('momo-combat-display');
r('DevTools.open();DevSession.begin();DevTools.close();CombatDisplay.set("incoming",true);CombatDisplay.set("bossHealth",false)');assert.equal(h.storage.get('momo-combat-display'),normalSettings);
r('DevSession.end()');assert(!r('CombatDisplay.get("incoming")'));assert(r('CombatDisplay.get("outgoing")'));assert(!r('CombatDisplay.get("bossHealth")'));
r('state="play";CombatDisplay.set("bossHealth",true);DevDamage.record("outgoing",{x:10,y:100},5,3);var DuelMode={active:true};DevDamage.update(.01);$("bossHud").hidden=false;DevBossHealth.hud()');
assert.equal(r('DevDamage.samples.length'),0,'Adventure numbers cannot leak into a duel');assert(h.elements.get('devBossHealth').hidden,'Adventure numeric HP is not a duel overlay');
console.log('PASS: independent normal combat displays, strict persisted preferences, storage failures, pause, boss HUD and isolated test overrides.');
