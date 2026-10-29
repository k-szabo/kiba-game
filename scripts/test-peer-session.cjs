'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{EventEmitter}=require('node:events');
const source=fs.readFileSync(require('node:path').join(__dirname,'../assets/js/peer-session.js'),'utf8');
for(const [name,hash]of [['peerjs-1.5.5.min.js','7604d8c31bec4f134b0d15c2d80b1d095ea18af005354f439f14291fcd7b4168'],['peerjs-LICENSE','9407807dba7f47a79bfb3ac55759d63d77c9371ebd0616d5a093e97d3e810397']])assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(require('node:path').join(__dirname,'../assets/vendor',name))).digest('hex'),hash,'Pinned vendor bytes and license are unchanged');
function environment(){
 let now=0,serial=0;const jobs=new Map(),peers=new Map(),instances=[];
 const timeout=(fn,ms,repeat=false)=>{const id=++serial;jobs.set(id,{fn,at:now+ms,repeat:repeat?ms:0});return id;};
 const clear=id=>jobs.delete(id);
 function advance(ms=0){const until=now+ms;let limit=10000;while(limit--){const next=[...jobs].filter(([,job])=>job.at<=until).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];if(!next)break;const [id,job]=next;now=job.at;if(job.repeat)job.at+=job.repeat;else jobs.delete(id);job.fn();}assert(limit>0,'Timer loop terminates');now=until;}
 class ClockDate extends Date{static now(){return now;}}
 class Connection extends EventEmitter{
  constructor(){super();this.open=false;this.closed=false;this.sent=[];}
  send(frame){if(!this.open)throw Error('closed');this.sent.push(frame);if(this.other)timeout(()=>{if(!this.other.closed)this.other.emit('data',structuredClone(frame));},0);}
  close(){if(this.closed)return;this.closed=true;this.open=false;this.emit('close');if(this.other&&!this.other.closed)timeout(()=>this.other.close(),0);}
 }
 class Peer extends EventEmitter{
  constructor(id,options){super();this.id=id||'guest-'+instances.length;this.options=options;this.destroyed=false;instances.push(this);if(peers.has(this.id))timeout(()=>this.emit('error',{type:'unavailable-id'}),0);else{peers.set(this.id,this);timeout(()=>{if(!this.destroyed)this.emit('open',this.id);},0);}}
  connect(id,options){this.connectOptions=options;const target=peers.get(id),local=new Connection();this.lastConnection=local;if(!target){timeout(()=>this.emit('error',{type:'peer-unavailable'}),0);return local;}const remote=new Connection();target.lastConnection=remote;local.other=remote;remote.other=local;target.emit('connection',remote);timeout(()=>{local.open=remote.open=true;remote.emit('open');local.emit('open');},0);return local;}
  destroy(){this.destroyed=true;if(peers.get(this.id)===this)peers.delete(this.id);this.emit('close');}
 }
 const api=new Function('setTimeout','clearTimeout','setInterval','clearInterval','Date',source+';return PeerSession;')((f,m)=>timeout(f,m),clear,(f,m)=>timeout(f,m,true),clear,ClockDate);
 const make=(version='test',extra={})=>{const states=[],messages=[];const session=api.create({Peer,version,onState:(...args)=>states.push(args),onMessage:message=>messages.push(message),...extra});return {session,states,messages};};
 const pair=(otherVersion='test')=>{const host=make(),guest=make(otherVersion);assert(host.session.host('ABCDEFGH'));assert(guest.session.join('abcdefgh'));advance();return {host,guest};};
 return {api,Peer,Connection,instances,make,pair,advance,jobs,peers};
}
{
 const e=environment();assert.equal(e.instances.length,0,'Constructing the module makes no external connection');
 for(let i=0;i<100;i++){const code=e.api.makeCode();assert(e.api.validCode(code));assert(!/[01IO]/.test(code));}
 for(const code of ['',null,'abcdefgh','ABCDEFG','ABCDEFGHI','ABCDEF01','ABCDEFG<'])assert(!e.api.validCode(code));
 for(const item of [null,[],new Date(),{bad:Infinity},{bad:undefined},JSON.parse('{"__proto__":{}}'),{nested:{constructor:'unsafe'}},{long:'x'.repeat(17000)}])assert(!e.api.safeRecord(item));
 const circular={};circular.self=circular;assert(!e.api.safeRecord(circular));assert(e.api.safeRecord({kind:'input',move:-1,jump:true,points:[1,2,null]}));
 const invalid=e.make();assert(!invalid.session.join('wrong'));assert.deepEqual(invalid.states.at(-1),['error','invalid']);assert.equal(e.instances.length,0);
}
{
 const e=environment(),{host,guest}=e.pair();assert.equal(host.session.state,'connected');assert.equal(guest.session.state,'connected');
 assert.equal(host.session.role,'host');assert.equal(guest.session.role,'guest');assert.equal(host.session.code,'ABCDEFGH');
 assert.deepEqual(e.instances[0].options.config.iceServers,[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]);
 assert.equal(e.instances[1].connectOptions.serialization,'json');assert.equal(e.instances[1].connectOptions.reliable,true);
 assert(guest.session.send({kind:'input',seq:1,move:1}));e.advance();assert.deepEqual(host.messages,[{kind:'input',seq:1,move:1}]);
 assert(!guest.session.send({bad:'x'.repeat(17000)}));assert.equal(host.session.state,'connected');
 e.advance(8000);assert.equal(host.session.state,'connected','Heartbeats keep an otherwise idle connection alive');
 const third=e.make();third.session.join('ABCDEFGH');e.advance(100);assert.deepEqual(third.states.at(-1),['error','full']);assert.equal(host.session.state,'connected','A third player cannot evict the opponent');assert.equal(guest.session.state,'connected');
 const before=host.messages.length;host.session.close();e.advance();assert.equal(host.session.state,'closed');assert.equal(host.messages.length,before);assert.equal(guest.session.state,'error');assert(e.instances.every(p=>p.destroyed));assert.equal(e.jobs.size,0,'Timers are cleared after both peers close');
}
{
 const e=environment(),{host,guest}=e.pair('other');assert(host.states.some(s=>s[1]==='version')||guest.states.some(s=>s[1]==='version'));assert.equal(host.messages.length+guest.messages.length,0);assert.notEqual(host.session.state,'connected');assert.notEqual(guest.session.state,'connected');host.session.close();guest.session.close();e.advance();assert.equal(e.jobs.size,0);
}
{
 const e=environment(),host=e.make();host.session.host('ABCDEFGH');e.advance();const p=e.instances[0],connection=new e.Connection();p.emit('connection',connection);e.advance(20001);assert.deepEqual(host.states.at(-1),['error','connection']);assert(connection.closed);assert(p.destroyed);assert.equal(e.jobs.size,0);
 // Old emitter callbacks cannot deliver data into a later session.
 host.session.host('JKLMNPQR');e.advance();connection.emit('data',{k:'hello',p:1,v:'test'});assert.equal(host.session.state,'waiting');assert.equal(host.messages.length,0);host.session.close();assert.equal(e.jobs.size,0);
}
{
 const e=environment();let host;
 host=e.make('test',{onState:state=>{if(state==='connected')host.session.close();}});
 const guest=e.make();host.session.host('ABCDEFGH');guest.session.join('ABCDEFGH');e.advance();
 assert.equal(host.session.state,'closed','The connected callback may synchronously leave');
 assert.equal(guest.session.state,'error');assert.equal(e.jobs.size,0,'A synchronous leave cannot create an orphan heartbeat after cleanup');
}
{
 const e=environment(),{host,guest}=e.pair();const peer=e.instances[0],candidate=new e.Connection();candidate.open=true;peer.emit('connection',candidate);host.session.close();assert(candidate.closed,'Rejected candidates are closed if the host leaves during rejection');guest.session.close();e.advance();assert.equal(e.jobs.size,0);
}
for(const malformed of [{k:'data',p:1,v:'test',d:[]},{k:'unexpected',p:1,v:'test'},{k:'data',p:1,v:'test',d:{n:Infinity}},{k:'data',p:1,v:'test',d:{huge:'x'.repeat(17000)}}]){
 const e=environment(),{host,guest}=e.pair();
 // A malicious peer can bypass send(), so invoke the established DataConnection's data callback.
 guest.session.send({probe:true});e.advance();const connection=e.instances[0].lastConnection;
 connection.emit('data',malformed);assert.deepEqual(host.states.at(-1),['error','connection']);assert.equal(host.messages.length,1,'Only the earlier safe probe reached gameplay');guest.session.close();e.advance();assert.equal(e.jobs.size,0);
}
{
 const e=environment(),{host,guest}=e.pair(),target=e.instances[0].lastConnection;guest.session.send({probe:true});e.advance();
 for(let i=0;i<250&&host.session.state==='connected';i++)target.emit('data',{k:'data',p:1,v:'test',d:{seq:i}});
 assert.deepEqual(host.states.at(-1),['error','connection'],'Ingress flooding disconnects before unbounded gameplay work');guest.session.close();e.advance();assert.equal(e.jobs.size,0);
}
console.log('PASS: lazy reusable two-peer lifecycle, cryptographic codes, secure STUN config, version handshake, single opponent, bounded payload/rate, heartbeat, timeout and cleanup.');
