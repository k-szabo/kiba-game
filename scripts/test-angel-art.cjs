const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {run,snap,tick,sandbox}=require('./test-harness.cjs')();
const definitions=run('ART_EFFECTS'),manifest=run('ART_MANIFEST');
for(const [key,art] of Object.entries(definitions)){
 const png=fs.readFileSync(path.join(__dirname,'..',manifest[art.image]));
 assert.equal(png[25],6,'Spell PNG must preserve its alpha channel');
 assert.equal(png.readUInt32BE(16),art.w);assert.equal(png.readUInt32BE(20),art.h);
 assert(art.tipX>0&&art.tipX<art.w&&art.tipY>0&&art.tipY<art.h,'Tip registration leaves the asset');
}
const backgrounds=['heavenBackdrop','heavenDarkBackdrop','heavenEclipseBackdrop'];
for(const key of backgrounds){
 const png=fs.readFileSync(path.join(__dirname,'..',manifest[key]));
 assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),1536,'Phase backgrounds must keep the same camera/aspect');
}
const ctx=sandbox.document.getElementById('world').getContext('2d'),calls=[],stack=[];
let transform={x:0,y:0,angle:0};ctx.globalAlpha=1;
ctx.save=()=>stack.push({...transform,alpha:ctx.globalAlpha});
ctx.restore=()=>{const saved=stack.pop();transform={x:saved.x,y:saved.y,angle:saved.angle};ctx.globalAlpha=saved.alpha;};
ctx.translate=(x,y)=>{transform.x+=x;transform.y+=y;};ctx.rotate=angle=>{transform.angle+=angle;};
ctx.drawImage=(image,...args)=>calls.push({key:image._key,args,alpha:ctx.globalAlpha,...transform});
run("for(const key of ['holyArrow','holyLance','heavenBackdrop','heavenDarkBackdrop','heavenEclipseBackdrop'])Visuals.images[key]={complete:true,naturalWidth:key==='holyArrow'?2006:1024,naturalHeight:key==='holyArrow'?784:1536,_key:key};");
const near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function registered(call,art){const [x,y,w,h]=call.args;near(x+art.tipX*w/art.w,0);near(y+art.tipY*h/art.h,0);}

// The real elder angel fan and boss volley both use the painted projectile.
run("var elder=enemies.find(e=>e.id==='oldAngel');elder.move='holyFan';elder.targetX=elder.x+300;elder.targetY=elder.y+30;releaseMiniAttack(elder)");
const fan=run('projectiles.map(p=>({...p}))');assert.equal(fan.length,3);
for(const p of fan){
 sandbox.testProjectile=p;calls.length=0;const original=JSON.stringify(p);run('Visuals.projectile(testProjectile)');
 assert.equal(calls.length,1);assert.equal(calls[0].key,'holyArrow');registered(calls[0],definitions.holyArrow);
 near(calls[0].x,p.x);near(calls[0].y,p.y);near(calls[0].angle,Math.atan2(p.vy,p.vx));assert.equal(JSON.stringify(p),original);
}
run("abilities=[true,true];defeated=[true,true,false,false];flags=[['forestBell','villageBell','guardian:oldAngel','guardian:oldCultist','angelHalo','demonHorn'],['soulUpper','soulLower'],['dawnSeal'],[]];enterRealm(2);state='play';bossStarted=true;player.inv=999;boss.move='holySweep';boss.face=-1;startBossAttack();executeBossMove(.01);");
assert(run("projectiles.length===2&&projectiles.every(p=>p.kind==='holyArrow'&&p.source==='boss')"));
calls.length=0;run('Visuals.projectile(projectiles[0])');assert.equal(calls[0].key,'holyArrow');registered(calls[0],definitions.holyArrow);assert(Math.abs(calls[0].angle)>2);
run('boss.hazards=[];lightArrowAt(player.x+200,.7)');
const hazardBefore=JSON.stringify(run('boss.hazards[0]'));calls.length=0;run('Visuals.bossEffects(realms[2])');
let lance=calls.find(c=>c.key==='holyLance');assert(lance&&lance.alpha>0&&lance.alpha<1);registered(lance,definitions.holyLance);
assert.equal(JSON.stringify(run('boss.hazards[0]')),hazardBefore,'Drawing must not change spell timing or damage');
run('updateBossHazards(.71)');assert(run('boss.hazards[0].active'));calls.length=0;run('Visuals.bossEffects(realms[2])');lance=calls.find(c=>c.key==='holyLance');assert.equal(lance.alpha,1);registered(lance,definitions.holyLance);

function backgroundCalls(){calls.length=0;run('Visuals.backdrop(realms[2])');return calls.filter(c=>backgrounds.includes(c.key));}
run('boss.stage=2;bossStarted=false;Visuals.updateAtmosphere(2)');assert.deepEqual(backgroundCalls().map(c=>c.key),['heavenBackdrop']);
run('resetBossBattle();bossStarted=true;boss.inv=0;hitBoss(70);');assert.equal(snap().boss.stage,2);
run('Visuals.updateAtmosphere(.12)');const mixed=backgroundCalls();assert.deepEqual(mixed.map(c=>c.key),['heavenBackdrop','heavenDarkBackdrop']);
assert(mixed[1].alpha>0&&mixed[1].alpha<1);assert.deepEqual(mixed[0].args,mixed[1].args,'Crossfade moves the architecture');
run('pause()');const paused=backgroundCalls();tick(400);assert.deepEqual(backgroundCalls(),paused,'Atmosphere changes while paused');run('pause();Visuals.updateAtmosphere(2)');assert.deepEqual(backgroundCalls().map(c=>c.key),['heavenDarkBackdrop']);
run('updateBoss(1.81);boss.inv=0;hitBoss(70);');assert.equal(snap().boss.stage,3);assert.equal(snap().boss.hp,180);
run('Visuals.updateAtmosphere(2)');assert.deepEqual(backgroundCalls().map(c=>c.key),['heavenEclipseBackdrop']);
run('boss.dead=true;Visuals.updateAtmosphere(2)');assert.deepEqual(backgroundCalls().map(c=>c.key),['heavenBackdrop']);
run('boss.dead=false;boss.stage=3;Visuals.updateAtmosphere(2);resetBossBattle();Visuals.updateAtmosphere(2)');assert.deepEqual(backgroundCalls().map(c=>c.key),['heavenBackdrop']);
run('boss.stage=3;Visuals.updateAtmosphere(2);enterRealm(0)');assert.equal(run('Visuals.backdropPhase()'),1);
assert.equal(stack.length,0,'VFX leaves the Canvas transform/alpha stack unbalanced');
console.log('PASS: elder/boss painted arrow volleys, registered tips and warning/impact lance alpha without timing changes; equal background composition, real 50%/secret transitions, paused crossfade, victory/reset restoration and no phase leakage into Japan.');
