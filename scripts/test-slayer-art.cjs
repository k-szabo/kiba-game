const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const h=require('./test-harness.cjs')(),r=h.run,manifest=r('ART_MANIFEST'),art=r('ART_SLAYER');
function decode(file){
 const png=fs.readFileSync(path.join(__dirname,'..',file)),w=png.readUInt32BE(16),height=png.readUInt32BE(20),chunks=[];
 assert.equal(png[24],8);assert.equal(png[25],6,'Source alpha must remain RGBA');assert.equal(png[28],0);
 for(let p=8;p<png.length;){const n=png.readUInt32BE(p);if(png.toString('ascii',p+4,p+8)==='IDAT')chunks.push(png.subarray(p+8,p+8+n));p+=n+12;}
 const raw=zlib.inflateSync(Buffer.concat(chunks)),stride=w*4,pixels=Buffer.alloc(stride*height);
 for(let y=0;y<height;y++)for(let x=0;x<stride;x++){
  const type=raw[y*(stride+1)],a=x>=4?pixels[y*stride+x-4]:0,b=y?pixels[(y-1)*stride+x]:0,c=y&&x>=4?pixels[(y-1)*stride+x-4]:0;
  const q=a+b-c,pa=Math.abs(q-a),pb=Math.abs(q-b),pc=Math.abs(q-c);
  pixels[y*stride+x]=(raw[y*(stride+1)+x+1]+[0,a,b,(a+b)>>1,pa<=pb&&pa<=pc?a:pb<=pc?b:c][type])&255;
 }
 return{w,height,pixels};
}
assert.equal(art.frames.length,24);
for(const key of ['slayerMelee','slayerRanged']){
 const {w,height,pixels}=decode(manifest[key]),frames=art.frames.filter(f=>f.image===key);
 assert.equal(frames.length,12);assert.equal(new Set(frames.map(f=>f.bodyHeight)).size,1,'Crouches cannot change body scale');
 let full=0,captured=0;
 for(let y=0;y<height;y++)for(let x=0;x<w;x++)if(pixels[(y*w+x)*4+3]>=32){
  full++;const owners=frames.filter(f=>x>=f.x&&x<f.x+f.w&&y>=f.y&&y<f.y+f.h);assert(owners.length<=1,'Neighboring animation silhouettes overlap');if(owners.length)captured++;
 }
 assert.equal(captured,full,key+': crops retain the entire visible body and weapon');
 for(const [i,f]of frames.entries()){
  assert(f.x>=0&&f.y>=0&&f.x+f.w<=w&&f.y+f.h<=height);
  const cw=w/4,ch=height/3;assert(f.x>=i%4*cw&&f.x+f.w<=(i%4+1)*cw);assert(f.y>=Math.floor(i/4)*ch&&f.y+f.h<=(Math.floor(i/4)+1)*ch);
  assert(f.anchorX>=f.x&&f.anchorX<=f.x+f.w&&f.anchorY>=f.y&&f.anchorY<=f.y+f.h+50);
 }
}
for(const id of ['daisyPlush','slayerCrossbow']){
 const f=r(`ART_INVENTORY.items.${id}`),{w,height,pixels}=decode(manifest[f.image]);let full=0,captured=0;
 for(let y=0;y<height;y++)for(let x=0;x<w;x++)if(pixels[(y*w+x)*4+3]>=32){full++;if(x>=f.x&&x<f.x+f.w&&y>=f.y&&y<f.y+f.h)captured++;}
 assert.equal(captured,full,id+': inventory crop preserves its full opaque silhouette');
}
const samples=[['wait',null,0],['windup','flail',3],['strike','flail',4],['recover','flail',5],['windup','kick',6],['strike','kick',7],['recover','kick',8],['windup','grab',9],['strike','grab',10],['windup','fireArrows',12],['strike','fireArrows',13],['strike','arrows',14],['windup','lightning',15],['strike','lightning',16],['strike','explosion',17],['windup','doubleJump',18],['recover','doubleJump',20],['retreat','saw',21],['cast','saw',22],['strike','saw',23]];
for(const [phase,move,index]of samples)assert.equal(r(`SlayerArt.pose({phase:${JSON.stringify(phase)},move:${JSON.stringify(move)},walkSpeed:0,jumps:1})`),index);
assert.equal(r("SlayerArt.pose({phase:'strike',move:'grab',victim:{}})"),11);
assert.equal(r("SlayerArt.pose({phase:'strike',move:'doubleJump',jumps:2})"),19);
// Render every pose without advancing a combat clock or changing registration.
r("enterRealm(1);var s=enemies.find(DoomSlayer.is);DoomSlayer.start(s);var calls=[],paint=$('world').getContext('2d'),oldDraw=paint.drawImage;paint.drawImage=(...a)=>calls.push(a);");
for(const [phase,move]of samples){
 r(`s.phase=${JSON.stringify(phase)};s.move=${JSON.stringify(move)};s.clock=.2;s.phaseDuration=1;`);
 const before=r('JSON.stringify([s,player,projectiles,flags,time])');r('SlayerArt.actor(s);SlayerArt.scenery();SlayerArt.objects();');assert.equal(r('JSON.stringify([s,player,projectiles,flags,time])'),before);
}
assert(r('calls.some(a=>a[0]===Visuals.images.slayerMelee)&&calls.some(a=>a[0]===Visuals.images.slayerRanged)'));
r('paint.drawImage=oldDraw;');
// A fire arrow adds painted fire in world coordinates; ordinary rain retains its rendering.
r("var fireCalls=[],fireAngles=[],oldRotate=paint.rotate;paint.drawImage=(...a)=>fireCalls.push(a);paint.rotate=a=>fireAngles.push(a);var bolt={x:240,y:190,vx:-220,vy:135,kind:'arrow',slayer:true,life:2};");
const boltBefore=r('JSON.stringify([bolt,player,projectiles,time])');
r('Visuals.projectile(bolt);');assert.equal(r('fireCalls.length'),0,'Plain arrow rain must not gain fire');
r('bolt.fire=true;fireAngles=[];Visuals.projectile(bolt);');
assert(r('fireCalls.some(a=>a[0]===Visuals.images.fxEmber)'),'The flaming bolt must use the painted fire asset');
assert(r('fireAngles.length===2&&fireAngles.every(a=>Math.abs(a-Math.atan2(bolt.vy,bolt.vx))<1e-9)'),'Fire and arrow face the same velocity without compounded transforms');
r('delete bolt.fire;');assert.equal(r('JSON.stringify([bolt,player,projectiles,time])'),boltBefore,'Rendering cannot change projectile or combat state');
r('reducedMotion.matches=true;bolt.fire=true;fireCalls=[];Visuals.projectile(bolt);');assert(r('fireCalls.some(a=>a[0]===Visuals.images.fxEmber)'),'Reduced motion retains the distinguishing static fire cue');
r('paint.drawImage=oldDraw;paint.rotate=oldRotate;reducedMotion.matches=false;');
// A partially visible/jumping guardian must retain an entirely visible health panel.
r("var oldFill=paint.fillRect,panels=[];paint.fillRect=(...a)=>{if(a[3]===84)panels.push(a);};camera=100;cameraY=-2000;s.phase='wait';s.move=null;s.walkSpeed=0;");
for(const width of [230,320,1280])for(const edge of ['left','right','above','below']){
 r(`viewW=${width};s.x=${edge==='left'?'camera-50':edge==='right'?'camera+viewW':'camera+viewW/2'};s.y=${edge==='above'?'cameraY-400':edge==='below'?'cameraY+H+300':'cameraY+400'};panels=[];SlayerArt.actor(s);`);
 assert(r('panels.length===1&&panels[0][0]>=camera+7.99&&panels[0][0]+panels[0][2]<=camera+viewW-7.99&&panels[0][1]>=cameraY+7.99&&panels[0][1]+84<=cameraY+H-7.99'),edge+': bounded panel at world viewport '+width);
}
r("viewW=320;scale=1;$('hud').hidden=false;$('quest').hidden=false;$('hud').getBoundingClientRect=()=>({left:0,top:0,width:320,height:90,bottom:90});$('quest').getBoundingClientRect=()=>({left:0,top:100,width:250,height:90,bottom:190});s.x=camera;s.y=cameraY;panels=[];SlayerArt.actor(s);");
assert(r('panels[0][1]>=cameraY+198'),'Clamped boss panel must avoid visible HUD and quest rectangles');
r('paint.fillRect=oldFill;viewW=1280;');
console.log('PASS: 24 complete separated alpha poses, stable atlas scale, full inventory silhouettes, attack pose mapping and read-only painted rendering.');
