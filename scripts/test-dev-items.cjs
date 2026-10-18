const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const h=harness(),run=h.run,saved=run('JSON.stringify(saved)'),writes=run('window.__saveSnapshots.length');
assert(!run('DevItems.add({item:"angelHalo"})'));assert(!run('DevItems.addCoins({amount:100})'));
run('DevTools.open();');assert(!run('DevItems.addCoins({amount:100})'));run('DevSession.begin();');
for(const id of run('Object.keys(ART_INVENTORY.items)')){
 assert.equal(run(`DevItems.add({item:'${id}'})`),true);assert(run(`Inventory.contents().includes('${id}')`));
 if(run(`!!ART_INVENTORY.items['${id}'].stack`)){assert.equal(run(`DevItems.add({item:'${id}'})`),true);assert.equal(run(`Inventory.quantity('${id}')`),2);continue;}
 assert.equal(run(`DevItems.add({item:'${id}'})`),'dev.item.owned');
 const realm=run(`ART_INVENTORY.items['${id}'].realm`);assert.equal(run(`flags[${realm}].filter(f=>f==='${id}').length`),1);
}
assert(!run('Inventory.contents().includes("angelHalo")||Inventory.contents().includes("demonHorn")'),'Fusion keeps historical flags while hiding consumed relics');
// Akash's three wares use the same live picker, including repeat food grants.
function control(id){const find=node=>node?.id===id?node:node?.children?.map(find).find(Boolean);return find(h.elements.get('devToolsList'));}
run('DevTools.refresh();');
for(const id of ['compass','minimap','roastMeat'])assert(control('dev-inventory-item-item').children.some(option=>option.value===id));
const picker=control('dev-inventory-item-item');picker.value='roastMeat';picker.onchange();
const food=run('meatCount');control('dev-tool-inventory-item').onclick();control('dev-tool-inventory-item').onclick();
assert.equal(run('meatCount'),food+2);assert.equal(control('dev-inventory-item-item').value,'roastMeat','Item selection survives a grant');
const other=run('JSON.stringify([shards,meatCount,flags,progression,player])');
control('dev-coins-amount').value='1234';control('dev-tool-coins').onclick();assert.equal(run('coins'),1234);
assert.equal(control('dev-coins-amount').value,'1234','The amount survives a successful grant');
assert.equal(run('JSON.stringify([shards,meatCount,flags,progression,player])'),other);
for(const amount of [undefined,null,'',0,-1,1.5,'1e3','Infinity','NaN',' 1','1 ',Number.MAX_SAFE_INTEGER+1,true]){
 const before=run('coins');assert(!run(`DevItems.addCoins({amount:${JSON.stringify(amount)??'undefined'}})`));assert.equal(run('coins'),before);
}
run('coins=Number.MAX_SAFE_INTEGER-1;');assert(run('DevItems.addCoins({amount:1})'));assert.equal(run('coins'),Number.MAX_SAFE_INTEGER);
assert(!run('DevItems.addCoins({amount:1})'),'Overflow must reject the entire grant');
run('coins=10;');const stale=control('dev-tool-coins');run('DevTools.refresh();');stale.onclick();assert.equal(run('coins'),10,'Stale callbacks cannot mint coins');
run('DevTools.close();');assert(!run('DevItems.addCoins({amount:1})'));run('DevTools.open();');
run("DevTools.close();Inventory.open();DevTools.open();DevItems.add({item:'roastMeat'});DevTools.close();");
const foodCard=h.elements.get('inventoryGrid').children.find(button=>button.dataset.inventoryItem==='roastMeat');
assert.equal(foodCard.children.at(-1).textContent,'×'+run('meatCount'),'Returning to inventory redraws the new stack');
run('Inventory.close();DevTools.open();');
for(const id of ['missing','weapon','__proto__','constructor'])assert(!run(`DevItems.add({item:'${id}'})`));
run('flags[1]=flags[1].filter(f=>f!=="councilKey");flags[1].push("councilGateOpen");');
assert.equal(run('DevItems.add({item:"councilKey"})'),'dev.item.owned','Consumed keys are not duplicated');
assert.equal(run('JSON.stringify(saved)'),saved);assert.equal(run('window.__saveSnapshots.length'),writes);
run('DevTools.close()');assert(!run('DevItems.add({item:"serpentScale"})'));run('mainMenu();startGame(true)');assert.equal(run('Inventory.contents().length'),0);assert.equal(run('coins'),0,'Dev coins must not enter normal Continue');
// A synthetic test key can open and enter the optional hall before boss victory.
const gate=harness(),g=gate.run,baseline=g('JSON.stringify(saved)'),gateWrites=g('window.__saveSnapshots.length');
g('DevTools.open();DevSession.begin();DevTeleport.teleport({realm:"1",rest:levels[1].rests[0].id});');
assert.equal(g('defeated[1]'),false);assert(g('DevItems.add({item:"councilKey"})'));g('DevTools.close()');
gate.place(g('level.councilGate.x'),g('level.councilGate.y'));
g('interact()');assert.equal(g('level===councilHall'),true);assert(!g('flags[1].includes("councilKey")'));assert(g('flags[1].includes("councilGateOpen")'));assert.equal(g('defeated[1]'),false);
assert(g('leaveCouncilHall()'));gate.place(g('level.councilGate.x'),g('level.councilGate.y'));g('interact()');assert(g('level===councilHall'),'The consumed key leaves a reusable open gate');
assert.equal(g('JSON.stringify(saved)'),baseline);assert.equal(g('window.__saveSnapshots.length'),gateWrites);
g('DevSession.end();startGame(true)');gate.dismiss();assert(!g('flags[1].includes("councilGateOpen")'));assert(!g('DevSession.active'));
g('enterRealm(1);flags[1].push("councilGateOpen");');assert(!g('enterCouncilHall()'),'Normal play still requires a real boss victory');
// Adding money over an open shop must immediately refresh its prices/buttons.
const shop=harness(),s=shop.run;
s("defeated[0]=true;flags[0]=['forestBell','villageBell'];flags[1]=['akashRescued'];enterForestCamp();initPlayer({x:930,y:820});coins=0;persist();");
const normal=s('JSON.stringify(saved)');s('DevTools.open();DevSession.begin();DevTools.close();Merchant.open();');
const compassButton=()=>shop.elements.get('shopItems').children.flatMap(card=>card.children).find(node=>node.id==='buy-compass');
assert(compassButton().disabled);s('DevTools.open();DevItems.addCoins({amount:220});DevTools.close();');
assert.equal(s('state'),'shop');assert(!compassButton().disabled);assert(shop.elements.get('shopCoins').textContent.endsWith('220'));
assert(s("Merchant.purchase('compass')"));assert.equal(s('coins'),0);assert.equal(s('JSON.stringify(saved)'),normal);
s('DevSession.end();startGame(true);');assert.equal(s('coins'),0);assert(!s("Inventory.contents().includes('compass')"));
console.log('PASS: catalogue-driven test inventory, complete item list, no duplicates or consumed-item resurrection and unchanged normal saves.');
