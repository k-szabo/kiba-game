const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');

// The game code is unchanged: this fixture only supplies DOM selection, click
// listeners and focus omitted by the general Canvas/storage VM harness.
function fixture(){
 const h=harness(),r=h.run,d=h.sandbox.document,draw=h.elements.get('world').getContext('2d');
 function node(){return {id:'',dataset:{},hidden:false,disabled:false,isConnected:true,children:[],style:{},attributes:{},
  setAttribute(k,v){this.attributes[k]=v;},getContext:()=>draw,append(...items){this.children.push(...items);},replaceChildren(){this.children=[];},
  addEventListener(type,fn){this['on'+type]=fn;},getClientRects(){return this.hidden?[]:[{}];},focus(){d.activeElement=this;}};}
 d.createElement=node;
 for(const [id,el]of h.elements){el.id=id;el.getClientRects=()=>el.hidden?[]:[{}];el.focus=()=>d.activeElement=el;}
 d.querySelectorAll=()=>h.elements.get('inventoryGrid').children;
 d.querySelector=selector=>{const id=selector.match(/data-inventory-item="([^"]+)"/)?.[1];return h.elements.get('inventoryGrid').children.find(el=>el.dataset.inventoryItem===id)||null;};
 r("flags=[['forestBell','villageBell'],['akashRescued'],[],[]];defeated=[true,false,false,false];enterRealm(0);enterForestCamp();coins=2000;persist();");
 h.place(r("forestCamp.npcs.find(n=>n.id==='akash').x"),820);
 const open=()=>{r("state='play';Inventory.open();");};
 const choose=id=>{const item=h.elements.get('inventoryGrid').children.find(el=>el.dataset.inventoryItem===id);assert(item,'Missing fixture item '+id);item.onclick();};
 const click=id=>{const el=h.elements.get(id);assert(el&&!el.hidden&&!el.disabled,'Unavailable control '+id);el.onclick();};
 const snapshot=()=>r('JSON.stringify([coins,meatCount,teaCount,quickHeal,soldItems,flags,defeated,abilities,progression,saved,window.__saveSnapshots.length])');
 const denied=id=>{const before=snapshot();assert.equal(r(`Merchant.sell(${JSON.stringify(id)})`),false);assert.equal(snapshot(),before,'Rejected sale mutated '+id);};
 const buy=id=>{r("Inventory.close();Merchant.open();");assert(r(`Merchant.purchase('${id}')`));r('Merchant.close();');open();};
 return {...h,r,d,open,choose,click,snapshot,denied,buy};
}

// Catalog prices deliberately lose value on resale, including repeat purchases.
{
 const f=fixture(),{r,open,buy,denied}=f;
 for(const id of r('Object.keys(Merchant.catalogue)'))assert(r(`Merchant.salePrice('${id}')>0&&Merchant.salePrice('${id}')<Merchant.catalogue['${id}'].price`));
 open();for(const id of ['__proto__','constructor','toString','missing',null,{},'weapon','angelHalo','demonHorn','councilKey','eclipseRelic','corruptedHymn','prisonKey'])denied(id);
 for(const id of ['compass','minimap','phoneCase']){
  buy(id);assert.equal(r(`Inventory.quantity('${id}')`),1);
  const coins=r('coins'),price=r(`Merchant.salePrice('${id}')`),flag=r('JSON.stringify(flags)');
  assert(r(`Merchant.sell('${id}')`));assert.equal(r('coins'),coins+price);assert.equal(r(`Inventory.quantity('${id}')`),0);assert.equal(r('JSON.stringify(flags)'),flag);validate(r('saved'));denied(id);
  if(id==='compass'){r("$('quest').hidden=false;Compass.update();");assert(f.elements.get('compass').hidden);}
  if(id==='minimap'){r('Merchant.drawMinimap();');assert(f.elements.get('minimap').hidden);}
  buy(id);assert.equal(r(`flags[1].filter(id=>id==='${id}').length`),1);assert.equal(r(`soldItems.includes('${id}')`),false);assert.equal(r(`Inventory.quantity('${id}')`),1);
 }
 assert.equal(r('Merchant.salePrice("phoneCase")'),50);assert.equal(r('Merchant.catalogue.phoneCase.price'),500);
 r('meatCount=2;persist();');open();
 for(const state of ['play','pause','shop','developer','dialog','menu','won']){r(`state='${state}'`);denied('roastMeat');}
 r("state='inventory';$('inventory').hidden=true;");denied('roastMeat');r("$('inventory').hidden=false;player.x=0;");denied('roastMeat');
 f.place(r("forestCamp.npcs.find(n=>n.id==='akash').x"),820);
 r("flags[1]=flags[1].filter(id=>id!=='akashRescued');");denied('roastMeat');r("flags[1].push('akashRescued');coins=Number.MAX_SAFE_INTEGER-3;");denied('roastMeat');
 r('coins=Number.MAX_SAFE_INTEGER-4;');assert(r("Merchant.sell('roastMeat')"));assert.equal(r('coins'),Number.MAX_SAFE_INTEGER);denied('roastMeat');
}

