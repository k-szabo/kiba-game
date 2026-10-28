/* Viewport-sized painted scenery; camera travel never magnifies the artwork. */
'use strict';
const BackgroundFraming=(()=>{
 function cover(image,{vertical=.35,ground=null,floor=null}={}){
  if(!image?.complete||!image.naturalWidth)return false;
  const grounded=Number.isFinite(ground)&&ground>0&&ground<image.naturalHeight&&Number.isFinite(floor);
  const s=Math.max(viewW/image.naturalWidth,H/image.naturalHeight,grounded?Math.max(0,floor)/ground:0),w=image.naturalWidth*s,h=image.naturalHeight*s;
  const pan=clamp(camera/Math.max(1,level.width-viewW),0,1);
  const x=-(w-viewW)*pan,y=grounded?floor-ground*s:-(h-H)*vertical;
  BackgroundMotion.draw(image,x,y,w,h);
  if(grounded&&y+h<H){
   // Extend only the painted floor. Architecture retains its uniform scale,
   // and both draws share the exact source-ground seam and camera projection.
   ctx.save();ctx.beginPath();ctx.rect(0,Math.max(0,floor),viewW,H-Math.max(0,floor));ctx.clip();
   const stretch=(H-floor)/(image.naturalHeight-ground);
   BackgroundMotion.draw(image,x,floor-ground*stretch,w,image.naturalHeight*stretch);ctx.restore();
  }
  return true;
 }
 function panels(images,source,{overlap=.06}={}){
  if(!images.length||images.some(image=>!image?.complete||!image.naturalWidth))return false;
  const h=Math.max(...images.map(image=>image.naturalHeight)),widths=images.map(image=>image.naturalWidth/h);
  const total=widths.reduce((sum,w)=>sum+w,0)-overlap*(images.length-1),height=Math.max(H,viewW/total);
  const scroll=clamp(camera/Math.max(1,level.width-viewW),0,1)*Math.max(0,total*height-viewW);
  let x=-scroll;
  images.forEach((image,index)=>{BackgroundMotion.draw(source(image,index),x,(H-height)*.35,widths[index]*height,height);x+=(widths[index]-overlap)*height;});
  return true;
 }
 return Object.freeze({cover,panels});
})();
