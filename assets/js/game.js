/* Kiba: Három világ — v0.8. */
'use strict';
const $=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d');
const sheet=new Image();sheet.src = 'assets/images/momo.png';
const menuSheet=new Image();menuSheet.src='assets/images/momo-menu-idle-v2.png';
const menuFrameBottom=[500,491,498,451,451,450];
const reducedMotion=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
const SWORD_DURATION=.42,SWORD_IMPACT=.16;
const SWORD_ATTACKS=Object.freeze({normal:Object.freeze({duration:SWORD_DURATION,impact:SWORD_IMPACT,cooldown:.34,damageScale:.75}),heavy:Object.freeze({duration:.9,impact:.38,cooldown:.9,damageScale:1.75})});
const H=720;
let viewW=1280,scale=1,camera=0,cameraY=0,time=0,levelTime=0,last=0,state='menu',realm=0,level=levels[0],platforms=[];
let abilities=[false,false],defeated=[false,false,false],flags=[[],[],[]],visitedRests=[[],[],[]],shards=0,saved=null;
let coins=0,meatCount=0;
let player,enemies=[],boss,particles=[],drops=[],projectiles=[],checkpoint=null,visits=new Set();
let councilReturn=null;
let attackElapsed=0,attackFace=1,attackHit=false,attackKind='normal';
let attack=0,attackCooldown=0,dash=0,dashCooldown=0,dashTrailClock=0,jumpBuffer=0,coyote=0,dropTimer=0;
let toastTimer=0,shake=0,sound=false,audio,musicClock=0,context=null,bossStarted=false,loadingReady=false,storageReady=false,saveWarning=false;
const keys=new Set(),pressed=new Set();
const realms=[
 {title:'葦原',label:I18n.t("text.i.realm.of.the.living"),name:I18n.t("text.japan.the.path.of.bells"),short:I18n.t("text.japan.4f5421"),sky:['#182c37','#415d60','#a4ac8d'],fog:'#94b6a4',gold:'#e4c78a',accent:'#c96957',floor:'#253c37',boss:I18n.t("text.the.forest.oathbreaker"),ability:I18n.t("text.blessing.of.the.wind"),intro:I18n.t("story.japan.intro")},
 {title:'黄泉',label:I18n.t("text.ii.realm.of.the.dead"),name:I18n.t("text.yomi.the.world.s.depths"),short:'Yomi',sky:['#171322','#322136','#69505e'],fog:'#8b5c77',gold:'#dea58d',accent:'#b788dd',floor:'#352534',boss:I18n.t("text.guardian.of.the.silent.river"),ability:I18n.t("text.spirit.dash"),intro:I18n.t("story.yomi.intro")},
 {title:'高天原',label:I18n.t("text.iii.celestial.realm"),name:I18n.t("text.takamagahara.towers.of.wind"),short:I18n.t("text.heaven"),sky:['#344358','#8f9696','#e3cfa3'],fog:'#e5e0c8',gold:'#f6d796',accent:'#f3d494',floor:'#606a62',boss:I18n.t("text.the.corrupted.seraph"),ability:I18n.t('item.dawnblade'),intro:I18n.t("story.heaven.intro")}
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const hasFlag=id=>flags[realm].includes(id);
const objectVisible=o=>(!o.requiresFlag||hasFlag(o.requiresFlag))&&!(o.type==='councilKey'&&hasFlag('councilGateOpen'));
function resize(){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);scale=innerHeight/H;viewW=innerWidth/scale;ctx.setTransform(dpr*scale,0,0,dpr*scale,0,0);}
addEventListener('resize',resize);resize();
SaveVault.ready.then(data=>{storageReady=true;saved=data;$('continueButton').hidden=!data;if(SaveVault.notice)toast(I18n.t(SaveVault.notice));if(DevTools.isOpen)DevTools.refresh();});
function persist(){if(DevSession.active)return;saved={version:2,layout:2,release:GAME_RELEASE.version,realm,location:level===forestCamp?'forestCamp':null,prologueComplete:!Prologue.active,abilities:[...abilities],defeated:[...defeated],flags:flags.map(f=>[...f]),visitedRests:visitedRests.map(f=>[...f]),shards,coins,meatCount,progression:JSON.parse(JSON.stringify(progression)),checkpoint:checkpoint?{...checkpoint}:null,won:state==='won'};$('continueButton').hidden=false;try{SaveVault.write(saved).catch(saveFailed);}catch{saveFailed();}}
function saveFailed(){if(!saveWarning){saveWarning=true;toast(I18n.t("text.saving.failed.check.your.browser.storage"));}}
function toast(msg){$('toast').textContent=I18n.t(msg);$('toast').classList.add('visible');toastTimer=5;}
function tone(freq,duration=.15,type='sine',volume=.05){if(!sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}}
function burst(x,y,color,n=12){for(let i=0;i<n;i++)particles.push({x,y,vx:(noise(time*100+i)-.5)*280,vy:-noise(time*200+i)*230,life:.4+noise(i+time)*.5,color,size:2+noise(i)*4});}
function emitDashWisp(){if(reducedMotion.matches)return;particles.push({kind:'dashWisp',x:player.x+player.w/2-player.face*12,y:player.y+player.h*.55,vx:-player.face*50,vy:0,life:.32,maxLife:.32,face:player.face});}
function initPlayer(point=level.start){const support=platforms.find(p=>!p.broken&&Math.abs(p.y-point.y)<1&&point.x+21.5>p.x&&point.x-21.5<p.x+p.w);player={x:point.x-21.5,y:point.y-69,w:43,h:69,vx:0,vy:0,face:1,hp:momoStats().maxHp,maxHp:momoStats().maxHp,inv:1,onGround:!!support,jumps:0,support:support?.id??null,animationTime:0};attack=0;attackElapsed=0;attackFace=1;attackHit=false;attackKind='normal';dash=0;dashTrailClock=0;attackCooldown=0;dashCooldown=0;jumpBuffer=0;coyote=0;dropTimer=0;shake=0;}
function resetCamera(){camera=clamp(player.x-viewW*.43,0,Math.max(0,level.width-viewW));cameraY=clamp(player.y-H*.54,level.top??0,Math.max(0,level.height-H));}
function enterRealm(n,point=null){DevDamage.clear();councilReturn=null;realm=n;level=levels[n];platforms=level.platforms.map(p=>({...p,dx:0}));levelTime=0;checkpoint={...(level.rests.find(r=>r.id===point?.id)||level.rests[0])};initPlayer(checkpoint);bossStarted=false;particles=[];drops=[];projectiles=[];visits=new Set();
 enemies=createEnemies();boss=createBoss();Visuals.resetAtmosphere();if(!visitedRests[n].includes('start'))visitedRests[n].push('start');resetCamera();updateHUD();}
