'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const routes=[
 {map:'yomiDungeon1',path:['dungeon-courtyard-ground0','dungeon-courtyard-ground1620','dungeon-courtyard-ground3240']},
 {map:'yomiDungeon2',path:['dungeon-crypt-entry','crypt-step1','crypt-gallery1','crypt-step2','crypt-gallery2','crypt-turn','crypt-descent1','crypt-descent2','crypt-descent3','crypt-descent4','dungeon-crypt-depths']},
 {map:'yomiDungeon3',path:['dungeon-thrones-ground0','dungeon-thrones-ground1120','dungeon-thrones-ground2340','dungeon-thrones-ground3760']},
 {map:'cultDungeon1',path:['sect-forecourt-ground0','sect-forecourt-ground1620','sect-forecourt-ground3520']},
 {map:'cultDungeon2',path:['sect-hall-ground0','sect-hall-ground1020','sect-hall-ground1440','sect-hall-ground2460','sect-hall-ground2880','sect-hall-ground4000','sect-hall-ground4420']},
 {map:'cultDungeon3',path:['sect-sanctum-ground0','sect-sanctum-ground1120','sect-sanctum-ground2240','sect-sanctum-ground3560','sect-sanctum-ground4580']}
];
function fixture(map,fps){
 const h=harness(),r=h.run;r('DevTools.open();DevSession.begin();DevTools.close();CampQuest.enter('+JSON.stringify(map)+');enemies=[];boss.dead=true;abilities=[false,false];const dungeonRouteDt=1/'+fps+';'+`
 function dungeonStep(direction=0,jump=false,drop=false){keys.clear();pressed.clear();if(direction)keys.add(Bindings.read(direction>0?'moveRight':'moveLeft')[0]);if(jump)pressed.add(Bindings.read('jump')[0]);if(drop)keys.add(Bindings.read('drop')[0]);update(dungeonRouteDt);player.inv=999;}
 function dungeonPlace(id){const p=platforms.find(p=>p.id===id);initPlayer({x:p.x+p.w/2,y:p.y});player.inv=999;}
 function dungeonLand(id){
  const target=platforms.find(p=>p.id===id),from=platforms.find(p=>p.id===player.support);if(!target||!from)return false;
  const launch=clamp(target.x+target.w/2,from.x+25,from.x+from.w-25);
  for(let i=0;i<${fps}*20&&Math.abs(player.x+player.w/2-launch)>5;i++){dungeonStep(Math.sign(launch-player.x-player.w/2));if(!player.onGround||player.support!==from.id)return false;}
  const aim=clamp(player.x+player.w/2,target.x+25,target.x+target.w-25);
  for(let i=0;i<${fps}*4;i++){const dx=aim-player.x-player.w/2;dungeonStep(Math.abs(dx)>5?Math.sign(dx):0,i===0,i===0&&target.y>from.y&&player.x+player.w>target.x&&player.x<target.x+target.w);if(player.onGround&&player.support===id)return true;if(player.y>target.y+400)return false;}return false;
 }
 `);return h;
}
for(const fps of [30,60,120])for(const route of routes){
 const h=fixture(route.map,fps),r=h.run;r('dungeonPlace('+JSON.stringify(route.path[0])+');');
 for(const id of route.path.slice(1))assert(r('dungeonLand('+JSON.stringify(id)+')'),route.map+' single-jump forward '+id+' at '+fps+' FPS');
 for(const id of route.path.slice(0,-1).reverse())assert(r('dungeonLand('+JSON.stringify(id)+')'),route.map+' single-jump return '+id+' at '+fps+' FPS');
 assert.equal(r('level.rests.length'),1,'Only the boss approach has a travel shrine');
 assert(r('level.checkpoints.every(p=>p.checkpointOnly===true)'),'Entry checkpoints are separate from shrines');
}
console.log('PASS: all six dungeon main routes and continuous returns use actual single-jump physics at30/60/120FPS; no extra travel shrines.');
