'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
for(const fps of [30,60,120]){
 const h=harness(),r=h.run;
 r(`Prologue.stop();abilities=[true,true];defeated=[true,true,true,true];flags[3]=['hannahDefeated'];CampQuest.enter('dragonCatacombs',{save:false});state='play';
 function raidRouteStep(direction=0,jump=false){keys.clear();pressed.clear();if(direction)keys.add(Bindings.read(direction>0?'moveRight':'moveLeft')[0]);if(jump)pressed.add(Bindings.read('jump')[0]);update(1/${fps});player.inv=999;}
 function raidRouteLand(id){
  const target=platforms.find(p=>p.id===id),from=platforms.find(p=>p.id===player.support);if(!from||!target)return false;
  const launch=clamp(target.x+target.w/2,from.x+25,from.x+from.w-25);
  for(let i=0;i<${fps}*15&&Math.abs(player.x+player.w/2-launch)>5;i++)raidRouteStep(Math.sign(launch-player.x-player.w/2));
  const aim=target.x+target.w/2;
  for(let i=0;i<${fps}*4;i++){raidRouteStep(Math.abs(aim-player.x-player.w/2)>5?Math.sign(aim-player.x-player.w/2):0,i===0||i===Math.round(.28*${fps}));if(player.onGround&&player.support===id)return true;}
  return false;
 }
 initPlayer({x:740,y:1300});for(let i=0;i<5;i++)raidRouteStep();`);
 for(let i=0;i<8;i++)assert(r(`raidRouteLand('dragon-wing-${i}')`),'Wing path '+i+' at '+fps+' FPS');
 assert.equal(r("flags[3].includes('dragonRaidFirstClear')"),false,'Traversal cannot grant a victory');
}
console.log('PASS: the complete chained-wing route is traversable through actual input/gravity/collision with double jump at 30/60/120 FPS.');
