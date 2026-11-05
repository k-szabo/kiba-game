/* Story-bound encounters borrow their identities and attacks, never their quest controllers. */
'use strict';
const TowerSpecialBosses=(()=>{
 const profiles=Object.freeze(Object.fromEntries(["main-0","main-1","main-2","seraph","eclipse","madPriest","hannah","arenaFia","dragonRaid","voidLieutenant","voidDemon","fiaRitual","prologueShadow","fiaVengeance"].map(id=>[id,BossCatalog.tower(id)])));
 let serial=0;const owners=new WeakMap();
 const type=e=>e?.towerEncounter||e?.miniboss;
 const is=e=>!!e?.towerBoss&&Object.hasOwn(profiles,type(e));
 const source=e=>'tower-special:'+e.id+':'+e.towerToken;
 const live=e=>is(e)&&level.tower&&TowerMode.running&&state==='play'&&enemies.includes(e)&&!e.dead&&e.active;
 const bounds=e=>({left:e.arena.x+20,right:Math.max(e.arena.x+20,e.arena.x+e.arena.w-e.w-20)});
 function sync(e){e.parts=[{x:e.x,y:e.y,w:e.w,h:e.h,face:e.face,poseIndex:e.poseIndex,index:0}];}
 function phase(e,next,duration){e.phase=next;e.clock=e.phaseDuration=duration;e.windup=next==='windup'?duration:0;e.windupDuration=duration;e.attackTime=next==='strike'?duration:0;e.attackDuration=duration;e.attackElapsed=0;e.hitDone=false;}
 function create(spec){
  const p=profiles[type(spec)];if(!p)throw Error('Unknown tower special encounter');
  const arena={...(spec.arena||level.arena)},w=p.w,h=p.h,x=clamp(spec.x,arena.x+20,arena.x+arena.w-w-20),maximum=spec.maxHp||48;
  const e={...spec,name:p.name,w,h,x,y:spec.y-h,origin:x,baseY:spec.y-h,arena,hp:maximum,maxHp:maximum,max:maximum,
   active:true,dead:false,face:-1,attackFace:-1,inv:0,stun:0,cycles:0,animTime:0,walkSpeed:0,poseIndex:0,stage:1,mode:'combat',
   towerToken:++serial,attackBoxes:[],hazards:[],echoes:[],echoQueue:[],spirits:[],summons:[],shieldRemaining:type(spec)==='arenaFia'?6:0,exposedRemaining:0,
   legs:type(spec)==='dragonRaid'?[{hp:12,maxHp:12},{hp:12,maxHp:12}]:[],legInv:0,stance:'standing',ritualEmpowered:false,ritualEffect:null,healFlash:0,spiritCounter:0,summonSerial:0,summonThresholds:[]};
  phase(e,'wait',.8);sync(e);return e;
 }
 function clean(e){projectiles=projectiles.filter(p=>p.source!==source(e));for(const support of enemies)if(support.towerSummonOwner===e.id)support.dead=true;e.attackBoxes=[];e.attackBox=null;e.hazards=[];e.echoes=[];e.echoQueue=[];e.spirits=[];e.summons=[];}
 function defeat(e){if(!is(e)||e.dead||e.hp>0)return false;clean(e);e.hp=0;e.dead=true;e.active=false;e.phase='dead';sync(e);return true;}
 function box(e,face,width=220,height=160){return {x:face>0?e.x+e.w*.4:e.x-width,y:e.y+e.h-height,w:width+e.w*.6,h:height};}
 function targetBox(e,width,height=150,offset=0){return {x:clamp(e.targetX+offset-width/2,e.arena.x+10,e.arena.x+e.arena.w-width-10),y:e.arena.y-height,w:width,h:height};}
 function deal(e,hit,amount){if(hit&&overlap(player,hit)){const victim=player;damage(amount,e.attackFace,true);return player===victim&&live(e);}return live(e);}
 function shots(e,count,spread,speed,damageValue=3,origin=null){
  const x=origin?.x??e.x+e.w/2,y=origin?.y??e.y+e.h*.35,angle=Math.atan2(e.targetY-y,e.targetX-x);
  for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*spread;const kind=e.move==='lightArrows'?'holyArrow':['embers','dragonFire','ritualHell','ritualDragon'].includes(e.move)?'ember':e.move==='shadowBolts'?'shadowBolt':'orb';shoot(x,y,Math.cos(a)*speed,Math.sin(a)*speed,'#cf9bf3',4,kind);const p=projectiles.at(-1);Object.assign(p,{source:source(e),damage:damageValue,radius:9,towerSpecialOwner:e.id,ritualEffect:e.ritualEffect||undefined});if(['fiaRitual','fiaVengeance','arenaFia'].includes(type(e)))Object.assign(p,{fiaEffect:'foxfire',fiaLife:4});owners.set(p,e);}
 }
 function marks(e,offsets,width,height=140,delay=.85){
  for(const offset of offsets){const b=targetBox(e,width,height,offset);if(e.hazards.some(h=>Math.abs(h.x-b.x)<width+20))continue;e.hazards.push({...b,warning:delay,warningDuration:delay,delay,life:delay+.4,active:false,hitDone:false,damage:3,kind:'towerRift',ritualEffect:e.ritualEffect});}
 }
 function tell(e){
  const id=type(e),p=profiles[id],moves=id==='main-2'&&e.stage===2?['shadowBolts','shadowRain','shadowNova']:id==='fiaRitual'?p.moves.slice(e.ritualEmpowered?4:0,e.ritualEmpowered?8:4):p.moves;e.move=moves[e.cycles++%moves.length];e.attackFace=e.face;e.targetX=player.x+player.w/2;e.targetY=player.y+player.h/2;e.attackBoxes=[];e.poseIndex=2;e.startX=e.x;e.startY=e.y;e.ritualEffect=null;
  let duration=.85;
  if(['cleave','doubleCut','hammer','combo','voidSlash','voidClaw','dragonBite','holySweep','priestStaff'].includes(e.move))e.attackBoxes=[box(e,e.attackFace,id==='dragonRaid'?240:220,id==='dragonRaid'?180:160)];
  if(['dash','dashReturn','jumpCut','jump'].includes(e.move)){
   const b=bounds(e);e.toX=clamp(e.move.includes('jump')||e.move==='jumpCut'?e.targetX-e.w/2:e.x+e.attackFace*390,b.left,b.right);
   e.attackBoxes=[{x:Math.min(e.x,e.toX)-60,y:e.arena.y-130,w:Math.abs(e.toX-e.x)+e.w+120,h:130}];duration=1;
  }
  if(['slam','lavaWave','shadowRain','shadowNova','eclipse','hellfire','riftBurst','fiaSigils','voidRift','dragonRift'].includes(e.move)){
   const wide=['lavaWave','eclipse'].includes(e.move);marks(e,wide?[-450,-220,0,220,450]:[-210,0,210],wide?145:110,150,1.1);duration=1.1;e.poseIndex=5;
  }
  if(e.move==='teleport'){const b=bounds(e);e.toX=clamp(e.targetX+(e.x<e.targetX?320:-320),b.left,b.right);e.attackBoxes=[{x:e.toX,y:e.baseY,w:e.w,h:e.h}];}
  if(e.move==='drain'||e.move==='charm')e.attackBoxes=[targetBox(e,e.move==='drain'?350:280,180)];
  if(e.move==='priestBell')e.attackBoxes=[targetBox(e,250,180)];
  if(e.move.startsWith('ritual')){
   e.ritualEffect={ritualHymn:'hymn',ritualHell:'hell',ritualDragon:'dragon',ritualVoid:'void'}[e.move];e.poseIndex=4;
   if(e.move==='ritualHymn'||e.move==='ritualHell')marks(e,e.move==='ritualHell'?[-330,-110,110,330]:[-240,0,240],120,170,.9);
   if(e.move==='ritualVoid')e.attackBoxes=[targetBox(e,390,190)];
  }
  e.attackBox=e.attackBoxes[0]||null;phase(e,'windup',duration);sync(e);
 }
 function summonSpirit(e){
  const colour=e.spiritCounter++%2?'red':'white',b=bounds(e),x=clamp(e.targetX+(colour==='red'?-340:340),b.left,b.right);
  e.spirits.push({colour,x,y:e.arena.y-132,w:72,h:132,face:Math.sign(e.targetX-x)||1,phase:'windup',clock:1,phaseTime:0,duration:1,attackBox:targetBox(e,170,150),hitDone:false});
 }
 function summon(e,faction){
  const current=enemies.filter(n=>n.towerSummonOwner===e.id&&!n.dead).length;
  for(let i=0;i<Math.min(2,4-current);i++){
   const index=++e.summonSerial,x=clamp(e.x+(i?-200:200),e.arena.x+20,e.arena.x+e.arena.w-80),n=createEnemy({id:'tower-special-support-'+e.towerToken+'-'+index,x,y:e.arena.y,kind:i?'mage':'guard',patrol:e.arena.w,summoned:true,noReward:true,towerEnemy:true,towerSummonOwner:e.id,factionOverride:faction},index);
   n.hp=n.maxHp=3;n.damageValue=1;n.cd=.9;enemies.push(n);
  }
 }
 function release(e){
  const moving=['dash','dashReturn','jumpCut','jump'].includes(e.move);e.returnStart=.4+(momoStats().invulnerability+.15)*(e.towerSpeed||1);phase(e,'strike',moving?e.move==='dashReturn'?e.returnStart+.4:1:.45);e.poseIndex=3;
  if(['lightArrows','shadowBolts','embers','foxfire','fiaBolts','voidVolley','dragonFire'].includes(e.move))shots(e,e.move==='dragonFire'?7:5,.18,e.move==='embers'?280:360,e.move==='dragonFire'?4:3);
  if(e.move.startsWith('ritual')){shots(e,e.move==='ritualDragon'?7:3,.18,380);summonSpirit(e);}
  if(e.move==='fiaSummon')summon(e,'shadowCult');
  if(e.move==='teleport'){e.teleportFrom={x:e.x+e.w/2,y:e.y+e.h};e.x=e.toX;e.attackBoxes=[];shots(e,3,.24,320);}
  if(e.move==='charm'&&overlap(player,e.attackBoxes[0])&&dash<=0&&player.inv<=0)e.charmRemaining=.8;
  if(e.move==='priestBell'&&overlap(player,e.attackBoxes[0])&&dash<=0&&player.inv<=0){player.stun=Math.max(player.stun||0,.5);deal(e,e.attackBoxes[0],2);}
  if(['drain','ritualVoid'].includes(e.move))for(const b of e.attackBoxes)if(!deal(e,b,3))return;
  if(type(e)==='hannah'&&e.stage===2&&moving)e.echoes.push({x:e.startX,y:e.startY,w:e.w,h:e.h,fromX:e.startX,toX:e.toX,face:e.attackFace,move:e.move,returnStart:e.returnStart,delay:e.attackDuration+.7,elapsed:0,duration:e.attackDuration,hitDone:false,poseIndex:3});
  sync(e);
 }
 function hazards(e,dt){
  for(const h of e.hazards){h.warning-=dt;h.delay=h.warning;h.life-=dt;h.active=h.warning<=0;if(h.active&&!h.hitDone&&overlap(player,h)){h.hitDone=true;if(!deal(e,h,h.damage))return false;}}
  e.hazards=e.hazards.filter(h=>h.life>0);return live(e);
 }
 function strike(e,dt){
  const moving=['dash','dashReturn','jumpCut','jump'].includes(e.move),p=clamp(e.attackElapsed/e.attackDuration,0,1);
  if(moving){
   const returning=e.move==='dashReturn'&&e.attackElapsed>=e.returnStart,t=e.move==='dashReturn'?(e.attackElapsed<.4?e.attackElapsed/.4:!returning?1:1-clamp((e.attackElapsed-e.returnStart)/.4,0,1)):p;
   e.x=e.startX+(e.toX-e.startX)*t;e.y=e.baseY-(e.move==='jump'||e.move==='jumpCut'?Math.sin(p*Math.PI)*200:0);
   const hit=e.move==='jump'||e.move==='jumpCut'?p>.75?targetBox({...e,targetX:e.toX+e.w/2},250,130):null:box(e,returning?-e.attackFace:e.attackFace,155,130);
   if(returning&&!e.returnStarted){e.returnStarted=true;e.hitDone=false;}
   if(hit&&!e.hitDone&&overlap(player,hit)){e.hitDone=true;if(!deal(e,hit,4))return false;}
  }else if(!e.hitDone&&['cleave','doubleCut','hammer','combo','voidSlash','voidClaw','dragonBite','holySweep','priestStaff'].includes(e.move)){
   for(const hit of e.attackBoxes)if(overlap(player,hit)){e.hitDone=true;if(!deal(e,hit,3))return false;}
  }
  if(['doubleCut','combo'].includes(e.move)&&p>.55&&!e.followHit){e.followHit=true;e.attackBoxes=[box(e,-e.attackFace,230,170)];e.hitDone=false;}
  return live(e);
 }
 function effects(e,dt){
  for(const echo of e.echoes){echo.delay-=dt;if(echo.delay>0)continue;echo.elapsed+=dt;const p=clamp(echo.elapsed/echo.duration,0,1),t=echo.move==='dashReturn'?(echo.elapsed<.4?echo.elapsed/.4:echo.elapsed<echo.returnStart?1:1-clamp((echo.elapsed-echo.returnStart)/.4,0,1)):p;echo.x=echo.fromX+(echo.toX-echo.fromX)*t;echo.y=e.baseY-(echo.move==='jump'?Math.sin(p*Math.PI)*200:0);
   const hit=box(echo,echo.face,150,130);if(!echo.hitDone&&overlap(player,hit)){echo.hitDone=true;if(!deal(e,hit,3))return false;}}
  e.echoes=e.echoes.filter(s=>s.elapsed<s.duration);
  for(const s of e.spirits){s.clock-=dt;s.phaseTime+=dt;if(s.phase==='windup'&&s.clock<=0){s.phase='strike';s.clock=.4;s.phaseTime=0;if(s.colour==='white')shots(e,3,.24,330,3,{x:s.x+s.w/2,y:s.y+40});}
   if(s.phase==='strike'&&s.colour==='red'&&!s.hitDone&&overlap(player,s.attackBox)){s.hitDone=true;if(!deal(e,s.attackBox,3))return false;}if(s.phase==='strike'&&s.clock<=0){s.phase='fade';s.clock=.6;}}
  e.spirits=e.spirits.filter(s=>s.clock>0);return live(e);
 }
 function update(e,dt){
  if(!live(e)||!Number.isFinite(dt)||dt<=0)return;const raw=dt/(e.towerSpeed||1),id=type(e),p=profiles[id];
  e.animTime+=raw;e.inv=Math.max(0,e.inv-raw);e.stun=Math.max(0,e.stun-raw);e.legInv=Math.max(0,e.legInv-raw);e.healFlash=Math.max(0,e.healFlash-raw);e.walkSpeed=0;
  if(id==='hannah'&&e.hp<=e.maxHp*.5)e.stage=2;
  if(id==='main-2')e.stage=e.hp<=e.maxHp*.5?2:1;
  if(id==='main-1')for(const threshold of [.8,.6,.4,.2])if(e.hp<=e.maxHp*threshold&&!e.summonThresholds.includes(threshold)){e.summonThresholds.push(threshold);summon(e,'yomi');}
  if(id==='fiaRitual')e.ritualEmpowered=e.hp<=e.maxHp*.5;
  if(id==='arenaFia'){
   if(e.shieldRemaining>0){e.shieldRemaining=Math.max(0,e.shieldRemaining-raw);if(e.shieldRemaining===0){e.exposedRemaining=5;e.y=e.baseY;phase(e,'wait',.6);e.attackBoxes=[];e.hazards=[];projectiles=projectiles.filter(p=>p.source!==source(e));}}
   else if(e.exposedRemaining>0){e.exposedRemaining=Math.max(0,e.exposedRemaining-raw);if(!e.exposedRemaining){e.shieldRemaining=6;e.cycles++;phase(e,'wait',.6);}}
   if(e.exposedRemaining>0){e.poseIndex=6;sync(e);return;}e.y=e.baseY-145;
  }
  if(id==='dragonRaid'&&e.exposedRemaining>0){e.exposedRemaining=Math.max(0,e.exposedRemaining-raw);e.stance='exposed';e.poseIndex=2;sync(e);if(!e.exposedRemaining){e.legs.forEach(l=>l.hp=l.maxHp);e.stance='standing';phase(e,'wait',.8);}return;}
  if(e.charmRemaining>0){e.charmRemaining=Math.max(0,e.charmRemaining-raw);const dir=Math.sign(e.x+e.w/2-player.x-player.w/2);player.vx*=.6;player.x=clamp(player.x+dir*90*raw,e.arena.x,e.arena.x+e.arena.w-player.w);}
  if(!hazards(e,dt)||!effects(e,dt))return;e.clock-=dt;
  if(e.phase==='wait'){
   const dx=player.x+player.w/2-e.x-e.w/2;if(Math.abs(dx)>18)e.face=Math.sign(dx);const b=bounds(e);
   if(Math.abs(dx)>p.range&&p.speed){const before=e.x;e.x=clamp(e.x+e.face*p.speed*dt,b.left,b.right);e.walkSpeed=(e.x-before)/raw;}
   e.poseIndex=Math.abs(e.walkSpeed)>1?1:0;if(e.clock<=0){e.returnStarted=e.followHit=false;tell(e);}
  }else if(e.phase==='windup'){e.windup=Math.max(0,e.clock);if(e.clock<=0)release(e);}
  else if(e.phase==='strike'){e.attackElapsed+=dt;e.attackTime=Math.max(0,e.clock);if(!strike(e,dt))return;if(e.clock<=0){e.y=id==='arenaFia'?e.baseY-145:e.baseY;e.attackBoxes=[];e.attackBox=null;phase(e,'recover',.5);e.poseIndex=4;}}
  else if(e.phase==='recover'&&e.clock<=0)phase(e,'wait',.35);
  sync(e);
 }
 function legs(e){return e.legs.map((l,i)=>({...l,index:i,x:e.x+e.w*(i?.7:.2)-35,y:e.arena.y-90,w:70,h:90}));}
 const head=e=>({x:e.x+e.w*.28,y:e.arena.y-115,w:e.w*.44,h:115});
 function protects(e){return is(e)&&(type(e)==='arenaFia'&&e.shieldRemaining>0||type(e)==='dragonRaid'&&e.exposedRemaining<=0);}
 function hit(e,amount,kind,hitBox){
  if(!is(e))return {handled:false,damage:amount};if(!live(e)||!Number.isFinite(amount)||amount<=0)return {handled:true,damage:0,connected:false};
  if(type(e)==='dragonRaid'&&e.exposedRemaining<=0){
   if(e.legInv>0)return {handled:true,damage:0,connected:false};const targets=legs(e).filter(l=>l.hp>0&&hitBox&&overlap(hitBox,l));
   for(const l of targets)e.legs[l.index].hp=Math.max(0,l.hp-amount);
   if(targets.length)e.legInv=.2;
   if(e.legs.every(l=>l.hp<=0)){e.exposedRemaining=6;e.stance='exposed';e.poseIndex=2;e.attackBoxes=[];e.attackBox=null;e.hazards=[];e.echoes=[];projectiles=projectiles.filter(p=>p.source!==source(e));}
   return {handled:true,damage:0,connected:targets.length>0};
  }
  const blocked=protects(e)||type(e)==='dragonRaid'&&(!hitBox||!overlap(hitBox,head(e)));
  return {handled:true,damage:blocked?0:amount*(type(e)==='dragonRaid'?4:1),connected:!blocked};
 }
 function contact(e,victim,before){
  if(!live(e)||player!==victim||victim.hp<=0||!Number.isFinite(before)||before<=victim.hp||!(type(e)==='voidDemon'||e.move==='drain'))return 0;
  const last=e.lastLifeEvent;if(last&&last.victim===victim&&last.before===before&&last.after===victim.hp&&last.at===e.animTime)return 0;
  e.lastLifeEvent={victim,before,after:victim.hp,at:e.animTime};const loss=before-victim.hp,healed=Math.min(e.maxHp-e.hp,loss*(type(e)==='voidDemon'?20*e.maxHp/1800:1));
  e.hp+=healed;if(healed>0)e.healFlash=.35;return healed;
 }
 function projectile(p,victim,before){const owner=owners.get(p);owners.delete(p);return owner?contact(owner,victim,before):0;}
 return Object.freeze({is,type,profiles,create,update,defeat,protects,hit,contact,projectile,legs,head});
})();
