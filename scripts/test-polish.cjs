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
console.log('PASS: grounded spawns, continuous protection visibility, frozen pause/interaction poses, velocity-driven air poses, three story paragraphs, no platform overlaps, three intentional sky shrines and strict current-release checkpoint validation.');
