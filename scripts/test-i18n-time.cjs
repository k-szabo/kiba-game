'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
for(const language of ['hu','en']){
 const context=vm.createContext({localStorage:{getItem:()=>language},navigator:{language},document:{addEventListener(){}}});
 vm.runInContext('const LOCALES='+fs.readFileSync(path.join(__dirname,'../assets/i18n/locales.json'),'utf8')+';',context);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/i18n.js'),'utf8'),context);
 const run=source=>vm.runInContext(source,context);
 for(const name of ['fia.name','HARU','balloon.pilot']){
  const text=run(`I18n.format('camp.talk',[I18n.t('${name}')])`);
  assert.equal(run(`I18n.t(${JSON.stringify(text)})`),text,'Already translated talk prompts must remain intact');
 }
 for(const prose of ['Beszélgetés','Thanks','Grass','News'])assert.equal(run(`I18n.t(${JSON.stringify(prose)})`),prose);
 for(const seconds of ['12','2.5','0'])assert.equal(run(`I18n.t('${seconds}s')`),seconds+(language==='hu'?' mp':'s'),'Numeric cooldowns still translate');
}
console.log('PASS real locale engine keeps conversation prose intact while translating numeric seconds.');
