/* Sky Dragon raid geometry and fixed hook points live in JSON map data. */
'use strict';
function createSkyDragonRaidMaps(){
 return Object.fromEntries(['harbor','pursuit','back','rift'].map(phase=>{
  const id='skyDragonRaid'+phase[0].toUpperCase()+phase.slice(1);
  return [phase,MapCatalog.build(id)];
 }));
}
