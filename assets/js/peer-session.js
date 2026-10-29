/* Reusable two-peer transport. Only explicit host/join calls contact PeerServer. */
'use strict';
const PeerSession=(()=>{
 const protocol=1,maxBytes=16384,alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',prefix='kiba-duel-v1-';
 const validCode=code=>typeof code==='string'&&new RegExp('^['+alphabet+']{8}$').test(code);
 function makeCode(){
  if(!globalThis.crypto?.getRandomValues)throw Error('unsupported');
  const bytes=new Uint8Array(8);globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes,value=>alphabet[value%alphabet.length]).join('');
 }
 function safeRecord(value){
  let nodes=0;
  function visit(item,depth){
   if(++nodes>3000||depth>10)return false;
   if(item===null||typeof item==='boolean')return true;
   if(typeof item==='number')return Number.isFinite(item);
   if(typeof item==='string')return item.length<=maxBytes;
   if(typeof item!=='object')return false;
   if(!Array.isArray(item)&&Object.getPrototypeOf(item)!==Object.prototype&&Object.getPrototypeOf(item)!==null)return false;
   const keys=Object.keys(item);if(keys.length>500)return false;
   return keys.every(key=>!['__proto__','prototype','constructor'].includes(key)&&visit(item[key],depth+1));
  }
  if(!value||typeof value!=='object'||Array.isArray(value)||!visit(value,0))return false;
  try{return new TextEncoder().encode(JSON.stringify(value)).length<=maxBytes;}catch{return false;}
 }
 function create({Peer,version,onState=()=>{},onMessage=()=>{},iceServers}={}){
  let peer=null,connection=null,state='closed',role=null,code='',generation=0,hello=false,ack=false,lastSeen=0,windowStart=0,received=0;
  const handlers=[],timers=new Set(),candidates=new Set();
  const emit=(next,detail=null)=>{state=next;onState(next,detail);};
  function listen(emitter,event,handler){emitter.on(event,handler);handlers.push([emitter,event,handler]);}
  function later(fn,ms,repeat=false){const record=[null,repeat];const id=(repeat?setInterval:setTimeout)(()=>{if(!repeat)timers.delete(record);fn();},ms);record[0]=id;timers.add(record);return id;}
  function forget(emitter){for(let i=handlers.length-1;i>=0;i--)if(handlers[i][0]===emitter){const [,event,handler]=handlers[i];if(typeof emitter.off==='function')emitter.off(event,handler);handlers.splice(i,1);}}
  function cleanup(){
   generation++;
   for(const [id,repeat]of timers)(repeat?clearInterval:clearTimeout)(id);timers.clear();
   for(const [emitter,event,handler]of handlers)if(typeof emitter.off==='function')emitter.off(event,handler);handlers.length=0;
   const oldPeer=peer;connection=null;peer=null;hello=false;ack=false;
   for(const candidate of candidates)try{candidate.close();}catch{}candidates.clear();
   try{oldPeer?.destroy();}catch{}
  }
  function fail(reason){cleanup();emit('error',reason);}
  function transmit(frame){if(!connection?.open)return false;try{connection.send(frame);return true;}catch{fail('connection');return false;}}
  const wire=(kind,extra={})=>({k:kind,p:protocol,v:version,...extra});
  function connected(){
   if(!hello||!ack||state==='connected')return;
   const token=generation;lastSeen=Date.now();emit('connected');
   if(token!==generation||state!=='connected')return;
   later(()=>{
    if(token!==generation||state!=='connected')return;
    if(Date.now()-lastSeen>12000){fail('connection');return;}
    transmit(wire('ping'));
   },2000,true);
  }
  function attach(candidate){
   if(candidates.size>=8){try{candidate.close();}catch{}return;}
   candidates.add(candidate);
   if(connection){
    const token=generation;
    const drop=()=>{forget(candidate);candidates.delete(candidate);try{candidate.close();}catch{}};
    const reject=()=>{if(token!==generation){drop();return;}try{candidate.send(wire('reject',{reason:'full'}));}catch{}later(drop,50);};
    later(drop,2000);
    if(candidate.open)reject();else listen(candidate,'open',reject);return;
   }
   connection=candidate;hello=false;ack=false;windowStart=Date.now();received=0;const token=generation;
   const current=()=>token===generation&&connection===candidate;
   emit('connecting');
   later(()=>{if(current()&&state!=='connected')fail('connection');},20000);
   listen(candidate,'data',frame=>{
    if(!current())return;
    const now=Date.now();if(now-windowStart>=2000){windowStart=now;received=0;}
    if(++received>240||!safeRecord(frame)){fail('connection');return;}
    if(frame.k==='reject'&&frame.reason==='full'){fail('full');return;}
    if(frame.p!==protocol||frame.v!==version){fail('version');return;}
    if(frame.k==='hello'){hello=true;if(!transmit(wire('ack')))return;connected();return;}
    if(frame.k==='ack'){ack=true;connected();return;}
    if(state!=='connected'){fail('connection');return;}
    lastSeen=now;
    if(frame.k==='ping'){transmit(wire('pong'));return;}
    if(frame.k==='pong')return;
    if(frame.k!=='data'||!safeRecord(frame.d)){fail('connection');return;}
    onMessage(frame.d);
   });
   listen(candidate,'close',()=>{if(current())fail('connection');});
   listen(candidate,'error',()=>{if(current())fail('connection');});
   const opened=()=>{if(current())transmit(wire('hello'));};
   if(candidate.open)opened();else listen(candidate,'open',opened);
  }
  function start(nextRole,requestedCode){
   cleanup();role=nextRole;code=typeof requestedCode==='string'?requestedCode.trim().toUpperCase():'';
   if(!validCode(code)){emit('error','invalid');return false;}
   if(typeof Peer!=='function'||typeof version!=='string'||!version){emit('error','unsupported');return false;}
   const options={secure:true,config:{iceServers:iceServers||[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]}};
   emit('opening');const token=generation;
   try{peer=new Peer(nextRole==='host'?prefix+code:undefined,options);}catch{fail('unsupported');return false;}
   listen(peer,'open',()=>{
    if(token!==generation)return;
    if(role==='host'){emit('waiting');return;}
    try{attach(peer.connect(prefix+code,{reliable:true,serialization:'json'}));}catch{fail('connection');}
   });
   listen(peer,'connection',candidate=>{if(token!==generation){try{candidate.close();}catch{}return;}if(role!=='host'){try{candidate.close();}catch{}return;}attach(candidate);});
   listen(peer,'error',error=>{if(token===generation)fail(error?.type==='browser-incompatible'?'unsupported':['unavailable-id','peer-unavailable'].includes(error?.type)?'unavailable':'connection');});
   listen(peer,'disconnected',()=>{if(token===generation&&state!=='connected')fail('connection');});
   listen(peer,'close',()=>{if(token===generation)fail('connection');});
   later(()=>{if(token===generation&&state==='opening')fail('connection');},20000);
   return true;
  }
  return Object.freeze({
   host(requestedCode){let next=requestedCode;try{if(next===undefined)next=makeCode();}catch{cleanup();emit('error','unsupported');return false;}return start('host',next);},
   join(requestedCode){return start('guest',requestedCode);},
   send(payload){const frame=wire('data',{d:payload});return state==='connected'&&safeRecord(payload)&&safeRecord(frame)&&transmit(frame);},
   close(){cleanup();emit('closed');},get state(){return state;},get role(){return role;},get code(){return code;}
  });
 }
 return Object.freeze({create,validCode,makeCode,safeRecord,protocol,maxBytes});
})();
