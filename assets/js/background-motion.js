/* Local painted detail motion; original backdrop projections stay unchanged. */
'use strict';
const BackgroundMotion=(()=>{
 let clock=0;
 const keys=new WeakMap(),layers=new WeakMap(),aliases=new WeakMap();
 const profiles=Object.freeze(Object.fromEntries(Object.entries(ART_MANIFEST).filter(([key,url])=>url.includes('/backgrounds/')&&!/Terrain$/.test(key)&&!key.endsWith('MotionPhaseB')).map(([key])=>[key,Object.freeze({foliage:key==='japanBackdrop',forest:/japanBackdrop|campHD|campBackdrop/.test(key)})])));
 const authored={
  campHDLeft:{"asset":"campHDLeftMotionPhaseB","regions":[["detail-0",7,[[0.01,0.01],[0.25,0.01],[0.25,0.14],[0.01,0.14]],5]]},
  campHDCenter:{"asset":"campHDCenterMotionPhaseB","regions":[["detail-0",14,[[0.48,0.535],[0.55,0.535],[0.55,0.64],[0.48,0.64]],5]]},
  campHDRight:{"asset":"campHDRightMotionPhaseB","regions":[["detail-0",14,[[0.02,0.005],[0.18,0.005],[0.18,0.1],[0.02,0.1]],5]]},
  campBackdrop:{"asset":"campBackdropMotionPhaseB","regions":[["detail-0",14,[[0.025,0.005],[0.26,0.005],[0.26,0.08],[0.025,0.08]],5]]},
  samuraiCampHDWest:{"asset":"samuraiCampHDWestMotionPhaseB","regions":[["detail-0",14,[[0.4,0.23],[0.425,0.23],[0.425,0.27],[0.4,0.27]],5]]},
  samuraiCampHDCenter:{"asset":"samuraiCampHDCenterMotionPhaseB","regions":[["detail-0",14,[[0.12,0.49],[0.145,0.49],[0.145,0.54],[0.12,0.54]],5]]},
  samuraiCampHDEast:{"asset":"samuraiCampHDEastMotionPhaseB","regions":[["detail-0",14,[[0.055,0.49],[0.08,0.49],[0.08,0.535],[0.055,0.535]],5]]},
  samuraiCampBackdrop:{"asset":"samuraiCampBackdropMotionPhaseB","regions":[["detail-0",14,[[0.2,0.41],[0.22,0.41],[0.22,0.455],[0.2,0.455]],5]]},
  zenPrisonWest:{"asset":"zenPrisonWestMotionPhaseB","regions":[["detail-0",14,[[0.49,0.005],[0.6,0.005],[0.6,0.1],[0.49,0.1]],5]]},
  zenPrisonCenter:{"asset":"zenPrisonCenterMotionPhaseB","regions":[["detail-0",14,[[0.52,0.005],[0.63,0.005],[0.63,0.1],[0.52,0.1]],5]]},
  zenPrisonEast:{"asset":"zenPrisonEastMotionPhaseB","regions":[["detail-0",14,[[0.43,0.03],[0.51,0.03],[0.51,0.12],[0.43,0.12]],5]]},
  fiaPrisonDepths:{"asset":"fiaPrisonDepthsMotionPhaseB","regions":[["detail-0",14,[[0.36,0.79],[0.45,0.79],[0.45,0.84],[0.36,0.84]],5]]},
  fiaDenWest:{"asset":"fiaDenWestMotionPhaseB","regions":[["detail-0",14,[[0.55,0.005],[0.63,0.005],[0.63,0.09],[0.55,0.09]],5]]},
  fiaDenEast:{"asset":"fiaDenEastMotionPhaseB","regions":[["detail-0",14,[[0.23,0.44],[0.28,0.44],[0.28,0.53],[0.23,0.53]],5]]},
  arenaWest:{"asset":"arenaWestMotionPhaseB","regions":[["detail-0",14,[[0.72,0.02],[0.78,0.02],[0.78,0.1],[0.72,0.1]],5]]},
  arenaCenter:{"asset":"arenaCenterMotionPhaseB","regions":[["detail-0",14,[[0.5,0.02],[0.58,0.02],[0.58,0.08],[0.5,0.08]],5]]},
  arenaEast:{"asset":"arenaEastMotionPhaseB","regions":[["detail-0",14,[[0.48,0.01],[0.59,0.01],[0.59,0.1],[0.48,0.1]],5]]},
  fiaChambersBackdrop:{"asset":"fiaChambersBackdropMotionPhaseB","regions":[["detail-0",14,[[0.48,0.3],[0.55,0.3],[0.55,0.4],[0.48,0.4]],5]]},
  dungeonCourtyardWest:{asset:'dungeonWestMotionPhaseB',regions:[['smoke',15,[[.40,.015],[.58,.015],[.58,.12],[.40,.12]],18]]},
  dungeonCourtyardCenter:{asset:'dungeonCenterMotionPhaseB',regions:[['smoke',15,[[.31,.02],[.48,.02],[.48,.15],[.31,.15]],18]]},
  dungeonCourtyardEast:{asset:'dungeonEastMotionPhaseB',regions:[['smoke',15,[[.05,.01],[.22,.01],[.22,.08],[.05,.08]],18]]},
  dungeonCrypt:{asset:'dungeonCryptMotionPhaseB',regions:[['fire',1.6,[[.19,.16],[.207,.16],[.207,.20],[.19,.20]],4]]},
  dungeonThrones:{asset:'dungeonThronesMotionPhaseB',regions:[['cloud',14,[[.42,.02],[.47,.02],[.47,.12],[.42,.12]],10]]},
  cultDungeonForecourt:{asset:'sectForecourtMotionPhaseB',regions:[['cloud',15,[[.32,.02],[.45,.02],[.45,.14],[.32,.14]],18]]},
  cultDungeonHall:{asset:'sectHallMotionPhaseB',regions:[['cloud',15,[[.17,.24],[.22,.24],[.22,.30],[.17,.30]],8]]},
  cultDungeonSanctum:{asset:'sectSanctumMotionPhaseB',regions:[['cloud',15,[[.49,.03],[.54,.03],[.54,.10],[.49,.10]],8]]},
  forgeBackdrop:{asset:'forgeMotionPhaseB',regions:[['fire',1.6,[[.339,.475],[.379,.475],[.379,.53],[.339,.53]],5]]},
  herbalBackdrop:{asset:'herbalMotionPhaseB',regions:[['leaves',7,[[.635,.36],[.69,.36],[.69,.44],[.635,.44]],9]]},
  mysticBackdrop:{asset:'mysticMotionPhaseB',regions:[['smoke',9,[[.83,.45],[.865,.45],[.865,.515],[.83,.515]],7]]},
  councilHall:{asset:'councilMotionPhaseB',regions:[['fire-left',1.6,[[.276,.50],[.297,.50],[.297,.555],[.276,.555]],5],['fire-right',1.8,[[.727,.50],[.753,.50],[.753,.555],[.727,.555]],5]]},
  momoRoom:{asset:'momoRoomMotionPhaseB',regions:[['smoke',13,[[.84,.24],[.89,.24],[.89,.32],[.84,.32]],9]]},
  zigguratApproach:{asset:'zigguratApproachMotionPhaseB',regions:[['cloud',15,[[.32,.02],[.43,.02],[.43,.13],[.32,.13]],20]]},
  zigguratInterior:{asset:'zigguratInteriorMotionPhaseB',regions:[['lava',5,[[.537,.635],[.55,.635],[.55,.665],[.537,.665]],3]]},
  zigguratThrone:{asset:'zigguratThroneMotionPhaseB',regions:[['fire-left',1.6,[[.260,.525],[.275,.525],[.275,.555],[.260,.555]],3],['fire-right',1.8,[[.728,.525],[.743,.525],[.743,.555],[.728,.555]],3]]},
  zigguratStorm:{asset:'zigguratStormMotionPhaseB',regions:[['cloud',15,[[.32,.02],[.43,.02],[.43,.14],[.32,.14]],20]]},
  angelRuinBackdrop:{asset:'angelRuinMotionPhaseB',regions:[['cloud',15,[[.36,.03],[.57,.03],[.57,.17],[.36,.17]],24]]},
  cultCaveBackdrop:{asset:'cultCaveMotionPhaseB',regions:[['flame',1.5,[[.605,.268],[.63,.268],[.63,.31],[.605,.31]],4],['flame-right',1.7,[[.925,.61],[.952,.61],[.952,.671],[.925,.671]],4]]},
  whiteSerpentBackdrop:{asset:'whiteSerpentMotionPhaseB',regions:[['water',7,[[.30,.795],[.67,.795],[.67,.84],[.30,.84]],12]]},
  wingedSerpentBackdrop:{asset:'wingedSerpentMotionPhaseB',regions:[['cloud',15,[[.28,.025],[.52,.025],[.52,.17],[.28,.17]],22]]},
  slayerArena:{asset:'slayerMotionPhaseB',regions:[['smoke',13,[[.48,.45],[.54,.45],[.54,.60],[.48,.60]],20]]},
  japanBackdrop:{asset:'japanMotionPhaseB',regions:[
   ['maple',4.6,[[0,0],[.085,0],[.085,.14],[0,.16]]],
   ['maple-right',4.6,[[.153,0],[.435,0],[.435,.168],[.335,.205],[.215,.13],[.153,.10]]],
   ['bamboo',5.6,[[.365,0],[.51,0],[.51,.072],[.462,.175],[.405,.14]]],
   ['bush',4.9,[[0,.80],[.085,.785],[.145,.87],[.13,1],[0,1]],28],
   ['cloud',13,[[.54,.025],[.755,.025],[.755,.18],[.585,.18],[.54,.115]],30],
   ['lamp-left',1.25,[[.035,.356],[.064,.356],[.064,.405],[.035,.405]]],
   ['lamp-right',1.43,[[.306,.469],[.325,.469],[.325,.497],[.306,.497]]]
  ]},
  yomiBackdrop:{asset:'yomiMotionPhaseB',regions:[
   ['flame-shrine',1.1,[[.175,.148],[.22,.145],[.262,.132],[.268,.157],[.235,.175],[.175,.176]],9],
   ['flame-left',1.24,[[.137,.153],[.161,.153],[.166,.18],[.137,.18]]],
   ['flame-mid-left',1.32,[[.13,.401],[.174,.39],[.18,.429],[.13,.429]]],
   ['flame-right',1.17,[[.87,.615],[.91,.615],[.91,.659],[.87,.659]]],
   ['lava',2.8,[[.431,.845],[.543,.845],[.615,.91],[.69,.948],[.66,1],[.49,1],[.42,.94]]],
   ['smoke',10.5,[[.36,.405],[.44,.397],[.49,.453],[.46,.501],[.37,.493]]]
  ]},
  heavenBackdrop:{asset:'heavenMotionPhaseB',regions:[['cloud',14,[[.29,.02],[.52,.02],[.53,.12],[.40,.14],[.29,.10]],25]]},
  heavenDarkBackdrop:{asset:'heavenDarkMotionPhaseB',regions:[['cloud',14,[[.29,.02],[.52,.02],[.53,.12],[.40,.14],[.29,.10]],25]]},
  heavenEclipseBackdrop:{asset:'heavenEclipseMotionPhaseB',regions:[['cloud',14,[[.29,.02],[.47,.02],[.48,.10],[.40,.13],[.29,.10]],25]]},
  shadowBackdrop:{asset:'shadowMotionPhaseB',regions:[['mist',13,[[.35,.62],[.62,.62],[.67,.69],[.38,.70]],25],['sky',18,[[.25,.03],[.46,.03],[.48,.13],[.30,.13]],30]]},
  shadowCultBackdrop:{asset:'shadowCultMotionPhaseB',regions:[['mist',14,[[.37,.72],[.62,.72],[.66,.79],[.40,.79]],25]]}
 };
 const authoredLoads=new Map(),queue=new Map();let pending=null,frame=0,reserved=0;
 const budget=64*1024*1024;
 function beginFrame(){frame++;}
 function discard(key){const entry=authoredLoads.get(key);if(!entry)return;authoredLoads.delete(key);reserved-=entry.bytes;if(entry===pending){entry.stale=true;reserved+=entry.imageBytes;}else if(entry.image)entry.image.src='';entry.canvas=null;entry.patches=null;}
 function pump(){
  if(pending)return;
  for(const [key,item] of queue){
   queue.delete(key);if(item.frame<frame-1)continue;
   const {image,profile}=item,w=image.naturalWidth,h=image.naturalHeight,imageBytes=w*h*4,bytes=imageBytes*3;
   const area=profile.regions.reduce((sum,[,,vertices])=>{const xs=vertices.map(p=>p[0]),ys=vertices.map(p=>p[1]);return sum+(Math.ceil(Math.max(...xs)*w)-Math.floor(Math.min(...xs)*w))*(Math.ceil(Math.max(...ys)*h)-Math.floor(Math.min(...ys)*h));},0);
   if(!w||!h||area>w*h||bytes>budget)continue;
   while(authoredLoads.size>=3||reserved+bytes>budget){const victim=[...authoredLoads].find(([,value])=>value.frame!==frame);if(!victim)break;discard(victim[0]);}
   if(authoredLoads.size>=3||reserved+bytes>budget){queue.set(key,item);return;}
   const entry={image:new Image(),bytes,imageBytes,frame:item.frame,status:'loading',canvas:null,patches:null};authoredLoads.set(key,entry);reserved+=bytes;pending=entry;
   AssetCache.load(entry.image,ART_MANIFEST[profile.asset],ok=>{
    pending=null;
    if(entry.stale||authoredLoads.get(key)!==entry){entry.image.src='';reserved-=entry.imageBytes;entry.image=null;pump();return;}
    entry.status=ok&&entry.image.naturalWidth===w&&entry.image.naturalHeight===h?'ready':'failed';pump();
   });return;
  }
 }
 function inside(x,y,points){let found=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])found=!found;}return found;}
 function distance(x,y,points){let nearest=Infinity;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));nearest=Math.min(nearest,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));}return nearest;}
 function ease(value){const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);}
 function makeAuthoredLayers(image,alternate,profile){
  const w=image.naturalWidth,h=image.naturalHeight,result=[];
  for(const [id,period,vertices,requestedFeather] of profile.regions){
   const points=vertices.map(([x,y])=>[x*w,y*h]),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
   const x=Math.max(0,Math.floor(Math.min(...xs))),y=Math.max(0,Math.floor(Math.min(...ys))),width=Math.min(w-x,Math.ceil(Math.max(...xs))-x),height=Math.min(h-y,Math.ceil(Math.max(...ys))-y);
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const paint=canvas.getContext('2d',{willReadFrequently:true});
   paint.drawImage(alternate,-x,-y);const pixels=paint.getImageData(0,0,width,height);
   const feather=requestedFeather||Math.min(18,Math.max(3,Math.min(width,height)*.22));
   const holes=id.startsWith('flame-')?[[[.15,.176],[.26,.176],[.26,.195],[.15,.195]]]:[];
   if(id==='flame-shrine')holes.push([[.15,.12],[.29,.12],[.29,.145],[.15,.145]]);
   const protectedAreas=holes.map(poly=>poly.map(([px,py])=>[px*w,py*h]));
   for(let py=0;py<height;py++)for(let px=0;px<width;px++){
    const sx=x+px+.5,sy=y+py+.5;let alpha=inside(sx,sy,points)?ease(distance(sx,sy,points)/feather):0;
    for(const poly of protectedAreas)alpha*=inside(sx,sy,poly)?0:ease(distance(sx,sy,poly)/3);
    pixels.data[(py*width+px)*4+3]=Math.round(alpha*255);
   }
   paint.putImageData(pixels,0,0);result.push({canvas,x,y,width,height,period});
  }
  return result;
 }
 function paintAuthored(image,key,args,alpha){
  const alias=aliases.get(image),source=alias?.source||image,profile=authored[key];
  if(!profile||source!==Visuals.images[key]||alias&&(image.width!==source.naturalWidth||image.height!==source.naturalHeight))return false;
  let load=authoredLoads.get(key);
  if(!load){queue.set(key,{image:source,profile,frame});pump();return false;}
  load.frame=frame;authoredLoads.delete(key);authoredLoads.set(key,load);
  if(load.status!=='ready')return false;
  try{
   if(!load.patches){load.patches=makeAuthoredLayers(source,load.image,profile);load.canvas=document.createElement('canvas');load.canvas.width=source.naturalWidth;load.canvas.height=source.naturalHeight;}
   if(load.renderClock!==clock||load.renderImage!==image){
    const paint=load.canvas.getContext('2d');paint.globalAlpha=1;paint.globalCompositeOperation='source-over';paint.clearRect(0,0,load.canvas.width,load.canvas.height);paint.drawImage(source,0,0);
    for(const patch of load.patches){paint.globalAlpha=(1-Math.cos(clock/patch.period*Math.PI*2))/2;paint.drawImage(patch.canvas,patch.x,patch.y);}paint.globalAlpha=1;
    if(alias?.fade>0){const fade=paint.createLinearGradient(0,0,load.canvas.width,0);fade.addColorStop(0,'#fff0');fade.addColorStop(alias.fade,'#fff');fade.addColorStop(1,'#fff');paint.globalCompositeOperation='destination-in';paint.fillStyle=fade;paint.fillRect(0,0,load.canvas.width,load.canvas.height);paint.globalCompositeOperation='source-over';}
    load.renderClock=clock;load.renderImage=image;
   }
   ctx.drawImage(load.canvas,...args);return true;
  }catch{load.status='failed';return false;}
 }
 function update(dt){if(state==='play'&&!resolutionBlocked&&Number.isFinite(dt)&&dt>0)clock+=dt;}
 function reset(){clock=0;queue.clear();if(pending){for(const [key,entry] of authoredLoads)if(entry===pending){discard(key);break;}}}
 function keyFor(image){
  if(!image||typeof image!=='object')return null;
  if(keys.has(image))return keys.get(image);
  const key=Object.keys(profiles).find(key=>Visuals.images[key]===image)||null;keys.set(image,key);return key;
 }
 function alias(surface,source,mask){keys.set(surface,keyFor(source));if(mask&&Number.isFinite(mask.fade)&&mask.fade>=0&&mask.fade<=1)aliases.set(surface,{source,fade:mask.fade});return surface;}
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
  const key=keyFor(image),alpha=ctx.globalAlpha;
  if(!reducedMotion.matches&&paintAuthored(image,key,args,alpha))return;
  ctx.drawImage(image,...args);
  if(reducedMotion.matches)return;
  const profile=profiles[key];if(!profile)return;
  const sourceWidth=image.naturalWidth||image.width,sourceHeight=image.naturalHeight||image.height;
  if(!sourceWidth||!sourceHeight||![4,8].includes(args.length))return;
  const data=prepare(image,profile);if(!data)return;
  const [sx,sy,sw,sh,dx,dy,dw,dh]=args.length===8?args:[0,0,sourceWidth,sourceHeight,...args];
  if(sw<=0||sh<=0||dw<=0||dh<=0)return;
  const sample=[sx/sourceWidth*data.w,sy/sourceHeight*data.h,sw/sourceWidth*data.w,sh/sourceHeight*data.h];
  ctx.save();ctx.beginPath();ctx.rect(dx,dy,dw,dh);ctx.clip();
  if(data.light){ctx.globalAlpha=alpha*(.065+.04*phase());ctx.globalCompositeOperation='screen';ctx.drawImage(data.light,...sample,dx,dy,dw,dh);}
  ctx.globalCompositeOperation='source-over';
  if(data.foliage){ctx.globalAlpha=alpha*.36;ctx.drawImage(data.foliage,...sample,dx+phase(.5)*1.5*dw/sourceWidth,dy,dw,dh);}
  ctx.restore();
 }
 return Object.freeze({draw,alias,update,reset,beginFrame,profiles,phase,get clock(){return clock;}});
})();
