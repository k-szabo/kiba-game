'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
for(const fps of [30,60,120]){
 const h=harness(),r=h.run;
 r('enemies=[];boss.dead=true;player.inv=999;BackgroundMotion.reset()');h.tick(0);
 r(`for(let i=0;i<${fps};i++)update(${1/fps});`);assert(Math.abs(r('BackgroundMotion.clock')-1)<1e-8,'Exactly one active step at '+fps+' FPS');
 for(const [open,close]of [['pause()','pause()'],['Inventory.open()','Inventory.close()'],['showMap()','closeMap()'],['showTraining()','closeTraining()'],['DevTools.open()','DevTools.close()'],['story("","","")',"$('dialogOk').onclick()"]]){
  r(open);assert.notEqual(r('state'),'play',open);const before=r('BackgroundMotion.clock');h.tick(120);assert.equal(r('BackgroundMotion.clock'),before,open+' freezes background');r(close);
 }
 r('resolutionBlocked=true');const clock=r('BackgroundMotion.clock');h.tick(120);assert.equal(r('BackgroundMotion.clock'),clock);r('resolutionBlocked=false;initPlayer(checkpoint)');assert.equal(r('BackgroundMotion.clock'),0,'Scene initialization resets the transient phase');
 const before=r('JSON.stringify([player,flags,progression,BackgroundMotion.clock])');r('draw();draw()');assert.equal(r('JSON.stringify([player,flags,progression,BackgroundMotion.clock])'),before,'Drawing is gameplay/clock-pure');
 const expected=Array.from(r("Object.entries(ART_MANIFEST).filter(([key,url])=>url.includes('/backgrounds/')&&!/Terrain$/.test(key)&&!key.endsWith('MotionPhaseB')).map(([key])=>key)"));assert.deepEqual(Array.from(r('Object.keys(BackgroundMotion.profiles)')),expected);
 assert.deepEqual(Array.from(r('Object.keys(BackgroundMotion.profiles).filter(key=>BackgroundMotion.profiles[key].foliage)')),['japanBackdrop'],'Only the audited canopy profile permits displacement');
}
{
 const h=harness(),r=h.run;
 r("state='play';BackgroundMotion.reset();BackgroundMotion.update(119.99)");
 const before=r('(1-Math.cos(BackgroundMotion.clock/4.9*Math.PI*2))/2');
 r('BackgroundMotion.update(.02)');
 const after=r('(1-Math.cos(BackgroundMotion.clock/4.9*Math.PI*2))/2');
 assert(r('BackgroundMotion.clock')>120,'The authored clock passes 120 seconds without wrapping');
 assert(Math.abs(after-before)<.02,'Japan bush paint blend is continuous across the old 120-second boundary');
}
// A real pixel-mask fixture exercises cropped/native painting and alpha state,
// while browser evidence establishes how original paintings look in motion.
{
 const h=harness(),r=h.run,ctx=h.sandbox.document.getElementById('world').getContext('2d');let calls=[],stack=[];
 ctx.globalAlpha=.4;ctx.globalCompositeOperation='source-over';ctx.save=()=>stack.push([ctx.globalAlpha,ctx.globalCompositeOperation]);ctx.restore=()=>{[ctx.globalAlpha,ctx.globalCompositeOperation]=stack.pop();};ctx.drawImage=(image,...args)=>calls.push({image,args,alpha:ctx.globalAlpha,composite:ctx.globalCompositeOperation});
 h.sandbox.document.createElement=()=>({width:0,height:0,getContext:()=>({drawImage(){},getImageData(x,y,w,h){const data=new Uint8ClampedArray(w*h*4);for(let i=0;i<data.length;i+=4)data.set([220,130,35,255],i);return {data};},createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}})});
 r('Visuals.images.yomiBackdrop.naturalWidth=64;Visuals.images.yomiBackdrop.naturalHeight=64;BackgroundMotion.draw(Visuals.images.yomiBackdrop,4,8,32,24,10,20,300,200)');
 assert.equal(calls.length,2);assert.deepEqual(calls[0].args,[4,8,32,24,10,20,300,200]);assert.deepEqual(calls[1].args,[4,8,32,24,10,20,300,200]);assert.equal(calls[1].composite,'screen');assert(calls[1].alpha>0&&calls[1].alpha<.1);assert.equal(ctx.globalAlpha,.4);assert.equal(ctx.globalCompositeOperation,'source-over');assert.equal(stack.length,0);
 calls=[];r('reducedMotion.matches=true;BackgroundMotion.draw(Visuals.images.yomiBackdrop,10,20,300,200)');assert.equal(calls.length,1,'Reduced motion draws only the original painting');
 r('reducedMotion.matches=false;var alias={width:64,height:64};BackgroundMotion.alias(alias,Visuals.images.yomiBackdrop)');calls=[];r('BackgroundMotion.draw(alias,10,20,300,200)');assert.equal(calls.length,2,'Cached transparent panels retain their original image profile');
 for(const seconds of [2,4,6]){calls=[];r('Visuals.images.fiaChambersBackdrop.naturalWidth=64;Visuals.images.fiaChambersBackdrop.naturalHeight=64;BackgroundMotion.reset();BackgroundMotion.update('+seconds+');BackgroundMotion.draw(Visuals.images.fiaChambersBackdrop,10,20,300,200)');assert(calls.length>1);for(const call of calls)assert.deepEqual(call.args.slice(-4),[10,20,300,200],'Interior base and all effects remain at their exact source-registered positions');}
}

