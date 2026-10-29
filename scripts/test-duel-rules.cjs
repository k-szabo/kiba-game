'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context=vm.createContext({console});
for(const file of ['weapons','duel-rules'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js',file+'.js'),'utf8'),context,{filename:file+'.js'});
const rules=vm.runInContext('DuelRules',context),neutral=()=>({move:0,jump:false,dash:false,attack:false,heavy:false});
const controls=extra=>({...neutral(),...extra});
const tick=(s,frames=1,input=neutral(),fps=60)=>{for(let i=0;i<frames;i++)rules.step(s,[input,neutral()],1/fps);};
for(const arena of [0,1,2,3])for(const weapons of [['katana','katana'],['naginata','swordShield']]){
 const s=rules.create({arena,weapons});assert(rules.validSnapshot(rules.snapshot(s)));tick(s,60);assert.equal(s.players[0].y,551);assert.equal(s.players[0].onGround,true);assert.equal(s.winner,null);
 assert(Object.isFrozen(rules.arenas[arena].platforms));
}
const near=(a,b,message)=>assert(Math.abs(a-b)<.02,message+': '+a+' vs '+b);
for(const fps of [30,60,120]){
 const s=rules.create(),p=s.players[0];tick(s,fps,controls({move:1}),fps);near(p.x,490,'Frame-independent movement');
 p.x=240;tick(s,1,controls({jump:true}),fps);const firstVy=p.vy;assert(firstVy<0);tick(s,Math.floor(fps*.15),controls({jump:true}),fps);assert.equal(p.jumps,1,'Holding jump cannot create the second jump');
 tick(s,1,neutral(),fps);tick(s,1,controls({jump:true}),fps);assert.equal(p.jumps,2);assert(p.vy<firstVy+80);
 tick(s,1,neutral(),fps);const oldVy=p.vy;tick(s,1,controls({jump:true}),fps);assert(p.vy>oldVy,'A third jump is rejected');tick(s,fps*2,neutral(),fps);assert.equal(p.onGround,true);assert.equal(p.jumps,0);
 const start=p.x;tick(s,1,controls({dash:true}),fps);assert(p.dashTime>0);tick(s,Math.ceil(fps*.25),controls({dash:true}),fps);assert.equal(p.dashTime,0);assert.equal(p.vx,0,'Dash cannot leave persistent speed');assert(p.x-start>60&&p.x-start<110);
 tick(s,1,neutral(),fps);tick(s,1,controls({jump:true}),fps);assert(p.vy<0);tick(s,Math.ceil(fps*.5),neutral(),fps);assert(p.vy>0,'Gravity resumes after dash and jump');tick(s,fps,neutral(),fps);
 assert.equal(p.dashCooldown,0);tick(s,1,controls({dash:true}),fps);assert(p.dashTime>0,'Dash becomes reusable after cooldown');assert(rules.validSnapshot(rules.snapshot(s)));
}
function fight(weapons=['katana','katana']){const s=rules.create({weapons});s.players[0].x=500;s.players[1].x=600;return s;}
for(const weapon of ['katana','naginata','swordShield'])for(const heavy of [false,true]){
 const s=fight([weapon,'katana']),target=s.players[1],hp=target.hp;tick(s,1,controls(heavy?{heavy:true}:{attack:true}));assert.equal(target.hp,hp,'Windup must not hit immediately');tick(s,100,controls(heavy?{heavy:true}:{attack:true}));
 const expected=3*(heavy?1.75:.75)*(weapon==='naginata'?1.25:1);near(target.hp,hp-expected,'A held attack produces exactly one impact');
 tick(s,1);tick(s,100,controls(heavy?{heavy:true}:{attack:true}));near(target.hp,hp-expected*2,'Release and repress starts the next attack');
}
{
 const s=fight(['katana','swordShield']),p=s.players[1],hp=p.hp;tick(s,40,controls({attack:true}));near(p.hp,hp-1.25,'Facing shield blocks exactly one damage');assert(p.guardCooldown>1);
 tick(s,1);tick(s,40,controls({attack:true}));near(p.hp,hp-1.25-2.25,'Shield cannot block during its cooldown');
}
{
 const s=fight(['katana','swordShield']),p=s.players[1];p.face=1;tick(s,40,controls({attack:true}));near(p.hp,p.maxHp-2.25,'A rear hit bypasses the directional shield');
}
{
 const s=fight();s.players.forEach(p=>p.hp=2);rules.step(s,[controls({attack:true}),controls({attack:true})]);for(let i=0;i<30;i++)rules.step(s,[neutral(),neutral()]);assert.equal(s.winner,'draw','Equally timed lethal attacks resolve together');
 const before=JSON.stringify(s);tick(s,60,controls({move:1}));assert.equal(JSON.stringify(s),before,'Completed matches cannot mutate further');
}
{
 const s=rules.create();s.players[0].x=20;tick(s,120);assert.equal(s.winner,1);assert.equal(s.players[0].hp,0,'Falling outside the arena floor is fatal');
}
{
 const s=rules.create(),before=JSON.stringify(s);for(const dt of [0,-1,NaN,Infinity])rules.step(s,[neutral(),neutral()],dt);assert.equal(JSON.stringify(s),before);
 rules.step(s,[controls({move:1}),neutral()],500);assert(s.players[0].x<254,'A stalled tab cannot advance an unbounded catch-up frame');
}
{
 assert(rules.validInput(neutral()));for(const bad of [null,[],{},controls({move:2}),controls({move:NaN}),controls({attack:'true'}),{...neutral(),x:900}]){assert(!rules.validInput(bad));assert.equal(JSON.stringify(rules.input(bad)),JSON.stringify(neutral()));}
 const source=rules.create(),snap=rules.snapshot(source);assert(rules.validSnapshot(snap));assert(!Object.hasOwn(snap.players[0],'held'));snap.players[0].x=300;assert.notEqual(source.players[0].x,300,'Network snapshots cannot mutate authoritative state');
 const fresh=()=>JSON.parse(JSON.stringify(rules.snapshot(rules.create())));
 for(const change of [s=>s.arena=5,s=>s.tick=-1,s=>s.winner='host',s=>s.players.push(s.players[0]),s=>s.players[0].x=Infinity,s=>s.players[0].hp=100,s=>s.players[0].weapon='gun',s=>s.players[0].jumps=3,s=>s.players[0].extra=1,s=>s.players[0].attack={kind:'heavy',elapsed:0,duration:99,impact:0,face:1,hit:false}]){const bad=fresh();change(bad);assert(!rules.validSnapshot(bad),'Malformed or overlarge snapshots are rejected');}
 assert.throws(()=>rules.create({arena:4}));assert.throws(()=>rules.create({weapons:['katana','gun']}));
}
console.log('PASS: isolated duel physics at30/60/120FPS, dash expiry and gravity, edge-triggered jumps/attacks, weapon damage, directional shield, simultaneous lethal hits, fatal falls and bounded network snapshots.');
