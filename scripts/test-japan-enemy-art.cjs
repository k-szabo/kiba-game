'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const h=require('./test-harness.cjs')(),r=h.run,root=path.resolve(__dirname,'..');
const atlas=JSON.parse(r('JSON.stringify(ART_JAPAN)')),manifest=r('ART_MANIFEST');
function pixels(key){
 const data=fs.readFileSync(path.join(root,manifest[key])),width=data.readUInt32BE(16),height=data.readUInt32BE(20),chunks=[];
 assert.equal(data[24],8);assert.equal(data[25],6,'Native RGBA alpha is retained');assert.equal(data[28],0);
 for(let p=8;p<data.length;){const size=data.readUInt32BE(p);if(data.toString('ascii',p+4,p+8)==='IDAT')chunks.push(data.subarray(p+8,p+8+size));p+=size+12;}
 const raw=zlib.inflateSync(Buffer.concat(chunks)),stride=width*4,rgba=Buffer.alloc(stride*height);
 assert.equal(raw.length,(stride+1)*height);
 for(let y=0;y<height;y++)for(let x=0;x<stride;x++){
  const filter=raw[y*(stride+1)],a=x>=4?rgba[y*stride+x-4]:0,b=y?rgba[(y-1)*stride+x]:0,c=y&&x>=4?rgba[(y-1)*stride+x-4]:0,p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
  assert(filter<=4);rgba[y*stride+x]=(raw[y*(stride+1)+x+1]+[0,a,b,(a+b)>>1,pa<=pb&&pa<=pc?a:pb<=pc?b:c][filter])&255;
 }
 return {width,height,rgba};
}
assert.deepEqual(Object.keys(atlas).sort(),['archer','guard','mage','raised','shield']);
for(const [role,definition]of Object.entries(atlas)){
 const image=pixels(definition.image);assert.equal(definition.width,image.width);assert.equal(definition.height,image.height);assert.equal(definition.facing,1);
 assert.equal(definition.frames.length,12);assert.equal(definition.walk.length,6);assert.equal(definition.attack.length,6);
 assert.deepEqual(definition.walk,definition.frames.slice(0,6));assert.deepEqual(definition.attackOrder,role==='shield'?[6,7,7,8,9,11]:[6,7,8,9,10,11]);assert.deepEqual(definition.attack,definition.attackOrder.map(i=>definition.frames[i]),'The actual shield thrust occurs at the damage phase, never during its warning');
 for(const [i,f]of definition.frames.entries()){
  assert(f.x>=0&&f.y>=0&&f.w>0&&f.h>0&&f.x+f.w<=image.width&&f.y+f.h<=image.height,role+' pose'+i+' stays inside native bitmap');
  assert.equal(f.bodyHeight,definition.frames[0].bodyHeight,'Attack poses do not resize the body');assert(f.bodyHeight>0);
  assert(f.anchorX>=f.x&&f.anchorX<f.x+f.w&&f.anchorY>=f.y&&f.anchorY<f.y+f.h);
  assert(Math.abs(f.visibleBounds[3]-f.anchorY)<=2,'Foot anchor matches native visible bottom');
  let ink=0;for(let y=f.y;y<f.y+f.h;y++)for(let x=f.x;x<f.x+f.w;x++)if(image.rgba[(y*image.width+x)*4+3]>8)ink++;
  assert(ink>2000,'Every registered pose has native alpha');
  const [left,top,right,bottom]=f.visibleBounds;
  assert(left>f.x&&top>f.y&&right<f.x+f.w&&bottom<f.y+f.h,'Crop retains space around the complete weapon/body silhouette');
  assert(f.outlines.length===1&&f.outlines[0].length>20,'A source-alpha silhouette isolates tips crossing ideal cells');
  assert(f.outlines[0].every(([x,y])=>Number.isFinite(x)&&Number.isFinite(y)&&x>=f.x&&x<=f.x+f.w&&y>=f.y&&y<=f.y+f.h),'Clipping retains the full native silhouette within the crop');
 }
}
r('DevTools.open();DevSession.begin();DevTools.close();');
const ctx=h.sandbox.document.getElementById('world').getContext('2d');let calls=[],transforms=[];
ctx.drawImage=(image,...args)=>calls.push({image,args});ctx.translate=(...args)=>transforms.push(args);
const snap=()=>r('JSON.stringify([player,enemies,projectiles,flags,progression,dungeonState,platforms,time,levelTime])');
for(const location of ['japan','samuraiCamp','yomiDungeon2']){
 r(location==='japan'?'enterRealm(0);state="play";':'CampQuest.enter('+JSON.stringify(location)+');state="play";');
 for(const role of ['guard','archer','shield','mage','raised']){
  r('enemies=[createEnemy({id:"japan-art",x:800,y:1100,patrol:200,kind:'+JSON.stringify(role==='raised'?'guard':role)+',factionOverride:"japan",raisedSamurai:'+(role==='raised')+'})];var artEnemy=enemies[0];');assert(r('Number.isFinite(artEnemy.x)&&Number.isFinite(artEnemy.y)'),'Art fixture has valid world coordinates');
  for(const action of ['walk','attack'])for(let index=0;index<6;index++)for(const face of [-1,1]){
   r('Object.assign(artEnemy,{face:'+face+',walkSpeed:50,animTime:'+((index+.1)/12)+',windup:0,attackTime:0,recovery:0,stun:0,inv:0,windupDuration:1,attackDuration:1});reducedMotion.matches=false;');
   if(action==='attack')r(index<3?'artEnemy.windup='+(1-(index+.1)/3)+';':index<5?'artEnemy.attackTime=.5;artEnemy.attackElapsed='+((index-3+.1)/2)+';':'artEnemy.recovery=.2;');
   const before=snap();calls=[];transforms=[];r('Visuals.actor(artEnemy,realms[realm]);');assert.equal(snap(),before,'Rendering never changes combat/progression');
   const definition=atlas[role],frame=definition[action][index],image=r('Visuals.images['+JSON.stringify(definition.image)+']'),bodyCalls=calls.filter(c=>c.image===image);
   assert.equal(bodyCalls.length,1,location+' '+role+' '+action+index+' uses the shared new atlas exactly once');assert(!r('Object.hasOwn(ART_MANIFEST,"japanWalk")||Object.hasOwn(ART_MANIFEST,"japanAttack")'),'Retired chibi sheets are absent from the shipped manifest');
   assert.deepEqual(bodyCalls[0].args.slice(0,4),[frame.x,frame.y,frame.w,frame.h]);assert(transforms.some(([x,y])=>x===-frame.anchorX&&y===-frame.anchorY),'Full native silhouette uses registered foot anchor');
  }
 }
}
r('artEnemy.windup=artEnemy.attackTime=artEnemy.recovery=artEnemy.stun=0;artEnemy.walkSpeed=60;reducedMotion.matches=true;');
for(const time of [0,.2,1,4]){r('artEnemy.animTime='+time);calls=[];r('Visuals.actor(artEnemy,realms[realm]);');const call=calls.find(c=>c.image===r('Visuals.images.japanRaised')),frame=atlas.raised.walk[0];assert.deepEqual(call.args.slice(0,4),[frame.x,frame.y,frame.w,frame.h],'Reduced motion uses a stable standing pose');}
r('state="pause";');const frozen=snap();h.tick(120);assert.equal(snap(),frozen,'Shared game loop freezes Japanese animation clocks on pause');
console.log('PASS: five native Japanese/undead sheets, sixty alpha-preserving poses, full crop margins, fixed body scales/feet, shared Japan/camp/dungeon rendering, facing, read-only draw and pause/reduced motion. Browser QA checks visual gear consistency.');
