'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
function setup({rescued=true,accepted=true}={}){
 const h=harness(),r=h.run;
 r("Prologue.stop();abilities=[true,true];defeated=[true,true,true,true];flags=[['forestBell','villageBell'],['soulUpper','soulLower'],['dawnSeal','shadowEntered'],['guardian:cultJailer','prisonOpen','guardian:prisonHunter','fiaSeen','shadowAltar']];visitedRests=levels.map(map=>[map.rests[0].id]);progression=freshProgression();enterRealm(3);state='play';");
 if(rescued)r("flags[3].push('fiaRescued');");else r("flags[3].push('fiaMissed');");
 assert(r("CampQuest.enter('shadowDen')"));
 if(accepted){assert(rescued);r("initPlayer(level.npcs.find(n=>n.id==='fia'));interact();");h.dismiss();}
 return h;
}
const has=(r,id)=>r('flags[3].includes('+JSON.stringify(id)+')');
function enterArena(h){h.run('initPlayer(level.arenaEntrance);interact();');assert.equal(h.run('level.id'),'shadowArena');}
function start(h){h.run('initPlayer(level.challengePoint);interact();player.inv=999;');assert.equal(h.run('ArenaChallenge.attempt?.round'),1);}
function timer(h,seconds,fps=120){h.run('for(let i=0;i<'+Math.ceil(seconds*fps)+';i++)ArenaChallenge.update('+1/fps+');');}
function next(h){h.run('interact();');h.dismiss();assert.equal(h.run('ArenaChallenge.attempt.status'),'fighting');}
function winBoss(h){const r=h.run;r('var foe=enemies.find(e=>ArenaCombat.is(e)&&!e.dead);foe.active=true;foe.hp=0;killEnemy(foe);');}
function throughGuards(h){start(h);timer(h,45);for(let round=2;round<=4;round++){next(h);assert.equal(h.run('ArenaChallenge.attempt.round'),round);winBoss(h);}assert.equal(h.run('ArenaChallenge.attempt.status'),'between');}
{
 const h=setup({rescued:false,accepted:false}),r=h.run;
 assert(!r("CampQuest.enter('shadowArena')"),'Missing rescue locks arena');assert(!r("CampQuest.enter('fiaChambers')"));
 r('initPlayer(level.arenaEntrance);');assert.notEqual(r('getContext()?.type'),'arenaEnter');assert(!r('ArenaChallenge.talkFia()'));assert(!has(r,'arenaQuestAccepted'));
}
{
 const h=setup({accepted:false}),r=h.run;assert(!r("CampQuest.enter('shadowArena')"));
 assert.equal(r("CampQuest.questMarker('fia')"),'!');r("initPlayer(level.npcs.find(n=>n.id==='fia'));interact();");assert.equal(r('state'),'dialog');assert(has(r,'arenaQuestAccepted'));assert.equal(r("CampQuest.questMarker('fia')"),null);
 const flags=r('JSON.stringify(flags)');h.dismiss();r('interact();');h.dismiss();assert.equal(r('JSON.stringify(flags)'),flags,'Repeated quest talk is idempotent');enterArena(h);assert.doesNotThrow(()=>validate(r('saved')));
}
for(const fps of [30,60,120]){
 const h=setup(),r=h.run;enterArena(h);start(h);timer(h,.9,fps);assert(r('enemies.some(e=>e.arenaMinion&&!e.dead)'),'Survival wave creates real minions after portal warning');
 assert(r('enemies.every(e=>e.arenaMinion&&e.noReward)'));assert(r('enemies.length<=4'));
 const xp=r('progression.totalXp'),money=r('coins');r('for(const enemy of [...enemies])killEnemy(enemy);');assert.equal(r('progression.totalXp'),xp,'Arena survival enemies grant no XP');assert.equal(r('coins'),money,'Survival mobs cannot farm coins');
 timer(h,43.9,fps);assert.equal(r('ArenaChallenge.attempt.status'),'fighting');timer(h,.2,fps);assert.equal(r('ArenaChallenge.attempt.status'),'between');assert.equal(r('ArenaChallenge.attempt.clock'),0);assert.equal(r('enemies.length'),0);
 next(h);assert.equal(r('ArenaChallenge.attempt.round'),2);assert.equal(r('enemies.filter(ArenaCombat.is).length'),1);
}
{
 const h=setup(),r=h.run;enterArena(h);start(h);timer(h,.3);
 for(const state of ['pause','dialog','inventory','developer','map']){
  r('state='+JSON.stringify(state));const before=r('JSON.stringify([ArenaChallenge.attempt,enemies,projectiles,player])');timer(h,2);assert.equal(r('JSON.stringify([ArenaChallenge.attempt,enemies,projectiles,player])'),before,'Challenge freezes in '+state);
 }
 r("state='play';player.x=0;ArenaChallenge.update(.01);");assert(r('player.x>=level.arena.x'),'Active fight confines player to arena');
 assert(!r('ArenaChallenge.interact({type:"arenaReturn"})'),'Return cannot bypass active fight');
}
{
 const h=setup(),r=h.run;enterArena(h);throughGuards(h);
 for(const id of ['arenaRewardCaptain','arenaRewardSerpent','arenaSerpentScale','arenaRewardGuards'])assert(has(r,id));
 assert.equal(r('progression.totalXp'),1400);assert.doesNotThrow(()=>validate(r('saved')));
 const permanent=r('JSON.stringify([flags,progression])');r('revive();');assert.equal(r('ArenaChallenge.attempt'),null);assert.equal(r('enemies.length'),0);assert.equal(r('JSON.stringify([flags,progression])'),permanent,'Death resets attempt, preserving earned rewards');
 throughGuards(h);assert.equal(r('progression.totalXp'),1400,'Retrying rewarded encounters never grants XP again');assert.equal(r("flags[3].filter(f=>f==='arenaSerpentScale').length"),1);
 next(h);assert.equal(r('ArenaChallenge.attempt.round'),5);r('var finalFia=enemies.find(e=>e.miniboss==="arenaFia");');assert(r('ArenaCombat.protects(finalFia)'));assert.equal(r('finalFia.hp'),1);
 r('player.x=finalFia.x-25;player.y=finalFia.y;player.face=1;');h.press({action:'heavyAttack'});r('input(1/120);pressed.clear();for(let i=0;i<80;i++){updatePlayerTimers(1/120);advanceSwordAttack(1/120);}');h.release({action:'heavyAttack'});assert(r('attackHit'));assert.equal(r('finalFia.hp'),1,'Normal sword pipeline cannot skip immunity');
 // Keep the player on the actual arena floor; tick the real enemy dispatcher once per frame.
 r('player.y=level.arena.y-player.h;player.x=1200;player.inv=999;');r('for(let i=0;i<90*120;i++)updateEnemies(1/120);');assert.equal(r('finalFia.phase'),'fall');r('for(let i=0;i<100;i++)updateEnemies(1/120);');assert.equal(r('finalFia.phase'),'exhausted');
 assert(r('ArenaCombat.hit(finalFia,{...finalFia},2,"heavy")>0'));assert(has(r,'arenaChampion'));assert(r('finalFia.spared&&finalFia.dead'));assert.equal(r('progression.totalXp'),1400,'Fia grants no XP');assert.equal(r('state'),'dialog');
 h.dismiss();assert(r('ArenaChallenge.departure!==null'));const frozen=r('JSON.stringify(ArenaChallenge.departure)');r("state='pause';ArenaChallenge.update(5);");assert.equal(r('JSON.stringify(ArenaChallenge.departure)'),frozen);r("state='play';ArenaChallenge.update(2.5);");assert.equal(r('ArenaChallenge.departure'),null);
 assert(!r('ArenaChallenge.start()'),'Normal journey cannot replay a won challenge');assert.doesNotThrow(()=>validate(r('saved')));
 r('initPlayer(level.returnPoint);interact();');assert.equal(r('level.id'),'shadowDen');assert.equal(r('Math.round(player.x+player.w/2)'),430);r('initPlayer(level.chambersEntrance);interact();');assert.equal(r('level.id'),'fiaChambers');assert.doesNotThrow(()=>validate(r('saved')));
 r('initPlayer(level.npcs[0]);interact();');assert.equal(r('state'),'dialog');h.dismiss();r('initPlayer(level.returnPoint);interact();');assert.equal(r('level.id'),'shadowDen');assert.equal(r('Math.round(player.x+player.w/2)'),2470);
}
{
 const h=setup(),r=h.run;enterArena(h);start(h);timer(h,45);next(h);winBoss(h);const earned=r('progression.totalXp');r('persist();mainMenu();startGame(true);');assert.equal(r('level.id'),'shadowArena');assert.equal(r('ArenaChallenge.attempt'),null);assert(has(r,'arenaRewardCaptain'));assert.equal(r('progression.totalXp'),earned,'Same-release continue retains only persistent rewards');
 start(h);assert.equal(r('ArenaChallenge.attempt.round'),1);r('initPlayer(level.rests[0]);interact();');assert.equal(r('ArenaChallenge.attempt'),null,'Reinitialization/rest cancels attempt, never preserves partial combat state');assert(has(r,'arenaRewardCaptain'));
 r('initPlayer(level.returnPoint);interact();');assert.equal(r('level.id'),'shadowDen');assert(has(r,'arenaRewardCaptain'));
}
{
 const h=setup(),r=h.run;enterArena(h);throughGuards(h);r('persist();');const valid=JSON.parse(JSON.stringify(r('saved')));assert.doesNotThrow(()=>validate(valid));
 for(const removed of ['arenaQuestAccepted','arenaRewardCaptain','arenaRewardSerpent','arenaSerpentScale','fiaRescued']){const bad=JSON.parse(JSON.stringify(valid));bad.flags[3]=bad.flags[3].filter(id=>id!==removed);assert.throws(()=>validate(bad),undefined,'Reject broken arena chain: '+removed);}
 const bad=JSON.parse(JSON.stringify(valid));bad.flags[3].push('arenaChampion');bad.flags[3]=bad.flags[3].filter(id=>id!=='arenaRewardGuards');assert.throws(()=>validate(bad),/arena/);
}
{
 const h=harness(),r=h.run;const normal=r('JSON.stringify(saved)'),writes=r('window.__saveSnapshots.length');r('DevTools.open();DevSession.begin();');
 assert(r("DevTeleport.teleport({realm:'shadowArena',rest:'shadowArenaEntrance'})"));
 for(const encounter of ['arenaCaptain','arenaSerpent','arenaCyclops','arenaFia']){
  assert(r('DevBoss.revive({encounter:'+JSON.stringify(encounter)+'})'));r('DevTools.close();var replay=enemies.find(e=>ArenaCombat.is(e)&&!e.dead);player.inv=999;');assert(r('replay.replay'));const before=r('JSON.stringify([flags,coins,progression.totalXp])');
  if(encounter==='arenaFia')r('replay.phase="exhausted";replay.immuneRemaining=0;');r('replay.active=true;replay.hp=0;killEnemy(replay);');assert.equal(r('JSON.stringify([flags,coins,progression.totalXp])'),before,'Dev replay is reward-free: '+encounter);assert.equal(r('ArenaChallenge.attempt'),null);r('DevTools.open();');
 }
 assert(r("DevTeleport.teleport({realm:'fiaChambers',rest:'fiaChambersRest'})"));assert.equal(r('level.id'),'fiaChambers');r('DevSession.end();');assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('window.__saveSnapshots.length'),writes,'Dev actions write no normal saves');
}

