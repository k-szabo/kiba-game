/* Reusable dungeon journey: run flags reset explicitly; first-clear rewards do not. */
'use strict';
let dungeonState=DungeonRules.fresh();
const DungeonRun=(()=>{
 let menuToken=0,pending=[];
 const summonOwners=new WeakMap();
 const active=()=>!Prologue.active&&!!level.dungeon;
 const floor=()=>active()?level.dungeon.floor:-1;
 const definition=id=>DUNGEON_CATALOGUE[id||dungeonId()];
 const rules=id=>DungeonRules.definitions[id||dungeonId()];
 const entrance=()=>Object.values(DUNGEON_CATALOGUE).find(spec=>level===spec.entryMap&&pointNear(spec.entryPoint,130,110)&&(spec.id!=='sectFall'||DevSession.active||abilities[1]&&flags[0].includes('guardian:oldCultist')));
 const dungeonId=()=>active()?level.dungeon.id:entrance()?.id||'yomiFall';
 const owns=(id,which=dungeonId())=>flags[definition(which).realm].includes(id);
 const runId=(id=dungeonId())=>DungeonRules.runInfo(dungeonState,id)?.run??0;
 const cleared=(index,id=dungeonId())=>owns(definition(id).rewards[index]?.stage,id);
 const checkpointFloor=(point,id=dungeonId())=>definition(id).floors.find(map=>[...map.rests,...map.checkpoints].some(r=>r.id===point?.id));
 const saveLocation=()=>active()?checkpointFloor(checkpoint)?.id||level.id:CampQuest.locationId();
 const atScroll=(id=null)=>!!entrance()&&(!id||entrance().id===id);
 function cancel(){menuToken++;$('dungeonMenu').hidden=true;cleanupSummons();}
 function menu(){
  if(state!=='play'||!atScroll())return false;
  const spec=entrance(),id=spec.id;
  if(id==='sectFall'&&!owns('cultTempleDiscovered',id)){flags[0].push('cultTempleDiscovered');persist();}
  const token=++menuToken;state='dungeonMenu';keys.clear();pressed.clear();$('dungeonMenu').hidden=false;
  for(const [id,key]of Object.entries({dungeonMenuTitle:'dungeon.scroll.title',dungeonMenuInfo:'dungeon.run.info',dungeonContinue:'dungeon.continue',dungeonNew:'dungeon.new',dungeonBack:'dungeon.back'}))$(id).textContent=I18n.t(key);
  $('dungeonMenuTitle').textContent=I18n.t(spec.title);
  $('dungeonContinue').disabled=!owns(rules(id).started,id);
  const valid=()=>state==='dungeonMenu'&&token===menuToken&&atScroll(id);
  $('dungeonBack').onclick=()=>{if(valid()){cancel();state='play';keys.clear();pressed.clear();}};
  $('dungeonContinue').onclick=()=>{if(valid()&&owns(rules(id).started,id)){cancel();state='play';resume();}};
  $('dungeonNew').onclick=()=>{if(valid()){cancel();state='play';newRun();}};
  $('dungeonContinue').disabled?$('dungeonNew').focus():$('dungeonContinue').focus();return true;
 }
 function keydown(event){
  if(state!=='dungeonMenu')return;
  if(event.key==='Escape'){event.preventDefault();$('dungeonBack').onclick();return;}
  if(event.key!=='Tab')return;
  const choices=['dungeonContinue','dungeonNew','dungeonBack'].map($).filter(button=>!button.disabled),i=choices.indexOf(document.activeElement);
  event.preventDefault();choices[(i+(event.shiftKey?-1:1)+choices.length)%choices.length].focus();
 }
 function enterFloor(index,{point=null,atShrine=false,preserveCheckpoint=true,id=dungeonId()}={}){
  const map=definition(id)?.floors[index];if(!map)return false;
  const old=checkpointFloor(checkpoint,id)?{...checkpoint}:null,hp=player?.hp;
  if(!CampQuest.enter(map.id,{point,atShrine,save:false}))return false;
  if(!atShrine&&preserveCheckpoint&&old&&!old.checkpointOnly)checkpoint=old;
  if(!atShrine&&Number.isFinite(hp))player.hp=Math.min(hp,player.maxHp);
  persist();updateHUD();return true;
 }
 function newRun(){
  if(state!=='play'||!atScroll())return false;
  const spec=entrance(),id=spec.id,r=rules(id);
  if(!DevSession.active&&(!defeated[spec.realm]||!r.requiredFlags.every(flag=>owns(flag,id))))return false;
  const roll=Math.random()<.25?DungeonRules.enhancements[Math.min(2,Math.floor(Math.random()*3))]:null,result=DungeonRules.begin(dungeonState,roll,id);if(!result.ok)return false;
  const currentFlags=[r.started,...r.stages,r.chest];dungeonState=result.state;flags[spec.realm]=flags[spec.realm].filter(flag=>!currentFlags.includes(flag));flags[spec.realm].push(r.started);
  const ids=new Set(spec.floors.flatMap(map=>[...map.rests,...map.checkpoints].map(rest=>rest.id)));visitedRests[spec.realm]=visitedRests[spec.realm].filter(rest=>!ids.has(rest));
  const run=runId(id);persist();story(spec.name,spec.title,spec.intro,()=>{if(state==='play'&&runId(id)===run&&atScroll(id))enterFloor(0,{preserveCheckpoint:false,id});});return true;
 }
 function resume(){
  if(state!=='play'||!atScroll())return false;
  const spec=entrance();if(!owns(rules(spec.id).started,spec.id))return false;
  for(let i=2;i>=0;i--){const map=spec.floors[i];if(!DevSession.active&&!sideLocationUnlocked(map.id,flags,defeated))continue;
   const point=map.rests.find(rest=>visitedRests[spec.realm].includes(rest.id));if(point)return enterFloor(i,{point,atShrine:true,id:spec.id});
  }return enterFloor(0,{preserveCheckpoint:false,id:spec.id});
 }
 function leave(){
  if(state!=='play'||!active())return false;
  const spec=definition(),hp=player.hp;
  enterRealm(spec.realm,levels[spec.realm].rests.findLast(rest=>visitedRests[spec.realm].includes(rest.id))||levels[spec.realm].rests[0]);
  if(spec.id==='yomiFall'&&!enterCouncilHall())return false;
  initPlayer(spec.entryPoint);player.hp=Math.min(hp,player.maxHp);resetCamera();persist();updateHUD();return true;
 }
 function respawn(){
  if(!active())return false;const map=checkpointFloor(checkpoint),point={...checkpoint};
  if(map&&map!==level){if(!enterFloor(map.dungeon.floor,{point,atShrine:true}))return false;}
  else{initPlayer(checkpoint);respawnEnemies();resetMinibosses();projectiles=[];resetCamera();updateHUD();}
  return true;
 }
 function stock(id){return DungeonRules.quantity(dungeonState,id);}
 function addItem(id,quantity=1){const result=DungeonRules.addStock(dungeonState,id,quantity);if(!result.ok)return false;dungeonState=result.state;return true;}
 function removeItem(id,quantity=1){const result=DungeonRules.removeStock(dungeonState,id,quantity);if(!result.ok)return false;dungeonState=result.state;return true;}
 function canConsume(id){return DungeonRules.consume(dungeonState,id,abilities).ok;}
 function consume(id){
  if(state!=='inventory'||Prologue.active||!player||player.hp<=0)return false;
  const result=DungeonRules.consume(dungeonState,id,abilities);
  if(!result.ok){if(result.reason==='abilityRequired'||result.reason==='maxRank')toast(I18n.t(result.reason==='abilityRequired'?'dungeon.enhancement.ability':'dungeon.enhancement.limit'));return false;}
  dungeonState=result.state;persist();updateHUD();toast(I18n.t('dungeon.enhancement.applied'));return true;
 }
 function onBossDefeated(enemy){
  const index=floor(),spec=definition(),reward=spec.rewards[index];
  if(state!=='play'||index<0||!reward||runId()<=0||enemy.replay||!enemies.includes(enemy)||!enemy.dead||enemy.runId!==runId()||enemy.dungeonId!==spec.id||enemy.miniboss!==reward.type||cleared(index)||index>0&&!cleared(index-1))return false;
  flags[spec.realm].push(reward.stage);
  if(!owns(reward.claim)){flags[spec.realm].push(reward.claim);progression.points+=reward.points;if(reward.soul&&!owns(reward.soul))flags[spec.realm].push(reward.soul);}
  pending=[];for(const e of enemies)if(e.dungeonSummon){e.dead=true;e.active=false;}
  projectiles=projectiles.filter(p=>p.source!==DungeonCombat.source(enemy)&&p.source!=='dungeon-minion');
  FiaQuest.onPriestessDefeated(enemy);Merchant.award(reward.coins);awardXP(reward.xp);persist();updateHUD();
  if(index===2)story(spec.name,enemy.name,spec.victory);return true;
 }
 function openChest(){
  if(state!=='play'||floor()!==2||!pointNear(level.rewardChest,100,100)||!cleared(2)||runId()<=0)return false;
  const r=rules(),spec=definition(),roll=DungeonRules.runInfo(dungeonState,spec.id).roll;
  if(owns(r.chest)){toast(I18n.t('dungeon.chest.empty'));return false;}
  const seal=DungeonRules.addStock(dungeonState,r.loot,1);if(!seal.ok)return false;
  const result=roll?DungeonRules.addStock(seal.state,roll,1):seal;if(!result.ok)return false;
  if(coins>Number.MAX_SAFE_INTEGER-250)return false;
  dungeonState=result.state;flags[spec.realm].push(r.chest);Merchant.award(250);persist();updateHUD();toast(I18n.t('dungeon.chest.claimed'));return true;
 }
 function context(){
  if(Prologue.active)return null;
  if(atScroll())return {type:'dungeonScroll',id:entrance().id,text:I18n.t(entrance().prompt)};
  if(!active())return null;
  const index=floor();
  if(index===2&&cleared(2)&&pointNear(level.rewardChest,100,100))return {type:'dungeonChest',text:I18n.t(owns(rules().chest)?'dungeon.chest.empty':'dungeon.chest.open')};
  if(pointNear(level.returnPoint,100,85))return {type:index===0?'dungeonLeave':'dungeonPrevious',text:I18n.t(index===0?definition().returnPrompt:'dungeon.previous')};
  if(cleared(index)&&pointNear(level.nextPoint,100,100))return {type:index===2?'dungeonLeave':'dungeonNext',text:I18n.t(index===2?definition().returnPrompt:'dungeon.next')};return null;
 }
 function interact(candidate){
  if(state!=='play'||!candidate)return false;const actual=context();if(!actual||actual.type!==candidate.type)return false;
  if(actual.type==='dungeonScroll')return (!candidate.id||candidate.id===actual.id)&&menu();if(actual.type==='dungeonChest')return openChest();if(actual.type==='dungeonLeave')return leave();
  if(actual.type==='dungeonPrevious')return enterFloor(floor()-1);if(actual.type==='dungeonNext')return enterFloor(floor()+1);return false;
 }
 function objective(){
  if(level===councilHall)return {point:level.memoryScroll,compass:false,text:'dungeon.scroll.prompt'};
  if(!active())return null;const index=floor();return {point:cleared(index)?index===2?level.rewardChest:level.nextPoint:level.arena,compass:false,text:cleared(2)?dungeonId()==='sectFall'?'cultDungeon.objective.chest':'dungeon.objective.chest':'dungeon.objective.boss'};
 }
 function currentOwner(owner){
  return active()&&DungeonCombat.is(owner)&&['dungeonNecromancer','cultHighPriestess'].includes(owner.miniboss)&&
   (DungeonCombat.profiles[owner.miniboss].dungeon||'yomiFall')===dungeonId()&&owner.runId===runId()&&owner.active&&!owner.dead&&owner.hp>0&&enemies.includes(owner);
 }
 function currentSummon(e){const token=summonOwners.get(e);return !!token&&token.dungeon===dungeonId()&&token.run===runId()&&currentOwner(token.owner);}
 function retireSummon(e){e.dead=true;e.active=false;e.windup=e.attackTime=e.walkSpeed=0;}
 function cleanupSummons(owner=null){
  pending=pending.filter(portal=>owner&&portal.owner!==owner);
  for(const e of enemies)if(e.dungeonSummon&&(!owner||summonOwners.get(e)?.owner===owner))retireSummon(e);
  if(!enemies.some(e=>e.dungeonSummon&&!e.dead))projectiles=projectiles.filter(p=>p.source!=='dungeon-minion');
 }
 function summon(owner){
  if(state!=='play'||!currentOwner(owner))return false;
  if(enemies.filter(e=>e.dungeonSummon&&!e.dead).length+pending.length>=4)return false;
  for(const portal of owner.summons||[])if(enemies.filter(e=>e.dungeonSummon&&!e.dead).length+pending.length<4)pending.push({x:clamp(portal.x,level.arena.x+45,level.arena.x+level.arena.w-100),y:level.arena.y,warning:.8,run:runId(),dungeon:dungeonId(),owner});return true;
 }
 function update(dt){
  if(!active()||state!=='play'||!Number.isFinite(dt)||dt<=0)return;
  const enemy=enemies.find(e=>DungeonCombat.is(e)&&!e.dead&&e.active);
  if(enemy){const x=clamp(player.x,level.arena.x+5,level.arena.x+level.arena.w-player.w-5);if(x!==player.x){player.x=x;player.vx=0;}}
  for(const e of enemies)if(e.dungeonSummon&&!e.dead&&!currentSummon(e))retireSummon(e);
  for(const portal of pending){portal.warning-=dt;if(portal.warning>0)continue;
   const owner=portal.owner;if(!currentOwner(owner)||portal.dungeon!==dungeonId()||portal.run!==runId())continue;
   const sect=dungeonId()==='sectFall',e=createEnemy({id:'dungeon-raised-'+owner.id+'-'+Math.random(),x:portal.x,y:portal.y,kind:'guard',patrol:level.arena.w,noReward:true,dungeonEnemy:true,dungeonSummon:true,dungeonSide:sect?'fanatics':'necromancer',factionOverride:sect?'shadowCult':'japan',raisedSamurai:!sect});e.patrolLeft=level.arena.x+5;e.patrolRight=level.arena.x+level.arena.w-e.w-5;e.summonBaseDamage=e.damageValue;enemies.push(e);
   summonOwners.set(e,{owner,run:portal.run,dungeon:portal.dungeon});
  }pending=pending.filter(p=>p.warning>0);
 }
 // Factions fight each other as well as Momo, without granting player kill rewards for their own casualties.
 function updateEnemy(e,dt){
  if(!e.dungeonEnemy)return false;if(!active()||!enemies.includes(e)||state!=='play'||e.dead||!Number.isFinite(dt)||dt<=0)return true;
  if(e.dungeonSummon&&!currentSummon(e)){retireSummon(e);return true;}
  const chant=!!(e.dungeonSummon&&summonOwners.get(e)?.owner.chantRemaining>0);e.chantBuff=chant;
  if(e.dungeonSummon&&dungeonId()==='sectFall')e.damageValue=chant?1.5*e.summonBaseDamage:e.summonBaseDamage;
  for(const key of ['stun','cd','contactCd','recovery','guardBreak','blockFlash','turnCooldown','edgePause'])e[key]=Math.max(0,e[key]-dt);
  e.attackTime=Math.max(0,e.attackTime-dt);if(e.attackTime>0)e.attackElapsed+=dt;e.walkSpeed=0;
  const others=enemies.filter(other=>other!==e&&other.dungeonEnemy&&!other.dead&&other.dungeonSide!==e.dungeonSide&&Math.abs(other.y+other.h/2-e.y-e.h/2)<70&&Math.abs(other.x-e.x)<520),
   // Raised soldiers belong to this boss encounter, not to the ambient faction
   // skirmish. They pursue Momo across the arena even beyond normal sight range.
   target=e.dungeonSummon?player:[player,...others].sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0],dx=target.x+target.w/2-e.x-e.w/2,dy=target.y+target.h/2-e.y-e.h/2,role=enemyRole(e),range=role==='mage'?500:role==='archer'?440:110,
   a=level.arena,feet=player.y+player.h,summonAggro=e.dungeonSummon&&player.x+player.w>a.x&&player.x<a.x+a.w&&feet>=a.y-420&&feet<=a.y+30,
   near=summonAggro||Math.abs(dx)<520&&Math.abs(dy)<150;
  if(e.stun<=0&&e.windup>0){
   e.windup=Math.max(0,e.windup-dt);if(e.windup===0){
    const oldPlayer=player;
    if(role==='mage'||role==='archer'){
     const before=projectiles.length;releaseEnemyAttack(e);for(const p of projectiles.slice(before)){p.dungeonSide=e.dungeonSide;p.source=e.dungeonSummon?'dungeon-minion':'dungeon-faction';}
    }else{
     e.attackTime=e.attackDuration;e.attackElapsed=0;e.recovery=.45;e.cd=e.kind==='shield'?2.2:1.65;
     const hit={x:e.face>0?e.x+e.w*.5:e.x-78,y:e.y-4,w:e.w+78,h:e.h+8};
     if(overlap(player,hit))damage(e.damageValue||1,e.face,true);
     if(player!==oldPlayer||state!=='play'||!enemies.includes(e))return true;
     for(const other of enemies)if(other!==e&&other.dungeonEnemy&&!other.dead&&other.dungeonSide!==e.dungeonSide&&overlap(other,hit)){other.hp=Math.max(0,other.hp-1);other.stun=.18;if(other.hp<=0)other.dead=true;}
    }
   }
  }else if(e.stun<=0&&e.recovery<=0&&e.attackTime<=0){
   if(near&&Math.abs(dy)<150&&Math.abs(dx)<range&&e.cd<=0){
    turnEnemy(e,Math.abs(dx)>18?Math.sign(dx):e.face);
    if(Math.abs(dx)<18||Math.sign(dx)===e.face){e.windupDuration=role==='mage'?1:role==='archer'?.7:.7;e.windup=e.windupDuration;e.targetX=target.x+target.w/2;e.targetY=target.y+target.h/2;}
   }else{
    let direction=e.patrolFace,speed=35;
    if(near){turnEnemy(e,Math.abs(dx)>25?Math.sign(dx):e.face);direction=Math.sign(dx)||e.face;speed=Math.abs(dx)<(role==='guard'||role==='shield'?65:range-35)?0:65;}
    if(speed&&!near&&e.turnCooldown<=0)e.face=direction;moveEnemy(e,direction*speed*(chant?1.35:1),dt,!near);
   }
  }
  if(overlap(player,e)&&e.contactCd<=0){const old=player;damage(e.damageValue||1,player.x>e.x?1:-1,true);e.contactCd=1.1;if(player!==old)return true;}return true;
 }
 function projectile(shot,hit){
  if(state!=='play'||!active()||!shot.dungeonSide||shot.life<=0)return false;
  const victim=enemies.find(e=>e.dungeonEnemy&&!e.dead&&e.dungeonSide!==shot.dungeonSide&&overlap(e,hit));if(!victim)return false;
  victim.hp=Math.max(0,victim.hp-(shot.damage||1));victim.stun=.18;if(victim.hp<=0)victim.dead=true;return true;
 }
 function hud(){
  if(!active())return false;const e=enemies.find(e=>DungeonCombat.is(e)&&!e.dead&&e.active);$('bossHud').hidden=!e;if(e){$('bossName').textContent=I18n.t(e.name);$('bossHealth').style.width=100*clamp(e.hp/e.maxHp,0,1)+'%';}return true;
 }
 return Object.freeze({active,floor,dungeonId,definition,owns,runId,cleared,saveLocation,cancel,menu,keydown,newRun,resume,enterFloor,leave,respawn,stock,addItem,removeItem,consume,canConsume,onBossDefeated,openChest,context,interact,objective,summon,cleanupSummons,update,updateEnemy,projectile,hud,get pending(){return pending;}});
})();
