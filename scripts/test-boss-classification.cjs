'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const entries=JSON.parse(fs.readFileSync('data/boss-classification.json','utf8'));
const locales=JSON.parse(fs.readFileSync('assets/i18n/locales.json'));
assert(entries.length>=30,'Catalog includes main and optional bosses');
assert.equal(new Set(entries.map(e=>e.id)).size,entries.length,'Encounter IDs are unique');
const byId=new Map(entries.map((entry,index)=>[entry.id,{...entry,index}]));
const ratings=catalog=>new Map(catalog.map((entry,index)=>[entry.id,Math.round(10+90*index/(catalog.length-1))]));
const currentRatings=ratings(entries),rating=id=>currentRatings.get(id)??null;
assert.equal(rating(entries[0].id),10);assert.equal(rating(entries.at(-1).id),100);
assert.equal(rating('unknown-boss'),null);
for(let i=0;i<entries.length;i++){const entry=entries[i];assert(['main','optional'].includes(entry.group));for(const lang of ['hu','en'])assert(locales[lang].dict[entry.name],entry.id+' has '+lang+' name');if(i)assert(rating(entry.id)>=rating(entries[i-1].id),'Ratings follow catalog order');}
const extended=[...entries,{id:'future-boss'}],extendedRatings=ratings(extended);assert.equal(extendedRatings.get('future-boss'),100);assert(extendedRatings.get(entries.at(-1).id)<100,'Room for future roster expansion');
assert.equal(byId.get('hannah').name,'ziggurat.hannah','Hannah resolves to her own name, not Fia');
assert.equal(entries.filter(entry=>entry.name==='shadow.boss.priest').length,1,'Mad Priest is classified only once');
assert.equal(byId.get('madPriest').group,'main','Mad Priest is the main Shadow Realm guardian');
console.log('PASS: '+entries.length+' unique internal boss ratings, 10–100 endpoints, ordered scale, HU/EN names, no duplicate Mad Priest entry and future expansion.');
