'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),harness=require('./test-harness.cjs');
const types=['cultTempleGuard','woundedAngel','cultHighPriestess'];
function setup(index){
 const h=harness(),r=h.run,id='cultDungeon'+(index+1);
 r('DevTools.open();DevSession.begin();DevTeleport.teleport({realm:'+JSON.stringify(id)+',rest:'+JSON.stringify(id+'Shrine')+'});DevTools.close();initPlayer({x:level.arena.x+550,y:level.arena.y});enemies=enemies.filter(DungeonCombat.is);var cultBoss=enemies[0];cultBoss.active=true;player.inv=999;');return h;
}
const advance=(h,seconds,fps=120)=>h.run('for(let i=0;i<'+Math.ceil(seconds*fps)+';i++)DungeonCombat.update(cultBoss,'+1/fps+');');
for(const fps of [30,60,120])for(let index=0;index<3;index++){
 const moves=setup(index).run('DungeonCombat.profiles['+JSON.stringify(types[index])+'].moves');
 for(let cycle=0;cycle<moves.length;cycle++){
  const h=setup(index),r=h.run;r('cultBoss.cycles='+cycle+';cultBoss.clock=0;');advance(h,1/fps,fps);assert.equal(r('cultBoss.phase'),'windup');assert(r('cultBoss.windupDuration>=1'));
  const lock=r('JSON.stringify([cultBoss.targetX,cultBoss.targetY,cultBoss.attackFace,cultBoss.attackBoxes,cultBoss.moveDamage,cultBoss.moveRage])');
  r('player.x+=140;cultBoss.hp=cultBoss.maxHp*.15;');advance(h,.2,fps);assert.equal(r('JSON.stringify([cultBoss.targetX,cultBoss.targetY,cultBoss.attackFace,cultBoss.attackBoxes,cultBoss.moveDamage,cultBoss.moveRage])'),lock,'Warning remains committed after damage or a dodge');
  for(const mode of ['pause','dialog','inventory','map','developer','dungeonMenu']){r('state='+JSON.stringify(mode));const before=r('JSON.stringify([cultBoss,player,projectiles])');advance(h,.3,fps);assert.equal(r('JSON.stringify([cultBoss,player,projectiles])'),before);}r('state="play";');advance(h,1.7,fps);
  assert(r('cultBoss.phase!=="windup"'));assert(r('projectiles.every(p=>p.source===DungeonCombat.source(cultBoss)&&p.life>0)'));
 }
}
{
 const h=setup(0),r=h.run;r('player.x=cultBoss.x-50;cultBoss.face=-1;var box={x:cultBoss.x-20,y:cultBoss.y-10,w:cultBoss.w+40,h:cultBoss.h+20};');
 assert.equal(r('DungeonCombat.hit(cultBoss,box,10,"normal")'),3);r('cultBoss.inv=0;');assert.equal(r('DungeonCombat.hit(cultBoss,box,10,"heavy")'),10);assert(r('cultBoss.guardBreak>0'));
 r('cultBoss.inv=0;cultBoss.guardBreak=0;cultBoss.phase="recover";');assert.equal(r('DungeonCombat.hit(cultBoss,box,10,"normal")'),10,'A recovery opening is not shielded');
 r('cultBoss.inv=0;cultBoss.phase="wait";player.x=cultBoss.x+cultBoss.w+20;');assert.equal(r('DungeonCombat.hit(cultBoss,box,10,"normal")'),10,'The shield does not cover the back');
}
{
 const h=setup(1),r=h.run;
 r('cultBoss.clock=99;var originalX=cultBoss.x;');advance(h,.1);const calm=r('Math.abs(cultBoss.x-originalX)');
 r('cultBoss.x=originalX;cultBoss.hp=cultBoss.maxHp*.1;');advance(h,.1);assert(r('Math.abs(cultBoss.x-originalX)')>calm,'The wounded angel pursues faster at low HP');
 r('cultBoss.cycles=1;cultBoss.clock=0;');advance(h,.01);assert.equal(r('cultBoss.moveDamage'),3);advance(h,1.3);assert.equal(r('projectiles.filter(p=>p.kind==="holyArrow").length'),5);
}
// CULT-QA-004: real priestess portals create owned fanatics; chant changes the
// preserved base damage2 ->3 ->2 and speed, without a permanent stat mutation.
for(const fps of [30,60,120]){
 const h=setup(2),r=h.run;r('cultBoss.cycles=0;cultBoss.clock=0;');advance(h,1.5,fps);r('DungeonRun.update(.81);var fanatic=enemies.find(e=>e.dungeonSummon);');assert(r('!!fanatic'));assert.equal(r('fanatic.factionOverride'),'shadowCult');assert.equal(r('fanatic.noReward'),true);
 r('fanatic.cd=999;player.x=level.arena.x+level.arena.w/2;DungeonRun.updateEnemy(fanatic,.01);');const base=r('fanatic.summonBaseDamage'),calmSpeed=r('Math.abs(fanatic.walkSpeed)');assert.equal(base,2);assert(calmSpeed>0);
 r('cultBoss.chantRemaining=6;DungeonRun.updateEnemy(fanatic,.01);');assert.equal(r('fanatic.damageValue'),base*1.5);assert(Math.abs(r('Math.abs(fanatic.walkSpeed)')/calmSpeed-1.35)<1e-6);
 r('state="pause";');const frozen=r('JSON.stringify([cultBoss,fanatic])');advance(h,2,fps);r('DungeonRun.updateEnemy(fanatic,2);');assert.equal(r('JSON.stringify([cultBoss,fanatic])'),frozen);
 r('state="play";cultBoss.clock=999;cultBoss.phase="wait";cultBoss.chantRemaining=.02;');advance(h,.05,fps);r('DungeonRun.updateEnemy(fanatic,.01);');assert.equal(r('fanatic.damageValue'),base);assert.equal(r('fanatic.chantBuff'),false);
 r('cultBoss.chantRemaining=6;DungeonCombat.reset(cultBoss);');assert.equal(r('cultBoss.chantRemaining'),0);r('DungeonRun.update(.01);');assert.equal(r('fanatic.dead'),true);
}
// CULT-QA-003: actual dev controls reuse approved bilingual names and revive
// the correct replay without completing a run or writing normal progress.
const locales=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/i18n/locales.json'),'utf8'));
for(let index=0;index<3;index++){
 const h=setup(index),r=h.run;h.sandbox.qaLocales=locales;r('DevTools.open();');
 const find=node=>node.id==='dev-boss-revive-encounter'?node:(node.children||[]).map(find).find(Boolean);
 for(const language of ['hu','en']){
  r('I18n.t=key=>qaLocales['+JSON.stringify(language)+'].dict[key]??key;DevTools.refresh();');const selector=find(h.elements.get('devToolsList')),option=selector.children.find(option=>option.value===types[index]);assert(option);assert.equal(option.textContent,locales[language].dict[r('cultBoss.name')]);
 }
 const before=r('JSON.stringify([flags,progression,coins,saved,window.__saveSnapshots.length])');assert(r('DevBoss.revive({encounter:'+JSON.stringify(types[index])+'})'));r('DevTools.close();var replay=enemies.find(DungeonCombat.is);replay.hp=0;killEnemy(replay);');h.dismiss();assert.equal(r('replay.replay'),true);assert.equal(r('JSON.stringify([flags,progression,coins,saved,window.__saveSnapshots.length])'),before);
}
console.log('PASS: three sect movesets, locked rage/tells, shield openings, temporary damage/speed chants, owner cleanup, bilingual dev selectors and reward-free replay at30/60/120FPS.');
