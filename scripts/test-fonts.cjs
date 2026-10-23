const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const css=read('assets/css/style.css'),html=read('index.html');
const manifest=JSON.parse(read('assets/fonts/manifest.json'));
const locales=JSON.parse(read('assets/i18n/locales.json'));
const modules=fs.readdirSync(path.join(root,'assets/js')).filter(file=>file.endsWith('.js')&&file!=='runtime.js');
const sources=modules.map(file=>read('assets/js/'+file));
const expected=[...[400,500,600,700,800].map(weight=>({family:'Noto Sans',alias:'Kiba UI',stem:'noto-sans',weight})),...[400,500,600,700].flatMap(weight=>[{family:'Noto Serif JP',alias:'Kiba Story',stem:'noto-serif-jp',weight},{family:'Noto Serif',alias:'Kiba Story Latin',stem:'noto-serif',weight}])];

// Read the shipped binary's Unicode cmap, rather than trusting a subset request or
// FontFaceSet.check (which also succeeds when a browser can fall back).
function fontInfo(buffer){
 assert.equal(buffer.readUInt32BE(0),0x00010000,'A TrueType sfnt is shipped, not an HTML download error');
 const tables=new Map();
 for(let i=0;i<buffer.readUInt16BE(4);i++){
  const entry=12+i*16,tag=buffer.toString('ascii',entry,entry+4),offset=buffer.readUInt32BE(entry+8),length=buffer.readUInt32BE(entry+12);
  assert(offset+length<=buffer.length,`${tag} table fits the font file`);
  tables.set(tag,offset);
 }
 for(const tag of ['cmap','maxp','OS/2'])assert(tables.has(tag),`${tag} exists`);
 const cmap=tables.get('cmap'),subtables=[];
 for(let i=0;i<buffer.readUInt16BE(cmap+2);i++){
  const entry=cmap+4+i*8,platform=buffer.readUInt16BE(entry),encoding=buffer.readUInt16BE(entry+2);
  if(platform===0||(platform===3&&(encoding===1||encoding===10))){
   const offset=cmap+buffer.readUInt32BE(entry+4),format=buffer.readUInt16BE(offset);
   if(format===4||format===12)subtables.push({offset,format});
  }
 }
 assert(subtables.length,'Unicode cmap format 4 or 12 exists');
 const count=buffer.readUInt16BE(tables.get('maxp')+4);
 const glyph=code=>{
  for(const {offset,format} of subtables){
   if(format===12){
    const groups=buffer.readUInt32BE(offset+12);
    for(let i=0;i<groups;i++){
     const group=offset+16+i*12,start=buffer.readUInt32BE(group),end=buffer.readUInt32BE(group+4);
     if(code>=start&&code<=end)return buffer.readUInt32BE(group+8)+code-start;
    }
   }else if(code<=0xffff){
    const segments=buffer.readUInt16BE(offset+6)/2,endCodes=offset+14,startCodes=endCodes+segments*2+2,deltas=startCodes+segments*2,ranges=deltas+segments*2;
    for(let i=0;i<segments;i++){
     if(code<buffer.readUInt16BE(startCodes+i*2)||code>buffer.readUInt16BE(endCodes+i*2))continue;
     const delta=buffer.readInt16BE(deltas+i*2),range=buffer.readUInt16BE(ranges+i*2);
     if(!range)return(code+delta)&0xffff;
     const index=ranges+i*2+range+(code-buffer.readUInt16BE(startCodes+i*2))*2;
     const value=buffer.readUInt16BE(index);
     return value?(value+delta)&0xffff:0;
    }
   }
  }
  return 0;
 };
 return{weight:buffer.readUInt16BE(tables.get('OS/2')+4),has:character=>{const index=glyph(character.codePointAt(0));return index>0&&index<count;}};
}

