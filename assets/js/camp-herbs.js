/* Repeatable Japan herbs: only gathered stock persists, shrine regrowth is local. */
'use strict';
const CampHerbs=(()=>{
 const patches=Object.freeze([{id:'herb-forest',x:1120,y:1000},{id:'herb-village',x:3890,y:1000},{id:'herb-temple',x:7050,y:960}].map(Object.freeze));
 const harvested=new Set();
 const visible=()=>level===levels[0]&&!Prologue.active&&flags[0].includes('herbalistQuestAccepted');
 function reset(){harvested.clear();}
 function context(){if(!visible())return null;const herb=patches.find(p=>!harvested.has(p.id)&&pointNear(p,70,70));return herb?{type:'campHerb',herb,text:I18n.t('camp.herbal.gather')}:null;}
 function interact(candidate){
  if(state!=='play'||candidate?.type!=='campHerb')return false;
  const actual=context();if(!actual||actual.herb.id!==candidate.herb?.id||campServices.herbs>=Number.MAX_SAFE_INTEGER)return false;
  harvested.add(actual.herb.id);campServices.herbs++;persist();updateHUD();return true;
 }
 function draw(){
  if(!visible())return;const a=ART_INVENTORY.items.forestHerb,img=Visuals.images[a.image];if(!img?.complete||!img.naturalWidth)return;
  for(const p of patches)if(!harvested.has(p.id)&&visiblePoint(p)){
   const h=58,w=h*a.w/a.h;ctx.drawImage(img,a.x,a.y,a.w,a.h,p.x-w/2,p.y-h,w,h);
  }
 }
 return Object.freeze({patches,reset,context,interact,draw});
})();
