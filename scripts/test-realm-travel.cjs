const assert=require('node:assert/strict');
const {run,snap,elements}=require('./test-harness.cjs')();
const validate=require('./test-save-validation.cjs');
const permanent=()=>JSON.stringify({flags:snap().flags,abilities:snap().abilities,defeated:snap().defeated,progression:snap().progression,shards:snap().shards});
run("Prologue.stop();abilities=[true,true];defeated=[true,true,false,false];flags=[['forestBell','villageBell','cultEntrance','discovered:angelRuin','discovered:cultCave','guardian:oldAngel','angelHalo','guardian:oldCultist','demonHorn'],['soulUpper','soulLower','councilKeyEarned','councilGateOpen'],['dawnSeal'],[]];progression=freshProgression();enterRealm(2);state='play';awardXP(160);progression.stats.strength=1;progression.points--;shards=17;visitedRests=levels.map((l,n)=>n<3?l.rests.map(r=>r.id):[]);enemies.filter(e=>!e.miniboss).forEach(e=>e.dead=true);persist();");
const before=permanent();validate(run('saved'));
run('showMap();');
const realmSection=elements.get('mapContent').children.find(el=>el.className==='realm-travel');
assert(realmSection,'Completed realms are absent from the map');
const groups=realmSection.children.filter(el=>el.className==='travel-grid');assert.equal(groups.length,2);
const river=run("japan.rests.find(r=>r.id==='river')");
const japanButton=groups[0].children.find(button=>button.textContent.includes(river.name));assert(japanButton&&!japanButton.disabled);
japanButton.onclick();assert.equal(snap().realm,0);assert.equal(snap().checkpoint.id,'river');
assert.equal(snap().player.y+snap().player.h,river.y);assert.equal(permanent(),before);
assert(run('boss.dead&&enemies.filter(e=>!e.miniboss).every(e=>!e.dead&&e.hp===e.maxHp)'));
assert(run('enemies.filter(e=>e.miniboss).every(e=>e.dead===flags[realm].includes(minibossFlag(e.id)))'));
assert(run("gatePass(level.gates.find(g=>g.id==='cultEntrance'))"));validate(run('saved'));

// Returning to the already-visited unfinished realm must remain possible.
run('showMap();');const back=elements.get('mapContent').children.find(el=>el.className==='realm-travel');
assert.equal(back.children.filter(el=>el.className==='travel-grid').length,2);
assert(run("fastTravel(heaven.rests.find(r=>r.id==='third'),2)"));assert.equal(snap().realm,2);assert(!snap().boss.dead);
assert.equal(snap().checkpoint.id,'third');assert.equal(permanent(),before);validate(run('saved'));
run('mainMenu();startGame(true);');assert.equal(snap().realm,2);assert.equal(snap().checkpoint.id,'third');assert.equal(permanent(),before);

// Crossing out of the optional hall drops its transient cache, preserving its open door.
assert(run("fastTravel(yomi.rests.find(r=>r.id==='lower'),1)"));assert(run('enterCouncilHall()'));
assert(run("fastTravel(japan.rests[0],0)"));assert.equal(run('level.id'),'japan');assert.equal(run('councilReturn'),null);
assert.equal(snap().checkpoint.id,'start');assert.equal(permanent(),before);validate(run('saved'));
run('player.hp=2;player.y=level.height+200;movePlayer(1/120);');assert.equal(snap().realm,0);assert.equal(snap().checkpoint.id,'start');
assert(run("fastTravel(yomi.rests.find(r=>r.id==='lower'),1)&&enterCouncilHall()"));
assert(run("flags[1].includes('councilGateOpen')&&!flags[1].includes('councilKey')"));
assert(run('fastTravel(yomi.rests[0])'));assert.equal(run('level.id'),'yomi');

// Same-realm fast travel also respawns normal enemies without resurrecting guardians.
run('enemies.filter(e=>!e.miniboss).forEach(e=>e.dead=true);');assert(run('fastTravel(yomi.rests[0])'));
assert(run('enemies.filter(e=>!e.miniboss).every(e=>!e.dead&&e.hp===e.maxHp)'));assert(run('boss.dead'));

// The API enforces the same unlock/discovery rules as the UI and canonicalizes coordinates.
for(const target of ['-1','3','NaN',"'0'"]){const snapshot=JSON.stringify(snap());assert(!run(`fastTravel({id:'start'},${target})`));assert.equal(JSON.stringify(snap()),snapshot);}
assert(!run("fastTravel({id:'dream'},0)"));assert(!run('fastTravel(null,0)'));
assert(run("fastTravel({id:'start',x:999999,y:-999999},0)"));assert.equal(snap().checkpoint.x,run('japan.rests[0].x'));
assert.equal(snap().player.y+snap().player.h,run('japan.rests[0].y'));
run("visitedRests[2]=['start'];");assert(!run("fastTravel({id:'third'},2)"),'Unknown shrine is reachable');
run('defeated[1]=false;');assert(!run('fastTravel(heaven.rests[0],2)'),'Unopened realm is reachable');
run('Prologue.start();');assert(!run('fastTravel(japan.rests[0],0)'),'The dream permits travel');
run('showMap();');assert.equal(snap().state,'play');assert.equal(run('level.id'),'dream');
console.log('PASS: completed realm return, unfinished realm roundtrip, actual map-button routing, permanent progress/guardians, normal respawns, canonical hall/death/reload checkpoints and strict realm/shrine/dream guards.');
