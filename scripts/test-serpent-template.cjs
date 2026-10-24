'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const h=harness(),r=h.run;
assert(r('Object.isFrozen(Serpents)&&Object.isFrozen(Serpents.profiles)&&Object.isFrozen(Serpents.profiles.white.moves.bite)'));
for(const invalid of [null,{}, {serpentType:'unknown'},{serpentType:'__proto__'}])assert(!r('Serpents.is('+JSON.stringify(invalid)+')'));
assert(r("Serpents.is({serpent:true})&&Serpents.is({serpentType:'white'})&&Serpents.is({serpentType:'winged'})"));
function optional(type){
 const realm=type==='white'?0:2;
 // A synthetic arena isolates the common controller from separate route tests.
 r("Prologue.stop();defeated=[true,true,true,false];flags=[['forestBell','villageBell'],['soulUpper','soulLower'],['dawnSeal'],[]];abilities=[true,true];progression=freshProgression();enterRealm("+realm+");state='play';var snakeArena={x:300,y:1000,w:1300};platforms=[{id:'snake-floor',x:0,y:1000,w:2000,h:100,kind:'ground'}];checkpoint={id:'start',x:400,y:1000};initPlayer({x:1000,y:1000});player.inv=999;var snake=Serpents.create({id:'"+type+"Serpent',serpentType:'"+type+"',x:800,y:1000,arena:snakeArena});enemies=[snake];boss.dead=true;");
 assert.equal(r('snake.serpent'),undefined,'Only the hosted lava snake uses the transient serpent marker');
 assert.equal(r('snake.active'),false);r('updateEnemies(.01);');assert.equal(r('snake.active'),true);
 return realm;
}
for(const type of ['white','winged']){
 const realm=optional(type),duration=r('snake.clock');r("state='pause';Serpents.update(snake,2);");assert.equal(r('snake.clock'),duration,'Direct and outer-loop calls freeze during pause');r("state='play';snake.clock=0;updateEnemies(.01);");
 assert.equal(r('snake.move'),'bite');assert.equal(r('snake.phase'),'windup');assert(r('snake.attackBox&&snake.attackBox.w>snake.w'));
 const locked=r('JSON.stringify({face:snake.attackFace,box:snake.attackBox,target:snake.targetX})');r('player.x=snake.x-350;Serpents.update(snake,.1);');assert.equal(r('JSON.stringify({face:snake.attackFace,box:snake.attackBox,target:snake.targetX})'),locked,'Telegraph cannot retarget Momo during windup');
 r('snake.clock=0;Serpents.update(snake,.01);');assert.equal(r('snake.phase'),'strike');
 const fired=new Set();
 for(let i=0;i<5000;i++){
  r('player.inv=999;Serpents.update(snake,1/120);');
  if(r("snake.phase==='windup'"))fired.add(r('snake.move'));
 }
 assert.deepEqual([...fired].sort(),Object.keys(r('Serpents.profiles.'+type+'.moves')).sort(),'Every species move cycles through the common phase machine');
 assert(r('snake.x>=snake.patrolLeft&&snake.x<=snake.patrolRight'));
 assert(r('projectiles.every(p=>p.source==="mini:"+snake.id&&p.damage===1)'), 'Species shots use encounter-owned real projectile records');
 if(type==='white'){
  r("snake.cycles=2;snake.phase='wait';snake.clock=0;Serpents.update(snake,.01);");assert.equal(r('snake.hazards.length'),3);assert(r('snake.hazards.every(h=>h.warning>0&&!h.active)'),'Ground bursts are visible before damage');
  const warnings=r('JSON.stringify(snake.hazards)');r("state='dialog';Serpents.update(snake,3);");assert.equal(r('JSON.stringify(snake.hazards)'),warnings);r("state='play';");
 }else{
  r("snake.cycles=2;snake.phase='wait';snake.clock=0;Serpents.update(snake,.01);");assert.equal(r('snake.move'),'shadowSweep');const old=r('snake.x');r('snake.clock=0;Serpents.update(snake,.01);Serpents.update(snake,.1);');assert.notEqual(r('snake.x'),old,'Winged sweep has its own charge movement');
 }
 const xp=r('progression.totalXp');r('snake.hp=0;killEnemy(snake);');assert(r('snake.dead'));assert.equal(r('progression.totalXp'),xp+(type==='white'?100:180));
 assert(r('flags['+realm+'].includes(Serpents.profiles.'+type+'.reward)&&flags['+realm+'].includes(Serpents.profiles.'+type+'.guardian)'));
 r('killEnemy(snake);');assert.equal(r('progression.totalXp'),xp+(type==='white'?100:180));
 r('Serpents.reset(snake);');assert(r('snake.dead'),'Normal resets preserve an earned guardian victory');
 const saved=r('JSON.stringify({flags,progression,coins})');r('snake.replay=true;Serpents.reset(snake);snake.active=true;snake.hp=0;killEnemy(snake);');assert.equal(r('JSON.stringify({flags,progression,coins})'),saved,'Replays grant no flags, XP or coins');
}
optional('white');r("snake.phase='windup';snake.move='bite';snake.clock=0;snake.attackFace=1;snake.face=1;initPlayer({x:snake.x+snake.w,y:1000});player.hp=1;player.inv=0;var oldSnake=snake,oldPlayer=player;Serpents.update(snake,.01);");
assert(r('player!==oldPlayer'),'Lethal contact respawns a new Momo');assert(!r('enemies.includes(oldSnake)'),'Old encounter cannot continue on the replacement player');const fresh=r('JSON.stringify({player,enemies,projectiles,flags})');r('Serpents.update(oldSnake,1);Serpents.defeat(oldSnake);');assert.equal(r('JSON.stringify({player,enemies,projectiles,flags})'),fresh,'Stale serpent instances cannot attack or grant rewards');
optional('winged');r('snake.active=true;snake.phase="strike";snake.move="shadowSweep";snake.clock=.5;snake.attackFace=1;player.x=snakeArena.x-400;Serpents.update(snake,.01);');assert(!r('snake.active'));assert.equal(r('snake.phase'),'wait');assert.equal(r('snake.x'),r('snake.origin'));
console.log('PASS: immutable shared serpent profiles, distinct telegraphed moves, locked targeting, pause, bounded charge, ordinary persistence/replay isolation and lethal/stale encounter safety.');