// Real transaction writes must retain quest history and earned boss-point budgets.
{
 const f=fixture(),{r,open}=f;
 r("abilities=[true,true];defeated=levels.map(()=>true);flags=[['forestBell','villageBell'],['akashRescued','soulUpper','soulLower'],['dawnSeal','shadowEntered'],[]];BOSS_REWARDS.forEach((b,i)=>flags[i].push(b.id,b.claim));progression=normalizeProgression(progression,flags);persist();");
 open();const ledger=r('JSON.stringify([flags,progression,abilities,defeated])');
 const writes=r('window.__saveSnapshots.length');
 for(const id of r('BOSS_REWARDS.map(b=>b.id)')){assert(r(`Merchant.sell('${id}')`));assert.equal(r(`Inventory.quantity('${id}')`),0);assert.equal(r('JSON.stringify([flags,progression,abilities,defeated])'),ledger);validate(r('saved'));}
 assert.equal(r('bossBonusPoints(flags)'),4);assert.equal(r('progression.points'),4);
 for(const raw of r(`window.__saveSnapshots.slice(${writes})`))validate(JSON.parse(raw));
 const held=r('JSON.stringify([soldItems,flags,progression,coins])');
 r('Inventory.close();player.inv=0;damage(999);');assert.equal(r('JSON.stringify([soldItems,flags,progression,coins])'),held);
 r('mainMenu();startGame(true);');assert.equal(r('JSON.stringify([soldItems,flags,progression,coins])'),held);validate(r('saved'));
 // Dev re-grants clear possession state without destroying normal save history.
 r('DevTools.open();');assert(r('DevSession.begin()'));assert.equal(r("DevItems.add({item:'oathbreakerSoul'})"),true);assert.equal(r("Inventory.quantity('oathbreakerSoul')"),1);
 assert.equal(r("DevItems.add({item:'oathbreakerSoul'})"),'dev.item.owned');r('DevSession.end();startGame(true);');
 assert.equal(r('JSON.stringify([soldItems,flags,progression,coins])'),held);
}

// The fusion quest scale is protected, remains held and cannot be farmed through retries.
{
 const f=fixture(),{r,open}=f;
 r("flags[1].push('soulUpper','soulLower','serpentScale');");open();f.denied('serpentScale');assert.equal(r("Inventory.quantity('serpentScale')"),1,'The quest scale remains held');
 r("Inventory.close();enterRealm(1);bossStarted=true;boss.serpent=createLavaSerpent();boss.serpent.active=true;enemies.push(boss.serpent);boss.serpent.hp=0;");
 const before=r('JSON.stringify([flags,coins,progression,soldItems])');r('defeatLavaSerpent(boss.serpent);');assert.equal(r('JSON.stringify([flags,coins,progression,soldItems])'),before);assert.equal(r("Inventory.quantity('serpentScale')"),1);
 r("enterRealm(0);enterForestCamp();");f.place(r("forestCamp.npcs.find(n=>n.id==='akash').x"),820);open();assert.equal(r("Inventory.quantity('serpentScale')"),1);f.denied('serpentScale');validate(r('saved'));
}

