'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const h=require('./test-harness.cjs')(),{run}=h,art=JSON.parse(run('JSON.stringify(ART_REALM_SERPENTS)'));
const registered=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/art-prompts/serpent-animations-v1.json'),'utf8')).outputs;assert.deepEqual(art,registered);
function pixels(file){
 const png=fs.readFileSync(file),w=png.readUInt32BE(16),height=png.readUInt32BE(20),parts=[];assert.equal(png[24],8);assert.equal(png[25],6);assert.equal(png[28],0);
 for(let at=8;at<png.length;){const n=png.readUInt32BE(at);if(png.toString('ascii',at+4,at+8)==='IDAT')parts.push(png.subarray(at+8,at+8+n));at+=n+12;}
 const raw=zlib.inflateSync(Buffer.concat(parts)),stride=w*4,out=Buffer.alloc(stride*height);
 for(let y=0;y<height;y++)for(let x=0;x<stride;x++){
  const type=raw[y*(stride+1)],a=x>=4?out[y*stride+x-4]:0,b=y?out[(y-1)*stride+x]:0,c=y&&x>=4?out[(y-1)*stride+x-4]:0,p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
  out[y*stride+x]=(raw[y*(stride+1)+x+1]+[0,a,b,(a+b)>>1,pa<=pb&&pa<=pc?a:pb<=pc?b:c][type])&255;
 }return{w,height,out};
}
for(const [species,a]of Object.entries(art)){
 assert.equal(a.frames.length,8);assert.equal(a.facing,-1);const px=pixels(path.join(__dirname,'..',a.path));assert.equal(px.w,a.width);assert.equal(px.height,a.height);const body=a.frames[0].bodyHeight;
 for(const r of a.frames){
  assert.equal(r.bodyHeight,body,'Motion never normalizes changing full-body bounds');assert(r.x>=0&&r.y>=0&&r.x+r.w<=px.w&&r.y+r.h<=px.height);
  let ink=0,edges=0;for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)if(px.out[(y*px.w+x)*4+3]>32){ink++;if(x===r.x||x===r.x+r.w-1||y===r.y||y===r.y+r.h-1)edges++;}
  assert(ink>2000);assert.equal(edges,0,'Whole tails/wings have native transparent cell padding');
 }
 const realm=species==='white'?0:2;run('enterRealm('+realm+');var artSnake=enemies.find(e=>e.serpentType==='+JSON.stringify(species)+');');
 const start=run('JSON.stringify({enemies,player,flags,platforms,projectiles,levelTime})');run('SerpentArt.actor(artSnake);draw();');assert.equal(run('JSON.stringify({enemies,player,flags,platforms,projectiles,levelTime})'),start);
 const poses=new Set();for(const phase of ['wait','windup','strike','recover'])for(const move of Object.keys(JSON.parse(run('JSON.stringify(Serpents.profiles['+JSON.stringify(species)+'].moves)'))))for(const t of [0,.3]){run('artSnake.phase='+JSON.stringify(phase)+';artSnake.move='+JSON.stringify(move)+';artSnake.animTime='+t+';artSnake.walkSpeed=10;');poses.add(run('SerpentArt.pose(artSnake)'));}
 assert(poses.size>=6,'Distinct telegraph/release/recovery poses are selected');
}
for(const id of ['whiteSerpentScale','wingedSerpentScale','triuneSerpentTalisman']){const rect=JSON.parse(run('JSON.stringify(ART_INVENTORY.items['+JSON.stringify(id)+'])'));assert.equal(rect.image,'serpentRelics');assert(rect.w>300&&rect.h>300);}
for(const [realm,id]of [[0,'whiteSerpentCave'],[2,'wingedSerpentRoost']]){run('enterRealm('+realm+');var a=level.secrets.find(s=>s.id==='+JSON.stringify(id)+');initPlayer({x:a.arena.x+500,y:a.arena.y});resetCamera();');assert(run('SerpentArt.hasBackdrop(Visuals.secretBackdropState().area)'));run('draw();');}
console.log('PASS: sixteen native complete alpha silhouettes, fixed body scales, shared pose/render invariance, protected DPR inventory art and both registered secret backdrops.');
