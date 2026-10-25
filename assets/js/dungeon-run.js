/* Reusable dungeon journey: run flags reset explicitly; first-clear rewards do not. */
'use strict';
let dungeonState=DungeonRules.fresh();
const DungeonRun=(()=>{
 let menuToken=0,pending=[];
 const active=()=>!Prologue.active&&!!level.dungeon;
 const floor=()=>active()?level.dungeon.floor:-1;
 const owns=id=>flags[1].includes(id);
 const currentFlags=['dungeonRunStarted','dungeonStage1Clear','dungeonStage2Clear','dungeonStage3Clear','dungeonChestClaimed'];
 const cleared=index=>owns(DUNGEON_REWARDS[index]?.stage);
 const checkpointFloor=point=>DUNGEON_FLOORS.find(map=>[...map.rests,...map.checkpoints].some(r=>r.id===point?.id));
 const saveLocation=()=>active()?checkpointFloor(checkpoint)?.id||level.id:CampQuest.locationId();
 const atScroll=()=>level===councilHall&&pointNear(level.memoryScroll,130,110);
 function cancel(){menuToken++;$('dungeonMenu').hidden=true;pending=[];}
 function menu(){
  if(state!=='play'||!atScroll())return false;
  const token=++menuToken;state='dungeonMenu';keys.clear();pressed.clear();$('dungeonMenu').hidden=false;
  for(const [id,key]of Object.entries({dungeonMenuTitle:'dungeon.scroll.title',dungeonMenuInfo:'dungeon.run.info',dungeonContinue:'dungeon.continue',dungeonNew:'dungeon.new',dungeonBack:'dungeon.back'}))$(id).textContent=I18n.t(key);
  $('dungeonContinue').disabled=!owns('dungeonRunStarted');
  const valid=()=>state==='dungeonMenu'&&token===menuToken&&atScroll();
  $('dungeonBack').onclick=()=>{if(valid()){cancel();state='play';keys.clear();pressed.clear();}};
  $('dungeonContinue').onclick=()=>{if(valid()&&owns('dungeonRunStarted')){cancel();state='play';resume();}};
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
 function enterFloor(index,{point=null,atShrine=false,preserveCheckpoint=true}={}){
  const map=DUNGEON_FLOORS[index];if(!map)return false;
  const old=checkpointFloor(checkpoint)?{...checkpoint}:null,hp=player?.hp;
  if(!CampQuest.enter(map.id,{point,atShrine,save:false}))return false;
  if(!atShrine&&preserveCheckpoint&&old&&!old.checkpointOnly)checkpoint=old;
  if(!atShrine&&Number.isFinite(hp))player.hp=Math.min(hp,player.maxHp);
  persist();updateHUD();return true;
 }
 function newRun(){
  if(state!=='play'||!atScroll()||!DevSession.active&&!owns('councilGateOpen'))return false;
  const roll=Math.random()<.25?DungeonRules.enhancements[Math.min(2,Math.floor(Math.random()*3))]:null,result=DungeonRules.begin(dungeonState,roll);if(!result.ok)return false;
  dungeonState=result.state;flags[1]=flags[1].filter(id=>!currentFlags.includes(id));flags[1].push('dungeonRunStarted');
  const ids=new Set(DUNGEON_FLOORS.flatMap(map=>[...map.rests,...map.checkpoints].map(r=>r.id)));visitedRests[1]=visitedRests[1].filter(id=>!ids.has(id));
  const run=dungeonState.run;persist();story('dungeon.name','dungeon.scroll.title','dungeon.intro',()=>{if(state==='play'&&dungeonState.run===run&&atScroll())enterFloor(0,{preserveCheckpoint:false});});return true;
 }
 function resume(){
  if(state!=='play'||!atScroll()||!owns('dungeonRunStarted'))return false;
  for(let i=2;i>=0;i--){const map=DUNGEON_FLOORS[i];if(!DevSession.active&&!sideLocationUnlocked(map.id,flags,defeated))continue;
   const point=map.rests.find(r=>visitedRests[1].includes(r.id));if(point)return enterFloor(i,{point,atShrine:true});
  }return enterFloor(0,{preserveCheckpoint:false});
 }
 function leave(){
  if(state!=='play'||!active())return false;
  const hp=player.hp;enterRealm(1,levels[1].rests.at(-1));if(!enterCouncilHall())return false;
  initPlayer(councilHall.memoryScroll);player.hp=Math.min(hp,player.maxHp);persist();updateHUD();return true;
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
  const index=floor(),reward=DUNGEON_REWARDS[index];
  if(state!=='play'||index<0||!reward||enemy.replay||!enemies.includes(enemy)||!enemy.dead||enemy.runId!==dungeonState.run||enemy.miniboss!==reward.type||cleared(index)||index>0&&!cleared(index-1))return false;
  flags[1].push(reward.stage);
  if(!owns(reward.claim)){flags[1].push(reward.claim);progression.points+=reward.points;if(reward.soul&&!owns(reward.soul))flags[1].push(reward.soul);}
  pending=[];for(const e of enemies)if(e.dungeonSummon){e.dead=true;e.active=false;}
  projectiles=projectiles.filter(p=>p.source!==DungeonCombat.source(enemy)&&p.source!=='dungeon-minion');
  Merchant.award(reward.coins);awardXP(reward.xp);persist();updateHUD();
  if(index===2)story('dungeon.name','dungeon.boss.council','dungeon.victory');return true;
 }
 function openChest(){
  if(state!=='play'||floor()!==2||!pointNear(level.rewardChest,100,100)||!cleared(2)||dungeonState.run<=0)return false;
  if(owns('dungeonChestClaimed')){toast(I18n.t('dungeon.chest.empty'));return false;}
  const seal=DungeonRules.addStock(dungeonState,'dungeonSeal',1);if(!seal.ok)return false;
  const result=dungeonState.roll?DungeonRules.addStock(seal.state,dungeonState.roll,1):seal;if(!result.ok)return false;
  if(coins>Number.MAX_SAFE_INTEGER-250)return false;
  dungeonState=result.state;flags[1].push('dungeonChestClaimed');Merchant.award(250);persist();updateHUD();toast(I18n.t('dungeon.chest.claimed'));return true;
 }
 function context(){
  if(Prologue.active)return null;
  if(atScroll())return {type:'dungeonScroll',text:I18n.t('dungeon.scroll.prompt')};
  if(!active())return null;
  const index=floor();
  if(index===2&&cleared(2)&&pointNear(level.rewardChest,100,100))return {type:'dungeonChest',text:I18n.t(owns('dungeonChestClaimed')?'dungeon.chest.empty':'dungeon.chest.open')};
  if(pointNear(level.returnPoint,100,85))return {type:index===0?'dungeonLeave':'dungeonPrevious',text:I18n.t(index===0?'dungeon.return':'dungeon.previous')};
  if(cleared(index)&&pointNear(level.nextPoint,100,100))return {type:index===2?'dungeonLeave':'dungeonNext',text:I18n.t(index===2?'dungeon.return':'dungeon.next')};return null;
 }
 function interact(candidate){
  if(state!=='play'||!candidate)return false;const actual=context();if(!actual||actual.type!==candidate.type)return false;
  if(actual.type==='dungeonScroll')return menu();if(actual.type==='dungeonChest')return openChest();if(actual.type==='dungeonLeave')return leave();
  if(actual.type==='dungeonPrevious')return enterFloor(floor()-1);if(actual.type==='dungeonNext')return enterFloor(floor()+1);return false;
 }
 function objective(){
  if(level===councilHall)return {point:level.memoryScroll,compass:false,text:'dungeon.scroll.prompt'};
  if(!active())return null;const index=floor();return {point:cleared(index)?index===2?level.rewardChest:level.nextPoint:level.arena,compass:false,text:cleared(2)?'dungeon.objective.chest':'dungeon.objective.boss'};
 }
 function summon(owner){
  if(!active()||state!=='play'||owner.dead||!enemies.includes(owner))return false;
  if(enemies.filter(e=>e.dungeonSummon&&!e.dead).length+pending.length>=4)return false;
  for(const portal of owner.summons||[])if(enemies.filter(e=>e.dungeonSummon&&!e.dead).length+pending.length<4)pending.push({x:clamp(portal.x,level.arena.x+45,level.arena.x+level.arena.w-100),y:level.arena.y,warning:.8,run:dungeonState.run,owner:owner.id});return true;
 }
 function update(dt){
  if(!active()||state!=='play'||!Number.isFinite(dt)||dt<=0)return;
  const enemy=enemies.find(e=>DungeonCombat.is(e)&&!e.dead&&e.active);
  if(enemy){const x=clamp(player.x,level.arena.x+5,level.arena.x+level.arena.w-player.w-5);if(x!==player.x){player.x=x;player.vx=0;}}
  for(const portal of pending){portal.warning-=dt;if(portal.warning>0)continue;
   const owner=enemies.find(e=>e.id===portal.owner&&!e.dead);if(!owner||portal.run!==dungeonState.run)continue;
   const e=createEnemy({id:'dungeon-raised-'+portal.owner+'-'+Math.random(),x:portal.x,y:portal.y,kind:'guard',patrol:level.arena.w,noReward:true,dungeonEnemy:true,dungeonSummon:true,dungeonSide:'necromancer',factionOverride:'japan',raisedSamurai:true});e.patrolLeft=level.arena.x+5;e.patrolRight=level.arena.x+level.arena.w-e.w-5;enemies.push(e);
  }pending=pending.filter(p=>p.warning>0);
 }
 // Factions fight each other as well as Momo, without granting player kill rewards for their own casualties.
 function updateEnemy(e,dt){
  if(!e.dungeonEnemy)return false;if(!active()||!enemies.includes(e)||state!=='play'||e.dead)return true;
  for(const key of ['stun','cd','contactCd','recovery','guardBreak','blockFlash','turnCooldown','edgePause'])e[key]=Math.max(0,e[key]-dt);
  e.attackTime=Math.max(0,e.attackTime-dt);if(e.attackTime>0)e.attackElapsed+=dt;e.walkSpeed=0;
  const others=enemies.filter(other=>other!==e&&other.dungeonEnemy&&!other.dead&&other.dungeonSide!==e.dungeonSide&&Math.abs(other.y+other.h/2-e.y-e.h/2)<70&&Math.abs(other.x-e.x)<520),
   target=[player,...others].sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0],dx=target.x+target.w/2-e.x-e.w/2,dy=target.y+target.h/2-e.y-e.h/2,role=enemyRole(e),range=role==='mage'?500:role==='archer'?440:110,near=Math.abs(dx)<520&&Math.abs(dy)<150;
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
   if(near&&Math.abs(dx)<range&&e.cd<=0){
    turnEnemy(e,Math.abs(dx)>18?Math.sign(dx):e.face);
    if(Math.abs(dx)<18||Math.sign(dx)===e.face){e.windupDuration=role==='mage'?1:role==='archer'?.7:.7;e.windup=e.windupDuration;e.targetX=target.x+target.w/2;e.targetY=target.y+target.h/2;}
   }else{
    let direction=e.patrolFace,speed=35;
    if(near){turnEnemy(e,Math.abs(dx)>25?Math.sign(dx):e.face);direction=Math.sign(dx)||e.face;speed=Math.abs(dx)<(role==='guard'||role==='shield'?65:range-35)?0:65;}
    if(speed&&!near&&e.turnCooldown<=0)e.face=direction;moveEnemy(e,direction*speed,dt,!near);
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
 return Object.freeze({active,floor,cleared,saveLocation,cancel,menu,keydown,newRun,resume,enterFloor,leave,respawn,stock,addItem,removeItem,consume,canConsume,onBossDefeated,openChest,context,interact,objective,summon,update,updateEnemy,projectile,hud,get pending(){return pending;}});
})();
