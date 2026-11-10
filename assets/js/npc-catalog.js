/* Immutable authored character identities. World placement remains in map data. */
'use strict';
const NpcCatalog=(()=>{
 const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
 const records=freeze(NPC_DATA),ids=Object.freeze(Object.keys(records));
 const get=id=>{if(!Object.hasOwn(records,id))throw new TypeError('Unknown NPC: '+id);return records[id];};
 const selectors=ids.flatMap(id=>records[id].selectors.map(selector=>({id,selector}))).sort((a,b)=>{
  const priority=s=>Object.keys(s).some(k=>!['kind','faction'].includes(k))?10+Object.keys(s).length:Object.keys(s).length;
  return priority(b.selector)-priority(a.selector);
 });
 function find(value){return selectors.find(({selector})=>Object.entries(selector).every(([key,expected])=>value[key]===expected))?.id??null;}
 function forEnemy(spec,faction){
  if(!spec||typeof spec!=='object')return null;
  const bossId=spec.towerEncounter||spec.miniboss;
  return find({...spec,faction:spec.factionOverride||faction,...(bossId?{bossId}:{})});
 }
 const assets=id=>[...new Set([...get(id).art.sprites.map(sprite=>sprite.image),...get(id).art.effects])];
 return Object.freeze({ids,get,find,forEnemy,assets});
})();
