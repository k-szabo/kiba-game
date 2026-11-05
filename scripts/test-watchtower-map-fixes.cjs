'use strict';
const assert=require('node:assert/strict'),h=require('./test-harness.cjs')(),r=h.run;

// The entry still returns to the islands; the shrine is separately reachable
// on the same ledge, without sacrificing the existing ascent/descent route.
r("realm=0;level=ninjaWatchtower;platforms=level.platforms.map(p=>({...p}));");
const shrine=r("level.rests.find(p=>p.id==='watchtowerEntrance')"),gate=r('level.returnPoint');
assert.equal(shrine.y,gate.y);
assert(Math.abs(shrine.x-gate.x)>250,'Gate and shrine interaction radii must not overlap');
assert(r("level.platforms.some(p=>p.x<=1300&&p.x+p.w>=1342&&p.y===2000)"),'Relocated shrine needs solid support');

// Real enemy creation must use the new area's authored durability, rather
// than treating the map's 100-pixel patrol argument as a health value.
r("level=stormIslands;platforms=level.platforms.map(p=>({...p}));enemies=createEnemies();");
const cultists=r("enemies.filter(e=>e.factionOverride==='shadowCult')");
assert.equal(cultists.length,3);
for(const e of cultists){assert.equal(e.maxHp,100);assert.equal(e.hp,100);assert.equal(e.damageValue,3);assert.equal(e.xpValue,65);}
r("level=japan;platforms=level.platforms.map(p=>({...p}));");
assert.equal(r("createEnemy({id:'unchanged',kind:'guard',x:100,y:100,patrol:100}).maxHp"),4,'Earlier cultists retain their original tier');

// Rising camera moves the painting with its world floor. The actual rendered
// architecture keeps exactly the same dimensions at every height/viewport.
const draws=[];
h.sandbox.document.getElementById('world').getContext('2d').drawImage=(image,...rect)=>draws.push(rect);
r('reducedMotion.matches=true;level=stormIslands;');
for(const width of [1280,1920,2560]){
 let size=null;
 for(const cameraY of [0,200,600,1000]){
  draws.length=0;
  r('viewW='+width+';cameraY='+cameraY+';BackgroundFraming.cover(Visuals.images.stormIslandsBackdrop,{ground:1024*.81,floor:1300-cameraY,scaleFloor:H*.81});');
  assert(draws.length>0&&draws.flat().every(Number.isFinite));
  const base=draws.find(rect=>rect.length===4);assert(base,'The original painting must be drawn');
  const [x,y,w,height]=base;
  if(!size)size=[w,height];else assert.deepEqual([w,height],size,'Jumping must never magnify the architecture');
  assert(Math.abs(y+1024*.81*(w/1536)-(1300-cameraY))<1e-7,'Source floor stays anchored to the world');
  assert(x<=0&&x+w>=width,'Panorama covers the horizontal viewport');
 }
}
console.log('PASS: watchtower gate/shrine separation and support, late-area cultist stats, stable panorama scale and ground registration across cameras and desktop widths.');
