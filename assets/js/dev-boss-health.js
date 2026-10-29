/* Numeric boss diagnostics stay in the isolated test run. */
'use strict';
const DevBossHealth=(()=>{
 function value(e){
  const max=e?.maxHp??e?.max;
  if(!e||e.dead||!Number.isFinite(e.hp)||!Number.isFinite(max)||max<=0)return '';
  const number=n=>new Intl.NumberFormat(I18n.locale,{maximumFractionDigits:2}).format(n);
  return number(clamp(e.hp,0,max))+' / '+number(max);
 }
 function bar(e,x,y,width){
  if(!DevSession.active)return;const text=value(e);if(!text)return;
  ctx.save();ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.font='700 13px "Kiba UI", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#080e19';ctx.fillRect(x-width/2,y-5,width,19);
  ctx.fillStyle='#855638';ctx.fillRect(x-width/2+1,y-4,(width-2)*clamp(e.hp/(e.maxHp??e.max),0,1),17);
  ctx.lineWidth=3;ctx.strokeStyle='#080e19';ctx.strokeText(text,x,y+5);ctx.fillStyle='#fff8e9';ctx.fillText(text,x,y+5);ctx.restore();
 }
 function hud(){
  const label=$('devBossHealth');if(!label)return;
  label.hidden=true;if(!DevSession.active||$('bossHud').hidden)return;
  let target;
  if(Prologue.active)target=boss;
  else if(HannahEncounter.active()||FiaConflict.enemy||DungeonRun.active()||ArenaChallenge.active()||level===samuraiCamp)
   target=enemies.find(e=>!e.dead&&e.active&&(HannahCombat.is(e)||FiaCombat.is(e)||DungeonCombat.is(e)||ArenaCombat.is(e)||CampMaster.is(e)));
  else if(bossStarted)target=boss;
  const text=value(target);label.textContent=text;label.hidden=!text;
 }
 return Object.freeze({bar,hud,value});
})();
