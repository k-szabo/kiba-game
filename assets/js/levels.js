/* Three deliberately different routes: an expedition, a descent, an ascent. */
'use strict';
// Shared progression rules also load before the standalone save validator.
const PROGRESSION_RULES=Object.freeze({levelLimit:30,statLimit:12,xpForLevel:n=>60+(n-1)*35});
// Sale prices and unique-item realms are shared with strict save validation.
const MERCHANT_SALES=Object.freeze(Object.fromEntries(Object.entries({
 roastMeat:{price:4,stack:true},tea:{price:10,stack:true},
 compass:{price:90,realm:1},minimap:{price:140,realm:1},phoneCase:{price:50,realm:1},
 oathbreakerSoul:{price:200,realm:0},yomiGuardianSoul:{price:300,realm:1},
 seraphSoul:{price:500,realm:2},madPriestSoul:{price:600,realm:3},
 serpentScale:{price:150,realm:1},daisyPlush:{price:120,realm:1},slayerCrossbow:{price:300,realm:1}
}).map(([id,product])=>[id,Object.freeze(product)])));
// Earned reward flags, rather than held items or replayable encounters, own
// the permanent bonus-point budget. Shared with the standalone save validator.
const BOSS_REWARDS=Object.freeze([
 Object.freeze({id:'oathbreakerSoul',claim:'bossRewardClaimed',xp:250,points:1}),
 Object.freeze({id:'yomiGuardianSoul',claim:'bossRewardClaimed',xp:400,points:1}),
 Object.freeze({id:'seraphSoul',claim:'bossRewardClaimed',xp:600,points:1}),
 Object.freeze({id:'madPriestSoul',claim:'bossRewardClaimed',xp:800,points:1})
]);
function bossBonusPoints(worldFlags=[]){return BOSS_REWARDS.reduce((sum,reward,index)=>sum+(Array.isArray(worldFlags?.[index])&&worldFlags[index].includes(reward.claim)?reward.points:0),0);}
function makeLevel(id,width,height,start){return{id,width,height,start,platforms:[],rests:[],objects:[],gates:[],winds:[],hazards:[],enemies:[],zones:[]};}
function ledge(l,id,x,y,w,kind='stone',h=28){l.platforms.push({id,x,y,w,h,kind,drop:kind!=='ground',baseX:x});}
function rest(l,id,x,y,name){l.rests.push({id,x,y,name});}
function foe(l,id,x,y,kind='guard',group=null,patrol=65){l.enemies.push({id,x,y,kind,group,patrol});}
function zone(l,name,x,y,w,h){l.zones.push({name,x,y,w,h});}
const japan=makeLevel('japan',10400,3100,{x:260,y:1000});
japan.top=-1100; // The optional angel tower rises above the ordinary camera range.
[[0,1000,1550],[1680,950,1640],[3400,1000,1500],[5100,920,1400],[6740,960,1160],[8150,1000,2250]].forEach((p,i)=>ledge(japan,'road'+i,...p,'ground',190));
[
 ['wind-step',1980,855,150],['wind-roof',2160,760,370],
 ['forest-step',3900,905,180],['forest-mid',4090,810,180],['forest-bell',4300,715,260],
 ['river-bridge',4820,835,200],
 ['rice-bridge',6530,850,190],['village-step',6720,855,155],['village-mid',6930,790,170],['village-bell',7100,715,290],
 ['bamboo-bridge',7900,840,180],
 ['river-cave',4850,1390,1550],['cave-exit1',6220,1290,160],['cave-exit2',6400,1190,160],['cave-exit3',6580,1090,160],
 ['forest-secret1',3550,800,200],['forest-secret2',3720,620,230]
].forEach(p=>ledge(japan,...p));
japan.ability={x:2340,y:760,name:I18n.t("text.blessing.of.the.wind")};
rest(japan,'start',330,1000,I18n.t("text.village.outskirts"));rest(japan,'river',3650,1000,I18n.t("text.the.forked.path"));rest(japan,'fields',5880,920,I18n.t("text.rice.fields"));rest(japan,'temple',8760,1000,I18n.t('place.temple.gate'));
japan.objects=[{id:'forestBell',type:'bell',x:4420,y:715,name:I18n.t('place.forest.bell')},{id:'villageBell',type:'bell',x:7240,y:715,name:I18n.t('place.village.bell')},{id:'riverMemory',type:'memory',x:5550,y:1390,name:I18n.t("text.a.memory.beneath.the.river")},{id:'forestMemory',type:'memory',x:3830,y:620,name:I18n.t("text.a.memory.in.the.canopy")}];
// Optional paths lie outside the quest route and remain absent from the map until discovered.
japan.secrets=[
 {id:'angelRuin',name:I18n.t("text.ruins.of.the.ancient.angel.tower"),x:2440,y:-1000,w:1240,h:1550,arena:{x:2510,y:-690,w:510},guardian:'oldAngel',relic:'angelHalo'},
 {id:'cultCave',name:I18n.t("text.cave.of.the.forgotten.cult"),x:800,y:1740,w:3330,h:1320,arena:{x:2650,y:2160,w:950},guardian:'oldCultist',relic:'demonHorn'}
];
for(const p of [
 ['tower-step1',3490,445,140],['tower-step2',3250,285,120],['tower-step3',3030,230,130],
 ['tower-step4',2810,80,150],['tower-step5',3000,-80,150],['tower-step6',2780,-240,150],
 ['tower-step7',3010,-400,160],['tower-step8',2780,-560,160],['halo-altar',2510,-690,510]
]){ledge(japan,...p);japan.platforms.at(-1).secretArea='angelRuin';}
for(const p of [['cult-mouth',4530,1510,180],['cult-stair1',4200,1680,200],['cult-stair2',3910,1850,190],['cult-stair3',3640,2010,180],['horn-vault',2650,2160,950]]){ledge(japan,...p);japan.platforms.at(-1).secretArea='cultCave';}
// A later return with Spirit Dash reveals a short descent beyond the elder's
// west wall. Every step is usable in both directions with the double jump.
for(const p of [
 ['cult-passage-forecourt',2485,2160,165],['cult-passage-landing',2150,2160,270],
 ['cult-passage-step1',1810,2310,260],['cult-passage-step2',1480,2460,250],
 ['cult-passage-temple',900,2620,650]
]){ledge(japan,...p);japan.platforms.at(-1).secretArea='cultCave';}
japan.cultPassage={
 gateId:'cultWestWall',platformIds:['cult-passage-forecourt','cult-passage-landing','cult-passage-step1','cult-passage-step2','cult-passage-temple'],
 // The renderer's x is the artwork's horizontal centre; y is its foot line.
 ruinedGate:{x:1150,y:2620,w:480,h:365}
};
japan.objects.push(
 {id:'angelHalo',type:'relic',x:2600,y:-690,name:I18n.t("text.the.angel.s.halo"),secretArea:'angelRuin',guardian:'oldAngel'},
 {id:'demonHorn',type:'relic',x:2760,y:2160,name:I18n.t("text.the.demon.lord.s.horn"),secretArea:'cultCave',guardian:'oldCultist'}
);
foe(japan,'oldAngel',2800,-690,'mage',null,250);Object.assign(japan.enemies.at(-1),{miniboss:'angel',name:I18n.t("text.the.mad.elder.angel"),secretArea:'angelRuin',factionOverride:'heaven'});
foe(japan,'oldCultist',3070,2160,'mage',null,380);Object.assign(japan.enemies.at(-1),{miniboss:'cultist',name:I18n.t("text.the.ancient.cult.s.elder"),secretArea:'cultCave',factionOverride:'japan'});
japan.gates=[{id:'root',kind:'root',x:3100,y:745,w:65,h:205},{id:'templeOath',kind:'bells',x:8560,y:0,w:35,h:japan.height}];
// Cave ceiling and wall prevent falling straight into the relic chamber from the main road.
japan.gates.push(
 {id:'cultRoof',kind:'secretRock',x:2420,y:1740,w:1200,h:105,secretArea:'cultCave'},
 {id:'cultWestWall',kind:'shadow',requiresDash:true,x:2420,y:2000,w:65,h:160,secretArea:'cultCave'},
 {id:'cultWestWallUpper',kind:'secretRock',x:2420,y:1740,w:65,h:260,secretArea:'cultCave'},
 {id:'cultWestWallLower',kind:'secretRock',x:2420,y:2160,w:65,h:940,secretArea:'cultCave'},
 {id:'cultPassageRoof',kind:'secretRock',x:800,y:1740,w:1620,h:105,secretArea:'cultCave'},
 {id:'cultPassageWest',kind:'secretRock',x:800,y:1740,w:65,h:1360,secretArea:'cultCave'},
 {id:'cultPassageFoundation',kind:'secretRock',x:800,y:2820,w:1685,h:280,secretArea:'cultCave'},
 {id:'cultEastWall',kind:'secretRock',x:3620,y:1100,w:35,h:820,secretArea:'cultCave'},
 {id:'cultEntrance',kind:'fragile',x:4450,y:1000,w:55,h:japan.height-1000,secretArea:'cultCave'}
);
japan.arena={x:8770,y:1000,w:1550,restId:'temple'};japan.boss={x:9570,y:1000};japan.exit={x:10000,y:1000};
[[930,1000],[1900,950],[2820,950],[3600,1000],[4140,1000],[4750,1000],[5450,920],[6200,920],[6930,960],[7550,960],[8390,1000]].forEach(([x,y],i)=>foe(japan,'road-'+i,x,y,i%4===2?'archer':'guard',null,Math.min(65,i===8?40:65)));
foe(japan,'cave-guard',5260,1390,'guard');foe(japan,'cave-bat',6010,1310,'fly');foe(japan,'tree-bat',3900,690,'fly');
zone(japan,I18n.t("text.forest.of.mist"),0,0,3300,1250);zone(japan,I18n.t('place.forest.bell'),3300,0,1600,1200);zone(japan,I18n.t("text.passage.beneath.the.river"),4800,1150,2200,550);zone(japan,I18n.t("text.river.and.rice.fields"),4800,0,2000,1150);zone(japan,I18n.t('place.quiet.village'),6800,0,1500,1150);zone(japan,I18n.t('place.bamboo.temple'),8300,0,2100,1200);

