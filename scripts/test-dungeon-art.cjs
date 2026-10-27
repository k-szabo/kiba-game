'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),vm=require('node:vm');
const h=require('./test-harness.cjs')(),r=h.run,art=JSON.parse(r('JSON.stringify(ART_DUNGEON)')),cult=JSON.parse(r('JSON.stringify(ART_CULT_DUNGEON)')),allActors={...art,...cult},manifest=r('ART_MANIFEST'),root=path.resolve(__dirname,'..'),pixels=new Map();
function png(key){
 assert.equal(typeof manifest[key],'string','Image '+key+' is registered');const file=path.join(root,manifest[key]);assert(fs.existsSync(file),'Native asset exists: '+manifest[key]);const data=fs.readFileSync(file);assert.equal(data.toString('hex',0,8),'89504e470d0a1a0a');return {data,w:data.readUInt32BE(16),h:data.readUInt32BE(20)};
}
function rgba(key){
 if(pixels.has(key))return pixels.get(key);const {data,w,h}=png(key),parts=[];assert.equal(data[24],8,'Native sprites use8-bit channels');assert.equal(data[25],6,'Native sprite alpha channel is retained');assert.equal(data[28],0,'Supported noninterlaced PNG');
 for(let at=8;at<data.length;){const length=data.readUInt32BE(at);if(data.toString('ascii',at+4,at+8)==='IDAT')parts.push(data.subarray(at+8,at+8+length));at+=length+12;}
 const raw=zlib.inflateSync(Buffer.concat(parts)),stride=w*4,out=Buffer.alloc(stride*h);assert.equal(raw.length,(stride+1)*h);
 for(let y=0;y<h;y++)for(let x=0;x<stride;x++){
  const filter=raw[y*(stride+1)],a=x>=4?out[y*stride+x-4]:0,b=y?out[(y-1)*stride+x]:0,c=y&&x>=4?out[(y-1)*stride+x-4]:0,p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
  assert(filter<=4,'Known PNG row filter');out[y*stride+x]=(raw[y*(stride+1)+x+1]+[0,a,b,(a+b)>>1,pa<=pb&&pa<=pc?a:pb<=pc?b:c][filter])&255;
 }
 const result={w,h,out};pixels.set(key,result);return result;
}
function rectInImage(rect,image,label){
 assert([rect.x,rect.y,rect.w,rect.h].every(Number.isFinite),label+' has finite crop geometry');assert(rect.w>0&&rect.h>0);assert(rect.x>=0&&rect.y>=0&&rect.x+rect.w<=image.w&&rect.y+rect.h<=image.h,label+' stays within the native bitmap');
}
for(const role of ['captain','necromancer','council','templeGuard','woundedAngel','highPriestess']){
 const definition=allActors[role];assert.equal(definition.frames.length,6,role+' has all six approved poses');assert([-1,1].includes(definition.facing));
 for(const [index,frame]of definition.frames.entries()){
  const label=role+' pose'+index,image=rgba(frame.image||definition.image);rectInImage(frame,image,label);assert(frame.bodyHeight>0);assert.equal(frame.bodyHeight,definition.frames[0].bodyHeight,label+' keeps a fixed body scale');
  assert(frame.anchorX>=frame.x&&frame.anchorX<frame.x+frame.w&&frame.anchorY>=frame.y&&frame.anchorY<frame.y+frame.h,label+' foot anchor belongs to its complete crop');
  assert(Array.isArray(frame.visibleBounds)&&frame.visibleBounds.length===4);const [left,top,right,bottom]=frame.visibleBounds;assert(left>=frame.x&&top>=frame.y&&right<=frame.x+frame.w&&bottom<=frame.y+frame.h&&left<right&&top<bottom,label+' visible bounds are contained');
  assert(Math.abs(bottom-frame.anchorY)<10,label+' has a stable ground reference');assert(Array.isArray(frame.outlines)&&frame.outlines.length>0,label+' retains complete silhouette outlines');
  assert(frame.outlines.every(outline=>outline.length>10&&outline.every(([x,y])=>Number.isFinite(x)&&Number.isFinite(y)&&x>=frame.x&&x<=frame.x+frame.w&&y>=frame.y&&y<=frame.y+frame.h)),label+' outlines contain finite points inside the crop');
  let ink=0;for(let y=frame.y;y<frame.y+frame.h;y++)for(let x=frame.x;x<frame.x+frame.w;x++)if(image.out[(y*image.w+x)*4+3]>32)ink++;assert(ink>1000,label+' contains native nonempty alpha pixels');
 }
}
for(const [name,rect]of Object.entries(art.props)){
 assert(['scroll','closedChest','openChest'].includes(name));rectInImage(rect,png(rect.image),name);assert(rect.bodyHeight>0);assert(rect.anchorX>=rect.x&&rect.anchorX<rect.x+rect.w&&rect.anchorY>=rect.y&&rect.anchorY<rect.y+rect.h);
}
assert.deepEqual(Object.keys(art.props).sort(),['closedChest','openChest','scroll']);assert.equal(art.backdrops.length,3);
r('DevTools.open();DevSession.begin();DevTools.close();');
const ctx=h.sandbox.document.getElementById('world').getContext('2d');let calls=[],scales=[];ctx.drawImage=(image,...args)=>calls.push({image,args});ctx.scale=(...args)=>scales.push(args);
const snapshot=()=>r('JSON.stringify([player,enemies,projectiles,flags,platforms,progression,dungeonState,DungeonRun.pending,time,levelTime])');
for(const [floor,type,role]of [[0,'dungeonCaptain','captain'],[1,'dungeonNecromancer','necromancer'],[2,'dungeonCouncil','council'],[3,'cultTempleGuard','templeGuard'],[4,'woundedAngel','woundedAngel'],[5,'cultHighPriestess','highPriestess']]){
 const atlas=allActors;assert(r('CampQuest.enter([ ...DUNGEON_FLOORS,...CULT_DUNGEON_FLOORS]['+floor+'].id)'));r('enemies=[DungeonCombat.create(level.enemies.find(e=>e.miniboss==='+JSON.stringify(type)+'))];window.renderDungeonEnemy=enemies[0];renderDungeonEnemy.active=true;reducedMotion.matches=false;');
 for(const pose of [0,1,2,3,4,5])for(const face of [-1,1]){
  r('renderDungeonEnemy.poseIndex='+pose+';renderDungeonEnemy.face='+face+';renderDungeonEnemy.phase="strike";renderDungeonEnemy.move=null;');const before=snapshot();calls=[];scales=[];assert(r('DungeonArt.actor(renderDungeonEnemy)'));assert.equal(snapshot(),before,'Every pose is rendered without advancing combat or journey state');assert.equal(calls.length,1,'One complete native body is drawn per pose');
  const call=calls[0],frame=atlas[role].frames[pose],[sx,sy,sw,sh,dx,dy,dw,dh]=call.args,body=r('renderDungeonEnemy.h');assert.equal(call.image,r('Visuals.images['+JSON.stringify(frame.image||atlas[role].image)+']'));assert.deepEqual([sx,sy,sw,sh],[frame.x,frame.y,frame.w,frame.h]);assert(Math.abs(dw/sw-dh/sh)<1e-10,'Weapons and bodies retain their aspect ratio');assert(Math.abs(dw/sw-body/frame.bodyHeight)<1e-10,'Every pose uses its registered fixed body scale');assert(Math.abs(dx-(frame.x-frame.anchorX)*body/frame.bodyHeight)<1e-10);assert(Math.abs(dy-(frame.y-frame.anchorY)*body/frame.bodyHeight)<1e-10);assert(scales.some(([x,y])=>x===face*atlas[role].facing&&y===1),'Facing mirrors only the full registered silhouette');
 }
 r('renderDungeonEnemy.dead=true;');calls=[];assert(r('DungeonArt.actor(renderDungeonEnemy)'));assert.equal(calls.length,0,'Dead bodies are not redrawn as live enemies');
 const before=snapshot();assert(!r('DungeonArt.actor({kind:"guard",dead:false})'));assert.equal(snapshot(),before);
 const colliders=r('JSON.stringify(platforms)');r('camera=0;cameraY=Math.max(0,platforms[0].y-H*.5);');calls=[];r('Visuals.terrain(realms[realm],platforms);');assert(calls.some(call=>call.image===r('Visuals.images.prisonTerrain')),'Native terrain is reached through the real dispatcher on floor'+floor);assert(!calls.some(call=>call.image===r('Visuals.images.terrain')),'Legacy stretched terrain is not used');assert.equal(r('JSON.stringify(platforms)'),colliders);
}
// Height variants run the unchanged rendering module in a private VM with mocked
// Canvas only. Production H is fixed720; no shipped source or mutable export is edited.
const floors=JSON.parse(r('JSON.stringify(DUNGEON_FLOORS)')),artSource=fs.readFileSync(path.join(root,'assets/js/dungeon-art.js'),'utf8');
for(const height of [720,1080]){
 let floorIndex=0,paint=[];const images={};for(const a of art.backdrops)for(const key of a.panels||[a.image]){const image=png(key);assert.equal(image.w,a.w);assert.equal(image.h,a.h);images[key]={key,complete:true,naturalWidth:image.w,naturalHeight:image.h};}
 const draw={save(){},restore(){},fillRect(...args){paint.push({fill:true,args});},drawImage(image,...args){paint.push({image,args});},createLinearGradient(){return {addColorStop(){}};}};
 const surface=()=>({width:0,height:0,getContext:()=>draw});
 const sandbox={ART_DUNGEON:art,Visuals:{images},BackgroundMotion:{draw:(...args)=>draw.drawImage(...args),alias:surface=>surface},DungeonRun:{active:()=>true,floor:()=>floorIndex,dungeonId:()=> 'yomiFall'},ctx:draw,document:{createElement:surface},Math,H:height,viewW:1280,camera:0,cameraY:0,level:floors[0],clamp:(n,min,max)=>Math.max(min,Math.min(max,n))};vm.createContext(sandbox);vm.runInContext(artSource,sandbox);
 for(floorIndex=0;floorIndex<3;floorIndex++)for(const width of [1280,1920,2560,3840])for(const endX of [false,true])for(const endY of [false,true]){
  sandbox.level=floors[floorIndex];sandbox.viewW=width;sandbox.camera=endX?Math.max(0,sandbox.level.width-width):0;sandbox.cameraY=endY?Math.max(0,sandbox.level.height-height):0;paint=[];const before=JSON.stringify([sandbox.level,sandbox.camera,sandbox.cameraY]);assert(vm.runInContext('DungeonArt.backdrop()',sandbox));assert.equal(JSON.stringify([sandbox.level,sandbox.camera,sandbox.cameraY]),before);
  assert(paint.some(call=>call.fill&&call.args[0]===0&&call.args[1]===0&&call.args[2]===width&&call.args[3]===height),'All views repaint the whole canvas');const rects=paint.filter(call=>!call.fill&&call.args.length===4).map(call=>call.args);assert(rects.length>0);assert(rects[0][0]<=1e-7&&rects.at(-1)[0]+rects.at(-1)[2]>=width-1e-7,'Camera extremes keep the entire supported width covered');
  if(floorIndex>0)assert(rects[0][1]<=1e-7&&rects[0][1]+rects[0][3]>=height-1e-7,'Interior imagery covers the full canvas height at every camera extreme');else assert(rects.every(rect=>rect[1]<=1e-7),'The courtyard never exposes empty sky above its image');
 }
}
{
 const actors=r('DungeonArt.actors()');for(const type of ['dungeonCaptain','dungeonNecromancer','dungeonCouncil']){assert(actors[type]);const role={dungeonCaptain:'captain',dungeonNecromancer:'necromancer',dungeonCouncil:'council'}[type],frame=art[role].frames[0],b=frame.visibleBounds;assert.equal(actors[type].name,r('DungeonCombat.profiles['+JSON.stringify(type)+'].name'));assert.equal(actors[type].rect.x,b[0]);assert.equal(actors[type].rect.y,b[1]);assert.equal(actors[type].rect.w,b[2]-b[0]);assert.equal(actors[type].rect.h,b[3]-b[1]);}
 r('enterRealm(1);flags[1].push("councilGateOpen");enterCouncilHall();');const before=snapshot();calls=[];r('DungeonArt.scenery();');assert.equal(snapshot(),before);assert(calls.some(call=>call.image===r('Visuals.images[ART_DUNGEON.props.scroll.image]')&&call.args[0]===art.props.scroll.x&&call.args[1]===art.props.scroll.y),'The hall draws its registered native scroll');
 r('CampQuest.enter("yomiDungeon3");');for(const opened of [false,true]){r('flags[1]=flags[1].filter(id=>id!=="dungeonChestClaimed");'+(opened?'flags[1].push("dungeonChestClaimed");':''));const before=snapshot();calls=[];r('DungeonArt.scenery();');assert.equal(snapshot(),before);const frame=art.props[opened?'openChest':'closedChest'];assert(calls.some(call=>call.image===r('Visuals.images['+JSON.stringify(frame.image)+']')&&call.args[0]===frame.x&&call.args[1]===frame.y&&call.args[2]===frame.w&&call.args[3]===frame.h),'Chest uses its registered '+(opened?'open':'closed')+' crop');}
}
for(const id of ['dungeonSeal','weaponEnhancement','armorEnhancement','spiritEnhancement','councilSoul']){
 const item=r('ART_INVENTORY.items['+JSON.stringify(id)+']');assert(item,'Registered inventory item '+id);rectInImage(item,png(item.image),id);assert.equal(item.realm,1);assert.equal(item.name,'item.'+id);assert.equal(!!item.stack,id!=='councilSoul');if(id==='dungeonSeal')assert.equal(item.category,'trinket');
 if(item.stack)assert(r('Merchant.addStock('+JSON.stringify(id)+')'));else r('flags[1].push("councilSoul");');assert.equal(r('Inventory.quantity('+JSON.stringify(id)+')'),1);
}
// Mixed-faction actors must use their own atlas outside their original realm.
for(let floor=0;floor<3;floor++){
 r('CampQuest.enter(DUNGEON_FLOORS['+floor+'].id);');
 for(const phase of ['walk','windup','strike','recover']){
  r('for(const e of enemies)if(e.dungeonEnemy){e.walkSpeed=50;e.animTime=.3;e.windup='+ (phase==='windup'?'.4':'0')+';e.windupDuration=1;e.attackTime='+(phase==='strike'?'.3':'0')+';e.attackElapsed=.2;e.attackDuration=.7;e.recovery='+(phase==='recover'?'.2':'0')+';}');
  const before=snapshot();assert.doesNotThrow(()=>r('draw()'),'Both faction atlases render on floor'+floor+' during '+phase);assert.equal(snapshot(),before);
 }
}
console.log('PASS: thirty-six native dungeon poses/alpha/silhouette bounds, stable anchors and scaling, pure actor/scenery rendering, full-height interiors at all desktop camera/height variants, native terrain dispatch, scroll/chests, portraits and five registered inventory items. Browser QA still verifies visible anatomy and contrast.');
