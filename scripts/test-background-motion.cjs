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
console.log('PASS: background-only profiles, one active clock at30/60/120FPS, pause/modal/viewport freezes, scene reset, pure rendering, source crop registration, alpha restoration, cached panel identity and reduced-motion static fallback.');

// Controlled asynchronous loads exercise the three-way heaven transition and
// ensure the composed scene is drawn once with its inherited opacity.
{
 const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync(require('node:path').join(__dirname,'../assets/js/background-motion.js'),'utf8');
 const names=['heavenBackdrop','heavenDarkBackdrop','heavenEclipseBackdrop','shadowBackdrop'];
 const manifest={},images={},requests=[],calls=[];
 for(const [i,name] of names.entries()){manifest[name]='assets/images/backgrounds/a'+i+'.png';images[name]={naturalWidth:16,naturalHeight:16};}
 for(const key of ['heavenMotionPhaseB','heavenDarkMotionPhaseB','heavenEclipseMotionPhaseB','shadowMotionPhaseB'])manifest[key]='assets/images/backgrounds/'+key+'.png';
 const makeCanvas=()=>({width:0,height:0,getContext(){return {globalAlpha:1,drawImage(){},clearRect(){},getImageData(x,y,w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){}};}});
 const ctx={globalAlpha:.5,drawImage:(...args)=>calls.push(args),save(){},restore(){},beginPath(){},rect(){},clip(){}};
 const context=vm.createContext({ART_MANIFEST:manifest,Visuals:{images},Image:class{constructor(){this.naturalWidth=16;this.naturalHeight=16;}},AssetCache:{load(image,url,done){requests.push({image,url,done});}},document:{createElement:makeCanvas},ctx,reducedMotion:{matches:false},state:'play',resolutionBlocked:false});
 vm.runInContext(source+'\nglobalThis.motion=BackgroundMotion;',context);
 const motion=context.motion,draw=name=>motion.draw(images[name],0,0,16,16);
 motion.beginFrame();names.slice(0,3).forEach(draw);
 assert.equal(requests.length,1,'Only one image load is in flight');
 requests[0].done(true);assert.equal(requests.length,2);requests[1].done(true);assert.equal(requests.length,3);requests[2].done(true);
 for(let frame=0;frame<5;frame++){motion.beginFrame();calls.length=0;names.slice(0,3).forEach(draw);assert.equal(calls.length,3,'Each translucent phase is drawn once');assert.equal(ctx.globalAlpha,.5);}
 assert.equal(requests.length,3,'Three concurrent heaven phases do not reload');
 motion.beginFrame();draw(names[3]);assert.equal(requests.length,4,'Older unpinned phase is evicted to make room');
 motion.reset();requests[3].done(true);
 motion.beginFrame();draw(names[3]);assert.equal(requests.length,5,'Reset invalidates a delayed load');
 requests[4].image.naturalWidth=15;requests[4].done(true);
 motion.beginFrame();draw(names[3]);assert.equal(requests.length,5,'A wrong-sized phase is rejected without a retry loop');
}
