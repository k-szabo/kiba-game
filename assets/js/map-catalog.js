'use strict';
const MapCatalog=Object.freeze({
 build(id){
  const definition=MAP_DATA[id];
  if(!definition?.catalogSnapshot)throw new Error('Map is missing its JSON catalog snapshot: '+id);
  const snapshot=JSON.parse(JSON.stringify(definition));
  delete snapshot.schemaVersion;
  delete snapshot.catalogSnapshot;
  for(const arena of snapshot.arenas||[]){
   const encounter=StoryRaidRules.encounters.find(candidate=>candidate.id===arena.encounter?.id);
   if(encounter)arena.encounter=encounter;
  }
  return snapshot;
 }
});
