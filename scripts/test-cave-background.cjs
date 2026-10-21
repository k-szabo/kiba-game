const assert=require('node:assert/strict');
const harness=require('./test-harness.cjs');

// Exercise the real input/gravity/landing path at the upper cave stair. The
// former rectangle ended at feet=1620, below the second jump's apex (~1607).
for(const fps of [30,60,120])for(const width of [384,1280,2560]){
 const {run,press,release,sandbox}=harness();
 const dt=1/fps;
 run(`abilities=[true,true];enterRealm(0);state='play';enemies=[];keys.clear();pressed.clear();viewW=${width};initPlayer({x:4005,y:1850});player.inv=999;`);
 const geometry=run('JSON.stringify([level.secrets,level.platforms,level.gates])');
 const ctx=sandbox.document.getElementById('world').getContext('2d'),calls=[];
 ctx.drawImage=(img,...args)=>calls.push({key:img._key,alpha:ctx.globalAlpha,args});
 run("Visuals.images.cultCaveBackdrop={complete:true,naturalWidth:1536,naturalHeight:1024,_key:'cultCaveBackdrop'};");
 const step=()=>run(`update(${dt})`);
 press(' ');step();release(' ');
 let second=false,minFeet=Infinity,airFrames=0;
 for(let i=0;i<Math.ceil(1.7/dt);i++){
  if(!second&&run('player.vy>-40&&!player.onGround')){press(' ');second=true;step();release(' ');}else step();
  const feet=run('player.y+player.h');minFeet=Math.min(minFeet,feet);
  if(!run('player.onGround'))airFrames++;
  assert.equal(run('Visuals.secretBackdropState()?.area.id'),'cultCave',`Cave lost at ${fps} FPS, width ${width}, feet ${feet}`);
  assert.equal(run('Visuals.secretBackdropState()?.alpha'),1,'Jump must not blend the forest into the cave');
  calls.length=0;run('Visuals.backdrop(realms[0])');
  const cave=calls.find(c=>c.key==='cultCaveBackdrop');assert(cave,'Cave image was not rendered');assert.equal(cave.alpha,1);
 }
 assert(second&&airFrames>0&&minFeet<1695,'Fixture must enter the original forest blend band');
 if(fps===120)assert(minFeet<1620,'Fine-step fixture must cross the original missing-backdrop boundary');
 assert(run('player.onGround'),`Jump did not return to the stair at ${fps} FPS`);
 assert.equal(run('JSON.stringify([level.secrets,level.platforms,level.gates])'),geometry,'Backdrop selection changed traversal/discovery');

 // Camera/viewport changes cannot toggle a location's backdrop. The cave
 // remains stable during a paused airborne frame and exits remain spatial.
 run('player.y=1538;player.onGround=false;');
 const paused=run('JSON.stringify([player,Visuals.secretBackdropState()])');
 run('pause()');for(let i=0;i<10;i++)step();
 assert.equal(run('JSON.stringify([player,Visuals.secretBackdropState()])'),paused,'Pause changed the cave state');
 run("state='play';camera=0;cameraY=0;");assert.equal(run('Visuals.secretBackdropState()?.alpha'),1);
 run('camera=9000;cameraY=2380;');assert.equal(run('Visuals.secretBackdropState()?.alpha'),1);
 run('initPlayer({x:4005,y:1000})');assert.equal(run('Visuals.secretBackdropState()'),null,'Main road inherited the cave');
 run('initPlayer({x:4500,y:1680})');assert.equal(run('Visuals.secretBackdropState()'),null,'Leaving through the cave mouth retained the cave');
 run('initPlayer({x:700,y:2400})');assert.equal(run('Visuals.secretBackdropState()'),null,'Leaving the western cave bounds retained the cave');
 run("initPlayer({x:4005,y:1850});state='menu';");assert.equal(run('Visuals.secretBackdropState()'),null,'Menu inherited the cave');
}

// Existing angel coverage and its normal exit are intentionally unchanged.
const {run}=harness();
run("state='play';initPlayer({x:2760,y:-1100});");
assert.equal(run('Visuals.secretBackdropState()?.area.id'),'angelRuin');
assert.equal(run('Visuals.secretBackdropState()?.alpha'),1);
run('initPlayer({x:2760,y:1000});');assert.equal(run('Visuals.secretBackdropState()'),null);
console.log('PASS: actual cave double jumps keep the painted backdrop opaque at 30/60/120 FPS and narrow/desktop/wide views; pause, spatial exits, village/menu and angel bounds remain correct without geometry changes.');
