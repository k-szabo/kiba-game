'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
function setup(){
 const h=harness(),r=h.run;
 r("Prologue.stop();abilities=[true,true];defeated=[true,true,true,true];flags=[['forestBell','villageBell'],['soulUpper','soulLower'],['dawnSeal','shadowEntered'],['dawnblade']];visitedRests=levels.map(map=>[map.rests[0].id]);progression=freshProgression();progression.stats.vitality=12;progression.stats.strength=4;enterRealm(3);CampQuest.enter('zigguratApproach',{save:false});enemies=[];initPlayer({x:700,y:1000});player.inv=999;state='play';");
 return h;
}
function frames(h,seconds,fps=120){h.run(`for(let i=0;i<${Math.ceil(seconds*fps)};i++)update(${1/fps});`);}
function ultimate(h,fps=120){h.press({action:'ultimate'});frames(h,1/fps,fps);h.release({action:'ultimate'});}

// The ultimate uses base damage, not the equipped style's light/heavy scale.
const damageByStyle=[];
for(const style of ['katana','naginata','swordShield']){
 const h=setup(),r=h.run;
 assert(r('WeaponEquipment.equip('+JSON.stringify(style)+')'));
 r("player.hp=17;var victim=createEnemy({id:'dawnblade-target',x:900,y:1000,kind:'guard',patrol:0});victim.hp=victim.maxHp=10000;victim.stun=999;enemies=[victim];");
 const base=r('momoStats().damage');
 ultimate(h);assert(r('Dawnblade.casting()'));assert.equal(r('Dawnblade.status().cooldown'),60);
 frames(h,.6);
 const dealt=r('10000-victim.hp');damageByStyle.push(dealt);
 assert.equal(dealt,base*8,style+' ultimate deals exactly eight times base damage');
 assert.equal(r('player.hp'),7,style+' pays ten HP despite immunity frames');
 frames(h,.7);assert(!r('Dawnblade.casting()'));assert.equal(r('10000-victim.hp'),dealt,'A cast impacts only once');
}
assert.equal(new Set(damageByStyle).size,1,'All three styles share the same ultimate damage');

// Recoil is exact above the floor and never kills a low-health player.
for(const hp of [1,5,10,10.5,17]){
 const h=setup(),r=h.run;r('player.hp='+hp+';');ultimate(h);frames(h,.6);
 assert.equal(r('player.hp'),Math.max(1,hp-10),'Recoil floor from '+hp+' HP');
}

// The configured action is F by default and follows actual key remapping.
{
 const h=setup(),r=h.run;assert.equal(r("Bindings.read('ultimate')[0]"),'f');
 assert(r("Bindings.setPrimary('ultimate','g').ok"));
 h.press('f');frames(h,1/120);h.release('f');assert(!r('Dawnblade.casting()'),'Old binding no longer activates');
 h.press('g');frames(h,1/120);h.release('g');assert(r('Dawnblade.casting()'),'Remapped binding activates through the keyboard handler');
 frames(h,1.2);const before=r('Dawnblade.status().cooldown');ultimate(h);assert(!r('Dawnblade.casting()'));assert(r('Dawnblade.status().cooldown')<before,'Cooldown blocks another cast while time still advances');
}

// All overlays freeze both the impact and its 60-second active-play clock.
{
 const h=setup(),r=h.run;r('player.hp=17;');ultimate(h);
 for(const state of ['pause','dialog','inventory','map','developer']){
  r('state='+JSON.stringify(state));const before=r('JSON.stringify([Dawnblade.status(),player.hp])');frames(h,3);
  assert.equal(r('JSON.stringify([Dawnblade.status(),player.hp])'),before,'Cast and cooldown freeze in '+state);
 }
 r("state='play';");frames(h,.6);assert.equal(r('player.hp'),7);frames(h,.6);
 const clock=r('Dawnblade.status().cooldown');
 r('showMap();');frames(h,2);assert.equal(r('Dawnblade.status().cooldown'),clock,'Opening the real map freezes rather than resets cooldown');r('closeMap();');
 assert(r("WeaponEquipment.equip('naginata')"));assert.equal(r('Dawnblade.status().cooldown'),clock,'Equipment changes preserve cooldown');
 assert(r("CampQuest.enter('zigguratInterior',{save:false})"));assert.equal(r('Dawnblade.status().cooldown'),clock,'Map changes preserve cooldown');r('enemies=[];');
 frames(h,clock-.1);assert(r('Dawnblade.status().cooldown')>0);assert(!r('Dawnblade.activate()'),'Not ready before sixty active seconds');
 frames(h,.2);assert.equal(r('Dawnblade.status().cooldown'),0);assert(r('Dawnblade.activate()'),'Ready after sixty active seconds');
}

