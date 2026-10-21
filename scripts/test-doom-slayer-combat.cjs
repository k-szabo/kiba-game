const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const harness=require('./test-harness.cjs');
function fixture(){
 const h=harness();
 if(h.run('typeof DoomSlayer')==='undefined')vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/doom-slayer.js'),'utf8'),h.sandbox,{filename:'doom-slayer.js'});
 h.run(`realm=1;level={...levels[1],width:3400,secrets:[...(levels[1].secrets||[]),{id:'slayerTest',arena:{x:100,y:-1700,w:3000}}]};
  platforms=[];checkpoint={x:1800,y:-1700};flags[1]=flags[1].filter(f=>f!=='guardian:doomSlayer');
  initPlayer(checkpoint);player.inv=0;player.hp=player.maxHp=30;state='play';
  var subject=DoomSlayer.create({id:'doomSlayer',miniboss:'slayer',secretArea:'slayerTest',x:2200,y:-1700},0);
  enemies=[subject];projectiles=[];`);
 return h;
}
const value=(h,s)=>h.run(s),step=(h,seconds,rate=120)=>h.run(`for(let n=0;n<${Math.ceil(seconds*rate)};n++)DoomSlayer.update(subject,${1/rate});`);
function start(h){assert(value(h,'DoomSlayer.start(subject)'));}
function prepare(h,move){
 value(h,`subject.move=${JSON.stringify(move)};subject.phase='windup';subject.clock=0;subject.phaseDuration=.8;subject.targetX=player.x+player.w/2;subject.targetY=player.y+player.h/2;subject.attackFace=subject.face=-1;`);
 step(h,1/120);
 assert.equal(value(h,'subject.phase'),'strike',move+' enters strike');
}
function contact(h,move,hp=30){
 value(h,`player.x=subject.x-65;player.y=subject.baseY+subject.h-player.h;player.hp=${hp};player.inv=0;player.stun=0;dash=0;`);
 prepare(h,move);step(h,1/120);
}
{
 const h=fixture();assert(value(h,'DoomSlayer.is(subject)'));assert.equal(value(h,'subject.maxHp'),260);
 assert(!value(h,'subject.active'));step(h,10);assert.equal(value(h,'subject.cycles'),0,'The grave never activates on approach');
 start(h);assert.equal(value(h,'subject.barrels.length'),9);assert(!value(h,'DoomSlayer.start(subject)'));
 step(h,.67);assert.equal(value(h,'subject.phase'),'windup');assert.equal(value(h,'subject.move'),'flail');assert(value(h,'subject.phaseDuration>=.3&&subject.clock>0'));
 assert.equal(value(h,"DoomSlayer.hit(subject,subject,10,'normal')"),10,'Windup leaves the shield open');
 value(h,"subject.inv=0;subject.phase='wait';subject.face=-1;player.x=subject.x-50;player.y=subject.baseY+43;");
 assert.equal(value(h,"DoomSlayer.hit(subject,subject,10,'normal')"),0,'Frontal normal attacks are shielded');
 assert.equal(value(h,"DoomSlayer.hit(subject,subject,10,'heavy')"),10,'Heavy attacks bypass the shield');
 value(h,"subject.inv=0;subject.phase='recover';player.x=subject.x-50;");
 assert.equal(value(h,"DoomSlayer.hit(subject,subject,10,'normal')"),0,'Grounded recovery actively shields frontal normal attacks');
 value(h,'subject.inv=0;player.x=subject.x+subject.w+5;');
 assert.equal(value(h,"DoomSlayer.hit(subject,subject,10,'normal')"),10,'The rear remains vulnerable');
 value(h,'subject.inv=0;player.x=subject.x-50;player.y=subject.y-player.h;');
 assert.equal(value(h,"DoomSlayer.hit(subject,subject,10,'normal')"),10,'Airborne attacks bypass the grounded shield');
}
for(const [move,damage] of [['flail',5],['kick',3],['grab',2],['saw',5]]){
 const h=fixture();start(h);contact(h,move);
 assert.equal(value(h,'player.hp'),30-damage,move+' damage');
 if(move==='kick'){assert(value(h,'player.vx< -700'));assert.equal(value(h,'player.vy'),-280);}
 if(move==='grab'||move==='saw'){assert(value(h,'player.slayerGrab'));assert(value(h,'player.stun>0'));value(h,'DoomSlayer.clear(subject)');assert.equal(value(h,'player.stun'),0);assert(!value(h,'player.slayerGrab'));}
}
// Use the full opening approach, not a forced attack, to verify both sides and
// frame rates. A distant target must see a ranged tell; close targets keep melee.
for(const rate of [30,60,120])for(const direction of [-1,1])for(const distant of [false,true]){
 const h=fixture();
 value(h,`initPlayer({x:${distant?(direction<0?600:3000):2238+direction*80},y:-1700});player.inv=999;`);
 start(h);step(h,.67,rate);
 assert.equal(value(h,'subject.phase'),'windup');
 assert.equal(value(h,'subject.move'),distant?'fireArrows':'flail',`Opening selection: ${rate} FPS, direction ${direction}, distant=${distant}`);
 assert(value(h,'subject.phaseDuration>=.3&&subject.clock>0'),'The opening still gives a visible windup');
 for(let frame=0;frame<rate*4&&value(h,'subject.cycles')<2;frame++)step(h,1/rate,rate);
 assert.equal(value(h,'subject.cycles'),2,'The ranged opener must not stall the move cycle');
 assert.equal(value(h,'subject.move'),'oil','The opener still leads into barrel ignition');
}
// Observe naturally selected attacks, rather than force their state: three
// quick tells/strikes form a chain, followed by an actual guarded breathing gap.
for(const rate of [30,60,120]){
 const h=fixture();value(h,'player.inv=999;');start(h);
 const strikes=[];let previous=value(h,'subject.phase'),previousCycles=0;
 for(let frame=0;frame<Math.ceil(5.7*rate);frame++){
  step(h,1/rate,rate);const phase=value(h,'subject.phase');
  if(phase==='windup'&&value(h,'subject.cycles')!==previousCycles){
   assert(value(h,'subject.phaseDuration>=.3'),'Every follow-up keeps a readable tell');previousCycles=value(h,'subject.cycles');
  }
  if(phase==='strike'&&previous!=='strike')strikes.push({time:(frame+1)/rate,move:value(h,'subject.move')});
  previous=phase;
 }
 assert(strikes.length>=6,`Attack pressure too low at ${rate} FPS: ${JSON.stringify(strikes)}`);
 assert.deepEqual(strikes.slice(0,6).map(s=>s.move),['flail','oil','fireArrows','lightning','kick','arrows']);
 assert(strikes[0].time<.85,'Opening attack remains too slow');
 for(const pair of [[0,1],[1,2],[3,4],[4,5]])assert(strikes[pair[1]].time-strikes[pair[0]].time<.85,'Combo contains an unintended long idle');
 assert(strikes[3].time-strikes[2].time>=1.1,'Three-attack chain must leave a guarded recovery window');
 assert(strikes[5].time<=5.5,'Six varied attacks should release within five and a half seconds');
}

