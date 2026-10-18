const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const h=harness(),run=h.run;
const amounts=()=>Array.from(run('DevDamage.samples'),entry=>entry.amount);
const last=()=>amounts().at(-1);
run('DevDamage.init();');
assert(!run('DevDamage.active'));
assert(!run('DevDamage.toggle()'),'The toggle requires a panel and test session');
run("DevDamage.record('outgoing',{x:0,y:0},5,3)");assert.deepEqual(amounts(),[]);
run('DevTools.open();DevSession.begin();');assert(run('DevDamage.toggle()'));run('DevTools.close();');
assert(!run('DevDamage.toggle()'),'A running game cannot change the panel-only toggle');

// Ordinary damage records the actual lost HP, including lethal overkill before respawn.
run('player.inv=0;damage(2);');assert.equal(last(),2);
run('damage(2);');assert.equal(amounts().length,1,'Invulnerability produces no number');
run('player.inv=0;dash=.2;damage(2);');assert.equal(amounts().length,1,'Dash produces no number');
run('dash=0;player.hp=1;damage(999);');assert.equal(last(),1);assert.equal(run('player.hp'),run('player.maxHp'));
run('DevDamage.clear();DevTools.open();DevImmortality.toggle();DevTools.close();player.inv=0;damage(999);');
assert.deepEqual(amounts(),[],'Developer invincibility reports no applied damage');
run('DevTools.open();DevImmortality.toggle();DevTools.close();');

// Sword hooks are after shield/active/invulnerability guards and before kill cleanup.
run("enterRealm(0);state='play';var foe=enemies.find(e=>e.kind==='guard');enemies=[foe];foe.hp=1;player.x=foe.x-40;player.y=foe.y;attackFace=1;resolveMeleeHit();");
assert.equal(last(),1);assert(run('foe.dead'));
run("enterRealm(0);var shield=enemies.find(e=>e.kind==='shield');enemies=[shield];shield.face=-1;player.x=shield.x-40;player.y=shield.y;attackFace=1;resolveMeleeHit();");
assert.deepEqual(amounts(),[],'A shield block is not damage');
run("enterRealm(0);var mini=enemies.find(e=>e.miniboss);enemies=[mini];player.x=mini.x-40;player.y=mini.y;attackFace=1;resolveMeleeHit();");
assert.deepEqual(amounts(),[],'An inactive miniboss is not damageable');
run('mini.active=true;mini.inv=1;resolveMeleeHit();');assert.deepEqual(amounts(),[]);
run('mini.inv=0;mini.hp=1;resolveMeleeHit();');assert.equal(last(),1);
run("enterRealm(1);bossStarted=true;startYomiLavaWave('shelter');var snake=boss.serpent;enemies=[snake];snake.hp=1;snake.inv=0;player.x=snake.x-40;player.y=snake.y;attackFace=1;resolveMeleeHit();");
assert.equal(last(),1);assert(run('snake.dead'));
run("defeated[0]=false;enterRealm(0);state='play';boss.inv=0;hitBoss(2);");assert.deepEqual(amounts(),[],'An unstarted boss is not damaged');
run('bossStarted=true;boss.hp=1;hitBoss(999);');assert.equal(last(),1);assert(run('boss.dead'));h.dismiss();

// Scripted protection reduces effective damage at both Yomi phase boundaries.
run("defeated[1]=false;enterRealm(1);state='play';bossStarted=true;boss.hp=25;boss.inv=0;hitBoss(999);");
assert.equal(last(),1);assert.equal(run('boss.hp'),24);
const protectedCount=amounts().length;run('boss.inv=0;hitBoss(999)');assert.equal(amounts().length,protectedCount,'Shelter is immune');
run('endYomiShelter();boss.inv=0;boss.hp=6;hitBoss(999);');assert(Math.abs(last()-1.2)<1e-10);assert.equal(run('boss.hp'),4.800000000000001);
run("DevDamage.clear();boss.lava={x:player.x,y:player.y,w:43,h:69,active:true,warning:0,lethal:true};player.hp=3;updateBossHazards(.01);");
assert.equal(last(),3,'Lethal lava records its direct HP loss');

