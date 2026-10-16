import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {makeBugfix,prepareBugfix,validateRegistry,validateRelease,synchronizeEntry,bugfixHistory} from './release-id.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const release={version:'0.9.10',savePolicy:'reset-on-version-change'},empty={schemaVersion:1,bugfixes:[]};
const metadata={baseVersion:'0.9.10',slug:'inventory-icon-contrast',summary:{hu:'Olvashatóbb tárgyikonok',en:'Readable item icons'},fixes:[{hu:'A sötét ikonok kontrasztja javult.',en:'Improved dark item icon contrast.'}]};
const entry=makeBugfix(metadata);
assert.match(entry.version,/^0\.9\.10_[a-f0-9]{8}$/);
assert.deepEqual(makeBugfix({fixes:metadata.fixes,summary:{en:metadata.summary.en,hu:metadata.summary.hu},slug:metadata.slug,baseVersion:metadata.baseVersion}),entry,'JSON property order must not change identity');
assert.deepEqual(makeBugfix({...metadata,summary:{hu:' '+metadata.summary.hu+' ',en:metadata.summary.en}}),entry,'Whitespace normalization is stable');
assert.notEqual(makeBugfix({...metadata,fixes:[{...metadata.fixes[0],en:'A different actual fix.'}]}).code,entry.code,'Changed fixes must produce a new identity');
assert.throws(()=>makeBugfix({...metadata,fixes:[]}),/fix/i);
assert.throws(()=>makeBugfix({...metadata,summary:{hu:'Csak magyar'}}),/fields/);
assert.throws(()=>makeBugfix({...metadata,extra:'ignored?'}),/fields/);
assert.throws(()=>makeBugfix({...metadata,baseVersion:'0.9.10_abcd1234'}),/baseVersion/);
const proposal=prepareBugfix(metadata,release,empty);
assert.equal(empty.bugfixes.length,0,'Preparing/dry-running must not mutate the registry');
assert.equal(proposal.release.version,entry.version);
assert.equal(proposal.registry.bugfixes.length,1);
assert.deepEqual(bugfixHistory(proposal.registry),{'0.9.10':[entry.code]});
assert.equal(prepareBugfix(metadata,proposal.release,proposal.registry).unchanged,true);
assert.throws(()=>prepareBugfix(metadata,release,proposal.registry),/already published/);
assert.throws(()=>prepareBugfix({...metadata,baseVersion:'0.9.11'},release,empty),/current release base/);
assert.throws(()=>validateRegistry({schemaVersion:1,bugfixes:[entry,entry]}),/collision|duplicate/i);
assert.throws(()=>validateRegistry({schemaVersion:1,bugfixes:[{...entry,summary:{hu:'Átírva',en:'Tampered'}}]}),/hash mismatch/);
assert.throws(()=>validateRelease({...release,version:entry.version},empty),/Unregistered/);
for(const version of ['0.9.10_ABCDEF12','0.9.10_abc','00.9.10','0.9.10_123456789','0.9.10_abcdefgh_more'])assert.throws(()=>validateRelease({...release,version},empty),/Invalid/);

// Real SHA-256/32-bit collision fixtures: neither entry may overwrite the other.
const collisionMetadata=i=>({baseVersion:'0.9.10',slug:`collision-${i}`,summary:{hu:'Javítás',en:'Fix'},fixes:[{hu:'Ellenőrzés',en:'Check'}]});
const collisionA=makeBugfix(collisionMetadata(16434)),collisionB=makeBugfix(collisionMetadata(70374));
assert.equal(collisionA.code,'3bfa0bda');assert.equal(collisionA.code,collisionB.code);
assert.throws(()=>prepareBugfix(collisionMetadata(70374),release,{schemaVersion:1,bugfixes:[collisionA]}),/code collision/i);

const html='<link href="assets/css/style.css?v=0.9.9"><script src="assets/js/runtime.js?v=0.9.9_deadbeef"></script><summary class="menu-note">régi</summary>';
const next=synchronizeEntry(html,entry.version,'V{0} · KIADÁS');
assert.equal(next.split(entry.version).length-1,3);
assert.equal(synchronizeEntry(next,entry.version,'V{0} · KIADÁS'),next,'Rebuilds must not append the suffix twice');
assert.ok(!next.includes('_deadbeef'));

