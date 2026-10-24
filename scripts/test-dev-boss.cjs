const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
for(const realm of harness().run('levels.map((_,n)=>n)')){
 const h=harness();h.run(`enterRealm(${realm});state='play';defeated[${realm}]=true;boss.dead=true;persist();`);
 const saved=h.run('JSON.stringify(saved)'),writes=h.run('window.__saveSnapshots.length');
 assert(!h.run('DevBoss.revive()'));h.run('DevTools.open();DevSession.begin();');
 h.run("boss.hazards=[{life:10}];boss.lava={active:true};boss.summons=[{delay:1}];boss.stage=3;boss.summonThresholds=[.8];boss.councilMinionKills=8;projectiles=[{source:'boss',life:8}];");
 assert(h.run('DevBoss.revive()'));assert.equal(h.run('boss.hp'),h.run('boss.max'));assert.equal(h.run('boss.stage'),1);
 assert(h.run('bossStarted&&!boss.dead&&!defeated[realm]'));assert.equal(h.run('boss.hazards.length+boss.summons.length+projectiles.length'),0);
 assert.equal(h.run('boss.lava'),null);assert.equal(h.run('boss.councilMinionKills'),0);assert.equal(h.run('boss.summonThresholds.length'),0);
 assert.equal(h.run('boss.serpent'),null);assert(h.run('player.onGround'),'Replay starts grounded');
 assert.equal(h.run('JSON.stringify(saved)'),saved);assert.equal(h.run('window.__saveSnapshots.length'),writes);
 h.run('DevTools.close()');assert.equal(h.snap().state,'play');assert(!h.run('DevBoss.revive()'),'Replay must be panel-only');
 h.run('mainMenu();startGame(true)');assert(h.snap().defeated[realm],'Normal guardian progress survives replay');
}
const h=harness();h.run('DevTools.open();DevSession.begin();Prologue.start();state="developer";boss.hp=1;');
assert(h.run('DevBoss.revive()'));assert(h.run('Prologue.active'));assert.equal(h.run('boss.hp'),100000);
h.run('Prologue.stop();enterRealm(1);defeated[1]=true;flags[1].push("councilGateOpen");state="play";enterCouncilHall();DevTools.close();DevTools.open();');
assert(!h.run('DevBoss.revive()'),'Empty council hall has no guardian replay');

// The rendered picker includes every authored miniboss as well as the realm
// guardian. Replays must not revoke permanent victories or award them twice.
const picker=harness(),r=picker.run;
const normal=r('JSON.stringify(saved)'),normalWrites=r('window.__saveSnapshots.length');
assert(!r("DevBoss.revive({encounter:'oldAngel'})"),'Miniboss replay needs a test and an open panel');
r('DevTools.open();DevSession.begin();');
const field=()=>{
 const find=node=>node.id==='dev-boss-revive-encounter'?node:(node.children||[]).map(find).find(Boolean);
 return find(picker.elements.get('devToolsList'));
};
for(const n of r('levels.map((_,n)=>n)')){
 assert(r(`DevTeleport.teleport({realm:'${n}',rest:'start'})`));
 r('DevTools.refresh();');
 const options=field().children.map(option=>String(option.value));
 assert(options.includes('main'),'Guardian replay must remain selectable');
 const specs=r('level.enemies.filter(spec=>spec.miniboss).map(spec=>({id:spec.id,name:spec.name}))');
 for(const spec of specs){
  assert(options.includes(spec.id),'Authored miniboss missing from encounter picker: '+spec.id);
  assert(field().children.some(option=>option.value===spec.id&&option.textContent===r('I18n.t('+JSON.stringify(spec.name)+')')),'The picker must reuse the authored miniboss name');
  r(`flags[realm].push(minibossFlag(${JSON.stringify(spec.id)}));enemies.find(enemy=>enemy.id===${JSON.stringify(spec.id)}).dead=true;`);
  const progress=r('JSON.stringify({flags,defeated,progression,coins,shards})');
  const selector=field();selector.value=spec.id;selector.onchange();
  picker.elements.get('devToolsList').children.find(section=>section.children?.some(node=>node.id==='dev-tool-boss-revive')).children.find(node=>node.id==='dev-tool-boss-revive').onclick();
  assert(r(`enemies.some(enemy=>enemy.id===${JSON.stringify(spec.id)}&&!enemy.dead&&enemy.active&&enemy.hp===enemy.maxHp)`),'Selected miniboss was not revived');
  assert(r('player.onGround'),'Miniboss replay must start grounded');
  assert.equal(r('JSON.stringify({flags,defeated,progression,coins,shards})'),progress,'Replay revoked permanent progress');
  r(`{const enemy=enemies.find(enemy=>enemy.id===${JSON.stringify(spec.id)});enemy.hp=0;killEnemy(enemy);}`);
  assert.equal(r('JSON.stringify({flags,defeated,progression,coins,shards})'),progress,'Repeated miniboss victory duplicated a permanent reward');
 }
 const before=r('JSON.stringify({player,enemies,boss,flags})');
 assert.equal(r("DevBoss.revive({encounter:'missing'})"),false);
 assert.equal(r('JSON.stringify({player,enemies,boss,flags})'),before,'Invalid encounter mutated the world');
}
assert(r("levels[3].enemies.some(enemy=>enemy.id==='cultJailer')&&levels[3].enemies.some(enemy=>enemy.id==='madOrganist')"),'Both fourth-realm minibosses need replay support');
assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('window.__saveSnapshots.length'),normalWrites);
r('DevTools.close();');assert(!r("DevBoss.revive({encounter:'madOrganist'})"),'Closed panel cannot replay encounters');
console.log('PASS: isolated guardian/miniboss replay picker, preserved permanent rewards, grounded starts, invalid-input guards, dream restart and side-area guards.');
