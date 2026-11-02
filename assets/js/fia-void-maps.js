/* Registered side maps share the same transitions, rests and dev catalogue. */
'use strict';
function createFiaVoidMaps({makeLevel,ledge,rest,zone}){
 const room=(id,width,height,start,name)=>{const m=makeLevel(id,width,height,start);m.name=name;m.enemyRealm=3;m.fiaJourney=true;m.arena={x:-2000,y:start.y,w:0};m.boss={x:-2000,y:start.y};return m;};
 const fiaRitual=room('fiaRitual',2200,1100,{x:210,y:820},'fia.ritual.location');
 ledge(fiaRitual,'ritual-floor',0,820,2200,'ground',280);rest(fiaRitual,'fiaRitualRest',370,820,'fia.ritual.location');
 fiaRitual.returnPoint={x:100,y:820};fiaRitual.returnDestination={location:'fiaChambers',x:1430,y:820};
 fiaRitual.npcs=[{id:'fia',x:1550,y:820,height:136,name:'fia.name'}];zone(fiaRitual,fiaRitual.name,0,0,2200,1100);
 const shadowUnderworld=room('shadowUnderworld',1600,2400,{x:170,y:636},'fia.void.underworld');
 // The painting's three balcony floors are registered directly in world space.
 for(const [i,y]of [636,1337,2021].entries())ledge(shadowUnderworld,'underworld-floor-'+i,0,y,1600,'stone',40);
 for(const [i,[x,y]]of [[1350,770],[1110,900],[870,1030],[630,1160],[300,1470],[540,1600],[780,1730],[1020,1860]].entries())ledge(shadowUnderworld,'underworld-step-'+i,x,y,220,'stone');
 rest(shadowUnderworld,'underworldMarket',330,636,'fia.void.underworld');
 rest(shadowUnderworld,'underworldForge',1100,2021,'fia.void.smith');
 shadowUnderworld.returnPoint={x:100,y:636};shadowUnderworld.returnDestination={location:'shadowDen',x:1800,y:820};
 shadowUnderworld.npcs=[{id:'underworldTrader',service:'trader',x:700,y:636,height:128,name:'fia.void.trader'},{id:'underworldCook',service:'cook',x:1050,y:1337,height:128,name:'fia.void.cook'},{id:'underworldSmith',service:'smith',x:650,y:2021,height:132,name:'fia.void.smith'}];
 shadowUnderworld.residents=[{id:'shadowNinja',x:1180,y:636,height:126,name:'fia.ninja.name',dialogue:'fia.ninja.dialogue'},{id:'shadowThief',x:420,y:2021,height:118,name:'fia.thief.name',dialogue:'fia.thief.dialogue'}];
 shadowUnderworld.guards=[{id:'void-entry-guard-0',x:1260,y:2021,height:180,name:'arena.boss.guards'},{id:'void-entry-guard-1',x:1410,y:2021,height:180,name:'arena.boss.guards'}];
 shadowUnderworld.forbiddenEntrance={x:1460,y:2021};zone(shadowUnderworld,shadowUnderworld.name,0,0,1600,2400);
 const voidForbidden=room('voidForbidden',3400,1250,{x:170,y:940},'fia.void.forbidden');
 ledge(voidForbidden,'void-floor',0,940,3400,'ground',310);rest(voidForbidden,'voidThreshold',330,940,'fia.void.forbidden');
 voidForbidden.returnPoint={x:100,y:940};voidForbidden.returnDestination={location:'shadowUnderworld',x:1460,y:2021};
 voidForbidden.voidArena={x:1450,y:940,w:1850};voidForbidden.rift={x:2700,y:940};
 voidForbidden.keepers=[{x:800,y:940,role:'blade'},{x:1120,y:940,role:'bow'},{x:1450,y:940,role:'mage'}];
 voidForbidden.enemies.push(...voidForbidden.keepers.map((p,i)=>({id:'rift-keeper-'+i,x:p.x,y:p.y,kind:p.role==='bow'?'archer':p.role==='mage'?'mage':'guard',patrol:250,voidKeeperRole:p.role,name:'fia.void.'+p.role})));
 zone(voidForbidden,voidForbidden.name,0,0,3400,1250);
 return {fiaRitual,shadowUnderworld,voidForbidden};
}
