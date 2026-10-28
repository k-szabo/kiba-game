'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
function setup({hunter=true,altar=true}={}){
 const h=harness(),r=h.run;
 r("Prologue.stop();abilities=[false,false];defeated=[true,true,true,false];flags=[['forestBell','villageBell'],['soulUpper','soulLower'],['dawnSeal','shadowEntered'],['guardian:cultJailer','prisonOpen']];visitedRests=levels.map(map=>[map.rests[0].id]);progression=freshProgression();enterRealm(3);state='play';CampQuest.enter('shadowPrison');player.inv=999;");
 if(hunter)r("flags[3].push('guardian:prisonHunter');enemies.find(PrisonHunter.is).dead=true;");
 if(altar)r("flags[3].push('shadowAltar');");
 return h;
}
const has=(r,id)=>r('flags[3].includes('+JSON.stringify(id)+')');
function see(h){h.run('initPlayer(level.fia);KitsuneQuest.update(1/60);');assert(has(h.run,'fiaSeen'));}
function exit(h){h.run('initPlayer(level.returnPoint);interact();');assert.equal(h.run('level.id'),'shadowRealm');}
{
 const h=setup({hunter:false}),r=h.run;r('initPlayer(level.fia);KitsuneQuest.update(1/60);');assert(!has(r,'fiaSeen'));assert.equal(r('getContext().locked'),true);r('interact()');assert(!has(r,'fiaRescued'));exit(h);assert(has(r,'fiaMissed'));
}
{
 const h=setup(),r=h.run;exit(h);assert(has(r,'fiaMissed'),'First deliberate prison departure forfeits Fia even before reaching her cell');
}
{
 const h=setup(),r=h.run;see(h);
 r('initPlayer(level.rests[2]);revive();');assert.equal(r('level.id'),'shadowPrison');assert(has(r,'fiaSeen'));assert(!has(r,'fiaMissed'),'Death preserves rescue opportunity');
 r('interact();');assert(!has(r,'fiaMissed'),'Shrine rest preserves rescue opportunity');
 r('persist();mainMenu();startGame(true);');assert.equal(r('level.id'),'shadowPrison');assert(has(r,'fiaSeen'));assert(!has(r,'fiaMissed'),'Menu and same-release reload are not departures');
 assert.doesNotThrow(()=>validate(r('saved')));
 r("state='map';");assert(!r("fastTravel({id:'not-a-rest'},0)"));assert(!has(r,'fiaMissed'),'Failed travel is not departure');
 assert(r("fastTravel(shadowPrison.rests[0],3)"));assert(!has(r,'fiaMissed'),'Travel inside the same prison is not departure');
 exit(h);assert(has(r,'fiaMissed'));assert(!has(r,'fiaRescued'));assert.doesNotThrow(()=>validate(r('saved')));
 r("CampQuest.enter('shadowPrison');initPlayer(level.fia);");assert.notEqual(r('getContext()?.type'),'fiaRescue');r('KitsuneQuest.update(1/60);persist();mainMenu();startGame(true);');assert(has(r,'fiaMissed'));assert(!has(r,'fiaRescued'));
}
{
 const h=setup(),r=h.run;see(h);r("state='map';");assert(r('fastTravel(levels[0].rests[0],0)'));assert(has(r,'fiaMissed'),'Cross-realm fast travel closes a seen, unrescued encounter');assert.doesNotThrow(()=>validate(r('saved')));
}
{
 const h=setup({altar:false}),r=h.run;see(h);r("state='map';");assert(!r('fastTravel(levels[0].rests[0],0)'));assert(!has(r,'fiaMissed'),'A locked shadow travel attempt cannot lose Fia');
}
{
 const h=setup(),r=h.run;r('initPlayer(level.fia);interact();');assert(has(r,'fiaSeen'));assert(has(r,'fiaRescued'));assert(!has(r,'fiaMissed'));assert.equal(r('state'),'dialog');assert.equal(r('KitsuneQuest.departure'),null);assert.doesNotThrow(()=>validate(r('saved')));
 const frozen=r('JSON.stringify([player,enemies,levelTime,flags])');h.tick(60);assert.equal(r('JSON.stringify([player,enemies,levelTime,flags])'),frozen);
 h.dismiss();assert(r('KitsuneQuest.departure!==null'));
 r('KitsuneQuest.update(.4);');const progress=r('JSON.stringify(KitsuneQuest.departure)');r("state='pause';KitsuneQuest.update(1);");assert.equal(r('JSON.stringify(KitsuneQuest.departure)'),progress,'Transformation clock freezes in pause');
 r("state='play';KitsuneQuest.update(1);");assert(r('KitsuneQuest.departure.elapsed>1'));r('KitsuneQuest.update(2);');assert.equal(r('KitsuneQuest.departure'),null);
 exit(h);assert(!has(r,'fiaMissed'),'Rescue is terminal even after departure');
 r("defeated[3]=true;CampQuest.enter('shadowDen');");assert.equal(r('level.id'),'shadowDen');assert.equal(r('realm'),3);assert(r("campNPCVisible(level.npcs.find(n=>n.id==='fia'))"));assert.equal(r('nextObjective().text'),'fia.den.objective');assert.doesNotThrow(()=>validate(r('saved')));
 r("initPlayer(level.npcs.find(n=>n.id==='fia'));interact();");assert.equal(r('state'),'dialog');h.dismiss();r('initPlayer(level.returnPoint);interact();');assert.equal(r('level.id'),'shadowRealm');assert.equal(r('player.y+player.h'),1200);
}
{
 const h=setup(),r=h.run;assert(!r("CampQuest.enter('shadowDen')"),'Normal hub access requires the Mad Priest victory');see(h);exit(h);r("defeated[3]=true;");assert(!r("CampQuest.enter('shadowDen')"),'Missed rescue keeps the den locked');assert.equal(r('level.id'),'shadowRealm');assert.doesNotThrow(()=>validate(r('saved')));
}
{
 const h=setup(),r=h.run;see(h);r('persist();');const original=JSON.parse(JSON.stringify(r('saved')));
 for(const list of [['fiaSeen'],['guardian:prisonHunter','fiaRescued'],['guardian:prisonHunter','fiaSeen','fiaRescued','fiaMissed']]){
  const bad=JSON.parse(JSON.stringify(original));bad.flags[3]=['guardian:cultJailer','prisonOpen','shadowAltar',...list];assert.throws(()=>validate(bad),/kitsune/);
 }
 const bad=JSON.parse(JSON.stringify(original));bad.flags[3]=bad.flags[3].filter(f=>f!=='prisonOpen');assert.throws(()=>validate(bad));
}
{
 const h=harness(),r=h.run,normal=r('JSON.stringify(saved)'),writes=r('window.__saveSnapshots.length');
 r('DevTools.open();DevSession.begin();');assert(r("DevTeleport.teleport({realm:'shadowPrison',rest:'shadowPrisonDepths'})"));assert(r("DevBoss.revive({encounter:'prisonHunter'})"));const before=r('JSON.stringify([flags,coins,progression.totalXp])');
 r("DevTools.close();var hunter=enemies.find(PrisonHunter.is);hunter.hp=0;killEnemy(hunter);");assert.equal(r('JSON.stringify([flags,coins,progression.totalXp])'),before,'Replay does not grant rewards or rescue prerequisites');
 r('DevTools.open();');assert(r("DevTeleport.teleport({realm:'shadowDen',rest:'shadowDenCamp'})"));assert.equal(r('level.id'),'shadowDen');r('DevSession.end();');assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('window.__saveSnapshots.length'),writes);
}
console.log('PASS: Fia locked/rescued/missed states, deliberate exits vs death/rest/reload, failed/same-map travel, paused transformation, optional hub and strict saves, dev teleport/replay isolation.');
