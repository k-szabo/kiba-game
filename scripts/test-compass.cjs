'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const h=harness(),r=h.run,node=id=>h.elements.get(id);
assert(node('compass').hidden);
r("flags[1].push('compass');updateHUD();");assert(!node('compass').hidden);
assert.equal(node('compassLabel').textContent,r("I18n.t('item.compass')"));
assert(node('compassTarget').textContent.includes(r('level.ability.name')));
assert(!/[↑↓←→]$/.test(node('objective').textContent),'The bearing has its own readable display');
const point=(dx,dy)=>`({x:player.x+player.w/2+${dx},y:player.y+player.h+${dy}})`;
for(const [i,dx,dy]of [[0,400,0],[1,400,400],[2,0,400],[3,-400,400],[4,-400,0],[5,-400,-400],[6,0,-400],[7,400,-400]]){
 assert.equal(r(`Compass.reading(${point(dx,dy)}).sector`),i);
 r(`Compass.update({point:${point(dx,dy)},name:'Test target'});`);
 assert.equal(node('compassDirection').textContent,r(`I18n.t('compass.direction.${i}')`));
}
r(`Compass.update({point:${point(0,0)},name:'Test target'});`);assert.equal(node('compassArrow').textContent,'✓');assert.equal(node('compassDirection').textContent,r("I18n.t('compass.near')"));
assert(r(`Compass.reading(${point(89,84)}).near`));assert(!r(`Compass.reading(${point(90,84)}).near`));assert(!r(`Compass.reading(${point(0,85)}).near`));
r('abilities[0]=true;updateHUD();');assert.equal(r('nextObjective().name'),r("level.objects.find(o=>o.id==='forestBell').name"));
r("flags[0].push('forestBell');updateHUD();");assert.equal(r('nextObjective().name'),r("level.objects.find(o=>o.id==='villageBell').name"));
r("flags[0].push('villageBell');updateHUD();");assert.equal(r('nextObjective().name'),r('realms[0].boss'));
r('defeated[0]=true;updateHUD();');assert.equal(r('nextObjective().name'),r('realms[1].name'));
for(const flag of ['discovered:angelRuin','discovered:cultCave'])r(`flags[0].push('${flag}');`);
assert(!/glória|szarv|halo|horn/i.test(r('nextObjective().name')),'Secrets must not become compass targets');
r('enterForestCamp();updateHUD();');assert.equal(node('compassArrow').textContent,'—');assert.equal(node('compassDirection').textContent,r("I18n.t('compass.idle')"));assert(node('compassTarget').hidden);
r('leaveForestCamp();enterRealm(1);updateHUD();');assert.equal(r('nextObjective().name'),r('level.objects[0].name'));
r("flags[1].push('soulUpper');updateHUD();");assert.equal(r('nextObjective().name'),r('level.objects[1].name'));
r("flags[1].push('soulLower');updateHUD();");assert.equal(r('nextObjective().name'),r('level.ability.name'));
r('abilities[1]=true;updateHUD();');assert.equal(r('nextObjective().name'),r('realms[1].boss'));
r('defeated[1]=true;updateHUD();');assert.equal(r('nextObjective().name'),r('realms[2].name'));
r("flags[1].push('councilGateOpen');enterCouncilHall();updateHUD();");assert.equal(node('compassArrow').textContent,'—');assert(node('compassTarget').hidden);r('leaveCouncilHall();enterRealm(2);');
for(const y of [6300,4960,3750,2340,1470,850]){
 h.place(1000,y);r('updateHUD();');assert.equal(typeof r('nextObjective().name'),'string');assert(r('nextObjective().name.length>0'));assert(!node('compassTarget').hidden);
}
r('defeated[2]=true;updateHUD();');assert.equal(r('nextObjective().name'),r("I18n.t('HARU')"));
r('pause();');const frozen=[node('compassTarget').textContent,node('compassDirection').textContent,node('compassArrow').textContent];h.tick(120);assert.deepEqual([node('compassTarget').textContent,node('compassDirection').textContent,node('compassArrow').textContent],frozen);
r('mainMenu();');assert(node('compass').hidden);
r('state="play";Prologue.start();');assert(node('compass').hidden,'Even a dev-granted compass stays hidden in the dream');
r('Prologue.wake();');h.dismiss();r("flags[1]=['compass'];updateHUD();");assert(!node('compass').hidden);
const before=r('JSON.stringify({coins,meatCount,flags,progression,abilities,defeated,player,saved})');r('for(let i=0;i<100;i++)Compass.update();');assert.equal(r('JSON.stringify({coins,meatCount,flags,progression,abilities,defeated,player,saved})'),before,'Compass rendering cannot change gameplay or saves');
console.log('PASS: owned compass display, eight centered bearings/near cue, named objective transitions, hidden secrets, side-area idle, dream/menu hiding and paused/pure rendering.');
