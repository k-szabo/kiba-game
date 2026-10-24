const assert=require('node:assert/strict');
const h=require('./test-harness.cjs')(),{run}=h;
assert.equal(run('typeof CampQuest'),'object','Production loader includes camp quest transitions');
assert.equal(run('CampQuest.locationId()'),null);assert.equal(run('CampQuest.isSide()'),false);
for(const id of ['samuraiCamp','forgeInterior','herbalHut','mysticTent','forestCamp','unknown','__proto__'])assert.equal(run(`CampQuest.enter('${id}')`),false,'Locked or unknown location: '+id);
run("defeated[0]=true;flags[0]=['forestBell','villageBell'];");
assert(run("CampQuest.enter('forestCamp')"));assert.equal(run('CampQuest.locationId()'),'forestCamp');assert.equal(run('CampQuest.isSide()'),false);
assert.equal(run("CampQuest.enter('samuraiCamp')"),false,'The first guardian alone cannot unlock the rescue journey');
assert.equal(run('CampQuest.talkDaichi()'),false,'Quest acceptance requires talking at Daichi');
run("initPlayer(forestCamp.npcs.find(n=>n.id==='daichi'));");assert(run('CampQuest.talkDaichi()'));assert.equal(run('state'),'dialog');assert(run("flags[0].includes('campQuestAccepted')"));h.dismiss();
run('leaveForestCamp();CampQuest.materializeRoute();CampQuest.materializeRoute();');
assert.equal(run("platforms.filter(p=>p.id.startsWith('camp-route-')).length"),4,'Quest steps never duplicate');
assert.equal(run("levels[0].platforms.some(p=>p.id.startsWith('camp-route-'))"),false,'Base guardian geometry remains untouched');
run('initPlayer(levels[0].samuraiCampEntrance);player.hp=2.5;');assert.equal(run('CampQuest.context().type'),'campRescueEnter');assert(run('CampQuest.interact(CampQuest.context())'));
assert.equal(run('CampQuest.locationId()'),'samuraiCamp');assert.equal(run('CampQuest.isSide()'),true);assert.equal(run('player.hp'),2.5,'Ordinary entries preserve fractional health');assert.equal(run('checkpoint.id'),'samuraiCampEntrance');assert(run("visitedRests[0].includes('samuraiCampEntrance')"));assert.equal(run('boss.dead'),true);
assert.equal(run("CampQuest.enter('samuraiCamp',{point:{id:'forged-checkpoint'}})"),false);
for(const id of ['forgeInterior','herbalHut','mysticTent'])assert.equal(run(`CampQuest.enter('${id}')`),false,'Services require their rescued owners');
run('initPlayer(samuraiCamp.cages[0]);');assert.equal(run('CampQuest.context().locked'),true);assert.equal(run('CampQuest.rescue(samuraiCamp.cages[0])'),false);assert.equal(run('CampQuest.interact(CampQuest.context())'),false);
// The execution is durable before the dialog, and the combat only activates
// after its final page. Death must not replay the scene.
run("initPlayer({x:3500,y:1000});var questMaster=enemies.find(e=>e.id==='campMaster');");
assert(run('CampQuest.masterScene(questMaster)'));assert.equal(run('state'),'dialog');assert(run("flags[0].includes('mayorExecuted')"));assert.equal(run('questMaster.active'),false);assert.equal(run('questMaster.face'),1,'Narrative blade faces the mayor');assert.equal(run('questMaster.x+questMaster.w/2'),run('samuraiCamp.mayor.x-70'));assert(run('questMaster.x>camera&&samuraiCamp.mayor.x+60<camera+viewW&&questMaster.y>cameraY&&samuraiCamp.mayor.y<cameraY+H'),'Both scene actors are visible in minimum viewport');assert(run('samuraiCamp.mayor.y-cameraY<H*.45'),'Scene feet stay above the bottom dialogue panel');const sceneFrozen=run('JSON.stringify({player,enemies,camera,cameraY,levelTime})');h.tick(60);assert.equal(run('JSON.stringify({player,enemies,camera,cameraY,levelTime})'),sceneFrozen);h.elements.get('dialogOk').onclick();assert.equal(run('questMaster.poseIndex'),13);h.elements.get('dialogOk').onclick();assert.equal(run('questMaster.poseIndex'),14);h.dismiss();assert.equal(run('questMaster.x'),run('questMaster.origin'));assert.equal(run('questMaster.active'),true);assert.equal(run('CampQuest.masterScene(questMaster)'),false);
run('player.hp=1;player.inv=0;damage(5,1,true);');assert(run("flags[0].includes('mayorExecuted')"));assert.equal(run('state'),'play');assert.equal(run("enemies.find(e=>e.id==='campMaster').active"),false);
run("questMaster=enemies.find(e=>e.id==='campMaster');questMaster.hp=0;CampMaster.defeat(questMaster);");
for(const id of ['smith','herbalist','enchanter']){
 run(`initPlayer(samuraiCamp.cages.find(c=>c.id==='${id}'));`);assert.equal(run('CampQuest.context().locked'),false);assert(run('CampQuest.interact(CampQuest.context())'));h.dismiss();
 assert.equal(run(`flags[0].filter(f=>f==='${id}Rescued').length`),1);assert.equal(run(`CampQuest.rescue({id:'${id}'})`),false);
}
run('player.hp=1.5;');assert(run('CampQuest.leave()'));assert.equal(run('level===levels[0]'),true);assert.equal(run('player.hp'),1.5);assert.equal(run('player.x+player.w/2'),run('levels[0].samuraiCampEntrance.x'));
assert(run("CampQuest.enter('forestCamp')"));
for(const id of ['forgeInterior','herbalHut','mysticTent']){
 run(`initPlayer(forestCamp.serviceEntrances.find(e=>e.id==='${id}'));player.hp=2.5;`);
 assert.equal(run('CampQuest.context().type'),'campServiceEnter');assert.equal(run("CampQuest.interact({type:'campServiceEnter',id:'wrong'})"),false);
 assert(run('CampQuest.interact(CampQuest.context())'));assert.equal(run('CampQuest.locationId()'),id);assert.equal(run('player.hp'),2.5);assert.equal(run('enemies.length'),0);assert.equal(run('boss.dead'),true);
 run('initPlayer(level.servicePoint);player.hp=2.5;');assert.equal(run('CampQuest.context().type'),'campServiceOpen');
 assert(run('CampQuest.leave()'));assert.equal(run('level===forestCamp'),true);assert.equal(run('player.hp'),2.5);assert.equal(run('player.x+player.w/2'),run(`forestCamp.serviceEntrances.find(e=>e.id==='${id}').x`));
}
// Every registered side checkpoint must resume inside its physical location.
for(const id of ['samuraiCamp','forgeInterior','herbalHut','mysticTent']){
 assert(run(`CampQuest.enter('${id}',{atShrine:true})`));assert.equal(run('player.hp'),run('player.maxHp'));
 run('startGame(true);');assert.equal(run('CampQuest.locationId()'),id);assert.equal(run('player.y+player.h'),run('checkpoint.y'));
}
// A scene callback retained by an old dialog cannot activate a boss after a
// developer transition has replaced its map and entity collection.
const sceneFixture=require('./test-harness.cjs')(),sceneRun=sceneFixture.run;
sceneRun("defeated[0]=true;flags[0]=['forestBell','villageBell','campQuestAccepted'];CampQuest.enter('samuraiCamp');var questMaster=enemies.find(e=>e.id==='campMaster');");assert(sceneRun('CampQuest.masterScene(questMaster)'));
const staleNext=sceneFixture.elements.get('dialogOk').onclick;assert(sceneRun("CampQuest.enter('forestCamp')"));staleNext();assert.equal(sceneRun('level===forestCamp'),true);assert.equal(sceneRun('state'),'play');assert.equal(sceneRun('questMaster.active'),false);
console.log('PASS: Daichi quest gates, conditional single-copy route, locked/rescued captives, one-time execution, death/continue checkpoints, fractional-health-preserving returns, separate services and stale-scene cancellation.');
