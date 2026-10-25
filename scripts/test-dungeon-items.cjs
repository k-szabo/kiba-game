'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
const items=['dungeonSeal','weaponEnhancement','armorEnhancement','spiritEnhancement'];
function fixture(){
 const h=harness(),r=h.run,d=h.sandbox.document,draw=h.elements.get('world').getContext('2d');
 assert.equal(r('typeof DungeonRun'),'object','DungeonRun must be integrated into the source harness');
 function node(){return {id:'',dataset:{},hidden:false,disabled:false,isConnected:true,children:[],style:{},attributes:{},setAttribute(k,v){this.attributes[k]=v;},getContext:()=>draw,append(...items){this.children.push(...items);},replaceChildren(){this.children=[];},addEventListener(type,fn){this['on'+type]=fn;},getClientRects(){return this.hidden?[]:[{}];},focus(){d.activeElement=this;}};}
 d.createElement=node;for(const [id,el]of h.elements){el.id=id;el.focus=()=>d.activeElement=el;el.getClientRects=()=>el.hidden?[]:[{}];}
 d.querySelectorAll=()=>h.elements.get('inventoryGrid').children;
 d.querySelector=selector=>{const id=selector.match(/data-inventory-item="([^"]+)"/)?.[1];return h.elements.get('inventoryGrid').children.find(el=>el.dataset.inventoryItem===id)||null;};
 r("Prologue.stop();defeated=[true,true,false,false];abilities=[true,true];flags=[['forestBell','villageBell'],['soulUpper','soulLower','akashRescued','councilKeyEarned','councilGateOpen','dungeonRunStarted','dungeonStage1Clear','dungeonStage2Clear','dungeonStage3Clear','dungeonChestClaimed','dungeonCaptainReward','dungeonNecromancerReward','dungeonCouncilReward','councilSoul'],[],[]];visitedRests=[['start'],['start'],[],[]];dungeonState=DungeonRules.fresh();dungeonState.run=1;dungeonState.stock={dungeonSeal:2,weaponEnhancement:6,armorEnhancement:6,spiritEnhancement:6};progression=normalizeProgression(freshProgression(),flags);enterRealm(0);enterForestCamp({save:false,atShrine:true});initPlayer(forestCamp.npcs.find(n=>n.id==='akash'));state='play';coins=100;persist();");
 const choose=id=>{const row=h.elements.get('inventoryGrid').children.find(node=>node.dataset.inventoryItem===id);assert(row,'Missing inventory row '+id);row.onclick();return row;};
 const click=id=>{const control=h.elements.get(id);assert(control&&!control.hidden&&!control.disabled,'Unavailable control '+id);control.onclick();};
 const state=()=>r('JSON.stringify([dungeonState,coins,soldItems,flags,progression,saved,window.__saveSnapshots.length])');
 return {...h,r,d,choose,click,snapshot:state};
}
{
 const f=fixture(),{r,choose,click}=f;r('devicePixelRatio=2;Inventory.open();');
 for(const id of items){assert(r('ART_INVENTORY.items['+JSON.stringify(id)+'].stack'));const row=choose(id);assert.equal(r('Inventory.quantity('+JSON.stringify(id)+')'),id==='dungeonSeal'?2:6);assert.equal(row.children[0].width,224);assert.equal(row.children[0].height,224);assert.equal(row.children.at(-1).textContent,id==='dungeonSeal'?'×2':'×6');assert(f.elements.get('assignQuickHeal').hidden,'Enhancement/trinket cannot replace healing quick use');}
 choose('dungeonSeal');assert.equal(f.elements.get('inventoryDetailType').textContent,r("I18n.t('inventory.type.trinket')"));assert(f.elements.get('useInventoryItem').hidden);assert.equal(f.elements.get('inventoryDetailText').textContent,r("I18n.t('inventory.description.dungeonSeal')"));
 for(const [id,stat,delta]of [['weaponEnhancement','damage',.25],['armorEnhancement','armor',5]]){
  choose(id);assert(!f.elements.get('useInventoryItem').hidden);assert(!f.elements.get('useInventoryItem').disabled);assert.equal(f.elements.get('useInventoryItem').textContent,r("I18n.t('dungeon.enhancement.apply')"));const before=r('momoStats().'+stat),stock=r('Merchant.stock('+JSON.stringify(id)+')');click('useInventoryItem');assert.equal(r('Merchant.stock('+JSON.stringify(id)+')'),stock-1);assert.equal(r('momoStats().'+stat),before+delta);assert.equal(r('state'),'inventory');assert.equal(r('quickHeal'),'roastMeat');
 }
 choose('spiritEnhancement');const cooldown=r('momoStats().dashCooldown');click('useInventoryItem');assert(Math.abs(r('momoStats().dashCooldown')-cooldown*.97)<1e-10);assert.equal(r('dungeonState.boosts.spirit'),1);assert.equal(r('dungeonState.stock.spiritEnhancement'),5);
 const frozen=r('JSON.stringify([player,enemies,projectiles,time,levelTime])');f.tick(120);assert.equal(r('JSON.stringify([player,enemies,projectiles,time,levelTime])'),frozen,'Enhancement use leaves gameplay paused');validate(r('saved'));
}
{
 const f=fixture(),{r,choose,click}=f;r('abilities[1]=false;Inventory.open();');choose('spiritEnhancement');assert(f.elements.get('useInventoryItem').disabled);const before=f.snapshot();f.elements.get('useInventoryItem').onclick();assert.equal(f.snapshot(),before,'A disabled dash enhancement consumes nothing');
 r('abilities[1]=true;dungeonState.boosts={weapon:5,armor:5,spirit:5};Inventory.render();');
 for(const id of items.slice(1)){choose(id);assert(f.elements.get('useInventoryItem').disabled);const before=f.snapshot();f.elements.get('useInventoryItem').onclick();assert.equal(f.snapshot(),before,'Capped enhancements consume nothing');}
 r('dungeonState.boosts.weapon=0;Inventory.close();');const count=r('dungeonState.stock.weaponEnhancement');f.elements.get('useInventoryItem').onclick();assert.equal(r('dungeonState.stock.weaponEnhancement'),count,'Stale use control cannot run outside inventory');
 r("Inventory.open();");choose('weaponEnhancement');click('useInventoryItem');assert.equal(r('dungeonState.boosts.weapon'),1);r('Inventory.close();mainMenu();startGame(true);');assert.equal(r('dungeonState.boosts.weapon'),1);assert.equal(r('dungeonState.stock.weaponEnhancement'),count-1,'Same-release Continue restores enhancement count');validate(r('saved'));
}
{
 const f=fixture(),{r,choose,click}=f;r('Inventory.open();');
 const ledger=r('JSON.stringify([flags,progression])');
 for(const id of items){choose(id);const quantity=r('Inventory.quantity('+JSON.stringify(id)+')'),coins=r('coins'),price=id==='dungeonSeal'?50:20;assert.equal(r('Merchant.salePrice('+JSON.stringify(id)+')'),price);click('sellInventoryItem');click('confirmInventorySale');assert.equal(r('Inventory.quantity('+JSON.stringify(id)+')'),quantity-1);assert.equal(r('coins'),coins+price);assert(!r('soldItems.includes('+JSON.stringify(id)+')'),'Counted items do not enter unique sold history');assert.equal(r('JSON.stringify([flags,progression])'),ledger);validate(r('saved'));}
 const coins=r('coins');assert(r("Merchant.sell('councilSoul')"));assert.equal(r('coins'),coins+350);assert.equal(r("Inventory.quantity('councilSoul')"),0);assert(r("flags[1].includes('councilSoul')&&flags[1].includes('dungeonCouncilReward')"));assert.equal(r('JSON.stringify([flags,progression])'),ledger,'Selling the soul preserves first-clear points');validate(r('saved'));
 // Confirmation tokens must also protect the newly counted trinket.
 choose('dungeonSeal');click('sellInventoryItem');choose('weaponEnhancement');const before=f.snapshot();f.elements.get('confirmInventorySale').onclick();assert.equal(f.snapshot(),before,'Changing selection invalidates a pending counted-item sale');
 choose('dungeonSeal');click('sellInventoryItem');r('Inventory.render();');const rerender=f.snapshot();f.elements.get('confirmInventorySale').onclick();assert.equal(f.snapshot(),rerender,'Rerender invalidates a pending sale');
 choose('dungeonSeal');click('sellInventoryItem');click('confirmInventorySale');assert.equal(r("Inventory.quantity('dungeonSeal')"),0);const once=f.snapshot();f.elements.get('confirmInventorySale').onclick();assert.equal(f.snapshot(),once,'Double confirmation cannot sell twice');
 assert(!r("Object.hasOwn(Merchant.catalogue,'dungeonSeal')"));for(const id of items)assert(!r('Object.hasOwn(Merchant.catalogue,'+JSON.stringify(id)+')'),'Dungeon loot is not added to Akash purchase stock');
}
{
 const f=fixture(),{r}=f;r('Inventory.open();');
 for(const state of ['play','pause','shop','dialog','developer','menu']){r('state='+JSON.stringify(state));const before=f.snapshot();assert(!r("Merchant.sell('dungeonSeal')"));assert.equal(f.snapshot(),before);}
 r("state='inventory';$('inventory').hidden=true;");assert(!r("Merchant.sell('dungeonSeal')"));r("$('inventory').hidden=false;player.x=0;");assert(!r("Merchant.sell('dungeonSeal')"));
 r("initPlayer(forestCamp.npcs.find(n=>n.id==='akash'));state='inventory';coins=Number.MAX_SAFE_INTEGER-49;");const before=f.snapshot();assert(!r("Merchant.sell('dungeonSeal')"));assert.equal(f.snapshot(),before,'Coin overflow cannot partially remove the trinket');
 r('coins=Number.MAX_SAFE_INTEGER-50;');assert(r("Merchant.sell('dungeonSeal')"));assert.equal(r('coins'),Number.MAX_SAFE_INTEGER);
 for(const id of items){r('dungeonState.stock['+JSON.stringify(id)+']=Number.MAX_SAFE_INTEGER;');assert(!r('Merchant.addStock('+JSON.stringify(id)+')'));assert.equal(r('DungeonRun.stock('+JSON.stringify(id)+')'),Number.MAX_SAFE_INTEGER);}
}
{
 const f=fixture(),{r}=f;const normal=r('JSON.stringify(saved)'),writes=r('window.__saveSnapshots.length'),normalDungeon=r('JSON.stringify(dungeonState)');r('DevTools.open();');assert(r('DevSession.begin()'));
 for(const id of items){const amount=r('Merchant.stock('+JSON.stringify(id)+')');assert(r('DevItems.add({item:'+JSON.stringify(id)+'})'));assert(r('DevItems.add({item:'+JSON.stringify(id)+'})'));assert.equal(r('Inventory.quantity('+JSON.stringify(id)+')'),amount+2);}
 const find=(node,id)=>node?.id===id?node:node?.children?.map(child=>find(child,id)).find(Boolean);r('DevTools.refresh();');const picker=find(f.elements.get('devToolsList'),'dev-inventory-item-item');assert(picker);for(const id of [...items,'councilSoul'])assert(picker.children.some(option=>option.value===id),'Dev picker lists '+id);
 picker.value='weaponEnhancement';picker.onchange();const before=r('DungeonRun.stock("weaponEnhancement")');find(f.elements.get('devToolsList'),'dev-tool-inventory-item').onclick();assert.equal(r('DungeonRun.stock("weaponEnhancement")'),before+1);r('DevTools.close();Inventory.open();');f.choose('weaponEnhancement');f.click('useInventoryItem');assert.equal(r('dungeonState.boosts.weapon'),1);
 assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('window.__saveSnapshots.length'),writes,'Dev inventory actions never write the normal save');r('Inventory.close();DevTools.open();DevSession.end();startGame(true);');assert.equal(r('JSON.stringify(dungeonState)'),normalDungeon,'Ending dev restores deeply isolated inventory and boosts');assert.equal(r('JSON.stringify(saved)'),normal);
}
console.log('PASS: counted dungeon loot/DPR inventory, safe capped enhancement controls, vendor sales/confirmation guards, preserved soul-point history, overflow protection, dev picker and normal-save isolation.');
