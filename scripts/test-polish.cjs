const assert=require('node:assert/strict');
const {run,tick,press,release,dismiss,snap,elements,sandbox}=require('./test-harness.cjs')();
const ctx=sandbox.document.getElementById('world').getContext('2d'),calls=[];
ctx.drawImage=(...args)=>calls.push(args.slice(1));
function playerFrame(){calls.length=0;run('drawPlayer()');assert.equal(calls.length,1,'Momo disappears or gains a duplicate during protection');return [...calls[0]];}

assert.equal(snap().player.onGround,true,'A shrine spawn must immediately use its grounded pose');
assert.equal(snap().player.support,'road0');
for(let i=0;i<120;i++){tick();playerFrame();}
run('player.inv=.8;pause();');
const paused=snap().player,pausedTime=run('time'),pose=playerFrame();
for(let i=0;i<180;i++){tick();assert.deepEqual(playerFrame(),pose);}
assert.equal(run('time'),pausedTime);assert.deepEqual(snap().player,paused);
run('pause();player.x=level.ability.x-21.5;player.y=level.ability.y-69;player.vx=120;player.inv=.5;');
press('e');tick();release('e');assert.equal(snap().state,'dialog');
const dialogPose=playerFrame(),dialogPlayer=snap().player;
tick(160);assert.deepEqual(playerFrame(),dialogPose);assert.deepEqual(snap().player,dialogPlayer);
dismiss();
run('player.onGround=false;player.vy=-350;');const rising=playerFrame();
run('player.animationTime+=99;');assert.deepEqual(playerFrame(),rising,'Airborne poses must follow velocity, not cycle through repeated jumps');
run('player.vy=350;');assert.notEqual(playerFrame()[0],rising[0]);
run("story('prologue.wake.label','prologue.wake.title','prologue.wake.story')");
assert.equal(elements.get('dialogText').children.length,3,'The awakening needs readable story paragraphs');

// Test the painted platform footprints through the full horizontal movement range.
run("var polishLevels=levels.map(l=>({id:l.id,platforms:l.platforms.map(p=>({...p}))}));");
for(const level of run('polishLevels')){
 for(let i=0;i<level.platforms.length;i++)for(let j=i+1;j<level.platforms.length;j++){
  const a=level.platforms[i],b=level.platforms[j];
  const height=p=>p.kind==='ground'?Math.max(130,p.h):level.id==='heaven'||p.secretArea==='angelRuin'?90:70;
  const horizontal=Math.min(a.x+a.w+(a.range||0),b.x+b.w+(b.range||0))-Math.max(a.x-(a.range||0),b.x-(b.range||0));
  const vertical=Math.min(a.y+height(a),b.y+height(b))-Math.max(a.y,b.y);
  assert(!(horizontal>0&&vertical>0),`${level.id}: painted platforms overlap: ${a.id} / ${b.id}`);
 }
}
assert.deepEqual(Array.from(run('heaven.rests.map(r=>r.id)')),['start','third','arena']);
assert(run('heaven.rests.every(r=>heaven.winds.filter(w=>!w.afterBoss).every(w=>Math.abs(r.x-(w.x+w.w/2))>w.w/2+105||r.y<w.y||r.y>w.y+w.h))'),'An ascent wind automatically carries Momo through a shrine');

// Current-release locations remain strict; previous-release saves are reset, not migrated.
const validate=require('./test-save-validation.cjs');
run("state='play';abilities=[true,true];defeated=[true,true,false];flags=[['forestBell','villageBell'],['soulUpper','soulLower'],[]];enterRealm(2);persist();");
const saved=JSON.parse(JSON.stringify(run('saved')));
for(const [id,x,y,replacement] of [['first',830,5370,'start'],['second',2070,4120,'start'],['third',810,2770,'third'],['fourth',2170,1470,'third']]){
 const old=JSON.parse(JSON.stringify(saved));old.checkpoint={id,x,y,name:id};old.visitedRests[2]=['start',id].filter((v,i,a)=>a.indexOf(v)===i);
 assert.throws(()=>validate(old),/Invalid checkpoints|Invalid save location/,'Historical coordinates are not migrated into the current release');
 old.release='0.8.2';assert.throws(()=>validate(old),/release|schema/i,'A previous release cannot be restored');
}
const full=JSON.parse(JSON.stringify(saved));full.visitedRests[2]=['start','first','second','third','fourth','arena'];
assert.throws(()=>validate(full),/Invalid checkpoints/);
full.visitedRests[2].push('unknown');assert.throws(()=>validate(full),/Invalid checkpoints/);
assert(validate(saved));
// Decorative architecture must not look like an unusable resting shrine.
run("enterRealm(0);state='play';camera=2500;cameraY=1700;");calls.length=0;
run('Visuals.secretScenery(realms[0]);');
const decorativeShrine=run('ART_FRAMES.props.shrine');
assert(!calls.some(args=>args[0]===decorativeShrine.x&&args[1]===decorativeShrine.y&&args[2]===decorativeShrine.w&&args[3]===decorativeShrine.h),'Cult cave still renders its unusable shrine');
// Only the dash-granting shrine remains on this Yomi ledge, with no rest/map entry.
run("abilities=[true,false];enterRealm(1);state='play';initPlayer(level.ability);keys.clear();pressed.clear();");
assert(!run("level.rests.some(r=>r.id==='shadow'||Math.abs(r.y-level.ability.y)<85)"));
assert.equal(run('getContext().type'),'ability');
press('e');tick();release('e');dismiss();assert(snap().abilities[1],'Removing the redundant shrine removed dash acquisition');
assert.equal(run('trainingRest()'),undefined,'The removed rest still permits training');
run('showMap();');assert.equal(elements.get('mapContent').children.find(el=>el.className==='travel-grid').children.length,5,'Map still offers the removed Yomi rest');run('closeMap();');
run('resetCamera();var shrineDraws=[],originalDrawShrine=drawShrine;drawShrine=(x,y,r,ability)=>shrineDraws.push({x,y,ability});draw();drawShrine=originalDrawShrine;');
assert.equal(run('shrineDraws.length'),1,'The dash ledge renders an extra shrine');assert(run('shrineDraws[0].ability'));
console.log('PASS: grounded spawns, continuous protection visibility, frozen pause/interaction poses, velocity-driven air poses, three story paragraphs, no platform overlaps, three intentional sky shrines and strict current-release checkpoint validation.');
