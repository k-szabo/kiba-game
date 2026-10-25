'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const h=require('./test-harness.cjs')(),r=h.run,art=JSON.parse(r('JSON.stringify(ART_KITSUNE)')),manifest=r('ART_MANIFEST');
function rgba(file){
 const png=fs.readFileSync(file),w=png.readUInt32BE(16),height=png.readUInt32BE(20),parts=[];assert.equal(png[24],8);assert.equal(png[25],6,'Sprites preserve native RGBA');assert.equal(png[28],0);
 for(let at=8;at<png.length;){const n=png.readUInt32BE(at);if(png.toString('ascii',at+4,at+8)==='IDAT')parts.push(png.subarray(at+8,at+8+n));at+=n+12;}
 const raw=zlib.inflateSync(Buffer.concat(parts)),stride=w*4,out=Buffer.alloc(stride*height);
 for(let y=0;y<height;y++)for(let x=0;x<stride;x++){
  const type=raw[y*(stride+1)],a=x>=4?out[y*stride+x-4]:0,b=y?out[(y-1)*stride+x]:0,c=y&&x>=4?out[(y-1)*stride+x-4]:0,p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
  out[y*stride+x]=(raw[y*(stride+1)+x+1]+[0,a,b,(a+b)>>1,pa<=pb&&pa<=pc?a:pb<=pc?b:c][type])&255;
 }return {w,height,out};
}
for(const [name,definition,count]of [['fia',art.fia,4],['fox',art.fox,4],['hunter',art.hunter,8],['ninja',art.residents?.shadowNinja,1],['thief',art.residents?.shadowThief,1]]){
 assert(definition,name+' registered');const px=rgba(path.join(__dirname,'..',manifest[definition.image]));assert.equal(definition.frames.length,count);const body=definition.frames[0].bodyHeight;
 for(const frame of definition.frames){
  assert.equal(frame.bodyHeight,body,'Pose changes never resize the actor body');assert(frame.x>=0&&frame.y>=0&&frame.x+frame.w<=px.w&&frame.y+frame.h<=px.height);
  assert(frame.anchorX>=frame.x&&frame.anchorX<frame.x+frame.w);assert(frame.anchorY>=frame.y&&frame.anchorY<frame.y+frame.h);
  let ink=0,edges=0;for(let y=frame.y;y<frame.y+frame.h;y++)for(let x=frame.x;x<frame.x+frame.w;x++)if(px.out[(y*px.w+x)*4+3]>32){ink++;if(x===frame.x||x===frame.x+frame.w-1||y===frame.y||y===frame.y+frame.h-1)edges++;}
  assert(ink>1000,name+' contains painted pixels');assert.equal(edges,0,name+' silhouette has complete transparent gutters');
 }
}
r("DevTools.open();DevSession.begin();DevTools.close();CampQuest.enter('shadowPrison');window.artHunter=enemies.find(PrisonHunter.is);");
const ctx=h.sandbox.document.getElementById('world').getContext('2d');let calls=[];ctx.drawImage=(image,...args)=>calls.push({image,args});
const snapshot=()=>r('JSON.stringify([player,enemies,flags,platforms,projectiles,time,levelTime,KitsuneQuest.departure])');
for(let pose=0;pose<8;pose++){
 r('artHunter.poseIndex='+pose+';artHunter.phase="strike";artHunter.move=null;');calls=[];const before=snapshot();assert(r('KitsuneArt.actor(artHunter)'));assert.equal(snapshot(),before);
 const painted=calls.find(call=>call.image===r('Visuals.images.'+art.hunter.image));assert(painted,'Every attack state uses the native hunter');const [sx,sy,sw,sh,dx,dy,dw,dh]=painted.args;assert(Math.abs(dw/sw-dh/sh)<1e-10,'Weapons and body retain native aspect');
}
const actors=r('KitsuneArt.dialogueActors()');assert(actors.fia&&actors.shadowNinja&&actors.shadowThief);
for(const key of [...art.den.panels,art.depths.image]){const png=fs.readFileSync(path.join(__dirname,'..',manifest[key]));r('Visuals.images['+JSON.stringify(key)+']={complete:true,naturalWidth:'+png.readUInt32BE(16)+',naturalHeight:'+png.readUInt32BE(20)+'};');}
for(const width of [1280,1432,2560]){
 r("CampQuest.enter('shadowDen');viewW="+width+';camera=0;cameraY=360;');calls=[];const before=snapshot();r('KitsuneArt.backdrop();KitsuneArt.scenery();');assert.equal(snapshot(),before);
 const panels=calls.filter(c=>c.args.length===4);assert.equal(panels.length,art.den.panels.length);assert(panels[0].args[0]<=0);const last=panels.at(-1).args;assert(last[0]+last[2]>=width,'Painted panels cover the supported desktop view');
}
r("CampQuest.enter('shadowPrison');cameraY=1900;camera=3000;viewW=1280;");calls=[];const before=snapshot();r('KitsuneArt.depthsBackdrop()');assert.equal(snapshot(),before);const bg=calls.find(c=>c.image===r('Visuals.images.'+art.depths.image));assert(bg);const [x,y,w,height]=bg.args;assert(Math.abs(y+art.depths.groundY*height/art.depths.h-(2360-1900))<1,'Lower background floor matches its real arena');
console.log('PASS: native alpha/crops and stable actor registration, complete portraits, pure state-driven hunter rendering, desktop den coverage and lower-prison floor alignment. Browser QA verifies anatomy and visible continuity.');
