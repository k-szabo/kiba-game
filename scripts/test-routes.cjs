const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert');
const bootstrap=require('./test-only-bootstrap.cjs');
const elements=new Map();function el(){return{hidden:false,textContent:'',innerHTML:'',style:{},className:'',children:[],classList:{add(){},remove(){},contains(){return false}},setAttribute(){},replaceChildren(){this.children=[]},append(...x){this.children.push(...x)},prepend(){},focus(){},addEventListener(){}};}
const draw=new Proxy({createLinearGradient(){return{addColorStop(){}}},createRadialGradient(){return{addColorStop(){}}}},{get(t,k){return t[k]||(()=>{})}});
const storage=new Map(),sandbox={console,Math,Set,JSON,Image:class{complete=true;naturalWidth=1536},document:{getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id);},createElement:el,querySelectorAll(){return[]}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},innerWidth:1280,innerHeight:720,devicePixelRatio:1,addEventListener(){},matchMedia:()=>({matches:false}),requestAnimationFrame(){}};
sandbox.window=sandbox;sandbox.document.getElementById('world').getContext=()=>draw;vm.createContext(sandbox);
const inputFile=process.argv[2]||require('node:path').join(__dirname,'../assets/js/game.js');let source=fs.readFileSync(inputFile,'utf8');if(source.startsWith('<!doctype'))source=source.match(/<script>([\s\S]*)<\/script>/)[1];else {const dir=require('node:path').dirname(inputFile);const files=['keybindings.js','levels.js','art-data.js','graphics.js','progression.js','combat.js'].filter(f=>fs.existsSync(require('node:path').join(dir,f)));source=files.map(f=>fs.readFileSync(require('node:path').join(dir,f),'utf8')).join('\n')+'\n'+source;}vm.runInContext(bootstrap.before+source+bootstrap.after,sandbox);
const run=s=>vm.runInContext(s,sandbox),snap=()=>sandbox.momo.getState(),tick=(n=1)=>run(`for(let i=0;i<${n};i++)update(1/120);`),press=k=>run(`handleKeyDown({key:${JSON.stringify(k)},code:${JSON.stringify(k===' '?'Space':'')},repeat:false,preventDefault(){}});`),release=k=>run(`handleKeyUp({key:${JSON.stringify(k)},code:${JSON.stringify(k===' '?'Space':'')}});`),dismiss=()=>{if(snap().state==='dialog')elements.get('dialogOk').onclick();};
const place=(x,y)=>run(`initPlayer({x:${x},y:${y}});player.onGround=true;player.inv=999;`);
run('startGame();');dismiss();tick(30);assert.equal(snap().world.width,10400);assert.equal(snap().player.y+69,1000);
// Real keyboard path, second jump, repeat suppression, and landing recharge.
run('abilities[0]=true;');press(' ');tick(25);release(' ');press(' ');tick();assert.equal(snap().player.jumps,2);assert(snap().player.vy<-600);release(' ');tick(140);assert.equal(snap().player.jumps,0);
// The temple opens only after BOTH distant bells, not after the ability shrine.
assert.equal(run("gatePass(level.gates.find(g=>g.kind==='bells'))"),false);
for(const id of ['forestBell','villageBell']){const o=run(`level.objects.find(o=>o.id==='${id}')`);place(o.x,o.y);press('e');tick();release('e');assert(snap().flags[0].includes(id));dismiss();if(id==='forestBell')assert.equal(run("gatePass(level.gates.find(g=>g.kind==='bells'))"),false);}
assert.equal(run("gatePass(level.gates.find(g=>g.kind==='bells'))"),true);
function defeat(){const p=run('level.boss');place(p.x-60,p.y);run('bossStarted=true;boss.phase="recover";boss.clock=999;player.face=1;player.inv=999;');for(let i=0;i<80&&!snap().boss.dead;i++){press('j');tick(60);release('j');}assert(snap().boss.dead);dismiss();}
defeat();let exit=run('level.exit');place(exit.x,exit.y);press('e');tick();release('e');assert.equal(snap().realm,1);dismiss();assert.equal(snap().world.height,6250);
// Descend through a stone platform with S + Space. It cannot drop through a seal.
place(1530,450);tick();run("player.support='entry';keys.add('s');");press(' ');tick(35);release(' ');release('s');assert(snap().player.y+69>475);
// Cages remain locked while their assigned guards are alive.
const soul=run("level.objects.find(o=>o.id==='soulUpper')");place(soul.x,soul.y);press('e');tick();release('e');assert(!snap().flags[1].includes(soul.id));
for(const id of ['soulUpper','soulLower']){const o=run(`level.objects.find(o=>o.id==='${id}')`);const guards=run(`enemies.filter(e=>e.group==='${o.group}').map(e=>({id:e.id,x:e.x,y:e.y+e.h,kind:e.kind}))`);for(const e of guards){place(e.x-55,e.y);run('player.face=1;');for(let i=0;i<4;i++){if(e.kind==='shield'){place(e.x-40,e.y-58);run('player.face=1;player.onGround=false;');}press('j');tick(60);release('j');}}place(o.x,o.y);press('e');tick();release('e');assert(snap().flags[1].includes(id),'rescue did not release '+id);dismiss();}
assert(run("gatePass(level.gates.find(g=>g.kind==='souls'))"));const shrine=run('level.ability');place(shrine.x,shrine.y);press('e');tick();release('e');dismiss();assert(snap().abilities[1]);
// Checkpoint maps travel vertically and reset camera, including legacy saves.
run("visitedRests[1].push('shadow');fastTravel(level.rests.find(r=>r.id==='shadow'));draw();");assert.equal(snap().player.y+69,2700);assert(snap().cameraY>1700);
defeat();exit=run('level.exit');place(exit.x,exit.y);press('e');tick();release('e');assert.equal(snap().realm,2);dismiss();assert.equal(snap().world.height,6650);
// Wind is a real physical lift; the ascending camera follows it.
place(635,6300);press(' ');tick(180);release(' ');assert(snap().player.y+69<5900);assert(snap().cameraY<5500);
// The horizontal dawn seal blocks upward travel and can be cut FROM BELOW.
place(1980,1130);run('player.y=1078;player.onGround=false;');press('j');tick(30);release('j');assert(snap().flags[2].includes('dawnSeal'));
// Moving clouds carry a grounded player, rather than moving out from under them.
run("const cloud=platforms.find(p=>p.kind==='moving');initPlayer({x:cloud.x+90,y:cloud.y});player.onGround=true;player.support=cloud.id;");const cloudBefore=snap().player.x;run('movingPlatforms(.25);');assert.notEqual(snap().player.x,cloudBefore);
defeat();const father=run('level.father');place(father.x,father.y);press('e');tick();release('e');assert.equal(JSON.parse(storage.get('momo-three-worlds-v2')).won,true);dismiss();assert.equal(snap().state,'won');
const validateSave=require('./test-save-validation.cjs');for(const [index,record] of sandbox.__saveSnapshots.entries()){try{validateSave(JSON.parse(record));}catch(error){throw Error(`Game save #${index} failed production validation: ${error.message}`);}}
run('mainMenu();saved={version:1,realm:1,abilities:[false,false],defeated:[true,false,false],shards:21,checkpoint:2830};startGame(true);');assert(snap().abilities[0]);assert.equal(snap().player.y+69,450);assert.equal(snap().shards,21);assert.equal(snap().checkpoint.id,'start');
run('showMap();');assert(elements.get('mapContent').children.length>=3);run('closeMap();draw();');
console.log('PASS: double jump, both Japan bells, all three guardians and exits, cage combat/rescues, descent/drop-through, wind lift and vertical camera, upward seal strike, moving-cloud carry, map fast travel, summit ending, old-save migration.');

