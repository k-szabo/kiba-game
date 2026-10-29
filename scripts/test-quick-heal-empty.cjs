'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
{
 const h=harness({prologue:true}),r=h.run;
 assert.equal(r('quickHeal'),null);assert.equal(r('saved.quickHeal'),null,'A new journey saves an explicitly empty binding');validate(r('saved'));
 r('Inventory.open()');assert(h.elements.get('inventoryQuickHeal').hidden);assert.equal(h.elements.get('inventoryQuickHeal').textContent,'');
 assert(!r('Merchant.useQuick()'));assert.equal(r('quickHeal'),null);
}
for(const id of ['roastMeat','tea','healingBrew','roastChicken']){
 const h=harness(),r=h.run;r('DevTools.open();DevSession.begin();DevTools.close();player.hp=1;Math.random=()=>0;');
 assert.equal(r('quickHeal'),null);assert(r('Merchant.addStock('+JSON.stringify(id)+')'));assert.equal(r('quickHeal'),id,'First acquired '+id+' selects itself');
 assert(r('Merchant.useQuick()'));assert.equal(r('quickHeal'),null,'Last '+id+' leaves no nonexistent selection');
 const hp=r('player.hp');assert(!r('Merchant.useQuick()'));assert.equal(r('player.hp'),hp,'Empty quick use has no fallback action or effect');
 r('Merchant.resetTea();Merchant.addStock("tea");Merchant.addStock("roastMeat");');assert.equal(r('quickHeal'),'tea','A later item preserves an available selection');
 r('Inventory.open();Merchant.selectQuick("roastMeat");Inventory.close();Merchant.addStock("tea");');assert.equal(r('quickHeal'),'roastMeat','Explicit player choice survives later pickups');
 r('player.hp=1;Merchant.useQuick()');assert.equal(r('quickHeal'),'tea','An exhausted selection switches to remaining stock');
 const saved=r('JSON.stringify(saved)');r('DevSession.end()');assert.equal(r('JSON.stringify(saved)'),saved,'Test inventory never changes the normal save');
}
{
 const h=harness(),r=h.run;
 r('flags[0]=["forestBell","villageBell"];defeated[0]=true;flags[1]=["akashRescued"];enterForestCamp({save:false,atShrine:true});initPlayer({x:930,y:820});coins=100;Merchant.open();');
 assert(r('Merchant.purchase("tea")'));assert.equal(r('quickHeal'),'tea');assert.equal(r('saved.quickHeal'),'tea');validate(r('saved'));
 r('Merchant.close();mainMenu();startGame(true)');assert.equal(r('quickHeal'),'tea','Continue preserves an available choice');
 r('saved.quickHeal="roastMeat";mainMenu();startGame(true)');assert.equal(r('quickHeal'),'tea','Legacy absent meat switches to actually owned tea');
 r('saved.meatCount=saved.teaCount=0;saved.quickHeal="roastMeat";mainMenu();startGame(true)');assert.equal(r('quickHeal'),null);assert.equal(r('saved.quickHeal'),null,'Legacy empty choice is normalized without resetting progress');validate(r('saved'));
}
console.log('PASS: empty new journey, first pickup of all four healing items, exhaustion/fallback/player preference, legacy resume, actual purchase and isolated dev inventory.');
