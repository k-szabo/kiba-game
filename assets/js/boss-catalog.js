/* Build-embedded authored boss data. Both modes use these immutable records. */
'use strict';
const BossCatalog=(()=>{
 const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
 const records=freeze(BOSS_DATA);
 const get=id=>{if(!Object.hasOwn(records,id))throw new TypeError('Unknown boss: '+id);return records[id];};
 const story=id=>get(id).story;
 const tower=id=>get(id).tower;
 const ids=Object.freeze(Object.keys(records));
 const towerRoster=Object.freeze(Object.values(records).sort((a,b)=>a.tower.order-b.tower.order)
  .map(({id,name,tower})=>Object.freeze({id,name,baseHealth:tower.baseHealth})));
 return Object.freeze({get,story,tower,assets:id=>get(id).assets,ids,towerRoster});
})();
