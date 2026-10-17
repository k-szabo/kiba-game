const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
for(const realm of [0,1,2]){
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
console.log('PASS: panel-only isolated boss replay, complete encounter reset, grounded starts, dream restart and hall guard.');
