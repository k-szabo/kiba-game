import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import {createHash} from 'node:crypto';

const root=fileURLToPath(new URL('../',import.meta.url));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const refs=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(r=>!/^https?:/.test(r));
const game=fs.readFileSync(path.join(root,'assets/js/game.js'),'utf8');
const sprite=game.match(/sheet\.src\s*=\s*['"]([^'"]+)['"]/);
assert(sprite,'Momo sprite reference is missing.');
refs.push(sprite[1]);
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

const sourceFiles=['assets/js/i18n.js','assets/js/levels.js','assets/js/art-data.js','assets/js/save-vault.js','assets/js/graphics.js','assets/js/progression.js','assets/js/combat.js','assets/js/game.js'];
for(const file of [...sourceFiles,'assets/js/runtime.js']){
  const result=spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr||`JavaScript syntax check failed: ${file}`);
}
const digest=createHash('sha256');for(const file of ['assets/i18n/en.json',...sourceFiles]){digest.update(file);digest.update('\0');digest.update(fs.readFileSync(path.join(root,file)));digest.update('\0');}
const runtime=fs.readFileSync(path.join(root,'assets/js/runtime.js'),'utf8');
assert(runtime.startsWith(`/* Generated from assets/js sources by scripts/build-game.mjs; source-sha256: ${digest.digest('hex')} */`),'runtime.js is stale; rebuild before publishing.');
assert(!runtime.includes('window.momo='),'Production runtime must not expose mutable game state.');
const english=JSON.parse(fs.readFileSync(path.join(root,'assets/i18n/en.json'),'utf8'));assert(Object.keys(english).length>250,'English locale is incomplete.');
const png=fs.readFileSync(path.join(root,sprite[1]));
assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Momo must be a valid PNG.');
assert.equal(png.readUInt32BE(16),1536);assert.equal(png.readUInt32BE(20),2288);
assert(fs.existsSync(path.join(root,'.nojekyll')));
assert(fs.existsSync(path.join(root,'.github/workflows/pages.yml')));
console.log('PASS: static entrypoint, all assets, Linux filename case, root and repository-subpath URLs, JavaScript syntax, current private runtime, English locale, Momo sprite dimensions.');
