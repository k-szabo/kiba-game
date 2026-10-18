/* A readable bearing to the current main objective, never a pathfinder. */
'use strict';
const Compass=(()=>{
 const arrows=['→','↘','↓','↙','←','↖','↑','↗'];
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
  target.hidden=objective.compass===false;
  if(target.hidden){target.textContent='';direction.textContent=I18n.t('compass.idle');arrow.textContent='—';return;}
  const bearing=reading(objective.point);
  target.textContent=I18n.format('compass.target',[I18n.t(objective.name)]);
  direction.textContent=I18n.t(bearing.label);arrow.textContent=bearing.arrow;
 }
 return Object.freeze({update,reading});
})();
