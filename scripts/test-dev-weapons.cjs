const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const near=(actual,expected)=>assert(Math.abs(actual-expected)<1e-8,actual+' != '+expected);
const h=harness(),run=h.run;
function control(id){
 const find=node=>node?.id===id?node:(node?.children||[]).map(find).find(Boolean);
 const result=find(h.elements.get('devToolsList'));assert(result,'Rendered developer control: '+id);return result;
}
const originalSave=run('JSON.stringify(saved)'),writes=run('window.__saveSnapshots.length');
assert.equal(run('DevWeapons.equip({weapon:"naginata"})'),false,'A closed panel cannot switch weapons');
run('DevTools.open()');
assert(control('dev-tool-weapon').disabled,'The weapon action is unavailable outside a test');
assert.equal(run('DevWeapons.equip({weapon:"naginata"})'),false,'Opening a panel does not create a test');
assert(run('DevSession.begin()'));run('DevTools.refresh()');
const ids=Array.from(run('WeaponStyles.ids'));
assert.deepEqual(control('dev-weapon-weapon').children.map(option=>option.value),ids,'The rendered picker uses the shared weapon catalogue');
assert.deepEqual(control('dev-weapon-weapon').children.map(option=>option.textContent),ids.map(id=>run('I18n.t('+JSON.stringify('weapon.'+id+'.item')+')')));
assert.equal(control('dev-weapon-weapon').value,run('weaponStyle'),'The current weapon is initially selected');
assert.equal(control('dev-tool-weapon').disabled,false);
const unchanged=run('JSON.stringify({weaponStyle,player,progression,flags,defeated,abilities,attack,attackElapsed,attackCooldown,attackKind})');
for(const invalid of [undefined,null,{},[],false,0,'naginata',{weapon:null},{weapon:0},{weapon:[]},{weapon:{}},{weapon:'unknown'},{weapon:'__proto__'},{weapon:'constructor'},{weapon:'Naginata'}]){
 assert.equal(run('DevWeapons.equip('+JSON.stringify(invalid)+')'),false,'Reject malformed or unknown weapon requests');
 assert.equal(run('JSON.stringify({weaponStyle,player,progression,flags,defeated,abilities,attack,attackElapsed,attackCooldown,attackKind})'),unchanged);
}
const firstSelect=control('dev-weapon-weapon'),firstButton=control('dev-tool-weapon');
firstSelect.value='naginata';firstSelect.onchange();
assert.equal(run('weaponStyle'),'katana','Picking a value alone does not equip it');
assert.equal(control('dev-weapon-weapon').value,'naginata','A form refresh retains the unsubmitted selection');
firstButton.onclick();assert.equal(run('weaponStyle'),'katana','An old form action cannot equip after a re-render');
firstSelect.value='swordShield';firstSelect.onchange();assert.equal(control('dev-weapon-weapon').value,'naginata','An old select callback cannot overwrite the current choice');
control('dev-tool-weapon').onclick();assert.equal(run('weaponStyle'),'naginata','The current rendered action equips the selected style');
assert.equal(h.snap().state,'developer','Changing equipment keeps the panel open');
assert.equal(control('dev-weapon-weapon').value,'naginata');
const validSelect=control('dev-weapon-weapon');validSelect.value='__proto__';validSelect.onchange();
assert.equal(control('dev-weapon-weapon').value,'naginata','Malformed select values are ignored');
run('DevTools.close()');
assert.equal(run('DevWeapons.equip({weapon:"katana"})'),false,'An active test still requires the open panel');
run('DevTools.open();state="pause"');
assert.equal(run('DevWeapons.equip({weapon:"katana"})'),false,'An open panel alone does not bypass the developer state');
run('state="developer"');
const stablePlayer=run('player');run('player=null');
assert.equal(run('DevWeapons.equip({weapon:"katana"})'),false,'No live actor means no equipment mutation');
h.sandbox.savedTestActor=stablePlayer;run('player=window.savedTestActor;delete window.savedTestActor');
const world=run('JSON.stringify({flags,defeated,progression,abilities,checkpoint,coins,meatCount,teaCount})');
// Combat is exercised through the shared live equip API, rather than checking an ID alone.
for(const id of ids){
 assert(run('DevWeapons.equip({weapon:'+JSON.stringify(id)+'})'));
 run('DevTools.close();attackCooldown=0;player.stun=0;melee("heavy")');
 const tempo=run('WeaponStyles.profile(weaponStyle).tempo');
 near(run('attack'),run('SWORD_ATTACKS.heavy.duration')*tempo);
 near(run('attackCooldown'),run('SWORD_ATTACKS.heavy.cooldown')*tempo);
 near(run('playerAttackProfile().impact'),run('SWORD_ATTACKS.heavy.impact')*tempo);
 for(const face of [-1,1]){
  run('player.face='+face+';attack=0;attackCooldown=0;var victim=enemies.find(e=>e.kind==="guard");enemies=[victim];victim.hp=20;victim.dead=false;victim.x=player.x+'+(face>0?'160':'-160')+';victim.y=player.y;victim.stun=0;victim.inv=0;');
  run('melee("heavy");advanceSwordAttack(playerAttackProfile().impact+.001)');
  near(run('victim.hp'),id==='naginata'?20-run('playerAttackDamage("heavy")'):20);
 }
 run('DevTools.open()');
}
// Switching cannot heal Momo, cancel earned recovery, or refresh a shield block.
run('DevWeapons.equip({weapon:"katana"});player.hp=3;DevWeapons.equip({weapon:"swordShield"})');
assert.equal(run('player.maxHp'),run('momoStats().maxHp'));assert.equal(run('player.hp'),3,'More maximum HP does not heal');
assert(run('player.guardCooldown>=WeaponStyles.profile("swordShield").guardCooldown'),'A new shield is not an immediate block reset');
run('player.hp=player.maxHp;DevWeapons.equip({weapon:"katana"})');
assert.equal(run('player.hp'),run('player.maxHp'),'Removing a health bonus clamps to the new maximum');
run('player.guardCooldown=1.5;attackCooldown=0;melee("heavy");var remainingRecovery=attackCooldown;var motionBefore=JSON.stringify({vx:player.vx,vy:player.vy,inv:player.inv,dash,dashCooldown});DevWeapons.equip({weapon:"naginata"})');
assert.equal(run('attack'),0,'A loadout switch cancels the old pending hit');
assert(run('attackCooldown>=remainingRecovery'),'Weapon swapping cannot cancel attack recovery');
assert.equal(run('JSON.stringify({vx:player.vx,vy:player.vy,inv:player.inv,dash,dashCooldown})'),run('motionBefore'),'Equipment preserves movement, invulnerability and dash state');
assert.equal(run('player.guardCooldown'),1.5);
assert.equal(run('JSON.stringify({flags,defeated,progression,abilities,checkpoint,coins,meatCount,teaCount})'),world,'Weapons do not grant unrelated progression');
run('persist()');assert.equal(run('JSON.stringify(saved)'),originalSave);assert.equal(run('window.__saveSnapshots.length'),writes,'Test equipment never writes the normal save');
// The same picker remains safe in the alternate prologue update path.
assert(run('DevTeleport.teleport({realm:"dream",rest:"dream"})'));assert(run('Prologue.active'));
for(const id of ids){
 assert(run('DevWeapons.equip({weapon:'+JSON.stringify(id)+'})'));
 run('DevTools.close();attackCooldown=0;player.stun=0');h.press({action:'attack'});h.tick();h.release({action:'attack'});
 assert(run('attack>0'),'Equipped '+id+' attacks in the dream');
 run('DevTools.open()');
}
run('DevSession.end()');
assert.equal(run('JSON.stringify(saved)'),originalSave);
assert.equal(run('window.__saveSnapshots.length'),writes,'Ending a test never writes its equipment to the normal save');
run('startGame(true)');h.dismiss();
assert.equal(run('weaponStyle'),'katana','Continuing restores the saved normal weapon');
assert.equal(run('saved.weaponStyle'),'katana','The normal resume write also contains the saved weapon');
assert.equal(run('DevWeapons.equip({weapon:"naginata"})'),false);
console.log('PASS: catalogue-driven weapon tool, rendered fields/actions, stale and invalid input guards, live timing/reach/HP/recovery rules, dream attacks and normal-save isolation.');
