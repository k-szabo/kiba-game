const assert=require('node:assert/strict');
const fs=require('node:fs'),Module=require('node:module');
const harnessPath=require.resolve('./test-harness.cjs');
let harnessSource=fs.readFileSync(harnessPath,'utf8');
// Capture actual production event registrations in a private, in-memory copy of
// the harness. Direct handler calls cannot detect a missing/wrong DOM listener.
for(const [before,after] of [
 ['const elements=new Map(),storage=new Map();','const elements=new Map(),storage=new Map(),listeners=new Map();'],
 ['addEventListener(){},matchMedia:','addEventListener(type,callback){const callbacks=listeners.get(type)||[];callbacks.push(callback);listeners.set(type,callbacks);},matchMedia:'],
 ['return {run,snap,tick,press,release,dismiss,place,elements,storage,sandbox};','return {run,snap,tick,press,release,dismiss,place,elements,storage,sandbox,listeners};']
]){assert(harnessSource.includes(before),'The listener test seam must match the current harness');harnessSource=harnessSource.replace(before,after);}
const harnessModule=new Module(harnessPath,module);harnessModule.filename=harnessPath;harnessModule.paths=module.paths;harnessModule._compile(harnessSource,harnessPath);
const harness=harnessModule.exports;

function fixture(){
 const h=harness();
 const rows=h.elements.get('bindingRows')||h.sandbox.document.getElementById('bindingRows');
 // The generic gameplay harness deliberately has no DOM selector engine. Keep
 // this focused row lookup in this test, without exporting game internals.
 rows.querySelector=selector=>rows.children.flatMap(row=>row.children).find(node=>node.dataset.action===selector.match(/data-action="([^"]+)"/)?.[1]);
 const world=h.sandbox.document.getElementById('world'),pauseButton=h.sandbox.document.getElementById('pauseButton');
 h.sandbox.document.getElementById('game').contains=node=>node===world||node===pauseButton||node===rows||rows.children.some(row=>row===node||row.children.includes(node));
 h.sandbox.document.activeElement=null;
 h.run("enemies=[];boss.dead=true;state='play';keys.clear();pressed.clear();");
 const eventTypes={handleMouseDown:'mousedown',handleMouseUp:'mouseup',handleMouseCancel:'pointercancel',handleMouseClick:'click',handleMouseContextMenu:'contextmenu'};
 const mouse=(handler,{button=0,target='world',pointerType,timeStamp=100,...extra}={})=>{
  const type=eventTypes[handler]||handler;
  const event={type,button,pointerType,timeStamp,...extra,target:typeof target==='string'?h.sandbox.document.getElementById(target):target,prevented:false,stopped:false,
   preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;}};
  const listeners=h.listeners.get(type)||[];
  if(eventTypes[handler])assert(listeners.length,`Production registers a ${type} listener`);
  for(const listener of listeners)listener(event);
  return event;
 };
 const bind=(action,button=0)=>assert(h.run(`Bindings.setPrimary('${action}','mouse${button}').ok`));
 return {...h,mouse,bind,rows};
}