const yomi=makeLevel('yomi',3300,6250,{x:1560,y:450});
[
 ['entry',1170,450,980],['first-left',610,730,850],['first-right',1590,1030,1000],
 ['cage-left',350,1510,1150],['east-shelf',1640,1790,1050],['center-shelf',1110,2110,1000],
 ['ash-shrine',1220,2700,950],['west-fire',360,3040,1030],['east-river',1990,3400,900],
 ['cage-right',2050,3900,1050],['west-tomb',440,4230,1200],['deep-center',1110,4640,1050],
 ['last-ledge',1450,5040,1280],['bottom',220,5800,2860],
 ['rescue-left-stair',1510,1420,180],['river-lip',1800,3710,120],
 ['veil-approach',1600,3900,320],
 ['seal-return',1320,5180,300],
 ['secret-tomb',230,2350,600],['secret-step',680,2240,250]
].forEach(p=>ledge(yomi,...p,'stone',32));
yomi.ability={x:1570,y:2700,name:I18n.t("text.spirit.dash")};
rest(yomi,'start',1530,450,I18n.t("text.the.silent.well"));rest(yomi,'upper',1810,1790,I18n.t("text.ash.ledge"));rest(yomi,'lower',2470,3900,I18n.t("text.the.silent.river"));rest(yomi,'abyss',1860,5040,I18n.t("text.edge.of.the.abyss"));rest(yomi,'arena',620,5800,I18n.t("text.the.soul.s.depths"));
yomi.objects=[{id:'soulUpper',type:'rescue',group:'upperSoul',x:680,y:1510,name:I18n.t("text.the.remembering.soul")},{id:'soulLower',type:'rescue',group:'lowerSoul',x:2440,y:3900,name:I18n.t("text.the.homesick.soul")},{id:'tombMemory',type:'memory',x:510,y:2350,name:I18n.t("text.a.memory.in.the.tombs")}];
// The lower captive lives inside a closed rock chamber. A freestanding veil
// could be bypassed from east-river above, or by circling underneath it.
// Roof/floor overlap its ends and reach the world edge; only the western
// smoke opening admits Spirit Dash, including on later return visits.
yomi.gates=[
 {id:'shadowVeil',kind:'shadow',requiresDash:true,x:1920,y:3150,w:55,h:1060},
 {id:'lowerSoulRoof',kind:'secretRock',terrainBarrier:true,x:1920,y:3650,w:1380,h:64},
 {id:'lowerSoulFloor',kind:'secretRock',terrainBarrier:true,x:1920,y:4120,w:1380,h:90},
 {id:'abyssOath',kind:'souls',x:0,y:5300,w:3300,h:32}
];
yomi.hazards=[{x:520,y:3025,w:180,h:15},{x:2260,y:3385,w:150,h:15},{x:860,y:4215,w:160,h:15}];
yomi.progressFlags=['councilKeyEarned','councilGateOpen','serpentScale'];
yomi.progressFlags.push('akashRescued','compass','minimap','phoneCase');
// A deliberately unmapped upper annex. Keep the ordinary descent's map scale.
yomi.top=-2300;yomi.mapTop=0;
yomi.secrets=[{id:'slayerGrave',name:I18n.t('text.yomi.the.world.s.depths'),x:100,y:-2300,w:1500,h:680,
 arena:{x:100,y:-1700,w:1500},guardian:'doomSlayer',unmapped:true,silent:true}];