// Controlled asynchronous loads exercise the three-way heaven transition and
// ensure the composed scene is drawn once with its inherited opacity.
{
 const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync(require('node:path').join(__dirname,'../assets/js/background-motion.js'),'utf8');
 const names=['heavenBackdrop','heavenDarkBackdrop','heavenEclipseBackdrop','shadowBackdrop'];
 const manifest={},images={},requests=[],calls=[];
 for(const [i,name] of names.entries()){manifest[name]='assets/images/backgrounds/a'+i+'.png';images[name]={naturalWidth:16,naturalHeight:16};}
 for(const key of ['heavenMotionPhaseB','heavenDarkMotionPhaseB','heavenEclipseMotionPhaseB','shadowMotionPhaseB'])manifest[key]='assets/images/backgrounds/'+key+'.png';
 let maskFills=0;
 const makeCanvas=()=>({width:0,height:0,getContext(){return {globalAlpha:1,drawImage(){},clearRect(){},createLinearGradient:()=>({addColorStop(){}}),fillRect(){maskFills++;},getImageData(x,y,w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){}};}});
 const ctx={globalAlpha:.5,drawImage:(...args)=>calls.push(args),save(){},restore(){},beginPath(){},rect(){},clip(){}};
 const context=vm.createContext({ART_MANIFEST:manifest,Visuals:{images},Image:class{constructor(){this.naturalWidth=16;this.naturalHeight=16;}},AssetCache:{load(image,url,done){requests.push({image,url,done});}},document:{createElement:makeCanvas},ctx,reducedMotion:{matches:false},state:'play',resolutionBlocked:false});
 vm.runInContext(source+'\nglobalThis.motion=BackgroundMotion;',context);
 const motion=context.motion,draw=name=>motion.draw(images[name],0,0,16,16);
 motion.beginFrame();names.slice(0,3).forEach(draw);
 assert.equal(requests.length,1,'Only one image load is in flight');
 requests[0].done(true);assert.equal(requests.length,2);requests[1].done(true);assert.equal(requests.length,3);requests[2].done(true);
 for(let frame=0;frame<5;frame++){motion.beginFrame();calls.length=0;names.slice(0,3).forEach(draw);assert.equal(calls.length,3,'Each translucent phase is drawn once');assert.equal(ctx.globalAlpha,.5);}
 assert.equal(requests.length,3,'Three concurrent heaven phases do not reload');
 const incoming=makeCanvas();incoming.width=incoming.height=16;motion.alias(incoming,images[names[0]],{fade:.06});
 motion.draw(incoming,0,0,16,16);assert.equal(maskFills,1,'An incoming panel gets its existing fade');
 draw(names[0]);assert.equal(maskFills,1,'Native rendering at the same clock recomposes without the panel fade');
 const opaque=makeCanvas();opaque.width=opaque.height=16;motion.alias(opaque,images[names[0]],{fade:0});
 motion.draw(opaque,0,0,16,16);assert.equal(maskFills,1,'The Samurai first panel remains opaque');
 motion.beginFrame();draw(names[3]);assert.equal(requests.length,4,'Older unpinned phase is evicted to make room');
 motion.reset();requests[3].done(true);
 motion.beginFrame();draw(names[3]);assert.equal(requests.length,5,'Reset invalidates a delayed load');
 requests[4].image.naturalWidth=15;requests[4].done(true);
 motion.beginFrame();draw(names[3]);assert.equal(requests.length,5,'A wrong-sized phase is rejected without a retry loop');
 // Inspect only this test-served copy's reservation counters. No debug API is
 // exported by the game. An uncancellable stale decode stays counted.
 const delayed=[],largeImages=Object.fromEntries(names.map(name=>[name,{naturalWidth:1774,naturalHeight:887}]));
 const large=vm.createContext({...context,Visuals:{images:largeImages},Image:class{constructor(){this.naturalWidth=1774;this.naturalHeight=887;}},AssetCache:{load(image,url,done){delayed.push({image,url,done});}}});
 const instrumented=source.replace('return Object.freeze({draw,alias','return Object.freeze({get probe(){return {reserved,count:authoredLoads.size,pending:!!pending};},draw,alias');
 vm.runInContext(instrumented+'\nglobalThis.largeMotion=BackgroundMotion;',large);
 const lm=large.largeMotion,bytes=1774*887*4,drawLarge=name=>lm.draw(largeImages[name],0,0,1280,720);
 const checkBudget=()=>{assert(lm.probe.reserved>=0&&lm.probe.reserved<=64*1024*1024);assert(lm.probe.count<=3);};
 lm.beginFrame();names.slice(0,3).forEach(drawLarge);assert.equal(delayed.length,1);
 delayed[0].done(true);delayed[1].done(true);delayed[2].done(true);checkBudget();assert.equal(lm.probe.reserved,bytes*9);
 lm.beginFrame();drawLarge(names[3]);assert.equal(delayed.length,4);lm.reset();checkBudget();assert.equal(lm.probe.reserved,bytes*7,'The pending orphan retains one decoded-image reservation');
 drawLarge(names[0]);assert.equal(delayed.length,4,'An orphan must complete before another load starts');
 delayed[3].done(true);assert.equal(delayed.length,5);checkBudget();delayed[4].done(false);checkBudget();assert.equal(lm.probe.pending,false);
}

