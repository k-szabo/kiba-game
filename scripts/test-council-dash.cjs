'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
function setup(destination,face){
 const h=harness(),r=h.run;
 r("DevTools.open();DevSession.begin();");
 assert.equal(r("DevAbilities.acquire({ability:'dash'})"),true);
 assert.equal(r("DevAbilities.acquire({ability:'double-jump'})"),true);
 r('DevTools.close();');
 if(destination==='councilHall')assert(r('fastTravel(COUNCIL_TRAVEL,1)'));
 else if(destination==='dream'){r('DevTools.open();');assert(r('DevTeleport.teleport({realm:"dream",rest:"dream"})'));r('DevTools.close();');}
 else assert(r('fastTravel(SIDE_LOCATIONS['+JSON.stringify(destination)+'].map.rests[0],3)'));
 r('player.face='+face+';player.inv=999;var trailCalls=[],renderOrder=[],originalTrail=Visuals.dashTrail,originalPlayer=drawPlayer;Visuals.dashTrail=(...args)=>{trailCalls.push(args);renderOrder.push("trail");originalTrail(...args);};drawPlayer=()=>{renderOrder.push("player");originalPlayer();};');
 return h;
}
const frames=(h,count,fps)=>h.run('for(let i=0;i<'+count+';i++)update('+1/fps+');');
for(const fps of [30,60,120])for(const face of [-1,1]){
 const h=setup('councilHall',face),r=h.run,label=fps+'fps/'+face;
 h.press({action:'dash'});frames(h,1,fps);h.release({action:'dash'});assert(r('dash>0'));assert(r('particles.some(p=>p.kind==="dashWisp")'));
 r('draw();');assert(r('trailCalls.length>0'),'Council hall paints actual dash wisps at '+label);assert(r('trailCalls.every(args=>args[2]==='+face+'&&args[3]>0&&args[3]<1)'));assert(r('renderOrder.indexOf("trail")<renderOrder.indexOf("player")'));
 const before=r('JSON.stringify([particles,player,dash,time])');r('pause();');frames(h,fps,fps);r('trailCalls=[];draw();');assert.equal(r('JSON.stringify([particles,player,dash,time])'),before);assert(r('trailCalls.length>0'),'Paused trail remains visible');
 r('pause();');frames(h,fps,fps);r('trailCalls=[];draw();');assert.equal(r('particles.some(p=>p.kind==="dashWisp")'),false);assert.equal(r('trailCalls.length'),0);
 r('reducedMotion.matches=true;dashCooldown=0;');h.press({action:'dash'});frames(h,1,fps);h.release({action:'dash'});r('trailCalls=[];draw();');assert(r('dash>0'));assert.equal(r('particles.some(p=>p.kind==="dashWisp")'),false);assert.equal(r('trailCalls.length'),0);
}
// Alternate fast-travel arrivals and the dream must keep real movement timers.
for(const destination of ['councilHall','shadowArena','fiaChambers','dream'])for(const fps of [30,60,120]){
 const h=setup(destination,1),r=h.run,step=count=>frames(h,count,fps);
 h.press({action:'jump'});step(1);h.release({action:'jump'});step(Math.ceil(.16*fps));h.press({action:'jump'});step(1);h.release({action:'jump'});assert.equal(r('player.jumps'),2,destination+' actual double jump');
 h.press({action:'dash'});step(1);h.release({action:'dash'});assert(r('dash>0'));step(Math.ceil(.3*fps));assert.equal(r('dash'),0,destination+' dash expires at '+fps+'fps');assert(r('player.vy>0'),destination+' gravity resumes');step(Math.ceil(.7*fps));assert(r('Math.abs(player.vx)<1050&&Math.abs(player.vy)<2000'));r('dashCooldown=0;');h.press({action:'dash'});step(1);h.release({action:'dash'});assert(r('dash>0'),destination+' dash can be reused');
}
console.log('PASS: actual council dash input reaches painted wisps behind Momo; fading/expiry/pause/reduced motion, and real double-jump/dash/gravity after council/arena/chambers/dream arrival at30/60/120FPS.');
