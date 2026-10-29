'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');

for(const fps of [30,60,120])for(const weapon of ['katana','naginata','swordShield']){
 const h=harness(),r=h.run,dt=1/fps;
 const reset=floor=>r(`Prologue.stop();flags=levels.map(()=>[]);flags[3].push('dawnblade');defeated=levels.map(()=>false);abilities=[true,true];weaponStyle=${JSON.stringify(weapon)};enterRealm(0);state='play';enemies=[];keys.clear();pressed.clear();initPlayer({x:4550,y:${floor}});player.face=-1;player.inv=999;Dawnblade.awaken();`);
 const attack=action=>{h.press({action});r(`update(${dt})`);h.release({action});r(`for(let i=0;i<Math.ceil(1.5/${dt});i++)update(${dt});`);};
 for(const action of ['attack','heavyAttack','ultimate']){
  reset(1000);attack(action);
  assert(!r("flags[0].includes('cultEntrance')"),`${weapon} ${action} from the road broke the lower wall at${fps}FPS`);
  assert(r("player.support==='road2'"),'Road attack fixture stays on the actual main platform');
  reset(1510);attack(action);
  assert(r("flags[0].includes('cultEntrance')"),`${weapon} ${action} from the cave mouth failed at${fps}FPS`);
 }
}

for(const fps of [30,60,120]){
 const h=harness(),r=h.run,dt=1/fps;
 r("Prologue.stop();flags=levels.map(()=>[]);defeated=levels.map(()=>false);abilities=[true,true];enterRealm(0);state='play';enemies=[];globalThis.wall=level.gates.find(g=>g.id==='cultEntrance');globalThis.cap=level.gates.find(g=>g.id==='cultEntranceUpper');");
 assert.equal(r('wall.x'),r('cap.x'));assert.equal(r('wall.w'),r('cap.w'));
 assert.equal(r('cap.y+cap.h'),r('wall.y'),'The upper cap and fragile section must touch');
 assert.equal(r('wall.y+wall.h'),r('level.height'),'The closed wall extends to the fatal-fall limit');
 // Physical double-jump + full dash into the upper edge must not bypass the
 // sealed entrance. No position is changed between takeoff and landing.
 r('initPlayer({x:4550,y:1510});player.inv=999');
 h.press({action:'moveLeft'});h.press({action:'jump'});r(`update(${dt})`);h.release({action:'jump'});
 let second=false,dashed=false;
 for(let frame=0;frame<Math.ceil(2.3/dt);frame++){
  if(!second&&frame>Math.ceil(.2/dt)&&r('player.vy>-10')){h.press({action:'jump'});second=true;}
  if(second&&!dashed&&r('player.vy>-10')){h.press({action:'dash'});dashed=true;}
  r(`update(${dt})`);h.release({action:'jump'});h.release({action:'dash'});
  assert(r('player.x>=wall.x+wall.w'),`Jump/dash bypassed the sealed entrance at${fps}FPS`);
 }
 h.release({action:'moveLeft'});assert(second&&dashed,'Bypass fixture exercised both abilities');
 // Open through the real lower-facing attack, then walk both ways through
 // that same opening; a broken entrance remains open after death/respawn.
 r('initPlayer({x:4550,y:1510});player.face=-1');h.press({action:'attack'});r(`for(let i=0;i<Math.ceil(.6/${dt});i++)update(${dt});`);h.release({action:'attack'});
 assert(r("flags[0].includes('cultEntrance')"));
 r('initPlayer({x:4550,y:1510})');h.press({action:'moveLeft'});r(`for(let i=0;i<Math.ceil(.5/${dt});i++)update(${dt});`);h.release({action:'moveLeft'});assert(r('player.x+player.w<wall.x'),'Broken entrance permits lower approach entry');
 h.press({action:'moveRight'});r(`for(let i=0;i<Math.ceil(.8/${dt});i++)update(${dt});`);h.release({action:'moveRight'});assert(r('player.x>wall.x+wall.w'),'The same opening permits the return trip');
 r('revive()');assert(r("flags[0].includes('cultEntrance')"),'Death preserves the existing entrance flag');
}
console.log('PASS: road attacks cannot break the lowered cultist wall; all three loadouts and Dawnblade work from the lower approach, with sealed jump/dash edges and entry/return at30/60/120FPS.');
