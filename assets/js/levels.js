/* Three deliberately different routes: an expedition, a descent, an ascent. */
'use strict';
function makeLevel(id,width,height,start){return{id,width,height,start,platforms:[],rests:[],objects:[],gates:[],winds:[],hazards:[],enemies:[],zones:[]};}
function ledge(l,id,x,y,w,kind='stone',h=28){l.platforms.push({id,x,y,w,h,kind,drop:kind!=='ground',baseX:x});}
function rest(l,id,x,y,name){l.rests.push({id,x,y,name});}
function foe(l,id,x,y,kind='guard',group=null,patrol=65){l.enemies.push({id,x,y,kind,group,patrol});}
function zone(l,name,x,y,w,h){l.zones.push({name,x,y,w,h});}
const japan=makeLevel('japan',10400,1700,{x:260,y:1000});
[[0,1000,1550],[1680,950,1640],[3400,1000,1500],[5100,920,1400],[6740,960,1160],[8150,1000,2250]].forEach((p,i)=>ledge(japan,'road'+i,...p,'ground',190));
[
 ['wind-step',1980,855,150],['wind-roof',2160,760,370],['root-step',2890,900,140],
 ['forest-step',3900,905,180],['forest-mid',4090,810,180],['forest-bell',4300,715,260],
 ['river-bridge',4820,835,200],['river-roof',5150,760,300],['river-rest',5590,815,220],
 ['rice-bridge',6530,850,190],['village-step',6770,855,180],['village-mid',6930,790,170],['village-bell',7100,715,290],
 ['bamboo-bridge',7900,840,180],['temple-roof',8290,850,280],
 ['river-cave',4850,1390,1550],['cave-exit1',6220,1290,160],['cave-exit2',6400,1190,160],['cave-exit3',6580,1090,160],['cave-exit4',6760,995,180],
 ['forest-secret1',3550,800,200],['forest-secret2',3720,620,230]
].forEach(p=>ledge(japan,...p));
japan.ability={x:2340,y:760,name:'A szél áldása'};
rest(japan,'start',330,1000,'A falu széle');rest(japan,'river',3650,1000,'A kettős ösvény');rest(japan,'fields',5880,920,'Rizsföldek');rest(japan,'temple',8760,1000,'A templom kapuja');
japan.objects=[{id:'forestBell',type:'bell',x:4420,y:715,name:'Az erdei harang'},{id:'villageBell',type:'bell',x:7240,y:715,name:'A falu harangja'},{id:'riverMemory',type:'memory',x:5550,y:1390,name:'Emlék a folyó alatt'},{id:'forestMemory',type:'memory',x:3830,y:620,name:'A lombok emléke'}];
japan.gates=[{id:'root',kind:'root',x:3100,y:745,w:65,h:205},{id:'templeOath',kind:'bells',x:8560,y:0,w:35,h:1700}];
japan.arena={x:8770,y:1000,w:1550,restId:'temple'};japan.boss={x:9570,y:1000};japan.exit={x:10000,y:1000};
[[930,1000],[1900,950],[2820,950],[3600,1000],[4140,1000],[4750,1000],[5450,920],[6200,920],[6930,960],[7550,960],[8390,1000]].forEach(([x,y],i)=>foe(japan,'road-'+i,x,y,i%4===2?'archer':'guard',null,Math.min(65,i===8?40:65)));
foe(japan,'cave-guard',5260,1390,'guard');foe(japan,'cave-bat',6010,1310,'fly');foe(japan,'tree-bat',3900,690,'fly');
zone(japan,'A köd erdeje',0,0,3300,1250);zone(japan,'Az erdei harang',3300,0,1600,1200);zone(japan,'A folyó alatti járat',4800,1150,2200,550);zone(japan,'Folyó és rizsföldek',4800,0,2000,1150);zone(japan,'A csendes falu',6800,0,1500,1150);zone(japan,'A bambusztemplom',8300,0,2100,1200);

const yomi=makeLevel('yomi',3300,6250,{x:1560,y:450});
[
 ['entry',1170,450,980],['first-left',610,730,850],['first-right',1590,1030,1000],
 ['cage-left',350,1510,1150],['east-shelf',1640,1790,1050],['center-shelf',1110,2110,1000],
 ['ash-shrine',1220,2700,950],['west-fire',360,3040,1030],['east-river',1990,3400,900],
 ['cage-right',2050,3900,1050],['west-tomb',440,4230,1200],['deep-center',1110,4640,1050],
 ['last-ledge',1450,5040,1280],['bottom',220,5800,2860],
 ['rescue-left-stair',1510,1420,180],['river-lip',1800,3710,210],['deep-left',320,4740,450],
 ['secret-tomb',230,2350,600],['secret-step',680,2240,250]
].forEach(p=>ledge(yomi,...p,'stone',32));
yomi.ability={x:1570,y:2700,name:'A szellemlépés'};
rest(yomi,'start',1530,450,'A néma kút');rest(yomi,'upper',1810,1790,'A hamu párkánya');rest(yomi,'shadow',1730,2700,'Az árnyék szentélye');rest(yomi,'lower',2470,3900,'A néma folyó');rest(yomi,'abyss',1860,5040,'A mélység pereme');rest(yomi,'arena',620,5800,'A lélekfenék');
yomi.objects=[{id:'soulUpper',type:'rescue',group:'upperSoul',x:680,y:1510,name:'Az emlékező lélek'},{id:'soulLower',type:'rescue',group:'lowerSoul',x:2440,y:3900,name:'A hazavágyó lélek'},{id:'tombMemory',type:'memory',x:510,y:2350,name:'A sírok emléke'}];
yomi.gates=[{id:'shadowVeil',kind:'shadow',x:1920,y:3150,w:55,h:1060},{id:'abyssOath',kind:'souls',x:0,y:5300,w:3300,h:32}];
yomi.hazards=[{x:520,y:3025,w:180,h:15},{x:2260,y:3385,w:150,h:15},{x:860,y:4215,w:160,h:15}];
yomi.arena={x:260,y:5800,w:2750,restId:'arena'};yomi.boss={x:1430,y:5800};yomi.exit={x:2790,y:5800};
foe(yomi,'soul-upper-a',480,1510,'guard','upperSoul',60);foe(yomi,'soul-upper-b',1040,1510,'archer','upperSoul',65);foe(yomi,'soul-lower-a',2230,3900,'guard','lowerSoul',60);foe(yomi,'soul-lower-b',2770,3900,'guard','lowerSoul',60);
[[1770,1030],[1920,1790],[1470,2110],[690,3040],[2570,3400],[1420,4230],[1780,4640],[2370,5040]].forEach(([x,y],i)=>foe(yomi,'deep-'+i,x,y,i%3===1?'archer':'guard'));
[[1220,600],[1370,1340],[1720,2480],[1430,3240],[1830,4380],[990,4950]].forEach(([x,y],i)=>foe(yomi,'bat-'+i,x,y,'fly',null,120));
zone(yomi,'A néma kút',0,0,3300,1300);zone(yomi,'A fogoly emlék',0,1300,3300,900);zone(yomi,'Hamu és árnyék',0,2200,3300,950);zone(yomi,'A néma folyó',0,3150,3300,950);zone(yomi,'Az elfeledett sírok',0,4100,3300,1000);zone(yomi,'A világ feneke',0,5100,3300,1150);

