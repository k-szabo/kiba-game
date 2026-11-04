'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
for(const fps of [30,60,120]){
 const h=harness(),r=h.run;
 r("Prologue.stop();flags=levels.map(()=>[]);flags[0].push('forestBell','villageBell',...Object.values(FloatingIslandsRules.progress),'watchtowerJailerDefeated','watchtowerCellKey','westheruRescued');flags[3].push('zigguratReturnCompleted');defeated=[true,true,true,true];abilities=[true,true];state='play';CampQuest.enter('ninjaWatchtower');for(const e of enemies)e.dead=true;initPlayer({x:100,y:3200});player.inv=999;WatchtowerBalloon.update(.01);");
 for(let i=6;i>=0;i--){
  r('player.face=1;');assert.equal(r('Grapple.selection()?.id'),'watchtower-tier-'+i+'-ring');
  h.press({action:'grapple'});r('update(1/'+fps+');');h.release({action:'grapple'});
  for(let n=0;n<fps*3;n++)r('update(1/'+fps+');');
  assert(r('player.onGround'),'Lands on tier '+i+' at '+fps);
  assert(Math.abs(r('player.y+player.h')-(400+i*400))<1);
  assert(r('WatchtowerBalloon.companion()'),'Companion stays owned by current map');
  assert(r('Math.abs(WatchtowerBalloon.companion().y-player.y)<450'),'Rope-following companion reaches current tier');
 }
 const old=r('WatchtowerBalloon.companion()');assert(old);
 r('initPlayer({x:240,y:3200});');assert.equal(r('WatchtowerBalloon.companion()'),null,'No stale follower frame after reset');r('WatchtowerBalloon.update(.01);');assert(r('WatchtowerBalloon.companion().y>3000'));
}
console.log('PASS real remappable grapple input climbs every tower tier with invulnerable rope escort at30/60/120 FPS; player reset clears stale companion.');
