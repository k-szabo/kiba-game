'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const config=JSON.parse(fs.readFileSync('assets/config/keybindings.json','utf8'));
function fixture(){
 const windowEvents=new Map(),documentEvents=new Map(),root={},canvas={},outside={},game={dataset:{}};
 let requests=0,exits=0,pauses=0,releases=0,pointerExits=0,focused=true,clock=1000;
 const listen=map=>(name,fn)=>{if(!map.has(name))map.set(name,[]);map.get(name).push(fn);};
 const fire=(map,name,event={})=>{for(const fn of map.get(name)||[]){fn(event);if(event.stopped)break;}};
 const doc={documentElement:root,hidden:false,fullscreenElement:null,fullscreenEnabled:true,pointerLockElement:null,hasFocus:()=>focused,
  addEventListener:listen(documentEvents),exitFullscreen(){exits++;doc.fullscreenElement=null;fire(documentEvents,'fullscreenchange');},exitPointerLock(){pointerExits++;doc.pointerLockElement=null;fire(documentEvents,'pointerlockchange');}};
 root.requestFullscreen=()=>{requests++;};
 const duel={active:false,releasePointer(){releases++;},pointerPlayable:true};
 const env={document:doc,KEY_BINDINGS:config,localStorage:{getItem:()=>null,setItem(){}},state:'play',keys:new Set(['f','d']),pressed:new Set(['f']),captureAction:null,canvas,resolutionBlocked:false,
  performance:{now:()=>clock},DuelMode:duel,Cursor:{update(){}},$:()=>game,addEventListener:listen(windowEvents),pause(){pauses++;env.state=env.state==='play'?'pause':'play';}};
 vm.createContext(env);vm.runInContext(fs.readFileSync('assets/js/keybindings.js','utf8')+'\n'+fs.readFileSync('assets/js/fullscreen.js','utf8')+'\nglobalThis.fullscreen=Fullscreen;',env);
 const f=env.fullscreen;f.init();f.init();
 const key=(extra={})=>{const event={key:'f',ctrlKey:true,repeat:false,prevented:false,stopped:false,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...extra};fire(windowEvents,'keydown',event);return event;};
 const grant=()=>{doc.fullscreenElement=root;fire(documentEvents,'fullscreenchange');};
 const loss=()=>{doc.fullscreenElement=null;fire(documentEvents,'fullscreenchange');};
 return {env,f,doc,root,canvas,duel,outside,key,grant,loss,focus:value=>focused=value,advance:ms=>clock+=ms,window:(name,event)=>fire(windowEvents,name,event),document:name=>fire(documentEvents,name),get requests(){return requests;},get exits(){return exits;},get pauses(){return pauses;},get releases(){return releases;},get pointerExits(){return pointerExits;}};
}
(async()=>{
 assert.deepEqual(config.shortcuts.fullscreen,{key:'f',ctrl:true});
 {
  const h=fixture();assert(h.key().stopped);assert.equal(h.requests,1);assert.equal(h.env.keys.size,0);assert.equal(h.env.pressed.size,0);
  assert(h.key({repeat:true}).stopped);assert.equal(h.requests,1);h.key();assert.equal(h.requests,1,'Pending requests coalesce');
  h.grant();assert(h.f.active());assert.equal(h.pauses,0);h.key();assert.equal(h.exits,1);assert.equal(h.env.state,'pause');assert.equal(h.pauses,1);
  assert(h.key({key:'Escape',ctrlKey:false}).stopped);assert.equal(h.pauses,1,'Exit event arriving before Escape cannot toggle pause back');
  h.window('keyup',{key:'Escape'});h.env.state='play';assert(!h.key({key:'Escape',ctrlKey:false}).stopped);
 }
 {
  const h=fixture();h.key();h.grant();assert(h.key({key:'Escape',ctrlKey:false}).stopped);assert.equal(h.exits,1);assert.equal(h.pauses,1,'Escape before exit event pauses once');
 }
 for(const action of ['escape','toggle','native']){
  const h=fixture();h.key();h.doc.fullscreenElement=h.root;
  // Observe the granted native property before its entry event is dispatched.
  if(action==='escape')h.key({key:'Escape',ctrlKey:false});else if(action==='toggle')h.key();else h.loss();
  assert.equal(h.doc.fullscreenElement,null);assert.equal(h.pauses,1,action+' after a grant but before its event pauses once');
  h.document('fullscreenchange');h.document('fullscreenchange');
  assert.equal(h.pauses,1,'Late entry/exit notifications do not toggle pause again');
  assert(h.key({key:'Escape',ctrlKey:false}).stopped);assert.equal(h.env.state,'pause');
 }
 for(const extra of [{ctrlKey:false},{shiftKey:true},{altKey:true},{metaKey:true},{key:'g'},{target:{closest:()=>({})}},{target:{isContentEditable:true}}]){
  const h=fixture();assert(!h.key(extra).stopped);assert.equal(h.requests,0);
 }
 {
  const h=fixture();h.env.captureAction='attack';assert(!h.key().stopped);assert.equal(h.requests,0,'Do not swallow key-binding capture');
  h.env.captureAction=null;h.focus(false);h.key();assert.equal(h.requests,0);h.focus(true);
  h.env.resolutionBlocked=true;h.key();assert.equal(h.requests,1,'Fullscreen can rescue a too-small viewport; resize owns its actual gameplay gate');
 }
 for(const state of ['menu','pause','dialog','inventory','shop','help','map','training','developer','towerMenu']){
  const h=fixture();h.env.state=state;h.key();h.grant();h.loss();assert.equal(h.env.state,state);assert.equal(h.pauses,0,'Fullscreen does not resume or change existing UI state');
 }
 {
  const h=fixture();h.duel.active=true;h.key();h.grant();h.loss();assert.equal(h.env.state,'play');assert.equal(h.pauses,0);assert(h.releases>0);assert.equal(h.env.keys.size,0,'Duel clears held controls but keeps sim running');
 }
 for(const cancel of ['blur','pagehide','hidden']){
  const h=fixture();h.key();if(cancel==='hidden'){h.doc.hidden=true;h.document('visibilitychange');}else h.window(cancel);
  h.grant();assert.equal(h.doc.fullscreenElement,null,'Cancelled late grant is released');assert.equal(h.pauses,0,'Never pauses on a grant cancelled before ownership');
 }
 {
  const h=fixture();h.doc.fullscreenEnabled=false;assert(h.key().stopped);assert.equal(h.requests,0);h.doc.fullscreenEnabled=true;h.root.requestFullscreen=undefined;assert.doesNotThrow(()=>h.key());
  h.root.requestFullscreen=()=>{throw Error('Denied');};assert.doesNotThrow(()=>h.key());h.root.requestFullscreen=()=>Promise.reject(Error('Denied'));h.key();await Promise.resolve();await Promise.resolve();
  let retried=0;h.root.requestFullscreen=()=>{retried++;};h.key();assert.equal(retried,1,'A rejected request permits a new explicit gesture');
 }
 {
  const h=fixture();h.key();h.document('fullscreenerror');h.key();assert.equal(h.requests,2);h.doc.fullscreenElement=h.outside;assert(!h.f.toggle());assert.equal(h.exits,0,'Another fullscreen owner is untouched');
 }
 {
  const h=fixture();h.env.Cursor=undefined;vm.runInContext(fs.readFileSync('assets/js/cursor.js','utf8')+'\nCursor.init();',h.env);
  h.canvas.requestPointerLock=()=>{};vm.runInContext('Cursor.request({isTrusted:true,target:canvas})',h.env);h.doc.pointerLockElement=h.canvas;h.document('pointerlockchange');
  h.key();h.grant();h.loss();assert.equal(h.pointerExits,1);assert.equal(h.pauses,1,'Pointer-lock and fullscreen exit must not double-toggle adventure pause');
 }
 {
  const h=require('./test-harness.cjs')();
  h.sandbox.document.getElementById('bindingRows').querySelector=()=>({focus(){}});
  h.run("state='help';captureAction='attack';");
  for(const key of ['Control','Alt','Meta']){
   h.run('handleKeyDown({key:'+JSON.stringify(key)+',preventDefault(){}})');
   assert.equal(h.run('captureAction'),'attack','Bare '+key+' keeps capture open until the actual key');
  }
  h.run("handleKeyDown({key:'f',ctrlKey:true,preventDefault(){}})");
  assert.equal(h.run('captureAction'),null);assert.equal(h.run("Bindings.read('attack')[0]"),'f');
  h.run("captureAction='attack';handleKeyDown({key:'Shift',preventDefault(){}})");
  assert.equal(h.run("Bindings.read('attack')[0]"),'shift','Shift remains an assignable gameplay input');
 }
 console.log('PASS fullscreen shortcut, native transitions, rejection and pointer/duel integration');
})().catch(error=>{console.error(error);process.exitCode=1;});