for(const p of [
 ['slayer-approach',850,450,320],['slayer-step1',820,250,270],['slayer-step2',470,50,270],
 ['slayer-step3',820,-150,270],['slayer-step4',470,-350,270],['slayer-step5',820,-550,270],
 ['slayer-step6',470,-750,270],['slayer-step7',820,-950,270],['slayer-step8',470,-1150,270],
 ['slayer-step9',820,-1350,270],['slayer-step10',470,-1550,270],['slayer-arena',100,-1700,1500]
]){ledge(yomi,...p,'stone',32);Object.assign(yomi.platforms.at(-1),{secretArea:'slayerGrave',unmapped:true});}
yomi.gates.push({id:'slayerSeal',kind:'fire',requiresDawnblade:true,x:1120,y:-350,w:50,h:950,unmapped:true});
yomi.slayerGrave={x:850,y:-1700};
yomi.progressFlags.push('daisyPlush','slayerCrossbow','slayerSummoned');
yomi.objects.push(
 {id:'daisyPlush',type:'slayerLoot',x:780,y:-1700,name:I18n.t('item.daisyPlush'),guardian:'doomSlayer',secretArea:'slayerGrave',unmapped:true},
 {id:'slayerCrossbow',type:'slayerLoot',x:930,y:-1700,name:I18n.t('item.slayerCrossbow'),guardian:'doomSlayer',secretArea:'slayerGrave',unmapped:true}
);
foe(yomi,'doomSlayer',1250,-1700,'guard');Object.assign(yomi.enemies.at(-1),{
 miniboss:'slayer',name:I18n.t('slayer.name'),secretArea:'slayerGrave',factionOverride:'yomi'});
