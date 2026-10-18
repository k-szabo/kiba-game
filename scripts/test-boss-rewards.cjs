const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
function setup(realm=0,secret=false){
 const h=harness(),r=h.run;
 r(`Prologue.stop();abilities=[${realm>0},${realm>1}];defeated=[${realm>0},${realm>1},false,false];
 flags=[['forestBell','villageBell'],['soulUpper','soulLower'],['dawnSeal'],[]];visitedRests=levels.map((l,n)=>n<3?l.rests.map(s=>s.id):[]);progression=freshProgression();
 ${secret?"flags[0].push('guardian:oldAngel','angelHalo','guardian:oldCultist','demonHorn');":''}
 enterRealm(${realm});state='play';bossStarted=true;enemies=[];boss.inv=0;`);
 return h;
}
for(let realm=0;realm<3;realm++){
 const h=setup(realm),r=h.run,reward=r(`BOSS_REWARDS[${realm}]`);
 const startWrites=r('window.__saveSnapshots.length');
 r('boss.hp=0;guardianDefeated();');
 const p=h.snap().progression;
 assert.equal(p.totalXp,[250,400,600][realm]);
 assert.equal(p.points,p.level-1+1,'Every realm boss grants exactly one extra point');
 assert(r(`flags[${realm}].includes('${reward.id}')&&flags[${realm}].includes('${reward.claim}')`));
 assert(r(`Inventory.contents().includes('${reward.id}')`),'Earned soul must appear in the shared inventory');
 for(const save of r(`window.__saveSnapshots.slice(${startWrites})`))assert.doesNotThrow(()=>validate(JSON.parse(save)),'Every intermediate victory snapshot must be complete and valid');
 const once=r('JSON.stringify([progression,flags,shards])');r('guardianDefeated();');
 assert.equal(r('JSON.stringify([progression,flags,shards])'),once);
 h.dismiss();r('player.inv=0;damage(999);');assert.equal(r('JSON.stringify([progression,flags,shards])'),once,'Death loses boss rewards');
 r('initPlayer(checkpoint);interact();');h.dismiss();assert.equal(r('JSON.stringify([progression,flags,shards])'),once,'Shrine grants or loses rewards');
 r("mainMenu();startGame(true);");h.dismiss();assert.equal(r('JSON.stringify([progression,flags,shards])'),once,'Resume loses bonus points or souls');
 // Spend a point and resume: normalization must preserve both the allocation
 // and the unspent share of the enlarged budget.
 r("initPlayer(checkpoint);state='play';showTraining();");assert(r("spendPoint('vitality')"));r('closeTraining();');
 const spent=r('JSON.stringify(progression)');r('mainMenu();startGame(true);');h.dismiss();assert.equal(r('JSON.stringify(progression)'),spent);
 assert.doesNotThrow(()=>validate(r('saved')));
 const travel=r('JSON.stringify([progression,flags,shards])');
 r("state='play';");assert(r(`fastTravel(levels[${realm}].rests[0],${realm})`));
 assert.equal(r('JSON.stringify([progression,flags,shards])'),travel,'Fast travel changes rewards');
 // Test-only boss replays retain the ledger; a second victory cannot farm XP.
 r('DevTools.open();DevSession.begin();DevBoss.revive();DevTools.close();');
 const replay=r('JSON.stringify([progression,flags,shards])');r('boss.hp=0;guardianDefeated();');
 assert.equal(r('JSON.stringify([progression,flags,shards])'),replay);
 h.dismiss();r('DevTools.open();');assert(r('DevLevel.setLevel({level:1})'));
 assert.equal(r('progression.points+Object.values(progression.stats).reduce((a,b)=>a+b,0)'),reward.points,'Dev level reduction loses earned bonus');
 assert(r('DevLevel.setLevel({level:LEVEL_LIMIT})'));
 assert.equal(r('progression.points+Object.values(progression.stats).reduce((a,b)=>a+b,0)'),11+reward.points);
}
// Possession is not the once-only ledger. A test-spawned soul neither gives
// stats by itself nor prevents the first legitimate reward bundle.
{
 const h=setup(),r=h.run;r("flags[0].push('oathbreakerSoul');");
 assert.equal(r('bossBonusPoints(flags)'),0);r('boss.hp=0;guardianDefeated();');
 assert.equal(r('progression.totalXp'),250);assert.equal(r("flags[0].filter(f=>f==='oathbreakerSoul').length"),1);
}
// A celestial transformation is not a victory. Only the optional third
// form's final defeat awards the single bundle and preserves the relic fusion.
{
 const h=setup(2,true),r=h.run;
 r('boss.hp=0;checkBossHealth();');assert.equal(r('boss.stage'),2);assert.equal(r('progression.totalXp'),0);
 r('boss.hp=0;checkBossHealth();');assert.equal(r('boss.stage'),3);assert.equal(r('progression.points'),0);assert.equal(r("flags[2].includes('seraphSoul')"),false);
 r('boss.hp=0;checkBossHealth();');assert.equal(r('progression.totalXp'),600);assert(r("flags[2].includes('seraphSoul')&&flags[2].includes('eclipseRelic')"));
 assert.doesNotThrow(()=>validate(r('saved')));
}
{
 const h=harness({prologue:true}),r=h.run,before=r('JSON.stringify([flags,progression])');
 r('guardianDefeated();');assert.equal(r('JSON.stringify([flags,progression])'),before,'Dream boss awarded a realm reward');
}
console.log('PASS: unique 250/400/600 XP and one bonus point per boss, atomic valid snapshots, spent/unspent reload, death/shrine persistence, replay/spawn/level isolation and final angel phase only.');
