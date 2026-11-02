'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),harness=require('./test-harness.cjs'),h=harness(),r=h.run;
const scale=r('DRAGON_RAID_ART_SCALE');assert.equal(scale.momoHeight,69);
// These are authored world sizes, independent of the viewport. A side view's
// full length and a frontal wingspan are different anatomical measurements.
assert(scale.idleWidth/69>=35,'Grounded dragon spans at least35Momo heights');
assert(scale.flightWidth/69>=50,'Flying dragon spans at least50Momo heights');
assert(768*scale.front/69>=18,'Frontal wingspan spans at least18Momo heights');
for(const name of ['front','stagger']){
 const definition=r('ART_DRAGON.'+name),png=fs.readFileSync(path.join(__dirname,'..',r('ART_MANIFEST['+JSON.stringify(definition.image)+']')));
 assert.equal(png.readUInt32BE(16),1536);assert.equal(png.readUInt32BE(20),1024);assert.equal(png[25],6,'Native source alpha');assert.equal(definition.frames.length,4);
 for(const f of definition.frames){assert(f.x>=0&&f.y>=0&&f.x+f.w<=1536&&f.y+f.h<=1024);assert(f.anchorY>=f.y&&f.anchorY<=f.y+f.h);assert.equal(f.bodyHeight,400,'Staggering never miniaturizes the body');}
}
r('DevTools.open();DevSession.begin();DevTeleport.teleport({realm:"dragonCatacombs",rest:"dragonRaidEntrance"});DevBoss.revive({encounter:"dragonRaid3"});DevTools.close();resetCamera()');
assert.equal(r('cameraY'),r('DragonRaid.cameraTargetY(-1)'));
for(const box of r('DragonRaid.frontGeometry().forelegs'))assert.equal(box.y+box.h,scale.frontFeet,'Attackable forelegs meet the walkable floor');
r('for(const target of DragonRaid.targets())DragonRaid.hit(target,10000)');assert.equal(r('DragonRaidArt.frontPose().definition.image'),'dragonStagger');
h.tick(80);assert.equal(r('DragonRaid.current.stance'),'exposed');assert.equal(r('DragonRaidArt.frontPose().index'),2);assert.equal(r('DragonRaid.head.box.y+DragonRaid.head.box.h'),scale.frontFeet,'Fallen mouth is reachable from the floor');
r('state="pause";var beforeDraw=JSON.stringify([DragonRaid.current,player,time,levelTime]);DragonRaidArt.scenery()');assert.equal(r('JSON.stringify([DragonRaid.current,player,time,levelTime])'),r('beforeDraw'));
console.log('PASS: giant world-space scale in all3views, native stagger crops/body size, grounded forelegs/mouth, shared pose registration, fixed third-phase camera and read-only drawing.');
