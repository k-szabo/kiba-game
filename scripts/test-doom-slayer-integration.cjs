'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const validate=require('./test-save-validation.cjs');
const locales=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/i18n/locales.json'),'utf8'));
// The shared harness deliberately ignores DOM listeners. Retain them in memory
// for this suite so clicks/form submission execute the real installed handlers.
const harnessSource=fs.readFileSync(path.join(__dirname,'test-harness.cjs'),'utf8');
const listenerSeam='focus(){},addEventListener(){}';
assert(harnessSource.includes(listenerSeam),'Update the listener-only harness seam');
const makeHarness=new Function('require','module','__dirname',harnessSource.replace(listenerSeam,
  'focus(){},addEventListener(type,handler){(this.listeners??={})[type]=handler;}')+';return module.exports;')(require,{exports:{}},__dirname);
const items=['daisyPlush','slayerCrossbow'],failures=[];
function check(name,fn){try{fn();console.log('PASS: '+name);}catch(error){failures.push(name+': '+error.stack);console.error('FAIL: '+name+' — '+error.message);}}
function fixture(){
 const h=makeHarness();h.sandbox.integrationLocales=locales;
 h.run("Prologue.stop();abilities=[true,true];defeated=[true,true,false,false];flags=levels.map(()=>[]);flags[0]=['forestBell','villageBell'];flags[1]=['soulUpper','soulLower','slayerSeal'];progression=normalizeProgression(null,flags);visitedRests=levels.map(()=>[]);visitedRests[0]=['start'];enterRealm(1);state='play';enemies=enemies.filter(DoomSlayer.is);persist();");
 return h;
}
function at(h,expression){h.run(`initPlayer(${expression});player.inv=999;keys.clear();pressed.clear();`);}
function summon(h){
 at(h,'yomi.slayerGrave');assert.equal(h.run('getContext()?.type'),'slayerGrave');
 h.press('e');h.tick();h.release('e');assert.equal(h.run('state'),'slayerSpell');
 h.elements.get('slayerSpellInput').value='iddqd';
 h.elements.get('slayerSpellForm').listeners.submit({preventDefault(){}});
 assert.equal(h.run('state'),'dialog');
 assert(!h.run('enemies.find(DoomSlayer.is).active'),'Warning needs a separate confirmation');
 h.dismiss();assert(h.run('enemies.find(DoomSlayer.is).active'));
}
function win(h){
 summon(h);
 h.run("var integrationSlayer=enemies.find(DoomSlayer.is);initPlayer({x:integrationSlayer.x-35,y:integrationSlayer.arena.y});player.face=1;player.inv=999;integrationSlayer.hp=1;integrationSlayer.inv=0;integrationSlayer.phase='recover';integrationSlayer.clock=999;");
 h.press('j');h.tick(30);h.release('j');
 assert(h.run('integrationSlayer.dead'),'Actual sword impact did not defeat the encounter');
 assert.equal(h.run('state'),'dialog');
 assert.equal(h.elements.get('dialogText').children.map(p=>p.textContent).join('\n'),locales.hu.dict['slayer.victory']);
}
function take(h,id){
 at(h,`level.objects.find(o=>o.id===${JSON.stringify(id)})`);
 assert.equal(h.run('getContext()?.type'),'slayerLoot');
 assert.equal(h.run('getContext().object.id'),id);
 h.press('e');h.tick();h.release('e');assert(h.run(`flags[1].includes(${JSON.stringify(id)})`));
 assert.equal(h.run('state'),'dialog');h.dismiss();
}
function savesValid(h){for(const [i,record] of h.sandbox.__saveSnapshots.entries())assert.doesNotThrow(()=>validate(JSON.parse(record)),`Serialized normal snapshot ${i}`);}
function capture(h){
 summon(h);
 h.run("var capturedSlayer=enemies.find(DoomSlayer.is);initPlayer({x:capturedSlayer.x-35,y:capturedSlayer.arena.y});player.inv=0;capturedSlayer.attackFace=-1;capturedSlayer.move='grab';capturedSlayer.phase='strike';capturedSlayer.clock=.6;capturedSlayer.hitDone=false;update(1/120);var capturedPlayer=player;");
 assert(h.run('player.slayerGrab&&capturedSlayer.victim===player'),'Fixture must use a real successful grab');
}

