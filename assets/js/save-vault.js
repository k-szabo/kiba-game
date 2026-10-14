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
 function validProgress(p){
  if(!p||!integer(p.level,1,12)||!integer(p.totalXp,0,Number.MAX_SAFE_INTEGER)||!integer(p.points,0,11)||!integer(p.xp,0,500))return false;
  if(!p.stats||!['vitality','strength','spirit'].every(k=>integer(p.stats[k],0,8)))return false;
  if(p.points+Object.values(p.stats).reduce((a,b)=>a+b,0)!==p.level-1)return false;
  let xp=p.totalXp,level=1;while(level<12&&xp>=60+(level-1)*35){xp-=60+(level-1)*35;level++;}
  return level===p.level&&p.xp===(level===12?0:xp);
 }
 function validate(data){
  if(!data||data.version!==2||data.layout!==2||!integer(data.realm,0,2)||!integer(data.shards,0,Number.MAX_SAFE_INTEGER)||typeof data.won!=='boolean'||!validProgress(data.progression))throw Error('Invalid save schema');
  for(const [key,length] of [['abilities',2],['defeated',3]])if(!Array.isArray(data[key])||data[key].length!==length||data[key].some(v=>typeof v!=='boolean'))throw Error('Invalid abilities');
  for(const key of ['flags','visitedRests'])if(!Array.isArray(data[key])||data[key].length!==3)throw Error('Invalid world progress');
  for(let i=0;i<3;i++){
   const map=levels[i],allowed=new Set([...map.objects.map(o=>o.id),...map.gates.filter(g=>['fire','fragile'].includes(g.kind)).map(g=>g.id),...(map.secrets||[]).flatMap(s=>['discovered:'+s.id,'guardian:'+s.guardian])]);
   if(!Array.isArray(data.flags[i])||data.flags[i].length>allowed.size||data.flags[i].some(f=>typeof f!=='string'||!allowed.has(f))||new Set(data.flags[i]).size!==data.flags[i].length)throw Error('Invalid quest flags');
   const rests=new Set(map.rests.map(r=>r.id));if(!Array.isArray(data.visitedRests[i])||data.visitedRests[i].length>rests.size||data.visitedRests[i].some(id=>!rests.has(id))||new Set(data.visitedRests[i]).size!==data.visitedRests[i].length)throw Error('Invalid checkpoints');
  }
  if((data.realm>0||data.defeated[0])&&!data.abilities[0]||(data.realm>1||data.defeated[1])&&!data.abilities[1]||data.realm>0&&!data.defeated[0]||data.realm>1&&!data.defeated[1])throw Error('Invalid realm sequence');
  if(data.defeated[0]&&!['forestBell','villageBell'].every(id=>data.flags[0].includes(id))||data.defeated[1]&&!['soulUpper','soulLower'].every(id=>data.flags[1].includes(id)))throw Error('Incomplete boss prerequisites');
  if(data.defeated[2]&&!data.flags[2].includes('dawnSeal')||data.won&&(!data.defeated[2]||data.realm!==2))throw Error('Invalid victory');
  for(const o of levels[0].objects.filter(o=>o.type==='relic'))if(data.flags[0].includes(o.id)&&(!data.abilities[0]||!data.flags[0].includes('guardian:'+o.guardian)))throw Error('Unguarded relic');
  const checkpoint=levels[data.realm].rests.find(r=>r.id===data.checkpoint?.id);
  if(!checkpoint||data.checkpoint.x!==checkpoint.x||data.checkpoint.y!==checkpoint.y||!data.visitedRests[data.realm].includes(checkpoint.id))throw Error('Invalid save location');
  return JSON.parse(JSON.stringify(data));
 }
 function legacy(data){
  if(!data||data.version!==1||!integer(data.realm,0,2))throw Error('Invalid legacy save');
  const copy=JSON.parse(JSON.stringify(data));copy.version=2;copy.layout=2;copy.won=copy.won??false;
  if(!copy.progression)copy.progression={level:1,xp:0,totalXp:0,points:0,stats:{vitality:0,strength:0,spirit:0}};
  copy.flags=data.layout===2?copy.flags:[[],[],[]];copy.visitedRests=data.layout===2?copy.visitedRests:[[],[],[]];
  if(!Array.isArray(copy.abilities)||!Array.isArray(copy.defeated)||!Array.isArray(copy.flags)||!Array.isArray(copy.visitedRests))throw Error('Invalid legacy arrays');
  if(copy.defeated[0]||copy.realm>0)copy.abilities[0]=true;if(copy.defeated[1]||copy.realm>1)copy.abilities[1]=true;
  if(data.layout!==2){if(copy.defeated[0])copy.flags[0].push('forestBell','villageBell');if(copy.defeated[1])copy.flags[1].push('soulUpper','soulLower');}
  for(const o of levels[0].objects.filter(o=>o.type==='relic'))if(copy.flags[0]?.includes(o.id)&&!copy.flags[0].includes('guardian:'+o.guardian))copy.flags[0].push('guardian:'+o.guardian);
  const map=levels[copy.realm],point=map.rests.find(r=>r.id===copy.checkpoint?.id)||map.rests[0];copy.checkpoint={...point};if(!copy.visitedRests[copy.realm]?.includes(point.id))copy.visitedRests[copy.realm].push(point.id);
  return validate(copy);
 }
 const request=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
 const complete=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(tx.error||Error('Storage aborted'));});
 async function records(){const tx=db.transaction(storeName,'readonly'),done=complete(tx),store=tx.objectStore(storeName);const [profile,sealed]=await Promise.all([request(store.get('profile')),request(store.get('save'))]);await done;return {profile,sealed};}
 async function keyFor(profile,salt){return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt,info:encode.encode('momo-save-v2|'+scope+'|'+profile.device)},profile.key,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
 function aad(profile,revision){return encode.encode('momo-save-v2|'+scope+'|'+profile.device+'|'+revision);}
 async function seal(data,profile){
  const salt=random(16),iv=random(12),revision=profile.revision+1,key=await keyFor(profile,salt);
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(profile,revision),tagLength:128},key,encode.encode(JSON.stringify(validate(data))));
  return prefix+btoa(JSON.stringify({v:2,device:profile.device,revision,salt:b64(salt),iv:b64(iv),data:b64(new Uint8Array(ciphertext))}));
 }
 async function open(sealed,profile){
  if(typeof sealed!=='string'||!sealed.startsWith(prefix)||sealed.length>30000)throw Error('Invalid save envelope');
  const entry=JSON.parse(atob(sealed.slice(prefix.length)));
  if(entry.v!==2||entry.device!==profile.device||entry.revision!==profile.revision||!integer(entry.revision,1,Number.MAX_SAFE_INTEGER))throw Error('Foreign or replayed save');
  const salt=bytes(entry.salt,16),iv=bytes(entry.iv,12),ciphertext=bytes(entry.data);if(ciphertext.length>18000)throw Error('Save too large');
  const key=await keyFor(profile,salt),plain=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:aad(profile,entry.revision),tagLength:128},key,ciphertext);
  return validate(JSON.parse(decode.decode(plain)));
 }
 async function writeOne(snapshot){
  const {profile}=await records(),sealed=await seal(snapshot,profile);
  const tx=db.transaction(storeName,'readwrite'),done=complete(tx),store=tx.objectStore(storeName);
  const current=await request(store.get('profile'));
  if(current.device!==profile.device||current.revision!==profile.revision){tx.abort();await done;return;}
  store.put({...profile,revision:profile.revision+1,migrated:true},'profile');store.put(sealed,'save');await done;
  try{localStorage.setItem(SAVE_KEY,sealed);}catch{/* IndexedDB remains the durable source. */}
 }
 async function lockedWrite(snapshot){
  if(navigator.locks?.request)return navigator.locks.request('momo-save-v2',()=>writeOne(snapshot));
  return writeOne(snapshot);
 }
 async function initialize(){
  if(!crypto?.subtle||!globalThis.indexedDB)throw Error('Secure storage unavailable');
  const req=indexedDB.open('momo-save-v2',1);req.onupgradeneeded=()=>req.result.createObjectStore(storeName);db=await request(req);
  let {profile,sealed}=await records();
  if(!profile){
   const seed=random(32),key=await crypto.subtle.importKey('raw',seed,'HKDF',false,['deriveKey']);seed.fill(0);
   const candidate={device:b64(random(16)),key,revision:0,migrated:false};
   const tx=db.transaction(storeName,'readwrite'),done=complete(tx),store=tx.objectStore(storeName),existing=await request(store.get('profile'));if(!existing)store.put(candidate,'profile');await done;
   ({profile,sealed}=await records());
  }
  if(profile.key?.extractable!==false||profile.key?.algorithm?.name!=='HKDF'||!integer(profile.revision,0,Number.MAX_SAFE_INTEGER))throw Error('Invalid profile key');
  let result=null;
  if(sealed){
   result=await open(sealed,profile);let mirror;try{mirror=localStorage.getItem(SAVE_KEY);}catch{}
   if(mirror&&mirror!==sealed)initialNotice='A módosított vagy régebbi mentés helyett az utolsó érvényes állapotot töltöttük be.';
   try{localStorage.setItem(SAVE_KEY,sealed);}catch{}
  }else if(!profile.migrated){
   let old;try{old=localStorage.getItem(LEGACY_SAVE_KEY);}catch{}
   if(old){try{result=legacy(JSON.parse(old));await lockedWrite(result);initialNotice='A korábbi utazásod megmaradt. A mentés új védelmet kapott.';}catch{initialNotice='A korábbi mentés sérült vagy érvénytelen. Új utazást indíthatsz; a régi adatot megőriztük.';}}
   if(!result){const tx=db.transaction(storeName,'readwrite'),done=complete(tx);tx.objectStore(storeName).put({...profile,migrated:true},'profile');await done;}
  }
  readyFlag=true;return result;
 }
 const ready=initialize().catch(()=>{initialNotice='A mentés most nem érhető el. Az utazás elindítható, de ezen a munkameneten nem tudunk menteni.';return null;});
 return Object.freeze({ready,get isReady(){return readyFlag;},get notice(){return initialNotice;},write(snapshot){const data=validate(snapshot);const operation=queue.catch(()=>{}).then(async()=>{await ready;if(!readyFlag)throw Error('Secure storage unavailable');await lockedWrite(data);});queue=operation;return operation;}});
})();
