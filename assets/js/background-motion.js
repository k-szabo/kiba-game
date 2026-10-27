/* Local painted detail motion; original backdrop projections stay unchanged. */
'use strict';
const BackgroundMotion=(()=>{
 let clock=0;
 const keys=new WeakMap(),layers=new WeakMap();
 const profiles=Object.freeze(Object.fromEntries(Object.entries(ART_MANIFEST).filter(([key,url])=>url.includes('/backgrounds/')&&!/Terrain$/.test(key)).map(([key])=>[key,Object.freeze({foliage:key==='japanBackdrop',forest:/japanBackdrop|campHD|campBackdrop/.test(key)})])));
 function update(dt){if(state==='play'&&!resolutionBlocked&&Number.isFinite(dt)&&dt>0)clock=(clock+dt)%120;}
 function reset(){clock=0;}
 function keyFor(image){
  if(!image||typeof image!=='object')return null;
  if(keys.has(image))return keys.get(image);
  const key=Object.keys(profiles).find(key=>Visuals.images[key]===image)||null;keys.set(image,key);return key;
 }
 function alias(surface,source){keys.set(surface,keyFor(source));return surface;}
 // Four neighbouring phases interpolate smoothly, with no frame-sized image swap.
 function phase(offset=0){const n=(clock/2+offset)%4,index=Math.floor(n),t=n-index,s=t*t*(3-2*t),values=[0,1,0,-1];return values[index]*(1-s)+values[(index+1)%4]*s;}
 function prepare(image,profile){
  if(layers.has(image))return layers.get(image);
  layers.set(image,null);
  const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1)return null;
  try{
   const w=Math.min(512,width),h=Math.max(1,Math.round(height*w/width)),source=document.createElement('canvas');source.width=w;source.height=h;
   const paint=source.getContext('2d',{willReadFrequently:true});if(!paint.createImageData(1,1)?.data)return null;paint.drawImage(image,0,0,w,h);
   const pixels=paint.getImageData(0,0,w,h);if(!pixels?.data)return null;
   const result={w,h};
   for(const kind of ['light','foliage']){
    if(kind==='foliage'&&!profile.foliage)continue;
    const surface=document.createElement('canvas');surface.width=w;surface.height=h;const brush=surface.getContext('2d'),data=brush.createImageData(w,h);let ink=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
     const i=(y*w+x)*4,r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2],hi=Math.max(r,g,b),lo=Math.min(r,g,b),nx=x/w,ny=y/h;
     let alpha=0;
     if(kind==='light'){
      const warm=r>155&&g>75&&r>b*1.3,cold=b>145&&b>g*1.25&&r>85;
      if((warm||cold)&&hi-lo>45&&(!profile.forest||nx<.34&&ny>.3))alpha=Math.min(1,(hi-145)/80);
     }else if(kind==='foliage'){
      // QA-BGM-001: only this audited canopy island may move. The red torii
      // and all uncalibrated interiors remain outside displacement masks.
      const leaf=r>120&&g>30&&r>g*1.5&&r>b*1.3;
      if(leaf&&nx>=.02&&nx<=.15&&ny>=.01&&ny<=.10)alpha=.65*Math.min(1,(hi-lo)/80);
     }
     // Feather all patch boundaries. Source alpha, including panel fades, survives.
     const edge=Math.min(1,x/14,(w-1-x)/14,y/14,(h-1-y)/14);
     data.data[i]=r;data.data[i+1]=g;data.data[i+2]=b;data.data[i+3]=Math.round(pixels.data[i+3]*Math.max(0,alpha*edge));ink+=data.data[i+3];
    }
    if(ink){brush.putImageData(data,0,0);result[kind]=surface;}
   }
   layers.set(image,result);return result;
  }catch{return null;}
 }
 function draw(image,...args){
  ctx.drawImage(image,...args);
  if(reducedMotion.matches)return;
  const key=keyFor(image),profile=profiles[key];if(!profile)return;
  const sourceWidth=image.naturalWidth||image.width,sourceHeight=image.naturalHeight||image.height;
  if(!sourceWidth||!sourceHeight||![4,8].includes(args.length))return;
  const data=prepare(image,profile);if(!data)return;
  const [sx,sy,sw,sh,dx,dy,dw,dh]=args.length===8?args:[0,0,sourceWidth,sourceHeight,...args];
  if(sw<=0||sh<=0||dw<=0||dh<=0)return;
  const sample=[sx/sourceWidth*data.w,sy/sourceHeight*data.h,sw/sourceWidth*data.w,sh/sourceHeight*data.h],alpha=ctx.globalAlpha;
  ctx.save();ctx.beginPath();ctx.rect(dx,dy,dw,dh);ctx.clip();
  if(data.light){ctx.globalAlpha=alpha*(.065+.04*phase());ctx.globalCompositeOperation='screen';ctx.drawImage(data.light,...sample,dx,dy,dw,dh);}
  ctx.globalCompositeOperation='source-over';
  if(data.foliage){ctx.globalAlpha=alpha*.36;ctx.drawImage(data.foliage,...sample,dx+phase(.5)*1.5*dw/sourceWidth,dy,dw,dh);}
  ctx.restore();
 }
 return Object.freeze({draw,alias,update,reset,profiles,phase,get clock(){return clock;}});
})();
