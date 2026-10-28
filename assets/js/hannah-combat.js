/* Transient final encounter. HannahEncounter owns scenes and permanent flags. */
'use strict';
const HannahCombat=(()=>{
 const moves=Object.freeze(['combo','jump','dashReturn','summon']),owners=new Map();let serial=0;
 const is=e=>e?.miniboss==='hannah';
 const source=e=>'hannah:'+e.id+':'+e.encounterToken;
 const current=e=>is(e)&&!e.dead&&e.encounterLevel===level&&owners.get(e.encounterToken)===e&&enemies.includes(e);
 const live=e=>state==='play'&&current(e)&&e.active;
 const validStep=dt=>Number.isFinite(dt)&&dt>0;
 function notify(method,e,value){if(typeof HannahEncounter!=='undefined'&&typeof HannahEncounter[method]==='function')HannahEncounter[method](e,value);}
 function phase(e,next,duration){e.phase=next;e.clock=duration;e.phaseDuration=duration;e.windup=next==='windup'?duration:0;e.windupDuration=duration;e.attackTime=next==='strike'?duration:0;e.attackDuration=duration;e.attackElapsed=0;e.hitDone=false;}
 function sync(e){e.parts=[{x:e.x,y:e.y,w:e.w,h:e.h,face:e.face,poseIndex:e.poseIndex,index:0}];}
 function cleanup(e){
  const token=e.encounterToken,id=source(e);
  if(Number.isInteger(token)){
   for(const support of enemies)if(support.hannahOwner===token)support.dead=true;
   enemies=enemies.filter(support=>support.hannahOwner!==token);
   projectiles=projectiles.filter(p=>p.source!==id&&p.hannahOwner!==token);
   particles=particles.filter(p=>p.source!==id&&p.hannahOwner!==token);
  }
  e.hazards=[];e.attackBoxes=[];e.attackBox=null;e.summons=[];e.echoQueue=[];e.moveSnapshot=null;e.strikeHits=[];
 }
 function clear(e=null){
  if(e){if(!is(e))return false;cleanup(e);owners.delete(e.encounterToken);e.active=false;return true;}
  for(const owner of [...owners.values()]){cleanup(owner);owner.active=false;}owners.clear();return true;
 }
 function reset(e){
  if(!is(e))return false;cleanup(e);owners.delete(e.encounterToken);e.encounterToken=++serial;owners.set(e.encounterToken,e);
  Object.assign(e,{encounterLevel:level,arena:{...e.initialArena},x:e.origin,y:e.initialFeet-e.h,baseY:e.initialFeet-e.h,
   maxHp:HannahRules.tuning.phase1.maxHp,hp:HannahRules.tuning.phase1.maxHp,stage:1,gateIndex:0,mode:'combat',
   active:false,dead:false,face:-1,attackFace:-1,inv:0,stun:0,cycles:0,move:null,poseIndex:0,animTime:0,walkSpeed:0,
   haruHp:HannahRules.tuning.drain.haruMaxHp,drainDamage:0,drainThreshold:0,drainRemaining:0,failurePending:false,
   finishAuthorized:false,defeatNotified:false,summonSerial:0});
  phase(e,'wait',.9);sync(e);return e;
 }
 function create(spec){
  if(!is(spec))throw new TypeError('Unknown Hannah encounter');
  const arena={...(spec.arena||level.arena)},w=120,h=228;
  const e={...spec,w,h,origin:clamp(spec.x,arena.x+25,arena.x+arena.w-w-25),initialFeet:spec.y,initialArena:arena};
  reset(e);
  if(!e.replay&&flags[3]?.includes(HannahRules.progress.defeated)){e.dead=true;e.active=false;e.hp=0;e.phase='dead';sync(e);}
  return e;
 }
 function bounds(e){return {left:e.arena.x+25,right:Math.max(e.arena.x+25,e.arena.x+e.arena.w-e.w-25)};}
 function inside(e){const a=e.arena,feet=player.y+player.h;return player.x+player.w>a.x-70&&player.x<a.x+a.w+70&&feet>=a.y-520&&feet<=a.y+35;}
 function blade(body,face,width=205,height=155){return {x:face>0?body.x+body.w*.4:body.x-width,y:body.y+body.h-height,w:width+body.w*.6,h:height};}
 function union(a,b){const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y);return {x,y,w:Math.max(a.x+a.w,b.x+b.w)-x,h:Math.max(a.y+a.h,b.y+b.h)-y};}
 function snapshot(e){
  const b=bounds(e),from=e.x,target=player.x+player.w/2;
  const to=e.move==='jump'?clamp(target-e.w/2,Math.max(b.left,from-390),Math.min(b.right,from+390)):e.move==='dashReturn'?clamp(from+e.attackFace*440,b.left,b.right):from;
  return Object.freeze({move:e.move,face:e.attackFace,fromX:from,toX:to,y:e.baseY,w:e.w,h:e.h,
   duration:e.move==='combo'?1.03:e.move==='jump'?1.02:e.move==='dashReturn'?1.18:.28,
   damage:e.move==='jump'?4:3,height:220});
 }
 function position(s,t){
  let x=s.fromX,y=s.y;
  if(s.move==='jump'){const p=clamp(t/s.duration,0,1);x=s.fromX+(s.toX-s.fromX)*p;y-=Math.sin(p*Math.PI)*s.height;}
  if(s.move==='dashReturn'){
   const p=t<.44?clamp(t/.44,0,1):t<.7?1:1-clamp((t-.7)/.48,0,1);x=s.fromX+(s.toX-s.fromX)*p;
  }
  return {x,y,w:s.w,h:s.h};
 }
 function warnings(s){
  if(s.move==='jump')return [{x:s.toX+s.w/2-155,y:s.y+s.h-125,w:310,h:125}];
  if(s.move==='dashReturn')return [union(blade(position(s,0),s.face,140,125),blade(position(s,.44),s.face,140,125))];
  if(s.move==='summon')return [];
  return [blade(position(s,0),s.face),blade(position(s,0),-s.face,180)];
 }
 function tell(e){
  const pattern=e.stage===1?moves:moves.filter(move=>move!=='summon');e.move=pattern[e.cycles++%pattern.length];
  const dx=player.x+player.w/2-e.x-e.w/2;if(Math.abs(dx)>18)e.face=Math.sign(dx);e.attackFace=e.face;
  e.targetX=player.x+player.w/2;e.targetY=player.y+player.h/2;e.moveSnapshot=snapshot(e);e.attackBoxes=warnings(e.moveSnapshot);e.attackBox=e.attackBoxes[0]||null;
  const tellTime=e.move==='jump'?1:e.move==='summon'?1.15:e.move==='dashReturn'?.95:.8;
  e.summons=e.move==='summon'?[e.arena.x+130,e.arena.x+e.arena.w-175].map((x,index)=>({x,y:e.arena.y,kind:index?'shield':'guard',warning:tellTime,warningDuration:tellTime})):[];
  e.poseIndex=e.move==='summon'?5:2;phase(e,'windup',tellTime);sync(e);
 }
 function summon(e){
  if(e.stage!==1)return;
  const existing=enemies.filter(support=>support.hannahOwner===e.encounterToken&&!support.dead).length;
  for(const point of e.summons.slice(0,Math.max(0,4-existing))){
   const n=++e.summonSerial,support=createEnemy({id:'hannah-support-'+e.encounterToken+'-'+n,x:point.x,y:e.arena.y,kind:point.kind,factionOverride:n%2?'shadowCult':'yomi',patrol:e.arena.w,summoned:true,noReward:true},n);
   Object.assign(support,{hannahOwner:e.encounterToken,patrolLeft:e.arena.x+10,patrolRight:e.arena.x+e.arena.w-support.w-10,damageValue:2,cd:.9});enemies.push(support);
  }
  e.summons=[];
 }
 function release(e){
  phase(e,'strike',e.moveSnapshot.duration);e.poseIndex=3;e.strikeHits=[];e.attackBoxes=[];e.attackBox=null;
  if(e.move==='summon')summon(e);
  else if(e.stage===2)e.echoQueue.push({snapshot:e.moveSnapshot,delay:.85,elapsed:0,started:false,hits:[],parts:[],attackBoxes:warnings(e.moveSnapshot)});
 }
 function strike(e,s,previous,elapsed,hits){
  const windows=s.move==='combo'?[[0,.2,s.face,205],[.35,.55,-s.face,180],[.74,1,s.face,245]]:s.move==='jump'?[[.76,s.duration,s.face,0]]:s.move==='dashReturn'?[[0,.44,s.face,140],[.7,1.18,-s.face,140]]:[];
  for(let n=0;n<windows.length;n++){
   const [start,end,face,width]=windows[n];if(hits[n]||elapsed<start||previous>end)continue;
   let box;
   if(s.move==='jump')box={x:s.toX+s.w/2-155,y:s.y+s.h-125,w:310,h:125};
   else if(s.move==='dashReturn')box=union(blade(position(s,clamp(previous,start,end)),face,width,125),blade(position(s,clamp(elapsed,start,end)),face,width,125));
   else box=blade(position(s,0),face,width);
   if(!overlap(player,box))continue;
   hits[n]=true;const victim=player;damage(s.damage,face,true);
   if(player!==victim||!live(e)||e.mode!=='combat')return false;
  }
  return true;
 }
 function tickEchoes(e,dt){
  for(const echo of e.echoQueue){
   const before=echo.delay;echo.delay-=dt;
   if(echo.delay>0)continue;
   const step=before>0?Math.max(0,-echo.delay):dt,previous=echo.elapsed;echo.started=true;echo.elapsed=Math.min(echo.snapshot.duration,echo.elapsed+step);
   echo.attackBoxes=[];const p=position(echo.snapshot,echo.elapsed);echo.parts=[{...p,face:echo.snapshot.face,poseIndex:3}];
   if(!strike(e,echo.snapshot,previous,echo.elapsed,echo.hits))return false;
  }
  e.echoQueue=e.echoQueue.filter(echo=>echo.delay>0||echo.elapsed<echo.snapshot.duration);return true;
 }
 function gate(e,id){
  cleanup(e);e.y=e.baseY;e.walkSpeed=0;e.inv=0;
  if(id==='transform'){e.mode='transform';phase(e,'transform',0);e.poseIndex=5;}
  else if(id==='rescue'){e.mode='finisher';phase(e,'finisher',0);e.poseIndex=4;}
  else{
   e.mode='drain';e.drainDamage=0;e.drainThreshold=HannahRules.drainThreshold(momoStats().damage);e.drainRemaining=HannahRules.tuning.drain.duration;
   phase(e,'drain',e.drainRemaining);e.poseIndex=5;
  }
  sync(e);notify('onGate',e,id);
 }
 function observe(e){
  if(!live(e)||e.mode!=='combat')return false;
  const spec=e.stage===1?HannahRules.tuning.phase1:HannahRules.tuning.phase2,next=spec.gates[e.gateIndex];
  if(!next||!Number.isFinite(e.hp)||e.hp>e.maxHp*next.ratio)return false;
  e.hp=e.maxHp*next.ratio;e.gateIndex++;gate(e,next.id);return true;
 }
 function beginPhase2(e){
  if(!current(e)||e.mode!=='transform')return false;cleanup(e);
  Object.assign(e,{stage:2,gateIndex:0,maxHp:HannahRules.tuning.phase2.maxHp,hp:HannahRules.tuning.phase2.maxHp,mode:'combat',active:true,cycles:0,inv:0,drainRemaining:0,walkSpeed:0});
  e.y=e.baseY;phase(e,'wait',.8);e.poseIndex=0;sync(e);return true;
 }
 function awaitFinisher(e){
  if(!current(e)||e.stage!==2)return false;cleanup(e);e.mode='finisher';e.active=true;e.inv=0;e.y=e.baseY;e.walkSpeed=0;phase(e,'finisher',0);e.poseIndex=4;sync(e);return true;
 }
 function fail(e){
  if(e.failurePending||!current(e))return false;cleanup(e);e.failurePending=true;e.active=false;e.mode='failed';e.y=e.baseY;phase(e,'failed',0);sync(e);notify('onFailure',e);return true;
 }
 function tickDrain(e,dt){
  const rules=HannahRules.tuning.drain,step=Math.min(dt,e.drainRemaining);
  e.haruHp=Math.max(0,e.haruHp-rules.haruPerSecond*step);e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.03*step);
  e.drainRemaining=Math.max(0,e.drainRemaining-dt);e.clock=e.drainRemaining;
  if(e.haruHp<=1e-9||e.drainRemaining<=1e-9){fail(e);return false;}return true;
 }
 function update(e,dt){
  if(state!=='play'||!current(e)||!validStep(dt)||e.failurePending)return;
  if(e.mode==='transform'||e.mode==='finisher')return;
  if(!inside(e)){if(e.active)fail(e);return;}
  if(!e.active){if(player.y+player.h<e.arena.y-200)return;e.active=true;}
  e.inv=Math.max(0,e.inv-dt);e.stun=Math.max(0,e.stun-dt);e.animTime+=dt;e.walkSpeed=0;
  if(e.mode==='drain'){tickDrain(e,dt);sync(e);return;}
  if(!tickEchoes(e,dt))return;
  e.clock-=dt;
  for(const point of e.summons)point.warning=Math.max(0,point.warning-dt);
  if(e.phase==='wait'){
   const dx=player.x+player.w/2-e.x-e.w/2;if(Math.abs(dx)>18)e.face=Math.sign(dx);
   if(Math.abs(dx)>185){const b=bounds(e),old=e.x;e.x=clamp(e.x+e.face*(e.stage===2?145:115)*dt,b.left,b.right);e.walkSpeed=(e.x-old)/dt;}
   e.poseIndex=Math.abs(e.walkSpeed)>1?1:0;if(e.clock<=0)tell(e);
  }else if(e.phase==='windup'){e.windup=Math.max(0,e.clock);if(e.clock<=0)release(e);}
  else if(e.phase==='strike'){
   const previous=e.attackElapsed;e.attackElapsed=Math.min(e.attackDuration,e.attackElapsed+dt);e.attackTime=Math.max(0,e.clock);
   const old=e.x,p=position(e.moveSnapshot,e.attackElapsed);e.x=p.x;e.y=p.y;e.walkSpeed=(e.x-old)/dt;
   if(!strike(e,e.moveSnapshot,previous,e.attackElapsed,e.strikeHits))return;
   if(e.clock<=0){e.y=e.baseY;e.attackBoxes=[];e.attackBox=null;phase(e,'recover',e.stage===2?.6:.85);e.poseIndex=4;}
  }else if(e.phase==='recover'&&e.clock<=0){phase(e,'wait',e.stage===2?.25:.4);e.poseIndex=0;}
  sync(e);
 }
 function hit(e,box,amount){
  if(!live(e)||!['combat','drain'].includes(e.mode)||e.inv>0||!box||!e.parts.some(part=>overlap(box,part)))return 0;
  const plan=HannahRules.planHit({stage:e.stage,hp:e.hp,gateIndex:e.gateIndex,draining:e.mode==='drain'},amount);if(!plan.ok)return 0;
  const before=e.hp;e.hp=plan.hp;e.gateIndex=plan.gateIndex;e.inv=.18;DevDamage.record('outgoing',e,before,e.hp);
  if(e.mode==='drain'){
   e.drainDamage+=plan.damage;
   if(e.drainDamage>=e.drainThreshold){e.mode='combat';e.drainRemaining=0;phase(e,'recover',.9);e.poseIndex=4;sync(e);}
  }else if(plan.gate)gate(e,plan.gate);
  return plan.damage;
 }
 function finishWithUltimate(e){
  if(!live(e)||e.mode!=='finisher'||e.stage!==2||e.gateIndex<3)return false;
  e.finishAuthorized=true;const before=e.hp;e.hp=0;DevDamage.record('outgoing',e,before,0);return defeat(e);
 }
 function defeat(e){
  if(!current(e)||!e.finishAuthorized||e.hp>0||e.defeatNotified)return false;
  cleanup(e);e.dead=true;e.active=false;e.defeatNotified=true;e.y=e.baseY;e.mode='dead';e.poseIndex=6;e.walkSpeed=0;phase(e,'dead',0);sync(e);
  owners.delete(e.encounterToken);notify('onDefeated',e);return true;
 }
 // The outer enemy loop must intercept owned supports before its generic path.
 function updateSupport(support,dt){
  if(!support?.hannahOwner)return false;
  if(state!=='play'||!validStep(dt)||support.dead||!enemies.includes(support))return true;
  const owner=owners.get(support.hannahOwner);
  if(!owner||!live(owner)||owner.mode!=='combat'||owner.stage!==1){support.dead=true;return true;}
  for(const key of ['stun','cd','contactCd','recovery','guardBreak','blockFlash','turnCooldown','edgePause'])support[key]=Math.max(0,(support[key]||0)-dt);
  support.attackTime=Math.max(0,support.attackTime-dt);if(support.attackTime>0)support.attackElapsed+=dt;support.walkSpeed=0;
  if(support.stun>0)return true;
  if(support.windup>0){
   support.windup=Math.max(0,support.windup-dt);if(support.windup>0)return true;
   const before=projectiles.length,victim=player;releaseEnemyAttack(support);
   for(let n=before;n<projectiles.length;n++)Object.assign(projectiles[n],{source:source(owner),hannahOwner:owner.encounterToken});
   if(player!==victim||!live(owner))return true;
   return true;
  }
  if(support.recovery>0||support.attackTime>0)return true;
  const dx=player.x+player.w/2-support.x-support.w/2;turnEnemy(support,Math.abs(dx)>18?Math.sign(dx):support.face);
  if(Math.abs(dx)<125&&support.cd<=0&&Math.abs(player.y+player.h-owner.arena.y)<180){
   if(Math.abs(dx)<18||Math.sign(dx)===support.face){support.windupDuration=support.kind==='shield'?.8:.55;support.windup=support.windupDuration;}
  }else if(Math.abs(dx)>70)moveEnemy(support,Math.sign(dx)*(support.kind==='shield'?70:105),dt);
  if(overlap(player,support)&&support.contactCd<=0){support.contactCd=1.1;damage(2,dx>0?1:-1,true);}
  return true;
 }
 return Object.freeze({is,create,reset,update,hit,defeat,source,clear,finishWithUltimate,current,observe,beginPhase2,awaitFinisher,updateSupport,parts:e=>e.parts||[]});
})();