function enterCouncilHall(){
 if(Prologue.active||realm!==1||level!==levels[1]||(!defeated[1]&&!DevSession.active)||!hasFlag('councilGateOpen'))return false;
 DevDamage.clear();const hp=player.hp;
 councilReturn={checkpoint:{...checkpoint},enemies,visits,point:{x:2650,y:3400}};
 level=councilHall;platforms=level.platforms.map(p=>({...p,dx:0}));levelTime=0;enemies=[];particles=[];drops=[];projectiles=[];visits=new Set();
 boss=createBoss();bossStarted=false;initPlayer(level.start);player.hp=Math.min(hp,player.maxHp);state='play';keys.clear();pressed.clear();resetCamera();updateHUD();persist();toast(I18n.t('council.hall.entered'));return true;
}
function campNPCVisible(npc){return !npc.requiresFlag||flags[npc.requiresFlag.realm]?.includes(npc.requiresFlag.id);}
function enterForestCamp({save=true,atShrine=false}={}){
 if(Prologue.active||!defeated[0]&&!DevSession.active)return false;
 const hp=player?.hp;
 enterRealm(0);level=forestCamp;platforms=level.platforms.map(p=>({...p,dx:0}));
 checkpoint={...forestCamp.rests[0]};enemies=[];boss=createBoss();boss.dead=true;bossStarted=false;
 initPlayer(atShrine?checkpoint:level.start);if(!atShrine&&Number.isFinite(hp))player.hp=Math.min(hp,player.maxHp);
 if(!visitedRests[0].includes(checkpoint.id))visitedRests[0].push(checkpoint.id);
 state='play';keys.clear();pressed.clear();context=null;$('prompt').hidden=true;$('bossHud').hidden=true;
 resetCamera();updateHUD();if(save)persist();return true;
}
function leaveForestCamp(){
 if(level!==forestCamp)return false;
 const hp=player.hp;enterRealm(0,levels[0].rests.find(r=>r.id==='temple'));
 initPlayer(level.campEntrance);player.hp=Math.max(1,Math.min(hp,player.maxHp));
 state='play';keys.clear();pressed.clear();context=null;$('prompt').hidden=true;
 resetCamera();updateHUD();persist();return true;
}
function leaveCouncilHall(toShrine=false){
 if(level!==councilHall)return false;
 const back=councilReturn,hp=player.hp,rest={...(back?.checkpoint||checkpoint)};
 enterRealm(1,rest);
 if(!toShrine){if(back){enemies=back.enemies;visits=back.visits;}initPlayer(back?.point||{x:2650,y:3400});}
 player.hp=Math.max(1,Math.min(hp,player.maxHp));state='play';keys.clear();pressed.clear();resetCamera();updateHUD();return true;
}
function startGame(resume=false){if(!storageReady){toast(I18n.t("text.the.save.is.still.loading"));return;}if(!loadingReady||Visuals.loaded<Visuals.total){toast(I18n.t("text.the.artwork.is.still.loading"));return;}if(Visuals.failures.length){toast(I18n.t("text.an.artwork.file.could.not.be.loaded.please.reload"));return;}
 const resetForRelease=!!(resume&&saved&&saved.release!==GAME_RELEASE.version),old=resume&&!resetForRelease?saved:null;
 abilities=old?[...old.abilities]:[false,false];defeated=old?[...old.defeated]:[false,false,false];flags=old?old.flags.map(f=>[...f]):[[],[],[]];visitedRests=old?old.visitedRests.map(f=>[...f]):[[],[],[]];shards=old?old.shards:0;coins=old?.coins??0;meatCount=old?.meatCount??0;progression=normalizeProgression(old?.progression,flags);
 Prologue.stop();if(old?.location==='forestCamp')enterForestCamp({save:false,atShrine:true});else enterRealm(old?old.realm:0,old?.checkpoint);state='play';$('menu').hidden=true;showHUD(true);
 if(!old||old.prologueComplete===false){Prologue.start();persist();}else{persist();toast(I18n.t('text.your.journey.continues.where.you.last.rested'));}
 if(resetForRelease)toast(I18n.t('text.save.reset.new.version'));
}
function showHUD(on){for(const id of ['hud','quest','controls'])$(id).hidden=!on;$('relicInventory').hidden=!on||(!collectedRelics().length&&!flags[1].includes('councilKey'));$('touchControls').hidden=!on||!matchMedia('(pointer:coarse)').matches;Compass.update();}
function story(label,title,text,onClose){state='dialog';keys.clear();pressed.clear();$('dialogLabel').textContent=I18n.t(label);$('dialogTitle').textContent=I18n.t(title);$('dialogText').replaceChildren();for(const paragraph of I18n.t(text).split(/\n\s*\n/)){const p=document.createElement('p');p.textContent=paragraph;$('dialogText').append(p);}$('dialog').hidden=false;$('dialogOk').textContent=I18n.t("text.next.0ed851");$('dialogOk').onclick=()=>{$('dialog').hidden=true;state='play';onClose?.();};$('dialogOk').focus();}
function pointNear(p,dx=100,dy=90){return Math.abs(player.x+player.w/2-p.x)<dx&&Math.abs(player.y+player.h-p.y)<dy;}
function nextObjective(){if(level===forestCamp)return{point:level.rests[0],compass:false,text:I18n.t('camp.objective')};if(level.id==='councilHall')return{point:level.inscription,compass:false,text:I18n.t('council.hall.objective')};if(defeated[realm])return{point:realm===2?level.father:level.exit,name:realm===2?I18n.t('HARU'):realms[realm+1].name,text:realm===2?I18n.t("text.ride.the.final.wind.stream.up.to.your.father"):I18n.t("text.stand.beneath.the.glowing.torii.and.press.e")};
 if(realm===0){if(!abilities[0])return{point:level.ability,name:level.ability.name,text:I18n.t("text.visit.the.wind.shrine.beside.the.path")};const bell=level.objects.find(o=>o.type==='bell'&&!hasFlag(o.id));if(bell)return{point:bell,name:bell.name,text:I18n.format("message.ring.arg0.bells.arg1.2",[bell.name,flags[0].filter(f=>f.endsWith('Bell')).length])};return{point:level.boss,name:realms[realm].boss,text:I18n.t("text.the.two.bells.have.opened.the.bamboo.temple.find")};}
 if(realm===1){const soul=level.objects.find(o=>o.type==='rescue'&&!hasFlag(o.id));if(soul)return{point:soul,name:soul.name,text:I18n.format("message.free.arg0.souls.arg1.2",[soul.name,flags[1].filter(f=>f.startsWith('soul')).length])};if(!abilities[1])return{point:level.ability,name:level.ability.name,text:I18n.t("text.the.shrine.of.shadows.grants.spirit.dash.use.the")};return{point:level.boss,name:realms[realm].boss,text:I18n.t("text.the.abyss.gate.is.open.descend.to.the.bottom")};}
 const upcoming=level.winds.find(w=>!w.afterBoss&&w.y+50<player.y&&w.y+w.h>player.y-250);return{point:upcoming?{x:upcoming.x+upcoming.w/2,y:upcoming.y}:level.boss,name:upcoming?(level.zones.find(z=>upcoming.x+upcoming.w/2>=z.x&&upcoming.x+upcoming.w/2<=z.x+z.w&&upcoming.y+10>=z.y&&upcoming.y+10<=z.y+z.h)?.name||realms[realm].name):realms[realm].boss,text:hasFlag('dawnSeal')?I18n.t("text.the.dawn.seal.is.broken.the.guardian.awaits.at"):I18n.t("text.jump.into.the.wind.streams.and.move.sideways.onto")};}