// Opening a capture starts on click, after its pointerdown has already passed.
// The next pointerdown captures exactly once and cannot activate another row.
{
 const h=fixture();h.run("pause();showHelp('pause')");
 const attackRow=h.rows.querySelector('[data-action="attack"]');
 h.mouse('handleMouseDown',{target:attackRow});
 assert.equal(h.run('captureAction'),null);
 attackRow.onclick();
 assert.equal(h.run('captureAction'),'attack');
 assert.equal(h.run("Bindings.read('attack')[0]"),'mouse0','The click that opens capture is not itself the binding');
 const opening=h.mouse('handleMouseClick',{target:attackRow,timeStamp:101});
 assert(!opening.prevented,'The original activating click is not suppressed');
 const otherRow=h.rows.querySelector('[data-action="jump"]');
 const capture=h.mouse('handleMouseDown',{button:2,target:otherRow,timeStamp:200});
 assert(capture.prevented&&capture.stopped,'Mouse capture blocks the default action and the underlying UI');
 assert.equal(h.run('captureAction'),null);
 assert.equal(h.run("Bindings.read('attack')[0]"),'mouse2');
 assert.equal(h.run('state'),'help','Assigning a mouse button never resumes gameplay');
 const contextMenu=h.mouse('handleMouseContextMenu',{button:2,target:otherRow,timeStamp:201});
 assert(contextMenu.prevented,'Right-click capture does not show the browser context menu');
 const secondaryClick=h.mouse('handleMouseClick',{button:2,target:otherRow,timeStamp:202});
 assert(secondaryClick.prevented&&secondaryClick.stopped,'The capture click cannot restart capture on a different row');
 assert(!h.mouse('handleMouseClick',{button:0,target:otherRow,timeStamp:203}).prevented,'Suppression does not swallow unrelated mouse buttons');
 assert(!h.mouse('handleMouseClick',{button:2,target:otherRow,timeStamp:1300}).prevented,'Capture click suppression expires');
 assert(h.run('keys.size===0&&pressed.size===0'),'Captured input never reaches the game');
}
{
 const h=fixture();h.run("pause();showHelp('pause');captureAction='attack'");
 const before=h.run('JSON.stringify(Bindings.exportData())');h.press('Escape');
 assert.equal(h.run('captureAction'),null);assert.equal(h.run('state'),'help');
 assert.equal(h.run('JSON.stringify(Bindings.exportData())'),before,'Escape cancels capture without rebinding');
 h.run("captureAction='attack'");h.press('e');
 assert.equal(h.run("Bindings.read('attack')[0]"),'e');
 assert.equal(h.run("Bindings.read('interact')[0]"),'mouse0','The help UI can directly take an occupied key');
 const freeze=h.run('JSON.stringify({player,attack,dash,levelTime,time})');h.tick(30);
 assert.equal(h.run('JSON.stringify({player,attack,dash,levelTime,time})'),freeze,'Rebinding keeps physics and effects paused');
}

// Gameplay mouse inputs share keyboard dispatch, including window-owning actions.
for(const [action,kind] of [['attack','normal'],['heavyAttack','heavy']]){
 const h=fixture();h.bind(action);h.mouse('handleMouseDown');h.tick();
 assert(h.run('attack>0'));assert.equal(h.run('attackKind'),kind);
 h.mouse('handleMouseUp');assert(!h.run("keys.has('mouse0')"));
}
{
 const h=fixture();h.bind('moveRight');const x=h.run('player.x');h.mouse('handleMouseDown');h.tick(4);
 assert(h.run('player.x')>x,'Held mouse movement drives real player movement');
 h.mouse('handleMouseUp',{target:'pauseButton'});assert(!h.run("keys.has('mouse0')"),'Releasing over UI releases a canvas input');
}
{
 const h=fixture();h.bind('jump');h.run('player.onGround=true');h.mouse('handleMouseDown');h.tick();
 assert(h.run('player.vy<0'),'Mouse jump drives real jump physics');
}
{
 const h=fixture();h.bind('dash');h.run('abilities[1]=true');h.mouse('handleMouseDown');h.tick();
 assert(h.run('dash>0'),'Mouse dash drives the acquired ability');
 h.mouse('handleMouseUp');h.tick(120);assert.equal(h.run('dash'),0,'Mouse dash still expires through shared clocks');
}
for(const [action,state] of [['pause','pause'],['map','map'],['inventory','inventory']]){
 const h=fixture();h.bind(action);h.mouse('handleMouseDown');assert.equal(h.run('state'),state,`Mouse ${action} uses the same immediate dispatch as keyboard`);
}
{
 const h=fixture();assert(h.run("Bindings.setPrimary('pause',Bindings.read('attack')[0]).ok"));
 assert.equal(h.run("Bindings.read('attack')[0]"),'escape','Taking an occupied key performs the exact requested swap');
 h.press('Escape');h.tick();h.release('Escape');
 assert.equal(h.run('state'),'play','Escape belongs to its swapped gameplay action during play');assert(h.run('attack>0'));
 h.mouse('handleMouseDown');h.mouse('handleMouseUp');assert.equal(h.run('state'),'pause','The exchanged pause key remains usable');
 h.run("state='inventory';$('inventory').hidden=false");h.press('Escape');
 assert.equal(h.run('state'),'play','Escape remains a dialog close key independently of gameplay swaps');
}
{
 const h=fixture();h.bind('attack',2);const press=h.mouse('handleMouseDown',{button:2});
 assert(press.prevented,'Assigned gameplay inputs prevent native mouse behavior');
 assert(h.mouse('handleMouseContextMenu',{button:2}).prevented,'Assigned right click on the game suppresses its context menu');
 assert(h.mouse('handleMouseContextMenu',{button:2,target:'pauseButton'}).prevented,'Game UI suppresses the browser context menu without starting gameplay');
 h.mouse('handleMouseUp',{button:2});h.run("Bindings.reset();Bindings.setPrimary('heavyAttack','h');");
 assert(h.mouse('handleMouseContextMenu',{button:2}).prevented,'The game canvas suppresses its context menu even when right click is unassigned');
 assert(!h.mouse('handleMouseContextMenu',{button:2,target:'outsideGame'}).prevented,'The surrounding page retains its native context menu');
}

