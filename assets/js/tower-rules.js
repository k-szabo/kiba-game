/* Pure tower floor and checkpoint rules. No journey state, storage or timers. */
'use strict';
const TowerRules=(()=>{
 const profile=Object.freeze({baseHp:20,clearHeal:2,checkpointEvery:5,maxEnemies:8});
 const layout=Object.freeze({width:1800,height:1000,groundY:760,spawnX:180});
 const weapons=Object.freeze(['katana','naginata','swordShield']),factions=Object.freeze(['japan','yomi','heaven','shadowCult']);
 const bossPool=Object.freeze(['arenaCaptain','dungeonCaptain','cultTempleGuard','arenaSerpent','woundedAngel','dungeonCouncil','arenaCyclops']);
 const bossCount=number=>integer(number,1)?number>=26?3:number>=11?2:1:null;
 const runKeys=Object.freeze(['seed','weapon','floor','cleared','kills','elapsed','checkpoint']),checkpointKeys=Object.freeze(['seed','weapon','cleared','kills','elapsed']);
 const integer=(value,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(value)&&value>=min&&value<=max;
 const exact=(value,keys)=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
 const validSeed=value=>integer(value,1,0xffffffff),validWeapon=value=>weapons.includes(value);
 const duration=value=>Number.isFinite(value)&&value>=0&&value<=Number.MAX_SAFE_INTEGER;
 const maxHp=weapon=>validWeapon(weapon)?profile.baseHp+(weapon==='swordShield'?2:0):null;
 const enemyCount=number=>integer(number,1)?Math.min(profile.maxEnemies,3+Math.floor(number/4)):null;
 function floor(number,seed){
  if(!integer(number,1)||!validSeed(seed))return null;
  // Mix both integer words: distant floors must not repeat merely because a
  // bitwise conversion discarded their high bits. PRNG never touches Math.random.
  let word=(seed^(number>>>0)^Math.imul(Math.floor(number/0x100000000),0x9e3779b1))>>>0;
  if(!word)word=0x6d2b79f5;
  const random=()=>{word^=word<<13;word^=word>>>17;word^=word<<5;return (word>>>0)/0x100000000;};
  const count=enemyCount(number),realm=Math.floor((number-1)/5)%4,elite=number%profile.checkpointEvery===0;
  const pool=['guard',...(number>=2?['archer']:[]),...(number>=3?['mage']:[]),...(number>=4?['shield']:[]),...(number>=7?['fly']:[])];
  const healthScale=1+(number-1)*.12,damageScale=1+Math.floor((number-1)/5)*.3;
  const enemies=Array.from({length:count},(_,i)=>{
   const towerElite=elite&&i===0,kind=towerElite?(random()<.5?'guard':'shield'):pool[Math.floor(random()*pool.length)];
   const baseHp={guard:4,archer:3,shield:6,mage:4,fly:2}[kind];
   return {id:'tower-'+number+'-'+i,kind,x:Math.round(560+i*1060/Math.max(1,count-1)+(random()-.5)*60),y:layout.groundY,patrol:layout.width,
    factionOverride:factions[realm],noReward:true,towerEnemy:true,towerElite,
    maxHp:Math.min(Number.MAX_SAFE_INTEGER,Math.ceil(baseHp*healthScale*(towerElite?1.7:1))),
    damageValue:Math.min(Number.MAX_SAFE_INTEGER,Math.round(damageScale*(towerElite?1.25:1)*100)/100)};
  });
  // Replace fixed slots: historical kill totals/checkpoints stay valid.
  const bosses=bossCount(number),speedScale=1+Math.min(.6,(number-1)*.0125),towerDamageScale=.5+(number-1)*.0125;
  const baseHealth={arenaCaptain:32,dungeonCaptain:36,cultTempleGuard:40,arenaSerpent:42,woundedAngel:38,dungeonCouncil:48,arenaCyclops:44};
  for(let i=0;i<bosses;i++){
   const miniboss=bossPool[((number-1)%bossPool.length+(seed%bossPool.length)+i*2)%bossPool.length];
   Object.assign(enemies[i],{miniboss,towerBoss:true,towerElite:false,replay:true,x:520+i*430,towerSpeed:speedScale,towerDamageScale,
    maxHp:Math.min(Number.MAX_SAFE_INTEGER,Math.ceil(baseHealth[miniboss]*(1+(number-1)*.1)))});
  }
  return {number,realm,faction:factions[realm],enemyCount:count,bossCount:bosses,elite,healthScale,damageScale,speedScale,enemies};
 }
 // This prefix sum remains constant-cost even for hostile, enormous records.
 function killsThrough(cleared){
  if(!integer(cleared))return null;
  let kills=0;for(let n=1;n<=Math.min(cleared,19);n++)kills+=enemyCount(n);
  const remainder=Math.max(0,cleared-19);
  if(remainder>Math.floor((Number.MAX_SAFE_INTEGER-kills)/profile.maxEnemies))return null;
  return kills+remainder*profile.maxEnemies;
 }
 function validCheckpoint(value){
  return exact(value,checkpointKeys)&&validSeed(value.seed)&&validWeapon(value.weapon)&&integer(value.cleared,profile.checkpointEvery)&&value.cleared%profile.checkpointEvery===0&&value.cleared<Number.MAX_SAFE_INTEGER&&
   integer(value.kills)&&value.kills===killsThrough(value.cleared)&&duration(value.elapsed);
 }
 function valid(value){
  if(!exact(value,runKeys)||!validSeed(value.seed)||!validWeapon(value.weapon)||!integer(value.floor,1)||!integer(value.cleared)||value.cleared!==value.floor-1||!integer(value.kills)||value.kills!==killsThrough(value.cleared)||!duration(value.elapsed))return false;
  const checkpoint=value.checkpoint;
  if(value.cleared<profile.checkpointEvery)return checkpoint===null;
  return validCheckpoint(checkpoint)&&checkpoint.seed===value.seed&&checkpoint.weapon===value.weapon&&checkpoint.cleared===Math.floor(value.cleared/profile.checkpointEvery)*profile.checkpointEvery&&checkpoint.kills<=value.kills&&checkpoint.elapsed<=value.elapsed;
 }
 function fresh(seed,weapon='katana'){return validSeed(seed)&&validWeapon(weapon)?{seed,weapon,floor:1,cleared:0,kills:0,elapsed:0,checkpoint:null}:null;}
 function copy(value){return valid(value)?{...value,checkpoint:value.checkpoint?{...value.checkpoint}:null}:null;}
 function score(value){return valid(value)?Object.fromEntries(checkpointKeys.map(key=>[key,value[key]])):null;}
 function fromCheckpoint(value){
  if(!validCheckpoint(value))return null;
  return {seed:value.seed,weapon:value.weapon,floor:value.cleared+1,cleared:value.cleared,kills:value.kills,elapsed:value.elapsed,checkpoint:{...value}};
 }
 function resume(value){
  if(!valid(value))return null;
  return value.checkpoint?fromCheckpoint(value.checkpoint):fresh(value.seed,value.weapon);
 }
 function advance(value,{kills,elapsed}={}){
  const state=copy(value),result={ok:false,state,heal:0,fullHeal:false,checkpoint:false,reason:state?null:'invalidState'};
  if(!state)return result;
  if(kills!==enemyCount(state.floor)){result.reason='unclearedFloor';return result;}
  if(!duration(elapsed)){result.reason='invalidDuration';return result;}
  if(state.floor===Number.MAX_SAFE_INTEGER||kills>Number.MAX_SAFE_INTEGER-state.kills||elapsed>Number.MAX_SAFE_INTEGER-state.elapsed){result.reason='counterOverflow';return result;}
  state.cleared=state.floor++;state.kills+=kills;state.elapsed+=elapsed;
  result.heal=profile.clearHeal;result.fullHeal=state.cleared%profile.checkpointEvery===0;
  if(result.fullHeal){state.checkpoint={seed:state.seed,weapon:state.weapon,cleared:state.cleared,kills:state.kills,elapsed:state.elapsed};result.checkpoint=true;}
  result.ok=true;result.reason=null;return result;
 }
 function heal(hp,maximum,cleared){
  if(!Number.isFinite(hp)||!Number.isFinite(maximum)||hp<0||maximum<=0||hp>maximum||!integer(cleared,1))return null;
  if(hp===0)return 0;return cleared%profile.checkpointEvery===0?maximum:Math.min(maximum,hp+profile.clearHeal);
 }
 return Object.freeze({profile,layout,weapons,validSeed,validWeapon,maxHp,enemyCount,bossPool,bossCount,floor,killsThrough,validCheckpoint,valid,fresh,copy,score,fromCheckpoint,resume,advance,heal});
})();
