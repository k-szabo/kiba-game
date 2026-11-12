/* Side-view route geometry, independent of the final background crops. */
'use strict';
function createThirdClanMaps({makeLevel,ledge,rest,zone}){
 const route=makeLevel('thirdClanPath',6070,3310,{x:245,y:625});
 route.name='thirdClan.path';
 route.boss={x:-10000,y:625};
 route.returnPoint={x:125,y:625};
 route.returnDestination={location:'ninjaClanCamp',x:1920,y:1020};
 route.grappleAnchors=[];
 const shelves=[
  [0,625,980],[850,950,880],[1580,1275,950],[2390,1600,920],
  [3140,1930,900],[3890,2260,930],[4650,2590,890],[5410,2900,660]
 ];
 for(const [index,[x,y,w]] of shelves.entries()){
  ledge(route,'third-clan-shelf-'+index,x,y,w,'ground',66);
  if(index<shelves.length-1)route.grappleAnchors.push({id:'third-clan-anchor-'+index,x:x+w-155,y:y-190,w:36,h:36});
 }
 rest(route,'thirdClanPathArrival',270,625,'thirdClan.rest.ledge');
 rest(route,'thirdClanLowerLedge',4000,2260,'thirdClan.rest.lowerLedge');
 route.ballistae=[{x:1390,y:950},{x:2810,y:1600},{x:4980,y:2590}].map((point,index)=>
  ({...point,id:ThirdClanRules.progress.ballistae[index]}));
 route.caveEntrance={x:5865,y:2900};
 for(const [index,[x,y]] of shelves.slice(1,-1).entries()){
  route.enemies.push({id:'thirdClanCultist'+index,x:x+165,y,kind:index%2?'mage':'guard',
   factionOverride:'shadowCult',patrol:125,combatStats:{hp:76,damage:3.5,xp:75}});
  route.enemies.push({id:'thirdClanNinja'+index,x:x+635,y,kind:'mage',shadowNinjaRole:'ninjutsu',
   dungeonSide:index>=3?'infected':'ninja',patrol:120,combatStats:{hp:index>=3?104:86,damage:4,xp:85}});
 }
 zone(route,route.name,0,0,route.width,route.height);

 const cave=makeLevel('thirdClanCave',2690,1430,{x:300,y:1030});
 cave.name='thirdClan.cave';
 cave.boss={x:-10000,y:1030};
 ledge(cave,'third-clan-cave-floor',0,1030,cave.width,'ground',300);
 rest(cave,'thirdClanCaveThreshold',330,1030,'thirdClan.rest.threshold');
 cave.returnPoint={x:130,y:1030};
 cave.returnDestination={location:route.id,...route.caveEntrance};
 cave.guardian={x:1590,y:1030,triggerX:770,left:650,right:2170};
 cave.haruTrail={x:2400,y:1030};
 zone(cave,cave.name,0,0,cave.width,cave.height);
 return {route,cave};
}
