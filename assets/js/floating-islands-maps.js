/* Registered later by levels.js; geometry has no dependency on artwork. */
'use strict';
function createFloatingIslandMaps({makeLevel,ledge,rest,foe,zone}){
 const map=makeLevel('floatingIslands',7000,3300,{x:300,y:2850});
 Object.assign(map,{name:'islands.name',enemyRealm:0,floatingIslands:true,boss:{x:-2000,y:2850},grappleAnchors:[]});
 const islands=[{x:0,y:2850,w:1800},{x:2480,y:2450,w:1000},{x:4160,y:2050,w:1000},{x:5840,y:1650,w:1160}];
 islands.forEach((p,i)=>{
  ledge(map,'floating-island-'+i,p.x,p.y,p.w,'ground',300);
  zone(map,'islands.name',p.x,0,p.w,map.height);
  if(i<islands.length-1)map.grappleAnchors.push({id:'island-return-ring-'+i,x:p.x+p.w-64,y:p.y-96,w:32,h:32});
  if(i){
   // A 400px rise exceeds both jump apexes combined, including chained
   // horizontal dashes; the near-edge ring stays within the 900px hook range.
   map.grappleAnchors.push({id:'island-ring-'+i,x:p.x+32,y:p.y-96,w:32,h:32});
  }
 });
 rest(map,'floatingIslandsArrival',360,2850,'islands.rest.arrival');
 rest(map,'floatingIslandsPath',2860,2450,'islands.rest.path');
 rest(map,'floatingIslandsWatchtower',6500,1650,'islands.rest.watchtower');
 map.returnPoint={x:120,y:2850};
 map.returnDestination={location:'japanHeights',x:3800,y:1100};
 map.hookPoint={x:1250,y:2850};
 map.trailPoint={x:6800,y:1650};
 map.arena={x:650,y:2850,w:1050,triggerX:800,restId:'floatingIslandsArrival'};
 foe(map,'shadowNinjaLeader',1250,2850,'guard',null,300);
 Object.assign(map.enemies.at(-1),{miniboss:'shadowNinjaLeader',name:'islands.ninjaLeader',arena:map.arena,grappleable:false});
 for(const [index,role,offset]of [[1,'crossbow',300],[1,'assassin',700],[2,'shuriken',250],[2,'ninjutsu',720],[3,'assassin',240],[3,'crossbow',570],[3,'ninjutsu',850]]){
  const p=islands[index];
  foe(map,'shadow-ninja-'+index+'-'+role,p.x+offset,p.y,role==='crossbow'||role==='shuriken'?'archer':role==='ninjutsu'?'mage':'guard',null,80);
  Object.assign(map.enemies.at(-1),{shadowNinjaRole:role,name:'islands.ninja.'+role,grappleable:true});
 }
 map.arenaEncounters=map.enemies.filter(e=>e.miniboss);
 return map;
}
