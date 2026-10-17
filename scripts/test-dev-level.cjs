const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const h=harness(),run=h.run,saved=run('JSON.stringify(saved)'),writes=run('window.__saveSnapshots.length');
assert(!run('DevLevel.setLevel({level:5})'));run('DevTools.open();DevSession.begin();');
for(const n of [1,3,run('LEVEL_LIMIT'),5,1]){
 assert(run(`DevLevel.setLevel({level:${n}})`));assert.equal(h.snap().progression.level,n);assert.equal(h.snap().progression.points,n-1);assert.equal(h.snap().progression.xp,0);
 assert.equal(h.snap().progression.totalXp,run(`Array.from({length:${n}-1},(_,i)=>xpForLevel(i+1)).reduce((a,b)=>a+b,0)`));
}
run('DevLevel.setLevel({level:LEVEL_LIMIT});progression.stats={vitality:5,strength:3,spirit:0};progression.points=3;');
assert(run('DevLevel.setLevel({level:3})'));assert.equal(run('progression.stats.vitality'),2);assert.equal(run('progression.stats.strength'),0);assert.equal(run('progression.points'),0);assert.equal(run('player.maxHp'),7);
assert(run('DevLevel.setLevel({level:8})'));assert.equal(run('progression.points'),5,'Increasing level credits exactly the remaining budget');
const before=run('JSON.stringify({progression,player})');
for(const expression of ['0','-1','LEVEL_LIMIT+1','NaN','Infinity','3.5','""','"3abc"','null'])assert(!run(`DevLevel.setLevel({level:${expression}})`));
assert.equal(run('JSON.stringify({progression,player})'),before);assert.equal(run('JSON.stringify(saved)'),saved);assert.equal(run('window.__saveSnapshots.length'),writes);
run('DevTools.close()');assert(!run('DevLevel.setLevel({level:2})'));run('mainMenu();startGame(true)');assert.equal(h.snap().progression.level,1);
console.log('PASS: current-limit level selection, exact XP/stat budgets, lower-level allocation clamp, invalid input and save isolation.');
