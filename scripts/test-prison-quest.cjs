'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
const copy=value=>JSON.parse(JSON.stringify(value));
function setup({opened=false,abilities=[false,false]}={}){
 const h=harness();h.run("Prologue.stop();abilities="+JSON.stringify(abilities)+";defeated=[true,true,true,false];flags=[['forestBell','villageBell'],['soulUpper','soulLower'],['dawnSeal','shadowEntered'],"+JSON.stringify(opened?['guardian:cultJailer','prisonOpen']:[])+"];visitedRests=levels.map(map=>map.rests.map(rest=>rest.id));progression=freshProgression();enterRealm(3);state='play';player.inv=999;");return h;
}
const cleanTimers=h=>assert(h.run('dash===0&&dashCooldown===0&&attack===0&&attackCooldown===0&&jumpBuffer===0&&coyote===0&&dropTimer===0&&player.vx===0&&player.vy===0'),'Location entry resets shared movement/attack state');
{
 const h=setup(),r=h.run;
 assert(!r("CampQuest.enter('shadowPrison')"),'Normal entry requires the original prison lock');assert(r("shadowRealm.enemies.some(e=>e.id==='cultJailer')"));
 r("var outer=enemies.find(e=>e.id==='cultJailer');outer.hp=0;killEnemy(outer);initPlayer(level.objects.find(o=>o.id==='prisonKey'));interact();");assert(r("flags[3].includes('guardian:cultJailer')&&flags[3].includes('prisonKey')"));
 r('initPlayer(level.prisonDoor);interact();');assert.equal(r('level.id'),'shadowRealm');assert(r("flags[3].includes('prisonOpen')&&!flags[3].includes('prisonKey')"));
 assert.equal(r('getContext().type'),'prisonEnter');r('player.hp=2.25;dash=dashCooldown=attack=attackCooldown=jumpBuffer=coyote=dropTimer=.2;player.vx=900;player.vy=-500;interact();');
 assert.equal(r('level.id'),'shadowPrison');assert.equal(r('realm'),3);assert.equal(r('player.hp'),2.25);cleanTimers(h);assert.equal(r('saved.location'),'shadowPrison');assert.equal(r('saved.realm'),3);assert.doesNotThrow(()=>validate(r('saved')));
 r('initPlayer(level.returnPoint);player.hp=1.5;dash=dashCooldown=.2;player.vx=900;player.vy=-500;interact();');
 assert.equal(r('level.id'),'shadowRealm');assert.equal(r('realm'),3);assert.equal(r('player.hp'),1.5);assert.equal(r('player.x+player.w/2'),r('shadowPrison.returnDestination.x'));assert.equal(r('player.y+player.h'),2200);cleanTimers(h);assert.equal(r('defeated[3]'),false);
 assert(r("flags[3].includes('guardian:cultJailer')&&flags[3].includes('prisonOpen')&&!flags[3].includes('prisonKey')"));assert.doesNotThrow(()=>validate(r('saved')));
}
{
 const h=setup({opened:true}),r=h.run;r("CampQuest.enter('shadowPrison');initPlayer(level.zen);");assert.equal(r('getContext().type'),'zenRescue');assert.equal(r('getContext().locked'),true);r('interact()');assert(!r("flags[3].includes('zenRescued')"));
 const stale=r('PrisonQuest.context()');r("initPlayer(level.start);");h.sandbox.staleZen=stale;assert.equal(r('PrisonQuest.interact(staleZen)'),false,'A stale rescue prompt cannot free Zen at distance');
 r("var warden=enemies.find(PrisonWarden.is);initPlayer({x:warden.x-35,y:warden.arena.y});player.inv=999;warden.active=true;warden.hp=1;");h.press({action:'attack'});h.tick(40);h.release({action:'attack'});assert(r("flags[3].includes('guardian:prisonWarden')"),'A real weapon strike defeats the registered Warden');assert.equal(r('state'),'dialog');h.dismiss();
 r('initPlayer(level.zen);interact();');assert(r("flags[3].includes('zenRescued')"));assert.equal(r('state'),'dialog');for(const lang of ['hu','en']){r('I18n.setLocale('+JSON.stringify(lang)+')');assert.equal(h.elements.get('dialogLabel').textContent,r("I18n.t('zen.prison.name')"),'Rescue dialogue names the prison rather than the campfire');}const frozen=r('JSON.stringify([player,enemies,levelTime,time,projectiles])');h.tick(120);assert.equal(r('JSON.stringify([player,enemies,levelTime,time,projectiles])'),frozen,'The rescue dialogue pauses the world');h.dismiss();
 const xp=r('progression.totalXp');r("enemies.find(e=>!e.miniboss).dead=true;revive();");assert.equal(r('level.id'),'shadowPrison');assert(r('enemies.filter(e=>!e.miniboss).every(e=>!e.dead)'));assert(r('enemies.find(PrisonWarden.is).dead'));assert(r("flags[3].includes('zenRescued')"));assert.equal(r('progression.totalXp'),xp);
 r('initPlayer(level.rests[0]);enemies.find(e=>!e.miniboss).dead=true;interact();');assert(r('enemies.filter(e=>!e.miniboss).every(e=>!e.dead)'));assert(r('enemies.find(PrisonWarden.is).dead'));assert.equal(r('PrisonQuest.context()'),null);assert.doesNotThrow(()=>validate(r('saved')));
 const saved=copy(r('saved'));r('mainMenu();startGame(true);');assert.equal(r('level.id'),'shadowPrison');assert.equal(r('checkpoint.id'),saved.checkpoint.id);assert(r('enemies.find(PrisonWarden.is).dead'));assert(r("flags[3].includes('zenRescued')"));
 r("CampQuest.enter('forestCamp');initPlayer(forestCamp.npcs.find(n=>n.id==='zen'));");assert(r("campNPCVisible(forestCamp.npcs.find(n=>n.id==='zen'))"));assert.equal(r('getContext().npc.id'),'zen');r('interact();');assert.equal(r('state'),'dialog');for(const lang of ['hu','en']){r('I18n.setLocale('+JSON.stringify(lang)+')');assert.equal(h.elements.get('dialogLabel').textContent,r("I18n.t('camp.dialogue.label')"),'Refuge dialogue retains the campfire caption');}h.dismiss();assert.equal(r('defeated[3]'),false,'Zen rescue never needs the main priest victory');
}
{
 const h=setup({opened:true}),r=h.run;r("CampQuest.enter('forestCamp');");assert(!r("campNPCVisible(forestCamp.npcs.find(n=>n.id==='zen'))"),'Zen remains absent before rescue');
 r("enterRealm(3);CampQuest.enter('shadowPrison');");assert(!r('defeated[3]'));assert.equal(r('boss.dead'),true,'The prison does not spawn or clear the realm guardian');assert(r('enemies.some(e=>e.undead)&&enemies.some(e=>!e.undead&&!e.miniboss)'),'The prison contains both undead and cultists');
 r('initPlayer(level.returnPoint);interact();');assert.equal(r('level.id'),'shadowRealm');assert(!r('boss.dead'),'The main priest remains available after the optional interior');
}
// Developer arrival is independent of story unlocks; every operation remains in memory.
{
 const h=harness(),r=h.run,normal=r('JSON.stringify(saved)'),writes=r('window.__saveSnapshots.length');
 r('DevTools.open();');assert(r('DevSession.begin()'));assert(r("DevTeleport.teleport({realm:'shadowPrison',rest:'shadowPrisonCourt'})"));assert.equal(r('level.id'),'shadowPrison');assert.equal(r('realm'),3);assert.equal(r('checkpoint.id'),'shadowPrisonCourt');assert(!r('defeated[3]'));cleanTimers(h);
 const flags=r('JSON.stringify(flags)'),xp=r('progression.totalXp'),coins=r('coins');assert(r("DevBoss.revive({encounter:'prisonWarden'})"));assert(r('enemies.find(PrisonWarden.is).active'));assert(r('enemies.find(PrisonWarden.is).replay'));r('DevTools.close();enemies.find(PrisonWarden.is).hp=0;killEnemy(enemies.find(PrisonWarden.is));');assert.equal(r('JSON.stringify(flags)'),flags);assert.equal(r('progression.totalXp'),xp);assert.equal(r('coins'),coins);
 r('persist();DevSession.end();');assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('window.__saveSnapshots.length'),writes);
}
// Full input/update physics on the two floor gaps in both directions; no upgraded jump required.
for(const fps of [30,60,120])for(const abilities of [[false,false],[true,false],[false,true],[true,true]]){
 const h=setup({opened:true,abilities}),r=h.run;r("CampQuest.enter('shadowPrison');enemies=[];boss.dead=true;const prisonDt=1/"+fps+";function prisonStep(direction=0,jump=false){keys.clear();pressed.clear();if(direction)keys.add(Bindings.read(direction>0?'moveRight':'moveLeft')[0]);if(jump)pressed.add(Bindings.read('jump')[0]);update(prisonDt);player.inv=999;}function prisonPlace(id,x){const p=platforms.find(p=>p.id===id);initPlayer({x:x??p.x+p.w/2,y:p.y});player.inv=999;}");
 function cross(from,to,direction){
  r("prisonPlace('"+from+"');");const start=r('platforms.find(p=>p.id==='+JSON.stringify(from)+')'),target=r('platforms.find(p=>p.id==='+JSON.stringify(to)+')');
  const launch=direction>0?start.x+start.w-27:start.x+27;
  for(let i=0;i<fps*10&&Math.abs(r('player.x+player.w/2')-launch)>5;i++)r('prisonStep('+direction+');');
  assert.equal(r('player.support'),from,'Reach the launch lip without falling');
  let landed=false;for(let i=0;i<fps*3;i++){
   const cx=r('player.x+player.w/2'),aim=direction>0?target.x+70:target.x+target.w-240;const move=Math.abs(aim-cx)>7?Math.sign(aim-cx):0;r('prisonStep('+move+','+(i===0)+');');
   if(r('player.onGround&&player.support==='+JSON.stringify(to))){landed=true;break;}
   if(r('player.y>level.height'))break;
  }assert(landed,from+'→'+to+' at'+fps+'FPS abilities'+abilities);
 }
 cross('prison-entry-floor','prison-cell-floor',1);cross('prison-cell-floor','prison-depths-floor',1);cross('prison-depths-floor','prison-cell-floor',-1);cross('prison-cell-floor','prison-entry-floor',-1);
 // The shared dash timer/gravity route must also work in the new side controller.
 r('initPlayer(level.start);player.inv=999;');h.press({action:'dash'});r('update(prisonDt)');h.release({action:'dash'});assert.equal(r('dash>0'),abilities[1]);h.press({action:'jump'});r('update(prisonDt)');h.release({action:'jump'});for(let n=0;n<fps*2;n++)r('prisonStep();');assert.equal(r('dash'),0);assert.equal(r('dashCooldown'),0);assert(r('player.onGround'));assert.equal(r('player.y+player.h'),r('level.start.y'));assert(Math.abs(r('player.vx'))<.01);
}
console.log('PASS: original outer key lock, separate optional prison entry/return, HP/timer resets, Warden/rescue/death/rest/reload persistence, camp Zen, dev teleport/replay isolation and single-jump route/dash physics at30/60/120FPS.');
