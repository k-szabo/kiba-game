const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {run,tick,sandbox,elements}=require('./test-harness.cjs')();
const art=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/config/lava-serpent-art.json')));
assert.deepEqual(JSON.parse(run('JSON.stringify(ART_SERPENT)')),art,'Runtime registration must match the art reference');
const png=fs.readFileSync(path.join(__dirname,'..',art.source));
assert.equal(png[24],8);assert.equal(png[25],6);assert.equal(png[28],0);
const w=png.readUInt32BE(16),h=png.readUInt32BE(20),chunks=[];assert.equal(w,art.width);assert.equal(h,art.height);
for(let p=8;p<png.length;){const n=png.readUInt32BE(p);if(png.toString('ascii',p+4,p+8)==='IDAT')chunks.push(png.subarray(p+8,p+8+n));p+=n+12;}
const raw=zlib.inflateSync(Buffer.concat(chunks)),stride=w*4,pixels=Buffer.alloc(stride*h);
for(let y=0;y<h;y++)for(let x=0;x<stride;x++){
 const type=raw[y*(stride+1)],a=x>=4?pixels[y*stride+x-4]:0,b=y?pixels[(y-1)*stride+x]:0,c=y&&x>=4?pixels[(y-1)*stride+x-4]:0;
 const q=a+b-c,pa=Math.abs(q-a),pb=Math.abs(q-b),pc=Math.abs(q-c);
 pixels[y*stride+x]=(raw[y*(stride+1)+x+1]+[0,a,b,(a+b)>>1,pa<=pb&&pa<=pc?a:pb<=pc?b:c][type])&255;
}
// Label the actual source silhouettes, then rasterize each registration polygon.
// This catches a truncated tail or an adjacent frame leaking into a crop.
const labels=new Int32Array(w*h),queue=new Int32Array(w*h),sizes=[0];let label=0;
for(let p=0;p<labels.length;p++)if(!labels[p]&&pixels[p*4+3]>8){
 label++;let head=0,tail=1;queue[0]=p;labels[p]=label;
 while(head<tail){const at=queue[head++],x=at%w,y=Math.floor(at/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
  if((!dx&&!dy)||x+dx<0||x+dx>=w||y+dy<0||y+dy>=h)continue;
  const next=at+dy*w+dx;if(!labels[next]&&pixels[next*4+3]>8){labels[next]=label;queue[tail++]=next;}
 }}sizes[label]=tail;
}
const major=sizes.map((n,id)=>n>1000?id:0).filter(Boolean),owners=new Set();assert.equal(major.length,12);
for(const rect of art.frames){
 assert(rect.x>=0&&rect.y>=0&&rect.x+rect.w<=w&&rect.y+rect.h<=h);assert.equal(rect.bodyHeight,340);assert.equal(rect.outlines.length,1);
 const poly=rect.outlines[0],counts=new Map();
 for(let y=rect.y;y<rect.y+rect.h;y++){
  const crosses=[];for(let i=0,j=poly.length-1;i<poly.length;j=i++){
   const [x1,y1]=poly[j],[x2,y2]=poly[i];if((y1>y+.5)!==(y2>y+.5))crosses.push(x1+(y+.5-y1)*(x2-x1)/(y2-y1));
  }crosses.sort((a,b)=>a-b);
  for(let i=0;i<crosses.length;i+=2)for(let x=Math.max(rect.x,Math.ceil(crosses[i]-.5));x<Math.min(rect.x+rect.w,crosses[i+1]-.5);x++){
   const id=labels[y*w+x];if(id&&sizes[id]>1000)counts.set(id,(counts.get(id)||0)+1);
  }
 }
 assert.equal(counts.size,1,'A neighboring serpent leaks into the crop');const [id,count]=[...counts][0];
 assert.equal(count,sizes[id],'A visible part of the serpent is clipped');assert(!owners.has(id));owners.add(id);
}
const ctx=sandbox.document.getElementById('world').getContext('2d'),calls=[];ctx.drawImage=(...args)=>calls.push(args);
run("abilities=[true,true];defeated[1]=false;enterRealm(1);state='play';bossStarted=true;startYomiLavaWave('shelter');var snake=boss.serpent;");
// A boss holds a serpent reference; only a genuine serpent entity uses its atlas.
for(const serpentState of ['live','dormant','dead']){
 run(`snake.active=${serpentState==='live'};snake.dead=${serpentState==='dead'};snake.phase='${serpentState==='dormant'?'dormant':'wait'}';`);
 calls.length=0;const before=run('JSON.stringify({boss,enemies,platforms,player})');run('Visuals.actor(boss,realms[1],true);');
 assert(calls.some(c=>c[0]===run('Visuals.images.bosses')),`Demon body disappears with ${serpentState} serpent reference`);
 assert(!calls.some(c=>c[0]===run('Visuals.images.lavaSerpent')),'Boss reference dispatched as a serpent entity');
 assert.equal(run('JSON.stringify({boss,enemies,platforms,player})'),before);
}
run('snake.active=true;snake.dead=false;');
for(const phase of ['idle','windup','strike','recover']){
 const sources=new Set();for(let i=0;i<3;i++){
  run(`snake.phase='${phase==='idle'?'wait':phase}';snake.phaseDuration=1;snake.clock=${1-(i+.1)/3};snake.animTime=${i/5};`);
  calls.length=0;const before=run('JSON.stringify({boss,enemies,platforms,player,projectiles})');run('Visuals.actor(snake,realms[1]);');assert.equal(run('JSON.stringify({boss,enemies,platforms,player,projectiles})'),before);
  const call=calls.find(c=>c[0]===run('Visuals.images.lavaSerpent'));assert(call);sources.add(call.slice(1,5).join(','));
 }assert.equal(sources.size,3,`${phase}: distinct painted keyframes required`);
}
run('Inventory.open();');const frozen=run('JSON.stringify(boss.serpent)');tick(120);assert.equal(run('JSON.stringify(boss.serpent)'),frozen);
calls.length=0;run("snake.phase='dormant';snake.active=false;Visuals.actor(snake,realms[1]);");assert(!calls.some(c=>c[0]===run('Visuals.images.lavaSerpent')));
const hudClasses=new Set();elements.get('game').classList={add:name=>hudClasses.add(name),remove:name=>hudClasses.delete(name)};
run('bossStarted=true;boss.dead=false;updateHUD();');assert(hudClasses.has('encounter-active'));
run('boss.dead=true;updateHUD();');assert(!hudClasses.has('encounter-active'),'Battle layout survives victory');
run('boss.dead=false;bossStarted=false;updateHUD();');assert(!hudClasses.has('encounter-active'),'Exploration must retain normal quest HUD');
console.log('PASS: native alpha-preserving serpent silhouettes, no tail clipping or adjacent frame leakage, synchronized metadata, twelve painted poses, unchanged rendering state and paused/dormant animation.');
