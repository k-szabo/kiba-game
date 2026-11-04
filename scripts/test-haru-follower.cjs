'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sandbox={};vm.createContext(sandbox);vm.runInContext(fs.readFileSync('assets/js/haru-follower.js','utf8')+';globalThis.Follower=HaruFollower;',sandbox);
const ground={id:'ground',x:0,y:500,w:1000};
function advance(follower,player,platforms,seconds,fps){for(let i=0;i<seconds*fps;i++)follower.update(1/fps,player,platforms);return follower.snapshot();}
for(const fps of [30,60,120]){
 const follower=sandbox.Follower.create();follower.reset({x:80,y:430},[ground]);
 let state=advance(follower,{x:700,y:430,w:42,h:70,onGround:true},[ground],4,fps);
 assert(state.onGround&&Math.abs(state.x-(700-78))<4,'Follower catches up on solid ground at '+fps+' FPS');
 const paused=JSON.stringify(state);follower.update(1,{x:950,y:430,onGround:true},[ground],{active:false});assert.equal(JSON.stringify(follower.snapshot()),paused,'Pause freezes all movement and animation');
 const stairs=[{id:'low',x:0,y:500,w:300},{id:'middle',x:250,y:410,w:260},{id:'high',x:460,y:320,w:280}];
 follower.reset({x:80,y:430},stairs);state=advance(follower,{x:650,y:250,w:42,h:70,onGround:true},stairs,6,fps);
 assert.equal(state.support,'high','Follower climbs single-jump 90px steps at '+fps+' FPS');
 const descent=[{id:'top',x:0,y:250,w:250},{id:'lower',x:230,y:430,w:350}];
 follower.reset({x:80,y:180},descent);state=advance(follower,{x:500,y:360,w:42,h:70,onGround:true},descent,6,fps);
 assert.equal(state.support,'lower','Follower walks off ledge and lands below at '+fps+' FPS');
 const descendingGap=[{id:'upper-left',x:0,y:250,w:250},{id:'lower-right',x:310,y:430,w:350}];
 follower.reset({x:80,y:180},descendingGap);state=advance(follower,{x:550,y:360,w:42,h:70,onGround:true},descendingGap,6,fps);assert.equal(state.support,'lower-right','Airborne descent keeps steering toward the lower platform');
 const drop=[{id:'bridge',x:0,y:250,w:500,drop:true},{id:'below',x:0,y:430,w:500}];
 follower.reset({x:80,y:180},drop);state=advance(follower,{x:400,y:360,w:42,h:70,onGround:true},drop,4,fps);assert.equal(state.support,'below','Follower drops through one-way platform');
 const gap=[{id:'left',x:0,y:500,w:250},{id:'right',x:330,y:500,w:300}];
 follower.reset({x:80,y:430},gap);state=advance(follower,{x:550,y:430,w:42,h:70,onGround:true},gap,5,fps);assert.equal(state.support,'right','Follower jumps a reachable gap');
 const unsafe=[{id:'start',x:0,y:500,w:250},{id:'far',x:1600,y:500,w:250}];
 follower.reset({x:80,y:430},unsafe);state=advance(follower,{x:1700,y:430,w:42,h:70,onGround:true},unsafe,3,fps);assert.equal(state.x,80,'No unsafe teleport or jump over an unreachable gap');
 follower.reset({x:30,y:430,face:-1},[ground]);state=follower.snapshot();assert.equal(state.x,30);assert.equal(state.face,-1);assert.equal(state.vx,0);assert.equal(state.animationTime,0);
 for(const dt of [NaN,Infinity,-1,0]){const before=JSON.stringify(follower.snapshot());follower.update(dt,{x:700,y:430,onGround:true},[ground]);assert.equal(JSON.stringify(follower.snapshot()),before,'Invalid delta does not mutate follower');}
}
console.log('PASS: Haru follows on ground, jumps ascending steps and gaps, descends/drops safely, freezes on pause and resets across 30/60/120 FPS.');
