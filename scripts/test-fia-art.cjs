'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),setup=require('./test-fia-fixture.cjs');
const h=setup(),r=h.run,art=JSON.parse(r('JSON.stringify(ART_FIA)')),manifest=r('ART_MANIFEST');
function png(key){const b=fs.readFileSync(path.resolve(__dirname,'..',manifest[key]));assert.equal(b[25],6,'Original RGBA alpha remains intact');return {w:b.readUInt32BE(16),h:b.readUInt32BE(20)};}
for(const role of ['ninja','thief']){
 const spec=art[role],size=png(spec.image);assert.equal(spec.frames.length,6);
 for(const frame of spec.frames){assert(frame.x>=0&&frame.y>=0&&frame.x+frame.w<=size.w&&frame.y+frame.h<=size.h);assert(frame.outlines.length>0);assert.equal(frame.bodyHeight,spec.frames[0].bodyHeight);assert(Math.abs(frame.visibleBounds[3]-frame.anchorY)<12,'Ground registration follows actual feet');}
}
for(const definition of Object.values(art.effects)){const size=png(definition.image);assert.equal(definition.frames.length,4);for(const frame of definition.frames){assert(frame.x+frame.w<=size.w&&frame.y+frame.h<=size.h);assert.equal(frame.w,frame.h);assert(frame.visibleBounds[0]>frame.x+15&&frame.visibleBounds[2]<frame.x+frame.w-15);}}
for(const id of ['priestessTalisman','roastChicken','kitsuneSoul']){const frame=r('ART_INVENTORY.items['+JSON.stringify(id)+']'),size=png(frame.image);assert.equal(frame.realm,3);assert(frame.x>=0&&frame.y>=0&&frame.x+frame.w<=size.w&&frame.y+frame.h<=size.h);}
r("var npc=level.npcs[0];initPlayer({x:npc.x-200,y:npc.y});FiaConflict.provoke({x:npc.x-35,y:npc.y-130,w:70,h:130});");h.dismiss();r('var fury=FiaConflict.enemy;');
const ctx=h.sandbox.document.getElementById('world').getContext('2d');let calls=[];ctx.drawImage=(image,...args)=>{assert(args.every(Number.isFinite));calls.push({image,args});};
const snapshot=()=>r('JSON.stringify([player,enemies,projectiles,flags,progression,time,FiaCombat.status(),FiaConflict.shield,FiaConflict.recharge])');
for(const pose of [0,1,2,3,4,5,6,7])for(const face of [-1,1]){
 r('fury.poseIndex='+pose+';fury.face='+face+';fury.phase="recover";fury.move=null;fury.walkSpeed=0;');calls=[];const before=snapshot();assert(r('FiaArt.actor(fury)'));assert.equal(snapshot(),before);assert.equal(calls.length,1);
}
for(const move of ['teleport','foxfire','drain','charm','sigils']){
 r('fury.move='+JSON.stringify(move)+';fury.phase="windup";fury.attackBoxes=[{x:900,y:700,w:200,h:120}];fury.targetX=900;fury.targetY=780;');const before=snapshot();assert.doesNotThrow(()=>r('FiaArt.actor(fury)'));assert.equal(snapshot(),before);
}
r('flags[3].push("kibaShield");FiaConflict.resetPlayer();');for(const reduced of [false,true]){r('reducedMotion.matches='+reduced);calls=[];const before=snapshot();r('drawPlayer()');assert.equal(snapshot(),before);assert(calls.some(c=>c.image===r('Visuals.images.kibaShield')),'The passive paints its native shell');}
r('flags[3]=flags[3].filter(x=>x!=="kibaShield");fury.hp=0;FiaCombat.defeat(fury);');h.dismiss();
for(const role of ['shadowNinja','shadowThief'])for(const phase of ['idle','walk','windup','strike','recover']){
 r("CampQuest.enter('shadowDen');var resident=enemies.find(e=>e.denResidentRole==="+JSON.stringify(role)+');resident.walkSpeed='+(phase==='walk'?80:0)+';resident.windup='+(phase==='windup'?1:0)+';resident.attackTime='+(phase==='strike'?1:0)+';resident.recovery='+(phase==='recover'?1:0)+';');calls=[];const before=snapshot();assert(r('FiaArt.actor(resident)'));assert.equal(snapshot(),before);assert.equal(calls.length,1);assert.equal(calls[0].image,r('Visuals.images['+JSON.stringify(role==='shadowNinja'?'denNinja':'denThief')+']'));
}
console.log('PASS: complete12 resident silhouettes,20 native alpha VFX frames and3 bounded high-contrast item crops, reused Fia body poses, pure paused/reduced-motion rendering and native hostile-resident dispatch. Browser QA verifies visible continuity.');
