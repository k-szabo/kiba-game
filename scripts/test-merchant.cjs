const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
const h=harness(),r=h.run,originalRandom=Math.random;
const snapshot=()=>r('JSON.stringify([coins,meatCount,flags,player.hp,saved,window.__saveSnapshots.length])');
try{
 r('var randomCalls=0;Math.random=()=>{randomCalls++;return .1;};');
 r('var e=enemies.find(e=>!e.miniboss);e.hp=0;killEnemy(e);killEnemy(e);');assert.equal(r('coins'),5);
 r('respawnEnemies();var e=enemies.find(e=>!e.miniboss);e.hp=0;killEnemy(e);');assert.equal(r('coins'),10);
 r('var e=enemies.find(e=>!e.miniboss&&!e.dead);e.summoned=true;e.hp=0;killEnemy(e);');assert.equal(r('coins'),10);
 r("flags[0]=['forestBell','villageBell'];defeated[0]=true;enterRealm(1);enemies.filter(e=>e.group!=='akash').forEach(e=>e.dead=true);");
 h.place(r('yomi.akash.x'),r('yomi.akash.y'));assert.equal(r('Merchant.free()'),false,'Living captors must block release');
 r("enemies.filter(e=>e.group==='akash').forEach(e=>{e.hp=0;killEnemy(e);});");assert.equal(r('coins'),20);
 assert(r('Merchant.free()'));h.dismiss();assert(r('Merchant.rescued()'));validate(r('saved'));
 assert.equal(r('Merchant.free()'),false,'Rescue cannot repeat');
 assert(r('enterForestCamp()'));h.place(r("forestCamp.npcs.find(n=>n.id==='akash').x"),820);
 h.press('e');h.tick();h.release('e');assert.equal(h.snap().state,'shop');
 const frozen=r('JSON.stringify([player,time,levelTime,projectiles])');h.press('d');h.tick(120);h.release('d');assert.equal(r('JSON.stringify([player,time,levelTime,projectiles])'),frozen);
 const poor=snapshot();assert.equal(r("Merchant.purchase('compass')"),false);assert.equal(snapshot(),poor);
 r('coins=1000;player.hp=2;');const rng=r('randomCalls');
 assert(r("Merchant.purchase('compass')"));assert.equal(r('coins'),780);assert(r("flags[1].includes('compass')"));
 const owned=snapshot();assert.equal(r("Merchant.purchase('compass')"),false);assert.equal(snapshot(),owned);
 assert(r("Merchant.purchase('minimap')"));assert.equal(r('coins'),420);
 for(let i=0;i<3;i++)assert(r("Merchant.purchase('roastMeat')"));
 assert.equal(r('coins'),390);assert.equal(r('meatCount'),3);assert.equal(r('player.hp'),2);assert.equal(r('randomCalls'),rng,'Buying food must not roll or consume it');validate(r('saved'));
 for(const id of ['__proto__','constructor','missing'])assert.equal(r(`Merchant.purchase(${JSON.stringify(id)})`),false);
 const blocked=snapshot();assert.equal(r('Merchant.eat()'),false);assert.equal(snapshot(),blocked);
 assert(r('Merchant.close()'));h.press('o');h.tick();h.release('o');assert.equal(r('meatCount'),2);assert.equal(r('player.hp'),4);assert.equal(r('randomCalls'),rng+1);
 r("handleKeyDown({key:'o',repeat:true,preventDefault(){}});");h.tick();assert.equal(r('meatCount'),2,'Key auto-repeat consumed food');
 r('Math.random=()=>{randomCalls++;return .9;};player.hp=1;');h.press('o');h.tick();h.release('o');assert.equal(r('player.hp'),1);assert.equal(r('meatCount'),1);
 const safe=r('JSON.stringify([player.inv,dash,player.vx,player.vy])');assert(r('Merchant.eat()'));assert.equal(r('player.hp'),1);assert.equal(r('meatCount'),0);assert.equal(r('JSON.stringify([player.inv,dash,player.vx,player.vy])'),safe);
 const empty=snapshot(),calls=r('randomCalls');assert.equal(r('Merchant.eat()'),false);assert.equal(snapshot(),empty);assert.equal(r('randomCalls'),calls);
 r("meatCount=1;Bindings.setPrimary('useMeat','mouse2');handleMouseDown({button:2,pointerType:'mouse',target:canvas,preventDefault(){}});input(0);pressed.clear();handleMouseUp({button:2,preventDefault(){}});");assert.equal(r('meatCount'),0,'Mouse food action consumes exactly one serving');
 r('meatCount=2;persist();');const ledger=r('JSON.stringify([coins,meatCount,flags])');r('mainMenu();startGame(true);');assert.equal(r('JSON.stringify([coins,meatCount,flags])'),ledger);validate(r('saved'));
 r('player.inv=0;damage(999);');assert.equal(r('JSON.stringify([coins,meatCount,flags])'),ledger);
 for(const state of ['pause','dialog','map','training','help','developer','menu','won']){
  r(`state=${JSON.stringify(state)};`);const old=snapshot();assert.equal(r('Merchant.eat()'),false);assert.equal(snapshot(),old);
 }
 assert.throws(()=>validate({...r('saved'),coins:-1}));assert.throws(()=>validate({...r('saved'),meatCount:1.5}));
 r("state='play';enterRealm(0);flags[1]=[];updateHUD();");assert(h.elements.get('compass').hidden,'Compass must require ownership');
 r("flags[1].push('compass');updateHUD();");assert(!h.elements.get('compass').hidden);
 r('Merchant.drawMinimap();');assert(h.elements.get('minimap').hidden);
 r("flags[1].push('minimap');innerWidth=1280;devicePixelRatio=2;var mapLines=[],mapContext=$('minimapCanvas').getContext('2d'),originalLine=mapContext.lineTo;mapContext.lineTo=(...p)=>mapLines.push(p);Merchant.drawMinimap();");
 assert(!h.elements.get('minimap').hidden);assert.equal(h.elements.get('minimapCanvas').width,440);assert.equal(h.elements.get('minimapCanvas').height,280);
 assert.equal(r('mapLines.length'),r('level.platforms.filter(p=>!p.secretArea).length'),'Undiscovered secret platforms must stay hidden');
 r("flags[0].push('discovered:angelRuin');mapLines=[];Merchant.drawMinimap();");assert.equal(r('mapLines.length'),r("level.platforms.filter(p=>!p.secretArea||p.secretArea==='angelRuin').length"));
 r("state='pause';mapLines=[];Merchant.drawMinimap();");assert.equal(r('mapLines.length'),0,'Paused minimap must not redraw');
 r("state='menu';Merchant.drawMinimap();");assert(h.elements.get('minimap').hidden);r('mapContext.lineTo=originalLine;');
 r('state="play";coins=Number.MAX_SAFE_INTEGER;');assert.equal(r('Merchant.award(5)'),0);
}finally{Math.random=originalRandom;}
console.log('PASS: coin kill/respawn rules, rescue captors, camp-only paused shop, atomic permanent/stack purchases, food RNG/use binding/nonlethal bounds, persistence and invalid saves.');
