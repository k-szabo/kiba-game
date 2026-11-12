'use strict';

const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const runtimeModules=require('./runtime-modules.cjs');
const {bossCatalog}=require('./test-only-bootstrap.cjs');

// Load map definitions and their rule dependencies without initializing the game.
const worldModules=new Set([
  'dungeon-rules','fia-journey-rules','fia-ritual-rules','fia-void-maps','dragon-raid',
  'sky-dragon-raid-rules','sky-dragon-raid-maps','third-clan-rules','third-clan-maps',
  'story-raid-rules','story-raid-maps','haru-follower','floating-islands-rules',
  'floating-islands-maps','watchtower-balloon-rules','watchtower-balloon-maps',
  'ziggurat-descent-rules','ziggurat-descent-maps','ziggurat-maps','levels','camp-services',
]);
const sources=runtimeModules.filter(module=>worldModules.delete(module));
if(worldModules.size)throw Error('Save fixture modules missing from the runtime list: '+[...worldModules].join(', '));
const worldScript=new vm.Script([bossCatalog,...sources.map(module=>{
  const file=path.join(__dirname,'../assets/js',module+'.js');
  return fs.readFileSync(file,'utf8');
})].join('\n'),{filename:'save-world-fixture.js'});

module.exports=context=>worldScript.runInContext(context);
