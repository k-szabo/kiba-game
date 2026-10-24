const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const near=(actual,expected,label)=>assert(Math.abs(actual-expected)<1e-8,`${label}: ${actual} != ${expected}`);
function fixture(scene,mask=3){
 const h=harness();h.run('DevTools.open();DevSession.begin()');
 for(const [bit,id] of [[1,'double-jump'],[2,'dash']])if(mask&bit)assert(h.run(`DevAbilities.acquire({ability:'${id}'})`));
 const target=scene==='shadowRealm'?{realm:'3',rest:'start'}:scene==='dream'?{realm:'dream',rest:'dream'}:scene==='forestCamp'?{realm:'forestCamp',rest:'forestCamp'}:{realm:'0',rest:'start'};
 assert(h.run(`DevTeleport.teleport(${JSON.stringify(target)})`));
 h.run('DevTools.close()');return h;
}
const seconds=(h,time,fps)=>h.run(`for(let frame=0;frame<${Math.ceil(time*fps)};frame++)update(${1/fps});`);
const clocks='JSON.stringify({attack,attackCooldown,dash,dashCooldown,jumpBuffer,coyote,dropTimer,inv:player.inv,stun:player.stun,shake})';
// Shared clocks advance once, not twice or never, in each dispatch route.
for(const scene of ['dream','japan','forestCamp','shadowRealm']){
 const h=fixture(scene);
 h.run('attack=attackCooldown=dash=dashCooldown=jumpBuffer=dropTimer=player.inv=shake=.6;coyote=0;player.onGround=false;player.jumps=2;player.y-=200;player.vy=0;update(.1)');
 for(const name of ['attack','attackCooldown','dash','dashCooldown','jumpBuffer','dropTimer','player.inv','shake'])near(h.run(name),.5,`${scene}: ${name} decays exactly once`);
 h.run('jumpBuffer=0;coyote=.6;update(.1)');near(h.run('coyote'),.5,`${scene}: coyote decays once`);
 h.run('player.stun=.6;update(.1)');near(h.run('player.stun'),.5,`${scene}: stun decays once`);
 for(const [open,close] of [['pause()','pause()'],['Inventory.open()','Inventory.close()'],['DevTools.open()','DevTools.close()']]){
  assert(h.run("state==='play'"));h.run(open);const before=h.run(clocks);seconds(h,1,120);
  assert.equal(h.run(clocks),before,`${scene}: ${open} freezes all clocks`);h.run(close);
 }
}
// Actual grant -> teleport -> key input covers all ability combinations, both
// movement directions and common frame rates, rather than only testing bits.
for(const scene of ['japan','dream','forestCamp','shadowRealm'])for(const fps of [30,60,120])for(const mask of [0,1,2,3])for(const face of [-1,1]){
 const h=fixture(scene,mask),label=`${scene}/${fps}fps/abilities${mask}/face${face}`;
 h.run(`player.face=${face}`);const start=h.snap().player.x;
 h.press({action:'dash'});seconds(h,1/fps,fps);h.release({action:'dash'});
 assert.equal(h.run('dash>0'),!!(mask&2),label+' dash permission');
 if(mask&2)near(h.run('dash'),.2,label+' initial duration');
 // Jump during the dash used to preserve negative vy forever without gravity.
 h.press(' ');seconds(h,1/fps,fps);h.release(' ');
 seconds(h,1/fps,fps);h.press(' ');seconds(h,1/fps,fps);h.release(' ');
 assert.equal(h.snap().player.jumps,mask&1?2:1,label+' air jump permission');
 seconds(h,2,fps);
 assert.equal(h.run('dash'),0,label+' dash must expire');
 assert.equal(h.run('dashCooldown'),0,label+' cooldown must expire');
 assert(Math.abs(h.snap().player.vx)<.01,label+' key release must stop movement');
 assert(h.snap().player.onGround,label+' gravity must return Momo to the floor');
 near(h.snap().player.y+h.snap().player.h,h.run('level.start.y'),label+' grounded height');
 assert(Math.abs(h.snap().player.x-start)<400,label+' bounded dash displacement');
 if(mask&2){h.press({action:'dash'});seconds(h,1/fps,fps);h.release({action:'dash'});assert(h.run('dash>0'),label+' dash can be reused');}
}
// Crossing controllers, re-entering the dream and respawning reset transient
// motion while preserving the granted test abilities and the normal save.
const h=fixture('japan'),normal=h.run('JSON.stringify(saved)'),writes=h.run('window.__saveSnapshots.length');
for(const target of [{realm:'dream',rest:'dream'},{realm:'forestCamp',rest:'forestCamp'},{realm:'1',rest:'start'},{realm:'2',rest:'start'},{realm:'3',rest:'start'},{realm:'0',rest:'start'},{realm:'dream',rest:'dream'}]){
 h.press({action:'dash'});h.tick();h.release({action:'dash'});assert(h.run('dash>0'));
 h.run('DevTools.open()');assert(h.run(`DevTeleport.teleport(${JSON.stringify(target)})`));
 assert(h.run('dash===0&&dashCooldown===0&&jumpBuffer===0&&coyote===0&&dropTimer===0&&player.vx===0&&player.vy===0'));
 assert.deepEqual(Array.from(h.run('abilities')),[true,true]);h.run('DevTools.close()');
}
h.run('Prologue.lose()');assert(h.run('dash===0&&player.vx===0&&player.vy===0'));seconds(h,7,120);h.dismiss();
assert(h.run('!Prologue.active'));assert.deepEqual(Array.from(h.run('abilities')),[true,true]);
h.run('DevTools.open();DevImmortality.toggle();DevTools.close()');h.press({action:'dash'});h.tick();h.release({action:'dash'});h.run('revive()');
assert(h.run('dash===0&&player.vx===0&&player.vy===0'));
assert.equal(h.run('JSON.stringify(saved)'),normal);assert.equal(h.run('window.__saveSnapshots.length'),writes);
console.log('PASS: once-per-frame shared player clocks, pause freezes, grant/teleport/input matrix at30/60/120fps, bounded dash, gravity, cooldown reuse and transition/save isolation.');
