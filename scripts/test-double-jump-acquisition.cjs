const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
function jumpInput(h,owned){
 h.run('initPlayer(checkpoint);');
 h.press(' ');h.tick(12);h.release(' ');h.tick(2);h.press(' ');h.tick();h.release(' ');
 assert.equal(h.snap().player.jumps,owned?2:1,'Air jump must follow actual shrine ownership');
 if(owned)assert(h.snap().player.vy< -600,'The second press did not renew upward velocity');
}
for(const owned of [false,true]){
 const h=harness(),r=h.run;
 r(`abilities=[${owned},false];flags=levels.map((_,n)=>n===0?['forestBell','villageBell']:[]);visitedRests=levels.map((_,n)=>n===0?japan.rests.map(s=>s.id):[]);defeated=levels.map(()=>false);progression=freshProgression();shards=0;enterRealm(0);bossStarted=true;boss.hp=1;boss.inv=0;player.inv=999;`);
 const writes=r('window.__saveSnapshots.length');
 h.place(r('boss.x-35'),r('level.arena.y'));r("player.face=1;melee();advanceSwordAttack(.17);");
 assert(h.snap().defeated[0],'The actual sword hit must defeat the guardian');
 assert.equal(h.snap().abilities[0],owned,'Japan victory must not grant the shrine ability');
 assert.equal(h.snap().abilities[1],false);assert.equal(h.snap().progression.totalXp,250);
 assert(r("flags[0].includes('oathbreakerSoul')&&flags[0].includes('bossRewardClaimed')"));
 for(const save of r(`window.__saveSnapshots.slice(${writes})`))assert.doesNotThrow(()=>validate(JSON.parse(save)),'An intermediate reward write rejected a skipped shrine');
 h.dismiss();r('guardianDefeated();mainMenu();startGame(true);');assert.equal(h.snap().abilities[0],owned);
 jumpInput(h,owned);
 for(const cause of ['combat','fall']){
  r('player.inv=0;');r(cause==='combat'?'damage(999);':'player.y=level.height+200;movePlayer(1/120);');
  assert.equal(h.snap().abilities[0],owned);assert(h.snap().defeated[0]);validate(r('saved'));
 }
 assert.equal(r('enterForestCamp()'),true);validate(r('saved'));r('mainMenu();startGame(true);');
 assert.equal(r('level.id'),'forestCamp');assert.equal(h.snap().abilities[0],owned);
 assert(r('fastTravel(japan.rests.find(s=>s.id===\'temple\'),0)'));
 h.place(r('level.exit.x'),r('level.exit.y'));h.press('e');h.tick();h.release('e');h.dismiss();
 assert.equal(h.snap().realm,1);assert.equal(h.snap().abilities[0],owned);validate(r('saved'));
 r('mainMenu();startGame(true);');assert.equal(h.snap().realm,1);assert.equal(h.snap().abilities[0],owned);jumpInput(h,owned);
 assert(r("fastTravel(japan.rests.find(s=>s.id==='river'),0)"));
 const xp=h.snap().progression.totalXp,points=h.snap().progression.points;
 h.place(r('japan.ability.x'),r('japan.ability.y'));
 assert.equal(r('getContext().type'),'ability');assert.equal(h.snap().abilities[0],owned,'Proximity must not acquire the ability');
 assert(r("Bindings.setPrimary('interact','q').ok"));
 h.press('e');h.tick();h.release('e');assert.equal(h.snap().abilities[0],owned);
 h.press('q');h.tick();h.release('q');h.dismiss();
 assert.equal(h.snap().abilities[0],true,'The skipped shrine must remain usable after victory and travelling');
 assert.equal(h.snap().progression.totalXp,xp);assert.equal(h.snap().progression.points,points);validate(r('saved'));
 r('mainMenu();startGame(true);');assert(h.snap().abilities[0]);jumpInput(h,true);
 assert.equal(h.snap().progression.totalXp,250,'Returning to the shrine duplicated the boss reward');
}
console.log('PASS: Japan sword victory does not grant double jump, valid reward writes, death/camp/realm/reload preservation, remappable shrine acquisition and actual single/double-jump input.');
