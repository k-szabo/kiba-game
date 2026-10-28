/* Defaults and layout presets come from assets/config/keybindings.json. */
'use strict';
const Bindings=(()=>{
  const storageKey='momo-keybindings-v1',revision=KEY_BINDINGS.revision||1;
  const legacyDefaults=KEY_BINDINGS.legacyDefaults||KEY_BINDINGS,legacyRevision=legacyDefaults.revision||1;
  const actions=Object.keys(KEY_BINDINGS.original);
  const addedActions=['inventory','heavyAttack','useMeat','ultimate'];
  const profiles=['original',...Object.keys(KEY_BINDINGS.profiles)];
  let profile='original',modified={};
  const normalize=value=>value==='Spacebar'||value==='Space'?' ':String(value||'').toLowerCase();
  const mouseKey=button=>Number.isInteger(button)&&Object.hasOwn(KEY_BINDINGS.mouseButtons,button)?KEY_BINDINGS.mouseButtons[button]:null;
  const validKey=value=>Object.values(KEY_BINDINGS.mouseButtons).includes(value)||value===' '||/^[\p{L}\p{N}\p{P}]$/u.test(value)||['arrowleft','arrowright','arrowup','arrowdown','shift','enter','backspace','escape'].includes(value)||/^f(?:[1-9]|1[0-2])$/.test(value);
  const baseFrom=(catalog,which,action)=>catalog.profiles[which]?.bindings[action]||catalog.original[action]||KEY_BINDINGS.original[action];
  const base=(which,action)=>baseFrom(KEY_BINDINGS,which,action);
  const current=action=>modified[profile]?.[action]||base(profile,action);
  function validate(which,changes,catalog=KEY_BINDINGS){
    if(!profiles.includes(which)||!changes||typeof changes!=='object'||Array.isArray(changes))return false;
    for(const [name,overrides] of Object.entries(changes)){
      if(!profiles.includes(name)||!overrides||typeof overrides!=='object'||Array.isArray(overrides))return false;
      for(const [action,keys] of Object.entries(overrides)){
        if(!actions.includes(action)||!Array.isArray(keys)||!keys.length||keys.length>4||keys.some(key=>typeof key!=='string'||!validKey(key)||key!==normalize(key)))return false;
      }
      const used=new Set();
      for(const action of actions)for(const key of overrides[action]||baseFrom(catalog,name,action)){
        if(used.has(key))return false;
        used.add(key);
      }
    }
    return true;
  }
  function save(){try{localStorage.setItem(storageKey,JSON.stringify({revision,profile,modified}));}catch{}}
  function compatibleChanges(changes,catalog=KEY_BINDINGS){
    if(!changes||typeof changes!=='object'||Array.isArray(changes))return changes;
    const copy=JSON.parse(JSON.stringify(changes));
    for(const [which,overrides] of Object.entries(copy)){
      if(!profiles.includes(which)||!overrides||Array.isArray(overrides)||typeof overrides!=='object')continue;
      const missing=addedActions.filter(action=>!Object.hasOwn(overrides,action));
      const used=new Set();
      for(const action of actions.filter(action=>!missing.includes(action)))for(const key of Array.isArray(overrides[action])?overrides[action]:baseFrom(catalog,which,action))used.add(key);
      for(const action of missing){
        const preferred=baseFrom(catalog,which,action);
        if(!preferred.some(key=>used.has(key))){for(const key of preferred)used.add(key);continue;}
        const alternatives={inventory:['o','p','b'],heavyAttack:['l'],useMeat:['p','b','n'],ultimate:['g','r','v']}[action];
        const candidates=[...preferred,...alternatives,...'abcdefghijklmnopqrstuvwxyz0123456789',...Array.from({length:12},(_,i)=>'f'+(i+1))];
        const available=candidates.find(key=>!used.has(key));
        if(available){overrides[action]=[available];used.add(available);}
      }
    }
    return copy;
  }
  function prepareChanges(which,changes,catalog,preserveSelected=false,repairAdded=true){
    const repaired=repairAdded?compatibleChanges(changes,catalog):JSON.parse(JSON.stringify(changes));if(!validate(which,repaired,catalog))return null;
    if(catalog!==KEY_BINDINGS){
      // Old preferences were relative to keyboard-first defaults. Materialize
      // each customized profile before rebasing so new mouse/Q defaults cannot
      // steal a key or silently discard an otherwise valid personal layout.
      for(const name of profiles){
        const overrides=repaired[name]||{};
        if(!Object.keys(overrides).length&&!(preserveSelected&&name===which))continue;
        repaired[name]=Object.fromEntries(actions.map(action=>[action,[...(overrides[action]||baseFrom(catalog,name,action))]]));
      }
    }
    return validate(which,repaired)?repaired:null;
  }
  try{
    const stored=JSON.parse(localStorage.getItem(storageKey)||'null');
    if(stored){
      const catalog=stored.revision===revision||stored.revision===2?KEY_BINDINGS:stored.revision==null||stored.revision===legacyRevision?legacyDefaults:null;
      const changes=catalog&&prepareChanges(stored.profile,stored.modified,catalog,false,stored.revision!==revision);
      if(changes){profile=stored.profile;modified=changes;if(stored.revision!==revision||JSON.stringify(changes)!==JSON.stringify(stored.modified))save();}
    }
  }catch{}
  function choose(next){if(!profiles.includes(next))return false;profile=next;save();return true;}
  function setPrimary(action,value){
    const key=normalize(value);
    if(!actions.includes(action)||!validKey(key)||key==='tab'||key==='escape'&&action!=='pause')return {ok:false,reason:'invalid'};
    const before=current(action),bindings=Object.fromEntries(actions.map(name=>[name,[...current(name)]]));
    const owner=actions.find(other=>other!==action&&bindings[other].includes(key));
    bindings[action]=[key,...before.slice(1).filter(item=>item!==key)];
    if(owner){
      // Exchange the occupied slot with the previous primary, including Escape.
      // Dialog cancellation remains separate from gameplay action ownership.
      const slot=bindings[owner].indexOf(key);
      bindings[owner].splice(slot,1,before[0]);
    }
    modified[profile]||={};
    for(const name of [action,...(owner?[owner]:[])]){
      if(JSON.stringify(bindings[name])===JSON.stringify(base(profile,name)))delete modified[profile][name];
      else modified[profile][name]=bindings[name];
    }
    save();return {ok:true,...(owner?{swapped:owner}:{})};
  }
  function reset(){delete modified[profile];save();}
  function importData(data){
    try{
      if(!data||data.version!==KEY_BINDINGS.version)return false;
      const schemas=addedActions.reduce((list,action)=>[...list,...list.map(missing=>[...missing,action])],[[]]);
      const catalogs=KEY_BINDINGS.legacyDefaults?[KEY_BINDINGS,legacyDefaults]:[KEY_BINDINGS];
      const catalog=catalogs.find(candidate=>schemas.some(missing=>JSON.stringify(data.original)===JSON.stringify(Object.fromEntries(Object.entries(candidate.original).filter(([action])=>!missing.includes(action))))));
      if(!catalog||data.revision!=null&&data.revision!==(catalog===KEY_BINDINGS?revision:legacyRevision)&&!(catalog===KEY_BINDINGS&&data.revision===2))return false;
      const changes=prepareChanges(data.selection,data.modified,catalog,true,data.revision!==revision);if(!changes)return false;
      profile=data.selection;modified=changes;save();return true;
    }catch{return false;}
  }
  const exportData=()=>({version:KEY_BINDINGS.version,revision,original:KEY_BINDINGS.original,profiles:KEY_BINDINGS.profiles,selection:profile,modified:JSON.parse(JSON.stringify(modified))});
  return Object.freeze({actions,profiles,normalize,mouseKey,read:action=>[...current(action)],has:(action,set)=>current(action).some(key=>set.has(key)),uses:key=>actions.some(action=>current(action).includes(key)),choose,setPrimary,reset,importData,exportData,get profile(){return profile;},get changed(){return !!Object.keys(modified[profile]||{}).length;}});
})();
