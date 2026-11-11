// Fast structural validation; full pixel-derived freshness uses export-colormaps.py --check.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const directory=path.join(root,'assets/config');
const index=JSON.parse(fs.readFileSync(path.join(directory,'colormaps.json'),'utf8'));
assert.equal(index.schemaVersion,2);
assert.equal(index.dataSchemaVersion,1);
const sections=['pc','npcs','objects','paletteGroups','assets','codeColors'];
const data=Object.fromEntries(sections.map(key=>[key,{}]));
const names=new Set();
for(const part of index.parts){
 assert(/^colormaps\/[a-z-]+\.json$/.test(part.file),`Unsafe part path: ${part.file}`);
 assert(!names.has(part.file),`Duplicate part: ${part.file}`);names.add(part.file);
 const bytes=fs.readFileSync(path.join(directory,part.file));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),part.sha256,`Stale checksum: ${part.file}`);
 const record=JSON.parse(bytes);
 assert.deepEqual(Object.keys(record),Object.keys(part.counts));
 for(const [section,values] of Object.entries(record)){
  assert(sections.includes(section),`Unknown section: ${section}`);
  assert.equal(Object.keys(values).length,part.counts[section]);
  for(const [key,value] of Object.entries(values)){
   assert(!Object.hasOwn(data[section],key),`Duplicate ${section}: ${key}`);
   data[section][key]=value;
  }
 }
}
assert.deepEqual([...names].sort(),fs.readdirSync(path.join(directory,'colormaps')).filter(name=>name.endsWith('.json')).map(name=>'colormaps/'+name).sort());
for(const section of sections)assert.equal(Object.keys(data[section]).length,index.counts[section]);
function refs(value){
 if(!value||typeof value!=='object')return;
 for(const [key,child] of Object.entries(value)){
  if(key==='paletteGroup'||key==='paletteRef')assert(Object.hasOwn(data.paletteGroups,child),`Missing palette: ${child}`);
  else if(key==='asset')assert(Object.hasOwn(data.assets,child),`Missing asset: ${child}`);
  else refs(child);
 }
}
refs(data.pc);refs(data.npcs);refs(data.objects);
for(const id of ['jailer','sentinel','wasp','pilot','seal','dragon'])assert(Object.hasOwn(data.npcs,'watchtower.'+id),'Missing watchtower actor: '+id);
for(const [key,group] of Object.entries(data.paletteGroups))assert(Object.hasOwn(data.assets,group.source),`Missing source: ${key}`);
function rasterAssets(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?rasterAssets(path.join(dir,entry.name)):/\.(?:png|webp)$/.test(entry.name)?[path.relative(root,path.join(dir,entry.name)).replaceAll('\\','/')]:[]);}
assert.deepEqual(Object.keys(data.assets).sort(),rasterAssets(path.join(root,'assets')).sort(),'Incomplete raster inventory');
for(const [file,record] of Object.entries(data.assets))assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),record.sha256,`Changed image: ${file}`);
for(const file of Object.keys(data.codeColors))assert(fs.existsSync(path.join(root,file)),`Removed code source: ${file}`);
assert(Object.hasOwn(JSON.parse(fs.readFileSync(path.join(directory,'colormaps/japan.json'))).npcs,'japan.guard'));
assert(Object.hasOwn(JSON.parse(fs.readFileSync(path.join(directory,'colormaps/shadow-den.json'))).npcs,'kitsune.fia'));
console.log(`PASS: ${names.size} colormap parts, unique records, checksums, references and complete raster inventory.`);
