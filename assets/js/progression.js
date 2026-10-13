/* Persistent XP and shrine training. The save key remains compatible with v0.2/0.3. */
'use strict';
const STAT_LIMIT = 8, LEVEL_LIMIT = 12;
let progression = freshProgression();
function freshProgression() {return {level:1,xp:0,totalXp:0,points:0,stats:{vitality:0,strength:0,spirit:0}};}
function xpForLevel(n) {return 60+(n-1)*35;}
function normalizeProgression(data) {
  const out=freshProgression(),integer=(n,lo,hi)=>Number.isFinite(n)?Math.max(lo,Math.min(hi,Math.floor(n))):lo;
  if(!data||typeof data!=='object')return out;
  out.level=integer(data.level,1,LEVEL_LIMIT);
  let budget=out.level-1;
  for(const key of Object.keys(out.stats)){out.stats[key]=integer(data.stats?.[key],0,Math.min(STAT_LIMIT,budget));budget-=out.stats[key];}
  out.points=budget;
  out.xp=out.level===LEVEL_LIMIT?0:integer(data.xp,0,xpForLevel(out.level)-1);
  out.totalXp=integer(data.totalXp,0,10000000);
  return out;
}
function kibaStats() {
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
  if(gained){burst(player.x+player.w/2,player.y+25,'#ffe59a',35);tone(880,.5);toast(`Szintlépés! Kiba ${progression.level}. szintű · ${progression.points} fejlesztéspont. A szentélynél U: fejlesztés.`);}
  updateProgressHUD();persist();
}
function updateProgressHUD() {
  $('levelLabel').textContent=`${progression.level}. szint`;
  $('xpLabel').textContent=progression.level===LEVEL_LIMIT?'MAX':`${progression.xp} / ${xpForLevel(progression.level)} XP`;
  $('xpFill').style.width=`${progression.level===LEVEL_LIMIT?100:progression.xp/xpForLevel(progression.level)*100}%`;
  $('trainButton').textContent=progression.points?`Fejlesztés (${progression.points})`:'Fejlesztés';
}
function trainingRest() {return level.rests.find(r=>pointNear(r,100,85));}
function showTraining() {
  if(state!=='play')return;
  if(!trainingRest()){toast('Fejleszteni a pihenőszentélynél tudsz. Lépj mellé, majd nyomj U-t.');return;}
  if(bossStarted&&!boss.dead){toast('Az őrző harca alatt nincs idő fejlesztésre.');return;}
  state='training';keys.clear();pressed.clear();$('training').hidden=false;refreshTraining();$('closeTraining').focus();
}
function refreshTraining() {
  $('trainingPoints').textContent=`${progression.level}. szint · ${progression.points} elkölthető pont`;
  const s=kibaStats();
  $('vitalityValue').textContent=`${s.maxHp} életerő`;
  $('strengthValue').textContent=`${s.damage} kardsebzés`;
  $('spiritValue').textContent=abilities[1]?`${s.dashCooldown.toFixed(2)} mp szellemlépés-várakozás`:'Előbb szerezd meg a szellemlépést Yomiban';
  for(const key of ['vitality','strength','spirit']){
    const locked=key==='spirit'&&!abilities[1];
    $('train-'+key).disabled=locked||progression.points<=0||progression.stats[key]>=STAT_LIMIT;
    $('train-'+key).textContent=locked?'Képesség szükséges':progression.stats[key]>=STAT_LIMIT?'Maximális':'+1 pont';
  }
}
function spendPoint(key) {
  if(state!=='training'||!trainingRest()||!Object.hasOwn(progression.stats,key)||key==='spirit'&&!abilities[1]||progression.points<=0||progression.stats[key]>=STAT_LIMIT)return false;
  progression.stats[key]++;progression.points--;
  const oldMax=player.maxHp;player.maxHp=kibaStats().maxHp;player.hp=Math.min(player.maxHp,player.hp+player.maxHp-oldMax);
  persist();updateHUD();refreshTraining();tone(660,.15);return true;
}
function closeTraining() {if(state!=='training')return;$('training').hidden=true;state='play';pressed.clear();}
