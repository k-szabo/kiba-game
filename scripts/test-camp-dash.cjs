const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
function fixture(scene,face){
 const h=harness(),r=h.run;
 r('DevTools.open();DevSession.begin()');
 assert.equal(r("DevAbilities.acquire({ability:'dash'})"),true);
 assert.equal(r(`DevTeleport.teleport(${JSON.stringify(scene==='forestCamp'?{realm:'forestCamp',rest:'forestCamp'}:{realm:'0',rest:'start'})})`),true);
 r(`DevTools.close();player.face=${face};var trailCalls=[],renderOrder=[],originalTrail=Visuals.dashTrail,originalPlayer=drawPlayer;Visuals.dashTrail=(...args)=>{trailCalls.push(args);renderOrder.push('trail');originalTrail(...args);};drawPlayer=()=>{renderOrder.push('player');originalPlayer();};`);
 return h;
}
const frames=(h,count,fps)=>h.run(`for(let frame=0;frame<${count};frame++)update(${1/fps});`);
for(const scene of ['forestCamp','japan'])for(const fps of [30,60,120])for(const face of [-1,1]){
 const h=fixture(scene,face),r=h.run,label=`${scene}/${fps}fps/face${face}`;
 h.press('k');frames(h,1,fps);h.release('k');
 assert(r('dash>0'),label+' actual bound input starts the granted dash');
 assert(r("particles.some(p=>p.kind==='dashWisp')"),label+' dash generates wisps');
 r('draw()');
 assert(r('trailCalls.length>0'),label+' world draw reaches the painted wisp renderer');
 assert(r(`trailCalls.every(args=>args[2]===${face}&&args[3]>0&&args[3]<1)`),label+' renderer receives direction and active fading progress');
 assert(r("renderOrder.indexOf('trail')<renderOrder.indexOf('player')"),label+' wisps remain behind Momo');
 const firstProgress=r('trailCalls[0][3]');
 frames(h,1,fps);r('trailCalls=[];draw()');
 assert(r('trailCalls[0][3]')>firstProgress,label+' fade advances with simulation time');
 const frozen=r('JSON.stringify([particles,player,dash,time])');
 r('pause()');frames(h,fps,fps);r('trailCalls=[];draw()');
 assert.equal(r('JSON.stringify([particles,player,dash,time])'),frozen,label+' pause freezes trail position and lifetime');
 assert(r('trailCalls.length>0'),label+' paused frame retains the frozen trail');
 r('pause()');frames(h,fps,fps);r('trailCalls=[];draw()');
 assert.equal(r("particles.some(p=>p.kind==='dashWisp')"),false,label+' trail expires after dash ends');
 assert.equal(r('trailCalls.length'),0,label+' expired wisps are not rendered');
 r('reducedMotion.matches=true;dashCooldown=0');
 h.press('k');frames(h,Math.ceil(fps*.1),fps);h.release('k');r('trailCalls=[];draw()');
 assert(r('dash>0'),label+' reduced motion preserves dash gameplay');
 assert.equal(r("particles.some(p=>p.kind==='dashWisp')"),false,label+' reduced motion suppresses trail creation');
 assert.equal(r('trailCalls.length'),0,label+' reduced motion leaves no moving wisp renderer calls');
}
console.log('PASS: granted dash input renders painted camp and Japan trails behind Momo, with fading, expiry, pause freezing and reduced motion in both directions at30/60/120fps.');
