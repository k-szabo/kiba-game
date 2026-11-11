'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
const h=harness(),r=h.run;
assert.equal(r('LEVEL_LIMIT'),50);assert.equal(r('STAT_LIMIT'),12);
// Every threshold is reached by ordinary XP awards.
r('progression=freshProgression();');
let total=0;
for(let n=1;n<50;n++){
 const needed=60+(n-1)*35;
 r(`awardXP(${needed-1});`);total+=needed-1;
 assert.equal(h.snap().progression.level,n);assert.equal(h.snap().progression.xp,needed-1);
 assert.equal(h.snap().progression.points,n-1);assert.equal(h.snap().progression.totalXp,total);
 validate(JSON.parse(r('JSON.stringify(saved)')));
 r('awardXP(1);');total++;
 assert.equal(h.snap().progression.level,n+1);assert.equal(h.snap().progression.xp,0);
 assert.equal(h.snap().progression.points,n);validate(JSON.parse(r('JSON.stringify(saved)')));
}
assert.equal(total,44100);assert.equal(h.elements.get('xpLabel').textContent,'MAX');assert.equal(h.elements.get('xpFill').style.width,'100%');
r('awardXP(1700);');assert.equal(h.snap().progression.level,50);assert.equal(h.snap().progression.points,49);assert.equal(h.snap().progression.totalXp,45800);
// More than one level in a single award produces the same earned budget.
r('progression=freshProgression();awardXP(45800);');assert.equal(h.snap().progression.level,50);assert.equal(h.snap().progression.totalXp,45800);
const before=r('JSON.stringify(progression)');
for(const bad of ['NaN','Infinity','-1','0','.5','Number.MAX_SAFE_INTEGER+1']){r(`awardXP(${bad});`);assert.equal(r('JSON.stringify(progression)'),before);}
// All 49 ordinary points can be used, with no stat exceeding its own limit.
r('abilities[1]=true;initPlayer(checkpoint);state="play";showTraining();');
for(const [stat,count] of [['vitality',22],['strength',22],['spirit',5]]){
 for(let i=0;i<count;i++)assert(r(`spendPoint('${stat}')`));

}
assert.equal(h.snap().progression.points,0);assert.equal(h.snap().player.maxHp,27);assert.equal(h.snap().stats.damage,13);
assert(!r("spendPoint('spirit')"));validate(JSON.parse(r('JSON.stringify(saved)')));
const allocated=r('JSON.stringify(progression)');
r('closeTraining();revive();mainMenu();startGame(true);');assert.equal(r('JSON.stringify(progression)'),allocated);
assert.equal(h.snap().player.maxHp,27);
// Legacy spirit ranks beyond the effective cap refund their points; lifetime XP is preserved.
r('progression=normalizeProgression({level:50,totalXp:15000000,stats:{spirit:12}},flags);');
assert.equal(h.snap().progression.totalXp,15000000);assert.equal(h.snap().progression.stats.spirit,7);assert.equal(h.snap().progression.points,42);
r('progression.totalXp=Number.MAX_SAFE_INTEGER-2;awardXP(9);');assert.equal(h.snap().progression.totalXp,Number.MAX_SAFE_INTEGER);validate(JSON.parse(r('JSON.stringify(saved)')));
r('awardXP(1);');assert.equal(h.snap().progression.totalXp,Number.MAX_SAFE_INTEGER);
const old=JSON.parse(r('JSON.stringify(saved)'));
old.progression={level:30,totalXp:17050,xp:0,points:8,stats:{vitality:10,strength:8,spirit:3,shield:0}};
assert.throws(()=>validate(old),/Invalid save schema/);
const migrated=validate(old,{legacyLevelCap:true});
assert.deepEqual(JSON.parse(JSON.stringify(migrated.progression)),{...old.progression,level:31,xp:25,points:9});
assert.doesNotThrow(()=>validate(migrated));
assert.throws(()=>validate({...old,progression:{...old.progression,points:9}},{legacyLevelCap:true}),/Invalid save schema/);
// Realm difficulty is fixed at spawn, independent of Momo's level, and XP is awarded once.
for(const [realm,hp,damage,xp] of [[0,4,1,20],[1,6,1,28],[2,7,2,36],[3,9,2,44]]){
 r(`realm=${realm};enterRealm(${realm});state='play';progression=freshProgression();var foe=createEnemy({id:'scaling',x:level.start.x,y:level.start.y,kind:'guard',patrol:50});enemies=[foe];`);
 assert.equal(r('foe.maxHp'),hp);assert.equal(r('foe.damageValue'),damage);
 r('foe.hp=0;killEnemy(foe);killEnemy(foe);');assert.equal(h.snap().progression.totalXp,xp);
 r('respawnEnemies();');assert.equal(r("enemies.find(e=>!e.miniboss&&e.kind==='guard').maxHp"),hp);
 // Melee, contact and ranged projectiles all use the authored tier's damage.
 r("var fighter=createEnemy({id:'hit',x:level.start.x,y:level.start.y,kind:'guard',patrol:50});enemies=[fighter];player.x=fighter.x+fighter.w;player.y=fighter.y;player.hp=17;player.maxHp=17;player.inv=0;fighter.face=1;releaseEnemyAttack(fighter);");
 assert.equal(r('player.hp'),17-damage);
 r('player.inv=0;player.x=fighter.x;player.y=fighter.y;fighter.cd=999;fighter.contactCd=0;fighter.recovery=999;updateEnemies(.01);');assert.equal(r('player.hp'),17-2*damage);
 for(const kind of ['archer','mage']){
  r(`var ranged=createEnemy({id:'shot',x:level.start.x,y:level.start.y,kind:'${kind}',patrol:50});ranged.targetX=player.x;ranged.targetY=player.y;projectiles=[];releaseEnemyAttack(ranged);`);
  assert(r('projectiles.length>0'));assert(r(`projectiles.every(p=>p.damage===${damage})`));
 }
}
r("enterRealm(0);progression=normalizeProgression({level:30,totalXp:15950},flags);var returning=createEnemy({id:'return',x:330,y:1000,kind:'guard',patrol:50});");
assert.equal(r('returning.maxHp'),4);assert.equal(r('returning.xpValue'),20);
// Summons retain their original damage/8 XP, including in a late-world test fight.
r("enterRealm(3);progression=freshProgression();var minion=createEnemy({id:'summon',x:level.start.x,y:level.start.y,kind:'guard',patrol:50,summoned:true});minion.hp=0;killEnemy(minion);");
assert.equal(r('minion.maxHp'),4);assert.equal(r('minion.damageValue'),1);assert.equal(h.snap().progression.totalXp,8);
console.log('PASS: ordinary XP reaches level 50, legacy cap migration preserves stats and lifetime XP, overflow is safe, and realm difficulty remains fixed.');
