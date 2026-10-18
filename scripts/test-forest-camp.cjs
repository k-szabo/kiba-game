const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
const json=value=>JSON.stringify(value);
function victorious(){
 const h=harness();
 h.run("flags[0].push('forestBell','villageBell');bossStarted=true;boss.hp=0;guardianDefeated();");h.dismiss();
 return h;
}
const ledger=h=>h.run('JSON.stringify([flags,defeated,abilities,progression,shards])');
function frames(h,seconds,fps=120){h.run(`for(let f=0;f<${Math.ceil(seconds*fps)};f++)update(${1/fps});`);}

// The side area is not a fourth realm, and its shrine is never a physical
// marker in Japan. Its own geometry contains no encounter actors or hazards.
{
 const h=harness(),r=h.run;
 assert.equal(r('levels.length'),3);assert.equal(r('levels.includes(forestCamp)'),false);
 assert.equal(r('japan.rests.some(s=>s.id===\'forestCamp\')'),false);
 assert.equal(r('realmRests(0).filter(s=>s.id===\'forestCamp\').length'),1);
 assert.equal(r('realmRests(1).length'),r('yomi.rests.length'));
 assert.equal(r('realmRests(2).length'),r('heaven.rests.length'));
 assert.equal(r("travelGrid(0).children.some(b=>b.textContent.includes(forestCamp.rests[0].name))"),false,'Unvisited camp is revealed by travel UI');
 const before=r('JSON.stringify([realm,level.id,flags,visitedRests,checkpoint,saved])');
 assert.equal(r('enterForestCamp()'),false,'The camp must stay locked before Japan victory');
 assert.equal(r("fastTravel({id:'forestCamp'},0)"),false);
 assert.equal(r('JSON.stringify([realm,level.id,flags,visitedRests,checkpoint,saved])'),before);
 const lockedSave=r('JSON.parse(JSON.stringify(saved))');lockedSave.location='forestCamp';
 assert.throws(()=>validate(lockedSave),'Save validation must reject a pre-victory camp location');
 r('initPlayer(japan.campEntrance);');assert.notEqual(r('getContext()?.type'),'campEntrance');
 h.press('e');h.tick();h.release('e');assert.equal(r('level.id'),'japan');
 // A forged discovery cannot bypass the guardian or turn into a camp save.
 r("visitedRests[0].push('forestCamp');");assert.equal(r("fastTravel({id:'forestCamp'},0)"),false);
 r('persist();');assert.notEqual(r('saved.location'),'forestCamp');
 const dream=harness({prologue:true});
 dream.run('defeated[0]=true;');
 assert.equal(dream.run('enterForestCamp()'),false,'The dream cannot enter the camp');
 assert.equal(dream.run("fastTravel({id:'forestCamp'},0)"),false);
 assert.equal(dream.run('level.id'),'dream');
}

// Use the actual input dispatcher: both the entrance and the return use the
// configured interaction action rather than a hardcoded E shortcut.
{
 const h=victorious(),r=h.run;
 r('initPlayer(japan.campEntrance);');assert.equal(r('getContext().type'),'campEntrance');
 assert.equal(r("Bindings.setPrimary('interact','q').ok"),true);
 h.press('e');h.tick();h.release('e');assert.equal(r('level.id'),'japan');
 h.press('q');h.tick();h.release('q');assert.equal(r('level.id'),'forestCamp');
 assert.equal(h.snap().realm,0);assert.equal(r('enemies.length+projectiles.length+level.hazards.length'),0);
 assert.equal(r('boss.dead'),true);assert.equal(r('bossStarted'),false);
 assert.equal(r("visitedRests[0].filter(s=>s==='forestCamp').length"),1);
 assert.equal(r('saved.location'),'forestCamp');assert.doesNotThrow(()=>validate(r('saved')));
 r('initPlayer(forestCamp.returnPoint);');assert.equal(r('getContext().type'),'campReturn');
 h.press('q');h.tick();h.release('q');
 assert.equal(r('level.id'),'japan');assert.equal(r('saved.location'),null);
 assert(Math.abs(r('player.x+player.w/2-japan.campEntrance.x'))<1);
 assert.equal(r('player.y+player.h'),r('japan.campEntrance.y'));
 assert(r('japan.rests.some(s=>s.id===checkpoint.id&&s.x===checkpoint.x&&s.y===checkpoint.y)'), 'Return must restore a canonical Japan shrine');
 assert.doesNotThrow(()=>validate(r('saved')));
}