// SERPENT-QA-01 r1: actual first discovery resolves approved names in both languages.
const locales=require('../assets/i18n/locales.json');
for(const language of ['hu','en']){
 const f=harness(),run=f.run;run('I18n.t=value=>('+JSON.stringify(locales[language].dict)+')[value]??value;');
 for(const [realm,id]of [[0,'whiteSerpentCave'],[2,'wingedSerpentRoost'],[0,'cultCave'],[0,'angelRuin']]){
  run('enterRealm('+realm+');var discoveryArea=level.secrets.find(area=>area.id==='+JSON.stringify(id)+');initPlayer({x:discoveryArea.arena.x+100,y:discoveryArea.arena.y});discoverSecrets();');
  const expected=run("I18n.t('hint.hidden.area.prefix')+I18n.t(discoveryArea.name)");assert.equal(f.elements.get('toast').textContent,expected);
  const permanent=run('JSON.stringify({flags,writes:__saveSnapshots.length})');run('discoverSecrets();');assert.equal(run('JSON.stringify({flags,writes:__saveSnapshots.length})'),permanent);
 }
}
console.log('PASS: localized first-discovery names and once-only flags/writes for both serpent arenas and existing cave/tower.');

// SERPENT-QA-02 r1: realm suffixes are appended only after resolving the name.
for(const language of ['hu','en']){
 const f=harness(),run=f.run,dict=locales[language].dict;run('I18n.t=value=>('+JSON.stringify(dict)+')[value]??value;');
 for(const [realm,id,key]of [[0,'whiteSerpentCave','serpent.white.cave'],[2,'wingedSerpentRoost','serpent.winged.roost']]){
  run('enterRealm('+realm+');var hudArea=level.secrets.find(area=>area.id==='+JSON.stringify(id)+');initPlayer({x:hudArea.arena.x+500,y:hudArea.arena.y});enemies=[];boss.dead=true;update(1/120);');
  const suffix=realm===2?' · 380'+dict['text.m.high']:'';assert.equal(f.elements.get('areaLabel').textContent,dict[key]+suffix);
  const steady=run('JSON.stringify({player,flags,progression,levelTime})');run("state='pause';update(1);");assert.equal(run('JSON.stringify({player,flags,progression,levelTime})'),steady);run("state='play';");
 }
 for(const realm of [0,1,2,3]){
  run('enterRealm('+realm+');enemies=[];boss.dead=true;initPlayer(level.start);var originalPoints=progression.points;update(1/120);');
  assert(f.elements.get('areaLabel').textContent.length>3);assert(!/serpent\./.test(f.elements.get('areaLabel').textContent));assert.equal(run('progression.points'),run('originalPoints'));
 }
}
console.log('PASS: localized white/winged HUD names with unchanged altitude units, pause and original world labels.');
