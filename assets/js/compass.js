/* A readable bearing to the current main objective, never a pathfinder. */
'use strict';
const Compass=(()=>{
 const arrows=['→','↘','↓','↙','←','↖','↑','↗'];
 function mainTarget(){
  const activeRealm=!defeated[0]?0:!defeated[1]?1:!defeated[2]||!flags[2].includes('shadowEntered')?2:3;
  const map=levels[activeRealm];
  if(activeRealm===0){
   if(!abilities[0])return {map,realm:0,name:map.ability.name,text:'text.visit.the.wind.shrine.beside.the.path'};
   const bell=map.objects.find(o=>o.type==='bell'&&!flags[0].includes(o.id));
   return bell?{map,realm:0,name:bell.name,text:I18n.format('message.ring.arg0.bells.arg1.2',[bell.name,flags[0].filter(f=>f.endsWith('Bell')).length])}:{map,realm:0,name:realms[0].boss,text:'text.the.two.bells.have.opened.the.bamboo.temple.find'};
  }
  if(activeRealm===1){
   const soul=map.objects.find(o=>o.type==='rescue'&&!flags[1].includes(o.id));
   if(soul)return {map,realm:1,name:soul.name,text:I18n.format('message.free.arg0.souls.arg1.2',[soul.name,flags[1].filter(f=>f.startsWith('soul')).length])};
   return !abilities[1]?{map,realm:1,name:map.ability.name,text:'text.the.shrine.of.shadows.grants.spirit.dash.use.the'}:{map,realm:1,name:realms[1].boss,text:'text.the.abyss.gate.is.open.descend.to.the.bottom'};
  }
  if(activeRealm===2)return {map,realm:2,name:defeated[2]?'HARU':realms[2].boss,text:defeated[2]?'text.ride.the.final.wind.stream.up.to.your.father':flags[2].includes('dawnSeal')?'text.the.dawn.seal.is.broken.the.guardian.awaits.at':'text.jump.into.the.wind.streams.and.move.sideways.onto'};
  if(!defeated[3])return {map,realm:3,name:flags[3].includes('prisonTrace')?realms[3].boss:'HARU',text:flags[3].includes('prisonTrace')?'shadow.objective.priest':'shadow.objective.search'};
  return {map:zigguratSummit,realm:3,name:'ziggurat.hannah',text:'ziggurat.objective.hannah'};
 }
 function objective(local){
  // A dungeon or an active side quest keeps its own immediate instructions.
  // Ordinary travel instead follows the persistent main-story milestones.
  if(Prologue.active||level.dungeon||[samuraiCamp,shadowPrison,shadowArena,shadowDen,fiaChambers].includes(level))return local;
  if(flags[3].includes(HannahRules.progress.defeated))return {compass:false,journeyEnd:true,text:'story.journeyEnd'};
  const target=mainTarget();
  if(level===target.map||level.ziggurat&&target.map===zigguratSummit)return local;
  if(level===levels[3]&&defeated[3])return {point:level.zigguratEntrance,name:'ziggurat.name',text:'ziggurat.objective.approach'};
  const gateway=level===levels[realm]&&defeated[realm]&&realm<target.realm?(realm===2?level.father:level.exit):null;
  if(gateway)return {point:gateway,name:target.name,text:target.text};
  // Coordinates in another map have no meaningful bearing on this canvas.
  return {compass:false,remote:true,name:target.name,text:target.text};
 }
 function reading(point){
  const dx=point.x-(player.x+player.w/2),dy=point.y-(player.y+player.h);
  const near=Math.abs(dx)<90&&Math.abs(dy)<85;
  const sector=(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8;
  return {near,sector,arrow:near?'✓':arrows[sector],label:near?'compass.near':'compass.direction.'+sector};
 }
 function update(objective){
  const box=$('compass');
  box.hidden=!player||!Merchant.stock('compass')||Prologue.active||$('quest').hidden||state==='menu'||state==='won'||state==='help'&&helpOrigin==='menu'||DevTools.menuBackground;
  if(box.hidden)return;
  objective??=nextObjective();
  $('compassLabel').textContent=I18n.t('item.compass');
  box.title=I18n.t('inventory.description.compass');
  const target=$('compassTarget'),direction=$('compassDirection'),arrow=$('compassArrow');
  target.hidden=objective.compass===false&&!objective.remote;
  if(objective.remote){target.textContent=I18n.format('compass.target',[I18n.t(objective.name)]);direction.textContent=I18n.t('compass.otherLocation');arrow.textContent='—';return;}
  if(target.hidden){target.textContent='';direction.textContent=I18n.t(objective.journeyEnd?'story.journeyEnd':'compass.idle');arrow.textContent='—';return;}
  const bearing=reading(objective.point);
  target.textContent=I18n.format('compass.target',[I18n.t(objective.name)]);
  direction.textContent=I18n.t(bearing.label);arrow.textContent=bearing.arrow;
 }
 return Object.freeze({update,reading,objective});
})();
