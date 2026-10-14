import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=fileURLToPath(new URL('../',import.meta.url));
const localePath='assets/i18n/locales.json';
const locales=JSON.parse(fs.readFileSync(path.join(root,localePath),'utf8'));
const languages=Object.keys(locales);
if(!languages.includes('hu')||!languages.includes('en'))throw Error('Both hu and en locales are required.');
const ids=Object.keys(locales.hu);
if(ids.length<250)throw Error('The Hungarian locale is incomplete.');
for(const language of languages){
  if(!/^[a-z]{2}$/.test(language)||!locales[language]||Array.isArray(locales[language])||typeof locales[language]!=='object')throw Error(`Invalid ISO language: ${language}`);
  const entries=locales[language];
  if(Object.keys(entries).length!==ids.length)throw Error(`Locale ${language} does not have the same keys as hu.`);
  for(const id of ids){
    if(typeof entries[id]!=='string')throw Error(`Missing translation: ${language}.${id}`);
    const placeholders=value=>[...value.matchAll(/\{(\d+)\}/g)].map(match=>match[1]).sort().join(',');
    if(placeholders(entries[id])!==placeholders(locales.hu[id]))throw Error(`Placeholder mismatch: ${language}.${id}`);
  }
}
const files=['i18n','levels','art-data','save-vault','graphics','progression','combat','game'];
const digest=createHash('sha256');
for(const file of [localePath,...files.map(name=>'assets/js/'+name+'.js')]){
  digest.update(file);digest.update('\0');digest.update(fs.readFileSync(path.join(root,file)));digest.update('\0');
}
const sourceHash=digest.digest('hex');
let runtime=`/* Generated from assets/js sources by scripts/build-game.mjs; source-sha256: ${sourceHash} */\n(()=>{'use strict';\nconst LOCALES=${JSON.stringify(locales)};\n`;
for(const name of files)runtime+=`\n/* ${name}.js */\n${fs.readFileSync(path.join(root,'assets/js',name+'.js'),'utf8')}\n`;
runtime+='})();\n';
const output=path.join(root,'assets/js/runtime.js');
if(process.argv.includes('--check')){
  if(!fs.existsSync(output)||fs.readFileSync(output,'utf8')!==runtime){console.error('runtime.js is out of date; run node scripts/build-game.mjs');process.exitCode=1;}
  else console.log('PASS: generated runtime is current.');
}else{fs.writeFileSync(output,runtime);console.log('Built assets/js/runtime.js');}
