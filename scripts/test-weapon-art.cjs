const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),harness=require('./test-harness.cjs');
const h=harness(),near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
for(const style of ['naginata','swordShield']){
 h.run(`weaponStyle='${style}'`);
 const art=JSON.parse(h.run('JSON.stringify(ART_LOADOUTS[weaponStyle])'));
 const scales=[],images=[],ctx=h.sandbox.document.getElementById('world').getContext('2d');
 ctx.scale=(...args)=>scales.push(args);ctx.drawImage=(...args)=>images.push(args);
 for(const kind of ['normal','heavy']){
  const clip=art[kind],bodyHeights=new Set(clip.frames.map(p=>p.bodyHeight));assert.equal(bodyHeights.size,1);
  const manifest=h.run(`ART_MANIFEST['${clip.image}']`),png=fs.readFileSync(path.join(__dirname,'..',manifest));
  const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
  assert.equal(clip.frames.length,6);
  const marks=kind==='heavy'?[0,.1,.25,.38,.5,.72]:[0,.05,.11,.16,.24,.34];
  for(const [i,pose]of clip.frames.entries()){
   assert(pose.x>=0&&pose.y>=0&&pose.x+pose.w<=width&&pose.y+pose.h<=height);
   assert(pose.anchorX>=pose.x&&pose.anchorX<=pose.x+pose.w&&pose.anchorY>=pose.y&&pose.anchorY<=pose.y+pose.h);
   assert(pose.gripX>=pose.x&&pose.gripX<=pose.x+pose.w&&pose.gripY>=pose.y&&pose.gripY<=pose.y+pose.h);
   assert(Number.isFinite(pose.weaponAngle));
   for(const face of [-1,1]){
    scales.length=images.length=0;h.run(`Visuals.momoSlash(300,500,96,${marks[i]+.001},${face},'${kind}')`);
    assert.equal(images.length,2,'One body and the same rigid prop are drawn');
    const propImage=h.run(`Visuals.images[ART_LOADOUTS[weaponStyle].prop.image]`);
    assert.equal(images[1][0],propImage);assert.equal(images[1].length,3,'Full prop alpha is preserved');
    const propScale=96*art.length/art.prop.length;
    near(scales.at(-1)[0],propScale);near(scales.at(-1)[1],propScale);
   }
  }
 }
}
console.log('PASS: complete loadout crop bounds, grounded anchors, six pose clips and fixed weapon scale across every attack/frame/direction. Browser inspection remains required.');
