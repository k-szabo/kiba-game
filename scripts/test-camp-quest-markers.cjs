'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
const h=harness(),r=h.run;
r("defeated[0]=true;flags[0]=['forestBell','villageBell'];CampQuest.enter('forestCamp');initPlayer(forestCamp.npcs.find(n=>n.id==='daichi'));");
assert.equal(r("CampQuest.questMarker('daichi')"),'!');r('CampQuest.talkDaichi();');h.dismiss();assert.equal(r("CampQuest.questMarker('daichi')"),null);
r("flags[0].push('mayorExecuted','guardian:campMaster','campMasterSoul','smithRescued','herbalistRescued','enchanterRescued');");assert.equal(r("CampQuest.questMarker('daichi')"),'?');r('CampQuest.talkDaichi();');h.dismiss();assert.equal(r("CampQuest.questMarker('daichi')"),null);assert.equal(r('CampQuest.objective()'),null);
r('persist();');validate(JSON.parse(r('JSON.stringify(saved)')));r('startGame(true);');assert(r("flags[0].includes('campQuestCompleted')"));assert.equal(r("CampQuest.questMarker('daichi')"),null);
r("CampQuest.enter('herbalHut');initPlayer(level.servicePoint);");assert.equal(r("CampQuest.questMarker('herbalist')"),'!');r("CampWorkshop.open('herbal');CampWorkshop.close();");assert.equal(r("CampQuest.questMarker('herbalist')"),null);
r('campServices.herbs=3;');assert.equal(r("CampQuest.questMarker('herbalist')"),'?');r("CampWorkshop.open('herbal');CampWorkshop.action({type:'brew'});CampWorkshop.close();");assert.equal(r("CampQuest.questMarker('herbalist')"),'!','Repeatable quest becomes available after turn-in');r("CampWorkshop.open('herbal');CampWorkshop.close();");assert.equal(r("CampQuest.questMarker('herbalist')"),null);
r("CampQuest.enter('mysticTent');initPlayer(level.servicePoint);");assert.equal(r("CampQuest.questMarker('enchanter')"),'!');r("CampWorkshop.open('mystic');CampWorkshop.close();");assert.equal(r("CampQuest.questMarker('enchanter')"),null);r("flags[0].push('guardian:whiteSerpent','whiteSerpentScale');flags[1].push('serpentScale');flags[2].push('guardian:wingedSerpent','wingedSerpentScale');");assert.equal(r("CampQuest.questMarker('enchanter')"),'?');r("flags[0].push('triuneSerpentTalisman');");assert.equal(r("CampQuest.questMarker('enchanter')"),null);
const c=h.sandbox.document.getElementById('world').getContext('2d');let dash=[],lines=[];c.setLineDash=v=>{dash=[...v];};c.strokeRect=(...b)=>lines.push({b,dash:[...dash],width:c.lineWidth});r("BossCues.box({x:20,y:30,w:120,h:80},'#ffe2a0');");assert.equal(lines.length,2);assert.deepEqual(lines[0].dash,[7,6]);assert.deepEqual(lines[1].dash,lines[0].dash,'Contrast underlay must follow the same dashes, not fill the gaps');assert.deepEqual(dash,[]);
for(const id of ['forgeInterior','herbalHut','mysticTent']){
 r("state='play';CampQuest.enter('"+id+"');initPlayer(level.servicePoint);time=1;shake=0;");let translations=[];c.translate=(x,y)=>translations.push([x,y]);r('draw();');const still=JSON.stringify(translations);translations=[];r('shake=.08;draw();');assert.equal(JSON.stringify(translations),still,'Attacks do not shake '+id+' props independently of its background');
}

// CAMP-QA-01 r1: record the real label and badge geometry, not a CSS estimate.
for(const id of ['herbalHut','mysticTent'])for(const ready of [false,true])for(const pixelScale of [1,1.5]){
 const t=harness(),q=t.run,d=t.sandbox.document.getElementById('world').getContext('2d');let rects=[],circles=[];
 q("defeated[0]=true;flags[0]=['forestBell','villageBell','campQuestAccepted','mayorExecuted','guardian:campMaster','smithRescued','herbalistRescued','enchanterRescued'];CampQuest.enter('"+id+"');initPlayer(level.servicePoint);");
 if(ready)q(id==='herbalHut'?'campServices.herbs=3;':"flags[0].push('whiteSerpentScale');flags[1].push('serpentScale');flags[2].push('wingedSerpentScale');");
 d.fillRect=(...b)=>rects.push(b);d.arc=(...b)=>circles.push(b);q('CampArt.scenery();');
 const point=JSON.parse(q('JSON.stringify(level.servicePoint)')),label=rects.find(b=>Math.abs(b[0]+b[2]/2-point.x)<1&&b[3]===30),badge=circles.find(b=>b[0]===point.x&&b[2]===20);
 assert(label&&badge,'Both label and quest badge rendered');assert((label[1]-(badge[1]+badge[2]))*pixelScale>=12,'Quest badge has a visible gap above '+id+' name');
 assert.equal(q("CampQuest.questMarker('"+(id==='herbalHut'?'herbalist':'enchanter')+"')"),ready?'?':'!');
}

console.log('PASS: quest offer/active/ready/turn-in/repeat and same-release persistence, completed objective removal, Fumi ritual markers, shared contrast dashes and stable interior rendering.');