// Secret refill must not erase the damage applied to the previous angel life bar.
run("flags=[['angelHalo','demonHorn'],[],[],[]];defeated[2]=false;enterRealm(2);state='play';bossStarted=true;boss.inv=0;hitBoss(999);");
assert.equal(last(),139);assert.equal(run('boss.stage'),2);assert.equal(run('boss.hp'),1);
run("boss.inv=0;boss.phase='wait';hitBoss(999);");assert.equal(last(),1);assert.equal(run('boss.hp'),180);assert.equal(run('boss.stage'),3);
run("boss.inv=0;boss.phase='wait';hitBoss(999);");assert.equal(last(),180);assert(run('boss.dead'));
h.dismiss();

// Shadow's statutory damage cap/floor and dream death use the same actual-delta rule.
run("Prologue.start();player.x=3100;Prologue.update(.01);Prologue.update(2.9);boss.inv=0;Prologue.hit(Number.MAX_SAFE_INTEGER);");
assert.equal(last(),run('playerAttackDamage()'));
run('DevDamage.clear();boss.hp=1;boss.inv=0;Prologue.hit(2);');assert.deepEqual(amounts(),[]);
run('player.inv=0;Prologue.hurt(2);');assert.equal(last(),2);
run('Prologue.hurt(2);');assert.equal(amounts().length,1);
run('player.inv=0;Prologue.hurt(999);');assert.deepEqual(amounts(),[2,3],'hurt→lose emits the lethal hit once');
run('Prologue.start();player.x=3100;Prologue.update(.01);Prologue.update(2.9);Prologue.lose();');assert.deepEqual(amounts(),[5],'A scripted dream death records only remaining HP');

// Bounded lifetime, paused diagnostics, detached samples, and static reduced-motion text.
run("Prologue.stop();enterRealm(0);state='play';DevDamage.record('outgoing',{x:10,y:100,w:40},5,3);");
const beforePause=run('JSON.stringify(DevDamage.samples)');
for(const state of ['pause','developer','dialog','inventory']){
 run(`state='${state}';DevDamage.update(.3);`);assert.equal(run('JSON.stringify(DevDamage.samples)'),beforePause);
}
run("state='play';var textPositions=[];var stroke=ctx.strokeText;ctx.strokeText=(...args)=>textPositions.push(args);reducedMotion.matches=true;DevDamage.draw();DevDamage.update(.2);DevDamage.draw();ctx.strokeText=stroke;");
assert.equal(run('textPositions[0][2]'),run('textPositions[1][2]'),'Reduced motion does not float');
assert.equal(run('textPositions[0][0]'),'2');
run("DevDamage.clear();for(let i=0;i<100;i++)DevDamage.record('incoming',{x:10,y:100},5,4);DevDamage.samples[0].amount=999;");
assert.equal(amounts().length,48);assert.equal(amounts()[0],1,'Samples are detached from internal state');
run("DevDamage.record('incoming',{x:NaN,y:0},5,4);DevDamage.record('incoming',{x:0,y:0},NaN,0);DevDamage.record('incoming',{x:0,y:0},5,8);DevDamage.update(1);");
assert.deepEqual(amounts(),[]);
run("DevDamage.record('outgoing',{x:0,y:0},5,3);enterRealm(1);");assert.deepEqual(amounts(),[],'Travel clears old world coordinates');
run('DevTools.open();');assert(run('DevDamage.toggle()'));run('DevTools.close();');assert(!run('DevDamage.active'));
run('DevTools.open();DevDamage.toggle();DevTools.close();mainMenu();');assert(!run('DevDamage.active'));assert.deepEqual(amounts(),[]);
assert(!run("Object.hasOwn(window,'DevDamage')"),'No global developer API');
console.log('PASS: session-only actual HP loss, blocked hits, overkill, phase thresholds/refills, serpent/Shadow, lethal paths, pause, bounded lifetime, reduced motion and cleanup.');
