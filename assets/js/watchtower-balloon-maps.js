/* Geometry only; registration and narrative state are owned by the controller. */
'use strict';
function createWatchtowerBalloonMaps({makeLevel,ledge,rest,foe,zone}){
 const setup=(id,width,height,start,name)=>{
  const map=makeLevel(id,width,height,start);
  Object.assign(map,{name,enemyRealm:0,watchtowerBalloon:true,boss:{x:-2000,y:start.y},grappleAnchors:[],arena:{x:-2000,y:start.y,w:0}});
  zone(map,name,0,0,width,height);return map;
 };
 const ninjaWatchtower=setup('ninjaWatchtower',3800,3600,{x:1000,y:2000},'watchtower.name');
 const tiers=[];
 for(let i=0;i<7;i++){
  const p={id:'watchtower-tier-'+i,x:2100-i*300,y:400+i*400,w:i===0?1200:600};tiers.push(p);
  ledge(ninjaWatchtower,p.id,p.x,p.y,p.w,i===0?'ground':'stone',i===0?100:32);
  // A diagonal sequence gives up/right and down/left distinct targets.
  // Stand right of the current ring to climb; its lower neighbours are behind.
  // Descend from the left edge. The high ring clears the full actor's swept box.
  ninjaWatchtower.grappleAnchors.push({id:p.id+'-ring',x:p.x+32,y:p.y-266,w:32,h:32});
 }
 ledge(ninjaWatchtower,'watchtower-cellar-floor',0,3200,3800,'ground',400);
 ninjaWatchtower.grappleAnchors.push({id:'watchtower-cellar-ring',x:32,y:2934,w:32,h:32});
 rest(ninjaWatchtower,'watchtowerEntrance',1000,2000,'watchtower.rest.entrance');
 rest(ninjaWatchtower,'watchtowerCellar',240,3200,'watchtower.rest.cellar');
 rest(ninjaWatchtower,'watchtowerRoof',2200,400,'watchtower.rest.roof');
 ninjaWatchtower.returnPoint={x:1000,y:2000};
 ninjaWatchtower.returnDestination={location:'floatingIslands',x:6750,y:1650};
 ninjaWatchtower.cellPoint={x:3250,y:3200};
 ninjaWatchtower.westheruPoint={x:3250,y:3200};
 ninjaWatchtower.boardPoint={x:3160,y:400};
 ninjaWatchtower.jailerArena={x:2000,y:3200,w:1300,triggerX:2120,restId:'watchtowerCellar'};
 ninjaWatchtower.sentinelArena={x:2120,y:400,w:1140,triggerX:2350,restId:'watchtowerRoof'};
 foe(ninjaWatchtower,'watchtowerJailer',2550,3200,'guard',null,180);
 Object.assign(ninjaWatchtower.enemies.at(-1),{miniboss:'watchtowerJailer',name:'watchtower.jailer',grappleable:false,arena:ninjaWatchtower.jailerArena});
 foe(ninjaWatchtower,'watchtowerSentinel',2850,400,'archer',null,200);
 Object.assign(ninjaWatchtower.enemies.at(-1),{miniboss:'watchtowerSentinel',name:'watchtower.sentinel',grappleable:false,arena:ninjaWatchtower.sentinelArena});
 for(const [i,role]of [[1,'crossbow'],[2,'assassin'],[3,'ninjutsu'],[5,'shuriken'],[6,'assassin']]){
  const p=tiers[i];foe(ninjaWatchtower,'watchtower-ninja-'+i,p.x+450,p.y,role==='crossbow'||role==='shuriken'?'archer':role==='ninjutsu'?'mage':'guard',null,100);
  Object.assign(ninjaWatchtower.enemies.at(-1),{shadowNinjaRole:role,name:'islands.ninja.'+role,grappleable:true});
 }
 ninjaWatchtower.arenaEncounters=ninjaWatchtower.enemies.filter(e=>e.miniboss);

 const balloonJourney=setup('balloonJourney',2000,1200,{x:420,y:850},'balloon.journey');
 balloonJourney.balloon=true;
 ledge(balloonJourney,'balloon-deck',220,850,1560,'ground',110);
 rest(balloonJourney,'balloonDeck',400,850,'balloon.rest.deck');
 balloonJourney.arena={x:240,y:850,w:1520,triggerX:240,restId:'balloonDeck'};
 balloonJourney.pilotPoint={x:340,y:850};
 balloonJourney.returnPoint={x:320,y:850};
 balloonJourney.returnDestination={location:'ninjaWatchtower',x:3160,y:400};
 balloonJourney.arrivalPoint={x:1650,y:850};
 balloonJourney.arenaEncounters=[{id:'balloonDragon',miniboss:'balloonDragon',x:1400,y:850,name:'balloon.dragon',arena:balloonJourney.arena,grappleable:false}];

 const skyLanding=setup('skyLanding',2400,1400,{x:320,y:1000},'balloon.landing');
 ledge(skyLanding,'sky-landing-ground',0,1000,2400,'ground',400);
 rest(skyLanding,'skyLandingMooring',300,1000,'balloon.rest.landing');
 skyLanding.arena={x:650,y:1000,w:1550,triggerX:800,restId:'skyLandingMooring'};
 skyLanding.pilotPoint={x:1350,y:1000};
 skyLanding.boardPoint={x:280,y:1000};
 skyLanding.returnPoint=skyLanding.boardPoint;
 skyLanding.returnDestination={location:'balloonJourney',x:1650,y:850};
 foe(skyLanding,'westheruSeal',1350,1000,'mage',null,300);
 Object.assign(skyLanding.enemies.at(-1),{miniboss:'westheruSeal',name:'balloon.westheru',grappleable:false,arena:skyLanding.arena});
 skyLanding.arenaEncounters=skyLanding.enemies.filter(e=>e.miniboss);

 const stormIslands=setup('stormIslands',3600,1800,{x:300,y:1300},'balloon.stormIslands');
 ledge(stormIslands,'storm-arrival-ground',0,1300,3600,'ground',500);
 for(const [i,x,y,w]of [[0,950,1210,360],[1,1250,1120,400],[2,1600,1030,700],[3,2250,1120,400],[4,2600,1210,360]])ledge(stormIslands,'storm-terrace-'+i,x,y,w,'stone',32);
 rest(stormIslands,'stormIslandsArrival',380,1300,'balloon.rest.storm');
 stormIslands.returnPoint={x:180,y:1300};
 stormIslands.returnDestination={location:'skyLanding',x:280,y:1000};
 stormIslands.endPoint={x:3340,y:1300};
 for(const [i,x,y,role]of [[0,1050,1210,'crossbow'],[1,1800,1030,'ninjutsu'],[2,2900,1300,'assassin']]){
  foe(stormIslands,'storm-ninja-'+i,x,y,role==='crossbow'?'archer':role==='ninjutsu'?'mage':'guard',null,100);
  Object.assign(stormIslands.enemies.at(-1),{shadowNinjaRole:role,name:'islands.ninja.'+role,grappleable:true});
 }
 for(const [i,x,kind]of [[0,750,'guard'],[1,2400,'archer'],[2,3200,'mage']]){
  foe(stormIslands,'storm-cultist-'+i,x,1300,kind,null,100);
  Object.assign(stormIslands.enemies.at(-1),{factionOverride:'shadowCult',grappleable:true});
 }
 stormIslands.arenaEncounters=[];
 return {ninjaWatchtower,balloonJourney,skyLanding,stormIslands};
}
