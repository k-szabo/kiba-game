'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),harness=require('./test-harness.cjs');
// Supplies are grounded on the authored main road, spread across Japan rather
// than stacked at one checkpoint or locked behind an optional encounter.
for(const fps of [30,60,120]){
 const h=harness(),r=h.run;
 r("defeated[0]=true;flags[0]=['forestBell','villageBell','campQuestAccepted','mayorExecuted','guardian:campMaster','herbalistRescued','herbalistQuestAccepted'];abilities=[false,false];enterRealm(0);enemies=[];boss.dead=true;state='play';");
 const patches=JSON.parse(r('JSON.stringify(CampHerbs.patches)'));
 assert(patches.length>=6,'A full brewing dose is available without resetting the same patch');assert.equal(new Set(patches.map(p=>p.id)).size,patches.length);
 const roadIds=new Set();
 for(const patch of patches){
  const surface=JSON.parse(r(`JSON.stringify(platforms.find(p=>p.kind==='ground'&&Math.abs(p.y-${patch.y})<1&&p.x+45<${patch.x}&&p.x+p.w-45>${patch.x}))`));
  assert(surface,patch.id+': feet must be on a roomy main-road surface');roadIds.add(surface.id);
  // Start a short walk away on the same authored surface. Actual keyboard
  // movement and collision must leave Momo close enough to collect with E.
  r(`initPlayer({x:${patch.x-100},y:${patch.y}});player.inv=999;`);
  h.press('d');for(let i=0;i<fps*2&&r(`Math.abs(player.x+player.w/2-${patch.x})>8`);i++)r(`update(${1/fps});player.inv=999;`);h.release('d');
  assert.equal(r('player.onGround'),true,patch.id+': actual walk remains grounded');assert.equal(r('CampHerbs.context()?.herb.id'),patch.id);
  h.press('e');r(`update(${1/fps});`);h.release('e');assert.equal(r('CampHerbs.context()'),null,patch.id+': harvested patch cannot be collected twice');
 }
 assert(roadIds.size>=6,'All six main-road regions have supplies');assert.equal(r('campServices.herbs'),patches.length);assert.equal(r('saved.campServices.herbs'),patches.length);
 r('initPlayer(level.rests[0]);interact();initPlayer(CampHerbs.patches[0]);');assert.equal(r('CampHerbs.context().type'),'campHerb','Shrine rest regrows all patches');
 r('interact();player.y=level.height+200;movePlayer(1/120);initPlayer(CampHerbs.patches[0]);');assert.equal(r('CampHerbs.context().type'),'campHerb','Death regrows patches without losing gathered stock');assert.equal(r('campServices.herbs'),patches.length+1);
 r("state='pause';");assert(!r('CampHerbs.interact(CampHerbs.context())'),'An overlay cannot collect supplies');
 r("state='play';flags[0]=flags[0].filter(f=>f!=='herbalistQuestAccepted');");assert.equal(r('CampHerbs.context()'),null,'The supplies retain their existing herbalist quest condition');
}
const source=fs.readFileSync(require('node:path').join(__dirname,'../assets/js/game.js'),'utf8'),draw=source.slice(source.indexOf('function draw(){'),source.indexOf('function visiblePoint'));
assert(draw.indexOf('CampHerbs.draw()')>draw.indexOf('drawLandscape(r,platforms)'),'Terrain must be drawn before the collectible herb silhouettes');
console.log('PASS: unique herbs spread over six main-road regions, actual keyboard walking/picking without movement abilities at30/60/120FPS, once-per-patch collection, shrine/death regrowth, quest/pause guards and foreground render order.');
