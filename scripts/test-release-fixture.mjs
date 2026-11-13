import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import runtimeModules from './runtime-modules.cjs';

export const projectRoot=fileURLToPath(new URL('../',import.meta.url));

const inputs=[
  'scripts/build-game.mjs', 'scripts/runtime-modules.cjs', 'scripts/release-id.mjs',
  'scripts/release.mjs', 'docs/releases.json', 'assets/config/release.json',
  'assets/config/keybindings.json', 'assets/config/leaderboard.json',
  'assets/i18n/locales.json',
];

function prepareFixture(fixture){
  for(const file of inputs){
    const target=path.join(fixture,file);
    fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.copyFileSync(path.join(projectRoot,file),target);
  }
  for(const directory of ['assets/config/bosses','assets/config/npcs','assets/config/maps']){
    fs.cpSync(path.join(projectRoot,directory),path.join(fixture,directory),{recursive:true});
  }
  const sources=path.join(fixture,'assets/js');
  fs.mkdirSync(sources,{recursive:true});
  for(const module of runtimeModules){
    fs.writeFileSync(path.join(sources,module+'.js'),`// ${module} fixture\n`);
  }
}

export function withReleaseFixture(prefix,test){
  const temporaryRoot=fs.realpathSync(os.tmpdir());
  const fixture=fs.mkdtempSync(path.join(temporaryRoot,prefix));
  try{
    prepareFixture(fixture);
    function run(script,args=[],success=true){
      const result=spawnSync(process.execPath,[path.join(fixture,'scripts',script),...args],{cwd:fixture,encoding:'utf8'});
      assert.ifError(result.error);
      assert.equal(result.signal,null,'Fixture process ended with a signal');
      const output=result.stderr||result.stdout;
      if(success)assert.equal(result.status,0,output);
      else assert.notEqual(result.status,0,output);
      return result;
    }
    return test(fixture,run);
  }finally{
    const resolved=fs.realpathSync(fixture);
    assert.equal(path.dirname(resolved),temporaryRoot);
    assert(path.basename(resolved).startsWith(prefix));
    fs.rmSync(resolved,{recursive:true,force:true});
  }
}
