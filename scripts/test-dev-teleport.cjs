const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const h=harness(),run=h.run;const saved=run('JSON.stringify(saved)'),writes=run('window.__saveSnapshots.length');
assert(!run('DevTeleport.teleport({realm:"1",rest:"start"})'));
run('DevTools.open();DevSession.begin();');
for(const n of run('levels.map((_,n)=>n)'))for(const rest of run(`levels[${n}].rests.map(r=>r.id)`)){
 assert(run(`DevTeleport.teleport({realm:'${n}',rest:'${rest}'})`),`${n}/${rest} is a safe destination`);
 assert.equal(h.snap().realm,n);assert(run('player.onGround'));assert.equal(h.snap().checkpoint.id,rest);
 assert.equal(h.snap().state,'developer');assert.equal(run('projectiles.length'),0);assert(!run('bossStarted'));
 assert.equal(run('JSON.stringify(saved)'),saved);assert.equal(run('window.__saveSnapshots.length'),writes);
}
const before=run('JSON.stringify({realm,player,flags,abilities,defeated})');
for(const values of [{realm:'-1',rest:'start'},{realm:String(run('levels.length')),rest:'start'},{realm:'NaN',rest:'start'},{realm:'1',rest:'missing'},{realm:'dream',rest:'start'}])assert(!run(`DevTeleport.teleport(${JSON.stringify(values)})`));
assert.equal(run('JSON.stringify({realm,player,flags,abilities,defeated})'),before,'Invalid destinations do not mutate state');
assert(run('DevTeleport.teleport({realm:"dream",rest:"dream"})'));assert(run('Prologue.active'));assert.equal(h.snap().state,'developer');
assert(run('DevTeleport.teleport({realm:"1",rest:"start"})'));assert(!run('Prologue.active'));assert(run('player.onGround'));
assert(run('abilities.every(x=>!x)&&defeated.every(x=>!x)'),'Teleport does not grant normal unlocks or boss victories');
run('DevTools.close()');assert(!run('DevTeleport.teleport({realm:"0",rest:"start"})'));
run('mainMenu()');assert.equal(run('JSON.stringify(saved)'),saved);

// Exercise the rendered selector and its change callbacks, not just a helper
// accepting a new id. Every advertised destination must actually be usable.
const camp=harness(),r=camp.run,normal=r('JSON.stringify(saved)'),normalWrites=r('window.__saveSnapshots.length');
const progress=()=>r('JSON.stringify({flags,abilities,defeated,progression,shards})');
const originalProgress=progress();
function field(id){
 const find=node=>node.id===id?node:(node.children||[]).map(find).find(Boolean);
 return find(camp.elements.get('devToolsList'));
}
assert.equal(r('enterForestCamp()'),false,'Ordinary entry remains locked before the first boss');
r('DevTools.open();DevSession.begin();DevTools.refresh();');
const selector=field('dev-teleport-realm');
assert(selector.children.some(option=>option.value==='forestCamp'),'The camp is missing from the rendered destination selector');
const shadowIndex=r("levels.findIndex(map=>map.id==='shadowRealm')");
assert(shadowIndex>=0,'The fourth realm must be authored');
assert(selector.children.some(option=>option.value===String(shadowIndex)),'The fourth realm is missing from the rendered selector');
assert.deepEqual(Array.from(r(`levels[${shadowIndex}].rests.map(rest=>rest.id)`)),['start','altar','prison','cathedral']);
for(const option of [...selector.children]){
 const current=field('dev-teleport-realm');current.value=String(option.value);current.onchange();
 const rest=field('dev-teleport-rest');
 assert(rest.children.length,'Every listed destination needs an arrival point');
 for(const point of rest.children){
  assert(r(`DevTeleport.teleport(${JSON.stringify({realm:String(option.value),rest:String(point.value)})})`),'The selector advertises an unusable destination');
 }
}
for(const from of [{realm:'dream',rest:'dream'},{realm:'1',rest:'start'},{realm:'2',rest:'start'}]){
 assert(r(`DevTeleport.teleport(${JSON.stringify(from)})`));
 const before=r('JSON.stringify({realm,level:level.id,player,checkpoint,visitedRests,flags})');
 assert.equal(r("DevTeleport.teleport({realm:'forestCamp',rest:'start'})"),false);
 assert.equal(r('JSON.stringify({realm,level:level.id,player,checkpoint,visitedRests,flags})'),before,'Invalid camp arrival mutates the world');
 assert(r("DevTeleport.teleport({realm:'forestCamp',rest:'forestCamp'})"),'Unbeaten camp must be reachable only in a dev test');
 assert.equal(r('level.id'),'forestCamp');assert.equal(camp.snap().realm,0);
 assert.equal(camp.snap().checkpoint.id,'forestCamp');assert(r('player.onGround&&player.y+player.h===forestCamp.rests[0].y'));
 assert(r('!Prologue.active&&boss.dead&&!bossStarted&&enemies.length===0&&projectiles.length===0'));
 assert.equal(r('DevBoss.revive()'),false,'The safe camp must not acquire a realm guardian');
 assert.equal(camp.snap().state,'developer');assert.equal(r('DevTools.returnState'),'play');
 assert.equal(progress(),originalProgress,'Camp teleport granted normal progress');
 r('DevTools.close();interact();persist();DevTools.open();');
 assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('window.__saveSnapshots.length'),normalWrites);
}
r('DevTools.close();DevSession.end();startGame(true);');camp.dismiss();
assert.equal(r('DevSession.active'),false);assert.equal(r('enterForestCamp()'),false,'The dev exception must end with the test');
assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('window.__saveSnapshots.length'),normalWrites+1,'Only resuming the normal game may persist');
console.log('PASS: rendered destination catalogue and execution agree, camp/dream/realm roundtrips, grounded arrival, invalid-input guards, normal unlocks and save isolation.');
