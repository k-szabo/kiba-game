/* World-space collision and fixed hook points for the four raid phases. */
'use strict';
function createSkyDragonRaidMaps({makeLevel,ledge,zone}){
 function room(phase,width,height,start){
  const id='skyDragonRaid'+phase[0].toUpperCase()+phase.slice(1);
  const map=makeLevel(id,width,height,start);
  map.name='skyDragonRaid.'+phase;
  map.boss={x:-10000,y:start.y};
  map.skyDragonRaid=phase;
  map.returnDestination={location:'ninjaClanCamp',x:2350,y:1020};
  map.grappleAnchors=[];
  zone(map,map.name,0,0,width,height);
  return map;
 }
 function ring(map,id,x,y){map.grappleAnchors.push({id,x:x-18,y:y-18,w:36,h:36});}
 function ledges(map,spans){
  spans.forEach(([x,y,w],index)=>{
   ledge(map,`${map.id}-ledge-${index}`,x,y,w,'stone',48);
   if(index>0)ring(map,`${map.id}-ring-${index}`,x+105,y-240);
  });
 }

 const harbor=room('harbor',3500,1800,{x:220,y:1240});
 ledge(harbor,'skyport-deck',0,1240,3500,'ground',240);
 harbor.ballistas=[640,1650,2660].map(x=>({x,y:1240}));
 harbor.returnPoint={x:120,y:1240};
 harbor.boardPoint={x:3250,y:1240};
 ring(harbor,'skyport-west-crane',1110,1030);
 ring(harbor,'skyport-east-crane',2110,1030);

 const pursuit=room('pursuit',3100,1600,{x:340,y:1060});
 ledge(pursuit,'sky-ship-deck',200,1060,1560,'ground',90);
 pursuit.helm={x:440,y:1060};
 pursuit.reika={x:1440,y:1060};
 pursuit.boardingRing='sky-dragon-boarding';
 ring(pursuit,pursuit.boardingRing,2310,885);
 pursuit.grappleAnchors[0].disabled=true;

 const back=room('back',6150,1900,{x:260,y:1340});
 ledges(back,[[100,1340,460],[1190,1180,400],[2240,1020,430],[3280,1190,400],[4300,1020,470],[5380,885,650]]);
 back.cultists=back.platforms.slice(1,-1).map(({x,y,w})=>({x:x+w-90,y}));
 back.headGuard={x:5780,y:885};

 const rift=room('rift',8800,2100,{x:250,y:1510});
 ledges(rift,[[80,1510,480],[1180,1350,340],[2110,1190,350],[3050,1330,360],[4010,1120,360],
  [4970,1290,360],[5920,1090,365],[6830,980,680]]);
 rift.fracturePlatforms=rift.platforms.slice(1,-1).map(platform=>platform.id);
 rift.headRing=rift.grappleAnchors.at(-1).id;
 rift.dragonHead={x:7290,y:980};
 return {harbor,pursuit,back,rift};
}
