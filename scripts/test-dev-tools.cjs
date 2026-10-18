const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/dev-tools.js'),'utf8');
function fixture({hash='',initialState='play'}={}){
 const elements=new Map(),listeners={};
 const document={activeElement:null,getElementById(id){if(!elements.has(id))elements.set(id,element(id));return elements.get(id);},createElement:tag=>element('toolButton',tag)};
 function element(id,tag='button'){return{id,tagName:tag.toUpperCase(),hidden:false,disabled:false,children:[],attributes:{},listeners:{},isConnected:true,inert:false,textContent:'',scrollTop:0,
  setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,f){this.listeners[k]=f;},replaceChildren(){this.children=[];},append(e){this.children.push(e);},focus(){document.activeElement=this;},matches(){return /Button$|^devClose$/.test(this.id);},closest(){return null;},getClientRects(){return this.hidden?[]:[{}];},querySelectorAll(){return [...document.getElementById('devToolsList').children,document.getElementById('devClose')].filter(e=>!e.disabled&&!e.hidden);}};}
 const context={console,Map,Set,document,Inventory:{render(){}},Merchant:{render(){}},location:{hash,pathname:'/kiba-game/',search:'?example=1'},history:{replaceState(_s,_t,url){assert.equal(url,'/kiba-game/?example=1');context.location.hash='';}},addEventListener(name,fn){listeners[name]=fn;}};
 context.window=context;vm.createContext(context);
 vm.runInContext(`const GAME_RELEASE={version:'test'},I18n={t:x=>x,format:(x,args)=>x+args,onChange(){}};let state=${JSON.stringify(initialState)},helpOrigin='menu';const keys=new Set(['j']),pressed=new Set([' ']);`,context);
 const run=s=>vm.runInContext(s,context),node=id=>document.getElementById(id);
 node('game').children=[node('world'),node('alreadyInert'),node('devPanel')];node('alreadyInert').inert=true;node('devPanel').hidden=true;node('startButton').focus();
 vm.runInContext(source+'\nDevTools.init();',context);
 return{run,node,context,document,listeners};
}
const f=fixture(),{run,node}=f;
run("var executions=0,available=true;DevTools.register({id:'test',labelKey:'dev.test',run:()=>executions++,available:()=>available});DevTools.open();");
assert.equal(run('state'),'developer');assert(run('keys.size===0&&pressed.size===0'));assert(node('world').inert);assert.equal(node('devToolsList').children.length,1,'No authentication or crypto is needed');assert.equal(f.document.activeElement.id,'devClose');
const staleButton=node('devToolsList').children[0];staleButton.onclick();assert.equal(run('executions'),1);
run('available=false;DevTools.refresh()');assert(node('devToolsList').children[0].disabled);staleButton.onclick();assert.equal(run('executions'),1,'Availability is rechecked at execution');
run("available=true;state='dialog'");staleButton.onclick();assert.equal(run('executions'),1,'Tools require developer state');run("state='developer'");
run('DevTools.close()');staleButton.onclick();assert.equal(run('executions'),1);assert.equal(run('state'),'play');assert(!node('world').inert);assert(node('alreadyInert').inert);assert.equal(f.document.activeElement.id,'startButton');
run('DevTools.open()');staleButton.onclick();assert.equal(run('executions'),1,'Callbacks from a previous open cannot run in a new session');node('devToolsList').children[0].onclick();assert.equal(run('executions'),2);run('DevTools.close()');
run("state='menu';DevTools.open();");assert(run('DevTools.menuBackground'));run('DevTools.close()');assert(!run('DevTools.menuBackground'));
for(const invalid of ['body','hidden','disabled']){const target=node(invalid==='body'?'body':'sourceButton');target.hidden=invalid==='hidden';target.disabled=invalid==='disabled';target.focus();run("state='menu';DevTools.open();DevTools.close()");assert.equal(f.document.activeElement.id,'startButton');target.hidden=false;target.disabled=false;}
node('sourceButton').focus();run('DevTools.open();DevTools.close()');assert.equal(f.document.activeElement.id,'sourceButton');
for(const state of ['inventory','help','map','training','dialog','won']){
 run(`state='${state}'`);const overlay=node(state==='won'?'dialog':state);overlay.hidden=false;
 assert(run('DevTools.open()'));assert(overlay.hidden,'Underlying modal is hidden while the developer panel owns focus');
 run('DevTools.close()');assert.equal(run('state'),state);assert(!overlay.hidden,'Closing without a tool restores the original modal');overlay.hidden=true;
}
run("state='pause';DevTools.open()");assert.equal(run('state'),'developer');run('DevTools.close()');assert.equal(run('state'),'pause');
assert.throws(()=>run("DevTools.register({id:'test',labelKey:'dev.test',run(){}})"),/Invalid/);
const hash=fixture({hash:'#devtools',initialState:'menu'});assert.equal(hash.run('state'),'developer');hash.node('devClose').onclick();assert.equal(hash.context.location.hash,'');assert.equal(hash.document.activeElement.id,'startButton');hash.context.location.hash='#devtools';hash.listeners.hashchange();assert.equal(hash.run('state'),'developer');
const empty=fixture();empty.run('DevTools.open()');assert(!empty.node('devEmpty').hidden);
let prevented=false;empty.node('devPanel').listeners.keydown({key:'Tab',preventDefault(){prevented=true;}});assert(prevented,'The only control traps Tab');
empty.node('devPanel').listeners.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});assert.equal(empty.run('state'),'play');
// Re-rendered forms must not retain privileged callbacks or lose field values.
const form=fixture();form.run(`var selected='a',submitted=null;DevTools.register({id:'form',labelKey:'dev.test',fields:()=>[
 {id:'realm',type:'select',labelKey:'dev.realm',value:selected,options:[{value:'a',label:'A'},{value:'b',label:'B'}],change:value=>selected=value},
 {id:'level',type:'number',labelKey:'dev.level',value:3,min:1,max:12}
],run:values=>submitted=values});DevTools.open();`);
const oldGroup=form.node('devToolsList').children[0],oldSelect=oldGroup.children[1],oldAction=oldGroup.children[4];
assert.equal(oldSelect.tagName,'SELECT');assert.equal(oldSelect.value,'a');assert.equal(oldSelect.children.length,2);
oldSelect.value='b';oldSelect.onchange();assert.equal(form.run('selected'),'b');
oldAction.onclick();assert.equal(form.run('submitted'),null,'An action from before a form re-render is stale');
oldSelect.value='a';oldSelect.onchange();assert.equal(form.run('selected'),'b','A stale select callback cannot change current selection');
const group=form.node('devToolsList').children[0];group.children[3].value='9';group.children[4].onclick();
assert.equal(form.run('submitted.realm'),'b');assert.equal(form.run('submitted.level'),'9','The action reads the current typed value');
const closedField=form.node('devToolsList').children[0].children[1];form.run('DevTools.close()');closedField.value='a';closedField.onchange();assert.equal(form.run('selected'),'b');
const h=require('./test-harness.cjs')();
// Every modal can be suspended; changing the test world discards its old UI.
for(const modal of ['inventory','map','training','help','dialog','won','pause']){
 const ui=['menu','pause','inventory','map','training','help','dialog'];
 for(const id of ui)h.sandbox.document.getElementById(id).hidden=id!==(modal==='won'?'dialog':modal);
 h.run(`state='${modal}';helpOrigin='pause';`);
 const visibility=ui.map(id=>h.elements.get(id).hidden),world=h.run('JSON.stringify({player,enemies,boss,flags,progression})');
 assert(h.run('DevTools.open()'));h.tick(30);assert(ui.every(id=>h.elements.get(id).hidden));
 h.run('DevTools.close()');assert.equal(h.snap().state,modal);assert.deepEqual(ui.map(id=>h.elements.get(id).hidden),visibility);
 assert.equal(h.run('JSON.stringify({player,enemies,boss,flags,progression})'),world);
}
h.run("state='play';Inventory.open();DevTools.open();DevSession.begin();DevTools.close()");
assert.equal(h.snap().state,'play');assert(h.elements.get('inventory').hidden);
for(const operation of ["DevTeleport.teleport({realm:'1',rest:levels[1].rests[0].id})",'DevBoss.revive()']){
 h.run('pause();DevTools.open()');assert(h.run(operation));h.run('DevTools.close()');
 assert.equal(h.snap().state,'play');assert(h.elements.get('pause').hidden,'A world-changing tool must not leave a pause overlay over a running game');
 h.run('pause()');assert.equal(h.snap().state,'pause');h.elements.get('resumeButton').onclick();assert.equal(h.snap().state,'play');assert(h.elements.get('pause').hidden,'Resume closes in one click');
}
h.run('DevSession.end();startGame(true)');h.dismiss();
const before=h.run('JSON.stringify({player,enemies,boss,platforms,projectiles,particles,time,levelTime})'),writes=h.run('window.__saveSnapshots.length');
assert(h.run('DevTools.open()'));h.press('j');h.press(' ');h.tick(240);assert.equal(h.run('JSON.stringify({player,enemies,boss,platforms,projectiles,particles,time,levelTime})'),before,'Developer panel freezes the game');assert.equal(h.run('window.__saveSnapshots.length'),writes,'Panel does not write gameplay saves');
h.run('DevTools.close();mainMenu();DevTools.open();draw();mainMenu();');assert.equal(h.snap().state,'menu');assert(h.elements.get('devPanel').hidden);
const root=path.join(__dirname,'..'),runtime=fs.readFileSync(path.join(root,'assets/js/runtime.js'),'utf8');
assert(!runtime.includes('window.DevTools='),'No public developer export');assert(!runtime.includes('DEV_AUTH'),'No developer password configuration');
for(const file of ['README.md','docs/GAMEPLAY.md'])assert(!/devtools|dev-tools|fejlesztői eszközpanel|developer tools/i.test(fs.readFileSync(path.join(root,file),'utf8')),file+' does not advertise the developer panel');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert(!/id="dev(?:Login|Password|Unlock|Lock)"/.test(html),'No login controls');
const locales=JSON.parse(fs.readFileSync(path.join(root,'assets/i18n/locales.json'),'utf8'));
for(const record of Object.values(locales))assert(!Object.keys(record.dict).some(key=>/^menu\.changelog\..*devPanel$/.test(key)),'Player changelog does not advertise developer access');
console.log('PASS: direct access without auth/config/crypto, URL entry, callback/session/availability guards, focus, keyboard, pause, save invariants and development-only documentation.');
