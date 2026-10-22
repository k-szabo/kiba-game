'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
function setup(){const h=harness();h.run("defeated[0]=true;flags[0]=['forestBell','villageBell'];flags[1]=['akashRescued'];enterForestCamp({save:false,atShrine:true});enemies=[];state='play';player.inv=999;coins=1000;meatCount=0;teaCount=0;quickHeal='roastMeat';");return h;}
// Probability boundaries, capped healing and nonlethal food damage use one roll.
for(const [roll,expected]of [[0,4],[2/3-Number.EPSILON,4],[2/3,1],[.999,1]]){
 const h=setup(),r=h.run;r(`player.hp=2;meatCount=1;var rolls=0;Math.random=()=>{rolls++;return ${roll};};`);
 assert(r('Merchant.eat()'));assert.equal(r('player.hp'),expected);assert.equal(r('rolls'),1);assert.equal(r('meatCount'),0);
}
{
 const h=setup(),r=h.run;r('player.hp=4;meatCount=1;Math.random=()=>0;Merchant.eat();');assert.equal(r('player.hp'),5);
 r('player.hp=1;meatCount=1;Math.random=()=>.99;Merchant.eat();');assert.equal(r('player.hp'),1);
}
for(const fps of [30,60,120]){
 const h=setup(),r=h.run,advance=seconds=>r(`for(let i=0;i<${seconds*fps};i++)update(1/${fps});`);
 r('teaCount=3;player.hp=1;');assert(r('Inventory.open()'));assert(r('Merchant.drink(true)'));
 assert.equal(r('teaCount'),2);assert.equal(r('player.hp'),1,'No instant tea heal');
 advance(10);assert.equal(r('player.hp'),1,'Inventory freezes the effect');r('Inventory.close();');
 advance(1);assert.equal(r('player.hp'),1);
 r("state='pause';");advance(20);assert.equal(r('player.hp'),1);r("state='play';");
 advance(1);assert.equal(r('player.hp'),2);assert(!r('Merchant.drink()'),'Active effect cannot stack');assert.equal(r('teaCount'),2);
 for(const state of ['dialog','training','map','help','shop','developer']){r(`state='${state}';`);advance(10);assert.equal(r('player.hp'),2);}
 r("state='play';");advance(2);assert.equal(r('player.hp'),3);advance(2);assert.equal(r('player.hp'),4);
 assert(r('Merchant.drink()'),'Completed effect permits another serving');advance(6);assert.equal(r('player.hp'),5);
 assert(!r('Merchant.drink()'));assert.equal(r('teaCount'),1,'Full HP must not waste tea');
 // A fresh spawn and location transition discard the pending effect, not stock.
 r('player.hp=1;Merchant.drink();initPlayer(checkpoint);player.hp=1;');advance(6);assert.equal(r('player.hp'),1);assert.equal(r('teaCount'),0);
}
// Shared action selection, depletion fallback, input remap and shop stack isolation.
{
 const h=setup(),r=h.run;
 h.place(930,820);assert(r('Merchant.open()'));assert(r("Merchant.purchase('tea')"));assert.equal(r('coins'),975);assert.equal(r('teaCount'),1);assert.equal(r('meatCount'),0);assert.equal(r('quickHeal'),'tea');validate(r('saved'));
 assert(r("Merchant.purchase('roastMeat')"));assert.equal(r('meatCount'),1);assert.equal(r('teaCount'),1);r('Merchant.close();player.hp=1;');
 assert(!r("Merchant.selectQuick('roastMeat')"),'Selection requires inventory');r('Inventory.open();');
 assert(r("Merchant.selectQuick('roastMeat')"));assert.equal(r('saved.quickHeal'),'roastMeat');r('Inventory.close();Math.random=()=>0;');
 h.press('o');h.tick();h.release('o');assert.equal(r('player.hp'),3);assert.equal(r('meatCount'),0);assert.equal(r('quickHeal'),'tea');assert.equal(r('saved.quickHeal'),'tea');
 h.press('o');h.tick();h.release('o');assert.equal(r('teaCount'),0);assert.equal(r('player.hp'),3,'Quick tea starts the timer');
 r('teaCount=2;quickHeal="tea";Bindings.setPrimary("useMeat","mouse2");Merchant.resetTea();player.hp=1;handleMouseDown({button:2,pointerType:"mouse",target:canvas,preventDefault(){}});input(0);pressed.clear();handleMouseUp({button:2,preventDefault(){}});');assert.equal(r('teaCount'),1);
 r('Merchant.resetTea();meatCount=1;quickHeal="tea";');assert(r('Merchant.drink()'));assert.equal(r('quickHeal'),'roastMeat','Last tea switches to remaining food');
 r('teaCount=1;Merchant.resetTea();quickHeal="tea";state="pause";');const before=r('JSON.stringify([player,teaCount,meatCount,quickHeal])');assert(!r('Merchant.useQuick()'));assert.equal(r('JSON.stringify([player,teaCount,meatCount,quickHeal])'),before);
 r('state="play";Inventory.open();');assert(!r('Merchant.useQuick()'),'Quick input cannot consume through an overlay');
 r('Inventory.close();mainMenu();startGame(true);');assert.equal(r('quickHeal'),'roastMeat','Continue restores the actual persisted choice');
}
{
 const h=setup(),r=h.run;r('DevTools.open();DevSession.begin();');const normal=r('JSON.stringify(saved)');
 assert(r("DevItems.add({item:'tea'})"));assert(r("DevItems.add({item:'tea'})"));assert.equal(r('teaCount'),2);assert.equal(r('meatCount'),0);
 r('teaCount=Number.MAX_SAFE_INTEGER;');assert(!r("DevItems.add({item:'tea'})"));assert.equal(r('teaCount'),Number.MAX_SAFE_INTEGER);
 assert.equal(r('JSON.stringify(saved)'),normal);r('DevSession.end();startGame(true);');assert.equal(r('teaCount'),0);
}
// QA-TEA-001 r1: model the browser blurring a newly disabled assignment button.
{
 const h=setup(),r=h.run;
 r(`teaCount=1;meatCount=1;quickHeal='roastMeat';Inventory.open();$('assignQuickHeal').id='assignQuickHeal';$('closeInventory').id='closeInventory';
 const makeElement=document.createElement;document.createElement=(...args)=>{const node=makeElement(...args);node.focus=()=>{document.activeElement=node;};return node;};
 document.querySelector=selector=>$('inventoryGrid').children.find(node=>selector.includes('"'+node.dataset.inventoryItem+'"'));
 $('closeInventory').focus=()=>{document.activeElement=$('closeInventory');};
 var disabledAssign=false;Object.defineProperty($('assignQuickHeal'),'disabled',{get:()=>disabledAssign,set:value=>{disabledAssign=value;if(value&&document.activeElement===$('assignQuickHeal'))document.activeElement=null;}});
 document.activeElement=$('assignQuickHeal');$('assignQuickHeal').onclick();`);
 assert.equal(r('saved.quickHeal'),'tea');assert.equal(r('document.activeElement.dataset.inventoryItem'),'tea','Assignment keeps focus on the selected inventory item');
 r("teaCount=0;meatCount=0;document.activeElement=$('assignQuickHeal');Inventory.render();");
 assert.equal(r('document.activeElement.id'),r("$('closeInventory').id"),'Empty inventory falls back to Close');
}
console.log('PASS: exact meat probability boundary, tea pulses at30/60/120fps, pause/caps/nonstacking/reset, independent shop/dev stacks, shared remapped quick input, saved selection/depletion fallback and QA-TEA-001 assignment focus.');
