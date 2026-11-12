/* Story raid geometry and encounter registration. */
'use strict';
function createStoryRaidMaps({makeLevel,ledge,rest,zone},cave){
 const floorY=1060;
 const width=5790;
 const arenaStarts=[440,2230,4020];
 const maps=Array.from({length:3},(_,tier)=>{
  const id='storyRaidTier'+(tier+1);
  const map=makeLevel(id,width,1550,{x:210,y:floorY});
  map.name='storyRaid.tier.'+(tier+1);
  map.boss={x:-10000,y:floorY};
  map.storyRaidTier=tier;
  ledge(map,id+'-floor',0,floorY,width,'ground',280);
  map.returnPoint={x:115,y:floorY};
  map.exitPoint={x:width-115,y:floorY};
  map.arenas=arenaStarts.map((x,index)=>{
   const encounter=StoryRaidRules.encounters[tier*arenaStarts.length+index];
   const restId=id+'Rest'+(index+1);
   const arena={x,y:floorY,w:1480,triggerX:x+110,restId,encounter,
    spawn:{x:x+1000,y:floorY},checkpoint:{x:x-145,y:floorY}};
   rest(map,restId,arena.checkpoint.x,arena.checkpoint.y,encounter.name);
   if(encounter.kind==='reikaMarks')arena.decoys=[440,760,1080].map(offset=>({x:x+offset,y:floorY}));
   if(encounter.kind==='westheruShot'){
    arena.signals=[310,740,1170].map(offset=>({x:x+offset,y:floorY}));
    arena.shipAnchor={x:x+195,y:floorY-210};
   }
   return arena;
  });
  zone(map,map.name,0,0,width,map.height);
  return map;
 });
 for(const [index,map] of maps.entries()){
  const previous=maps[index-1];
  map.returnDestination=previous?{location:previous.id,...previous.exitPoint}:{location:cave.id,...cave.haruTrail};
  if(maps[index+1])map.nextLocation=maps[index+1].id;
 }
 maps.at(-1).haru={x:5550,y:floorY};
 return maps;
}
