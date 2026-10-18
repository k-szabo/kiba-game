// Gameplay VM coverage; encryption and IndexedDB/reload are tested separately.
'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
function normalState(h){return {saved:h.run('JSON.stringify(saved)'),writes:h.run('JSON.stringify(window.__saveSnapshots)'),storage:JSON.stringify([...h.storage.entries()]),continueHidden:h.elements.get('continueButton').hidden};}
function unchanged(h,baseline,message){assert.deepEqual(normalState(h),baseline,message);}
function possessions(h){return h.run('JSON.stringify({coins,meatCount,flags})');}
function seed(h){
 h.run("Prologue.stop();abilities=[true,false];defeated=[true,false,false];flags=[['forestBell','villageBell'],['akashRescued'],[]];visitedRests=[['start'],[],[]];progression=freshProgression();coins=1000;meatCount=3;enterForestCamp({save:false,atShrine:true});state='play';persist();");
 h.sandbox.Math=Object.create(Math);h.sandbox.Math.random=()=>.25;
}
function approach(h){h.place(h.run("forestCamp.npcs.find(n=>n.id==='akash').x"),820);}
function begin(h){assert(h.run('DevTools.open()'));assert(h.run('DevSession.begin()'));assert(h.run('DevSession.active'));}

// Live and main-menu tests may buy, consume and earn items without replacing
// either the normal snapshot or its mock-vault writes/localStorage mirror.
for(const origin of ['live','menu','shop']){
 const h=harness();seed(h);const expected=possessions(h),baseline=normalState(h);
 if(origin==='menu')h.run('mainMenu()');
 if(origin==='shop'){approach(h);assert(h.run('Merchant.open()'));}
 begin(h);
 assert(h.run("DevTeleport.teleport({realm:'forestCamp',rest:'forestCamp'})"));
 h.run('DevTools.close()');approach(h);assert(h.run('Merchant.open()'));
 const before=h.run('coins');
 assert(h.run("Merchant.purchase('compass')"));assert(h.run("Merchant.purchase('minimap')"));assert(h.run("Merchant.purchase('roastMeat')"));
 assert.equal(h.run('coins'),before-h.run('Merchant.catalogue.compass.price+Merchant.catalogue.minimap.price+Merchant.catalogue.roastMeat.price'));
 assert.equal(h.run('meatCount'),4);assert(h.run("flags[1].includes('compass')&&flags[1].includes('minimap')"));
 unchanged(h,baseline,origin+': test purchases cannot mutate normal saves');
 h.run('Merchant.close();player.hp=2;');assert(h.run('Merchant.eat()'));assert.equal(h.run('meatCount'),3);assert.equal(h.run('player.hp'),3);
 assert(h.run('Inventory.open()'));assert(h.run('Merchant.eat(true)'));assert.equal(h.run('meatCount'),2);h.run('Inventory.close();Merchant.award(75);persist();');
 unchanged(h,baseline,origin+': food and currency remain inside the test');
 h.run('DevSession.end()');assert.equal(h.run('state'),'menu');assert.equal(h.run('DevSession.active'),false);assert(h.elements.get('shop').hidden);
 unchanged(h,baseline,origin+': ending a test restores the normal save');
 h.run('startGame(true)');h.dismiss();assert.equal(possessions(h),expected,origin+': Continue restores normal currency, food and purchases');
 const writes=h.run('window.__saveSnapshots.length');h.run('Merchant.award(5);persist();');
 assert.equal(h.run('saved.coins'),1005);assert(h.run('window.__saveSnapshots.length')>writes,'Normal saving resumes after the test ends');
}

// A first-time test must not create a Continue save, including after food,
// currency, a new-game reset and returning through the main menu.
{
 const h=harness();h.run('mainMenu();saved=null;window.__saveSnapshots=[]');h.storage.clear();h.elements.get('continueButton').hidden=true;
 const baseline=normalState(h);begin(h);h.run('DevTools.close();Merchant.award(99);meatCount=2;player.hp=2;');
 h.sandbox.Math=Object.create(Math);h.sandbox.Math.random=()=>.75;
 assert(h.run('Merchant.eat()'));assert.equal(h.run('player.hp'),1);
 h.run('startGame(false);persist();');assert(h.run('DevSession.active'));assert.equal(h.run('coins'),0);assert.equal(h.run('meatCount'),0);
 unchanged(h,baseline,'A reset inside a no-save test cannot create progress');
 h.run('mainMenu()');unchanged(h,baseline,'Ending a no-save test leaves no Continue save');
 h.run('startGame(false)');assert(h.run('Prologue.active'));assert.equal(h.run('saved.coins'),0);assert.equal(h.run('saved.meatCount'),0);
}

