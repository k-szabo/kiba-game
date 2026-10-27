'use strict';
const assert=require('node:assert/strict'),setup=require('./test-fia-fixture.cjs');
for(const room of [false,true]){
 const h=setup(room),r=h.run;
 r("var npc=level.npcs.find(n=>n.id==='fia');initPlayer({x:npc.x-70,y:npc.y});FiaConflict.provoke({x:npc.x-35,y:npc.y-130,w:70,h:130});");h.dismiss();r('var fury=FiaConflict.enemy;fury.shieldRemaining=0;FiaCombat.hit(fury,{x:fury.x,y:fury.y,w:fury.w,h:fury.h},10000);');h.dismiss();
 const ctx=h.sandbox.document.getElementById('world').getContext('2d');let calls=[];ctx.fillRect=(...args)=>calls.push(args);
 const ids=Array.from(r('enemies.filter(e=>e.denResidentRole||e.denRetaliation).map(e=>e.id)'));assert.equal(ids.length,room?2:4);
 for(const id of ids)for(const fraction of [1,.5,.1,0]){
  r('var resident=enemies.find(e=>e.id==='+JSON.stringify(id)+');resident.hp=resident.maxHp*'+fraction+';');calls=[];const before=r('JSON.stringify([enemies,player,flags,progression])');r('drawEnemy(resident,realms[3])');assert.equal(r('JSON.stringify([enemies,player,flags,progression])'),before);
  const width=r('resident.denRetaliation?70:56'),x=r('resident.x+resident.w/2')-width/2,y=r('resident.y')-17;
  assert(calls.some(a=>a[0]===x&&a[1]===y&&a[2]===width&&a[3]===6),'Full bar backing: '+id);assert(calls.some(a=>a[0]===x&&a[1]===y&&Math.abs(a[2]-width*fraction)<1e-8&&a[3]===6),'Correct HP fraction: '+id);
  r('resident.dead=true;');calls=[];r('drawEnemy(resident,realms[3])');assert(!calls.some(a=>a[0]===x&&a[1]===y&&a[3]===6));r('resident.dead=false;');
 }
}
console.log('PASS: full and damaged native hostile-resident/bodyguard health bars in Den and chambers, independent fractions, dead exclusion and pure rendering.');
