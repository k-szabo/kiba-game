/* Adventure HUD and encounter display. */
'use strict';

function updateHUD(){
 if(!player)return;
 if(typeof TowerMode!=='undefined'&&TowerMode.hud())return;
 Dawnblade.hud();
 FiaConflict.statusHUD();
 $('game').classList[!Prologue.active&&bossStarted&&!boss?.dead?'add':'remove']('encounter-active');
 $('coinPurse').hidden=Prologue.active;
 if(Prologue.active){
  Compass.update();
  Prologue.hud();
  return;
 }
 $('questLabel').textContent=I18n.t(DragonRaid.active()?'fia.dragon.quest':'quest.label');
 const current=realm===0?(player.y>1150?I18n.t("energy.faint"):I18n.t("energy.nourishing")):(realm===1||realm===3)?I18n.t("energy.distorted"):level.winds.some(w=>overlap(player,w))?I18n.t("energy.powerful"):I18n.t("energy.pure");
 $('kibaCurrent').textContent=I18n.t(current);
 $('realmLabel').textContent=I18n.t(level===forestCamp?'camp.name':CampQuest.isSide()?level.name:realms[realm].label);
 CampHealth.render($('health'),player.hp,player.maxHp);
 $('coinCount').textContent=coins;
 $('coinPurse').setAttribute('aria-label',I18n.t('merchant.coins')+': '+coins);
 $('campExecutionWarning').hidden=true;
 $('dashHint').hidden=!abilities[1];
 $('jumpHint').textContent=I18n.t(abilities[0]?I18n.t("text.twice.double.jump"):I18n.t("text.jump.4e09c3"));
 $('dropHint').hidden=realm===0;
 updateProgressHUD();
 const objective=nextObjective();
 $('objective').textContent=keyedInstruction(I18n.t(objective.text));
 Compass.update(objective);
 if(SkyDragonRaid.hud()||StoryRaid.hud()||ThirdClan.hud()||WatchtowerBalloon.hud()||
  FloatingIslands.hud()||ZigguratDescent.hud()||FiaRitual.hud()||VoidEncounter.hud()||
  DragonRaid.hud()||HannahEncounter.hud()||FiaConflict.hud()||DungeonRun.hud()||ArenaChallenge.hud())return;
 updateCampMasterHUD();
}

function updateCampMasterHUD(){
 if(level.ziggurat)$('bossHud').hidden=true;
 if(level!==samuraiCamp)return;
 const master=enemies.find(CampMaster.is),active=master&&!master.dead&&master.active;
 $('bossHud').hidden=!active;
 if(!active)return;
 $('bossName').textContent=I18n.t('camp.rescue.boss');
 const danger=master.executionStarted&&!master.executionResolved;
 $('campExecutionWarning').hidden=!danger;
 if(danger){
  const warning=I18n.format('camp.master.execution.warning',[Math.ceil(master.executionRemaining)]);
  if($('campExecutionWarning').textContent!==warning)$('campExecutionWarning').textContent=warning;
 }
 $('bossHealth').style.width=Math.max(0,master.hp/master.maxHp)*100+'%';
}
