const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {run,snap,tick,press,release,elements,dismiss}=require('./test-harness.cjs')();
assert.equal(run("Bindings.read('inventory')[0]"),'i');
run("flags=[[],[],[],[]];enemies[0].dead=true;player.vx=150;projectiles=[{x:400,y:400,vx:40,vy:0,life:5,kind:'orb'}];");
press('i');release('i');assert.equal(snap().state,'inventory');assert(!elements.get('inventory').hidden);
assert.deepEqual(Array.from(run('Inventory.contents()')),[]);assert(!elements.get('inventoryEmpty').hidden);
const frozen=run('JSON.stringify({player,enemies,boss,platforms,projectiles,particles,time,levelTime})');
tick(180);assert.equal(run('JSON.stringify({player,enemies,boss,platforms,projectiles,particles,time,levelTime})'),frozen);
press({action:'attack'});press(' ');press('m');assert.equal(snap().state,'inventory');assert(run('keys.size===0&&pressed.size===0'));
run("handleKeyDown({key:'i',code:'KeyI',repeat:false,target:{closest:()=>({})},preventDefault(){}});");assert.equal(snap().state,'play','Focused inventory buttons must not swallow the inventory close binding');
press('i');release('i');press('escape');release('escape');assert.equal(snap().state,'play');

run("flags=[['angelHalo','demonHorn'],['councilKey','councilKeyEarned'],[],[]];defeated[1]=true;");
const before=JSON.stringify(snap());press('i');release('i');
assert.deepEqual(Array.from(run('Inventory.contents()')),['angelHalo','demonHorn','councilKey']);assert.equal(elements.get('inventoryGrid').children.length,3);
assert.equal(elements.get('inventoryWeaponName').textContent,run("I18n.t('item.dawnblade')"));
run('Inventory.close();');assert.equal(JSON.stringify(snap()),before,'Inspecting inventory changes permanent state or combat state');
run("flags[1]=['councilKeyEarned','councilGateOpen'];Inventory.open();");
assert.deepEqual(Array.from(run('Inventory.contents()')),['angelHalo','demonHorn']);assert.equal(elements.get('inventoryGrid').children.length,2);
run('mainMenu();');assert(elements.get('inventory').hidden);assert.equal(snap().state,'menu');assert(!run('Inventory.open()'));
run("startGame();var dreamPhase=Prologue.phase;Inventory.open();");tick(120);assert.equal(run('Prologue.phase'),run('dreamPhase'));assert.equal(snap().state,'inventory');
run('Inventory.close();Prologue.wake();');dismiss();
// Inventory artwork uses dedicated native-resolution assets and a DPR-scaled
// drawing buffer; the in-game sprite sheet must never be enlarged here.
run("devicePixelRatio=2;var artDraws=[],artContext=$('inventoryMomo').getContext('2d'),originalArtDraw=artContext.drawImage;artContext.drawImage=(...args)=>artDraws.push(args);Inventory.open();");
assert.equal(elements.get('inventoryMomo').width,768);assert.equal(elements.get('inventoryMomo').height,832);
assert.equal(elements.get('inventoryWeaponArt').width,216);assert.equal(elements.get('inventoryWeaponArt').height,288);
for(const [name,key] of [['momo','inventoryMomoPortrait'],['katana','inventoryKatana']]){
 const source=run(`ART_MANIFEST.${key}`),rect=run(`ART_INVENTORY.${name}`),png=fs.readFileSync(path.join(__dirname,'..',source));
 const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
 assert(width>=1024&&height>=1024,`${name}: dedicated high-resolution source`);
 assert(rect.x>=0&&rect.y>=0&&rect.w>0&&rect.h>0&&rect.x+rect.w<=width&&rect.y+rect.h<=height,`${name}: crop is inside native image`);
 assert(run(`artDraws.some(args=>args[0]===Visuals.images.${key}&&args[1]===ART_INVENTORY.${name}.x&&args[2]===ART_INVENTORY.${name}.y&&args[3]===ART_INVENTORY.${name}.w&&args[4]===ART_INVENTORY.${name}.h)`),`${name}: registered crop is rendered`);
}
assert(!run('artDraws.some(args=>args[0]===sheet)'),'Inventory portrait must not reuse the low-resolution gameplay cell');
// Enumerate the shared catalogue so future items receive the same resolution,
// alpha and crop coverage checks without another item-specific rendering branch.
const iconIds=Array.from(run('Object.keys(ART_INVENTORY.items)'));
// Protected, count-backed quest loot can be spawned only in an isolated test
// session. Icon checks use that same supported grant path as the dev panel.
run('Inventory.close();DevTools.open();DevSession.begin();DevTools.close();Inventory.open();');
for(const id of iconIds){
 const quoted=JSON.stringify(id),raidReward=run(`!!ART_INVENTORY.items[${quoted}].raidReward`);
 run('flags=[[],[],[],[]];meatCount=0;teaCount=0;chickenCount=0;dungeonState=DungeonRules.fresh();fiaJourney=FiaJourneyRules.fresh();campServices=CampServiceRules.fresh(weaponStyle);SkyDragonRaid.restore();');
 if(raidReward){
  const armorOwned=id!=='cloudDragonScale',victories=armorOwned?3:1;
  run(`SkyDragonRaid.restore(${JSON.stringify({run:victories,victories,phase:null,ringTurnedIn:id!=='cloudNinjaRing',armorOwned,armorEquipped:false})});`);
 }else run(`if(ART_INVENTORY.items[${quoted}].stack)Merchant.addStock(${quoted});flags[ART_INVENTORY.items[${quoted}].realm].push(${quoted});`);
 run('artDraws=[];artContext.globalAlpha=.2;Inventory.render();');
 if(id==='foxfireKatana')run('Inventory.close();DevTools.open();DevItems.add({item:"foxfireKatana"});DevTools.close();Inventory.open();');
 if(!raidReward)assert.equal(elements.get('inventoryGrid').children.length,1,id+': one owned inventory item');
 const row=elements.get('inventoryGrid').children.find(button=>button.dataset.inventoryItem===id);
 assert(row,id+': reward or item is visible');
 const icon=row.children[0],rect=run(`ART_INVENTORY.items[${quoted}]`);
 assert.equal(icon.width,224,`${id}: DPR2 icon width`);assert.equal(icon.height,224,`${id}: DPR2 icon height`);
 assert.equal(icon.className,'inventory-icon');assert.equal(icon.getContext('2d').globalAlpha,1,`${id}: stale drawing alpha is cleared`);
 const png=fs.readFileSync(path.join(__dirname,'..',run(`ART_MANIFEST[ART_INVENTORY.items[${JSON.stringify(id)}].image]`)));
 assert(rect.x>=0&&rect.y>=0&&rect.x+rect.w<=png.readUInt32BE(16)&&rect.y+rect.h<=png.readUInt32BE(20),`${id}: valid native inventory crop`);
 assert(run(`artDraws.some(args=>args[0]===Visuals.images[ART_INVENTORY.items[${JSON.stringify(id)}].image]&&args[1]===${rect.x}&&args[2]===${rect.y}&&args[3]===${rect.w}&&args[4]===${rect.h})`),`${id}: common renderer draws the registered crop`);
}
run('artContext.drawImage=originalArtDraw;devicePixelRatio=1;Inventory.close();');
run('DevSession.end();startGame(true);');dismiss();
assert(run("Bindings.setPrimary('useMeat','b').ok"));assert(run("Bindings.setPrimary('inventory','o').ok"));assert(run("Bindings.setPrimary('pause','p').ok"));press('i');release('i');assert.equal(snap().state,'play');
press('o');release('o');assert.equal(snap().state,'inventory');press('p');release('p');assert.equal(snap().state,'play');

