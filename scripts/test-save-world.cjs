'use strict';

const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const runtimeModules=require('./runtime-modules.cjs');
const {bossCatalog}=require('./test-only-bootstrap.cjs');

// Load map definitions and their rule dependencies without initializing the game.
const worldModules=new Set([
  'dungeon-rules','fia-journey-rules','fia-ritual-rules','dragon-raid',
  'sky-dragon-raid-rules','third-clan-rules','map-catalog',
  'story-raid-rules','haru-follower','floating-islands-rules',
  'watchtower-balloon-rules','ziggurat-descent-rules','levels','camp-services',
]);
const sources=runtimeModules.filter(module=>worldModules.delete(module));
if(worldModules.size)throw Error('Save fixture modules missing from the runtime list: '+[...worldModules].join(', '));
const mapDir=path.join(__dirname,'../assets/config/maps'),mapData=Object.fromEntries(fs.readdirSync(mapDir).filter(name=>name.endsWith('.json')).map(name=>{const record=JSON.parse(fs.readFileSync(path.join(mapDir,name),'utf8').replace(/^\uFEFF/,''));return [record.id,record];}));
const worldScript=new vm.Script([bossCatalog,'const MAP_DATA='+JSON.stringify(mapData)+';',...sources.map(module=>{
  const file=path.join(__dirname,'../assets/js',module+'.js');
  return fs.readFileSync(file,'utf8');
})].join('\n'),{filename:'save-world-fixture.js'});

module.exports=context=>worldScript.runInContext(context);
