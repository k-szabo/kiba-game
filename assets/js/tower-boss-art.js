/* Existing native boss art projected onto independent tower actors. */
'use strict';
const TowerBossArt=(()=>{
 const keys={
  'main-0':['samurai','samuraiJump'],'main-1':['bosses'],'main-2':['angelLight','angelDark','angelEclipse','holyArrow','holyLance'],
  angel:['oldAngel','holyArrow'],cultist:['oldCultist'],seraph:['angelLight','holyArrow','holyLance'],eclipse:['angelEclipse','holyArrow'],
  madPriest:['shadowMadPriest'],organist:['shadowMadOrganist'],jailer:['shadowCultJailer'],
  campMaster:['campMaster','campMasterJump'],prisonWarden:['prisonWarden'],prisonHunter:['prisonHunter'],
  serpent:['lavaSerpent','fxLava'],whiteSerpent:['whiteSerpent','holyArrow'],wingedSerpent:['wingedSerpent','holyArrow'],
  slayer:['slayerMelee','slayerRanged','slayerLightning','slayerBarrel'],shadowNinjaLeader:['ninjaLeader','grapplingHook'],voidGatekeeper:['voidGatekeeper'],
  dungeonCaptain:['dungeonCaptain'],dungeonNecromancer:['dungeonNecromancer','japanRaised'],dungeonCouncil:['dungeonCouncil'],
  cultTempleGuard:['cultTempleGuard'],woundedAngel:['cultWoundedAngel','holyArrow','holyLance'],cultHighPriestess:['cultHighPriestess','shadowGuard','shadowMage'],
  arenaCaptain:['arenaCaptain'],arenaSerpent:['arenaSerpent'],arenaCyclops:['arenaCyclops'],
  arenaFia:['fiaArenaCasting','fiaArenaYield','fiaArenaWalk','fiaFoxfire','fiaCharm','arenaCyclops'],
  hannah:['hannahWalk','hannahCombo','hannahJump','hannahRitual','shadowGuard'],
  dragonRaid:['dragonFront','dragonStagger'],voidLieutenant:['voidLieutenant'],voidDemon:['voidDemon'],
  fiaRitual:['fiaRitual','fiaRitualPowers','fiaAttendantSpirits','fiaTeleport','fiaFoxfire','fiaDrain','fiaCharm','arenaCyclops'],
  fiaVengeance:['fiaArenaCasting','fiaArenaYield','fiaArenaWalk','fiaTeleport','fiaFoxfire','fiaDrain','fiaCharm'],prologueShadow:['shadowIdle','shadowMelee','shadowCast']
 };
 const assets=e=>keys[TowerBossCombat.id(e)]||[];
 const pose=e=>reducedMotion.matches&&e.phase==='wait'?0:e.poseIndex??(e.phase==='windup'?2:e.phase==='strike'?4:e.phase==='recover'?5:Math.abs(e.walkSpeed)>1?Math.floor(e.animTime*6)%2:0);
 function stamp(a,index,e,height=e.h,alpha=1){ctx.save();ctx.globalAlpha*=alpha;ArenaArt.stamp(a,index,e.x+e.w/2,e.y+e.h,height,e.face);ctx.restore();}
 const frames=(image,list)=>({image,frames:list});
 function actor(e){
  if(!TowerBossCombat.is(e))return false;const type=TowerBossCombat.id(e),p=pose(e);
  const ordinary={campMaster:ART_CAMP_MASTER,prisonWarden:ART_PRISON.warden,prisonHunter:ART_KITSUNE.hunter,shadowNinjaLeader:ART_SHADOW_NINJAS.leader,voidGatekeeper:ART_ZIGGURAT_DESCENT.gatekeeper,
   dungeonCaptain:ART_DUNGEON.captain,dungeonNecromancer:ART_DUNGEON.necromancer,dungeonCouncil:ART_DUNGEON.council,cultTempleGuard:ART_CULT_DUNGEON.templeGuard,woundedAngel:ART_CULT_DUNGEON.woundedAngel,cultHighPriestess:ART_CULT_DUNGEON.highPriestess,
   arenaCaptain:ART_ARENA.captain,arenaSerpent:ART_ARENA.serpent,arenaFia:ART_ARENA.fia,fiaVengeance:ART_ARENA.fia,voidLieutenant:ART_FIA_VOID.lieutenant,voidDemon:ART_FIA_VOID.demon,fiaRitual:ART_FIA_RITUAL.fia};
  if(type==='prologueShadow'){
   const clip=SHADOW_CLIPS[e.phase==='wait'?'idle':e.move==='cleave'?'melee':'cast'],f=clip.frames[p%clip.frames.length],image=Visuals.images[clip.image];
   if(image?.naturalWidth){const height=e.h*1.2,s=height/f.h;ctx.drawImage(image,f.x,f.y,f.w,f.h,e.x+e.w/2-f.w*s/2,e.y+e.h-height,f.w*s,height);}return true;
  }
  if(type==='hannah'){HannahArt.actor(e);return true;}
  if(type==='arenaCyclops'){for(const part of e.parts||[])stamp(ART_ARENA.cyclops,part.poseIndex||0,part,part.h);return true;}
  if(type==='slayer'){stamp({frames:ART_SLAYER.frames},SlayerArt.pose(e),e,168);return true;}
  if(type==='dragonRaid'){stamp(e.stance==='exposed'?ART_DRAGON.stagger:ART_DRAGON.front,e.stance==='exposed'?2:p%4,e);return true;}
  if(type==='whiteSerpent'||type==='wingedSerpent'){stamp(ART_REALM_SERPENTS[e.serpentType],SerpentArt.pose(e),e,e.h*1.4);return true;}
  if(type==='serpent'){const clip=ART_SERPENT.clips[['windup','strike','recover'].includes(e.phase)?e.phase:'idle'],index=clip[reducedMotion.matches?0:Math.floor(e.animTime*7)%clip.length];stamp(ART_SERPENT,index,e);return true;}
  if(ordinary[type]){stamp(ordinary[type],p,e);return true;}
  if(type==='main-0'){stamp(frames(e.move==='jumpCut'?'samuraiJump':'samurai',e.move==='jumpCut'?ART_FRAMES.samuraiJump:ART_FRAMES.samurai),p%6,e);return true;}
  if(type==='main-1'){stamp(frames('bosses',ART_FRAMES.bosses[1]),p%6,e);return true;}
  if(['main-2','seraph','eclipse'].includes(type)){const key=type==='eclipse'?'angelEclipse':type==='seraph'?'angelLight':['','angelLight','angelDark','angelEclipse'][e.stage||1];stamp(frames(key,ART_FRAMES[key]),p%6,e);return true;}
  if(type==='angel'||type==='cultist'){const key=type==='angel'?'oldAngel':'oldCultist';stamp(frames(key,ART_FRAMES[key]),p%6,e,type==='angel'?156:145);return true;}
  const shadow=ART_SHADOW.actors[{organist:'madOrganist',jailer:'cultJailer',madPriest:'madPriest'}[type]];if(shadow){stamp(shadow,p%6,e);return true;}
  return false;
 }
 function effects(e){
  if(!TowerBossCombat.is(e)||e.dead)return;
  if(ArenaCombat.is(e)&&!TowerSpecialBosses.is(e)){ArenaArt.effects(e);return;}
  if(e.phase==='windup')for(const b of e.attackBoxes?.length?e.attackBoxes:e.attackBox?[e.attackBox]:[])BossCues.box(b,BossCues.color);
  if(e.phase==='windup'&&!e.attackBox&&!e.attackBoxes?.length&&!e.hazards?.length&&Number.isFinite(e.targetX)&&Number.isFinite(e.targetY))BossVFX.marker(e.targetX,e.targetY,90,BossCues.color);
  for(const s of e.summons||[])if(Number.isFinite(s.x)&&Number.isFinite(s.y))BossCues.box({x:s.x-45,y:s.y-14,w:90,h:14},BossCues.color);
  for(const h of e.hazards||[]){if(h.life<=0)continue;if(!h.active)BossCues.box(h,BossCues.color);else BossVFX.impact(h.x+h.w/2,h.y+h.h,h.w,h.h);}
  if(e.shieldRemaining>0)FiaArt.effect('charm',reducedMotion.matches?0:Math.floor(e.animTime*5)%4,e.x+e.w/2,e.y+e.h*.5,e.w+90,e.h+50,.45);
  for(const echo of e.echoes||[]){if(echo.delay>0){BossCues.box(echo,BossCues.color);continue;}stamp(ART_HANNAH.combo,echo.poseIndex||0,echo,echo.h,.4);}
  for(const spirit of e.spirits||[]){stamp(ART_FIA_SPIRITS[spirit.colour],{appear:0,windup:1,strike:2,fade:3}[spirit.phase]??0,spirit,spirit.h,.65);if(spirit.phase==='windup'&&spirit.attackBox)BossCues.box(spirit.attackBox,BossCues.color);}
  if(TowerBossCombat.id(e)==='dragonRaid'&&e.exposedRemaining<=0)for(const leg of TowerSpecialBosses.legs(e)){ctx.save();ctx.strokeStyle=BossCues.color;ctx.lineWidth=2;ctx.strokeRect(leg.x,leg.y,leg.w,leg.h);Visuals.healthBar(leg,leg.x+leg.w/2,leg.y+leg.h,leg.h,65,5);ctx.restore();}
  if(TowerBossCombat.id(e)==='dragonRaid'&&e.exposedRemaining>0)BossCues.box(TowerSpecialBosses.head(e),BossCues.color);
  for(const barrel of e.barrels||[])stamp({frames:[ART_SLAYER.barrel]},0,{x:barrel.x,y:barrel.y-80,w:0,h:80,face:1},80,barrel.punctured?.6:1);
  for(const oil of e.oils||[]){ctx.save();ctx.fillStyle=realms[1].floor;ctx.fillRect(oil.x,oil.y,oil.w,oil.h);ctx.restore();if(oil.lit)for(let x=oil.x+28;x<oil.x+oil.w;x+=65)BossVFX.stamp('ember',x,oil.y+6,100,70,{angle:-Math.PI/2,alpha:oil.warning>0?.45:.95});}
  if(TowerBossCombat.id(e)==='slayer'&&e.phase==='windup'&&['flail','kick','grab','saw'].includes(e.move)){const width=e.move==='flail'?185:e.move==='grab'?105:140;BossCues.box({x:e.attackFace>0?e.x+e.w*.4:e.x-width,y:e.y-4,w:width+e.w*.6,h:e.h+12},BossCues.color);}
 }
 return Object.freeze({assets,actor,effects});
})();
