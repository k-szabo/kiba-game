'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const h=harness(),r=h.run;
r('realm=3;level=zigguratSummit;state="play";flags[3].push("fiaRescued","arenaChampion","fiaTalismanCompleted","hannahDefeated","hannahFiaRescue");');
assert.equal(r('FiaQuest.questMarker("fia")'),'!');assert.equal(r('CampQuest.questMarker("fia")'),'!');r('flags[3].push("fiaDragonAccepted")');assert.equal(r('CampQuest.questMarker("fia")'),null);r('flags[3].push("dragonEyes")');assert.equal(r('CampQuest.questMarker("fia")'),'?');
r('flags[3].push("fiaDragonCompleted")');assert.equal(r('FiaQuest.questMarker("fia")'),null);
r('level=shadowUnderworld;platforms=level.platforms.map(p=>({...p}));');assert.equal(r('level.guards.length'),2);assert(r('level.guards.every(g=>g.x<level.forbiddenEntrance.x&&g.y===2021)'));assert.equal(r('voidForbidden.enemies.filter(e=>e.singleGuard).length'),0);
r('flags[3].push("fiaSlain");enemies=[];FiaRitual.populateHostiles();');assert.equal(r('enemies.filter(e=>e.singleGuard).length'),2);assert(r('enemies.every(e=>ArenaCombat.is(e)&&e.active)'));r('FiaRitual.populateHostiles()');assert.equal(r('enemies.length'),2,'Repeated population cannot duplicate gate guards');
// Capture registered terrain calls, not a duplicate hand-authored floor list.
r('var terrainCalls=[];Visuals.terrain=(r,items)=>terrainCalls.push(items.map(p=>p.id));');
for(const id of ['fiaRitual','shadowUnderworld','voidForbidden']){
 r('level=SIDE_LOCATIONS['+JSON.stringify(id)+'].map;platforms=level.platforms.map(p=>({...p}));terrainCalls=[];FiaVoidArt.scenery()');
 assert(r('terrainCalls.length===1'));assert(r('terrainCalls[0].length>0'));
}
r('level=fiaRitual;var image={complete:true,naturalWidth:1536,naturalHeight:1024};viewW=1280;camera=0;cameraY=300;var a=FiaVoidArt.roomLayout(image,600);camera=500;var b=FiaVoidArt.roomLayout(image,600);');
assert.equal(r('a.scale'),r('b.scale'));assert(r('a.width<level.width'),'Ritual art uses viewport scale instead of magnifying to entire map width');assert.equal(r('a.top'),r('b.top'),'Horizontal travel cannot change vertical registration');
const raid=harness(),q=raid.run;q('DevTools.open();DevSession.begin();DevTeleport.teleport({realm:"dragonCatacombs",rest:"dragonRaidEntrance"});DevBoss.revive({encounter:"dragonRaid3"});DevTools.close();');
q('DragonRaid.update(44)');assert(q('DragonRaidArt.pillarState(0).damage>.9'));q('DragonRaid.update(1)');assert(q('DragonRaidArt.pillarState(0).broken'));assert(!q('DragonRaidArt.pillarState(1).broken'));q('DragonRaid.update(1)');assert.equal(q('DragonRaidArt.pillarState(0).fall'),1);
q('state="pause";var before=JSON.stringify(DragonRaidArt.pillarState(1));DragonRaid.update(20);');assert.equal(q('JSON.stringify(DragonRaidArt.pillarState(1))'),q('before'));
q('state="play";DragonRaid.update(180)');assert(q('DragonRaid.current.failed'));assert(q('DragonRaid.locked()'));assert(!q('DragonRaid.hit(DragonRaid.head.box,1e9)'),'The failure animation cannot be turned into a victory');
q('DragonRaid.update(.4)');assert.equal(q('DragonRaidArt.pillarState(3).fall'),.5,'The last column gets a visible collapse before the attempt resets');q('state="pause";DragonRaid.update(10)');assert.equal(q('DragonRaidArt.pillarState(3).fall'),.5);q('state="play";DragonRaid.update(.4)');assert.equal(q('DragonRaid.current.phase'),1,'Retry follows the short collapse animation');
console.log('PASS: summit quest markers, outside gate guards and hostile population, registered floor rendering, stable ritual framing, active pillar cracks/collapse and pause.');
