'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
function ready(){const h=harness();h.run("Prologue.stop();flags=levels.map(()=>[]);flags[0].push('forestBell','villageBell','shadowNinjaEscaped','haruAbducted','grapplingHook');flags[1].push('soulUpper','soulLower');flags[2].push('dawnSeal','shadowEntered');flags[3].push('hannahDefeated','guardian:Hannah','dawnblade','zigguratDescentAccepted','zigguratGateCleared','guardian:VoidGatekeeper','japanHeightsReached','zigguratReturnCompleted');defeated=[true,true,true,true];abilities=[true,true];state='play';CampQuest.enter('floatingIslands');enemies=[];");return h;}
for(const fps of [30,60,120]){
 const h=ready(),r=h.run;
 // Each descending crossing is reachable by real jump/grapple inputs; pulling
 // through the departure floor is never permitted by the swept collision.
 for(let island=3;island>0;island--){
  const p=r(`platforms.find(p=>p.id==='floating-island-${island}')`),lower=r(`platforms.find(p=>p.id==='floating-island-${island-1}')`);
  h.place(p.x+22,p.y);h.press({action:'moveLeft'});h.press({action:'jump'});r(`update(1/${fps});`);h.release({action:'jump'});r(`for(let i=0;i<${Math.ceil(fps*.12)};i++)update(1/${fps});`);h.release({action:'moveLeft'});
  assert.equal(r('Grapple.selection()?.id'),'island-return-ring-'+(island-1),'A return ring is selected from island '+island+' at '+fps+' FPS');
  h.press({action:'grapple'});r(`update(1/${fps});`);h.release({action:'grapple'});assert(r('Grapple.pullingPlayer()'));
  r(`for(let i=0;i<${fps*3};i++)update(1/${fps});`);
  assert(r('player.onGround'));assert(Math.abs(r('player.y+player.h')-lower.y)<1);assert(r('player.x')>=lower.x&&r('player.x+player.w')<=lower.x+lower.w);
 }
 // A cancelled cast retains a 2.5 second timer, frozen by menu pause.
 h.place(1780,2850);r('player.face=1;');assert(r('Grapple.activate()'));r('Grapple.cancel();');assert(!r('Grapple.activate()'));
 r("state='pause';Grapple.update(10);state='play';Grapple.update(2.49);");assert(!r('Grapple.activate()'),'Pause must not consume cooldown');r('Grapple.update(.02);');assert(r('Grapple.activate()'));r('Grapple.cancel();');
 // Original spawn is deliberately hundreds of pixels from the new landing.
 h.place(2600,2450);r("player.face=1;enemies=[createEnemy({id:'pulled',x:3200,y:2450,kind:'guard',shadowNinjaRole:'assassin',patrol:80,grappleable:true})];var victim=enemies[0];victim.windup=.4;victim.targetX=0;");
 assert(r('Grapple.activate()'));r(`for(let i=0;i<${fps};i++)update(1/${fps});`);
 assert(!r('victim.grappleFalling'));assert(r('Math.abs(victim.origin-2670)<50'));assert.equal(r('victim.baseY'),2450-r('victim.h'));assert.equal(r('victim.supportId'),'floating-island-1');
 const before=r('victim.x');r('attackFace=1;resolveMeleeDamage({amount:1,hit:{x:victim.x-1,y:victim.y-1,w:victim.w+2,h:victim.h+2}});');assert(Math.abs(r('victim.x')-before)<=18.01,'Hit knockback cannot teleport enemy to original spawn');
 r(`for(let i=0;i<${fps*3};i++)update(1/${fps});`);assert(r('victim.x<2800'),'Enemy patrol/aggro stays local after release');assert(r('victim.windup>0||victim.attackTime>0||victim.cd<1.5'),'Released enemy resumes combat');
}
console.log('PASS: downhill fixed-anchor return routes, paused 2.5s reuse/cancel protection, and rebased pulled enemy combat/knockback at 30/60/120 FPS.');
