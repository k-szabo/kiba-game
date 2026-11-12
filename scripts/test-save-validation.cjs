const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const locale=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/i18n/locales.json'),'utf8')).hu.dict;
const GAME_RELEASE=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/config/release.json'),'utf8'));
const context={GAME_RELEASE,TextEncoder,TextDecoder,location:{origin:'http://localhost',pathname:'/kiba-game/'},btoa,atob,I18n:{t:value=>locale[value]??value}};vm.createContext(context);
for(const name of ['dungeon-rules','sky-dragon-raid-rules'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/'+name+'.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/fia-journey-rules.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/fia-ritual-rules.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/dragon-raid.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/fia-void-maps.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/ziggurat-descent-rules.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'../assets/js/ziggurat-descent-maps.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'../assets/js/ziggurat-maps.js'),'utf8'),context);
vm.runInContext((fs.readFileSync(path.join(__dirname,'../assets/js/floating-islands-rules.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'../assets/js/floating-islands-maps.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'../assets/js/watchtower-balloon-rules.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'../assets/js/watchtower-balloon-maps.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'../assets/js/third-clan-rules.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'../assets/js/third-clan-maps.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'../assets/js/levels.js'),'utf8')),context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/camp-services.js'),'utf8'),context);
const source=fs.readFileSync(path.join(__dirname,'../assets/js/save-vault.js'),'utf8').replace('return Object.freeze({ready,','globalThis.__validateSave=validate;return Object.freeze({ready,');
if(!source.includes('globalThis.__validateSave=validate'))throw Error('Validator test seam failed');
vm.runInContext(source,context);
module.exports=(data,options={})=>{
 context.snapshot=JSON.parse(JSON.stringify(data));context.validationOptions=options;
 try{return vm.runInContext('__validateSave(snapshot,validationOptions)',context);}
 catch(error){
  if(error.message==='Invalid save location'){
   const detail=vm.runInContext(`(()=>{const map=snapshot.location!=null?SIDE_LOCATIONS[snapshot.location]?.map:levels[snapshot.realm],point=snapshot.checkpoint,rest=[...(map?.rests||[]),...(map?.checkpoints||[])].find(r=>r.id===point?.id),position=p=>p?{id:p.id,x:p.x,y:p.y}:null;return {realm:snapshot.realm,location:snapshot.location??null,actual:position(point),expected:position(rest),visited:snapshot.visitedRests?.[snapshot.realm]};})()`,context);
   error.message+='\nSynthetic fixture checkpoint: '+JSON.stringify(detail);
  }
  throw error;
 }
};
