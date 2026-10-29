/* Small palette variants of Momo's existing artwork; combat pixels stay aligned. */
'use strict';
const DuelAppearance=(()=>{
 const ICON='assets/images/ui/favicon-momo-v1.png',MAX_ENTRIES=48,MAX_PIXELS=6*1024*1024;
 let playerIndex=-1,imageSequence=0,cachedPixels=0,iconImage=null,blueIcon=null;
 const imageIds=new WeakMap(),iconSources=new WeakMap(),crops=new Map(),pendingIcons=new Map();
 function scope(index,draw){const previous=playerIndex;playerIndex=index===1?1:index===0?0:-1;try{return draw();}finally{playerIndex=previous;}}
 function recolor(data,width,height,bounds){
  let top=0,bottom=height;
  if(bounds){top=Math.max(0,Math.floor(bounds.top));bottom=Math.min(height,Math.ceil(bounds.bottom));}
  else{
   let first=height,last=-1;
   for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>32){first=Math.min(first,y);last=Math.max(last,y);}
   if(last<first)return false;top=first;bottom=Math.ceil(first+(last-first+1)*.55);
  }
  const mask=new Uint8Array(width*height);let count=0;
  for(let y=top;y<bottom;y++)for(let x=0;x<width;x++){
   const i=(y*width+x)*4,r=data[i],g=data[i+1],b=data[i+2];if(!data[i+3])continue;
   const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
   if(max<31||max!==r||!delta||delta/max<.5)continue;
   const hue=(60*(g-b)/delta+360)%360;
   // The fur is orange/yellow. Only saturated red cloth and its dark folds
   // enter this hue window; source alpha, saturation and brightness survive.
   if(hue>16&&hue<345)continue;mask[y*width+x]=1;count++;
  }
  if(!count)return false;
  // The forehead band is the dominant red cloth component in the head crop.
  // Its vertical neighborhood includes separated ribbons, but not a small,
  // lower red tongue or the red armor ties beneath the face.
  const stack=new Int32Array(count);let largest=0,bandTop=top,bandBottom=bottom;
  for(let seed=0;seed<mask.length;seed++)if(mask[seed]===1){
   let pending=1,area=0,low=height,high=0;stack[0]=seed;mask[seed]=2;
   while(pending){const pixel=stack[--pending],y=Math.floor(pixel/width),x=pixel%width;area++;low=Math.min(low,y);high=Math.max(high,y);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
     const px=x+dx,py=y+dy;if(px<0||px>=width||py<top||py>=bottom)continue;
     const neighbor=py*width+px;if(mask[neighbor]===1){mask[neighbor]=2;stack[pending++]=neighbor;}
    }
   }
   if(area>largest){largest=area;const margin=Math.max(2,Math.ceil((high-low+1)*.3));bandTop=Math.max(top,low-margin);bandBottom=Math.min(bottom,high+1+margin);}
  }
  for(let y=bandTop;y<bandBottom;y++)for(let x=0;x<width;x++)if(mask[y*width+x]){
   const i=(y*width+x)*4,min=Math.min(data[i],data[i+1],data[i+2]),delta=data[i]-min;
   data[i+1]=Math.round(min+delta*.45);data[i+2]=data[i];data[i]=min;
  }
  return true;
 }
 function transformed(image,sx,sy,sw,sh,headBounds){
  if(!image||typeof image!=='object'||![sx,sy,sw,sh].every(Number.isFinite)||sw<=0||sh<=0||sw*sh>MAX_PIXELS)return null;
  let id=imageIds.get(image);if(!id){id=++imageSequence;imageIds.set(image,id);}
  const bounds=headBounds?{top:headBounds.top-sy,bottom:headBounds.bottom-sy}:null;
  if(bounds&&![bounds.top,bounds.bottom].every(Number.isFinite))return null;
  const key=[id,sx,sy,sw,sh,bounds?.top??'',bounds?.bottom??''].join(':');
  if(crops.has(key)){const entry=crops.get(key);crops.delete(key);crops.set(key,entry);return entry.canvas;}
  let canvas;
  try{
   canvas=document.createElement('canvas');canvas.width=Math.ceil(sw);canvas.height=Math.ceil(sh);
   const context=canvas.getContext('2d',{willReadFrequently:true});if(!context?.getImageData||!context.putImageData)return null;
   context.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);const pixels=context.getImageData(0,0,canvas.width,canvas.height);
   recolor(pixels.data,canvas.width,canvas.height,bounds);context.putImageData(pixels,0,0);
  }catch{return null;}
  const pixels=canvas.width*canvas.height;
  while(crops.size>=MAX_ENTRIES||cachedPixels+pixels>MAX_PIXELS){const oldest=crops.keys().next().value;if(oldest===undefined)break;const entry=crops.get(oldest);cachedPixels-=entry.pixels;crops.delete(oldest);entry.canvas.width=entry.canvas.height=0;}
  crops.set(key,{canvas,pixels});cachedPixels+=pixels;return canvas;
 }
 function paint(context,image,sx,sy,sw,sh,dx,dy,dw,dh,headBounds){
  const replacement=playerIndex===1?transformed(image,sx,sy,sw,sh,headBounds):null;
  if(replacement)context.drawImage(replacement,0,0,sw,sh,dx,dy,dw,dh);
  else context.drawImage(image,sx,sy,sw,sh,dx,dy,dw,dh);
 }
 function applyIcon(node,index){
  const source=index===1&&blueIcon?blueIcon:ICON;
  if(iconSources.get(node)!==source){node.src=source;iconSources.set(node,source);}
  const team=index===1?'blue':'red';if(node.getAttribute?.('data-duel-team')!==team)node.setAttribute('data-duel-team',team);
 }
 function icon(node,index){
  if(!node)return;applyIcon(node,index);
  if(index!==1){pendingIcons.delete(node);return;}if(blueIcon)return;
  pendingIcons.set(node,index);if(iconImage)return;
  iconImage=new Image();AssetCache.load(iconImage,ICON,ok=>{
   if(ok)try{
    const surface=transformed(iconImage,0,0,iconImage.naturalWidth,iconImage.naturalHeight,{top:0,bottom:iconImage.naturalHeight});
    if(surface)blueIcon=surface.toDataURL('image/png');
   }catch{}
   for(const [target,team]of pendingIcons)applyIcon(target,team);pendingIcons.clear();
  });
 }
 return Object.freeze({scope,paint,icon});
})();
