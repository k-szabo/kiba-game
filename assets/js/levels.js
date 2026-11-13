/* Three deliberately different routes: an expedition, a descent, an ascent. */
'use strict';
// Shared progression rules also load before the standalone save validator.
const PROGRESSION_RULES=Object.freeze({
 levelLimit:50,statLimit:12,statLimitFor:key=>key==='spirit'?7:key==='shield'?12:Number.MAX_SAFE_INTEGER,
 xpForLevel:n=>60+(n-1)*35,
 progressForXP(totalXp,limit=this.levelLimit){
  let xp=totalXp,level=1;
  while(level<limit&&xp>=this.xpForLevel(level)){xp-=this.xpForLevel(level);level++;}
  return {level,xp:level===limit?0:xp};
 }
});
const KIBA_SHIELD_RULES=Object.freeze({capacity:2,recharge:12,capacityStep:.25,rechargeStep:.5});
const ZEN_PURIFICATION_POINTS=2;
// Sale prices and unique-item realms are shared with strict save validation.
const MERCHANT_SALES=Object.freeze(Object.fromEntries(Object.entries({
 roastMeat:{price:4,stack:true},tea:{price:10,stack:true},
 dungeonSeal:{price:50,stack:true},sectSeal:{price:50,stack:true},ninjaCampSpoils:{price:65,stack:true},weaponEnhancement:{price:20,stack:true},armorEnhancement:{price:20,stack:true},spiritEnhancement:{price:20,stack:true},councilSoul:{price:350,realm:1},highPriestessSoul:{price:400,realm:0},ninjaClanLeaderSoul:{price:450,realm:0},
 compass:{price:90,realm:1},minimap:{price:140,realm:1},phoneCase:{price:50,realm:1},
 campMasterSoul:{price:200,realm:0},oathbreakerSoul:{price:200,realm:0},yomiGuardianSoul:{price:300,realm:1},
 seraphSoul:{price:500,realm:2},madPriestSoul:{price:600,realm:3},demonLordSoul:{price:800,realm:3},arenaSerpentScale:{price:80,realm:3},
 daisyPlush:{price:120,realm:1},slayerCrossbow:{price:300,realm:1}
}).map(([id,product])=>[id,Object.freeze(product)])));
// Earned reward flags, rather than held items or replayable encounters, own
// the permanent bonus-point budget. Shared with the standalone save validator.
const BOSS_REWARDS=Object.freeze([
 Object.freeze({id:'oathbreakerSoul',claim:'bossRewardClaimed',xp:250,points:1}),
 Object.freeze({id:'yomiGuardianSoul',claim:'bossRewardClaimed',xp:400,points:1}),
 Object.freeze({id:'seraphSoul',claim:'bossRewardClaimed',xp:600,points:1}),
 Object.freeze({id:'madPriestSoul',claim:'bossRewardClaimed',xp:800,points:1})
]);
const DUNGEON_REWARDS=Object.freeze([
 Object.freeze({type:'dungeonCaptain',claim:'dungeonCaptainReward',stage:'dungeonStage1Clear',xp:300,coins:80,points:1}),
 Object.freeze({type:'dungeonNecromancer',claim:'dungeonNecromancerReward',stage:'dungeonStage2Clear',xp:450,coins:120,points:1}),
 Object.freeze({type:'dungeonCouncil',claim:'dungeonCouncilReward',stage:'dungeonStage3Clear',xp:650,coins:200,points:1,soul:'councilSoul'})
]);
const CULT_DUNGEON_REWARDS=Object.freeze([
 Object.freeze({type:'cultTempleGuard',claim:'sectGuardReward',stage:'sectStage1Clear',xp:350,coins:90,points:1}),
 Object.freeze({type:'woundedAngel',claim:'sectAngelReward',stage:'sectStage2Clear',xp:500,coins:130,points:1}),
 Object.freeze({type:'cultHighPriestess',claim:'sectPriestessReward',stage:'sectStage3Clear',xp:700,coins:220,points:1,soul:'highPriestessSoul'})
]);
function bossBonusPoints(worldFlags=[]){return StoryRaidRules.bonusPoints(worldFlags)+['skyDragonRaidFirstClear','skyDragonRaidRingTurnedIn'].reduce((sum,id)=>sum+(worldFlags?.[0]?.includes(id)?1:0),0)+(worldFlags?.[0]?.includes('ninjaSealPurified')?ZEN_PURIFICATION_POINTS:0)+(worldFlags?.[3]?.includes('zenHymnPurified')?ZEN_PURIFICATION_POINTS:0)+['dragonRaidFirstClear','fiaDragonCompleted','fiaVoidCompleted'].reduce((sum,id)=>sum+(worldFlags?.[3]?.includes(id)?1:0),0)+(worldFlags?.[3]?.includes('hannahDefeated')?1:0)+(worldFlags?.[3]?.includes('zigguratGateCleared')?1:0)+(worldFlags?.[3]?.includes('fiaRewardClaimed')?1:0)+BOSS_REWARDS.reduce((sum,reward,index)=>sum+(Array.isArray(worldFlags?.[index])&&worldFlags[index].includes(reward.claim)?reward.points:0),0)+[[1,DUNGEON_REWARDS],[0,CULT_DUNGEON_REWARDS],[0,NINJA_CLAN_REWARDS]].reduce((sum,[realm,rewards])=>sum+rewards.reduce((n,reward)=>n+(worldFlags?.[realm]?.includes(reward.claim)?reward.points:0),0),0);}
const LOCATION_MAP_IDS=Object.freeze([
 'japan','yomi','heaven','shadowRealm','councilHall','forestCamp','samuraiCamp','forgeInterior','herbalHut','mysticTent',
 'shadowPrison','shadowDen','shadowArena','fiaChambers','yomiDungeon1','yomiDungeon2','yomiDungeon3',
 'cultDungeon1','cultDungeon2','cultDungeon3','ninjaDungeon1','ninjaDungeon2','ninjaDungeon3',
 'zigguratDepths','japanHeights','zigguratApproach','zigguratInterior','zigguratSummit','dragonCatacombs',
 'fiaRitual','shadowUnderworld','voidForbidden','floatingIslands','ninjaWatchtower','balloonJourney','skyLanding',
 'stormIslands','ninjaClanCamp','thirdClanPath','thirdClanCave','storyRaidTier1','storyRaidTier2','storyRaidTier3'
]);
const MAPS=Object.freeze(Object.fromEntries(LOCATION_MAP_IDS.map(id=>[id,MapCatalog.build(id)])));
const {japan,yomi,heaven,shadowRealm,councilHall,forestCamp,samuraiCamp,forgeInterior,herbalHut,mysticTent,shadowPrison,shadowDen,shadowArena,fiaChambers,yomiDungeon1:dungeonCourtyard,yomiDungeon2:dungeonCrypt,yomiDungeon3:dungeonThrones,cultDungeon1:cultForecourt,cultDungeon2:cultHall,cultDungeon3:cultSanctum,zigguratDepths,japanHeights,zigguratApproach,zigguratInterior,zigguratSummit,dragonCatacombs,fiaRitual,shadowUnderworld,voidForbidden,floatingIslands,ninjaWatchtower,balloonJourney,skyLanding,stormIslands,ninjaClanCamp:ninjaCamp,thirdClanPath,thirdClanCave,storyRaidTier1,storyRaidTier2,storyRaidTier3}=MAPS;
const levels=[japan,yomi,heaven,shadowRealm];
const DUNGEON_FLOORS=Object.freeze([dungeonCourtyard,dungeonCrypt,dungeonThrones]);
const CULT_DUNGEON_FLOORS=Object.freeze([cultForecourt,cultHall,cultSanctum]);
const ninjaClanRules=DungeonRules.definitions.ninjaClan;
const NINJA_CLAN_REWARDS=Object.freeze(['ninjaClanLeader','ninjaClanSentinel','ninjaClanRitualist'].map((type,i)=>Object.freeze({type,stage:ninjaClanRules.stages[i],claim:ninjaClanRules.rewards[i],xp:[900,700,1100][i],coins:[250,200,350][i],points:1,...(i===0?{soul:ninjaClanRules.soul}:{})})));
const NINJA_CLAN_FLOORS=Object.freeze([MAPS.ninjaDungeon1,MAPS.ninjaDungeon2,MAPS.ninjaDungeon3]);
const storyRaidMaps=[MAPS.storyRaidTier1,MAPS.storyRaidTier2,MAPS.storyRaidTier3];
const ARENA_REWARDS=Object.freeze({arenaCaptain:Object.freeze({flag:'arenaRewardCaptain',xp:350}),arenaSerpent:Object.freeze({flag:'arenaRewardSerpent',xp:450,item:'arenaSerpentScale'}),arenaCyclops:Object.freeze({flag:'arenaRewardGuards',xp:600})});
const CULT_TRAVEL=Object.freeze({id:'cultTempleEntrance',...japan.cultPassage.ruinedGate,name:'cultDungeon.memory.title',travelOnly:true,dungeonEntrance:true,unlockFlag:'cultTempleDiscovered'});
const COUNCIL_TRAVEL=Object.freeze({id:'councilHallEntrance',x:yomi.councilGate.x,y:yomi.councilGate.y,name:'council.hall.name',location:'councilHall',travelOnly:true,dungeonEntrance:true,unlockFlag:'councilGateOpen'});
const DUNGEON_CATALOGUE=Object.freeze({
 yomiFall:Object.freeze({id:'yomiFall',realm:1,floors:DUNGEON_FLOORS,rewards:DUNGEON_REWARDS,entryMap:councilHall,entryPoint:councilHall.memoryScroll,name:'dungeon.name',title:'dungeon.scroll.title',intro:'dungeon.intro',victory:'dungeon.victory',prompt:'dungeon.scroll.prompt',returnPrompt:'dungeon.return'}),
 sectFall:Object.freeze({id:'sectFall',realm:0,floors:CULT_DUNGEON_FLOORS,rewards:CULT_DUNGEON_REWARDS,entryMap:japan,entryPoint:japan.cultPassage.ruinedGate,name:'cultDungeon.name',title:'cultDungeon.memory.title',intro:'cultDungeon.intro',victory:'cultDungeon.victory',prompt:'cultDungeon.enter',returnPrompt:'cultDungeon.return'}),
 ninjaClan:Object.freeze({id:'ninjaClan',realm:0,floors:NINJA_CLAN_FLOORS,rewards:NINJA_CLAN_REWARDS,entryMap:stormIslands,entryPoint:stormIslands.endPoint,
  entryLocation:'stormIslands',exitLocation:'ninjaClanCamp',title:'ninjaClan.name',prompt:'dungeon.next',returnPrompt:'dungeon.back'})
});
const SIDE_LOCATIONS=Object.freeze({
 ...Object.fromEntries(NINJA_CLAN_FLOORS.map((map,i)=>[map.id,Object.freeze({map,realm:0,requiredFlags:Object.freeze([
  ...ninjaClanRules.requiredFlags,ninjaClanRules.started,...ninjaClanRules.stages.slice(0,i)
 ])})])),
 ninjaClanCamp:Object.freeze({map:ninjaCamp,realm:0,requiredFlags:Object.freeze([ninjaClanRules.rewards[2]])}),
 thirdClanPath:Object.freeze({map:thirdClanPath,realm:0,requiredFlags:Object.freeze([ThirdClanRules.progress.accepted])}),
 thirdClanCave:Object.freeze({map:thirdClanCave,realm:0,requiredFlags:Object.freeze([ThirdClanRules.progress.accepted,...ThirdClanRules.progress.ballistae])}),
 ...Object.fromEntries(storyRaidMaps.map((map,tier)=>[map.id,Object.freeze({map,realm:0,requiredFlags:Object.freeze(
  tier?[StoryRaidRules.encounters[tier*3-1].clear]:[StoryRaidRules.started])})])),
 ninjaWatchtower:Object.freeze({map:ninjaWatchtower,realm:0,requiredFlags:Object.freeze(['islandsTrailReached'])}),
 balloonJourney:Object.freeze({map:balloonJourney,realm:0,requiredFlags:Object.freeze(['balloonJourneyStarted'])}),
 skyLanding:Object.freeze({map:skyLanding,realm:0,requiredFlags:Object.freeze(['balloonDragonDefeated'])}),
 stormIslands:Object.freeze({map:stormIslands,realm:0,requiredFlags:Object.freeze(['balloonVortexArrived'])}),
 floatingIslands:Object.freeze({map:floatingIslands,realm:0,flagRealm:3,requiredFlags:Object.freeze(['zigguratReturnCompleted'])}),
 zigguratDepths:Object.freeze({map:zigguratDepths,realm:3,requiredFlags:Object.freeze(['zigguratDescentAccepted'])}),
 japanHeights:Object.freeze({map:japanHeights,realm:0,flagRealm:3,requiredFlags:Object.freeze(['japanHeightsReached'])}),
 fiaRitual:Object.freeze({map:fiaRitual,realm:3,requiredFlags:Object.freeze(['fiaDragonCompleted'])}),
 shadowUnderworld:Object.freeze({map:shadowUnderworld,realm:3,requiredFlags:Object.freeze(['fiaVoidAccepted'])}),
 voidForbidden:Object.freeze({map:voidForbidden,realm:3,requiredFlags:Object.freeze(['fiaVoidAccepted'])}),
 dragonCatacombs:Object.freeze({map:dragonCatacombs,realm:3,requiredFlags:Object.freeze(['hannahDefeated'])}),
 zigguratApproach:Object.freeze({map:zigguratApproach,realm:3,requiredFlags:Object.freeze([])}),
 zigguratInterior:Object.freeze({map:zigguratInterior,realm:3,requiredFlags:Object.freeze([])}),
 zigguratSummit:Object.freeze({map:zigguratSummit,realm:3,requiredFlags:Object.freeze([])}),
 cultDungeon1:Object.freeze({map:cultForecourt,realm:0,requiredFlags:Object.freeze(['cultTempleDiscovered','guardian:oldCultist','sectRunStarted'])}),
 cultDungeon2:Object.freeze({map:cultHall,realm:0,requiredFlags:Object.freeze(['cultTempleDiscovered','guardian:oldCultist','sectRunStarted','sectStage1Clear'])}),
 cultDungeon3:Object.freeze({map:cultSanctum,realm:0,requiredFlags:Object.freeze(['cultTempleDiscovered','guardian:oldCultist','sectRunStarted','sectStage2Clear'])}),
 yomiDungeon1:Object.freeze({map:dungeonCourtyard,realm:1,requiredFlags:Object.freeze(['councilGateOpen','dungeonRunStarted'])}),
 yomiDungeon2:Object.freeze({map:dungeonCrypt,realm:1,requiredFlags:Object.freeze(['councilGateOpen','dungeonRunStarted','dungeonStage1Clear'])}),
 yomiDungeon3:Object.freeze({map:dungeonThrones,realm:1,requiredFlags:Object.freeze(['councilGateOpen','dungeonRunStarted','dungeonStage2Clear'])}),
 shadowArena:Object.freeze({map:shadowArena,realm:3,requiredFlags:Object.freeze(['fiaRescued','arenaQuestAccepted'])}),
 fiaChambers:Object.freeze({map:fiaChambers,realm:3,requiredFlags:Object.freeze(['fiaRescued','arenaChampion'])}),
 shadowPrison:Object.freeze({map:shadowPrison,realm:3,requiresRealmBoss:false,requiredFlags:Object.freeze(['prisonOpen'])}),
 shadowDen:Object.freeze({map:shadowDen,realm:3,requiredFlags:Object.freeze(['fiaRescued'])}),
 forestCamp:Object.freeze({map:forestCamp,realm:0,requiredFlags:Object.freeze([])}),
 samuraiCamp:Object.freeze({map:samuraiCamp,realm:0,requiredFlags:Object.freeze(['campQuestAccepted'])}),
 forgeInterior:Object.freeze({map:forgeInterior,realm:0,requiredFlags:Object.freeze(['smithRescued'])}),
 herbalHut:Object.freeze({map:herbalHut,realm:0,requiredFlags:Object.freeze(['herbalistRescued'])}),
 mysticTent:Object.freeze({map:mysticTent,realm:0,requiredFlags:Object.freeze(['enchanterRescued'])})
});
function sideLocationUnlocked(id,worldFlags=[],defeated=[]){
 if(typeof id!=='string'||!Object.hasOwn(SIDE_LOCATIONS,id))return false;
 const spec=SIDE_LOCATIONS[id],known=worldFlags?.[spec.flagRealm??spec.realm];
 return (spec.requiresRealmBoss===false||defeated?.[spec.realm]===true)&&Array.isArray(known)&&spec.requiredFlags.every(flag=>known.includes(flag));
}
function realmRests(n){return levels[n]?[...levels[n].rests,...(n===1?[COUNCIL_TRAVEL]:n===0?[CULT_TRAVEL]:[]),...Object.values(SIDE_LOCATIONS).filter(spec=>spec.realm===n).flatMap(spec=>[...spec.map.rests,...(spec.map.checkpoints||[])])]:[];}
for(const [index,map] of levels.entries())map.progressFlags=[...(map.progressFlags||[]),BOSS_REWARDS[index].id,BOSS_REWARDS[index].claim];