// Normal death, falls, resting, travel and Continue retain currency, food and
// purchases. These are permanent possessions rather than carried death drops.
{
 const h=harness();seed(h);h.run("flags[1].push('compass','minimap');persist();");const expected=possessions(h);
 h.run('player.inv=0;damage(999);');assert.equal(possessions(h),expected,'Combat death retains merchant possessions');
 h.run('player.y=level.height+181;player.vy=20;movePlayer(1/120);');assert.equal(possessions(h),expected,'Fatal falling retains merchant possessions');
 h.place(h.run('checkpoint.x'),h.run('checkpoint.y'));h.run('interact()');assert.equal(possessions(h),expected,'Shrine resting retains merchant possessions');
 h.run('leaveForestCamp();');assert.equal(possessions(h),expected);
 assert(h.run('fastTravel(forestCamp.rests[0],0)'));assert.equal(possessions(h),expected,'Fast travel retains merchant possessions');
 h.run('mainMenu();startGame(true);');h.dismiss();assert.equal(possessions(h),expected,'Continue retains merchant possessions');
}

// Ordinary enemies can award currency again after respawning, but a dead body,
// summoned minion, defeated miniboss or replayed guardian cannot be farmed.
{
 const h=harness(),r=h.run;r('coins=0;');
 r("var ordinary=enemies.find(e=>!e.miniboss);var ordinaryId=ordinary.id;ordinary.hp=0;killEnemy(ordinary);");
 assert.equal(r('coins'),r('Merchant.rewards.enemy'));assert.equal(r('saved.coins'),r('coins'),'The XP-triggered snapshot includes the coin award');
 r('killEnemy(ordinary);');assert.equal(r('coins'),r('Merchant.rewards.enemy'));
 r('respawnEnemies();ordinary=enemies.find(e=>e.id===ordinaryId);ordinary.hp=0;killEnemy(ordinary);');assert.equal(r('coins'),2*r('Merchant.rewards.enemy'));
 const beforeSummon=r('coins');r("var summoned=createEnemy({id:'test-summon',x:330,y:1000,kind:'guard',patrol:10},0);summoned.summoned=true;summoned.hp=0;killEnemy(summoned);");
 assert.equal(r('coins'),beforeSummon,'Summoned enemies do not generate coins');
 const beforeMini=r('coins');r("var elder=enemies.find(e=>e.id==='oldAngel');elder.hp=0;killEnemy(elder);");
 assert.equal(r('coins'),beforeMini+r('Merchant.rewards.miniboss'));assert.equal(r('saved.coins'),r('coins'));
 r('killEnemy(elder);respawnEnemies();elder=enemies.find(e=>e.id===elder.id);killEnemy(elder);');
 assert.equal(r('coins'),beforeMini+r('Merchant.rewards.miniboss'),'Permanent miniboss flags prevent currency farming after respawn');
 const beforeBoss=r('coins');r("flags[0].push('forestBell','villageBell');bossStarted=true;boss.hp=0;guardianDefeated();");
 assert.equal(r('coins'),beforeBoss+r('Merchant.rewards.boss'));assert.equal(r('saved.coins'),r('coins'));
 r('guardianDefeated();');assert.equal(r('coins'),beforeBoss+r('Merchant.rewards.boss'));
 h.dismiss();begin(h);assert(r('DevBoss.revive()'));r('DevTools.close();boss.hp=0;guardianDefeated();');
 assert.equal(r('coins'),beforeBoss+r('Merchant.rewards.boss'),'A guardian replay retains its permanent reward claim');
}
{
 const h=harness(),r=h.run;
 r("Prologue.stop();defeated=[true,false,false];flags=[['forestBell','villageBell'],['soulUpper','soulLower'],[]];coins=0;enterRealm(1);state='play';bossStarted=true;boss.serpent=createLavaSerpent();boss.serpent.hp=0;killEnemy(boss.serpent);");
 assert.equal(r('coins'),r('Merchant.rewards.miniboss'));assert.equal(r('saved.coins'),r('coins'));
 r('killEnemy(boss.serpent);boss.serpent=createLavaSerpent();boss.serpent.hp=0;killEnemy(boss.serpent);');
 assert.equal(r('coins'),r('Merchant.rewards.miniboss'),'The permanent serpent reward cannot be earned twice');
 r('coins=Number.MAX_SAFE_INTEGER-2;');assert.equal(r('Merchant.award(5)'),2);assert.equal(r('coins'),Number.MAX_SAFE_INTEGER);
 assert.equal(r('Merchant.award(5)'),0);assert.equal(r('coins'),Number.MAX_SAFE_INTEGER);
 for(const amount of ['-1','.5','NaN','Infinity','Number.MAX_SAFE_INTEGER+1'])assert.throws(()=>r(`Merchant.award(${amount})`),/Invalid coin reward/);
}
console.log('PASS: live/menu/shop and no-save developer merchant isolation; normal death/travel/reload retention; ordinary respawn rewards; summon exclusion; once-only miniboss, serpent and guardian currency; safe-integer reward bounds.');
