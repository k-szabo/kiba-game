'use strict';
const assert=require('node:assert/strict');
const harness=require('./test-harness.cjs');

function setup(fps=60,abilities=[false,false],won=false){
 const h=harness(),r=h.run;
 r(`Prologue.stop();abilities=${JSON.stringify(abilities)};defeated=[true,true,true,${won}];
 flags=[['forestBell','villageBell'],['soulUpper','soulLower'],['dawnSeal','shadowEntered'],[]];
 visitedRests=levels.map(map=>map.rests.map(rest=>rest.id));progression=freshProgression();
 enterRealm(3);state='play';boss.dead=true;enemies=enemies.filter(e=>e.id==='cultJailer');
 const routeDt=1/${fps};
 function routeStep(direction=0,jump=false,drop=false,dashInput=false){
  keys.clear();pressed.clear();
  if(direction)keys.add(direction>0?'d':'a');
  if(drop)keys.add('s');if(jump)pressed.add(' ');if(dashInput)pressed.add(Bindings.read('dash')[0]);
  update(routeDt);player.inv=999;
 }
 function routePlace(id,at=null){
  const p=platforms.find(p=>p.id===id);
  initPlayer({x:at??p.x+p.w/2,y:p.y});player.inv=999;
 }
 function routeLand(id){
  const target=platforms.find(p=>p.id===id),from=platforms.find(p=>p.id===player.support);
  if(!from)return false;
  const launch=clamp(target.x+target.w/2,from.x+25,from.x+from.w-25);
  for(let i=0;i<${fps}*12&&Math.abs(player.x+player.w/2-launch)>5;i++){
   routeStep(Math.sign(launch-player.x-player.w/2));
   if(!player.onGround||player.support!==from.id)return false;
  }
  const aim=clamp(player.x+player.w/2,target.x+25,target.x+target.w-25);
  for(let i=0;i<${fps}*4;i++){
   const delta=aim-player.x-player.w/2;
   routeStep(Math.abs(delta)>5?Math.sign(delta):0,i===0);
   if(player.onGround&&player.support===id)return true;
   if(player.y>target.y+450)return false;
  }
  return false;
 }
 function routeInsideHall(){
  const hall=platforms.find(p=>p.id==='prison-hall');
  const roof=level.gates.find(g=>g.id==='prisonRoof');
  return player.x>=hall.x&&player.x+player.w<=hall.x+hall.w&&player.y>=roof.y+roof.h-.1&&player.y+player.h<=hall.y+.1;
 }
 `);
 return h;
}

// The shaft is entered with the existing drop action, and can be left without
// either movement ability. These are complete runs, not disconnected spawn checks.
for(const fps of [30,60,120]){
 const h=setup(fps),r=h.run;
 r("routePlace('altar-descent');routeStep(0,true,true);");
 for(let i=0;i<fps*3&&!r('player.onGround');i++)r('routeStep();');
 assert.equal(r('player.support'),'prison-stair-1',`Visible shaft entry at ${fps} FPS`);
 r('routeStep(1,true,true);');
 for(let i=0;i<fps*5&&r("player.support!=='prison-court'");i++){
  r("routeStep(player.x+player.w/2<5845?1:0);");
 }
 assert.equal(r('player.support'),'prison-court',`The entry reaches the lower court at ${fps} FPS`);
 assert(!r("flags[3].includes('prisonOpen')"));
 for(let i=7;i>=1;i--)assert(r(`routeLand('prison-stair-${i}')`),`Single-jump return stair ${i} at ${fps} FPS`);
 assert(r("routeLand('temple-road')"),`Return to the main road at ${fps} FPS`);
 assert(r("routeLand('temple-approach')"));assert(r("routeLand('cathedral-step')"));assert(r("routeLand('cathedral')"));
 assert(!r("flags[3].includes('guardian:cultJailer')||flags[3].includes('prisonKey')||flags[3].includes('prisonOpen')"));
}

// A living optional jailer never aggroes on the upper path. Haru's scene and the
// cathedral remain available while every prison flag is absent.
for(const fps of [30,60,120])for(const abilities of [[false,false],[true,false],[false,true],[true,true]]){
 const h=setup(fps,abilities),r=h.run;
 r("routePlace('temple-road');");
 assert(r("routeLand('temple-approach')"));
 for(let i=0;i<fps*6&&r('Math.abs(player.x+player.w/2-level.prisonTrace.x)>5');i++)r('routeStep(Math.sign(level.prisonTrace.x-player.x-player.w/2));');
 assert(r('pointNear(level.prisonTrace)'),`Upper route reaches Haru at ${fps} FPS`);
 r('player.hp=1;pressed.add(\'e\');update(routeDt);pressed.clear();');
 assert.equal(r('state'),'dialog');assert.equal(r('player.hp'),3);
 assert(r("flags[3].includes('prisonTrace')"));assert(!r("flags[3].includes('prisonOpen')"));h.dismiss();
 assert(r("routeLand('cathedral-step')"));assert(r("routeLand('cathedral')"));
 assert(!r("enemies.find(e=>e.id==='cultJailer').active"));
 assert(!r("flags[3].includes('guardian:cultJailer')||flags[3].includes('prisonKey')"));
}