check('real grave interaction, sword victory, independent physical loot and persistent normal saves',()=>{
 const h=fixture(),before=h.run('JSON.stringify({progression,shards,coins})');
 at(h,"level.objects.find(o=>o.id==='daisyPlush')");
 assert.notEqual(h.run('getContext()?.type'),'slayerLoot','Loot unlocks before victory');
 win(h);
 assert.equal(h.run('JSON.stringify({progression,shards,coins})'),before,'Unrequested XP/stat/coin rewards were granted');
 for(const id of items)assert(!h.run(`flags[1].includes(${JSON.stringify(id)})`),'Victory must not auto-award loot');
 h.dismiss();take(h,'daisyPlush');
 assert(!h.run("flags[1].includes('slayerCrossbow')"),'First pickup must not award both items');
 h.run('player.inv=0;damage(player.hp);');
 assert(h.run("flags[1].includes('daisyPlush')&&!flags[1].includes('slayerCrossbow')&&enemies.find(DoomSlayer.is).dead"));
 assert(h.run('fastTravel(levels[0].rests[0],0)'));assert.equal(h.run('realm'),0);
 assert(h.run('fastTravel(levels[1].rests[0],1)'));
 assert.equal(h.run('realm'),1);take(h,'slayerCrossbow');
 for(const id of items){
  at(h,`level.objects.find(o=>o.id===${JSON.stringify(id)})`);
  assert.notEqual(h.run('getContext()?.type'),'slayerLoot','Collected loot can be picked up twice');
 }
 assert.equal(h.run("flags[1].filter(id=>id==='daisyPlush').length"),1);
 assert.equal(h.run("flags[1].filter(id=>id==='slayerCrossbow').length"),1);
 h.run("persist();mainMenu();saved=JSON.parse(localStorage.getItem('momo-three-worlds-v2'));startGame(true);");h.dismiss();
 assert(h.run("enemies.find(DoomSlayer.is).dead&&Inventory.quantity('daisyPlush')===1&&Inventory.quantity('slayerCrossbow')===1"));
 assert.equal(h.run('JSON.stringify({progression,shards,coins})'),before);
 savesValid(h);
 const fresh=makeHarness();fresh.sandbox.integrationSaved=JSON.parse(h.storage.get('momo-three-worlds-v2'));
 fresh.run('mainMenu();saved=integrationSaved;startGame(true);');fresh.dismiss();
 assert(fresh.run("enemies.find(DoomSlayer.is).dead&&Inventory.quantity('daisyPlush')===1&&Inventory.quantity('slayerCrossbow')===1"),'A fresh runtime does not restore both physical pickups');savesValid(fresh);
});

check('both loot items use shared DPR inventory rendering and approved HU/EN descriptors',()=>{
 const h=fixture();win(h);h.dismiss();take(h,'daisyPlush');take(h,'slayerCrossbow');
 const draws=[];h.elements.get('world').getContext('2d').drawImage=(...args)=>draws.push(args);
 h.run('devicePixelRatio=2;');
 for(const lang of ['hu','en']){
  h.run(`I18n.locale=${JSON.stringify(lang)};I18n.t=value=>integrationLocales[I18n.locale].dict[value]??value;I18n.format=(key,args)=>I18n.t(key).replace(/\\{(\\d+)\\}/g,(_,i)=>args[i]);Inventory.open();Inventory.render();`);
  for(const id of items){
   const button=h.elements.get('inventoryGrid').children.find(b=>b.dataset.inventoryItem===id);
   assert(button,id+' missing from inventory grid');
   const icon=button.children[0];assert.equal(icon.width,224);assert.equal(icon.height,224);
   assert.equal(icon.className,'inventory-icon');assert.equal(icon.getContext('2d').globalAlpha,1);
   button.listeners.click();
   assert.equal(h.elements.get('inventoryDetailName').textContent,locales[lang].dict['item.'+id]);
   assert.equal(h.elements.get('inventoryDetailText').textContent,locales[lang].dict['inventory.description.'+id]);
   assert(h.elements.get('useInventoryItem').hidden,'Unusable keepsake exposes a use action');
   assert(h.run(`Inventory.quantity(${JSON.stringify(id)})===1`));
   const art=h.run(`ART_INVENTORY.items[${JSON.stringify(id)}]`),source=h.run(`Visuals.images[ART_INVENTORY.items[${JSON.stringify(id)}].image]`);
   assert(draws.some(args=>args[0]===source&&args[1]===art.x&&args[2]===art.y&&args[3]===art.w&&args[4]===art.h),'Shared renderer skipped the registered native crop');
  }
  h.run('Inventory.close();');
 }
});

