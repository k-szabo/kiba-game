'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
for(const fps of [30,60,120]){
 const h=harness(),r=h.run;r(`DevTools.open();DevSession.begin();DevTools.close();Prologue.stop();abilities=[true,true];CampQuest.enter('shadowUnderworld',{save:false});state='play';
 function routeTick(direction=0,jump=false){keys.clear();pressed.clear();if(direction)keys.add(Bindings.read(direction>0?'moveRight':'moveLeft')[0]);if(jump)pressed.add(Bindings.read('jump')[0]);update(1/${fps});player.inv=999;}
 function routeLand(id){const target=platforms.find(p=>p.id===id),from=platforms.find(p=>p.id===player.support);if(!from||!target)return false;const aim=target.x+target.w/2,launch=clamp(aim,from.x+25,from.x+from.w-25);for(let i=0;i<${fps}*15&&Math.abs(player.x+player.w/2-launch)>5;i++)routeTick(Math.sign(launch-player.x-player.w/2));for(let i=0;i<${fps}*5;i++){routeTick(Math.abs(aim-player.x-player.w/2)>5?Math.sign(aim-player.x-player.w/2):0,i===0||i===Math.round(.28*${fps}));if(player.onGround&&player.support===id)return true;}return false;}
 initPlayer({x:1020,y:2021});for(let i=0;i<5;i++)routeTick();`);
 for(const id of ['underworld-step-7','underworld-step-6','underworld-step-5','underworld-step-4','underworld-floor-1','underworld-step-3','underworld-step-2','underworld-step-1','underworld-step-0','underworld-floor-0'])assert(r('routeLand('+JSON.stringify(id)+')'),id+' at'+fps+' FPS');
 r("DevTools.open();");for(const id of ['fiaRitual','shadowUnderworld','voidForbidden']){const rest=r('SIDE_LOCATIONS['+JSON.stringify(id)+'].map.rests[0].id');assert(r('DevTeleport.teleport('+JSON.stringify({realm:id,rest})+')'));assert.equal(r('level.id'),id);}
 assert(r("DevBoss.revive({encounter:'voidEncounter'})"));assert(r('VoidEncounter.live()'));r('DevTools.close();VoidEncounter.hit(VoidEncounter.actor,10000);VoidEncounter.update(2);VoidEncounter.hit(VoidEncounter.actor,10000);');assert(!r("flags[3].includes('voidDemonDefeated')"));assert.equal(r('fiaJourney.voidInfection'),0);r('DevSession.end();');
}
console.log('PASS: full return climb through all three underworld tiers with actual input/gravity/collision at30/60/120FPS; all three new dev destinations and reward-free void replay.');
