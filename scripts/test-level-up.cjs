'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),harness=require('./test-harness.cjs');
const near=(actual,expected,message)=>assert(Math.abs(actual-expected)<1e-8,`${message}: ${actual} !== ${expected}`);
const h=harness(),r=h.run;
const permanent='JSON.stringify({abilities,defeated,flags,stats:progression.stats,maxHp:player.maxHp})';
// An actual ordinary enemy death crosses the XP threshold exactly once.
r('progression=freshProgression();player.hp=1.25;awardXP(59);');assert.equal(r('LevelUpEffect.remaining'),0);assert.equal(r('player.hp'),1.25,'Below-threshold XP does not heal');
const before=r(permanent);
r("var foe=createEnemy({id:'level-up-test',x:level.start.x,y:level.start.y,kind:'guard',patrol:20});foe.hp=0;killEnemy(foe);");
assert.equal(r('LevelUpEffect.remaining'),r('LevelUpEffect.duration'));
assert.equal(r('progression.level'),2);assert.equal(r('progression.points'),1);assert.equal(r('progression.xp'),19);assert.equal(r('progression.totalXp'),79);
assert.equal(r(permanent),before,'Level-up preserves maximum HP, upgrades, abilities and quest flags');assert.equal(r('player.hp'),r('player.maxHp'),'An actual enemy kill restores current maximum HP');
r('LevelUpEffect.update(.2);player.hp=2;killEnemy(foe);');near(r('LevelUpEffect.remaining'),1.4,'A duplicate death does not replay the cue');assert.equal(r('player.hp'),2,'A duplicate kill cannot heal again');
assert.equal(r('progression.totalXp'),79);
assert(!r('JSON.stringify(saved)').includes('LevelUpEffect'),'Transient cue is absent from saves');
// Invalid, below-threshold, capped and normalized XP do not manufacture level-ups.
for(const bad of ['NaN','Infinity','-2','0','.5','Number.MAX_SAFE_INTEGER+1']){
 r('LevelUpEffect.clear();player.hp=1.25;');const old=r('JSON.stringify(progression)');r(`awardXP(${bad});`);
 assert.equal(r('JSON.stringify(progression)'),old);assert.equal(r('LevelUpEffect.remaining'),0);assert.equal(r('player.hp'),1.25,'Invalid XP cannot heal');
}
r('LevelUpEffect.clear();awardXP(1);');assert.equal(r('LevelUpEffect.remaining'),0);
r('progression=normalizeProgression({level:30,totalXp:15950},flags);awardXP(100);');assert.equal(r('LevelUpEffect.remaining'),0);assert.equal(r('player.hp'),1.25,'Capped XP cannot heal');
r('progression=normalizeProgression({level:8,totalXp:1155},flags);');assert.equal(r('LevelUpEffect.remaining'),0);
r('progression=freshProgression();awardXP(10000);');assert(r('progression.level>2'));
near(r('LevelUpEffect.remaining'),1.6,'A multi-level award starts one bounded cue');
r('LevelUpEffect.update(.7);awardXP(10000);');near(r('LevelUpEffect.remaining'),1.6,'A later genuine level gain refreshes, rather than stacks, the cue');
// Loading, stat allocation and developer level selection never impersonate XP gains.
r('mainMenu();startGame(true);');assert.equal(r('LevelUpEffect.remaining'),0);
r('initPlayer(checkpoint);state="play";showTraining();');assert.equal(r('state'),'training');
assert(r("spendPoint('strength')"));assert.equal(r('LevelUpEffect.remaining'),0);r('closeTraining()');
r('DevTools.open();DevSession.begin();player.hp=1.25;');assert(r('DevLevel.setLevel({level:8})'));assert.equal(r('LevelUpEffect.remaining'),0);assert.equal(r('player.hp'),1.25,'Developer level selection does not grant a level-up heal');r('DevTools.close();DevSession.end();startGame(true)');
// Each loadout and vitality rank heals to its own current maximum, without
// changing upgrades or recharging a partially charged/broken Kiba Shield.
for(const style of ['katana','naginata','swordShield'])for(const vitality of [0,4,12])for(const broken of [false,true]){
 const test=harness(),run=test.run;
 run(`weaponStyle=${JSON.stringify(style)};flags[3].push('kibaShield');progression=normalizeProgression({level:${vitality+2},stats:{vitality:${vitality}}},flags);initPlayer(checkpoint);FiaConflict.absorb(${broken?2:1});player.hp=1.25;updateHUD();`);
 const stable=run('JSON.stringify([player.maxHp,progression.stats,FiaConflict.shield,FiaConflict.recharge,abilities,flags])'),oldLevel=run('progression.level');
 run('awardXP(xpForLevel(progression.level)+xpForLevel(progression.level+1))');
 assert.equal(run('progression.level'),oldLevel+2,'A combined award can gain multiple levels');
 assert.equal(run('player.hp'),run('player.maxHp'),'Loadout/vitality maximum is restored');
 assert.equal(run('JSON.stringify([player.maxHp,progression.stats,FiaConflict.shield,FiaConflict.recharge,abilities,flags])'),stable,'Healing preserves stats and shield state');
 assert(!test.elements.get('health').innerHTML.includes('empty'),'The health HUD updates immediately');
 run('player.hp=1.25;awardXP(1)');assert.equal(run('player.hp'),1.25,'Later XP without a level gain does not heal');
}
{
 const test=harness(),run=test.run;
 run('progression=normalizeProgression({level:29},flags);player.hp=1;awardXP(xpForLevel(29));');
 assert.equal(run('progression.level'),30);assert.equal(run('player.hp'),run('player.maxHp'),'Reaching the final level still heals');
 run('player.hp=1;awardXP(10000)');assert.equal(run('player.hp'),1,'Further XP at the level cap does not heal');
}
// The shared outer loop advances exactly once at all supported frame rates.
for(const fps of [30,60,120]){
 r('enterRealm(0);state="play";enemies=[];boss.dead=true;player.inv=999;LevelUpEffect.start();');
 r(`for(let frame=0;frame<${fps/2};frame++)update(${1/fps});`);
 near(r('LevelUpEffect.remaining'),1.1,`${fps}fps: one timer step per active frame`);
 r(`for(let frame=0;frame<${fps*2};frame++)update(${1/fps});`);assert.equal(r('LevelUpEffect.remaining'),0);
}
// Real panel entry/exit and the small-viewport gate freeze the same transient clock.
r('LevelUpEffect.start()');
for(const [open,close] of [['pause()','pause()'],['Inventory.open()','Inventory.close()'],['DevTools.open()','DevTools.close()'],['showTraining()','closeTraining()'],['story("","","")',"$('dialogOk').onclick()"]]){
 r(open);assert.notEqual(r('state'),'play',open);const remaining=r('LevelUpEffect.remaining');
 r('for(let frame=0;frame<120;frame++)update(1/60)');assert.equal(r('LevelUpEffect.remaining'),remaining,open+' freezes cue');r(close);
}
r('resolutionBlocked=true;update(.2)');near(r('LevelUpEffect.remaining'),1.6,'Unsupported viewport freezes cue');r('resolutionBlocked=false');
// Death, realm changes, menu and new game clear rather than revive the old cue.
for(const action of ['initPlayer(checkpoint)','revive()','player.inv=0;damage(999)','enterRealm(1)','mainMenu()','mainMenu();startGame(false)']){
 r('Prologue.stop();enterRealm(0);state="play";LevelUpEffect.start()');assert(r('LevelUpEffect.remaining>0'));r(action);assert.equal(r('LevelUpEffect.remaining'),0,action);
}
// Prologue and developer teleports share initialization and cannot carry the effect.
r('Prologue.stop();enterRealm(0);state="play";LevelUpEffect.start();DevTools.open();DevSession.begin();');
for(const target of [{realm:'dream',rest:'dream'},{realm:'forestCamp',rest:'forestCamp'},{realm:'3',rest:'start'}]){
 assert(r(`DevTeleport.teleport(${JSON.stringify(target)})`));assert.equal(r('LevelUpEffect.remaining'),0,'Teleport clears cue');
 r('DevTools.close();LevelUpEffect.start();DevTools.open()');
}
r('DevTools.close();DevSession.end();startGame(true)');assert.equal(r('LevelUpEffect.remaining'),0);
const root=path.join(__dirname,'..');
assert(!/id=["']souls["']/.test(fs.readFileSync(path.join(root,'index.html'),'utf8')),'Unused soul counter is absent from the DOM');
for(const file of ['assets/js/game.js','assets/js/prologue.js','assets/css/style.css']){
 const text=fs.readFileSync(path.join(root,file),'utf8');assert(!/\$\(['"]souls['"]\)|#souls\b/.test(text),file+' has no stale counter writes/styles');
}
// Painted frames remain inside the real atlas; anchors are source-global.
const png=fs.readFileSync(path.join(root,r('ART_MANIFEST.levelUp'))),width=png.readUInt32BE(16),height=png.readUInt32BE(20);
assert.equal(png[25],6,'The VFX atlas retains its RGBA alpha channel');
const frames=JSON.parse(r('JSON.stringify(ART_FRAMES.levelUp)'));assert.equal(frames.length,6);
for(const frame of frames){
 assert(frame.x>=0&&frame.y>=0&&frame.x+frame.w<=width&&frame.y+frame.h<=height,'Each VFX crop fits its PNG');
 assert(frame.anchorX>frame.x&&frame.anchorX<frame.x+frame.w&&frame.anchorY>frame.y&&frame.anchorY<frame.y+frame.h,'Grounding anchor is inside its own source cell');
}
// This small Canvas spy verifies frame/opacity choice and balanced state without
// claiming that mocked draws prove painted visual quality.
r(`var qaDraws=[],qaStack=[],qaTransform=[1,0,0,1,0,0];
 ctx.globalAlpha=.37;ctx.globalCompositeOperation='source-over';
 ctx.save=()=>qaStack.push({alpha:ctx.globalAlpha,composite:ctx.globalCompositeOperation,matrix:[...qaTransform]});
 ctx.restore=()=>{const s=qaStack.pop();if(!s)throw Error('Unbalanced Canvas restore');ctx.globalAlpha=s.alpha;ctx.globalCompositeOperation=s.composite;qaTransform=s.matrix;};
 ctx.translate=(x,y)=>{qaTransform[4]+=qaTransform[0]*x+qaTransform[2]*y;qaTransform[5]+=qaTransform[1]*x+qaTransform[3]*y;};
 ctx.scale=(x,y)=>{qaTransform[0]*=x;qaTransform[1]*=x;qaTransform[2]*=y;qaTransform[3]*=y;};
 ctx.drawImage=(image,...args)=>{if(image===Visuals.images.levelUp)qaDraws.push({args,alpha:ctx.globalAlpha,matrix:[...qaTransform]});};`);
const draws=()=>JSON.parse(r('JSON.stringify(qaDraws)'));
for(const progress of [.12,.4,.72,.98]){
 r(`qaDraws=[];Visuals.levelUp(400,500,${progress},false)`);const calls=draws();assert(calls.length>0&&calls.length<=2);
 assert(calls.every(c=>c.alpha>0&&c.alpha<=.37*.85&&c.args.every(Number.isFinite)),'Crossfade draws use bounded opacity and finite coordinates');
 near(r('ctx.globalAlpha'),.37,'Animated effect restores inherited opacity');assert.equal(r('ctx.globalCompositeOperation'),'source-over');assert.equal(r('qaStack.length'),0);
}
let gentle;
for(const progress of [0,.2,.6,.99]){
 r(`qaDraws=[];Visuals.levelUp(400,500,${progress},true)`);const calls=draws();assert.equal(calls.length,1);
 assert.equal(calls[0].args[0],frames[0].x);assert.equal(calls[0].args[1],frames[0].y);near(calls[0].alpha,.37*.55,'Reduced motion uses constant gentle opacity');
 if(gentle)assert.deepEqual(calls,gentle,'Reduced-motion cue has no sprite or transform motion');gentle=calls;
 assert.equal(r('qaStack.length'),0);near(r('ctx.globalAlpha'),.37,'Gentle effect restores opacity');
}
for(const p of [-.1,1,2]){r(`qaDraws=[];Visuals.levelUp(400,500,${p},false)`);assert.equal(draws().length,0,'No expired or pre-start drawing');}
r('Prologue.stop();enterRealm(0);state="play";enemies=[];LevelUpEffect.start();LevelUpEffect.update(.5);qaDraws=[]');
const renderBefore=r('JSON.stringify({player,progression,flags,abilities,time,remaining:LevelUpEffect.remaining})');
r('draw();draw()');assert(draws().length>0,'The actual main draw path renders the active cue');
assert.equal(r('JSON.stringify({player,progression,flags,abilities,time,remaining:LevelUpEffect.remaining})'),renderBefore,'Rendering does not advance cue or mutate gameplay');
r('pause();qaDraws=[];update(.5);draw()');assert(draws().length>0,'Paused world retains its current cue');
assert.equal(r('JSON.stringify({player,progression,flags,abilities,time,remaining:LevelUpEffect.remaining})'),renderBefore,'Pause draw freezes gameplay and VFX progress');
r('pause();LevelUpEffect.clear();qaDraws=[];draw()');assert.equal(draws().length,0,'Inactive cue is not rendered');
for(const scene of ['defeated[0]=true;enterForestCamp({save:false})',"enterRealm(1);defeated[1]=true;flags[1].push('councilGateOpen');enterCouncilHall()"]){
 assert(r(scene));r('state="play";LevelUpEffect.start();LevelUpEffect.update(.5);qaDraws=[];draw()');assert(draws().length>0,'Side-area draw paths use the same effect renderer');assert.equal(r('qaStack.length'),0);
}
console.log('PASS: real XP cue and false-trigger exclusions; bounded timing at30/60/120fps; pause/transition resets; removed soul HUD; atlas bounds, gentle static frame, Canvas restoration, render purity and main/side-area integration.');
