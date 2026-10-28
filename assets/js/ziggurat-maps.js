/* Registered fourth-realm side routes; helpers are supplied by levels.js. */
'use strict';
function createZigguratMaps({makeLevel,ledge,rest,foe,zone}){
 const zigguratApproach=makeLevel('zigguratApproach',5200,1400,{x:260,y:1000});
 const zigguratInterior=makeLevel('zigguratInterior',2700,2800,{x:320,y:1700});
 const zigguratSummit=makeLevel('zigguratSummit',3000,1800,{x:260,y:1400});
 for(const [map,kind] of [[zigguratApproach,'approach'],[zigguratInterior,'interior'],[zigguratSummit,'summit']]){
  map.name='ziggurat.'+kind;map.ziggurat=kind;map.enemyRealm=3;
  map.boss={x:-1000,y:map.start.y};
 }

 for(const [id,x,y,w] of [
  ['ziggurat-approach-west',0,1000,1600],
  ['ziggurat-approach-middle',1760,1000,1500],
  ['ziggurat-approach-east',3420,1000,1780]
 ])ledge(zigguratApproach,id,x,y,w,'ground',180);
 ledge(zigguratApproach,'ziggurat-approach-west-bridge',1510,910,360);
 ledge(zigguratApproach,'ziggurat-approach-east-bridge',3150,910,380);
 rest(zigguratApproach,'zigguratApproachEntrance',320,1000,'ziggurat.rest.approach');
 rest(zigguratApproach,'zigguratApproachGate',4300,1000,'ziggurat.rest.gate');
 zigguratApproach.returnPoint={x:120,y:1000};
 zigguratApproach.returnDestination={realm:3,restId:'cathedral',x:10680,y:1200};
 zigguratApproach.nextPoint={x:4920,y:1000};
 zigguratApproach.nextDestination={location:'zigguratInterior'};
 zigguratApproach.arena={x:-1000,y:1000,w:0,restId:'zigguratApproachEntrance'};

 ledge(zigguratInterior,'ziggurat-interior-entry',0,1700,1600,'ground',180);
 // Every main-path rise is 90px; overlapping treads permit a single jump.
 for(let i=0;i<14;i++)ledge(zigguratInterior,'ziggurat-interior-ascent-'+(i+1),i%2?1070:800,1610-i*90,360);
 ledge(zigguratInterior,'ziggurat-interior-upper',700,440,1100);
 // The optional lower branch opens beyond the entrance floor's east edge.
 // These treads also provide a single-jump return from the lowest chamber.
 for(let i=0;i<7;i++)ledge(zigguratInterior,'ziggurat-interior-descent-'+(i+1),i%2?1920:1650,1790+i*90,360);
 ledge(zigguratInterior,'ziggurat-interior-depths',1450,2420,1150,'ground',300);
 rest(zigguratInterior,'zigguratInteriorEntrance',320,1700,'ziggurat.rest.interior');
 rest(zigguratInterior,'zigguratInteriorUpper',820,440,'ziggurat.rest.upper');
 rest(zigguratInterior,'zigguratInteriorDepths',2350,2420,'ziggurat.rest.depths');
 zigguratInterior.returnPoint={x:120,y:1700};
 zigguratInterior.returnDestination={location:'zigguratApproach',x:4920,y:1000};
 zigguratInterior.nextPoint={x:1500,y:440};
 zigguratInterior.nextDestination={location:'zigguratSummit'};
 zigguratInterior.arena={x:-1000,y:1700,w:0,restId:'zigguratInteriorEntrance'};

 ledge(zigguratSummit,'ziggurat-summit-ground',0,1400,3000,'ground',400);
 rest(zigguratSummit,'zigguratSummitEntrance',260,1400,'ziggurat.rest.summit');
 zigguratSummit.returnPoint={x:120,y:1400};
 zigguratSummit.returnDestination={location:'zigguratInterior',x:1500,y:440};
 zigguratSummit.arena={x:620,y:1400,w:1800,triggerX:850,restId:'zigguratSummitEntrance'};
 // Roof and raised-floor presentation belong to the encounter controller;
 // immutable map geometry remains the intact phase-one starting layout.
 zigguratSummit.roof={x:600,y:800,w:1840,h:70};
 zigguratSummit.secrets=[{id:'hannahCourt',name:'ziggurat.hannah',x:600,y:780,w:1840,h:650,arena:zigguratSummit.arena,guardian:'Hannah',public:true}];
 foe(zigguratSummit,'Hannah',1800,1400,'guard',null,500);
 Object.assign(zigguratSummit.enemies.at(-1),{miniboss:'hannah',name:'ziggurat.hannah',secretArea:'hannahCourt',arena:zigguratSummit.arena});
 zigguratSummit.arenaEncounters=zigguratSummit.enemies.filter(enemy=>enemy.miniboss);

 const soldiers=[
  [zigguratApproach,[
   ['west-guard',760,1000,'guard','shadowCult',130],
   ['west-archer',1240,1000,'archer','shadowCult',90],
   ['middle-demon',2140,1000,'guard','yomi',150],
   ['middle-shield',2700,1000,'shield','shadowCult',130],
   ['east-mage',3780,1000,'mage','shadowCult',85],
   ['east-demon',4570,1000,'shield','yomi',130]
  ]],
  [zigguratInterior,[
   ['entry-guard',650,1700,'guard','shadowCult',100],
   ['entry-demon',1390,1700,'mage','yomi',90],
   ['upper-shield',1720,440,'shield','shadowCult',60],
   ['depth-stair-demon',2000,1880,'guard','yomi',45],
   ['depths-mage',2210,2420,'mage','shadowCult',100],
   ['depths-demon',1660,2420,'shield','yomi',100]
  ]]
 ];
 for(const [map,specs] of soldiers)for(const [id,x,y,kind,factionOverride,patrol] of specs){
  foe(map,map.id+'-'+id,x,y,kind,null,patrol);
  Object.assign(map.enemies.at(-1),{factionOverride});
 }
 for(const map of [zigguratApproach,zigguratInterior,zigguratSummit])zone(map,map.name,0,0,map.width,map.height);
 return {zigguratApproach,zigguratInterior,zigguratSummit};
}
