/* Defaults and layout presets come from assets/config/keybindings.json. */
'use strict';
const Bindings=(()=>{
  const storageKey='momo-keybindings-v1';
  const actions=Object.keys(KEY_BINDINGS.original);
  const addedActions=['inventory','heavyAttack','useMeat'];
  const profiles=['original',...Object.keys(KEY_BINDINGS.profiles)];
  let profile='original',modified={};
  const normalize=value=>value==='Spacebar'||value==='Space'?' ':String(value||'').toLowerCase();
  const validKey=value=>value===' '||/^[\p{L}\p{N}\p{P}]$/u.test(value)||['arrowleft','arrowright','arrowup','arrowdown','shift','enter','backspace','escape'].includes(value)||/^f(?:[1-9]|1[0-2])$/.test(value);
  const original=action=>KEY_BINDINGS.original[action];
  const base=(which,action)=>KEY_BINDINGS.profiles[which]?.bindings[action]||original(action);
  const current=action=>modified[profile]?.[action]||base(profile,action);
  function validate(which,changes){
    if(!profiles.includes(which)||!changes||typeof changes!=='object'||Array.isArray(changes))return false;
    for(const [name,overrides] of Object.entries(changes)){
      if(!profiles.includes(name)||!overrides||typeof overrides!=='object'||Array.isArray(overrides))return false;
      for(const [action,keys] of Object.entries(overrides)){
        if(!actions.includes(action)||!Array.isArray(keys)||!keys.length||keys.length>4||keys.some(key=>typeof key!=='string'||!validKey(key)||key!==normalize(key)))return false;
      }
      const used=new Set();
      for(const action of actions)for(const key of overrides[action]||base(name,action)){
        if(used.has(key))return false;
        used.add(key);
      }
    }
    return true;
  }
  function save(){try{localStorage.setItem(storageKey,JSON.stringify({profile,modified}));}catch{}}
  function compatibleChanges(changes){
    if(!changes||typeof changes!=='object'||Array.isArray(changes))return changes;
    const copy=JSON.parse(JSON.stringify(changes));
    for(const [which,overrides] of Object.entries(copy)){
      if(!profiles.includes(which)||!overrides||Array.isArray(overrides)||typeof overrides!=='object')continue;
      const missing=addedActions.filter(action=>!Object.hasOwn(overrides,action));
      const used=new Set();
      for(const action of actions.filter(action=>!missing.includes(action)))for(const key of Array.isArray(overrides[action])?overrides[action]:base(which,action))used.add(key);
      for(const action of missing){
        const preferred=base(which,action);
        if(!preferred.some(key=>used.has(key))){for(const key of preferred)used.add(key);continue;}
        const alternatives={inventory:['o','p','b'],heavyAttack:['l'],useMeat:['p','b','n']}[action];
        const candidates=[...preferred,...alternatives,...'abcdefghijklmnopqrstuvwxyz0123456789',...Array.from({length:12},(_,i)=>'f'+(i+1))];
        const available=candidates.find(key=>!used.has(key));
        if(available){overrides[action]=[available];used.add(available);}
      }
    }
    return copy;
  }
  try{
    const stored=JSON.parse(localStorage.getItem(storageKey)||'null');
    if(stored){const changes=compatibleChanges(stored.modified);if(validate(stored.profile,changes)){profile=stored.profile;modified=changes;if(JSON.stringify(changes)!==JSON.stringify(stored.modified))save();}}
  }catch{}
  function choose(next){if(!profiles.includes(next))return false;profile=next;save();return true;}
  function setPrimary(action,value){
    const key=normalize(value);
    if(!actions.includes(action)||!validKey(key)||key==='tab'||key==='escape'&&action!=='pause')return {ok:false,reason:'invalid'};
    for(const other of actions)if(other!==action&&current(other).includes(key))return {ok:false,reason:'conflict',action:other};
    const before=current(action),next=[key,...before.slice(1).filter(item=>item!==key)];
    modified[profile]||={};
    if(JSON.stringify(next)===JSON.stringify(base(profile,action)))delete modified[profile][action];
    else modified[profile][action]=next;
    save();return {ok:true};
  }
  function reset(){delete modified[profile];save();}
  function importData(data){
    if(!data||data.version!==KEY_BINDINGS.version)return false;
    const historicalSchemas=addedActions.reduce((schemas,action)=>[...schemas,...schemas.map(missing=>[...missing,action])],[[]]);
    const compatibleOriginals=historicalSchemas.map(missing=>Object.fromEntries(Object.entries(KEY_BINDINGS.original).filter(([action])=>!missing.includes(action))));
    if(!compatibleOriginals.some(original=>JSON.stringify(data.original)===JSON.stringify(original)))return false;
    const changes=compatibleChanges(data.modified);if(!validate(data.selection,changes))return false;
    profile=data.selection;modified=changes;save();return true;
  }
  const exportData=()=>({version:KEY_BINDINGS.version,original:KEY_BINDINGS.original,profiles:KEY_BINDINGS.profiles,selection:profile,modified:JSON.parse(JSON.stringify(modified))});
  return Object.freeze({actions,profiles,normalize,read:action=>[...current(action)],has:(action,set)=>set.has('@'+action)||current(action).some(key=>set.has(key)),uses:key=>actions.some(action=>current(action).includes(key)),choose,setPrimary,reset,importData,exportData,get profile(){return profile;},get changed(){return !!Object.keys(modified[profile]||{}).length;}});
})();
