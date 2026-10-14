const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {run,snap,tick,place}=require('./test-harness.cjs')({prologue:true});
const sample=options=>JSON.parse(run(`JSON.stringify(ShadowAnimation.sample(${JSON.stringify(options)}))`));
for(let i=0;i<6;i++)assert.deepEqual(sample({idleTime:(i+.05)/3}),{clip:'idle',frame:i});
for(const [remaining,frame] of [[.9,0],[.5,1],[.1,2]])assert.deepEqual(sample({auto:{stage:'windup',remaining,duration:.9}}),{clip:'melee',frame});
for(const [remaining,frame] of [[1.4,3],[1.2,4],[.7,5]])assert.deepEqual(sample({auto:{stage:'recover',remaining,duration:1.4}}),{clip:'melee',frame});
for(const [remaining,frame] of [[1.25,0],[.75,1],[.2,2]])assert.deepEqual(sample({cast:{stage:'windup',remaining,duration:1.25}}),{clip:'cast',frame});
for(const [elapsed,frame] of [[0,3],[.3,4],[.5,5]])assert.deepEqual(sample({release:{elapsed,duration:.58}}),{clip:'cast',frame});
assert.deepEqual(sample({release:{elapsed:.65,duration:.58}}),{clip:'cast',frame:0});
for(let i=0;i<6;i++)assert.deepEqual(sample({cast:{kind:'devour',remaining:2.8*(1-(i+.01)/6),duration:2.8}}),{clip:'devour',frame:i});
assert.equal(sample({auto:{stage:'windup',remaining:.3},cast:{kind:'devour',remaining:1,duration:2.8}}).clip,'devour');
assert.equal(sample({auto:{stage:'recover',remaining:1.35},cast:{stage:'windup',remaining:.2,duration:1.25}}).clip,'melee');
assert.equal(sample({auto:{stage:'recover',remaining:.6},release:{elapsed:.3,duration:.58}}).clip,'cast');

const clips=JSON.parse(run('JSON.stringify(SHADOW_CLIPS)'));
run('var spriteCalls=[];var originalSpriteDraw=ctx.drawImage;ctx.drawImage=(...args)=>spriteCalls.push(args.slice(1));ctx.globalAlpha=1;');
for(const [clip,data] of Object.entries(clips)){
 const file=path.join(__dirname,'../assets/images/enemies',`shadow-${clip}-v2.png`),png=fs.readFileSync(file);
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(png[25],6,'Sprite sheet must preserve its alpha channel');
 const width=png.readUInt32BE(16),height=png.readUInt32BE(20);assert.equal(width,1536);assert.equal(height,1024);assert.equal(data.frames.length,6);
 for(const [frame,r] of data.frames.entries()){
  assert(r.x>=0&&r.y>=0&&r.x+r.w<=width&&r.y+r.h<=height,`${clip}/${frame} exceeds its image`);
  assert(r.anchorX>0&&r.anchorX<r.w&&r.anchorY>0&&r.anchorY<r.h,`${clip}/${frame} has an invalid registration anchor`);
  run(`ShadowAnimation.draw({clip:'${clip}',frame:${frame}},500,350);`);
  const call=JSON.parse(run('JSON.stringify(spriteCalls.at(-1))'));
  assert.deepEqual(call.slice(0,4),[r.x,r.y,r.w,r.h]);
  assert(Math.abs(call[4]+r.anchorX*call[6]/r.w-500)<1e-8,'The eye anchor drifts horizontally');
  assert(Math.abs(call[5]+r.anchorY*call[7]/r.h-350)<1e-8,'The eye anchor drifts vertically');
 }
}
run('ctx.drawImage=originalSpriteDraw;');

const seen=Object.fromEntries(Object.keys(clips).map(key=>[key,new Set()]));
const record=()=>{const pose=snap().boss.animation;if(pose)seen[pose.clip].add(pose.frame);};
place(3160,720);tick();for(let i=0;i<350;i++){tick();record();}
run('player.inv=999;pause();');const paused=JSON.stringify(snap().boss.animation);tick(150);assert.equal(JSON.stringify(snap().boss.animation),paused);run('pause();');
let activeSweepFrames=0;
for(let i=0;i<4100&&run('Prologue.phase')==='battle';i++){
 tick();record();const b=snap().boss;
 if(b.hazards.some(h=>h.kind==='sweep'&&h.active)){
  activeSweepFrames++;assert.equal(b.animation.clip,'melee');assert([3,4].includes(b.animation.frame),'Damage occurs outside the painted swing frames');
 }
 if(b.move==='devour'){assert.equal(b.animation.clip,'devour');run('player.y=100;player.vy=0;player.onGround=false;');}
}
assert(activeSweepFrames>0);
for(const [clip,frames] of Object.entries(seen))assert.equal(frames.size,6,`${clip} never plays all six painted poses in combat (seen: ${[...frames].sort().join(', ')})`);
assert.equal(run('Prologue.phase'),'death');assert.deepEqual(JSON.parse(JSON.stringify(snap().boss.animation)),{clip:'devour',frame:5});
console.log('PASS: 24 alpha-preserving painted poses, valid source regions and fixed eye registration; windup/impact/recovery and spell release sync, overlapping attack priorities, paused animation and the held final devour pose.');
