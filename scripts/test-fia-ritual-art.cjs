'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),harness=require('./test-harness.cjs');
const h=harness(),r=h.run;
assert.deepEqual(Object.keys(r('ART_FIA_RITUAL.services')),['trader','cook','smith'],'All corrupted service rows are registered');
for(const [name,definition]of Object.entries(r('({...ART_FIA_RITUAL,...ART_FIA_RITUAL.services})')).filter(([key])=>key!=='services')){
 const expected=name==='powers'?8:4;assert.equal(definition.frames.length,expected,name+': approved pose count');
 const png=fs.readFileSync(path.join(__dirname,'..',r('ART_MANIFEST['+JSON.stringify(definition.image)+']')));
 assert.equal(png[25],6,name+': native RGBA source');const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
 const heights=new Set();
 for(const frame of definition.frames){assert(frame.x>=0&&frame.y>=0&&frame.x+frame.w<=width&&frame.y+frame.h<=height,name+': complete source crop');assert(frame.anchorX>=frame.x&&frame.anchorX<=frame.x+frame.w&&frame.anchorY>=frame.y&&frame.anchorY<=frame.y+frame.h,name+': source anchor');heights.add(frame.bodyHeight);}
 assert.equal(heights.size,1,name+': stable source body height');
}
// Detached source-alpha fragments must form a union, not clip one another away.
r('var clips=0,draws=0;ctx.clip=()=>clips++;ctx.drawImage=()=>draws++;FiaVoidArt.stamp({image:"fiaRitual",frames:[{x:0,y:0,w:100,h:100,bodyHeight:100,anchorX:50,anchorY:100,outlines:[[[0,0],[10,0],[10,10]],[[50,50],[60,50],[60,60]]]}]},0,100,200,100)');
assert.equal(r('clips'),1);assert.equal(r('draws'),1);
const before=r('JSON.stringify({flags,progression,player,time,levelTime})');
r('FiaRitualArt.scenery();FiaRitualArt.weapon()');
assert.equal(r('JSON.stringify({flags,progression,player,time,levelTime})'),before,'Rendering cannot advance the ritual or its clocks');
console.log('PASS: ritual, attendant and service source-alpha crops, fixed body registration, effect bounds, union clipping and read-only rendering.');
