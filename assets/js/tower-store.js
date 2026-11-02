/* Tower checkpoints and local scores never enter the adventure save vault. */
'use strict';
const TowerStore=(()=>{
 const key='kiba-infinite-tower-v1',weapons=['katana','naginata','swordShield'],limit=Number.MAX_SAFE_INTEGER;
 const fresh=()=>({schema:1,checkpoint:null,best:null,last:null}),copy=value=>JSON.parse(JSON.stringify(value));
 const record=(value,keys)=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(name=>Object.hasOwn(value,name));
 const integer=(value,max=limit)=>Number.isSafeInteger(value)&&value>=0&&value<=max;
 const scoreKeys=['seed','weapon','cleared','kills','elapsed'];
 function validScore(value){return record(value,scoreKeys)&&integer(value.seed,0xffffffff)&&value.seed>0&&weapons.includes(value.weapon)&&integer(value.cleared,limit-1)&&integer(value.kills)&&value.kills>=value.cleared&&Number.isFinite(value.elapsed)&&value.elapsed>=0&&value.elapsed<=limit;}
 const compare=(a,b)=>!a?-1:!b?1:a.cleared-b.cleared||a.kills-b.kills||b.elapsed-a.elapsed;
 const best=(a,b)=>copy(compare(a,b)>=0?a:b);
 const same=(a,b)=>a&&b&&a.seed===b.seed&&a.weapon===b.weapon;
 function valid(data){
  if(!record(data,['schema','checkpoint','best','last'])||data.schema!==1)return false;
  if(data.best!==null&&!validScore(data.best)||data.last!==null&&!validScore(data.last))return false;
  if(data.last&&(!data.best||compare(data.best,data.last)<0))return false;
  const p=data.checkpoint;
  if(p!==null){
   if(!validScore(p)||p.cleared%5!==0||p.cleared===0&&(p.kills!==0||p.elapsed!==0))return false;
   if(p.cleared>0&&(!data.best||compare(data.best,p)<0))return false;
  }
  return true;
 }
 let memory=fresh(),reason=null,volatileReason=null;
 function readDisk(){
  let raw;try{raw=localStorage.getItem(key);}catch{return {data:null,reason:'storage'};}
  if(raw===null)return {data:fresh(),reason:null};
  if(typeof raw!=='string'||raw.length>8192)return {data:null,reason:'invalid'};
  try{const data=JSON.parse(raw);if(data?.schema!==1)return {data:null,reason:'unsupported'};return valid(data)?{data,reason:null}:{data:null,reason:'invalid'};}catch{return {data:null,reason:'invalid'};}
 }
 function synchronize(){
  // Once this page cannot safely persist, keep its run entirely in memory.
  // Reloading may retry storage; a partial disk snapshot must not erase it.
  if(volatileReason)return {data:null,reason:volatileReason};
  const disk=readDisk();reason=disk.reason;
  if(reason)volatileReason=reason;
  if(disk.data){const merged=copy(disk.data);if(memory.best)merged.best=best(memory.best,merged.best);memory=merged;}
  return disk;
 }
 function read(){synchronize();return copy(memory);}
 function result(ok,persisted,why=reason){return {ok,persisted,reason:why,data:copy(memory)};}
 function write(data,disk){
  if(!valid(data))return result(false,false,'invalid');
  memory=copy(data);
  if(!disk.data)return result(true,false,disk.reason);
  try{localStorage.setItem(key,JSON.stringify(memory));reason=null;return result(true,true,null);}catch{reason=volatileReason='storage';return result(true,false);}
 }
 function start(input){
  if(!record(input,['seed','weapon']))return result(false,false,'invalid');
  const point={seed:input.seed,weapon:input.weapon,cleared:0,kills:0,elapsed:0};
  if(!validScore(point))return result(false,false,'invalid');
  const disk=synchronize(),data=copy(memory);data.checkpoint=point;return write(data,disk);
 }
 function advance(point,checkpoint){
  if(!validScore(point)||checkpoint&&point.cleared%5!==0)return result(false,false,'invalid');
  const disk=synchronize(),data=copy(memory),old=data.checkpoint;
  if(!same(point,old)||point.cleared<old.cleared||point.kills<old.kills||point.elapsed<old.elapsed)return result(false,false,'stale');
  data.best=best(data.best,point);if(checkpoint)data.checkpoint=copy(point);else data.last=copy(point);
  return write(data,disk);
 }
 return Object.freeze({read,start,saveCheckpoint:point=>advance(point,true),finish:point=>advance(point,false),valid,get available(){return reason===null;},get reason(){return reason;}});
})();
