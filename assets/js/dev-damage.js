/* Session-only combat diagnostics; values reflect health actually removed. */
'use strict';
const DevDamage=(()=>{
 const LIMIT=48,LIFETIME=.9;
 let enabled=false,initialized=false,entries=[];
 const active=()=>DevSession.active&&enabled;
 function clear(){entries=[];}
 function toggle(){
  if(!DevSession.active||state!=='developer'||!DevTools.isOpen)return false;
  enabled=!enabled;clear();return true;
 }
 function record(kind,target,before,after){
  DevLog.damage(kind,target,before,after);
  if(!active()||!Number.isFinite(before)||!Number.isFinite(after)||before<=0)return;
  const amount=Math.min(before,Math.max(0,before-Math.max(0,after)));
  if(!amount||!Number.isFinite(target?.x)||!Number.isFinite(target?.y))return;
  if(entries.length>=LIMIT)entries.shift();
  entries.push({kind:kind==='incoming'?'incoming':'outgoing',amount,x:target.x+(target.w||0)/2,y:target.y-12,life:LIFETIME});
 }
 function update(dt){
  if(!active()){clear();return;}
  if(state!=='play'||!Number.isFinite(dt)||dt<=0)return;
  for(const entry of entries)entry.life-=dt;
  entries=entries.filter(entry=>entry.life>0);
 }
 function draw(){
  if(!active()||!entries.length)return;
  ctx.save();ctx.font='800 24px "Kiba UI", "Kiba Story", sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.lineJoin='round';ctx.lineWidth=5;ctx.strokeStyle='#070b16';
  for(const entry of entries){
   const value=String(Math.round(entry.amount*100)/100),text=(entry.kind==='incoming'?'−':'')+value;
   const y=entry.y-(reducedMotion.matches?0:(LIFETIME-entry.life)*30);
   ctx.globalAlpha=reducedMotion.matches?1:Math.min(1,entry.life/.2);
   ctx.fillStyle=entry.kind==='incoming'?'#dd9480':'#ffe9aa';ctx.strokeText(text,entry.x,y);ctx.fillText(text,entry.x,y);
  }
  ctx.restore();
 }
 function init(){
  if(initialized)return;initialized=true;
  DevTools.register({id:'damage-numbers',labelKey:'dev.damage',available:()=>DevSession.active,toggled:active,run:toggle});
  DevSession.onEnd(()=>{enabled=false;clear();});
 }
 return Object.freeze({init,toggle,record,update,draw,clear,get active(){return active();},get samples(){return entries.map(entry=>({...entry}));}});
})();
