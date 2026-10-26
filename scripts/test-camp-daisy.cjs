'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs'),validate=require('./test-save-validation.cjs');
function setup(){
 const h=harness(),r=h.run;
 r("abilities=[true,true];defeated=[true,true,false,false];flags=[['forestBell','villageBell'],['soulUpper','soulLower','guardian:doomSlayer','daisyPlush','akashRescued'],[],[]];progression=freshProgression();enterForestCamp();initPlayer(forestCamp.daisy);resetCamera();");
 return h;
}
const snapshot=r=>r('JSON.stringify([flags,soldItems,progression,coins,player,saved])');
{
 const h=setup(),r=h.run;
 assert.equal(r('getContext().type'),'campDaisy');assert.equal(r('Inventory.quantity("daisyPlush")'),1);
 const candidate=r('CampQuest.context()'),stats=r('JSON.stringify(momoStats())'),hp=r('player.hp');
 assert(r('Bindings.setPrimary("interact","p").ok'));h.press({action:'interact'});h.tick();h.release({action:'interact'});
 assert.equal(r('state'),'dialog');assert(r('CampQuest.daisyPlaced()'));assert.equal(r('Inventory.quantity("daisyPlush")'),0);assert.equal(r('Merchant.stock("daisyPlush")'),0);
 assert(r('flags[1].includes("daisyPlush")&&flags[1].includes("guardian:doomSlayer")'),'Placement preserves acquisition and victory history');
 assert.equal(r('JSON.stringify(momoStats())'),stats,'Camp morale is narrative, without a combat buff');assert.equal(r('player.hp'),hp,'Placement is not another shrine or heal');
 assert.doesNotThrow(()=>validate(r('saved')));const frozen=r('JSON.stringify([player,particles,time])');h.tick(100);assert.equal(r('JSON.stringify([player,particles,time])'),frozen,'The placement scene pauses gameplay');h.dismiss();
 const before=snapshot(r);assert(!r('CampQuest.placeDaisy()'));h.sandbox.candidate=candidate;assert(!r('CampQuest.interact(candidate)'));assert.equal(snapshot(r),before,'Repeated and cached placement cannot duplicate the toy');
 assert.equal(r('flags[0].filter(id=>id==="daisyPlaced").length'),1);
 h.place(r('forestCamp.rests[0].x'),r('forestCamp.rests[0].y'));assert.equal(r('getContext().type'),'checkpoint','The original shrine stays reachable');
 r('player.hp=1;interact();');assert.equal(r('player.hp'),r('player.maxHp'));assert(r('CampQuest.daisyPlaced()'));
 h.place(r('forestCamp.npcs.find(n=>n.id==="sora").x'),820);r('interact();');assert.equal(r('state'),'dialog');
 assert.equal(h.elements.get('dialogText').children[0].textContent,r('I18n.t("camp.npc.sora.daisy")'));h.dismiss();
 r('persist();mainMenu();startGame(true);');h.dismiss();assert.equal(r('level.id'),'forestCamp');assert(r('CampQuest.daisyPlaced()'));assert.equal(r('Inventory.quantity("daisyPlush")'),0);
 r('player.y=level.height+200;movePlayer(1/120);');assert(r('CampQuest.daisyPlaced()'),'Falling and respawn preserve placement');
 r('leaveForestCamp();enterRealm(1);enterForestCamp();');assert(r('CampQuest.daisyPlaced()'),'Realm travel preserves placement');
 h.place(r('forestCamp.npcs.find(n=>n.id==="akash").x'),820);r('Inventory.open();');assert(!r('Merchant.canSell("daisyPlush")'));assert(!r('Merchant.sell("daisyPlush")'));
 r('Inventory.close();DevTools.open();DevSession.begin();');assert.equal(r('DevItems.add({item:"daisyPlush"})'),'dev.item.owned','Developer grant does not resurrect a placed unique');r('DevSession.end();');
}
// Authorization is rechecked at use time; unrelated dialogs and positions cannot
// consume the toy, nor can its original pickup return after placement.
for(const variant of ['missing','sold','far','outside','pause','inventory','dialog','dream']){
 const h=setup(),r=h.run;h.sandbox.candidate=r('CampQuest.context()');
 if(variant==='missing')r('flags[1]=flags[1].filter(id=>id!=="daisyPlush");');
 if(variant==='sold')r('soldItems.push("daisyPlush");');
 if(variant==='far')h.place(1700,820);
 if(variant==='outside')r('leaveForestCamp();');
 if(['pause','inventory','dialog'].includes(variant))r('state='+JSON.stringify(variant));
 if(variant==='dream')r('Prologue.start();');
 const before=snapshot(r);assert(!r('CampQuest.placeDaisy()'),variant);assert(!r('CampQuest.interact(candidate)'),variant+' cached prompt');assert.equal(snapshot(r),before);
}
{
 const h=setup(),r=h.run;r('flags[1]=flags[1].filter(id=>id!=="daisyPlush");');h.place(2310,820);r('interact();');assert.equal(h.elements.get('dialogText').children[0].textContent,r('I18n.t("camp.npc.sora.dialogue")'),'Sora keeps her original dialogue before placement');
}
{
 const h=setup(),r=h.run,normal=r('JSON.stringify(saved)'),writes=r('window.__saveSnapshots.length');
 r('DevTools.open();DevSession.begin();DevItems.add({item:"daisyPlush"});DevTools.close();initPlayer(forestCamp.daisy);');assert(r('CampQuest.placeDaisy()'));h.dismiss();
 assert.equal(r('JSON.stringify(saved)'),normal);assert.equal(r('window.__saveSnapshots.length'),writes,'Test placement never writes the normal save');r('DevSession.end();startGame(true);');h.dismiss();assert(!r('CampQuest.daisyPlaced()'));
}
// Native art, complete crop, fixed ground registration, read-only draw and no
// new time-dependent effects. Actual contrast and perceived size need browser QA.
{
 const h=setup(),r=h.run,ctx=h.sandbox.document.getElementById('world').getContext('2d');let images=[],translations=[];
 ctx.drawImage=(image,...args)=>images.push({image,args});ctx.translate=(...args)=>translations.push(args);
 r('CampArt.scenery()');const image=r('Visuals.images.slayerDaisy');assert(!images.some(draw=>draw.image===image));
 r('CampQuest.placeDaisy();');h.dismiss();
 for(const state of ['play','pause','dialog'])for(const reduced of [false,true]){
  r('state='+JSON.stringify(state)+';reducedMotion.matches='+reduced+';');images=[];translations=[];const before=snapshot(r);r('CampArt.scenery();');assert.equal(snapshot(r),before);
  const rendered=images.filter(draw=>draw.image===image);assert.equal(rendered.length,1);const a=r('ART_INVENTORY.items.daisyPlush'),p=rendered[0].args;
  assert.deepEqual(p.slice(0,4),[a.x,a.y,a.w,a.h]);assert.equal(p[5]+p[7],0,'Daisy sits on the ground, without clipping ears or feet');assert(translations.some(([x,y])=>x===r('forestCamp.daisy.x')&&y===r('forestCamp.daisy.y')));
 }
 r('state="play";enterRealm(1);initPlayer(yomi.objects.find(o=>o.id==="daisyPlush"));');assert.notEqual(r('getContext()?.type'),'slayerLoot','Returning to Yomi cannot reclaim a deposited toy');
}
console.log('PASS: bound Daisy placement is permanent, lore-only, stock/sale/dev safe; shrine/Sora, death/travel/continue, pause/stale guards and complete grounded native art remain correct.');
