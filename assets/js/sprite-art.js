/* Place an atlas frame at its authored world anchor. */
'use strict';

function stampSprite(frame,imageKey,x,feet,height,face,{outlines=null,intersect=false}={}){
  const image=Visuals.images[imageKey];
  if(!frame||!image?.complete||!image.naturalWidth)return;

  const scale=height/frame.bodyHeight;
  const offsetX=px=>(px-frame.anchorX)*scale;
  const offsetY=py=>(py-frame.anchorY)*scale;
  ctx.save();
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';
  ctx.translate(x,feet);
  ctx.scale(face,1);

  if(outlines){
    if(!intersect)ctx.beginPath();
    for(const outline of outlines){
      if(intersect)ctx.beginPath();
      outline.forEach(([px,py],index)=>ctx[index?'lineTo':'moveTo'](offsetX(px),offsetY(py)));
      ctx.closePath();
      if(intersect)ctx.clip();
    }
    if(!intersect)ctx.clip();
  }
  ctx.drawImage(image,frame.x,frame.y,frame.w,frame.h,
    offsetX(frame.x),offsetY(frame.y),frame.w*scale,frame.h*scale);
  ctx.restore();
}
