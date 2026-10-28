'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const config=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/config/keybindings.json'),'utf8'));
const source=fs.readFileSync(path.join(__dirname,'../assets/js/keybindings.js'),'utf8');
const copy=value=>JSON.parse(JSON.stringify(value)),key='momo-keybindings-v1';
function fixture(stored){
 const writes=new Map();if(stored)writes.set(key,JSON.stringify(stored));
 const sandbox=vm.createContext({KEY_BINDINGS:copy(config),localStorage:{getItem:k=>writes.get(k)||null,setItem:(k,value)=>writes.set(k,value)}});
 vm.runInContext(source,sandbox);const run=code=>vm.runInContext(code,sandbox),read=action=>copy(run('Bindings.read('+JSON.stringify(action)+')'));
 return {run,read,writes,export:()=>copy(run('Bindings.exportData()'))};
}
function unique(f){const all=copy(f.run('Bindings.actions.flatMap(action=>Bindings.read(action))'));assert.equal(new Set(all).size,all.length,'Each physical input has one owner');assert(f.run('Bindings.actions.every(action=>Bindings.read(action).length>0)'));}
assert.equal(config.version,1,'Export protocol remains compatible');assert.equal(config.revision,3);
for(const profile of ['original','uk','fr']){
 const f=fixture();f.run('Bindings.choose('+JSON.stringify(profile)+')');
 assert.deepEqual(f.read('attack'),profile==='fr'?['mouse0','w']:['mouse0','z']);
 assert.deepEqual(f.read('heavyAttack'),['mouse2']);assert.deepEqual(f.read('dash'),['shift']);assert.deepEqual(f.read('useMeat'),[profile==='fr'?'a':'q']);
 assert.deepEqual(f.read('moveLeft'),profile==='fr'?['q','arrowleft']:['a','arrowleft']);
 assert.deepEqual(f.read('jump'),profile==='fr'?[' ','z','arrowup']:[' ','w','arrowup']);
 for(const [action,old]of [['attack','j'],['heavyAttack','h'],['dash','k'],['useMeat','o']])assert(!f.read(action).includes(old),'Removed old alias '+old);
 unique(f);assert.equal(f.export().revision,3);
 f.run("Bindings.setPrimary('attack','mouse2')");assert.deepEqual(f.read('heavyAttack'),['mouse0'],'Occupied mouse buttons exchange');unique(f);
 const data=f.export(),restored=fixture();assert(restored.run('Bindings.importData('+JSON.stringify(data)+')'));assert.deepEqual(restored.export(),data);unique(restored);
 const reloaded=fixture(JSON.parse(f.writes.get(key)));assert.deepEqual(reloaded.export(),data,'Current custom inputs survive browser reload');
 f.run('Bindings.reset()');assert.deepEqual(f.read('attack'),profile==='fr'?['mouse0','w']:['mouse0','z']);assert.deepEqual(f.read('heavyAttack'),['mouse2']);
}
// Untouched old profiles adopt the new defaults; custom old profiles preserve
// the whole effective mapping so implicit defaults cannot steal explicit keys.
for(const modified of [{},{original:{}}]){
 const f=fixture({profile:'original',modified});assert.deepEqual(f.read('attack'),['mouse0','z']);assert.deepEqual(f.read('useMeat'),['q']);assert.equal(JSON.parse(f.writes.get(key)).revision,3);
}
{
 const f=fixture({profile:'original',modified:{original:{attack:['q']}}});
 assert.deepEqual(f.read('attack'),['q']);assert.deepEqual(f.read('useMeat'),['o'],'New heal Q cannot steal a custom attack Q');assert.deepEqual(f.read('heavyAttack'),['h']);assert.deepEqual(f.read('dash'),['k','shift']);unique(f);
 const next=fixture(JSON.parse(f.writes.get(key)));assert.deepEqual(next.export(),f.export(),'Rebasing is durable and happens once');
 f.run("Bindings.choose('uk')");assert.deepEqual(f.read('attack'),['mouse0','z'],'Unmodified UK profile still receives the new controls');f.run("Bindings.choose('original');Bindings.reset()");assert.deepEqual(f.read('useMeat'),['q'],'Reset explicitly adopts the new defaults');
}
{
 const f=fixture({profile:'fr',modified:{fr:{attack:['h'],train:['i']}}});
 assert.deepEqual(f.read('moveLeft'),['q','arrowleft']);assert.deepEqual(f.read('attack'),['h']);assert.deepEqual(f.read('heavyAttack'),['l']);assert.deepEqual(f.read('inventory'),['o']);assert.deepEqual(f.read('useMeat'),['p']);unique(f);
}
// The approved attachment is an old JSON export with these four overrides.
// Keep the contract fixture portable; never depend on a personal download path.
const oldFile={version:1,original:copy(config.legacyDefaults.original),profiles:copy(config.legacyDefaults.profiles),selection:'original',modified:{original:{attack:['mouse0','z'],heavyAttack:['mouse2'],dash:['shift'],useMeat:['q']}}};
{
 const f=fixture();assert(f.run('Bindings.importData('+JSON.stringify(oldFile)+')'));
 for(const action of ['attack','heavyAttack','dash','useMeat'])assert.deepEqual(f.read(action),config.original[action],'Approved legacy export has the same effective new default');unique(f);
 const original=copy(config.legacyDefaults.original);delete original.inventory;delete original.heavyAttack;delete original.useMeat;
 const historical={version:1,original,selection:'fr',modified:{fr:{attack:['h'],train:['i']}}};
 assert(f.run('Bindings.importData('+JSON.stringify(historical)+')'));assert.deepEqual(f.read('attack'),['h']);assert.deepEqual(f.read('heavyAttack'),['l']);assert.deepEqual(f.read('inventory'),['o']);assert.deepEqual(f.read('useMeat'),['p']);unique(f);
}
{
 const f=fixture();assert(f.run('Bindings.importData('+JSON.stringify({version:1,original:config.legacyDefaults.original,selection:'fr',modified:{}})+')'));
 assert.deepEqual(f.read('attack'),['j'],'Import reproduces a selected legacy profile even without overrides');assert.deepEqual(f.read('useMeat'),['o']);unique(f);
 const before=f.export();
 for(const transform of [data=>{data.original.attack=['x'];},data=>{data.modified.original={attack:['mouse2']};},data=>{data.modified.original={attack:['mouse9']};},data=>{data.revision=99;},data=>{data.selection='unknown';}]){
  const bad=copy({version:1,revision:config.revision,original:config.original,selection:'original',modified:{}});transform(bad);assert(!f.run('Bindings.importData('+JSON.stringify(bad)+')'));assert.deepEqual(f.export(),before,'Invalid imports are atomic');
 }
}
console.log('PASS: approved mouse/Shift/Q defaults and AZERTY physical equivalents; unique inputs, swaps, resets, legacy/custom storage preservation, old/current JSON imports, reload and atomic rejection.');

{const original=copy(config.original);delete original.ultimate;const old={version:1,revision:2,original,profiles:copy(config.profiles),selection:"original",modified:{original:{attack:["f"]}}};const f=fixture({revision:2,profile:"original",modified:old.modified});assert.deepEqual(f.read("attack"),["f"]);assert.notDeepEqual(f.read("ultimate"),["f"]);unique(f);const imported=fixture();assert(imported.run("Bindings.importData("+JSON.stringify(old)+")"));assert.deepEqual(imported.read("attack"),["f"]);unique(imported);}
