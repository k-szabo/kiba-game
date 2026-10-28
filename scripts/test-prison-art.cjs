'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const h=require('./test-harness.cjs')(),r=h.run,art=JSON.parse(r('JSON.stringify(ART_PRISON)')),manifest=r('ART_MANIFEST');
function pixels(file){
 const png=fs.readFileSync(file),w=png.readUInt32BE(16),height=png.readUInt32BE(20),parts=[];assert.equal(png[24],8);assert.equal(png[25],6);assert.equal(png[28],0);
 for(let at=8;at<png.length;){const n=png.readUInt32BE(at);if(png.toString('ascii',at+4,at+8)==='IDAT')parts.push(png.subarray(at+8,at+8+n));at+=n+12;}
 const raw=zlib.inflateSync(Buffer.concat(parts)),stride=w*4,out=Buffer.alloc(stride*height);
 for(let y=0;y<height;y++)for(let x=0;x<stride;x++){
  const type=raw[y*(stride+1)],a=x>=4?out[y*stride+x-4]:0,b=y?out[(y-1)*stride+x]:0,c=y&&x>=4?out[(y-1)*stride+x-4]:0,p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
  out[y*stride+x]=(raw[y*(stride+1)+x+1]+[0,a,b,(a+b)>>1,pa<=pb&&pa<=pc?a:pb<=pc?b:c][type])&255;
 }return {w,height,out};
}
for(const [name,count]of [['zen',4],['undead',4],['warden',8]]){
 const a=art[name],px=pixels(path.join(__dirname,'..',manifest[a.image]));assert.equal(a.frames.length,count);const body=a.frames[0].bodyHeight;
 for(const frame of a.frames){
  assert(frame.x>=0&&frame.y>=0&&frame.x+frame.w<=px.w&&frame.y+frame.h<=px.height);assert.equal(frame.bodyHeight,body,'Pose changes never resize the body');
  let ink=0,edges=0,bottom=0;
  for(let y=frame.y;y<frame.y+frame.h;y++)for(let x=frame.x;x<frame.x+frame.w;x++)if(px.out[(y*px.w+x)*4+3]>32){ink++;bottom=Math.max(bottom,y+1);if(x===frame.x||x===frame.x+frame.w-1||y===frame.y||y===frame.y+frame.h-1)edges++;}
  assert(ink>1500);assert.equal(edges,0,'Whole weapons, fingers and tails need transparent cell gutters');assert(frame.anchorY>frame.y+frame.h*.5&&frame.anchorY<frame.y+frame.h,'The ground anchor stays near the bottom of its native cell');let feet=0;for(let y=Math.max(frame.y,Math.floor(frame.anchorY)-3);y<Math.min(frame.y+frame.h,Math.ceil(frame.anchorY)+3);y++)for(let x=Math.max(frame.x,Math.floor(frame.anchorX-body*.4));x<Math.min(frame.x+frame.w,Math.ceil(frame.anchorX+body*.4));x++)if(px.out[(y*px.w+x)*4+3]>32)feet++;assert(feet>10,'The source contains opaque foot pixels at its ground anchor, independently of a lower chain or censer');
 }
}
r("DevTools.open();DevSession.begin();DevTools.close();CampQuest.enter('shadowPrison');var paintedWarden=enemies.find(PrisonWarden.is);var paintedUndead=enemies.find(e=>e.undead);");
const ctx=h.sandbox.document.getElementById('world').getContext('2d');let calls=[];ctx.drawImage=(image,...args)=>calls.push({image,args});
for(let pose=0;pose<8;pose++){
 r('paintedWarden.poseIndex='+pose+';paintedWarden.phase="strike";paintedWarden.move=null;');const before=r('JSON.stringify([enemies,player,projectiles,flags,platforms,levelTime])');calls=[];r('PrisonArt.actor(paintedWarden)');assert.equal(r('JSON.stringify([enemies,player,projectiles,flags,platforms,levelTime])'),before);
 const call=calls.find(c=>c.image===r('Visuals.images.'+art.warden.image));assert(call);assert.deepEqual(call.args.slice(0,4),[art.warden.frames[pose].x,art.warden.frames[pose].y,art.warden.frames[pose].w,art.warden.frames[pose].h]);
}
for(const expression of ['paintedUndead.windup=.4','paintedUndead.windup=0;paintedUndead.attackTime=.2','paintedUndead.attackTime=0;paintedUndead.walkSpeed=40']){
 r(expression);calls=[];r('PrisonArt.actor(paintedUndead)');assert(calls.some(c=>c.image===r('Visuals.images.'+art.undead.image)));
}
for(const key of art.backdrops){const png=fs.readFileSync(path.join(__dirname,'..',manifest[key]));r('Visuals.images['+JSON.stringify(key)+']={complete:true,naturalWidth:'+png.readUInt32BE(16)+',naturalHeight:'+png.readUInt32BE(20)+'};');}
for(const width of [1280,1432,2560,3840])for(const camera of [0,2000,Math.max(0,4600-width)]){
 r('viewW='+width+';camera='+camera+';cameraY=800');calls=[];const before=r('JSON.stringify([enemies,player,projectiles,flags,platforms,levelTime])');r('PrisonArt.backdrop()');assert.equal(r('JSON.stringify([enemies,player,projectiles,flags,platforms,levelTime])'),before);
 calls=calls.filter(call=>call.args.length===4);assert(calls.length>0&&calls.length<=art.backdrops.length);const first=calls[0].args,last=calls.at(-1).args;assert(first[0]<=1e-6&&last[0]+last[2]>=width-1e-6);assert(calls.every(c=>c.args[0]<width&&c.args[0]+c.args[2]>0&&c.args[1]<=0&&c.args[1]+c.args[3]>=720),'Only intersecting panels cover the viewport');
 if(width===3840)assert.equal(calls.length,3,'Ultrawide view retains every visible panel');
}
// A deep ground collider must tile native brick pixels, never stretch a strip.
const terrain=art.terrain,stone=pixels(path.join(__dirname,'..',manifest[terrain.image]));
for(const name of ['left','middle','right','platform','body']){
 const b=terrain[name];assert(b.x>=0&&b.y>=0&&b.x+b.w<=stone.w&&b.y+b.h<=stone.height);
 if(name!=='body')assert(b.surfaceY>=b.y&&b.surfaceY<b.y+b.h,'A painted walking surface must have source registration');
}
r('camera=0;cameraY=600;viewW=1280;');
const collision=r('JSON.stringify(platforms)');
for(const id of ['prison-entry-floor','prison-watch-step']){
 calls=[];assert.equal(r('PrisonArt.terrain(platforms.find(p=>p.id==='+JSON.stringify(id)+'))'),true);
 const painted=calls.filter(c=>c.image===r('Visuals.images.'+terrain.image));assert(painted.length);
 for(const c of painted){const [sx,sy,sw,sh,dx,dy,dw,dh]=c.args;assert(Math.abs(dw/sw-dh/sh)<1e-10,'Stone caps, slabs and brick bodies preserve native aspect');}
 const p=r('platforms.find(p=>p.id==='+JSON.stringify(id)+')'),top=terrain[id==='prison-watch-step'?'platform':'middle'];
 assert(painted.some(c=>c.args[0]===top.x&&c.args[1]===top.y&&Math.abs(c.args[5]+(top.surfaceY-top.y)*c.args[7]/top.h-p.y)<1e-8),'The painted top stays on the collider surface');
}
assert.equal(r('JSON.stringify(platforms)'),collision,'Terrain art never rewrites collision');
r('enterRealm(0);');assert.equal(r('PrisonArt.terrain(platforms[0])'),false,'Only the new prison uses its material');
const actors=r('PrisonArt.dialogueActors()');for(const id of ['zen','prisonWarden'])assert(actors[id].rect.w>0&&actors[id].rect.h>0&&manifest[actors[id].image]);
r("viewW=1280;CampQuest.enter('shadowPrison');");assert.doesNotThrow(()=>r('draw()'),'The complete side-map render does not assume the main realm altar exists');
console.log('PASS: sixteen native alpha-preserving prison poses, isolated full silhouettes and fixed body registration, pure phase-driven render, complete portrait crops and gap-free desktop scenery.');