// Reachability search uses the actual input/gravity/landing/wind functions.
run(`
function routeLink(a,b,jumpTwice,wind){
 const startPoints=wind?[wind.x+wind.w/2]:[clamp(b.x+b.w/2,a.x+25,a.x+a.w-25),a.x+25,a.x+a.w-25];
 for(const start of startPoints){
  if(start<a.x||start>a.x+a.w)continue;
  let targetX=wind?clamp(wind.x+wind.w+130,b.x+25,b.x+b.w-25):clamp(start,b.x+25,b.x+b.w-25);
  const dropping=!wind&&b.y>a.y+40&&a.drop&&start>=b.x&&start<=b.x+b.w;
  if(!wind&&b.y>a.y+100&&!a.drop&&start>=b.x&&start<=b.x+b.w){const edges=[a.x-85,a.x+a.w+85].filter(x=>x>b.x+20&&x<b.x+b.w-20);if(edges.length)targetX=edges.sort((x,y)=>Math.abs(x-start)-Math.abs(y-start))[0];}
  initPlayer({x:start,y:a.y});player.onGround=true;player.support=a.id;keys.clear();pressed.clear();if(dropping)keys.add('s');pressed.add(' ');let second=false;
  for(let i=0;i<660;i++){
   const foot=player.y+69;const moving=(!wind||foot<b.y+85);
   keys.delete('a');keys.delete('d');const delta=targetX-(player.x+21.5);if(moving&&Math.abs(delta)>7)keys.add(delta>0?'d':'a');
   if(jumpTwice&&b.y<=a.y&&!wind&&!second&&i>24&&player.vy>-10&&!player.onGround){pressed.add(' ');second=true;}
   input(1/120);movePlayer(1/120);pressed.clear();jumpBuffer-=1/120;coyote-=1/120;dropTimer-=1/120;player.inv=999;
   if(player.onGround&&player.support===b.id)return true;
   if(!wind&&player.y>b.y+600||i>80&&player.onGround&&player.support!==a.id&&player.support!==b.id)break;
  }
 }
 return false;
}
function reachableFrom(startId,jumpTwice){
 const seen=new Set([startId]),queue=[startId];
 while(queue.length){const current=queue.shift();const a=platforms.find(p=>p.id===current);for(const b of platforms){if(seen.has(b.id)||b.kind==='moving')continue;const gap=Math.max(0,b.x-a.x-a.w,a.x-b.x-b.w);const wind=level.winds.find(w=>(!w.afterBoss||defeated[realm])&&w.x+w.w/2>=a.x&&w.x+w.w/2<=a.x+a.w&&Math.abs((w.y+w.h)-a.y)<140&&Math.abs(w.y-b.y)<220);
  if(!wind&&(a.y-b.y>(jumpTwice?250:115)||b.y-a.y>1400||gap>600))continue;
  if(routeLink(a,b,jumpTwice,wind)){seen.add(b.id);queue.push(b.id);}
 }}return [...seen];
}
state='play';abilities=[false,false];defeated=[false,false,false];flags=[[],[],[]];enterRealm(0);enemies=[];
var firstReach=reachableFrom('road0',false);
`);
let reach=run('firstReach');assert(reach.includes('wind-roof'),'Japan wind shrine inaccessible before double jump: '+reach.join(', '));
run("abilities=[true,false];flags[0]=['forestBell','villageBell'];enterRealm(0);var japanReach=reachableFrom('road0',true);");reach=run('japanReach');for(const id of ['forest-bell','village-bell','river-cave','road4','road5'])assert(reach.includes(id),'Japan route disconnected: '+id+'; reached '+reach.join(', '));
run("var caveReturn=reachableFrom('river-cave',true);");assert(run("caveReturn.includes('road4')"),'The river cave has no physical return route');
run("initPlayer({x:3000,y:950});player.onGround=true;player.support='road1';keys.clear();pressed.clear();keys.add('d');pressed.add(' ');for(let i=0;i<220;i++){if(i===42)pressed.add(' ');input(1/120);movePlayer(1/120);pressed.clear();jumpBuffer-=1/120;coyote-=1/120;if(player.x>3200)keys.clear();}");assert(snap().player.x>3165&&snap().player.onGround,'Double jump must safely clear the root wall');
run("abilities=[true,true];flags[1]=[];enterRealm(1);var cageReach=reachableFrom('entry',true);");for(const id of ['cage-left','ash-shrine','cage-right'])assert(run(`cageReach.includes('${id}')`),'Yomi objective inaccessible before releasing souls: '+id);
run("abilities=[true,true];flags[1]=['soulUpper','soulLower'];enterRealm(1);var yomiReach=reachableFrom('entry',true);");reach=run('yomiReach');for(const id of ['cage-left','ash-shrine','cage-right','bottom'])assert(reach.includes(id),'Yomi descent disconnected: '+id);
run("flags[2]=['dawnSeal','memorySeal'];defeated[2]=false;enterRealm(2);var heavenReach=reachableFrom('cloud-base',true);");reach=run('heavenReach');for(const id of ['first-island','second-launch','second-island','third-launch','third-island','fourth-launch','fourth-island','dawn-arena'])assert(reach.includes(id),'Heaven ascent disconnected: '+id+'; reached '+reach.join(', '));
run("defeated[2]=true;var summitReach=reachableFrom('dawn-arena',true);");assert(run("summitReach.includes('father-island')"),'Father summit inaccessible from the guardian arena');
console.log('PASS: physics-based route search reaches the wind shrine, both Japan bells and cave return, both Yomi cages and bottom arena, all five sky lifts, and the father summit.');