// The complete background catalogue must have authored, native-sized phases.
{
 const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
 const source=fs.readFileSync(path.join(__dirname,'../assets/js/background-motion.js'),'utf8');
 const art=fs.readFileSync(path.join(__dirname,'../assets/js/art-data.js'),'utf8'),start=art.indexOf('const ART_MANIFEST = {');
 const manifest=vm.runInNewContext(art.slice(start,art.indexOf('\n};',start)+3)+';ART_MANIFEST');
 const authored=vm.runInNewContext(source.slice(source.indexOf(' const authored={'),source.indexOf(' const authoredLoads'))+';authored');
 const keys=Object.keys(manifest).filter(k=>manifest[k].includes('/backgrounds/')&&!/Terrain$/.test(k)&&!k.endsWith('MotionPhaseB'));
 assert.deepEqual(Object.keys(authored).sort(),keys.sort(),'Every background, including hidden arenas and fallback panoramas, has a painted phase');
 for(const key of keys){const profile=authored[key],a=fs.readFileSync(path.join(__dirname,'..',manifest[key])),b=fs.readFileSync(path.join(__dirname,'..',manifest[profile.asset]));assert.equal(a.readUInt32BE(16),b.readUInt32BE(16),key+' native width');assert.equal(a.readUInt32BE(20),b.readUInt32BE(20),key+' native height');assert(profile.regions.length>0);}
}
// QA-BGM-008: fully opaque hunter foreground releases the prison animation
// pins while the original underlay still covers the bottom of the viewport.
{
 const fs=require('node:fs'),vm=require('node:vm'),calls=[],painted=[];
 const images=Object.fromEntries(['zenPrisonWest','zenPrisonCenter','zenPrisonEast','fiaPrisonDepths'].map(key=>[key,{complete:true,naturalWidth:1536,naturalHeight:1024}]));
 const ctx={save(){},restore(){},fillRect(){},drawImage:(image,...args)=>calls.push({image,args})};
 const brush={drawImage(){},createLinearGradient:()=>({addColorStop(){}}),fillRect(){}};
 const sandbox={ART_PRISON:{backdrops:Object.keys(images).slice(0,3)},ART_KITSUNE:{depths:{image:'fiaPrisonDepths',w:1536,h:1024,groundY:790}},Visuals:{images},ctx,document:{createElement:()=>({getContext:()=>brush})},BackgroundMotion:{alias(){},draw:image=>painted.push(image)},H:720,viewW:1280,camera:0,cameraY:1900,level:{width:5400,hunterArena:{y:2360}},clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),HannahArt:{backdrop:()=>false},DungeonArt:{backdrop:()=>false},ArenaArt:{backdrop:()=>false},KitsuneQuest:{den:()=>false},PrisonQuest:{active:()=>true}};
 const context=vm.createContext(sandbox),game=fs.readFileSync('assets/js/game.js','utf8');
 vm.runInContext(fs.readFileSync('assets/js/prison-art.js','utf8')+'\n'+fs.readFileSync('assets/js/kitsune-art.js','utf8')+'\n'+game.slice(game.indexOf('function background(r)'),game.indexOf('function drawLandscape')),context);
 vm.runInContext('background({})',context);
 assert.equal(painted.length,1,'Only the hunter layer pins authored animation at full depth');
 assert.equal(painted[0],images.fiaPrisonDepths);
 assert(calls.length>0,'Static prison underlay remains beneath the hunter painting');
 painted.length=0;sandbox.cameraY=1500;vm.runInContext('background({})',context);assert(painted.length>1,'Partial transition retains animated prison panels');
 painted.length=0;sandbox.cameraY=2000;images.fiaPrisonDepths.naturalWidth=0;vm.runInContext('background({})',context);assert(painted.length>0,'Missing hunter image retains prison animation');
}
console.log('PASS: complete authored coverage, native sizes, clocks, pauses, crop/alpha/alias behavior, bounded asynchronous cache, heaven phases and prison/hunter layering.');
