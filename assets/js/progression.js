/* Persistent XP and shrine training. Legacy saves are migrated by SaveVault. */
'use strict';
const STAT_LIMIT = 8, LEVEL_LIMIT = 12;
let progression = freshProgression();
function freshProgression() {return {level:1,xp:0,totalXp:0,points:0,stats:{vitality:0,strength:0,spirit:0}};}
function xpForLevel(n) {return 60+(n-1)*35;}
function normalizeProgression(data,worldFlags=[]) {
  const out=freshProgression(),integer=(n,lo,hi)=>Number.isFinite(n)?Math.max(lo,Math.min(hi,Math.floor(n))):lo;
  if(!data||typeof data!=='object')return out;
  out.level=integer(data.level,1,LEVEL_LIMIT);
  let budget=out.level-1+bossBonusPoints(worldFlags);
  for(const key of Object.keys(out.stats)){out.stats[key]=integer(data.stats?.[key],0,Math.min(STAT_LIMIT,budget));budget-=out.stats[key];}
  out.points=budget;
  out.xp=out.level===LEVEL_LIMIT?0:integer(data.xp,0,xpForLevel(out.level)-1);
  out.totalXp=integer(data.totalXp,0,10000000);
  return out;
}
function momoStats() {
  return {maxHp:5+progression.stats.vitality,damage:(defeated[1]?3:2)+progression.stats.strength*.5,
    dashCooldown:Math.max(.38,.8-progression.stats.spirit*.06),invulnerability:1.25+progression.stats.spirit*.05};
}
function awardXP(amount) {
  if(!Number.isFinite(amount)||amount<=0)return;
  progression.totalXp+=amount;
  if(progression.level<LEVEL_LIMIT)progression.xp+=amount;
  let gained=0;
  while(progression.level<LEVEL_LIMIT&&progression.xp>=xpForLevel(progression.level)){
    progression.xp-=xpForLevel(progression.level);progression.level++;progression.points++;gained++;
  }
  if(progression.level===LEVEL_LIMIT)progression.xp=0;
  if(gained){burst(player.x+player.w/2,player.y+25,'#ffe59a',35);tone(880,.5);toast(I18n.format("message.level.up.momo.is.level.arg0.arg1.training.points",[progression.level,progression.points]));}
  updateProgressHUD();persist();
}
function updateProgressHUD() {
  $('levelLabel').textContent=I18n.format("message.level.arg0",[progression.level]);
  $('xpLabel').textContent=I18n.t(progression.level===LEVEL_LIMIT?'MAX':`${progression.xp} / ${xpForLevel(progression.level)} XP`);
  $('xpFill').style.width=`${progression.level===LEVEL_LIMIT?100:progression.xp/xpForLevel(progression.level)*100}%`;
  $('trainButton').textContent=I18n.t(progression.points?I18n.format("message.training.arg0",[progression.points]):I18n.t("text.training"));
}
function trainingRest() {return level.rests.find(r=>pointNear(r,100,85));}
function showTraining() {
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
  for(const key of ['vitality','strength','spirit']){
    const locked=key==='spirit'&&!abilities[1];
    $('train-'+key).disabled=locked||progression.points<=0||progression.stats[key]>=STAT_LIMIT;
    $('train-'+key).textContent=I18n.t(locked?I18n.t("text.ability.required"):progression.stats[key]>=STAT_LIMIT?I18n.t("text.maximum"):I18n.t("text.1.point"));
  }
}
function spendPoint(key) {
  if(state!=='training'||!trainingRest()||!Object.hasOwn(progression.stats,key)||key==='spirit'&&!abilities[1]||progression.points<=0||progression.stats[key]>=STAT_LIMIT)return false;
  progression.stats[key]++;progression.points--;
  const oldMax=player.maxHp;player.maxHp=momoStats().maxHp;player.hp=Math.min(player.maxHp,player.hp+player.maxHp-oldMax);
  persist();updateHUD();refreshTraining();tone(660,.15);return true;
}
function closeTraining() {if(state!=='training')return;$('training').hidden=true;state='play';pressed.clear();}
