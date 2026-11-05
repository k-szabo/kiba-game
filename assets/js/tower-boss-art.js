/* Existing native boss art projected onto independent tower actors. */
'use strict';
const TowerBossArt=(()=>{
 const assets=e=>BossCatalog.assets(TowerBossCombat.id(e));
 const pose=e=>reducedMotion.matches&&e.phase==='wait'?0:e.poseIndex??(e.phase==='windup'?2:e.phase==='strike'?4:e.phase==='recover'?5:Math.abs(e.walkSpeed)>1?Math.floor(e.animTime*6)%2:0);
 function stamp(a,index,e,height=e.h,alpha=1){ctx.save();ctx.globalAlpha*=alpha;ArenaArt.stamp(a,index,e.x+e.w/2,e.y+e.h,height,e.face);ctx.restore();}
 const frames=(image,list)=>({image,frames:list,intersectOutlines:true});
 function actor(e){
  if(!TowerBossCombat.is(e))return false;const type=TowerBossCombat.id(e),p=pose(e);
  // Reuse the story presentation, including its spell layers. Native combat
  // clocks remain owned by the tower; these views neither tick nor write state.
  if(WatchtowerBalloonCombat.is(e))return WatchtowerBalloonArt.actor(e);
  if(DungeonCombat.is(e))return DungeonArt.actor(e);
  if(Serpents.is(e)&&e.serpentType!=='lava')return SerpentArt.actor(e);
  if(type==='fiaVengeance')return FiaArt.actor(e);
  if(type==='fiaRitual')return e.ritualEmpowered?FiaRitualArt.actor({...e,ritual:true}):FiaArt.actor({...e,miniboss:'fiaVengeance'});
  if(ArenaCombat.is(e))return ArenaArt.actor(e);
  if(CampMaster.is(e))return CampArt.actor(e);
  if(PrisonWarden.is(e))return PrisonArt.actor(e);
  if(PrisonHunter.is(e))return KitsuneArt.actor(e);
  if(GatekeeperCombat.is(e))return ZigguratDescentArt.actor(e);
  if(FloatingIslands.is(e))return IslandsArt.actor(e);
  const ordinary={campMaster:ART_CAMP_MASTER,prisonWarden:ART_PRISON.warden,prisonHunter:ART_KITSUNE.hunter,shadowNinjaLeader:ART_SHADOW_NINJAS.leader,voidGatekeeper:ART_ZIGGURAT_DESCENT.gatekeeper,
   dungeonCaptain:ART_DUNGEON.captain,dungeonNecromancer:ART_DUNGEON.necromancer,dungeonCouncil:ART_DUNGEON.council,cultTempleGuard:ART_CULT_DUNGEON.templeGuard,woundedAngel:ART_CULT_DUNGEON.woundedAngel,cultHighPriestess:ART_CULT_DUNGEON.highPriestess,
   arenaCaptain:ART_ARENA.captain,arenaSerpent:ART_ARENA.serpent,arenaFia:ART_ARENA.fia,fiaVengeance:ART_ARENA.fia,voidLieutenant:ART_FIA_VOID.lieutenant,voidDemon:ART_FIA_VOID.demon,fiaRitual:ART_FIA_RITUAL.fia,
   watchtowerJailer:ART_WATCHTOWER.jailer,watchtowerSentinel:ART_WATCHTOWER.sentinel,balloonDragon:ART_WATCHTOWER.dragon,westheruSeal:ART_WATCHTOWER.seal};
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
  if(ordinary[type]){stamp(ordinary[type],p,e,type==='shadowNinjaLeader'?IslandsArt.leaderHeight:e.h);return true;}
  if(type==='main-0'){stamp(frames(e.move==='jumpCut'?'samuraiJump':'samurai',e.move==='jumpCut'?ART_FRAMES.samuraiJump:ART_FRAMES.samurai),p%6,e);return true;}
  if(type==='main-1'){stamp(frames('bosses',ART_FRAMES.bosses[1]),p%6,e);return true;}
  if(['main-2','seraph','eclipse'].includes(type)){const key=type==='eclipse'?'angelEclipse':type==='seraph'?'angelLight':['','angelLight','angelDark','angelEclipse'][e.stage||1];stamp(frames(key,ART_FRAMES[key]),p%6,e);return true;}
  if(type==='angel'||type==='cultist'){const key=type==='angel'?'oldAngel':'oldCultist';stamp(frames(key,ART_FRAMES[key]),p%6,e,type==='angel'?156:145);return true;}
  const shadow=ART_SHADOW.actors[{organist:'madOrganist',jailer:'cultJailer',madPriest:'madPriest'}[type]];if(shadow){stamp(shadow,p%6,e);return true;}
  return false;
 }
 function effects(e){
  if(!TowerBossCombat.is(e)||e.dead)return;
  const type=TowerBossCombat.id(e);
  if(WatchtowerBalloonCombat.is(e)||DungeonCombat.is(e)||Serpents.is(e)&&e.serpentType!=='lava'||type==='fiaVengeance'||type==='fiaRitual'||CampMaster.is(e)||PrisonWarden.is(e)||PrisonHunter.is(e)||FloatingIslands.is(e))return;
  if(GatekeeperCombat.is(e)){ZigguratDescentArt.effects(e);return;}
  if(type==='slayer'){SlayerArt.effects(e);return;}
  if(ArenaCombat.is(e)){ArenaArt.effects(e);return;}
  if(type==='hannah'){
   const echoQueue=(e.echoes||[]).map(s=>({started:s.delay<=0,attackBoxes:[s],snapshot:{move:s.move,duration:s.duration},elapsed:s.elapsed,parts:[s],hazards:[]}));
   HannahArt.effects({...e,echoQueue});return;
  }
  if(['angel','cultist','organist','jailer'].includes(type)){Visuals.miniEffects(e,type==='organist'?290:type==='jailer'?172:type==='angel'?156:145,type==='organist'||type==='jailer'?3:type==='angel'?2:0);return;}
  if(['main-0','main-1','main-2','seraph','eclipse','madPriest'].includes(type)){
   const world=type==='madPriest'?3:type==='main-0'?0:type==='main-1'?1:2;
   const shadow=world===3||world===2&&e.stage===2||type==='eclipse';
   const hazards=(e.hazards||[]).map(h=>({...h,kind:world===2?(shadow?'shadowPillar':'lightPillar'):world===3?'shadowPillar':'eruption'}));
   Visuals.bossEffects(realms[world],{...e,hazards,move:{priestStaff:'cleave',priestBell:'bell'}[e.move]||e.move},world,true);return;
  }
  if(type==='voidLieutenant'||type==='voidDemon'){
   if(e.phase==='windup')for(const box of e.attackBoxes||[])FiaVoidArt.attack({box},null);
   for(const h of e.hazards||[])if(h.life>0)FiaVoidArt.attack(h.active?null:{box:h},h.active?{kind:'rift',box:h,remaining:h.life}:null);
   if(e.phase==='strike'&&['voidSlash','voidClaw'].includes(e.move))for(const box of e.attackBoxes||[])FiaVoidArt.attack(null,{kind:'claw',box,remaining:e.clock});return;
  }
  if(e.phase==='windup')for(const b of e.attackBoxes?.length?e.attackBoxes:e.attackBox?[e.attackBox]:[])BossCues.box(b,BossCues.color);
  if(e.phase==='windup'&&!e.attackBox&&!e.attackBoxes?.length&&!e.hazards?.length&&Number.isFinite(e.targetX)&&Number.isFinite(e.targetY))BossVFX.marker(e.targetX,e.targetY,90,BossCues.color);
  for(const s of e.summons||[])if(Number.isFinite(s.x)&&Number.isFinite(s.y))BossCues.box({x:s.x-45,y:s.y-14,w:90,h:14},BossCues.color);
  for(const h of e.hazards||[]){if(h.life<=0)continue;if(!h.active)BossCues.box(h,BossCues.color);else if(type==='dragonRaid')DragonRaidArt.impact({kind:e.move==='dragonRift'?'rift':'fire',box:h,remaining:h.life});else if(h.kind==='lightning')BossVFX.lightning(h.x+h.w/2,h.y+h.h,h.h,h.w);else if(type==='prologueShadow')BossVFX.column(h);else if(type==='serpent')BossVFX.eruption(h);else BossVFX.impact(h.x+h.w/2,h.y+h.h,h.w,h.h);}
  if(type==='dragonRaid'&&e.phase==='strike'&&e.move==='dragonBite')for(const box of e.attackBoxes||[])DragonRaidArt.impact({kind:'bite',box,remaining:e.clock});
  if(e.shieldRemaining>0)FiaArt.effect('charm',reducedMotion.matches?0:Math.floor(e.animTime*5)%4,e.x+e.w/2,e.y+e.h*.5,e.w+90,e.h+50,.45);
  for(const echo of e.echoes||[]){if(echo.delay>0){BossCues.box(echo,BossCues.color);continue;}stamp(ART_HANNAH.combo,echo.poseIndex||0,echo,echo.h,.4);}
  for(const spirit of e.spirits||[]){stamp(ART_FIA_SPIRITS[spirit.colour],{appear:0,windup:1,strike:2,fade:3}[spirit.phase]??0,spirit,spirit.h,.65);if(spirit.phase==='windup'&&spirit.attackBox)BossCues.box(spirit.attackBox,BossCues.color);}
  if(TowerBossCombat.id(e)==='dragonRaid'&&e.exposedRemaining<=0)for(const leg of TowerSpecialBosses.legs(e)){ctx.save();ctx.strokeStyle=BossCues.color;ctx.lineWidth=2;ctx.strokeRect(leg.x,leg.y,leg.w,leg.h);Visuals.healthBar(leg,leg.x+leg.w/2,leg.y+leg.h,leg.h,65,5);ctx.restore();}
  if(TowerBossCombat.id(e)==='dragonRaid'&&e.exposedRemaining>0)BossCues.box(TowerSpecialBosses.head(e),BossCues.color);
 }
 return Object.freeze({assets,actor,effects});
})();
