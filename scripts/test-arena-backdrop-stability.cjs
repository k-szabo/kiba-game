'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),harness=require('./test-harness.cjs');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/arena-art.js'),'utf8'),h=harness(),r=h.run;
const art=JSON.parse(r('JSON.stringify({arena:ART_ARENA.arena,chambers:ART_ARENA.chambers})')),manifest=r('ART_MANIFEST');
function fixture(room,height,width){
 let calls=[];const images={};for(const a of Object.values(art))for(const key of a.panels||[a.image]){const png=fs.readFileSync(path.join(__dirname,'..',manifest[key]));assert.equal(png.readUInt32BE(16),a.w);assert.equal(png.readUInt32BE(20),a.h);images[key]={key,complete:true,naturalWidth:a.w,naturalHeight:a.h};}
 const ctx={save(){},restore(){},fillRect(...args){calls.push({kind:'fill',args});},drawImage(image,...args){calls.push({kind:'image',key:image.key||image.source,args});}};
 const makeSurface=()=>{const surface={width:0,height:0},paint={drawImage(image){surface.source=image.key;},createLinearGradient(){return {addColorStop(){}};},fillRect(){}};surface.getContext=()=>paint;return surface;};
 const level=JSON.parse(r('JSON.stringify('+(room?'fiaChambers':'shadowArena')+')'));
 const sandbox={ART_ARENA:art,ArenaChallenge:{active:()=>!room,room:()=>room},Visuals:{images},ctx,document:{createElement:makeSurface},Math,H:height,viewW:width,camera:0,cameraY:0,level,reducedMotion:{matches:false},clamp:(n,min,max)=>Math.max(min,Math.min(max,n)),state:'play',shake:0,time:0,levelTime:0,player:{x:240,y:400},enemies:[{hp:3,phase:'wait'}],projectiles:[{life:1}],flags:[[],[],[],[]],platforms:level.platforms};
 vm.createContext(sandbox);vm.runInContext(source,sandbox);
 const snapshot=()=>JSON.stringify([sandbox.level,sandbox.player,sandbox.enemies,sandbox.projectiles,sandbox.flags,sandbox.platforms,sandbox.time,sandbox.levelTime,sandbox.camera,sandbox.cameraY,sandbox.shake]);
 const draw=(x,y)=>{
  sandbox.camera=x;sandbox.cameraY=y;calls=[];const before=snapshot();assert(vm.runInContext('ArenaArt.backdrop()',sandbox));assert.equal(snapshot(),before,'Rendering never changes geometry, camera, clocks or combat');
  const pictures=calls.filter(call=>call.kind==='image');assert.equal(pictures.length,room?1:3,'Approved panels are retained');assert(calls.some(call=>call.kind==='fill'&&call.args[0]===0&&call.args[1]===0&&call.args[2]===width&&call.args[3]===height));
  const first=pictures[0].args,last=pictures.at(-1).args;assert(first[0]<=1e-7&&last[0]+last[2]>=width-1e-7,'Horizontal coverage at every camera position');assert(first[1]<=1e-7&&first[1]+first[3]>=height-1e-7,'Native imagery covers the full height');
  const a=room?art.chambers:art.arena;for(const picture of pictures){const [x,y,w,h]=picture.args;assert([x,y,w,h].every(Number.isFinite));assert(Math.abs(w/h-a.w/a.h)<1e-10,'Backgrounds preserve native aspect ratio');}
  return pictures.map(call=>({key:call.key,args:[...call.args]}));
 };
 return {sandbox,draw,level,rangeX:Math.max(0,level.width-width),rangeY:Math.max(0,level.height-height)};
}
for(const room of [false])for(const height of [720,1080])for(const width of [1280,1920,2560,3840]){
 const f=fixture(room,height,width),y=f.rangeY*.6,origin=f.draw(0,y);let before=origin,beforeX=0;
 for(let step=1;step<=40;step++){
  const x=f.rangeX*step/40,next=f.draw(x,y),delta=x-beforeX,motion=Math.abs(next[0].args[0]-before[0].args[0]);assert(motion<=delta*.18+1e-7,'Decorative panorama moves no faster than18% of camera travel');assert(next[0].args[0]<=before[0].args[0]+1e-7,'Parallax direction never reverses');assert.deepEqual(next.map(p=>p.args.slice(2)),origin.map(p=>p.args.slice(2)),'Camera motion cannot change magnification or detail scale');before=next;beforeX=x;
 }
 assert(Math.abs(before[0].args[0]-origin[0].args[0])<=f.rangeX*.18+1e-7,'Total horizontal drift is bounded by world units');
 let previous=f.draw(f.rangeX*.5,0),previousY=0;
 for(let step=1;step<=40;step++){
  const y=f.rangeY*step/40,next=f.draw(f.rangeX*.5,y);assert(Math.abs(next[0].args[1]-previous[0].args[1])<=(y-previousY)*.08+1e-7,'Vertical movement is gentle and bounded');previous=next;previousY=y;
 }
 const fixed=f.draw(f.rangeX*.5,f.rangeY*.5);for(const state of ['play','pause','dialog','inventory','developer']){f.sandbox.state=state;f.sandbox.shake=3;f.sandbox.time+=10;f.sandbox.levelTime+=3;assert.deepEqual(f.draw(f.rangeX*.5,f.rangeY*.5),fixed,'Time, pause or shake cannot animate, zoom or flash a decorative backdrop');}
 f.sandbox.reducedMotion.matches=true;const calm=f.draw(0,0);assert.deepEqual(f.draw(f.rangeX,f.rangeY),calm,'Reduced motion keeps the decorative panorama stationary');assert.deepEqual(f.draw(-500,-300),calm);assert.deepEqual(f.draw(f.rangeX+500,f.rangeY+300),calm);
 f.sandbox.reducedMotion.matches=false;const target=f.draw(f.rangeX*.3,f.rangeY*.7);f.sandbox.innerWidth=6400;f.sandbox.innerHeight=2160;f.sandbox.devicePixelRatio=3;assert.deepEqual(f.draw(f.rangeX*.3,f.rangeY*.7),target,'Canvas layout uses viewW/H world units, not CSS/DPR pixel dimensions');
 assert.deepEqual(f.draw(-500,-300),f.draw(0,0),'Out-of-bounds camera shake does not expose image edges');assert.deepEqual(f.draw(f.rangeX+500,f.rangeY+300),f.draw(f.rangeX,f.rangeY));
}
// The private room's furniture is world geometry, not a decorative panorama.
// A landmark plus the camera position must stay invariant while walking/jumping.
for(const height of [720,1080])for(const width of [1280,1920,2560,3840]){
 const f=fixture(true,height,width),origin=f.draw(0,0)[0].args;
 for(let step=0;step<=40;step++){
  const x=f.rangeX*step/40,y=f.rangeY*step/40,picture=f.draw(x,y)[0].args;
  assert(Math.abs(picture[0]+x-origin[0])<1e-7,'Furniture follows horizontal world camera exactly');
  assert(Math.abs(picture[1]+y-origin[1])<1e-7,'Furniture follows vertical world camera exactly');
  assert.deepEqual(picture.slice(2),origin.slice(2),'Room camera motion cannot resize furniture');
 }
 for(const mode of ['play','pause','dialog','inventory','developer'])for(const reduced of [false,true]){
  f.sandbox.state=mode;f.sandbox.shake=1;f.sandbox.time+=5;f.sandbox.reducedMotion.matches=reduced;
  const x=f.rangeX*.5,y=f.rangeY*.5,picture=f.draw(x,y)[0].args;
  assert(Math.abs(picture[0]+x-origin[0])<1e-7);assert(Math.abs(picture[1]+y-origin[1])<1e-7);
  assert.deepEqual(picture.slice(2),origin.slice(2),'Pause, reduced motion and attack shake preserve world registration');
 }
}
for(const fps of [30,60,120]){
 const f=fixture(false,720,1280),endX=Math.min(500,f.rangeX),endY=Math.min(250,f.rangeY),start=f.draw(0,0);let previous=start;
 for(let tick=1;tick<=fps;tick++){const x=endX*tick/fps,y=endY*tick/fps,next=f.draw(x,y);assert(Math.abs(next[0].args[0]-previous[0].args[0])<=.18*endX/fps+1e-7);assert(Math.abs(next[0].args[1]-previous[0].args[1])<=.08*endY/fps+1e-7);previous=next;}
 const direct=fixture(false,720,1280).draw(endX,endY);assert.deepEqual(previous,direct,'30/60/120FPS paths end at the same deterministic view');assert.deepEqual(f.draw(endX,endY),previous,'Repeated draws do not accumulate smoothing or animation time');
}
// Explicitly catch the old normalized full-panorama mapping at a representative
// world viewport: its >1x camera derivative caused the reported motion sickness.
{
 const f=fixture(false,720,1280),one=f.draw(300,100),two=f.draw(400,100);assert(Math.abs(two[0].args[0]-one[0].args[0])<=18+1e-7);assert.deepEqual(f.draw(400,100),two,'The cached native panel fades are stable across repeated renders');
}

