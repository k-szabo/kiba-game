'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sandbox={};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('assets/js/haru-follower.js','utf8')+'\n'+fs.readFileSync('assets/js/ziggurat-descent-maps.js','utf8')+';globalThis.factory=createZigguratDescentMaps;globalThis.Follower=HaruFollower;',sandbox);
const helpers={
 makeLevel:(id,width,height,start)=>({id,width,height,start,platforms:[],rests:[],enemies:[],zones:[]}),
 ledge:(m,id,x,y,w,kind='stone',h=28)=>m.platforms.push({id,x,y,w,kind,h,drop:kind!=='ground'}),
 rest:(m,id,x,y,name)=>m.rests.push({id,x,y,name}),
 foe:(m,id,x,y,kind,group,patrol)=>m.enemies.push({id,x,y,kind,group,patrol}),
 zone:(m,name,x,y,w,h)=>m.zones.push({name,x,y,w,h})
};
const {zigguratDepths:depths,japanHeights:heights}=sandbox.factory(helpers);
const grounded=(m,p)=>m.platforms.some(f=>p.x>=f.x&&p.x<=f.x+f.w&&p.y===f.y);
for(const map of [depths,heights]){
 assert(grounded(map,map.start),'Spawn is on a registered floor');
 for(const point of map.rests)assert(grounded(map,point),'Rest '+point.id+' has solid support');
 assert.equal(new Set(map.platforms.map(p=>p.id)).size,map.platforms.length,'Platform IDs are unique');
 for(const p of map.platforms)assert(p.x>=0&&p.x+p.w<=map.width&&p.y>=0&&p.y<map.height,'Platform stays in map bounds: '+p.id);
 for(const enemy of map.enemies)assert(grounded(map,enemy),'Enemy '+enemy.id+' is grounded');
}
assert.equal(depths.enemyRealm,3);assert.equal(heights.enemyRealm,0);assert.equal(heights.enemies.length,0);
assert(depths.arena.x>depths.rests[1].x,'Pre-boss rest is outside the fight');
assert(depths.portalPoint.x>depths.arena.triggerX,'Portal lies beyond the boss trigger');
assert.equal(depths.returnDestination.location,'zigguratInterior');assert.equal(depths.portalDestination.location,'japanHeights');assert.equal(heights.returnDestination.location,'zigguratDepths');
assert.equal(depths.enemies.filter(e=>e.miniboss==='voidGatekeeper').length,1);
assert.deepEqual(Array.from(new Set(depths.enemies.filter(e=>e.voidKeeperRole).map(e=>e.voidKeeperRole))).sort(),['blade','bow','mage']);
function travel(map,from,to,fps){
 const follower=sandbox.Follower.create();follower.reset({x:from.x,y:from.y-70},map.platforms);
 const target={x:to.x,y:to.y-70,w:42,h:70,onGround:true};let state;
 for(let frame=0;frame<fps*100;frame++){
  state=follower.update(1/fps,target,map.platforms);
  assert(Number.isFinite(state.x)&&Number.isFinite(state.y)&&state.y<map.height,'Follower stays safe inside '+map.id);
  if(state.onGround&&Math.abs(state.y+70-to.y)<1&&Math.abs(state.x-to.x)<100)return state;
 }
 assert.fail('Follower cannot reach '+JSON.stringify(to)+' from '+JSON.stringify(from)+' at '+fps+' FPS; '+JSON.stringify(state));
}
for(const fps of [30,60,120]){
 travel(depths,depths.start,depths.portalPoint,fps);
 travel(depths,depths.portalPoint,depths.start,fps);
 travel(heights,heights.start,heights.haruPoint,fps);
 travel(heights,heights.haruPoint,heights.returnPoint,fps);
}
// Exercise the actual Momo input/physics route, with both optional movement
// abilities disabled. Climbing back out must not rely only on NPC navigation.
const harness=require('./test-harness.cjs');
for(const fps of [30,60,120]){
 const h=harness(),r=h.run;
 r("Prologue.stop();flags=levels.map(()=>[]);flags[3].push('hannahDefeated','guardian:Hannah','dawnblade','zigguratDescentAccepted','zigguratGateCleared','guardian:VoidGatekeeper');defeated=[true,true,true,true];abilities=[false,false];state='play';CampQuest.enter('zigguratDepths');enemies=[];initPlayer({x:3380,y:2920});player.inv=999;");
 const climb=[...depths.platforms.filter(p=>p.id.startsWith('descent-stair-')).reverse(),depths.platforms[0]];
 let from=depths.platforms.find(p=>p.id==='descent-arena-floor');
 for(const to of climb){
  const left=Math.max(from.x+40,to.x+40),right=Math.min(from.x+from.w-40,to.x+to.w-40);assert(left<right,'Adjacent steps have a standing overlap');
  const target=(left+right)/2;let direction;
  for(let n=0;n<fps*12;n++){
   const x=r('player.x+player.w/2'),delta=target-x;if(Math.abs(delta)<5)break;
   const action=delta>0?'moveRight':'moveLeft';if(direction!==action){if(direction)h.release({action:direction});h.press({action});direction=action;}
   r('update('+1/fps+')');
  }
  if(direction)h.release({action:direction});
  assert.equal(r('player.onGround'),true,'Momo remains on each step before jumping');
  h.press({action:'jump'});r('update('+1/fps+')');h.release({action:'jump'});
  for(let n=0;n<fps*2&&r('player.support')!==to.id;n++)r('update('+1/fps+')');
  assert.equal(r('player.support'),to.id,'Momo returns onto '+to.id+' using one jump at '+fps+' FPS');
  from=to;
 }
}
console.log('PASS: Descent/Japan map bounds, grounded spawns/rests/enemies, encounter/portal metadata and Haru traversal both ways at 30/60/120 FPS.');
