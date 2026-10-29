/* Bounded, in-memory diagnostics. Never writes actors, projectiles or saves. */
'use strict';
const DevLog=(()=>{
 const LIMIT=300,FIELD_LIMIT=128,RENDER_MS=125;
 let enabled=false,initialized=false,entries=[],source=null,projectileSources=new WeakMap(),observed=new WeakMap(),deaths=new WeakSet();
 let origin=0,lastTime=0,nextRender=0,dirty=true,lastLocation=null,follow=true,panel=null,title=null,info=null,list=null,empty=null,clearButton=null,hideButton=null,followInput=null,followText=null;
 const active=()=>enabled&&DevSession.active;
 const clock=()=>typeof performance!=='undefined'&&typeof performance.now==='function'?performance.now():Date.now();
 const scalar=value=>typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,FIELD_LIMIT):typeof value==='number'&&Number.isFinite(value)?value:null;
 const number=value=>Number.isFinite(value)?Math.round(Math.max(0,value)*100)/100:0;
 const playerName=()=>typeof player!=='undefined'&&player?.logName?scalar(player.logName):'Momo';
 function snapshot(actor,moveOverride){
  if(!actor||typeof actor!=='object')return null;
  let name=scalar(actor.logName)||scalar(actor.name);
  if(!name&&typeof player!=='undefined'&&actor===player)name=playerName();
  if(!name&&typeof boss!=='undefined'&&actor===boss)name=typeof Prologue!=='undefined'&&Prologue.active?'prologue.boss':typeof realms!=='undefined'&&typeof realm!=='undefined'?scalar(realms[realm]?.boss):null;
  return Object.freeze({name:name||scalar(actor.kind)||scalar(actor.miniboss)||scalar(actor.id)||'?',id:scalar(actor.id),
   move:scalar(moveOverride)||(['windup','strike','cast'].includes(actor.autoPhase)?'autoAttack':(actor.mode==='drain'?'drain':scalar(actor.move))||scalar(actor.kind)||''),hp:number(actor.hp),maxHp:number(actor.maxHp??actor.max??actor.hp)});
 }
 function push(type,values){
  if(!active())return false;
  lastTime=Math.max(lastTime,Math.max(0,Math.floor(clock()-origin)));
  const entry=Object.freeze({type,time:lastTime,values:Object.freeze(values.map(value=>scalar(value)??''))});
  if(entries.length===LIMIT)entries.shift();entries.push(entry);dirty=true;return true;
 }
 function reset(){
  entries=[];source=null;projectileSources=new WeakMap();observed=new WeakMap();deaths=new WeakSet();lastLocation=null;
  origin=clock();lastTime=0;nextRender=0;dirty=true;
 }
 function clear(){reset();render(true);}
 function action(id){
  if(!active()||typeof id!=='string'||typeof Bindings==='undefined'||!Bindings.actions.includes(id))return false;
  return push('action',[playerName(),'binding.action.'+id]);
 }
 function ability(actor,stage,move){
  if(!active()||!['windup','strike','cast','drain'].includes(stage))return false;
  const value=snapshot(actor,move);if(!value)return false;
  return push(stage==='windup'?'preparing':'attack',[value.name,value.move]);
 }
 function observeOne(actor,phase,move,parent=null){
  if(!actor||typeof actor!=='object')return;
  const previous=observed.get(actor)||{},main=scalar(phase)??scalar(actor.phase)??(actor.windup>0?'windup':actor.attackTime>0?'strike':'wait'),
   attack=scalar(move)||(main==='drain'?'drain':scalar(actor.move))||scalar(parent?.move)||scalar(actor.kind)||'',auto=scalar(actor.autoPhase)||'';
  const name=parent?{logName:snapshot(parent)?.name+' #'+(Number.isInteger(actor.index)?actor.index+1:1),move:attack}:actor;
  if(!actor.dead&&actor.hp!==0){
   if(main!==previous.phase||attack!==previous.move)if(['windup','strike','cast','drain'].includes(main))ability(name,main,attack);
   if(auto!==previous.auto&&['windup','strike','cast'].includes(auto))ability(name,auto,'autoAttack');
  }
  if(actor.hp>0)deaths.delete(actor);
  observed.set(actor,{phase:main,move:attack,auto});
 }
 function observe(actor,phase,move){
  if(!active()||!actor||typeof actor!=='object'||actor.dead||actor.hp===0)return;
  // Paired cyclopes have independent state machines. The group mirrors a
  // leading part, which must not produce a second copy of that part's event.
  const parts=Array.isArray(actor.parts)?actor.parts.filter(part=>part&&typeof part.phase==='string'):[];
  if(parts.length)for(const part of parts)observeOne(part,null,move,actor);
  else observeOne(actor,phase,move);
 }
 function scope(actor,fn,moveOverride){
  if(!active())return fn();
  const previous=source,shots=typeof projectiles!=='undefined'&&Array.isArray(projectiles)?projectiles:null,start=shots?.length||0;
  source=snapshot(actor,moveOverride);observe(actor,null,moveOverride);
  try{return fn();}
  finally{
   try{
    const current=typeof projectiles!=='undefined'&&Array.isArray(projectiles)?projectiles:null;
    if(current===shots){if(shots)for(let i=start;i<shots.length;i++)stampProjectile(shots[i]);}
    else if(current)for(const shot of current)if(!shots?.includes(shot))stampProjectile(shot);
    observe(actor,null,moveOverride);
   }finally{source=previous;}
  }
 }
 function stampProjectile(projectile){
  if(active()&&source&&projectile&&typeof projectile==='object'&&!projectileSources.has(projectile))projectileSources.set(projectile,source);
  return projectile;
 }
 function projectile(shot,fn){
  if(!active())return fn();const previous=source;source=shot&&typeof shot==='object'?projectileSources.get(shot)||null:null;
  try{return fn();}finally{source=previous;}
 }
 function damage(kind,target,before,after){
  if(!active()||!['incoming','outgoing'].includes(kind)||!Number.isFinite(before)||!Number.isFinite(after)||before<=0)return false;
  const amount=number(Math.min(before,Math.max(0,before-Math.max(0,after)))),victim=snapshot(target);
  if(!amount||!victim)return false;
  const attacker=kind==='outgoing'?playerName():source?.name?(source.name+(source.move?' · '+source.move:'')):null;
  if(attacker)push('damage',[attacker,victim.name,amount,number(after),victim.maxHp]);
  else push('received',[victim.name,amount,number(after),victim.maxHp]);
  if((target.dead===true||after<=0&&target.logPhaseReset!==true)&&!deaths.has(target)){deaths.add(target);push('defeated',[victim.name]);}
  return true;
 }
 function health(actor){return number(actor?.hp)+' / '+number(actor?.maxHp??actor?.max??actor?.hp);}
 function timestamp(ms){
  const seconds=Math.floor(ms/1000),pad=(value,length=2)=>String(value).padStart(length,'0');
  return pad(Math.floor(seconds/3600))+':'+pad(Math.floor(seconds/60)%60)+':'+pad(seconds%60)+'.'+pad(ms%1000,3);
 }
 function translated(key){return I18n.t(key);}
 function render(force=false){
  if(!panel)return;
  panel.hidden=!active();if(!active())return;
  const now=clock();if(!force&&(!dirty||now<nextRender))return;nextRender=now+RENDER_MS;dirty=false;
  const oldTop=list.scrollTop||0;
  title.textContent=translated('dev.log.title');info.textContent=translated('dev.log.info');clearButton.textContent=translated('dev.log.clear');hideButton.textContent=translated('dev.log.hide');followText.textContent=translated('dev.log.follow');
  panel.setAttribute('aria-label',translated('dev.log.title'));list.setAttribute('aria-label',translated('dev.log.title'));empty.textContent=translated('dev.log.empty');empty.hidden=entries.length>0;
  const rows=entries.map(entry=>{
   const row=document.createElement('li'),time=document.createElement('span'),message=document.createElement('span');
   row.className='dev-live-log-row dev-live-log-'+entry.type;time.className='dev-live-log-time';time.textContent=timestamp(entry.time);
   message.textContent=I18n.format('dev.log.'+entry.type,entry.values.map(value=>typeof value==='string'?translated(value):value));row.append(time,message);return row;
  });
  list.replaceChildren(...rows);list.scrollTop=follow?list.scrollHeight:oldTop;
 }
 function frame(){
  if(!active()){if(panel)panel.hidden=true;return;}
  const location=typeof Prologue!=='undefined'&&Prologue.active?'prologue.place':typeof level!=='undefined'?(scalar(level.name)||(typeof levels!=='undefined'&&levels[realm]===level?scalar(realms[realm]?.name):null)||scalar(level.id)):null;
  if(location&&location!==lastLocation){lastLocation=location;push('location',[location]);}
  render();
 }
 function hide(){enabled=false;reset();if(panel)panel.hidden=true;}
 function toggle(){
  if(!DevSession.active||state!=='developer'||!DevTools.isOpen)return false;
  if(enabled)hide();else{enabled=true;reset();render(true);}return true;
 }
 function init(){
  if(initialized)return;initialized=true;
  DevTools.register({id:'live-log',labelKey:'dev.log.title',available:()=>DevSession.active,toggled:active,run:toggle});
  DevSession.onEnd(hide);I18n.onChange(()=>{dirty=true;render(true);});
  const game=document.getElementById('game');if(!game?.append)return;
  panel=document.createElement('section');panel.id='devLiveLog';panel.className='dev-live-log';panel.hidden=true;panel.setAttribute('role','region');panel.setAttribute('aria-live','off');
  const header=document.createElement('div'),controls=document.createElement('div'),followLabel=document.createElement('label');
  header.className='dev-live-log-header';controls.className='dev-live-log-controls';title=document.createElement('h2');title.id='devLiveLogTitle';
  clearButton=document.createElement('button');clearButton.type='button';clearButton.id='devLiveLogClear';clearButton.onclick=clear;
  hideButton=document.createElement('button');hideButton.type='button';hideButton.id='devLiveLogHide';hideButton.onclick=()=>{hide();const focus=document.getElementById(DevTools.isOpen?'dev-tool-live-log':'pauseButton');focus?.focus?.();};
  followInput=document.createElement('input');followInput.type='checkbox';followInput.checked=follow;followInput.id='devLiveLogFollow';followText=document.createElement('span');followLabel.append(followInput,followText);
  followInput.onchange=()=>{follow=!!followInput.checked;dirty=true;render(true);};controls.append(clearButton,followLabel,hideButton);header.append(title,controls);
  info=document.createElement('p');info.className='dev-live-log-info';empty=document.createElement('p');empty.className='dev-live-log-empty';
  list=document.createElement('ol');list.className='dev-live-log-entries';list.tabIndex=0;list.setAttribute('aria-live','off');
  panel.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape'){event.preventDefault();hideButton.onclick();}});
  // Key/button releases still reach the game, so focusing this panel while
  // moving or attacking cannot leave a previously held input stuck down.
  panel.addEventListener('mousedown',event=>event.stopPropagation());
  panel.append(header,info,empty,list);game.append(panel);
 }
 return Object.freeze({init,toggle,clear,action,ability,scope,observe,damage,stampProjectile,projectile,frame,health,get active(){return active();},get samples(){return entries.map(entry=>({...entry,values:[...entry.values]}));}});
})();
