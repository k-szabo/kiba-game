'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
const clone=value=>JSON.parse(JSON.stringify(value));
function setup(){const h=harness();h.run("defeated[0]=true;flags[0]=['forestBell','villageBell','campQuestAccepted','mayorExecuted','guardian:campMaster','smithRescued','herbalistRescued','enchanterRescued'];coins=2000;campServices=CampServiceRules.fresh(weaponStyle);CampQuest.enter('forgeInterior',{atShrine:true});initPlayer(forgeInterior.servicePoint);");return h;}
function find(node,id){if(node.id===id)return node;return(node.children||[]).map(n=>find(n,id)).find(Boolean);}
{
 const h=setup(),r=h.run;
 assert(r("CampWorkshop.open('forge')"));assert.equal(r('state'),'campService');
 const frozen=r('JSON.stringify({player,time,levelTime,enemies,projectiles,particles})');h.tick(200);assert.equal(r('JSON.stringify({player,time,levelTime,enemies,projectiles,particles})'),frozen);
 const content=h.elements.get('campServiceContent'),upgrade=find(content,'campAction-forgeWeapon-');assert(upgrade&&!upgrade.disabled);const stale=upgrade.onclick;upgrade.onclick();assert.equal(r('campServices.weaponRank'),1);assert.equal(r('coins'),1950);assert.equal(r('saved.campServices.weaponRank'),1);
 stale();assert.equal(r('campServices.weaponRank'),1,'Old rendered controls cannot buy twice');
 assert(r("CampWorkshop.action({type:'forgeArmor'})"));assert.equal(r('campServices.armorRank'),1);assert.equal(r('coins'),1900);
 const base=r('momoStats().damage');assert(r("CampWorkshop.action({type:'buyWeapon',weapon:'naginata'})"));assert.equal(r('coins'),1800);assert(r("CampWorkshop.action({type:'equip',weapon:'naginata'})"));assert.equal(r('weaponStyle'),'naginata');assert.equal(r('momoStats().damage'),base,'Forge damage is shared before weapon multiplier');
 assert(!r("CampWorkshop.action({type:'sellWeapon',weapon:'naginata'})"),'Equipped weapon cannot be sold');
 assert(r("CampWorkshop.action({type:'sellWeapon',weapon:'katana'})"));assert.equal(r('coins'),1850);assert.equal(r('campServices.ownedWeapons.length'),1);
 for(let n=1;n<5;n++)assert(r("CampWorkshop.action({type:'forgeWeapon'})"));assert.equal(r('campServices.weaponRank'),5);assert(!r("CampWorkshop.action({type:'forgeWeapon'})"));
 const normal=clone(r('saved'));validate(normal);r('CampWorkshop.close();startGame(true);');assert.deepEqual(clone(r('campServices')),normal.campServices);assert.equal(r('level.id'),'forgeInterior');assert.equal(r('weaponStyle'),'naginata');
 r("initPlayer(forgeInterior.servicePoint);CampWorkshop.open('forge');");const current=find(h.elements.get('campServiceContent'),'campAction-forgeArmor-').onclick;r('CampWorkshop.close();');const before=r('JSON.stringify({campServices,coins,saved})');current();assert.equal(r('JSON.stringify({campServices,coins,saved})'),before,'Closed overlay callbacks cannot transact');
 r("state='play';initPlayer({x:120,y:820});");assert(!r("CampWorkshop.open('forge')"),'Service cannot open at a distance');
}
{
 const h=setup(),r=h.run;r("CampQuest.enter('herbalHut');initPlayer(herbalHut.servicePoint);");assert(r("CampWorkshop.open('herbal')"));assert(r("flags[0].includes('herbalistQuestAccepted')"));assert(!r("CampWorkshop.action({type:'brew'})"));
 r('CampWorkshop.close();enterRealm(0);');
 for(let i=0;i<3;i++){
  r('initPlayer(CampHerbs.patches['+i+']);');assert.equal(r('getContext().type'),'campHerb');r('interact();');assert.equal(r('campServices.herbs'),i+1);assert(!r('CampHerbs.context()'),'A gathered patch cannot be immediately gathered twice');
 }
 validate(r('saved'));assert.equal(r('saved.campServices.herbs'),3);
 r('initPlayer(levels[0].rests[0]);interact();initPlayer(CampHerbs.patches[0]);');assert.equal(r('CampHerbs.context().type'),'campHerb','Shrine rest regrows herbs');r('interact();');assert.equal(r('campServices.herbs'),4);
 r('player.y=level.height+200;movePlayer(1/120);initPlayer(CampHerbs.patches[0]);');assert.equal(r('CampHerbs.context().type'),'campHerb','Death regrows patches but retains gathered stock');assert.equal(r('campServices.herbs'),4);
 r("CampQuest.enter('herbalHut');initPlayer(herbalHut.servicePoint);CampWorkshop.open('herbal');");assert(r("CampWorkshop.action({type:'brew'})"));assert.equal(r('campServices.herbs'),1);assert.equal(r('campServices.potions'),1);validate(r('saved'));
 r("CampWorkshop.close();player.hp=1;quickHeal='healingBrew';");h.press({action:'useMeat'});h.tick();h.release({action:'useMeat'});assert.equal(r('player.hp'),4);assert.equal(r('campServices.potions'),0);
 const herbs=r('campServices.herbs');r('startGame(true);');assert.equal(r('campServices.herbs'),herbs);assert.equal(r('campServices.potions'),0);
}
{
 const h=setup(),r=h.run;
 // Real normal travel requires discovery and rescue, and arrives in the physical map.
 assert(r("fastTravel(forgeInterior.rests[0],0)"));assert.equal(r('level.id'),'forgeInterior');
 assert(!r("fastTravel(herbalHut.rests[0],0)"),'Unvisited interior is not yet a fast-travel destination');
 r("CampQuest.enter('herbalHut');CampQuest.enter('forestCamp');");assert(r("fastTravel(herbalHut.rests[0],0)"));assert.equal(r('level.id'),'herbalHut');assert.equal(r('player.y+player.h'),r('herbalHut.rests[0].y'));
 r("CampQuest.enter('forestCamp');flags[0]=flags[0].filter(f=>f!=='herbalistRescued');");assert(!r("fastTravel(herbalHut.rests[0],0)"),'Forged discovery cannot bypass rescues');
}
console.log('PASS: actual workshop controls and stale callbacks, shared weapon ownership/ranks, saved purchases, repeatable herbs, shrine/death regrowth, brew quick use and discovered side-map fast travel.');