function updateHUD(){if(!player)return;$('game').classList[!Prologue.active&&bossStarted&&!boss?.dead?'add':'remove']('encounter-active');$('coinPurse').hidden=Prologue.active;if(Prologue.active){Compass.update();Prologue.hud();return;}$('questLabel').textContent=I18n.t('quest.label');const current=realm===0?(player.y>1150?I18n.t("energy.faint"):I18n.t("energy.nourishing")):realm===1?I18n.t("energy.distorted"):level.winds.some(w=>overlap(player,w))?I18n.t("energy.powerful"):I18n.t("energy.pure");$('kibaCurrent').textContent=I18n.t(current);$('realmLabel').textContent=I18n.t(level===forestCamp?'camp.name':realms[realm].label);$('health').innerHTML=I18n.t('<span>♥</span>'.repeat(player.hp)+'<span class="empty">♥</span>'.repeat(player.maxHp-player.hp));$('health').setAttribute('aria-label',I18n.format("message.arg0.of.arg1.health",[player.hp,player.maxHp]));$('souls').textContent=I18n.t(shards);$('coinCount').textContent=coins;$('coinPurse').setAttribute('aria-label',I18n.t('merchant.coins')+': '+coins);$('foodTouch').hidden=!meatCount;$('dashHint').hidden=!abilities[1];$('jumpHint').textContent=I18n.t(abilities[0]?I18n.t("text.twice.double.jump"):I18n.t("text.jump.4e09c3"));$('dropHint').hidden=realm===0;updateProgressHUD();updateRelicHUD();const objective=nextObjective();$('objective').textContent=keyedInstruction(I18n.t(objective.text));Compass.update(objective);}
function revive(){if(DevImmortality.active){initPlayer(Prologue.active||level===councilHall?level.start:checkpoint);projectiles=[];resetCamera();updateHUD();return;}if(Prologue.active){Prologue.lose();return;}if(level===councilHall)leaveCouncilHall(true);initPlayer(checkpoint);respawnEnemies();if(!boss.dead)resetBossBattle();resetMinibosses();projectiles=[];resetCamera();updateHUD();toast(I18n.t("text.the.shrine.has.called.you.back.your.abilities.and"));}
function damage(amount=1,dir=0){if(DevImmortality.active)return;if(Prologue.active){Prologue.hurt(amount);return;}if(player.inv>0||dash>0)return;const before=player.hp;player.hp=Math.max(0,player.hp-amount);DevDamage.record('incoming',player,before,player.hp);player.inv=momoStats().invulnerability;player.vx=dir*240;player.vy=-220;shake=.22;tone(100,.22,'sawtooth',.03);burst(player.x+20,player.y+35,'#dd9480');if(!player.hp)revive();else updateHUD();}
function getContext(){
 if(Prologue.active)return null;
 if(level===forestCamp){
  if(pointNear(level.returnPoint,100,90))return{type:'campReturn',text:I18n.t('camp.return')};
  const npc=level.npcs.find(n=>campNPCVisible(n)&&pointNear(n,95,85));
  if(npc)return{type:'campNPC',npc,text:npc.merchant?I18n.t('merchant.trade'):I18n.format('camp.talk',[I18n.t(npc.name)])};
  const rest=level.rests.find(r=>pointNear(r,90,80));
  return rest?{type:'checkpoint',rest,text:I18n.t('text.e.rest.heal.and.save')}:null;
 }
 if(level===levels[0]&&defeated[0]&&pointNear(level.campEntrance,105,90))return{type:'campEntrance',text:I18n.t('camp.enter')};
 if(level===yomi&&!Merchant.rescued()&&pointNear(yomi.akash,100,85))return{type:'akash',text:I18n.t('merchant.free')};
 if(level===councilHall){
  if(pointNear(level.returnPoint,130,110))return{type:'councilReturn',text:I18n.t('council.return.prompt')};
  if(pointNear(level.inscription,130,110))return{type:'councilInscription',text:I18n.t('council.inscription.prompt')};
  return null;
 }
 if(realm===1&&pointNear(level.councilGate,155,100))return{type:'councilGate',text:I18n.t(hasFlag('councilGateOpen')?'council.gate.enter':hasFlag('councilKey')?'council.gate.unlock':'council.gate.locked')};
 if(realm===2&&defeated[2]&&pointNear(level.father,110,100))return{type:'father',text:I18n.t('text.e.embrace.your.father')};
 if(realm<2&&pointNear(level.exit,115,100))return{type:'portal',text:defeated[realm]?I18n.format('message.e.travel.to.arg0.from.the.ground',[realms[realm+1].short]):I18n.t('text.e.the.guardian.s.oath.seals.the.passage')};
 const object=level.objects.find(o=>!hasFlag(o.id)&&objectVisible(o)&&relicUnlocked(o)&&pointNear(o));
 if(object)return{type:object.type,object,text:object.type==='councilKey'?I18n.t('council.key.pickup'):I18n.format('message.e.arg0.arg1',[object.type==='bell'?I18n.t('text.ring'):object.type==='rescue'?I18n.t('text.free'):object.type==='relic'?I18n.t('action.pick.up'):I18n.t('text.recall'),object.name])};
 if(level.ability&&pointNear(level.ability))return{type:'ability',text:'E · '+(abilities[realm]?I18n.t('text.shrine.of.memory'):level.ability.name)};
 const rest=level.rests.find(r=>pointNear(r,90,80));if(rest)return{type:'checkpoint',rest,text:I18n.t('text.e.rest.heal.and.save')};
 const weakWall=level.gates.find(g=>g.kind==='fragile'&&!gatePass(g)&&overlap({x:player.x-90,y:player.y-10,w:player.w+180,h:player.h+20},g));
 if(weakWall)return{type:'weakWall',text:I18n.t('text.j.the.cracked.rock.sounds.hollow')};
 const seal=level.gates.find(g=>g.kind==='fire'&&!gatePass(g)&&overlap({x:player.x-95,y:player.y-70,w:player.w+190,h:player.h+140},g));
 if(seal)return{type:'seal',text:I18n.t('text.j.break.the.seal.with.the.dawnblade')};return null;
}
function interact(){const c=getContext();if(!c)return;
 if(c.type==='campEntrance'){enterForestCamp();return;}
 if(c.type==='campReturn'){leaveForestCamp();return;}
 if(c.type==='akash'){Merchant.free();return;}
 if(c.type==='campNPC'&&c.npc.merchant){Merchant.open();return;}
 if(c.type==='campNPC'){story(I18n.t('camp.dialogue.label'),I18n.t(c.npc.name),I18n.t(c.npc.dialogue));return;}
 if(c.type==='councilGate'){
  if(hasFlag('councilGateOpen')){enterCouncilHall();return;}
  if(!hasFlag('councilKey')){toast(I18n.t('council.gate.clue'));return;}
  flags[1]=flags[1].filter(f=>f!=='councilKey');flags[1].push('councilGateOpen');persist();
  enterCouncilHall();toast(I18n.t('council.gate.consumed'));return;
 }
 if(c.type==='councilReturn'){leaveCouncilHall();persist();toast(I18n.t('council.hall.returned'));return;}
 if(c.type==='councilInscription'){story(I18n.t('council.hall.name'),I18n.t('council.inscription.title'),I18n.t('council.inscription.story'));return;}
 if(c.type==='councilKey'){flags[1].push('councilKey');persist();updateHUD();burst(c.object.x,c.object.y-40,'#f0dab1',24);toast(I18n.t('council.key.acquired'));return;}
 if(c.type==='checkpoint'){checkpoint={...c.rest};player.hp=player.maxHp;respawnEnemies();if(!boss.dead)resetBossBattle();if(!visitedRests[realm].includes(c.rest.id))visitedRests[realm].push(c.rest.id);persist();updateHUD();burst(c.rest.x,c.rest.y-35,realms[realm].gold,18);toast(I18n.t("text.health.restored.enemies.have.respawned.u.train"));tone(440,.3);}
 if(c.type==='relic'){const o=c.object;if(hasFlag(o.id)||!relicUnlocked(o))return;flags[realm].push(o.id);persist();updateHUD();burst(o.x,o.y-55,o.id==='angelHalo'?'#ffe29a':'#d58cf3',28);story(I18n.t("text.ancient.relic"),o.name,o.id==='angelHalo'?I18n.t("text.the.broken.halo.s.faint.light.curls.around.the"):I18n.t("text.the.horn.feels.cold.yet.embers.pulse.within.it"));}
 if(c.type==='ability'){if(!abilities[realm]){abilities[realm]=true;persist();updateHUD();story(I18n.t("text.new.ability"),level.ability.name,realm===0?I18n.t("story.space.jump.release.it.and.press.it.again.in"):I18n.t("story.k.spirit.dash.you.are.briefly.invulnerable.and.can"));}else story(I18n.t("text.haru.s.memory"),I18n.t("text.we.always.find.our.way.home"),I18n.t("text.if.you.lose.your.way.seek.the.shrines.light"));}
 if(['bell','rescue','memory'].includes(c.type)){const o=c.object;if(o.group&&enemies.some(e=>e.group===o.group&&!e.dead)){toast(I18n.t("text.the.soul.s.captors.are.still.alive.defeat.them"));return;}flags[realm].push(o.id);shards+=o.type==='memory'?8:5;if(o.type==='memory')player.hp=player.maxHp;persist();updateHUD();burst(o.x,o.y-70,realms[realm].gold,28);tone(660,.6);const text=o.type==='bell'?(hasFlag('forestBell')&&hasFlag('villageBell')?I18n.t("text.the.two.bells.ring.together.the.bamboo.temple.s"): I18n.t("text.the.bell.echoes.through.the.forest.another.may.answer")):o.type==='rescue'?(hasFlag('soulUpper')&&hasFlag('soulLower')?I18n.t("text.the.two.freed.souls.have.broken.the.abyss.seal"):I18n.t("text.the.soul.thanks.you.the.other.captive.awaits.deeper")):I18n.t("text.an.old.memory.of.haru.warms.the.amulet.you");story(o.type==='memory'?I18n.t("text.a.gift.from.a.hidden.path"):I18n.t("text.the.path.answers"),o.name,text);}
 if(c.type==='portal'){if(!defeated[realm])toast(I18n.t("text.the.guardian.s.oath.seals.this.passage"));else{const n=realm+1;enterRealm(n);persist();story(realms[n].label,realms[n].name,realms[n].intro);}}
 if(c.type==='father'){state='won';persist();showHUD(false);story(I18n.t("text.the.three.worlds.are.united"),I18n.t('story.home.title'),I18n.t("story.haru.kneels.before.the.little.samurai.i.knew.you"),()=>{state='won';$('dialog').hidden=false;$('dialogLabel').textContent=I18n.t("text.the.journey.s.end");$('dialogTitle').textContent=I18n.t("text.together.again");$('dialogText').innerHTML=I18n.t("text.both.bells.have.rung.the.captive.souls.are.free");$('dialogOk').textContent=I18n.t("text.back.to.main.menu");$('dialogOk').onclick=mainMenu;});}}
