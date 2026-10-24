'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
const result='triuneSerpentTalisman',scales=[[0,'whiteSerpentScale'],[1,'serpentScale'],[2,'wingedSerpentScale']];
const find=(node,id)=>node.id===id?node:(node.children||[]).map(child=>find(child,id)).find(Boolean);
function setup(){const h=harness();h.run("defeated=[true,true,true,false];flags=[['forestBell','villageBell','campQuestAccepted','mayorExecuted','guardian:campMaster','smithRescued','enchanterRescued','guardian:whiteSerpent','whiteSerpentScale'],['soulUpper','soulLower','serpentScale'],['dawnSeal','guardian:wingedSerpent','wingedSerpentScale'],[]];campServices=CampServiceRules.fresh('katana');campServices.ownedWeapons.push('naginata');campServices.armorRank=2;equippedTalisman=null;CampQuest.enter('mysticTent');initPlayer(level.servicePoint);player.hp=2.5;");return h;}
{
 const h=setup(),r=h.run;
 assert.equal(typeof r('SerpentRelics.equip'),'function');assert(!r('SerpentRelics.canUnite()'),'Fusion requires an open live service');assert(!r('SerpentRelics.unite()'));
 assert(r("CampWorkshop.open('mystic')"));const button=find(h.elements.get('campServiceContent'),'campAction-uniteScales-');assert(button&&!button.disabled);
 const pending=button.onclick;r('CampWorkshop.close();');pending();assert(!r('SerpentRelics.united()'),'Closed service handlers cannot fuse');
 r("CampWorkshop.open('mystic');player.x=0;");assert(!r('CampWorkshop.action({type:"uniteScales"})'),'Retained service actions recheck proximity');r("initPlayer(level.servicePoint);state='play';player.hp=2.5;");
 assert(r("CampWorkshop.open('mystic')"));
 for(const [realm,id]of scales){r('flags['+realm+']=flags['+realm+'].filter(flag=>flag!=='+JSON.stringify(id)+');');assert(!r('SerpentRelics.canUnite()'),'Missing scale blocks '+id);r('flags['+realm+'].push('+JSON.stringify(id)+');');}
 const before=r('JSON.stringify({hp:player.hp,max:player.maxHp,damage:momoStats().damage,progression})');
 assert(r('CampWorkshop.action({type:"uniteScales"})'));assert.equal(r('state'),'dialog');assert(r('SerpentRelics.united()'));assert.equal(r('equippedTalisman'),null);assert.equal(r('SerpentRelics.armorBonus()'),0,'Owning an unequipped artifact is not passive armor');
 assert.equal(r('JSON.stringify({hp:player.hp,max:player.maxHp,damage:momoStats().damage,progression})'),before,'Fusion grants no HP, damage or shrine points');
 const frozen=r('JSON.stringify({player,enemies,projectiles,particles,time,levelTime})');h.tick(60);assert.equal(r('JSON.stringify({player,enemies,projectiles,particles,time,levelTime})'),frozen);
 for(const [realm,id]of scales){assert(r('flags['+realm+'].includes('+JSON.stringify(id)+')'),'Historical acquisition stays recorded');assert.equal(r('Inventory.quantity('+JSON.stringify(id)+')'),0,'Consumed scale is not held');assert.equal(r('Merchant.salePrice('+JSON.stringify(id)+')'),0);}
 assert(!r('SerpentRelics.unite()'),'Fusion cannot repeat in its dialogue');h.dismiss();assert(r("CampWorkshop.open('mystic')"));assert(!r('SerpentRelics.canUnite()'));assert(find(h.elements.get('campServiceContent'),'campAction-uniteScales-').disabled);r('CampWorkshop.close();Inventory.open();');
 assert.equal(r('Inventory.quantity('+JSON.stringify(result)+')'),1);assert(!r('SerpentRelics.equip("serpentScale")'));assert(r('SerpentRelics.equip('+JSON.stringify(result)+')'));r('Inventory.render();');assert.equal(r('equippedTalisman'),result);assert.equal(r('SerpentRelics.armorBonus()'),20);assert.equal(r('momoStats().armor'),60);assert.equal(r('Inventory.quantity('+JSON.stringify(result)+')'),0,'Equipped artifact moves from bag view into its slot');
 const hp=r('player.hp'),points=r('progression.points');assert(r("CampWorkshop.equipOwned('naginata')"));assert.equal(r('equippedTalisman'),result,'Weapon and accessory are independent');assert.equal(r('player.hp'),hp);assert.equal(r('progression.points'),points);
 assert(r('SerpentRelics.equip(null)'));assert.equal(r('momoStats().armor'),40);assert.equal(r('player.hp'),hp,'Unequipping never heals');assert(r('SerpentRelics.equip('+JSON.stringify(result)+')'));r('Inventory.close();player.hp=player.maxHp;player.inv=0;var beforeArmorHit=player.hp;damage(2,1,true);persist();');assert.equal(r('beforeArmorHit-player.hp'),1.25,'Equipped talisman armor reaches the actual damage path');
 const stored=JSON.parse(r('JSON.stringify(saved)'));assert.equal(stored.equippedTalisman,result);validate(stored);
 r('startGame(true);');assert.equal(r('equippedTalisman'),result);assert.equal(r('CampQuest.locationId()'),'mysticTent');assert.equal(r('momoStats().armor'),60);
 r('revive();');assert.equal(r('equippedTalisman'),result);assert.equal(r('momoStats().armor'),60,'Ordinary death retains equipped armor');
 r('Inventory.open();SerpentRelics.equip(null);Inventory.close();persist();startGame(true);');assert.equal(r('equippedTalisman'),null);assert.equal(r('momoStats().armor'),40,'Unequipped state also survives continue');
 r('startGame(false);');assert.equal(r('equippedTalisman'),null);assert(!r('SerpentRelics.united()'),'A new journey clears artifact ownership');
}
{
 const h=harness(),r=h.run,normal=r('JSON.stringify(saved)'),writes=r('__saveSnapshots.length');
 r('DevTools.open();DevSession.begin();');
 for(const id of [...scales.map(entry=>entry[1]),result])assert(r('DevItems.add({item:'+JSON.stringify(id)+'})')===true,'Developer catalogue can add '+id);
 assert(r("flags[0].includes('triuneSerpentTalisman')"));assert(r('flags.every(list=>!list.some(id=>id.startsWith("guardian:")))'),'Item spawning grants no boss victories');assert.equal(r('progression.totalXp'),0);
 r('DevTools.close();Inventory.open();');assert(r('SerpentRelics.equip('+JSON.stringify(result)+')'));r('Inventory.close();persist();');assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('__saveSnapshots.length'),writes);
 r('DevSession.end();startGame(true);');h.dismiss();assert.equal(r('equippedTalisman'),null);assert(!r('SerpentRelics.united()'),'Developer artifact and equipment cannot escape into the normal save');
}
{
 const h=setup(),r=h.run;r("CampWorkshop.open('mystic');SerpentRelics.unite();");h.dismiss();r('Inventory.open();SerpentRelics.equip('+JSON.stringify(result)+');Inventory.close();');
 const normal=r('JSON.stringify(saved)'),writes=r('__saveSnapshots.length');assert.equal(r('equippedTalisman'),result);
 r('DevTools.open();DevSession.begin();DevTools.close();Inventory.open();SerpentRelics.equip(null);Inventory.close();DevSession.end();');assert.equal(r('equippedTalisman'),result,'Ending a live developer run restores the normally equipped accessory');assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('__saveSnapshots.length'),writes);
 r('startGame(true);');assert.equal(r('equippedTalisman'),result);assert.equal(r('SerpentRelics.armorBonus()'),20);
}
console.log('PASS: Fumi-only live/nearby once-only fusion, stale-handler guards, consumed historical scales, separate equipped armor without healing, death/continue/new-game and developer item/save isolation.');