// Protected items remain protected even when owned, and valuable optional loot
// can be sold without reopening its encounter or making rewards farmable.
{
 const f=fixture(),{r,open,denied}=f;
 r("abilities=[true,true];defeated=levels.map(()=>true);flags=[['forestBell','villageBell','guardian:oldAngel','angelHalo','guardian:oldCultist','demonHorn'],['akashRescued','soulUpper','soulLower','councilKeyEarned','councilKey','guardian:doomSlayer','daisyPlush','slayerCrossbow'],['dawnSeal','shadowEntered','eclipseRelic'],['guardian:cultJailer','prisonKey','guardian:madOrganist','corruptedHymn']];");
 open();for(const id of ['weapon','angelHalo','demonHorn','councilKey','eclipseRelic','corruptedHymn','prisonKey'])denied(id);
 for(const id of ['daisyPlush','slayerCrossbow']){const flags=r('JSON.stringify(flags)');assert(r(`Merchant.sell('${id}')`));assert.equal(r('JSON.stringify(flags)'),flags);assert.equal(r(`Inventory.quantity('${id}')`),0);denied(id);}
 validate(r('saved'));r('Inventory.close();mainMenu();startGame(true);');
 for(const id of ['daisyPlush','slayerCrossbow'])assert.equal(r(`Inventory.quantity('${id}')`),0);
}

// Stack sales consume exactly one item and never cancel an already-drunk tea.
{
 const f=fixture(),{r,open}=f;r("meatCount=1;teaCount=2;quickHeal='roastMeat';player.hp=1;");
 assert(r('Merchant.drink()'));open();assert(r("Merchant.sell('roastMeat')"));assert.equal(r('meatCount'),0);assert.equal(r('quickHeal'),'tea');
 assert(r("Merchant.sell('tea')"));assert.equal(r('teaCount'),0);assert.equal(r('Merchant.canDrink()'),false);
 const hp=r('player.hp');f.tick(240);assert.equal(r('player.hp'),hp,'Inventory pauses active healing');r('Inventory.close();Merchant.update(2);');assert.equal(r('player.hp'),hp+1,'Selling remaining stock canceled active tea');
}

// Confirmation is scoped to current selection and current render/open instance.
{
 const f=fixture(),{r,open,choose,click,snapshot}=f;r('meatCount=3;teaCount=1;');open();choose('roastMeat');const before=snapshot();
 click('sellInventoryItem');assert.equal(f.elements.get('inventorySaleConfirm').hidden,false);click('cancelInventorySale');click('confirmInventorySale');assert.equal(snapshot(),before);
 choose('roastMeat');click('sellInventoryItem');choose('tea');click('confirmInventorySale');assert.equal(snapshot(),before,'Changing selection kept a pending sale');
 choose('roastMeat');click('sellInventoryItem');r('Inventory.render();');click('confirmInventorySale');assert.equal(snapshot(),before,'Re-render kept a pending sale');
 choose('roastMeat');click('sellInventoryItem');r('Inventory.close();Inventory.open();');click('confirmInventorySale');assert.equal(snapshot(),before,'Close/reopen kept a pending sale');
 choose('roastMeat');click('sellInventoryItem');click('confirmInventorySale');assert.equal(r('meatCount'),2);const once=snapshot();click('confirmInventorySale');assert.equal(snapshot(),once,'Double confirmation sold twice');
 r('meatCount=1;teaCount=0;Inventory.render();');choose('roastMeat');click('sellInventoryItem');click('confirmInventorySale');assert.equal(f.d.activeElement.id,'closeInventory','Last-item sale must return focus to a live control');
 const world=r('JSON.stringify([player,enemies,projectiles,time,levelTime])');f.press('d');f.press('j');f.tick(120);f.release('d');f.release('j');assert.equal(r('JSON.stringify([player,enemies,projectiles,time,levelTime])'),world,'Inventory sale UI must freeze gameplay');
 validate(r('saved'));
}
console.log('PASS: atomic vendor-only sales, guarded confirmations/focus, resale/rebuy ownership, boss-point and loot history, stock fallback/active tea, pause/death/reload and dev-save isolation.');