const heaven=makeLevel('heaven',3200,6650,{x:350,y:6300});
ledge(heaven,'cloud-base',80,6300,2900,'cloud',90);
[
 ['first-island',470,5370,520],['first-arc1',1120,5230,240],['first-arc2',1410,5080,240],['second-launch',1700,4960,510],
 ['second-island',1720,4120,510],['second-arc1',1390,3990,230],['second-arc2',1110,3860,230],['third-launch',550,3750,380],
 ['third-island',470,2770,540],['third-arc1',1120,2630,220],['third-arc2',1400,2470,230],['fourth-launch',1740,2340,540],
 ['fourth-island',1740,1470,520],['dawn-arena',1090,850,1920],['father-island',1210,260,660],
 ['sky-memory',2310,3970,480],['lower-secret',2360,5630,520]
].forEach(p=>ledge(heaven,...p,'cloud',38));
ledge(heaven,'moving-cloud',1510,5020,210,'moving',32);Object.assign(heaven.platforms.at(-1),{range:115,speed:.7,phase:.8});
ledge(heaven,'moving-cloud-west',900,3770,200,'moving',32);Object.assign(heaven.platforms.at(-1),{range:90,speed:.85,phase:.2});
heaven.winds=[{id:'wind1',x:550,y:5330,w:170,h:970},{id:'wind2',x:1800,y:4080,w:170,h:900},{id:'wind3',x:620,y:2730,w:170,h:1040},{id:'wind4',x:1910,y:1430,w:170,h:930},{id:'wind5',x:1910,y:680,w:170,h:800},{id:'homeWind',x:1390,y:170,w:160,h:700,afterBoss:true}];
rest(heaven,'start',420,6300,'A felhők kapuja');rest(heaven,'first',830,5370,'Az első szélterasz');rest(heaven,'second',2070,4120,'A napudvar');rest(heaven,'third',810,2770,'A csillagok hídja');rest(heaven,'fourth',2170,1470,'A hajnal pereme');rest(heaven,'arena',1600,850,'Az utolsó eskü');
heaven.objects=[{id:'skyMemory',type:'memory',x:2620,y:3970,name:'Az ég emléke'},{id:'cloudMemory',type:'memory',x:2630,y:5630,name:'A felhők emléke'}];
heaven.gates=[{id:'memorySeal',kind:'fire',x:2280,y:3730,w:35,h:290},{id:'dawnSeal',kind:'fire',x:0,y:1050,w:3200,h:28}];
heaven.arena={x:1120,y:850,w:1880,restId:'arena'};heaven.boss={x:2560,y:850};heaven.father={x:1570,y:260};
[[1200,5230],[1850,4960],[1510,3990],[1170,3860],[1220,2630],[1510,2470],[2110,2340]].forEach(([x,y],i)=>foe(heaven,'cloud-'+i,x,y,i%3===0?'archer':'guard',null,35));
[[1240,5500],[1580,4600],[970,3500],[1370,2900],[1650,1960]].forEach(([x,y],i)=>foe(heaven,'skybat-'+i,x,y,'fly',null,110));
zone(heaven,'A felhők kapuja',0,5450,3200,1200);zone(heaven,'A szél lépcsői',0,4250,3200,1200);zone(heaven,'A napudvar',0,3150,3200,1100);zone(heaven,'A csillagok hídja',0,2200,3200,950);zone(heaven,'A hajnal pereme',0,1100,3200,1100);zone(heaven,'Az ég teteje',0,0,3200,1100);
// Faction art and role variations share the original, proven geometry.
const fieldRoles=['guard','archer','shield','mage'];
for(const map of [japan,yomi,heaven]){let i=0;for(const enemy of map.enemies){if(enemy.kind==='fly'||enemy.group)continue;enemy.kind=fieldRoles[i++%fieldRoles.length];}}
const lowerShield=yomi.enemies.find(e=>e.id==='soul-lower-a');lowerShield.kind='shield';
const lowerMage=yomi.enemies.find(e=>e.id==='soul-lower-b');lowerMage.kind='mage';
const levels=[japan,yomi,heaven];

