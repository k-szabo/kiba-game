const assert=require('node:assert/strict');
const harness=require('./test-harness.cjs');
const h=harness(),{run,press,release}=h;
// Isolate deterministic reaction rolls from visual/audio randomness and Node's Math.
h.sandbox.Math=Object.create(Math);
run('burst=()=>{};tone=()=>{};var reactionRolls=0,reactionValue=.39;Math.random=()=>{reactionRolls++;return reactionValue;};');
function arena(realm=0){
  run(`defeated[${realm}]=false;enterRealm(${realm});state='play';enemies=[];bossStarted=true;boss.clock=999;initPlayer({x:level.arena.x+100,y:level.arena.y});player.inv=999;keys.clear();pressed.clear();`);
}
function jump(){press(' ');run('input(1/120);pressed.clear();');release(' ');}
function ground(){run('player.onGround=true;player.jumps=0;player.stun=0;coyote=0;jumpBuffer=0;');}
function bossFrames(seconds,fps=120){run(`for(let n=0;n<${Math.round(seconds*fps)};n++)updateBoss(1/${fps});`);}
function activeLeap(){arena();run("player.x=boss.x-180;chooseBossMove('jumpCut');startBossAttack();updateBoss(.25);");assert(run('boss.leap!==null&&boss.y<level.boss.y-boss.h'));}

// Accepted gameplay jump events, rather than the held key or an airborne frame,
// observe the first jump and produce at most one 40% roll on a later jump.
arena();jump();assert.equal(run('boss.jumpSeen'),true);assert.equal(run('boss.phase'),'wait');assert.equal(run('reactionRolls'),0);
run('for(let n=0;n<90;n++)input(1/120);');assert.equal(run('reactionRolls'),0,'Holding/air time cannot roll a reaction');
jump();assert.equal(run('reactionRolls'),0,'A rejected air jump cannot roll without double jump');
run('abilities[0]=true;reactionValue=.4;');jump();assert.equal(run('reactionRolls'),1);assert.equal(run('boss.phase'),'wait','Exactly 0.4 is outside the reaction interval');
ground();run('reactionValue=.39;');jump();assert.equal(run('reactionRolls'),2);assert.equal(run('boss.move'),'jumpCut');assert.equal(run('boss.phase'),'windup');
assert.equal(run('boss.cycles'),0,'Reactive moves do not consume the authored normal sequence');
const firstWindup=run('boss.clock');ground();jump();assert.equal(run('reactionRolls'),2);assert.equal(run('boss.clock'),firstWindup,'Jumping cannot restart an active windup');
run("setBossPhase('strike',.3);boss.move='cleave';");ground();jump();assert.equal(run('reactionRolls'),2);assert.equal(run('boss.move'),'cleave','An active attack cannot be interrupted');
run("setBossPhase('wait',999);boss.jumpCooldown=1;");ground();jump();assert.equal(run('reactionRolls'),2,'Cooldown blocks reaction rolls');
bossFrames(.5);assert(run('boss.jumpCooldown>0&&boss.jumpCooldown<1'));ground();jump();assert.equal(run('reactionRolls'),2);
bossFrames(.6);ground();jump();assert.equal(run('reactionRolls'),3);assert.equal(run('boss.move'),'jumpCut','The reaction returns after the cooldown');

// Neither a blocked/stunned input nor a jump before the fight starts is observed.
arena();run('bossStarted=false;');jump();assert.equal(run('boss.jumpSeen'),false);
run('bossStarted=true;player.stun=.5;');ground();run('player.stun=.5;');const rollsBeforeStun=run('reactionRolls');jump();assert.equal(run('boss.jumpSeen'),false);assert.equal(run('reactionRolls'),rollsBeforeStun);

// Normal AI contains a jump independently of the reactive branch and respects
// its cooldown rather than allowing a second jump attack immediately.
arena();const sequence=[];
for(let n=0;n<4;n++){run('chooseBossMove();');sequence.push(run('boss.move'));}
assert.deepEqual(sequence,['cleave','dash','doubleCut','jumpCut']);
run('boss.cycles=3;chooseBossMove();');assert.equal(run('boss.move'),'cleave');

// Target, facing and destination lock at windup; a fixed arc reaches the same
// arena-clamped landing at each supported frame rate, with a recovery window.
for(const fps of [30,60,120])for(const side of [-1,1]){
  arena();run(`boss.x=level.arena.x+level.arena.w/2;player.x=boss.x+${side}*10000;chooseBossMove('jumpCut');`);
  const target=run('boss.targetX'),face=run('boss.face'),to=run('boss.leap.toX'),floor=run('boss.leap.floorY'),from=run('boss.x');
  assert(Math.abs(to-from)<=run('SAMURAI_JUMP.maxTravel'));
  assert(run('boss.leap.toX>=level.arena.x+60&&boss.leap.toX+boss.w<=level.arena.x+level.arena.w-60'));
  run('player.x=boss.x-boss.face*500;');bossFrames(.6,fps);
  assert.equal(run('boss.phase'),'windup');assert.equal(run('boss.y'),floor);assert.equal(run('boss.targetX'),target);assert.equal(run('boss.face'),face);
  // Finish windup and integrate the actual updateBoss state machine.
  while(run("boss.phase==='windup'"))run(`updateBoss(1/${fps});`);
  let highest=floor,frames=0;
  while(run("boss.phase==='strike'")){
    run(`updateBoss(1/${fps});`);highest=Math.min(highest,run('boss.y'));frames++;
    assert(frames<fps*2,'Jump attack must terminate');
    assert(run('boss.x')>=Math.min(from,to)-.001&&run('boss.x')<=Math.max(from,to)+.001,'Arc cannot overshoot its locked endpoints');
    assert(run('boss.y')>=floor-run('SAMURAI_JUMP.height')-.001&&run('boss.y')<=floor,'Arc cannot escape its authored height or floor');
  }
  assert(Math.abs(highest-(floor-run('SAMURAI_JUMP.height')))<1,'Apex remains stable across frame rates');
  assert(Math.abs(run('boss.x')-to)<1e-7);assert.equal(run('boss.y'),floor);assert.equal(run('boss.leap'),null);
  assert.equal(run('boss.phase'),'recover');assert(run('boss.clock>=1'),'Landing grants a punish window');
  assert.equal(run('boss.face'),face);
}

