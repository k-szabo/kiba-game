'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context=vm.createContext({});
const mapDir=path.join(__dirname,'../assets/config/maps');
context.MAP_DATA=Object.fromEntries(fs.readdirSync(mapDir).filter(name=>name.endsWith('.json')).map(name=>{const map=JSON.parse(fs.readFileSync(path.join(mapDir,name),'utf8').replace(/^\uFEFF/,''));return [map.id,map];}));
for(const name of ['third-clan-rules','map-catalog','third-clan-maps']){
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/'+name+'.js'),'utf8'),context);
}
const rules=vm.runInContext('ThirdClanRules',context),{progress}=rules;
let flags=[[],[],[],[]];
assert(rules.valid(flags),'Pre-feature saves require no new fields');
assert.equal(rules.advance(flags,progress.accepted),null);
flags[0].push('ninjaClanRitualistReward','ninjaClanDebrief');
assert.equal(rules.stage(flags),'briefing');
assert.equal(rules.advance(flags,progress.ballistae[0]),null);
const before=JSON.stringify(flags);
const advance=id=>{const next=rules.advance(flags,id);assert(next);flags=[next,...flags.slice(1)];};
const accepted=rules.advance(flags,progress.accepted);
assert.equal(JSON.stringify(flags),before,'Milestones never mutate caller-owned flags');
assert(accepted.includes(progress.accepted));
advance(progress.accepted);
for(const index of [2,0,1]){
 assert.equal(rules.advance(flags,progress.guardian),null);
 const id=progress.ballistae[index];
 advance(id);
 assert.equal(rules.advance(flags,id),null,'A disabled ballista cannot count twice');
}
assert.equal(rules.stage(flags),'guardian');
assert.equal(rules.advance(flags,progress.trail),null);
for(const kind of ['normal','ultimate',null])assert.equal(rules.strikeArmor(4,kind),4);
let armor=rules.armorLayers;
for(let i=3;i>=0;i--){armor=rules.strikeArmor(armor,'heavy');assert.equal(armor,i);}
assert.equal(rules.strikeArmor(0,'heavy'),0);
for(const dt of [1/30,1/60,1/120,4]){
 let elapsed=0;
 const events=[];
 for(let i=0;i<Math.ceil(rules.airship.finishAt/dt)+3;i++){
  const next=rules.stepAirship(elapsed,dt);
  if(next.fired)events.push('fire');
  if(next.impact)events.push('impact');
  if(next.finished)events.push('finish');
  elapsed=next.elapsed;
 }
 assert.deepEqual(events,['fire','impact','finish'],'The shot fires, hits and commits once at every frame rate');
}
advance(progress.guardian);advance(progress.trail);
assert.equal(rules.stage(flags),'complete');
assert(rules.valid(flags));
for(const prerequisite of [progress.accepted,...progress.ballistae,progress.guardian,'ninjaClanDebrief']){
 assert(!rules.valid([flags[0].filter(id=>id!==prerequisite),[],[],[]]));
}
const createMaps=vm.runInContext('createThirdClanMaps',context);
const {route,cave}=createMaps({
 makeLevel:(id,width,height,start)=>({id,width,height,start,platforms:[],rests:[],enemies:[]}),
 ledge:(map,id,x,y,w)=>map.platforms.push({id,x,y,w}),
 rest:(map,id,x,y)=>map.rests.push({id,x,y}),zone:()=>{}
});
const grounded=(map,{x,y})=>map.platforms.some(p=>p.x<=x&&p.x+p.w>=x&&p.y===y);
assert(route.platforms.every((p,i,all)=>!i||(p.y>all[i-1].y&&p.x<all[i-1].x+all[i-1].w)));
for(const [index,anchor] of route.grappleAnchors.entries()){
 const lower=route.platforms[index+1];
 assert(Math.hypot(anchor.x-lower.x,anchor.y-lower.y)<900,'Each upper anchor is reachable from below');
}
assert.deepEqual(Array.from(route.ballistae,point=>point.id),Array.from(progress.ballistae));
for(const point of [route.start,route.returnPoint,route.caveEntrance,...route.rests,...route.ballistae,...route.enemies])assert(grounded(route,point));
for(const point of [cave.start,cave.returnPoint,cave.guardian,cave.haruTrail,...cave.rests])assert(grounded(cave,point));
assert.equal(cave.returnDestination.location,route.id);
console.log('PASS third-clan milestones, armor and grounded descending route geometry.');
