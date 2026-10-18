const fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
function setup(){
 const h=harness();h.run(`Prologue.stop();abilities=[true,true];defeated=[true,true,true,false];
 flags=[['forestBell','villageBell'],['soulUpper','soulLower'],['dawnSeal','shadowEntered'],[]];
 visitedRests=levels.map(map=>map.rests.map(rest=>rest.id));progression=freshProgression();
 enterRealm(3);state='play';`);return h;
}
// Finding Haru continues the story, without clearing any earlier progression.
{
 const h=setup(),r=h.run;r("enterRealm(2);initPlayer(level.father);flags[2]=['dawnSeal'];");
 const before=r('JSON.stringify([abilities,flags.slice(0,2),progression])');r('interact();');
 assert.equal(r('realm'),3);assert(r("flags[2].includes('shadowEntered')"));
 assert.equal(r('state'),'dialog');assert.equal(r('saved.won'),false);
 assert.equal(r('JSON.stringify([abilities,flags.slice(0,2),progression])'),before);
 assert.doesNotThrow(()=>validate(r('saved')));h.dismiss();
}
// Shrine discovery/resting does not activate the travel altar; lock both ways.
{
 const h=setup(),r=h.run;
 assert(!r("fastTravel(levels[0].rests[0],0)"));
 assert(!r("fastTravel(level.rests[1],3)"));
 r("initPlayer(level.rests[2]);interact();");
 assert(!r("flags[3].includes('shadowAltar')"));
 assert(!r("fastTravel(levels[0].rests[0],0)"));
 r('showMap();');
 assert(!h.elements.get('mapContent').children[0].innerHTML.includes('shadow.name térképe'),'The SVG accessible label must not concatenate an untranslated key');
 assert(h.elements.get('mapContent').children[0].innerHTML.includes('aria-label="'+r("I18n.t('shadow.name')")+'"'));
 assert(r("travelGrid(0).children.every(button=>button.disabled)"));r('closeMap();');
 r('initPlayer(level.altar);interact();');assert(r("flags[3].includes('shadowAltar')"));
 assert(r("fastTravel(levels[0].rests[0],0)"));
 assert(r("fastTravel(levels[3].rests[0],3)"));
 assert.doesNotThrow(()=>validate(r('saved')));
}
// Jailer key drops once, is consumed once, and remains consumed after death.
{
 const h=setup(),r=h.run;
 r('initPlayer(level.prisonDoor);interact();');assert(!r("flags[3].includes('prisonOpen')"));
 r("var jailer=enemies.find(e=>e.id==='cultJailer');jailer.hp=0;killEnemy(jailer);");
 r("initPlayer(level.objects.find(o=>o.id==='prisonKey'));interact();");
 assert(r("flags[3].includes('prisonKey')"));r('initPlayer(level.prisonDoor);interact();');
 assert(r("flags[3].includes('prisonOpen')&&!flags[3].includes('prisonKey')"));
 r('initPlayer(level.prisonTrace);interact();');assert(r("flags[3].includes('prisonTrace')"));
 r('revive();');assert(r("enemies.find(e=>e.id==='cultJailer').dead"));
 r("initPlayer(level.objects.find(o=>o.id==='prisonKey'));interact();");assert(!r("flags[3].includes('prisonKey')"));
 r('persist();');assert.doesNotThrow(()=>validate(r('saved')));
}
// Optional organist never appears on the main route; victory is permanent.
{
 const h=setup(),r=h.run;
 r("var organ=enemies.find(e=>e.id==='madOrganist');updateMiniboss(organ,.1);");assert(!r('organ.active'));
 r("initPlayer({x:2800,y:420});updateMiniboss(organ,.1);");assert(r('organ.active'));
 r("organ.hp=0;killEnemy(organ);initPlayer(level.objects.find(o=>o.id==='corruptedHymn'));interact();");
 assert(r("flags[3].includes('corruptedHymn')"));const xp=r('progression.totalXp');
 r('revive();');assert(r("enemies.find(e=>e.id==='madOrganist').dead"));assert.equal(r('progression.totalXp'),xp);
}
// Bell: committed tell, dodgeable circle, exactly two HP drained, capped healing.
for(const fps of [30,60,120]){
 const h=setup(),r=h.run;
 r("initPlayer({x:10000,y:1200});player.inv=0;bossStarted=true;boss.hp=100;boss.move='bell';boss.targetX=player.x+player.w/2;setBossPhase('windup',.01);");
 r('ShadowRealm.updateBoss(.02);');assert(r('player.stun>0'));
 r("keys.add('d');pressed.add(' ');pressed.add('k');input(.05);");assert.equal(r('player.vx'),0);assert.equal(r('dash'),0);
 const stun=r('player.stun');r('state="pause";update(.2);');assert.equal(r('player.stun'),stun);r('state="play";');
 const before=r('player.hp');r(`for(let i=0;i<${fps};i++){updatePlayerTimers(1/${fps});ShadowRealm.updateBoss(1/${fps});}`);
 assert.equal(r('player.hp'),before-2);assert.equal(r('boss.hp'),106);assert.equal(r('player.stun'),0);
 r('ShadowRealm.updateBoss(.1);');assert.equal(r('player.hp'),before-2,'Drain cannot hit twice');
}
for(const escape of ["player.x+=300;","dash=.2;","player.y-=220;"]){
 const h=setup(),r=h.run;r("initPlayer({x:10000,y:1200});player.inv=0;bossStarted=true;boss.move='bell';boss.targetX=player.x+player.w/2;setBossPhase('windup',.01);");
 r(escape);r('ShadowRealm.updateBoss(.02);');assert.equal(r('player.stun'),0);
}
{
 const h=setup(),r=h.run;r("bossStarted=true;boss.move='bell';setBossPhase('windup',1);attackKind='heavy';boss.inv=0;hitBoss(1);");
 assert.equal(r('boss.phase'),'recover','A heavy hit interrupts the committed bell tell');
 r('boss.hp=0;guardianDefeated();');assert(r("defeated[3]&&flags[3].includes('madPriestSoul')"));
 assert.equal(r('progression.totalXp'),800);assert.equal(r('progression.points'),r('progression.level'));
 assert.doesNotThrow(()=>validate(r('saved')));const once=r('JSON.stringify([flags,progression])');
 r('guardianDefeated();');assert.equal(r('JSON.stringify([flags,progression])'),once);
}
// QA-SHADOW-001 r1: lethal hazards detach the old entity on respawn. Its
// expired windup must not cast into the new encounter's projectile array.
for(const fps of [30,60,120])for(const lethal of [true,false]){
 const h=setup(),r=h.run;
 r(`initPlayer({x:2800,y:420});player.inv=0;player.hp=${lethal?1:5};
 var oldOrgan=enemies.find(e=>e.id==='madOrganist');oldOrgan.active=true;
 oldOrgan.phase='windup';oldOrgan.clock=.001;oldOrgan.move='organFan';
 oldOrgan.hazards=[{x:player.x,y:player.y,w:player.w,h:player.h,warning:0,life:2}];
 ShadowRealm.updateMini(oldOrgan,1/${fps});`);
 if(lethal){
  assert(!r('enemies.includes(oldOrgan)'));
  assert.equal(r('projectiles.length'),0,'A detached organist cannot cast after lethal hazard respawn');
  assert(!r("enemies.find(e=>e.id==='madOrganist').active"));
 }else{
  assert(r('enemies.includes(oldOrgan)'));assert.equal(r('projectiles.length'),7,'Nonfatal damage must preserve the current organist cast');
 }
}
{
 const h=setup(),r=h.run;
 r(`initPlayer({x:10000,y:1200});player.inv=0;player.hp=1;bossStarted=true;
 var oldPriest=boss;boss.phase='windup';boss.clock=.001;boss.move='bolts';
 boss.hazards=[{x:player.x,y:player.y,w:player.w,h:player.h,warning:0,life:2}];
 ShadowRealm.updateBoss(.02);`);
 assert(r('boss!==oldPriest'));assert.equal(r('projectiles.length'),0);assert(!r('bossStarted'));
}
console.log('PASS: fourth-realm story entry, altar travel lock, permanent rewards, bell mechanics at 30/60/120 FPS, pause and no stale post-respawn encounter attacks (QA-SHADOW-001 r1).');

const menu=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').split('<div class="menu-bottom">')[1].split('<div class="language-picker">')[0];
assert(!/JAPÁN|YOMI|TAKAMAGAHARA|ÁRNYÉKVILÁG/.test(menu),'The main menu must not reveal the realm route');
