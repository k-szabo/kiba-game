'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),harness=require('./test-harness.cjs');

// Exercise the real service-room draw dispatcher, not only framing arithmetic.
for(const room of ['forgeInterior','herbalHut','mysticTent'])for(const width of [1280,1920]){
 const h=harness(),r=h.run,ctx=h.sandbox.document.getElementById('world').getContext('2d');let paints=[];
 ctx.drawImage=(image,...args)=>paints.push({image,args});
 r('DevTools.open();DevSession.begin();DevTools.close();CampQuest.enter('+JSON.stringify(room)+');viewW='+width+';reducedMotion.matches=true;initPlayer({x:700,y:820});player.inv=999;state="play";');
 const key={forgeInterior:'forgeBackdrop',herbalHut:'herbalBackdrop',mysticTent:'mysticBackdrop'}[room],image=r('Visuals.images.'+key);let anchor;
 function check(){
  paints=[];const state=r('JSON.stringify([player,enemies,flags,time,levelTime])');r('draw()');assert.equal(r('JSON.stringify([player,enemies,flags,time,levelTime])'),state,'Drawing is read-only');
  const painting=paints.find(p=>p.image===image);assert(painting,'Real dispatcher paints '+room);
  const world=[painting.args[0]+r('camera'),painting.args[1]+r('cameraY'),...painting.args.slice(2)];
  assert(world.every(Number.isFinite));if(!anchor)anchor=world;
  else world.forEach((value,i)=>assert(Math.abs(value-anchor[i])<1e-7,room+' furniture has one stable world-space rectangle at '+width));
 }
 // Explicit camera travel catches normalized panorama scrolling even when a
 // short room does not need a horizontal camera at a wide desktop viewport.
 for(const x of [0,80,220])for(const y of [0,180,360]){r('camera='+x+';cameraY='+y);check();}
 r('resetCamera()');
 for(const fps of [30,60,120]){
  r('initPlayer({x:700,y:820});player.inv=999');
  for(const action of ['attack','heavyAttack','moveRight','jump']){
   h.press({action});r('update('+1/fps+')');h.release({action});
   if(action==='attack'||action==='heavyAttack')assert.equal(r('attackKind'),action==='attack'?'normal':'heavy');
   if(action==='jump')assert(r('player.vy<0'),'Actual jump input reaches the airborne state');
   let sawShake=false;
   for(let i=0;i<Math.ceil(1.2*fps);i++){r('update('+1/fps+')');if(r('shake>0'))sawShake=true;check();}
   if(action==='attack'||action==='heavyAttack')assert(sawShake,'Actual '+action+' reaches the impact feedback');
  }
 }
 r('pause()');const frozen=r('JSON.stringify([player,time,camera,cameraY])');h.tick(120);assert.equal(r('JSON.stringify([player,time,camera,cameraY])'),frozen);check();
}

// Capture actual nametag geometry without pretending the mocked canvas proves
// artwork quality. Root browser QA verifies typography and head silhouettes.
{
 const rectangles=[],texts=[],actors=[];
 const ctx=new Proxy({globalAlpha:1,measureText:text=>({width:text.length*8}),fillRect:(...rect)=>rectangles.push(rect),fillText:(text,x,y)=>texts.push({text,x,y})},{get:(object,key)=>object[key]||(()=>{})});
 const sandbox={ctx,Prologue:{active:false},state:'play',level:{returnPoint:{},returnDestination:{}},levels:[],defeated:[],
  view:{lift:0,haruFreed:false,rescueTime:null,fiaPresent:false},
  Visuals:{images:{haruElder:{complete:true,naturalWidth:1100,naturalHeight:1050},fia:{complete:true,naturalWidth:1536,naturalHeight:1024}},campPathMarker(){}},
  ART_KITSUNE:{fia:{image:'fia'}},ArenaArt:{stamp:(definition,index,x,feet,height)=>actors.push({index,x,feet,height})},
  I18n:{t:key=>({'HARU':'Haru','fia.name':'Fia'}[key]||key)},FiaArt:{effect(){}},BossVFX:{impact(){}},
  clamp:(value,min,max)=>Math.max(min,Math.min(max,value))};
 sandbox.HannahEncounter={active:()=>true,summit:()=>true,blocked:()=>true,enemy:()=>null,visual:()=>sandbox.view};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/hannah-art.js'),'utf8'),sandbox);
 const run=code=>vm.runInContext(code,sandbox);
 for(const lift of [0,320])for(const rescueTime of [null,0,1,2.5,3.5])for(const haruFreed of [false,true])for(const fiaPresent of [false,true]){
  rectangles.length=texts.length=actors.length=0;Object.assign(sandbox.view,{lift,rescueTime,haruFreed,fiaPresent});const before=JSON.stringify(sandbox.view);run('HannahArt.scenery()');assert.equal(JSON.stringify(sandbox.view),before);
  const release=rescueTime===null?(haruFreed?1:0):sandbox.clamp((rescueTime-1.8)/1.4,0,1),feet=1400-lift-135*(1-release);
  const haru=texts.find(t=>t.text==='Haru');assert(haru);const haruBox=rectangles.find(rect=>rect[1]+rect[3]===feet-125-16);
  assert(haruBox,'Haru label clears the complete elder image by 16 world pixels');assert.equal(haru.y,haruBox[1]+haruBox[3]/2);
  const visible=fiaPresent&&(rescueTime!==null||haruFreed);assert.equal(texts.some(t=>t.text==='Fia'),visible,'Tag follows the same presence rule as the Fia sprite');assert.equal(actors.length,visible?1:0);
  if(visible){const fiaBox=rectangles.find(rect=>rect[1]+rect[3]===1400-lift-150-16);assert(fiaBox,'Fia label clears her full standing height during rescue and after victory');}
 }
 rectangles.length=texts.length=0;run('HannahArt.nameplate(500,824,110,"HARU")');assert.equal(rectangles[0][1]+rectangles[0][3],698,'Heaven variant uses its own rendered height and feet');
 sandbox.Visuals.images.haruElder.complete=false;sandbox.Visuals.images.fia.complete=false;Object.assign(sandbox.view,{rescueTime:1,fiaPresent:true});texts.length=0;run('HannahArt.scenery()');assert.equal(texts.length,0,'No nametags are drawn for unloaded actors');
}
console.log('PASS: service-room furniture stays world-registered through cameras, attacks, movement, jumps and pause at 1280/1920; Haru/Fia nametags clear their models and obey presence.');
