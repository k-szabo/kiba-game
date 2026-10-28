/* Persistent XP and shrine training within the current release. */
'use strict';
const STAT_LIMIT=PROGRESSION_RULES.statLimit,LEVEL_LIMIT=PROGRESSION_RULES.levelLimit;
let progression = freshProgression();
// A transient cue, separate from saved progression and ordinary particles.
const LevelUpEffect=(()=>{
  const duration=1.6;
  let remaining=0;
  function clear(){remaining=0;}
  function start(){if(player&&state==='play'&&!Prologue.active)remaining=duration;}
  function update(dt){if(state==='play'&&Number.isFinite(dt)&&dt>0)remaining=Math.max(0,remaining-dt);}
  return Object.freeze({start,update,clear,duration,get remaining(){return remaining;},get progress(){return 1-remaining/duration;}});
})();
function freshProgression() {return {level:1,xp:0,totalXp:0,points:0,stats:{vitality:0,strength:0,spirit:0,shield:0}};}
function xpForLevel(n) {return PROGRESSION_RULES.xpForLevel(n);}
function normalizeProgression(data,worldFlags=[]) {
  const out=freshProgression(),integer=(n,lo,hi)=>Number.isFinite(n)?Math.max(lo,Math.min(hi,Math.floor(n))):lo;
  if(!data||typeof data!=='object')return out;
  out.level=integer(data.level,1,LEVEL_LIMIT);
  let budget=out.level-1+bossBonusPoints(worldFlags);
  for(const key of Object.keys(out.stats)){out.stats[key]=key==='shield'&&!worldFlags[3]?.includes('kibaShield')?0:integer(data.stats?.[key],0,Math.min(PROGRESSION_RULES.statLimitFor(key),budget));budget-=out.stats[key];}
  out.points=budget;
  out.xp=out.level===LEVEL_LIMIT?0:integer(data.xp,0,xpForLevel(out.level)-1);
  out.totalXp=integer(data.totalXp,0,Number.MAX_SAFE_INTEGER);
  return out;
}
function momoStats() {
  const forge=typeof campServices==='undefined'?null:campServices,boost=DungeonRules.bonus(dungeonState);
  return {maxHp:5+progression.stats.vitality+WeaponStyles.profile(weaponStyle).health,damage:(defeated[1]?3:2)+progression.stats.strength*.5+(forge?.weaponRank??0)*CampServiceRules.profile.weaponStep+boost.damage,armor:(forge?.armorRank??0)*CampServiceRules.profile.armorStep+SerpentRelics.armorBonus()+boost.armor,
    dashCooldown:Math.max(.38,.8-progression.stats.spirit*.06)*boost.dashMultiplier,invulnerability:1.25+progression.stats.spirit*.05};
}
function awardXP(amount) {
  if(!Number.isSafeInteger(amount)||amount<=0)return;
  const earned=Math.min(amount,Number.MAX_SAFE_INTEGER-progression.totalXp);
  if(!earned)return;
  progression.totalXp+=earned;
  if(progression.level<LEVEL_LIMIT)progression.xp+=earned;
  let gained=0;
  while(progression.level<LEVEL_LIMIT&&progression.xp>=xpForLevel(progression.level)){
    progression.xp-=xpForLevel(progression.level);progression.level++;progression.points++;gained++;
  }
  if(progression.level===LEVEL_LIMIT)progression.xp=0;
  if(gained){player.hp=player.maxHp;LevelUpEffect.start();tone(880,.5);toast(I18n.format("message.level.up.momo.is.level.arg0.arg1.training.points",[progression.level,progression.points]));}
  if(gained)updateHUD();else updateProgressHUD();persist();
}
function updateProgressHUD() {
  $('levelLabel').textContent=I18n.format("message.level.arg0",[progression.level]);
  $('xpLabel').textContent=I18n.t(progression.level===LEVEL_LIMIT?'MAX':`${progression.xp} / ${xpForLevel(progression.level)} XP`);
  $('xpFill').style.width=`${progression.level===LEVEL_LIMIT?100:progression.xp/xpForLevel(progression.level)*100}%`;
  $('trainButton').textContent=I18n.t(progression.points?I18n.format("message.training.arg0",[progression.points]):I18n.t("text.training"));
}
function trainingRest() {return level.rests.find(r=>pointNear(r,100,85));}
function showTraining() {
  if(FiaConflict.blocked())return false;
  if(state!=='play'||Prologue.active)return;
  if(!trainingRest()){toast(I18n.t("text.train.at.a.resting.shrine.stand.beside.it.and"));return;}
  if(bossStarted&&!boss.dead){toast(I18n.t("text.you.cannot.train.during.a.guardian.battle"));return;}
  state='training';keys.clear();pressed.clear();$('training').hidden=false;refreshTraining();$('closeTraining').focus();
}
function refreshTraining() {
  $('trainingPoints').textContent=I18n.format("message.level.arg0.arg1.available.points",[progression.level,progression.points]);
  const s=momoStats();
  $('vitalityValue').textContent=I18n.format("message.arg0.health",[s.maxHp]);
  $('strengthValue').textContent=I18n.format("message.arg0.sword.damage",[s.damage]);
  $('spiritTraining').hidden=!abilities[1];
  if(abilities[1])$('spiritValue').textContent=I18n.format("message.arg0.s.spirit.dash.cooldown",[s.dashCooldown.toFixed(2)]);
  const shield=FiaConflict.profile(),owned=FiaConflict.owned();$('shieldTraining').hidden=!owned;$('trainingStats').classList[owned?'add':'remove']('training-with-shield');
  if(owned)$('shieldValue').textContent=I18n.format('ability.kibaShield.training.value',[FiaConflict.number(shield.capacity),FiaConflict.number(shield.recharge)]);
  for(const key of ['vitality','strength','spirit','shield']){
    const locked=key==='spirit'&&!abilities[1]||key==='shield'&&!owned;
    $('train-'+key).disabled=locked||progression.points<=0||progression.stats[key]>=PROGRESSION_RULES.statLimitFor(key);
    $('train-'+key).textContent=I18n.t(locked?I18n.t("text.ability.required"):progression.stats[key]>=PROGRESSION_RULES.statLimitFor(key)?I18n.t("text.maximum"):I18n.t("text.1.point"));
  }
}
function spendPoint(key) {
  if(state!=='training'||!trainingRest()||!Object.hasOwn(progression.stats,key)||key==='spirit'&&!abilities[1]||key==='shield'&&!FiaConflict.owned()||progression.points<=0||progression.stats[key]>=PROGRESSION_RULES.statLimitFor(key))return false;
  progression.stats[key]++;progression.points--;
  const oldMax=player.maxHp;player.maxHp=momoStats().maxHp;player.hp=Math.min(player.maxHp,player.hp+player.maxHp-oldMax);
  FiaConflict.clampProfile();
  persist();updateHUD();refreshTraining();tone(660,.15);return true;
}
function closeTraining() {if(state!=='training')return;$('training').hidden=true;state='play';pressed.clear();}