function gatePass(g){if(g.kind==='council')return hasFlag('councilGateOpen');if(g.kind==='secretRock')return false;if(g.kind==='fragile')return hasFlag(g.id);if(g.kind==='shadow'&&g.requiresDash)return dash>0;if(defeated[realm])return true;if(g.kind==='root')return false;if(g.kind==='bells')return hasFlag('forestBell')&&hasFlag('villageBell');if(g.kind==='souls')return hasFlag('soulUpper')&&hasFlag('soulLower');if(g.kind==='shadow')return dash>0;return hasFlag(g.id);}
function guardianDefeated(){
 if(Prologue.active||boss.dead||boss.hp>0||!bossStarted||defeated[realm])return;
 const keyEarned=realm===1&&awardCouncilKeyDrop();
 boss.dead=true;finishBossBattle();
 /* Establish a complete victory before awardXP persists the reward snapshot. */
 defeated[realm]=true;
 const relicUnited=uniteVictoryRelics(),reward=BOSS_REWARDS[realm],firstReward=!hasFlag(reward.claim);
 checkpoint={...level.rests.find(r=>r.id===level.arena.restId)};
 if(!visitedRests[realm].includes(checkpoint.id))visitedRests[realm].push(checkpoint.id);
 if(firstReward){
  flags[realm].push(reward.claim);if(!hasFlag(reward.id))flags[realm].push(reward.id);
  progression.points+=reward.points;shards+=20;Merchant.award(Merchant.rewards.boss);awardXP(reward.xp);
 }
 persist();updateHUD();burst(boss.x+40,boss.y+40,realms[realm].gold,55);$('bossHud').hidden=true;
 const text=realm===0?I18n.t('story.haru.s.first.memory.returns.the.glowing.torii.has'):realm===1?I18n.t('story.haru.s.second.memory.has.set.momo.s.sword'):I18n.t('text.the.final.guardian.bows.a.new.wind.stream.shines');
 const body=(relicUnited?I18n.t('relic.eclipse.dialog.body')+'\n\n'+text:text+(keyEarned?'\n\n'+I18n.t('council.key.dropped'):''))+(firstReward?'\n\n'+I18n.format('boss.reward.summary',[reward.xp,reward.points,I18n.t('item.'+reward.id)]):'');
 story(I18n.t(relicUnited?'relic.eclipse.dialog.label':'text.a.soul.fragment.returns.home'),relicUnited?I18n.t('relic.eclipse.name'):realm===0?I18n.t('text.the.bells.call.you.home'):realm===1?I18n.t('text.the.dawnblade.awakens'):I18n.t('text.the.last.wind'),body);
}
function playerAttackDamage(kind=attackKind){return momoStats().damage*SWORD_ATTACKS[kind].damageScale;}
function melee(kind='normal'){if(!Object.hasOwn(SWORD_ATTACKS,kind)||attackCooldown>0)return false;const profile=SWORD_ATTACKS[kind];attackKind=kind;attack=profile.duration;attackCooldown=profile.cooldown;attackElapsed=0;attackFace=player.face;attackHit=false;tone(kind==='heavy'?180:defeated[1]?430:300,.1,'triangle',.025);return true;}
function advanceSwordAttack(dt){if(attack<=0)return;const profile=SWORD_ATTACKS[attackKind];attackElapsed=Math.min(profile.duration,attackElapsed+dt);if(!attackHit&&attackElapsed>=profile.impact){attackHit=true;shake=attackKind==='heavy'?.08:.04;resolveMeleeHit();}}
function resolveMeleeHit(){const damage=playerAttackDamage(),hit={x:attackFace>0?player.x+20:player.x-105,y:player.y-14,w:125,h:105};if(Prologue.active){Prologue.hit(damage,hit);return;}for(const e of enemies){if(e.dead||!overlap(hit,e))continue;if(e.miniboss){if(!e.active||e.inv>0)continue;const before=e.hp;e.hp-=damage;DevDamage.record('outgoing',e,before,e.hp);e.inv=.22;burst(e.x+e.w/2,e.y+30,realms[realm].gold);if(e.hp<=0)killEnemy(e);continue;}const front=Math.sign(player.x+player.w/2-e.x-e.w/2)===e.face,above=player.y+player.h<e.y+e.h*.55;
 if(e.kind==='shield'&&front&&!above&&dash<=0&&e.guardBreak<=0&&e.recovery<=0){e.blocks++;e.blockFlash=.3;burst(e.x+e.w/2+e.face*24,e.y+30,'#eee0ad',9);tone(610,.08,'triangle',.03);if(e.blocks>=3){e.blocks=0;e.guardBreak=1.6;e.recovery=1.6;e.windup=0;toast(I18n.t("text.the.shield.is.broken.strike.now.or.get.behind"));}continue;}
 const before=e.hp;e.hp-=damage;DevDamage.record('outgoing',e,before,e.hp);e.stun=.35;e.windup=0;e.guardBreak=Math.max(e.guardBreak,dash>0?.7:0);e.x=clamp(e.x+attackFace*18,e.origin-e.patrol,e.origin+e.patrol);burst(e.x+20,e.y+20,realms[realm].gold);if(e.hp<=0)killEnemy(e);}
 if(bossStarted&&!boss.dead&&overlap(hit,boss))hitBoss(damage);
 for(const g of level.gates)if(g.kind==='fragile'&&!gatePass(g)&&overlap(hit,g)){flags[realm].push(g.id);persist();burst(g.x+g.w/2,player.y+35,'#b4a99b',32);toast(I18n.t("text.cold.air.flows.from.behind.the.rock.wall"));}
 if(defeated[1])for(const g of level.gates){if(g.kind==='fire'&&!gatePass(g)&&overlap(hit,g)){flags[realm].push(g.id);persist();burst(player.x+20,player.y-10,'#f3d494',30);toast(I18n.t("text.the.dawnblade.has.broken.the.seal"));updateHUD();}}
 for(const p of projectiles)if(overlap(hit,{x:p.x-7,y:p.y-7,w:14,h:14}))p.life=0;}
function input(dt){const move=(Bindings.has('moveRight',keys)?1:0)-(Bindings.has('moveLeft',keys)?1:0);if(move)player.face=move;
 if(Bindings.has('jump',pressed))jumpBuffer=.13;
 const support=platforms.find(p=>p.id===player.support);
 if(jumpBuffer>0&&Bindings.has('drop',keys)&&player.onGround&&support?.drop){dropTimer=.22;player.y+=8;player.vy=100;player.onGround=false;player.support=null;player.jumps=1;jumpBuffer=0;coyote=0;}
 const grounded=player.onGround||coyote>0;if(jumpBuffer>0&&(grounded||(abilities[0]&&player.jumps<2))){const airJump=!grounded;player.vy=airJump?-650:-590;player.jumps=airJump?2:1;player.onGround=false;player.support=null;coyote=0;jumpBuffer=0;burst(player.x+20,player.y+69,airJump?'#f0df9c':'#d8e3c9',airJump?16:7);tone(airJump?550:380,.12);}
 if(Bindings.has('useMeat',pressed))Merchant.eat();if(Bindings.has('heavyAttack',pressed))melee('heavy');else if(Bindings.has('attack',pressed))melee();if(Bindings.has('dash',pressed)&&abilities[1]&&dashCooldown<=0){dash=.2;dashCooldown=momoStats().dashCooldown;player.vy=0;dashTrailClock=.035;emitDashWisp();tone(180,.2,'triangle',.035);}if(Bindings.has('interact',pressed))interact();if(Bindings.has('train',pressed))showTraining();const target=move*285;player.vx=dash>0?player.face*1100:player.vx+(target-player.vx)*Math.min(1,dt*13);}
