/* AES-GCM saves with per-record HKDF salt and a non-exportable, profile-local key. */
'use strict';
const SAVE_KEY='momo-three-worlds-v2',LEGACY_SAVE_KEY='kiba-three-worlds-v1';
const SaveVault=(()=>{
 const encode=new TextEncoder(),decode=new TextDecoder('utf-8',{fatal:true});
 const scope=location.origin+location.pathname.replace(/[^/]*$/,'');
 const prefix='MOMO2.',storeName='vault';
 let db,readyFlag=false,initialNotice='',queue=Promise.resolve();
 const b64=bytes=>btoa(String.fromCharCode(...bytes));
 function bytes(text,size){if(typeof text!=='string'||text.length>30000)throw Error('Invalid encoding');const result=Uint8Array.from(atob(text),c=>c.charCodeAt(0));if(size&&result.length!==size)throw Error('Invalid length');return result;}
 const random=n=>crypto.getRandomValues(new Uint8Array(n));
 const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
 function validProgress(p,worldFlags){
  const {levelLimit,statLimit,xpForLevel}=PROGRESSION_RULES,maxPoints=levelLimit-1+bossBonusPoints(levels.map(map=>map.progressFlags));
  if(!p||!integer(p.level,1,levelLimit)||!integer(p.totalXp,0,Number.MAX_SAFE_INTEGER)||!integer(p.points,0,maxPoints)||!integer(p.xp,0,Number.MAX_SAFE_INTEGER))return false;
  if(!p.stats||!['vitality','strength','spirit'].every(k=>integer(p.stats[k],0,statLimit)))return false;
  const shield=Object.hasOwn(p.stats,'shield')?p.stats.shield:0;
  if(!integer(shield,0,statLimit)||shield>0&&!worldFlags[3]?.includes('kibaShield'))return false;
  if(p.points+shield+['vitality','strength','spirit'].reduce((sum,key)=>sum+p.stats[key],0)!==p.level-1+bossBonusPoints(worldFlags))return false;
  let xp=p.totalXp,level=1;while(level<levelLimit&&xp>=xpForLevel(level)){xp-=xpForLevel(level);level++;}
  return level===p.level&&p.xp===(level===levelLimit?0:xp);
 }
 function validate(data){
  if(!data||!Object.prototype.hasOwnProperty.call(data,'weaponStyle')||typeof data.weaponStyle!=='string'||!['katana','naginata','swordShield'].includes(data.weaponStyle))throw Error('Invalid weapon style');
  if(data?.prologueComplete!==undefined&&typeof data.prologueComplete!=='boolean')throw Error('Invalid prologue progress');
  if(data.weaponChoicePending!==undefined&&typeof data.weaponChoicePending!=='boolean')throw Error('Invalid pending weapon choice');
  if(!data||data.release!==GAME_RELEASE.version||data.version!==2||data.layout!==2||!integer(data.realm,0,levels.length-1)||!integer(data.shards,0,Number.MAX_SAFE_INTEGER)||typeof data.won!=='boolean')throw Error('Invalid save schema');
  if(data.location!=null&&(typeof data.location!=='string'||!Object.hasOwn(SIDE_LOCATIONS,data.location)))throw Error('Invalid save location');
  if(!['coins','meatCount','teaCount'].every(key=>integer(data[key],0,Number.MAX_SAFE_INTEGER)))throw Error('Invalid merchant inventory');
  const chickenCount=Object.hasOwn(data,'chickenCount')?data.chickenCount:0;if(!integer(chickenCount,0,Number.MAX_SAFE_INTEGER))throw Error('Invalid chicken inventory');
  if(!['roastMeat','tea','healingBrew','roastChicken'].includes(data.quickHeal))throw Error('Invalid quick healing item');
  const sellable=Object.keys(MERCHANT_SALES).filter(id=>!MERCHANT_SALES[id].stack);
  if(!Array.isArray(data.soldItems)||data.soldItems.length>sellable.length||new Set(data.soldItems).size!==data.soldItems.length||data.soldItems.some(id=>typeof id!=='string'||!sellable.includes(id)))throw Error('Invalid sold inventory');
  for(const [key,length] of [['abilities',2],['defeated',levels.length]])if(!Array.isArray(data[key])||data[key].length!==length||data[key].some(v=>typeof v!=='boolean'))throw Error('Invalid abilities');
  for(const key of ['flags','visitedRests'])if(!Array.isArray(data[key])||data[key].length!==levels.length)throw Error('Invalid world progress');
  for(let i=0;i<levels.length;i++){
   const map=levels[i],allowed=new Set([...map.objects.map(o=>o.id),...(map.progressFlags||[]),...map.gates.filter(g=>['fire','fragile'].includes(g.kind)).map(g=>g.id),...(map.secrets||[]).flatMap(s=>['discovered:'+s.id,'guardian:'+s.guardian])]);
   if(!Array.isArray(data.flags[i])||data.flags[i].length>allowed.size||data.flags[i].some(f=>typeof f!=='string'||!allowed.has(f))||new Set(data.flags[i]).size!==data.flags[i].length)throw Error('Invalid quest flags');
   const rests=new Set(realmRests(i).map(r=>r.id));if(!Array.isArray(data.visitedRests[i])||data.visitedRests[i].length>rests.size||data.visitedRests[i].some(id=>!rests.has(id))||new Set(data.visitedRests[i]).size!==data.visitedRests[i].length)throw Error('Invalid checkpoints');
  }
  const camp=data.flags[0],hasCampFlag=id=>camp.includes(id);
  if(hasCampFlag('daisyPlaced')&&(!data.defeated[0]||!data.flags[1].includes('daisyPlush')||!data.flags[1].includes('guardian:doomSlayer')||data.soldItems.includes('daisyPlush')))throw Error('Invalid Daisy placement');
  if(hasCampFlag('campQuestAccepted')&&!data.defeated[0]||hasCampFlag('mayorExecuted')&&!hasCampFlag('campQuestAccepted')||hasCampFlag('guardian:campMaster')&&!hasCampFlag('mayorExecuted'))throw Error('Invalid camp quest');
  if(['smithRescued','herbalistRescued','enchanterRescued'].some(id=>hasCampFlag(id)&&!hasCampFlag('guardian:campMaster'))||hasCampFlag('herbalistQuestAccepted')&&!hasCampFlag('herbalistRescued'))throw Error('Invalid camp rescue');
  if(hasCampFlag('campMasterSoul')&&!hasCampFlag('guardian:campMaster')||hasCampFlag('campQuestCompleted')&&!['smithRescued','herbalistRescued','enchanterRescued'].every(hasCampFlag)||hasCampFlag('herbalistQuestTurnedIn')&&!hasCampFlag('herbalistQuestAccepted')||hasCampFlag('serpentRitualKnown')&&!hasCampFlag('enchanterRescued'))throw Error('Invalid camp quest completion');
  for(const [id,spec] of Object.entries(SIDE_LOCATIONS)){
   if(spec.map.rests.some(rest=>data.visitedRests[spec.realm].includes(rest.id))&&!sideLocationUnlocked(id,data.flags,data.defeated))throw Error('Invalid camp progress');
  }
  // Older synthetic/current-format fixtures may omit this field. Runtime
  // loading supplies fresh(equipped); explicit malformed service state fails.
  if(Object.hasOwn(data,'campServices')){
   const service=data.campServices;
   if(!CampServiceRules.validate(service,data.weaponStyle))throw Error('Invalid camp services');
   if((service.weaponRank||service.armorRank||service.ownedWeapons.length>1)&&!hasCampFlag('smithRescued'))throw Error('Invalid smith progress');
   if((service.herbs||service.potions)&&!hasCampFlag('herbalistQuestAccepted'))throw Error('Invalid herbalist progress');
   if((data.prologueComplete===false||data.weaponChoicePending===true)&&(service.ownedWeapons.length!==1||service.ownedWeapons[0]!=='katana'||service.weaponRank||service.armorRank||service.herbs||service.potions))throw Error('Invalid dream equipment');
  }
  if(data.quickHeal==='healingBrew'&&!hasCampFlag('herbalistQuestAccepted'))throw Error('Invalid quick healing progress');
  const rescued=data.flags[1].includes('akashRescued');
  if(rescued&&!data.defeated[0]||!rescued&&(data.meatCount>0||data.teaCount>0||data.flags[1].some(id=>['compass','minimap','phoneCase'].includes(id))))throw Error('Invalid merchant progress');
  if(data.soldItems.some(id=>!rescued||!data.flags[MERCHANT_SALES[id].realm].includes(id)))throw Error('Invalid sold inventory');
  if(data.prologueComplete===false&&(data.coins||data.meatCount||data.teaCount||data.soldItems.length))throw Error('Invalid dream inventory');
  if(data.location!=null&&(data.realm!==SIDE_LOCATIONS[data.location].realm||data.prologueComplete!==true||!sideLocationUnlocked(data.location,data.flags,data.defeated)))throw Error('Invalid camp location');
  if(!DungeonRules.validate(data.dungeon??DungeonRules.fresh(),data.flags,data.defeated))throw Error('Invalid dungeon progress');
  if(camp.includes('cultTempleDiscovered')&&(!data.abilities[1]||!camp.includes('guardian:oldCultist')||!data.defeated[0]))throw Error('Invalid cult temple entry');
  if(!validProgress(data.progression,data.flags))throw Error('Invalid save schema');
  if(data.prologueComplete===false&&(data.realm!==0||data.won||data.defeated.some(Boolean)||data.abilities.some(Boolean)||data.flags.some(f=>f.length)||data.progression.totalXp))throw Error('Invalid dream progress');
  if(data.prologueComplete===false&&data.weaponStyle!=='katana')throw Error('Invalid dream weapon style');
  // The post-dream choice is resumable only before the journey can advance.
  if(data.weaponChoicePending===true&&(data.prologueComplete!==true||data.weaponStyle!=='katana'||data.realm!==0||data.location!=null||data.won||data.abilities.some(Boolean)||data.defeated.some(Boolean)||data.flags.some(f=>f.length)||data.progression.totalXp||data.coins||data.meatCount||data.teaCount||data.soldItems.length))throw Error('Invalid pending weapon choice');
  for(const [realm,reward] of BOSS_REWARDS.entries()){
   const claimed=data.flags[realm].includes(reward.claim),soul=data.flags[realm].includes(reward.id);
   if(claimed!==soul||claimed&&!data.defeated[realm])throw Error('Invalid boss reward');
  }
  // Both movement abilities belong to their shrines, independently of victories.
  if(data.realm>0&&!data.defeated[0]||data.realm>1&&!data.defeated[1])throw Error('Invalid realm sequence');
  if(data.defeated[0]&&!['forestBell','villageBell'].every(id=>data.flags[0].includes(id))||data.defeated[1]&&!['soulUpper','soulLower'].every(id=>data.flags[1].includes(id)))throw Error('Incomplete boss prerequisites');
  const council=data.flags[1];
  const earned=council.includes('councilKeyEarned'),held=council.includes('councilKey'),gateOpen=council.includes('councilGateOpen');
  if(earned&&!data.defeated[1]||held&&(!earned||gateOpen)||gateOpen&&(!earned||held))throw Error('Invalid council progress');
  if(council.some(id=>['daisyPlush','slayerCrossbow'].includes(id))&&!council.includes('guardian:doomSlayer'))throw Error('Unguarded grave reward');
  if((council.includes('guardian:doomSlayer')||council.includes('slayerSeal')||council.includes('slayerSummoned'))&&!data.defeated[1]||council.includes('slayerSummoned')&&!council.includes('slayerSeal'))throw Error('Invalid grave progress');
  if(council.includes('serpentScale')&&(!data.defeated[0]||!['soulUpper','soulLower'].every(id=>council.includes(id))))throw Error('Invalid serpent reward');
  for(const [n,id] of [[0,'white'],[2,'winged']]){const guardian=data.flags[n].includes('guardian:'+id+'Serpent'),scale=data.flags[n].includes(id+'SerpentScale');if(guardian!==scale||n===2&&(guardian||scale)&&!data.defeated[1])throw Error('Invalid realm serpent reward');}
  if(data.equippedTalisman!=null&&(data.equippedTalisman!=='triuneSerpentTalisman'||!data.flags[0].includes('triuneSerpentTalisman')||data.soldItems.includes('triuneSerpentTalisman')))throw Error('Invalid equipped talisman');
  if(data.flags[0].includes('triuneSerpentTalisman')&&(!data.flags[0].includes('enchanterRescued')||![[0,'whiteSerpentScale'],[1,'serpentScale'],[2,'wingedSerpentScale']].every(([n,id])=>data.flags[n].includes(id))))throw Error('Invalid serpent fusion');
  if(data.defeated[2]&&!data.flags[2].includes('dawnSeal')||data.won)throw Error('Invalid victory');
  const shadowIndex=levels.findIndex(map=>map.id==='shadowRealm');
  if(shadowIndex>=0){
   const entered=data.flags[2].includes('shadowEntered'),shadow=data.flags[shadowIndex];
   if(entered&&!data.defeated[2]||(data.realm===shadowIndex||data.defeated[shadowIndex]||shadow.length||data.visitedRests[shadowIndex].length)&&(!entered||!data.defeated[2]))throw Error('Invalid shadow entry');
   const jailer=shadow.includes('guardian:cultJailer'),key=shadow.includes('prisonKey'),open=shadow.includes('prisonOpen');
   if((key||open)&&!jailer||key&&open)throw Error('Invalid prison progress');
   if(shadow.includes('guardian:prisonWarden')&&!open||shadow.includes('zenRescued')&&!shadow.includes('guardian:prisonWarden'))throw Error('Invalid priestess rescue');
   const hunter=shadow.includes('guardian:prisonHunter'),seen=shadow.includes('fiaSeen'),rescuedFia=shadow.includes('fiaRescued'),missedFia=shadow.includes('fiaMissed');
   if(hunter&&!open||seen&&!hunter||(rescuedFia||missedFia)&&!seen||rescuedFia&&missedFia)throw Error('Invalid kitsune rescue');
   const accepted=shadow.includes('arenaQuestAccepted'),captain=shadow.includes('arenaRewardCaptain'),serpent=shadow.includes('arenaRewardSerpent'),guards=shadow.includes('arenaRewardGuards'),champion=shadow.includes('arenaChampion');
   if(accepted&&(!rescuedFia||!data.defeated[shadowIndex])||captain&&!accepted||serpent&&!captain||guards&&!serpent||champion&&!guards||shadow.includes('arenaSerpentScale')!==serpent)throw Error('Invalid arena progress');
   const heard=shadow.includes('fiaChambersHeard'),talismanAccepted=shadow.includes('fiaTalismanAccepted'),talisman=shadow.includes('priestessTalisman'),completed=shadow.includes('fiaTalismanCompleted'),slain=shadow.includes('fiaSlain');
   if(heard&&!champion||talismanAccepted&&(!heard||!champion)||talisman&&(!talismanAccepted||!camp.includes('sectPriestessReward'))||completed&&(!talisman||!talismanAccepted))throw Error('Invalid Fia quest progress');
   if((chickenCount>0||data.quickHeal==='roastChicken')&&!completed)throw Error('Invalid chicken reward');
   if(slain&&(!rescuedFia||!data.defeated[shadowIndex])||['fiaRewardClaimed','kitsuneSoul','kibaShield'].some(id=>shadow.includes(id)!==slain))throw Error('Invalid Fia victory');
   if(shadow.includes('corruptedHymn')&&!shadow.includes('guardian:madOrganist'))throw Error('Invalid shadow item');
  }
  for(const o of levels[0].objects.filter(o=>o.type==='relic'))if(data.flags[0].includes(o.id)&&(!data.abilities[0]||!data.flags[0].includes('guardian:'+o.guardian)))throw Error('Unguarded relic');
  if(data.flags[2].includes('eclipseRelic')&&(!data.defeated[2]||!['angelHalo','demonHorn'].every(id=>data.flags[0].includes(id))))throw Error('Invalid united relic');
  if(Object.hasOwn(data,'fiaRecovery')){
   const a=data.fiaRecovery,shadow=data.flags[3],keys=['location','x','feet','hp','face','tea'],map=SIDE_LOCATIONS[a?.location]?.map;
   if(!a||typeof a!=='object'||Array.isArray(a)||Object.keys(a).length!==keys.length||!keys.every(key=>Object.hasOwn(a,key))||!['shadowDen','fiaChambers'].includes(a.location)||data.realm!==3||a.location!==data.location||!sideLocationUnlocked(a.location,data.flags,data.defeated)||!shadow.includes('fiaRescued')||shadow.includes('fiaSlain')||(a.location==='shadowDen')===shadow.includes('arenaChampion'))throw Error('Invalid Fia recovery');
   if(!Number.isFinite(a.x)||a.x<21.5||a.x>map.width-21.5||!Number.isFinite(a.feet)||a.feet<69||a.feet>map.height||!Number.isFinite(a.hp)||a.hp<=0||a.hp>5+data.progression.stats.vitality+(data.weaponStyle==='swordShield'?2:0)||![1,-1].includes(a.face))throw Error('Invalid Fia recovery anchor');
   const tea=a.tea;if(!tea||typeof tea!=='object'||Array.isArray(tea)||Object.keys(tea).length!==2||!Object.hasOwn(tea,'elapsed')||!Object.hasOwn(tea,'pulses')||!Number.isFinite(tea.elapsed)||tea.elapsed<0||tea.elapsed>=2||!integer(tea.pulses,0,3)||!tea.pulses&&tea.elapsed!==0)throw Error('Invalid Fia recovery tea');
  }
  const checkpointMap=data.location!=null?SIDE_LOCATIONS[data.location].map:levels[data.realm];
  const checkpoint=[...checkpointMap.rests,...(checkpointMap.checkpoints||[])].find(r=>r.id===data.checkpoint?.id);
  if(!checkpoint||data.checkpoint.x!==checkpoint.x||data.checkpoint.y!==checkpoint.y||!data.visitedRests[data.realm].includes(checkpoint.id))throw Error('Invalid save location');
  return JSON.parse(JSON.stringify(data));
 }
 const request=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
 const complete=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(tx.error||Error('Storage aborted'));});
 async function records(){const tx=db.transaction(storeName,'readonly'),done=complete(tx),store=tx.objectStore(storeName);const [profile,sealed]=await Promise.all([request(store.get('profile')),request(store.get('save'))]);await done;return {profile,sealed};}
 async function keyFor(profile,salt){return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt,info:encode.encode('momo-save-v2|'+scope+'|'+profile.release+'|'+profile.device)},profile.key,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
 function aad(profile,revision){return encode.encode('momo-save-v2|'+scope+'|'+profile.release+'|'+profile.device+'|'+revision);}
 async function seal(data,profile){
  const salt=random(16),iv=random(12),revision=profile.revision+1,key=await keyFor(profile,salt);
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(profile,revision),tagLength:128},key,encode.encode(JSON.stringify(validate(data))));
  return prefix+btoa(JSON.stringify({v:2,release:profile.release,device:profile.device,revision,salt:b64(salt),iv:b64(iv),data:b64(new Uint8Array(ciphertext))}));
 }
 async function open(sealed,profile){
  if(typeof sealed!=='string'||!sealed.startsWith(prefix)||sealed.length>30000)throw Error('Invalid save envelope');
  const entry=JSON.parse(atob(sealed.slice(prefix.length)));
  if(entry.v!==2||entry.release!==GAME_RELEASE.version||profile.release!==GAME_RELEASE.version||entry.device!==profile.device||entry.revision!==profile.revision||!integer(entry.revision,1,Number.MAX_SAFE_INTEGER))throw Error('Foreign or replayed save');
  const salt=bytes(entry.salt,16),iv=bytes(entry.iv,12),ciphertext=bytes(entry.data);if(ciphertext.length>18000)throw Error('Save too large');
  const key=await keyFor(profile,salt),plain=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:aad(profile,entry.revision),tagLength:128},key,ciphertext);
  return validate(JSON.parse(decode.decode(plain)));
 }
 async function writeOne(snapshot){
  const {profile}=await records();requireCurrent(profile);
  const sealed=await seal(snapshot,profile);
  const tx=db.transaction(storeName,'readwrite'),done=complete(tx),store=tx.objectStore(storeName);
  const current=await request(store.get('profile'));
  if(current?.release!==GAME_RELEASE.version||current?.device!==profile.device||current?.revision!==profile.revision){tx.abort();await done;return;}
  store.put({...profile,revision:profile.revision+1},'profile');store.put(sealed,'save');await done;
  try{localStorage.setItem(SAVE_KEY,sealed);}catch{/* IndexedDB remains the durable source. */}
 }
 function locked(operation){
  if(navigator.locks?.request)return navigator.locks.request('momo-save-v2',operation);
  return operation();
 }
 // Unknown version syntax is kept intact too: a cached client must never guess
 // that an unrecognised profile belongs to an older release and replace it.
 function compareRelease(a,b){
  const parse=value=>{
   if(typeof value!=='string')return null;
   const suffix=/_([a-z0-9]{8})$/.exec(value),base=suffix?value.slice(0,-9):value;
   if(suffix&&!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(base))return null;
   const result=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([\da-zA-Z.-]+))?(?:\+[\da-zA-Z.-]+)?$/.exec(base);
   if(result)result.bugfix=suffix?.[1];return result;
  };
  const left=parse(a),right=parse(b);if(!left||!right)return null;
  for(let i=1;i<=3;i++){const x=BigInt(left[i]),y=BigInt(right[i]);if(x!==y)return x>y?1:-1;}
  if(left[4]===right[4]){
   if(left.bugfix===right.bugfix)return 0;
   const history=GAME_RELEASE.bugfixHistory?.[left.slice(1,4).join('.')]||[];
   if(left.bugfix&&!history.includes(left.bugfix)||right.bugfix&&!history.includes(right.bugfix))return null;
   const ordinal=release=>release.bugfix?history.indexOf(release.bugfix)+1:0;
   return ordinal(left)>ordinal(right)?1:-1;
  }
  if(!left[4])return 1;if(!right[4])return -1;
  const x=left[4].split('.'),y=right[4].split('.');
  for(let i=0;i<Math.max(x.length,y.length);i++){
   if(x[i]===undefined)return -1;if(y[i]===undefined)return 1;if(x[i]===y[i])continue;
   const numericX=/^\d+$/.test(x[i]),numericY=/^\d+$/.test(y[i]);
   if(numericX&&numericY)return BigInt(x[i])>BigInt(y[i])?1:-1;
   if(numericX!==numericY)return numericX?-1:1;
   return x[i]>y[i]?1:-1;
  }
  return 0;
 }
 function requireCurrent(profile){
  if(profile?.release!==GAME_RELEASE.version){const error=Error('Save belongs to another game release');error.notice='text.save.newer.version';throw error;}
 }
 function localProgress(){try{return !!(localStorage.getItem(SAVE_KEY)||localStorage.getItem(LEGACY_SAVE_KEY));}catch{return false;}}
 function clearOldMirrors(){try{localStorage.removeItem(SAVE_KEY);localStorage.removeItem(LEGACY_SAVE_KEY);}catch{/* IndexedDB remains the durable source. */}}
 async function initializeStored(){
  let {profile,sealed}=await records(),reset=false;
  if(profile?.release!==GAME_RELEASE.version){
   if(profile?.release!=null){const order=compareRelease(profile.release,GAME_RELEASE.version);if(order===null||order>=0)requireCurrent(profile);}
   const seed=random(32),key=await crypto.subtle.importKey('raw',seed,'HKDF',false,['deriveKey']);seed.fill(0);
   const candidate={release:GAME_RELEASE.version,device:b64(random(16)),key,revision:0};
   const tx=db.transaction(storeName,'readwrite'),done=complete(tx),store=tx.objectStore(storeName),existing=await request(store.get('profile'));
   // Recheck after async key generation, including browsers without Web Locks.
   if(existing?.release!==GAME_RELEASE.version){
    if(existing?.release!=null){const order=compareRelease(existing.release,GAME_RELEASE.version);if(order===null||order>=0){await done;requireCurrent(existing);}}
    const oldSave=await request(store.get('save'));
    reset=!!(oldSave||existing?.revision>0||localProgress());
    store.delete('save');store.put(candidate,'profile');
   }
   await done;
   if(reset)initialNotice='text.save.reset.new.version';
   // Only the tab that replaced the profile may discard its old mirrors.
   if(!existing||existing.release!==GAME_RELEASE.version)clearOldMirrors();
   ({profile,sealed}=await records());
  }
  requireCurrent(profile);
  if(profile.key?.extractable!==false||profile.key?.algorithm?.name!=='HKDF'||!integer(profile.revision,0,Number.MAX_SAFE_INTEGER))throw Error('Invalid profile key');
  let result=null;
  if(sealed){
   result=await open(sealed,profile);let mirror;try{mirror=localStorage.getItem(SAVE_KEY);}catch{}
   if(mirror&&mirror!==sealed)initialNotice='text.save.recovered';
   try{localStorage.setItem(SAVE_KEY,sealed);}catch{}
  }else if(localProgress()){
   clearOldMirrors();initialNotice='text.save.reset.new.version';
  }
  readyFlag=true;return result;
 }
 async function initialize(){
  if(!crypto?.subtle||!globalThis.indexedDB)throw Error('Secure storage unavailable');
  const req=indexedDB.open('momo-save-v2',1);req.onupgradeneeded=()=>req.result.createObjectStore(storeName);db=await request(req);
  return locked(initializeStored);
 }
 const ready=initialize().catch(error=>{initialNotice=error.notice||'text.save.unavailable';return null;});
 return Object.freeze({ready,get isReady(){return readyFlag;},get notice(){return initialNotice;},write(snapshot){const data=validate(snapshot);const operation=queue.catch(()=>{}).then(async()=>{await ready;if(!readyFlag)throw Error('Secure storage unavailable');await locked(()=>writeOne(data));});queue=operation;return operation;}});
})();
