const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const bootstrap=require('./test-only-bootstrap.cjs');
const runtimeModules=require('./runtime-modules.cjs');
// The harness provides catalogues, localization and storage, and skips the browser-only duel.
const harnessModules=runtimeModules.filter(name=>![
  'boss-catalog', 'npc-catalog', 'i18n', 'save-vault', 'duel-rules', 'peer-session',
  'duel-mode', 'save-manager',
].includes(name));
module.exports=function harness({prologue=false}={}){
  const elements=new Map(),storage=new Map();
  const element=()=>({hidden:false,disabled:false,textContent:'',innerHTML:'',style:{},dataset:{},children:[],classList:{add(){},remove(){}},setAttribute(){},getClientRects:()=>[{}],getContext:()=>draw,querySelector:()=>({scrollTop:0}),querySelectorAll:()=>[],replaceChildren(){this.children=[];},append(...items){this.children.push(...items);},focus(){},addEventListener(){}});
  const draw=new Proxy({measureText:text=>({width:String(text).length*7}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
  const sandbox={console,Math,Set,JSON,Promise,Image:class{complete=true;naturalWidth=1536;naturalHeight=1024;addEventListener(){}},document:{addEventListener(){},getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},createElement:element,querySelectorAll:()=>[]},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},innerWidth:1280,innerHeight:720,devicePixelRatio:1,addEventListener(){},matchMedia:()=>({matches:false}),requestAnimationFrame(){}};
  // Test-only helpers for synthetic combat arenas; production maps come from JSON.
  Object.assign(sandbox,{
    makeLevel:(id,width,height,start)=>({id,width,height,start,platforms:[],rests:[],objects:[],gates:[],winds:[],hazards:[],enemies:[],zones:[]}),
    ledge:(map,id,x,y,w,kind='stone',h=28)=>map.platforms.push({id,x,y,w,h,kind,drop:kind!=='ground',baseX:x}),
    rest:(map,id,x,y,name)=>map.rests.push({id,x,y,name}),
    foe:(map,id,x,y,kind='guard',group=null,patrol=65)=>map.enemies.push({id,x,y,kind,group,patrol}),
    zone:(map,name,x,y,w,h)=>map.zones.push({name,x,y,w,h}),
  });
  sandbox.window=sandbox;sandbox.document.getElementById('world').getContext=()=>draw;vm.createContext(sandbox);
  vm.runInContext(bootstrap.before,sandbox);
  const mapDir=path.join(__dirname,'../assets/config/maps'),mapData=Object.fromEntries(fs.readdirSync(mapDir).filter(name=>name.endsWith('.json')).map(name=>{const record=JSON.parse(fs.readFileSync(path.join(mapDir,name),'utf8').replace(/^\uFEFF/,''));return [record.id,record];}));
  vm.runInContext('const MAP_DATA='+JSON.stringify(mapData)+';',sandbox);
  const npcDir=path.join(__dirname,'../assets/config/npcs'),npcData=Object.fromEntries(fs.readdirSync(npcDir).filter(name=>name.endsWith('.json')).map(name=>{const record=JSON.parse(fs.readFileSync(path.join(npcDir,name),'utf8'));return [record.id,record];}));
  vm.runInContext('const NPC_DATA='+JSON.stringify(npcData)+';\n'+fs.readFileSync(path.join(__dirname,'../assets/js/npc-catalog.js'),'utf8'),sandbox);
  for(const name of harnessModules)vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js',name+'.js'),'utf8'),sandbox,{filename:name+'.js'});
  vm.runInContext(bootstrap.after,sandbox);
  const run=s=>vm.runInContext(s,sandbox),snap=()=>sandbox.momo.getState(),tick=(n=1)=>run(`for(let i=0;i<${n};i++)update(1/120);`);
  // Explicit action inputs resolve the selected profile and enter the real
  // keyboard/mouse handlers. Literal keys are intentionally never translated.
  const keyFor=value=>value&&typeof value==='object'?run('Bindings.read('+JSON.stringify(value.action)+')[0]'):value;
  const sendInput=(value,down)=>{const key=keyFor(value);if(/^mouse[0-4]$/.test(key))return run('handleMouse'+(down?'Down':'Up')+'({button:'+Number(key.slice(5))+',pointerType:"mouse",target:canvas,preventDefault(){},stopPropagation(){}})');return run((down?'handleKeyDown':'handleKeyUp')+'({key:'+JSON.stringify(key)+',code:'+JSON.stringify(key===' '?'Space':'')+',repeat:false,preventDefault(){}})');};
  const press=value=>sendInput(value,true),release=value=>sendInput(value,false);
  const dismiss=()=>{for(let n=0;snap().state==='dialog'&&n<50;n++)elements.get('dialogOk').onclick();if(run("state==='weaponSelection'"))run('WeaponSelection.confirm()');},place=(x,y)=>run(`initPlayer({x:${x},y:${y}});player.onGround=true;player.inv=999;`);
  run('startGame();');if(!prologue)run('Prologue.wake();');dismiss();
  return {run,snap,tick,press,release,dismiss,place,elements,storage,sandbox};
};