function movingPlatforms(dt){levelTime+=dt;for(const p of platforms){const oldX=p.x;if(p.kind==='moving')p.x=p.baseX+Math.sin(levelTime*p.speed+p.phase)*p.range;p.dx=p.x-oldX;if(player.onGround&&player.support===p.id)player.x+=p.dx;}}
function movePlayer(dt){const before={x:player.x,y:player.y},wasGround=player.onGround;player.x=clamp(player.x+player.vx*dt,0,level.width-player.w);
 for(const g of level.gates){if(gatePass(g)||!overlap(player,g))continue;if(before.x+player.w<=g.x+1){player.x=g.x-player.w;player.vx=0;}else if(before.x>=g.x+g.w-1){player.x=g.x+g.w;player.vx=0;}else if(g.kind==='shadow'){player.x=player.x+player.w/2<g.x+g.w/2?g.x-player.w:g.x+g.w;player.vx=0;}}
 player.vy=Math.min(980,player.vy+(dash>0?0:1550*dt));if(!player.onGround&&dash<=0)for(const w of level.winds){if(w.afterBoss&&!defeated[realm])continue;if(overlap(player,w)){player.vy=Math.min(player.vy,-430);player.inv=Math.max(player.inv,.03);}}
 player.y+=player.vy*dt;player.onGround=false;player.support=null;
 for(const p of platforms){if(p.broken||dropTimer>0&&p.drop)continue;if(player.x+player.w>p.x&&player.x<p.x+p.w&&player.vy>=0&&before.y+player.h<=p.y+3&&player.y+player.h>=p.y){player.y=p.y-player.h;player.vy=0;player.onGround=true;player.jumps=0;player.support=p.id;}}
 for(const g of level.gates){if(gatePass(g)||!overlap(player,g))continue;if(player.vy>=0&&before.y+player.h<=g.y+3){player.y=g.y-player.h;player.vy=0;player.onGround=true;player.jumps=0;player.support='gate:'+g.id;}else if(player.vy<0&&before.y>=g.y+g.h-3){player.y=g.y+g.h;player.vy=0;}else{player.x=before.x;}}
 if(wasGround&&!player.onGround&&player.vy>=0)coyote=.1;if(player.y>level.height+180)revive();}
function shoot(x,y,vx,vy,color,life=4,kind='orb'){projectiles.push({x,y,vx,vy,color,life,kind});}

// Shared player clocks belong to the outer loop, before any realm dispatch.
function updatePlayerTimers(dt){
 attack=Math.max(0,attack-dt);attackCooldown=Math.max(0,attackCooldown-dt);dash=Math.max(0,dash-dt);dashCooldown=Math.max(0,dashCooldown-dt);
 jumpBuffer=Math.max(0,jumpBuffer-dt);coyote=Math.max(0,coyote-dt);dropTimer=Math.max(0,dropTimer-dt);player.inv=Math.max(0,player.inv-dt);shake=Math.max(0,shake-dt);
}
function update(dt){toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('visible');if(state!=='play'){if(state==='menu'||state==='help'&&helpOrigin==='menu')time+=dt;return;}DevDamage.update(dt);time+=dt;player.animationTime+=dt;updatePlayerTimers(dt);if(Prologue.active){Prologue.update(dt);pressed.clear();return;}movingPlatforms(dt);input(dt);if(state!=='play'){pressed.clear();return;}movePlayer(dt);dashTrailClock-=dt;if(dash>0&&dashTrailClock<=0){emitDashWisp();dashTrailClock=.035;}discoverSecrets();advanceSwordAttack(dt);if(state!=='play'){pressed.clear();return;}updateEnemies(dt);
 for(const h of level.hazards)if(overlap(player,h))damage(1,player.vx>=0?-1:1);
 const a=level.arena;if(!boss.dead&&player.x+player.w>(a.triggerX??a.x)&&player.x<a.x+a.w&&Math.abs(player.y+player.h-a.y)<160){bossStarted=true;if(!visits.has('boss')){visits.add('boss');checkpoint={...level.rests.find(r=>r.id===a.restId)};if(!visitedRests[realm].includes(checkpoint.id))visitedRests[realm].push(checkpoint.id);persist();toast(realm===0?I18n.t("text.raised.sword.dodge.the.guardian.is.vulnerable.after.the"):realm===1?I18n.t("text.watch.for.cracks.in.the.ground.when.lava.rises"):I18n.t("text.gold.signals.light.arrows.violet.signals.shadow.magic.keep"));}}
 updateBoss(dt);for(const p of projectiles){p.life-=dt;if(p.kind==='arrow')p.vy+=55*dt;if(p.gravity)p.vy+=p.gravity*dt;const beforeX=p.x,beforeY=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;const radius=p.radius||7;const swept={x:Math.min(beforeX,p.x)-radius,y:Math.min(beforeY,p.y)-radius,w:Math.abs(p.x-beforeX)+radius*2,h:Math.abs(p.y-beforeY)+radius*2};if(p.life>0&&overlap(player,swept)){damage(p.damage||1,p.vx>0?1:-1);p.life=0;}}projectiles=projectiles.filter(p=>p.life>0);
 for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.kind!=='dashWisp')p.vy+=500*dt;}particles=particles.filter(p=>p.life>0);
 for(const r of level.rests)if(pointNear(r,105,85)&&!visitedRests[realm].includes(r.id)){visitedRests[realm].push(r.id);checkpoint={...r};persist();toast(I18n.t("text.new.shrine")+r.name+I18n.t("text.fast.travel.here.from.the.map"));}
 camera+=(clamp(player.x-viewW*.43,0,Math.max(0,level.width-viewW))-camera)*Math.min(1,dt*6);cameraY+=(clamp(player.y-H*.54,level.top??0,Math.max(0,level.height-H))-cameraY)*Math.min(1,dt*8);
 context=getContext();$('prompt').hidden=!context;if(context)$('prompt').textContent=keyedInstruction(I18n.t(context.text));const region=(level.secrets||[]).find(z=>overlap(player,z))||level.zones.find(z=>overlap(player,z));$('areaLabel').textContent=I18n.t((region?.name||realms[realm].name)+(realm===1?' · '+Math.max(0,Math.round((player.y+69-450)/10))+I18n.t("text.m.deep"):realm===2?' · '+Math.max(0,Math.round((6300-player.y-69)/10))+I18n.t("text.m.high"):''));updateHUD();
 if(sound){musicClock-=dt;if(musicClock<=0){const notes=[220,261.63,293.66,329.63,392];tone(notes[Math.floor(time*.3)%5]*(realm===2?2:1),1.8,'sine',.02);musicClock=1.6;}}pressed.clear();}
function draw(){ctx.save();ctx.clearRect(0,0,viewW,H);if(Prologue.active){Prologue.draw();ctx.restore();return;}const r=realms[realm];background(r);if(state==='menu'||state==='help'&&helpOrigin==='menu'||DevTools.menuBackground){ctx.save();ctx.translate(-500,-400);drawLandscape(r,levels[0].platforms);ctx.restore();drawTorii(Math.min(viewW*.8,1180),600,r);drawMenuMomo(Math.min(viewW*.68,880),616,Math.min(180,Math.max(100,viewW*.28)));ctx.restore();return;}
 if(level===councilHall){
  ctx.save();ctx.translate(-camera,-cameraY);drawKibaCurrent();Visuals.councilGate({...level.returnPoint,w:250,h:250},true);
  drawPlayer();DevDamage.draw();ctx.restore();ctx.restore();return;
 }
 if(level===forestCamp){
  ctx.save();ctx.translate(-camera,-cameraY);Visuals.campScenery();drawShrine(level.rests[0].x,level.rests[0].y,r,false);Visuals.campPathMarker(level.returnPoint,I18n.t(realms[0].short));drawPlayer();DevDamage.draw();ctx.restore();ctx.restore();return;
 }
 ctx.save();ctx.translate(-camera+(shake>0?(noise(time*500)-.5)*10:0),-cameraY);Visuals.secretScenery(r);if(level===levels[0])Prologue.village();drawWinds(r);drawLandscape(r,platforms);drawKibaCurrent();for(const rest of level.rests)if(visiblePoint(rest))drawShrine(rest.x,rest.y,r,false);if(level.ability&&visiblePoint(level.ability))drawShrine(level.ability.x,level.ability.y,r,true);if(level.exit&&visiblePoint(level.exit))drawTorii(level.exit.x,level.exit.y,r);drawGates(r);if(level===levels[0]&&defeated[0])Visuals.campPathMarker(level.campEntrance,I18n.t('camp.name'));drawObjects(r);drawHazards(r);Visuals.bossEffects(r);
 for(const e of enemies)if(!e.dead&&visiblePoint({x:e.x,y:e.y},190))drawEnemy(e,r);if(visiblePoint({x:boss.x,y:boss.y},200)){if(!boss.dead)drawBoss(r);else drawSpirit(boss.x+45,boss.y+60,r.gold);}
 if(realm===2&&boss.dead&&visiblePoint(level.father)){drawMomo(level.father.x,level.father.y+4,90,0,Math.floor(time*3)%6,1);ctx.font='11px Manrope, sans-serif';ctx.fillStyle=r.gold;ctx.textAlign='center';ctx.fillText(I18n.t('HARU'),level.father.x,level.father.y-105);}
 for(const p of projectiles)Visuals.projectile(p);
 for(const p of particles){if(p.kind==='dashWisp'){ctx.globalAlpha=1;Visuals.dashTrail(p.x,p.y,p.face,1-p.life/p.maxLife);continue;}ctx.globalAlpha=clamp(p.life*2,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);}ctx.globalAlpha=1;
 drawPlayer();DevDamage.draw();ctx.restore();const v=ctx.createLinearGradient(0,0,0,H);v.addColorStop(0,'#08121945');v.addColorStop(.3,'#08121900');v.addColorStop(.75,'#08121900');v.addColorStop(1,'#08121988');ctx.fillStyle=v;ctx.fillRect(0,0,viewW,H);ctx.restore();}
