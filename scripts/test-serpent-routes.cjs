/* Route acceptance uses the actual movement, collision and gravity pipeline. */
'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
function setup(realm,fps,abilities=[false,false]){
 const h=harness(),r=h.run;
 r(`Prologue.stop();abilities=${JSON.stringify(abilities)};defeated=levels.map(()=>false);flags=levels.map(()=>[]);enterRealm(${realm});enemies=[];boss.dead=true;state='play';const serpentRouteDt=1/${fps};
 function serpentRouteStep(direction=0,jump=false,drop=false){keys.clear();pressed.clear();if(direction)keys.add(direction>0?'d':'a');if(jump)pressed.add(' ');if(drop)keys.add('s');update(serpentRouteDt);player.inv=999;}
 function serpentRoutePlace(id){const p=platforms.find(p=>p.id===id);initPlayer({x:p.x+p.w/2,y:p.y});player.inv=999;}
 function serpentRouteLand(id){
  const target=platforms.find(p=>p.id===id),from=platforms.find(p=>p.id===player.support);if(!target||!from)return false;
  const launch=clamp(target.x+target.w/2,from.x+25,from.x+from.w-25);
  for(let i=0;i<${fps}*12&&Math.abs(player.x+player.w/2-launch)>5;i++){serpentRouteStep(Math.sign(launch-player.x-player.w/2));if(!player.onGround||player.support!==from.id)return false;}
  const aim=clamp(player.x+player.w/2,target.x+25,target.x+target.w-25);
  for(let i=0;i<${fps}*4;i++){const delta=aim-player.x-player.w/2;serpentRouteStep(Math.abs(delta)>5?Math.sign(delta):0,i===0,i===0&&target.y>from.y&&player.x+player.w>target.x&&player.x<target.x+target.w);if(player.onGround&&player.support===id)return true;if(player.y>target.y+400)return false;}
  return false;
 }
 `);return h;
}
const routes=[{realm:0,base:'river-cave',path:['white-serpent-entry','white-serpent-mouth','white-serpent-step','white-serpent-arena'],secret:'whiteSerpentCave',guardian:'whiteSerpent'},
 {realm:2,base:'fourth-launch',path:['winged-serpent-bridge1','winged-serpent-bridge2','winged-serpent-bridge3','winged-serpent-arena'],secret:'wingedSerpentRoost',guardian:'wingedSerpent'}];
for(const fps of [30,60,120])for(const route of routes){
 const h=setup(route.realm,fps),r=h.run;
 r(`serpentRoutePlace('${route.base}');`);
 for(const target of route.path)assert(r(`serpentRouteLand('${target}')`),`Single-jump entry ${route.realm}/${target} at${fps}FPS`);
 assert(r(`flags[${route.realm}].includes('discovered:${route.secret}')`),'The optional branch is discovered by entering its real geometry');
 for(const target of [...route.path.slice(0,-1)].reverse().concat(route.base))assert(r(`serpentRouteLand('${target}')`),`Single-jump return ${route.realm}/${target} at${fps}FPS`);
 assert(!r(`flags[${route.realm}].includes('guardian:${route.guardian}')`),'Merely travelling never defeats the guardian or grants a scale');
}
{
 const h=setup(0,60),r=h.run;
 assert(r(`japan.rests.map(r=>r.id).join(',')==='start,river,fields,temple'`),'No unnecessary shrine is added');
 assert(r(`!Object.hasOwn(MERCHANT_SALES,'serpentScale')`),'The Yomi quest scale cannot be sold before its fusion');
 assert(r(`japan.secrets.find(s=>s.id==='whiteSerpentCave').arena.x>japan.secrets.find(s=>s.id==='cultCave').x+japan.secrets.find(s=>s.id==='cultCave').w`),'White cave is east of the cultist chamber');
 assert(r(`japan.gates.find(g=>g.id==='cultEntrance').y+japan.gates.find(g=>g.id==='cultEntrance').h===japan.height`),'Existing cultist barrier remains closed to the fatal-fall limit');
}
{
 const h=setup(2,60),r=h.run;
 assert(r(`heaven.father.x===1570&&heaven.father.y===260&&heaven.boss.x===2560&&heaven.boss.y===850`),'Existing summit and main boss placement is retained');
 assert(r(`heaven.rests.map(r=>r.id).join(',')==='start,third,arena'`),'The optional roost reuses the nearest existing shrine');
 assert(r(`heaven.platforms.filter(p=>p.secretArea==='wingedSerpentRoost').every(p=>p.y>=2340)`),'The eastern branch stays below the sealed upper ascent');
 assert(r(`heaven.secrets.find(s=>s.id==='wingedSerpentRoost').arena.x>3200`),'The winged encounter is outside the main ascent');
}
console.log('PASS: optional white-cave and winged-roost entrances, discovery and continuous single-jump returns at30/60/120FPS, protected quest scale and unchanged main guardian/summit checkpoints.');
