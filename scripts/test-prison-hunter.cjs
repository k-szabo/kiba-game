'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
function setup(){
 const h=harness();
 h.run("Prologue.stop();abilities=[false,false];defeated=[true,true,true,false];flags=[['forestBell','villageBell'],['soulUpper','soulLower'],['dawnSeal','shadowEntered'],['guardian:cultJailer','prisonOpen']];visitedRests=levels.map(map=>map.rests.map(rest=>rest.id));progression=freshProgression();enterRealm(3);CampQuest.enter('shadowPrison');state='play';boss.dead=true;enemies=[PrisonHunter.create(level.enemies.find(PrisonHunter.is))];var hunter=enemies[0];initPlayer({x:hunter.x+145,y:hunter.arena.y});player.inv=999;hunter.active=true;");return h;
}
const advance=(h,seconds,fps=120)=>h.run('for(let n=0;n<'+Math.ceil(seconds*fps)+';n++)PrisonHunter.update(hunter,'+1/fps+');');
for(const fps of [30,60,120]){
 const h=setup();h.run('hunter.clock=0;player.inv=0;');advance(h,1/fps,fps);
 assert.equal(h.run('hunter.phase'),'windup');assert.equal(h.run('hunter.move'),'spearThrust');
 const lock=h.run('JSON.stringify([hunter.x,hunter.targetX,hunter.targetY,hunter.attackFace,hunter.attackBox])');
 advance(h,.65,fps);assert.equal(h.run('player.hp'),5,'No spear damage during warning');
 h.run('player.x=hunter.x-300;');advance(h,.05,fps);
 assert.equal(h.run('JSON.stringify([hunter.x,hunter.targetX,hunter.targetY,hunter.attackFace,hunter.attackBox])'),lock,'Warned spear box never tracks the player');
 advance(h,.3,fps);assert.equal(h.run('player.hp'),5,'Leaving the warned side avoids the spear');
 const hit=setup();hit.run('hunter.clock=0;player.inv=0;');advance(hit,1.05,fps);assert.equal(hit.run('player.hp'),3,'Spear deals two damage after its warning at'+fps+'FPS');advance(hit,.15,fps);assert.equal(hit.run('player.hp'),3,'One strike hits once');
}
for(const hp of [140,70]){
 const h=setup();h.run('player.x=4200;hunter.clock=0;hunter.hp='+hp+';');advance(h,.01);
 assert.equal(h.run('hunter.move'),'bowVolley','At range, the hunter opens with his bow');
 const lock=h.run('JSON.stringify([hunter.x,hunter.targetX,hunter.targetY,hunter.attackFace])');h.run('player.x=hunter.x-250;');advance(h,.85);
 assert.equal(h.run('projectiles.length'),0,'The bow cannot release before its one-second tell');assert.equal(h.run('JSON.stringify([hunter.x,hunter.targetX,hunter.targetY,hunter.attackFace])'),lock);
 advance(h,.25);assert.equal(h.run('projectiles.length'),hp<=70?5:3);assert(h.run("projectiles.every(shot=>shot.source==='mini:prisonHunter'&&shot.kind==='arrow'&&shot.damage===2&&shot.vx>0)"),'Released arrows follow the locked eastern aim');
 advance(h,.5);assert.equal(h.run('hunter.phase'),'recover');const x=h.run('hunter.x');advance(h,.1);assert(h.run('hunter.x')<=x,'Recovery backstep retreats away from the committed aim');
}
for(const state of ['pause','dialog','inventory','developer','map']){
 const h=setup();h.run("hunter.clock=0;PrisonHunter.update(hunter,.01);state='"+state+"';");const before=h.run('JSON.stringify([hunter,player,projectiles])');advance(h,2);assert.equal(h.run('JSON.stringify([hunter,player,projectiles])'),before,'All hunter clocks freeze in '+state);
}
{
 const h=setup();h.run("player.x=4200;hunter.clock=0;projectiles.push({source:'other',life:3});");advance(h,1.1);assert(h.run("projectiles.some(shot=>shot.source==='mini:prisonHunter')"));
 h.run('player.x=100;PrisonHunter.update(hunter,.1);');assert.equal(h.run('hunter.active'),false);assert.equal(h.run('hunter.hp'),140);assert(h.run("projectiles.some(shot=>shot.source==='other')"));assert(!h.run("projectiles.some(shot=>shot.source==='mini:prisonHunter')"));
 const stale=setup();stale.run('hunter.clock=0;PrisonHunter.update(hunter,.01);enemies=[];');const before=stale.run('JSON.stringify([hunter,player,projectiles])');advance(stale,2);assert.equal(stale.run('JSON.stringify([hunter,player,projectiles])'),before);assert.equal(stale.run('PrisonHunter.defeat(hunter)'),false);
 const fatal=setup();fatal.run('hunter.clock=0;PrisonHunter.update(hunter,.01);damage=function(){player={...player,hp:5};enemies=[];};');advance(fatal,1);assert.equal(fatal.run('hunter.phase'),'strike');assert.equal(fatal.run('hunter.attackElapsed'),0,'A synchronous death/respawn stops the stale strike immediately');
}
{
 const h=setup();h.run('hunter.hp=0;');const xp=h.run('progression.totalXp'),coins=h.run('coins');assert.equal(h.run('PrisonHunter.defeat(hunter)'),true);assert.equal(h.run('progression.totalXp'),xp+200);assert.equal(h.run('coins'),coins+h.run('Merchant.rewards.miniboss'));assert(h.run("flags[3].includes('guardian:prisonHunter')"));
 assert.equal(h.run('PrisonHunter.defeat(hunter)'),false);h.run('PrisonHunter.reset(hunter);');assert.equal(h.run('hunter.dead'),true);
 h.run('hunter.replay=true;PrisonHunter.reset(hunter);hunter.active=true;hunter.hp=0;');const before=h.run('JSON.stringify([flags,progression,coins])');assert.equal(h.run('PrisonHunter.defeat(hunter)'),false);assert.equal(h.run('JSON.stringify([flags,progression,coins])'),before,'Replays cannot award or unlock the cell');
}
// The shared enemy dispatcher, actual weapon input, respawn and dev replay
// all use the same controller; the lower rest is outside encounter aggro.
{
 const h=setup(),r=h.run;r("enemies=createEnemies();hunter=enemies.find(PrisonHunter.is);initPlayer(level.rests.find(rest=>rest.id==='shadowPrisonDepths'));player.inv=999;");
 assert.equal(r('hunter.maxHp'),140,'Normal createEnemy uses the authored Hunter controller');h.tick(120);assert.equal(r('hunter.active'),false,'The lower resting shrine never activates the Hunter');
 r('initPlayer({x:hunter.x+hunter.w+25,y:hunter.arena.y});player.face=-1;player.inv=999;hunter.active=true;hunter.hp=1;');h.press({action:'attack'});h.tick(40);h.release({action:'attack'});
 assert(r("flags[3].includes('guardian:prisonHunter')&&hunter.dead"),'A real normal attack dispatches Hunter victory');
 const xp=r('progression.totalXp');r('revive();');assert(r('enemies.find(PrisonHunter.is).dead'));assert.equal(r('progression.totalXp'),xp,'Respawn never repeats the reward');
}
{
 const h=harness(),r=h.run,normal=r('JSON.stringify(saved)'),writes=r('window.__saveSnapshots.length');
 r('DevTools.open();');assert(r('DevSession.begin()'));assert(r("DevTeleport.teleport({realm:'shadowPrison',rest:'shadowPrisonDepths'})"));
 const before=r('JSON.stringify([flags,progression,coins])');assert(r("DevBoss.revive({encounter:'prisonHunter'})"));assert(r('enemies.find(PrisonHunter.is).replay&&enemies.find(PrisonHunter.is).active'));
 r('DevTools.close();var replayHunter=enemies.find(PrisonHunter.is);replayHunter.hp=0;killEnemy(replayHunter);');assert.equal(r('JSON.stringify([flags,progression,coins])'),before);
 r('persist();DevSession.end();');assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('window.__saveSnapshots.length'),writes,'Dev Hunter replay leaves the normal save untouched');
}
// The second refuge belongs to realm3 and returns to a canonical main shrine,
// without granting or requiring any optional rescue state.
{
 const h=setup(),r=h.run;assert(!r("CampQuest.enter('shadowDen')"),'The priest gates the new refuge');
 r('defeated[3]=true;');assert(r("CampQuest.enter('shadowDen')"));assert.equal(r('realm'),3);assert.equal(r('checkpoint.id'),'shadowDenCamp');assert.doesNotThrow(()=>validate(r('saved')));
 r('initPlayer(level.returnPoint);');assert(r('CampQuest.leave()'));assert.equal(r('level.id'),'shadowRealm');assert.equal(r('checkpoint.id'),'cathedral');assert.equal(r('player.x+player.w/2'),r('shadowDen.returnDestination.x'));
 assert.deepEqual(JSON.parse(r('JSON.stringify(checkpoint)')),JSON.parse(r("JSON.stringify(levels[3].rests.find(rest=>rest.id==='cathedral'))")),'Returned checkpoint is the exact canonical cathedral rest');assert.doesNotThrow(()=>validate(r('saved')));
}
// Actual input+update physics: the new stairwell must work in both directions
// with a single jump, including the slowest supported test frame rate.
for(const fps of [30,60,120]){
 const h=setup(),r=h.run;r('enemies=[];');
 r("var stairDt=1/"+fps+";function stairStep(direction=0,jump=false){keys.clear();pressed.clear();if(direction)keys.add(Bindings.read(direction>0?'moveRight':'moveLeft')[0]);if(jump)pressed.add(Bindings.read('jump')[0]);update(stairDt);player.inv=999;}");
 const stairs=r("platforms.filter(p=>p.id.startsWith('prison-deep-stair-')).map(p=>({...p}))"),floor=r("platforms.find(p=>p.id==='prison-lower-floor')"),upper=r("platforms.find(p=>p.id==='prison-depths-floor')");
 assert.equal(stairs.length,13);r('initPlayer({x:4740,y:2360});player.inv=999;');
 for(const target of [...stairs].reverse().concat(upper)){
  const from=r('platforms.find(p=>p.id===player.support)'),cx=r('player.x+player.w/2');
  const targetX=target.x>cx?target.x+30:target.x+target.w<cx?target.x+target.w-30:Math.min(target.x+target.w-30,Math.max(target.x+30,cx));
  const direction=Math.sign(targetX-cx),launch=direction>0?Math.min(from.x+from.w-30,targetX):Math.max(from.x+30,targetX);
  for(let n=0;n<fps*3&&Math.abs(r('player.x+player.w/2')-launch)>8;n++)r('stairStep('+Math.sign(launch-r('player.x+player.w/2'))+');');
  assert.equal(r('player.support'),from.id,'Walking to the stair lip stays grounded');
  let landed=false;
  for(let n=0;n<fps*2;n++){
   const difference=targetX-r('player.x+player.w/2');r('stairStep('+(Math.abs(difference)>6?Math.sign(difference):0)+','+(n===0)+');');
   if(r('player.onGround&&player.support==='+JSON.stringify(target.id))){landed=true;break;}
  }
  assert(landed,'Single-jump ascent '+from.id+'→'+target.id+' at'+fps+'FPS');
 }
 // Reverse the same physical route by walking over each lip. No teleport,
 // dash, second jump, or per-platform reposition is used after the start.
 for(const target of stairs.concat(floor)){
  const cx=r('player.x+player.w/2'),targetX=target.x>cx?target.x+35:target.x+target.w<cx?target.x+target.w-35:target.x+target.w/2;
  let landed=false;
  for(let n=0;n<fps*4;n++){
   const difference=targetX-r('player.x+player.w/2');r('stairStep('+(Math.abs(difference)>7?Math.sign(difference):0)+');');
   if(r('player.onGround&&player.support==='+JSON.stringify(target.id))){landed=true;break;}
  }
  assert(landed,'Walking descent to '+target.id+' at'+fps+'FPS');
 }
 assert(r('player.onGround&&player.y+player.h===2360'));
}
console.log('PASS: Hunter locked spear/bow warnings, timed damage/dodging, ranged opener, retreat, pause, stale/fatal guards, one-time rewards/replays and actual single-jump lower prison ascent/descent at30/60/120FPS.');
