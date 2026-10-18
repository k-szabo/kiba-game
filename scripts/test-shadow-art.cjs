const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const h=require('./test-harness.cjs')(),r=h.run,manifest=r('ART_MANIFEST'),atlas=r('ART_SHADOW');
function decode(file){
 const png=fs.readFileSync(path.join(__dirname,'..',file)),w=png.readUInt32BE(16),height=png.readUInt32BE(20),chunks=[];
 assert.equal(png[24],8);assert.equal(png[25],6,'Character and item alpha must be retained');assert.equal(png[28],0);
 for(let p=8;p<png.length;){const n=png.readUInt32BE(p);if(png.toString('ascii',p+4,p+8)==='IDAT')chunks.push(png.subarray(p+8,p+8+n));p+=n+12;}
 const raw=zlib.inflateSync(Buffer.concat(chunks)),stride=w*4,pixels=Buffer.alloc(stride*height);
 for(let y=0;y<height;y++)for(let x=0;x<stride;x++){
  const type=raw[y*(stride+1)],a=x>=4?pixels[y*stride+x-4]:0,b=y?pixels[(y-1)*stride+x]:0,c=y&&x>=4?pixels[(y-1)*stride+x-4]:0;
  const q=a+b-c,pa=Math.abs(q-a),pb=Math.abs(q-b),pc=Math.abs(q-c);
  pixels[y*stride+x]=(raw[y*(stride+1)+x+1]+[0,a,b,(a+b)>>1,pa<=pb&&pa<=pc?a:pb<=pc?b:c][type])&255;
 }
 return{w,height,pixels};
}
assert.equal(Object.keys(atlas.actors).length,7);
for(const [name,art] of Object.entries(atlas.actors)){
 const {w,height,pixels}=decode(manifest[art.image]),labels=new Int32Array(w*height),queue=new Int32Array(w*height),sizes=[0];let label=0;
 for(let p=0;p<labels.length;p++)if(!labels[p]&&pixels[p*4+3]>=8){
  label++;let head=0,tail=1;queue[0]=p;labels[p]=label;
  while(head<tail){const at=queue[head++],x=at%w,y=Math.floor(at/w);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    if((!dx&&!dy)||x+dx<0||x+dx>=w||y+dy<0||y+dy>=height)continue;
    const next=at+dy*w+dx;if(!labels[next]&&pixels[next*4+3]>=8){labels[next]=label;queue[tail++]=next;}
   }
  }sizes[label]=tail;
 }
 const major=sizes.map((n,id)=>n>10000?id:0).filter(Boolean),owners=new Set();assert.equal(major.length,6,name+': six separated poses');
 assert.equal(art.frames.length,6);
 for(const rect of art.frames){
  assert(rect.x>=0&&rect.y>=0&&rect.x+rect.w<=w&&rect.y+rect.h<=height);
  assert(rect.anchorX>=rect.x&&rect.anchorX<=rect.x+rect.w);assert.equal(rect.anchorY,rect.y+rect.h-1);assert(rect.bodyHeight>100);
  const poly=rect.outlines[0],counts=new Map();
  for(let y=rect.y;y<rect.y+rect.h;y++){
   const crosses=[];for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const [x1,y1]=poly[j],[x2,y2]=poly[i];if((y1>y+.5)!==(y2>y+.5))crosses.push(x1+(y+.5-y1)*(x2-x1)/(y2-y1));
   }crosses.sort((a,b)=>a-b);
   for(let i=0;i<crosses.length;i+=2)for(let x=Math.max(rect.x,Math.ceil(crosses[i]-.5));x<Math.min(rect.x+rect.w,crosses[i+1]-.5);x++){
    const id=labels[y*w+x];if(id&&sizes[id]>10000)counts.set(id,(counts.get(id)||0)+1);
   }
  }
  assert.equal(counts.size,1,name+': neighboring pose leaks');const [id,count]=[...counts][0];
  assert.equal(count,sizes[id],name+': complete body/weapon silhouette');assert(!owners.has(id));owners.add(id);
 }
}
for(const id of ['madPriestSoul','corruptedHymn','prisonKey']){
 const art=r(`ART_INVENTORY.items.${id}`),{w,height,pixels}=decode(manifest[art.image]);let visible=0,captured=0;
 for(let y=0;y<height;y++)for(let x=0;x<w;x++)if(pixels[(y*w+x)*4+3]>32){visible++;if(x>=art.x&&x<art.x+art.w&&y>=art.y&&y<art.y+art.h)captured++;}
 assert.equal(captured,visible,id+': full inventory silhouette');
}
r("enterRealm(3);state='play';bossStarted=true;");
const ctx=h.sandbox.document.getElementById('world').getContext('2d'),calls=[];ctx.drawImage=(...args)=>calls.push(args);
for(const phase of ['wait','windup','strike','recover']){
 r(`boss.phase='${phase}';boss.move='bell';boss.phaseDuration=1;boss.clock=.4;for(const e of enemies){e.active=true;e.phase='${phase}';e.phaseDuration=1;e.clock=.4;e.windup=${phase==='windup'?.4:0};e.attackTime=${phase==='strike'?.4:0};e.recovery=${phase==='recover'?.4:0};}`);
 const before=r('JSON.stringify([player,enemies,boss,platforms,projectiles])');calls.length=0;r('draw();');
 assert.equal(r('JSON.stringify([player,enemies,boss,platforms,projectiles])'),before,'Rendering must not advance combat');
}
console.log('PASS: seven painted atlases preserve all 42 body/weapon silhouettes without neighbor leaks, full inventory icons, anchors and pure fourth-realm rendering.');
