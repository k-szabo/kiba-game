const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const h=harness(),r=h.run;
const permanent=()=>r('JSON.stringify({flags,abilities,defeated,progression,shards,coins,meatCount})');
const normal=r('JSON.stringify(saved)'),writes=r('window.__saveSnapshots.length'),progress=permanent();
const grids=()=>{
 const found=[];
 const visit=node=>{if(node.className==='travel-grid')found.push(node);for(const child of node.children||[])visit(child);};
 visit(h.elements.get('mapContent'));return found;
};
// A genuinely fresh test starts without boss, shrine or shadow-altar unlocks.
assert(r('defeated.every(v=>!v)&&flags.every(f=>!f.length)'));
r('DevTools.open();DevSession.begin();');
const destinations=Array.from(r('levels.flatMap((_,n)=>realmRests(n).map(rest=>({realm:n,id:rest.id,x:rest.x,y:rest.y})))'));
for(const origin of Array.from(r('levels.map((_,n)=>n)'))){
 assert(r(`DevTeleport.teleport({realm:'${origin}',rest:'start'})`));
 r('DevTools.close();showMap();');
 assert.equal(grids().flatMap(g=>g.children).length,destinations.length,'All realms and the unvisited camp must be listed');
 assert(grids().flatMap(g=>g.children).every(b=>!b.disabled),'No shrine is locked in a dev run');
 for(const target of destinations){
  // Open the actual map after every arrival and execute its current button.
  if(r('state')!=='map')r('showMap();');
  const name=r(`I18n.t(realmRests(${target.realm}).find(rest=>rest.id===${JSON.stringify(target.id)}).name)`);
  const button=grids().flatMap(g=>g.children).find(b=>b.textContent==='⛩ '+name);
  assert(button&&!button.disabled,`Missing usable ${target.realm}/${target.id}`);
  assert(button.onclick(),`Advertised destination rejected: ${target.realm}/${target.id}`);
  assert.equal(r('realm'),target.realm);assert.equal(h.snap().checkpoint.id,target.id);
  assert.equal(r('level.id'),target.id==='forestCamp'?'forestCamp':r(`levels[${target.realm}].id`));
  assert.equal(h.snap().checkpoint.x,target.x);assert.equal(h.snap().player.y+h.snap().player.h,target.y);
  assert(r('player.onGround&&player.vx===0&&player.vy===0&&dash===0&&dashCooldown===0'));
  assert.equal(r('state'),'play');assert(r("$('map').hidden"));
  assert.equal(permanent(),progress,'Fast travel must not grant progression');
  assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('window.__saveSnapshots.length'),writes);
 }
 r('DevTools.open();');
}
// Invalid inputs remain rejected; supplied coordinates are never trusted.
r('visitedRests[3]=[];');assert(r("DevTeleport.teleport({realm:'3',rest:'cathedral'})"));r('DevTools.close();');h.tick();
assert(!h.elements.get('toast').textContent.includes(r("I18n.t('shadow.travel.locked')")),'A dev shrine arrival must not claim that available travel is locked');
for(const realm of ['-1','99','NaN',"'1'"]){const before=JSON.stringify(h.snap());assert(!r(`fastTravel({id:'start'},${realm})`));assert.equal(JSON.stringify(h.snap()),before);}
assert(!r("fastTravel({id:'missing'},1)"));assert(!r('fastTravel(null,0)'));
assert(r("fastTravel({id:'lower',x:1e9,y:-1e9},1)"));assert.equal(h.snap().checkpoint.x,r("yomi.rests.find(rest=>rest.id==='lower').x"));
r('DevTools.open();DevTeleport.teleport({realm:"dream",rest:"dream"});DevTools.close();');
assert(!r("fastTravel({id:'start'},0)"),'The dream remains outside the fast-travel UI');
r('showMap();');assert.equal(r('state'),'play');assert(r('Prologue.active'));
r('DevTools.open();DevTeleport.teleport({realm:"0",rest:"start"});DevTools.close();');
// End the test and resume the untouched normal save: every bypass must expire.
r('DevSession.end();');assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('window.__saveSnapshots.length'),writes);
r('startGame(true);');h.dismiss();
assert(!r('DevSession.active'));assert.equal(permanent(),progress);
assert(!r("fastTravel({id:'forestCamp'},0)"));assert(!r("fastTravel({id:'river'},0)"));
assert(!r("fastTravel({id:'start'},1)"));assert(!r("fastTravel({id:'altar'},3)"));
r('defeated=[true,true,true,false];flags[2].push("shadowEntered");visitedRests[3]=["start","altar"];');
assert(!r("fastTravel({id:'altar'},3)"),'Normal Shadow Altar lock remains active');
r('flags[3].push("shadowAltar");');assert(r("fastTravel({id:'altar'},3)"));
r('showMap();');assert(grids()[0].children.some(b=>b.disabled),'Normal undiscovered shrines stay disabled');
console.log(`PASS: ${destinations.length} dev shrine destinations from every realm, real map callbacks, grounded canonical arrival, no granted progression/writes, invalid/dream guards and normal unlock restoration.`);
