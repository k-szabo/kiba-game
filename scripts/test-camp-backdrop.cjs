const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const h=require('./test-harness.cjs')(),r=h.run,art=r('ART_CAMP.backdrop'),manifest=r('ART_MANIFEST');
assert.equal(art.panels.length,3);assert.equal(art.panels[0].x,0);
assert.equal(art.panels.at(-1).x+art.panels.at(-1).w,r('forestCamp.width'));
for(const [i,p] of art.panels.entries()){
 const png=fs.readFileSync(path.join(__dirname,'..',manifest[p.image]));
 assert.equal(png.readUInt32BE(16),art.panelSize);assert.equal(png.readUInt32BE(20),art.panelSize);
 assert(art.panelSize/p.w>=1.5*art.w/r('forestCamp.width'),'Native detail density improves by at least50%, without resampling old art');
 if(i)assert(art.panels[i-1].x+art.panels[i-1].w>p.x,'Adjacent authored panels overlap');
}
const cedar=r('ART_CAMP.cedar'),tree=fs.readFileSync(path.join(__dirname,'..',manifest[cedar.image]));
assert.equal(tree[25],6,'Painted seam cedars retain transparency');
const ctx=h.sandbox.document.getElementById('world').getContext('2d'),draws=[],surfaces=[];
const original=h.sandbox.document.createElement;
h.sandbox.document.createElement=name=>{const el=original(name);if(name==='canvas')surfaces.push(el);return el;};
ctx.drawImage=(...args)=>draws.push(args);
r("DevTools.open();DevSession.begin();DevTeleport.teleport({realm:'forestCamp',rest:'forestCamp'});DevTools.close();camera=500.5;cameraY=300.25;Visuals.campBackdrop();");
const native=surfaces.filter(s=>s.width===art.panelSize&&s.height===art.panelSize),cachedCount=surfaces.length;
assert.equal(native.length,2,'Only two native overlap masks are cached');
assert(surfaces.every(s=>native.includes(s)||s.width<=512),'Animation sampling does not replace native overlap resolution');
const panels=draws.filter(a=>a.length===5);assert.equal(panels.length,3);
assert.equal(panels[0][1],-500.5);assert.equal(panels[1][1],art.panels[1].x-500.5);
const worldHeight=art.h*r('forestCamp.width')/art.w;
assert(panels.every(a=>Math.abs(a[4]-worldHeight)<1e-8),'All panels keep approved ground registration');
assert(Math.abs(panels[0][2]+300.25+art.groundY*r('forestCamp.width')/art.w-r('forestCamp.start.y'))<1e-8);
r('Visuals.campBackdrop()');assert.equal(surfaces.length,cachedCount,'Moving views reuse native masks and animation probes rather than recreate scaled canvases');
console.log('PASS: native camp detail density, complete overlapping coverage, source-sized caches, alpha cedars and unchanged ground registration.');