// Newly registered rooms must use the same movement timers as the normal realms and dream.
for(const fps of [30,60,120])for(const [destination,rest] of [['shadowArena','shadowArenaEntrance'],['fiaChambers','fiaChambersRest'],['dream','dream']]){
 const h=harness(),r=h.run;r('DevTools.open();DevSession.begin();DevAbilities.acquire({ability:"double-jump"});DevAbilities.acquire({ability:"dash"});');
 assert(r('DevTeleport.teleport({realm:'+JSON.stringify(destination)+',rest:'+JSON.stringify(rest)+'})'));r('DevTools.close();player.inv=999;');
 const dt=1/fps,tick=seconds=>r('for(let i=0;i<'+Math.ceil(seconds*fps)+';i++)update('+dt+');');
 h.press({action:'jump'});tick(dt);h.release({action:'jump'});tick(.16);h.press({action:'jump'});tick(dt);h.release({action:'jump'});
 assert.equal(r('player.jumps'),2,destination+' supports a real second jump at '+fps+'fps');
 h.press({action:'dash'});tick(dt);h.release({action:'dash'});assert(r('dash>0'));
 tick(.3);assert.equal(r('dash'),0,destination+' dash ends normally at '+fps+'fps');assert(r('player.vy>0'),'Gravity resumes in '+destination);
 tick(.8);assert(r('Math.abs(player.vx)<1050&&Math.abs(player.vy)<2000'),'No runaway movement after dash and jump');
}
console.log('PASS: optional arena quest,45s no-reward waves, paused/between-round flow, once-only rewards, retries/reload,90s Fia immunity/spare, private chambers, strict save chain and dev replay isolation.');
