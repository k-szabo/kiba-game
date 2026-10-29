/* Isolated, host-owned combat simulation. No journey state or browser storage. */
'use strict';
const DuelRules=(()=>{
 const clone=value=>JSON.parse(JSON.stringify(value));
 const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
 const arenas=freeze([
  {id:0,realm:0,width:1280,height:720,fallY:900,platforms:[{x:80,y:620,w:1120,h:60},{x:340,y:450,w:180,h:28},{x:760,y:450,w:180,h:28}],spawns:[{x:240,y:551},{x:997,y:551}]},
  {id:1,realm:1,width:1280,height:720,fallY:900,platforms:[{x:80,y:620,w:1120,h:60},{x:300,y:470,w:160,h:28},{x:820,y:470,w:160,h:28},{x:560,y:345,w:160,h:28}],spawns:[{x:240,y:551},{x:997,y:551}]},
  {id:2,realm:2,width:1280,height:720,fallY:900,platforms:[{x:80,y:620,w:1120,h:60},{x:320,y:465,w:200,h:28},{x:760,y:465,w:200,h:28},{x:560,y:320,w:160,h:28}],spawns:[{x:240,y:551},{x:997,y:551}]},
  {id:3,realm:3,width:1280,height:720,fallY:900,platforms:[{x:80,y:620,w:1120,h:60},{x:250,y:460,w:190,h:28},{x:840,y:460,w:190,h:28},{x:545,y:355,w:190,h:28}],spawns:[{x:240,y:551},{x:997,y:551}]}
 ]);
 const inputKeys=['move','jump','dash','attack','heavy'];
 const neutral=()=>({move:0,jump:false,dash:false,attack:false,heavy:false});
 const record=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
 const exact=(value,keys)=>record(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
 const finite=(value,min,max)=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max;
 function validInput(value){return exact(value,inputKeys)&&[-1,0,1].includes(value.move)&&inputKeys.slice(1).every(key=>typeof value[key]==='boolean');}
 function input(value){return validInput(value)?{move:value.move,jump:value.jump,dash:value.dash,attack:value.attack,heavy:value.heavy}:neutral();}
 const bases=freeze({normal:{duration:.42,impact:.16,cooldown:.34,damageScale:.75},heavy:{duration:.9,impact:.38,cooldown:.9,damageScale:1.75}});
 function create({arena=0,weapons=['katana','katana']}={}){
  if(!Number.isInteger(arena)||!arenas[arena]||!Array.isArray(weapons)||weapons.length!==2||!weapons.every(WeaponStyles.valid))throw new TypeError('Invalid duel configuration');
  return {tick:0,arena,winner:null,players:weapons.map((weapon,index)=>({
   ...arenas[arena].spawns[index],w:43,h:69,vx:0,vy:0,face:index?-1:1,weapon,hp:20+WeaponStyles.profile(weapon).health,maxHp:20+WeaponStyles.profile(weapon).health,
   onGround:true,jumps:0,dashTime:0,dashCooldown:0,inv:0,guardCooldown:0,attackCooldown:0,animationTime:0,attack:null,held:neutral()
  }))};
 }
 const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 function advance(state,controls,edges,dt){
  const arena=arenas[state.arena],impacts=[];
  state.players.forEach((p,index)=>{
   if(p.hp<=0)return;
   const control=controls[index],edge=edges[index];
   p.animationTime+=dt;
   for(const key of ['dashTime','dashCooldown','inv','guardCooldown','attackCooldown'])p[key]=Math.max(0,p[key]-dt);
   if(control.move&&!p.attack&&p.dashTime<=0)p.face=control.move;
   if(edge.dash&&p.dashTime<=0&&p.dashCooldown<=0&&!p.attack){p.dashTime=.16;p.dashCooldown=.8;}
   if(edge.jump&&p.dashTime<=0&&p.jumps<2){p.vy=-620;p.onGround=false;p.jumps++;}
   if(!p.attack&&p.dashTime<=0&&p.attackCooldown<=0&&(edge.heavy||edge.attack)){
    const kind=edge.heavy?'heavy':'normal',profile=WeaponStyles.attack(p.weapon,bases[kind]);
    p.attack={kind,elapsed:0,duration:profile.duration,impact:profile.impact,face:p.face,hit:false};p.attackCooldown=profile.cooldown;
   }
   if(p.attack){
    const a=p.attack,old=a.elapsed;a.elapsed=Math.min(a.duration,a.elapsed+dt);
    if(!a.hit&&old<a.impact&&a.elapsed>=a.impact){a.hit=true;impacts.push({index,kind:a.kind,face:a.face});}
    if(a.elapsed>=a.duration)p.attack=null;
   }
   const oldFeet=p.y+p.h;
   if(p.dashTime>0){p.vx=p.face*620;p.vy=0;}
   else{p.vx=control.move*250*(p.attack?.55:1);p.vy=Math.min(1100,p.vy+1800*dt);}
   p.x=Math.max(20,Math.min(arena.width-20-p.w,p.x+p.vx*dt));p.y+=p.vy*dt;p.onGround=false;
   if(p.vy>=0&&p.dashTime<=0){
    const support=arena.platforms.filter(platform=>p.x+p.w>platform.x&&p.x<platform.x+platform.w&&oldFeet<=platform.y+.01&&p.y+p.h>=platform.y).sort((a,b)=>a.y-b.y)[0];
    if(support){p.y=support.y-p.h;p.vy=0;p.onGround=true;p.jumps=0;}
   }
   if(p.y>arena.fallY)p.hp=0;
  });
  // Collect contacts before damage, so equally timed lethal swings can draw.
  const hits=[];
  for(const impact of impacts){
   const attacker=state.players[impact.index],target=state.players[1-impact.index];
   if(target.hp<=0||target.inv>0||target.dashTime>0||!overlap(WeaponStyles.hitbox(attacker.weapon,attacker,impact.face),target))continue;
   const damage=3*WeaponStyles.attack(attacker.weapon,bases[impact.kind]).damageScale;
   const guard=WeaponStyles.guard(target.weapon,damage,{face:target.face,direction:impact.face,grounded:target.onGround,attacking:!!target.attack,dashing:target.dashTime>0,cooldown:target.guardCooldown});
   hits.push({target,damage:guard.damage,cooldown:guard.cooldown});
  }
  for(const {target,damage,cooldown} of hits){target.hp=Math.max(0,Math.round((target.hp-damage)*1e6)/1e6);target.guardCooldown=cooldown;target.inv=.35;}
  const dead=state.players.map(p=>p.hp<=0);if(dead[0]||dead[1])state.winner=dead[0]&&dead[1]?'draw':dead[0]?1:0;
 }
 function step(state,values,dt=1/60){
  if(state.winner!==null||!Number.isFinite(dt)||dt<=0)return state;
  const controls=[input(values?.[0]),input(values?.[1])],edges=controls.map((control,index)=>Object.fromEntries(inputKeys.slice(1).map(key=>[key,control[key]&&!state.players[index].held[key]])));
  let remaining=Math.min(dt,.05),first=true;
  while(remaining>1e-9&&state.winner===null){const slice=Math.min(remaining,1/120);advance(state,controls,first?edges:[neutral(),neutral()],slice);first=false;remaining-=slice;}
  state.players.forEach((p,index)=>p.held=controls[index]);state.tick++;return state;
 }
 const playerKeys=['x','y','w','h','vx','vy','face','weapon','hp','maxHp','onGround','jumps','dashTime','dashCooldown','inv','guardCooldown','attackCooldown','animationTime','attack'];
 function snapshot(state){return {tick:state.tick,arena:state.arena,winner:state.winner,players:state.players.map(p=>Object.fromEntries(playerKeys.map(key=>[key,key==='attack'&&p.attack?clone(p.attack):p[key]])))};}
 function validAttack(value){return value===null||exact(value,['kind','elapsed','duration','impact','face','hit'])&&Object.hasOwn(bases,value.kind)&&finite(value.duration,.1,2)&&finite(value.elapsed,0,value.duration)&&finite(value.impact,.01,value.duration)&&Math.abs(value.face)===1&&typeof value.hit==='boolean';}
 function validSnapshot(value){
  if(!exact(value,['tick','arena','winner','players'])||!Number.isSafeInteger(value.tick)||value.tick<0||!Number.isInteger(value.arena)||!arenas[value.arena]||![null,0,1,'draw'].includes(value.winner)||!Array.isArray(value.players)||value.players.length!==2)return false;
  return value.players.every(p=>exact(p,playerKeys)&&WeaponStyles.valid(p.weapon)&&p.w===43&&p.h===69&&Math.abs(p.face)===1&&p.maxHp===20+WeaponStyles.profile(p.weapon).health&&finite(p.hp,0,p.maxHp)&&finite(p.x,20,1217)&&finite(p.y,-1500,1000)&&finite(p.vx,-620,620)&&finite(p.vy,-620,1100)&&typeof p.onGround==='boolean'&&Number.isInteger(p.jumps)&&p.jumps>=0&&p.jumps<=2&&['dashTime','dashCooldown','inv','guardCooldown','attackCooldown'].every(key=>finite(p[key],0,key==='dashTime'?.16:2))&&finite(p.animationTime,0,Number.MAX_SAFE_INTEGER)&&validAttack(p.attack));
 }
 return Object.freeze({create,step,input,validInput,snapshot,validSnapshot,arenas});
})();
