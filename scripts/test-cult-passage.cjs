const assert=require('node:assert/strict');
const {run,press,release,sandbox}=require('./test-harness.cjs')();
const fs=require('node:fs'),path=require('node:path');

function reset({dashAbility=true,defeatedJapan=false}={}){
 run(`Prologue.stop();abilities=[true,${dashAbility}];defeated=[${defeatedJapan},false,false,false];flags=[['cultEntrance'],[],[],[]];enterRealm(0);state='play';enemies=[];keys.clear();pressed.clear();`);
}
reset();
const authored=run(`JSON.parse(JSON.stringify({height:level.height,passage:level.cultPassage,secret:level.secrets.find(s=>s.id==='cultCave'),gate:level.gates.find(g=>g.id==='cultWestWall')}))`);
assert.equal(authored.gate.kind,'shadow');
assert.equal(authored.gate.requiresDash,true);
assert.equal(authored.secret.arena.x,2650);
assert.equal(authored.secret.arena.y,2160);
assert.equal(authored.secret.guardian,'oldCultist');
assert.equal(authored.secret.relic,'demonHorn');
assert(run("level.enemies.some(e=>e.id==='oldCultist'&&e.x===3070&&e.y===2160)"));
assert(run("level.objects.some(o=>o.id==='demonHorn'&&o.guardian==='oldCultist')"));
assert(run("level.platforms.find(p=>p.id==='horn-vault').w===950"));
assert(run("level.rests.map(r=>r.id).join(',')==='start,river,fields,temple'"));
assert(run("level.gates.find(g=>g.id==='templeOath').h===level.height"));
assert(run("level.gates.find(g=>g.id==='cultEntrance').y+level.gates.find(g=>g.id==='cultEntrance').h===level.height"));

// Actual movement, gravity, jump buffering and landing determine every link.
// No teleportation occurs between takeoff and the claimed target landing.
run(`function cultRouteLink(fromId,toId,dt){
 const a=platforms.find(p=>p.id===fromId)||{...level.gates.find(g=>g.id===fromId),id:'gate:'+fromId},b=platforms.find(p=>p.id===toId);
 const start=clamp(b.x+b.w/2,a.x+25,a.x+a.w-25);
 initPlayer({x:start,y:a.y});player.onGround=true;player.support=a.id;
 keys.clear();pressed.clear();pressed.add(' ');let second=false;
 for(let i=0;i<Math.ceil(3/dt);i++){
  const delta=b.x+b.w/2-(player.x+player.w/2);
  keys.delete('a');keys.delete('d');if(Math.abs(delta)>5)keys.add(delta>0?'d':'a');
  if(!second&&b.y<a.y&&player.vy>-10&&!player.onGround&&i>Math.ceil(.2/dt)){pressed.add(' ');second=true;}
  update(dt);
  if(player.onGround&&player.support===b.id)return true;
  if(player.y>b.y+450)return false;
 }
 return false;
}`);
const steps=['cult-passage-landing','cult-passage-step1','cult-passage-step2','cult-passage-temple'];
for(const dt of [1/30,1/60,1/120]){
 for(let i=0;i<steps.length-1;i++)for(const [a,b] of [[steps[i],steps[i+1]],[steps[i+1],steps[i]]]){
  reset();assert(run(`cultRouteLink('${a}','${b}',${dt})`),`Unreachable passage link ${a} -> ${b} at ${1/dt} FPS`);
 }
 reset();assert(run(`cultRouteLink('cultPassageFoundation','cult-passage-temple',${dt})`),'A missed platform must have a double-jump recovery from the room foundation');
}

// The old guardian's main arena and its relic remain connected to the launch
// ledge without crossing any new gate, before or after completing Japan.
for(const defeatedJapan of [false,true]){
 reset({defeatedJapan});
 assert(run("cultRouteLink('horn-vault','cult-passage-forecourt',1/120)"));
 assert(run("cultRouteLink('cult-passage-forecourt','horn-vault',1/120)"));
 assert.equal(run("gatePass(level.gates.find(g=>g.id==='cultWestWall'))"),false,'Japan victory must not unlock a dash-only wall');
}