// Exercise the actual CLI/build against an isolated miniature project. Never
// rewrite this checkout's release, index, registry or generated runtime.
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'kiba-release-ids-'));
try{
  for(const dir of ['scripts','docs','assets/config','assets/i18n','assets/js'])fs.mkdirSync(path.join(fixture,dir),{recursive:true});
  for(const file of ['scripts/build-game.mjs','scripts/release-id.mjs','scripts/release.mjs','assets/i18n/locales.json','assets/config/keybindings.json','assets/config/dev-tools.json'])fs.copyFileSync(path.join(root,file),path.join(fixture,file));
  const write=(file,value)=>fs.writeFileSync(path.join(fixture,file),JSON.stringify(value,null,2)+'\n');
  write('assets/config/release.json',release);write('docs/releases.json',empty);write('metadata.json',metadata);
  fs.writeFileSync(path.join(fixture,'index.html'),html);
  for(const module of ['i18n','keybindings','levels','art-data','boss-vfx','save-vault','graphics','progression','combat','shadow-animation','prologue','inventory','bug-report','dev-tools','game'])fs.writeFileSync(path.join(fixture,`assets/js/${module}.js`),`// ${module} fixture\n`);
  const run=(script,args=[],ok=true)=>{
    const result=spawnSync(process.execPath,[path.join(fixture,'scripts',script),...args],{cwd:fixture,encoding:'utf8'});
    if(ok)assert.equal(result.status,0,result.stderr||result.stdout);
    else assert.notEqual(result.status,0,result.stdout);
    return result;
  };
  run('build-game.mjs');run('build-game.mjs',['--check']);
  const dry=run('release.mjs',['bugfix','--metadata','metadata.json']);assert.match(dry.stdout,/DRY RUN/);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(fixture,'assets/config/release.json'))),release);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(fixture,'docs/releases.json'))),empty);
  run('release.mjs',['bugfix','--metadata','metadata.json','--write']);
  const registered=fs.readFileSync(path.join(fixture,'docs/releases.json'),'utf8');
  assert.deepEqual(JSON.parse(registered).bugfixes,[entry]);
  run('release.mjs',['validate']);
  for(const lookup of [entry.code,entry.version])assert.deepEqual(JSON.parse(run('release.mjs',['lookup',lookup]).stdout),entry);
  run('release.mjs',['lookup','00000000'],false);
  run('release.mjs',['bugfix','--metadata','metadata.json','--write']);
  assert.equal(fs.readFileSync(path.join(fixture,'docs/releases.json'),'utf8'),registered,'Repeated invocation must not duplicate history');
  run('build-game.mjs',['--check'],false);run('build-game.mjs');run('build-game.mjs',['--check']);
  const built=fs.readFileSync(path.join(fixture,'assets/js/runtime.js'),'utf8');
  assert.ok(built.includes(`"version":"${entry.version}"`));
  assert.ok(built.includes(`"bugfixHistory":{"0.9.10":["${entry.code}"]}`));
  const served=fs.readFileSync(path.join(fixture,'index.html'),'utf8');
  assert.equal((served.match(new RegExp(entry.version.replaceAll('.','\\.'),'g'))||[]).length,3);
  run('build-game.mjs');assert.equal(fs.readFileSync(path.join(fixture,'index.html'),'utf8'),served);
  const second=makeBugfix({...metadata,slug:'inventory-focus-ring'});
  write('docs/releases.json',{schemaVersion:1,bugfixes:[entry,second]});
  run('build-game.mjs',['--check'],false);run('build-game.mjs');run('build-game.mjs',['--check']);
  assert.ok(fs.readFileSync(path.join(fixture,'assets/js/runtime.js'),'utf8').includes(`"bugfixHistory":{"0.9.10":["${entry.code}","${second.code}"]}`),'Append order, not hash order, establishes published revision order');
  write('docs/releases.json',empty);run('build-game.mjs',[],false);
}finally{
  const resolved=path.resolve(fixture),temp=path.resolve(os.tmpdir());
  assert.equal(path.dirname(resolved),temp);assert.ok(path.basename(resolved).startsWith('kiba-release-ids-'));
  fs.rmSync(resolved,{recursive:true,force:true});
}
console.log('PASS: deterministic release IDs, true hash collisions, registry integrity, dry-run/write/lookup CLI, plain and suffixed builds, idempotent cache markers.');
