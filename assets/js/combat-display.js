/* Display preferences are independent of journey saves; test runs use overrides. */
'use strict';
const CombatDisplay=(()=>{
 const storageKey='momo-combat-display',defaults=Object.freeze({incoming:false,outgoing:false,bossHealth:false});
 const controls={incoming:'combatIncoming',outgoing:'combatOutgoing',bossHealth:'combatBossHealth'};
 const listeners=new Set();let preferences={...defaults},session=null,initialized=false;
 try{const stored=JSON.parse(localStorage.getItem(storageKey));if(stored&&typeof stored==='object'&&!Array.isArray(stored))for(const key of Object.keys(defaults))if(typeof stored[key]==='boolean')preferences[key]=stored[key];}catch{}
 function current(){if(DevSession.active)return session||(session={...defaults,bossHealth:true});return preferences;}
 function get(key){return Object.hasOwn(defaults,key)&&current()[key]===true;}
 function refresh(){for(const [key,id] of Object.entries(controls)){const input=$(id);if(input)input.checked=get(key);}}
 function changed(){refresh();for(const listener of listeners)listener();}
 function set(key,value){
  if(!Object.hasOwn(defaults,key)||typeof value!=='boolean')return false;
  current()[key]=value;
  if(!DevSession.active)try{localStorage.setItem(storageKey,JSON.stringify(preferences));}catch{}
  changed();return true;
 }
 function init(){
  if(initialized)return;initialized=true;
  for(const [key,id] of Object.entries(controls)){const input=$(id);if(input)input.onchange=()=>set(key,input.checked);}
  for(const [key,labelKey] of Object.entries({incoming:'combat.incoming',outgoing:'combat.outgoing',bossHealth:'combat.bossHealth'}))DevTools.register({
   id:({incoming:'damage-incoming',outgoing:'damage-outgoing',bossHealth:'boss-health-numbers'})[key],labelKey,
   available:()=>DevSession.active,toggled:()=>get(key),run:()=>set(key,!get(key))
  });
  DevSession.onEnd(()=>{session=null;changed();});I18n.onChange(refresh);refresh();
 }
 return Object.freeze({init,get,set,refresh,onChange(listener){listeners.add(listener);}});
})();
