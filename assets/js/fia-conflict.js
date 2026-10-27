/* Provocation is reversible until victory; normal saves retain its baseline. */
'use strict';
const FiaConflict=(()=>{
 let encounter=null,serial=0,shield=0,recharge=0,shieldFlash=0,shieldBreak=0;
 const clone=data=>JSON.parse(JSON.stringify(data));
 const owned=()=>flags[3].includes('kibaShield');
 const profile=()=>{const rank=clamp(progression.stats.shield||0,0,STAT_LIMIT),rules=KIBA_SHIELD_RULES;return {capacity:rules.capacity+rank*rules.capacityStep,recharge:rules.recharge-rank*rules.rechargeStep};};
 const number=value=>Number(value.toFixed(2)).toLocaleString(I18n.locale,{maximumFractionDigits:2});
 const description=()=>{const p=profile();return I18n.format('ability.kibaShield.description',[number(p.capacity),number(p.recharge)]);};
 function statusHUD(){
  const node=$('kibaShieldStatus');node.hidden=!owned()||Prologue.active||state==='menu';if(node.hidden)return;
  const label=shield>0?I18n.format('ability.kibaShield.status',[number(shield),number(profile().capacity)]):I18n.t('ability.kibaShield')+' · '+I18n.format('ability.kibaShield.recharge',[Math.ceil(recharge)]);
  if(node.textContent!==label)node.textContent=label;node.title=description();
 }
 const slain=()=>flags[3].includes('fiaSlain');
 const location=()=>level===shadowDen?'shadowDen':level===fiaChambers?'fiaChambers':null;
 const blocked=()=>!!encounter;
 const current=e=>!!encounter&&encounter.enemy===e&&encounter.map===level&&enemies.includes(e)&&!e.dead;
 const arena=map=>({x:map===shadowDen?240:20,y:820,w:map===shadowDen?2440:1560});
 function friendly(){
  if(Prologue.active||!location()||blocked()||slain())return null;
  const npc=level.npcs.find(n=>n.id==='fia');return npc&&campNPCVisible(npc)?npc:null;
 }
 function pendingSave(){return encounter&&!encounter.replay?clone(encounter.baseline):null;}
 function restoreAnchor(anchor){
  if(!anchor||anchor.location!==location())return false;
  initPlayer({x:anchor.x,y:anchor.feet});player.hp=Math.min(anchor.hp,player.maxHp);player.face=anchor.face;
  if(anchor.tea)Merchant.restoreTea(anchor.tea);resetCamera();return true;
 }
 function clear(){
  const old=encounter;encounter=null;
  if(old?.enemy){old.enemy.dead=true;old.enemy.active=false;projectiles=projectiles.filter(p=>p.source!==FiaCombat.source(old.enemy));}
  FiaCombat.clear();return true;
 }
 function abort(){
  if(!encounter)return false;
  const old=encounter,baseline=clone(old.baseline),normal=saved,previousState=state;clear();
  saved=baseline;startGame(true);if(DevSession.active)saved=normal;if(previousState==='developer')state='developer';
  keys.clear();pressed.clear();updateHUD();return true;
 }
 function provoke(hit,{replay=false}={}){
  const npc=replay&&DevSession.active&&location()?level.npcs.find(n=>n.id==='fia'):friendly();if(state!=='play'||!npc||!hit||!overlap(hit,{x:npc.x-30,y:npc.y-npc.height+12,w:60,h:npc.height-12}))return false;
  const baseline=captureProgress();baseline.fiaRecovery={location:location(),x:player.x+player.w/2,feet:player.y+player.h,hp:player.hp,face:player.face,tea:Merchant.teaSnapshot()};
  const trial={id:++serial,map:level,baseline,replay,enemy:null};encounter=trial;persist();
  const spawn=()=>{
   if(encounter!==trial||level!==trial.map||state!=='play')return;
   const enemy=FiaCombat.create({id:'fia-vengeance-'+trial.id,miniboss:'fiaVengeance',x:npc.x,y:npc.y,arena:arena(level),replay});
   trial.enemy=enemy;enemies.push(enemy);attack=attackCooldown=0;attackHit=true;keys.clear();pressed.clear();updateHUD();
  };
  if(replay)spawn();else story('fia.name','fia.name','fia.conflict.provoked',spawn,{right:'fiaCombat',speaker:'fiaCombat'});return true;
 }
 function replay(){
  if(!DevSession.active||state!=='developer'||!DevTools.isOpen||!location())return false;
  abort();const npc=level.npcs.find(n=>n.id==='fia');if(!npc)return false;
  state='play';initPlayer({x:npc.x-240,y:npc.y});const ok=provoke({x:npc.x-35,y:npc.y-npc.height,w:70,h:npc.height},{replay:true});
  state='developer';DevTools.setReturnState('play');resetCamera();return ok;
 }
 function onDefeated(enemy){
  if(!encounter||encounter.enemy!==enemy||encounter.map!==level||!enemies.includes(enemy)||!enemy.dead||enemy.hp>0)return false;
  const replay=encounter.replay;encounter=null;FiaCombat.clear();projectiles=projectiles.filter(p=>p.source!==FiaCombat.source(enemy));
  if(replay)return true;
  if(slain())return false;
  flags[3].push('fiaSlain','fiaRewardClaimed','kitsuneSoul','kibaShield');progression.points++;resetPlayer();awardXP(1200);populateHostiles();persist();updateHUD();
  story('fia.name','fia.name','fia.conflict.victory',null,{right:'fiaCombat'});return true;
 }
 function populateHostiles(){
  if(!slain()||!location())return;
  for(const npc of level===shadowDen?level.npcs.filter(n=>n.id!=='fia'):[]){
   const id='den-hostile-'+npc.id;if(enemies.some(e=>e.id===id))continue;
   const enemy=createEnemy({id,x:npc.x,y:npc.y,kind:'guard',patrol:level.width,noReward:true,factionOverride:'shadowCult',denResidentRole:npc.id});
   enemy.hp=enemy.maxHp=90;enemy.y=npc.y-100;enemy.h=100;enemy.w=54;enemy.baseY=enemy.y;enemy.patrolLeft=20;enemy.patrolRight=level.width-80;enemy.origin=enemy.x;enemies.push(enemy);
  }
  for(const [index,x]of (level===shadowDen?[420,2280]:[280,1280]).entries()){
   const id='den-bodyguard-'+index;if(enemies.some(e=>e.id===id))continue;
   const enemy=ArenaCombat.create({id,miniboss:'arenaCyclops',singleGuard:true,x,y:820,arena:arena(level),denRetaliation:true,noReward:true});enemy.active=true;enemies.push(enemy);
  }
 }
 function npcVisible(npc){
  if(!location())return true;
  if(npc?.id==='fia')return !blocked()&&!slain();
  return !slain();
 }
 const retaliator=e=>!!e?.denRetaliation&&slain()&&!!location()&&enemies.includes(e);
 function clampProfile(){if(!owned()){shield=recharge=0;return;}const p=profile();shield=Math.min(shield,p.capacity);recharge=Math.min(recharge,p.recharge);}
 function resetPlayer(){shieldFlash=shieldBreak=0;shield=owned()?profile().capacity:0;recharge=0;FiaCombat.clear();}
 function update(dt){
  if(state!=='play'||Prologue.active||!Number.isFinite(dt)||dt<=0)return;
  FiaCombat.updateStatus(dt);shieldFlash=Math.max(0,shieldFlash-dt);shieldBreak=Math.max(0,shieldBreak-dt);
  if(owned()&&shield<=0){recharge=Math.max(0,recharge-dt);if(recharge<=0)shield=profile().capacity;}
  if(blocked()){
   const a=arena(level),x=clamp(player.x,a.x,a.x+a.w-player.w);if(x!==player.x){player.x=x;player.vx=0;}
  }
 }
 function absorb(amount){
  if(!owned()||!Number.isFinite(amount)||amount<=0||shield<=0)return amount;
  shieldFlash=.22;const absorbed=Math.min(amount,shield);shield-=absorbed;if(shield<1e-9){shield=0;recharge=profile().recharge;shieldBreak=.5;}
  burst(player.x+player.w/2,player.y+player.h*.5,'#d8b9ef',8);return Math.max(0,amount-absorbed);
 }
 function hud(){
  if(!encounter)return false;
  const e=encounter.enemy;$('bossHud').hidden=!e||e.dead;
  if(e&&!e.dead){$('bossName').textContent=I18n.t('fia.name');$('bossHealth').style.width=clamp(e.hp/e.maxHp*100,0,100)+'%';}
  return true;
 }
 return Object.freeze({blocked,current,friendly,pendingSave,restoreAnchor,clear,abort,provoke,replay,onDefeated,populateHostiles,npcVisible,retaliator,resetPlayer,update,absorb,hud,statusHUD,profile,clampProfile,number,description,owned,slain,
  get shieldFlash(){return shieldFlash;},get shieldBreak(){return shieldBreak;},get shield(){return shield;},get recharge(){return recharge;},get enemy(){return encounter?.enemy||null;}});
})();
