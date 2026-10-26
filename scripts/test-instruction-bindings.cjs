'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),harness=require('./test-harness.cjs');
const locales=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/i18n/locales.json'),'utf8'));
for(const lang of ['hu','en']){
 const h=harness(),r=h.run;r('Object.assign(TEST_LOCALE,'+JSON.stringify(locales[lang].dict)+');I18n.locale='+JSON.stringify(lang)+';');
 const prose='Következő · Új · Élet · Út · Kiba · Japan · Spacecraft · 影K · K影 · _K · K2';
 for(const profile of ['original','uk','fr']){
  assert(r('Bindings.choose('+JSON.stringify(profile)+')'));r('Bindings.reset();');
  for(const layout of [[],[['interact','k'],['dash','e']],[['interact','mouse3'],['dash','b']]]){
   r('Bindings.reset();');for(const [action,key]of layout)assert(r('Bindings.setPrimary('+JSON.stringify(action)+','+JSON.stringify(key)+').ok'));
   assert.equal(r('keyedInstruction('+JSON.stringify(prose)+')'),prose,'Ordinary Unicode words are never treated as control labels');
   const tokens=['E','J','K','U','Space'],actions=['interact','attack','dash','train','jump'];
   const input=tokens.join(' · '),expected=actions.map(action=>r('bindingKeyLabel(Bindings.read('+JSON.stringify(action)+')[0])')).join(' · ');
   assert.equal(r('keyedInstruction('+JSON.stringify(input)+')'),expected,'Standalone instructions remap once without cascading replacements');
  }
 }
 r('Bindings.reset();DevTools.open();DevSession.begin();DevTools.close();CampQuest.enter("shadowArena");ArenaChallenge.start();ArenaChallenge.update(45);player.inv=999;');
 assert.equal(r('ArenaChallenge.attempt.status'),'between');
 for(const key of ['e','f','mouse3']){
  r('Bindings.reset();');assert(r('Bindings.setPrimary("interact",'+JSON.stringify(key)+').ok'));h.tick();
  assert.equal(r('context.type'),'arenaNext');
  const label=r('I18n.t("arena.next")'),expected=label.replace(/^E(?= · )/,r('bindingKeyLabel(Bindings.read("interact")[0])'));
  assert.equal(h.elements.get('prompt').textContent,expected,'Actual '+lang+' next-round prompt keeps its translated word intact');
 }
}
console.log('PASS: Unicode-safe instruction tokens, non-cascading swaps/mouse layouts and actual HU/EN arena next-round prompts.');