// Closed chamber boundaries must meet. In particular, one-way platform floors
// alone are insufficient: falling outside and jumping back up would bypass a lock.
{
 const h=setup(),r=h.run;
 assert(r(`(()=>{const hall=platforms.find(p=>p.id==='prison-hall'),door=level.gates.find(g=>g.kind==='prison'),roof=level.gates.find(g=>g.id==='prisonRoof'),east=level.gates.find(g=>g.id==='prisonEastWall'),foundation=level.gates.find(g=>g.id==='prisonFoundation');return roof&&east&&foundation&&roof.x<=door.x&&roof.x+roof.w>=east.x+east.w&&roof.y+roof.h>=door.y&&door.y+door.h>=foundation.y&&east.y<=roof.y+roof.h&&east.y+east.h>=foundation.y&&foundation.x<=door.x&&foundation.x+foundation.w>=east.x+east.w&&foundation.y<=hall.y&&foundation.y+foundation.h>=level.height+180;})()`),'The sealed hall has continuous roof, door, east wall and a foundation reaching below the fatal-fall boundary');
 assert(r("level.secrets.find(s=>s.id==='prisonCourt').public"),'The optional prison is public');
 assert(r("platforms.filter(p=>p.id.startsWith('prison-')).every(p=>!p.secretArea&&!p.unmapped)"),'Its route is not hidden from maps');
}

// Probe the closed room from all exposed directions, before and after priest
// victory, with double-jump and dash input. Entry is checked after every frame.
for(const fps of [30,60,120])for(const won of [false,true])for(const approach of ['west','roof','east','belowEast','belowWest']){
 const h=setup(fps,[true,true],won),r=h.run;
 const point={west:[7440,2200,1],roof:[8100,1600,0],east:[8900,1850,-1],belowEast:[8870,2350,-1],belowWest:[7440,2350,1]}[approach];
 r(`enemies=[];initPlayer({x:${point[0]},y:${point[1]}});player.onGround=${approach==='west'};player.inv=999;`);
 let entered=false;
 for(let i=0;i<fps*3;i++){
  r(`routeStep(${point[2]},${i===1||i===Math.round(fps*.38)},${approach==='roof'},${i===0||i===Math.round(fps*1.5)});`);
  entered||=r('routeInsideHall()');
 }
 assert(!entered,`${approach} bypassed the closed hall at ${fps} FPS; priest defeated=${won}`);
 assert(!r("gatePass(level.gates.find(g=>g.kind==='prison'))"));
 assert(r("level.gates.filter(g=>g.terrainBarrier).every(g=>!gatePass(g))"),'Permanent chamber edges survive priest victory');
}

// Unlock via the real interaction; then walk through and leave the lower room
// and branch using single jumps. The consumed key is not needed for the return.
for(const fps of [30,60,120]){
 const h=setup(fps),r=h.run;
 r("flags[3].push('guardian:cultJailer','prisonKey');initPlayer({x:level.prisonDoor.x-90,y:level.prisonDoor.y});player.inv=999;pressed.add('e');update(routeDt);pressed.clear();");
 assert(r("flags[3].includes('prisonOpen')&&!flags[3].includes('prisonKey')"));
 for(let i=0;i<fps*3&&r('player.x<7800');i++)r('routeStep(1);');
 assert(r('routeInsideHall()'),`Unlocked room entry at ${fps} FPS`);
 for(let i=0;i<fps*4&&r('player.x>7350');i++)r('routeStep(-1);');
 assert.equal(r('player.support'),'prison-court');
 for(let i=7;i>=1;i--)assert(r(`routeLand('prison-stair-${i}')`),`Unlocked branch return ${i} at ${fps} FPS`);
 assert(r("routeLand('temple-road')"));
}
console.log('PASS: optional public prison shaft and single-jump return, upper Haru/cathedral route without prison flags, inactive upper-route jailer, closed enclosure bypass resistance and unlocked hall return at30/60/120fps.');
