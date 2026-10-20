/* The optional grave guardian owns no main-quest or player-level progression. */
'use strict';
const DoomSlayer=(()=>{
 const flag='guardian:doomSlayer',moves=['flail','oil','fireArrows','lightning','kick','arrows','doubleJump','grab','explosion'];
 const is=e=>e?.miniboss==='slayer';
 const facing=e=>Math.sign(player.x+player.w/2-e.x-e.w/2)||e.face;
 function phase(e,name,duration){
  e.phase=name;e.clock=duration;e.phaseDuration=duration;e.hitDone=false;e.attackElapsed=0;
  e.windup=name==='windup'?duration:0;e.windupDuration=duration;
  e.pose=(e.move||'idle')+name[0].toUpperCase()+name.slice(1);
 }
 function release(e){
  if(e.victim?.slayerGrab){e.victim.slayerGrab=false;if(e.victim.stun<=e.captureStun+1e-6)e.victim.stun=0;}
  e.victim=null;e.captureClock=0;e.captureStun=0;
 }
 function clear(e){
  if(!e){for(const enemy of enemies)if(is(enemy))clear(enemy);projectiles=projectiles.filter(p=>!p.slayer);return;}
  release(e);e.hazards=[];e.oils=[];e.barrels=[];e.vy=0;e.walkSpeed=0;
  projectiles=projectiles.filter(p=>!p.slayer);
 }
 function reset(e){
  clear(e);Object.assign(e,{x:e.origin,y:e.baseY,hp:e.maxHp,active:false,dead:flags[1].includes(flag),
   cycles:0,move:null,inv:0,stun:0,armor:0,sawTriggered:false,sawReady:false,jumps:0,
   jumpUsed:false,landed:false,blockFlash:0,victoryPending:false,animTime:0,contactCd:0});
  phase(e,'wait',.65);return e;
 }
 function create(spec,i=0){
  const area=level.secrets.find(s=>s.id===spec.secretArea);if(!area?.arena)throw Error('Missing grave arena');
  const e={...spec,w:76,h:112,maxHp:260,origin:spec.x,baseY:spec.y-112,arena:area.arena,
   face:-1,attackFace:-1,patrolFace:-1,patrolLeft:area.arena.x+22,patrolRight:area.arena.x+area.arena.w-98,
   recovery:0,attackTime:0,attackDuration:.65,turnCooldown:0,guardBreak:0,blocks:0,index:i};
  return reset(e);
 }
 function start(e){
  if(!is(e)||e.dead||e.active)return false;
  e.active=true;e.barrels=[.18,.5,.82].map((f,i)=>({id:i,x:e.arena.x+e.arena.w*f,y:e.arena.y,punctured:false}));
  e.face=facing(e);e.attackFace=e.face;phase(e,'wait',.65);return true;
 }
 // Damage can synchronously revive Momo and reset this very encounter. Never
 // grab, heal or continue an attack against the replacement player object.
 function hurt(e,amount,dir=e.attackFace){
  const victim=player;if(!e.active||e.dead||victim.inv>0||dash>0||DevImmortality.active)return null;
  const before=victim.hp;damage(amount,dir);
  // revive() rebuilds the enemy array too; this old instance may no longer be
  // reachable by resetMinibosses, so cancel it explicitly on player replacement.
  if(player!==victim||victim.hp<=0){reset(e);return null;}
  if(!e.active||e.dead)return null;
  return victim.hp<before?victim:null;
 }
 function capture(e,victim,duration){e.victim=victim;e.captureClock=duration;e.captureStun=duration;victim.slayerGrab=true;victim.stun=Math.max(victim.stun,duration);}
 function meleeBox(e,width=150){return{x:e.attackFace>0?e.x+e.w*.4:e.x-width,y:e.y-4,w:width+e.w*.6,h:e.h+12};}
 function shot(e,x,y,vx,vy,damageValue,kind='arrow',extra={}){
  shoot(x,y,vx,vy,kind==='arrow'?'#f0a35f':'#c3d9f1',4,kind);
  Object.assign(projectiles.at(-1),{damage:damageValue,slayer:true,source:'slayer',radius:8,...extra});
 }
 function hazard(e,kind,x,width,warning,active,damageValue,height=180){
  e.hazards.push({kind,x:clamp(x-width/2,e.arena.x+12,e.arena.x+e.arena.w-width-12),y:e.arena.y-height,
   w:width,h:height,warning,warningDuration:warning,life:warning+active,active:false,damage:damageValue});
 }
 function beginSaw(e){
  e.sawTriggered=true;release(e);e.hazards=[];projectiles=projectiles.filter(p=>!p.slayer);
  e.move='saw';e.attackFace=facing(e);e.face=e.attackFace;e.retreatFrom=e.x;
  e.retreatTo=clamp(e.x-e.attackFace*260,e.patrolLeft,e.patrolRight);phase(e,'retreat',.65);
 }
 function defeat(e){
  if(e.dead)return false;
  const first=!flags[1].includes(flag);e.hp=0;e.dead=true;e.active=false;clear(e);e.pose='defeat';e.victoryPending=first;
  if(first){flags[1].push(flag);persist();}updateHUD();return first;
 }
 function hit(e,hitbox,amount,kind='normal'){
  if(state!=='play'||!e.active||e.dead||e.inv>0||!Number.isFinite(amount)||amount<=0||!overlap(hitbox,e))return 0;
  const front=Math.sign(player.x+player.w/2-e.x-e.w/2)===e.face,above=player.y+player.h<e.y+e.h*.55;
  if(kind==='normal'&&e.phase==='wait'&&front&&!above){e.blockFlash=.25;return 0;}
  const before=e.hp;e.hp=Math.max(0,e.hp-Math.max(.25,amount-e.armor));e.inv=.12;
  if(typeof DevDamage!=='undefined')DevDamage.record('outgoing',e,before,e.hp);
  if(!e.hp)defeat(e);else if(!e.sawTriggered&&e.hp<=e.maxHp*.3)beginSaw(e);
  return before-e.hp;
 }
 function choose(e){
  e.move=e.sawReady?'saw':moves[e.cycles++%moves.length];e.face=facing(e);e.attackFace=e.face;
  e.targetX=player.x+player.w/2;e.targetY=player.y+player.h/2;
  const duration={flail:.85,oil:.8,fireArrows:.7,lightning:1.05,kick:.65,arrows:1,doubleJump:.75,grab:.8,explosion:1.1,saw:.55}[e.move];
  phase(e,'windup',duration);
 }
 function strike(e){
  phase(e,'strike',e.move==='doubleJump'?2.4:e.move==='saw'?.95:.65);
  if(e.move==='lightning')for(const offset of [-170,0,170])hazard(e,'lightning',e.targetX+offset,66,.65+Math.abs(offset)/900,.4,4,500);
  if(e.move==='explosion')hazard(e,'explosion',e.targetX,260,.7,.45,5,210);
  if(e.move==='arrows')for(let n=-4;n<=4;n++){
   const x=clamp(e.targetX+n*115,e.arena.x+35,e.arena.x+e.arena.w-35);
   shot(e,x,e.arena.y-620,0,660,2);hazard(e,'arrowWarning',x,24,1,.2,0,12);
  }
  if(e.move==='oil'){
   const barrel=e.barrels.find(b=>!b.punctured);
   if(barrel){barrel.punctured=true;e.oils.push({id:barrel.id,x:clamp(barrel.x-160,e.arena.x+15,e.arena.x+e.arena.w-335),y:e.arena.y-14,w:320,h:20,lit:false,warning:0,life:35});}
  }
  if(e.move==='fireArrows'){
   const oil=e.oils.find(o=>!o.lit),x=e.x+e.w/2,y=e.y+22,tx=oil?oil.x+oil.w/2:e.targetX,ty=oil?oil.y+6:e.targetY;
   const dx=tx-x,flight=Math.max(.2,Math.abs(dx)/420),angle=Math.atan2(ty-y-27.5*flight*flight,dx);
   shot(e,x,y,Math.cos(angle)*420,Math.sin(angle)*420,2,'arrow',{fire:true,igniteOil:oil?.id});
  }
  if(e.move==='doubleJump'){e.vy=-720;e.jumps=1;e.jumpUsed=false;e.landed=false;e.jumpFace=facing(e);}
 }
 function strikeContact(e){
  if(e.hitDone||!['flail','kick','grab','saw'].includes(e.move)||!overlap(player,meleeBox(e,e.move==='flail'?185:e.move==='grab'?105:140)))return;
  e.hitDone=true;
  const lowGrab=e.move==='grab'&&player.hp<=3,amount=lowGrab?player.hp:({flail:5,kick:3,grab:2,saw:5}[e.move]);
  const victim=hurt(e,amount);if(!victim)return;
  if(e.move==='kick'){victim.vx=e.attackFace*720;victim.vy=-280;}
  if(e.move==='grab')capture(e,victim,.5);
  if(e.move==='saw'){capture(e,victim,.9);e.hp=Math.min(e.maxHp,e.hp+20);e.armor=Math.min(8,e.armor+1);}
 }
 function effects(e,dt){
  for(const h of e.hazards){
   h.warning-=dt;h.life-=dt;h.active=h.warning<=0;
   if(h.active&&h.life>0&&h.damage&&overlap(player,h)){hurt(e,h.damage,player.x>h.x?1:-1);if(!e.active)return;}
  }
  e.hazards=e.hazards.filter(h=>h.life>0);
  for(const oil of e.oils){
   oil.life-=dt;if(oil.lit){oil.warning=Math.max(0,oil.warning-dt);if(!oil.warning&&overlap(player,oil)){hurt(e,2,player.x>oil.x?1:-1);if(!e.active)return;}}
   else for(const p of projectiles)if(p.slayer&&p.fire&&p.life>0&&overlap({x:p.x-10,y:p.y-10,w:20,h:20},oil)){oil.lit=true;oil.warning=.45;oil.life=12;p.life=0;break;}
  }
  e.oils=e.oils.filter(o=>o.life>0);
 }
 function update(e,dt){
  if(state!=='play'||!e.active||e.dead||!Number.isFinite(dt)||dt<=0)return;
  const a=e.arena,feet=player.y+player.h;
  if(player.x+player.w<a.x-30||player.x>a.x+a.w+30||feet<a.y-650||feet>a.y+120){reset(e);return;}
  if(e.victim&&e.victim!==player){reset(e);return;}
  e.inv=Math.max(0,e.inv-dt);e.stun=Math.max(0,e.stun-dt);e.blockFlash=Math.max(0,e.blockFlash-dt);
  e.animTime+=dt;e.attackElapsed+=dt;e.walkSpeed=0;
  if(e.victim){
   e.captureClock-=dt;
   if(e.captureClock<=0)release(e);
   else{player.x=clamp(e.x+e.attackFace*58,0,level.width-player.w);player.y=e.arena.y-player.h;player.vx=0;player.vy=0;e.captureStun=e.captureClock;player.stun=Math.max(player.stun,e.captureClock);}
  }
  effects(e,dt);if(!e.active||e.dead)return;
  if(!e.sawTriggered&&e.hp<=e.maxHp*.3)beginSaw(e);
  e.clock-=dt;
  if(e.phase==='retreat'){
   const t=clamp(1-e.clock/e.phaseDuration,0,1);e.x=e.retreatFrom+(e.retreatTo-e.retreatFrom)*t;e.y=e.baseY-Math.sin(t*Math.PI)*80;
   if(e.clock<=0){e.y=e.baseY;e.inv=0;phase(e,'cast',5);e.pose='sawCast';}return;
  }
  if(e.phase==='cast'){if(e.clock<=0){e.sawReady=true;phase(e,'wait',.15);}return;}
  if(e.phase==='wait'){
   const dx=player.x+player.w/2-e.x-e.w/2;e.face=Math.sign(dx)||e.face;
   if(Math.abs(dx)>130&&e.stun<=0){const old=e.x;e.x=clamp(e.x+e.face*(e.sawReady?310:125)*dt,e.patrolLeft,e.patrolRight);e.walkSpeed=(e.x-old)/dt;}
   if(e.clock<=0)choose(e);
  }else if(e.phase==='windup'){e.windup=Math.max(0,e.clock);if(e.clock<=0)strike(e);}
  else if(e.phase==='strike'){
   if(e.move==='doubleJump'){
    e.vy+=1550*dt;
    if(!e.jumpUsed&&e.vy>=0){e.vy=-620;e.jumps=2;e.jumpUsed=true;}
    e.x=clamp(e.x+e.jumpFace*260*dt,e.patrolLeft,e.patrolRight);e.y+=e.vy*dt;
    if(e.y>=e.baseY&&e.vy>0){e.y=e.baseY;e.vy=0;if(!e.landed){e.landed=true;hazard(e,'landing',e.x+e.w/2,230,.35,.3,3,80);e.clock=Math.min(e.clock,.3);}}
   }else if(e.move==='saw'&&!e.victim){const old=e.x;e.x=clamp(e.x+e.attackFace*350*dt,e.patrolLeft,e.patrolRight);e.walkSpeed=(e.x-old)/dt;}
   strikeContact(e);if(!e.active||e.dead)return;
   if(e.clock<=0)phase(e,'recover',e.move==='saw'?.4:.55);
  }else if(e.phase==='recover'&&e.clock<=0)phase(e,'wait',e.sawReady?.15:.45);
 }
 return Object.freeze({is,create,reset,start,update,hit,defeat,clear});
})();
