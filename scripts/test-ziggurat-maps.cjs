'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const ids=['zigguratApproach','zigguratInterior','zigguratSummit'];

function setup(fps=60){
 const h=harness(),r=h.run;
 r("Prologue.stop();abilities=[false,false];defeated=[true,true,true,true];flags=[['forestBell','villageBell'],['soulUpper','soulLower'],['dawnSeal','shadowEntered'],[]];visitedRests=levels.map(map=>[map.rests[0].id]);progression=freshProgression();enterRealm(3);state='play';");
 const frame=()=>r(`update(${1/fps});player.inv=999;`);
 const feet=()=>r('player.y+player.h');
 const center=()=>r('player.x+player.w/2');
 const settle=()=>{for(let i=0;i<Math.ceil(fps*.4);i++)frame();};
 function walkTo(x){
  const action=x>center()?'moveRight':'moveLeft',direction=x>center()?1:-1;
  h.press({action});
  for(let i=0;i<fps*24&&direction*(x-center())>5;i++)frame();
  h.release({action});settle();
  assert(Math.abs(center()-x)<42,`Walk reaches ${x} at ${fps} FPS; got ${center()}`);
 }
 function landAt(y,{drop=false,direction=0,steerTime=.4}={}){
  if(drop)h.press({action:'drop'});
  if(direction)h.press({action:direction>0?'moveRight':'moveLeft'});
  h.press({action:'jump'});frame();h.release({action:'jump'});
  if(drop)h.release({action:'drop'});
  let landed=false;
  for(let i=0;i<fps*4;i++){
   if(direction&&i===Math.round(fps*steerTime))h.release({action:direction>0?'moveRight':'moveLeft'});
   frame();
   assert(r('player.jumps<=1'),'Route never uses a second jump');
   if(r('player.onGround')&&Math.abs(feet()-y)<1){landed=true;break;}
   if(feet()>y+400)break;
  }
  if(direction)h.release({action:direction>0?'moveRight':'moveLeft'});
  settle();
  assert(landed,`${drop?'Drop':'Single jump'} reaches y=${y} at ${fps} FPS; got ${feet()}`);
 }
 function waitForFloor(y){
  for(let i=0;i<fps*5&&(!r('player.onGround')||Math.abs(feet()-y)>1);i++)frame();
  assert(r('player.onGround')&&Math.abs(feet()-y)<1,`Return lands at y=${y} at ${fps} FPS`);
 }
 return {...h,frame,feet,center,walkTo,landAt,waitForFloor};
}

// All three registered sides share the existing fourth-guardian gate. Neither
// a prison rescue nor either optional movement shrine is a new prerequisite.
{
 const h=setup(),r=h.run;
 for(const id of ids){
  assert(r(`Object.hasOwn(SIDE_LOCATIONS,${JSON.stringify(id)})`),id+' is registered');
  assert.equal(r(`SIDE_LOCATIONS[${JSON.stringify(id)}].realm`),3);
  assert.equal(r(`SIDE_LOCATIONS[${JSON.stringify(id)}].map.enemyRealm`),3);
  r('defeated[3]=false;');
  assert(!r(`sideLocationUnlocked(${JSON.stringify(id)},flags,defeated)`),id+' requires the Mad Priest');
  assert(!r(`CampQuest.enter(${JSON.stringify(id)})`),id+' rejects premature normal entry');
  r('defeated[3]=true;flags[3]=[];');
  assert(r(`sideLocationUnlocked(${JSON.stringify(id)},flags,defeated)`),id+' has no rescue/altar prerequisite');
  assert(r(`CampQuest.enter(${JSON.stringify(id)})`),id+' can be entered with no prison/Fia flags');
  assert(r('CampQuest.isSide()'));assert.equal(r('CampQuest.locationId()'),id);
  assert.doesNotThrow(()=>r('nextObjective();getContext();'),'Side objectives and prompts are valid');
  r("flags[3]=['guardian:cultJailer','prisonOpen','guardian:prisonHunter','fiaSeen','fiaMissed'];");
  assert(r(`sideLocationUnlocked(${JSON.stringify(id)},flags,defeated)`),id+' remains accessible after missing Fia');
  assert(r(`CampQuest.enter(${JSON.stringify(id)})`));
 }
 const allRestIds=r('realmRests(3).map(rest=>rest.id)');
 assert.equal(new Set(allRestIds).size,allRestIds.length,'All realm-three rest IDs stay unique');
 for(const id of ids){
  const rests=r(`SIDE_LOCATIONS[${JSON.stringify(id)}].map.rests.map(rest=>({id:rest.id,x:rest.x,y:rest.y}))`);
  assert(rests.length>0);
  for(const rest of rests){
   assert(allRestIds.includes(rest.id),rest.id+' is in the shared save/travel catalog');
   assert(r(`SIDE_LOCATIONS[${JSON.stringify(id)}].map.platforms.some(p=>!p.broken&&p.y===${rest.y}&&${rest.x}>p.x&&${rest.x}<p.x+p.w)`),rest.id+' has a real landing');
  }
 }
}

