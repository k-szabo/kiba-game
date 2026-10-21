/* Focused physical-route and secrecy checks; no production test hooks. */
'use strict';
const assert=require('node:assert/strict');
const harness=require('./test-harness.cjs');
const {run,press,release,elements}=harness();
const chain=['entry','slayer-approach',...Array.from({length:10},(_,i)=>`slayer-step${i+1}`),'slayer-arena'];
function setup({sword=true,seal=true}={}){
  run(`Prologue.stop();abilities=[true,true];defeated=levels.map(()=>false);defeated[1]=${sword};flags=levels.map(()=>[]);flags[1]=${JSON.stringify(seal?['slayerSeal']:[])};enterRealm(1);state='play';enemies=enemies.filter(DoomSlayer.is);keys.clear();pressed.clear();`);
}
// Each attempt starts on its source ledge. Success requires real inputs,
// gravity, collisions and landing on the destination; no intermediate placing.
run(`function slayerRouteLink(fromId,toId,fps){
 const a=platforms.find(p=>p.id===fromId),b=platforms.find(p=>p.id===toId),dt=1/fps;
 if(!a||!b)return false;
 const starts=[clamp(b.x+b.w/2,a.x+25,a.x+a.w-25),a.x+25,a.x+a.w-25];
 for(const start of starts){
  initPlayer({x:start,y:a.y});keys.clear();pressed.clear();
  const dropping=b.y>a.y+40&&a.drop&&start>=b.x&&start<=b.x+b.w;
  const target=clamp(start,b.x+25,b.x+b.w-25);
  if(dropping)keys.add('s');pressed.add(' ');let second=false;
  for(let frame=0;frame<Math.ceil(5.5*fps);frame++){
   updatePlayerTimers(dt);movingPlatforms(dt);
   keys.delete('a');keys.delete('d');const dx=target-(player.x+player.w/2);
   if(Math.abs(dx)>7)keys.add(dx>0?'d':'a');
   if(b.y<=a.y&&!second&&frame*dt>.2&&player.vy>-10&&!player.onGround){pressed.add(' ');second=true;}
   input(dt);movePlayer(dt);pressed.clear();
   if(player.onGround&&player.support===b.id)return true;
   if(player.y>b.y+600||frame*dt>.7&&player.onGround&&player.support!==a.id&&player.support!==b.id)break;
  }
 }
 return false;
}`);
for(const fps of [30,60,120]){
  setup();
  for(let i=1;i<chain.length;i++)for(const [from,to] of [[chain[i-1],chain[i]],[chain[i],chain[i-1]]]){
    assert(run(`slayerRouteLink(${JSON.stringify(from)},${JSON.stringify(to)},${fps})`),`${fps} FPS: physical route ${from} -> ${to} failed`);
  }
}
console.log('PASS: all 12 authored links and their returns land through actual input/movement physics at 30/60/120 FPS.');

for(const fps of [30,60,120])for(const sword of [false,true]){
  setup({sword,seal:false});
  assert.equal(run("gatePass(level.gates.find(g=>g.id==='slayerSeal'))"),false,'Defeating Yomi alone must not open the seal');
  assert(!run(`slayerRouteLink('entry','slayer-approach',${fps})`),'Double jump bypasses the closed seal from the entrance');
  assert(!run(`slayerRouteLink('first-left','slayer-approach',${fps})`),'The lower descent bypasses the closed seal');
  run("initPlayer({x:1191.5,y:450});player.inv=999;");
  press('a');run(`for(let i=0;i<${fps};i++)update(1/${fps});`);release('a');
  assert(run('player.x>=1170-1e-6'),'Closed seal allows walking into the annex');
  press('k');run(`for(let i=0;i<${Math.ceil(fps*.25)};i++)update(1/${fps});`);release('k');
  assert(run('player.x>=1170-1e-6'),'Closed fire seal allows Spirit Dash into the annex');
  assert(!run("flags[1].includes('slayerSeal')"),'Movement must not break the seal');
  run('player.face=-1;');press('j');run(`for(let i=0;i<${Math.ceil(fps*.6)};i++)update(1/${fps});`);release('j');
  assert.equal(run("flags[1].includes('slayerSeal')"),sword,'Only a Dawnblade melee hit may record the seal flag');
  assert.equal(run("gatePass(level.gates.find(g=>g.id==='slayerSeal'))"),sword);
  if(sword){
    press('a');run(`for(let i=0;i<${Math.ceil(fps*.5)};i++)update(1/${fps});`);release('a');
    assert(run('player.x+player.w<1120'),'The struck seal must permit physical passage');
  }
}
setup({sword:false});
assert.equal(run("gatePass(level.gates.find(g=>g.id==='slayerSeal'))"),false,'A seal flag alone cannot replace Dawnblade ownership');
console.log('PASS: walking/dash cannot open the seal; Yomi victory still needs an actual sword strike at every tested frame rate.');

