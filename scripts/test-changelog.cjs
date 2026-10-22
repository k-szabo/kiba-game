const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const locales=JSON.parse(fs.readFileSync(path.join(root,'assets/i18n/locales.json'),'utf8'));
const release=JSON.parse(fs.readFileSync(path.join(root,'assets/config/release.json'),'utf8'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const listeners={},stored=new Map([['momo-language','hu']]),attributes={};
let badgeHeight=48,resizeCallback,observeCount=0;
const layoutProperties={};
const badge={textContent:'',parentElement:{style:{setProperty:(key,value)=>layoutProperties[key]=value}},getBoundingClientRect:()=>({height:badgeHeight}),setAttribute:(key,value)=>attributes[key]=value,focus(){this.focused=true;}};
const inside={},outside={};
const notes={open:true,contains:target=>target===inside,querySelector:()=>badge};
let menuHidden=false;
const translations=Object.keys(locales.hu.dict).filter(id=>id.startsWith('menu.changelog.')&&id!=='menu.changelog.toggle');
const nodes=translations.map(id=>({nodeValue:locales.hu.dict[id],parentElement:{tagName:'LI'}}));
const document={documentElement:{},body:{},title:locales.hu.dict['game.title'],
 addEventListener:(name,fn,capture)=>{listeners[name]={fn,capture};},
 createTreeWalker(){let index=0;return{nextNode:()=>nodes[index++]??null};},
 querySelector(selector){if(selector==='#menu .menu-note')return badge;if(selector==='#menu:not([hidden]) #releaseNotes[open]')return notes.open&&!menuHidden?notes:null;return null;},
 querySelectorAll(selector){if(selector.includes('#releaseNotes[open]'))return notes.open?[notes]:[];return[];}
};
const context=vm.createContext({LOCALES:locales,GAME_RELEASE:release,document,ResizeObserver:class{constructor(callback){resizeCallback=callback;}observe(target){assert.equal(target,badge);observeCount++;}},NodeFilter:{SHOW_TEXT:4},navigator:{language:'hu'},localStorage:{getItem:key=>stored.get(key),setItem:(key,value)=>stored.set(key,value)}});
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/i18n.js'),'utf8')+'\nglobalThis.uiLocale=I18n;',context);
const ui=context.uiLocale;
ui.applyDOM();
assert.equal(document.title,locales.hu.dict['game.title']);
assert.equal(badge.textContent,locales.hu.dict['menu.version'].replace('{0}',release.version));
assert.equal(attributes['aria-label'],locales.hu.dict['menu.changelog.toggle'].replace('{0}',release.version));
for(const id of translations)assert(html.includes(locales.hu.dict[id]),`Release note is reachable in static menu: ${id}`);
ui.setLocale('en');
assert.equal(document.title,locales.en.dict['game.title']);
assert(notes.open,'Language change preserves the open release notes');
assert.equal(stored.get('momo-language'),'en');
assert.equal(document.documentElement.lang,'en');
assert.equal(badge.textContent,locales.en.dict['menu.version'].replace('{0}',release.version));
for(let i=0;i<nodes.length;i++)assert.equal(nodes[i].nodeValue,locales.en.dict[translations[i]],translations[i]);
ui.setLocale('hu');
assert.equal(document.title,locales.hu.dict['game.title']);
for(let i=0;i<nodes.length;i++)assert.equal(nodes[i].nodeValue,locales.hu.dict[translations[i]],translations[i]);
listeners.pointerdown.fn({target:inside});assert(notes.open,'Interacting inside must preserve the panel');
listeners.pointerdown.fn({target:outside});assert(!notes.open,'Outside interaction dismisses the panel');
notes.open=true;
const escape={key:'Escape',preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;}};
listeners.keydown.fn(escape);
assert(!notes.open);assert(badge.focused);assert(escape.prevented&&escape.stopped,'Escape returns focus without reaching game shortcuts');
assert.equal(listeners.keydown.capture,true,'Menu dismissal handles Escape before gameplay shortcuts');
const untouched={key:'Escape',preventDefault(){throw Error('Unrelated Escape was consumed');},stopPropagation(){throw Error('Unrelated Escape was stopped');}};
listeners.keydown.fn(untouched);
notes.open=true;menuHidden=true;
listeners.keydown.fn(untouched);
assert(notes.open,'A hidden menu does not intercept gameplay Escape');
assert(/<details id="releaseNotes"[^>]*><summary class="menu-note"[^>]*aria-controls="releaseNotesPanel"/.test(html),'Native details supplies keyboard activation and expanded state');
assert(/id="releaseNotesPanel"[^>]*aria-labelledby="releaseNotesTitle"[^>]*tabindex="0"/.test(html),'Release notes are named and keyboard-scrollable');
// Keep suffix coverage when a future feature release returns to a plain version.
const actualVersion=release.version,baseVersion=actualVersion.split('_')[0];
for(const version of [baseVersion,baseVersion+'_8as86fg7']){
 context.GAME_RELEASE.version=version;
 for(const language of ['hu','en']){
  ui.setLocale(language);
  assert.equal(badge.textContent,locales[language].dict['menu.version'].replace('{0}',version));
  assert(badge.textContent.includes(version),'The visible version lost the bugfix ID');
  assert.equal(attributes['aria-label'],locales[language].dict['menu.changelog.toggle'].replace('{0}',version));
 }
}
context.GAME_RELEASE.version=actualVersion;ui.setLocale('hu');
assert.equal(observeCount,1,'Locale updates must reuse the badge observer');
assert.equal(layoutProperties['--release-badge-height'],'48px');
badgeHeight=104;resizeCallback();
assert.equal(layoutProperties['--release-badge-height'],'104px','Wrapped badge height must update the available panel height');
badgeHeight=0;resizeCallback();
assert.equal(layoutProperties['--release-badge-height'],'104px','Hidden menu must retain its last visible measurement');
console.log('PASS: release-note localization, full plain/bugfix version label, outside/Escape dismissal, focus return and native accessible disclosure; actual layout/keyboard behavior requires browser QA.');
