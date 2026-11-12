/* Interaction lookup and handling, in priority order. */
'use strict';

function getContext(){
 if(typeof TowerMode!=='undefined'&&TowerMode.active)return null;
 if(WatchtowerBalloon.locked()||FloatingIslands.locked()||ZigguratDescent.locked()||FiaRitual.blocked()||VoidEncounter.locked()||DragonRaid.locked()||FiaConflict.blocked()||HannahEncounter.blocked())return null;
 if(Prologue.active)return null;
 if(SkyDragonRaid.active())return SkyDragonRaid.context();
 const campContext=SkyDragonRaid.context()||StoryRaid.context()||ThirdClan.context()||
  WatchtowerBalloon.context()||FloatingIslands.context()||FiaRitual.context()||
  ZigguratDescent.context()||HannahEncounter.context()||FiaVoidJourney.context()||
  DragonRaid.context()||DungeonRun.context()||ArenaChallenge.context()||
  KitsuneQuest.context()||PrisonQuest.context()||CampHerbs.context()||CampQuest.context();
 if(campContext)return campContext;
 if(CampQuest.isSide())return null;
 const shadowContext=ShadowRealm.context();if(shadowContext)return shadowContext;
 if(level===forestCamp){
  if(pointNear(level.returnPoint,100,90))return{type:'campReturn',text:I18n.t('camp.return')};
  const npc=level.npcs.find(n=>campNPCVisible(n)&&pointNear(n,95,85));
  if(npc)return{type:'campNPC',npc,text:npc.merchant?I18n.t('merchant.trade'):I18n.format('camp.talk',[I18n.t(npc.name)])};
  const rest=level.rests.find(r=>pointNear(r,90,80));
  return rest?{type:'checkpoint',rest,text:I18n.t('text.e.rest.heal.and.save')}:null;
 }
 if(level===levels[0]&&defeated[0]&&pointNear(level.campEntrance,105,90))return{type:'campEntrance',text:I18n.t('camp.enter')};
 if(level===yomi&&pointNear(yomi.slayerGrave,115,95)){const e=enemies.find(DoomSlayer.is);if(e&&!e.dead&&!e.active)return{type:'slayerGrave',enemy:e,text:I18n.t('slayer.read')};}
 if(level===yomi&&!Merchant.rescued()&&pointNear(yomi.akash,100,85))return{type:'akash',text:I18n.t('merchant.free')};
 if(level===councilHall){
  if(pointNear(level.returnPoint,130,110))return{type:'councilReturn',text:I18n.t('council.return.prompt')};
  if(pointNear(level.inscription,130,110))return{type:'councilInscription',text:I18n.t('council.inscription.prompt')};
  return null;
 }
 if(realm===1&&pointNear(level.councilGate,155,100))return{type:'councilGate',text:I18n.t(hasFlag('councilGateOpen')?'council.gate.enter':hasFlag('councilKey')?'council.gate.unlock':'council.gate.locked')};
 if(realm===2&&defeated[2]&&pointNear(level.father,110,100))return{type:'father',text:I18n.t('text.e.embrace.your.father')};
 if(realm<2&&pointNear(level.exit,115,100))return{type:'portal',text:defeated[realm]?I18n.format('message.e.travel.to.arg0.from.the.ground',[realms[realm+1].short]):I18n.t('text.e.the.guardian.s.oath.seals.the.passage')};
 const object=level.objects.find(o=>!hasFlag(o.id)&&!(o.id==='prisonKey'&&hasFlag('prisonOpen'))&&objectVisible(o)&&relicUnlocked(o)&&pointNear(o));
 if(object)return{type:object.type,object,text:object.type==='councilKey'?I18n.t('council.key.pickup'):I18n.format('message.e.arg0.arg1',[object.type==='bell'?I18n.t('text.ring'):object.type==='rescue'?I18n.t('text.free'):['relic','slayerLoot'].includes(object.type)?I18n.t('action.pick.up'):I18n.t('text.recall'),object.name])};
 if(level.ability&&pointNear(level.ability))return{type:'ability',text:'E · '+(abilities[realm]?I18n.t('text.shrine.of.memory'):level.ability.name)};
 const rest=level.rests.find(r=>pointNear(r,90,80));if(rest)return{type:'checkpoint',rest,text:I18n.t('text.e.rest.heal.and.save')};
 const weakWall=level.gates.find(g=>g.kind==='fragile'&&!gatePass(g)&&overlap({x:player.x-90,y:player.y-10,w:player.w+180,h:player.h+20},g));
 if(weakWall)return{type:'weakWall',text:I18n.t('text.j.the.cracked.rock.sounds.hollow')};
 const seal=level.gates.find(g=>g.kind==='fire'&&!gatePass(g)&&overlap({x:player.x-95,y:player.y-70,w:player.w+190,h:player.h+140},g));
 if(seal)return{type:'seal',text:I18n.t('text.j.break.the.seal.with.the.dawnblade')};return null;
}
function interact(){
 const c=getContext();
 if(!c)return;
 if(SkyDragonRaid.interact(c)||StoryRaid.interact(c)||ThirdClan.interact(c)||
  WatchtowerBalloon.interact(c)||FloatingIslands.interact(c)||ZigguratDescent.interact(c)||FiaRitual.interact(c)||
  FiaVoidJourney.interact(c)||HannahEncounter.interact(c)||DragonRaid.interact(c)||
  DungeonRun.interact(c)||ArenaChallenge.interact(c)||KitsuneQuest.interact(c)||
  PrisonQuest.interact(c)||CampHerbs.interact(c)||CampQuest.interact(c))return;
 if(ShadowRealm.interact(c))return;
 if(c.type==='slayerGrave'){SlayerDialog.open(c.enemy);return;}
 if(c.type==='campEntrance'){enterForestCamp();return;}
 if(c.type==='campReturn'){leaveForestCamp();return;}
 if(c.type==='akash'){Merchant.free();return;}
 if(c.type==='campNPC'&&c.npc.merchant){Merchant.open();return;}
 if(c.type==='campNPC'&&c.npc.id==='daichi'){CampQuest.talkDaichi();return;}
 if(c.type==='campNPC'){story('camp.dialogue.label',c.npc.name,c.npc.id==='sora'&&CampQuest.daisyPlaced()?'camp.npc.sora.daisy':c.npc.dialogue,null,{right:c.npc.id,speaker:c.npc.id});return;}
 if(c.type==='councilGate'){
  if(hasFlag('councilGateOpen')){enterCouncilHall();return;}
  if(!hasFlag('councilKey')){toast(I18n.t('council.gate.clue'));return;}
  flags[1]=flags[1].filter(f=>f!=='councilKey');flags[1].push('councilGateOpen');persist();
  enterCouncilHall();toast(I18n.t('council.gate.consumed'));return;
 }
 if(c.type==='councilReturn'){leaveCouncilHall();persist();toast(I18n.t('council.hall.returned'));return;}
 if(c.type==='councilInscription'){story(I18n.t('council.hall.name'),I18n.t('council.inscription.title'),I18n.t('council.inscription.story'));return;}
 if(c.type==='slayerLoot'){const o=c.object;if(hasFlag(o.id)||!relicUnlocked(o))return;flags[1].push(o.id);persist();updateHUD();burst(o.x,o.y-40,'#ecd3a0',24);story('text.a.gift.from.a.hidden.path',o.name,'inventory.description.'+o.id);return;}
 if(c.type==='councilKey'){flags[1].push('councilKey');persist();updateHUD();burst(c.object.x,c.object.y-40,'#f0dab1',24);toast(I18n.t('council.key.acquired'));return;}
 if(c.type==='checkpoint'){checkpoint={...c.rest};player.hp=player.maxHp;respawnEnemies();if(!boss.dead)resetBossBattle();if(!visitedRests[realm].includes(c.rest.id))visitedRests[realm].push(c.rest.id);persist();updateHUD();burst(c.rest.x,c.rest.y-35,realms[realm].gold,18);toast(I18n.t("text.health.restored.enemies.have.respawned.u.train"));tone(440,.3);}
 if(c.type==='relic'){const o=c.object;if(hasFlag(o.id)||!relicUnlocked(o))return;flags[realm].push(o.id);persist();updateHUD();burst(o.x,o.y-55,o.id==='angelHalo'?'#ffe29a':'#d58cf3',28);story(I18n.t("text.ancient.relic"),o.name,o.id==='angelHalo'?I18n.t("text.the.broken.halo.s.faint.light.curls.around.the"):I18n.t("text.the.horn.feels.cold.yet.embers.pulse.within.it"));}
 if(c.type==='ability'){if(!abilities[realm]){abilities[realm]=true;persist();updateHUD();story(I18n.t("text.new.ability"),level.ability.name,realm===0?I18n.t("story.space.jump.release.it.and.press.it.again.in"):I18n.t("story.k.spirit.dash.you.are.briefly.invulnerable.and.can"));}else story(I18n.t("text.haru.s.memory"),I18n.t("text.we.always.find.our.way.home"),I18n.t("text.if.you.lose.your.way.seek.the.shrines.light"));}
 if(['bell','rescue','memory'].includes(c.type)){const o=c.object;if(o.group&&enemies.some(e=>e.group===o.group&&!e.dead)){toast(I18n.t("text.the.soul.s.captors.are.still.alive.defeat.them"));return;}flags[realm].push(o.id);shards+=o.type==='memory'?8:5;if(o.type==='memory')player.hp=player.maxHp;persist();updateHUD();burst(o.x,o.y-70,realms[realm].gold,28);tone(660,.6);const text=o.type==='bell'?(hasFlag('forestBell')&&hasFlag('villageBell')?I18n.t("text.the.two.bells.ring.together.the.bamboo.temple.s"): I18n.t("text.the.bell.echoes.through.the.forest.another.may.answer")):o.type==='rescue'?(hasFlag('soulUpper')&&hasFlag('soulLower')?I18n.t("text.the.two.freed.souls.have.broken.the.abyss.seal"):I18n.t("text.the.soul.thanks.you.the.other.captive.awaits.deeper")):I18n.t("text.an.old.memory.of.haru.warms.the.amulet.you");story(o.type==='memory'?I18n.t("text.a.gift.from.a.hidden.path"):I18n.t("text.the.path.answers"),o.name,text);}
 if(c.type==='portal'){if(!defeated[realm])toast(I18n.t("text.the.guardian.s.oath.seals.this.passage"));else{const n=realm+1;enterRealm(n);persist();story(realms[n].label,realms[n].name,realms[n].intro);}}
 if(c.type==='father')ShadowRealm.enter();}
