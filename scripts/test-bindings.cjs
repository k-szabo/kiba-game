const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const defaults=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/config/keybindings.json'),'utf8'));
const bindingSource=fs.readFileSync(path.join(__dirname,'../assets/js/keybindings.js'),'utf8');
function isolatedBindings(stored){
  const writes=new Map();
  if(stored)writes.set('momo-keybindings-v1',JSON.stringify(stored));
  const context=vm.createContext({KEY_BINDINGS:defaults,localStorage:{getItem:key=>writes.get(key)||null,setItem:(key,value)=>writes.set(key,value)}});
  vm.runInContext(bindingSource,context);
  return {read:expression=>vm.runInContext(expression,context),writes};
}
const {run,snap,tick,place,storage}=require('./test-harness.cjs')();
assert.equal(run("Bindings.profile"),'original');
assert(run("Bindings.has('moveLeft',new Set(['a']))"));
assert(run("Bindings.has('moveLeft',new Set(['arrowleft']))"));
assert(run("Bindings.choose('uk')"));
assert(run("Bindings.has('moveLeft',new Set(['a']))"));
assert(run("Bindings.choose('fr')"));
assert(run("Bindings.has('moveLeft',new Set(['q']))"));
assert(!run("Bindings.has('moveLeft',new Set(['a']))"));
assert(run("Bindings.has('jump',new Set(['z']))"));
assert(!run("Bindings.has('attack',new Set(['z']))"));
assert.equal(run("Bindings.setPrimary('attack','q').reason"),'conflict');
assert(run("Bindings.setPrimary('attack','r').ok"));
assert(!run("Bindings.has('attack',new Set(['j']))"));
assert(run("Bindings.has('attack',new Set(['r']))"));
const saved=JSON.parse(storage.get('momo-keybindings-v1'));
assert.equal(saved.profile,'fr');assert.equal(saved.modified.fr.attack[0],'r');
run("var exportedBindings=Bindings.exportData();Bindings.reset();Bindings.choose('original');");
assert(run("Bindings.importData(exportedBindings)"));
assert.equal(run("Bindings.profile"),'fr');
assert.equal(run("Bindings.read('attack')[0]"),'r');
run("state='play';enterRealm(0);keys.add('q');");place(330,1000);tick(4);
assert(snap().player.vx<0,'French Q must move Momo left');
run("keys.clear();pressed.clear();Bindings.choose('original');");
assert(run("Bindings.has('moveLeft',new Set(['a']))"));
for(const profile of ['original','uk','fr']){
  assert(run(`Bindings.choose('${profile}')`));
  run('Bindings.reset()');
  assert.equal(run("Bindings.read('heavyAttack')[0]"),'h','Every layout inherits the new action default');
  assert(run("Bindings.has('heavyAttack',new Set(['@heavyAttack']))"),'Touch input uses the action rather than its physical key');
  assert.equal(run("Bindings.setPrimary('heavyAttack','j').reason"),'conflict');
  assert(run("Bindings.setPrimary('heavyAttack','l').ok"));
  assert(run("Bindings.has('heavyAttack',new Set(['l']))"));
  assert(!run("Bindings.has('heavyAttack',new Set(['h']))"));
  run('Bindings.reset()');
  assert.equal(run("Bindings.read('heavyAttack')[0]"),'h');
}
const historicalOriginal=missing=>Object.fromEntries(Object.entries(defaults.original).filter(([action])=>!missing.includes(action)));
for(const missing of [['heavyAttack'],['inventory'],['inventory','heavyAttack']]){
  const oldExport={version:defaults.version,original:historicalOriginal(missing),selection:'fr',modified:{fr:{attack:['h'],map:['l'],...(missing.includes('inventory')?{train:['i']}:{inventory:['o']})}}};
  const isolated=isolatedBindings();
  assert(isolated.read(`Bindings.importData(${JSON.stringify(oldExport)})`),'Historical default schemas remain importable');
  assert.equal(isolated.read("Bindings.read('attack')[0]"),'h','Existing H preference must survive');
  assert.equal(isolated.read("Bindings.read('map')[0]"),'l','Existing L preference must survive');
  assert.notEqual(isolated.read("Bindings.read('heavyAttack')[0]"),'h');
  assert.notEqual(isolated.read("Bindings.read('heavyAttack')[0]"),'l');
  if(missing.includes('inventory')){
    assert.equal(isolated.read("Bindings.read('train')[0]"),'i');
    assert.equal(isolated.read("Bindings.read('inventory')[0]"),'o','Pre-inventory conflict migration still applies');
  }else assert.equal(isolated.read("Bindings.read('inventory')[0]"),'o');
  const all=isolated.read('Bindings.actions.flatMap(action=>Bindings.read(action))');
  assert.equal(new Set(all).size,all.length,'Migrated bindings never share a physical key');
  const reloaded=isolatedBindings(JSON.parse(isolated.writes.get('momo-keybindings-v1')));
  assert.equal(reloaded.read("Bindings.read('attack')[0]"),'h');
  assert.equal(reloaded.read("Bindings.read('heavyAttack')[0]"),isolated.read("Bindings.read('heavyAttack')[0]"));
  oldExport.original.attack=['x'];
  assert(!isolated.read(`Bindings.importData(${JSON.stringify(oldExport)})`),'Historical imports cannot alter built-in defaults');
}
const stored=isolatedBindings({profile:'uk',modified:{uk:{attack:['h'],train:['i']}}});
assert.equal(stored.read("Bindings.profile"),'uk');
assert.equal(stored.read("Bindings.read('attack')[0]"),'h');
assert.equal(stored.read("Bindings.read('heavyAttack')[0]"),'l','Unused L is the first H-conflict fallback');
assert.equal(stored.read("Bindings.read('inventory')[0]"),'o');
assert.equal(stored.read("Bindings.read('train')[0]"),'i');
assert(stored.writes.get('momo-keybindings-v1').includes('heavyAttack'),'Compatibility assignments persist across reloads');
console.log('PASS: keyboard layouts, remapping, action-based heavy touch input, conflict-free historical imports/storage and gameplay use.');