// The shared-HP pair has independently authored poses; a single Fia summon
// still uses the same full cyclops profile rather than the generic minion atlas.
{
 r('DevTools.open();DevSession.begin();DevTools.close();CampQuest.enter("shadowArena");reducedMotion.matches=false;window.posePair=ArenaCombat.create(level.arenaEncounters.find(e=>e.miniboss==="arenaCyclops"));posePair.phase="wait";posePair.poseIndex=0;posePair.parts=[{x:1300,y:1520,w:100,h:180,face:1,index:0,poseIndex:2,phase:"windup",attackFace:1,attackElapsed:0,attackDuration:.6,attackBoxes:[{x:1350,y:1540,w:230,h:150}],hazards:[],summons:[]},{x:1650,y:1520,w:100,h:180,face:-1,index:1,poseIndex:3,phase:"strike",attackFace:-1,attackElapsed:.3,attackDuration:.6,attackBoxes:[{x:1440,y:1540,w:230,h:150}],hazards:[],summons:[]}];');
 const ctx=h.sandbox.document.getElementById('world').getContext('2d'),frames=r('ART_ARENA.cyclops.frames'),image=r('Visuals.images[ART_ARENA.cyclops.image]');let draws=[],dashes=[];ctx.drawImage=(source,...args)=>draws.push({source,args});ctx.setLineDash=values=>dashes.push([...values]);
 const before=r('JSON.stringify([posePair,player,enemies,projectiles,flags,levelTime])');assert(r('ArenaArt.actor(posePair)'));assert.equal(r('JSON.stringify([posePair,player,enemies,projectiles,flags,levelTime])'),before);const bodies=draws.filter(draw=>draw.source===image);assert.equal(bodies.length,2);assert.deepEqual(bodies.map(draw=>draw.args.slice(0,4)),[2,3].map(index=>{const f=frames[index];return [f.x,f.y,f.w,f.h];}),'Each independent guard uses its own pose');assert(dashes.some(pattern=>pattern.length>0),'A part windup remains visible even when the aggregate phase is idle');
 r('posePair.singleGuard=true;posePair.arenaMinion=true;posePair.arenaRole="cyclops";posePair.parts=posePair.parts.slice(0,1);');draws=[];assert(r('ArenaArt.actor(posePair)'));assert.equal(draws.filter(draw=>draw.source===image).length,1,'An owned summon is a full single cyclops, without a generic minion fallback');
}
console.log('PASS: native arena panorama18% horizontal/8% vertical speed bounds, world-locked chamber furniture, fixed scale/aspect, full desktop coverage, deterministic30/60/120FPS paths, pause/shake purity, reduced motion and world-unit layout. Real-browser QA verifies perceived clarity and comfort.');
