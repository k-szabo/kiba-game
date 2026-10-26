/* Five rounds are a transient attempt; only unlocks and once-only rewards persist. */
'use strict';
const ArenaChallenge=(()=>{
 let attempt=null,departure=null,serial=0;
 const owns=id=>flags[3].includes(id),active=()=>realm===3&&level===shadowArena&&!Prologue.active;
 const room=()=>realm===3&&level===fiaChambers&&!Prologue.active;
 const running=()=>active()&&!!attempt&&!['complete','won'].includes(attempt.status);
 const order=['survival','arenaCaptain','arenaSerpent','arenaCyclops','arenaFia'];
 function clean(){
  for(const e of enemies)if(ArenaCombat.is(e)||e.arenaMinion){e.dead=true;e.active=false;e.windup=0;e.attackTime=0;}
  enemies=enemies.filter(e=>!ArenaCombat.is(e)&&!e.arenaMinion);
  projectiles=projectiles.filter(p=>!p.source?.startsWith('arena:')&&p.source!=='arena-minion');
 }
 function reset(){clean();attempt=null;departure=null;}
 function confine(){
  if(!running())return;const a=level.arena,left=a.x+10,right=a.x+a.w-player.w-10;
  const x=clamp(player.x,left,right);if(x!==player.x){player.x=x;player.vx=0;}
 }
 function cleanupSummons(owner){
  const owned=enemies.filter(e=>e.arenaMinion&&e.arenaOwner===owner.id),sources=new Set(owned.filter(ArenaCombat.is).map(ArenaCombat.source));
  for(const e of owned){e.dead=true;e.active=false;e.hazards=[];e.attackBoxes=[];e.windup=e.attackTime=0;}
  const retireOrdinary=owned.some(e=>!ArenaCombat.is(e));enemies=enemies.filter(e=>!owned.includes(e));projectiles=projectiles.filter(p=>!sources.has(p.source)&&!(retireOrdinary&&p.source==='arena-minion'));
  if(attempt)attempt.pending=attempt.pending.filter(p=>p.owner!==owner.id);
 }
 function queueMinion(x,owner=null,role=null){
  if(!active()||!attempt||attempt.status!=='fighting')return;
  if(enemies.filter(e=>e.arenaMinion&&!e.dead).length+attempt.pending.length>=4)return;
  if(role==='cyclops'&&(enemies.some(e=>e.arenaRole==='cyclops'&&!e.dead)||attempt.pending.some(p=>p.role==='cyclops')))return;
  const a=level.arena;attempt.pending.push({x:clamp(x,a.x+45,a.x+a.w-110),y:a.y,warning:.85,owner,role});
 }
 function summon(owner){
  if(!active()||state!=='play'||!enemies.includes(owner)||owner.dead||!owner.active||owner.miniboss!=='arenaFia')return false;
  if(attempt?.status==='fighting'){
   for(const portal of owner.summons||[])queueMinion(portal.x,owner.id,portal.role);return true;
  }
  // A developer replay can exercise its summons without creating quest progress.
  if(DevSession.active&&owner.replay){for(const portal of owner.summons||[])spawnMinion(portal.x,owner.id,portal.role);return true;}
  return false;
 }
 function spawnMinion(x,owner,role=null){
  if(enemies.filter(e=>e.arenaMinion&&!e.dead).length>=4)return;
  if(role==='cyclops'){
   if(enemies.some(e=>e.arenaRole==='cyclops'&&!e.dead)||!enemies.some(e=>e.id===owner&&!e.dead))return;
   const e=ArenaCombat.create({id:'arena-cyclops-'+(++serial),miniboss:'arenaCyclops',singleGuard:true,x,y:level.arena.y,noReward:true,arenaMinion:true,arenaRole:'cyclops',arenaOwner:owner});e.active=true;enemies.push(e);return;
  }
  const guard=(serial++%3)===0,e=createEnemy({id:'arena-minion-'+serial,x,y:level.arena.y,kind:guard?'shield':'guard',patrol:level.arena.w,noReward:true,arenaMinion:true,arenaRole:guard?'guard':'thief',arenaOwner:owner,factionOverride:'shadowCult'});
  e.y=level.arena.y-100;e.h=100;e.w=54;e.baseY=e.y;e.patrolLeft=level.arena.x+10;e.patrolRight=level.arena.x+level.arena.w-e.w-10;e.origin=e.x;e.cd=1.2;e.face=player.x<e.x?-1:1;
  enemies.push(e);
 }
 function beginRound(number){
  if(!active()||!attempt)return false;
  clean();attempt.round=number;attempt.pending=[];attempt.clock=number===1?45:0;attempt.spawnClock=0;attempt.status='fighting';
  if(number===1)return true;
  const captured=attempt,spawn=()=>{
   if(!active()||attempt!==captured||state!=='play')return;
   const spec=level.arenaEncounters.find(e=>e.id===order[number-1]),enemy=ArenaCombat.create(spec);enemy.active=true;enemy.arenaEnemy=true;enemy.attemptId=captured.id;enemies.push(enemy);captured.status='fighting';updateHUD();
  };
  if(number===5){attempt.status='intro';story('arena.quest.name','arena.boss.fia','arena.fia.intro',spawn,{right:'fiaCombat',speaker:'fiaCombat'});}else spawn();
  return true;
 }
 function start(){
  if(state!=='play'||!active()||!DevSession.active&&(!owns('fiaRescued')||!owns('arenaQuestAccepted')||owns('arenaChampion')))return false;
  clean();initPlayer({x:740,y:level.arena.y});attempt={id:++serial,round:1,status:'fighting',clock:45,spawnClock:0,pending:[]};
  beginRound(1);resetCamera();persist();updateHUD();return true;
 }
 function finishRound(){if(!attempt)return;clean();attempt.pending=[];attempt.status='between';updateHUD();toast(I18n.t('arena.round.complete'));}
 function onBossDefeated(enemy){
  if(!active()||!attempt||attempt.status!=='fighting'||!enemies.includes(enemy)||!enemy.dead||enemy.replay||enemy.arenaMinion||enemy.attemptId!==attempt.id||enemy.miniboss!==order[attempt.round-1])return false;
  const reward=ARENA_REWARDS[enemy.miniboss];
  if(reward&&!owns(reward.flag)){
   flags[3].push(reward.flag);if(reward.item&&!owns(reward.item))flags[3].push(reward.item);
   awardXP(reward.xp);persist();updateHUD();
  }
  if(attempt.round<5){finishRound();return true;}
  if(!owns('arenaChampion'))flags[3].push('arenaChampion');
  const origin={x:enemy.x+enemy.w/2,y:enemy.baseY+enemy.h},captured=attempt;clean();attempt.status='complete';attempt.pending=[];persist();updateHUD();
  story('arena.quest.name','fia.name','arena.victory',()=>{
   if(!active()||attempt!==captured||state!=='play')return;
   captured.status='won';departure={...origin,elapsed:0};updateHUD();
  },{right:'fiaCombat',speaker:'fiaCombat'});return true;
 }
 function update(dt){
  if(!active()||state!=='play'||!Number.isFinite(dt)||dt<=0)return;
  confine();
  if(departure){departure.elapsed+=dt;if(!reducedMotion.matches)departure.x+=180*dt;if(departure.elapsed>=2.4)departure=null;}
  if(!attempt||attempt.status!=='fighting')return;
  if(attempt.round===1){
   attempt.clock=Math.max(0,attempt.clock-dt);if(attempt.clock<1e-9)attempt.clock=0;if(attempt.clock<=0){finishRound();return;}
   attempt.spawnClock-=dt;if(attempt.spawnClock<=0){queueMinion(level.arena.x+60);queueMinion(level.arena.x+level.arena.w-100);attempt.spawnClock=2.5;}
  }
  const pending=attempt.pending;for(const portal of pending){portal.warning-=dt;if(portal.warning<=0&&(!portal.owner||enemies.some(e=>e.id===portal.owner&&!e.dead)))spawnMinion(portal.x,portal.owner,portal.role);}
  attempt.pending=pending.filter(portal=>portal.warning>0);
 }
 function talkFia(){
  const npc=level===shadowDen&&level.npcs.find(n=>n.id==='fia');
  if(state!=='play'||!npc||!campNPCVisible(npc)||!owns('fiaRescued')||!pointNear(npc,95,85))return false;
  if(!owns('arenaQuestAccepted')){flags[3].push('arenaQuestAccepted');persist();updateHUD();}
  story('arena.quest.name','fia.name',owns('arenaChampion')?'arena.invitation':'arena.quest.dialogue',null,{right:'fia',speaker:'fia'});return true;
 }
 function context(){
  if(Prologue.active)return null;
  if(level===shadowDen){
   if((DevSession.active||sideLocationUnlocked('shadowArena',flags,defeated))&&pointNear(level.arenaEntrance,90,85))return {type:'arenaEnter',text:I18n.t('arena.enter')};
   if((DevSession.active||sideLocationUnlocked('fiaChambers',flags,defeated))&&pointNear(level.chambersEntrance,90,85))return {type:'chambersEnter',text:I18n.t('arena.chambers.enter')};
  }
  if(room()){
   if(pointNear(level.returnPoint,90,85))return {type:'arenaReturn',text:I18n.t('arena.return')};
   const npc=level.npcs[0];if(pointNear(npc,95,85))return {type:'chambersTalk',text:I18n.format('camp.talk',[I18n.t('fia.name')])};
  }
  if(!active())return null;
  if(attempt?.status==='between')return {type:'arenaNext',round:attempt.round,text:I18n.t('arena.next')};
  if(running())return null;
  if(pointNear(level.returnPoint,90,85))return {type:'arenaReturn',text:I18n.t('arena.return')};
  if((DevSession.active||!owns('arenaChampion'))&&pointNear(level.challengePoint,90,85))return {type:'arenaStart',text:I18n.t('arena.start')};
  return null;
 }
 function interact(candidate){
  if(state!=='play'||!candidate)return false;const actual=context();if(!actual||actual.type!==candidate.type)return false;
  if(actual.type==='arenaEnter')return CampQuest.enter('shadowArena');
  if(actual.type==='chambersEnter')return CampQuest.enter('fiaChambers');
  if(actual.type==='arenaReturn')return CampQuest.leave();
  if(actual.type==='arenaStart')return start();
  if(actual.type==='arenaNext')return actual.round===candidate.round&&beginRound(actual.round+1);
  if(actual.type==='chambersTalk'){story('arena.chambers.name','fia.name','arena.chambers.dialogue',null,{right:'fia',speaker:'fia'});return true;}
  return false;
 }
 function objective(){
  if(room())return {point:level.npcs[0],compass:false,text:'arena.chambers.objective'};
  if(level===shadowDen&&owns('fiaRescued')&&owns('arenaQuestAccepted'))return {point:owns('arenaChampion')?level.chambersEntrance:level.arenaEntrance,compass:false,text:owns('arenaChampion')?'arena.objective.chambers':'arena.objective.complete'};
  if(active())return {point:running()?level.arena:owns('arenaChampion')?level.returnPoint:level.challengePoint,compass:false,text:owns('arenaChampion')?'arena.objective.chambers':'arena.objective.complete'};
  return null;
 }
 function questMarker(id){return id==='fia'&&level===shadowDen&&owns('fiaRescued')&&campNPCVisible(level.npcs.find(n=>n.id===id))&&!owns('arenaQuestAccepted')?'!':null;}
 function hud(){
  if(!active())return false;
  const enemy=enemies.find(e=>ArenaCombat.is(e)&&!e.arenaMinion&&!e.dead&&e.active),round=attempt?.round||(enemy?order.indexOf(enemy.miniboss)+1:0);
  $('bossHud').hidden=!round;if(!round)return true;
  const title=round===1?I18n.format('arena.survive',[Math.ceil(attempt.clock)]):enemy?.miniboss==='arenaFia'?(enemy.immuneRemaining>0?I18n.format('arena.shield',[Math.ceil(enemy.immuneRemaining)]):enemy.phase==='exhausted'?I18n.format('arena.exhausted.time',[Math.ceil(enemy.vulnerableRemaining)]):I18n.t('arena.exhausted')):enemy?I18n.t(enemy.name):I18n.t('arena.round.complete');
  const text=I18n.format('arena.round',[round,title]);if($('bossName').textContent!==text)$('bossName').textContent=text;
  $('bossHealth').style.width=(round===1?attempt.clock/45:enemy?enemy.hp/enemy.maxHp:1)*100+'%';return true;
 }
 return Object.freeze({active,room,running,reset,cleanupSummons,update,confine,start,context,interact,objective,talkFia,questMarker,onBossDefeated,summon,hud,
  get attempt(){return attempt;},get departure(){return departure;}});
})();
