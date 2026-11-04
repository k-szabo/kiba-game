const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const elements=new Map(),events={},callbacks=[];
const doc={activeElement:null,head:{append(){}},createElement(){return {textContent:''};}};
function element(id){if(!elements.has(id))elements.set(id,{id,hidden:false,disabled:false,isConnected:true,textContent:'',style:{},dataset:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;},focus(){doc.activeElement=this;},closest(){return null;}});return elements.get(id);}
const previous=element('dialogOk');doc.activeElement=previous;
const visuals={blocked:true,failures:[],loaded:3,total:8,onLoad(fn){callbacks.push(fn)},retry(){this.retried=true;}};
const box=vm.createContext({document:doc,$:element,Visuals:visuals,I18n:{t:k=>k,format:(k,args)=>k+':'+args.join('/'),onChange(){}},ART_MANIFEST:{},IMAGE_REVISIONS:{},resolutionBlocked:false,state:'dialog',Dialogue:{render(){}},canvas:element('world'),keys:new Set(['d']),pressed:new Set(['e']),mainMenu(){box.state='menu';},addEventListener(k,fn){(events[k]||=[]).push(fn);},Bindings:{shortcut:()=>false}});
vm.runInContext(fs.readFileSync('assets/js/asset-loading.js','utf8')+';this.loading=AssetLoading;',box);
box.loading.init();box.loading.render();
assert(!element('assetLoading').hidden);assert.equal(element('assetLoadingPercent').textContent,'37%');assert.equal(element('assetLoadingProgress').attrs['aria-valuenow'],'37');assert.equal(element('assetLoadingFill').style.width,'37%');assert.equal(doc.activeElement,previous,'Progress must not steal focus');assert(element('assetBack').hidden&&element('assetRetry').hidden);
function event(key='d',allowed=false){return {key,target:{closest:selector=>allowed&&selector==='#assetLoading'?element('assetLoading'):null},preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}};}
let e=event();events.keydown[0](e);assert(e.stopped&&e.prevented);assert.equal(box.keys.size,0);assert.equal(box.pressed.size,0);
visuals.failures=['missing'];box.loading.render();assert.equal(doc.activeElement,element('assetLoadingText'));assert.equal(element('assetLoading').dataset.failed,'true');assert(!element('assetRetry').hidden&&!element('assetBack').hidden);
e=event('Tab',true);events.keydown[0](e);assert(e.prevented);assert.equal(doc.activeElement,element('assetRetry'));element('assetRetry').onclick();assert(visuals.retried);
visuals.failures=[];visuals.blocked=false;visuals.loaded=8;box.loading.render();assert(element('assetLoading').hidden);assert.equal(doc.activeElement,previous);assert.equal(element('assetLoadingPercent').textContent,'100%');
box.resolutionBlocked=true;visuals.blocked=true;visuals.failures=['missing'];doc.activeElement=element('resolutionNotice');box.loading.render();assert.equal(doc.activeElement,element('resolutionNotice'),'Minimum viewport notice retains focus priority');
const html=fs.readFileSync('index.html','utf8'),loading=html.match(/<section id="assetLoading"[\s\S]*?<\/section>/)[0];assert(!loading.includes('aria-modal'));assert(!loading.includes('panel-overlay'));assert(loading.includes('role="progressbar"'));assert(!fs.readFileSync('assets/css/style.css','utf8').includes('--loading-art'),'No duplicate full-screen painting or blurred overlay');
console.log('PASS: bottom loading percentage, no progress focus steal, frozen inputs, accessible error recovery and minimum viewport priority.');
