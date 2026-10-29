'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function setup(){
 let now=10000,active=false;const elements=new Map(),endHandlers=[],tools=[],listeners=[],domWrites=[];
 class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.handlers={};this.hidden=false;this.scrollTop=0;this.scrollHeight=2000;}
  set id(id){this._id=id;elements.set(id,this);}get id(){return this._id;}
  set textContent(value){this._text=String(value);}get textContent(){return this._text||'';}
  set innerHTML(value){throw Error('The log must never use innerHTML: '+value);}
  append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;domWrites.push(now);}
  setAttribute(key,value){this.attributes[key]=value;}addEventListener(key,handler){this.handlers[key]=handler;}focus(){this.focused=true;}
 }
 const game=new Element('main');game.id='game';const pause=new Element('button');pause.id='pauseButton';
 const sandbox={console,WeakMap,WeakSet,Date,performance:{now:()=>now},state:'developer',player:{name:'Momo',hp:20,maxHp:20},boss:null,projectiles:[],
  level:{id:'japan',name:'Japan'},levels:[],realm:0,realms:[{name:'Japan',boss:'Samurai'}],Prologue:{active:false},
  DevSession:{get active(){return active;},onEnd:fn=>endHandlers.push(fn)},DevTools:{isOpen:true,register:tool=>tools.push(tool)},Bindings:{actions:['attack','jump','dash']},
  I18n:{t:key=>key==='binding.action.attack'?'Normal attack':key,format:(key,values)=>key+': '+values.join(' | '),onChange:fn=>listeners.push(fn)},
  document:{createElement:tag=>new Element(tag),getElementById:id=>elements.get(id)},
  localStorage:{getItem(){throw Error('No save/storage reads');},setItem(){throw Error('No save/storage writes');}},saved:{normal:'unchanged'}};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/dev-log.js'),'utf8'),sandbox);const r=code=>vm.runInContext(code,sandbox);
 r('DevLog.init()');assert.equal(tools.length,1);assert.equal(elements.get('devLiveLog').attributes['aria-live'],'off');
 return {r,sandbox,elements,domWrites,advance:ms=>{now+=ms;},activate:()=>{active=true;assert(r('DevLog.toggle()'));sandbox.state='play';sandbox.DevTools.isOpen=false;},end:()=>{active=false;endHandlers.forEach(fn=>fn());}};
}
{
 const h=setup(),r=h.r;assert.equal(r('DevLog.active'),false);assert.equal(r('DevLog.toggle()'),false);assert.equal(r('DevLog.action("attack")'),false);
 assert.equal(r('DevLog.scope({phase:"windup"},()=>42)'),42);assert.equal(r('DevLog.samples.length'),0);h.activate();
 assert.equal(r('DevLog.action("attack")'),true);assert.equal(r('DevLog.action("notAnAction")'),false);assert.equal(r('DevLog.samples[0].values.join("|")'),'Momo|binding.action.attack');
 h.advance(125);r('DevLog.frame()');const panel=h.elements.get('devLiveLog'),list=panel.children.at(-1);assert.equal(panel.hidden,false);assert.equal(list.children[0].children[1].textContent,'dev.log.action: Momo | Normal attack');
 h.advance(200);r('DevLog.action("jump");DevLog.frame()');assert.equal(list.children[0].children[0].textContent,'00:00:00.000');assert.equal(list.children[2].children[0].textContent,'00:00:00.325');
 h.advance(-400);r('DevLog.action("dash")');assert.equal(r('DevLog.samples.at(-1).time'),325,'Clock regressions cannot reverse timestamps');h.advance(500);
 for(let i=0;i<350;i++)r('DevLog.action("attack")');assert.equal(r('DevLog.samples.length'),300);r('var mutable=DevLog.samples;mutable[0].values[0]="changed"');assert.notEqual(r('DevLog.samples[0].values[0]'),'changed');
 r('DevLog.clear()');assert.equal(r('DevLog.active'),true);assert.equal(r('DevLog.samples.length'),0);assert.equal(list.children.length,0);
 // The control stops new gameplay keydowns but allows the game to release
 // inputs that were already held before focus entered the nonmodal panel.
 let stopped=false,prevented=false;panel.handlers.keydown({key:'Enter',stopPropagation(){stopped=true;}});assert(stopped);assert.equal(panel.handlers.keyup,undefined);assert.equal(panel.handlers.mouseup,undefined);
 panel.handlers.keydown({key:'Escape',stopPropagation(){},preventDefault(){prevented=true;}});assert(prevented);assert.equal(panel.hidden,true);assert.equal(r('DevLog.active'),false);assert(h.elements.get('pauseButton').focused);
 assert.equal(r('saved.normal'),'unchanged');h.end();h.sandbox.state='developer';h.sandbox.DevTools.isOpen=true;assert.equal(r('DevLog.toggle()'),false);
}
{
 const h=setup(),r=h.r;h.activate();r('var enemy={name:"Cultist",id:"c1",phase:"wait",move:null,hp:20,maxHp:20};');
 r('DevLog.scope(enemy,()=>{enemy.phase="windup";enemy.move="sweep";});DevLog.scope(enemy,()=>{});DevLog.scope(enemy,()=>{enemy.phase="strike";});');
 assert.equal(r('DevLog.samples.filter(e=>e.type==="preparing").length'),1);assert.equal(r('DevLog.samples.filter(e=>e.type==="attack").length'),1);
 r('DevLog.scope(enemy,()=>{enemy.phase="wait";});DevLog.scope(enemy,()=>{enemy.phase="windup";});');assert.equal(r('DevLog.samples.filter(e=>e.type==="preparing").length'),2,'A later identical attack is a new phase edge');
 r('DevLog.scope(enemy,()=>{enemy.autoPhase="windup";});DevLog.scope(enemy,()=>{enemy.autoPhase="strike";});');assert.equal(r('DevLog.samples.at(-1).values[1]'),'autoAttack');
 r('DevLog.clear();var pair={name:"Bodyguards",phase:"windup",move:"mirrored",parts:[{index:0,phase:"wait",move:"stomp"},{index:1,phase:"wait",move:"lance"}]};DevLog.scope(pair,()=>{pair.parts[0].phase="windup";pair.parts[1].phase="strike";});');
 assert.equal(r('DevLog.samples.length'),2);assert.equal(r('DevLog.samples[0].values.join("|")'),'Bodyguards #1|stomp');assert.equal(r('DevLog.samples[1].values.join("|")'),'Bodyguards #2|lance');
 r('DevLog.clear();DevLog.scope({name:"already dead",dead:true,phase:"strike",hp:0},()=>{});DevLog.scope({name:"idle"},()=>{});');assert.equal(r('DevLog.samples.length'),0,'Dead/inactive actors do not invent attacks');
 assert.equal(r('DevLog.ability(enemy,"windup","rupture")'),true);assert.equal(r('DevLog.ability(enemy,"wait","rupture")'),false);
}
{
 const h=setup(),r=h.r;h.activate();
 r('var outer={name:"Outer",hp:30,maxHp:30},inner={name:"Inner",hp:20,maxHp:20};var thrown;try{DevLog.scope(outer,()=>DevLog.scope(inner,()=>{DevLog.damage("incoming",player,20,18);throw Error("simulation failure")}))}catch(error){thrown=error.message;}');
 assert.equal(r('thrown'),'simulation failure');assert.equal(r('DevLog.samples[0].values[0]'),'Inner');
 r('DevLog.damage("incoming",player,18,17)');assert.equal(r('DevLog.samples.at(-1).type'),'received','The source is restored after exceptional nested scopes');
 r('DevLog.clear();var shot={kind:"lightArrow"};outer.move="lightFan";var original=JSON.stringify(outer);DevLog.scope(outer,()=>{projectiles.push(shot)});outer.name="Renamed later";outer.move="shadowBurst";DevLog.projectile(shot,()=>DevLog.damage("incoming",player,17,14));');
 assert.equal(r('DevLog.samples[0].values[0]'),'Outer · lightFan','Projectile attribution keeps the name and ability ID from emission, even after the next attack starts');assert.equal(r('Object.keys(shot).join(",")'),'kind','No fields are attached to the simulation projectile');
 r('DevLog.clear();var oldShot={kind:"old"};projectiles=[oldShot];var newShot={kind:"new"};DevLog.scope(inner,()=>{projectiles=projectiles.filter(()=>true);projectiles.push(newShot);});DevLog.projectile(newShot,()=>DevLog.damage("incoming",player,14,12));DevLog.projectile(oldShot,()=>DevLog.damage("incoming",player,12,11));');
 assert.equal(r('DevLog.samples[0].values[0]'),'Inner');assert.equal(r('DevLog.samples[1].type'),'received','Existing unowned shots are not retrospectively attributed to another enemy');
 r('DevLog.clear();DevLog.scope(inner,()=>{DevLog.stampProjectile(shot);DevLog.projectile({},()=>DevLog.damage("incoming",player,11,10));DevLog.damage("incoming",player,10,9);});');assert.equal(r('DevLog.samples[0].type'),'received');assert.equal(r('DevLog.samples[1].values[0]'),'Inner');
 r('DevLog.clear();var target={logName:"A boss",hp:5,maxHp:50};DevLog.scope(inner,()=>DevLog.damage("outgoing",target,5,-100));');assert.equal(r('DevLog.samples[0].values.join("|")'),'Momo|A boss|5|0|50');assert.equal(r('DevLog.samples[1].type'),'defeated');
 r('DevLog.damage("outgoing",target,0,-1);DevLog.damage("outgoing",target,5,5);DevLog.damage("outgoing",target,NaN,0);');assert.equal(r('DevLog.samples.length'),2,'Zero damage, invalid HP and repeated corpse hits are ignored');
 r('DevLog.clear();DevLog.damage("outgoing",{logName:"Seraph",hp:0,maxHp:500,logPhaseReset:true},10,0)');assert.equal(r('DevLog.samples.length'),1);assert.equal(r('DevLog.samples[0].type'),'damage','Depleting a refill-phase HP bar is not a boss defeat');
 r('DevLog.damage("outgoing",{logName:"Scripted foe",hp:1,maxHp:20,dead:true},10,1)');assert.equal(r('DevLog.samples.at(-1).type'),'defeated');
 r('DevLog.clear();var autoShot={kind:"bolt"};outer.autoPhase="windup";DevLog.scope(outer,()=>{projectiles.push(autoShot)});outer.autoPhase=null;DevLog.projectile(autoShot,()=>DevLog.damage("incoming",player,10,9));');assert.equal(r('DevLog.samples.at(-1).values[0]'),'Renamed later · autoAttack','Automatic attacks keep their own projectile source ID');
 r('DevLog.clear();DevLog.scope(outer,()=>DevLog.damage("incoming",player,9,8),"explicitHazard");');assert.equal(r('DevLog.samples.at(-1).values[0]'),'Renamed later · explicitHazard','An explicit hazard move wins over the actor attack state');
 r('DevLog.clear();DevLog.scope({name:"<img src=x onerror=attack()>"+"x".repeat(500),move:"m".repeat(600),phase:"windup"},()=>{});');h.advance(125);r('DevLog.frame()');assert(r('DevLog.samples[0].values.every(v=>typeof v!=="string"||v.length<=128)'));assert.equal(h.elements.get('devLiveLog').children.at(-1).children[0].children[1].children.length,0,'Untrusted actor strings are plain text, not DOM');
 h.end();assert.equal(r('DevLog.samples.length'),0);assert.equal(r('DevLog.active'),false);h.sandbox.state='developer';h.sandbox.DevTools.isOpen=true;h.activate();r('DevLog.projectile(shot,()=>DevLog.damage("incoming",player,9,8));');assert.equal(r('DevLog.samples[0].type'),'received','New sessions cannot inherit projectile owners');
}
{
 const h=setup(),r=h.r;h.activate();r('DevLog.frame()');const panel=h.elements.get('devLiveLog'),list=panel.children.at(-1),writes=h.domWrites.length;
 for(let frame=0;frame<124;frame++){h.advance(1);r('DevLog.action("attack");DevLog.frame()');}assert.equal(h.domWrites.length,writes,'High event rates do not bypass batched rendering');h.advance(1);r('DevLog.frame()');assert.equal(h.domWrites.length,writes+1);
 const follow=h.elements.get('devLiveLogFollow');follow.checked=false;follow.onchange();list.scrollTop=117;h.advance(125);r('DevLog.action("jump");DevLog.frame()');assert.equal(list.scrollTop,117,'Reading position stays put with follow disabled');
 follow.checked=true;follow.onchange();assert.equal(list.scrollTop,list.scrollHeight);h.sandbox.Prologue.active=true;h.advance(125);r('DevLog.frame()');assert.equal(r('DevLog.samples.at(-1).values[0]'),'prologue.place');
 const before=r('JSON.stringify([saved,player,projectiles])');r('DevLog.frame()');assert.equal(r('JSON.stringify([saved,player,projectiles])'),before);assert.equal(r('DevLog.health({hp:1.234,maxHp:20})'),'1.23 / 20');
}
console.log('PASS: bounded session-only DevLog tracks phase edges, paired actors, real HP loss, nested/projectile attribution, safe nonmodal DOM, monotonic timestamps and batched follow controls.');
