const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const h=harness(),run=h.run;const saved=run('JSON.stringify(saved)'),writes=run('window.__saveSnapshots.length');
assert(!run('DevTeleport.teleport({realm:"1",rest:"start"})'));
run('DevTools.open();DevSession.begin();');
for(const n of [0,1,2])for(const rest of run(`levels[${n}].rests.map(r=>r.id)`)){
 assert(run(`DevTeleport.teleport({realm:'${n}',rest:'${rest}'})`),`${n}/${rest} is a safe destination`);
 assert.equal(h.snap().realm,n);assert(run('player.onGround'));assert.equal(h.snap().checkpoint.id,rest);
 assert.equal(h.snap().state,'developer');assert.equal(run('projectiles.length'),0);assert(!run('bossStarted'));
 assert.equal(run('JSON.stringify(saved)'),saved);assert.equal(run('window.__saveSnapshots.length'),writes);
}
const before=run('JSON.stringify({realm,player,flags,abilities,defeated})');
for(const values of [{realm:'-1',rest:'start'},{realm:'3',rest:'start'},{realm:'NaN',rest:'start'},{realm:'1',rest:'missing'},{realm:'dream',rest:'start'}])assert(!run(`DevTeleport.teleport(${JSON.stringify(values)})`));
assert.equal(run('JSON.stringify({realm,player,flags,abilities,defeated})'),before,'Invalid destinations do not mutate state');
assert(run('DevTeleport.teleport({realm:"dream",rest:"dream"})'));assert(run('Prologue.active'));assert.equal(h.snap().state,'developer');
assert(run('DevTeleport.teleport({realm:"1",rest:"start"})'));assert(!run('Prologue.active'));assert(run('player.onGround'));
assert(run('abilities.every(x=>!x)&&defeated.every(x=>!x)'),'Teleport does not grant normal unlocks or boss victories');
run('DevTools.close()');assert(!run('DevTeleport.teleport({realm:"0",rest:"start"})'));
run('mainMenu()');assert.equal(run('JSON.stringify(saved)'),saved);
console.log('PASS: panel-only test teleport, every realm shrine grounded, dream roundtrip, invalid-input guards, unlock and save isolation.');
