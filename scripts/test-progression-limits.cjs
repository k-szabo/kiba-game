'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
const near=(a,b,message)=>assert(Math.abs(a-b)<1e-10,message);
function training(){const h=harness();h.run('progression=freshProgression();awardXP(15950);abilities[1]=true;initPlayer(checkpoint);state="play";showTraining();');return h;}
for(const stat of ['vitality','strength']){
 const h=training(),r=h.run;
 for(let rank=1;rank<=29;rank++){
  const before=r('momoStats()');assert(r('spendPoint('+JSON.stringify(stat)+')'),'Earned points remain usable beyond rank12');
  assert.equal(r('progression.stats['+JSON.stringify(stat)+']'),rank);assert.equal(r('progression.points'),29-rank);
  const after=r('momoStats()');near(stat==='vitality'?after.maxHp-before.maxHp:after.damage-before.damage,stat==='vitality'?1:.5,'Each purchase changes its advertised stat');
  assert.doesNotThrow(()=>validate(r('saved')));
 }
 const frozen=r('JSON.stringify(progression)');assert(!r('spendPoint('+JSON.stringify(stat)+')'));assert.equal(r('JSON.stringify(progression)'),frozen);
 if(stat==='vitality'){assert(h.elements.get('health').innerHTML.includes('health-count'),'High HP stays compact in the HUD');assert(h.elements.get('health').innerHTML.includes('34 / 34'));}
 assert(h.elements.get('train-'+stat).disabled,'No remaining point means no further transaction');
 r('closeTraining();revive();mainMenu();startGame(true)');h.dismiss();assert.equal(r('JSON.stringify(progression)'),frozen,'Uncapped investment survives normal death and continue');
}
{
 const h=training(),r=h.run;
 for(let rank=1;rank<=7;rank++){const before=r('momoStats().dashCooldown');assert(r('spendPoint("spirit")'));assert(r('momoStats().dashCooldown')<before,'Every spirit purchase reduces cooldown');}
 near(r('momoStats().dashCooldown'),.38);assert.equal(r('progression.points'),22);assert(h.elements.get('train-spirit').disabled);
 const before=r('JSON.stringify(progression)');for(let i=0;i<8;i++)assert(!r('spendPoint("spirit")'),'Repeated/stale direct calls cannot spend at the floor');assert.equal(r('JSON.stringify(progression)'),before);
 r('closeTraining()');assert(!r('spendPoint("vitality")'),'Retained handlers cannot spend outside training');
 r('showTraining();player.x+=400');assert(!r('spendPoint("vitality")'),'Proximity is checked again on every transaction');
 assert(!r('spendPoint("__proto__")'));assert(!r('spendPoint("unknown")'));
}
{
 const h=training(),r=h.run;r('closeTraining();abilities[1]=false;showTraining()');assert(h.elements.get('spiritTraining').hidden);assert(!r('spendPoint("spirit")'));assert(!r('spendPoint("shield")'),'Ability acquisition remains required');
}
// Canonicalizing old wasted dash ranks refunds precisely the same point budget.
for(let rank=8;rank<=12;rank++){
 const h=training(),r=h.run;r('progression.stats.spirit='+rank+';progression.points='+(29-rank)+';closeTraining();persist()');
 const legacy=JSON.parse(r('JSON.stringify(saved)')),before=JSON.stringify(legacy),migrated=validate(legacy);
 assert.equal(migrated.progression.stats.spirit,7);assert.equal(migrated.progression.points,22);assert.equal(JSON.stringify(legacy),before,'Validation does not mutate the caller');assert.deepEqual(validate(migrated),migrated,'Refund normalization is idempotent');
 r('progression=normalizeProgression('+JSON.stringify(legacy.progression)+',flags)');assert.equal(r('progression.stats.spirit'),7);assert.equal(r('progression.points'),22);
}
{
 const h=training(),r=h.run;r('closeTraining();persist()');const valid=JSON.parse(r('JSON.stringify(saved)'));
 for(const [stat,value]of [['spirit',13],['shield',13],['vitality',30],['strength',30],['vitality',.5],['strength',-1],['vitality','29'],['spirit',Infinity]]){
  const data=structuredClone(valid);data.progression.stats[stat]=value;data.progression.points=0;assert.throws(()=>validate(data),'Malformed/over-budget allocation is rejected: '+stat+'='+value);
 }
 const excessive=structuredClone(valid);excessive.progression.stats.vitality=29;excessive.progression.points=1;assert.throws(()=>validate(excessive),'Removing a stat cap does not remove point conservation');
 const untouched=JSON.stringify(valid);assert.throws(()=>validate({...valid,progression:{...valid.progression,totalXp:0}}),'Level still requires earned XP');assert.equal(JSON.stringify(valid),untouched);
}
console.log('PASS: point-budget-only health/damage, effective seven-rank dash cap, stale training guards, death/continue retention, exact legacy refund and strict XP/allocation validation.');
