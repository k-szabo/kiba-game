/* Public Supabase configuration; user sessions stay in this browser, never saves. */
'use strict';
const TowerLeaderboardAPI=(()=>{
 const config=LEADERBOARD_CONFIG,key='kiba-tower-auth:'+config.url;
 let memory=null,publicKey=null;
 const error=code=>Object.assign(Error(code),{code});
 const valid=session=>session&&typeof session.access_token==='string'&&session.access_token.length<16384&&typeof session.refresh_token==='string'&&session.refresh_token.length<4096&&Number.isFinite(session.expires_at);
 async function request(path,{method='GET',body,token}={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{
   if(!publicKey){
    const settings=await fetch(config.keyFile,{signal:controller.signal,cache:'no-store',credentials:'omit'});
    if(!settings.ok)throw error('unavailable');const data=await settings.json();
    if(typeof data.publishableKey!=='string'||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(data.publishableKey))throw error('unavailable');publicKey=data.publishableKey;
   }
   const response=await fetch(config.url+path,{method,signal:controller.signal,cache:'no-store',credentials:'omit',headers:{apikey:publicKey,...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
   const data=await response.json();if(!response.ok)throw error(data.error==='rate_limited'?'rate_limited':data.error==='invalid_name'?'invalid_name':response.status===401?'unauthorized':'unavailable');return data;
  }catch(e){throw error(['rate_limited','invalid_name','unauthorized'].includes(e?.code)?e.code:'unavailable');}finally{clearTimeout(timer);}
 }
 function read(){try{const session=JSON.parse(localStorage.getItem(key)||'null');return valid(session)&&(!memory||session.expires_at>=memory.expires_at)?session:memory;}catch{return memory;}}
 function store(data){
  const session={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:data.expires_at||Date.now()/1000+data.expires_in};
  if(!valid(session))throw error('unavailable');memory=session;try{localStorage.setItem(key,JSON.stringify(session));}catch{}return session;
 }
 async function authenticate(){
  const work=async()=>{
   const old=read();if(old&&old.expires_at>Date.now()/1000+60)return old.access_token;
   // A refresh failure must not silently replace the player's identity.
   const data=old?await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:old.refresh_token}}):await request('/auth/v1/signup',{method:'POST',body:{data:{},gotrue_meta_security:{}}});
   return store(data).access_token;
  };
  return globalThis.navigator?.locks?navigator.locks.request(key,work):work();
 }
 const nameValid=name=>typeof name==='string'&&Array.from(name).length>=3&&Array.from(name).length<=20&&name===name.trim()&&/^[\p{L}\p{N} _-]+$/u.test(name);
 const scoreValid=score=>score&&Number.isSafeInteger(score.seed)&&score.seed>0&&score.seed<=0xffffffff&&['katana','naginata','swordShield'].includes(score.weapon)&&Number.isSafeInteger(score.cleared)&&score.cleared>=1&&score.cleared<=10000&&Number.isSafeInteger(score.kills)&&score.kills>=score.cleared&&score.kills<=1000000&&Number.isFinite(score.elapsed)&&score.elapsed>0&&score.elapsed<=31536000;
 function scoresValid(data){return Array.isArray(data?.scores)&&data.scores.length<=50&&data.scores.every(row=>Number.isSafeInteger(row.rank)&&row.rank>=1&&row.rank<=50&&nameValid(row.display_name)&&Number.isSafeInteger(row.cleared)&&row.cleared>=1&&row.cleared<=10000&&Number.isSafeInteger(row.elapsed_ms)&&row.elapsed_ms>=1&&row.elapsed_ms<=31536000000&&['katana','naginata','swordShield'].includes(row.weapon));}
 async function list(){const data=await request('/functions/v1/'+config.function);if(!scoresValid(data))throw error('unavailable');return data.scores;}
 async function submit(name,score){
  if(!nameValid(name))throw error('invalid_name');if(!scoreValid(score))throw error('invalid_score');
  const token=await authenticate(),data=await request('/functions/v1/'+config.function,{method:'POST',token,body:{name,seed:score.seed,weapon:score.weapon,cleared:score.cleared,kills:score.kills,elapsedMs:Math.max(1,Math.round(score.elapsed*1000)),version:GAME_RELEASE.version}});
  if(data?.ok!==true||typeof data.improved!=='boolean')throw error('unavailable');return data;
 }
 return Object.freeze({list,submit,nameValid,scoreValid});
})();