// Touch/pen, unrelated UI and non-playing states never become mouse gameplay.
for(const pointerType of ['touch','pen']){
 const h=fixture();h.bind('attack');h.mouse('handleMouseDown',{pointerType});h.tick();assert.equal(h.run('attack'),0);
}
{
 const h=fixture();h.bind('attack');h.mouse('handleMouseDown',{target:'pauseButton'});h.tick();assert.equal(h.run('attack'),0);
 h.run("keys.add('mouse0');keys.add('mouse1');keys.add('a');pressed.add('mouse2')");h.mouse('handleMouseCancel');
 assert(h.run("!keys.has('mouse0')&&!keys.has('mouse1')&&!pressed.has('mouse2')&&keys.has('a')"),'Pointer cancellation clears every mouse latch but preserves keyboard input');
}
for(const state of ['menu','help','pause','map','training','inventory','shop','dialog','developer']){
 const h=fixture();h.bind('attack');h.run(`state='${state}';captureAction=null;`);
 const before=h.run('JSON.stringify({state,keys:[...keys],pressed:[...pressed],attack})');
 h.mouse('handleMouseDown');assert.equal(h.run('JSON.stringify({state,keys:[...keys],pressed:[...pressed],attack})'),before,`${state} ignores mouse gameplay input`);
}

