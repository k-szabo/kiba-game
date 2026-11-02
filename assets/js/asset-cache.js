/* Content-addressed image responses; no document/runtime interception or save data. */
'use strict';
const AssetCache=(()=>{
 let base=null,generation=0,disabled=false;const openings=new Map();
 try{base=new URL('.',document.baseURI||location.href);}catch{}
 try{disabled=localStorage.getItem('cacheDisable')==='true';}catch{}
 const revisions=typeof IMAGE_REVISIONS==='object'&&IMAGE_REVISIONS?IMAGE_REVISIONS:null;
 const prefix=base?'kiba-images:'+encodeURIComponent(base.pathname)+':':'',legacyName=prefix+GAME_RELEASE.version,contentName=prefix+'content-v1',name=revisions?contentName:legacyName;
 const hashFor=path=>revisions&&Object.hasOwn(revisions,path)&&/^[a-f0-9]{8,64}$/.test(revisions[path])?revisions[path]:null;
 const owned=url=>url.origin===base.origin&&url.pathname.startsWith(base.pathname+'assets/images/');
 const supported=()=>!!base&&['http:','https:'].includes(base.protocol)&&typeof fetch==='function'&&typeof URL.createObjectURL==='function';
 function older(version){
  const parse=value=>/^(\d+)\.(\d+)\.(\d+)(?:_([a-z0-9]{8}))?$/.exec(value),a=parse(version),b=parse(GAME_RELEASE.version);if(!a||!b)return false;
  for(let i=1;i<=3;i++)if(+a[i]!==+b[i])return +a[i]<+b[i];
  if(!a[4])return !!b[4];const history=GAME_RELEASE.bugfixHistory?.[b.slice(1,4).join('.')];
  return !!history&&history.includes(a[4])&&history.indexOf(a[4])<history.indexOf(b[4]);
 }
 async function prune(store){
  if(!revisions||typeof store.keys!=='function')return;
  for(const request of await store.keys()){
   let url;try{url=new URL(request.url||request);}catch{continue;}
   if(!owned(url)||![...url.searchParams.keys()].every(key=>key==='v'))continue;
   const hash=url.searchParams.get('v');if(!/^[a-f0-9]{8,64}$/.test(hash||''))continue;
   const current=hashFor(url.pathname.slice(base.pathname.length));if(hash===current)continue;
   // A stale tab must never evict a future deployment's artwork.
   const response=await store.match(request),release=response?.headers.get('X-Kiba-Cache-Release');
   if(release&&older(release))await store.delete(request);
  }
 }
 async function cache(content){
  if(disabled||!supported())return null;
  const selected=content?contentName:legacyName;
  if(!openings.has(selected))openings.set(selected,(async()=>{try{
   if(!globalThis.caches)return null;
   const keys=await caches.keys();
   for(const key of keys)if(key.startsWith(prefix)&&older(key.slice(prefix.length)))await caches.delete(key);
   const store=await caches.open(selected);if(content)await prune(store);return store;
  }catch{return null;}})());
  return openings.get(selected);
 }
 function setDisabled(value){
  if(typeof value!=='boolean')return false;
  try{localStorage.setItem('cacheDisable',String(value));}catch{return false;}
  disabled=value;generation++;return true;
 }
 if(typeof addEventListener==='function')addEventListener('storage',event=>{
  if(event.key==='cacheDisable'||event.key===null){try{disabled=localStorage.getItem('cacheDisable')==='true';generation++;}catch{}}
 });
 const valid=response=>response?.ok&&response.type!=='opaque'&&/^image\//i.test(response.headers.get('Content-Type')||'');
 function load(image,source,done=()=>{}){
  let finished=false,objectURL=null,store=null,key=source,response=null,revision=generation,hash=null;
  const revoke=()=>{if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null;}};
  const finish=ok=>{if(finished)return;finished=true;revoke();done(ok);};
  const assign=(url,fallback=false)=>{
   image.onload=()=>{
    if(finished)return;
    if(response&&store&&!disabled&&revision===generation)store.put(key,response).catch(()=>{});
    finish(true);
   };
   image.onerror=()=>{
    if(finished)return;
    revoke();response=null;
    if(store)store.delete(key).catch(()=>{});
    if(!fallback&&!hash){store=null;assign(key,true);}else finish(false);
   };
   image.src=url;if(image.complete&&image.naturalWidth)image.onload();
  };
  if(!supported()){assign(source,true);return;}
  try{const url=new URL(source,base);if(!owned(url)){assign(source,true);return;}hash=hashFor(url.pathname.slice(base.pathname.length));url.searchParams.set('v',hash||GAME_RELEASE.version);key=url.href;}catch{assign(source,true);return;}
  (async()=>{
   try{
    store=await cache(!!hash);if(disabled||revision!==generation)store=null;
    let found=null;
    try{found=store?await store.match(key):null;}catch{store=null;}
    if(disabled||revision!==generation){store=null;found=null;}
    if(found&&!valid(found)){try{await store.delete(key);}catch{}found=null;}
    const data=found||await fetch(key,{cache:disabled?'no-store':hash?'force-cache':'no-cache',credentials:'same-origin'});
    if(!valid(data))throw Error('Image response unavailable');
    const blob=await data.blob();
    if(hash){
     if(typeof crypto==='undefined'||!crypto.subtle){finish(false);return;}
     const digest=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()),actual=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
     // Static hosting can return newly deployed bytes to an old tab's hash URL.
     // Known wrong bytes must not be cached or rendered with old crop metadata.
     if(!actual.startsWith(hash)){if(store)try{await store.delete(key);}catch{}finish(false);return;}
    }
    if(!found&&store){
     const headers=new Headers(data.headers);if(hash)headers.set('X-Kiba-Cache-Release',GAME_RELEASE.version);
     response=new Response(blob,{status:data.status,statusText:data.statusText,headers});
    }
    objectURL=URL.createObjectURL(blob);assign(objectURL);
   }catch{store=null;response=null;if(hash)finish(false);else assign(key,true);}
  })();
 }
 return Object.freeze({load,setDisabled,get disabled(){return disabled;},get name(){return name;}});
})();
