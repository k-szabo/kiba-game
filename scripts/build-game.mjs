import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import files from './runtime-modules.cjs';
import {validateRelease,synchronizeEntry,bugfixHistory} from './release-id.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const localePath='assets/i18n/locales.json';
const bindingPath='assets/config/keybindings.json';
const leaderboardPath='assets/config/leaderboard.json';
const releasePath='assets/config/release.json';
const registryPath='docs/releases.json';
const readSource=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n?/g,'\n');
const locales=JSON.parse(readSource(localePath));
const bindings=JSON.parse(readSource(bindingPath));
const leaderboard=JSON.parse(readSource(leaderboardPath));
if(!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(leaderboard.url)||leaderboard.keyFile!=='assets/config/leaderboard-public.json'||Object.hasOwn(leaderboard,'publishableKey')||!['tower-leaderboard','tower-leaderboard-v2'].includes(leaderboard.function))throw Error('Invalid public leaderboard configuration.');
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
const bossPaths=fs.readdirSync(path.join(root,'assets/config/bosses')).filter(name=>name.endsWith('.json')).sort().map(name=>'assets/config/bosses/'+name);
const positiveInteger=value=>Number.isSafeInteger(value)&&value>0;
const raidKinds=['duel','reikaMarks','westheruShot','mimic'];
const bossData=Object.fromEntries(bossPaths.map(file=>{
  const boss=JSON.parse(readSource(file)),{story,tower}=boss;
  if(boss.schema!==1||file!=='assets/config/bosses/'+boss.id+'.json'||
     !['main','optional'].includes(boss.group)||!languages.every(lang=>Object.hasOwn(locales[lang].dict,boss.name))||
     !positiveInteger(boss.classificationOrder)||!positiveInteger(tower?.order)||!positiveInteger(tower?.baseHealth)||
     (!positiveInteger(story?.hp)&&story?.raidKind!=='mimic')||!Array.isArray(boss.assets)||boss.assets.some(key=>typeof key!=='string')){
    throw Error('Invalid boss config: '+file);
  }
  if((story.raidOrder!==undefined||story.raidKind!==undefined)&&
     (!positiveInteger(story.raidOrder)||!raidKinds.includes(story.raidKind)||!positiveInteger(story.w)||!positiveInteger(story.h)||
      !Number.isFinite(story.speed)||!Number.isFinite(story.range)||
      story.raidKind!=='mimic'&&(!positiveInteger(story.damage)||!(story.windup>0)||!(story.recovery>0)||
       !Array.isArray(story.moves)||!story.moves.length||story.moves.some(move=>!['fan','step','mirage','fissure','sweep'].includes(move))))){
    throw Error('Invalid story raid profile: '+file);
  }
  return [boss.id,boss];
}));
const bosses=Object.values(bossData);
for(const [label,orders] of [
  ['classification',bosses.map(boss=>boss.classificationOrder)],
  ['tower',bosses.map(boss=>boss.tower.order)],
  ['story raid',bosses.filter(boss=>boss.story.raidOrder).map(boss=>boss.story.raidOrder)]
]){
  if(new Set(orders).size!==orders.length)throw Error('Duplicate '+label+' boss order');
}
const npcPaths=fs.readdirSync(path.join(root,'assets/config/npcs')).filter(name=>name.endsWith('.json')).sort().map(name=>'assets/config/npcs/'+name);
const npcData=Object.fromEntries(npcPaths.map(file=>{const value=JSON.parse(readSource(file));if(value.schema!==1||file!=='assets/config/npcs/'+value.id+'.json'||!['npc','enemy','boss'].includes(value.kind)||!Array.isArray(value.selectors)||!value.selectors.length||!Array.isArray(value.art?.sprites)||!Array.isArray(value.art?.effects)||value.name!==null&&!languages.every(language=>Object.hasOwn(locales[language].dict,value.name)))throw Error('Invalid NPC config: '+file);if(value.bossConfig&&value.bossConfig!=='assets/config/bosses/'+value.id.slice(5)+'.json')throw Error('Invalid boss reference: '+file);return [value.id,value];}));
const digest=createHash('sha256');
for(const file of [localePath,bindingPath,leaderboardPath,releasePath,registryPath,...bossPaths,...npcPaths,...files.map(name=>'assets/js/'+name+'.js')]){
  digest.update(file);digest.update('\0');digest.update(readSource(file));digest.update('\0');
}
// Content identities include every image, including CSS and standalone sprite URLs.
const imageRevisions={};
function indexImages(dir){if(!fs.existsSync(dir))return;for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(dir,entry.name);if(entry.isDirectory())indexImages(file);else{const key=path.relative(root,file).replaceAll('\\','/');imageRevisions[key]=createHash('sha256').update(fs.readFileSync(file)).digest('hex');}}}
indexImages(path.join(root,'assets/images'));digest.update(JSON.stringify(imageRevisions));
const sourceHash=digest.digest('hex');
let runtime=`/* Generated from assets/js sources by scripts/build-game.mjs; source-sha256: ${sourceHash} */\n(()=>{'use strict';\nconst BOSS_DATA=${JSON.stringify(bossData)};\nconst NPC_DATA=${JSON.stringify(npcData)};\nconst GAME_RELEASE=${JSON.stringify(runtimeRelease)};\nconst IMAGE_REVISIONS=${JSON.stringify(imageRevisions)};\nconst LOCALES=${JSON.stringify(locales)};\nconst KEY_BINDINGS=${JSON.stringify(bindings)};\nconst LEADERBOARD_CONFIG=${JSON.stringify(leaderboard)};\n`;
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
