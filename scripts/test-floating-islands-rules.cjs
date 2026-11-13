'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({});
const path=require('node:path'),mapDir=path.join(__dirname,'../assets/config/maps');context.MAP_DATA=Object.fromEntries(fs.readdirSync(mapDir).filter(name=>name.endsWith('.json')).map(name=>{const map=JSON.parse(fs.readFileSync(path.join(mapDir,name),'utf8'));return [map.id,map];}));
for(const name of ['grapple-rules','floating-islands-rules','map-catalog'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/'+name+'.js'),'utf8'),context);
const grapple=vm.runInContext('GrappleRules',context),story=vm.runInContext('FloatingIslandsRules',context);
const wall={id:'wall',x:450,y:0,w:40,h:400},enemy={id:'small',x:650,y:100,w:40,h:60,grappleable:true};
assert.equal(grapple.target({x:0,y:120},1,{terrain:[wall],enemies:[enemy]}),null,'A wall blocks enemy pulling');
assert.equal(grapple.target({x:0,y:120},1,{enemies:[enemy]}).type,'enemy');
assert.equal(grapple.target({x:0,y:120},1,{enemies:[{...enemy,x:920}]}),null,'A small enemy beyond range is unreachable');
assert.equal(grapple.target({x:0,y:120},1,{enemies:[{...enemy,miniboss:'ninja'}]}),null,'Bosses cannot be pulled even if mistakenly marked grappleable');
assert.equal(grapple.target({x:0,y:120},-1,{enemies:[enemy]}),null,'Facing away never selects the enemy');
assert.equal(grapple.target({x:NaN,y:120},1),null);
assert.equal(grapple.range,900);
const ring={id:'ring',x:500,y:-100,w:40,h:40};
assert.equal(grapple.target({x:0,y:120},1,{anchors:[ring]}).type,'anchor');
assert.equal(grapple.target({x:0,y:120},1,{anchors:[ring],enemies:[enemy]}).type,'enemy','The first small enemy ahead takes priority');
assert.equal(grapple.target({x:0,y:120},1,{enemies:[enemy,{...enemy,id:'near',x:200}]}).id,'near','Array order does not select a farther enemy');
assert.equal(grapple.target({x:0,y:120},1,{enemies:[{...enemy,y:-300}]}),null,'Enemies on another tier do not steal the anchor target');
assert.equal(grapple.target({x:0,y:120},1,{anchors:[{...ring,x:920}]}),null);
assert.equal(grapple.target({x:0,y:120},1,{terrain:[wall]}),null,'Ordinary terrain is never a free aiming target');
for(const fps of [30,60,120]){
 let body={x:0,y:100,w:40,h:60},last;
 for(let i=0;i<fps;i++){last=grapple.move(body,{x:900,y:130},1/fps,[wall]);body={...body,...last};if(last.done)break;}
 assert(last.blocked,'Swept movement hits solid terrain at '+fps+' FPS');
 assert(body.x+body.w<=wall.x+0.01&&body.x>409,'The full actor stops against the wall at '+fps+' FPS');
 const floor={x:-100,y:160,w:1000,h:200};
 const away=grapple.move({x:0,y:100,w:40,h:60},{x:300,y:0},1/fps,[floor]);
 assert(!away.blocked&&away.y<100,'An actor can pull away from the floor at '+fps+' FPS');
}
assert.equal(grapple.move({x:0,y:0,w:40,h:60},{x:500,y:0},0),null,'A frozen frame does not advance motion');
const old=[[],[],[],[]];assert(story.validate(old),'Compatible existing progress needs no new flags');
assert(!story.transition(old,'escape').ok,'The new story requires the Japan arrival conversation');
const flags=[[],[],[],['zigguratReturnCompleted']];
assert(!story.transition(flags,'takeHook').ok);
const escaped=story.transition(flags,'escape');assert(escaped.ok);assert(story.abducted(escaped.flags));assert.equal(flags[0].length,0,'Transitions never mutate the source flags');
assert(!story.transition(escaped.flags,'escape').ok,'The kidnapping cannot repeat');
assert(!story.transition(escaped.flags,'reachTrail').ok);
const hook=story.transition(escaped.flags,'takeHook');assert(hook.ok&&story.hookOwned(hook.flags));
const reached=story.transition(hook.flags,'reachTrail');assert(reached.ok&&story.validate(reached.flags));
assert(!story.validate([['grapplingHook'],[],[],['zigguratReturnCompleted']]),'Out-of-order acquisition is invalid');
assert(!story.validate([['haruAbducted'],[],[],['zigguratReturnCompleted']]),'Kidnapping and escape must commit together');
assert(story.shouldEscape(700,1000));assert(story.shouldEscape(0,1000));assert(!story.shouldEscape(701,1000));assert(!story.shouldEscape(10,NaN));
const map=vm.runInContext("MapCatalog.build('floatingIslands')",context);
const maxJumpRise=(590**2+650**2)/(2*1550);
for(let i=1;i<map.platforms.length;i++){
 const left=map.platforms[i-1],right=map.platforms[i],origin={x:left.x+left.w-20,y:left.y-35};
 assert(left.y-right.y>maxJumpRise,'Each mandatory rise exceeds both jumps combined');
 assert.equal(right.x-left.x-left.w,680,'Crossings retain a wide open gap');
 const selected=grapple.target(origin,1,{terrain:map.platforms,anchors:map.grappleAnchors});
 assert(selected&&selected.id==='island-ring-'+i,'The next ring is visible and inside range before takeoff');
 let actor={x:origin.x-20,y:origin.y-35,w:40,h:70},motion;
 for(let step=0;step<120;step++){motion=grapple.move(actor,selected,1/60,map.platforms);actor={...actor,...motion};if(motion.done)break;}
 assert(motion.done&&!motion.blocked&&actor.x>=right.x&&actor.x+actor.w<=right.x+right.w,'Pull ends safely above the next island');
}
console.log('PASS: grapple range/occlusion, protected bosses, swept actor collisions at 30/60/120 FPS and ordered, once-only island story milestones.');
