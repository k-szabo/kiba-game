/* Reika's assignment, the anti-air line and the cave guardian. */
'use strict';
const ThirdClan=(()=>{
 const rules=ThirdClanRules,{progress,airship}=rules;
 let guardian=null,ballistaHealth=new Map();
 const stage=()=>rules.stage(flags);
 const isPath=()=>level===thirdClanPath;
 const isCave=()=>level===thirdClanCave;
 const locked=()=>isCave()&&guardian?.active===true&&!guardian.dead;
 const cinematic=()=>locked()&&guardian.airshipTime!==null;
 const owns=id=>flags[0].includes(id);
 function record(id){
  const next=rules.advance(flags,id);
  if(!next)return false;
  flags[0]=next;persist();updateHUD();return true;
 }
 function reset(){
  ballistaHealth=new Map();
  guardian=isCave()&&!owns(progress.guardian)?{
   x:level.guardian.x-58,y:level.guardian.y-172,w:116,h:172,face:-1,
   armor:rules.armorLayers,clock:1.1,active:false,dead:false,cast:null,attackIndex:0,
   walkSpeed:0,animTime:0,airshipTime:null
  }:null;
 }
 function context(){
  if(Prologue.active)return null;
  if(level===ninjaCamp){
   const current=stage();
   const reika=DungeonRun.campNpc('reika');
   if(current==='briefing'&&reika&&pointNear(reika,95,85))return {type:'thirdClanBriefing',text:I18n.format('camp.talk',[I18n.t(reika.name)])};
   if(owns(progress.accepted)&&pointNear(level.thirdClanExit,85,85))return {type:'thirdClanEnter',text:I18n.t('thirdClan.enter')};
   return null;
  }
  if(locked())return null;
  if(isPath()&&pointNear(level.caveEntrance,100,90)){
   const blocked=stage()==='ballistae';
   return {type:'thirdClanCave',blocked,text:I18n.t(blocked?'thirdClan.cave.blocked':'thirdClan.cave.enter')};
  }
  if(isCave()&&stage()==='trail'&&pointNear(level.haruTrail,105,90))return {type:'thirdClanTrail',text:I18n.t('thirdClan.trail.inspect')};
  if((isPath()||isCave())&&pointNear(level.returnPoint,95,85))return {type:'thirdClanReturn',text:I18n.t(isPath()?'thirdClan.return.camp':'thirdClan.return.path')};
  return null;
 }
 function interact(candidate){
  if(!candidate?.type.startsWith('thirdClan'))return false;
  const current=context();
  if(state!=='play'||candidate.type!==current?.type)return false;
  switch(current.type){
   case 'thirdClanBriefing':
    story('thirdClan.path','ninjaClan.sentinel','thirdClan.reika',()=>record(progress.accepted),{right:'reika',speaker:'reika'});
    return true;
   case 'thirdClanEnter':return CampQuest.enter(thirdClanPath.id);
   case 'thirdClanCave':return current.blocked||CampQuest.enter(thirdClanCave.id);
   case 'thirdClanReturn':return CampQuest.leave();
   case 'thirdClanTrail':
    story('thirdClan.cave','thirdClan.cave','thirdClan.trail.story',()=>record(progress.trail));
    return true;
   default:return false;
  }
 }
 function target(map,point,name,text,remote){
  if(level===map)return {point,name,text};
  return remote?{compass:false,remote:true,name,text}:null;
 }
 function objective({remote=false}={}){
  const current=stage();
  if(!current&&DevSession.active){
   if(isPath())return target(thirdClanPath,level.ballistae[0],'thirdClan.ballista','thirdClan.objective.ballistae',false);
   if(isCave())return target(thirdClanCave,level.guardian,'thirdClan.guardian','thirdClan.objective.armor',false);
  }
  if(current==='briefing')return target(ninjaCamp,ninjaCamp.npcs.find(npc=>npc.id==='reika'),'ninjaClan.sentinel','thirdClan.objective.reika',remote);
  if(current==='complete')return (remote||isPath()||isCave()||level===ninjaCamp)?{compass:false,journeyEnd:true,text:'story.journeyEnd'}:null;
  if(!current)return null;
  if(level===ninjaCamp)return target(ninjaCamp,ninjaCamp.thirdClanExit,'thirdClan.path','thirdClan.enter',remote);
  if(current==='ballistae')return target(thirdClanPath,thirdClanPath.ballistae.find(ballista=>!owns(ballista.id)),'thirdClan.ballista','thirdClan.objective.ballistae',remote);
  if(isPath())return target(thirdClanPath,thirdClanPath.caveEntrance,'thirdClan.cave','thirdClan.cave.enter',remote);
  if(current==='guardian'){
   const point=guardian?{x:guardian.x+guardian.w/2,y:guardian.y+guardian.h}:thirdClanCave.guardian;
   return target(thirdClanCave,point,'thirdClan.guardian','thirdClan.objective.armor',remote);
  }
  return target(thirdClanCave,thirdClanCave.haruTrail,'thirdClan.cave','thirdClan.objective.trail',remote);
 }
 const hitbox=point=>({x:point.x-94,y:point.y-126,w:188,h:126});
 function hit(box,amount,kind){
  if(isPath()&&amount>0){
   for(const point of level.ballistae){
    const before=ballistaHp(point);
    if(!before||!overlap(box,hitbox(point)))continue;
    const hp=Math.max(0,before-amount);
    ballistaHealth.set(point.id,hp);
    burst(point.x,point.y-66,hp?'#e9bd7d':'#b67555',hp?9:24);
    if(!hp)record(point.id);
   }
  }
  if(!locked()||!overlap(box,guardian))return false;
  if(cinematic())return true;
  const next=rules.strikeArmor(guardian.armor,kind);
  if(next===guardian.armor)return true;
  guardian.armor=next;
  burst(guardian.x+guardian.w/2,guardian.y+55,'#dca66c',17);
  if(!next){
   guardian.airshipTime=0;guardian.cast=null;guardian.walkSpeed=0;projectiles=[];
   guardian.bowX=Math.min(guardian.x-215,camera+325);
   player.vx=0;player.vy=0;dash=0;Grapple.cancel();
   story('thirdClan.cave','balloon.pilot','thirdClan.westheru');
  }
  updateHUD();return true;
 }
 function update(dt){
  if(state!=='play'||!isCave()||!guardian||guardian.dead)return;
  const demon=guardian,arena=level.guardian;
  if(!demon.active){
   if(player.x+player.w/2<arena.triggerX)return;
   demon.active=true;keys.clear();pressed.clear();
  }
  if(cinematic()){
   const next=rules.stepAirship(demon.airshipTime,dt);demon.airshipTime=next.elapsed;
   if(next.fired)tone(140,.18,'triangle',.04);
   if(next.impact)burst(demon.x+demon.w/2,demon.y+80,'#debb89',32);
   if(next.finished){demon.dead=true;record(progress.guardian);}
   return;
  }
  player.x=clamp(player.x,arena.left,arena.right-player.w);
  const x=demon.x+demon.w/2,feet=demon.y+demon.h,px=player.x+player.w/2;
  demon.clock-=dt;demon.animTime+=dt;
  if(demon.cast){
   if(demon.clock>0)return;
   const cast=demon.cast;demon.cast=null;demon.clock=1.18;
   burst(cast.x+cast.w/2,feet-15,cast.spell?'#b387ea':'#e3ba85',24);
   if(overlap(player,cast))damage(cast.spell?6:7,demon.face,!cast.spell,false,cast.spell?'spell':null);
   return;
  }
  demon.face=Math.sign(px-x)||demon.face;
  demon.walkSpeed=Math.abs(px-x)>174?demon.face*150:0;
  if(demon.clock>0){
   demon.x=clamp(demon.x+demon.walkSpeed*dt,arena.left+35,arena.right-demon.w-35);
   return;
  }
  const spell=demon.attackIndex++%2===1||Math.abs(px-x)>345;
  demon.cast=spell?{x:px-97,y:feet-142,w:194,h:142,spell}:
   {x:demon.face>0?x-22:x-248,y:feet-119,w:270,h:119,spell};
  demon.clock=spell?1.05:.83;demon.walkSpeed=0;
 }
 function hud(){
  if(!isPath()&&!isCave())return false;
  const visible=locked();$('bossHud').hidden=!visible;
  if(visible){
   $('bossName').textContent=I18n.t('thirdClan.guardian')+' · '+I18n.format('thirdClan.armor.count',[guardian.armor,rules.armorLayers]);
   $('bossHealth').style.width=100*guardian.armor/rules.armorLayers+'%';
  }
  if(isPath())$('objective').textContent=keyedInstruction(I18n.t(objective()?.text||'thirdClan.objective.ballistae'))+' · '+I18n.format('thirdClan.ballista.count',[rules.disabled(flags)]);
  return true;
 }
 const ballistaHp=point=>owns(point.id)?0:ballistaHealth.get(point.id)??rules.ballistaHealth;
 return Object.freeze({context,interact,objective,hit,hud,update,reset,locked,cinematic,isPath,isCave,
  questMarker:id=>id==='reika'&&level===ninjaCamp&&stage()==='briefing'?'!':null,
  get guardian(){return guardian;},ballistaHp});
})();
