'use strict';
const assert=require('node:assert/strict'),h=require('./test-harness.cjs')(),r=h.run;
const ctx=h.sandbox.document.getElementById('world').getContext('2d');let commands=[];
for(const name of ['translate','scale','rotate','transform','setTransform'])ctx[name]=(...args)=>commands.push([name,...args]);
ctx.drawImage=(image,...args)=>commands.push(['image',...args]);
const world=()=>r('JSON.stringify({player,enemies,boss,flags,progression,platforms,projectiles,time,levelTime,camera,cameraY,shake})');
function capture(){commands=[];const before=world();r('draw()');assert.equal(world(),before,'Drawing never mutates gameplay or camera');return JSON.stringify(commands);}
r('DevTools.open();DevSession.begin();state="play";');
const ids=Array.from(r('Object.keys(SIDE_LOCATIONS)'));
for(const target of [0,1,2,3,...ids]){
 r(typeof target==='number'?'enterRealm('+target+')':'CampQuest.enter('+JSON.stringify(target)+')');r("state='play';shake=0;time=3.123;reducedMotion.matches=false;");for(let warm=0;warm<10;warm++)capture();const steady=capture();r('shake=.2');assert.equal(capture(),steady,'Foreground and native background stay aligned under shake: '+target);r('reducedMotion.matches=true;shake=0');const reduced=capture();r('shake=.4');assert.equal(capture(),reduced,'Reduced motion: '+target);
}
for(const id of ['shadowDen','cultDungeon1'])for(const fps of [30,60,120])for(const kind of ['attack','heavyAttack']){
 r('CampQuest.enter('+JSON.stringify(id)+');state="play";initPlayer(level.start);enemies=[];boss.dead=true;reducedMotion.matches=false;');for(let warm=0;warm<10;warm++)capture();h.press({action:kind});let impact=false;
 for(let n=0;n<fps*2;n++){r('update('+1/fps+')');if(r('attackHit&&shake>0')){impact=true;const active=capture();r('shake=0');assert.equal(capture(),active,'Real attack cannot shift world rendering');break;}}
 h.release({action:kind});assert(impact,'Actual bound '+kind+' reaches its impact at '+fps+' FPS in '+id);
 const camera=r('JSON.stringify([camera,cameraY])');r("state='pause'");const before=world();h.tick(60);assert.equal(world(),before);assert.equal(r('JSON.stringify([camera,cameraY])'),camera);
}
// The ordinary camera still follows real walking; only the shake render offset is removed.
r("enterRealm(0);state='play';initPlayer({x:1100,y:930});resetCamera();enemies=[];boss.dead=true;player.inv=999;");const x=r('camera');h.press({action:'moveRight'});h.tick(120);h.release({action:'moveRight'});assert.notEqual(r('camera'),x);
console.log('PASS: all4realms and every registered side/dungeon map have shake-invariant pure rendering, actual normal/heavy input at30/60/120FPS, pause/reduced-motion stability and preserved movement camera tracking.');