// NPC dialogue, shrine healing/training, pause and death use the normal game
// systems, without combat rewards or a hidden guardian in the safe map.
{
 const h=victorious(),r=h.run;assert.equal(r('enterForestCamp()'),true);
 const residents=r('forestCamp.npcs.map(n=>n.id)');assert.equal(residents.length,3);
 for(const id of residents){
  r(`initPlayer(forestCamp.npcs.find(n=>n.id===${json(id)}));`);
  assert.equal(r('getContext().type'),'campNPC');
  const reward=ledger(h),shape=r('JSON.stringify(forestCamp.npcs)');
  for(const key of ['j','h']){h.press(key);frames(h,1.1);h.release(key);}
  assert.equal(r('JSON.stringify(forestCamp.npcs)'),shape,'Sword attacks changed an NPC');
  assert.equal(ledger(h),reward,'Sword attacks in camp awarded combat progression');
  h.press('e');h.tick();h.release('e');assert.equal(h.snap().state,'dialog');
  const frozen=r('JSON.stringify([player,time,levelTime,dash,attack,particles])');
  h.press('d');frames(h,1);h.release('d');
  assert.equal(r('JSON.stringify([player,time,levelTime,dash,attack,particles])'),frozen,'NPC dialogue did not freeze the world');
  h.dismiss();assert.equal(h.snap().state,'play');
 }
 assert.equal(r("campNPCVisible({requiresFlag:{realm:1,id:'soulUpper'}})"),false);
 r("flags[1].push('soulUpper');");
 assert.equal(r("campNPCVisible({requiresFlag:{realm:1,id:'soulUpper'}})"),true);
 r('initPlayer(forestCamp.rests[0]);player.hp=1;');
 assert.equal(r('getContext().type'),'checkpoint');h.press('e');h.tick();h.release('e');
 assert.equal(h.snap().player.hp,h.snap().player.maxHp);assert.equal(r('checkpoint.id'),'forestCamp');
 h.press('u');h.tick();h.release('u');assert.equal(h.snap().state,'training');
 const points=r('progression.points');assert(points>0);assert.equal(r("spendPoint('vitality')"),true);
 assert.equal(r('progression.points'),points-1);r('closeTraining();');
 const before=ledger(h);r('player.inv=0;damage(999);');
 assert.equal(r('level.id'),'forestCamp');assert.equal(ledger(h),before);
 assert.equal(r('player.y+player.h'),r('forestCamp.rests[0].y'));
 assert.equal(r('enemies.length+projectiles.length'),0);assert.equal(r('bossStarted'),false);
 r('player.y=level.height+200;update(1/120);');
 assert.equal(r('level.id'),'forestCamp');assert.equal(ledger(h),before,'A fall from the camp lost progression');
 assert.equal(r('player.y+player.h'),r('forestCamp.rests[0].y'));
 r('persist();mainMenu();startGame(true);');h.dismiss();
 assert.equal(r('level.id'),'forestCamp');assert.equal(ledger(h),before);
 assert.equal(r('player.x+player.w/2'),r('forestCamp.rests[0].x'));
 assert.doesNotThrow(()=>validate(r('saved')));
}

