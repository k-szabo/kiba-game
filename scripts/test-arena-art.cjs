'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const h=require('./test-harness.cjs')(),r=h.run,art=JSON.parse(r('JSON.stringify(ART_ARENA)')),manifest=r('ART_MANIFEST');
function rgba(file){
 const png=fs.readFileSync(file),w=png.readUInt32BE(16),height=png.readUInt32BE(20),parts=[];assert.equal(png[24],8);assert.equal(png[25],6,'Sprites preserve native RGBA');assert.equal(png[28],0);
 for(let at=8;at<png.length;){const n=png.readUInt32BE(at);if(png.toString('ascii',at+4,at+8)==='IDAT')parts.push(png.subarray(at+8,at+8+n));at+=n+12;}
 const raw=zlib.inflateSync(Buffer.concat(parts)),stride=w*4,out=Buffer.alloc(stride*height);
 for(let y=0;y<height;y++)for(let x=0;x<stride;x++){
  const type=raw[y*(stride+1)],a=x>=4?out[y*stride+x-4]:0,b=y?out[(y-1)*stride+x]:0,c=y&&x>=4?out[(y-1)*stride+x-4]:0,p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
  out[y*stride+x]=(raw[y*(stride+1)+x+1]+[0,a,b,(a+b)>>1,pa<=pb&&pa<=pc?a:pb<=pc?b:c][type])&255;
 }return {w,height,out};
}
for(const [name,a,count]of [['captain',art.captain,6],['serpent',art.serpent,6],['cyclops',art.cyclops,6],['fia',art.fia,8],['fiaWalk',art.fiaWalk,4],['thief',art.minions.thief,4],['guard',art.minions.guard,4]]){
 assert.equal(a.frames.length,count);const images=new Map();
 for(const frame of a.frames){
  const key=frame.image||a.image;if(!images.has(key))images.set(key,rgba(path.join(__dirname,'..',manifest[key])));const px=images.get(key);
  assert.equal(frame.bodyHeight,a.frames[0].bodyHeight,'Animation keeps a fixed body scale');assert(frame.x>=0&&frame.y>=0&&frame.x+frame.w<=px.w&&frame.y+frame.h<=px.height);
  assert(frame.anchorX>=frame.x&&frame.anchorX<frame.x+frame.w&&frame.anchorY>=frame.y&&frame.anchorY<frame.y+frame.h);
  assert(frame.outlines.length>0,'Native silhouettes isolate crossed grid-boundary weapons');
  assert(frame.outlines.every(points=>points.length>10&&points.every(([x,y])=>x>=frame.x&&y>=frame.y&&x<=frame.x+frame.w&&y<=frame.y+frame.h)));
  let ink=0;for(let y=frame.y;y<frame.y+frame.h;y++)for(let x=frame.x;x<frame.x+frame.w;x++)if(px.out[(y*px.w+x)*4+3]>32)ink++;assert(ink>1000,name+' contains native alpha pixels');
 }
}
r('DevTools.open();DevSession.begin();DevTools.close();CampQuest.enter("shadowArena");');
const ctx=h.sandbox.document.getElementById('world').getContext('2d');let calls=[];ctx.drawImage=(image,...args)=>calls.push({image,args});
const snapshot=()=>r('JSON.stringify([enemies,player,projectiles,flags,platforms,levelTime,ArenaChallenge.attempt,ArenaChallenge.departure])');
for(const type of ['arenaCaptain','arenaSerpent','arenaCyclops','arenaFia']){
 r('enemies=[ArenaCombat.create(level.arenaEncounters.find(e=>e.miniboss==='+JSON.stringify(type)+'))];window.renderEnemy=enemies[0];renderEnemy.active=true;');
 const count=type==='arenaFia'?8:6;
 for(let pose=0;pose<count;pose++){
  r('renderEnemy.poseIndex='+pose+';renderEnemy.phase="strike";renderEnemy.move=null;');const before=snapshot();calls=[];assert(r('ArenaArt.actor(renderEnemy)'));assert.equal(snapshot(),before,'Drawing never advances combat, player or challenge state');
  const expected=type==='arenaCyclops'?2:1;assert(calls.length>=expected);for(const call of calls.slice(0,expected)){const [sx,sy,sw,sh,dx,dy,dw,dh]=call.args;assert(Math.abs(dw/sw-dh/sh)<1e-10,'Native weapon/body aspect ratio survives scaling');}
 }
}
for(const destination of ['shadowArena','fiaChambers'])for(const width of [1280,1920,2560,3840]){
 r('CampQuest.enter('+JSON.stringify(destination)+');viewW='+width+';camera=0;cameraY='+(destination==='shadowArena'?1200:360)+';');
 for(const key of [...art.arena.panels,art.chambers.image]){const png=fs.readFileSync(path.join(__dirname,'..',manifest[key]));r('Visuals.images['+JSON.stringify(key)+']={complete:true,naturalWidth:'+png.readUInt32BE(16)+',naturalHeight:'+png.readUInt32BE(20)+'};');}
 const before=snapshot();calls=[];assert(r('ArenaArt.backdrop()'));assert.equal(snapshot(),before);const paint=calls.filter(c=>c.args.length===4);assert(paint.length>0);const first=paint[0].args,last=paint.at(-1).args;assert(first[0]<=0&&last[0]+last[2]>=width-1e-7,'Supported desktop widths have no scenery gap');
 const colliders=r('JSON.stringify(platforms)');calls=[];r('Visuals.terrain(realms[realm],platforms)');assert(calls.some(c=>c.image===r('Visuals.images.prisonTerrain')),'The actual shared terrain dispatcher uses native prison bricks in both new rooms');assert(!calls.some(c=>c.image===r('Visuals.images.terrain')),'No stretched legacy terrain reaches the new rooms');assert.equal(r('JSON.stringify(platforms)'),colliders);
}
// Actual victory/departure state drives the approved four-frame walk at8FPS.
r('DevTools.close();CampQuest.enter("shadowArena");state="play";ArenaChallenge.start();ArenaChallenge.update(45);for(let n=2;n<=4;n++){interact();var foe=enemies.find(ArenaCombat.is);foe.active=true;foe.hp=0;killEnemy(foe);}interact();');h.dismiss();
r('var finalFoe=enemies.find(e=>e.miniboss==="arenaFia");finalFoe.phase="exhausted";finalFoe.vulnerableRemaining=5;finalFoe.hp=0;killEnemy(finalFoe);');h.dismiss();assert(r('!!ArenaChallenge.departure'));
const walkImage=r('Visuals.images.fiaArenaWalk');
for(let index=0;index<4;index++){
 if(index)r('ArenaChallenge.update(.125);');const before=snapshot();calls=[];r('ArenaArt.scenery();');assert.equal(snapshot(),before,'Drawing the walk never advances departure or combat');const frame=art.fiaWalk.frames[index];assert(calls.some(call=>call.image===walkImage&&JSON.stringify(call.args.slice(0,4))===JSON.stringify([frame.x,frame.y,frame.w,frame.h])),'Victory uses each approved walking frame');
}
const frozen=r('JSON.stringify(ArenaChallenge.departure)');r('state="pause";ArenaChallenge.update(1);');assert.equal(r('JSON.stringify(ArenaChallenge.departure)'),frozen,'Departure animation freezes with gameplay');
r('state="play";reducedMotion.matches=true;');const still=r('ArenaChallenge.departure.x');r('ArenaChallenge.update(.125);');assert.equal(r('ArenaChallenge.departure.x'),still);calls=[];r('ArenaArt.scenery();');assert(!calls.some(call=>call.image===walkImage),'Reduced motion uses the established stationary departure pose');
assert(r('ART_INVENTORY.items.arenaSerpentScale.realm===3'));r('flags[3].push("arenaSerpentScale");');assert(r('Inventory.quantity("arenaSerpentScale")===1'));assert(r('ArenaArt.actors().fiaCombat.rect.w>0'));
console.log('PASS: native arena sprites/alpha and complete crop outlines, fixed actor scale, pure rendering, desktop scene coverage, shared terrain and inventory registration. Browser QA checks visible anatomy, cues and continuity.');
