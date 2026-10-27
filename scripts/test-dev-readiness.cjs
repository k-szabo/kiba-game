'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const game=fs.readFileSync('assets/js/game.js','utf8').split('\n');
const callbacks=game.filter(line=>line.startsWith('SaveVault.ready.then(')||line.startsWith('AssetCache.load(sheet,')).join('\n');
function fixture(){
 let resolveStorage,resolveArt;const elements=new Map();
 const element=()=>({children:[],hidden:false,disabled:false,inert:false,style:{},textContent:'',getClientRects(){return this.hidden?[]:[{}];},setAttribute(){},addEventListener(){},replaceChildren(){this.children=[];},append(child){this.children.push(child);},focus(){}});
 const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
 const context=vm.createContext({console,Map,Set,Promise,document:{getElementById:get,createElement:element},
  Visuals:{loaded:0,total:1,failures:[],ready:new Promise(resolve=>resolveArt=resolve)},
  SaveVault:{notice:'',ready:new Promise(resolve=>resolveStorage=resolve)},
  AssetCache:{load(image,source,done){image.onload=()=>done(true);image.onerror=()=>done(false);}},
  sheet:{complete:false,naturalWidth:0},I18n:{t:x=>x,format:x=>x,onChange(){}},GAME_RELEASE:{version:'test'},
  toast(){},addEventListener(){},location:{hash:''}
 });
 context.window=context;context.$=get;get('game').children=[get('devPanel')];
 const run=s=>vm.runInContext(s,context);
 run("let state='menu',saved=null,storageReady=false,loadingReady=false,resolutionBlocked=false;const keys=new Set(),pressed=new Set();");
 for(const name of ['dev-session','dev-tools'])run(fs.readFileSync('assets/js/'+name+'.js','utf8'));
 run(callbacks+'\nDevSession.init();DevTools.init();DevTools.open();');
 const disabled=()=>get('devToolsList').children.find(b=>b.id==='dev-tool-test-start').disabled;
 async function complete(kind,failed=false){
  if(kind==='storage')resolveStorage(null);
  if(kind==='sheet')context.sheet[failed?'onerror':'onload']();
  if(kind==='art'){context.Visuals.loaded=1;if(failed)context.Visuals.failures.push('missing');resolveArt();}
  await Promise.resolve();await Promise.resolve();
 }
 return {run,get,disabled,complete};
}
(async()=>{
 for(const order of [['storage','sheet','art'],['storage','art','sheet'],['sheet','storage','art'],['sheet','art','storage'],['art','storage','sheet'],['art','sheet','storage']]){
  const f=fixture();assert(f.disabled());
  for(let i=0;i<order.length;i++){await f.complete(order[i]);assert.equal(f.disabled(),i<2,order.join('/')+' step '+i);}
  assert.equal(f.run('DevSession.active'),false,'Readiness does not start a test');assert.equal(f.run('saved'),null);
 }
 const failed=fixture();await failed.complete('storage');await failed.complete('sheet');await failed.complete('art',true);
 assert(failed.disabled(),'Missing artwork must keep test entry disabled');
 const failedSheet=fixture();await failedSheet.complete('storage');await failedSheet.complete('sheet',true);await failedSheet.complete('art');assert(failedSheet.disabled(),'Failed cached/native Momo image keeps test entry disabled');
 const closed=fixture();closed.run('DevTools.close()');
 for(const kind of ['storage','sheet','art'])await closed.complete(kind);
 assert.equal(closed.run('DevTools.isOpen'),false,'Completion never reopens a closed panel');assert(closed.get('devPanel').hidden);
 console.log('PASS: already-open developer panel refreshes on all six storage/sheet/art orders, remains disabled on failed art, and never auto-starts or reopens.');
})().catch(error=>{console.error(error);process.exitCode=1;});
