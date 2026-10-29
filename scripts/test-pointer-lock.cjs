'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(){
 const windowEvents=new Map(),documentEvents=new Map(),game={dataset:{}},canvas={},outside={};
 let requests=0,exits=0,pauses=0,clears=0,duelFocus=0,focused=true,clock=1000;
 const listen=map=>(name,fn)=>{if(!map.has(name))map.set(name,[]);map.get(name).push(fn);};
 const fire=(map,name,event={})=>{for(const fn of map.get(name)||[])fn(event);};
 const doc={hidden:false,pointerLockElement:null,hasFocus:()=>focused,addEventListener:listen(documentEvents),exitPointerLock(){exits++;doc.pointerLockElement=null;fire(documentEvents,'pointerlockchange');}};
 canvas.requestPointerLock=()=>{requests++;};
 const duel={active:false,pointerPlayable:false,releasePointer(focus){clears++;if(focus)duelFocus++;}};
 const env={document:doc,canvas,state:'play',resolutionBlocked:false,keys:new Set(['d','mouse0']),pressed:new Set(['mouse2']),performance:{now:()=>clock},DuelMode:duel,$:()=>game,addEventListener:listen(windowEvents),pause(){pauses++;env.state=env.state==='play'?'pause':'play';}};
 vm.createContext(env);vm.runInContext(fs.readFileSync('assets/js/cursor.js','utf8')+'\nglobalThis.cursor=Cursor;',env);const c=env.cursor;c.init();c.init();
 const request=extra=>c.request({target:canvas,isTrusted:true,...extra});
 const grant=()=>{doc.pointerLockElement=canvas;fire(documentEvents,'pointerlockchange');};
 const loss=()=>{doc.pointerLockElement=null;fire(documentEvents,'pointerlockchange');};
 const escape=()=>{const event={key:'Escape',prevented:false,stopped:false,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}};fire(windowEvents,'keydown',event);return event;};
 return {c,env,doc,canvas,game,duel,outside,request,grant,loss,escape,fireWindow:(name,event)=>fire(windowEvents,name,event),fireDocument:name=>fire(documentEvents,name),focus:value=>focused=value,advance:ms=>clock+=ms,get requests(){return requests;},get exits(){return exits;},get pauses(){return pauses;},get clears(){return clears;},get duelFocus(){return duelFocus;}};
}
(async()=>{
 for(const state of ['menu','pause','dialog','inventory','shop','training','map','help','developer','slayerSpell','dungeonMenu','weaponSelection','won']){
  const h=fixture();h.env.state=state;assert.equal(h.request(),false,state+' must not request');
 }
 {
  const h=fixture();assert.equal(h.request({isTrusted:false}),false);assert.equal(h.request({target:h.outside}),false);
  h.env.resolutionBlocked=true;assert.equal(h.request(),false);h.env.resolutionBlocked=false;
  h.focus(false);assert.equal(h.request(),false);h.focus(true);
  assert(h.request());assert.equal(h.request(),false,'Pending calls coalesce');h.grant();h.c.update();
  assert.equal(h.doc.pointerLockElement,h.canvas);assert.equal(h.requests,1);assert.equal(h.game.dataset.gameCursor,'hidden');
  h.loss();assert.equal(h.env.state,'pause');assert.equal(h.pauses,1);assert.equal(h.env.keys.size,0);assert.equal(h.env.pressed.size,0);
  assert(h.escape().stopped,'A lockchange-before-keydown Escape cannot resume the pause');assert.equal(h.pauses,1);
  h.fireWindow('keyup',{key:'Escape'});h.env.state='play';h.c.update();assert.equal(h.requests,1,'Returning to play does not auto-capture');
  assert(h.request());h.grant();assert(h.escape().stopped);assert.equal(h.doc.pointerLockElement,null);assert.equal(h.pauses,2,'keydown-before-lockchange pauses exactly once');
 }
 for(const state of ['pause','dialog','inventory','shop','training','map','help','developer','slayerSpell','dungeonMenu','weaponSelection','menu','won']){
  const h=fixture();h.request();h.grant();h.env.state=state;h.c.update();
  assert.equal(h.exits,1);assert.equal(h.env.state,state);assert.equal(h.pauses,0,'Intentional UI release never toggles pause');assert.equal(h.game.dataset.gameCursor,'paw');
 }
 for(const method of ['blur','pagehide','hidden','small']){
  const h=fixture();h.request();h.grant();
  if(method==='hidden'){h.doc.hidden=true;h.fireDocument('visibilitychange');}
  else if(method==='small'){h.env.resolutionBlocked=true;h.c.update();}
  else h.fireWindow(method);
  assert.equal(h.doc.pointerLockElement,null,method+' releases');assert.equal(h.env.keys.size,0);assert.equal(h.env.pressed.size,0);
 }
 {
  const h=fixture();h.request();h.env.state='dialog';h.c.update();h.env.state='play';h.grant();
  assert.equal(h.doc.pointerLockElement,null,'Late grant is released even after play resumed');assert.equal(h.pauses,0);
  h.doc.pointerLockElement=h.outside;h.env.state='menu';h.c.update();assert.equal(h.doc.pointerLockElement,h.outside,'Never exits another element’s lock');
 }
 {
  const h=fixture();h.canvas.requestPointerLock=undefined;assert.equal(h.request(),false);h.c.update();assert.equal(h.env.state,'play');
  h.canvas.requestPointerLock=()=>{throw Error('Denied');};assert.doesNotThrow(()=>h.request());assert(h.request(),'Synchronous failure permits another explicit gesture');
 }
 {
  const h=fixture();h.request();h.fireDocument('pointerlockerror');assert(h.request(),'Legacy void API errors permit a later retry');
  h.grant();assert.equal(h.doc.pointerLockElement,h.canvas);
 }
 {
  const h=fixture();let rejectOld;h.canvas.requestPointerLock=()=>new Promise((_,reject)=>{rejectOld=reject;});
  h.request();h.env.state='pause';h.c.update();h.env.state='play';h.canvas.requestPointerLock=()=>undefined;assert(h.request());
  rejectOld(Error('Old request denied'));await Promise.resolve();await Promise.resolve();
  assert.equal(h.request(),false,'Old Promise rejection cannot cancel the newer request');h.grant();assert.equal(h.doc.pointerLockElement,h.canvas);
 }
 {
  const h=fixture();h.canvas.requestPointerLock=()=>Promise.reject(Error('Denied'));h.request();await Promise.resolve();await Promise.resolve();
  assert.equal(h.env.state,'play','Denial never crashes or pauses gameplay');h.canvas.requestPointerLock=()=>Promise.resolve();assert(h.request());h.grant();
  assert.equal(h.doc.pointerLockElement,h.canvas,'Promise API success is confirmed by the lock-change event');
 }
 {
  const h=fixture();h.env.state='duel';h.duel.active=true;assert.equal(h.request(),false,'Lobby is not a playable arena');
  h.duel.pointerPlayable=true;assert(h.request());h.grant();h.escape();assert.equal(h.env.state,'duel');assert.equal(h.pauses,0);assert.equal(h.duelFocus,1);assert(h.clears>0);assert.equal(h.game.dataset.gameCursor,'paw','Escape immediately leaves a visible free cursor in duels');
  h.request();h.grant();h.duel.pointerPlayable=false;h.c.update();assert.equal(h.doc.pointerLockElement,null,'Results and disconnects release the lock');assert.equal(h.game.dataset.gameCursor,'paw');
 }
 console.log('PASS: trusted gameplay lock, Promise/void/denied APIs, stale grants, Escape order, every modal/focus/viewport release, input cleanup and duel isolation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
