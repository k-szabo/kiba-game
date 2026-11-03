const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const loads=[];let active=0,maximum=0;
const manifest=Object.fromEntries(['japanBackdrop','terrain','props','a','b','c','d','e','f','g','h'].map(key=>[key,'assets/images/'+key+'.png']));
const box=vm.createContext({Promise,Set,Map,WeakMap,Proxy,Image:class{complete=false;naturalWidth=0;},ART_MANIFEST:manifest,
 document:{getElementById:()=>null},I18n:{t:x=>x,format:x=>x},AssetCache:{load(image,source,done){active++;maximum=Math.max(maximum,active);loads.push({image,source,finish(ok=true){active--;image.complete=true;image.naturalWidth=ok?100:0;done(ok);}});}}});
vm.runInContext(fs.readFileSync('assets/js/graphics.js','utf8')+'\nthis.visuals=Visuals;',box);const v=box.visuals;
assert.equal(loads.length,3,'Boot requests only the menu bundle');assert(v.blocked);assert.equal(v.peek('a'),undefined);assert.equal(loads.length,3,'Identity queries never trigger downloads');
loads.slice().forEach(load=>load.finish());assert(!v.blocked);
v.scope('world',['a','b','c','d','e']);assert.equal(loads.length,7);assert(v.blocked);assert.equal(maximum,4,'Network/decode concurrency is bounded');
v.scope('different',['f']);assert(!v.peek('e'),'Queued abandoned-scene request is cancelled');
loads[3].finish(false);assert.deepEqual(Array.from(v.failures),[],'Old scene failure cannot block current travel');loads[4].finish();loads[5].finish();loads[6].finish();assert(v.blocked);
const f=loads.find(load=>load.source.endsWith('/f.png'));assert(f);f.finish(false);assert.equal(v.failures.length,1);v.retry();assert(v.blocked);loads.at(-1).finish();assert(!v.blocked);
v.beginFrame();void v.images.b;v.endFrame();assert(!v.blocked);v.beginFrame();void v.images.e;v.endFrame();assert(v.blocked,'A new rendered dependency freezes the next gameplay step');loads.at(-1).finish();assert(!v.blocked);
let redraws=0;v.onLoad(()=>redraws++);v.prefetch(['g']);loads.at(-1).finish();assert.equal(redraws,0,'Speculative completion cannot reset an active panel or sale confirmation');
Object.assign(box,{state:'dialog',Prologue:{active:true},level:{id:'dream'},weaponStyle:'katana',enemies:[],Dialogue:{render(){redraws++;void v.images.h;}}});
vm.runInContext(fs.readFileSync('assets/js/asset-loading.js','utf8')+'\nthis.loading=AssetLoading;',box);
void v.images.h;box.loading.prepare();assert(v.blocked,'Portrait demand survives the next frame replacing the scene scope');assert.equal(redraws,1);box.loading.prepare();assert.equal(redraws,1,'An unchanged scene does not rebuild the panel every frame');loads.at(-1).finish();assert(!v.blocked);
const h=require('./test-harness.cjs')();const r=h.run;r('var oldBlocked=Object.getOwnPropertyDescriptor(Visuals,"blocked");Object.defineProperty(Visuals,"blocked",{configurable:true,get:()=>true});');
const before=r('JSON.stringify([player,attack,dash,dashCooldown,levelTime,time])');r('update(1)');assert.equal(r('JSON.stringify([player,attack,dash,dashCooldown,levelTime,time])'),before,'Loading freezes gameplay before timers/physics');
r('var DuelMode={active:true,seen:null,update(dt,blocked){this.seen={dt,blocked};}};update(.01)');assert(r('DuelMode.seen.blocked'),'Duel retains its update and receives the existing network pause signal');
r('Object.defineProperty(Visuals,"blocked",oldBlocked)');
// Map plans must include assets before camera exploration, future phases or
// minion spawning first asks the renderer for them. No full-catalog preload.
{
 const calls=[],planBox=vm.createContext({state:'play',realm:0,weaponStyle:'katana',enemies:[],flags:[[],[],[],[]],Prologue:{active:false},DuelMode:{active:false},TowerMode:{active:false},Visuals:{blocked:true,scope(token,keys){calls.push({token,keys});return true;}},Dialogue:{render(){}},Inventory:{render(){},quantity(){return 0;}},Merchant:{render(){}}});
 vm.runInContext(fs.readFileSync('assets/js/art-data.js','utf8')+'\nthis.manifest=ART_MANIFEST;',planBox);
 vm.runInContext(fs.readFileSync('assets/js/asset-loading.js','utf8')+'\nthis.loading=AssetLoading;',planBox);
 const plan=(id,extra={})=>{planBox.level={id,...extra};planBox.loading.prepare();const result=calls.at(-1);for(const key of result.keys)assert(Object.hasOwn(planBox.manifest,key)||['momoSheet','menuSheet'].includes(key),'Unknown planned asset '+key);assert(new Set(result.keys).size<Object.keys(planBox.manifest).length/2,'A scene must not preload the full catalog');return result;};
 const maps=JSON.parse(r('JSON.stringify([levels.map(m=>m.id),Object.keys(SIDE_LOCATIONS)])')).flat();
 for(const id of maps)assert(plan(id).keys.length>15,'Scene bundle '+id);
 for(const [id,expected]of Object.entries({japan:['whiteSerpentBackdrop','whiteSerpent','angelRuinBackdrop','cultCaveWall','oldCultist','samuraiJump'],yomi:['slayerArena','slayerRanged','slayerDaisy','slayerLightning','lavaSerpent'],heaven:['heavenDarkBackdrop','heavenEclipseBackdrop','wingedSerpentBackdrop','angelEclipse'],shadowPrison:['fiaPrisonDepths','prisonHunter','fiaFoxDead','zenPriestess'],shadowArena:['arenaCaptain','arenaCyclops','arenaSerpent','fiaArenaCasting','fiaArenaWalk'],zigguratSummit:['hannahCombo','hannahRitual','zigguratStorm','momoDawnblade','slayerLightning'],dragonCatacombs:['dragonFlight','dragonFront','dragonStagger','haruBindingPillar'],fiaRitual:['fiaRitualPowers','fiaAttendantSpirits','fiaRitualAttendants'],shadowUnderworld:['fiaUnderworldCorrupted','denNinja','arenaCyclops'],voidForbidden:['voidKeepers','voidLieutenant','voidDemon']})){
  const keys=plan(id).keys;for(const key of expected)assert(keys.includes(key),id+' must preload '+key);
 }
 const before=plan('shadowArena');planBox.state='dialog';planBox.enemies=[{miniboss:'arenaFia'}];const after=plan('shadowArena');assert.equal(after.token,before.token,'Dialogues and future actors cannot discard the current scene scope');
 planBox.Prologue.active=true;assert(plan('dream').keys.includes('momoRoom'),'Awakening is ready before prologue combat finishes');planBox.Prologue.active=false;
 planBox.state='menu';const menu=plan('japan');assert.equal(new Set(menu.keys).size,5,'Main-menu package stays small');
 planBox.state='towerConfirm';planBox.TowerMode.active=true;const tower=plan('infiniteTower');assert(tower.keys.includes('towerBackdrop'));for(const key of ['arenaCaptain','arenaSerpent','arenaCyclops','dungeonCaptain','dungeonCouncil','cultTempleGuard','cultWoundedAngel'])assert(tower.keys.includes(key));
}
// Inspect actual drawing dependencies at multiple depths/ends of every registered
// scene. Read-only fake Image properties let private renderer accesses be seen
// without adding a debug export or triggering any network requests.
{
 const audit=require('./test-harness.cjs')(),run=audit.run;
 run("var sceneReads=new Set(),scenePlan=new Set(),originalSceneScope=Visuals.scope;Visuals.scope=(token,keys)=>{scenePlan=new Set(keys);return originalSceneScope(token,keys)};for(const key of Object.keys(ART_MANIFEST))Visuals.images[key]={get complete(){sceneReads.add(key);return true},naturalWidth:1536,naturalHeight:1024};DevSession.begin();Prologue.stop();");
 const scenes=JSON.parse(run('JSON.stringify([...levels.map((map,realm)=>({id:map.id,realm})),...Object.entries(SIDE_LOCATIONS).map(([id,spec])=>({id,realm:spec.realm}))])'));
 for(const scene of scenes){
  const entry=['japan','yomi','heaven','shadowRealm'].includes(scene.id)?'enterRealm('+scene.realm+')':'CampQuest.enter('+JSON.stringify(scene.id)+',{save:false})';
  run(`Prologue.stop();${entry};state='play';AssetLoading.prepare();sceneReads.clear();for(const x of [0,level.width*.45,Math.max(0,level.width-viewW)])for(const y of [level.top||0,level.height*.45,Math.max(0,level.height-H)]){camera=x;cameraY=y;player.x=x+viewW/2;player.y=y+H*.6;draw();}`);
  assert.deepEqual(JSON.parse(run('JSON.stringify([...sceneReads].filter(key=>!scenePlan.has(key)))')),[],scene.id+' must plan every rendered image before exploration');
 }
}
console.log('PASS: menu-only boot, bounded lazy requests, peek without download, abandoned queue/failure isolation, retry, render demands, frozen gameplay clocks and duel pause propagation.');