// A physical mouse fires pointerdown only for the first held button and
// pointerup only for the last. Native mousedown/up still fire for every button.
// Exercise both press orders, both release orders and release outside canvas.
const buttonBit=button=>({0:1,1:4,2:2}[button]);
for(const pair of [[0,1],[0,2],[1,2]])for(const reversePress of [false,true])for(const reverseRelease of [false,true]){
 const h=fixture();h.bind('moveRight',pair[0]);h.bind('attack',pair[1]);
 const pressOrder=reversePress?[...pair].reverse():pair;
 const releaseOrder=reverseRelease?[...pair].reverse():pair;
 let buttons=0;
 buttons|=buttonBit(pressOrder[0]);
 h.mouse('pointerdown',{button:pressOrder[0],buttons,pointerType:'mouse'});
 assert.equal(h.run('keys.size'),0,'Pointer provenance never also dispatches the first gameplay press');
 h.mouse('mousedown',{button:pressOrder[0],buttons});
 buttons|=buttonBit(pressOrder[1]);
 h.mouse('pointermove',{button:pressOrder[1],buttons,pointerType:'mouse'});
 h.mouse('mousedown',{button:pressOrder[1],buttons});
 assert(h.run(`keys.has('mouse${pair[0]}')&&keys.has('mouse${pair[1]}')`),'Every held chord button is dispatched despite no second pointerdown');
 h.tick();assert(h.run('player.vx>0&&attack>0'),'A mouse chord drives both real movement and combat');
 buttons&=~buttonBit(releaseOrder[0]);
 h.mouse('pointermove',{button:releaseOrder[0],buttons,pointerType:'mouse',target:'pauseButton'});
 h.mouse('mouseup',{button:releaseOrder[0],buttons,target:'pauseButton'});
 assert(!h.run(`keys.has('mouse${releaseOrder[0]}')`),'Each button is released even when the pointer remains active outside the canvas');
 assert(h.run(`keys.has('mouse${releaseOrder[1]}')`),'Releasing one chord button preserves the other held button');
 buttons=0;
 h.mouse('pointerup',{button:releaseOrder[1],buttons,pointerType:'mouse',target:'pauseButton'});
 h.mouse('mouseup',{button:releaseOrder[1],buttons,target:'pauseButton'});
 assert(h.run(`!keys.has('mouse${pair[0]}')&&!keys.has('mouse${pair[1]}')`),'The final release cannot leave any chord button latched');
}
{
 const h=fixture();h.bind('pause');h.mouse('pointerdown',{pointerType:'mouse',buttons:1});
 assert.equal(h.run('state'),'play','Pointerdown alone cannot dispatch an immediate action');
 h.mouse('mousedown',{buttons:1});assert.equal(h.run('state'),'pause','Native mousedown dispatches an immediate action exactly once');
}
// Ignore the complete synthetic mouse sequence that follows touch/pen pointer
// events, including when it has no pointerType or SourceCapabilities metadata.
for(const pointerType of ['touch','pen'])for(const capture of [false,true]){
 const h=fixture();h.bind('attack');
 if(capture)h.run("pause();showHelp('pause');captureAction='jump'");
 const before=h.run('JSON.stringify({keys:[...keys],pressed:[...pressed],captureAction,bindings:Bindings.exportData()})');
 h.mouse('pointerdown',{pointerType,buttons:1});h.mouse('mousedown',{buttons:1});
 h.mouse('pointerup',{pointerType,buttons:0});h.mouse('mouseup',{buttons:0});h.mouse('click');h.mouse('contextmenu',{button:2});
 assert.equal(h.run('JSON.stringify({keys:[...keys],pressed:[...pressed],captureAction,bindings:Bindings.exportData()})'),before,'Compatibility mouse events cannot activate gameplay or steal a binding capture');
 h.mouse('pointerdown',{pointerType:'mouse',buttons:1});h.mouse('mousedown',{buttons:1});
 assert(capture?h.run("Bindings.read('jump')[0]==='mouse0'"):h.run("keys.has('mouse0')"),'A subsequent genuine mouse gesture works normally');
}
for(const pointerType of ['touch','pen']){
 const h=fixture();h.bind('moveRight');
 h.mouse('pointerdown',{pointerType:'mouse',buttons:1});h.mouse('mousedown',{buttons:1});
 assert(h.run("keys.has('mouse0')"));
 h.mouse('pointerdown',{pointerType,buttons:1});h.mouse('pointerup',{pointerType,buttons:0});
 h.mouse('mouseup',{buttons:0,target:'pauseButton'});
 assert(!h.run("keys.has('mouse0')"),'A mixed-device gesture cannot prevent release of an already held physical mouse button');
}
{
 const h=fixture();h.bind('attack');h.mouse('pointerdown',{pointerType:'mouse'});
 h.mouse('mousedown',{sourceCapabilities:{firesTouchEvents:true}});
 assert.equal(h.run('keys.size'),0,'SourceCapabilities identifies touch compatibility events even when the last pointer was a mouse');
 h.mouse('mousedown');h.mouse('blur');assert(h.run("keys.size===0&&pressed.size===0&&state==='pause'"),'Blur releases mouse and keyboard input and pauses gameplay');
}
console.log('PASS: registered native mouse listeners, chord press/release permutations and off-canvas cleanup, touch/pen compatibility filtering, capture isolation, exact swaps and all gameplay actions.');