// Boss refuge ledges are genuinely reachable with the game's normal jump physics.
run("defeated[1]=false;flags[1]=['soulUpper','soulLower'];abilities=[true,true];enterRealm(1);var lavaLedges=platforms.filter(p=>p.bossPlatform).sort((a,b)=>a.x-b.x);");
assert(run("routeLink(platforms.find(p=>p.id==='bottom'),lavaLedges[0],false,null)"),'First lava refuge cannot be reached with a single jump');
for(let i=1;i<7;i++)assert(run(`routeLink(lavaLedges[${i-1}],lavaLedges[${i}],true,null)`),'Broken lava escape route: '+i);
console.log('PASS: all seven lava refuges have reachable jump connections.');

// Both optional relic locations have actual physical routes from the Japan entrance.
run("state='play';abilities=[true,true];defeated=[false,false,false];flags=[[],[],[]];enterRealm(0);var sealedRelicReach=reachableFrom('road0',true);flags[0].push('cultEntrance');var relicReach=reachableFrom('road0',true);");
for(const id of ['halo-altar','horn-vault'])assert(run(`relicReach.includes('${id}')`),'Hidden relic route is unreachable: '+id);
for(const id of ['tower-step4','tower-step5','tower-step6','tower-step7','tower-step8'])assert(run(`relicReach.includes('${id}')`),'Upper tower ascent is unreachable: '+id);
run("initPlayer({x:2340,y:760});resetCamera();");assert.equal(run('level.top'),-1100);assert(!run("visiblePoint({x:2800,y:-690},190)"),'The old angel is visible from the main-route shrine');
assert(!run("sealedRelicReach.includes('horn-vault')"),'The sect chamber can be reached through the unbroken entrance wall');
run("flags[0]=[];abilities=[false,false];enterRealm(0);var singleJumpSecrets=reachableFrom('road0',false);");assert(!run("singleJumpSecrets.includes('halo-altar')"),'The tower bypasses the double-jump platforming');
run("abilities=[true,false];flags[0]=['cultEntrance'];enterRealm(0);var towerReturn=reachableFrom('halo-altar',true);var cultReturn=reachableFrom('horn-vault',true);");assert(run("towerReturn.includes('road2')"),'No return route from the tower');assert(run("cultReturn.includes('river-cave')&&cultReturn.includes('road4')"),'No return route from the cult cave');
console.log('PASS: hidden tower requires double jump; sealed cult cave cannot be bypassed; both relics and return paths have physical routes.');
