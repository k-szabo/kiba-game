'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
// QA-HANNAH-ART-001 r1: keep rejected anatomy out of the active walk cycle.
{
 const h=harness(),r=h.run;
 assert.deepEqual(JSON.parse(r('JSON.stringify(ART_HANNAH.walk.frames.map(f=>f.sourceFrame))')),[2,2,2,5,5,5]);
 assert.deepEqual(JSON.parse(r('JSON.stringify(ART_HANNAH.ritual.frames.map(f=>f.sourceFrame))')),[0,1,2,3,4,5]);
 assert(r("ART_HANNAH.walk.image==='hannahWalk'&&ART_MANIFEST.hannahWalk.endsWith('hannah-walk-v2.png')"));
 const samples=[];h.sandbox.document.getElementById('world').getContext('2d').drawImage=(image,...args)=>samples.push(args.slice(0,4));
 r("globalThis.__actor={miniboss:'hannah',dead:false,mode:'combat',phase:'wait',walkSpeed:115,x:0,y:0,w:120,h:228,face:1,inv:0,stage:1,echoQueue:[],hazards:[],summons:[]};");
 for(let tick=0;tick<6;tick++)r(`__actor.animTime=${tick*.1+.01};HannahArt.actor(__actor)`);
 assert.deepEqual(samples,JSON.parse(r('JSON.stringify(ART_HANNAH.walk.frames.map(f=>[f.x,f.y,f.w,f.h]))')),'Walk holds each approved step for three 10 FPS ticks');
}
function setup(fia=true){const h=harness();h.run(`Prologue.stop();realm=3;level=zigguratSummit;platforms=level.platforms.map(p=>({...p}));flags=levels.map(()=>[]);defeated=[true,true,true,true];boss={dead:true};enemies=[];projectiles=[];particles=[];state='play';initPlayer({x:1450,y:1400});enemies=createEnemies();var hannah=enemies.find(HannahCombat.is);HannahCombat.update(hannah,.001);hannah.stage=2;hannah.maxHp=1600;hannah.gateIndex=2;hannah.hp=161;hannah.mode='combat';${fia?"flags[3].push('fiaRescued','arenaChampion','fiaTalismanCompleted')":''}`);return h;}
for(const fia of [true,false]){
 const h=setup(fia),r=h.run;r("HannahCombat.hit(hannah,hannah.parts[0],1e9)");assert.equal(r('state'),'dialog');assert.equal(r('HannahEncounter.visual().haruFreed'),false,'Real rescue gate keeps Haru chained during intro');h.dismiss();assert.equal(r('HannahEncounter.visual().rescueTime'),0);
 r('HannahEncounter.update(1)');assert.equal(r('state'),'play');assert.equal(r('HannahEncounter.visual().haruFreed'),false);assert(r('player.x-camera>80'),'Locked rescue keeps Momo inside the viewport');assert(r('2280-camera+117<viewW-32'),'Binding pillar has a complete right margin');
 r('HannahEncounter.update(1)');assert.equal(r('HannahEncounter.visual().haruFreed'),true);
 r('HannahEncounter.update(1.7)');assert.equal(r('state'),'dialog');h.dismiss();assert.equal(r('hannah.mode'),'finisher');
 assert(r('Dawnblade.activate()'));r('Dawnblade.update(.56)');assert(r('hannah.dead'));assert.equal(r('state'),'play','Victory must not hide the impact with an immediate modal');assert(r('Dawnblade.casting()'));
 assert(r("flags[3].includes('demonLordSoul')&&flags[3].includes('demonLordHeart')"));r('Dawnblade.update(.6);HannahEncounter.update(.81)');assert.equal(r('state'),'dialog');h.dismiss();
 assert.equal(r('HannahEncounter.visual().rescuedByFia'),fia,'Fia remains visible only on her rescue branch');
 const before=r('JSON.stringify([flags,progression])');r('HannahEncounter.reconcileRewards();HannahEncounter.reconcileRewards()');assert.equal(r('JSON.stringify([flags,progression])'),before,'Rewards cannot duplicate');
 if(fia){assert.equal(r('HannahEncounter.visual().fiaPresent'),true);r('player.x=1550-player.w/2;player.y=1400-player.h;');assert.equal(r('HannahEncounter.context().type'),'hannahHeart');r("HannahEncounter.interact(HannahEncounter.context())");assert(r("flags[3].includes('demonLordHeartGiven')"));assert.equal(r("Inventory.quantity('demonLordHeart')"),0);r("flags[3].push('fiaSlain')");assert.equal(r('HannahEncounter.visual().rescuedByFia'),true);assert.equal(r('HannahEncounter.visual().fiaPresent'),false,'Historical help cannot resurrect slain Fia');}
}
{
 const h=harness(),r=h.run,calls=[];const ctx=h.sandbox.document.getElementById('world').getContext('2d');ctx.translate=(x,y)=>calls.push([x,y]);
 r("flags[3].push('dawnblade');Dawnblade.activate()");
 for(let pose=0;pose<6;pose++){calls.length=0;assert(r('HannahArt.player()'));assert(calls.some(([x,y])=>Number.isFinite(x)&&Number.isFinite(y)),'Ultimate uses the real player coordinates, never its rendering function');assert(calls.every(([x,y])=>Number.isFinite(x)&&Number.isFinite(y)));r('Dawnblade.update(.17)');}
}
{
 const {fixture}=require('./test-save-release.cjs'),s=fixture();Object.assign(s,{realm:3,location:'zigguratInterior',prologueComplete:true,defeated:[true,true,true,true],flags:[['forestBell','villageBell'],['soulUpper','soulLower'],['dawnSeal','shadowEntered'],['prisonTrace','shadowAltar']],checkpoint:{id:'zigguratInteriorUpper',x:1500,y:440},visitedRests:[[],[],[],['zigguratInteriorUpper']]});
 const moved=validate(s);assert.equal(moved.checkpoint.x,820);assert.equal(moved.checkpoint.y,440);
 s.checkpoint.x=1499;assert.throws(()=>validate(s),'Unknown checkpoint coordinates remain invalid');
}
// QA-HRP-001: normal, pre-owned and developer replays cannot skip rescue.
for(const fia of [true,false])for(const preowned of [true,false])for(const replay of [true,false]){
 const h=setup(fia),r=h.run;
 r("hannah.mode='combat';hannah.replay="+replay+";"+(preowned?"flags[3].push('dawnblade');":""));
 r("HannahCombat.hit(hannah,hannah.parts[0],1e9)");h.dismiss();
 assert.equal(r('HannahEncounter.finisherReady()'),false);assert.equal(r('Dawnblade.activate()'),false);
 const t=r('HannahEncounter.visual().rescueTime');r("state='pause';HannahEncounter.update(99);");assert.equal(r('HannahEncounter.visual().rescueTime'),t);r("state='play';HannahEncounter.update(2);");assert.equal(r('Dawnblade.activate()'),false);
 r('HannahEncounter.update(1.7)');assert(r('HannahEncounter.visual().haruFreed'),'Haru stays free through awakening');h.dismiss();assert(r('HannahEncounter.finisherReady()'));assert(r('Dawnblade.activate()'));
}
console.log('PASS: rescue branches, visible finishing strike, persistent Fia/rewards/gift, finite ultimate poses and exact legacy-shrine migration.');