// Preserve older custom layouts when I was already assigned before inventory existed.
const defaults=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/config/keybindings.json')));
function loadBindings(stored){
 const storage=new Map(stored?[['momo-keybindings-v1',JSON.stringify(stored)]]:[]),context=vm.createContext({KEY_BINDINGS:defaults,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/keybindings.js'),'utf8')+';globalThis.bindings=Bindings;',context);return {bindings:context.bindings,storage};
}
const legacy={profile:'fr',modified:{fr:{attack:['i']},uk:{map:['i']}}};
const loaded=loadBindings(legacy);assert.equal(loaded.bindings.profile,'fr');assert.equal(loaded.bindings.read('attack')[0],'i');
assert.notEqual(loaded.bindings.read('inventory')[0],'i');assert.equal(loaded.bindings.read('moveLeft')[0],'q');
assert(loaded.bindings.choose('uk'));assert.equal(loaded.bindings.read('map')[0],'i');assert.notEqual(loaded.bindings.read('inventory')[0],'i');
const persisted=JSON.parse(loaded.storage.get('momo-keybindings-v1')),again=loadBindings(persisted);assert.deepEqual(Array.from(again.bindings.read('inventory')),Array.from(loaded.bindings.read('inventory')));
const oldDefaults={...defaults.legacyDefaults.original};delete oldDefaults.inventory;
const imported=loadBindings();assert(imported.bindings.importData({version:1,original:oldDefaults,selection:legacy.profile,modified:legacy.modified}));assert.equal(imported.bindings.read('attack')[0],'i');assert.notEqual(imported.bindings.read('inventory')[0],'i');
assert(!imported.bindings.importData({version:1,original:oldDefaults,selection:'fr',modified:{fr:{attack:['i'],inventory:['i']}}}),'Explicitly conflicting modern overrides must still be rejected');
console.log('PASS: inventory flag-backed items/consumed key/weapon, empty grid, full pause including dream, focused close/custom bindings, no progression changes and legacy custom-I preference/import compatibility.');
