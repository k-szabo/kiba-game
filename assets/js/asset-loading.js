/* Scene-sized prewarming plus render-discovered dependencies; no save state. */
'use strict';
const AssetLoading=(()=>{
 const combat=['terrain','props','momoSlash','momoHeavy','fxSlashes','fxImpact','fxFissure','fxDarkMagic','fxEmber','levelUp'];
 const weapon=style=>style==='naginata'?['momoNaginataNormal','momoNaginataHeavy','naginataRigid']:style==='swordShield'?['momoShieldNormal','momoShieldHeavy','swordRigid']:style==='foxfireKatana'?['momoFoxfireNormal','momoFoxfireHeavy']:[];
 const actors={arenaCaptain:['arenaCaptain'],arenaSerpent:['arenaSerpent'],arenaCyclops:['arenaCyclops'],arenaFia:['fiaArenaCasting','fiaArenaYield','fiaArenaWalk'],
  dungeonCaptain:['dungeonCaptain'],dungeonCouncil:['dungeonCouncil'],dungeonNecromancer:['dungeonNecromancer','japanRaised'],cultTempleGuard:['cultTempleGuard'],woundedAngel:['cultWoundedAngel','holyArrow'],cultHighPriestess:['cultHighPriestess'],
  campMaster:['campMaster','campMasterJump'],prisonWarden:['prisonWarden'],prisonHunter:['prisonHunter'],fiaVengeance:['fiaArenaCasting','fiaArenaYield','fiaTeleport','fiaFoxfire','fiaDrain','fiaCharm'],hannah:['hannahWalk','hannahCombo','hannahJump','hannahRitual'],slayer:['slayerMelee','slayerRanged','slayerDaisy','slayerLightning']};
 let shown=false,focus=null,initialized=false,refreshQueued=false;
 function prepare(){
  const duel=typeof DuelMode!=='undefined'&&DuelMode.active,menu=!duel&&(state==='menu'||state==='help'&&helpOrigin==='menu');
  let keys,mode=menu?'menu':duel?'duel':'world';
  if(menu)keys=['japanBackdrop','terrain','props'];
  else if(duel)keys=[...combat,...weapon('naginata'),...weapon('swordShield'),'japanBackdrop','yomiBackdrop','heavenBackdrop','shadowBackdrop'];
  else if(Prologue.active){mode='dream';keys=['shadowBackdrop','shadowIdle','shadowMelee','shadowCast','shadowDevour','fxDarkMagic','fxSlashes','momoHeavy','momoSlash','props'];}
  else{
   keys=[...combat,...weapon(weaponStyle)];
   // Warm the animation states of actors already materialized in this scene.
   for(const e of enemies||[]){keys.push(...(actors[e.miniboss]||[]));if(e.ritual)keys.push('fiaRitual','fiaRitualPowers','fiaRitualChains','fiaAttendantSpirits');}
   if(level?.dragonRaid)keys.push('dragonIdle','dragonBreath','dragonFlight','dragonFront','dragonStagger');
   if(level?.id==='zigguratSummit')keys.push('hannahWalk','hannahCombo','hannahJump','hannahRitual','zigguratThrone','zigguratStorm','haruElder','haruBindingPillar','momoDawnblade');
   if(realm===0)keys.push('japanGuard','japanArcher','japanShield','japanMage','samurai','samuraiJump','bosses');
   else if(realm===1)keys.push('yomiWalk','yomiAttack','lavaSerpent');
   else if(realm===2)keys.push('heavenWalk','heavenAttack','angelLight','angelDark','angelEclipse','holyArrow','holyLance');
   else keys.push('shadowGuard','shadowArcher','shadowMage','shadowShield');
  }
  keys.push('momoSheet','menuSheet');
  if(state==='dialog')keys.push('dialogue'+(Prologue.active?'Shadow':['Japan','Yomi','Heaven','Shadow'][realm]));
  if(state==='inventory')keys.push('inventoryTravelBag');if(state==='map')keys.push('travelAtlas');
  const changed=Visuals.scope([mode,level?.id,state,weaponStyle,(enemies||[]).map(e=>e.miniboss||'').join(',')].join(':'),keys);
  // Panels render before the next animation frame. Register their artwork again
  // after replacing the old scene's demand set so portraits/icons remain required.
  if(changed)renderPanel();
  // Only a reachable, nearby next realm gets speculative background prefetch.
  if(mode==='world'&&state==='play'&&!Visuals.blocked&&level===levels[realm]&&level.exit&&defeated[realm]&&realm<3&&Math.abs(player.x-level.exit.x)<900)Visuals.prefetch([['yomiBackdrop','heavenBackdrop','shadowCultBackdrop'][realm]]);

 }
 function renderPanel(){if(state==='dialog')Dialogue.render();else if(state==='inventory')Inventory.render();else if(state==='shop')Merchant.render();}
 function refresh(){
  if(!initialized||refreshQueued)return;refreshQueued=true;
  // A synchronous image cache hit can arrive inside a panel render. Coalesce
  // completion redraws after that render has finished instead of re-entering it.
  Promise.resolve().then(()=>{refreshQueued=false;renderPanel();});
 }
 function render(){
  if(!initialized)return;
  const blocked=Visuals.blocked,failed=Visuals.failures.length>0,panel=$('assetLoading');
  panel.hidden=!blocked;
  $('assetLoadingText').textContent=failed?I18n.t('loading.failed'):I18n.format('loading.progress',[Visuals.loaded,Visuals.total]);
  $('assetRetry').hidden=!failed;$('assetRetry').textContent=I18n.t('loading.retry');$('assetBack').textContent=I18n.t('weapon.choose.back');
  if(blocked&&!shown&&!resolutionBlocked){focus=document.activeElement;$('assetLoadingText').focus();}
  if(!blocked&&shown&&!resolutionBlocked){
   if(focus?.isConnected&&!focus.disabled&&!focus.closest?.('[hidden],[inert]'))focus.focus();
   else if(state==='dialog')$('dialogOk').focus();else if(state==='inventory')$('closeInventory').focus();else if(state==='shop')$('closeShop').focus();else{canvas.tabIndex=-1;canvas.focus();}
  }shown=blocked&&!resolutionBlocked;
 }
 function init(){
  initialized=true;
  // CSS artwork uses the same immutable content URL as the verified image loader.
  const sheet=document.createElement('style'),rules=[['.dialogue-scroll','dialogueJapan'],['#dialog[data-theme=yomi] .dialogue-scroll','dialogueYomi'],['#dialog[data-theme=heaven] .dialogue-scroll','dialogueHeaven'],['#dialog[data-theme=shadow] .dialogue-scroll','dialogueShadow'],['.inventory-bag','inventoryTravelBag'],['.atlas-painting','travelAtlas']];
  sheet.textContent=rules.map(([selector,key])=>{const path=ART_MANIFEST[key],hash=typeof IMAGE_REVISIONS==='object'?IMAGE_REVISIONS[path]:null;return selector+'{background-image:url('+JSON.stringify(path+(hash?'?v='+hash:''))+')}';}).join('\n');document.head?.append(sheet);
  $('assetRetry').onclick=()=>Visuals.retry();$('assetBack').onclick=()=>{mainMenu();prepare();render();};
  Visuals.onLoad(refresh);I18n.onChange(render);
  // Suppress inputs before gameplay/rebinding handlers while a required image is absent.
  for(const name of ['keydown','keyup','mousedown','mouseup','click','contextmenu'])addEventListener(name,event=>{
   if(!Visuals.blocked||resolutionBlocked)return;
   const allowed=event.target?.closest?.('#assetLoading');
   if(!allowed){event.preventDefault();event.stopImmediatePropagation();keys.clear();pressed.clear();}
   else if(name==='keydown'&&event.key==='Tab'){
    const controls=[$('assetRetry'),$('assetBack')].filter(node=>!node.hidden),index=controls.indexOf(document.activeElement);
    event.preventDefault();controls[(index+(event.shiftKey?-1:1)+controls.length)%controls.length].focus();
   }
  },true);
 }
 return Object.freeze({prepare,render,init});
})();
