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
function checkForm(url,expectedArea){
 const form=new URL(url),fields=form.searchParams;
 assert.equal(form.origin,'https://tally.so');assert.equal(form.pathname,'/r/8Nojjr');
 assert.deepEqual([...fields.keys()].sort(),['area','browser','input','language','pixel_ratio','version','viewport']);
 assert.equal(fields.get('version'),release.version,'Full release ID is included');
 assert.equal(fields.get('language'),language);assert.equal(fields.get('area'),t('bugReport.area.'+expectedArea));
 assert.equal(fields.get('browser'),'Chrome 140');assert.equal(fields.get('viewport'),'1280 × 720');assert.equal(fields.get('pixel_ratio'),'2.00');
 assert(!url.includes('DO_NOT_EXPORT'));assert(!url.includes('Mozilla'));assert(!url.includes('{0}'));
 assert(url.length<2000,'Keep the form URL bounded');
}
for(language of ['hu','en']){
 checkForm(context.report.createURL('dream'),'dream');
 checkForm(context.report.createURL('forestCamp'),'forestCamp');
 checkForm(context.report.createURL('DO_NOT_EXPORT'),'menu');
}
const originalVersion=release.version;release.version=originalVersion.split('_')[0]+'_a1b2c3d4';
checkForm(context.report.createURL('heaven'),'heaven');release.version=originalVersion;
language='hu';context.report.init(()=>area);
checkForm(links[0].href,'menu');checkForm(links[1].href,'dream');
area='yomi';links[1].listeners.click();checkForm(links[1].href,'yomi');
language='en';localeChanged();assert.equal(links[1].attributes['aria-label'],t('bugReport.label'));
assert.equal(new URL(links[0].href).searchParams.get('language'),'en');
context.innerWidth=1920;context.innerHeight=1080;links[1].listeners.focus();
assert.equal(new URL(links[1].href).searchParams.get('viewport'),'1920 × 1080','Focus refreshes viewport context');
context.matchMedia=()=>({matches:true});links[1].listeners.pointerdown();
assert.equal(new URL(links[1].href).searchParams.get('input'),t('bugReport.pointer'));
for(const [ua,expected] of [['Edg/143.1 Chrome/142.0','Edge 143'],['FxiOS/144.0 Safari/604.1','Firefox 144'],['Version/26.0 Mobile/15E148 Safari/604.1','Safari 26'],['unrecognized SecretSession/DO_NOT_EXPORT',t('bugReport.unknown')]]){
 context.navigator.userAgent=ua;
 assert.equal(new URL(context.report.createURL()).searchParams.get('browser'),expected);
}
console.log('PASS: HU/EN Tally form links, exact hidden field contract, full plain/bugfix release IDs, no storage/session export, live language/viewport refresh, and browser/input detection.');
