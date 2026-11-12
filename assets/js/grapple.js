/* Transient grapple ownership is reset with player initialization and location changes. */
'use strict';
const Grapple=(()=>{
 let pull=null,finishing=null,cooldown=0,age=0;
 const center=e=>({x:e.x+e.w/2,y:e.y+e.h/2});
 const tower=()=>typeof TowerMode!=='undefined'&&TowerMode.active;
 const owned=()=>tower()?TowerMode.hasRelic('grapple'):flags?.[0]?.includes('grapplingHook')===true;
 const playable=()=>state==='play'&&!Prologue.active&&!resolutionBlocked&&!Visuals.blocked&&!(typeof DuelMode!=='undefined'&&DuelMode.active);
 const terrain=()=>[...platforms,...level.gates.filter(g=>!gatePass(g))];
 function rebase(e){
  e.origin=e.x;e.baseY=e.y;e.patrolLeft=e.patrolRight=e.x;
  e.windup=e.attackTime=e.recovery=e.edgePause=e.turnCooldown=0;e.walkSpeed=0;
  e.face=e.patrolFace=Math.sign(player.x+player.w/2-e.x-e.w/2)||e.face;
 }
 function stop(){if(pull?.type==='enemy'){rebase(pull.body);pull.body.grappleFalling=true;}pull=null;}
 function cancel(){stop();finishing=null;}
 function clear(){stop();finishing=null;cooldown=0;age=0;}
 function selection(){return owned()&&player?GrappleRules.target(center(player),player.face,{terrain:terrain(),anchors:SkyDragonRaid.anchors(level.grappleAnchors||[]),enemies}):null;}
 function activate(){
  if(!playable()||!owned()||player.stun>0||Dawnblade.casting())return false;
  if(pull){stop();return true;}
  if(cooldown>0)return false;const target=selection();if(!target)return false;
  const body=target.type==='enemy'?enemies.find(e=>e.id===target.id):player;
  if(!body)return false;
  finishing=null;pull={map:level,id:target.id,type:target.type,body,owner:player,face:player.face,point:{x:target.x,y:target.y}};age=0;cooldown=2.5;
  if(target.type==='anchor'){dash=0;player.vx=player.vy=0;player.onGround=false;player.support=null;}
  else{body.stun=Math.max(body.stun||0,.2);body.windup=body.attackTime=body.recovery=0;}
  return true;
 }
 function move(body,to,dt){
  const next=GrappleRules.move(body,to,dt,terrain());if(!next){stop();return;}
  body.x=next.x;body.y=next.y;body.vx=body.vy=0;if(pull.type==='enemy')rebase(body);
  if(next.done){const reached=pull.type==='anchor'&&!next.blocked,id=pull.id;if(reached)finishing={owner:player,point:{...pull.point},left:.18,ttl:1.5};stop();if(reached)SkyDragonRaid.anchorReached(id);}
 }
 function update(dt){
  if(!playable()||!Number.isFinite(dt)||dt<=0)return;
  cooldown=Math.max(0,cooldown-dt);
  if(finishing){finishing.ttl-=dt;if(player.onGround)finishing.left-=dt;if(finishing.owner!==player||finishing.left<=0||finishing.ttl<=0)finishing=null;}
  if(!pull)return;
  if(pull.map!==level||pull.owner!==player||!owned()||player.stun>0||pull.type==='enemy'&&(!enemies.includes(pull.body)||!GrappleRules.pullable(pull.body))){stop();return;}
  age+=dt;if(age>2){stop();return;}
  if(pull.type==='enemy'){
   const body=pull.body;body.stun=Math.max(body.stun||0,dt+.1);body.walkSpeed=0;
   move(body,{x:player.x+player.w/2+pull.face*(player.w/2+body.w/2+8),y:player.y+player.h-body.h/2},dt);
  }
 }
 function movePlayer(dt){
  if(!pull||pull.type!=='anchor'||!playable())return false;
  player.onGround=false;player.support=null;if(age>=.16)move(player,pull.point,dt);return true;
 }
 const pullingPlayer=()=>!!pull&&pull.type==='anchor';
 function moveEnemy(e,dt){
  if(pull?.body===e&&pull.type==='enemy')return true;
  if(!e.grappleFalling)return false;
  const before=e.y+e.h;e.vy=Math.min(980,(e.vy||0)+1550*dt);e.y+=e.vy*dt;
  const floor=platforms.find(p=>!p.broken&&e.x+e.w>p.x&&e.x<p.x+p.w&&before<=p.y+3&&e.y+e.h>=p.y);
  if(floor){
   e.x=clamp(e.x,floor.x+4,Math.max(floor.x+4,floor.x+floor.w-e.w-4));
   e.y=floor.y-e.h-(e.kind==='fly'?30:0);rebase(e);e.supportId=floor.id;e.vy=0;e.grappleFalling=false;
   e.patrolLeft=Math.max(floor.x+4,e.x-(e.patrol||80));e.patrolRight=Math.max(e.patrolLeft,Math.min(floor.x+floor.w-e.w-4,e.x+(e.patrol||80)));
  }
  else if(e.y>level.height+180){e.hp=0;e.grappleFalling=false;killEnemy(e);}
  return true;
 }
 const snapshot=()=>pull?{type:pull.type,point:pull.type==='enemy'?center(pull.body):{...pull.point},age,pose:age<.08?0:age<.16?1:2}:finishing?{type:'anchor',point:{...finishing.point},age,pose:player.onGround?3:2}:null;
 return Object.freeze({owned,selection,activate,cancel,clear,update,movePlayer,moveEnemy,pullingPlayer,snapshot});
})();