// QA-HRP-005 r2: the real main loop must preserve authored rescue framing.
for(const fia of [true,false])for(const fps of [30,60,120]){
 const h=setup(fia),r=h.run;r('hannah.stage=1;hannah.hp=121;hannah.gateIndex=0;HannahCombat.hit(hannah,hannah.parts[0],1e9)');h.dismiss();r('for(let i=0;i<'+Math.ceil(fps*2.6)+';i++)update('+1/fps+');hannah.gateIndex=2;hannah.hp=161;HannahCombat.hit(hannah,hannah.parts[0],1e9)');h.dismiss();
 for(let i=0;i<Math.floor(fps*3.5);i++){r('update('+1/fps+')');assert(r('player.x-camera>80'));assert(r('2280-camera+117<viewW-32'));assert.equal(r('player.y+player.h'),1080);}
 assert.equal(r('state'),'play');
}

// QA-HRP-008: developer replay completes visible recovery without story/rewards.
{
 const h=setup(false),r=h.run;r('DevTools.open();DevSession.begin();DevTools.close();hannah.replay=true;hannah.stage=1;hannah.hp=121;hannah.gateIndex=0;HannahCombat.hit(hannah,hannah.parts[0],1e9)');h.dismiss();
 r('for(let i=0;i<160;i++)update(1/60);hannah.gateIndex=2;hannah.hp=161;HannahCombat.hit(hannah,hannah.parts[0],1e9)');h.dismiss();r('for(let i=0;i<225;i++)update(1/60)');h.dismiss();
 const progress=r('JSON.stringify([flags,progression])'),writes=r('__saveSnapshots.length');assert(r('Dawnblade.activate()'));r('Dawnblade.update(.56)');assert(r('hannah.dead'));assert.equal(r('HannahEncounter.visual().lift'),320);assert.equal(r('state'),'play');
 r('Dawnblade.update(.56);HannahEncounter.update(.81)');assert.equal(r('HannahEncounter.visual().lift'),0);assert.equal(r('platforms.find(p=>p.id==="ziggurat-summit-ground").y'),1400);assert.equal(r('state'),'play');assert.equal(r('JSON.stringify([flags,progression])'),progress);assert.equal(r('__saveSnapshots.length'),writes);
}
