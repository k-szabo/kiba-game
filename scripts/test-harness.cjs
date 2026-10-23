const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const bootstrap=require('./test-only-bootstrap.cjs');
module.exports=function harness({prologue=false}={}){
  const elements=new Map(),storage=new Map();
  const element=()=>({hidden:false,disabled:false,textContent:'',innerHTML:'',style:{},dataset:{},children:[],classList:{add(){},remove(){}},setAttribute(){},getContext:()=>draw,querySelector:()=>({scrollTop:0}),querySelectorAll:()=>[],replaceChildren(){this.children=[];},append(...items){this.children.push(...items);},focus(){},addEventListener(){}});
  const draw=new Proxy({measureText:text=>({width:String(text).length*7}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
  const sandbox={console,Math,Set,JSON,Promise,Image:class{complete=true;naturalWidth=1536;addEventListener(){}},document:{getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},createElement:element,querySelectorAll:()=>[]},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},innerWidth:1280,innerHeight:720,devicePixelRatio:1,addEventListener(){},matchMedia:()=>({matches:false}),requestAnimationFrame(){}};
  sandbox.window=sandbox;sandbox.document.getElementById('world').getContext=()=>draw;vm.createContext(sandbox);
  vm.runInContext(bootstrap.before,sandbox);
  for(const name of ['keybindings','levels','art-data','boss-vfx','graphics','weapons','weapon-selection','progression','combat','doom-slayer','slayer-art','shadow-realm','shadow-animation','prologue','inventory','merchant','compass','slayer-dialog','bug-report','dev-session','dev-tools','dev-boss','dev-teleport','dev-level','dev-items','dev-abilities','dev-immortality','dev-damage','game'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js',name+'.js'),'utf8'),sandbox,{filename:name+'.js'});
  vm.runInContext(bootstrap.after,sandbox);
  const run=s=>vm.runInContext(s,sandbox),snap=()=>sandbox.momo.getState(),tick=(n=1)=>run(`for(let i=0;i<${n};i++)update(1/120);`);
  const press=k=>run(`handleKeyDown({key:${JSON.stringify(k)},code:${JSON.stringify(k===' '?'Space':'')},repeat:false,preventDefault(){}});`),release=k=>run(`handleKeyUp({key:${JSON.stringify(k)},code:${JSON.stringify(k===' '?'Space':'')}});`);
  const dismiss=()=>{for(let n=0;snap().state==='dialog'&&n<50;n++)elements.get('dialogOk').onclick();},place=(x,y)=>run(`initPlayer({x:${x},y:${y}});player.onGround=true;player.inv=999;`);
  run('startGame();');if(!prologue)run('Prologue.wake();');dismiss();
  return {run,snap,tick,press,release,dismiss,place,elements,storage,sandbox};
};
