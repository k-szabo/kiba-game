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
// Phase-two darkness is independent of the current move, and stays behind her.
{
 const h=fixture(),r=h.run;r("hannah.stage=2;hannah.echoQueue=[];hannah.hazards=[];hannah.summons=[];");
 const dark=r('Visuals.images.fxDarkMagic');
 const placements=[];h.sandbox.document.getElementById('world').getContext('2d').translate=(x,y)=>placements.push({x,y});
 for(const reduced of [false,true])for(const mode of ['combat','drain','finisher'])for(const phase of ['wait','windup','strike','recover']){
  h.calls.length=0;placements.length=0;r(`reducedMotion.matches=${reduced};hannah.mode='${mode}';hannah.phase='${phase}';hannah.move='jump';hannah.attackElapsed=.2;hannah.attackDuration=.8;hannah.attackFace=1;HannahArt.actor(hannah)`);
  const aura=h.calls.findIndex(call=>call.image===dark&&call.args[0]===512&&call.args[1]===59);
  const body=h.calls.findIndex(call=>call.image!==dark);
  assert(aura>=0&&body>aura,'Dark Kiba is painted behind every live phase-two pose');
  const plumes=h.calls.filter(call=>call.image===dark&&call.args[0]===512&&call.args[1]===59);
  assert.equal(plumes.length,3,'Centre and two flanks surround the silhouette');
  assert(body>h.calls.findLastIndex(call=>call.image===dark&&call.args[0]===512&&call.args[1]===59),'Every plume stays behind the face, weapon and wings');
  const bounds=r('({x:hannah.x,y:hannah.y,w:hannah.w,h:hannah.h})');
  assert(placements.slice(0,3).some(p=>p.x<bounds.x)&&placements.slice(0,3).some(p=>p.x>bounds.x+bounds.w),'Side plumes extend beyond the body instead of disappearing behind it');
  for(const plume of plumes.slice(1)){
   const top=bounds.y+bounds.h+5+plume.args[5],bottom=top+plume.args[7];
   assert(top<bounds.y&&bottom>=bounds.y+bounds.h,'Side plume covers upper and lower body height');
  }
 }
 h.calls.length=0;r("hannah.stage=1;HannahArt.actor(hannah)");assert(!h.calls.some(call=>call.image===dark),'Phase one keeps its original appearance');
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