check('dev replay and both inventory entries remain isolated from normal saves',()=>{
 const h=fixture();win(h);h.dismiss();take(h,'daisyPlush');take(h,'slayerCrossbow');
 const normal=h.storage.get('momo-three-worlds-v2'),writes=h.sandbox.__saveSnapshots.length;
 h.run('DevTools.open();');assert(h.run('DevSession.begin()'));
 assert(h.run("DevBoss.revive({encounter:'doomSlayer'})"));h.run('DevTools.close();');
 assert(h.run('enemies.find(DoomSlayer.is).active&&!enemies.find(DoomSlayer.is).dead'));
 h.run("var replaySlayer=enemies.find(DoomSlayer.is);replaySlayer.phase='recover';replaySlayer.inv=0;DoomSlayer.hit(replaySlayer,{...replaySlayer},1000,'heavy');update(1/120);");
 assert.equal(h.run('state'),'play','Already-completed replay repeats first-victory dialogue');
 for(const id of items)assert.equal(h.run(`flags[1].filter(id=>id===${JSON.stringify(id)}).length`),1);
 h.run("flags[1]=flags[1].filter(id=>!['daisyPlush','slayerCrossbow'].includes(id));DevTools.open();");
 const flatten=node=>[node,...(node.children||[]).flatMap(flatten)];
 const selects=flatten(h.elements.get('devToolsList')).filter(node=>node.id==='dev-inventory-item-item');
 assert.equal(selects.length,1);for(const id of items)assert(selects[0].children.some(option=>option.value===id),'Dev catalogue lacks '+id);
 for(const id of items)assert.equal(h.run(`DevItems.add({item:${JSON.stringify(id)}})`),true);
 h.run('persist();DevSession.end();');
 assert.equal(h.storage.get('momo-three-worlds-v2'),normal);
 assert.equal(h.sandbox.__saveSnapshots.length,writes,'Dev actions wrote normal save snapshots');
 savesValid(h);
});

check('pause freezes combat/oil clocks and repeated SlayerArt rendering is read-only',()=>{
 const h=fixture();summon(h);
 h.run("var frozenSlayer=enemies.find(DoomSlayer.is);initPlayer({x:frozenSlayer.x-400,y:frozenSlayer.arena.y});player.inv=999;frozenSlayer.move='oil';frozenSlayer.phase='windup';frozenSlayer.clock=.001;update(1/120);");
 assert(h.run('frozenSlayer.oils.length>0'),'Fixture did not puncture an actual barrel');
 const snapshot=()=>h.run('JSON.stringify({player,enemies,projectiles,particles,time,levelTime,attack,dash,flags,progression})');
 for(const move of ['flail','oil','fireArrows','lightning','kick','arrows','doubleJump','grab','explosion','saw']){
  for(const phase of ['windup','strike','recover','retreat','cast']){
   h.run(`frozenSlayer.move=${JSON.stringify(move)};frozenSlayer.phase=${JSON.stringify(phase)};frozenSlayer.clock=.5;frozenSlayer.phaseDuration=1;frozenSlayer.oils[0].lit=true;frozenSlayer.oils[0].warning=.3;pause();`);
   const before=snapshot();h.tick(30);assert.equal(snapshot(),before,move+'/'+phase+' advances while paused');
   h.run('SlayerArt.backdrop();SlayerArt.objects();SlayerArt.scenery();SlayerArt.actor(frozenSlayer);');
   assert.equal(snapshot(),before,move+'/'+phase+' rendering mutates encounter state');h.run('pause();');
  }
 }
 h.run("frozenSlayer.move='oil';frozenSlayer.phase='recover';frozenSlayer.clock=.5;");
 const before=snapshot();h.run('update(1/60);');assert.notEqual(snapshot(),before,'Resumed encounter never advances');
});

