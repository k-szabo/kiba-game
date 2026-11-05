// VM-only seam for gameplay regression tests. Never included in runtime.js.
const fs=require('node:fs'),path=require('node:path');
const locale=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/i18n/locales.json'),'utf8')).hu.dict;
const bindings=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/config/keybindings.json'),'utf8'));
const release=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/config/release.json'),'utf8'));
const bossData=Object.fromEntries(fs.readdirSync(path.join(__dirname,'../assets/config/bosses')).filter(x=>x.endsWith('.json')).sort().map(x=>{const record=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/config/bosses',x),'utf8'));return [record.id,record];}));
exports.bossCatalog='const BOSS_DATA='+JSON.stringify(bossData)+';\n'+fs.readFileSync(path.join(__dirname,'../assets/js/boss-catalog.js'),'utf8');
exports.before=`
${exports.bossCatalog}

const GAME_RELEASE=${JSON.stringify(release)};
const LEADERBOARD_CONFIG=${fs.readFileSync(path.join(__dirname,'../assets/config/leaderboard.json'),'utf8')};
const TEST_LOCALE=${JSON.stringify(locale)};
const KEY_BINDINGS=${JSON.stringify(bindings)};
const I18n={t:value=>TEST_LOCALE[value]??value,format:(key,args)=>(TEST_LOCALE[key]??key).replace(/\\{(\\d+)\\}/g,(_,i)=>args[i]),applyDOM(){},onChange(){},setLocale(){},locale:'hu'};
window.__saveSnapshots=[];
const SaveVault={ready:Promise.resolve(null),isReady:true,notice:'',write(data){window.__saveSnapshots.push(JSON.stringify(data));localStorage.setItem('momo-three-worlds-v2',JSON.stringify(data));return Promise.resolve();}};
`;
exports.after=`
storageReady=true;
window.momo={getState:()=>({state,realm,abilities:[...abilities],defeated:[...defeated],flags:flags.map(f=>[...f]),shards,coins,meatCount,teaCount,quickHeal,relics:collectedRelics(),attack:{active:attack>0,elapsed:attackElapsed,face:attackFace,hit:attackHit},progression:JSON.parse(JSON.stringify(progression)),stats:momoStats(),player:player?{...player}:null,boss:boss?{...boss}:null,checkpoint:checkpoint?{...checkpoint}:null,camera,cameraY,world:{width:level.width,height:level.height}})};
`;