yomi.akash={x:710,y:2350};
yomi.councilGate={x:2770,y:3400,w:420,h:415};
yomi.gates.push({id:'councilGate',kind:'council',x:2815,y:2985,w:70,h:415});
yomi.objects.push({id:'councilKey',type:'councilKey',x:1490,y:5800,name:I18n.t('council.key.name'),requiresFlag:'councilKeyEarned'});
yomi.arena={x:260,y:5800,w:2750,restId:'arena'};yomi.boss={x:1430,y:5800};yomi.exit={x:2790,y:5800};
foe(yomi,'soul-upper-a',480,1510,'guard','upperSoul',60);foe(yomi,'soul-upper-b',1040,1510,'archer','upperSoul',65);foe(yomi,'soul-lower-a',2230,3900,'guard','lowerSoul',60);foe(yomi,'soul-lower-b',2770,3900,'guard','lowerSoul',60);
[[1770,1030],[1920,1790],[1470,2110],[690,3040],[2570,3400],[1420,4230],[1780,4640],[2370,5040]].forEach(([x,y],i)=>foe(yomi,'deep-'+i,x,y,i%3===1?'archer':'guard'));
[[1220,600],[1370,1340],[1720,2480],[1430,3240],[1830,4380],[990,4950]].forEach(([x,y],i)=>foe(yomi,'bat-'+i,x,y,'fly',null,120));
zone(yomi,I18n.t("text.the.silent.well"),0,0,3300,1300);zone(yomi,I18n.t("text.the.captive.memory"),0,1300,3300,900);zone(yomi,I18n.t("text.ash.and.shadow"),0,2200,3300,950);zone(yomi,I18n.t("text.the.silent.river"),0,3150,3300,950);zone(yomi,I18n.t("text.forgotten.tombs"),0,4100,3300,1000);zone(yomi,I18n.t("text.the.bottom.of.the.world"),0,5100,3300,1150);

// An optional interior shares Yomi's progression, but not its geometry or save checkpoint.
const councilHall=makeLevel('councilHall',2400,1100,{x:230,y:820});
ledge(councilHall,'council-floor',0,820,2400,'ground',280);
councilHall.returnPoint={x:140,y:820};
councilHall.inscription={x:2060,y:820};
councilHall.arena={x:-10000,y:820,w:0,restId:'arena'};
councilHall.boss={x:-10000,y:820};
zone(councilHall,I18n.t('council.hall.name'),0,0,2400,1100);