// Exercise the actual developer picker executor, and prove that visiting each
// arrival does not grant normal progression or write into the normal save.
{
 const h=setup(),r=h.run;
 const normal=r('JSON.stringify(saved)'),writes=r('window.__saveSnapshots.length');
 r('DevTools.open();DevSession.begin();');
 const before=r('JSON.stringify([abilities,defeated,flags])');
 for(const id of ids)for(const rest of r(`SIDE_LOCATIONS[${JSON.stringify(id)}].map.rests.map(rest=>rest.id)`)){
  assert(r(`DevTeleport.teleport({realm:${JSON.stringify(id)},rest:${JSON.stringify(rest)}})`),rest+' is a working dev arrival');
  assert.equal(r('level.id'),id);assert.equal(r('checkpoint.id'),rest);assert(r('player.onGround'));
 }
 assert.equal(r('JSON.stringify([abilities,defeated,flags])'),before,'Dev teleport grants no unlock flags or abilities');
 r('DevSession.end();');
 assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('window.__saveSnapshots.length'),writes);
}

// Each route is continuous from its authored spawn. Enemies are removed only
// to isolate traversal; input, movement timers, gravity and landing stay real.
for(const fps of [30,60,120]){
 const h=setup(fps),r=h.run;
 assert(r("CampQuest.enter('zigguratApproach',{save:false})"));r('enemies=[];player.inv=999;');
 h.walkTo(1490);h.landAt(910,{direction:1});h.walkTo(3120);h.landAt(910,{direction:1});h.walkTo(4920);
 assert(r('pointNear(level.nextPoint,100,85)'),`Approach exit reached at ${fps} FPS`);

 assert(r("CampQuest.enter('zigguratInterior',{save:false})"));r('enemies=[];player.inv=999;');
 h.walkTo(1090);
 for(let i=0;i<14;i++)h.landAt(1610-i*90);
 h.walkTo(1500);assert(r('pointNear(level.nextPoint,100,85)'),`Summit entrance reached by fourteen single jumps at ${fps} FPS`);

 // Walk off the west edge of the high gallery to return to the entrance,
 // then deliberately take the optional lower branch east of its floor.
 h.walkTo(650);h.waitForFloor(1700);h.walkTo(1945);h.waitForFloor(1790);
 for(let i=1;i<7;i++)h.landAt(1790+i*90,{drop:true});
 h.landAt(2420,{drop:true});
 for(let i=6;i>=0;i--)h.landAt(1790+i*90);
 h.walkTo(1695);h.landAt(1700,{direction:-1});h.walkTo(120);
 assert(r('pointNear(level.returnPoint,100,85)'),`Optional depths return reaches the entrance at ${fps} FPS`);
 assert.equal(r('JSON.stringify(abilities)'),'[false,false]');
 assert(!r("flags[3].some(id=>/prison|fia|zen/i.test(id))"),'Traversal needs no prison or Fia progress');
}
console.log('PASS: ziggurat guardian-only unlock, Fia-missed independence, registered/dev rests and save isolation, actual-input approach, fourteen-step single-jump climb and optional depths return at 30/60/120 FPS.');
