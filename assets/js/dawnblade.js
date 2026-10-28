/* One active-game clock for the story ultimate, independent of weapon style. */
'use strict';
const Dawnblade=(()=>{
 let cooldown=0,cast=null;
 const owned=()=>flags[3].includes(HannahRules.progress.awakening);
 const ready=()=>owned()||HannahEncounter.finisherReady();
 const casting=()=>!!cast;
 function resetPlayer(){cast=null;}
 function resetJourney(){cast=null;cooldown=0;}
 function awaken(){cooldown=0;cast=null;}
 function activate(){
  if(state!=='play'||!player||!ready()||HannahEncounter.cinematic()||cooldown>0||cast||player.stun>0||attack>0||dash>0)return false;
  const target=HannahEncounter.finisherTarget();
  cast={victim:player,map:level,face:player.face,elapsed:0,impact:false,target,token:target?.encounterToken};
  cooldown=HannahRules.tuning.ultimate.cooldown;
  attack=0;attackElapsed=0;attackHit=true;attackCooldown=Math.max(attackCooldown,1.1);
  player.vx=0;jumpBuffer=0;return true;
 }
 function update(dt){
  if(state!=='play'||!Number.isFinite(dt)||dt<=0)return;
  cooldown=Math.max(0,cooldown-dt);
  if(!cast)return;
  const current=cast;
  if(player!==current.victim||level!==current.map||player.hp<=0){cast=null;return;}
  current.elapsed+=dt;
  if(!current.impact&&current.elapsed>=.55){
   current.impact=true;
   // Recoil is the ability's cost, independent of armor and immunity frames.
   player.hp=HannahRules.recoil(player.hp);
   const target=current.target;
   if(target&&target.encounterToken===current.token&&HannahCombat.current(target)&&target.mode==='finisher')HannahCombat.finishWithUltimate(target);
   else{
    const hit={x:current.face>0?player.x+player.w/2:player.x+player.w/2-440,y:player.y-100,w:440,h:player.h+160};
    resolveMeleeHit({amount:HannahRules.ultimateDamage(momoStats().damage),hit,kind:'heavy'});
   }
   if(player!==current.victim||level!==current.map){cast=null;return;}
  }
  if(current.elapsed>=1.1)cast=null;
 }
 function hud(){
  const node=$('dawnbladeStatus');if(!node)return;
  node.hidden=!ready()||state==='menu';if(node.hidden)return;
  node.textContent=I18n.t('ability.dawnblade')+' · '+Bindings.read('ultimate').map(bindingKeyLabel).join(' / ')+' · '+(cooldown>0?I18n.format('ability.dawnblade.cooldown',[Math.ceil(cooldown)]):I18n.t('ability.dawnblade.ready'));
  node.title=I18n.t('ability.dawnblade.description');
 }
 const status=()=>({owned:owned(),cooldown,casting:!!cast,progress:cast?Math.min(1,cast.elapsed/1.1):0,face:cast?.face});
 return Object.freeze({owned,ready,casting,activate,update,resetPlayer,resetJourney,awaken,hud,status});
})();