const heaven=makeLevel('heaven',3200,6650,{x:350,y:6300});
ledge(heaven,'cloud-base',80,6300,2900,'cloud',90);
[
 ['first-island',470,5370,520],['first-arc1',1120,5230,240],['second-launch',1700,4960,510],
 ['second-island',1720,4120,510],['second-arc1',1390,3990,230],['third-launch',550,3750,380],
 ['third-island',470,2770,540],['third-arc1',1120,2630,220],['third-arc2',1400,2470,230],['fourth-launch',1740,2340,540],
 ['fourth-island',1740,1470,520],['dawn-arena',1090,850,1920],['father-island',1210,260,660],
 ['sky-memory',2310,3970,480],['lower-secret',2360,5630,520]
].forEach(p=>ledge(heaven,...p,'cloud',38));
// Each moving island replaces a static step, with clearance throughout its whole sweep.
ledge(heaven,'moving-cloud',1410,5080,210,'moving',32);Object.assign(heaven.platforms.at(-1),{range:70,speed:.7,phase:.8});
ledge(heaven,'moving-cloud-west',1110,3860,230,'moving',32);Object.assign(heaven.platforms.at(-1),{range:55,speed:.85,phase:.2});
heaven.winds=[{id:'wind1',x:550,y:5330,w:170,h:970},{id:'wind2',x:1800,y:4080,w:170,h:900},{id:'wind3',x:620,y:2730,w:170,h:1040},{id:'wind4',x:1910,y:1430,w:170,h:930},{id:'wind5',x:1910,y:680,w:170,h:800},{id:'homeWind',x:1390,y:170,w:160,h:700,afterBoss:true}];
rest(heaven,'start',420,6300,I18n.t("text.gate.of.clouds"));rest(heaven,'third',930,2770,I18n.t("text.bridge.of.stars"));rest(heaven,'arena',1600,850,I18n.t("text.the.final.oath"));
heaven.objects=[{id:'skyMemory',type:'memory',x:2620,y:3970,name:I18n.t("text.a.memory.of.heaven")},{id:'cloudMemory',type:'memory',x:2630,y:5630,name:I18n.t("text.a.memory.in.the.clouds")}];
heaven.progressFlags=['eclipseRelic'];
heaven.gates=[{id:'memorySeal',kind:'fire',x:2280,y:3730,w:35,h:290},{id:'dawnSeal',kind:'fire',x:0,y:1050,w:3200,h:28}];
heaven.arena={x:1120,y:850,w:1880,restId:'arena'};heaven.boss={x:2560,y:850};heaven.father={x:1570,y:260};
[[1200,5230],[1850,4960],[1510,3990],[1220,2630],[1510,2470],[2110,2340]].forEach(([x,y],i)=>foe(heaven,'cloud-'+i,x,y,i%3===0?'archer':'guard',null,35));
[[1240,5500],[1580,4600],[970,3500],[1370,2900],[1650,1960]].forEach(([x,y],i)=>foe(heaven,'skybat-'+i,x,y,'fly',null,110));
zone(heaven,I18n.t("text.gate.of.clouds"),0,5450,3200,1200);zone(heaven,I18n.t("text.stairway.of.winds"),0,4250,3200,1200);zone(heaven,I18n.t('place.sun.court'),0,3150,3200,1100);zone(heaven,I18n.t("text.bridge.of.stars"),0,2200,3200,950);zone(heaven,I18n.t('place.dawns.edge'),0,1100,3200,1100);zone(heaven,I18n.t("text.the.summit.of.heaven"),0,0,3200,1100);
// Faction art and role variations share the original, proven geometry.
const fieldRoles=['guard','archer','shield','mage'];
for(const map of [japan,yomi,heaven]){let i=0;for(const enemy of map.enemies){if(enemy.kind==='fly'||enemy.group||enemy.miniboss)continue;enemy.kind=fieldRoles[i++%fieldRoles.length];}}
const lowerShield=yomi.enemies.find(e=>e.id==='soul-lower-a');lowerShield.kind='shield';
const lowerMage=yomi.enemies.find(e=>e.id==='soul-lower-b');lowerMage.kind='mage';
// Low arena ledges are reachable with one jump and connect with ordinary/double jumps.
for(let i=0;i<7;i++){ledge(yomi,'lava-island-'+i,440+i*350,5695,275,'stone',32);Object.assign(yomi.platforms.at(-1),{bossPlatform:true,broken:false,crumble:0});}
japan.arena.triggerX=9120;yomi.arena.triggerX=1000;heaven.arena.triggerX=2050;
// The cathedral route passes above a visible, optional prison branch.
// Its optional organ gallery lies above the camera of the ordinary route.
const shadowRealm=makeLevel('shadowRealm',11200,2600,{x:300,y:1400});
for(const p of [
 ['shore',0,1400,1900],['cloister',2120,1400,1650],['altar-road',4000,1280,1600],
 ['temple-road',5810,1400,1750],['temple-approach',7560,1400,1200],['cathedral',8950,1200,2250],
 ['prison-court',5810,2200,1750],['prison-hall',7560,2200,1200]
])ledge(shadowRealm,...p,'ground',220);
for(const p of [
 ['shore-bridge',1830,1280,360],['cloister-bridge',3660,1200,420],
 ['altar-descent',5600,1280,210],['cathedral-step',8760,1300,190],
 ['prison-balcony',6240,2010,460],['prison-loft',6830,1880,420],
 ['gallery-step1',3150,1220,190],['gallery-step2',2910,1060,170],
 ['gallery-step3',3140,900,180],['gallery-step4',2910,740,170],
 ['gallery-step5',3140,580,180],['organ-loft',2510,420,1200]
]){ledge(shadowRealm,...p);if(p[0].startsWith('gallery-')||p[0]==='organ-loft')shadowRealm.platforms.at(-1).secretArea='organLoft';}
// The open shaft at the altar descent makes the branch visible; 100px steps
// allow returning to the main road even when both movement shrines were missed.
for(let i=0;i<7;i++)ledge(shadowRealm,'prison-stair-'+(i+1),i%2?5470:5600,1500+i*100,210);
rest(shadowRealm,'start',350,1400,I18n.t('shadow.place.shore'));
rest(shadowRealm,'altar',4700,1280,I18n.t('shadow.place.altar'));
rest(shadowRealm,'prison',6100,2200,I18n.t('shadow.place.prison'));
rest(shadowRealm,'cathedral',9180,1200,I18n.t('shadow.place.cathedral'));
shadowRealm.altar={x:4700,y:1280};shadowRealm.prisonDoor={x:7520,y:2200};
shadowRealm.prisonTrace={x:8290,y:1400};
shadowRealm.secrets=[
 {id:'organLoft',name:I18n.t('shadow.place.gallery'),x:2460,y:0,w:1300,h:650,arena:{x:2510,y:420,w:1200},guardian:'madOrganist'},
 {id:'prisonCourt',name:I18n.t('shadow.place.prison'),x:6300,y:1750,w:1230,h:550,arena:{x:6410,y:2200,w:1110},guardian:'cultJailer',public:true}
];
shadowRealm.progressFlags=['shadowAltar','prisonOpen','prisonTrace','prisonKey','corruptedHymn'];
shadowRealm.gates=[
 {id:'prisonDoor',kind:'prison',x:7500,y:1760,w:60,h:440},
 // Solid painted chamber edges prevent entering through one-way floors or
 // dropping in from the main road. These remain solid after the priest dies.
 {id:'prisonRoof',kind:'secretRock',terrainBarrier:true,wallMaterial:'cult',x:7500,y:1720,w:1340,h:100},
 {id:'prisonEastWall',kind:'secretRock',terrainBarrier:true,wallMaterial:'cult',x:8760,y:1720,w:80,h:480},
 {id:'prisonFoundation',kind:'secretRock',terrainBarrier:true,wallMaterial:'cult',x:7500,y:2200,w:1340,h:600}
];
shadowRealm.objects=[
 {id:'prisonTrace',type:'shadowTrace',x:8290,y:1400,name:I18n.t('HARU')},
 {id:'prisonKey',type:'shadowItem',x:7070,y:2200,name:I18n.t('item.prisonKey'),guardian:'cultJailer'},
 {id:'corruptedHymn',type:'shadowItem',x:2730,y:420,name:I18n.t('item.corruptedHymn'),guardian:'madOrganist',secretArea:'organLoft'}
];
shadowRealm.arena={x:9400,y:1200,w:1780,triggerX:9660,restId:'cathedral'};
shadowRealm.boss={x:10450,y:1200};
for(const [i,x] of [950,1500,2460,3460,4280,5160,6000,7890,8480,9280].entries()){
 const floor=shadowRealm.platforms.find(p=>p.kind==='ground'&&x>=p.x&&x<p.x+p.w);
 foe(shadowRealm,'cultist-'+i,x,floor.y,fieldRoles[i%4],null,60);
 shadowRealm.enemies.at(-1).name=I18n.t('shadow.enemy.'+fieldRoles[i%4]);
}
// An elevated optional path gives the old jailer stretch a distinct route;
// it loops back to the temple road and keeps the prison entrance below.
for(const p of [
 ['temple-branch-step1',6210,1300,220],['temple-branch-step2',6500,1215,240],
 ['temple-branch-span',6830,1130,300],['temple-branch-step3',7210,1215,240],
 ['temple-branch-return',7270,1300,220]
])ledge(shadowRealm,...p,'stone',18);
for(const [id,x,y,kind,patrol] of [
 ['temple-branch-archer',6580,1215,'archer',95],['temple-branch-mage',7040,1130,'mage',75]
]){
 foe(shadowRealm,id,x,y,kind,null,patrol);
 shadowRealm.enemies.at(-1).name=I18n.t('shadow.enemy.'+kind);
}
foe(shadowRealm,'madOrganist',3300,420,'mage',null,0);Object.assign(shadowRealm.enemies.at(-1),{miniboss:'organist',name:I18n.t('shadow.boss.organist'),secretArea:'organLoft'});
foe(shadowRealm,'cultJailer',7040,2200,'guard',null,250);Object.assign(shadowRealm.enemies.at(-1),{miniboss:'jailer',name:I18n.t('shadow.boss.jailer'),secretArea:'prisonCourt'});
zone(shadowRealm,I18n.t('shadow.place.shore'),0,650,3900,1950);
zone(shadowRealm,I18n.t('shadow.place.altar'),3900,650,1900,1950);
zone(shadowRealm,I18n.t('shadow.place.cathedral'),5800,650,3100,1090);
zone(shadowRealm,I18n.t('shadow.place.prison'),5400,1740,3500,860);
zone(shadowRealm,I18n.t('shadow.place.cathedral'),8900,0,2300,2600);
heaven.progressFlags.push('shadowEntered');
const levels=[japan,yomi,heaven,shadowRealm];
foe(yomi,'akash-guard',350,2350,'shield','akash',60);
foe(yomi,'akash-mage',785,2350,'mage','akash',15);
// A safe side area belongs to Japan's progression; it is not a fourth realm.
japan.campEntrance={x:8870,y:1000};
const forestCamp=makeLevel('forestCamp',2800,1080,{x:280,y:820});
ledge(forestCamp,'camp-ground',0,820,2800,'ground',260);
rest(forestCamp,'forestCamp',1250,820,I18n.t('camp.shrine'));
forestCamp.returnPoint={x:180,y:820};
forestCamp.arena={x:-1000,y:820,w:0,restId:'forestCamp'};forestCamp.boss={x:-1000,y:820};
zone(forestCamp,I18n.t('camp.name'),0,0,2800,1080);
forestCamp.npcs=[
 {id:'akash',x:930,y:820,name:'merchant.name',dialogue:'merchant.greeting',image:'akash',height:148,merchant:true,requiresFlag:{realm:1,id:'akashRescued'}},
 {id:'daichi',x:620,y:820,name:'camp.npc.daichi.name',dialogue:'camp.npc.daichi.dialogue',image:'campDaichi',height:100},
 {id:'natsu',x:1710,y:820,name:'camp.npc.natsu.name',dialogue:'camp.npc.natsu.dialogue',image:'campNatsu',height:96},
 {id:'sora',x:2310,y:820,name:'camp.npc.sora.name',dialogue:'camp.npc.sora.dialogue',image:'campSora',height:72}
];
// This route is materialized by the quest when accepted, never during the
// original guardian encounter. All four links are usable with a single jump.
japan.campRescueSteps=[
 {id:'camp-route-1',x:8920,y:900,w:190,h:28,kind:'stone',drop:true,baseX:8920},
 {id:'camp-route-2',x:9110,y:800,w:190,h:28,kind:'stone',drop:true,baseX:9110},
 {id:'camp-route-3',x:9300,y:700,w:190,h:28,kind:'stone',drop:true,baseX:9300},
 {id:'camp-route-gate',x:9490,y:600,w:520,h:28,kind:'stone',drop:true,baseX:9490}
];
japan.samuraiCampEntrance={x:9770,y:600,name:'camp.rescue.name'};
japan.progressFlags=[...(japan.progressFlags||[]),'campQuestAccepted','mayorExecuted','guardian:campMaster','smithRescued','herbalistRescued','enchanterRescued','herbalistQuestAccepted'];

