const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const h=harness(),run=h.run,saved=run('JSON.stringify(saved)'),writes=run('window.__saveSnapshots.length');
assert(!run('DevItems.add({item:"angelHalo"})'));run('DevTools.open();DevSession.begin();');
for(const id of run('Object.keys(ART_INVENTORY.items)')){
 assert.equal(run(`DevItems.add({item:'${id}'})`),true);assert(run(`Inventory.contents().includes('${id}')`));
 if(run(`!!ART_INVENTORY.items['${id}'].stack`)){assert.equal(run(`DevItems.add({item:'${id}'})`),true);assert.equal(run(`Inventory.quantity('${id}')`),2);continue;}
 assert.equal(run(`DevItems.add({item:'${id}'})`),'dev.item.owned');
 const realm=run(`ART_INVENTORY.items['${id}'].realm`);assert.equal(run(`flags[${realm}].filter(f=>f==='${id}').length`),1);
}
assert(!run('Inventory.contents().includes("angelHalo")||Inventory.contents().includes("demonHorn")'),'Fusion keeps historical flags while hiding consumed relics');
for(const id of ['missing','weapon','__proto__','constructor'])assert(!run(`DevItems.add({item:'${id}'})`));
run('flags[1]=flags[1].filter(f=>f!=="councilKey");flags[1].push("councilGateOpen");');
assert.equal(run('DevItems.add({item:"councilKey"})'),'dev.item.owned','Consumed keys are not duplicated');
assert.equal(run('JSON.stringify(saved)'),saved);assert.equal(run('window.__saveSnapshots.length'),writes);
run('DevTools.close()');assert(!run('DevItems.add({item:"serpentScale"})'));run('mainMenu();startGame(true)');assert.equal(run('Inventory.contents().length'),0);
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
console.log('PASS: catalogue-driven test inventory, complete item list, no duplicates or consumed-item resurrection and unchanged normal saves.');