// Dormant summoned encounters wait visibly with fresh resources until actual
// reentry. An obsolete object from before respawn must never restart itself.
{
 const h=fixture();start(h);prepare(h,'oil');value(h,'DoomSlayer.reset(subject);player.x=-100;');
 assert(value(h,'subject.graveAwake&&!subject.active&&subject.barrels.length===9'));
 step(h,.5);assert(!value(h,'subject.active'));
 value(h,'initPlayer({x:500,y:subject.arena.y});player.inv=999;');step(h,1/120);assert(value(h,'subject.active'));
 value(h,'DoomSlayer.reset(subject);enemies=[];');step(h,.5);assert(!value(h,'subject.active'),'Old instance restarted after enemy array replacement');
}
for(const rate of [30,60,120]){
 for(const phase of ['wait','recover'])for(const sawReady of [false,true]){
  const h=fixture();start(h);
  value(h,`player.x=600;subject.phase=${JSON.stringify(phase)};subject.clock=10;subject.sawReady=${sawReady};var oldSlayerX=subject.x;`);
  step(h,.25,rate);
  assert(Math.abs(value(h,'oldSlayerX-subject.x')-(sawReady?620:480)*Math.ceil(.25*rate)/rate)<1e-6,'Fast pursuit changes with frame rate');
  assert(value(h,'Math.abs(subject.walkSpeed)>285'),'Pursuit must outrun Momo rather than shuffle');
  value(h,'subject.stun=1;var stoppedSlayerX=subject.x;');step(h,.25,rate);
  assert.equal(value(h,'subject.x'),value(h,'stoppedSlayerX'),'Stun must stop pursuit');
  value(h,'subject.stun=0;player.x=subject.x+subject.w/2-player.w/2;');step(h,.25,rate);
  assert.equal(value(h,'subject.x'),value(h,'stoppedSlayerX'),'Pursuit must not overshoot at point-blank range');
 }
 const h=fixture();start(h);prepare(h,'doubleJump');value(h,'var leapStart=subject.x;');step(h,.2,rate);
 assert(Math.abs(value(h,'leapStart-subject.x')-92)<1e-6,'Double jump must cover ground at the new speed');
 value(h,"subject.move='saw';subject.phase='strike';subject.clock=10;subject.hitDone=true;var rushStart=subject.x;player.x=600;");step(h,.2,rate);
 assert(Math.abs(value(h,'rushStart-subject.x')-144)<1e-6,'Saw rush must cover ground at the new speed');
}
for(const protection of ['inv','dash','immortality']){
 const h=fixture();
 if(protection==='immortality')value(h,'DevTools.open();DevSession.begin();DevImmortality.toggle();DevTools.close();');
 start(h);value(h,'player.x=subject.x-65;player.y=subject.baseY+43;player.hp=30;subject.hp=90;');
 prepare(h,'saw');value(h,protection==='inv'?'player.inv=1;':protection==='dash'?'dash=.5;':'player.inv=0;');step(h,.02);
 assert.equal(value(h,'player.hp'),30,protection+' blocks saw damage');assert.equal(value(h,'subject.hp'),90,protection+' prevents saw healing');assert.equal(value(h,'subject.armor'),0);assert(!value(h,'subject.victim'));
}
{
 const h=fixture();start(h);contact(h,'grab');value(h,'player.stun=3;DoomSlayer.clear(subject);');
 assert.equal(value(h,'player.stun'),3,'Cancelling a grab preserves a stronger stun owned by another source');assert(!value(h,'player.slayerGrab'));
}
{
 const h=fixture();start(h);value(h,'subject.hp=90;');contact(h,'saw');
 assert.equal(value(h,'subject.hp'),110);assert.equal(value(h,'subject.armor'),1);
 value(h,"subject.inv=0;subject.phase='cast';");assert.equal(value(h,"DoomSlayer.hit(subject,subject,5,'heavy')"),4,'Each armor point reduces incoming damage');
 value(h,'subject.inv=0;subject.armor=8;');assert.equal(value(h,"DoomSlayer.hit(subject,subject,2,'heavy')"),.25,'Armor never makes the boss invulnerable');
 value(h,'DoomSlayer.clear(subject);subject.armor=8;');contact(h,'saw');assert.equal(value(h,'subject.armor'),8);
}
for(const hp of [3,4]){
 const h=fixture();start(h);
 value(h,'var killedVictim=null;var savedDamage=damage;damage=(amount)=>{player.hp=Math.max(0,player.hp-amount);if(!player.hp){killedVictim=player;initPlayer(checkpoint);}};');
 contact(h,'grab',hp);
 if(hp===3){assert(value(h,'killedVictim!==null'));assert(!value(h,'subject.active'));assert(!value(h,'player.slayerGrab'));assert.equal(value(h,'player.stun'),0);}
 else{assert.equal(value(h,'player.hp'),2,'Grab at 4 HP damages rather than executing');assert(value(h,'subject.victim===player'));}
 value(h,'damage=savedDamage;');
}
{
 const h=fixture();start(h);
 value(h,'var originalVictim=player;var savedDamage=damage;damage=()=>{initPlayer(checkpoint);};subject.hp=90;');
 contact(h,'saw',3);
 assert(value(h,'player!==originalVictim'));assert(!value(h,'subject.victim'));assert.equal(value(h,'subject.armor'),0);assert.equal(value(h,'subject.hp'),260,'A lethal attack cannot heal or capture after respawn');assert.equal(value(h,'player.stun'),0);
 value(h,'damage=savedDamage;');
}
{
 const h=fixture();start(h);value(h,'var originalVictim=player;subject.hp=90;');contact(h,'saw',3);
 assert(value(h,'player!==originalVictim'),'The real damage/revive flow replaces Momo');assert(!value(h,'subject.active'),'The old boss instance stops after respawn rebuilds enemies');
 assert(!value(h,'subject.victim'));assert.equal(value(h,'subject.armor'),0);assert.equal(value(h,'player.stun'),0);
}
for(const rate of [30,60,120]){
 const h=fixture();start(h);
 value(h,"subject.phase='windup';subject.hp=79;subject.inv=0;");assert.equal(value(h,"DoomSlayer.hit(subject,subject,1,'heavy')"),1);
 assert.equal(value(h,'subject.phase'),'retreat');assert(value(h,'subject.sawTriggered'));value(h,'var retreatOrigin=subject.x;');
 while(value(h,"subject.phase==='retreat'"))step(h,1/rate,rate);
 assert(Math.abs(value(h,'Math.abs(subject.x-retreatOrigin)')-260)<.001,'Retreat covers 260 pixels');assert.equal(value(h,'subject.clock'),5);
 step(h,4.9,rate);assert.equal(value(h,'subject.phase'),'cast','The entire 5 second cast is vulnerable at '+rate+' fps');
 value(h,'subject.stun=99;subject.inv=0;');assert.equal(value(h,"DoomSlayer.hit(subject,subject,2,'heavy')"),2,'Cast takes damage');assert.equal(value(h,'subject.phase'),'cast','Ordinary stun cannot interrupt the cast');
 step(h,.15,rate);assert(value(h,'subject.sawReady'));assert.equal(value(h,'subject.sawTriggered'),true);
 value(h,"subject.inv=0;subject.phase='recover';subject.clock=.5;subject.hp=79;");value(h,"DoomSlayer.hit(subject,subject,2,'heavy')");assert.equal(value(h,'subject.phase'),'recover','Threshold triggers once per attempt');
 value(h,'DoomSlayer.reset(subject)');assert(!value(h,'subject.sawTriggered'));assert.equal(value(h,'subject.armor'),0);
 start(h);prepare(h,'doubleJump');assert.equal(value(h,'subject.jumps'),1);assert(value(h,'subject.vy<0'));
 step(h,.6,rate);assert.equal(value(h,'subject.jumps'),2);assert(value(h,'subject.jumpUsed'));assert(value(h,'subject.y<subject.baseY-200'));
 step(h,1.6,rate);assert.equal(value(h,'subject.y'),value(h,'subject.baseY'),'Double jump lands at '+rate+' fps');assert(value(h,'subject.landed'));
}
{
 const h=fixture();start(h);prepare(h,'lightning');assert.equal(value(h,'subject.hazards.length'),3);assert(value(h,'subject.hazards.every(h=>!h.active&&h.warning>=.38&&h.damage===4)'));
 const hp=value(h,'player.hp');step(h,.3);assert.equal(value(h,'player.hp'),hp,'Lightning respects its warning');step(h,.12);assert.equal(value(h,'player.hp'),hp-4);
 value(h,'DoomSlayer.reset(subject);player.inv=0;');start(h);prepare(h,'explosion');assert.equal(value(h,'subject.hazards[0].damage'),5);step(h,.75);assert.equal(value(h,'player.hp'),hp-9);
 value(h,'DoomSlayer.reset(subject);');start(h);prepare(h,'arrows');assert.equal(value(h,'projectiles.length'),9);assert(value(h,"projectiles.every(p=>p.damage===2&&p.slayer&&p.source==='slayer'&&p.vy>0)"));assert.equal(value(h,'subject.hazards.length'),9);
}
for(const rate of [30,60,120]){
 const h=fixture();start(h);prepare(h,'fireArrows');assert.equal(value(h,'subject.oils.length'),0,'Fire arrows cannot invent spilled oil');
 value(h,'projectiles=[];');prepare(h,'oil');assert.equal(value(h,'subject.oils.length'),1);assert.equal(value(h,'subject.barrels.filter(b=>b.punctured).length'),1);assert(!value(h,'subject.oils[0].lit'));
 assert(value(h,'subject.oils[0].w<subject.arena.w/4'),'Oil preserves safe ground');
 prepare(h,'fireArrows');assert(value(h,'projectiles[0].fire'));assert.equal(value(h,'projectiles[0].igniteOil'),value(h,'subject.oils[0].id'));
 value(h,`subject.clock=99;for(let n=0;n<${rate*4};n++){for(const p of projectiles){p.life-=${1/rate};p.vy+=55*${1/rate};p.x+=p.vx*${1/rate};p.y+=p.vy*${1/rate};}DoomSlayer.update(subject,${1/rate});}`);
 assert(value(h,'subject.oils[0].lit'),'A moving fire arrow ignites the actual oil pool at '+rate+' fps');assert.equal(value(h,'projectiles[0].life>0'),false);
}
for(const rate of [30,60,120])for(const side of [-1,1]){
 const h=fixture();start(h);
 assert(value(h,'subject.barrels.every(b=>b.x>subject.arena.x+100&&b.x<subject.arena.x+subject.arena.w-100&&b.y===subject.arena.y)'),'All nine barrels must fit on the arena floor');
 value(h,'var nearestBarrel=subject.barrels.reduce((a,b)=>Math.abs(a.x-subject.x-subject.w/2)<Math.abs(b.x-subject.x-subject.w/2)?a:b);');
 prepare(h,'oil');assert.equal(value(h,'subject.oils[0].id'),value(h,'nearestBarrel.id'),'Puncture the nearest unused barrel');
 value(h,`subject.x=${side<0?'subject.patrolRight':'subject.patrolLeft'};subject.oils=[{id:90,x:${side<0?150:2700},y:subject.arena.y-14,w:320,h:20,lit:false,warning:0,life:35}];projectiles=[];`);
 prepare(h,'fireArrows');assert(value(h,'projectiles[0].life>4'),'Cross-arena oil shots need enough lifetime');
 value(h,`subject.clock=99;for(let n=0;n<${rate*8};n++){for(const p of projectiles){if(p.life<=0)continue;p.life-=${1/rate};p.vy+=55*${1/rate};p.x+=p.vx*${1/rate};p.y+=p.vy*${1/rate};}DoomSlayer.update(subject,${1/rate});}`);
 assert(value(h,'subject.oils[0].lit'),`Long-range oil ignition: ${rate} FPS, direction ${side}`);
}
{
 const h=fixture();start(h);prepare(h,'oil');prepare(h,'lightning');value(h,"var frozen=JSON.stringify(subject);var frozenShots=JSON.stringify(projectiles);state='paused';");step(h,3);
 assert.equal(value(h,'JSON.stringify(subject)'),value(h,'frozen'));assert.equal(value(h,'JSON.stringify(projectiles)'),value(h,'frozenShots'));
 value(h,"state='dialog';");step(h,3);assert.equal(value(h,'JSON.stringify(subject)'),value(h,'frozen'));
 value(h,"state='play';player.x=-100;projectiles.push({slayer:true},{source:'boss'});");step(h,.1);assert(!value(h,'subject.active'));assert.equal(value(h,'subject.hazards.length'),0);assert.equal(value(h,'subject.oils.length'),0);assert.equal(value(h,'projectiles.length'),1,'Reset removes only its own projectiles');
}
{
 const h=fixture();start(h);value(h,"subject.hp=79;subject.inv=0;subject.phase='windup';var xpBefore=JSON.stringify(progression);var coinsBefore=coins;var writesBefore=window.__saveSnapshots.length;");
 assert.equal(value(h,"DoomSlayer.hit(subject,subject,999,'heavy')"),79,'A lethal threshold hit kills without upward HP clamping');
 assert(value(h,'subject.dead'));assert(!value(h,'subject.sawTriggered'));assert(value(h,"flags[1].includes('guardian:doomSlayer')"));assert.equal(value(h,'JSON.stringify(progression)'),value(h,'xpBefore'));assert.equal(value(h,'coins'),value(h,'coinsBefore'));assert.equal(value(h,'window.__saveSnapshots.length'),value(h,'writesBefore+1'));
 assert(!value(h,'DoomSlayer.defeat(subject)'));assert.equal(value(h,'window.__saveSnapshots.length'),value(h,'writesBefore+1'));
 value(h,'DoomSlayer.reset(subject)');assert(value(h,'subject.dead'));assert(!value(h,'DoomSlayer.start(subject)'));
}
console.log('PASS: secret Slayer activation, shield/armor, nine attacks, five-second saw threshold, actual double jump, damage protections, grab execution, oil ignition, pause and persistent defeat.');
