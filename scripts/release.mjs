import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareBugfix,validateRegistry,validateRelease} from './release-id.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const registryPath=path.join(root,'docs/releases.json'),releasePath=path.join(root,'assets/config/release.json');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const json=value=>JSON.stringify(value,null,2)+'\n';
function replaceFile(file,content){
  const temporary=`${file}.tmp-${process.pid}`;
  try{fs.writeFileSync(temporary,content,{flag:'wx'});fs.renameSync(temporary,file);}
  finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
}
try{
  const [command,...args]=process.argv.slice(2),registry=validateRegistry(read(registryPath)),release=validateRelease(read(releasePath),registry);
  if(command==='validate'&&!args.length)console.log(`PASS: ${registry.bugfixes.length} registered bugfix release(s); current ${release.version}.`);
  else if(command==='lookup'&&args.length===1){
    const matches=registry.bugfixes.filter(entry=>entry.code===args[0]||entry.version===args[0]);
    if(matches.length!==1)throw Error(`No unique registered release matches: ${args[0]}.`);
    console.log(json(matches[0]));
  }else if(command==='bugfix'&&args[0]==='--metadata'&&(args.length===2||(args.length===3&&args[2]==='--write'))){
    const proposal=prepareBugfix(read(path.resolve(args[1])),release,registry);
    console.log(json(proposal.entry));
    if(args[2]!=='--write')console.log('DRY RUN: no files changed. Add --write to append the registry and update release.json.');
    else if(proposal.unchanged)console.log('Already current; no files changed.');
    else{
      // Keep the old registry if updating the release marker fails. The build
      // rejects a suffixed marker without its matching committed registry entry.
      const previous=fs.readFileSync(registryPath,'utf8');
      replaceFile(registryPath,json(proposal.registry));
      try{replaceFile(releasePath,json(proposal.release));}
      catch(error){replaceFile(registryPath,previous);throw error;}
      console.log('Updated docs/releases.json and assets/config/release.json. Update both language changelogs, then build and test before publishing.');
    }
  }else throw Error('Usage: node scripts/release.mjs validate | lookup <8-character-code|full-version> | bugfix --metadata <JSON-file> [--write]');
}catch(error){console.error(error.message);process.exitCode=1;}