for(const transition of ['death','rest','travel','menu'])check(transition+' releases a captured player and clears encounter effects',()=>{
 const h=fixture();capture(h);
 if(transition==='death')h.run('player.inv=0;damage(player.hp);');
 if(transition==='rest'){
  h.run('player.x=checkpoint.x-player.w/2;player.y=checkpoint.y-player.h;');
  assert.equal(h.run('getContext()?.type'),'checkpoint');h.run('interact();');
 }
 if(transition==='travel')assert(h.run('fastTravel(levels[0].rests[0],0)'));
 if(transition==='menu')h.run('mainMenu();');
 assert(h.run('!capturedPlayer.slayerGrab&&capturedSlayer.victim===null'),'Transition leaves the old grab attached');
 assert(h.run('!player.slayerGrab&&player.stun===0'),'Transition leaves a movement lock');
 assert(h.run('capturedSlayer.oils.length===0&&capturedSlayer.hazards.length===0&&projectiles.every(p=>!p.slayer)'));
 savesValid(h);
});

for(const transition of ['death','rest','travel','menu'])check(transition+' invalidates an already-open incantation warning',()=>{
 const h=fixture();at(h,'yomi.slayerGrave');h.run('interact();');
 h.elements.get('slayerSpellInput').value='iddqd';h.elements.get('slayerSpellForm').listeners.submit({preventDefault(){}});
 assert.equal(h.run('state'),'dialog');const stale=h.elements.get('dialogOk').onclick;
 if(transition==='death')h.run('player.inv=0;damage(player.hp);');
 if(transition==='rest')h.run("state='play';initPlayer(checkpoint);interact();");
 // Travel/rest entry points are also used by world-changing dev operations.
 // Invoke them after relinquishing the warning's modal state, then retain its
 // old callback to check that a replaced-world confirmation cannot execute.
 if(transition==='travel'){h.run("state='play';");assert(h.run('fastTravel(levels[0].rests[0],0)'));}
 if(transition==='menu')h.run('mainMenu();');
 const stateBefore=h.run('state'),realmBefore=h.run('realm');stale();
 assert.equal(h.run('state'),stateBefore,'Stale warning confirmation changes the current UI state');
 assert.equal(h.run('realm'),realmBefore);assert(!h.run('enemies.some(e=>DoomSlayer.is(e)&&e.active)'),'Stale warning summons into a replaced world');
});

check('ordinary and optional Yomi objectives stay independent of grave progress',()=>{
 const h=fixture();const baseline=h.run('JSON.stringify(nextObjective())');
 at(h,'yomi.slayerGrave');assert.equal(h.run('JSON.stringify(nextObjective())'),baseline);
 win(h);h.dismiss();take(h,'daisyPlush');take(h,'slayerCrossbow');
 assert.equal(h.run('JSON.stringify(nextObjective())'),baseline);
 h.run("defeated[1]=false;flags[1]=['soulUpper'];enterRealm(1);state='play';");
 assert.equal(h.run('nextObjective().point.id'),'soulLower','Hidden encounter hijacks soul-rescue progression');
 h.run("flags[1].push('soulLower');abilities[1]=false;");
 assert.equal(h.run('nextObjective().point'),h.run('level.ability'));
 h.run('abilities[1]=true;');assert.equal(h.run('nextObjective().point'),h.run('level.boss'));
});

if(failures.length){console.error('\n'+failures.join('\n\n'));process.exitCode=1;}
