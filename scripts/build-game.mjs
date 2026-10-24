import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {validateRelease,synchronizeEntry,bugfixHistory} from './release-id.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const localePath='assets/i18n/locales.json';
const bindingPath='assets/config/keybindings.json';
const releasePath='assets/config/release.json';
const registryPath='docs/releases.json';
const readSource=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n?/g,'\n');
const locales=JSON.parse(readSource(localePath));
const bindings=JSON.parse(readSource(bindingPath));
const release=JSON.parse(readSource(releasePath));
const registry=JSON.parse(readSource(registryPath));
validateRelease(release,registry);
const runtimeRelease={...release,bugfixHistory:bugfixHistory(registry)};
if(bindings.version!==1||!bindings.original||!bindings.profiles?.uk||!bindings.profiles?.fr||!bindings.modified)throw Error('Key binding profiles are incomplete.');
const languages=Object.keys(locales);
if(!languages.includes('hu')||!languages.includes('en'))throw Error('Both hu and en locales are required.');
const ids=Object.keys(locales.hu.dict);
if(ids.length<250)throw Error('The Hungarian locale is incomplete.');
for(const language of languages){
  const record=locales[language];
  if(!/^[a-z]{2}$/.test(language)||!record||Array.isArray(record)||typeof record!=='object')throw Error(`Invalid ISO language: ${language}`);
  if(!record.flag?.startsWith('data:image/svg+xml;base64,')||!Buffer.from(record.flag.split(',')[1],'base64').toString('utf8').includes('<svg'))throw Error(`Invalid SVG flag: ${language}`);
  if(!record.lang_en?.trim()||!record.lang_orig?.trim())throw Error(`Language names are missing: ${language}`);
  const entries=record.dict;
  if(!entries||Array.isArray(entries)||typeof entries!=='object')throw Error(`Missing dictionary: ${language}`);
  if(Object.keys(entries).length!==ids.length)throw Error(`Locale ${language} does not have the same keys as hu.`);
  for(const id of ids){
    if(typeof entries[id]!=='string')throw Error(`Missing translation: ${language}.${id}`);
    const placeholders=value=>[...value.matchAll(/\{(\d+)\}/g)].map(match=>match[1]).sort().join(',');
    if(placeholders(entries[id])!==placeholders(locales.hu.dict[id]))throw Error(`Placeholder mismatch: ${language}.${id}`);
  }
}
const files=['i18n','keybindings','levels','camp-services','serpent-relics','camp-health','art-data','boss-vfx','save-vault','graphics','armor','weapons','weapon-equipment','weapon-selection','progression','serpents','combat','camp-master','doom-slayer','slayer-art','serpent-art','shadow-realm','shadow-animation','prologue','inventory','merchant','compass','slayer-dialog','bug-report','dev-session','dev-tools','dev-boss','dev-teleport','dev-level','dev-items','dev-abilities','dev-weapons','dev-immortality','dev-damage','camp-quest','camp-workshop','camp-herbs','camp-art','game'];
const digest=createHash('sha256');
for(const file of [localePath,bindingPath,releasePath,registryPath,...files.map(name=>'assets/js/'+name+'.js')]){
  digest.update(file);digest.update('\0');digest.update(readSource(file));digest.update('\0');
}
const sourceHash=digest.digest('hex');
let runtime=`/* Generated from assets/js sources by scripts/build-game.mjs; source-sha256: ${sourceHash} */\n(()=>{'use strict';\nconst GAME_RELEASE=${JSON.stringify(runtimeRelease)};\nconst LOCALES=${JSON.stringify(locales)};\nconst KEY_BINDINGS=${JSON.stringify(bindings)};\n`;
for(const name of files)runtime+=`\n/* ${name}.js */\n${readSource('assets/js/'+name+'.js')}\n`;
runtime+='})();\n';
const output=path.join(root,'assets/js/runtime.js');
const entryPath=path.join(root,'index.html'),entry=fs.readFileSync(entryPath,'utf8');
const updatedEntry=synchronizeEntry(entry,release.version,locales.hu.dict['menu.version'],locales.hu.dict['menu.changelog.current']);
if(process.argv.includes('--check')){
  if(!fs.existsSync(output)||fs.readFileSync(output,'utf8')!==runtime){console.error('runtime.js is out of date; run node scripts/build-game.mjs');process.exitCode=1;}
  else console.log('PASS: generated runtime is current.');
  if(entry!==updatedEntry){console.error('index.html release/cache version is out of date; run node scripts/build-game.mjs');process.exitCode=1;}
}else{fs.writeFileSync(output,runtime);if(entry!==updatedEntry)fs.writeFileSync(entryPath,updatedEntry);console.log('Built assets/js/runtime.js and release markers');}
