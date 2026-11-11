/* Pure, run-local tower economy. No journey state or browser storage. */
'use strict';
const TowerRewards=(()=>{
 const limit=Number.MAX_SAFE_INTEGER,items=Object.freeze({roastMeat:10,tea:25,healingBrew:30,roastChicken:40}),cards=Object.freeze(['vitality','strength','armor','spirit','healing','revival']),rare=Object.freeze(['dawnblade','shield','grapple']);
 const integer=value=>Number.isSafeInteger(value)&&value>=0;
 const exact=(value,keys)=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
 const fresh=(cleared=0)=>({coins:0,items:{roastMeat:0,tea:0,healingBrew:0,roastChicken:0},boosts:{vitality:0,strength:0,armor:0,spirit:0},revivals:0,relic:null,rewardedFloor:cleared,claimedFloor:cleared});
 function valid(value){
  if(!exact(value,['coins','items','boosts','revivals','relic','rewardedFloor','claimedFloor'])||!integer(value.coins)||!integer(value.revivals)||!integer(value.rewardedFloor)||!integer(value.claimedFloor)||value.claimedFloor>value.rewardedFloor||value.rewardedFloor-value.claimedFloor>1)return false;
  if(!exact(value.items,Object.keys(items))||!Object.values(value.items).every(integer)||!exact(value.boosts,['vitality','strength','armor','spirit'])||!Object.values(value.boosts).every(integer))return false;
  if(value.relic!==null&&(!rare.includes(value.relic)||value.claimedFloor!==value.rewardedFloor))return false;
  const spent=Object.values(value.boosts).reduce((a,b)=>a+b,0)+value.revivals+Number(value.relic!==null);
  return Number.isSafeInteger(spent)&&spent<=value.claimedFloor;
 }
 const copy=value=>valid(value)?{...value,items:{...value.items},boosts:{...value.boosts}}:null;
 function choices(seed,cleared){
  if(!integer(seed)||seed<1||seed>0xffffffff||!integer(cleared)||cleared<1)return [];
  let word=(seed^(cleared>>>0)^Math.imul(Math.floor(cleared/0x100000000),0x9e3779b1))>>>0;if(!word)word=0x6d2b79f5;
  const pool=[...cards],result=[];
  while(result.length<3){word^=word<<13;word^=word>>>17;word^=word<<5;result.push(pool.splice((word>>>0)%pool.length,1)[0]);}
  word^=word<<13;word^=word>>>17;word^=word<<5;const draw=(word>>>0)/0x100000000;if(draw<.1)result[2]=rare[Math.floor(draw*30)];return result;
 }
 const vendor=cleared=>integer(cleared)&&cleared>0&&cleared%5===0;
 function award(value,cleared){
  const wallet=copy(value),result={ok:false,wallet,coins:0};
  if(!wallet||!integer(cleared)||cleared!==wallet.rewardedFloor+1||wallet.claimedFloor!==wallet.rewardedFloor)return result;
  const coins=20+5*cleared;if(!Number.isSafeInteger(coins)||wallet.coins>limit-coins)return result;
  wallet.coins+=coins;wallet.rewardedFloor=cleared;wallet.relic=null;return {ok:true,wallet,coins};
 }
 function claim(value,{seed,cleared,id}={}){
  const wallet=copy(value),result={ok:false,wallet,heal:0};
  if(!wallet||cleared!==wallet.rewardedFloor||cleared!==wallet.claimedFloor+1||!choices(seed,cleared).includes(id))return result;
  wallet.claimedFloor=cleared;
  if(Object.hasOwn(wallet.boosts,id)){if(wallet.boosts[id]===limit)return result;wallet.boosts[id]++;}
  else if(id==='revival'){if(wallet.revivals===limit)return result;wallet.revivals++;}
  if(rare.includes(id))wallet.relic=id;
  return {ok:true,wallet,heal:id==='healing'?5:0};
 }
 function buy(value,id){
  const wallet=copy(value),price=items[id],result={ok:false,wallet,price:price??0};
  if(!wallet||!Object.hasOwn(items,id)||!vendor(wallet.rewardedFloor)||wallet.claimedFloor!==wallet.rewardedFloor||wallet.coins<price||wallet.items[id]===limit)return result;
  wallet.coins-=price;wallet.items[id]++;return {ok:true,wallet,price};
 }
 function consume(value,id){const wallet=copy(value);if(!wallet||!Object.hasOwn(items,id)||!wallet.items[id])return {ok:false,wallet};wallet.items[id]--;return {ok:true,wallet};}
 function revive(value){const wallet=copy(value);if(!wallet||!wallet.revivals)return {ok:false,wallet,heal:0};wallet.revivals--;return {ok:true,wallet,heal:10};}
 function stats(value,weapon){const wallet=copy(value);if(!wallet||!['katana','naginata','swordShield'].includes(weapon))return null;return {maxHp:Math.min(limit,20+(weapon==='swordShield'?2:0)+wallet.boosts.vitality*2),damage:Math.min(limit,2+wallet.boosts.strength*.5),armor:Math.min(limit,wallet.boosts.armor*10),dashCooldown:Math.max(.2,.8*(1-wallet.boosts.spirit*.05)),invulnerability:1.25};}
 return Object.freeze({rare,items,cards,fresh,valid,copy,choices,vendor,award,claim,buy,consume,revive,stats});
})();