function visiblePoint(p,margin=280){return p.x>camera-margin&&p.x<camera+viewW+margin&&p.y>cameraY-margin&&p.y<cameraY+H+margin;}
function drawKibaCurrent(){const weak=realm===0&&player.y>1150;ctx.save();ctx.lineWidth=realm===1?2:1.5;ctx.strokeStyle=realm===1?'#c872b8':realm===2?'#e8d89b':'#addbb5';for(let i=0;i<(weak?7:22);i++){const x=camera+noise(i*14.7+realm)*viewW+Math.sin(time*.7+i)*18,y=cameraY+noise(i*29.3+realm*17)*H;ctx.globalAlpha=(weak?.14:.24)+Math.sin(time*2+i)*.08;ctx.beginPath();ctx.moveTo(x,y);if(realm===1){ctx.lineTo(x+8,y-9);ctx.lineTo(x+2,y-18);}else{ctx.quadraticCurveTo(x+8+Math.sin(time+i)*5,y-12,x+6,y-26);}ctx.stroke();}ctx.restore();}
function background(r){if(level===forestCamp)Visuals.campBackdrop();else if(level===councilHall)Visuals.councilBackdrop();else Visuals.backdrop(r);}

function drawLandscape(r,items){Visuals.terrain(r,items);}

function drawWinds(r){Visuals.winds(r);}
function drawGates(r){Visuals.gates(r);}

function drawObjects(r){Visuals.objects(r);}

function drawHazards(r){Visuals.hazards(r);}

function drawBat(e,r){Visuals.actor(e,r);}

function realmUnlocked(n){return Number.isInteger(n)&&n>=0&&n<levels.length&&(n===0||defeated[n-1]);}
function fastTravel(rest,targetRealm=realm){
 if(Prologue.active||!['play','map'].includes(state)||!realmUnlocked(targetRealm))return false;
 const destination=realmRests(targetRealm).find(r=>r.id===rest?.id);
 if(!destination||!visitedRests[targetRealm].includes(destination.id))return false;
 if(destination.id==='forestCamp'){if(!enterForestCamp({save:false,atShrine:true}))return false;}else enterRealm(targetRealm,destination);$('map').hidden=true;state='play';keys.clear();pressed.clear();persist();updateHUD();toast(I18n.t('text.light.path')+destination.name);return true;
}
function travelGrid(n){
 const grid=document.createElement('div');grid.className='travel-grid';
 for(const rest of realmRests(n)){
  if(rest.id==='forestCamp'&&!visitedRests[0].includes(rest.id))continue;
  const discovered=visitedRests[n].includes(rest.id),button=document.createElement('button');
  button.type='button';button.textContent=(discovered?'⛩ ':'· ')+I18n.t(rest.name);button.disabled=!discovered;
  button.setAttribute('data-realm',String(n));button.setAttribute('data-rest',rest.id);
  button.setAttribute('aria-label',I18n.format('travel.destination',[I18n.t(realms[n].short),I18n.t(rest.name)]));
  button.onclick=()=>fastTravel(rest,n);grid.append(button);
 }
 return grid;
}
function showMap(){if(state!=='play'||Prologue.active)return;const inside=level===councilHall,inCamp=level===forestCamp,mapLevel=inCamp?forestCamp:levels[realm],mapPlatforms=inside?mapLevel.platforms:platforms,mapPlayer=inside?mapLevel.councilGate:{x:player.x+21,y:player.y+69};state='map';keys.clear();pressed.clear();$('mapContent').replaceChildren();const box=document.createElement('div');box.className='world-map';const width=620,height=320,pad=16,worldTop=mapLevel.top??0,worldHeight=mapLevel.height-worldTop,s=Math.min((width-pad*2)/mapLevel.width,(height-pad*2)/worldHeight),ox=(width-mapLevel.width*s)/2,oy=(height-worldHeight*s)/2;const X=x=>ox+x*s,Y=y=>oy+(y-worldTop)*s;
 let svg=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${inCamp?I18n.t('camp.name'):realms[realm].name+' térképe'}"><rect x="${ox}" y="${oy}" width="${mapLevel.width*s}" height="${worldHeight*s}" fill="#0b1920" stroke="#60706a" stroke-width="1"/>`;for(const p of mapPlatforms.filter(p=>!p.secretArea||secretKnown(p.secretArea)))svg+=`<line x1="${X(p.x)}" y1="${Y(p.y)}" x2="${X(p.x+p.w)}" y2="${Y(p.y)}" stroke="#9da68e" stroke-width="2"/>`;for(const w of mapLevel.winds)if(!w.afterBoss||defeated[realm])svg+=`<rect x="${X(w.x)}" y="${Y(w.y)}" width="${Math.max(3,w.w*s)}" height="${w.h*s}" fill="#dfc68844"/>`;for(const o of mapLevel.objects.filter(o=>objectVisible(o)&&(!o.secretArea||secretKnown(o.secretArea)&&relicUnlocked(o))))svg+=`<circle cx="${X(o.x)}" cy="${Y(o.y)}" r="3" fill="${hasFlag(o.id)?'#718679':'#dfba76'}"/>`;if(mapLevel.ability)svg+=`<text x="${X(mapLevel.ability.x)-4}" y="${Y(mapLevel.ability.y)-5}" fill="#f4cf8a" font-size="12">✦</text>`;if(!inCamp)svg+=`<text x="${X(mapLevel.boss.x)-4}" y="${Y(mapLevel.boss.y)-6}" fill="${defeated[realm]?'#718679':'#d98877'}" font-size="12">◆</text>`;
 for(const r of mapLevel.rests)svg+=`<circle cx="${X(r.x)}" cy="${Y(r.y)}" r="3" fill="${visitedRests[realm].includes(r.id)?'#a6c9c5':'#465959'}"/>`;svg+=`<circle cx="${X(mapPlayer.x)}" cy="${Y(mapPlayer.y)}" r="5" fill="#f0dfb1" stroke="#fff" stroke-width="1"/></svg>`;box.innerHTML=I18n.t(svg);$('mapContent').append(box);
 const label=document.createElement('p');label.className='travel-label';label.textContent=I18n.t((inCamp?I18n.t('camp.name'):realms[realm].name)+I18n.t("text.light.paths.to.discovered.shrines"));$('mapContent').append(label);$('mapContent').append(travelGrid(realm));const otherRealms=levels.map((_,n)=>n).filter(n=>n!==realm&&realmUnlocked(n)&&visitedRests[n].length);if(otherRealms.length){const section=document.createElement('section');section.className='realm-travel';const heading=document.createElement('h3');heading.textContent=I18n.t('travel.worlds.title');section.append(heading);for(const n of otherRealms){const name=document.createElement('h4');name.textContent=I18n.t(realms[n].name);section.append(name,travelGrid(n));}$('mapContent').append(section);}$('map').hidden=false;$('closeMap').focus();}
