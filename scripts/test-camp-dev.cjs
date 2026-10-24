'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const copy=value=>JSON.parse(JSON.stringify(value));
const snapshot=h=>({saved:h.run('JSON.stringify(saved)'),writes:h.run('JSON.stringify(__saveSnapshots)'),storage:JSON.stringify([...h.storage])});
function begin(h){assert(h.run('DevTools.open()'));assert(h.run('DevSession.begin()'));}
function field(h,id){const find=node=>node.id===id?node:(node.children||[]).map(find).find(Boolean);return find(h.elements.get('devToolsList'));}
function progress(h){return h.run('JSON.stringify({flags,defeated,progression,coins,shards,campServices})');}
{
 const h=harness(),r=h.run;r("defeated[0]=true;flags[0]=['forestBell','villageBell','campQuestAccepted','mayorExecuted','guardian:campMaster','smithRescued','herbalistRescued','enchanterRescued','herbalistQuestAccepted'];campServices.ownedWeapons=['katana','naginata'];campServices.weaponRank=3;campServices.armorRank=2;campServices.herbs=6;campServices.potions=2;persist();");
 const normal=snapshot(h),equipment=r('JSON.stringify(campServices)');r('mainMenu();campServices.herbs=999;');begin(h);
 assert.equal(r('JSON.stringify(campServices)'),equipment,'Menu entry clones normal saved equipment rather than stale runtime stocks');
 assert(r('campServices!==saved.campServices&&campServices.ownedWeapons!==saved.campServices.ownedWeapons'),'Service state and weapon ownership cannot alias the normal save');
 r("campServices.ownedWeapons.push('swordShield');campServices.herbs++;campServices.weaponRank++;persist();");assert.deepEqual(snapshot(h),normal);
 r('DevSession.end();');assert.equal(r('JSON.stringify(campServices)'),equipment,'Ending a test restores normal equipment');assert.deepEqual(snapshot(h),normal);
 r('startGame(true);');assert.equal(r('JSON.stringify(campServices)'),equipment,'Continuing the normal run restores exact purchases');
 const live=r('JSON.stringify({player,enemies,checkpoint,campServices})');r('var liveCampServices=campServices;');begin(h);
 assert.equal(r('JSON.stringify({player,enemies,checkpoint,campServices})'),live,'Live entry preserves the current encounter and equipment values');assert(r('campServices!==liveCampServices&&campServices.ownedWeapons!==liveCampServices.ownedWeapons'),'Live service state is also independently cloned');
}
{
 const h=harness(),r=h.run;r("mainMenu();saved=null;campServices.herbs=999;campServices.ownedWeapons=['katana','naginata'];__saveSnapshots.length=0;");h.storage.clear();const normal=snapshot(h);begin(h);
 assert.equal(r('JSON.stringify(campServices)'),JSON.stringify({ownedWeapons:['katana'],weaponRank:0,armorRank:0,herbs:0,potions:0}),'No-save test receives fresh equipment');
 r('campServices.potions=50;persist();DevSession.end();');assert.deepEqual(snapshot(h),normal);
}
{
 const h=harness(),r=h.run,normal=snapshot(h);begin(h);
 const realmField=field(h,'dev-teleport-realm');assert(realmField);
 for(const id of ['samuraiCamp','forgeInterior','herbalHut','mysticTent'])assert(realmField.children.some(option=>option.value===id),'Missing developer destination '+id);
 for(const id of ['forestCamp','samuraiCamp','forgeInterior','herbalHut','mysticTent']){
  const rests=copy(r('SIDE_LOCATIONS['+JSON.stringify(id)+'].map.rests'));
  for(const rest of rests){
   assert(r('DevTeleport.teleport({realm:'+JSON.stringify(id)+',rest:'+JSON.stringify(rest.id)+'})'),'Every authored side shrine can be selected');
   assert.equal(r('level.id'),id);assert.equal(r('realm'),0);assert.equal(r('checkpoint.id'),rest.id);assert.equal(r('player.x+player.w/2'),rest.x);assert.equal(r('player.y+player.h'),rest.y);assert(r('player.onGround'));
   assert.equal(r('state'),'developer');assert.equal(r('DevTools.returnState'),'play');assert.equal(r('Prologue.active'),false);
   assert(r('visitedRests[0].includes('+JSON.stringify(rest.id)+')'));
   const before=r('JSON.stringify({level:level.id,player,checkpoint,flags,campServices})');assert(!r('DevTeleport.teleport({realm:'+JSON.stringify(id)+',rest:"missing"})'));assert.equal(r('JSON.stringify({level:level.id,player,checkpoint,flags,campServices})'),before);
  }
 }
 assert.deepEqual(snapshot(h),normal,'Side-area development travel never writes normal progress');
 r("DevTeleport.teleport({realm:'dream',rest:'dream'});");assert(r('Prologue.active'));assert(r("DevTeleport.teleport({realm:'samuraiCamp',rest:'samuraiCampEntrance'})"));assert(!r('Prologue.active'));
 assert(!r("DevBoss.revive({encounter:'main'})"),'Optional camp must not revive Japan guardian');
 const before=progress(h);assert(r("DevBoss.revive({encounter:'campMaster'})"));
 assert(r("enemies.some(enemy=>enemy.id==='campMaster'&&enemy.replay&&enemy.active&&!enemy.dead&&enemy.hp===enemy.maxHp)"));assert(r('player.onGround'));assert.equal(progress(h),before);
 r("var campReplay=enemies.find(enemy=>enemy.id==='campMaster');CampMaster.reset(campReplay);state='play';CampMaster.update(campReplay,.1);");
 assert.equal(r('state'),'play','Replay does not open the real execution dialogue');assert(!r("flags[0].includes('mayorExecuted')"));
 r('campReplay.hp=0;killEnemy(campReplay);');assert.equal(progress(h),before,'First replay must not award quest flags, coins or XP');
 r("state='developer';");assert(r('DevBoss.revive()'),'Default camp replay resolves to the camp encounter');
 r("flags[0].push('mayorExecuted','guardian:campMaster');");const claimed=progress(h);
 assert(r("DevBoss.revive({encounter:'campMaster'})"));r("{const enemy=enemies.find(candidate=>candidate.id==='campMaster');enemy.hp=0;killEnemy(enemy);}");assert.equal(progress(h),claimed,'Already-completed encounter replay cannot duplicate rewards');
 for(const id of ['forestCamp','forgeInterior','herbalHut','mysticTent']){
  assert(r('DevTeleport.teleport({realm:'+JSON.stringify(id)+',rest:SIDE_LOCATIONS['+JSON.stringify(id)+'].map.rests[0].id})'));
  assert(!r("DevBoss.revive({encounter:'campMaster'})"),'Camp Master replay is restricted to its map');assert(!r('DevBoss.revive()'),'Safe interiors do not expose a placeholder guardian');
 }
 assert.deepEqual(snapshot(h),normal);
}
// The service overlay resumes when merely inspected and is discarded on travel.
{
 const h=harness(),r=h.run;begin(h);r("DevTeleport.teleport({realm:'forgeInterior',rest:'forgeInterior'});DevTools.close();initPlayer(forgeInterior.servicePoint);");assert(r("CampWorkshop.open('forge')"));
 assert.equal(r('state'),'campService');assert(!h.elements.get('campService').hidden);
 h.elements.get('closeCampService').focus=()=>{h.sandbox.document.activeElement=h.elements.get('closeCampService');};
 h.elements.get('closeCampService').id='closeCampService';
 const frozen=r('JSON.stringify({player,enemies,projectiles,time,levelTime,campServices})');assert(r('DevTools.open()'));assert(h.elements.get('campService').hidden);h.tick(120);
 r('DevTools.close();');assert.equal(r('state'),'campService');assert(!h.elements.get('campService').hidden);assert.equal(r('JSON.stringify({player,enemies,projectiles,time,levelTime,campServices})'),frozen);assert.equal(h.sandbox.document.activeElement.id,'closeCampService');
 assert(r('DevTools.open()'));assert(r("DevTeleport.teleport({realm:'herbalHut',rest:'herbalHut'})"));r('DevTools.close();');assert.equal(r('state'),'play');assert(h.elements.get('campService').hidden);assert(!r("CampWorkshop.action({type:'forgeArmor'})"),'Old service callbacks cannot transact after travel');
}
// Normal confirmed selection owns only its chosen style; dev equip grants in-memory ownership.
for(const style of ['katana','naginata','swordShield']){
 const h=harness({prologue:true}),r=h.run;r('Prologue.wake();');h.dismiss();
 // harness dismiss confirms the default; start another awakening for the explicit choice.
 r('startGame(false);Prologue.wake();');for(let i=0;r("state==='dialog'")&&i<10;i++)h.elements.get('dialogOk').onclick();
 assert.equal(r('state'),'weaponSelection');r('WeaponSelection.select('+JSON.stringify(style)+');');assert(r('WeaponSelection.confirm()'));assert.equal(r('campServices.ownedWeapons.length'),1);assert.equal(r('campServices.ownedWeapons[0]'),style);assert.equal(r('saved.campServices.ownedWeapons[0]'),style);
 const normal=snapshot(h);begin(h);for(const next of ['katana','naginata','swordShield']){assert(r('DevWeapons.equip({weapon:'+JSON.stringify(next)+'})'));assert(r('campServices.ownedWeapons.includes('+JSON.stringify(next)+')'));}
 assert.equal(r('new Set(campServices.ownedWeapons).size'),r('campServices.ownedWeapons.length'));assert.deepEqual(snapshot(h),normal);r('DevSession.end();');assert.equal(r('campServices.ownedWeapons[0]'),style);assert.equal(r('campServices.ownedWeapons.length'),1);
}
console.log('PASS: five side-location shrine teleports, Camp Master-only replay without rewards, service overlay suspension/focus/stale actions, deep developer save isolation and confirmed/dev weapon ownership.');
