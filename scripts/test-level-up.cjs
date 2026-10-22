'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),harness=require('./test-harness.cjs');
const near=(actual,expected,message)=>assert(Math.abs(actual-expected)<1e-8,`${message}: ${actual} !== ${expected}`);
const h=harness(),r=h.run;
const permanent='JSON.stringify({abilities,defeated,flags,stats:progression.stats,hp:player.hp,maxHp:player.maxHp})';
// An actual ordinary enemy death crosses the XP threshold exactly once.
r('progression=freshProgression();awardXP(59);');assert.equal(r('LevelUpEffect.remaining'),0);
const before=r(permanent);
r("var foe=createEnemy({id:'level-up-test',x:level.start.x,y:level.start.y,kind:'guard',patrol:20});foe.hp=0;killEnemy(foe);");
assert.equal(r('LevelUpEffect.remaining'),r('LevelUpEffect.duration'));
assert.equal(r('progression.level'),2);assert.equal(r('progression.points'),1);assert.equal(r('progression.xp'),19);assert.equal(r('progression.totalXp'),79);
assert.equal(r(permanent),before,'The cue does not alter health, upgrades, abilities or quest flags');
r('LevelUpEffect.update(.2);killEnemy(foe);');near(r('LevelUpEffect.remaining'),1.4,'A duplicate death does not replay the cue');
assert.equal(r('progression.totalXp'),79);
assert(!r('JSON.stringify(saved)').includes('LevelUpEffect'),'Transient cue is absent from saves');
// Invalid, below-threshold, capped and normalized XP do not manufacture level-ups.
for(const bad of ['NaN','Infinity','-2','0','.5','Number.MAX_SAFE_INTEGER+1']){
 r('LevelUpEffect.clear();');const old=r('JSON.stringify(progression)');r(`awardXP(${bad});`);
 assert.equal(r('JSON.stringify(progression)'),old);assert.equal(r('LevelUpEffect.remaining'),0);
}
r('LevelUpEffect.clear();awardXP(1);');assert.equal(r('LevelUpEffect.remaining'),0);
r('progression=normalizeProgression({level:30,totalXp:15950},flags);awardXP(100);');assert.equal(r('LevelUpEffect.remaining'),0);
r('progression=normalizeProgression({level:8,totalXp:1155},flags);');assert.equal(r('LevelUpEffect.remaining'),0);
r('progression=freshProgression();awardXP(10000);');assert(r('progression.level>2'));
near(r('LevelUpEffect.remaining'),1.6,'A multi-level award starts one bounded cue');
r('LevelUpEffect.update(.7);awardXP(10000);');near(r('LevelUpEffect.remaining'),1.6,'A later genuine level gain refreshes, rather than stacks, the cue');
// Loading, stat allocation and developer level selection never impersonate XP gains.
r('mainMenu();startGame(true);');assert.equal(r('LevelUpEffect.remaining'),0);
r('initPlayer(checkpoint);state="play";showTraining();');assert.equal(r('state'),'training');
assert(r("spendPoint('strength')"));assert.equal(r('LevelUpEffect.remaining'),0);r('closeTraining()');
r('DevTools.open();DevSession.begin();');assert(r('DevLevel.setLevel({level:8})'));assert.equal(r('LevelUpEffect.remaining'),0);r('DevTools.close();DevSession.end();startGame(true)');
// The shared outer loop advances exactly once at all supported frame rates.
for(const fps of [30,60,120]){
 r('enterRealm(0);state="play";enemies=[];boss.dead=true;player.inv=999;LevelUpEffect.start();');
 r(`for(let frame=0;frame<${fps/2};frame++)update(${1/fps});`);
 near(r('LevelUpEffect.remaining'),1.1,`${fps}fps: one timer step per active frame`);
 r(`for(let frame=0;frame<${fps*2};frame++)update(${1/fps});`);assert.equal(r('LevelUpEffect.remaining'),0);
}
// Real panel entry/exit and the small-viewport gate freeze the same transient clock.
r('LevelUpEffect.start()');
for(const [open,close] of [['pause()','pause()'],['Inventory.open()','Inventory.close()'],['DevTools.open()','DevTools.close()'],['showTraining()','closeTraining()'],['story("","","")',"$('dialogOk').onclick()"]]){
 r(open);assert.notEqual(r('state'),'play',open);const remaining=r('LevelUpEffect.remaining');
 r('for(let frame=0;frame<120;frame++)update(1/60)');assert.equal(r('LevelUpEffect.remaining'),remaining,open+' freezes cue');r(close);
}
r('resolutionBlocked=true;update(.2)');near(r('LevelUpEffect.remaining'),1.6,'Unsupported viewport freezes cue');r('resolutionBlocked=false');
// Death, realm changes, menu and new game clear rather than revive the old cue.
for(const action of ['initPlayer(checkpoint)','revive()','player.inv=0;damage(999)','enterRealm(1)','mainMenu()','mainMenu();startGame(false)']){
 r('Prologue.stop();enterRealm(0);state="play";LevelUpEffect.start()');assert(r('LevelUpEffect.remaining>0'));r(action);assert.equal(r('LevelUpEffect.remaining'),0,action);
}
// Prologue and developer teleports share initialization and cannot carry the effect.
r('Prologue.stop();enterRealm(0);state="play";LevelUpEffect.start();DevTools.open();DevSession.begin();');
for(const target of [{realm:'dream',rest:'dream'},{realm:'forestCamp',rest:'forestCamp'},{realm:'3',rest:'start'}]){
 assert(r(`DevTeleport.teleport(${JSON.stringify(target)})`));assert.equal(r('LevelUpEffect.remaining'),0,'Teleport clears cue');
 r('DevTools.close();LevelUpEffect.start();DevTools.open()');
}
r('DevTools.close();DevSession.end();startGame(true)');assert.equal(r('LevelUpEffect.remaining'),0);
const root=path.join(__dirname,'..');
assert(!/id=["']souls["']/.test(fs.readFileSync(path.join(root,'index.html'),'utf8')),'Unused soul counter is absent from the DOM');
for(const file of ['assets/js/game.js','assets/js/prologue.js','assets/css/style.css']){
 const text=fs.readFileSync(path.join(root,file),'utf8');assert(!/\$\(['"]souls['"]\)|#souls\b/.test(text),file+' has no stale counter writes/styles');
}
console.log('PASS: real enemy XP level-up cue, unchanged progression/health/abilities, invalid/cap/load/stat/dev exclusions, bounded multi-level duration, 30/60/120fps, paused panels/viewport, transition resets and removed soul HUD.');
