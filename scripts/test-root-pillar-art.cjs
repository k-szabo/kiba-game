const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {run,sandbox}=require('./test-harness.cjs')();
const ctx=sandbox.document.getElementById('world').getContext('2d'),scales=[],images=[],translations=[];
ctx.scale=(...args)=>scales.push(args);
ctx.translate=(...args)=>translations.push(args);
ctx.drawImage=(...args)=>images.push(args);
run("realm=0;level={...levels[0],gates:levels[0].gates.filter(g=>g.id==='root')};camera=2800;cameraY=500;abilities=[false,false];state='play';");
const geometry=run('JSON.stringify([levels[0].gates,levels[0].platforms])');
run('Visuals.gates(realms[0])');
assert.equal(images.length,1,'The root obstacle must still use painted terrain');
assert.equal(scales.length,1);
assert(Math.abs(scales[0][0]-scales[0][1])<1e-10,'Root material is stretched into a narrow pillar');
const rect=run('ART_FRAMES.terrain[0][1]'),gate=run("level.gates.find(g=>g.id==='root')");
const [,sx,sy,sw,sh]=images[0],scale=scales[0][0];
assert.equal(sy,rect.y);assert.equal(sh,rect.h);
assert(sx>=rect.x&&sx+sw<=rect.x+rect.w,'Pillar crop leaks into adjacent artwork');
assert(Math.abs(sw*scale-(gate.w+8))<1e-10,'Painted pillar no longer covers its collision width');
assert(Math.abs(sh*scale-(gate.h+40))<1e-10,'Painted pillar height changed');
assert(Math.abs(translations[0][1]+(rect.surfaceY-rect.y)*scale-gate.y)<1e-10,'Pillar surface drifts from its collision top');
assert.equal(run('JSON.stringify([levels[0].gates,levels[0].platforms])'),geometry,'Art changes alter traversal geometry');

// Check the source's actual alpha: an equal-size crop can still leave roots
// floating above the road when it selects a shorter part of the illustration.
const png=fs.readFileSync(path.join(__dirname,'..',run('ART_MANIFEST.terrain')));
assert.equal(png[24],8);assert.equal(png[25],6);assert.equal(png[28],0);
const width=png.readUInt32BE(16),height=png.readUInt32BE(20),chunks=[];
for(let p=8;p<png.length;){const size=png.readUInt32BE(p);if(png.toString('ascii',p+4,p+8)==='IDAT')chunks.push(png.subarray(p+8,p+8+size));p+=size+12;}
const raw=zlib.inflateSync(Buffer.concat(chunks)),stride=width*4,pixels=Buffer.alloc(stride*height);
for(let y=0;y<height;y++)for(let x=0;x<stride;x++){
 const type=raw[y*(stride+1)];assert(type<=4);
 const a=x>=4?pixels[y*stride+x-4]:0,b=y?pixels[(y-1)*stride+x]:0,c=y&&x>=4?pixels[(y-1)*stride+x-4]:0;
 const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
 pixels[y*stride+x]=(raw[y*(stride+1)+x+1]+[0,a,b,(a+b)>>1,pa<=pb&&pa<=pc?a:pb<=pc?b:c][type])&255;
}
const ground=run("levels[0].platforms.find(p=>p.kind==='ground'&&p.x<=3100&&p.x+p.w>=3165)");
assert(ground,'Root pillar must stand on an actual road platform');
const left=Math.ceil(sx),right=Math.floor(sx+sw),columns=right-left+1;
const sourceGround=sy+(ground.y-translations[0][1])/scale;
const coverage=y=>{let n=0;for(let x=left;x<=right;x++)if(pixels[(y*width+x)*4+3]>=128)n++;return n/columns;};
for(const y of new Set([Math.floor(sourceGround),Math.ceil(sourceGround)]))
 assert(coverage(y)>=.18,`Pillar has insufficient visible roots at road height (source row ${y})`);
let denseBottom=-1;
for(let y=Math.ceil(sy);y<sy+sh;y++)if(coverage(y)>=.18)denseBottom=y;
assert(translations[0][1]+(denseBottom-sy)*scale>=ground.y,'Substantial roots stop above the road');
console.log('PASS: proportional painted root pillar retains source alpha at road height, unchanged extent, surface anchor, and collision geometry.');