const samuraiCamp=makeLevel('samuraiCamp',4400,1600,{x:220,y:1000});
samuraiCamp.name='camp.rescue.name';
for(const p of [
 ['samurai-approach',0,1000,1170],['samurai-courtyard',1300,1080,1320],
 ['samurai-command-ground',2750,1000,1650]
])ledge(samuraiCamp,...p,'ground',600);
for(const p of [
 ['samurai-roof-step',760,900,190],['samurai-west-roof',950,800,250],
 ['samurai-roof-watch',1270,800,250],['samurai-roof-descent',1450,900,220],
 ['samurai-store-step',1750,980,180],['samurai-store-roof',1960,880,220],
 ['samurai-cell-balcony',2200,780,250],['samurai-east-step',2635,980,105]
])ledge(samuraiCamp,...p,'stone',24);
rest(samuraiCamp,'samuraiCampEntrance',330,1000,'camp.rescue.shrine');
rest(samuraiCamp,'samuraiCampCourt',2950,1000,'camp.rescue.court');
samuraiCamp.entrance={x:150,y:1000};
samuraiCamp.returnPoint={...samuraiCamp.entrance};
samuraiCamp.returnDestination={location:null,x:japan.samuraiCampEntrance.x,y:japan.samuraiCampEntrance.y};
samuraiCamp.arena={x:3260,y:1000,w:1060,restId:'samuraiCampCourt'};
// The realm guardian is a dead placeholder; the Camp Master is a miniboss.
samuraiCamp.boss={x:-1000,y:1000};
samuraiCamp.secrets=[{id:'campMasterCourt',name:'camp.rescue.name',x:3230,y:650,w:1110,h:500,arena:samuraiCamp.arena,guardian:'campMaster',public:true}];
samuraiCamp.cages=[
 {id:'smith',x:1060,y:800,name:'camp.npc.smith.name',flag:'smithRescued',requiresFlag:'guardian:campMaster'},
 {id:'herbalist',x:2320,y:780,name:'camp.npc.herbalist.name',flag:'herbalistRescued',requiresFlag:'guardian:campMaster'},
 {id:'enchanter',x:3090,y:1000,name:'camp.npc.enchanter.name',flag:'enchanterRescued',requiresFlag:'guardian:campMaster'}
];
samuraiCamp.mayor={x:3960,y:1000,name:'camp.rescue.mayor'};
for(const [id,x,y,kind,patrol] of [
 ['camp-approach-guard',620,1000,'guard',100],
 ['camp-roof-archer',1370,800,'archer',70],
 ['camp-courtyard-shield',1550,1080,'shield',100],
 ['camp-store-archer',2040,880,'archer',55],
 ['camp-courtyard-guard',2440,1080,'guard',100],
 ['camp-command-shield',3100,1000,'shield',90]
])foe(samuraiCamp,id,x,y,kind,null,patrol);
foe(samuraiCamp,'campMaster',3790,1000,'guard',null,360);
Object.assign(samuraiCamp.enemies.at(-1),{miniboss:'campMaster',name:'camp.rescue.boss',secretArea:'campMasterCourt',factionOverride:'japan'});
zone(samuraiCamp,'camp.rescue.name',0,0,4400,1600);