// The first story awakening must make the real ultimate input finish Hannah;
// ordinary sword damage cannot substitute for the final story action.
{
 const h=setup(),r=h.run;r("flags[3]=[];CampQuest.enter('zigguratSummit',{save:false});var finalHannah=enemies.find(HannahCombat.is);initPlayer({x:1400,y:1400});player.inv=999;finalHannah.active=true;");
 assert(!r('Dawnblade.owned()'));assert(!r('Dawnblade.activate()'));
 r('HannahCombat.hit(finalHannah,{...finalHannah},100000);');assert.equal(r('state'),'dialog');h.dismiss();frames(h,2.6);
 assert.equal(r('finalHannah.stage'),2);
 for(let gate=0;gate<2;gate++){
  r('finalHannah.inv=0;HannahCombat.hit(finalHannah,{...finalHannah},100000);');assert.equal(r('finalHannah.mode'),'drain');
  r('finalHannah.inv=0;HannahCombat.hit(finalHannah,{...finalHannah},100000);');assert.equal(r('finalHannah.mode'),'combat');
 }
 r('finalHannah.inv=0;HannahCombat.hit(finalHannah,{...finalHannah},100000);');assert.equal(r('state'),'dialog');h.dismiss();
 assert.equal(r('finalHannah.mode'),'finisher');assert(r('Dawnblade.owned()'));assert(r('Dawnblade.ready()'));
 r('HannahCombat.hit(finalHannah,{...finalHannah},100000);');assert(!r('finalHannah.dead'),'Normal damage cannot skip the required ultimate');
 ultimate(h);frames(h,.6);assert(r('finalHannah.dead'));assert(r("flags[3].includes('hannahDefeated')&&flags[3].includes('guardian:Hannah')"));
 assert.equal(r("flags[3].filter(id=>id==='dawnblade').length"),1,'Awakening remains a single permanent flag');
}

// Developer grants in the dream must not strand shared movement timers. Use
// actual double-jump/dash input before and after the cast at three frame rates.
for(const fps of [30,60,120]){
 const h=harness({prologue:true}),r=h.run;
 const normal=r('JSON.stringify(saved)'),writes=r('window.__saveSnapshots.length');
 r('DevTools.open();DevSession.begin();');
 for(const ability of ['double-jump','dash','dawnblade'])assert(r('DevAbilities.acquire({ability:'+JSON.stringify(ability)+'})'));
 assert(r("DevTeleport.teleport({realm:'dream',rest:'dream'})"));r('DevTools.close();player.inv=999;');
 h.press({action:'jump'});frames(h,1/fps,fps);h.release({action:'jump'});frames(h,.16,fps);
 h.press({action:'jump'});frames(h,1/fps,fps);h.release({action:'jump'});assert.equal(r('player.jumps'),2);
 h.press({action:'dash'});frames(h,1/fps,fps);h.release({action:'dash'});assert(r('dash>0'));frames(h,.31,fps);assert.equal(r('dash'),0);assert(r('player.vy>0'));
 ultimate(h,fps);assert(r('Dawnblade.casting()'));frames(h,1.2,fps);assert(!r('Dawnblade.casting()'));assert(r('Dawnblade.status().cooldown>58&&Dawnblade.status().cooldown<59'));
 frames(h,1,fps);assert(r('player.onGround'));
 h.press({action:'jump'});frames(h,1/fps,fps);h.release({action:'jump'});assert(r('player.vy<0'),'Jump works after the dream cast at '+fps+' FPS');frames(h,.16,fps);
 h.press({action:'dash'});frames(h,1/fps,fps);h.release({action:'dash'});assert(r('dash>0'));frames(h,.3,fps);assert.equal(r('dash'),0);assert(r('player.vy>0'),'Gravity resumes after the second dash');
 r('DevSession.end();');assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('window.__saveSnapshots.length'),writes,'Dream dev grants never overwrite normal saves');
}
console.log('PASS: Dawnblade style-independent 8x damage, ten-HP recoil/one-HP floor, remapped F input, sixty active seconds, overlay/map/equipment continuity, first story finisher and isolated dream dev movement at 30/60/120 FPS.');
