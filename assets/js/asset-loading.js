/* Scene-sized prewarming plus render-discovered dependencies; no save state. */
'use strict';
const AssetLoading=(()=>{
 const list=value=>value.split(/\s+/).filter(Boolean);
 const combat=list('terrain props momoSlash momoHeavy fxSlashes fxImpact fxFissure fxDarkMagic fxEmber levelUp relics inventoryStarterWeapons cultCaveWall');
 const weapon=style=>style==='naginata'?list('momoNaginataNormal momoNaginataHeavy naginataRigid'):style==='swordShield'?list('momoShieldNormal momoShieldHeavy swordRigid'):style==='foxfireKatana'?list('momoFoxfireNormal momoFoxfireHeavy'):[];
 const japanActors=list('japanGuard japanArcher japanShield japanMage'),shadowActors=list('shadowGuard shadowArcher shadowMage shadowShield'),heavenActors=list('heavenWalk heavenAttack');
 const fia=list('fiaKitsune fiaFox fiaFoxDead fiaArenaCasting fiaArenaYield fiaArenaWalk fiaTeleport fiaFoxfire fiaDrain fiaCharm kibaShield fiaJourneyItems'),residents=list('fiaDenResidents denNinja denThief fiaRitualAttendants');
 const actors={arenaCaptain:['arenaCaptain'],arenaSerpent:['arenaSerpent'],arenaCyclops:['arenaCyclops'],arenaFia:fia,
  dungeonCaptain:['dungeonCaptain'],dungeonCouncil:['dungeonCouncil'],dungeonNecromancer:['dungeonNecromancer','japanRaised'],cultTempleGuard:['cultTempleGuard'],woundedAngel:['cultWoundedAngel','holyArrow'],cultHighPriestess:['cultHighPriestess'],
  campMaster:['campMaster','campMasterJump'],voidGatekeeper:['voidGatekeeper'],prisonWarden:['prisonWarden'],prisonHunter:['prisonHunter'],fiaVengeance:fia,hannah:list('hannahWalk hannahCombo hannahJump hannahRitual'),slayer:list('slayerMelee slayerRanged slayerDaisy slayerLightning')};
 // Every painting, hidden sector, NPC and future combat pose owned by a map is
 // required at entry. Camera position and a boss's current phase never narrow it.
 const maps={
  ninjaWatchtower:list('watchtowerBackdrop balloonSkyBackdrop balloonVehicle watchtowerJailerArt watchtowerSentinelArt westheruArt ninjaCrossbow ninjaShuriken ninjaNinjutsu ninjaAssassin prisonKey'),
  balloonJourney:list('balloonSkyBackdrop balloonVehicle giantWaspArt skyDragonArt westheruArt'),
  skyLanding:list('balloonSkyBackdrop stormIslandsBackdrop balloonVehicle westheruArt westheruSealArt'),
  stormIslands:list('stormIslandsBackdrop balloonVehicle westheruArt ninjaCrossbow ninjaShuriken ninjaNinjutsu ninjaAssassin shadowGuard shadowArcher shadowMage'),
  floatingIslands:list('islandsArrivalBackdrop islandsRouteBackdrop islandsWatchtowerBackdrop ninjaCrossbow ninjaShuriken ninjaNinjutsu ninjaAssassin ninjaLeader momoHook grapplingHook haruFollow'),
  japan:list('japanBackdrop japanClouds japanGuard japanArcher japanShield japanMage samurai samuraiJump bosses oldAngel oldCultist angelRuinBackdrop cultCaveBackdrop angelRuinWall cultCaveWall cultRuinedGate whiteSerpent whiteSerpentBackdrop serpentRelics campSupplies oathbreakerSoul'),
  yomi:list('yomiBackdrop yomiWalk yomiAttack lavaSerpent serpentScale fxLava bosses councilGateClosed councilGateOpen councilKey akash slayerMelee slayerRanged slayerDaisy slayerLightning slayerArena slayerGravestone slayerBarrel slayerCrossbow yomiGuardianSoul'),
  heaven:list('heavenBackdrop heavenDarkBackdrop heavenEclipseBackdrop heavenWalk heavenAttack angelLight angelDark angelEclipse holyArrow holyLance bosses wingedSerpent wingedSerpentBackdrop serpentRelics haruElder seraphSoul eclipseRelic'),
  shadowRealm:list('shadowCultBackdrop shadowAltar shadowMadPriest shadowCultJailer shadowMadOrganist madPriestSoul corruptedHymn prisonKey'),
  forestCamp:list('campBackdrop campHDLeft campHDCenter campHDRight campCedar campDaichi campNatsu campSora campSpecialists akash zenPriestess slayerDaisy compass minimap roastMeat tea coin phoneCase campSupplies'),
  samuraiCamp:list('samuraiCampBackdrop samuraiCampHDWest samuraiCampHDCenter samuraiCampHDEast campTerrain campSpecialists campMaster campMasterJump campMasterSoul'),
  forgeInterior:list('forgeBackdrop campSpecialists'),herbalHut:list('herbalBackdrop campSpecialists campSupplies'),mysticTent:list('mysticBackdrop campSpecialists serpentRelics'),
  councilHall:list('councilHall councilGateOpen councilGateClosed dungeonProps'),
  shadowPrison:list('zenPrisonWest zenPrisonCenter zenPrisonEast prisonTerrain prisonUndead prisonWarden zenPriestess prisonHunter fiaPrisonDepths fiaKitsune fiaFox fiaFoxDead'),
  shadowDen:[...list('fiaDenWest fiaDenEast'),...fia,...residents],
  shadowArena:[...list('arenaWest arenaCenter arenaEast arenaMinions arenaCaptain arenaSerpent arenaCyclops arenaScale'),...fia],
  fiaChambers:[...list('fiaChambersBackdrop'),...fia],
  yomiDungeon1:list('dungeonCourtyardWest dungeonCourtyardCenter dungeonCourtyardEast dungeonCaptain dungeonProps dungeonItems'),
  yomiDungeon2:list('dungeonCrypt dungeonNecromancer japanRaised dungeonProps dungeonItems'),
  yomiDungeon3:list('dungeonThrones dungeonCouncil dungeonProps dungeonItems'),
  cultDungeon1:list('cultDungeonForecourt cultTempleGuard dungeonProps cultDungeonItems'),
  cultDungeon2:list('cultDungeonHall cultWoundedAngel holyArrow dungeonProps cultDungeonItems'),
  cultDungeon3:list('cultDungeonSanctum cultHighPriestess dungeonProps cultDungeonItems'),
  zigguratDepths:list('descentBackdrop haruFollow voidGatekeeper voidKeepers yomiWalk yomiAttack'),japanHeights:list('japanHeightsBackdrop haruFollow'),
  zigguratApproach:list('zigguratApproach'),zigguratInterior:list('zigguratInterior haruFollow'),
  zigguratSummit:[...list('zigguratThrone zigguratStorm haruFollow hannahWalk hannahCombo hannahJump hannahRitual haruElder haruBindingPillar momoDawnblade slayerLightning demonLordSoulArt demonLordHeartArt'),...fia],
  dragonCatacombs:list('dragonRaidHall dragonIdle dragonBreath dragonFlight dragonFront dragonStagger haruBindingPillar dragonItems'),
  fiaRitual:[...list('fiaRitualBackdrop fiaRitual fiaRitualPowers fiaRitualChains fiaAttendantSpirits fiaJourneyItems demonLordHeartArt dragonItems rawVoidCrystal foxfireKatanaArt'),...fia,...residents],
  shadowUnderworld:[...list('shadowUnderworldBackdrop campTerrain underworldServices fiaUnderworldCorrupted arenaCyclops'),...residents],
  voidForbidden:list('voidForbiddenBackdrop voidKeepers voidLieutenant voidDemon rawVoidCrystal')
 };
 const backgrounds={ninjaWatchtower:'watchtowerBackdrop',balloonJourney:'balloonSkyBackdrop',skyLanding:'balloonSkyBackdrop',stormIslands:'stormIslandsBackdrop',floatingIslands:"islandsArrivalBackdrop",zigguratDepths:'descentBackdrop',japanHeights:'japanHeightsBackdrop',japan:'japanBackdrop',yomi:'yomiBackdrop',heaven:'heavenBackdrop',shadowRealm:'shadowCultBackdrop',forestCamp:'campHDCenter',samuraiCamp:'samuraiCampHDCenter',forgeInterior:'forgeBackdrop',herbalHut:'herbalBackdrop',mysticTent:'mysticBackdrop',councilHall:'councilHall',shadowPrison:'zenPrisonCenter',shadowDen:'fiaDenWest',shadowArena:'arenaCenter',fiaChambers:'fiaChambersBackdrop',yomiDungeon1:'dungeonCourtyardCenter',yomiDungeon2:'dungeonCrypt',yomiDungeon3:'dungeonThrones',cultDungeon1:'cultDungeonForecourt',cultDungeon2:'cultDungeonHall',cultDungeon3:'cultDungeonSanctum',zigguratApproach:'zigguratApproach',zigguratInterior:'zigguratInterior',zigguratSummit:'zigguratThrone',dragonCatacombs:'dragonRaidHall',fiaRitual:'fiaRitualBackdrop',shadowUnderworld:'shadowUnderworldBackdrop',voidForbidden:'voidForbiddenBackdrop'};
 let shown=false,focus=null,initialized=false,refreshQueued=false,backdrop=null;
 function prepare(){
  const duel=typeof DuelMode!=='undefined'&&DuelMode.active,menu=!duel&&(state==='menu'||state==='help'&&helpOrigin==='menu'),tower=!menu&&typeof TowerMode!=='undefined'&&TowerMode.active;
  let keys,mode=menu?'menu':duel?'duel':tower?'tower':'world';
  backdrop=menu?'japanBackdrop':duel?'japanBackdrop':tower?'towerBackdrop':backgrounds[level?.id]||['japanBackdrop','yomiBackdrop','heavenBackdrop','shadowCultBackdrop'][typeof realm==='number'?realm:0];
  if(menu)keys=['japanBackdrop','terrain','props'];
  else if(duel)keys=[...combat,...weapon('naginata'),...weapon('swordShield'),'japanBackdrop','yomiBackdrop','heavenBackdrop','shadowBackdrop'];
  else if(Prologue.active){mode='dream';backdrop='shadowBackdrop';keys=list('shadowBackdrop shadowIdle shadowMelee shadowCast shadowDevour fxDarkMagic fxSlashes fxImpact fxFissure momoHeavy momoSlash momoRoom dialogueShadow dialogueJapan props');}
  else{
   keys=[backdrop,...combat,...weapon(weaponStyle),...(maps[level?.id]||[])];
   // Tower rounds share a fixed pool; do not interrupt a new boss move or summon.
   if(tower)keys.push('towerBackdrop','prisonTerrain',...japanActors,...shadowActors,...heavenActors,'yomiWalk','yomiAttack',...enemies.filter(e=>e.towerBoss).flatMap(e=>TowerBossArt.assets(e)),...enemies.flatMap(e=>e.balloonWasp?['giantWaspArt']:e.shadowNinjaRole?[{crossbow:'ninjaCrossbow',shuriken:'ninjaShuriken',ninjutsu:'ninjaNinjutsu',assassin:'ninjaAssassin'}[e.shadowNinjaRole]]:[]));
   // Dungeon factions differ from their host realm. Summons and both sides of
   // the battle must be ready even when they enter from outside the camera.
   if(level?.dungeon)keys.push(...japanActors,...shadowActors,...heavenActors);
   else if(typeof realm==='number')keys.push(...(realm===0?japanActors:realm===1?['yomiWalk','yomiAttack']:realm===2?heavenActors:shadowActors));
   for(const e of enemies||[])keys.push(...(actors[e.miniboss]||[]));
   if(level?.id==='fiaRitual')keys.push('arenaCyclops');
   if(typeof flags!=='undefined'&&flags[3]?.includes('dawnblade'))keys.push('momoDawnblade');
   if(typeof flags!=='undefined'&&flags[3]?.includes('kibaShield'))keys.push('kibaShield');
   if(typeof flags!=='undefined'&&flags[0]?.includes('grapplingHook'))keys.push('momoHook','grapplingHook');
   // The scene may start its story, open a backpack, or expose existing loot.
   // These common UI/owned-item images are paid for once at scene entry.
   keys.push('dialogue'+['Japan','Yomi','Heaven','Shadow'][typeof realm==='number'?realm:0],'inventoryTravelBag','inventoryMomoPortrait','inventoryKatana','inventoryStarterWeapons','travelAtlas');
   if(typeof ART_INVENTORY!=='undefined'&&typeof Inventory!=='undefined')for(const [id,art]of Object.entries(ART_INVENTORY.items))if(Inventory.quantity(id)>0)keys.push(art.image);
  }
  keys.push('momoSheet','menuSheet');
  if(state==='dialog')keys.push('dialogue'+(Prologue.active?'Shadow':['Japan','Yomi','Heaven','Shadow'][realm]));
  if(state==='inventory')keys.push('inventoryTravelBag');if(state==='map')keys.push('travelAtlas');
  // UI state, camera position, dead actors and later reinforcements do not
  // replace the map's required set or discard pending scene requests.
  const changed=Visuals.scope([mode,level?.id,weaponStyle].join(':'),keys);
  if(changed)renderPanel();
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
  const blocked=Visuals.blocked,failed=blocked&&Visuals.failures.length>0,panel=$('assetLoading');
  panel.hidden=!blocked;
  if(failed)panel.dataset.failed='true';else delete panel.dataset.failed;
  const percent=Visuals.total?Math.min(100,Math.max(0,Math.floor(Visuals.loaded/Visuals.total*100))):0;
  $('assetLoadingFill').style.width=percent+'%';$('assetLoadingPercent').textContent=percent+'%';
  $('assetLoadingProgress').setAttribute('aria-valuenow',String(percent));
  $('assetLoadingText').textContent=failed?I18n.t('loading.failed'):I18n.format('loading.progress',[Visuals.loaded,Visuals.total]);
  $('assetRetry').hidden=!failed;$('assetBack').hidden=!failed;
  $('assetRetry').textContent=I18n.t('loading.retry');$('assetBack').textContent=I18n.t('weapon.choose.back');
  // Ordinary progress never steals focus. Only failed loads expose a focus trap.
  if(failed&&!shown&&!resolutionBlocked){focus=document.activeElement;$('assetLoadingText').focus();}
  if(!failed&&shown&&!resolutionBlocked){
   if(focus?.isConnected&&!focus.disabled&&!focus.closest?.('[hidden],[inert]'))focus.focus();
   else if(state==='dialog')$('dialogOk').focus();else if(state==='inventory')$('closeInventory').focus();else if(state==='shop')$('closeShop').focus();else{canvas.tabIndex=-1;canvas.focus();}
   focus=null;
  }shown=failed&&!resolutionBlocked;
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
   if(name==='keydown'&&typeof Fullscreen!=='undefined'&&Bindings.shortcut('fullscreen',event))return;
   // A tower loading failure can still be left through the same safe exit
   // confirmation. Its own keyboard trap handles this higher modal.
   if(!$('towerExitConfirm').hidden&&event.target?.closest?.('#towerExitConfirm'))return;
   const allowed=event.target?.closest?.('#assetLoading');
   if(!allowed){event.preventDefault();event.stopImmediatePropagation();keys.clear();pressed.clear();}
   else if(name==='keydown'&&event.key==='Tab'){
    const controls=[$('assetRetry'),$('assetBack')].filter(node=>!node.hidden),index=controls.indexOf(document.activeElement);
    event.preventDefault();if(controls.length)controls[(index+(event.shiftKey?-1:1)+controls.length)%controls.length].focus();
   }
  },true);
 }
 return Object.freeze({prepare,render,init});
})();
