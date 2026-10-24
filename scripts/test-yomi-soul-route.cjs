const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const h=harness(),run=h.run;
run(`
function soulRouteReset(dt,doubleJump=true,spiritDash=false){
 Prologue.stop();abilities=[doubleJump,spiritDash];defeated=levels.map(()=>false);
 flags=levels.map(()=>[]);visitedRests=levels.map(()=>[]);enterRealm(1);state='play';enemies=[];
 keys.clear();pressed.clear();player.inv=999;
}
function soulRoutePlace(x,feet){initPlayer({x,y:feet});player.inv=999;keys.clear();pressed.clear();}
function soulRouteFrames(seconds,dt,actions){
 let entered=false;
 for(let i=0;i<Math.ceil(seconds/dt);i++){
  if(actions)actions(i,i*dt);
  update(dt);
  const x=player.x+player.w/2,feet=player.y+player.h;
  if(x>1975&&feet>3780&&feet<4140)entered=true;
 }
 return entered;
}
function soulRouteDropFromAbove(dt){
 soulRouteReset(dt);soulRoutePlace(2440,3400);
 return soulRouteFrames(2.4,dt,(i)=>{keys.add('s');if(player.onGround&&player.support==='east-river')pressed.add(' ');});
}
`);

// Negative control: the reported platform-above route must actually enter the
// old open chamber with the same input/physics used against the fixed layout.
run(`var closedSoulGates=yomi.gates; yomi.gates=yomi.gates.filter(g=>!['lowerSoulRoof','lowerSoulFloor'].includes(g.id));`);
assert(run('soulRouteDropFromAbove(1/60)'),'Negative control did not reproduce the original drop-in bypass');
run('yomi.gates=closedSoulGates;');