// Keyboard-driven full dashes cross both ways. Walking, even after the Japan
// boss is dead, cannot enter; late materialization never leaves an overlap.
for(const dt of [1/30,1/60,1/120])for(const face of [-1,1]){
 for(const defeatedJapan of [false,true]){
  reset({dashAbility:false,defeatedJapan});
  run(`var cultWall=level.gates.find(g=>g.id==='cultWestWall');initPlayer({x:${face}>0?cultWall.x-31.5:cultWall.x+cultWall.w+31.5,y:2160});player.face=${face};`);
  press(face>0?'d':'a');press({action:'dash'});run(`for(let i=0;i<Math.ceil(.45/${dt});i++)update(${dt});`);release({action:'dash'});
  assert(run(face>0?'player.x+player.w<=cultWall.x':'player.x>=cultWall.x+cultWall.w'),'No-dash ability fixture crossed the wall');
 }
 reset();
 run(`var cultWall=level.gates.find(g=>g.id==='cultWestWall');initPlayer({x:${face}>0?cultWall.x-31.5:cultWall.x+cultWall.w+31.5,y:2160});player.face=${face};`);
 press(face>0?'d':'a');press({action:'dash'});run(`for(let i=0;i<Math.ceil(.25/${dt});i++)update(${dt});`);release({action:'dash'});
 assert(run(face>0?'player.x>=cultWall.x+cultWall.w':'player.x+player.w<=cultWall.x'),'Full input dash did not cross');
 assert.equal(run('dash'),0);
 assert(!run('overlap(player,cultWall)'));
 release('a');release('d');
 // A dash started farther out expires inside the wall; use actual input and
 // timer updates rather than forcing the final timer value in the test.
 reset();
 run(`var cultWall=level.gates.find(g=>g.id==='cultWestWall');initPlayer({x:${face}>0?cultWall.x-191.5:cultWall.x+cultWall.w+191.5,y:2160});player.face=${face};`);
 press(face>0?'d':'a');press({action:'dash'});run(`update(${dt});`);release({action:'dash'});let overlapped=run('overlap(player,cultWall)');
 for(let i=0;i<Math.ceil(.3/dt);i++){overlapped||=run('overlap(player,cultWall)');run(`update(${dt});`);}
 assert(overlapped,'Expiry fixture never entered wall');assert.equal(run('dash'),0);assert(!run('overlap(player,cultWall)'));
}

// The closed room shares touching roof/west/foundation segments. Outside
// movement cannot sneak into the new platforms around a short shadow veil.
reset();
const enclosure=run(`level.gates.filter(g=>['cultPassageRoof','cultPassageWest','cultPassageFoundation','cultWestWallUpper','cultWestWallLower'].includes(g.id)).map(g=>({id:g.id,x:g.x,y:g.y,w:g.w,h:g.h,solid:!gatePass(g)}))`);
assert.equal(enclosure.length,5);assert(enclosure.every(g=>g.solid));
const byId=Object.fromEntries(enclosure.map(g=>[g.id,g]));
assert.equal(byId.cultPassageRoof.x,byId.cultPassageWest.x);
assert.equal(byId.cultPassageRoof.x+byId.cultPassageRoof.w,authored.gate.x);
assert.equal(byId.cultWestWallUpper.y+byId.cultWestWallUpper.h,authored.gate.y);
assert.equal(byId.cultWestWallLower.y,authored.gate.y+authored.gate.h);
assert.equal(byId.cultWestWallLower.y+byId.cultWestWallLower.h,authored.height);
assert.equal(byId.cultPassageFoundation.y+byId.cultPassageFoundation.h,authored.height);
assert(byId.cultPassageWest.y+byId.cultPassageWest.h>=authored.height);
for(const [point,move,expect] of [
 [{x:1200,y:1650},'d','player.y+player.h<=1740'],
 [{x:740,y:2490},'d','player.x+player.w<=800'],
 [{x:2550,y:2700},'a','player.x>=2485']
]){
 reset();run(`initPlayer(${JSON.stringify(point)});player.onGround=false;player.inv=999;`);press(move);run('for(let i=0;i<70;i++)update(1/120);');release(move);
 assert(run(expect),'Enclosure bypass from '+JSON.stringify(point));
}
// Approaching underneath the foundation cannot jump into the sealed room.
reset();run('initPlayer({x:1200,y:3190});player.onGround=false;player.inv=999;');press(' ');
run('for(let i=0;i<20;i++)update(1/120);');release(' ');
assert(run('player.y>=3100'),'The foundation admits a jump from underneath');
// Render the full native image with one uniform scale and its documented foot anchor.
reset();
const art=run('ART_CULT_GATE'),png=fs.readFileSync(path.join(__dirname,'..',run('ART_MANIFEST.cultRuinedGate')));
assert.equal(png[25],6);assert.equal(png.readUInt32BE(16),art.w);assert.equal(png.readUInt32BE(20),art.h);
const calls=[],ctx=sandbox.document.getElementById('world').getContext('2d');
ctx.drawImage=(img,...args)=>{if(img._key==='cultRuinedGate')calls.push(args);};
run("Visuals.images.cultRuinedGate={complete:true,naturalWidth:1536,naturalHeight:1024,_key:'cultRuinedGate'};camera=800;cameraY=2100;");
const before=run('JSON.stringify([player,level.cultPassage,dash,time])');
run('Visuals.secretScenery(realms[0])');
assert.equal(calls.length,1);
const [x,y,w,h]=calls[0],gate=authored.passage.ruinedGate;
assert.equal(w/h,art.w/art.h,'Do not stretch the gate');
assert.equal(x+art.anchorX*w/art.w,gate.x);assert.equal(y+art.anchorY*h/art.h,gate.y);
assert(x>=900&&x+w<=1550,'Full gate silhouette must fit the temple floor');
assert.equal(run('JSON.stringify([player,level.cultPassage,dash,time])'),before,'Scenery must not mutate gameplay or clocks');
console.log('PASS: cult passage double-jump descent/return, full dash and expiry at 30/60/120 FPS, sealed enclosure, preserved progression, native alpha and proportionate grounded gate.');
