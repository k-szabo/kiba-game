'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
function setup(){
 const h=harness();h.run("defeated[0]=true;flags[0]=['forestBell','villageBell','campQuestAccepted','mayorExecuted','guardian:campMaster','smithRescued','herbalistRescued','enchanterRescued','herbalistQuestAccepted'];flags[1]=['akashRescued'];campServices=CampServiceRules.fresh(weaponStyle);enterForestCamp({save:false,atShrine:true});state='play';enemies=[];player.inv=999;coins=1000;meatCount=0;teaCount=0;quickHeal='roastMeat';");return h;
}
function choose(h,id){const node=h.elements.get('inventoryGrid').children.find(node=>node.dataset.inventoryItem===id);assert(node,'Inventory row '+id+' must be present');assert.equal(typeof node.onclick,'function','Captured inventory click listener');node.onclick();return node;}
// Harness DOM events are deliberately minimal; capture actual listener closures
// for these focused inventory interactions rather than exposing production seams.
function captureClicks(h){h.run("var makeCampInventoryElement=document.createElement;document.createElement=(...args)=>{const node=makeCampInventoryElement(...args);node.addEventListener=(event,handler)=>{if(event==='click')node.onclick=handler;};return node;};");}
{
 const h=setup(),r=h.run;r('campServices.potions=2;player.hp=player.maxHp;');
 const before=r('__saveSnapshots.length');assert(!r('Merchant.canUseBrew()'));assert(!r('Merchant.useBrew()'));assert.equal(r('campServices.potions'),2);assert.equal(r('__saveSnapshots.length'),before,'Full health cannot waste a dose or write a save');
 r('player.hp=1;');assert(r('Merchant.useBrew()'));assert.equal(r('player.hp'),4);assert.equal(r('campServices.potions'),1);assert.equal(r('saved.campServices.potions'),1);validate(r('saved'));
 r('player.hp=4.4;');assert(r('Merchant.useBrew()'));assert.equal(r('player.hp'),5);assert.equal(r('campServices.potions'),0);assert(!r('Merchant.useBrew()'));
}
{
 const h=setup(),r=h.run;captureClicks(h);r('campServices.herbs=4;campServices.potions=2;player.hp=1;devicePixelRatio=2;Inventory.open();');
 assert.equal(r("Inventory.quantity('forestHerb')"),4);assert.equal(r("Inventory.quantity('healingBrew')"),2);
 for(const id of ['forestHerb','healingBrew']){const row=choose(h,id),canvas=row.children[0];assert.equal(canvas.width,224);assert.equal(canvas.height,224);assert.equal(canvas.className,'inventory-icon');}
 assert(!h.elements.get('useInventoryItem').hidden);assert.equal(h.elements.get('useInventoryItem').textContent,r("I18n.t('merchant.drink')"));
 h.elements.get('assignQuickHeal').onclick();assert.equal(r('quickHeal'),'healingBrew');assert.equal(r('saved.quickHeal'),'healingBrew');
 const frozen=r('JSON.stringify([time,levelTime,player.x,player.y,enemies,projectiles])');h.elements.get('useInventoryItem').onclick();
 assert.equal(r('state'),'inventory');assert.equal(r('player.hp'),4);assert.equal(r('campServices.potions'),1);h.tick(240);
 assert.equal(r('JSON.stringify([time,levelTime,player.x,player.y,enemies,projectiles])'),frozen,'Using a brew keeps the inventory paused');
 assert.equal(r('player.hp'),4);assert.equal(r("Merchant.description('healingBrew').includes(bindingKeyLabel(Bindings.read('useMeat')[0]))"),true,'Brew description uses the actual quick binding');
 choose(h,'forestHerb');assert(h.elements.get('useInventoryItem').hidden,'Raw herbs cannot be consumed as healing');assert(h.elements.get('assignQuickHeal').hidden);
}
for(const state of ['menu','pause','dialog','training','map','help','shop','developer','campService']){
 const h=setup(),r=h.run;r("campServices.potions=1;player.hp=1;state="+JSON.stringify(state));assert(!r('Merchant.useBrew()'));assert(!r('Merchant.useBrew(true)'));assert.equal(r('campServices.potions'),1);assert.equal(r('player.hp'),1);
}
{
 const h=harness({prologue:true}),r=h.run;r('campServices.potions=1;player.hp=1;');assert(!r('Merchant.useBrew()'));assert(!r('Merchant.canUseBrew()'));assert.equal(r('campServices.potions'),1);
}
// Tea timing is independent of instant brews, and still freezes with overlays.
{
 const h=setup(),r=h.run;r('teaCount=1;campServices.potions=1;player.hp=1;Merchant.drink();Inventory.open();');assert(r('Merchant.useBrew(true)'));assert.equal(r('player.hp'),4);
 r('Merchant.update(20);');assert.equal(r('player.hp'),4);r('Inventory.close();Merchant.update(2);');assert.equal(r('player.hp'),5);
}
// All three quick-use options preserve historical meat/tea fallback priority.
for(const [selected,meat,tea,brew,expected] of [
 ['roastMeat',1,1,1,'tea'],['roastMeat',1,0,1,'healingBrew'],
 ['tea',1,1,1,'roastMeat'],['tea',0,1,1,'healingBrew'],
 ['healingBrew',1,1,1,'roastMeat'],['healingBrew',0,1,1,'tea']
]){
 const h=setup(),r=h.run;r('player.hp=1;Math.random=()=>0;meatCount='+meat+';teaCount='+tea+';campServices.potions='+brew+';quickHeal='+JSON.stringify(selected));
 assert(r('Merchant.useQuick()'));assert.equal(r('quickHeal'),expected);assert.equal(r('saved.quickHeal'),expected);validate(r('saved'));
}
{
 const h=setup(),r=h.run;r("campServices.potions=1;player.hp=1;quickHeal='roastMeat';");h.press({action:'useMeat'});h.tick();h.release({action:'useMeat'});assert.equal(r('campServices.potions'),0);assert.equal(r('player.hp'),4,'The configured healing action dispatches to the available brew');
 r('campServices.potions=1;player.hp=1;Inventory.open();');assert(!r('Merchant.useQuick()'),'Quick input cannot bypass an inventory overlay');assert(r("Merchant.selectQuick('healingBrew')"));assert(!r("Merchant.selectQuick('forestHerb')"));
}
{
 const h=setup(),r=h.run;
 for(const [id,field]of [['forestHerb','herbs'],['healingBrew','potions']]){
  assert(r('Merchant.addStock('+JSON.stringify(id)+')'));assert.equal(r('campServices.'+field),1);r('campServices.'+field+'=Number.MAX_SAFE_INTEGER;');assert(!r('Merchant.addStock('+JSON.stringify(id)+')'));assert.equal(r('campServices.'+field),Number.MAX_SAFE_INTEGER);
 }
 assert(!r("Object.hasOwn(Merchant.catalogue,'forestHerb')"));assert(!r("Object.hasOwn(Merchant.catalogue,'healingBrew')"));
 h.place(930,820);assert(r('Merchant.open()'));const coins=r('coins');assert(!r("Merchant.purchase('healingBrew')"));assert(!r("Merchant.purchase('forestHerb')"));assert.equal(r('coins'),coins,'Akash does not sell herbalist supplies');
}
// Armor permits positive HP below one; poisoned meat must never heal it.
for(const before of [.1,.4,.999,1,1.4,2]){
 const h=setup(),r=h.run;r('meatCount=1;player.hp='+before+';Math.random=()=>.999;');assert(r('Merchant.eat()'));assert.equal(r('player.hp'),Math.max(Math.min(before,1),before-1));assert(r('player.hp>0'));assert(r('player.hp<='+before));
}
// Owned weapon rows use the registered art and actual chosen-style damage.
{
 const h=setup(),r=h.run;captureClicks(h);r("campServices.ownedWeapons=['katana','naginata','swordShield'];campServices.weaponRank=2;player.hp=2;Inventory.open();");
 assert(r("Inventory.contents().includes('weapon-naginata')"));assert(r("Inventory.contents().includes('weapon-swordShield')"));assert(!r("Inventory.contents().includes('weapon-katana')"));
 choose(h,'weapon-naginata');assert.equal(h.elements.get('inventoryDetailText').textContent,r("I18n.format('weapon.description',['normal','heavy'].map(kind=>momoStats().damage*WeaponStyles.attack('naginata',SWORD_ATTACKS[kind]).damageScale))"));
 assert.equal(h.elements.get('useInventoryItem').textContent,r("I18n.t('service.equip')"));assert(h.elements.get('sellInventoryItem').hidden,'Owned weapons cannot be sold through Akash');
 choose(h,'weapon-swordShield');h.elements.get('useInventoryItem').onclick();assert.equal(r('weaponStyle'),'swordShield');assert.equal(r('player.hp'),2,'Equipping extra capacity does not restore health');assert.equal(r('player.maxHp'),7);assert.equal(r('saved.weaponStyle'),'swordShield');
 assert(!r("Inventory.contents().includes('weapon-swordShield')"));assert(r("Inventory.contents().includes('weapon-katana')"));choose(h,'weapon-katana');h.elements.get('useInventoryItem').onclick();assert.equal(r('player.hp'),2);assert.equal(r('player.maxHp'),5);
 r("campServices.ownedWeapons=['katana'];");assert(!r("CampWorkshop.equipOwned('naginata')"));assert.equal(r('weaponStyle'),'katana');
}
// Minimap draws the active interior rather than Japan's realm-sized geometry.
{
 const h=setup(),r=h.run;r("flags[1].push('minimap');level=forgeInterior;player.x=200;player.y=751;var minimapLines=[],mapContext=$('minimapCanvas').getContext('2d');mapContext.moveTo=(x,y)=>minimapLines.push([x,y]);Merchant.drawMinimap();");
 assert.equal(r('minimapLines.length'),r('forgeInterior.platforms.length'),'Only the current interior platforms are mapped');
}
console.log('PASS: immediate capped brews, three-way quick fallback and O input, inventory pause/DPR items, safe dev stocks, Akash isolation, fractional poison, owned weapon descriptions/equipping and interior minimap.');
