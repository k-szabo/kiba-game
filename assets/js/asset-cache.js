/* Release-scoped image responses; no document/runtime interception or save data. */
'use strict';
const AssetCache=(()=>{
 let base=null,opening=null,generation=0,disabled=false;
 try{base=new URL('.',document.baseURI||location.href);}catch{}
 try{disabled=localStorage.getItem('cacheDisable')==='true';}catch{}
 const prefix=base?'kiba-images:'+encodeURIComponent(base.pathname)+':':'',name=prefix+GAME_RELEASE.version;
 const supported=()=>!!base&&['http:','https:'].includes(base.protocol)&&typeof fetch==='function'&&typeof URL.createObjectURL==='function';
 function older(version){
  const parse=value=>/^(\d+)\.(\d+)\.(\d+)(?:_([a-z0-9]{8}))?$/.exec(value),a=parse(version),b=parse(GAME_RELEASE.version);if(!a||!b)return false;
  for(let i=1;i<=3;i++)if(+a[i]!==+b[i])return +a[i]<+b[i];
  if(!a[4])return !!b[4];const history=GAME_RELEASE.bugfixHistory?.[b.slice(1,4).join('.')];
  return !!history&&history.includes(a[4])&&history.indexOf(a[4])<history.indexOf(b[4]);
 }
 async function cache(){
  if(disabled||!supported())return null;
  if(!opening)opening=(async()=>{try{
   if(!globalThis.caches)return null;
   const keys=await caches.keys();
   for(const key of keys)if(key.startsWith(prefix)&&older(key.slice(prefix.length)))await caches.delete(key);
   return await caches.open(name);
  }catch{return null;}})();
  return opening;
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
  let finished=false,objectURL=null,store=null,key=source,response=null,revision=generation;
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
    if(!fallback){store=null;assign(key,true);}else finish(false);
   };
   image.src=url;if(image.complete&&image.naturalWidth)image.onload();
  };
  if(!supported()){assign(source,true);return;}
  try{const url=new URL(source,base);if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname+'assets/images/')){assign(source,true);return;}url.searchParams.set('v',GAME_RELEASE.version);key=url.href;}catch{assign(source,true);return;}
  (async()=>{
   try{
    store=await cache();if(disabled||revision!==generation)store=null;
    let found=store?await store.match(key):null;
    if(disabled||revision!==generation){store=null;found=null;}
    if(found&&!valid(found)){await store.delete(key);found=null;}
    const data=found||await fetch(key,{cache:disabled?'no-store':'no-cache',credentials:'same-origin'});
    if(!valid(data))throw Error('Image response unavailable');
    response=!found&&store?data.clone():null;
    const blob=await data.blob();objectURL=URL.createObjectURL(blob);assign(objectURL);
   }catch{store=null;response=null;assign(key,true);}
  })();
 }
 return Object.freeze({load,setDisabled,get disabled(){return disabled;},get name(){return name;}});
})();
