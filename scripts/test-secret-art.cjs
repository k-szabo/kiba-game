const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {run,tick,press,release,sandbox}=require('./test-harness.cjs')();
const manifest=run('ART_MANIFEST'),walls=run('ART_SECRET_WALLS');
for(const art of Object.values(walls)){
  const png=fs.readFileSync(path.join(__dirname,'..',manifest[art.image]));
  assert.equal(png[25],6,'Secret wall PNG must retain native alpha');
  assert.equal(png.readUInt32BE(16),art.w);assert.equal(png.readUInt32BE(20),art.h);
  assert(art.anchorX>0&&art.anchorX<art.w&&art.anchorY>0&&art.anchorY<art.h);
  if(art.material)assert(art.material.x+art.material.w<=art.w&&art.material.y+art.material.h<=art.h);
}
run("abilities=[true,true];state='play';initPlayer({x:2760,y:-690});player.onGround=true;player.inv=999;");
const before=run('JSON.stringify([level.secrets,level.gates,level.platforms])');
assert.equal(run('Visuals.secretBackdropState().area.id'),'angelRuin');
assert.equal(run('Visuals.secretBackdropState().alpha'),1);
press(' ');tick(12);release(' ');tick(33);press(' ');tick(1);release(' ');
let high=0;
for(let i=0;i<130;i++){
  tick(1);if(run('player.y')<-1000)high++;
  assert.equal(run('Visuals.secretBackdropState()?.area.id'),'angelRuin','Jump arc leaks to the village');
  assert.equal(run('Visuals.secretBackdropState()?.alpha'),1,'Jump arc partially fades the arena');
}
assert(high>0,'Actual double jump must exercise the former top-edge bug');
assert.equal(run('JSON.stringify([level.secrets,level.gates,level.platforms])'),before,'Visuals changed discovery or traversal geometry');
run('player.y=900');assert.equal(run('Visuals.secretBackdropState()'),null,'Village must retain its background');
run("state='menu';player.y=-1000");assert.equal(run('Visuals.secretBackdropState()'),null);
const ctx=sandbox.document.getElementById('world').getContext('2d'),calls=[];
ctx.drawImage=(img,...args)=>calls.push({key:img._key,args,alpha:ctx.globalAlpha});
run("for(const key of ['angelRuinWall','cultCaveWall','fxDarkMagic'])Visuals.images[key]={complete:true,naturalWidth:1024,naturalHeight:1536,_key:key};state='play';camera=2400;cameraY=-1100;");
run('Visuals.secretScenery(realms[0])');assert(calls.some(c=>c.key==='angelRuinWall'),'Painted angel walls missing');
calls.length=0;run('cameraY=1750;Visuals.secretScenery(realms[0]);Visuals.gates(realms[0])');assert(calls.some(c=>c.key==='cultCaveWall'),'Painted cave masonry missing');
calls.length=0;run('Visuals.dashTrail(100,200,1,.25)');assert.equal(calls.length,1);assert.equal(calls[0].key,'fxDarkMagic');
assert(calls[0].args[6]>calls[0].args[7]*4,'Dash should stretch into a wisp rather than a ball');
calls.length=0;run('Visuals.dashTrail(100,200,1,1)');assert.equal(calls.length,0,'Expired wisp remains visible');
console.log('PASS: native alpha wall registration/material bounds; real double-jump keeps the angel backdrop fully opaque, village/menu do not; discovery/collision unchanged; painted walls and tapering dash smoke render.');
