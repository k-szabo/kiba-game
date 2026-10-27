'use strict';
const assert=require('node:assert/strict'),setup=require('./test-fia-fixture.cjs'),validate=require('./test-save-validation.cjs'),cryptoHelpers=require('./test-save-release.cjs');
const copy=value=>JSON.parse(JSON.stringify(value));
async function main(){
 for(const room of [false,true]){
  const h=setup(room),r=h.run;r("var npc=level.npcs.find(n=>n.id==='fia');initPlayer({x:npc.x-70,y:npc.y});player.hp=2.5;FiaConflict.provoke({x:npc.x-35,y:npc.y-130,w:70,h:130});");
  const baseline=copy(r('saved'));assert.doesNotThrow(()=>validate(baseline));
  const env=cryptoHelpers.storageEnvironment(),first=cryptoHelpers.client(env);await first.vault.ready;await first.vault.write(baseline);assert.deepEqual(copy(await cryptoHelpers.client(env).vault.ready),baseline,'Real WebCrypto roundtrip retains the frozen recovery baseline');
  for(const change of [s=>s.fiaRecovery=null,s=>s.fiaRecovery.x=-1,s=>s.fiaRecovery.x=Number.MAX_VALUE,s=>s.fiaRecovery.feet=1,s=>s.fiaRecovery.hp=99,s=>s.fiaRecovery.hp=0,s=>s.fiaRecovery.face=0,s=>s.fiaRecovery.extra=true,s=>s.fiaRecovery.location='forestCamp',s=>s.fiaRecovery.tea.pulses=4,s=>s.fiaRecovery.tea.elapsed=2,s=>s.fiaRecovery.tea.elapsed=.1,s=>s.fiaRecovery.tea.extra=1,s=>s.chickenCount=-1,s=>s.chickenCount=.5,s=>s.chickenCount=Number.MAX_SAFE_INTEGER+1,s=>s.quickHeal='roastChicken']){
   const invalid=copy(baseline);change(invalid);assert.throws(()=>validate(invalid),/Invalid/);assert.throws(()=>first.vault.write(invalid),/Invalid/);
  }
  h.dismiss();r('var fury=FiaConflict.enemy;fury.hp=0;FiaCombat.defeat(fury);');h.dismiss();const victory=copy(r('saved'));assert.doesNotThrow(()=>validate(victory));await first.vault.write(victory);assert.deepEqual(copy(await cryptoHelpers.client(env).vault.ready),victory,'Permanent hostility and one bonus point survive encrypted reload');
  for(const flag of ['fiaSlain','fiaRewardClaimed','kitsuneSoul','kibaShield']){const invalid=copy(victory);invalid.flags[3]=invalid.flags[3].filter(x=>x!==flag);assert.throws(()=>validate(invalid),/Invalid/);}
  const stale=copy(victory);stale.release='0.0.0_00000000';assert.throws(()=>first.vault.write(stale),/Invalid/);
 }
 const h=setup(),r=h.run;r("flags[3].push('fiaChambersHeard','fiaTalismanAccepted','priestessTalisman','fiaTalismanCompleted');flags[0].push('cultTempleDiscovered','sectRunStarted','sectStage1Clear','sectStage2Clear','sectStage3Clear','sectGuardReward','sectAngelReward','sectPriestessReward','highPriestessSoul');dungeonState.runs.sectFall.run=1;progression.points=3;chickenCount=3;quickHeal='roastChicken';persist();");
 const completed=copy(r('saved'));assert.doesNotThrow(()=>validate(completed));for(const flag of ['fiaChambersHeard','fiaTalismanAccepted','priestessTalisman']){const invalid=copy(completed);invalid.flags[3]=invalid.flags[3].filter(x=>x!==flag);assert.throws(()=>validate(invalid),/Invalid/);}
 const env=cryptoHelpers.storageEnvironment(),client=cryptoHelpers.client(env);await client.vault.ready;await client.vault.write(completed);assert.deepEqual(copy(await cryptoHelpers.client(env).vault.ready),completed);const empty=copy(completed);empty.chickenCount=0;assert.doesNotThrow(()=>validate(empty));delete empty.chickenCount;assert.doesNotThrow(()=>validate(empty),'Omitted optional stock stays compatible within the synthetic current-format fixtures');
 console.log('PASS: strict Fia quest/reward/chicken chains, bounded nonrecursive HP/position/tea recovery anchors, malformed and stale records rejected, and actual WebCrypto encrypted recovery/victory/consumable roundtrips.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