// Hit windows are exercised against real damage(), not a mocked hit counter.
arena();run("player.x=boss.x-80;player.y=boss.y;player.inv=0;chooseBossMove('jumpCut');");
const hp=run('player.hp');bossFrames(.5);assert.equal(run('player.hp'),hp,'Windup is harmless even at body contact');
run('startBossAttack();');
for(let n=0;n<50;n++)run('player.x=boss.x-40;player.y=boss.y;player.inv=0;updateBoss(.01);');
assert.equal(run('player.hp'),hp,'Ascending body contact is harmless');
run('player.inv=0;player.x=boss.x-40;player.y=boss.y;updateBoss(.1);');
assert.equal(run('player.hp'),hp-2,'Descending sword strike deals 2 HP');
bossFrames(.15);assert.equal(run('player.hp'),hp-2,'Normal invulnerability prevents repeated damage from one descending strike');
arena();run("player.x=boss.x-100;chooseBossMove('jumpCut');startBossAttack();player.x=level.arena.x-500;player.inv=0;");
const dodgeHP=run('player.hp');bossFrames(1.05);assert.equal(run('player.hp'),dodgeHP,'Leaving the locked landing area dodges the attack');
run('player.x=boss.x;player.y=boss.y;player.inv=0;');bossFrames(.5);assert.equal(run('player.hp'),dodgeHP,'Recovery has no contact damage');

// All gameplay state freezes through the outer update loop in every modal.
for(const paused of ['pause','dialog','inventory','developer']){
  activeLeap();run(`state='${paused}';`);const frozen=run('JSON.stringify({boss,player,attack,dash,time})');
  h.tick(120);assert.equal(run('JSON.stringify({boss,player,attack,dash,time})'),frozen,paused+' freezes the arc and reaction cooldown');
}

// Retry/realm transitions replace transient observation, cooldown and in-flight
// state; permanent player abilities and upgrades survive normal death.
activeLeap();run('boss.jumpSeen=true;resetBossBattle();');assert(run('!boss.jumpSeen&&boss.jumpCooldown===0&&boss.leap===null'));assert.equal(run('boss.y'),run('level.boss.y-boss.h'));
activeLeap();run('boss.jumpSeen=true;abilities=[true,true];player.inv=0;damage(999);');assert(run('!boss.jumpSeen&&boss.jumpCooldown===0&&boss.leap===null'));assert(run('abilities.every(Boolean)'));
activeLeap();run('boss.jumpSeen=true;player.y=level.height+250;movePlayer(1/120);');assert(run('!boss.jumpSeen&&boss.jumpCooldown===0&&boss.leap===null'));
activeLeap();run('boss.jumpSeen=true;enterRealm(1);enterRealm(0);');assert(run('!boss.jumpSeen&&boss.jumpCooldown===0&&boss.leap===null'));

activeLeap();run('DevTools.open();');assert(run('DevSession.begin()'));assert(run('DevBoss.revive()'));
assert(run('!boss.jumpSeen&&boss.jumpCooldown===0&&boss.leap===null'));run('DevTools.close();');
run("bossStarted=true;chooseBossMove('jumpCut');startBossAttack();updateBoss(.3);boss.jumpSeen=true;DevTools.open();");
assert(run("DevTeleport.teleport({realm:'1',rest:levels[1].rests[0].id})"));
assert(run('!boss.jumpSeen&&boss.jumpCooldown===0&&boss.leap===null'));run('DevTools.close();DevSession.end();');

// Samurai observations do not change other realm boss state or their movesets.
for(const realm of [1,2]){
  arena(realm);const original=run('JSON.stringify(boss)'),rolls=run('reactionRolls');ground();jump();ground();jump();
  assert.equal(run('JSON.stringify(boss)'),original);assert.equal(run('reactionRolls'),rolls);
  assert(!run("bossMoves().includes('jumpCut')"));
  run('chooseBossMove();');assert.equal(run('boss.move'),realm===1?'hammer':'lightArrows');
}
console.log('PASS: accepted jump observations, deterministic 40% reactions, authored jump cycle, attack/cooldown guards, locked arc at 30/60/120 FPS, safe windup/ascent, 2 HP descending strike, dodge/recovery, modal freeze, death/reset/dev transitions and non-samurai isolation.');
