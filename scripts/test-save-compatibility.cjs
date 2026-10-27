'use strict';
const assert=require('node:assert/strict'),{webcrypto}=require('node:crypto'),{storageEnvironment,client,fixture}=require('./test-save-release.cjs');
const anchor='0.9.51_2d78d59b',first='0.9.52_1234abcd',next='0.9.53_2345bcde',breaking='0.9.54_3456cdef';
const options={policy:'preserve-compatible',compatibility:anchor},plain=v=>JSON.parse(JSON.stringify(v));
const capture=env=>({profile:env.records.get('profile'),sealed:env.records.get('save')});
async function seed(env,release=anchor,crypto){const old=client(env,release,{...(crypto?{crypto}:{}),locks:false});await old.vault.ready;const data=fixture(release);data.coins=137;data.progression={level:3,totalXp:155,xp:0,points:2,stats:{vitality:0,strength:0,spirit:0}};await old.vault.write(data);return {old,data};}
(async()=>{
 const env=storageEnvironment(),{old,data}=await seed(env),baseline=capture(env);
 env.local.set('momo-language','en');env.local.set('momo-keybindings-v1','custom');
 const upgraded=client(env,first,options);assert.deepEqual(plain(await upgraded.vault.ready),{...data,release:first});const one=capture(env);
 assert.equal(one.profile.device,baseline.profile.device);assert.equal(one.profile.compatibility,anchor);assert.equal(one.profile.revision,baseline.profile.revision+1);assert.equal(one.profile.key.extractable,false);assert.equal(upgraded.vault.notice,'');
 assert(one.sealed.startsWith('MOMO2.'));const envelope=JSON.parse(atob(one.sealed.slice(6)));assert.equal(envelope.release,first);assert.equal(Object.hasOwn(envelope,'progression'),false);assert.equal(typeof envelope.data,'string','Only authenticated ciphertext is stored in the envelope');
 assert.deepEqual(plain(await client(env,first,options).vault.ready),{...data,release:first});
 await assert.rejects(old.vault.write(data));assert.equal(env.records.get('save'),one.sealed,'Old tab cannot overwrite upgraded ciphertext');
 const future=client(env,next,options);assert.deepEqual(plain(await future.vault.ready),{...data,release:next});await assert.rejects(upgraded.vault.write({...data,release:first}));
 const reset=client(env,breaking,{...options,compatibility:breaking});assert.equal(await reset.vault.ready,null);assert.equal(reset.vault.notice,'text.save.reset.new.version');const resetState=capture(env);assert.notEqual(resetState.profile.device,baseline.profile.device);assert.equal(resetState.profile.compatibility,breaking);
 assert.equal(env.local.get('momo-language'),'en');assert.equal(env.local.get('momo-keybindings-v1'),'custom');
 const backwards=client(env,first,options);assert.equal(await backwards.vault.ready,null);assert.equal(backwards.vault.notice,'text.save.newer.version');assert.equal(env.records.get('profile').device,resetState.profile.device);
 const older=storageEnvironment();await seed(older,'0.9.50_62518b15');const rejectOld=client(older,first,options);assert.equal(await rejectOld.vault.ready,null);assert.equal(rejectOld.vault.notice,'text.save.reset.new.version','Unstamped earlier epochs are never resurrected');
 const concurrent=storageEnvironment(),s=await seed(concurrent);const [a,b]=[client(concurrent,first,{...options,locks:false}),client(concurrent,first,{...options,locks:false})];assert.deepEqual(plain(await a.vault.ready),{...s.data,release:first});assert.deepEqual(plain(await b.vault.ready),{...s.data,release:first});assert.equal(concurrent.records.get('profile').revision,2,'Two no-lock migrators commit only one upgrade');
 const corrupt=storageEnvironment();await seed(corrupt);corrupt.records.set('save','MOMO2.'+btoa('broken'));const damaged=capture(corrupt),failed=client(corrupt,first,options);assert.equal(await failed.vault.ready,null);assert.equal(failed.vault.isReady,false);assert.equal(corrupt.records.get('save'),damaged.sealed);assert.equal(corrupt.records.get('profile').release,anchor,'Corruption never falls back to destructive reset');
 const encryptedFailure=storageEnvironment();await seed(encryptedFailure);const original=capture(encryptedFailure),badCrypto={getRandomValues:array=>webcrypto.getRandomValues(array),subtle:new Proxy(webcrypto.subtle,{get(target,key){return key==='encrypt'?async()=>{throw Error('synthetic crypto failure');}:typeof target[key]==='function'?target[key].bind(target):target[key];}})};
 const cannotSeal=client(encryptedFailure,first,{...options,crypto:badCrypto});assert.equal(await cannotSeal.vault.ready,null);assert.equal(encryptedFailure.records.get('save'),original.sealed);assert.equal(encryptedFailure.records.get('profile').release,anchor);
 // An old write already encrypting cannot commit after a compatible upgrade.
 let hold=false,started,release;const entered=new Promise(resolve=>started=resolve),gate=new Promise(resolve=>release=resolve);
 const delayed={getRandomValues:array=>webcrypto.getRandomValues(array),subtle:new Proxy(webcrypto.subtle,{get(target,key){if(key==='encrypt')return async(...args)=>{if(hold){started();await gate;}return target.encrypt(...args);};return typeof target[key]==='function'?target[key].bind(target):target[key];}})};
 const racing=storageEnvironment(),r=await seed(racing,anchor,delayed);hold=true;const write=r.old.vault.write({...r.data,coins:999}).then(()=>false,()=>true);await entered;
 const newTab=client(racing,first,{...options,locks:false});assert.equal((await newTab.vault.ready).coins,137);const committed=racing.records.get('save');release();assert(await write);assert.equal(racing.records.get('save'),committed);
 console.log('PASS: authenticated compatible upgrades, bounded no-lock races, source key/device retention, next-release/current reload, explicit epoch reset, legacy anchor, stale and in-flight tab guards, crypto/corruption atomicity and preferences.');
})().catch(error=>{console.error(error);process.exitCode=1;});