forestCamp.serviceEntrances=[
 {id:'forgeInterior',x:1520,y:820,name:'service.forge.name',requiresFlag:{realm:0,id:'smithRescued'}},
 {id:'herbalHut',x:1980,y:820,name:'service.herbal.name',requiresFlag:{realm:0,id:'herbalistRescued'}},
 {id:'mysticTent',x:2530,y:820,name:'service.mystic.name',requiresFlag:{realm:0,id:'enchanterRescued'}}
];
function makeCampInterior(id,name,service,entrance){
 const map=makeLevel(id,1500,1080,{x:260,y:820});
 map.name=name;map.service=service;
 ledge(map,id+'-floor',0,820,1500,'ground',260);
 rest(map,id,1120,820,name);
 map.returnPoint={x:160,y:820};
 map.returnDestination={location:'forestCamp',x:entrance.x,y:entrance.y};
 map.servicePoint={x:880,y:820,name};
 map.arena={x:-1000,y:820,w:0,restId:id};map.boss={x:-1000,y:820};
 zone(map,name,0,0,1500,1080);
 return map;
}
const forgeInterior=makeCampInterior('forgeInterior','service.forge.name','forge',forestCamp.serviceEntrances[0]);
const herbalHut=makeCampInterior('herbalHut','service.herbal.name','herbal',forestCamp.serviceEntrances[1]);
const mysticTent=makeCampInterior('mysticTent','service.mystic.name','mystic',forestCamp.serviceEntrances[2]);
const SIDE_LOCATIONS=Object.freeze({
 forestCamp:Object.freeze({map:forestCamp,realm:0,requiredFlags:Object.freeze([])}),
 samuraiCamp:Object.freeze({map:samuraiCamp,realm:0,requiredFlags:Object.freeze(['campQuestAccepted'])}),
 forgeInterior:Object.freeze({map:forgeInterior,realm:0,requiredFlags:Object.freeze(['smithRescued'])}),
 herbalHut:Object.freeze({map:herbalHut,realm:0,requiredFlags:Object.freeze(['herbalistRescued'])}),
 mysticTent:Object.freeze({map:mysticTent,realm:0,requiredFlags:Object.freeze(['enchanterRescued'])})
});
function sideLocationUnlocked(id,worldFlags=[],defeated=[]){
 if(typeof id!=='string'||!Object.hasOwn(SIDE_LOCATIONS,id))return false;
 const spec=SIDE_LOCATIONS[id],known=worldFlags?.[spec.realm];
 return defeated?.[spec.realm]===true&&Array.isArray(known)&&spec.requiredFlags.every(flag=>known.includes(flag));
}
function realmRests(n){return levels[n]?[...levels[n].rests,...Object.values(SIDE_LOCATIONS).filter(spec=>spec.realm===n).flatMap(spec=>spec.map.rests)]:[];}
for(const [index,map] of levels.entries())map.progressFlags=[...(map.progressFlags||[]),BOSS_REWARDS[index].id,BOSS_REWARDS[index].claim];