function closeMap(){$('map').hidden=true;state='play';pressed.clear();}
function pause(){if(state==='play'){state='pause';keys.clear();$('pause').hidden=false;$('resumeButton').focus();}else if(state==='pause'){state='play';$('pause').hidden=true;pressed.clear();}}
function mainMenu(){if(DevSession.active){DevSession.end();return;}if(state==='developer')DevTools.close();if(state==='inventory')Inventory.close();if(state==='shop')Merchant.close();Prologue.stop();state='menu';realm=0;level=levels[0];camera=500;cameraY=400;for(const id of ['dialog','map','pause','training','help','inventory','shop','prompt','bossHud'])$(id).hidden=true;$('menu').hidden=false;showHUD(false);keys.clear();$('continueButton').hidden=!saved;}
$('startButton').onclick=()=>startGame(false);$('continueButton').onclick=()=>startGame(true);$('pauseButton').onclick=pause;$('resumeButton').onclick=pause;$('mainMenuButton').onclick=mainMenu;$('mapButton').onclick=showMap;$('closeMap').onclick=closeMap;
$('helpButton').onclick=()=>showHelp('menu');$('pauseHelpButton').onclick=()=>showHelp('pause');$('closeHelp').onclick=closeHelp;
$('soundButton').onclick=()=>{sound=!sound;$('soundButton').textContent=I18n.t(sound?I18n.t("text.sound.on"):I18n.t("text.sound.off"));if(sound){tone(440,.2);audio?.resume();}};
let helpOrigin='menu',captureAction=null;
function bindingKeyLabel(key){
 const symbols={'arrowleft':'←','arrowright':'→','arrowup':'↑','arrowdown':'↓'};
 return symbols[key]||I18n.t('binding.key.'+({' ':'space',shift:'shift',escape:'escape',enter:'enter',backspace:'backspace'}[key]||key))?.replace(/^binding\.key\./,'').toUpperCase();
}
function keyedInstruction(text){
 const action={E:'interact',J:'attack',K:'dash',U:'train',Space:'jump'};
 return text.replace(/\b(?:E|J|K|U|Space)\b/g,token=>bindingKeyLabel(Bindings.read(action[token])[0]));
}
function renderBindingHints(){
 for(const node of document.querySelectorAll('[data-binding]'))node.textContent=bindingKeyLabel(Bindings.read(node.dataset.binding)[0]);
 for(const button of document.querySelectorAll('#touchControls [data-action]')){
  button.setAttribute('aria-label',I18n.t('binding.action.'+button.dataset.action));
  if(['interact','dash','heavyAttack','useMeat'].includes(button.dataset.action))button.textContent=bindingKeyLabel(Bindings.read(button.dataset.action)[0]);
 }
 $('mapButton').title=`${I18n.t('binding.action.map')} (${bindingKeyLabel(Bindings.read('map')[0])})`;
 $('trainButton').title=`${I18n.t('binding.action.train')} (${bindingKeyLabel(Bindings.read('train')[0])})`;
 $('inventoryButton').setAttribute('aria-label',I18n.t('inventory.open'));
 $('inventoryButton').title=`${I18n.t('binding.action.inventory')} (${bindingKeyLabel(Bindings.read('inventory')[0])})`;
 $('pauseButton').title=`${I18n.t('binding.action.pause')} (${bindingKeyLabel(Bindings.read('pause')[0])})`;
}
function renderHelp(){
 const labels={helpEyebrow:'help.eyebrow',helpTitle:'help.title',helpMoveTitle:'help.move.title',helpMoveBody:'help.move.body',helpFightTitle:'help.fight.title',helpFightBody:'help.fight.body',helpJourneyTitle:'help.journey.title',helpJourneyBody:'help.journey.body',helpBindingsTitle:'help.bindings.title',helpBindingsBody:'help.bindings.body',bindingProfileLabel:'help.bindings.profile',resetBindings:'help.bindings.reset',exportBindings:'help.bindings.export',importBindings:'help.bindings.import',closeHelp:'help.close',pauseHelpButton:'help.pause.button'};
 for(const [id,key] of Object.entries(labels))$(id).textContent=I18n.t(key);$('helpJourneyBody').textContent+=' '+I18n.format('help.inventory.body',[bindingKeyLabel(Bindings.read('inventory')[0])]);
 $('helpFightBody').textContent+=' '+I18n.format('help.attack.body',[bindingKeyLabel(Bindings.read('attack')[0]),bindingKeyLabel(Bindings.read('heavyAttack')[0])]);
 $('helpJourneyBody').textContent+=' '+I18n.format('help.merchant.body',[bindingKeyLabel(Bindings.read('useMeat')[0])]);
 const select=$('bindingProfile');select.replaceChildren();
 for(const profile of Bindings.profiles){const option=document.createElement('option');option.value=profile;option.textContent=I18n.t('help.bindings.'+profile)+(profile===Bindings.profile&&Bindings.changed?' · '+I18n.t('help.bindings.changed'):'');select.append(option);}
 select.value=Bindings.profile;
 const rows=$('bindingRows');rows.replaceChildren();
 for(const action of Bindings.actions){
  const row=document.createElement('div'),label=document.createElement('span'),button=document.createElement('button');
  row.className='binding-row';label.textContent=I18n.t('binding.action.'+action);button.type='button';button.dataset.action=action;
  button.textContent=captureAction===action?I18n.t('help.bindings.press'):bindingKeyLabel(Bindings.read(action)[0]);
  button.title=Bindings.read(action).map(bindingKeyLabel).join(' / ');
  button.setAttribute('aria-label',`${label.textContent}: ${button.textContent}. ${I18n.t('help.bindings.press')}`);
  button.onclick=()=>{captureAction=action;$('bindingMessage').textContent=I18n.t('help.bindings.press');renderHelp();rows.querySelector(`[data-action="${action}"]`).focus();};
  row.append(label,button);rows.append(row);
 }
 renderBindingHints();
}
function showHelp(origin){
 if(origin==='menu'&&state!=='menu'||origin==='pause'&&state!=='pause')return;
 helpOrigin=origin;state='help';keys.clear();pressed.clear();captureAction=null;$('bindingMessage').textContent='';renderHelp();$('help').hidden=false;$('help').querySelector('.help-panel').scrollTop=0;$('helpTitle').focus({preventScroll:true});
}
function closeHelp(){if(state!=='help')return;$('help').hidden=true;captureAction=null;state=helpOrigin;$(helpOrigin==='pause'?'pauseHelpButton':'helpButton').focus();}
$('bindingProfile').onchange=event=>{Bindings.choose(event.target.value);captureAction=null;$('bindingMessage').textContent='';renderHelp();};
$('resetBindings').onclick=()=>{Bindings.reset();captureAction=null;renderHelp();$('bindingMessage').textContent=I18n.t('help.bindings.reset.done');};
$('exportBindings').onclick=()=>{const blob=new Blob([JSON.stringify(Bindings.exportData(),null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='kiba-keybindings.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);};
$('importBindings').onclick=()=>$('bindingFile').click();
$('bindingFile').onchange=async event=>{const file=event.target.files?.[0];if(!file)return;let valid=false;try{valid=Bindings.importData(JSON.parse(await file.text()));}catch{}event.target.value='';captureAction=null;renderHelp();$('bindingMessage').textContent=I18n.t(valid?'help.bindings.import.done':'help.bindings.import.error');};
function keyName(e){return Bindings.normalize(e.code==='Space'?' ':e.key);}
function handleKeyDown(e){
 if(state==='developer')return;
 const k=keyName(e);
 if(state==='shop'){if(!e.repeat&&(k==='escape'||Bindings.read('pause').includes(k))){e.preventDefault();Merchant.close();}return;}
 if(state==='inventory'){if(!e.repeat&&(k==='escape'||Bindings.read('pause').includes(k)||Bindings.read('inventory').includes(k))){e.preventDefault();Inventory.close();}return;}
 if(state==='help'){
  if(captureAction){e.preventDefault();if(e.repeat)return;if(k==='escape'){captureAction=null;renderHelp();$('bindingMessage').textContent='';return;}
   const action=captureAction,result=Bindings.setPrimary(action,k);captureAction=null;renderHelp();
   $('bindingMessage').textContent=I18n.t(result.ok?'help.bindings.saved':result.reason==='conflict'?I18n.format('help.bindings.conflict',[I18n.t('binding.action.'+result.action)]):'help.bindings.invalid');
   $('bindingRows').querySelector(`[data-action="${action}"]`).focus();return;
  }
  if(k==='escape'){e.preventDefault();closeHelp();}return;
 }
 if(state!=='play'&&e.target?.closest?.('button,summary,select,input,textarea,a')&&k!=='escape')return;
 if(state==='play'&&Bindings.uses(k))e.preventDefault();if(e.repeat)return;
 if(k==='escape'||Bindings.read('pause').includes(k)){if(state==='training'){closeTraining();return;}if(state==='map'){closeMap();return;}pause();return;}
 if(Bindings.read('map').includes(k)){if(state==='map')closeMap();else showMap();return;}
 if(Bindings.read('inventory').includes(k)){if(state==='play'){e.preventDefault();Inventory.open();}return;}
 if(state==='play'){keys.add(k);pressed.add(k);}
}
function handleKeyUp(e){keys.delete(keyName(e));}
addEventListener('keydown',handleKeyDown);addEventListener('keyup',handleKeyUp);addEventListener('blur',()=>{keys.clear();pressed.clear();if(state==='play')pause();});
document.querySelectorAll('#touchControls [data-action]').forEach(b=>{const token='@'+b.dataset.action;b.addEventListener('pointerdown',e=>{e.preventDefault();if(state!=='play')return;b.setPointerCapture(e.pointerId);keys.add(token);pressed.add(token);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(token));});
sheet.onload=()=>{loadingReady=true;if(DevTools.isOpen)DevTools.refresh();};sheet.onerror=()=>toast(I18n.t("text.momo.s.artwork.could.not.be.loaded.please.reload"));if(sheet.complete&&sheet.naturalWidth)loadingReady=true;
function frame(ms){const dt=Math.min((ms-last)/1000||0,.033);last=ms;update(dt);draw();Merchant.drawMinimap();requestAnimationFrame(frame);}requestAnimationFrame(frame);
Inventory.init();Merchant.init();
BugReport.init(()=>Prologue.active?'dream':level===councilHall?'council':level===forestCamp?'forestCamp':['japan','yomi','heaven'][realm]);
I18n.applyDOM();
DevSession.init();DevBoss.init();DevTeleport.init();DevLevel.init();DevItems.init();DevAbilities.init();DevImmortality.init();DevDamage.init();DevTools.init();
I18n.onChange(()=>{if(player)updateHUD();if(state==='map')showMap();if(state==='training')refreshTraining();if(state==='inventory')Inventory.render();renderHelp();$('soundButton').textContent=I18n.t(sound?I18n.t("text.sound.on"):I18n.t("text.sound.off"));if($('toast').textContent)$('toast').textContent=I18n.t($('toast').textContent);});
renderBindingHints();
for(const select of document.querySelectorAll('.language-picker select'))select.addEventListener('change',e=>I18n.setLocale(e.target.value));

/* Sprite and character rendering */
function tree(x,y,h,layer,r){ctx.save();const w=h*.24;ctx.fillStyle=layer===0?r.sky[0]+'88':layer===1?r.sky[0]+'dd':(realm===1?'#231d30':'#1c3837');ctx.fillRect(x-4,y-h,8,h);if(realm===2){ctx.globalAlpha=.4;}for(let j=0;j<5;j++){const yy=y-h+j*h*.15;ctx.beginPath();ctx.moveTo(x,yy);ctx.lineTo(x-w*(.45+j*.13),yy+h*.28);ctx.quadraticCurveTo(x,yy+h*.19,x+w*(.45+j*.13),yy+h*.28);ctx.closePath();ctx.fill();}ctx.restore();}
function drawTorii(x,y,r){Visuals.torii(x,y,r);}

function drawShrine(x,y,r,ability){Visuals.shrine(x,y,r,ability);}

// Solid paw baselines measured from the original sheet; animation cannot move the collision feet.
const MOMO_FRAME_BOTTOM=[[202,201,202,202,201,201],[198,201,198,199,199,201,199,192],[193,200,194,199,192,201,194,198],[202,202,202,202],[199,198,171,197,202],[201,201,201,201,201,201,201,201],[201,201,202,202,202,202],[202,202,202,202,202,202],[202,202,202,202,202,202],[202,202,202,202,202,202,202,202],[202,202,202,202,202,202,202,202]];
// Visible ink heights measured from the source alpha; keep aerial poses at the standing body scale.
const MOMO_AIR_INK_HEIGHT=[138,165,168,159,147];
function drawMomo(x,feet,size,row,frame,face){if(row===4)size*=198/MOMO_AIR_INK_HEIGHT[frame];if(!sheet.complete||!sheet.naturalWidth)return;ctx.save();ctx.translate(x,feet);if(row!==1&&row!==2&&face<0)ctx.scale(-1,1);const hh=size*208/192,baseline=MOMO_FRAME_BOTTOM[row]?.[frame]??208;ctx.drawImage(sheet,frame*192,row*208,192,208,-size/2,-baseline*size/192,size,hh);ctx.restore();}
function drawMenuMomo(x,feet,size){
 ctx.save();ctx.fillStyle='#08141166';ctx.beginPath();ctx.ellipse(x,feet+2,size*.34,size*.065,0,0,Math.PI*2);ctx.fill();
 if(!menuSheet.complete||!menuSheet.naturalWidth){drawMomo(x,feet,size*.8,0,0,1);ctx.restore();return;}
 const phase=time%6;let frame=0;
 if(reducedMotion.matches)frame=5;
 else if(phase<2)frame=0;
 else if(phase<2.35)frame=1;
 else if(phase<2.85)frame=2;
 else if(phase<4.75)frame=Math.floor((phase-2.85)/.23)%2?4:3;
 else if(phase<5.45)frame=5;
 else frame=1;
 ctx.drawImage(menuSheet,(frame%3)*512,Math.floor(frame/3)*512,512,512,x-size/2,feet-menuFrameBottom[frame]*size/512,size,size);
 ctx.restore();
}
function drawEnemy(e,r){Visuals.actor(e,r);}

function drawBoss(r){Visuals.actor(boss,r,true);}

function drawSpirit(x,y,color){ctx.save();ctx.translate(x,y+Math.sin(time*2)*6);const g=ctx.createRadialGradient(0,0,1,0,0,50);g.addColorStop(0,color+'65');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(-50,-50,100,100);ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,0,5,10,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawSlash(){ctx.save();ctx.translate(player.x+22,player.y+32);if(attackFace<0)ctx.scale(-1,1);const fire=defeated[1];ctx.globalAlpha=clamp((.3-attackElapsed)/.14,0,1);ctx.strokeStyle=fire?'#ffcf83':'#ecedce';ctx.lineWidth=7;ctx.shadowColor=fire?'#ec9153':'#d9e8ce';ctx.shadowBlur=18;ctx.beginPath();ctx.arc(15,0,82,-1.15,1.05);ctx.stroke();ctx.lineWidth=2;ctx.beginPath();ctx.arc(15,0,96,-.9,.8);ctx.stroke();ctx.restore();}

$('trainButton').onclick=showTraining;$('closeTraining').onclick=closeTraining;
for(const key of ['vitality','strength','spirit'])$('train-'+key).onclick=()=>spendPoint(key);


function drawPlayer(){
 const feet=player.y+player.h+1,x=player.x+player.w/2;
 const row=!player.onGround?4:Math.abs(player.vx)>35?(player.face>0?1:2):0;
 const frame=row===4?(player.vy< -260?1:player.vy<100?2:3):Math.floor(player.animationTime*(row===0?5:12))%(row===0?6:8);
 ctx.save();
 if(dash>0&&!reducedMotion.matches){ctx.globalAlpha=.2;if(attack>0)Visuals.momoSlash(x-player.face*50,feet,92,attackElapsed,attackFace,attackKind);else drawMomo(x-player.face*50,feet,92,row,frame,player.face);ctx.globalAlpha=1;}
 // Protection is a steady translucent cue rather than a flashing disappearing sprite.
 ctx.globalAlpha=player.inv>0&&state==='play'?.82:1;
 if(attack>0)Visuals.momoSlash(x,feet,96,attackElapsed,attackFace,attackKind);else drawMomo(x,feet,96,row,frame,player.face);
 // Heavy art includes its painted sweep; the normal slash retains its existing cue.
 if(attack>0&&attackKind==='normal'&&attackElapsed>=SWORD_IMPACT&&attackElapsed<.3)drawSlash();
 ctx.restore();
}
function collectedRelics(){return flags[2].includes('eclipseRelic')?['eclipseRelic']:['angelHalo','demonHorn'].filter(id=>flags[0].includes(id));}
function updateRelicHUD(){const items=Inventory.contents().filter(id=>!ART_INVENTORY.items[id].stack&&!ART_INVENTORY.items[id].category);$('relicInventory').hidden=!items.length;$('relicInventory').textContent=items.map(id=>I18n.t(ART_INVENTORY.items[id].name)).join(' · ');}