assert.equal(manifest.schemaVersion,1);
assert.equal(manifest.files.length,expected.length,'Each supported weight has exactly one tracked font');
const faces=[...css.matchAll(/@font-face\s*\{([^}]+)\}/g)].map(match=>match[1]);
assert.equal(faces.length,expected.length,'No unused or remote font faces');
const localeLetters=new Set(Object.values(locales).flatMap(locale=>Object.values(locale.dict)).join('').match(/\p{Script=Latin}|\p{Number}/gu));
for(const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÁÉÍÓÖŐÚÜŰáéíóöőúüű')localeLetters.add(char);
const markers=new Set((html+'\n'+sources.join('\n')+'\n'+Object.values(locales).map(locale=>Object.values(locale.dict).join('')).join('\n')).match(/\p{Script=Han}/gu));
assert(markers.has('牙')&&markers.has('影')&&markers.has('風'),'Coverage includes HTML and Canvas Japanese markers');
const fonts=new Map();
for(const spec of expected){
 const filename=`${spec.stem}-${spec.weight}-v1.ttf`,entries=manifest.files.filter(item=>item.file===filename);
 assert.equal(entries.length,1,`${filename} has unique provenance`);
 const entry=entries[0],buffer=fs.readFileSync(path.join(root,'assets/fonts',filename));
 assert.equal(entry.family,spec.family);assert.equal(entry.weight,spec.weight);assert.equal(entry.format,'truetype');
 assert.equal(entry.bytes,buffer.length,`${filename} byte count`);
 assert.equal(entry.sha256,crypto.createHash('sha256').update(buffer).digest('hex'),`${filename} hash`);
 assert.equal(new URL(entry.source).protocol,'https:');assert.equal(new URL(entry.source).hostname,'fonts.gstatic.com','Official font provenance');
 const info=fontInfo(buffer);
 fonts.set(`${spec.alias}:${spec.weight}`,info);
 assert.equal(info.weight,spec.weight,`${filename} actual OS/2 weight matches the CSS weight`);
 // JP keeps its native Japanese glyphs; the explicitly local Latin face covers
 // double-acutes and fractions absent from Noto Serif JP (FONT-001 r1).
 const required=spec.family==='Noto Serif JP'?new Set([...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',...markers]):localeLetters;
 const missing=[...required].filter(char=>!info.has(char));
 assert.deepEqual(missing,[],`${filename} has real glyphs for its role in the local font chain`);
 const face=faces.filter(text=>new RegExp(`font-family:\\s*['"]${spec.alias}['"]`).test(text)&&new RegExp(`font-weight:\\s*${spec.weight}\\s*;`).test(text));
 assert.equal(face.length,1,`${spec.alias} ${spec.weight} has a unique face`);
 assert.match(face[0],new RegExp(`url\\(['"]?\\.\\./fonts/${filename.replaceAll('.','\\.')}['"]?\\)`),'CSS uses a relative, case-correct shipped file');
 assert.match(face[0],/font-display:\s*swap/,'Text remains visible while fonts load');
}
for(const weight of [400,500,600,700]){
 const story=fonts.get(`Kiba Story:${weight}`),latin=fonts.get(`Kiba Story Latin:${weight}`);
 const missing=[...new Set([...localeLetters,...markers])].filter(char=>!story.has(char)&&!latin.has(char));
 assert.deepEqual(missing,[],`Story ${weight} local fallback chain covers every locale letter/number and Japanese marker`);
}
for(const stem of ['noto-sans','noto-serif-jp','noto-serif']){
 const license=read(`assets/fonts/${stem}-OFL.txt`);
 assert.match(license,/Copyright/);assert.match(license,/SIL OPEN FONT LICENSE Version 1\.1/i);assert.match(license,/PERMISSION & CONDITIONS/);
}
assert(!/@import\b|fonts\.(?:googleapis|gstatic)\.com/i.test(css+html),'Runtime does not request remote font services');
const preloadTags=[...html.matchAll(/<link\b[^>]*\brel="preload"[^>]*>/g)].map(match=>match[0]).filter(tag=>/\bas="font"/.test(tag));
assert(preloadTags.length>=2,'Both primary families preload locally');
for(const tag of preloadTags){
 const href=tag.match(/\bhref="([^"]+)"/)?.[1];
 assert(href&&/^assets\/fonts\/[^/]+\.ttf$/.test(href),'Font preloads work under a GitHub Pages repository subpath');
 assert(fs.existsSync(path.join(root,href)),`${href} exists`);assert(/\bcrossorigin(?:[\s=>])/.test(tag),'Preload matches font CORS mode');
}
assert.match(css,/--font-ui:\s*['"]Kiba UI['"],['"]Kiba Story['"]/,'UI has the local Japanese glyph fallback');
assert.match(css,/--font-story:\s*['"]Kiba Story['"],['"]Kiba Story Latin['"]/,'Story has its local Latin fallback before system fonts');
assert(!/Manrope|Cormorant/i.test(css+html+sources.join('\n')),'DOM and Canvas no longer request the previous font families');
for(let i=0;i<sources.length;i++)for(const match of sources[i].matchAll(/\bctx\.font\s*=\s*(['"`])([\s\S]*?)\1/g)){
 assert(/Kiba (?:UI|Story)/.test(match[2]),`${modules[i]} Canvas text uses local fonts`);
 if(!match[2].includes('Kiba UI'))assert.match(match[2],/"Kiba Story",\s*"Kiba Story Latin"/,`${modules[i]} Canvas story text has the local Latin fallback`);
}
console.log(`Font checks passed: ${expected.length} verified binaries, ${localeLetters.size} locale letters/numbers and ${markers.size} Japanese markers.`);
