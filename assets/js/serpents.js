/* Shared serpent state machine; species data owns only authored differences.
 * Lava's host encounter still owns summon/despawn, wave transitions and HP carry.
 * Independent snakes use ordinary miniboss persistence and replay isolation. */
'use strict';
const Serpents=(()=>{
 const freezeMoves=entries=>Object.freeze(Object.fromEntries(Object.entries(entries).map(([id,m])=>[id,Object.freeze(m)])));
 const profiles=Object.freeze({
  lava:Object.freeze({realm:1,name:'yomi.serpent.name',reward:'serpentScale',guardian:null,xp:70,w:120,h:84,hp:24,speed:115,range:135,wait:.7,recover:.65,
   moves:freezeMoves({emberFan:{tell:1.1,strike:.42,kind:'ember',color:'#ffa465',speed:240,spread:.22,count:3,damage:1},bite:{tell:.8,strike:.42,width:125,damage:2}})}),
  white:Object.freeze({realm:0,name:'serpent.white.name',reward:'whiteSerpentScale',guardian:'guardian:whiteSerpent',xp:100,w:150,h:100,hp:72,speed:85,range:165,wait:.65,recover:.8,
   moves:freezeMoves({bite:{tell:.85,strike:.32,width:150,damage:2},frostFan:{tell:1.05,strike:.45,kind:'magic',color:'#b8e8ee',speed:250,spread:.23,count:3,damage:1},groundBurst:{tell:1.2,strike:.4,damage:2}})}),
  winged:Object.freeze({realm:2,name:'serpent.winged.name',reward:'wingedSerpentScale',guardian:'guardian:wingedSerpent',xp:180,w:190,h:125,hp:150,speed:100,range:175,wait:.55,recover:.8,
   moves:freezeMoves({bite:{tell:.8,strike:.35,width:170,damage:2},holyFan:{tell:1.15,strike:.5,kind:'holyArrow',color:'#ffe6a2',speed:280,spread:.2,count:5,damage:1},shadowSweep:{tell:1.15,strike:.5,width:90,speed:420,damage:2}})})
 });
 const type=spec=>spec?.serpentType||(spec?.serpent===true?'lava':null);
 const is=spec=>Object.hasOwn(profiles,type(spec));
 const profile=enemy=>profiles[type(enemy)];
 const source=enemy=>(type(enemy)==='lava'?'serpent:':'mini:')+enemy.id;
 function phase(enemy,next,duration){
  enemy.phase=next;enemy.clock=duration;enemy.phaseDuration=duration;
  enemy.windup=next==='windup'?duration:0;enemy.windupDuration=duration;
  enemy.attackTime=next==='strike'?duration:0;enemy.attackDuration=duration;
  enemy.attackElapsed=0;enemy.hitDone=false;
 }
 function current(enemy){
  const p=profile(enemy);if(!p||enemy.dead||!enemies.includes(enemy)||realm!==p.realm||level!==levels[p.realm])return false;
  return type(enemy)!=='lava'||enemy===boss.serpent&&bossStarted&&!boss.dead;
 }
 function meleeBox(enemy,width){
  return {x:enemy.attackFace>0?enemy.x+enemy.w*.4:enemy.x-width,y:enemy.y-8,w:width+enemy.w*.6,h:enemy.h+20};
 }
 function reset(enemy){
  const p=profile(enemy);if(!p)return false;
  Object.assign(enemy,{x:enemy.origin,y:enemy.baseY,hp:enemy.maxHp,active:false,dead:!enemy.replay&&!!p.guardian&&flags[p.realm].includes(p.guardian),
   face:-1,attackFace:-1,inv:0,stun:0,animTime:0,walkSpeed:0,cycles:0,move:null,attackBox:null,hazards:[],guardBreak:0,blockFlash:0});
  phase(enemy,'wait',type(enemy)==='lava'?.7:1);
  if(type(enemy)!=='lava')projectiles=projectiles.filter(projectile=>projectile.source!==source(enemy));
  return enemy;
 }
 function create(spec){
  const serpentType=type(spec),p=profiles[serpentType];if(!p)throw new TypeError('Unknown serpent species');
  const area=level.secrets?.find(candidate=>candidate.id===spec.secretArea),arena=spec.arena||area?.arena||level.arena;
  const enemy={...spec,serpentType,name:p.name,kind:'serpent',miniboss:spec.miniboss||serpentType+'Serpent',w:p.w,h:p.h,maxHp:p.hp,
   origin:spec.x,baseY:spec.y-p.h,arena,patrolLeft:arena.x+25,patrolRight:arena.x+arena.w-p.w-25};
  if(serpentType==='lava')enemy.serpent=true;else delete enemy.serpent;
  reset(enemy);
  if(serpentType==='lava'){
   enemy.active=true;enemy.dead=false;enemy.move='emberFan';enemy.targetX=player.x+player.w/2;enemy.targetY=player.y+player.h*.5;
   phase(enemy,'windup',p.moves.emberFan.tell);
  }
  return enemy;
 }
 function tell(enemy){
  const p=profile(enemy),ids=Object.keys(p.moves),move=ids[enemy.cycles++%ids.length],m=p.moves[move];
  enemy.move=move;enemy.attackFace=enemy.face;enemy.targetX=player.x+player.w/2;enemy.targetY=player.y+player.h*.5;
  enemy.attackBox=null;
  if(move==='bite')enemy.attackBox=meleeBox(enemy,m.width);
  if(move==='shadowSweep'){
   enemy.sweepEnd=clamp(enemy.x+enemy.attackFace*m.speed*m.strike,enemy.patrolLeft,enemy.patrolRight);
   const start=meleeBox(enemy,m.width),end=meleeBox({...enemy,x:enemy.sweepEnd},m.width),left=Math.min(start.x,end.x);
   enemy.attackBox={x:left,y:start.y,w:Math.max(start.x+start.w,end.x+end.w)-left,h:start.h};
  }
  if(move==='groundBurst')for(const delta of [-155,0,155])enemy.hazards.push({kind:'frostBurst',x:clamp(enemy.targetX+delta,enemy.arena.x+55,enemy.arena.x+enemy.arena.w-55)-45,y:enemy.arena.y-78,w:90,h:78,warning:m.tell,life:m.tell+.38,active:false,damage:m.damage});
  phase(enemy,'windup',m.tell);
 }
 function release(enemy){
  const p=profile(enemy),m=p.moves[enemy.move];phase(enemy,'strike',m.strike);
  if(m.kind){
   const angle=Math.atan2(enemy.targetY-enemy.y-enemy.h*.5,enemy.targetX-enemy.x-enemy.w*.5);
   for(let i=0;i<m.count;i++){
    const a=angle+(i-(m.count-1)/2)*m.spread;
    shoot(enemy.x+enemy.w/2,enemy.y+enemy.h*.5,Math.cos(a)*m.speed,Math.sin(a)*m.speed,m.color,4,m.kind);
    Object.assign(projectiles.at(-1),{source:source(enemy),serpentType:type(enemy),damage:m.damage,radius:m.kind==='holyArrow'||m.kind==='ember'?9:8});
   }
  }
  if(enemy.move==='bite')return strike(enemy);
  return true;
 }
 function strike(enemy){
  if(enemy.hitDone)return true;
  const m=profile(enemy).moves[enemy.move];if(!m.width)return true;
  const hit=meleeBox(enemy,m.width);if(!overlap(player,hit))return true;
  enemy.hitDone=true;const victim=player;
  damage(m.damage,enemy.attackFace,true);
  return player===victim&&current(enemy)&&state==='play';
 }
 function tickHazards(enemy,dt){
  for(const hazard of enemy.hazards){
   hazard.warning=Math.max(0,hazard.warning-dt);hazard.life-=dt;hazard.active=hazard.warning<=0;
   if(hazard.active&&hazard.life>0&&overlap(player,hazard)){
    const victim=player;damage(hazard.damage,player.x+player.w/2>hazard.x+hazard.w/2?1:-1);
    if(player!==victim||!current(enemy)||state!=='play')return false;
   }
  }
  enemy.hazards=enemy.hazards.filter(h=>h.life>0);return true;
 }
 function inside(enemy){
  const a=enemy.arena,feet=player.y+player.h;
  return player.x+player.w>a.x-100&&player.x<a.x+a.w+100&&feet>=a.y-350&&feet<=a.y+25;
 }
 function follow(enemy,dt){
  const p=profile(enemy),dx=player.x+player.w/2-enemy.x-enemy.w/2;enemy.face=Math.sign(dx)||enemy.face;
  if(type(enemy)==='lava'){
   const feet=clamp(player.y+player.h,level.arena.y-220,level.arena.y-75);enemy.y+=(feet-enemy.h-enemy.y)*Math.min(1,dt*3);
  }else if(type(enemy)==='winged'){
   const feet=clamp(player.y+player.h,enemy.arena.y-150,enemy.arena.y);enemy.y+=(feet-enemy.h-enemy.y)*Math.min(1,dt*3);
  }
  if(Math.abs(dx)>p.range){const old=enemy.x;enemy.x=clamp(enemy.x+enemy.face*p.speed*dt,enemy.patrolLeft,enemy.patrolRight);enemy.walkSpeed=(enemy.x-old)/dt;}
 }
 function update(enemy,dt){
  if(state!=='play'||!Number.isFinite(dt)||dt<=0||!current(enemy))return;
  const p=profile(enemy);
  if(type(enemy)!=='lava'){
   if(!inside(enemy)){if(enemy.active)reset(enemy);return;}
   if(!enemy.active){if(player.y+player.h<enemy.arena.y-200)return;enemy.active=true;}
  }
  if(!enemy.active)return;
  enemy.inv=Math.max(0,enemy.inv-dt);enemy.stun=Math.max(0,enemy.stun-dt);enemy.clock-=dt;enemy.animTime+=dt;enemy.walkSpeed=0;
  if(!tickHazards(enemy,dt))return;
  if(enemy.phase==='wait'){follow(enemy,dt);if(enemy.clock<=0)tell(enemy);}
  else if(enemy.phase==='windup'){
   enemy.windup=Math.max(0,enemy.clock);
   if(enemy.clock<=0&&!release(enemy))return;
  }else if(enemy.phase==='strike'){
   enemy.attackElapsed+=dt;enemy.attackTime=Math.max(0,enemy.clock);
   if(enemy.move==='shadowSweep'){
    const old=enemy.x;enemy.x=clamp(enemy.x+enemy.attackFace*p.moves.shadowSweep.speed*dt,enemy.patrolLeft,enemy.patrolRight);
    enemy.walkSpeed=(enemy.x-old)/dt;
   }
   // Lava's bite remains a one-shot release attack, matching its old timing.
   if(type(enemy)!=='lava'&&['bite','shadowSweep'].includes(enemy.move)&&!strike(enemy))return;
   if(enemy.clock<=0){enemy.attackBox=null;phase(enemy,'recover',p.recover);}
  }else if(enemy.phase==='recover'&&enemy.clock<=0){phase(enemy,'wait',p.wait);}
 }
 function defeat(enemy){
  if(!current(enemy)||!enemy.active||enemy.hp>0)return false;
  const p=profile(enemy),first=!enemy.replay&&!flags[p.realm].includes(p.guardian||p.reward);
  enemy.dead=true;enemy.active=false;enemy.phase='dead';enemy.attackBox=null;enemy.hazards=[];enemy.windup=0;enemy.attackTime=0;
  if(first){
   if(p.guardian)flags[p.realm].push(p.guardian);
   if(!flags[p.realm].includes(p.reward))flags[p.realm].push(p.reward);
   Merchant.award(Merchant.rewards.miniboss);awardXP(p.xp);persist();updateHUD();
   if(type(enemy)==='lava')toast(I18n.t('yomi.serpent.scale.gained'));else toast(I18n.format('serpent.reward.gained',[I18n.t('item.'+p.reward)]));
  }
  burst(enemy.x+enemy.w/2,enemy.y+enemy.h*.5,type(enemy)==='lava'?'#ffbd69':type(enemy)==='white'?'#b8e8ee':'#e0b9ff',36);
  if(type(enemy)==='lava'&&boss.yomiStage==='shelter')endYomiShelter();
  return first;
 }
 return Object.freeze({profiles,is,create,reset,update,defeat});
})();
