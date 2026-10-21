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
assert(run("Bindings.setPrimary('attack','q').ok"));
assert.equal(run("Bindings.read('moveLeft')[0]"),'j','An occupied primary is exchanged without leaving either action unbound');
run('Bindings.reset()');
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
  assert.equal(run("Bindings.read('useMeat')[0]"),'o','Every layout inherits the food action default');
  assert(run("Bindings.has('useMeat',new Set(['@useMeat']))"),'Food input also supports an action token');
  assert(run("Bindings.setPrimary('useMeat','j').ok"));
  assert.equal(run("Bindings.read('attack')[0]"),'o');
  run('Bindings.reset()');
  assert(run("Bindings.setPrimary('useMeat','p').ok"));
  assert(run("Bindings.has('useMeat',new Set(['p']))"));
  assert(!run("Bindings.has('useMeat',new Set(['o']))"));
  assert(run("Bindings.has('heavyAttack',new Set(['@heavyAttack']))"),'Touch input uses the action rather than its physical key');
  assert(run("Bindings.setPrimary('heavyAttack','j').ok"));
  assert.equal(run("Bindings.read('attack')[0]"),'h');
  run('Bindings.reset()');
  assert(run("Bindings.setPrimary('heavyAttack','l').ok"));
  assert(run("Bindings.has('heavyAttack',new Set(['l']))"));
  assert(!run("Bindings.has('heavyAttack',new Set(['h']))"));
  run('Bindings.reset()');
  assert.equal(run("Bindings.read('heavyAttack')[0]"),'h');
  assert.equal(run("Bindings.read('useMeat')[0]"),'o');
}
const historicalOriginal=missing=>Object.fromEntries(Object.entries(defaults.original).filter(([action])=>!missing.includes(action)));
const historicalSchemas=[[],['heavyAttack'],['inventory'],['inventory','heavyAttack']];
for(const missing of [...historicalSchemas.slice(1),...historicalSchemas.map(schema=>[...schema,'useMeat'])]){
  const oldExport={version:defaults.version,original:historicalOriginal(missing),selection:'fr',modified:{fr:{attack:['h'],map:['l'],...(missing.includes('inventory')?{train:['i']}:{inventory:['o']})}}};
  const isolated=isolatedBindings();
  assert(isolated.read(`Bindings.importData(${JSON.stringify(oldExport)})`),'Historical default schemas remain importable');
  assert.equal(isolated.read("Bindings.read('attack')[0]"),'h','Existing H preference must survive');
  assert.equal(isolated.read("Bindings.read('map')[0]"),'l','Existing L preference must survive');
  assert.equal(isolated.read("Bindings.read('useMeat')[0]"),'p','Historical inventory O is preserved and the new food action uses a free fallback');
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
  assert.equal(reloaded.read("Bindings.read('useMeat')[0]"),isolated.read("Bindings.read('useMeat')[0]"));
  oldExport.original.attack=['x'];
  assert(!isolated.read(`Bindings.importData(${JSON.stringify(oldExport)})`),'Historical imports cannot alter built-in defaults');
}
const stored=isolatedBindings({profile:'uk',modified:{uk:{attack:['h'],train:['i']}}});
assert.equal(stored.read("Bindings.profile"),'uk');
assert.equal(stored.read("Bindings.read('attack')[0]"),'h');
assert.equal(stored.read("Bindings.read('heavyAttack')[0]"),'l','Unused L is the first H-conflict fallback');
assert.equal(stored.read("Bindings.read('inventory')[0]"),'o');
assert.equal(stored.read("Bindings.read('useMeat')[0]"),'p','Food migration cannot take the older inventory fallback O');
assert.equal(stored.read("Bindings.read('train')[0]"),'i');
assert(stored.writes.get('momo-keybindings-v1').includes('heavyAttack'),'Compatibility assignments persist across reloads');
for(const profile of ['original','uk','fr']){
  const customO=isolatedBindings({profile,modified:{[profile]:{attack:['o'],inventory:['i'],heavyAttack:['h']}}});
  assert.equal(customO.read("Bindings.read('attack')[0]"),'o','An existing custom O binding remains owned by its original action');
  assert.equal(customO.read("Bindings.read('useMeat')[0]"),'p');
  const all=customO.read('Bindings.actions.flatMap(action=>Bindings.read(action))');
  assert.equal(new Set(all).size,all.length,'Adding food does not duplicate a physical key');
  const reload=isolatedBindings(JSON.parse(customO.writes.get('momo-keybindings-v1')));
  assert.equal(reload.read("Bindings.read('attack')[0]"),'o');assert.equal(reload.read("Bindings.read('useMeat')[0]"),'p');
}
const crowded=isolatedBindings({profile:'uk',modified:{uk:{attack:['o'],train:['p'],map:['b'],drop:['n'],inventory:['i'],heavyAttack:['h']}}});
const crowdedKeys=crowded.read('Bindings.actions.flatMap(action=>Bindings.read(action))');
assert.equal(new Set(crowdedKeys).size,crowdedKeys.length,'Food finds another unused key when all named fallbacks are occupied');
assert(!['o','p','b','n'].includes(crowded.read("Bindings.read('useMeat')[0]")));
const current=isolatedBindings({profile:'uk',modified:{uk:{useMeat:['f2']}}});
assert.equal(current.read("Bindings.read('useMeat')[0]"),'f2','An explicit current food binding is never remigrated');
assert(current.read("Bindings.setPrimary('useMeat','f3').ok"));
current.read("var foodExport=Bindings.exportData();Bindings.reset();");
assert.equal(current.read("Bindings.read('useMeat')[0]"),'o');
assert(current.read('Bindings.importData(foodExport)'));
assert.equal(current.read("Bindings.read('useMeat')[0]"),'f3','Food remapping survives export, reset and import');
for(const profile of ['original','uk','fr']){
  const custom=isolatedBindings();
  custom.read(`Bindings.choose('${profile}')`);
  const unique=()=>{
    const all=custom.read('Bindings.actions.flatMap(action=>Bindings.read(action))');
    assert.equal(new Set(all).size,all.length,'Every physical input belongs to exactly one action');
    assert(custom.read('Bindings.actions.every(action=>Bindings.read(action).length>0)'),'Reassignment never leaves an action unbound');
  };
  assert(custom.read("Bindings.setPrimary('attack','e').ok"));
  assert.equal(custom.read("Bindings.read('attack')[0]"),'e','An occupied single-key action can be assigned directly');
  assert.equal(custom.read("Bindings.read('interact')[0]"),'j','The previous action receives the former attack key');
  unique();
  assert(custom.read("Bindings.setPrimary('attack','arrowleft').ok"));
  assert.equal(custom.read("Bindings.read('moveLeft')[1]"),'e','A secondary input is exchanged in its original slot');
  assert.equal(custom.read("Bindings.read('moveLeft')[0]"),profile==='fr'?'q':'a','A secondary conflict preserves the other action primary');
  unique();
  assert(custom.read("Bindings.setPrimary('jump','arrowup').ok"));
  assert.equal(custom.read("Bindings.read('jump').filter(key=>key==='arrowup').length"),1,'Promoting an existing alias does not duplicate it');
  unique();
  assert(custom.read("Bindings.setPrimary('pause','e').ok"));
  assert.equal(custom.read("Bindings.read('moveLeft')[1]"),'escape','Occupied inputs exchange exactly, including the former pause Escape binding');
  unique();
  for(let button=0;button<5;button++){
    assert.equal(custom.read(`Bindings.mouseKey(${button})`),`mouse${button}`,'DOM mouse button numbers use the JSON token registry');
    assert(custom.read(`Bindings.setPrimary('attack',Bindings.mouseKey(${button})).ok`));
    assert(custom.read(`Bindings.has('attack',new Set(['mouse${button}']))`));
    assert(custom.read(`Bindings.uses('mouse${button}')`));
    unique();
  }
  for(const invalid of [-1,5,1.5,'0',null])assert.equal(custom.read(`Bindings.mouseKey(${JSON.stringify(invalid)})`),null);
  for(const invalid of ['mouse5','mouse-1','mouse01','mouse','@attack','tab','escape']){
    const before=custom.read('JSON.stringify(Bindings.exportData())');
    assert(!custom.read(`Bindings.setPrimary('attack',${JSON.stringify(invalid)}).ok`),`Reject unsupported input ${invalid}`);
    assert.equal(custom.read('JSON.stringify(Bindings.exportData())'),before,'Invalid reassignments are atomic');
  }
  const transfer=custom.read('JSON.stringify(Bindings.exportData())');
  const restored=isolatedBindings();
  assert(restored.read(`Bindings.importData(${transfer})`),'Mouse and swapped bindings roundtrip through JSON');
  assert.equal(restored.read("Bindings.read('attack')[0]"),'mouse4');
  const reloaded=isolatedBindings(JSON.parse(custom.writes.get('momo-keybindings-v1')));
  assert.equal(reloaded.read('JSON.stringify(Bindings.exportData())'),transfer,'Mouse inputs and all displaced actions survive browser preference reload');
  const bad=JSON.parse(transfer);bad.modified[profile].interact=['mouse4'];
  const before=restored.read('JSON.stringify(Bindings.exportData())');
  assert(!restored.read(`Bindings.importData(${JSON.stringify(bad)})`),'Import cannot give one mouse input to multiple actions');
  assert.equal(restored.read('JSON.stringify(Bindings.exportData())'),before);
  bad.modified[profile].interact=['mouse8'];
  assert(!restored.read(`Bindings.importData(${JSON.stringify(bad)})`),'Imports reject unsupported mouse button tokens');
}
console.log('PASS: layouts, exact primary/secondary conflict swaps including Escape, mouse input registry, preference/JSON roundtrips, conflict-free historical storage, and gameplay use.');
