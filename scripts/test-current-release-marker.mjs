import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {synchronizeEntry,synchronizeReleaseMarker} from './release-id.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const locales=JSON.parse(fs.readFileSync(path.join(root,'assets/i18n/locales.json'),'utf8'));
const release=JSON.parse(fs.readFileSync(path.join(root,'assets/config/release.json'),'utf8'));
const current=release.version,older='0.9.40_deadbeef',future='0.9.99_12345678';
const labels={hu:locales.hu.dict['menu.changelog.current'],en:locales.en.dict['menu.changelog.current']};
const cache='<link href="assets/css/style.css?v=0.9.1"><script src="assets/js/runtime.js?v=0.9.1"></script><summary class="menu-note">old badge</summary>';
const section=(version,marker='',extra='')=>'<section '+extra+'><h3>'+version+marker+'</h3><p>Preserve this historical text.</p></section>';
const panel=contents=>cache+'<article class="release-notes-panel" id="releaseNotesPanel">'+contents+'</article><aside>Unrelated page copy.</aside>';
const badge='<span class="release-current">'+labels.hu+'</span>';
const stale=panel(section(older,' '+badge)+section(current));
const markerSection=html=>[...html.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)].filter(match=>match[0].includes('class="release-current"'));
const versions=html=>[...html.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/g)].map(match=>match[1].replace(/<span\b[^>]*>[\s\S]*?<\/span>/g,'').trim());

for(const language of ['hu','en']){
 const result=synchronizeEntry(stale,current,locales[language].dict['menu.version'],labels[language]);
 assert.equal(markerSection(result).length,1,'Exactly one current marker');
 assert(markerSection(result)[0][0].includes(current),'Badge belongs to exact active full version');
 assert(result.includes('class="release-current">'+labels[language]+'</span>'));
 assert.deepEqual(versions(result),versions(stale),'Historical version IDs and heading text do not change');
 assert.equal(synchronizeEntry(result,current,locales[language].dict['menu.version'],labels[language]),result,'Build synchronization is idempotent');
 assert(result.endsWith('<aside>Unrelated page copy.</aside>'));
}
const multiple=panel(section(older,' <span data-old="yes" class="muted release-current">old</span>')+section(current,' '+badge)+section('0.9.38',' <span class=\'release-current\'>other</span>'));
assert.equal(markerSection(synchronizeReleaseMarker(multiple,current,labels.hu)).length,1,'All historical duplicate markers removed regardless of class order or quotes');
const next=panel(section(current,' '+badge)+section(future));
assert(markerSection(synchronizeReleaseMarker(next,future,labels.en))[0][0].includes(future),'A later build automatically moves the badge');
for(const collision of [current+'_extra',current.split('_')[0],current.replace(/^0\./,'10.')]){
 const withCollision=panel(section(collision)+section(current));
 assert.equal(markerSection(synchronizeReleaseMarker(withCollision,current,labels.hu))[0][0].match(/<h3>([^ <]+)/)[1],current,'Full IDs cannot match prefixes or another patch');
}
const decorated=panel('<section><h3><em>'+current+'</em> · Existing heading</h3></section>');
assert(synchronizeReleaseMarker(decorated,current,labels.en).includes('<em>'+current+'</em> · Existing heading <span'));
assert.throws(()=>synchronizeReleaseMarker(panel(section(older)),current,labels.hu),/exactly one changelog section.*found 0/);
assert.throws(()=>synchronizeEntry(panel(section(older)),current,'V{0}',labels.hu),/exactly one changelog section/);
assert.throws(()=>synchronizeReleaseMarker(panel(section(current)+section(current)),current,labels.hu),/found 2/);
assert.throws(()=>synchronizeReleaseMarker(panel(section(current))+panel(section(current)),current,labels.hu),/exactly one releaseNotesPanel/);
assert.throws(()=>synchronizeReleaseMarker(stale,current,''),/current release marker/);
assert.equal(synchronizeEntry(cache,current,'V{0}').split(current).length-1,3,'Legacy minimal build fixtures remain supported without a changelog');
assert(synchronizeReleaseMarker(panel(section('0.9.1')),'0.9.1',labels.hu).includes('0.9.1 <span'),'Historical plain IDs remain valid');

// Prove the actual build --check path detects a stale marker even when all
// runtime/cache IDs are current. This fixture never edits the real checkout.
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'kiba-current-release-'));
try{
 for(const dir of ['scripts','docs','assets/config','assets/i18n','assets/js'])fs.mkdirSync(path.join(fixture,dir),{recursive:true});
 for(const file of ['scripts/build-game.mjs','scripts/release-id.mjs','docs/releases.json','assets/config/release.json','assets/config/keybindings.json','assets/i18n/locales.json'])fs.copyFileSync(path.join(root,file),path.join(fixture,file));
 const build=fs.readFileSync(path.join(root,'scripts/build-game.mjs'),'utf8');
 const modules=JSON.parse(build.match(/const files=(\[[^\]]+\]);/)[1].replaceAll("'",'"'));
 for(const name of modules)fs.writeFileSync(path.join(fixture,'assets/js',name+'.js'),'// build fixture\n');
 const index=path.join(fixture,'index.html');fs.writeFileSync(index,stale);
 const run=(args=[],ok=true)=>{const result=spawnSync(process.execPath,[path.join(fixture,'scripts/build-game.mjs'),...args],{cwd:fixture,encoding:'utf8'});if(ok)assert.equal(result.status,0,result.stderr||result.stdout);else assert.notEqual(result.status,0);return result;};
 run();run(['--check']);const built=fs.readFileSync(index,'utf8');
 assert(markerSection(built)[0][0].includes(current));
 const misplaced=built.replace(/\s*<span class="release-current">[^<]*<\/span>/,'').replace('<h3>'+older+'</h3>','<h3>'+older+' '+badge+'</h3>');
 fs.writeFileSync(index,misplaced);const staleCheck=run(['--check'],false);assert.match(staleCheck.stderr,/index\.html.*out of date/);
 assert.equal(fs.readFileSync(index,'utf8'),misplaced,'Check mode must not repair silently');
 run();run(['--check']);assert.equal(fs.readFileSync(index,'utf8'),built);
 fs.writeFileSync(index,panel(section(older)));const missing=run(['--check'],false);assert.match(missing.stderr,/exactly one changelog section/);
}finally{
 const resolved=path.resolve(fixture);assert.equal(path.dirname(resolved),path.resolve(os.tmpdir()));assert(path.basename(resolved).startsWith('kiba-current-release-'));
 fs.rmSync(resolved,{recursive:true,force:true});
}
console.log('PASS: exact full-version current-release markers, HU/EN labels, duplicate cleanup, future builds, prefix isolation, immutable history, idempotence and actual build --check rejection of stale or missing release sections.');
