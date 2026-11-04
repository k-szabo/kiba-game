'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const h=harness(),r=h.run;
r("Prologue.stop();flags[0].push('grapplingHook');platforms=[{id:'floor',x:0,y:500,w:2000,h:300}];level.grappleAnchors=[{id:'ring',x:700,y:100,w:32,h:32}];enemies=[];initPlayer({x:400,y:500});state='play';");
assert(r('Grapple.activate()'));
r(`var invalidDraws=[],imageSubmissions=[];
 for(const method of ['translate','moveTo','lineTo'])ctx[method]=(...values)=>{if(!values.every(Number.isFinite))invalidDraws.push({method,values});};
 ctx.drawImage=(image,...values)=>{imageSubmissions.push(image);if(!values.every(Number.isFinite))invalidDraws.push({method:'drawImage',values});};
 IslandsArt.player();`);
assert.deepEqual(JSON.parse(r('JSON.stringify(invalidDraws)')),[],'Canvas paths, actor transforms and destination rectangles must all be finite');
assert(r('imageSubmissions.includes(Visuals.images.momoHook)'),'The native Momo hook atlas is actually submitted to Canvas');
console.log('PASS: finite grapple rope paths, actor transforms and image destinations; native Momo hook atlas drawn.');

r(`level=floatingIslands;platforms=level.platforms;
 var painted=[],clips=[];
 var maskedPanels=[];
 document.createElement=()=>{const surface={width:0,height:0,masks:[]};maskedPanels.push(surface);surface.getContext=()=>({drawImage(image){surface.key=image.key;},createLinearGradient:(...axis)=>{const gradient={axis,stops:[],addColorStop(...stop){this.stops.push(stop);}};return gradient;},fillRect(){surface.masks.push(this.fillStyle);}});return surface;};
 reducedMotion.matches=true;
 ctx.drawImage=(image,x,y,w,h)=>painted.push({key:image.key,x,y,w,h});
 ctx.rect=(x,y,w,h)=>clips.push({x,y,w,h});
 for(const key of ['islandsRouteBackdrop','islandsArrivalBackdrop','islandsWatchtowerBackdrop'])Visuals.images[key]={key,complete:true,naturalWidth:1672,naturalHeight:941};`);
for(const width of [1280,1920]){
 for(const camera of [0,1500,1800,2200,3300,3700,4800,5200,7000-width]){
  r(`viewW=${width};camera=${camera};cameraY=1700;painted=[];clips=[];IslandsArt.backdrop();`);
  const draws=JSON.parse(r('JSON.stringify(painted)')),clips=JSON.parse(r('JSON.stringify(clips)'));
  assert.equal(draws[0].key,'islandsRouteBackdrop','Cloud base must remain below every open gap');
  const expected=[{x:0,y:2850,w:1800,key:'islandsArrivalBackdrop'},{x:5840,y:1650,w:1160,key:'islandsWatchtowerBackdrop'}].filter(p=>p.x<camera+width&&p.x+p.w>camera);
  assert.equal(draws.length,1+expected.length);
  expected.forEach((p,i)=>{
   const draw=draws[i+1],height=941*p.w/1672;
   assert.equal(draw.key,p.key);assert.equal(draw.x,p.x-camera);assert.equal(draw.w,p.w);
   assert.equal(draw.h,height);assert.equal(draw.y,p.y-1700-height*.8);
   if(p.key==='islandsWatchtowerBackdrop'&&camera===7000-width){const towerX=draw.x+.22*draw.w;assert(towerX>0&&towerX<width,'Tower landmark remains visible inside its supported island');}
  });
  assert.deepEqual(clips,[],'Background panels have feathered alpha rather than hard viewport rectangles');
 }
}
assert.equal(r('maskedPanels.length'),2,'Native-density masks are cached rather than recreated per frame');
for(const panel of JSON.parse(r('JSON.stringify(maskedPanels)'))){
 assert.equal(panel.width,1672);assert.equal(panel.height,941);assert.equal(panel.masks.length,2);
 for(const mask of panel.masks){assert.equal(mask.stops[0][1],'#fff0');assert.equal(mask.stops.at(-1)[1],'#fff0');assert(mask.stops[1][0]>0&&mask.stops.at(-2)[0]<1);}
}
r(`var bossSubmissions=[];ctx.drawImage=(image,...values)=>bossSubmissions.push({image,values});var leader=FloatingIslands.create(level.enemies.find(e=>e.miniboss==='shadowNinjaLeader'));IslandsArt.actor(leader);`);
assert(r('bossSubmissions.some(({image,values})=>image===Visuals.images.ninjaLeader&&Math.abs(values[7]-444*180/411)<1e-10)'),'Leader renders 180px tall with native foot registration');
assert.equal(r('leader.h'),112,'Presentation repair preserves combat body size');
console.log('PASS: smoothly masked, stable arrival/watchtower projections at 1280/1920, cache reuse, complete leader scale and unchanged combat body.');
