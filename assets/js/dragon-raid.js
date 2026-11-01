/* A repeatable three-part raid; only its run and rewards survive a reload. */
'use strict';
function createDragonRaidMap({makeLevel,ledge,rest,zone}){
 const map=makeLevel('dragonCatacombs',12100,1650,{x:200,y:1300});
 map.name='fia.dragon.location';map.enemyRealm=3;map.dragonRaid=true;
 map.arena={x:-2000,y:1300,w:0};map.boss={x:-2000,y:1300};
 map.returnPoint={x:120,y:1300};map.returnDestination={location:'zigguratInterior',x:320,y:1700};
 rest(map,'dragonRaidEntrance',240,1300,'fia.dragon.hall');
 ledge(map,'dragon-hall-floor',0,1300,3500,'ground',300);
 const steps=[[650,1170,260],[920,1040,260],[1200,910,280],[1480,780,280],[1780,650,280],[2100,780,280],[2400,910,280],[2700,1040,280]];
 steps.forEach(([x,y,w],i)=>ledge(map,'dragon-wing-'+i,x,y,w,'stone'));
 map.chains=[{x:1030,y:1040},{x:1590,y:780},{x:1900,y:650},{x:2510,y:910}];
 ledge(map,'dragon-back',4100,900,3650,'ground',60);
 map.tumors=[{x:4930,y:900},{x:5860,y:900},{x:6800,y:900}];
 map.manifestations=[{x:5400,y:900},{x:7250,y:900}];
 map.headPoint={x:7640,y:900};
 ledge(map,'dragon-vault-floor',8500,1300,3600,'ground',300);
 for(const [i,x]of [8980,9700,10420,11140].entries())ledge(map,'dragon-vault-cover-'+i,x,1150,180,'stone');
 zone(map,'fia.dragon.hall',0,0,3500,1650);zone(map,'fia.dragon.flight',4000,0,3900,1650);zone(map,'fia.dragon.vault',8500,0,3600,1650);
 return map;
}
const DragonRaid=(()=>{
 let attempt=null,attackClock=0,warning=null,impact=null,serial=0,pattern=0,engaged=false,recovery=0,headX=10250,headY=0,hitCooldowns=new Map();
 const active=()=>level?.dragonRaid===true&&!Prologue.active;
 const map=()=>SIDE_LOCATIONS.dragonCatacombs.map;
 const has=id=>flags[3].includes(id);
 const unlocked=()=>has('hannahDefeated');
 const questAvailable=()=>unlocked()&&has('fiaTalismanCompleted')&&has('fiaRescued')&&!has('fiaSlain');
 function questPoint(){
  if(!questAvailable()||has('fiaDragonCompleted'))return null;
  if(level===fiaChambers)return level.npcs.find(n=>n.id==='fia');
  if(level===zigguratSummit&&has('hannahFiaRescue'))return {x:1550,y:1400};
  return null;
 }
 function talk(){
  const point=questPoint();if(state!=='play'||!point||!pointNear(point,100,90))return false;
  if(!has('fiaDragonAccepted')){
   if(!apply(FiaJourneyRules.accept(fiaJourney,flags,defeated)))return false;
   story('fia.dragon.quest','fia.name','fia.dragon.offer',null,{right:'fia',speaker:'fia'});return true;
  }
  if(has('dragonEyes')){
   if(!apply(FiaJourneyRules.handIn(fiaJourney,flags,defeated)))return false;
   story('fia.dragon.quest','fia.name','fia.dragon.turnIn',null,{right:'fia',speaker:'fia'});return true;
  }
  story('fia.dragon.quest','fia.name','fia.dragon.offer',null,{right:'fia',speaker:'fia'});return true;
 }
 function questMarker(){return questPoint()?has('dragonEyes')?'?':!has('fiaDragonAccepted')?'!':null:null;}
 const running=()=>active()&&!!attempt&&!attempt.failed&&!attempt.won;
 const clone=s=>JSON.parse(JSON.stringify(s));
 function apply(result){
  if(!result.ok)return false;
  fiaJourney=result.state;flags=result.flags;progression.points+=result.rewards.points;awardXP(result.rewards.xp);persist();updateHUD();return true;
 }
 function clearAttempt(){attempt=null;warning=null;impact=null;attackClock=0;pattern=0;engaged=false;recovery=0;headX=10250;headY=0;hitCooldowns.clear();manifestationHP.clear();serial++;}
 function setup(){
  clearAttempt();if(!active()||fiaJourney.dragon.run===0||fiaJourney.dragon.clear)return;
  attempt=DragonRaidRules.fresh(fiaJourney.dragon.run);attackClock=2;
 }
 function begin(){
  if(state!=='play'||!atEntrance()||!unlocked()&&!DevSession.active)return false;
  // Test mode may enter without story grants, but cannot manufacture normal rewards.
  if(DevSession.active&&!unlocked())return enterTest();
  const result=FiaJourneyRules.begin(fiaJourney,flags,defeated);if(!apply(result))return false;
  if(!CampQuest.enter('dragonCatacombs'))return false;setup();return true;
 }
 function enterTest(){
  if(!DevSession.active||!CampQuest.enter('dragonCatacombs'))return false;
  clearAttempt();attempt=DragonRaidRules.fresh(1);attempt.test=true;attackClock=2;return true;
 }
 function replay(phase){
  if(!DevSession.active||state!=='developer'||!DevTools.isOpen||!active()||![1,2,3].includes(phase))return false;
  clearAttempt();attempt=DragonRaidRules.fresh(1);attempt.test=true;
  if(phase>=2)for(let i=0;i<4;i++)attempt=DragonRaidRules.hit(attempt,'chain',i,DragonRaidRules.tuning.chainHp);
  if(phase===3){for(let i=0;i<3;i++)attempt=DragonRaidRules.hit(attempt,'tumor',i,DragonRaidRules.tuning.tumorHp);for(let i=0;i<2;i++)attempt=DragonRaidRules.manifestationDefeated(attempt,i);attempt=DragonRaidRules.reachHead(attempt);}
  engaged=phase>1;attackClock=2;projectiles=[];particles=[];
  initPlayer(phase===1?level.start:phase===2?{x:4220,y:900}:{x:8750,y:1300});resetCamera();updateHUD();DevTools.setReturnState('play');return true;
 }
 function resume(){
  if(state!=='play'||!atEntrance()||!unlocked()||fiaJourney.dragon.run===0)return false;
  if(!CampQuest.enter('dragonCatacombs'))return false;setup();return true;
 }
 function atEntrance(){return !Prologue.active&&level===zigguratInterior&&pointNear(level.dragonRaidEntrance,100,90);}
 function menu(){
  if(state!=='play'||!atEntrance()||!unlocked()&&!DevSession.active)return false;
  const origin=level;state='dungeonMenu';keys.clear();pressed.clear();$('dungeonMenu').hidden=false;
  $('dungeonMenuTitle').textContent=I18n.t('fia.dragon.location');$('dungeonMenuInfo').textContent=[1,2,3].map(n=>I18n.t('fia.dragon.objective.'+n)).join('\n\n');
  $('dungeonContinue').textContent=I18n.t('fia.dragon.continue');$('dungeonNew').textContent=I18n.t('fia.dragon.new');$('dungeonBack').textContent=I18n.t('dungeon.back');
  $('dungeonContinue').disabled=fiaJourney.dragon.run===0;
  const valid=()=>state==='dungeonMenu'&&level===origin;
  const close=()=>{$('dungeonMenu').hidden=true;state='play';keys.clear();pressed.clear();};
  $('dungeonBack').onclick=()=>{if(valid())close();};
  $('dungeonNew').onclick=()=>{if(valid()){close();begin();}};
  $('dungeonContinue').onclick=()=>{if(valid()&&fiaJourney.dragon.run>0){close();resume();}};
  ($('dungeonContinue').disabled?$('dungeonNew'):$('dungeonContinue')).focus();return true;
 }
 function context(){
  if(level===zigguratSummit&&questPoint()&&pointNear(questPoint(),100,90))return {type:'dragonQuestTalk',text:I18n.format('camp.talk',[I18n.t('fia.name')])};
  if(atEntrance()&&(unlocked()||DevSession.active))return {type:'dragonRaidEnter',text:I18n.format('ziggurat.enter',[I18n.t('fia.dragon.location')])};
  if(active()&&pointNear(exitPoint(),100,85)&&(!attempt||attempt.phase===1||attempt.won))return {type:'dragonRaidLeave',text:'fia.dragon.return'};
  return null;
 }
 function interact(candidate){
  const actual=context();if(!actual||actual.type!==candidate?.type||state!=='play')return false;
  if(actual.type==='dragonRaidEnter')return menu();
  if(actual.type==='dragonQuestTalk')return talk();
  clearAttempt();return CampQuest.leave();
 }
 function respawn(){
  if(!active())return false;
  const test=attempt?.test;setup();if(test){attempt=DragonRaidRules.fresh(1);attempt.test=true;}
  initPlayer(level.start);player.inv=2;projectiles=[];particles=[];resetCamera();updateHUD();return true;
 }
 function changePhase(previous){
  if(attempt.phase===previous)return;
  engaged=true;
  warning=null;impact=null;hitCooldowns.clear();attackClock=2;projectiles=[];
  const hp=player.hp;
  initPlayer(attempt.phase===2?{x:4220,y:900}:{x:8750,y:1300});player.hp=Math.min(hp,player.maxHp);resetCamera();updateHUD();
 }
 function targets(){
  if(!running())return [];
  if(attempt.phase===1)return level.chains.map((p,i)=>({...p,x:p.x-32,y:p.y-90,w:64,h:90,type:'chain',index:i,hp:attempt.chains[i]}));
  if(attempt.phase===2)return [
   ...level.tumors.map((p,i)=>({...p,x:p.x-55,y:p.y-105,w:110,h:105,type:'tumor',index:i,hp:attempt.tumors[i]})),
   ...level.manifestations.map((p,i)=>({...p,x:p.x-65,y:p.y-170,w:130,h:170,type:'manifestation',index:i,hp:attempt.manifestations[i]?0:manifestationHP.get(i)??18}))
  ];
  return [{x:headX-230,y:1060+headY,w:460,h:240,type:'head',index:0,hp:attempt.hp}];
 }
 const manifestationHP=new Map();
 function hit(hitBox,amount){
  if(!running()||!Number.isFinite(amount)||amount<=0)return false;
  const before=attempt.phase;let touched=false;
  for(const target of targets()){
   if(target.hp<=0||!overlap(hitBox,target)||(hitCooldowns.get(target.type+target.index)||0)>0)continue;
   touched=true;hitCooldowns.set(target.type+target.index,.18);
   if(target.type==='manifestation'){
    const hp=(manifestationHP.get(target.index)??18)-amount;manifestationHP.set(target.index,hp);
    if(hp<=0)attempt=DragonRaidRules.manifestationDefeated(attempt,target.index);
   }else attempt=DragonRaidRules.hit(attempt,target.type,target.index,amount);
   const after=target.type==='manifestation'?Math.max(0,manifestationHP.get(target.index)??18):target.type==='chain'?attempt.chains[target.index]:target.type==='tumor'?attempt.tumors[target.index]:attempt.hp;
   DevDamage.record('outgoing',{...target,name:'fia.dragon.boss',hp:after,maxHp:target.hp},target.hp,after);
   burst(target.x+target.w/2,target.y+target.h/2,'#ad81d9',8);
  }
  changePhase(before);
  if(attempt.won){
   warning=null;impact=null;projectiles=[];
   if(!attempt.test)apply(FiaJourneyRules.clear(fiaJourney,flags,defeated,attempt.run));
   persist();updateHUD();
  }
  return touched;
 }
 function planAttack(){
  const feet=player.y+player.h,x=player.x+player.w/2;
  let kind=attempt.phase===3?['fire','shadow','headSlam','bite'][pattern++%4]:attempt.phase===2?'shadow':pattern++%2?'shadow':'fire';
  const physical=kind==='headSlam'||kind==='bite',near=Math.abs(x-10250)<500&&feet>950;
  if(physical&&!near)kind=kind==='headSlam'?'shadow':'fire';
  const toX=clamp(x,9870,10630),toY=kind==='headSlam'?75:35;
  const box=kind==='headSlam'?{x:toX-330,y:1190,w:660,h:110}:kind==='bite'?{x:toX-230,y:1060+toY,w:460,h:240}:{x:x-(attempt.phase===3&&kind==='fire'?280:100),y:feet-(attempt.phase===3&&kind==='fire'?110:220),w:attempt.phase===3&&kind==='fire'?560:200,h:attempt.phase===3&&kind==='fire'?110:220};
  const duration=kind==='headSlam'?1.25:kind==='bite'?.9:1.1,strikeDuration=kind==='headSlam'?.65:kind==='bite'?.4:.45;
  warning={box,remaining:duration,duration,strikeDuration,kind,toX,toY,token:serial};
 }
 const isPhysical=attack=>attack?.kind==='headSlam'||attack?.kind==='bite';
 function strike(attack){
  if(attack.didDamage||attack.token!==serial)return false;attack.didDamage=true;
  if(!overlap(player,attack.box))return false;
  const victim=player;damage(attack.kind==='bite'?2:attempt.phase===3?3:2,player.face*-1,true);
  return player!==victim||state!=='play';
 }
 function update(dt){
  if(!active()){if(attempt)clearAttempt();return;}
  if(!attempt&&!fiaJourney.dragon.clear){setup();if(!attempt&&DevSession.active){attempt=DragonRaidRules.fresh(1);attempt.test=true;}}
  if(!running()||state!=='play')return;
  if(attempt.phase===1&&!engaged){if(player.x<500)return;engaged=true;}
  const old=attempt,test=old.test;attempt=DragonRaidRules.update(attempt,dt);if(test)attempt.test=true;
  for(const [key,value]of hitCooldowns)hitCooldowns.set(key,Math.max(0,value-dt));
  const limits=attempt.phase===1?[engaged?500:0,3500]:attempt.phase===2?[4100,7750]:[8500,12100];
  player.x=clamp(player.x,limits[0],limits[1]-player.w);
  if(attempt.failed){revive();return;}
  if(attempt.phase===2&&pointNear(level.headPoint,90,100)){const before=attempt.phase;attempt=DragonRaidRules.reachHead(attempt);if(test)attempt.test=true;changePhase(before);}
  attackClock-=dt;recovery=Math.max(0,recovery-dt);
  if(!warning&&!impact&&recovery===0&&attackClock<=0){attackClock=attempt.phase===3?2.8:3.7;planAttack();}
  if(impact){
   impact.remaining-=dt;const progress=clamp(1-impact.remaining/impact.strikeDuration,0,1);
   if(isPhysical(impact)){
    const motion=progress<.5?progress/.5:progress>.8?(1-progress)/.2:1;
    headX=10250+(impact.toX-10250)*motion;headY=impact.toY*motion;
    if(progress>=.5&&strike(impact))return;
   }
   if(impact.remaining<=0){impact=null;recovery=.55;headX=10250;headY=0;}
  }
  if(warning){warning.remaining-=dt;if(warning.remaining<=0){
   const attack=warning;warning=null;impact={...attack,remaining:attack.strikeDuration,didDamage:false};
   if(!isPhysical(impact)&&strike(impact))return;
  }}
 }
 function hud(){
  if(!active())return false;
  $('bossHud').hidden=!running();if(!running())return true;
  $('bossName').textContent=I18n.t('fia.dragon.boss');
  if(attempt.phase===3)$('bossName').textContent+=' · '+I18n.format('fia.dragon.pillars',[attempt.pillars,DragonRaidRules.tuning.pillars]);
  const summary=health(),ratio=summary.hp/summary.maxHp;
  $('bossHealth').style.width=clamp(ratio*100,0,100)+'%';return true;
 }
 function objective(){
  if(!active()){
   if(!questAvailable()||!has('fiaDragonAccepted')||has('fiaDragonCompleted'))return null;
   return has('dragonEyes')?{point:questPoint()||fiaChambers.npcs[0],compass:false,text:'fia.dragon.objective.return'}:questRoute()?{point:level===zigguratInterior?level.dragonRaidEntrance:level.returnPoint,compass:false,text:'fia.dragon.location'}:null;
  }
  if(!running())return {point:exitPoint(),compass:false,text:'fia.dragon.return'};
  return {point:attempt.phase===1?level.chains[attempt.chains.findIndex(hp=>hp>0)]:attempt.phase===2?level.headPoint:{x:10250,y:1300},compass:false,text:'fia.dragon.objective.'+attempt.phase};
 }
 function exitPoint(){return attempt?.won?{x:8750,y:1300}:level.returnPoint;}
 function questRoute(){return questAvailable()&&has('fiaDragonAccepted')&&!has('fiaDragonCompleted')&&[zigguratInterior,zigguratSummit,fiaChambers].includes(level);}
 function health(){
  if(!running())return {hp:0,maxHp:DragonRaidRules.tuning.maxHp,dead:true};
  if(attempt.phase===1)return {hp:attempt.chains.reduce((sum,hp)=>sum+hp,0),maxHp:4*DragonRaidRules.tuning.chainHp};
  if(attempt.phase===2)return {hp:targets().reduce((sum,t)=>sum+t.hp,0),maxHp:3*DragonRaidRules.tuning.tumorHp+36};
  return {hp:attempt.hp,maxHp:DragonRaidRules.tuning.maxHp};
 }
 return Object.freeze({active,running,locked:()=>running()&&engaged,begin,resume,setup,menu,context,interact,respawn,hit,update,hud,health,objective,questRoute,questPoint,questMarker,talk,exitPoint,replay,clear:clearAttempt,targets,get current(){return attempt;},get warning(){return warning;},get impact(){return impact;},get head(){return {x:headX,y:headY};},get attackState(){return warning?'windup':impact?'strike':recovery>0?'recover':'wait';}});
})();
