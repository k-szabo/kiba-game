'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({});
for(const name of ['grapple-rules','watchtower-balloon-maps'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/'+name+'.js'),'utf8'),ctx);
const helpers={
 makeLevel:(id,width,height,start)=>({id,width,height,start,platforms:[],rests:[],enemies:[],zones:[]}),
 ledge:(l,id,x,y,w,kind,h)=>l.platforms.push({id,x,y,w,h,kind,drop:kind!=='ground'}),
 rest:(l,id,x,y,name)=>l.rests.push({id,x,y,name}),
 foe:(l,id,x,y,kind,group,patrol)=>l.enemies.push({id,x,y,kind,group,patrol}),
 zone:(l,name,x,y,w,h)=>l.zones.push({name,x,y,w,h})
};
const maps=vm.runInContext('createWatchtowerBalloonMaps',ctx)(helpers),rules=vm.runInContext('GrappleRules',ctx),tower=maps.ninjaWatchtower;
assert.equal(Object.keys(maps).length,4);
for(const map of Object.values(maps)){
 assert(map.platforms.some(p=>map.start.x>=p.x&&map.start.x<p.x+p.w&&map.start.y===p.y),'Spawn has support: '+map.id);
 for(const r of map.rests)assert(map.platforms.some(p=>r.x>=p.x&&r.x<p.x+p.w&&r.y===p.y),'Rest has support: '+r.id);
 assert.equal(new Set(map.platforms.map(p=>p.id)).size,map.platforms.length);
}
const tiers=Array.from({length:7},(_,i)=>tower.platforms.find(p=>p.id==='watchtower-tier-'+i));
function grapple(body,face,id,fps){
 const selected=rules.target({x:body.x+body.w/2,y:body.y+body.h/2},face,{terrain:tower.platforms,anchors:tower.grappleAnchors});
 assert.equal(selected?.id,id,'Facing-based targeting must choose intended tier: '+id);
 assert(selected.distance<=900);
 for(let i=0;i<fps*2;i++){
  const step=rules.move(body,selected,1/fps,tower.platforms);assert(step&&!step.blocked,'Full body must clear ledges: '+id+' at '+fps+' FPS');
  body={...body,x:step.x,y:step.y};if(step.done)return body;
 }
 throw Error('Grapple did not finish');
}
tiers.push(tower.platforms.find(p=>p.id==='watchtower-cellar-floor'));
for(const fps of [30,60,120])for(let i=1;i<tiers.length;i++){
 const low=tiers[i],high=tiers[i-1];
 const climbed=grapple({x:low.x+100,y:low.y-70,w:42,h:70},1,high.id+'-ring',fps);
 assert(climbed.x+42>high.x&&climbed.x<high.x+high.w&&climbed.y+70<high.y,'Pull ends above upper ledge');
 // Like the existing island return route, descending starts with a jump from
 // the edge to keep the departing floor outside the body's swept volume.
 const dropped=grapple({x:high.x+1,y:high.y-180,w:42,h:70},-1,(i===7?'watchtower-cellar-ring':low.id+'-ring'),fps);
 assert(dropped.x+42>low.x&&dropped.x<low.x+low.w&&dropped.y+70<low.y,'Pull ends above lower ledge');
}
assert.equal(tower.enemies.filter(e=>e.miniboss).length,2);
assert(maps.skyLanding.enemies.some(e=>e.miniboss==='westheruSeal'));
assert(maps.stormIslands.enemies.some(e=>e.shadowNinjaRole)&&maps.stormIslands.enemies.some(e=>e.factionOverride==='shadowCult'));
console.log('PASS: watchtower tier targeting and full-body bidirectional grapples at 30/60/120 FPS; supported spawns/rests and encounter catalog.');
