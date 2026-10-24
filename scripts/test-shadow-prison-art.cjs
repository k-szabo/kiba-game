'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const harness=require('./test-harness.cjs');
const h=harness(),r=h.run,ctx=h.sandbox.document.getElementById('world').getContext('2d');
r("Prologue.stop();enterRealm(3);state='play';var chamberWalls=level.gates.filter(g=>g.wallMaterial==='cult');");
assert.equal(r('chamberWalls.length'),3);
const art=r('ART_SECRET_WALLS.cult'),png=fs.readFileSync(path.join(__dirname,'..',r('ART_MANIFEST')[art.image])),m=art.material;
assert.equal(png[25],6,'Existing masonry keeps source alpha');
assert(m.x>=0&&m.y>=0&&m.w>0&&m.h>0&&m.x+m.w<=png.readUInt32BE(16)&&m.y+m.h<=png.readUInt32BE(20),'Material crop remains inside its source image');
r(`Visuals.images[${JSON.stringify(art.image)}]={complete:true,naturalWidth:${png.readUInt32BE(16)},naturalHeight:${png.readUInt32BE(20)},key:'masonry'};`);
const fills=[],clips=[],centres=[],draws=[];
ctx.fillRect=(...a)=>fills.push(a);ctx.rect=(...a)=>clips.push(a);ctx.translate=(...a)=>centres.push(a);
ctx.drawImage=(image,...a)=>{if(image.key==='masonry')draws.push(a);};
// QA-PRISON-001 r1: every collider's visible body must have full masonry.
for(const won of [false,true])for(let i=0;i<3;i++){
 r(`level.gates=[chamberWalls[${i}]];defeated[3]=${won};camera=level.gates[0].x-100;cameraY=level.gates[0].y-50;`);
 const g=r('level.gates[0]'),before=r('JSON.stringify([player,boss,enemies,flags,platforms,level.gates,time,levelTime])');
 fills.length=clips.length=centres.length=draws.length=0;r('Visuals.gates(realms[3]);Visuals.gates(realms[3]);');
 assert(fills.some(a=>a[0]===g.x&&a[1]===g.y&&a[2]===g.w&&a[3]===g.h),g.id+' paints its complete collider');
 assert(clips.some(a=>a[0]===g.x&&a[1]===g.y&&a[2]===g.w&&a[3]===g.h),g.id+' clips art to collision bounds');
 assert(draws.length>0);
 for(const a of draws){assert.deepEqual(a.slice(0,4),[m.x,m.y,m.w,m.h]);assert.deepEqual(a.slice(4),[-75,-75,150,150],'Masonry repeats at fixed scale instead of stretching a platform');}
 for(let y=g.y+1;y<g.y+g.h;y+=25)for(let x=g.x+1;x<g.x+g.w;x+=25)
  assert(centres.some(([cx,cy])=>x>=cx-75&&x<cx+75&&y>=cy-75&&y<cy+75),g.id+' has painted tile coverage at '+x+','+y);
 assert.equal(r('JSON.stringify([player,boss,enemies,flags,platforms,level.gates,time,levelTime])'),before,'Drawing must not alter collision, combat or clocks');
}
r("enterRealm(0);var oldBarriers=levels.flatMap(map=>map.gates).filter(g=>g.terrainBarrier&&!g.id.startsWith('prison')&&g.id!=='whiteSerpentRoof'); ");
assert(r('oldBarriers.length>0&&oldBarriers.every(g=>!g.wallMaterial)'),'Existing platform barriers retain their previous renderer');
console.log('PASS: QA-PRISON-001 r1 full-height clipped prison masonry, fixed-scale tile/crop/alpha bounds, body coverage before/after priest victory and read-only rendering.');
