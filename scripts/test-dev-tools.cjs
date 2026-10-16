const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {webcrypto,pbkdf2Sync,randomBytes}=require('node:crypto');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/dev-tools.js'),'utf8');
const disabled={version:1,enabled:false,algorithm:'PBKDF2-SHA256',iterations:600000,salt:'',verifier:''};
const password='  Árnyék-Teszt-2026  ',salt=randomBytes(16);
const configured={version:1,enabled:true,algorithm:'PBKDF2-SHA256',iterations:600000,salt:salt.toString('base64'),verifier:pbkdf2Sync(password,salt,600000,32,'sha256').toString('base64')};
function fixture(config=configured){
 const elements=new Map(),timers=new Map();let timerId=0;
 const document={activeElement:null,getElementById(id){if(!elements.has(id))elements.set(id,element(id));return elements.get(id);},createElement:()=>element('button')};
 function element(id){return{id,hidden:false,disabled:false,value:'',children:[],listeners:{},attributes:{},isConnected:true,inert:false,textContent:'',scrollTop:0,
  setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,f){this.listeners[k]=f;},replaceChildren(){this.children=[];},append(e){this.children.push(e);},focus(){document.activeElement=this;},matches(){return this.id==='devPassword'||/Button$|^dev(?:Close|Unlock|Lock)$/.test(this.id);},closest(){return null;},getClientRects(){return this.hidden?[]:[{}];},querySelectorAll(){return['devPassword','devUnlock','devLock','devClose'].map(id=>document.getElementById(id)).filter(e=>!e.disabled&&(e.id!=='devLock'||!document.getElementById('devWorkspace').hidden)&&(e.id==='devLock'||!document.getElementById('devLogin').hidden||e.id==='devClose'));}};}
 const context={console,crypto:webcrypto,TextEncoder,Uint8Array,Map,Set,atob,document,location:{hash:'',pathname:'/kiba-game/',search:'?example=1'},history:{replaceState(_s,_t,url){assert.equal(url,'/kiba-game/?example=1');context.location.hash='';}},addEventListener(){},setTimeout(fn){timers.set(++timerId,fn);return timerId;},clearTimeout(id){timers.delete(id);}};
 context.window=context;vm.createContext(context);
 vm.runInContext(`const DEV_AUTH=${JSON.stringify(config)},GAME_RELEASE={version:'0.9.13'},I18n={t:x=>x,format:(x,args)=>x+args,onChange(){}};let state='play';const keys=new Set(['j']),pressed=new Set([' ']);`,context);
 vm.runInContext(source+'\nDevTools.init();',context);
 const run=s=>vm.runInContext(s,context),node=id=>document.getElementById(id);
 node('game').children=[node('world'),node('devPanel')];node('devPanel').hidden=true;node('startButton').focus();
 const submit=value=>{node('devPassword').value=value;return node('devLogin').listeners.submit({preventDefault(){}});};
 return{run,node,submit,context,timers,document};
}
(async()=>{
 const off=fixture(disabled);assert.equal(off.run('state'),'play');assert(off.run('DevTools.open()'));
 assert(off.node('devUnlock').disabled);assert.equal(off.node('devStatus').textContent,'dev.unconfigured');assert(off.run('DevTools.close()'));
 const unsupported=fixture();unsupported.context.crypto={};unsupported.run('DevTools.open()');assert(unsupported.node('devUnlock').disabled);assert.equal(unsupported.node('devStatus').textContent,'dev.unsupported');
 const f=fixture(),{run,node,submit}=f;
 run("var executions=0;DevTools.register({id:'test',labelKey:'dev.test',run:()=>executions++});DevTools.open();");
 assert.equal(run('state'),'developer');assert(run('keys.size===0&&pressed.size===0'));assert(node('world').inert);assert.equal(node('devToolsList').children.length,0);
 await submit(password.trim());assert(node('devPassword').disabled,'Wrong passwords enter a brief cooldown');assert.equal(node('devStatus').textContent,'dev.invalid');assert(node('devWorkspace').hidden);assert.equal(node('devPassword').value,'');
 for(const fn of f.timers.values())fn();f.timers.clear();assert(!node('devUnlock').disabled);
 await submit(password);assert(!node('devWorkspace').hidden);assert.equal(f.document.activeElement.id,'devLock');assert.equal(node('devPassword').value,'');
 const staleButton=node('devToolsList').children[0];staleButton.onclick();assert.equal(run('executions'),1);
 run('DevTools.lock()');staleButton.onclick();assert.equal(run('executions'),1,'Retained callbacks cannot run after locking');assert(node('devWorkspace').hidden);
 const pending=submit(password);run('DevTools.close();DevTools.open();');await pending;assert(node('devWorkspace').hidden,'A completed stale check cannot unlock a reopened panel');
 await submit(password);assert(!node('devWorkspace').hidden);run('DevTools.close()');staleButton.onclick();assert.equal(run('executions'),1);assert.equal(run('state'),'play');assert(!node('world').inert);assert.equal(f.document.activeElement.id,'startButton');
 run("state='menu';DevTools.open();");assert(run('DevTools.menuBackground'));run('DevTools.close()');assert(!run('DevTools.menuBackground'));
 for(const invalid of ['body','hidden','disabled']){const target=node(invalid==='body'?'body':'sourceButton');target.hidden=invalid==='hidden';target.disabled=invalid==='disabled';target.focus();run("state='menu';DevTools.open();DevTools.close()");assert.equal(f.document.activeElement.id,'startButton','Unfocusable source falls back to menu start');target.hidden=false;target.disabled=false;}
 node('sourceButton').focus();run("DevTools.open();DevTools.close()");assert.equal(f.document.activeElement.id,'sourceButton');
 for(const state of ['inventory','help','map','dialog','won']){run(`state='${state}'`);assert(!run('DevTools.open()'));assert.equal(run('state'),state);}
 run("state='pause';DevTools.open()");assert.equal(run('state'),'developer');run('DevTools.close()');assert.equal(run('state'),'pause');
 assert.throws(()=>run("DevTools.register({id:'test',labelKey:'dev.test',run(){}})"),/Invalid/);
 const h=require('./test-harness.cjs')();h.sandbox.clearTimeout=clearTimeout;h.sandbox.setTimeout=setTimeout;
 const before=h.run('JSON.stringify({player,enemies,boss,platforms,projectiles,particles,time,levelTime})'),writes=h.run('window.__saveSnapshots.length');
 assert(h.run('DevTools.open()'));h.press('j');h.press(' ');h.tick(240);assert.equal(h.run('JSON.stringify({player,enemies,boss,platforms,projectiles,particles,time,levelTime})'),before,'Developer panel freezes the game');assert.equal(h.run('window.__saveSnapshots.length'),writes,'Panel does not write gameplay saves');
 h.run('DevTools.close();mainMenu();DevTools.open();draw();mainMenu();');assert.equal(h.snap().state,'menu');assert(h.elements.get('devPanel').hidden);
 assert(!fs.readFileSync(path.join(__dirname,'../assets/js/runtime.js'),'utf8').includes('window.DevTools='),'No public developer export');
 console.log('PASS: salted PBKDF2 password, exact Unicode/space handling, disabled/unsupported gates, wrong-password cooldown, stale async rejection, callback gating, session relock, pause and save invariants.');
})().catch(error=>{console.error(error);process.exitCode=1;});
