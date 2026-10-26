'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
function setup(){
 const h=harness(),r=h.run;
 r("Prologue.stop();abilities=[true,true];defeated=[true,true,true,true];flags=[['forestBell','villageBell'],['soulUpper','soulLower'],['dawnSeal','shadowEntered'],['guardian:cultJailer','prisonOpen','guardian:prisonHunter','fiaSeen','fiaRescued','shadowAltar']];visitedRests=levels.map(map=>[map.rests[0].id]);progression=freshProgression();enterRealm(3);state='play';CampQuest.enter('shadowDen');initPlayer(level.npcs.find(n=>n.id==='fia'));resetCamera();player.inv=999;");
 return h;
}
{
 const h=setup(),r=h.run,ctx=h.sandbox.document.getElementById('world').getContext('2d');let paints=[];ctx.drawImage=(image,...args)=>paints.push({image,args});
 assert.equal(r('campNPCVisible(level.npcs[0])'),true);assert.equal(r("CampQuest.questMarker('fia')"),'!');
 const candidate=JSON.parse(r('JSON.stringify(KitsuneQuest.context())'));assert.equal(candidate.type,'fiaDenTalk');
 assert(r('ArenaChallenge.talkFia()'));h.dismiss();assert(r("flags[3].includes('arenaQuestAccepted')"));
 paints=[];r('KitsuneArt.scenery()');assert.equal(paints.filter(p=>p.image===r('Visuals.images[ART_KITSUNE.fia.image]')).length,1,'Fia is rendered before the challenge');
 r('CampQuest.enter("shadowArena");initPlayer(level.challengePoint);interact();player.inv=999;ArenaChallenge.update(45);');
 for(let round=2;round<=4;round++){
  r('interact();');h.dismiss();r('var foe=enemies.find(e=>ArenaCombat.is(e)&&!e.arenaMinion&&!e.dead);foe.active=true;foe.hp=0;killEnemy(foe);');
 }
 r('interact();');h.dismiss();r('var champion=enemies.find(e=>e.miniboss==="arenaFia");champion.active=true;champion.immuneRemaining=0;ArenaCombat.update(champion,.01);ArenaCombat.update(champion,.81);');
 assert.equal(r('champion.phase'),'exhausted');r('champion.hp=0;killEnemy(champion);');h.dismiss();assert(r("flags[3].includes('arenaChampion')"));
 r('CampQuest.enter("shadowDen");initPlayer(level.npcs.find(n=>n.id==="fia"));resetCamera();');
 assert.equal(r('campNPCVisible(level.npcs[0])'),false,'Victory hides the den copy of Fia');assert.notEqual(r('KitsuneQuest.context()?.id'),'fia');assert.equal(r("CampQuest.questMarker('fia')"),null);
 const before=r('JSON.stringify([flags,progression,coins,saved])');assert(!r('ArenaChallenge.talkFia()'),'Direct dialogue cannot revive the hidden copy');assert(!r('KitsuneQuest.interact('+JSON.stringify(candidate)+')'),'A cached pre-victory prompt cannot talk to the departed Fia');assert.equal(r('state'),'play');assert.equal(r('JSON.stringify([flags,progression,coins,saved])'),before);
 paints=[];r('KitsuneArt.scenery()');assert.equal(paints.filter(p=>p.image===r('Visuals.images[ART_KITSUNE.fia.image]')).length,0,'The den renderer uses the same presence rule');
 for(const npc of r('level.npcs.filter(n=>n.id!=="fia")'))assert(r('campNPCVisible(level.npcs.find(n=>n.id==='+JSON.stringify(npc.id)+'))'),'Other den residents remain');
 assert(r('CampQuest.enter("fiaChambers")'));r('initPlayer(level.npcs[0]);');assert.equal(r('ArenaChallenge.context()?.type'),'chambersTalk');paints=[];r('ArenaArt.scenery()');assert.equal(paints.filter(p=>p.image===r('Visuals.images[ART_KITSUNE.fia.image]')).length,1,'Fia remains visible in her chambers');
 r('persist();');assert.doesNotThrow(()=>validate(r('saved')));r('mainMenu();startGame(true);');h.dismiss();assert.equal(r('level.id'),'fiaChambers');r('CampQuest.enter("shadowDen");');assert.equal(r('campNPCVisible(level.npcs[0])'),false,'Normal save/continue preserves her new location');
 r('DevTools.open();DevSession.begin();DevTools.close();CampQuest.enter("shadowDen");');assert.equal(r('campNPCVisible(level.npcs[0])'),false,'Developer travel bypasses locks, not NPC story presence');
}
for(const fps of [30,60,120]){
 const h=harness(),r=h.run;r('DevTools.open();DevSession.begin();DevTools.close();CampQuest.enter("fiaChambers");initPlayer({x:700,y:820});player.inv=999;state="play";');
 const ctx=h.sandbox.document.getElementById('world').getContext('2d');let pictures=[],transforms=[];ctx.drawImage=(image,...args)=>pictures.push({image,args});ctx.translate=(...args)=>transforms.push(args);
 let origin;
 function checkRoom(){
  pictures=[];transforms=[];const before=r('JSON.stringify([player,enemies,projectiles,flags,time,levelTime])');r('draw()');assert.equal(r('JSON.stringify([player,enemies,projectiles,flags,time,levelTime])'),before);
  const image=r('Visuals.images[ART_ARENA.chambers.image]'),paint=pictures.find(p=>p.image===image);assert(paint,'The real draw dispatcher renders the room painting');
  const c=r('camera'),cy=r('cameraY'),anchor=[paint.args[0]+c,paint.args[1]+cy,...paint.args.slice(2)];if(!origin)origin=anchor;else for(let i=0;i<anchor.length;i++)assert(Math.abs(anchor[i]-origin[i])<1e-7,'Room furniture remains registered to the world at '+fps+' FPS');
  assert(Math.abs(transforms[0][0]+c)<1e-10&&Math.abs(transforms[0][1]+cy)<1e-10,'Normal/heavy attack shake does not shift the foreground away from furniture');
 }
 checkRoom();
 for(const action of ['attack','heavyAttack']){
  h.press({action});r('update('+1/fps+');');h.release({action});let sawShake=false;
  for(let i=0;i<Math.ceil(1.2*fps);i++){r('update('+1/fps+');');if(r('shake>0'))sawShake=true;checkRoom();}
  assert(sawShake,'The '+action+' input reached an actual attack feedback phase');
 }
 h.press({action:'moveRight'});for(let i=0;i<Math.ceil(.5*fps);i++){r('update('+1/fps+');');checkRoom();}h.release({action:'moveRight'});
 h.press({action:'jump'});r('update('+1/fps+');');h.release({action:'jump'});assert(r('player.vy<0'));
 for(let i=0;i<Math.ceil(.8*fps);i++){r('update('+1/fps+');');checkRoom();}
 r('pause();');const frozen=r('JSON.stringify([player,particles,time,camera,cameraY])');h.tick(120);assert.equal(r('JSON.stringify([player,particles,time,camera,cameraY])'),frozen);checkRoom();
}
console.log('PASS: real arena victory removes only the den Fia across rendering/context/stale dialogue/save/dev, while chambers remain usable; actual normal/heavy/move/jump inputs keep furnishings fixed at30/60/120FPS, with pause and pure rendering.');
