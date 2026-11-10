'use strict';
// Real WebCrypto with synthetic, serialized IndexedDB transactions. Browser
// download/upload and actual IndexedDB are separate integration coverage.
const assert=require('node:assert/strict');
const {storageEnvironment,client,fixture}=require('./test-save-release.cjs');
const current=JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname,'../assets/config/release.json'),'utf8')).version;
const options={policy:'preserve-compatible',compatibility:current};
const plain=value=>JSON.parse(JSON.stringify(value));
const capture=env=>plain([...env.records].filter(([key])=>key!=='profile'));
(async()=>{
 const env=storageEnvironment(),a=client(env,current,options);await a.vault.ready;
 const original={...fixture(),shards:19};await a.vault.write(original);
 // Simulate the shipped single-save format, retaining its genuine ciphertext.
 const profile=env.records.get('profile');delete profile.slotSchema;delete profile.activeSlot;delete profile.selection;env.records.delete('slots');
 const legacyCipher=env.records.get('save'),legacyDevice=profile.device;
 const migrated=client(env,current,options);assert.deepEqual(plain(await migrated.vault.ready),original);
 assert.equal(env.records.get('slots')[0].sealed,legacyCipher);assert.equal(env.records.get('profile').device,legacyDevice);assert.equal(env.records.get('profile').key.extractable,false);
 assert.deepEqual(plain((await migrated.vault.listSlots()).map(({slot,occupied})=>({slot,occupied}))),[{slot:1,occupied:true},{slot:2,occupied:false},{slot:3,occupied:false}]);
 assert.equal(await migrated.vault.selectSlot(2),null);assert.equal(migrated.vault.activeSlot,2);
 const second={...fixture(),shards:27};await migrated.vault.write(second);
 assert.deepEqual(plain(await client(env,current,options).vault.ready),second);
 assert.deepEqual(plain(await migrated.vault.selectSlot(1)),original);
 await assert.rejects(a.vault.write({...original,shards:999}),/slot changed/i,'A tab opened before a slot switch cannot write another adventure');
 const slots=await migrated.vault.listSlots();slots[0].snapshot.shards=999;assert.equal((await migrated.vault.listSlots())[0].snapshot.shards,19,'Snapshots are detached copies');
 const text=await migrated.vault.exportSlot(2),file=JSON.parse(text);
 assert.equal(file.format,'kiba-realms-save');assert.equal(file.snapshot.shards,27);assert(!text.includes('device'));assert(!text.includes('ciphertext'));assert(!Object.hasOwn(file,'key'));
 const target=storageEnvironment(),b=client(target,current,options);await b.vault.ready;
 await b.vault.importSlot(3,text);assert.equal(b.vault.activeSlot,1);assert.equal(target.records.has('save'),false,'Importing inactive slot keeps the active adventure untouched');
 assert.deepEqual(plain(await b.vault.selectSlot(3)),second);assert.notEqual(target.records.get('save'),legacyCipher);assert.equal(target.records.get('profile').key.extractable,false);
 assert.deepEqual(plain(await client(target,current,options).vault.ready),second,'Cross-profile import re-encrypts and survives reload');
 const stale=client(target,current,options);await stale.vault.ready;
 await b.vault.importSlot(3,text);
 const importedCipher=target.records.get('save');await assert.rejects(stale.vault.write({...second,shards:999}),/slot changed/i,'Replacing the active slot invalidates another tab even when its slot number is unchanged');
 for(const operation of [()=>stale.vault.listSlots(),()=>stale.vault.exportSlot(3)])await assert.rejects(operation(),error=>error.code==='stale_slot','Read-only UI APIs expose a stale selection explicitly');
 assert.equal(target.records.get('save'),importedCipher);await b.vault.write(second);
 for(const bad of ['{',text+'x',' '.repeat(30001),JSON.stringify({...file,format:'other'}),JSON.stringify({...file,version:2}),JSON.stringify({...file,compatibility:'0.0.1'}),JSON.stringify({...file,release:'999.0.0',snapshot:{...file.snapshot,release:'999.0.0'}}),JSON.stringify({...file,snapshot:{...file.snapshot,weaponStyle:'invented'}}),JSON.stringify({...file,extra:true})]){
  const before=capture(target);assert.throws(()=>b.vault.importSlot(3,bad));assert.deepEqual(capture(target),before,'Invalid import cannot replace any slot');
 }
 for(const slot of [0,4,1.5,'1',null])for(const action of ['selectSlot','exportSlot','importSlot'])assert.throws(()=>b.vault[action](slot,text));
 await assert.rejects(migrated.vault.exportSlot(3),/Empty/);
 // A queued write belongs to its original selected slot, never to the switch.
 const pending=migrated.vault.write({...original,shards:31});const switched=migrated.vault.selectSlot(2);await pending;assert.equal((await switched).shards,27);assert.equal((await migrated.vault.listSlots())[0].snapshot.shards,31);
 const next='99.0.0_1234abcd',upgrade=client(env,next,options);await upgrade.vault.ready;
 const upgradedSlots=await upgrade.vault.listSlots();assert.deepEqual(plain(upgradedSlots.map(v=>v.snapshot?.shards??null)),[31,27,null]);assert(upgradedSlots.filter(v=>v.occupied).every(v=>v.snapshot.release===next));
 await assert.rejects(migrated.vault.write(second),/another game release/);
 const reset=client(env,'100.0.0_2345bcde',{policy:'preserve-compatible',compatibility:'100.0.0_2345bcde'});await reset.vault.ready;
 assert((await reset.vault.listSlots()).every(v=>!v.occupied),'Explicit epoch reset clears all slots together');
 console.log('PASS three encrypted save slots, legacy migration, portable cross-profile roundtrip, reload, detached metadata, strict atomic import rejection, slot isolation, stale tabs, compatible all-slot upgrade and epoch reset.');
})().catch(error=>{console.error(error);process.exitCode=1;});
