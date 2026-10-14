const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const locale=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/i18n/locales.json'),'utf8')).hu;
const context={TextEncoder,TextDecoder,location:{origin:'http://localhost',pathname:'/kiba-game/'},btoa,atob,I18n:{t:value=>locale[value]??value}};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/levels.js'),'utf8'),context);
const source=fs.readFileSync(path.join(__dirname,'../assets/js/save-vault.js'),'utf8').replace('return Object.freeze({ready,','globalThis.__validateSave=validate;return Object.freeze({ready,');
if(!source.includes('globalThis.__validateSave=validate'))throw Error('Validator test seam failed');
vm.runInContext(source,context);
module.exports=data=>{context.snapshot=JSON.parse(JSON.stringify(data));return vm.runInContext('__validateSave(snapshot)',context);};
