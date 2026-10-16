const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const locales=JSON.parse(fs.readFileSync(path.join(root,'assets/i18n/locales.json'),'utf8'));
const release=JSON.parse(fs.readFileSync(path.join(root,'assets/config/release.json'),'utf8'));
let language='hu',area='dream',localeChanged;
const links=['menu','pause'].map(origin=>({dataset:{bugReport:origin},listeners:{},attributes:{},addEventListener(event,callback){this.listeners[event]=callback;},setAttribute(key,value){this.attributes[key]=value;}}));
const t=key=>locales[language].dict[key]??key;
const forbidden=new Proxy({}, {get(){throw Error('Bug reporting must not access private/session data');}});
const context=vm.createContext({URL,Set,Math,Number,GAME_RELEASE:release,
 I18n:{t,format:(key,args)=>t(key).replace(/\{(\d+)\}/g,(_,index)=>args[index]),get locale(){return language;},onChange(callback){localeChanged=callback;}},
 navigator:{userAgent:'Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36 SecretSession/DO_NOT_EXPORT'},
 innerWidth:1280,innerHeight:720,devicePixelRatio:2,matchMedia:()=>({matches:false}),
 document:{querySelectorAll:()=>links},localStorage:forbidden,sessionStorage:forbidden,indexedDB:forbidden,location:forbidden,
 saved:forbidden,player:forbidden,flags:forbidden
});
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/bug-report.js'),'utf8')+'\nglobalThis.report=BugReport;',context);
function checkDraft(url,expectedArea){
 const draft=new URL(url),body=draft.searchParams.get('body');
 assert.equal(draft.origin,'https://github.com');assert.equal(draft.pathname,'/k-szabo/kiba-game/issues/new');
 assert.deepEqual([...draft.searchParams.keys()].sort(),['body','title']);
 assert(draft.searchParams.get('title').includes(release.version),'Full release ID is included');
 assert(body.includes(release.version));assert(body.includes(t('bugReport.area.'+expectedArea)));
 assert(body.includes('Chrome 140'));assert(body.includes('1280 × 720'));assert(body.includes('2.00'));
 assert(!body.includes('DO_NOT_EXPORT'));assert(!body.includes('Mozilla'));assert(!body.includes('{0}'));
 assert(url.length<8000,'Keep the draft URL bounded');
 return body;
}
for(language of ['hu','en']){
 const body=checkDraft(context.report.createURL('dream'),'dream');
 assert(body.includes(language==='hu'?'Reprodukálás':'Steps to reproduce'));
 checkDraft(context.report.createURL('DO_NOT_EXPORT'),'menu');
}
language='hu';context.report.init(()=>area);
checkDraft(links[0].href,'menu');checkDraft(links[1].href,'dream');
area='yomi';links[1].listeners.click();checkDraft(links[1].href,'yomi');
language='en';localeChanged();assert.equal(links[1].attributes['aria-label'],t('bugReport.label'));
assert(new URL(links[0].href).searchParams.get('title').includes('short bug title'));
context.innerWidth=390;context.innerHeight=844;links[1].listeners.focus();
assert(new URL(links[1].href).searchParams.get('body').includes('390 × 844'),'Focus refreshes viewport context');
context.matchMedia=()=>({matches:true});links[1].listeners.pointerdown();
assert(new URL(links[1].href).searchParams.get('body').includes(t('bugReport.touch')));
for(const [ua,expected] of [['Edg/143.1 Chrome/142.0','Edge 143'],['FxiOS/144.0 Safari/604.1','Firefox 144'],['Version/26.0 Mobile/15E148 Safari/604.1','Safari 26'],['unrecognized SecretSession/DO_NOT_EXPORT',t('bugReport.unknown')]]){
 context.navigator.userAgent=ua;
 assert(new URL(context.report.createURL()).searchParams.get('body').includes(expected));
}
console.log('PASS: HU/EN GitHub draft URLs, full release/context, bounded allowlisted metadata, no storage/session export, live language/viewport refresh, and browser/input detection.');
