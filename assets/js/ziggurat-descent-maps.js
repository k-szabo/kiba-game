/* Main-story exit route and peaceful Japan arrival; registered by levels.js. */
'use strict';
function createZigguratDescentMaps({makeLevel,ledge,rest,foe,zone}){
 const zigguratDepths=makeLevel('zigguratDepths',3600,3300,{x:320,y:360});
 Object.assign(zigguratDepths,{name:'descent.depths',enemyRealm:3,descent:true,boss:{x:-2000,y:2920}});
 ledge(zigguratDepths,'descent-entry-floor',0,360,1000,'ground',180);
 // Overlapping 80px treads make the whole descent reversible with one jump.
 // Only the entry and arena are solid ground; intermediate treads permit drop-through.
 for(let i=0;i<31;i++){
  const turn=8-Math.abs(8-(i%16)),x=840+210*turn,y=440+i*80;
  ledge(zigguratDepths,'descent-stair-'+i,x,y,i===7||i===23?660:440,'stone',32);
 }
 ledge(zigguratDepths,'descent-arena-floor',1200,2920,2400,'ground',380);
 rest(zigguratDepths,'descentEntrance',420,360,'descent.rest.entrance');
 rest(zigguratDepths,'descentGate',1480,2920,'descent.rest.gate');
 zigguratDepths.returnPoint={x:160,y:360};
 zigguratDepths.returnDestination={location:'zigguratInterior',x:2350,y:2420};
 zigguratDepths.arena={x:1700,y:2920,w:1700,triggerX:1850,restId:'descentGate'};
 zigguratDepths.portalPoint={x:3380,y:2920};
 zigguratDepths.portalDestination={location:'japanHeights'};
 const add=(id,x,y,kind,factionOverride,patrol=60)=>{
  foe(zigguratDepths,id,x,y,kind,null,patrol);
  Object.assign(zigguratDepths.enemies.at(-1),{factionOverride});
 };
 add('descent-entry-cultist',720,360,'guard','shadowCult',60);
 for(const [index,kind,faction]of [[3,'archer','shadowCult'],[7,'shield','yomi'],[11,'mage','shadowCult'],[15,'guard','yomi'],[19,'shield','shadowCult'],[23,'mage','yomi'],[27,'guard','shadowCult']]){
  const p=zigguratDepths.platforms.find(item=>item.id==='descent-stair-'+index);
  add('descent-soldier-'+index,p.x+200,p.y,kind,faction,60);
 }
 for(const [index,role]of [[9,'blade'],[17,'bow'],[25,'mage']]){
  const p=zigguratDepths.platforms.find(item=>item.id==='descent-stair-'+index);
  foe(zigguratDepths,'descent-void-'+role,p.x+180,p.y,role==='bow'?'archer':role==='mage'?'mage':'guard',null,50);
  Object.assign(zigguratDepths.enemies.at(-1),{voidKeeperRole:role,name:'fia.void.'+role});
 }
 foe(zigguratDepths,'voidGatekeeper',2650,2920,'guard',null,380);
 Object.assign(zigguratDepths.enemies.at(-1),{miniboss:'voidGatekeeper',name:'descent.gatekeeper',arena:zigguratDepths.arena});
 zigguratDepths.arenaEncounters=zigguratDepths.enemies.filter(enemy=>enemy.miniboss);
 zone(zigguratDepths,zigguratDepths.name,0,0,3600,3300);

 const japanHeights=makeLevel('japanHeights',4200,1500,{x:320,y:1100});
 Object.assign(japanHeights,{name:'descent.heights',enemyRealm:0,descent:true,peaceful:true,boss:{x:-2000,y:1100},arena:{x:-2000,y:1100,w:0}});
 ledge(japanHeights,'heights-main-ground',0,1100,4200,'ground',400);
 // Optional view terraces have a single-jump route back to the main trail.
 for(const [i,x,y,w]of [[0,1100,1020,400],[1,1360,940,400],[2,1620,860,540],[3,2070,940,400],[4,2330,1020,400]])ledge(japanHeights,'heights-view-'+i,x,y,w,'stone',32);
 rest(japanHeights,'japanHeightsArrival',500,1100,'descent.rest.heights');
 japanHeights.returnPoint={x:180,y:1100};
 japanHeights.returnDestination={location:'zigguratDepths',x:3380,y:2920};
 japanHeights.haruPoint={x:3200,y:1100};
 zone(japanHeights,japanHeights.name,0,0,4200,1500);
 return {zigguratDepths,japanHeights};
}
