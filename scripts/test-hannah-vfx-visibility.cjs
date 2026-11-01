'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
function fixture(){
 const h=harness();h.run("Prologue.stop();realm=3;level=zigguratSummit;platforms=level.platforms.map(p=>({...p}));flags=levels.map(()=>[]);defeated=[true,true,true,true];boss={dead:true,x:0,y:0};enemies=[];projectiles=[];particles=[];state='play';initPlayer({x:2450,y:1400});enemies=createEnemies();var hannah=enemies.find(HannahCombat.is);enemies=[hannah];");
 const calls=[],boxes=[],ctx=h.sandbox.document.getElementById('world').getContext('2d');
 ctx.drawImage=(image,...args)=>calls.push({image,args});ctx.strokeRect=(...args)=>boxes.push(args);
 return {...h,calls,boxes};
}
// The real world renderer must not use the boss origin to cull distant hazards.
{
 const h=fixture(),r=h.run;
 r("hannah.x=100;hannah.y=1120;hannah.phase='windup';hannah.mode='combat';hannah.move='riftBurst';hannah.attackBoxes=[{x:2450,y:1140,w:140,h:260}];hannah.hazards=[];hannah.echoQueue=[];hannah.summons=[];camera=2150;cameraY=720;viewW=1280;");
 assert.equal(r('visiblePoint({x:hannah.x,y:hannah.y},190)'),false);
 const before=r('JSON.stringify([hannah,player,time,levelTime,flags])');r('draw()');
 assert(h.boxes.some(box=>JSON.stringify(box)===JSON.stringify([2450,1140,140,260])),'Offscreen Hannah still draws the distant warning from the main world pass');
 assert.equal(r('JSON.stringify([hannah,player,time,levelTime,flags])'),before,'Rendering warnings does not change encounter state');
 h.calls.length=0;r("hannah.phase='strike';hannah.attackBoxes=[];hannah.hazards=[{x:2450,y:1140,w:140,h:260,active:true}];draw()");
 assert(h.calls.some(call=>call.image===r('Visuals.images.fxImpact')),'Offscreen Hannah still paints the ground eruption at its actual damaging location');
}
// Stage-two aura follows the selected, masked pose; no detached pillars.
{
 const h=fixture(),r=h.run,ctx=h.sandbox.document.getElementById('world').getContext('2d'),surfaces=[];
 const create=h.sandbox.document.createElement;
 h.sandbox.document.createElement=tag=>{if(tag!=='canvas')return create(tag);const operations=[];const paint=new Proxy({},{get:(o,key)=>o[key]||((...args)=>operations.push({key,args}))});const canvas={width:0,height:0,getContext:()=>paint,operations};surfaces.push(canvas);return canvas;};
 const stack=[];ctx.filter='none';ctx.globalAlpha=1;ctx.save=()=>stack.push({filter:ctx.filter,globalAlpha:ctx.globalAlpha});ctx.restore=()=>Object.assign(ctx,stack.pop());
 ctx.drawImage=(image,...args)=>h.calls.push({image,args,filter:ctx.filter});
 r("hannah.stage=2;hannah.echoQueue=[];hannah.hazards=[];hannah.summons=[];");
 const dark=r('Visuals.images.fxDarkMagic');
 for(const reduced of [false,true])for(const face of [-1,1])for(const sample of [
  {mode:'combat',phase:'wait',move:'combo',walkSpeed:0},
  {mode:'combat',phase:'wait',move:'combo',walkSpeed:40},
  {mode:'combat',phase:'windup',move:'jump'},
  {mode:'combat',phase:'strike',move:'jump'},
  {mode:'combat',phase:'recover',move:'combo'},
  {mode:'combat',phase:'windup',move:'summon'},
  {mode:'transform',phase:'wait',move:'combo'},
  {mode:'drain',phase:'wait',move:'combo'},
  {mode:'finisher',phase:'wait',move:'combo'}]){
  h.calls.length=0;r('Object.assign(hannah,'+JSON.stringify(sample)+');hannah.face='+face+';reducedMotion.matches='+reduced+';hannah.attackElapsed=.2;hannah.attackDuration=.8;hannah.attackFace=1');
  const before=r('JSON.stringify([hannah,player,time,levelTime])');r('HannahArt.actor(hannah)');
  const aura=h.calls[0],body=h.calls[1];assert(surfaces.includes(aura.image),'The aura is the current pose mask, not a separate smoke sprite');
  assert(aura.filter.includes('blur(')&&aura.filter.includes('drop-shadow('),'Halo is applied on the world canvas after masking');
  assert.equal(body.filter,'none','Original body colors render without the aura filter');assert(!h.calls.some(call=>call.image===dark),'No detached shadow columns remain');
  const maskDraw=aura.image.operations.find(op=>op.key==='drawImage');assert.equal(maskDraw.args[0],body.image,'Mask uses the same current pose image');assert.deepEqual(maskDraw.args.slice(1,5),body.args.slice(0,4),'Mask and body use the same frame crop');
  assert(aura.image.operations.some(op=>op.key==='clip'),'The existing outline mask prevents adjacent atlas cells leaking');
  assert(aura.image.width>body.args[2]&&aura.image.height>body.args[3],'Padding reserves space around the pose silhouette');
  assert.equal(r('JSON.stringify([hannah,player,time,levelTime])'),before,'Aura rendering never advances the encounter');
 }
 const count=surfaces.length;r('HannahArt.actor(hannah);HannahArt.actor(hannah)');assert.equal(surfaces.length,count,'Repeated poses reuse their mask');
 r("hannah.stage=2;hannah.mode='combat';hannah.phase='wait';hannah.walkSpeed=0;var firstAuraPose=ART_HANNAH.ritual.frames[0];");
 for(let i=0;i<40;i++)r('ART_HANNAH.ritual.frames[0]={...firstAuraPose};HannahArt.actor(hannah)');
 const afterMany=surfaces.length;r('ART_HANNAH.ritual.frames[0]=firstAuraPose;HannahArt.actor(hannah)');assert.equal(surfaces.length,afterMany+1,'Old masks are evicted instead of accumulating indefinitely');
 h.calls.length=0;r('hannah.stage=1;HannahArt.actor(hannah)');assert(!h.calls.some(call=>surfaces.includes(call.image)),'Phase one has no new aura');
}
// Lightning uses the existing painted bolt and stable pillar anchor, not fire.
for(const lifted of [false,true])for(const fia of [false,true]){
 const h=fixture(),r=h.run;r("initPlayer({x:1450,y:1400});HannahCombat.update(hannah,.001)");
 if(lifted){r('hannah.hp=121;HannahCombat.hit(hannah,hannah.parts[0],1e9)');h.dismiss();r('HannahEncounter.update(2.6)');}
 r("hannah.stage=2;hannah.maxHp=1600;hannah.gateIndex=2;hannah.hp=161;hannah.mode='combat';"+(fia?"flags[3].push('fiaRescued','arenaChampion','fiaTalismanCompleted');":""));
 r('HannahCombat.hit(hannah,hannah.parts[0],1e9)');h.dismiss();r('HannahEncounter.update(1)');h.calls.length=0;
 const before=r('JSON.stringify([HannahEncounter.visual(),hannah,player])');r('HannahArt.scenery()');
 assert.equal(r('JSON.stringify([HannahEncounter.visual(),hannah,player])'),before,'Rescue art never advances its story clock');
 const bolt=h.calls.find(call=>call.image===r('Visuals.images.slayerLightning'));
 assert.equal(!!bolt,!fia,'Only the lightning rescue branch draws the lightning');
 assert(!h.calls.some(call=>call.image===r('Visuals.images.fxImpact')),'The rescue never substitutes ground-fire impact art');
 if(bolt){
  const [sx,sy,sw,sh,x,y,w,height]=bolt.args,art=r('ART_SLAYER.lightning'),scale=760/art.bodyHeight,floor=1400-r('HannahEncounter.visual().lift');
  assert.deepEqual([sx,sy,sw,sh],[art.x,art.y,art.w,art.h]);
  assert.equal(x,2280+(art.x-art.anchorX)*scale);assert.equal(y,floor-175+(art.y-art.anchorY)*scale);
  assert.equal(w,art.w*scale);assert.equal(height,art.h*scale);assert(y<floor-700,'The complete vertical bolt descends from above the pillar');
 }
}
console.log('PASS: uncullable world-space Hannah warnings/impacts, continuous stage-two painted Kiba, anchored top-down Haru lightning and unchanged render state.');
