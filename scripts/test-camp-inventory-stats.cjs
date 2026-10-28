'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
function stats(h){return Object.fromEntries(h.elements.get('inventoryStats').children.map(row=>[row.dataset.stat,row.children.length?row.children[1].textContent:row.textContent]));}
function number(value,locale){return Number(value.toFixed(2)).toLocaleString(locale,{maximumFractionDigits:2});}
// Equipped style, damage upgrades and armor all feed actual combat; highlighting
// an unequipped weapon must not make the character card claim it is equipped.
for(const locale of ['hu','en'])for(const style of ['katana','naginata','swordShield']){
 const h=harness(),r=h.run;
 r(`I18n.locale=${JSON.stringify(locale)};weaponStyle=${JSON.stringify(style)};campServices.ownedWeapons=['katana','naginata','swordShield'];campServices.weaponRank=3;campServices.armorRank=2;progression.stats.strength=4;progression.stats.vitality=2;defeated[1]=true;flags[0].push(SerpentRelics.result);equippedTalisman=SerpentRelics.result;initPlayer(level.start);player.hp=2.4;Inventory.open();`);
 let card=stats(h);assert.equal(card['text.health'],r("CampHealth.number(player.hp)+' / '+CampHealth.number(player.maxHp)"));
 for(const kind of ['normal','heavy'])assert.equal(card['binding.action.'+(kind==='normal'?'attack':'heavyAttack')],number(r(`playerAttackDamage('${kind}')`),locale));
 assert.equal(card['service.armor'],r("I18n.format('service.armor',[60,(16.67).toLocaleString(I18n.locale)])"),'Equipped +20 talisman is included in armor and reduction');
 const untouched=r('JSON.stringify([flags,progression,campServices,player,weaponStyle,equippedTalisman])'),saves=r('__saveSnapshots.length');
 r('Inventory.render();');assert.equal(r('__saveSnapshots.length'),saves);assert.equal(r('JSON.stringify([flags,progression,campServices,player,weaponStyle,equippedTalisman])'),untouched,'Reading stats never writes progression or heals');
 assert.equal(r('state'),'inventory');const frozen=r('JSON.stringify([time,levelTime,player])');h.tick(90);assert.equal(r('JSON.stringify([time,levelTime,player])'),frozen);
 // Real item consumption refreshes the same health card while remaining paused.
 r('meatCount=1;Math.random=()=>0;Merchant.eat(true);');assert.equal(stats(h)['text.health'],r("CampHealth.number(player.hp)+' / '+CampHealth.number(player.maxHp)"));
 r('SerpentRelics.equip(null);Inventory.render();');assert.equal(stats(h)['service.armor'],r("I18n.format('service.armor',[40,Number((100*Armor.playerReduction(40)).toFixed(2)).toLocaleString(I18n.locale)])"),'Unequipping removes only the accessory armor');
}
{
 const h=harness(),r=h.run;
 r("campServices.ownedWeapons=['katana','naginata','swordShield'];Inventory.open();CampWorkshop.equipOwned('swordShield');");assert.equal(stats(h)['text.health'],'5 / 7','Actual equipment changes refresh maximum health without healing');
 r("CampWorkshop.equipOwned('naginata');");assert.equal(stats(h)['binding.action.attack'],r("Number(playerAttackDamage('normal').toFixed(2)).toLocaleString(I18n.locale)"));assert.equal(stats(h)['text.health'],'5 / 5');
}
console.log('PASS: character-card live HP, equipped normal/heavy damage, forge and talisman armor/reduction, HU/EN numeric formatting, consumable/equipment refresh, pause and read-only inspection.');
