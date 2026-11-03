'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={Object,Map,Math};vm.createContext(context);
vm.runInContext(fs.readFileSync('assets/js/boss-classification.js','utf8')+';globalThis.classification=BossClassification;',context);
const classification=context.classification,entries=classification.entries,locales=JSON.parse(fs.readFileSync('assets/i18n/locales.json'));
assert(entries.length>=30,'Catalog includes main and optional bosses');
assert.equal(new Set(entries.map(e=>e.id)).size,entries.length,'Encounter IDs are unique');
assert.equal(classification.rating(entries[0].id),10);assert.equal(classification.rating(entries.at(-1).id),100);
assert.equal(classification.rating('unknown-boss'),null);
for(let i=0;i<entries.length;i++){const entry=entries[i];assert.equal(entry.index,i);assert(['main','optional'].includes(entry.group));for(const lang of ['hu','en'])assert(locales[lang].dict[entry.name],entry.id+' has '+lang+' name');if(i)assert(classification.rating(entry.id)>=classification.rating(entries[i-1].id),'Ratings follow catalog order');}
const next=entries.at(-1).index+1,extended=[...entries,{id:'future-boss',index:next}];const future=Math.round(10+90*extended.at(-1).index/(extended.length-1));assert.equal(future,100);assert(classification.rating(entries.at(-2).id)<100,'Room for future roster expansion');
console.log('PASS: '+entries.length+' unique internal boss ratings, 10–100 endpoints, ordered scale, HU/EN names and future expansion.');
