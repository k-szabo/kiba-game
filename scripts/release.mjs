import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareBugfix,prepareRelease,validateRegistry,validateRelease} from './release-id.mjs';

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
  if(command==='validate'&&!args.length)console.log(`PASS: ${registry.releases.length} feature release(s) and ${registry.bugfixes.length} bugfix release(s) registered; current ${release.version}.`);
  else if(command==='lookup'&&args.length===1){
    const matches=[...registry.releases,...registry.bugfixes].filter(entry=>entry.code===args[0]||entry.version===args[0]);
    if(matches.length!==1)throw Error(`No unique registered release matches: ${args[0]}.`);
    console.log(json(matches[0]));
  }else if(['bugfix','release'].includes(command)&&args[0]==='--metadata'&&args[1]){
    let write=false,reset=false,preserveFrom;const seen=new Set();
    for(let i=2;i<args.length;i++){
      const flag=args[i];if(seen.has(flag))throw Error('Duplicate release option: '+flag);seen.add(flag);
      if(flag==='--write')write=true;else if(flag==='--reset-saves')reset=true;
      else if(flag==='--preserve-saves-from'&&args[i+1]&&!args[i+1].startsWith('--'))preserveFrom=args[++i];
      else throw Error('Unknown or incomplete release option: '+flag);
    }
    if(reset&&preserveFrom)throw Error('Choose either --reset-saves or --preserve-saves-from.');
    const proposal=(command==='bugfix'?prepareBugfix:prepareRelease)(read(path.resolve(args[1])),release,registry);
    if(preserveFrom){
      if(proposal.unchanged||release.savePolicy!=='reset-on-version-change'||preserveFrom!==release.version)throw Error('--preserve-saves-from must name the current legacy release when creating the first compatible release.');
      proposal.release={...proposal.release,savePolicy:'preserve-compatible',saveCompatibility:preserveFrom};
    }
    if(reset){if(proposal.unchanged)throw Error('A save reset requires a new release record.');proposal.release={...proposal.release,savePolicy:'preserve-compatible',saveCompatibility:proposal.entry.version};}
    validateRelease(proposal.release,proposal.registry);
    printProposal(proposal,command==='bugfix'?'bugfix':'feature release',write);
  }else throw Error('Usage: node scripts/release.mjs validate | lookup <code|version> | bugfix|release --metadata <JSON-file> [--preserve-saves-from <current-version> | --reset-saves] [--write]');
  function printProposal(proposal,label,write){
    console.log(json(proposal.entry));
    if(!write)console.log(`DRY RUN: no files changed. Add --write to append this ${label} and update release.json.`);
    else if(proposal.unchanged)console.log('Already current; no files changed.');
    else{
      // Keep the old registry if updating the release marker fails. The build
      // rejects a suffixed marker without its matching committed registry entry.
      const previous=fs.readFileSync(registryPath,'utf8');
      replaceFile(registryPath,json(proposal.registry));
      try{replaceFile(releasePath,json(proposal.release));}
      catch(error){replaceFile(registryPath,previous);throw error;}
      console.log(`Updated docs/releases.json and assets/config/release.json. Update both language changelogs, then build and test before publishing.`);
    }
  }
}catch(error){console.error(error.message);process.exitCode=1;}
