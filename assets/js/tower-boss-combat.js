/* Tower encounter adapter: transient actors never invoke journey completion. */
'use strict';
const TowerBossCombat=(()=>{
 let owner=null,projectileDamage=false;
 const is=e=>!!e?.towerBoss&&level?.tower===true;
 const id=e=>e.towerEncounter||e.miniboss;
 const serpentTypes={serpent:'lava',whiteSerpent:'white',wingedSerpent:'winged'};
 const legacy=new Set(['angel','cultist','organist','jailer']);
 function scope(e,callback,shot=false){const previous=owner,oldShot=projectileDamage;owner=e;projectileDamage=shot;try{return callback();}finally{owner=previous;projectileDamage=oldShot;}}
 function create(spec){
  const type=id(spec),arena=spec.arena||level.arena,entry=TowerRules.bossCatalog.find(p=>p.id===type);
  if(!entry)throw new TypeError('Unknown tower boss: '+type);
  const input={...spec,arena,replay:true,noReward:true};let e;
  if(TowerSpecialBosses.is(input))e=TowerSpecialBosses.create(input);
  else if(WatchtowerBalloonCombat.is(input))e=WatchtowerBalloonCombat.create(input);
  else if(serpentTypes[type])e=Serpents.create({...input,serpentType:serpentTypes[type]});
  else if(legacy.has(type)){
   const {w,h}=BossCatalog.story(type);
   e={...input,w,h,x:spec.x,y:spec.y-h,origin:spec.x,baseY:spec.y-h,patrolLeft:arena.x+25,patrolRight:arena.x+arena.w-w-25,face:-1,phase:'wait',clock:1.2,phaseDuration:1.2,cycles:0,move:null,active:true,dead:false,inv:0,stun:0,windup:0,windupDuration:1,attackTime:0,attackDuration:.5,attackElapsed:0,recovery:0,animTime:0,walkSpeed:0,guardBreak:0,blockFlash:0,hazards:[],hitDone:false};
  }else e=createMiniboss(input,0);
  Object.assign(e,{towerEncounter:type,name:entry.name,towerBoss:true,towerEnemy:true,noReward:true,replay:true,hp:spec.maxHp,maxHp:spec.maxHp,active:true,dead:false});
  return e;
 }
 const nativeScaled=e=>!TowerSpecialBosses.is(e)&&(DungeonCombat.is(e)||ArenaCombat.is(e));
 function damageAmount(amount){return owner&&!projectileDamage&&!nativeScaled(owner)?amount*(owner.towerDamageScale??1):amount;}
 function afterDamage(victim,before){if(owner&&TowerSpecialBosses.is(owner))TowerSpecialBosses.contact(owner,victim,before);}
 function tagNew(e,bodies,shots,scaledShots=false){
  for(const body of enemies)if(!bodies.has(body)&&body!==e){body.towerSummonOwner=e.id;body.noReward=true;body.towerEnemy=true;body.damageValue=(body.damageValue||1)*(e.towerDamageScale??1);}
  for(const p of projectiles)if(!shots.has(p)&&!p.towerScaled){
   p.towerOwner=e.id;p.towerScaled=true;p.damage=(p.damage||1)*(scaledShots?1:e.towerDamageScale??1);
   const speed=e.towerSpeed||1;p.vx*=speed;p.vy*=speed;p.life/=speed;
  }
 }
 function update(e,dt){
  if(!is(e)||e.dead||state!=='play'||!Number.isFinite(dt)||dt<=0)return;
  const bodies=new Set(enemies),shots=new Set(projectiles);
  scope(e,()=>{
   if(TowerSpecialBosses.is(e))TowerSpecialBosses.update(e,dt*(e.towerSpeed||1));
   else if(WatchtowerBalloonCombat.is(e))WatchtowerBalloonCombat.update(e,dt*(e.towerSpeed||1));
   else if(id(e)==='organist'||id(e)==='jailer')ShadowRealm.updateMini(e,dt*(e.towerSpeed||1));
   else updateMiniboss(e,dt*(e.towerSpeed||1));
  });
  tagNew(e,bodies,shots);
 }
 function updateSupport(e,dt){
  const boss=enemies.find(b=>is(b)&&b.id===e.towerSummonOwner&&!b.dead);
  if(!boss){e.dead=true;return;}
  const bodies=new Set(enemies),shots=new Set(projectiles);scope(boss,()=>updateEnemy(e,dt),true);tagNew(boss,bodies,shots,true);
 }
 function summon(e){
  if(!is(e)||e.dead||state!=='play')return false;
  const count=enemies.filter(n=>n.towerSummonOwner===e.id&&!n.dead).length;
  for(let i=0;i<Math.min(2,4-count);i++){
   const serial=e.towerSummonSerial=(e.towerSummonSerial||0)+1,raised=id(e)==='dungeonNecromancer';
   const child=createEnemy({id:e.id+'-support-'+serial,x:clamp(e.x+(i?-180:180),20,level.width-80),y:e.arena.y,kind:raised?'guard':i?'mage':'guard',patrol:e.arena.w,summoned:true,raisedSamurai:raised,noReward:true,towerEnemy:true,towerSummonOwner:e.id,factionOverride:raised?'japan':'shadowCult'});
   child.hp=child.maxHp=3;child.cd=.8;enemies.push(child);
  }
  return true;
 }
 function defeat(e){
  if(!is(e)||e.dead)return false;
  if(TowerSpecialBosses.is(e))TowerSpecialBosses.defeat(e);
  else if(WatchtowerBalloonCombat.is(e))WatchtowerBalloonCombat.defeat(e);
  else if(!legacy.has(id(e)))defeatMiniboss(e);
  e.hp=0;e.dead=true;e.active=false;e.hazards=[];e.attackBoxes=[];e.echoes=[];e.spirits=[];
  for(const body of enemies)if(body.towerSummonOwner===e.id){body.dead=true;body.hp=0;}
  projectiles=projectiles.filter(p=>p.towerOwner!==e.id&&p.source!=='mini:'+e.id);return true;
 }
 function hit(e,box,amount,kind='normal'){
  if(!is(e)||e.dead||!e.active||e.inv>0)return false;
  if(TowerSpecialBosses.is(e)){
   const result=TowerSpecialBosses.hit(e,amount,kind,box);if(!result?.handled||!result.connected&&result.damage<=0)return false;
   const before=e.hp;e.hp=Math.max(0,e.hp-result.damage);e.inv=.22;DevDamage.record('outgoing',e,before,e.hp);
   if(e.hp<=0)defeat(e);return true;
  }
  if(DoomSlayer.is(e))return DoomSlayer.hit(e,box,amount,kind)>0;
  if(DungeonCombat.is(e))return DungeonCombat.hit(e,box,amount,kind);
  if(ArenaCombat.is(e))return ArenaCombat.hit(e,box,amount,kind);
  const before=e.hp;e.hp=Math.max(0,e.hp-amount);e.inv=.22;DevDamage.record('outgoing',e,before,e.hp);if(e.hp<=0)defeat(e);return true;
 }
 function projectile(p){
  const e=enemies.find(e=>is(e)&&e.id===p.towerOwner&&!e.dead),victim=player,before=victim.hp;
  scope(e||null,()=>damage(p.damage||1,p.vx>=0?1:-1,true),true);
  if(e&&player===victim&&victim.hp<before&&id(e)==='shadowNinjaLeader')scope(e,()=>FloatingIslands.projectile(p,victim,before));
 }
 return Object.freeze({is,id,create,update,updateSupport,summon,defeat,hit,projectile,damageAmount,afterDamage});
})();
