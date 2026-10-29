const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const h=harness(),r=h.run,originalRandom=Math.random;
const message=()=>h.elements.get('toast').textContent;
function prepare(hp,roll=0){
 r(`state='play';player.hp=${hp};player.maxHp=5;meatCount=1;teaCount=0;campServices.potions=0;chickenCount=0;quickHeal='roastMeat';Math.random=()=>${roll};`);
}
try{
 // Exercise the actual action handler, including exactly one consumed item.
 prepare(1);h.press({action:'useMeat'});h.tick();h.release({action:'useMeat'});
 assert.equal(r('player.hp'),3);assert.equal(message(),'Gyógyulás: +2 HP');
 assert.equal(r('meatCount'),0);assert.equal(r('quickHeal'),null);
 // Inventory uses the same delta semantics; clipping at max must be reflected.
 prepare(4.5);assert(r('Inventory.open()'));h.elements.get('useInventoryItem').onclick();
 assert.equal(r('player.hp'),5);assert.equal(message(),'Gyógyulás: +0,5 HP');
 assert.equal(r('meatCount'),0);assert.equal(r('state'),'inventory');r('Inventory.close()');
 prepare(1.3333333333333333);assert(r('Merchant.eat()'));
 assert.equal(r('player.hp'),1.3333333333333333+2);assert.equal(message(),'Gyógyulás: +2 HP');
 prepare(4.666666666666667);assert(r('Merchant.eat()'));
 assert.equal(r('player.hp'),5);assert.equal(message(),'Gyógyulás: +0,4 HP');
 // No healing, damage and the nonlethal floor keep their existing feedback.
 prepare(5);assert(r('Merchant.eat()'));assert.equal(r('player.hp'),5);
 assert.equal(message(),r("I18n.t('merchant.health.same')"));assert.equal(r('meatCount'),0);
 prepare(3.25,.99);assert(r('Merchant.eat()'));assert.equal(r('player.hp'),2.25);
 assert.equal(message(),r("I18n.t('merchant.health.down')"));
 prepare(1,.99);assert(r('Merchant.eat()'));assert.equal(r('player.hp'),1);
 assert.equal(message(),r("I18n.t('merchant.health.same')"));
 // Consuming the selected last meat still falls back to available tea.
 prepare(1);r('teaCount=1;');assert(r('Merchant.useQuick()'));
 assert.equal(r('quickHeal'),'tea');assert.equal(r('teaCount'),1);
 const unchanged=r('JSON.stringify([player.hp,meatCount,teaCount])');
 r("state='pause'");assert.equal(r('Merchant.eat()'),false);
 assert.equal(r('JSON.stringify([player.hp,meatCount,teaCount])'),unchanged);
}finally{Math.random=originalRandom;}
console.log('PASS: roast meat feedback reports actual capped healing through quick use and inventory, preserves raw HP, damage, stock and fallback.');
