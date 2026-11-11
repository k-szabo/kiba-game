'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/tower-rewards.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'../assets/js/tower-store.js'),'utf8'),key='kiba-infinite-tower-v1';
function setup(shared=new Map(),options={}){
 const reads=[],writes=[],sandbox={localStorage:{getItem(name){reads.push(name);if(options.blockRead)throw Error('blocked');return shared.get(name)??null;},setItem(name,value){writes.push(name);if(options.blockWrite)throw Error('quota');shared.set(name,value);}}};
 vm.createContext(sandbox);vm.runInContext(source,sandbox);const run=text=>vm.runInContext(text,sandbox),json=text=>JSON.parse(JSON.stringify(run(text)));
 return {run,json,shared,reads,writes,options};
}
const point=(seed,cleared,kills=cleared*4,elapsed=cleared*10,weapon='katana')=>({seed,weapon,cleared,kills,elapsed});
const call=(h,name,value)=>h.json('TowerStore.'+name+'('+JSON.stringify(value)+')');
const shared=new Map([['momo-three-worlds-v2','private-adventure-sentinel'],['momo-save-profile','private-profile-sentinel'],['momo-keybindings','private-bindings-sentinel']]),initial=new Map(shared),a=setup(shared);
assert.deepEqual(a.json('TowerStore.read()'),{schema:1,checkpoint:null,best:null,last:null});
assert(call(a,'start',{seed:123,weapon:'katana'}).persisted);
assert(call(a,'saveCheckpoint',point(123,5)).persisted);
let stored=a.json('TowerStore.read()');assert.equal(stored.checkpoint.cleared,5);assert.equal(stored.best.cleared,5);
assert(call(a,'finish',point(123,8,35,99)).persisted);stored=a.json('TowerStore.read()');assert.equal(stored.checkpoint.cleared,5,'Death/exit keeps the last fifth-floor checkpoint');assert.equal(stored.last.cleared,8);assert.equal(stored.best.cleared,8);
const reload=setup(shared);assert.equal(reload.json('TowerStore.read().checkpoint.cleared'),5);assert.equal(reload.json('TowerStore.read().last.kills'),35);
assert(call(reload,'start',{seed:456,weapon:'naginata'}).persisted);assert.equal(reload.json('TowerStore.read().checkpoint.cleared'),0);assert.equal(reload.json('TowerStore.read().best.cleared'),8,'A new run preserves records');
const beforeStale=shared.get(key);assert.equal(call(a,'saveCheckpoint',point(123,10)).reason,'stale');assert.equal(call(a,'finish',point(123,12)).reason,'stale');assert.equal(shared.get(key),beforeStale,'An old tab cannot replace a newer run');
assert(call(reload,'saveCheckpoint',point(456,5,24,80,'naginata')).ok);assert(call(reload,'finish',point(456,6,28,95,'naginata')).ok);assert.equal(reload.json('TowerStore.read().best.cleared'),8,'Lower later results never lower a record');
assert.equal(call(reload,'saveCheckpoint',point(456,4,24,80,'naginata')).reason,'invalid');assert.equal(call(reload,'saveCheckpoint',point(456,5,20,70,'naginata')).reason,'stale');
for(const weapon of ['swordShield','katana']){assert(call(reload,'start',{seed:99,weapon}).ok);assert(call(reload,'saveCheckpoint',point(99,5,30,70,weapon)).ok);}
for(const invalid of [null,[],{},point(0,5),point(-1,5),point(2**32,5),point(123,Infinity),point(123,-5),point(123,5,-1),point(123,5,4),point(123,5,30,-1),point(123,5,30,Infinity),point(123,5,30,1,'foxfireKatana'),{...point(123,5),hp:20}]){
 const prior=shared.get(key);assert(!call(reload,'finish',invalid).ok);assert.equal(shared.get(key),prior);
}
for(const raw of ['oops','null','[]','{}','{"schema":2,"checkpoint":null,"best":null,"last":null}',JSON.stringify({schema:1,checkpoint:point(4,3),best:point(4,3),last:null}),JSON.stringify({schema:1,checkpoint:point(4,10),best:point(4,5),last:null}),JSON.stringify({schema:1,checkpoint:null,best:null,last:point(4,5)})]){
 const disk=new Map([[key,raw]]),h=setup(disk);assert.equal(h.json('TowerStore.read().checkpoint'),null);const started=call(h,'start',{seed:3,weapon:'katana'});assert(started.ok&&!started.persisted);assert.equal(disk.get(key),raw,'Malformed/future data is preserved without a destructive reset');assert(call(h,'saveCheckpoint',point(3,5)).ok);assert(call(h,'finish',point(3,7)).ok);assert.equal(h.json('TowerStore.read().best.cleared'),7,'A blocked persisted record still allows an in-memory run');assert.equal(disk.get(key),raw);
}
for(const block of ['blockRead','blockWrite']){
 const h=setup(new Map(),{[block]:true});const started=call(h,'start',{seed:11,weapon:'swordShield'});assert(started.ok&&!started.persisted);assert.equal(started.reason,'storage');assert(call(h,'saveCheckpoint',point(11,5,25,60,'swordShield')).ok);assert(call(h,'finish',point(11,7,34,90,'swordShield')).ok);assert.equal(h.json('TowerStore.read().best.cleared'),7);assert.equal(h.run('TowerStore.available'),false);
}
// Best results merge before writing, including a newer result from another tab.
const tabs=new Map(),one=setup(tabs),two=setup(tabs);call(one,'start',{seed:7,weapon:'katana'});call(one,'saveCheckpoint',point(7,5));two.run('TowerStore.read()');call(one,'finish',point(7,12));call(two,'finish',point(7,8));assert.equal(two.json('TowerStore.read().best.cleared'),12);
const detached=one.json('TowerStore.read()');detached.best.cleared=0;assert.equal(one.json('TowerStore.read().best.cleared'),12,'Returned data cannot mutate the store');
const previous=setup(new Map([[key,JSON.stringify({schema:1,checkpoint:point(12,10),best:point(12,20),last:null})]]));
assert(call(previous,'finish',point(12,21)).ok);
assert.equal(previous.run('TowerStore.read().ranking'),undefined,'A continued old run cannot enter the new season');
assert(call(previous,'start',{seed:13,weapon:'katana'}).ok);
assert.equal(previous.run('TowerStore.read().ranking.best'),null);
assert(call(previous,'finish',point(13,4,16,50)).ok);
assert(call(previous,'finish',point(13,4,17,60)).ok);
assert.equal(previous.run('TowerStore.read().ranking.best.elapsed'),50,'The season uses the same time tiebreak as Supabase');
assert.equal(previous.run('TowerStore.read().best.cleared'),21,'The historical personal record is preserved');
for(const [name,value]of initial)assert.equal(shared.get(name),value);assert([...a.reads,...a.writes,...reload.reads,...reload.writes].every(name=>name===key),'Tower storage never touches adventure keys, preferences or profiles');
console.log('PASS: isolated tower fifth-floor checkpoints, reload/new-run records, strict bounded schema, stale-tab protection, monotonic best merging, future/corrupt preservation, storage failure memory fallback and untouched adventure storage.');