setup();
const arena=run("yomi.secrets.find(area=>area.id==='slayerGrave').arena");
assert.equal(arena.w,1500,'Combat space must be half the original 3000px arena');
assert.equal(run("platforms.find(p=>p.id==='slayer-arena').w"),arena.w);
for(const point of run("[yomi.slayerGrave,...yomi.objects.filter(o=>o.type==='slayerLoot'),yomi.enemies.find(e=>e.id==='doomSlayer')].map(p=>({x:p.x,y:p.y}))")){
 assert(point.x>arena.x+70&&point.x<arena.x+arena.w-70&&point.y===arena.y,'Grave, guardian and rewards must stand inside the shortened arena');
}
const objective=run('JSON.stringify(nextObjective())');
run("initPlayer(yomi.slayerGrave);resetCamera();$('toast').textContent='unchanged';toastTimer=0;");
run('for(let i=0;i<360;i++)update(1/60);');
assert(run("flags[1].includes('discovered:slayerGrave')"),'Fixture never exercised actual secret discovery');
assert(!run('enemies.find(DoomSlayer.is).active'),'Walking into the arena must not summon its guardian');
assert.equal(run('state'),'play');
assert.equal(elements.get('toast').textContent,'unchanged','Secret discovery must not announce this easter egg');
assert.equal(run('JSON.stringify(nextObjective())'),objective,'The secret must not replace the main compass target');
assert.equal(run('getContext()?.type'),'slayerGrave','Only deliberate grave interaction should offer summoning');
run("flags[1].push('compass','minimap');updateHUD();");
assert.equal(run('JSON.stringify(nextObjective())'),objective);
// Compare both renderers against the same world without annex geometry. This
// catches actual leaked lines/markers, including after discovery, rather than
// merely asserting that metadata contains an 'unmapped' field.
run("initPlayer(level.start);showMap();");
const ordinaryMap=elements.get('mapContent').children[0].innerHTML;
run("closeMap();var slayerRoutePlatforms=platforms;platforms=platforms.filter(p=>p.secretArea!=='slayerGrave');showMap();");
assert.equal(elements.get('mapContent').children[0].innerHTML,ordinaryMap,'The world map reveals annex geometry or markers');
run('closeMap();platforms=slayerRoutePlatforms;');
const minimapCalls=[];
run("$('minimapCanvas');");
elements.get('minimapCanvas').getContext=()=>new Proxy({}, {get:(_,key)=>(...args)=>minimapCalls.push([key,...args])});
run('Merchant.drawMinimap();');const withAnnex=JSON.stringify(minimapCalls);minimapCalls.length=0;
run("var slayerAuthoredPlatforms=level.platforms;level.platforms=level.platforms.filter(p=>p.secretArea!=='slayerGrave');Merchant.drawMinimap();level.platforms=slayerAuthoredPlatforms;");
assert.equal(JSON.stringify(minimapCalls),withAnnex,'The local minimap reveals annex geometry or markers');
assert(minimapCalls.some(([method])=>method==='lineTo'),'Minimap comparison must exercise actual terrain drawing');
run('resetCamera();');
assert(!run('visiblePoint(yomi.slayerGrave,190)'),'The grave is visible from the Yomi starting position');
assert(!run('visiblePoint(enemies.find(DoomSlayer.is),190)'),'The guardian is visible from the Yomi starting position');
console.log('PASS: visiting the grave does not auto-start, toast or redirect the compass; discovered annex stays absent from both maps and hidden at spawn.');

setup();
run("initPlayer({x:1250,y:-1700});flags[1].push('slayerSummoned');var oldSlayer=enemies.find(DoomSlayer.is);DoomSlayer.start(oldSlayer);for(let i=0;i<20;i++)update(1/120);player.inv=0;damage(player.hp);");
assert(run('player!==oldSlayer.victim&&!player.slayerGrab'));
assert(run('!enemies.find(DoomSlayer.is).active&&!enemies.find(DoomSlayer.is).dead'));
assert(run('enemies.find(DoomSlayer.is).hp===enemies.find(DoomSlayer.is).maxHp'));
assert(run('projectiles.every(p=>!p.slayer)'));
assert(run('enemies.find(DoomSlayer.is).graveAwake&&enemies.find(DoomSlayer.is).hazards.length===0&&enemies.find(DoomSlayer.is).oils.length===0&&enemies.find(DoomSlayer.is).barrels.length===9'));
assert(!run("flags[1].includes('guardian:doomSlayer')"),'Losing must not defeat the optional guardian');
// Defeat via the real encounter damage API, then exercise both death and reentry.
run("initPlayer({x:1250,y:-1700});var victoriousSlayer=enemies.find(DoomSlayer.is);DoomSlayer.start(victoriousSlayer);victoriousSlayer.phase='recover';DoomSlayer.hit(victoriousSlayer,{...victoriousSlayer},1000,'heavy');");
assert(run("flags[1].includes('guardian:doomSlayer')"));
assert(run("__saveSnapshots.some(record=>JSON.parse(record).flags[1].includes('guardian:doomSlayer'))"),'Defeat was not serialized');
run('player.inv=0;damage(player.hp);');
assert(run('enemies.find(DoomSlayer.is).dead&&!enemies.find(DoomSlayer.is).active'),'Ordinary death respawns the defeated guardian');
run("enterRealm(0);enterRealm(1);state='play';");
assert(run('enemies.find(DoomSlayer.is).dead&&!enemies.find(DoomSlayer.is).active'),'Realm reentry revives the defeated guardian');
assert.equal(run('DoomSlayer.start(enemies.find(DoomSlayer.is))'),false);
console.log('PASS: death resets an unfinished encounter, while recorded defeat survives death/reentry and prevents incidental resummoning.');
