'use strict';
const assert=require('node:assert/strict'),h=require('./test-harness.cjs')(),r=h.run;
const draws=[];h.sandbox.document.getElementById('world').getContext('2d').drawImage=(image,...rect)=>draws.push(rect);
r("reducedMotion.matches=true;level=forgeInterior;");
for(const [width,height]of [[1280,720],[1920,720]])for(const cameraX of [0,400,1400])for(const cameraY of [150,550,900]){
 draws.length=0; r('viewW='+width+';camera='+cameraX+';cameraY='+cameraY+';BackgroundFraming.cover(Visuals.images.forgeBackdrop,{ground:800,floor:1000-cameraY});');
 const first=draws[0],floor=1000-cameraY;
 assert(draws.length>=1&&draws.length<=2);assert(draws.flat().every(Number.isFinite));
 const [x,y,w,hh]=first,scale=w/1536;assert(Math.abs(y+800*scale-floor)<1e-7,'Source and world floors coincide');
 assert(x<=0&&x+w>=width&&y<=0,'Uniform architecture covers top and horizontal edges');
 assert(hh<=Math.max(height,width/1.5,Math.max(0,floor)/800*1024)+1e-7,'Camera travel cannot enlarge the room arbitrarily');
 if(y+hh<height){assert.equal(draws.length,2);const extension=draws[1];assert(Math.abs(extension[1]+extension[3]-height)<1e-7,'Clipped floor continuation reaches the bottom');}
}
console.log('PASS: grounded cover preserves source-floor anchors, uniform architecture scale, finite rectangles and full coverage across desktop cameras.');
