import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

const root=fileURLToPath(new URL('../',import.meta.url));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const refs=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(r=>!/^https?:/.test(r));
const game=fs.readFileSync(path.join(root,'assets/js/game.js'),'utf8');
const sprite=game.match(/sheet\.src\s*=\s*['"]([^'"]+)['"]/);
assert(sprite,'Momo sprite reference is missing.');
refs.push(sprite[1]);
refs.push('assets/config/keybindings.json');
const menuSprite=game.match(/menuSheet\.src\s*=\s*['"]([^'"]+)['"]/);
assert(menuSprite,'Menu idle sprite reference is missing.');
refs.push(menuSprite[1]);
const artFile=path.join(root,'assets/js/art-data.js');
const manifest=vm.runInNewContext(fs.readFileSync(artFile,'utf8')+'\nART_MANIFEST');
refs.push(...Object.values(manifest));

for(const ref of refs){
  assert(!ref.startsWith('/'),`A root-relative URL would break project Pages: ${ref}`);
  assert(!ref.includes('..'),`Unexpected parent-relative asset URL: ${ref}`);
  for(const base of ['https://example.github.io/','https://example.github.io/kiba-game/']){
    const resolved=new URL(ref,new URL('index.html',base));
    assert(resolved.href.startsWith(base),`Asset leaves the site prefix: ${ref}`);
  }
  // Linux hosting is case-sensitive, even when local Windows paths are not.
  let directory=root;
  const assetPath=new URL(ref,'https://example.github.io/').pathname.slice(1);
  for(const segment of assetPath.split('/')){
    assert(fs.readdirSync(directory).includes(segment),`Missing asset or wrong case: ${ref}`);
    directory=path.join(directory,segment);
  }
  assert(fs.statSync(directory).isFile(),`Expected a static file: ${ref}`);
}

const sourceFiles=['assets/js/i18n.js','assets/js/keybindings.js','assets/js/levels.js','assets/js/art-data.js','assets/js/boss-vfx.js','assets/js/save-vault.js','assets/js/graphics.js','assets/js/progression.js','assets/js/combat.js','assets/js/shadow-animation.js','assets/js/prologue.js','assets/js/game.js'];
for(const file of [...sourceFiles,'assets/js/runtime.js']){
  const result=spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr||`JavaScript syntax check failed: ${file}`);
}
const runtime=fs.readFileSync(path.join(root,'assets/js/runtime.js'),'utf8');
const buildCheck=spawnSync(process.execPath,[path.join(root,'scripts/build-game.mjs'),'--check'],{encoding:'utf8'});
assert.equal(buildCheck.status,0,buildCheck.stderr||buildCheck.stdout||'runtime.js is stale; rebuild before publishing.');
assert(!runtime.includes('window.momo='),'Production runtime must not expose mutable game state.');
const locales=JSON.parse(fs.readFileSync(path.join(root,'assets/i18n/locales.json'),'utf8'));
assert(locales.hu?.dict&&locales.en?.dict,'Both hu and en locale dictionaries are required.');
const ids=Object.keys(locales.hu.dict);assert(ids.length>250,'Locale catalog is incomplete.');
for(const [language,record] of Object.entries(locales)){
  assert(/^[a-z]{2}$/.test(language),`Invalid ISO language: ${language}`);
  assert(record.flag?.startsWith('data:image/svg+xml;base64,'),`SVG flag is missing: ${language}`);
  assert(Buffer.from(record.flag.split(',')[1],'base64').toString('utf8').includes('<svg'),`Invalid SVG flag: ${language}`);
  assert(record.lang_en?.trim()&&record.lang_orig?.trim(),`Language names are missing: ${language}`);
  const translations=record.dict;assert(translations&&typeof translations==='object'&&!Array.isArray(translations),`Dictionary missing: ${language}`);
  assert.equal(Object.keys(translations).length,ids.length,`Missing locale keys: ${language}`);
  for(const id of ids){
    assert.equal(typeof translations[id],'string',`Missing translation: ${language}.${id}`);
    const placeholders=value=>[...value.matchAll(/\{(\d+)\}/g)].map(match=>match[1]).sort().join(',');
    assert.equal(placeholders(translations[id]),placeholders(locales.hu.dict[id]),`Placeholder mismatch: ${language}.${id}`);
  }
}
const png=fs.readFileSync(path.join(root,sprite[1]));
assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Momo must be a valid PNG.');
assert.equal(png.readUInt32BE(16),1536);assert.equal(png.readUInt32BE(20),2288);
const menuPng=fs.readFileSync(path.join(root,menuSprite[1]));
assert.equal(menuPng.subarray(0,8).toString('hex'),'89504e470d0a1a0a','The menu idle sheet must be a PNG.');
assert.equal(menuPng.readUInt32BE(16),1536);assert.equal(menuPng.readUInt32BE(20),1024);
assert(fs.existsSync(path.join(root,'.nojekyll')));
assert(fs.existsSync(path.join(root,'.github/workflows/pages.yml')));
console.log('PASS: static entrypoint, all assets, Linux filename case, root and repository-subpath URLs, JavaScript syntax, current private runtime, complete locales, Momo sprite dimensions.');