for(const fps of [30,60,120]){
 const dt=1/fps;
 assert(!run(`soulRouteDropFromAbove(${dt})`),`Dropping from east-river bypasses the veil at ${fps} FPS`);
 assert.equal(run('player.support'),'gate:lowerSoulRoof','The solid painted roof must catch the drop');
 assert.equal(run('flags[1].includes("soulLower")'),false);

 // Descend on the far side after crossing above the old strip's top. Both
 // ordinary and double jumps remain unable to enter the protected chamber.
 for(const twice of [false,true]){
  run(`soulRouteReset(${dt},${twice});soulRoutePlace(1830,2700);`);
  const crossed=run(`soulRouteFrames(4,${dt},(i,t)=>{
   keys.delete('a');keys.delete('d');const delta=2440-(player.x+player.w/2);
   if(Math.abs(delta)>9)keys.add(delta>0?'d':'a');
   if(i===0||${twice}&&t>=.4&&t<.4+${dt})pressed.add(' ');
   if(t>1.2){keys.add('s');if(player.onGround)pressed.add(' ');}
  })`);
  assert(!crossed,`Jumping over the old veil top bypasses the chamber (${fps} FPS, double=${twice})`);
 }

 // Frontal jumps and the old underpass are blocked without Spirit Dash.
 for(const from of [{x:1860,y:3900},{x:1580,y:4230}]){
  run(`soulRouteReset(${dt});soulRoutePlace(${from.x},${from.y});`);
  assert(!run(`soulRouteFrames(2,${dt},(i,t)=>{keys.add('d');if(i===0||t>=.4&&t<.4+${dt})pressed.add(' ');})`),
   `Frontal/under-floor bypass from ${from.y} at ${fps} FPS`);
 }

 // The intended path is a horizontal dash, not an invisible interaction gate.
 // It works with and without double jump and can be reversed immediately once
 // the dash cooldown recovers. Real input advances the shared dash clocks.
 for(const twice of [false,true]){
  run(`soulRouteReset(${dt},${twice},true);soulRoutePlace(1860,3900);player.face=1;pressed.add(Bindings.read('dash')[0]);`);
  assert(run(`soulRouteFrames(.9,${dt})`),`Spirit Dash cannot enter at ${fps} FPS`);
  assert.equal(run('player.support'),'cage-right');
  assert.equal(run('dash'),0,'Dash never expired in the chamber');
  run(`soulRoutePlace(2075,3900);player.face=-1;pressed.add(Bindings.read('dash')[0]);`);
  run(`soulRouteFrames(.9,${dt});`);
  assert.equal(run('player.support'),'veil-approach',`No safe dash return at ${fps} FPS`);
  assert(run('player.x+player.w<=1920'),'Return ended inside the veil');
  assert(run('abilities[1]&&!flags[1].includes("soulLower")'),'Traversal changed permanent progression');
 }

 // Double jump is independently skippable. A Spirit-Dash-only player who
 // drops inside the chamber may leave through the western veil at floor
 // height and land on the existing lower descent instead of climbing back.
 run(`soulRouteReset(${dt},false,true);soulRoutePlace(2500,3900);keys.add('s');pressed.add(' ');`);
 run(`soulRouteFrames(1,${dt});keys.clear();var floorExitDashed=false;`);
 assert.equal(run('player.support'),'gate:lowerSoulFloor');
 run(`soulRouteFrames(4,${dt},()=>{
  const x=player.x+player.w/2;keys.delete('s');keys.delete('a');
  if(x>1550)keys.add('a');
  if(!floorExitDashed&&x<2080){pressed.add(Bindings.read('dash')[0]);floorExitDashed=true;}
 });`);
 assert(run('floorExitDashed&&!abilities[0]&&abilities[1]'),'Floor exit must use only Spirit Dash');
 assert(run("player.onGround&&['west-tomb','deep-center'].includes(player.support)"),
  `Spirit-Dash-only player is stranded after a chamber fall at ${fps} FPS`);
 assert.equal(run('dash'),0);

 // Stepping off the western ledge still reaches the ordinary lower descent;
 // falling off the captive ledge inside the room has a solid recovery floor.
 run(`soulRouteReset(${dt},true,true);soulRoutePlace(1625,3900);keys.add('a');`);
 run(`soulRouteFrames(.5,${dt});keys.clear();soulRouteFrames(.8,${dt});`);
 assert.equal(run('player.support'),'west-tomb',`Western descent disconnected at ${fps} FPS`);
 run(`soulRouteReset(${dt},true,true);soulRoutePlace(2500,3900);keys.add('s');pressed.add(' ');`);
 run(`soulRouteFrames(1,${dt});`);
 assert.equal(run('player.support'),'gate:lowerSoulFloor');
 run(`keys.clear();pressed.add(' ');soulRouteFrames(.35,${dt});pressed.add(' ');soulRouteFrames(1,${dt});`);
 assert.equal(run('player.support'),'cage-right',`No return from room floor at ${fps} FPS`);
}

// Boss victory must not silently remove the ability requirement. Souls still
// own the abyss oath, and death/shrine reset may not undo a freed captive.
run(`soulRouteReset(1/60,true,true);defeated[1]=true;dash=0;`);
assert(!run('gatePass(yomi.gates.find(g=>g.id==="shadowVeil"))'));
run('defeated[1]=false;flags[1]=["soulUpper"];');
assert(!run('gatePass(yomi.gates.find(g=>g.id==="abyssOath"))'));
run('soulRoutePlace(2440,3900);interact();');h.dismiss();
assert(run('flags[1].includes("soulLower")'),'The soul interaction no longer works inside the chamber');
assert(run('gatePass(yomi.gates.find(g=>g.id==="abyssOath"))'));
run('revive();');h.dismiss();
assert(run('flags[1].includes("soulLower")'),'Death lost the captive reward');
run('interact();');h.dismiss();
assert(run('flags[1].includes("soulLower")'),'Shrine rest lost the captive reward');
console.log('PASS: original drop-in negative control, jump-over/drop/under-floor prevention, real two-way dash and timers, safe western descent, room-floor double-jump recovery and Spirit-Dash-only exit at 30/60/120 FPS, persistent rescue and abyss gating.');
