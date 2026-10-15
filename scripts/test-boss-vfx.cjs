const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {run,tick,sandbox}=require('./test-harness.cjs')();
const art=run('BOSS_FX_ART'),manifest=run('ART_MANIFEST');
assert.equal(Object.keys(art).length,10,'The boss effect catalog is incomplete');
const ctx=sandbox.document.getElementById('world').getContext('2d'),draws=[],stack=[];
ctx.globalAlpha=1;ctx.save=()=>stack.push(ctx.globalAlpha);ctx.restore=()=>{assert(stack.length,'Unbalanced effect restore');ctx.globalAlpha=stack.pop();};
ctx.drawImage=(image,...args)=>{draws.push({key:image.effectKey,args,alpha:ctx.globalAlpha});};
for(const [key,a]of Object.entries(art)){
 const png=fs.readFileSync(path.join(__dirname,'..',manifest[a.image])),w=png.readUInt32BE(16),h=png.readUInt32BE(20),r=a.rect;
 assert.equal(png[25],6,'Effect lost its generated alpha channel');
 assert(r.x>=0&&r.y>=0&&r.x+r.w<=w&&r.y+r.h<=h&&r.w>0&&r.h>0,`Invalid source bounds: ${key}`);
 assert(a.anchorX>=0&&a.anchorX<=r.w&&a.anchorY>=0&&a.anchorY<=r.h,`Invalid registration: ${key}`);
 run(`Visuals.images[${JSON.stringify(a.image)}]={complete:true,naturalWidth:${w},naturalHeight:${h},effectKey:${JSON.stringify(a.image)}}`);
}
const state=()=>run('JSON.stringify({boss,player,projectiles,platforms,enemies})');
function paint(code){draws.length=0;const before=state();run(code);assert.equal(state(),before,'Rendering changes combat geometry, timing, platforms or HP');assert.equal(stack.length,0);return draws.map(d=>d.key);}

for(const [realm,moves]of [[0,['cleave','dash','doubleCut']],[1,['hammer','slam','lava','embers','summon']],[2,['lightArrows','holySweep','shadowBolts','shadowNova','shadowRain','eclipse','hellfire','summon']]]){
 for(const move of moves){
  run(`abilities=[true,true];flags=[['angelHalo','demonHorn'],[],[]];defeated=[false,false,false];state='play';enterRealm(${realm});bossStarted=true;initPlayer({x:level.boss.x-200,y:level.arena.y});player.inv=999;boss.stage=${realm===2?3:1};boss.cycles=bossMoves().indexOf('${move}');chooseBossMove();`);
  // Explicit moves after choosing still use the real cast initialization and timings.
  run(`boss.move='${move}';if(realm===1&&'${move}'==='lava')startYomiLavaWave('shelter');startBossAttack();executeBossMove(.01);updateBossHazards(.96);`);
  const used=paint('Visuals.bossEffects(realms[realm]);for(const p of projectiles)Visuals.projectile(p);');
  if(realm===0)assert(used.includes('fxSlashes'),`Missing samurai slash ${move}`);
  if(realm===1&&['hammer','slam'].includes(move))assert(used.includes('fxImpact'),`Missing earth impact ${move}`);
  if(move==='lava')assert(used.includes('fxLava'),'Lava is still a primitive strip');
  if(move==='embers')assert(used.includes('fxEmber'),'Ember missiles are still flat circles');
  if(move==='summon'){run(realm===1?'boss.hp=boss.max*.8;queueYomiThresholds();':'scheduleMinions()');assert(paint('Visuals.bossEffects(realms[realm])').includes('fxDarkMagic'));}
  if(['shadowBolts','shadowNova','shadowRain'].includes(move))assert(used.includes('fxDarkMagic'),`Missing painted dark spell ${move}`);
 }
}
run("state='play';enterRealm(1);bossStarted=true;boss.move='slam';boss.phase='windup';boss.targetX=player.x;boss.phaseDuration=1;boss.clock=.6;");
assert(paint('Visuals.bossEffects(realms[1])').includes('fxFissure'),'Earthquake has no painted pre-eruption cue');
for(const realm of [1,2]){
 run(`enterRealm(${realm});bossStarted=true;boss.autoPhase='strike';boss.autoFace=-1;boss.autoDuration=.3;boss.autoClock=.15;`);
 assert(paint('Visuals.bossEffects(realms[realm])').includes('fxSlashes'),'Auto attack still uses a plain line');
}
run("enterRealm(0);var cult=enemies.find(e=>e.id==='oldCultist');cult.active=true;cult.move='sigils';cult.targetX=cult.x+100;cult.targetY=cult.y;releaseMiniAttack(cult);for(const h of cult.hazards){h.active=true;h.warning=0}");
assert(paint('Visuals.actor(cult,realms[0])').includes('fxDarkMagic'),'Cultist sigils were missed by the boss review');
run('player.inv=999;pause()');const paused=paint('Visuals.actor(cult,realms[0])');const frozenTime=run('time');tick(180);assert.equal(run('time'),frozenTime);assert.deepEqual(paint('Visuals.actor(cult,realms[0])'),paused);
const nightmare=require('./test-harness.cjs')({prologue:true});
nightmare.run('player.x=3160;update(1/120);for(let i=0;i<350;i++)update(1/120);player.inv=999;');
const kinds=new Set();
for(let i=0;i<4000&&nightmare.run("Prologue.phase==='battle'");i++){
 nightmare.tick();for(const h of nightmare.run('boss.hazards'))kinds.add(h.kind);
 nightmare.run('draw()');
}
for(const kind of ['sweep','rift','storm','devour'])assert(kinds.has(kind),'A nightmare area effect was not exercised');
assert.equal(nightmare.run('Prologue.phase'),'death');
console.log('PASS: all boss move families and auto strikes render painted effects; strict PNG regions/anchors, unchanged damage/geometry/timers/platforms, cultist sigils, frozen pause and every nightmare area attack through its inevitable defeat.');