// Travel preserves the complete boss reward ledger. Discovered camp travel
// is available from other unlocked realms, canonicalizes coordinates, and
// does not invent a map marker at the camp shrine's unrelated coordinates.
{
 const h=victorious(),r=h.run;
 assert.equal(r("fastTravel({id:'forestCamp'},0)"),false,'Unvisited camp cannot be fast-travelled to');
 assert.equal(r("travelGrid(0).children.some(b=>b.textContent.includes(forestCamp.rests[0].name))"),false);
 r('enterForestCamp();leaveForestCamp();enterRealm(1);');
 r("flags[1].push('soulUpper','soulLower');abilities[1]=true;bossStarted=true;boss.hp=0;guardianDefeated();");h.dismiss();
 r('enterRealm(2);');const before=ledger(h);
 assert.equal(r("fastTravel({id:'forestCamp',x:999999,y:-999999},0)"),true);
 assert.equal(r('level.id'),'forestCamp');assert.equal(r('player.x+player.w/2'),r('forestCamp.rests[0].x'));
 assert.equal(ledger(h),before);
 r('showMap();');
 const content=h.elements.get('mapContent');
 const grids=content.children.filter(el=>el.className==='travel-grid');
 assert(grids.some(g=>g.children.some(button=>button.textContent.includes(r('forestCamp.rests[0].name'))&&!button.disabled)),'Discovered camp is absent from travel controls');
 const campSvg=content.children.find(el=>el.className==='world-map').innerHTML;
 assert.equal((campSvg.match(/<circle /g)||[]).length,2,'Camp map must contain its own shrine and Momo');
 assert.equal(campSvg.includes('◆'),false,'Camp map shows a phantom boss');
 assert(campSvg.includes(`aria-label="${r("I18n.t('camp.name')")}"`),'Camp map must announce its own localized name');
 assert.equal(r('fastTravel(japan.rests[0],0)'),true);r('showMap();');
 const svg=h.elements.get('mapContent').children.find(el=>el.className==='world-map').innerHTML;
 // Camp coordinates must not be rendered as if they were a Japan shrine.
 const expectedPhysical=r('japan.rests.length+japan.objects.filter(o=>objectVisible(o)&&(!o.secretArea||secretKnown(o.secretArea)&&relicUnlocked(o))).length+1');
 assert.equal((svg.match(/<circle /g)||[]).length,expectedPhysical);
 r("state='play';");assert.equal(r('fastTravel(heaven.rests[0],2)'),true);
 assert.equal(r('level.id'),'heaven');assert.equal(ledger(h),before);
 assert.equal(r('saved.location'),null);assert.doesNotThrow(()=>validate(r('saved')));
 assert.equal(r("fastTravel({id:'forestCamp'},1)"),false,'Camp shrine must belong only to Japan');
 r("fastTravel({id:'forestCamp'},0);leaveForestCamp();bossStarted=true;boss.hp=0;guardianDefeated();");
 assert.equal(ledger(h),before,'Returning through the hub allowed boss reward farming');
}

// Exercise shared player timers and gravity through the outer update loop in
// every ability combination and at common frame rates. These are actual key
// presses and simulation frames, not direct calls to input/movePlayer.
for(const fps of [30,60,120])for(const doubleJump of [false,true])for(const spiritDash of [false,true]){
 const h=victorious(),r=h.run;assert.equal(r('enterForestCamp()'),true);
 r(`abilities=[${doubleJump},${spiritDash}];initPlayer({x:900,y:820});`);
 const x=h.snap().player.x;h.press('d');frames(h,.3,fps);h.release('d');
 assert(h.snap().player.x>x+35,`Movement failed at ${fps} FPS`);
 h.press(' ');frames(h,.1,fps);h.release(' ');assert.equal(h.snap().player.onGround,false);
 frames(h,.17,fps);h.press(' ');frames(h,1/fps,fps);h.release(' ');
 assert.equal(r('player.jumps'),doubleJump?2:1,'Double jump ignored its ability state');
 if(doubleJump)assert(r('player.vy< -550'),'Double jump did not renew upward velocity');
 h.press('k');frames(h,1/fps,fps);h.release('k');assert.equal(r('dash>0'),spiritDash);
 if(spiritDash){
  const frozen=r('JSON.stringify([player,time,levelTime,dash,dashCooldown])');r('pause();');frames(h,1,fps);
  assert.equal(r('JSON.stringify([player,time,levelTime,dash,dashCooldown])'),frozen,'Pause advanced a camp dash');r('pause();');
 }
 frames(h,.25,fps);assert.equal(r('dash'),0,'Camp dash never expired');
 if(spiritDash)assert(r('player.vy>0||player.onGround'),'Gravity did not resume after dash');
 frames(h,3,fps);
 assert.equal(r('dashCooldown'),0);assert.equal(h.snap().player.onGround,true);
 assert.equal(r('player.y+player.h'),820);assert(Math.abs(r('player.vx'))<1);
 assert.equal(r('enemies.length+projectiles.length'),0);assert.equal(r('bossStarted'),false);
}
console.log('PASS: guardian/dream locks, remappable physical entrance/return, canonical camp travel/reload/death, safe NPC interaction and combat, frozen dialogue/pause, shrine training, once-only rewards and all ability/frame-rate movement combinations.');
