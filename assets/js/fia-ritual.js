/* The final request preserves its sacrifice history and retries only the fight. */
'use strict';
const FiaRitual=(()=>{
 let scene=null,encounter=null,serial=0;
 const clone=value=>JSON.parse(JSON.stringify(value)),has=id=>flags[3].includes(id);
 const active=()=>level===fiaRitual&&!Prologue.active;
 const available=()=>FiaRitualRules.relics.every(has)&&!has('fiaSlain');
 const pendingEscape=()=>FiaRitualRules.pendingEscape(flags);
 const blocked=()=>!!scene||!!encounter;
 const cinematic=()=>!!scene;
 const breakReady=()=>active()&&scene?.kind==='break';
 const current=e=>active()&&encounter?.enemy===e&&enemies.includes(e)&&e.active&&!e.dead;
 const hideFia=()=>active()&&(has('fiaAttendantsSacrificed')||!!encounter);
 const attendants=()=>[{colour:'white',map:shadowDen,x:1050,y:820,height:132,name:'fia.ritual.white'},{colour:'red',map:shadowUnderworld,x:500,y:1337,height:132,name:'fia.ritual.red'}];
 function apply(result){if(!result.ok)return false;flags=result.flags;progression.points+=result.rewards.points;awardXP(result.rewards.xp);persist();updateHUD();return true;}
 function talk(){
  if(!active()||state!=='play'||!available()||blocked()||!pointNear(level.npcs[0],100,90))return false;
  if(!has('fiaRitualAccepted')){if(!apply(FiaRitualRules.accept(flags)))return false;story('fia.ritual.quest','fia.name','fia.ritual.offer',null,{right:'fia',speaker:'fia'});return true;}
  if(has('fiaWhiteCalled')&&has('fiaRedCalled'))return ceremony();
  story('fia.ritual.quest','fia.name','fia.ritual.offer',null,{right:'fia',speaker:'fia'});return true;
 }
 function call(colour){
  const npc=attendants().find(n=>n.colour===colour);if(state!=='play'||blocked()||!npc||level!==npc.map||!pointNear(npc,100,90)||!apply(FiaRitualRules.callAttendant(flags,colour)))return false;
  story('fia.ritual.quest',npc.name,'fia.ritual.'+colour+'.dialogue',null,{right:'fia'+(colour==='white'?'White':'Red'),speaker:'fia'+(colour==='white'?'White':'Red')});return true;
 }
 function ceremony(){
  if(!active()||state!=='play'||blocked()||!apply(FiaRitualRules.sacrifice(flags)))return false;
  const hp=player.hp;scene={kind:'sacrifice',elapsed:0};projectiles=[];attack=dash=0;keys.clear();pressed.clear();initPlayer({x:1030,y:820});player.hp=Math.min(hp,player.maxHp);resetCamera();return true;
 }
 function breakChains(){
  if(!breakReady()||state!=='play')return false;scene={kind:'broken',elapsed:0};
  story('fia.ritual.quest','Momo','fia.ritual.break',()=>{if(active()&&scene?.kind==='broken'){scene=null;begin();}},{right:'fiaRitual',speaker:'momo'});return true;
 }
 function begin(replay=false){
  if(!active()||state!=='play'||encounter||!replay&&(!has('fiaAttendantsSacrificed')||has('fiaSlain')))return false;
  scene=null;const baseline=captureProgress(),trial={id:++serial,baseline,replay,enemy:null};encounter=trial;
  const enemy=FiaCombat.create({id:'fia-ritual-'+serial,miniboss:'fiaVengeance',ritual:true,x:1550,y:820,arena:{x:20,y:820,w:2160},replay});
  trial.enemy=enemy;enemies.push(enemy);projectiles=[];attack=attackCooldown=0;attackHit=true;keys.clear();pressed.clear();persist();updateHUD();return true;
 }
 function clear(){
  if(encounter?.enemy){encounter.enemy.dead=true;encounter.enemy.active=false;}encounter=null;scene=null;FiaCombat.clear();
 }
 const pendingSave=()=>encounter&&!encounter.replay?clone(encounter.baseline):null;
 function respawn(){
  if(!active()||!encounter)return false;
  const old=encounter,normal=saved;clear();saved=clone(old.baseline);startGame(true);if(DevSession.active)saved=normal;
  initPlayer({x:620,y:820});state='play';begin(old.replay);resetCamera();updateHUD();return true;
 }
 function onEmpowered(enemy){
  if(!current(enemy))return false;story('fia.ritual.quest','fia.name','fia.ritual.phase',null,{right:'fiaRitual',speaker:'fiaRitual'});return true;
 }
 function onDefeated(enemy){
  if(!encounter||encounter.enemy!==enemy||!active()||!enemies.includes(enemy)||!enemy.dead||enemy.hp>0)return false;
  const replay=encounter.replay;encounter=null;FiaCombat.clear();if(replay){updateHUD();return true;}
  const result=FiaRitualRules.win(flags);if(!result.ok)return false;
  flags=result.flags;if(!campServices.ownedWeapons.includes('foxfireKatana'))campServices.ownedWeapons.push('foxfireKatana');
  progression.points+=result.rewards.points;FiaConflict.resetPlayer();awardXP(result.rewards.xp);FiaConflict.populateHostiles();populateHostiles();persist();updateHUD();
  story('fia.ritual.quest','fia.name','fia.ritual.victory',null,{right:'fiaRitual'});return true;
 }
 function escaped(destination){
  if(!pendingEscape()||level!==shadowDen||destination!==levels[3]||!pointNear(level.returnPoint,110,90))return false;
  return apply(FiaRitualRules.escape(flags));
 }
 function context(){
  if(Prologue.active||blocked()||!has('fiaRitualAccepted')||has('fiaSlain'))return null;
  const npc=attendants().find(n=>n.map===level&&!has(FiaRitualRules.progress[n.colour])&&pointNear(n,100,90));
  return npc?{type:'ritualAttendant',colour:npc.colour,text:I18n.format('camp.talk',[I18n.t(npc.name)])}:null;
 }
 function interact(candidate){const actual=context();return state==='play'&&!!actual&&actual.type===candidate?.type&&actual.colour===candidate?.colour&&call(actual.colour);}
 function questMarker(id){
  if(id==='fia'&&active()&&available())return !has('fiaRitualAccepted')?'!':has('fiaWhiteCalled')&&has('fiaRedCalled')?'?':null;
  return null;
 }
 function objective(){
  if(pendingEscape()&&[fiaRitual,fiaChambers,shadowDen,shadowUnderworld,shadowArena,voidForbidden].includes(level))return {point:level.returnPoint,name:'fia.den.name',text:'fia.ritual.objective.escape'};
  if(!has('fiaRitualAccepted')||has('fiaSlain'))return null;
  if(active()&&breakReady())return {compass:false,text:'ziggurat.objective.ultimate'};
  if(active()&&has('fiaAttendantsSacrificed'))return {point:encounter?.enemy||level.npcs[0],name:'fia.name',text:'fia.ritual.objective.fight'};
  const missing=attendants().filter(n=>!has(FiaRitualRules.progress[n.colour]));
  if(missing.length){const local=missing.find(n=>n.map===level);return {point:local||level.returnPoint,compass:!!local,name:local?.name||'fia.ritual.quest',text:I18n.format('fia.ritual.objective.call',[2-missing.length])};}
  return {point:active()?level.npcs[0]:level.returnPoint,compass:active(),name:'fia.name',text:'fia.ritual.objective.return'};
 }
 function update(dt){
  if(state!=='play'||Prologue.active||!Number.isFinite(dt)||dt<=0)return;
  if(active()&&!scene&&!encounter&&!FiaConflict.blocked()&&has('fiaAttendantsSacrificed')&&!has('fiaSlain'))begin();
  if(scene){scene.elapsed+=dt;player.vx=0;if(scene.kind==='sacrifice'&&scene.elapsed>=5){scene={kind:'narration',elapsed:0};story('fia.ritual.quest','fia.name','fia.ritual.betrayal',()=>{
    if(!active()||!scene)return;story('fia.ritual.quest','fia.name','fia.ritual.provoked',()=>{if(active()&&scene){scene={kind:'break',elapsed:0};Dawnblade.awaken();updateHUD();}},{right:'fiaRitual',speaker:'fiaRitual'});
   },{right:'fiaRitual'});}return;}
  if(encounter){const a=encounter.enemy.arena;player.x=clamp(player.x,a.x,a.x+a.w-player.w);}
 }
 function hud(){if(!active()||!encounter)return false;const e=encounter.enemy;$('bossHud').hidden=e.dead;if(!e.dead){$('bossName').textContent=I18n.t('fia.name')+(e.ritualEmpowered?' · '+I18n.t('fia.ritual.consumed'):'');$('bossHealth').style.width=Math.max(0,e.hp/e.maxHp)*100+'%';}return true;}
 function replay(){if(!DevSession.active||state!=='developer'||!DevTools.isOpen||!active())return false;clear();state='play';initPlayer({x:620,y:820});const ok=begin(true);state='developer';DevTools.setReturnState('play');resetCamera();return ok;}
 function populateHostiles(){
  if(level!==shadowUnderworld||!has('fiaRitualCompleted'))return;
  for(const npc of level.npcs){const id='void-service-'+npc.service;if(enemies.some(e=>e.id===id))continue;
   const e=createEnemy({id,x:npc.x,y:npc.y,kind:'mage',patrol:400,noReward:true,underworldHostileRole:npc.service,factionOverride:'shadowCult'});
   e.hp=e.maxHp=120;e.w=64;e.h=132;e.y=npc.y-e.h;e.baseY=e.y;e.damageValue=3;e.patrolLeft=20;e.patrolRight=level.width-80;e.origin=e.x;enemies.push(e);
  }
  for(const npc of level.residents){const id='void-resident-'+npc.id;if(enemies.some(e=>e.id===id))continue;
   const e=createEnemy({id,x:npc.x,y:npc.y,kind:'guard',patrol:400,noReward:true,denResidentRole:npc.id,factionOverride:'shadowCult'});
   e.hp=e.maxHp=90;e.w=54;e.h=100;e.y=npc.y-e.h;e.baseY=e.y;e.patrolLeft=20;e.patrolRight=level.width-80;e.origin=e.x;enemies.push(e);
  }
 }
 const corrupted=e=>has('fiaRitualCompleted')&&(!!e?.denResidentRole||!!e?.denRetaliation||!!e?.underworldHostileRole);
 return Object.freeze({active,available,pendingEscape,blocked,cinematic,breakReady,breakChains,current,hideFia,attendants,talk,call,ceremony,begin,clear,pendingSave,respawn,onEmpowered,onDefeated,escaped,context,interact,questMarker,objective,update,hud,replay,populateHostiles,corrupted,get scene(){return scene;},get enemy(){return encounter?.enemy||null;}});
})();
