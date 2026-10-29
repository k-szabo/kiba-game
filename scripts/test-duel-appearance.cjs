'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const surfaces=[],loads=[];
function surface(){
 const canvas={width:0,height:0,pixels:null,toDataURL:()=>{canvas.encoded=Array.from(canvas.pixels);return 'data:image/png;base64,BLUE';}};
 const context={drawImage(image,sx,sy,sw,sh){canvas.pixels=new Uint8ClampedArray(canvas.width*canvas.height*4);for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){const source=((sy+y)*image.width+sx+x)*4,target=(y*canvas.width+x)*4;canvas.pixels.set(image.pixels.subarray(source,source+4),target);}},getImageData:()=>({data:canvas.pixels}),putImageData:p=>{canvas.pixels=p.data;}};
 canvas.getContext=()=>context;surfaces.push(canvas);return canvas;
}
const sandbox={console,WeakMap,Map,Uint8Array,Int32Array,Uint8ClampedArray,Image:class{},document:{createElement:surface},AssetCache:{load(image,source,done){loads.push({image,source,done});}}};
vm.createContext(sandbox);let source=fs.readFileSync('assets/js/duel-appearance.js','utf8');source=source.replace('return Object.freeze({scope,paint,icon});','globalThis.__appearanceTest={recolor,get cachedPixels(){return cachedPixels;},get cachedEntries(){return crops.size;}};return Object.freeze({scope,paint,icon});');
vm.runInContext(source+'globalThis.appearance=DuelAppearance;',sandbox);const api=sandbox.appearance,internals=sandbox.__appearanceTest;
function image(width=20,height=10){const pixels=new Uint8ClampedArray(width*height*4);for(let i=0;i<pixels.length;i+=4)pixels.set([235,162,65,255],i);return{width,height,pixels};}
const pixel=(im,x,y,value)=>im.pixels.set(value,(y*im.width+x)*4),read=(im,x,y)=>Array.from(im.pixels.slice((y*im.width+x)*4,(y*im.width+x+1)*4));
const head=image();for(let y=1;y<=2;y++)for(let x=1;x<=16;x++)pixel(head,x,y,[210,34,20,192]);pixel(head,2,2,[100,15,10,77]);pixel(head,17,2,[230,35,20,0]);pixel(head,4,6,[225,35,35,255]);pixel(head,5,6,[225,35,35,255]);pixel(head,4,7,[225,35,35,255]);pixel(head,5,7,[225,35,35,255]);pixel(head,10,9,[240,20,20,255]);pixel(head,19,1,[10,10,10,255]);
const original=new Uint8ClampedArray(head.pixels);assert(internals.recolor(head.pixels,20,10,{top:0,bottom:10}));
assert.deepEqual(read(head,1,1),[20,106,210,192]);assert.deepEqual(read(head,2,2),[10,51,100,77],'Dark folds retain relative brightness/saturation and alpha');assert.deepEqual(read(head,0,0),[235,162,65,255],'Ginger fur stays orange');assert.deepEqual(read(head,19,1),[10,10,10,255],'Black facial outline stays black');assert.deepEqual(read(head,17,2),[230,35,20,0],'Transparent RGB and alpha are untouched');assert.deepEqual(read(head,4,6),[225,35,35,255],'Separated lower tongue stays red');assert.deepEqual(read(head,10,9),[240,20,20,255],'Armor tie below the forehead band stays red');for(let i=3;i<head.pixels.length;i+=4)assert.equal(head.pixels[i],original[i],'Every source alpha byte survives');

const drawCalls=[],context={drawImage(...args){drawCalls.push(args);}},sprite=image();for(let x=2;x<16;x++)pixel(sprite,x,1,[210,34,20,255]);const before=Array.from(sprite.pixels);
api.paint(context,sprite,0,0,20,10,-50,-100,100,200);assert.equal(drawCalls.at(-1)[0],sprite,'Story drawing bypasses palette conversion');
api.scope(0,()=>api.paint(context,sprite,0,0,20,10,-50,-100,100,200));assert.equal(drawCalls.at(-1)[0],sprite,'Red player uses the original source bitmap');
api.scope(1,()=>api.paint(context,sprite,0,0,20,10,-50,-100,100,200));const blue=drawCalls.at(-1)[0];assert.notEqual(blue,sprite);assert.deepEqual(drawCalls.at(-1).slice(1),[0,0,20,10,-50,-100,100,200],'Crop and destination geometry do not change');assert.equal(blue.pixels[1*20*4+2*4+2],210);
const count=surfaces.length;api.scope(1,()=>api.paint(context,sprite,0,0,20,10,0,0,20,10));assert.equal(surfaces.length,count,'Repeated frame drawing reuses cached pixels');assert.deepEqual(Array.from(sprite.pixels),before,'Source atlas is never modified');
api.scope(1,()=>{api.scope(0,()=>api.paint(context,sprite,0,0,20,10,0,0,20,10));assert.equal(drawCalls.at(-1)[0],sprite);api.paint(context,sprite,0,0,20,10,0,0,20,10);assert.equal(drawCalls.at(-1)[0],blue);});
assert.throws(()=>api.scope(1,()=>{throw Error('draw failure');}));api.paint(context,sprite,0,0,20,10,0,0,20,10);assert.equal(drawCalls.at(-1)[0],sprite,'Palette scope restores after exceptions');
for(let i=0;i<80;i++)api.scope(1,()=>api.paint(context,image(),0,0,20,10,0,0,20,10));assert(internals.cachedEntries<=48);assert(internals.cachedPixels<=6*1024*1024);

const node=()=>({source:'',writes:0,get src(){return this.source;},set src(value){this.source=value;this.writes++;},setAttribute(key,value){this[key]=value;},getAttribute(key){return this[key];}}),guest=node(),host=node();api.icon(host,0);assert.equal(host.src,'assets/images/ui/favicon-momo-v1.png');api.icon(guest,1);api.icon(guest,1);assert.equal(loads.length,1,'Only one icon load is started');assert.equal(guest.writes,1,'Frequent state renders do not reset an unchanged image source');Object.assign(loads[0].image,sprite,{naturalWidth:20,naturalHeight:10});loads[0].done(true);assert(guest.src.startsWith('data:image/png'));assert.equal(guest['data-duel-team'],'blue');api.icon(guest,0);assert.equal(guest.src,'assets/images/ui/favicon-momo-v1.png','Reused lobby row returns to the red host palette');
console.log('PASS: isolated red/blue headband scopes, fur/tongue/armor/alpha preservation, unchanged geometry/source atlases, bounded cached crops and lazy shared lobby icons.');
