'use strict';
const assert=require('node:assert/strict');
const harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');

function setup({open=true,vitality=0}={}){
 const h=harness(),r=h.run;
 r(`Prologue.stop();abilities=[true,true];defeated=[true,true,true,false];
 flags=[['forestBell','villageBell'],['soulUpper','soulLower'],['dawnSeal','shadowEntered'],['shadowAltar'${open?",'guardian:cultJailer','prisonOpen'":''}]];
 visitedRests=levels.map(map=>map.rests.map(rest=>rest.id));progression=freshProgression();
 progression.level=${vitality+1};progression.totalXp=${vitality===0?0:60*vitality+35*vitality*(vitality-1)/2};progression.stats.vitality=${vitality};
 enterRealm(3);state='play';initPlayer(level.prisonTrace);
 var traceToasts=[],traceFormats=[],actualToast=toast,actualFormat=I18n.format;
 toast=msg=>{traceToasts.push(msg);actualToast(msg);};
 I18n.format=(key,args)=>{if(key==='shadow.trace.healed')traceFormats.push([...args]);return actualFormat(key,args);};`);
 return h;
}
function use(h,key='e'){h.press(key);h.tick();h.release(key);}
function alreadyClaimed(h){
 const r=h.run;
 r("initPlayer(level.prisonTrace);player.hp=1;state='play';traceToasts=[];traceFormats=[];");
 const writes=r('__saveSnapshots.length');use(h);
 assert.equal(r('state'),'play');assert.equal(r('player.hp'),1,'A claimed trace cannot heal again');
 assert.equal(r("flags[3].filter(f=>f==='prisonTrace').length"),1);
 assert.equal(r('__saveSnapshots.length'),writes);assert.equal(r('traceFormats.length'),0);
}

// Normal and remapped action input use the real context, capped healing and scene.
for(const [hp,vitality,restored,key] of [[1,0,2,'e'],[4,0,1,'r'],[5,0,0,'e'],[7,4,2,'r'],[8,4,1,'e'],[9,4,0,'r']]){
 const h=setup({vitality}),r=h.run;
 r(`player.hp=${hp};Bindings.setPrimary('interact',${JSON.stringify(key)});
 var existingEnemies=enemies,existingBoss=boss;
 var deadNormal=enemies.find(e=>!e.miniboss);deadNormal.dead=true;deadNormal.hp=0;
 boss.hp-=3;var unchanged=JSON.stringify([checkpoint,boss,progression,abilities,defeated,flags.slice(0,3),visitedRests]);`);
 const writes=r('__saveSnapshots.length');use(h,key);
 assert.equal(r('state'),'dialog');assert.equal(r('player.hp'),hp+restored);
 assert.equal(h.elements.get('dialogTitle').textContent,r("I18n.t('shadow.trace.title')"));
 assert.equal(r("flags[3].filter(f=>f==='prisonTrace').length"),1);
 assert.equal(r('__saveSnapshots.length'),writes+1,'Claim is saved before the dialog closes');
 assert(r("saved.flags[3].includes('prisonTrace')"));assert.doesNotThrow(()=>validate(r('saved')));
 assert(r('enemies===existingEnemies&&boss===existingBoss&&deadNormal.dead'),'Trace is not an enemy/boss reset');
 assert.equal(r('JSON.stringify([checkpoint,boss,progression,abilities,defeated,flags.slice(0,3),visitedRests])'),r('unchanged'),'Trace is not a shrine or progression reward');
 assert.equal(r('traceFormats.length'),0,'Healing feedback waits until the story is closed');
 const frozen=r('JSON.stringify([time,levelTime,player,attack,dash,dashCooldown,boss,enemies,particles,projectiles])');
 h.press('d');h.tick(240);h.release('d');
 assert.equal(r('JSON.stringify([time,levelTime,player,attack,dash,dashCooldown,boss,enemies,particles,projectiles])'),frozen,'Combat and effect clocks freeze throughout the scene');
 r("ShadowRealm.interact({type:'prisonTrace'});");
 assert.equal(r('__saveSnapshots.length'),writes+1,'A stale context cannot claim the trace twice');
 const close=h.elements.get('dialogOk').onclick;h.dismiss();close();
 assert.equal(r('state'),'play');assert.equal(r('player.hp'),hp+restored);
 assert.deepEqual(JSON.parse(r('JSON.stringify(traceFormats)')),restored?[[restored]]:[],'Feedback reports actual healing, never zero or an uncapped amount');
 assert.equal(r('traceToasts.length'),restored?1:0,'Closing a stale dialog callback cannot repeat feedback');
 r("player.hp=1;ShadowRealm.interact({type:'prisonTrace'});");
 assert.equal(r('player.hp'),1);assert.equal(r('state'),'play');
}

// Locked and distant interactions cannot reveal the scene or grant its heal.
for(const locked of [true,false]){
 const h=setup({open:!locked}),r=h.run;r('player.hp=1;');
 if(!locked)r('player.x+=350;');
 const writes=r('__saveSnapshots.length');use(h);
 assert.equal(r('state'),'play');assert.equal(r('player.hp'),1);
 assert(!r("flags[3].includes('prisonTrace')"));assert.equal(r('__saveSnapshots.length'),writes);
 if(locked){r("ShadowRealm.interact({type:'prisonTrace'});");assert.equal(r('player.hp'),1);assert(!r("flags[3].includes('prisonTrace')"));}
}
{
 const h=setup(),r=h.run;r("enterRealm(0);player.hp=1;");
 assert.equal(r("ShadowRealm.interact({type:'prisonTrace'})"),false);assert.equal(r('player.hp'),1);
}

// Same-release continuation and normal world transitions retain the one-time claim.
for(const transition of ['resume','death','shrine','travel']){
 const h=setup(),r=h.run;r('player.hp=1;');use(h);h.dismiss();
 if(transition==='resume')r('mainMenu();startGame(true);');
 else if(transition==='death')r('player.inv=0;damage(999);');
 else if(transition==='shrine')r('initPlayer(level.rests[2]);interact();');
 else{assert(r('fastTravel(levels[0].rests[0],0)'));assert(r('fastTravel(levels[3].rests[2],3)'));}
 assert(r("flags[3].includes('prisonTrace')"),transition);assert.doesNotThrow(()=>validate(r('saved')));
 alreadyClaimed(h);
}
console.log('PASS: Haru trace story and capped one-time healing, remapped input, locked/distant access, frozen scene, actual healing feedback, no shrine side effects, and persistent claim across continuation/death/rest/travel.');
