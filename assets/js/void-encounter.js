/* The rift owns its attempt and attack generation; no state crosses retries. */
'use strict';
const VoidEncounter=(()=>{
 let combat=null,actor=null,serial=0,clock=0,stage='wait',cycle=0,warning=null,impact=null,inv=0,pose=0,replay=false,healFlash=0;
 const owners=new WeakMap(),has=id=>flags[3].includes(id);
 const active=()=>level===voidForbidden&&!Prologue.active;
 const live=()=>active()&&!!combat&&['lieutenant','absorbing','demon'].includes(combat.phase);
 const locked=()=>live();
 const currentSource=()=>combat?'void:'+combat.attempt+':'+combat.generation:null;
 function cleanShots(){projectiles=projectiles.filter(p=>!p.source?.startsWith('void:'));}
 function clear(){combat=null;actor=null;warning=impact=null;clock=0;stage='wait';cycle=0;inv=0;pose=0;replay=false;healFlash=0;cleanShots();}
 function begin(test=false){
  if(!active()||state!=='play'||live()||!test&&(!has('fiaVoidAccepted')||has('voidDemonDefeated'))||serial===Number.MAX_SAFE_INTEGER)return false;
  clear();replay=test;combat=VoidEncounterRules.fresh(++serial);actor={x:2750,y:940-170,w:80,h:170,face:-1,hp:combat.hp,maxHp:combat.maxHp,active:true,dead:false,name:'fia.void.lieutenant'};clock=1.2;updateHUD();return true;
 }
 function sync(){if(actor&&combat){actor.hp=combat.hp;actor.maxHp=combat.maxHp;actor.dead=combat.won||combat.failed;actor.name=combat.generation===2?'fia.void.demon':'fia.void.lieutenant';}}
 function apply(result){
  if(!result.ok)return false;combat=result.state;sync();
  if(result.event==='absorb'){cleanShots();warning=impact=null;stage='absorb';clock=1.5;pose=5;}
  if(result.event==='emerge'){cleanShots();actor.h=240;actor.w=150;actor.y=940-actor.h;clock=.8;stage='emerge';pose=0;}
  if(result.event==='victory'){cleanShots();warning=null;impact=null;if(!replay){FiaVoidJourney.apply(FiaJourneyRules.defeatVoid(fiaJourney,flags,defeated));toast(I18n.t('fia.void.sealed'));}updateHUD();}
  if(result.event==='overwhelmed'){cleanShots();warning=null;stage='failed';pose=7;clock=0;story('fia.void.quest','fia.void.demon','fia.void.warning',()=>{if(active()&&combat?.failed)retry();},{button:'camp.master.retry'});}
  return true;
 }
 function retry(){
  if(!active())return false;const test=replay;clear();initPlayer({x:1550,y:940});resetCamera();state='play';begin(test);return true;
 }
 function respawn(){if(!live())return false;return retry();}
 function hit(box,amount){
  if(!live()||state!=='play'||combat.phase==='absorbing'||inv>0||!box||!Number.isFinite(amount)||amount<=0||!overlap(box,actor))return false;
  const before=combat.hp,result=VoidEncounterRules.hit(combat,amount);if(!result.ok)return false;
  inv=.2;DevDamage.record('outgoing',actor,before,result.state.hp);return apply(result);
 }
 function absorbActual(victim,before,owner){
  if(!live()||state!=='play'||combat.phase!=='demon'||player!==victim||victim.hp<=0||!Number.isFinite(before))return false;
  const loss=Math.max(0,before-victim.hp);if(loss<=0)return false;const result=VoidEncounterRules.heal(combat,loss,owner);if(result.ok&&result.healed>0)healFlash=.35;return apply(result);
 }
 function hurt(box,amount,owner){
  if(!overlap(player,box))return;const victim=player,before=victim.hp;damage(amount,actor.face,true);absorbActual(victim,before,owner);
 }
 function shot(angle,token){
  const x=actor.x+actor.w/2,y=actor.y+actor.h*.4;shoot(x,y,Math.cos(angle)*410,Math.sin(angle)*410,'#bba4f1',4,'orb');const p=projectiles.at(-1);
  Object.assign(p,{source:currentSource(),damage:4,radius:11});owners.set(p,{token,map:level});
 }
 function projectile(p,victim,before){const owner=owners.get(p);owners.delete(p);return !!owner&&owner.map===level&&absorbActual(victim,before,owner.token);}
 function tell(){
  const demon=combat.phase==='demon',targetX=player.x+player.w/2,targetY=player.y+player.h*.5,a=level.voidArena;
  let kind=cycle++%(demon?3:2)===0?'melee':cycle%3===0?'rift':'volley';
  if(kind==='melee'&&Math.abs(targetX-actor.x-actor.w/2)>360)kind='volley';
  const w=kind==='melee'?(demon?350:270):kind==='rift'?330:150;
  warning={kind,token:VoidEncounterRules.token(combat),x:targetX,y:targetY,box:{x:clamp(targetX-w/2,a.x,a.x+a.w-w),y:a.y-(kind==='melee'?180:140),w,h:kind==='melee'?180:140}};
  stage='windup';clock=kind==='rift'?1.15:.85;pose=kind==='melee'?(demon?3:3):demon?5:3;
 }
 function release(){
  const tell=warning;warning=null;if(!tell)return;stage='recover';clock=.65;pose=combat.phase==='demon'?4:4;
  if(tell.kind==='volley'){
   const angle=Math.atan2(tell.y-actor.y-actor.h*.4,tell.x-actor.x-actor.w/2);for(let i=-1;i<=1;i++)shot(angle+i*.18,tell.token);
  }else{impact={box:tell.box,remaining:.4,kind:tell.kind};hurt(tell.box,combat.phase==='demon'?5:3,tell.token);}
 }
 function update(dt){
  if(!active()||state!=='play'||!Number.isFinite(dt)||dt<=0)return;
  if(!combat&&!has('voidDemonDefeated')&&(has('fiaVoidAccepted')||DevSession.active)&&player.x>level.voidArena.x+50)begin(DevSession.active&&!has('fiaVoidAccepted'));
  if(!live())return;
  const a=level.voidArena;player.x=clamp(player.x,a.x,a.x+a.w-player.w);inv=Math.max(0,inv-dt);healFlash=Math.max(0,healFlash-dt);clock-=dt;
  if(impact){impact.remaining-=dt;if(impact.remaining<=0)impact=null;}
  if(combat.phase==='absorbing'){if(clock<=0)apply(VoidEncounterRules.emerge(combat));return;}
  if(stage==='emerge'){if(clock<=0){stage='wait';clock=.7;pose=1;}return;}
  if(stage==='wait'){
   const dx=player.x+player.w/2-actor.x-actor.w/2;actor.face=dx<0?-1:1;
   if(Math.abs(dx)>260){actor.x=clamp(actor.x+actor.face*(combat.phase==='demon'?200:260)*dt,a.x+30,a.x+a.w-actor.w-30);pose=reducedMotion.matches?0:1+Math.floor(time*7)%2;}else pose=combat.phase==='demon'?1:0;
   if(clock<=0)tell();
  }else if(stage==='windup'&&clock<=0)release();
  else if(stage==='recover'&&clock<=0){stage='wait';clock=.7;pose=0;}
 }
 function hud(){
  if(!active()||!combat)return false;$('bossHud').hidden=!live();if(live()){$('bossName').textContent=I18n.t(actor.name)+(combat.phase==='demon'?' · '+I18n.t('fia.void.warning'):'');$('bossHealth').style.width=combat.hp/combat.maxHp*100+'%';}return true;
 }
 function replayFight(){if(!DevSession.active||state!=='developer'||!DevTools.isOpen||!active())return false;clear();state='play';initPlayer({x:1550,y:940});const ok=begin(true);state='developer';DevTools.setReturnState('play');return ok;}
 return Object.freeze({active,live,locked,begin,clear,respawn,hit,projectile,update,hud,replay:replayFight,get actor(){return actor;},get snapshot(){return combat?{...combat}:null;},get warning(){return warning;},get impact(){return impact;},get pose(){return stage==='failed'?7:healFlash>0?6:pose;},get stage(){return stage;}});
})();
