const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const bootstrap=require('./test-only-bootstrap.cjs');
module.exports=function harness({prologue=false}={}){
  const elements=new Map(),storage=new Map();
  const element=()=>({hidden:false,disabled:false,textContent:'',innerHTML:'',style:{},dataset:{},children:[],classList:{add(){},remove(){}},setAttribute(){},getClientRects:()=>[{}],getContext:()=>draw,querySelector:()=>({scrollTop:0}),querySelectorAll:()=>[],replaceChildren(){this.children=[];},append(...items){this.children.push(...items);},focus(){},addEventListener(){}});
  const draw=new Proxy({measureText:text=>({width:String(text).length*7}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
  const sandbox={console,Math,Set,JSON,Promise,Image:class{complete=true;naturalWidth=1536;naturalHeight=1024;addEventListener(){}},document:{getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},createElement:element,querySelectorAll:()=>[]},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},innerWidth:1280,innerHeight:720,devicePixelRatio:1,addEventListener(){},matchMedia:()=>({matches:false}),requestAnimationFrame(){}};
  sandbox.window=sandbox;sandbox.document.getElementById('world').getContext=()=>draw;vm.createContext(sandbox);
  vm.runInContext(bootstrap.before,sandbox);
  for(const name of ['keybindings','dungeon-rules','ziggurat-maps','levels','camp-services','serpent-relics','camp-health','art-data','hannah-art-data','asset-cache','background-motion','background-framing','boss-vfx','graphics','armor','weapons','weapon-equipment','weapon-selection','progression','serpents','combat','camp-master','prison-warden','prison-hunter','prison-quest','kitsune-quest','prison-art','kitsune-art','arena-combat','arena-challenge','arena-art','fia-quest','fia-conflict','fia-combat','fia-art','hannah-rules','hannah-combat','hannah-encounter','dawnblade','hannah-art','dungeon-combat','dungeon-run','dungeon-art','doom-slayer','slayer-art','serpent-art','shadow-realm','shadow-animation','prologue','inventory','merchant','compass','slayer-dialog','bug-report','dev-session','dev-tools','dev-cache','dev-boss','dev-teleport','dev-level','dev-items','dev-abilities','dev-weapons','dev-immortality','dev-damage','camp-quest','camp-workshop','camp-herbs','camp-art','cursor','game'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js',name+'.js'),'utf8'),sandbox,{filename:name+'.js'});
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
