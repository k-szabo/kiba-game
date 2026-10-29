/* Kiba Realms — main game loop and world interactions. */
'use strict';
const $=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d');
const sheet=new Image();
const menuSheet=new Image();
const menuFrameBottom=[500,491,498,451,451,450];
const reducedMotion=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
const SWORD_DURATION=.42,SWORD_IMPACT=.16;
const SWORD_ATTACKS=Object.freeze({normal:Object.freeze({duration:SWORD_DURATION,impact:SWORD_IMPACT,cooldown:.34,damageScale:.75}),heavy:Object.freeze({duration:.9,impact:.38,cooldown:.9,damageScale:1.75})});
const H=720;
let viewW=1280,scale=1,camera=0,cameraY=0,time=0,levelTime=0,last=0,state='menu',realm=0,level=levels[0],platforms=[];
let abilities=[false,false],defeated=levels.map(()=>false),flags=levels.map(()=>[]),visitedRests=levels.map(()=>[]),shards=0,soldItems=[],saved=null;
let coins=0,meatCount=0,teaCount=0,chickenCount=0,quickHeal=null,weaponStyle='katana',weaponChoicePending=false;
let player,enemies=[],boss,particles=[],drops=[],projectiles=[],checkpoint=null,visits=new Set();
let equippedTalisman=null;
let councilReturn=null,campServices=CampServiceRules.fresh('katana');
let attackElapsed=0,attackFace=1,attackHit=false,attackKind='normal';
let attack=0,attackCooldown=0,dash=0,dashCooldown=0,dashTrailClock=0,jumpBuffer=0,coyote=0,dropTimer=0;
let toastTimer=0,shake=0,sound=false,audio,musicClock=0,context=null,bossStarted=false,loadingReady=false,storageReady=false,saveWarning=false;
const keys=new Set(),pressed=new Set();
let resolutionBlocked=false,resolutionFocus=null;
const realms=[
 {title:'葦原',label:I18n.t("text.i.realm.of.the.living"),name:I18n.t("text.japan.the.path.of.bells"),short:I18n.t("text.japan.4f5421"),sky:['#182c37','#415d60','#a4ac8d'],fog:'#94b6a4',gold:'#e4c78a',accent:'#c96957',floor:'#253c37',boss:I18n.t("text.the.forest.oathbreaker"),ability:I18n.t("text.blessing.of.the.wind"),intro:I18n.t("story.japan.intro")},
 {title:'黄泉',label:I18n.t("text.ii.realm.of.the.dead"),name:I18n.t("text.yomi.the.world.s.depths"),short:'Yomi',sky:['#171322','#322136','#69505e'],fog:'#8b5c77',gold:'#dea58d',accent:'#b788dd',floor:'#352534',boss:I18n.t("text.guardian.of.the.silent.river"),ability:I18n.t("text.spirit.dash"),intro:I18n.t("story.yomi.intro")},
 {title:'高天原',label:I18n.t("text.iii.celestial.realm"),name:I18n.t("text.takamagahara.towers.of.wind"),short:I18n.t("text.heaven"),sky:['#344358','#8f9696','#e3cfa3'],fog:'#e5e0c8',gold:'#f6d796',accent:'#f3d494',floor:'#606a62',boss:I18n.t("text.the.corrupted.seraph"),ability:I18n.t('item.dawnblade'),intro:I18n.t("story.heaven.intro")},
 {title:'影',label:'shadow.label',name:'shadow.name',short:'shadow.name',sky:['#100d1b','#29203c','#544360'],fog:'#867294',gold:'#e4c4ec',accent:'#b88ee9',floor:'#2b2536',boss:'shadow.boss.priest',intro:'shadow.story.entry'}
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const hasFlag=id=>flags[realm].includes(id);
const objectVisible=o=>(!o.requiresFlag||hasFlag(o.requiresFlag))&&!(o.type==='councilKey'&&hasFlag('councilGateOpen'));
function resize(){
 const dpr=Math.min(devicePixelRatio||1,2),width=Math.max(1,innerWidth),height=Math.max(1,innerHeight);
 canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);scale=height/H;viewW=width/scale;ctx.setTransform(dpr*scale,0,0,dpr*scale,0,0);
 const wasBlocked=resolutionBlocked;resolutionBlocked=innerWidth<1280||innerHeight<H;
 const notice=$('resolutionNotice');$('resolutionMessage').textContent=I18n.t('display.minimum');
 if(resolutionBlocked){
  if(!wasBlocked)resolutionFocus=document.activeElement;
  if(state==='play')pause();keys.clear();pressed.clear();
 }
 $('game').inert=resolutionBlocked;notice.hidden=!resolutionBlocked;
 if(resolutionBlocked&&!wasBlocked)notice.focus();
 if(!resolutionBlocked&&wasBlocked){if(state==='pause')$('resumeButton').focus();else if(resolutionFocus?.isConnected)resolutionFocus.focus();resolutionFocus=null;}
 Cursor.update();
}
addEventListener('resize',resize);resize();
SaveVault.ready.then(data=>{storageReady=true;saved=data;$('continueButton').hidden=!data;if(SaveVault.notice)toast(I18n.t(SaveVault.notice));if(DevTools.isOpen)DevTools.refresh();});
function captureProgress(){Merchant.selectAvailable();return {version:2,layout:2,release:GAME_RELEASE.version,weaponStyle,weaponChoicePending,equippedTalisman,realm,location:DungeonRun.saveLocation(),dungeon:DungeonRules.copy(dungeonState),prologueComplete:!Prologue.active,abilities:[...abilities],defeated:[...defeated],flags:flags.map(f=>[...f]),visitedRests:visitedRests.map(f=>[...f]),shards,coins,meatCount,teaCount,chickenCount,quickHeal,campServices:JSON.parse(JSON.stringify(campServices)),soldItems:[...soldItems],progression:JSON.parse(JSON.stringify(progression)),checkpoint:checkpoint?{...checkpoint}:null,won:state==='won'};}
function persist(){if(DevSession.active||typeof DuelMode!=='undefined'&&DuelMode.active)return;saved=FiaConflict.pendingSave()||captureProgress();$('continueButton').hidden=false;try{SaveVault.write(saved).catch(saveFailed);}catch{saveFailed();}}
function saveFailed(){if(!saveWarning){saveWarning=true;toast(I18n.t("text.saving.failed.check.your.browser.storage"));}}
function toast(msg){$('toast').textContent=I18n.t(msg);$('toast').classList.add('visible');toastTimer=5;}
function tone(freq,duration=.15,type='sine',volume=.05){if(!sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}}
function burst(x,y,color,n=12){for(let i=0;i<n;i++)particles.push({x,y,vx:(noise(time*100+i)-.5)*280,vy:-noise(time*200+i)*230,life:.4+noise(i+time)*.5,color,size:2+noise(i)*4});}
function emitDashWisp(){if(reducedMotion.matches)return;particles.push({kind:'dashWisp',x:player.x+player.w/2-player.face*12,y:player.y+player.h*.55,vx:-player.face*50,vy:0,life:.32,maxLife:.32,face:player.face});}
function initPlayer(point=level.start){Dawnblade.resetPlayer();BackgroundMotion.reset();FiaConflict.resetPlayer();DungeonRun.cancel();ArenaChallenge.reset();KitsuneQuest.reset();SerpentArt.resetBackdrop();CampWorkshop.cancel();Dialogue.cancel();LevelUpEffect.clear();Merchant.resetTea();const support=platforms.find(p=>!p.broken&&Math.abs(p.y-point.y)<1&&point.x+21.5>p.x&&point.x-21.5<p.x+p.w);player={x:point.x-21.5,y:point.y-69,w:43,h:69,vx:0,vy:0,face:1,hp:momoStats().maxHp,maxHp:momoStats().maxHp,inv:1,stun:0,guardCooldown:0,onGround:!!support,jumps:0,support:support?.id??null,animationTime:0};attack=0;attackElapsed=0;attackFace=1;attackHit=false;attackKind='normal';dash=0;dashTrailClock=0;attackCooldown=0;dashCooldown=0;jumpBuffer=0;coyote=0;dropTimer=0;shake=0;}
function resetCamera(){camera=clamp(player.x-viewW*.43,0,Math.max(0,level.width-viewW));cameraY=clamp(player.y-H*.54,level.top??0,Math.max(0,level.height-H));}
function enterRealm(n,point=null){HannahEncounter.reconcileRewards();HannahEncounter.clear();SlayerDialog.cancel();DoomSlayer.clear();DevDamage.clear();councilReturn=null;realm=n;level=levels[n];platforms=level.platforms.map(p=>({...p,dx:0}));levelTime=0;checkpoint={...(level.rests.find(r=>r.id===point?.id)||level.rests[0])};initPlayer(checkpoint);bossStarted=false;particles=[];drops=[];projectiles=[];visits=new Set();
 CampHerbs.reset();CampQuest.materializeRoute();enemies=createEnemies();boss=createBoss();Visuals.resetAtmosphere();if(!visitedRests[n].includes('start'))visitedRests[n].push('start');resetCamera();updateHUD();}
function enterCouncilHall(){
 if(Prologue.active||realm!==1||level!==levels[1]||(!defeated[1]&&!DevSession.active)||!DevSession.active&&!hasFlag('councilGateOpen'))return false;
 DevDamage.clear();const hp=player.hp;
 councilReturn={checkpoint:{...checkpoint},enemies,visits,point:{x:2650,y:3400}};
 level=councilHall;platforms=level.platforms.map(p=>({...p,dx:0}));levelTime=0;enemies=[];particles=[];drops=[];projectiles=[];visits=new Set();
 boss=createBoss();bossStarted=false;initPlayer(level.start);player.hp=Math.min(hp,player.maxHp);state='play';keys.clear();pressed.clear();resetCamera();updateHUD();persist();toast(I18n.t('council.hall.entered'));return true;
}
function campNPCVisible(npc){return (!npc.requiresFlag||flags[npc.requiresFlag.realm]?.includes(npc.requiresFlag.id))&&KitsuneQuest.npcVisible(npc);}
function enterForestCamp({save=true,atShrine=false}={}){
 if(Prologue.active||!defeated[0]&&!DevSession.active)return false;
 const hp=player?.hp;
 KitsuneQuest.leaveFor(forestCamp);
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
 initPlayer(level.campEntrance);player.hp=Math.min(hp,player.maxHp);
 state='play';keys.clear();pressed.clear();context=null;$('prompt').hidden=true;
 resetCamera();updateHUD();persist();return true;
}
function leaveCouncilHall(toShrine=false){
 if(level!==councilHall)return false;
 const back=councilReturn,hp=player.hp,rest={...(back?.checkpoint||checkpoint)};
 enterRealm(1,rest);
 if(!toShrine){if(back){enemies=back.enemies;visits=back.visits;}initPlayer(back?.point||{x:2650,y:3400});}
 player.hp=Math.min(hp,player.maxHp);state='play';keys.clear();pressed.clear();resetCamera();updateHUD();return true;
}
function startGame(resume=false){if(resolutionBlocked)return;if(!storageReady){toast(I18n.t("text.the.save.is.still.loading"));return;}if(!loadingReady||Visuals.loaded<Visuals.total){toast(I18n.t("text.the.artwork.is.still.loading"));return;}if(Visuals.failures.length){toast(I18n.t("text.an.artwork.file.could.not.be.loaded.please.reload"));return;}
 const resetForRelease=!!(resume&&saved&&saved.release!==GAME_RELEASE.version),old=resume&&!resetForRelease?saved:null;
 HannahEncounter.clear();Dawnblade.resetJourney();FiaConflict.clear();WeaponSelection.cancel();weaponStyle=old?.prologueComplete===false?'katana':old?.weaponStyle??'katana';weaponChoicePending=old?.weaponChoicePending===true;
 abilities=old?[...old.abilities]:[false,false];defeated=old?[...old.defeated]:levels.map(()=>false);flags=old?old.flags.map(f=>[...f]):levels.map(()=>[]);visitedRests=old?old.visitedRests.map(f=>[...f]):levels.map(()=>[]);shards=old?old.shards:0;soldItems=old?[...(old.soldItems||[])]:[];coins=old?.coins??0;meatCount=old?.meatCount??0;teaCount=old?.teaCount??0;chickenCount=old?.chickenCount??0;quickHeal=old?.quickHeal??null;equippedTalisman=old?.equippedTalisman??null;campServices=old?.campServices?JSON.parse(JSON.stringify(old.campServices)):CampServiceRules.fresh(weaponStyle);dungeonState=DungeonRules.copy(old?.dungeon)||DungeonRules.fresh();progression=normalizeProgression(old?.progression,flags);Merchant.selectAvailable();
 Prologue.stop();if(old?.location&&Object.hasOwn(SIDE_LOCATIONS,old.location))CampQuest.enter(old.location,{point:old.checkpoint,save:false,atShrine:true});else enterRealm(old?old.realm:0,old?.checkpoint);state='play';$('menu').hidden=true;showHUD(true);
 if(!old||old.prologueComplete===false){Prologue.start();persist();}else{if(old.fiaRecovery)FiaConflict.restoreAnchor(old.fiaRecovery);persist();if(weaponChoicePending)WeaponSelection.open();else toast(I18n.t('text.your.journey.continues.where.you.last.rested'));}
 if(resetForRelease)toast(I18n.t('text.save.reset.new.version'));
}
function showHUD(on){for(const id of ['hud','quest','controls'])$(id).hidden=!on;Compass.update();}
// One transient scene owns its pages and completion; no dialogue state is saved.
const Dialogue=(()=>{
 let scene=null,revision=0;
 const actors={...HannahArt.dialogueActors(),...CampArt.dialogueActors(),...PrisonArt.dialogueActors(),...KitsuneArt.dialogueActors(),...ArenaArt.actors(),...DungeonArt.actors(),momo:{name:'Momo',image:'inventoryMomoPortrait',rect:ART_INVENTORY.momo},...Object.fromEntries(['daichi','natsu','sora','akash'].map(id=>[id,{name:id==='akash'?'merchant.name':'camp.npc.'+id+'.name',image:ART_CAMP[id].image,rect:ART_CAMP[id]}]))};
 const theme=()=>Prologue.active?'shadow':realm===1?'yomi':realm===2?'heaven':realm===3?'shadow':'japan';
 function portrait(side,id,speaker){
  const node=$('dialogPortrait'+side),actor=Object.hasOwn(actors,id)?actors[id]:null;
  node.hidden=!actor;if(!actor)return;
  node.classList[ id===speaker?'add':'remove']('speaking');
  node.setAttribute('aria-label',I18n.t(actor.name));
  const ratio=Math.max(1,Math.min(3,window.devicePixelRatio||1));node.width=180*ratio;node.height=280*ratio;
  const c=node.getContext('2d'),img=Visuals.images[actor.image],r=actor.rect;c.clearRect(0,0,node.width,node.height);
  if(!img?.complete||!img.naturalWidth)return;
  const s=Math.min(node.width/r.w,node.height/r.h);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  c.drawImage(img,r.x||0,r.y||0,r.w,r.h,(node.width-r.w*s)/2,node.height-r.h*s,r.w*s,r.h*s);
 }
 function render(){
  if(!scene)return;
  const s=scene,body=keyedInstruction(I18n.t(typeof s.text==='function'?s.text():s.text));
  const pages=body.split(/\n\s*\n/);s.page=Math.min(s.page,pages.length-1);s.pages=pages.length;s.onPage?.(s.page);
  $('dialog').dataset.theme=s.theme;
  $('dialogLabel').textContent=I18n.t(s.label);$('dialogTitle').textContent=I18n.t(s.title);
  const speaker=Object.hasOwn(actors,s.speaker)?actors[s.speaker]:null;
  $('dialogSpeaker').hidden=!speaker||I18n.t(s.title)===I18n.t(speaker.name);$('dialogSpeaker').textContent=speaker?I18n.t(speaker.name):'';
  $('dialogText').replaceChildren();
  for(let i=0;i<pages.length;i++){const p=document.createElement('p');p.textContent=I18n.t(pages[i]);p.hidden=i!==s.page;$('dialogText').append(p);}
  $('dialogText').scrollTop=0;$('dialogPage').textContent=(s.page+1)+' / '+pages.length;
  $('dialogOk').textContent=I18n.t(s.button&&s.page===pages.length-1?s.button:'text.next.0ed851');
  portrait('Left',s.left,s.speaker);portrait('Right',s.right,s.speaker);
 }
 function cancel(){
  const wasActive=!!scene;revision++;scene=null;$('dialog').hidden=true;$('dialogOk').onclick=null;
  if(wasActive){keys.clear();pressed.clear();}
 }
 function open(label,title,text,onClose,options={}){
  const token=++revision,returnFocus=document.activeElement;
  scene={label,title,text,onClose,page:0,pages:1,theme:theme(),left:'momo',right:null,...options};
  state='dialog';keys.clear();pressed.clear();$('dialog').hidden=false;
  const next=()=>{
   if(!scene||token!==revision||state!=='dialog'||$('dialog').hidden||$('dialogOk').onclick!==next)return;
   keys.clear();pressed.clear();
   if(scene.page+1<scene.pages){scene.page++;render();$('dialogOk').focus();return;}
   const done=scene.onClose;cancel();state='play';
   if(returnFocus?.isConnected&&returnFocus.matches?.('button,a[href],input,select,textarea,summary,[tabindex]')&&!returnFocus.disabled&&!returnFocus.closest?.('[hidden],[inert]'))returnFocus.focus();else $('pauseButton').focus();
   done?.();
  };
  $('dialogOk').onclick=next;render();$('dialogOk').focus();
 }
 function keydown(event){
  if(state!=='dialog')return;
  if(event.repeat&&(event.key==='Enter'||event.key===' ')){event.preventDefault();return;}
  if(event.key==='Tab'){
   // The scrollable reading region and Next remain reachable inside the modal.
   const nodes=[$('dialogText'),$('dialogOk')],i=nodes.indexOf(document.activeElement);
   event.preventDefault();nodes[event.shiftKey?(i<=0?1:0):(i===0?1:0)].focus();
  }
 }
 return Object.freeze({open,render,cancel,keydown});
})();
function story(label,title,text,onClose,options){Dialogue.open(label,title,text,onClose,options);}
function pointNear(p,dx=100,dy=90){return Math.abs(player.x+player.w/2-p.x)<dx&&Math.abs(player.y+player.h-p.y)<dy;}
function nextObjective(){return Compass.objective(localObjective());}
function localObjective(){const optional=HannahEncounter.objective()||DungeonRun.objective()||ArenaChallenge.objective()||KitsuneQuest.objective()||PrisonQuest.objective()||CampQuest.objective();if(optional)return optional;if(ShadowRealm.active())return ShadowRealm.objective();if(level===forestCamp)return{point:level.rests[0],compass:false,text:I18n.t('camp.objective')};if(level.id==='councilHall')return{point:level.inscription,compass:false,text:I18n.t('council.hall.objective')};if(defeated[realm])return{point:realm===2?level.father:level.exit,name:realm===2?I18n.t('HARU'):realms[realm+1].name,text:realm===2?I18n.t("text.ride.the.final.wind.stream.up.to.your.father"):I18n.t("text.stand.beneath.the.glowing.torii.and.press.e")};
 if(realm===0){if(!abilities[0])return{point:level.ability,name:level.ability.name,text:I18n.t("text.visit.the.wind.shrine.beside.the.path")};const bell=level.objects.find(o=>o.type==='bell'&&!hasFlag(o.id));if(bell)return{point:bell,name:bell.name,text:I18n.format("message.ring.arg0.bells.arg1.2",[bell.name,flags[0].filter(f=>f.endsWith('Bell')).length])};return{point:level.boss,name:realms[realm].boss,text:I18n.t("text.the.two.bells.have.opened.the.bamboo.temple.find")};}
 if(realm===1){const soul=level.objects.find(o=>o.type==='rescue'&&!hasFlag(o.id));if(soul)return{point:soul,name:soul.name,text:I18n.format("message.free.arg0.souls.arg1.2",[soul.name,flags[1].filter(f=>f.startsWith('soul')).length])};if(!abilities[1])return{point:level.ability,name:level.ability.name,text:I18n.t("text.the.shrine.of.shadows.grants.spirit.dash.use.the")};return{point:level.boss,name:realms[realm].boss,text:I18n.t("text.the.abyss.gate.is.open.descend.to.the.bottom")};}
 const upcoming=level.winds.find(w=>!w.afterBoss&&w.y+50<player.y&&w.y+w.h>player.y-250);return{point:upcoming?{x:upcoming.x+upcoming.w/2,y:upcoming.y}:level.boss,name:upcoming?(level.zones.find(z=>upcoming.x+upcoming.w/2>=z.x&&upcoming.x+upcoming.w/2<=z.x+z.w&&upcoming.y+10>=z.y&&upcoming.y+10<=z.y+z.h)?.name||realms[realm].name):realms[realm].boss,text:hasFlag('dawnSeal')?I18n.t("text.the.dawn.seal.is.broken.the.guardian.awaits.at"):I18n.t("text.jump.into.the.wind.streams.and.move.sideways.onto")};}
function updateHUD(){if(!player)return;Dawnblade.hud();FiaConflict.statusHUD();$('game').classList[!Prologue.active&&bossStarted&&!boss?.dead?'add':'remove']('encounter-active');$('coinPurse').hidden=Prologue.active;if(Prologue.active){Compass.update();Prologue.hud();return;}$('questLabel').textContent=I18n.t('quest.label');const current=realm===0?(player.y>1150?I18n.t("energy.faint"):I18n.t("energy.nourishing")):(realm===1||realm===3)?I18n.t("energy.distorted"):level.winds.some(w=>overlap(player,w))?I18n.t("energy.powerful"):I18n.t("energy.pure");$('kibaCurrent').textContent=I18n.t(current);$('realmLabel').textContent=I18n.t(level===forestCamp?'camp.name':CampQuest.isSide()?level.name:realms[realm].label);CampHealth.render($('health'),player.hp,player.maxHp);$('coinCount').textContent=coins;$('coinPurse').setAttribute('aria-label',I18n.t('merchant.coins')+': '+coins);$('campExecutionWarning').hidden=true;$('dashHint').hidden=!abilities[1];$('jumpHint').textContent=I18n.t(abilities[0]?I18n.t("text.twice.double.jump"):I18n.t("text.jump.4e09c3"));$('dropHint').hidden=realm===0;updateProgressHUD();const objective=nextObjective();$('objective').textContent=keyedInstruction(I18n.t(objective.text));Compass.update(objective);if(HannahEncounter.hud()||FiaConflict.hud()||DungeonRun.hud()||ArenaChallenge.hud())return;if(level.ziggurat)$('bossHud').hidden=true;if(level===samuraiCamp){const master=enemies.find(CampMaster.is),active=master&&!master.dead&&master.active;$('bossHud').hidden=!active;if(active){$('bossName').textContent=I18n.t('camp.rescue.boss');const danger=master.executionStarted&&!master.executionResolved;$('campExecutionWarning').hidden=!danger;if(danger){const warning=I18n.format('camp.master.execution.warning',[Math.ceil(master.executionRemaining)]);if($('campExecutionWarning').textContent!==warning)$('campExecutionWarning').textContent=warning;}$('bossHealth').style.width=Math.max(0,master.hp/master.maxHp)*100+'%';}}}
function revive(){if(HannahEncounter.respawn())return;if(FiaConflict.abort())return;const arenaAttempt=ArenaChallenge.running();SlayerDialog.cancel();if(DevImmortality.active){if(DungeonRun.respawn())return;initPlayer(Prologue.active||level===councilHall?level.start:checkpoint);projectiles=[];resetCamera();updateHUD();return;}if(Prologue.active){Prologue.lose();return;}if(DungeonRun.respawn()){toast(I18n.t('text.the.shrine.has.called.you.back.your.abilities.and'));return;}if(level===councilHall)leaveCouncilHall(true);initPlayer(checkpoint);respawnEnemies();if(!boss.dead)resetBossBattle();resetMinibosses();projectiles=[];resetCamera();updateHUD();toast(I18n.t(arenaAttempt?'arena.retry':"text.the.shrine.has.called.you.back.your.abilities.and"));}
function damage(amount=1,dir=0,blockable=false,bypassArmor=false){if(DevImmortality.active)return false;if(Prologue.active)return Prologue.hurt(amount,false,bypassArmor);if(player.inv>0||dash>0)return false;const guard=WeaponStyles.guard(weaponStyle,amount,{face:player.face,direction:dir,grounded:player.onGround,attacking:attack>0,dashing:dash>0,cooldown:player.guardCooldown,environmental:!blockable});player.guardCooldown=guard.cooldown;if(guard.blocked){amount=guard.damage;burst(player.x+20+player.face*18,player.y+30,'#e4c78a',8);tone(610,.08,'triangle',.03);if(!amount)return true;}if(!bypassArmor)amount=Armor.playerDamage(amount,momoStats().armor);amount=FiaConflict.absorb(amount);if(!amount){updateHUD();return true;}const before=player.hp;player.hp=Math.max(0,player.hp-amount);DevDamage.record('incoming',player,before,player.hp);player.inv=momoStats().invulnerability;player.vx=dir*240;player.vy=-220;shake=.22;tone(100,.22,'sawtooth',.03);burst(player.x+20,player.y+35,'#dd9480');if(!player.hp)revive();else updateHUD();return true;}
function getContext(){if(FiaConflict.blocked()||HannahEncounter.blocked())return null;
 if(Prologue.active)return null;
 const campContext=HannahEncounter.context()||DungeonRun.context()||ArenaChallenge.context()||KitsuneQuest.context()||PrisonQuest.context()||CampHerbs.context()||CampQuest.context();if(campContext)return campContext;if(CampQuest.isSide())return null;
 const shadowContext=ShadowRealm.context();if(shadowContext)return shadowContext;
 if(level===forestCamp){
  if(pointNear(level.returnPoint,100,90))return{type:'campReturn',text:I18n.t('camp.return')};
  const npc=level.npcs.find(n=>campNPCVisible(n)&&pointNear(n,95,85));
  if(npc)return{type:'campNPC',npc,text:npc.merchant?I18n.t('merchant.trade'):I18n.format('camp.talk',[I18n.t(npc.name)])};
  const rest=level.rests.find(r=>pointNear(r,90,80));
  return rest?{type:'checkpoint',rest,text:I18n.t('text.e.rest.heal.and.save')}:null;
 }
 if(level===levels[0]&&defeated[0]&&pointNear(level.campEntrance,105,90))return{type:'campEntrance',text:I18n.t('camp.enter')};
 if(level===yomi&&pointNear(yomi.slayerGrave,115,95)){const e=enemies.find(DoomSlayer.is);if(e&&!e.dead&&!e.active)return{type:'slayerGrave',enemy:e,text:I18n.t('slayer.read')};}
 if(level===yomi&&!Merchant.rescued()&&pointNear(yomi.akash,100,85))return{type:'akash',text:I18n.t('merchant.free')};
 if(level===councilHall){
  if(pointNear(level.returnPoint,130,110))return{type:'councilReturn',text:I18n.t('council.return.prompt')};
  if(pointNear(level.inscription,130,110))return{type:'councilInscription',text:I18n.t('council.inscription.prompt')};
  return null;
 }
 if(realm===1&&pointNear(level.councilGate,155,100))return{type:'councilGate',text:I18n.t(hasFlag('councilGateOpen')?'council.gate.enter':hasFlag('councilKey')?'council.gate.unlock':'council.gate.locked')};
 if(realm===2&&defeated[2]&&pointNear(level.father,110,100))return{type:'father',text:I18n.t('text.e.embrace.your.father')};
 if(realm<2&&pointNear(level.exit,115,100))return{type:'portal',text:defeated[realm]?I18n.format('message.e.travel.to.arg0.from.the.ground',[realms[realm+1].short]):I18n.t('text.e.the.guardian.s.oath.seals.the.passage')};
 const object=level.objects.find(o=>!hasFlag(o.id)&&!(o.id==='prisonKey'&&hasFlag('prisonOpen'))&&objectVisible(o)&&relicUnlocked(o)&&pointNear(o));
 if(object)return{type:object.type,object,text:object.type==='councilKey'?I18n.t('council.key.pickup'):I18n.format('message.e.arg0.arg1',[object.type==='bell'?I18n.t('text.ring'):object.type==='rescue'?I18n.t('text.free'):['relic','slayerLoot'].includes(object.type)?I18n.t('action.pick.up'):I18n.t('text.recall'),object.name])};
 if(level.ability&&pointNear(level.ability))return{type:'ability',text:'E · '+(abilities[realm]?I18n.t('text.shrine.of.memory'):level.ability.name)};
 const rest=level.rests.find(r=>pointNear(r,90,80));if(rest)return{type:'checkpoint',rest,text:I18n.t('text.e.rest.heal.and.save')};
 const weakWall=level.gates.find(g=>g.kind==='fragile'&&!gatePass(g)&&overlap({x:player.x-90,y:player.y-10,w:player.w+180,h:player.h+20},g));
 if(weakWall)return{type:'weakWall',text:I18n.t('text.j.the.cracked.rock.sounds.hollow')};
 const seal=level.gates.find(g=>g.kind==='fire'&&!gatePass(g)&&overlap({x:player.x-95,y:player.y-70,w:player.w+190,h:player.h+140},g));
 if(seal)return{type:'seal',text:I18n.t('text.j.break.the.seal.with.the.dawnblade')};return null;
}
function interact(){const c=getContext();if(!c)return;if(HannahEncounter.interact(c)||DungeonRun.interact(c)||ArenaChallenge.interact(c)||KitsuneQuest.interact(c)||PrisonQuest.interact(c)||CampHerbs.interact(c)||CampQuest.interact(c))return;if(ShadowRealm.interact(c))return;
 if(c.type==='slayerGrave'){SlayerDialog.open(c.enemy);return;}
 if(c.type==='campEntrance'){enterForestCamp();return;}
 if(c.type==='campReturn'){leaveForestCamp();return;}
 if(c.type==='akash'){Merchant.free();return;}
 if(c.type==='campNPC'&&c.npc.merchant){Merchant.open();return;}
 if(c.type==='campNPC'&&c.npc.id==='daichi'){CampQuest.talkDaichi();return;}
 if(c.type==='campNPC'){story('camp.dialogue.label',c.npc.name,c.npc.id==='sora'&&CampQuest.daisyPlaced()?'camp.npc.sora.daisy':c.npc.dialogue,null,{right:c.npc.id,speaker:c.npc.id});return;}
 if(c.type==='councilGate'){
  if(hasFlag('councilGateOpen')){enterCouncilHall();return;}
  if(!hasFlag('councilKey')){toast(I18n.t('council.gate.clue'));return;}
  flags[1]=flags[1].filter(f=>f!=='councilKey');flags[1].push('councilGateOpen');persist();
  enterCouncilHall();toast(I18n.t('council.gate.consumed'));return;
 }
 if(c.type==='councilReturn'){leaveCouncilHall();persist();toast(I18n.t('council.hall.returned'));return;}
 if(c.type==='councilInscription'){story(I18n.t('council.hall.name'),I18n.t('council.inscription.title'),I18n.t('council.inscription.story'));return;}
 if(c.type==='slayerLoot'){const o=c.object;if(hasFlag(o.id)||!relicUnlocked(o))return;flags[1].push(o.id);persist();updateHUD();burst(o.x,o.y-40,'#ecd3a0',24);story('text.a.gift.from.a.hidden.path',o.name,'inventory.description.'+o.id);return;}
 if(c.type==='councilKey'){flags[1].push('councilKey');persist();updateHUD();burst(c.object.x,c.object.y-40,'#f0dab1',24);toast(I18n.t('council.key.acquired'));return;}
 if(c.type==='checkpoint'){checkpoint={...c.rest};player.hp=player.maxHp;respawnEnemies();if(!boss.dead)resetBossBattle();if(!visitedRests[realm].includes(c.rest.id))visitedRests[realm].push(c.rest.id);persist();updateHUD();burst(c.rest.x,c.rest.y-35,realms[realm].gold,18);toast(I18n.t("text.health.restored.enemies.have.respawned.u.train"));tone(440,.3);}
 if(c.type==='relic'){const o=c.object;if(hasFlag(o.id)||!relicUnlocked(o))return;flags[realm].push(o.id);persist();updateHUD();burst(o.x,o.y-55,o.id==='angelHalo'?'#ffe29a':'#d58cf3',28);story(I18n.t("text.ancient.relic"),o.name,o.id==='angelHalo'?I18n.t("text.the.broken.halo.s.faint.light.curls.around.the"):I18n.t("text.the.horn.feels.cold.yet.embers.pulse.within.it"));}
 if(c.type==='ability'){if(!abilities[realm]){abilities[realm]=true;persist();updateHUD();story(I18n.t("text.new.ability"),level.ability.name,realm===0?I18n.t("story.space.jump.release.it.and.press.it.again.in"):I18n.t("story.k.spirit.dash.you.are.briefly.invulnerable.and.can"));}else story(I18n.t("text.haru.s.memory"),I18n.t("text.we.always.find.our.way.home"),I18n.t("text.if.you.lose.your.way.seek.the.shrines.light"));}
 if(['bell','rescue','memory'].includes(c.type)){const o=c.object;if(o.group&&enemies.some(e=>e.group===o.group&&!e.dead)){toast(I18n.t("text.the.soul.s.captors.are.still.alive.defeat.them"));return;}flags[realm].push(o.id);shards+=o.type==='memory'?8:5;if(o.type==='memory')player.hp=player.maxHp;persist();updateHUD();burst(o.x,o.y-70,realms[realm].gold,28);tone(660,.6);const text=o.type==='bell'?(hasFlag('forestBell')&&hasFlag('villageBell')?I18n.t("text.the.two.bells.ring.together.the.bamboo.temple.s"): I18n.t("text.the.bell.echoes.through.the.forest.another.may.answer")):o.type==='rescue'?(hasFlag('soulUpper')&&hasFlag('soulLower')?I18n.t("text.the.two.freed.souls.have.broken.the.abyss.seal"):I18n.t("text.the.soul.thanks.you.the.other.captive.awaits.deeper")):I18n.t("text.an.old.memory.of.haru.warms.the.amulet.you");story(o.type==='memory'?I18n.t("text.a.gift.from.a.hidden.path"):I18n.t("text.the.path.answers"),o.name,text);}
 if(c.type==='portal'){if(!defeated[realm])toast(I18n.t("text.the.guardian.s.oath.seals.this.passage"));else{const n=realm+1;enterRealm(n);persist();story(realms[n].label,realms[n].name,realms[n].intro);}}
 if(c.type==='father')ShadowRealm.enter();}

function gatePass(g){if(g.requiresDawnblade)return defeated[1]&&hasFlag(g.id);if(g.kind==='prison')return hasFlag('prisonOpen');if(g.kind==='council')return hasFlag('councilGateOpen');if(g.kind==='secretRock')return false;if(g.kind==='fragile')return hasFlag(g.id);if(g.kind==='shadow'&&g.requiresDash)return dash>0;if(defeated[realm])return true;if(g.kind==='root')return false;if(g.kind==='bells')return hasFlag('forestBell')&&hasFlag('villageBell');if(g.kind==='souls')return hasFlag('soulUpper')&&hasFlag('soulLower');if(g.kind==='shadow')return dash>0;return hasFlag(g.id);}
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
 const text=realm===3?I18n.t('shadow.objective.search'):realm===0?I18n.t('story.haru.s.first.memory.returns.the.glowing.torii.has'):realm===1?I18n.t('story.haru.s.second.memory.has.set.momo.s.sword'):I18n.t('text.the.final.guardian.bows.a.new.wind.stream.shines');
 const body=()=>(relicUnited?I18n.t('relic.eclipse.dialog.body')+'\n\n'+I18n.t(text):I18n.t(text)+(keyEarned?'\n\n'+I18n.t('council.key.dropped'):''))+(firstReward?'\n\n'+I18n.format('boss.reward.summary',[reward.xp,reward.points,I18n.t('item.'+reward.id)]):'');
 story(I18n.t(relicUnited?'relic.eclipse.dialog.label':'text.a.soul.fragment.returns.home'),relicUnited?I18n.t('relic.eclipse.name'):realm===3?I18n.t('shadow.boss.priest'):realm===0?I18n.t('text.the.bells.call.you.home'):realm===1?I18n.t('text.the.dawnblade.awakens'):I18n.t('text.the.last.wind'),body);
}
function playerAttackProfile(kind=attackKind){return WeaponStyles.attack(weaponStyle,SWORD_ATTACKS[kind]);}
function playerAttackDamage(kind=attackKind){return momoStats().damage*playerAttackProfile(kind).damageScale;}
function melee(kind='normal'){if(Dawnblade.casting()||HannahEncounter.locked()||player.stun>0)return false;if(!Object.hasOwn(SWORD_ATTACKS,kind)||attackCooldown>0)return false;const profile=playerAttackProfile(kind);attackKind=kind;attack=profile.duration;attackCooldown=profile.cooldown;attackElapsed=0;attackFace=player.face;attackHit=false;DevLog.action(kind==='heavy'?'heavyAttack':'attack');tone(kind==='heavy'?180:defeated[1]?430:300,.1,'triangle',.025);return true;}
function advanceSwordAttack(dt){if(attack<=0)return;const profile=playerAttackProfile();attackElapsed=Math.min(profile.duration,attackElapsed+dt);if(!attackHit&&attackElapsed>=profile.impact){attackHit=true;shake=attackKind==='heavy'?.08:.04;resolveMeleeHit();}}
function resolveMeleeHit(options={}){const kind=options.kind??attackKind,damage=options.amount??playerAttackDamage(),hit=options.hit??WeaponStyles.hitbox(weaponStyle,player,attackFace);if(Prologue.active){Prologue.hit(damage,hit);return;}if(FiaConflict.provoke(hit))return;for(const e of enemies){if(e.dead||!overlap(hit,e))continue;if(HannahCombat.is(e)){HannahCombat.hit(e,hit,damage);if(state!=='play')return;continue;}if(FiaCombat.is(e)){FiaCombat.hit(e,hit,damage,kind);continue;}if(DoomSlayer.is(e)){if(DoomSlayer.hit(e,hit,damage,kind)>0)burst(e.x+e.w/2,e.y+30,realms[realm].gold);continue;}if(DungeonCombat.is(e)){DungeonCombat.hit(e,hit,damage,kind);continue;}if(ArenaCombat.is(e)){ArenaCombat.hit(e,hit,damage,kind);continue;}if(e.miniboss){if(!e.active||e.inv>0)continue;const before=e.hp;e.hp-=damage;DevDamage.record('outgoing',e,before,e.hp);e.inv=.22;burst(e.x+e.w/2,e.y+30,realms[realm].gold);if(e.hp<=0)killEnemy(e);continue;}const front=Math.sign(player.x+player.w/2-e.x-e.w/2)===e.face,above=player.y+player.h<e.y+e.h*.55;
 if(e.kind==='shield'&&front&&!above&&dash<=0&&e.guardBreak<=0&&e.recovery<=0){e.blocks++;e.blockFlash=.3;burst(e.x+e.w/2+e.face*24,e.y+30,'#eee0ad',9);tone(610,.08,'triangle',.03);if(e.blocks>=3){e.blocks=0;e.guardBreak=1.6;e.recovery=1.6;e.windup=0;toast(I18n.t("text.the.shield.is.broken.strike.now.or.get.behind"));}continue;}
 const before=e.hp;e.hp-=damage;DevDamage.record('outgoing',e,before,e.hp);e.stun=.35;e.windup=0;e.guardBreak=Math.max(e.guardBreak,dash>0?.7:0);e.x=clamp(e.x+attackFace*18,e.origin-e.patrol,e.origin+e.patrol);burst(e.x+20,e.y+20,realms[realm].gold);if(e.hp<=0)killEnemy(e);}
 if(bossStarted&&!boss.dead&&overlap(hit,boss))hitBoss(damage,kind);
 for(const g of level.gates)if(g.kind==='fragile'&&!gatePass(g)&&overlap(hit,g)){flags[realm].push(g.id);persist();burst(g.x+g.w/2,player.y+35,'#b4a99b',32);toast(I18n.t("text.cold.air.flows.from.behind.the.rock.wall"));}
 if(defeated[1])for(const g of level.gates){if(g.kind==='fire'&&!gatePass(g)&&overlap(hit,g)){flags[realm].push(g.id);persist();burst(player.x+20,player.y-10,'#f3d494',30);toast(I18n.t("text.the.dawnblade.has.broken.the.seal"));updateHUD();}}
 for(const p of projectiles)if(overlap(hit,{x:p.x-7,y:p.y-7,w:14,h:14}))p.life=0;}
function input(dt){if(HannahEncounter.locked()&&!Dawnblade.casting()){player.vx=0;jumpBuffer=0;if(Bindings.has('ultimate',pressed))Dawnblade.activate();return;}if(Dawnblade.casting()){player.vx=0;jumpBuffer=0;return;}if(player.stun>0){player.vx=0;jumpBuffer=0;return;}const move=(Bindings.has('moveRight',keys)?1:0)-(Bindings.has('moveLeft',keys)?1:0);if(move)player.face=move;
 if(Bindings.has('ultimate',pressed)&&Dawnblade.activate())return;
 if(Bindings.has('jump',pressed))jumpBuffer=.13;
 const support=platforms.find(p=>p.id===player.support);
 if(jumpBuffer>0&&Bindings.has('drop',keys)&&player.onGround&&support?.drop){DevLog.action('drop');dropTimer=.22;player.y+=8;player.vy=100;player.onGround=false;player.support=null;player.jumps=1;jumpBuffer=0;coyote=0;}
 const grounded=player.onGround||coyote>0;if(jumpBuffer>0&&(grounded||(abilities[0]&&player.jumps<2))){const airJump=!grounded;DevLog.action('jump');player.vy=airJump?-650:-590;player.jumps=airJump?2:1;player.onGround=false;player.support=null;coyote=0;jumpBuffer=0;burst(player.x+20,player.y+69,airJump?'#f0df9c':'#d8e3c9',airJump?16:7);tone(airJump?550:380,.12);samuraiObserveJump();}
 if(Bindings.has('useMeat',pressed)&&Merchant.useQuick())DevLog.action('useMeat');if(Bindings.has('heavyAttack',pressed))melee('heavy');else if(Bindings.has('attack',pressed))melee();if(Bindings.has('dash',pressed)&&abilities[1]&&dashCooldown<=0){DevLog.action('dash');dash=.2;dashCooldown=momoStats().dashCooldown;player.vy=0;dashTrailClock=.035;emitDashWisp();tone(180,.2,'triangle',.035);}if(Bindings.has('interact',pressed)){if(context)DevLog.action('interact');interact();}if(Bindings.has('train',pressed))showTraining();const target=FiaCombat.modifyMovement(move*285,dt);player.vx=dash>0?player.face*1100:player.vx+(target-player.vx)*Math.min(1,dt*13);}
function movingPlatforms(dt){levelTime+=dt;for(const p of platforms){const oldX=p.x;if(p.kind==='moving')p.x=p.baseX+Math.sin(levelTime*p.speed+p.phase)*p.range;p.dx=p.x-oldX;if(player.onGround&&player.support===p.id)player.x+=p.dx;}}
function movePlayer(dt){const before={x:player.x,y:player.y},wasGround=player.onGround;player.x=clamp(player.x+player.vx*dt,0,level.width-player.w);
 for(const g of level.gates){if(gatePass(g)||!overlap(player,g))continue;if(before.x+player.w<=g.x+1){player.x=g.x-player.w;player.vx=0;}else if(before.x>=g.x+g.w-1){player.x=g.x+g.w;player.vx=0;}else if(g.kind==='shadow'){player.x=player.x+player.w/2<g.x+g.w/2?g.x-player.w:g.x+g.w;player.vx=0;}}
 player.vy=Math.min(980,player.vy+(dash>0?0:1550*dt));if(!player.onGround&&dash<=0)for(const w of level.winds){if(w.afterBoss&&!defeated[realm])continue;if(overlap(player,w)){player.vy=Math.min(player.vy,-430);player.inv=Math.max(player.inv,.03);}}
 player.y+=player.vy*dt;player.onGround=false;player.support=null;
 for(const p of platforms){if(p.broken||dropTimer>0&&p.drop)continue;if(player.x+player.w>p.x&&player.x<p.x+p.w&&player.vy>=0&&before.y+player.h<=p.y+3&&player.y+player.h>=p.y){player.y=p.y-player.h;player.vy=0;player.onGround=true;player.jumps=0;player.support=p.id;}}
 for(const g of level.gates){if(gatePass(g)||!overlap(player,g))continue;if(player.vy>=0&&before.y+player.h<=g.y+3){player.y=g.y-player.h;player.vy=0;player.onGround=true;player.jumps=0;player.support='gate:'+g.id;}else if(player.vy<0&&before.y>=g.y+g.h-3){player.y=g.y+g.h;player.vy=0;}else{player.x=before.x;}}
 if(wasGround&&!player.onGround&&player.vy>=0)coyote=.1;if(player.y>level.height+180){if(!DevImmortality.active&&!Prologue.active)DevLog.damage('incoming',player,player.hp,0);revive();}}
function shoot(x,y,vx,vy,color,life=4,kind='orb'){const p={x,y,vx,vy,color,life,kind};DevLog.stampProjectile(p);projectiles.push(p);}

// Shared player clocks belong to the outer loop, before any realm dispatch.
function updatePlayerTimers(dt){
 FiaConflict.update(dt);Dawnblade.update(dt);
 player.guardCooldown=Math.max(0,(player.guardCooldown||0)-dt);attack=Math.max(0,attack-dt);attackCooldown=Math.max(0,attackCooldown-dt);dash=Math.max(0,dash-dt);dashCooldown=Math.max(0,dashCooldown-dt);
 jumpBuffer=Math.max(0,jumpBuffer-dt);coyote=Math.max(0,coyote-dt);dropTimer=Math.max(0,dropTimer-dt);player.inv=Math.max(0,player.inv-dt);player.stun=Math.max(0,(player.stun||0)-dt);shake=Math.max(0,shake-dt);
}
function update(dt){if(typeof DuelMode!=='undefined'&&DuelMode.active){DuelMode.update(dt,resolutionBlocked);return;}if(resolutionBlocked){keys.clear();pressed.clear();return;}if(state==='play'&&weaponChoicePending&&!DevSession.active){WeaponSelection.open();return;}toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('visible');if(state!=='play'){if(state==='menu'||state==='help'&&helpOrigin==='menu')time+=dt;return;}DevDamage.update(dt);LevelUpEffect.update(dt);BackgroundMotion.update(dt);time+=dt;player.animationTime+=dt;updatePlayerTimers(dt);if(state!=='play'){pressed.clear();return;}if(Prologue.active){DevLog.scope(boss,()=>Prologue.update(dt));pressed.clear();return;}HannahEncounter.update(dt);movingPlatforms(dt);input(dt);if(state!=='play'){pressed.clear();return;}const stepPlayer=player;movePlayer(dt);HannahCombat.enforceBounds();if(player!==stepPlayer||state!=='play'){pressed.clear();return;}Merchant.update(dt);KitsuneQuest.update(dt);ArenaChallenge.update(dt);DungeonRun.update(dt);dashTrailClock-=dt;if(dash>0&&dashTrailClock<=0){emitDashWisp();dashTrailClock=.035;}discoverSecrets();advanceSwordAttack(dt);if(state!=='play'){pressed.clear();return;}updateEnemies(dt);if(player!==stepPlayer||state!=='play'){pressed.clear();return;}
 const slayerVictory=enemies.find(e=>DoomSlayer.is(e)&&e.victoryPending);if(slayerVictory){slayerVictory.victoryPending=false;story('text.a.gift.from.a.hidden.path','slayer.name','slayer.victory');pressed.clear();return;}
 for(const h of level.hazards)if(overlap(player,h))damage(1,player.vx>=0?-1:1);
 const a=level.arena;if(!boss.dead&&player.x+player.w>(a.triggerX??a.x)&&player.x<a.x+a.w&&Math.abs(player.y+player.h-a.y)<160){bossStarted=true;if(!visits.has('boss')){visits.add('boss');checkpoint={...level.rests.find(r=>r.id===a.restId)};if(!visitedRests[realm].includes(checkpoint.id))visitedRests[realm].push(checkpoint.id);persist();toast(realm===3?I18n.t('shadow.bell.warning'):realm===0?I18n.t("text.raised.sword.dodge.the.guardian.is.vulnerable.after.the"):realm===1?I18n.t("text.watch.for.cracks.in.the.ground.when.lava.rises"):I18n.t("text.gold.signals.light.arrows.violet.signals.shadow.magic.keep"));}}
 DevLog.scope(boss,()=>updateBoss(dt));for(const p of projectiles){p.life-=dt;if(p.kind==='arrow')p.vy+=55*dt;if(p.gravity)p.vy+=p.gravity*dt;const beforeX=p.x,beforeY=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;const radius=p.radius||7;const swept={x:Math.min(beforeX,p.x)-radius,y:Math.min(beforeY,p.y)-radius,w:Math.abs(p.x-beforeX)+radius*2,h:Math.abs(p.y-beforeY)+radius*2};if(DungeonRun.projectile(p,swept)){p.life=0;continue;}if(p.life>0&&overlap(player,swept)){const victim=player,hp=victim.hp;DevLog.projectile(p,()=>damage(p.damage||1,p.vx>0?1:-1,true));FiaCombat.impact(p,victim,hp);p.life=0;if(player!==victim||state!=='play'){pressed.clear();return;}}}projectiles=projectiles.filter(p=>p.life>0);
 for(const p of particles){p.life-=dt;if(p.kind==='fiaSpark')continue;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.kind!=='dashWisp')p.vy+=500*dt;}particles=particles.filter(p=>p.life>0);
 for(const r of level.rests)if(pointNear(r,105,85)&&!visitedRests[realm].includes(r.id)){visitedRests[realm].push(r.id);checkpoint={...r};persist();toast(I18n.t("text.new.shrine")+I18n.t(r.name)+(realm===3&&!DevSession.active&&!hasFlag('shadowAltar')?' · '+I18n.t('shadow.travel.locked'):I18n.t("text.fast.travel.here.from.the.map")));}
 if(!HannahEncounter.cinematic()){camera+=(clamp(player.x-viewW*.43,0,Math.max(0,level.width-viewW))-camera)*Math.min(1,dt*6);cameraY+=(clamp(player.y-H*.54,level.top??0,Math.max(0,level.height-H))-cameraY)*Math.min(1,dt*8);}
 context=getContext();$('prompt').hidden=!context;if(context)$('prompt').textContent=keyedInstruction(I18n.t(context.text));const region=(level.secrets||[]).find(z=>overlap(player,z))||level.zones.find(z=>overlap(player,z));$('areaLabel').textContent=I18n.t(region?.name||realms[realm].name)+(realm===1?' · '+Math.max(0,Math.round((player.y+69-450)/10))+I18n.t("text.m.deep"):realm===2?' · '+Math.max(0,Math.round((6300-player.y-69)/10))+I18n.t("text.m.high"):'');updateHUD();
 if(sound){musicClock-=dt;if(musicClock<=0){const notes=[220,261.63,293.66,329.63,392];tone(notes[Math.floor(time*.3)%5]*(realm===2?2:1),1.8,'sine',.02);musicClock=1.6;}}pressed.clear();}
function draw(){Cursor.update();if(typeof DuelMode!=='undefined'&&DuelMode.draw())return;BackgroundMotion.beginFrame();ctx.save();ctx.clearRect(0,0,viewW,H);if(Prologue.active){Prologue.draw();ctx.restore();return;}const r=realms[realm];background(r);if(state==='menu'||state==='help'&&helpOrigin==='menu'||DevTools.menuBackground){ctx.save();ctx.translate(-500,-400);drawLandscape(r,levels[0].platforms);ctx.restore();drawTorii(Math.min(viewW*.8,1180),600,r);drawMenuMomo(Math.min(viewW*.68,880),616,Math.min(180,Math.max(100,viewW*.28)));ctx.restore();return;}
 if(level===councilHall){
  ctx.save();ctx.translate(-camera,-cameraY);drawKibaCurrent();DungeonArt.scenery();Visuals.councilGate({...level.returnPoint,w:250,h:250},true);
  drawParticles();drawLevelUp();drawPlayer();DevDamage.draw();ctx.restore();ctx.restore();return;
 }
 if(level===forestCamp){
  ctx.save();ctx.translate(-camera,-cameraY);Visuals.campScenery();CampArt.scenery();drawShrine(level.rests[0].x,level.rests[0].y,r,false);Visuals.campPathMarker(level.returnPoint,I18n.t(realms[0].short));drawParticles();drawLevelUp();drawPlayer();DevDamage.draw();ctx.restore();ctx.restore();return;
 }
 ctx.save();ctx.translate(-camera,-cameraY);if(!CampQuest.isSide())Visuals.secretScenery(r);PrisonArt.scenery();KitsuneArt.scenery();ArenaArt.scenery();DungeonArt.scenery();CampArt.scenery();HannahArt.scenery();if(level===levels[0])Prologue.village();drawWinds(r);drawLandscape(r,platforms);CampHerbs.draw();drawKibaCurrent();for(const rest of level.rests)if(visiblePoint(rest)&&!(realm===3&&rest.id==='altar'))drawShrine(rest.x,rest.y,r,false);if(level.ability&&visiblePoint(level.ability))drawShrine(level.ability.x,level.ability.y,r,true);if(level.exit&&visiblePoint(level.exit))drawTorii(level.exit.x,level.exit.y,r);drawGates(r);if(level===levels[0]&&defeated[0])Visuals.campPathMarker(level.campEntrance,I18n.t('camp.name'));drawObjects(r);drawHazards(r);drawLevelUp();Visuals.bossEffects(r);
 for(const e of enemies)if(!e.dead&&visiblePoint({x:e.x,y:e.y},190))drawEnemy(e,r);if(visiblePoint({x:boss.x,y:boss.y},200)){if(!boss.dead)drawBoss(r);else drawSpirit(boss.x+45,boss.y+60,r.gold);}
 if(realm===2&&boss.dead&&visiblePoint(level.father)){HannahArt.haru(level.father.x,level.father.y+4,110,1);HannahArt.nameplate(level.father.x,level.father.y+4,110,'HARU');}
 for(const p of projectiles)if(!SerpentArt.projectile(p))Visuals.projectile(p);
 drawParticles();
 drawPlayer();DevDamage.draw();ctx.restore();const v=ctx.createLinearGradient(0,0,0,H);v.addColorStop(0,'#08121945');v.addColorStop(.3,'#08121900');v.addColorStop(.75,'#08121900');v.addColorStop(1,'#08121988');ctx.fillStyle=v;ctx.fillRect(0,0,viewW,H);ctx.restore();}
function drawLevelUp(){if(LevelUpEffect.remaining>0)Visuals.levelUp(player.x+player.w/2,player.y+player.h+1,LevelUpEffect.progress,reducedMotion.matches);}
function drawParticles(){for(const p of particles){if(FiaArt.particle(p))continue;if(p.kind==='dashWisp'){ctx.globalAlpha=1;Visuals.dashTrail(p.x,p.y,p.face,1-p.life/p.maxLife);continue;}ctx.globalAlpha=clamp(p.life*2,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);}ctx.globalAlpha=1;}
function visiblePoint(p,margin=280){return p.x>camera-margin&&p.x<camera+viewW+margin&&p.y>cameraY-margin&&p.y<cameraY+H+margin;}
function drawKibaCurrent(){const weak=realm===0&&player.y>1150;ctx.save();ctx.lineWidth=realm===1?2:1.5;ctx.strokeStyle=realm===1?'#c872b8':realm===2?'#e8d89b':'#addbb5';for(let i=0;i<(weak?7:22);i++){const x=camera+noise(i*14.7+realm)*viewW+Math.sin(time*.7+i)*18,y=cameraY+noise(i*29.3+realm*17)*H;ctx.globalAlpha=(weak?.14:.24)+Math.sin(time*2+i)*.08;ctx.beginPath();ctx.moveTo(x,y);if(realm===1){ctx.lineTo(x+8,y-9);ctx.lineTo(x+2,y-18);}else{ctx.quadraticCurveTo(x+8+Math.sin(time+i)*5,y-12,x+6,y-26);}ctx.stroke();}ctx.restore();}
function background(r){if(HannahArt.backdrop())return;if(DungeonArt.backdrop()||ArenaArt.backdrop())return;if(KitsuneQuest.den())KitsuneArt.backdrop();else if(PrisonQuest.active()){
 const depths=Visuals.images.fiaPrisonDepths,opaqueDepths=cameraY>=1700&&depths?.complete&&depths.naturalWidth>0;
 // Keep the underlay below the hunter painting, but do not pin its animation
 // cache once the opaque foreground owns the scene. It may not cover the floor.
 PrisonArt.backdrop(!opaqueDepths);KitsuneArt.depthsBackdrop();
}else if(CampQuest.isSide())CampArt.backdrop();else if(level===forestCamp)Visuals.campBackdrop();else if(level===councilHall)Visuals.councilBackdrop();else Visuals.backdrop(r);}

function drawLandscape(r,items){if(!level.service)Visuals.terrain(r,items);}

function drawWinds(r){Visuals.winds(r);}
function drawGates(r){Visuals.gates(r);}

function drawObjects(r){Visuals.objects(r);}

function drawHazards(r){Visuals.hazards(r);}


function realmUnlocked(n){return Number.isInteger(n)&&n>=0&&n<levels.length&&(n===0||defeated[n-1])&&(n!==3||flags[2].includes('shadowEntered'));}
function travelSide(rest,n){return Object.entries(SIDE_LOCATIONS).find(([,spec])=>spec.realm===n&&spec.map.rests.some(point=>point.id===rest?.id));}
function travelScope(rest,n){
 const side=travelSide(rest,n),map=side?.[1].map;
 return !map?.dungeon||realm===n&&DungeonRun.active()&&level.dungeon.id===map.dungeon.id;
}
// The map and executor share one eligibility rule. Test sessions bypass only
// travel locks, without granting abilities, boss victories or quest flags.
function travelDestination(rest,targetRealm=realm){
 if(!Number.isInteger(targetRealm)||targetRealm<0||targetRealm>=levels.length)return null;
 const destination=realmRests(targetRealm).find(r=>r.id===rest?.id);
 if(!destination||destination.checkpointOnly||!travelScope(destination,targetRealm))return null;
 const side=travelSide(destination,targetRealm)?.[0];if(side&&!DevSession.active&&!sideLocationUnlocked(side,flags,defeated))return null;
 const entrance=!!destination.travelOnly;
 if(!DevSession.active&&entrance&&(!defeated[targetRealm]||!flags[targetRealm].includes(destination.unlockFlag)))return null;
 if(!DevSession.active&&(destination===CULT_TRAVEL||side&&SIDE_LOCATIONS[side].map.dungeon?.id==='sectFall')&&!abilities[1])return null;
 if(!DevSession.active&&(!realmUnlocked(targetRealm)||!entrance&&!visitedRests[targetRealm].includes(destination.id)||!ShadowRealm.travelAllowed(realm,targetRealm)))return null;
 return destination;
}
function fastTravel(rest,targetRealm=realm){if(FiaConflict.blocked())return false;
 if(Prologue.active||!['play','map'].includes(state))return false;
 const destination=travelDestination(rest,targetRealm);
 if(!destination)return false;
 const side=travelSide(destination,targetRealm)?.[0];
 if(destination===COUNCIL_TRAVEL){
  const hp=player.hp,rest=levels[1].rests.findLast(point=>visitedRests[1].includes(point.id))||levels[1].rests[0];
  KitsuneQuest.leaveFor(levels[1]);enterRealm(1,rest);
  if(!enterCouncilHall())return false;
  initPlayer(councilHall.memoryScroll);player.hp=Math.min(hp,player.maxHp);resetCamera();
 }else if(destination===CULT_TRAVEL){
  const hp=player.hp,rest=japan.rests.findLast(point=>visitedRests[0].includes(point.id))||japan.rests[0];
  KitsuneQuest.leaveFor(japan);enterRealm(0,rest);initPlayer(japan.cultPassage.ruinedGate);player.hp=Math.min(hp,player.maxHp);resetCamera();
 }else if(side){if(!CampQuest.enter(side,{point:destination,save:false,atShrine:true}))return false;}else{KitsuneQuest.leaveFor(levels[targetRealm]);enterRealm(targetRealm,destination);}
 $('map').hidden=true;state='play';keys.clear();pressed.clear();persist();updateHUD();toast(I18n.t('text.light.path')+I18n.t(destination.name));return true;
}
function travelGrid(n){
 const grid=document.createElement('div');grid.className='travel-grid';
 for(const rest of realmRests(n).filter(rest=>!rest.checkpointOnly)){
  const side=travelSide(rest,n);if(!travelScope(rest,n))continue;
  if(!DevSession.active&&(side&&!sideLocationUnlocked(side[0],flags,defeated)||rest.travelOnly&&!flags[n].includes(rest.unlockFlag)))continue;
  const discovered=DevSession.active||rest.travelOnly||visitedRests[n].includes(rest.id),button=document.createElement('button'),name=side?I18n.t(side[1].map.name||'camp.name')+' · '+I18n.t(rest.name):I18n.t(rest.name);
  const dungeon=rest.dungeonEntrance===true;
  button.type='button';button.textContent=(dungeon?'':discovered?'⛩ ':'· ')+name;button.disabled=!travelDestination(rest,n);
  if(dungeon){button.setAttribute('data-travel-kind','dungeon');button.setAttribute('data-type-label',I18n.t('travel.dungeonEntrance'));}
  button.setAttribute('data-realm',String(n));button.setAttribute('data-rest',rest.id);
  button.setAttribute('aria-label',(dungeon?I18n.t('travel.dungeonEntrance')+' · ':'')+I18n.format('travel.destination',[I18n.t(realms[n].short),name]));
  button.onclick=()=>fastTravel(rest,n);grid.append(button);
 }
 return grid;
}
function showMap(){if(state!=='play'||Prologue.active||HannahEncounter.blocked())return;const inside=level===councilHall,inCamp=level===forestCamp,mapLevel=CampQuest.locationId()?level:levels[realm],mapPlatforms=inside?mapLevel.platforms:platforms,mapPlayer=inside?mapLevel.councilGate:{x:player.x+21,y:player.y+69};state='map';keys.clear();pressed.clear();$('mapContent').replaceChildren();const box=document.createElement('div');box.className='world-map';const width=620,height=320,pad=16,worldTop=mapLevel.mapTop??mapLevel.top??0,worldHeight=mapLevel.height-worldTop,s=Math.min((width-pad*2)/mapLevel.width,(height-pad*2)/worldHeight),ox=(width-mapLevel.width*s)/2,oy=(height-worldHeight*s)/2;const X=x=>ox+x*s,Y=y=>oy+(y-worldTop)*s;
 let svg=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${I18n.t(inCamp?'camp.name':realms[realm].name)}"><rect x="${ox}" y="${oy}" width="${mapLevel.width*s}" height="${worldHeight*s}" fill="#0b1920" stroke="#60706a" stroke-width="1"/>`;for(const p of mapPlatforms.filter(p=>!p.unmapped&&(!p.secretArea||secretKnown(p.secretArea))))svg+=`<line x1="${X(p.x)}" y1="${Y(p.y)}" x2="${X(p.x+p.w)}" y2="${Y(p.y)}" stroke="#9da68e" stroke-width="2"/>`;for(const w of mapLevel.winds)if(!w.afterBoss||defeated[realm])svg+=`<rect x="${X(w.x)}" y="${Y(w.y)}" width="${Math.max(3,w.w*s)}" height="${w.h*s}" fill="#dfc68844"/>`;for(const o of mapLevel.objects.filter(o=>!o.unmapped&&objectVisible(o)&&(!o.secretArea||secretKnown(o.secretArea)&&relicUnlocked(o))))svg+=`<circle cx="${X(o.x)}" cy="${Y(o.y)}" r="3" fill="${hasFlag(o.id)?'#718679':'#dfba76'}"/>`;if(mapLevel.ability)svg+=`<text x="${X(mapLevel.ability.x)-4}" y="${Y(mapLevel.ability.y)-5}" fill="#f4cf8a" font-size="12">✦</text>`;if(!inCamp&&!CampQuest.isSide())svg+=`<text x="${X(mapLevel.boss.x)-4}" y="${Y(mapLevel.boss.y)-6}" fill="${defeated[realm]?'#718679':'#d98877'}" font-size="12">◆</text>`;
 for(const r of mapLevel.rests)svg+=`<circle cx="${X(r.x)}" cy="${Y(r.y)}" r="3" fill="${travelDestination(r,realm)?'#a6c9c5':'#465959'}"/>`;svg+=`<circle cx="${X(mapPlayer.x)}" cy="${Y(mapPlayer.y)}" r="5" fill="#f0dfb1" stroke="#fff" stroke-width="1"/></svg>`;box.innerHTML=I18n.t(svg);$('mapContent').append(box);
 const label=document.createElement('p');label.className='travel-label';label.textContent=I18n.t((inCamp?I18n.t('camp.name'):realms[realm].name)+I18n.t("text.light.paths.to.discovered.shrines"));if(!DevSession.active&&!ShadowRealm.travelAllowed(realm,realm))label.textContent=I18n.t('shadow.travel.locked');$('mapContent').append(label);$('mapContent').append(travelGrid(realm));const otherRealms=levels.map((_,n)=>n).filter(n=>n!==realm&&realmRests(n).some(rest=>travelDestination(rest,n)));if(otherRealms.length){const section=document.createElement('section');section.className='realm-travel';const heading=document.createElement('h3');heading.textContent=I18n.t('travel.worlds.title');section.append(heading);for(const n of otherRealms){const name=document.createElement('h4');name.textContent=I18n.t(realms[n].name);section.append(name,travelGrid(n));}$('mapContent').append(section);}$('map').hidden=false;$('closeMap').focus();}
function closeMap(){$('map').hidden=true;state='play';pressed.clear();}
function pause(){if(state==='play'){state='pause';keys.clear();$('pause').hidden=false;$('resumeButton').focus();}else if(state==='pause'){state='play';$('pause').hidden=true;pressed.clear();}}
function mainMenu(){if(typeof DuelMode!=='undefined'&&DuelMode.active){DuelMode.leave();return;}HannahEncounter.clear();Dawnblade.resetPlayer();FiaConflict.abort();DungeonRun.cancel();SerpentArt.resetBackdrop();CampWorkshop.cancel();WeaponSelection.cancel();Dialogue.cancel();LevelUpEffect.clear();Merchant.resetTea();SlayerDialog.cancel();DoomSlayer.clear();if(DevSession.active){DevSession.end();return;}if(state==='developer')DevTools.close();if(state==='inventory')Inventory.close();if(state==='shop')Merchant.close();Prologue.stop();state='menu';realm=0;level=levels[0];camera=500;cameraY=400;for(const id of ['dialog','map','pause','training','help','inventory','shop','campService','dungeonMenu','prompt','bossHud'])$(id).hidden=true;$('menu').hidden=false;showHUD(false);keys.clear();$('continueButton').hidden=!saved;}
$('startButton').onclick=()=>startGame(false);WeaponSelection.init();CampWorkshop.init();$('continueButton').onclick=()=>startGame(true);$('pauseButton').onclick=pause;$('resumeButton').onclick=pause;$('mainMenuButton').onclick=mainMenu;$('mapButton').onclick=showMap;$('closeMap').onclick=closeMap;
$('helpButton').onclick=()=>showHelp('menu');$('pauseHelpButton').onclick=()=>showHelp('pause');$('closeHelp').onclick=closeHelp;
$('soundButton').onclick=()=>{sound=!sound;$('soundButton').textContent=I18n.t(sound?I18n.t("text.sound.on"):I18n.t("text.sound.off"));if(sound){tone(440,.2);audio?.resume();}};
let helpOrigin='menu',captureAction=null,suppressedMouseClick=null;
function bindingKeyLabel(key){
 if(/^mouse[0-4]$/.test(key))return I18n.t('binding.key.'+key);
 const symbols={'arrowleft':'←','arrowright':'→','arrowup':'↑','arrowdown':'↓'};
 return symbols[key]||I18n.t('binding.key.'+({' ':'space',shift:'shift',escape:'escape',enter:'enter',backspace:'backspace'}[key]||key))?.replace(/^binding\.key\./,'').toUpperCase();
}
function keyedInstruction(text){
 // Unicode letters/marks stay part of prose; only standalone control tokens are substituted.
 const action={E:'interact',J:'attack',K:'dash',U:'train',Space:'jump'};
 return text.replace(/(?<![\p{L}\p{M}\p{N}_])(?:E|J|K|U|Space)(?![\p{L}\p{M}\p{N}_])/gu,token=>bindingKeyLabel(Bindings.read(action[token])[0]));
}
function renderBindingHints(){
 for(const node of document.querySelectorAll('[data-binding]'))node.textContent=bindingKeyLabel(Bindings.read(node.dataset.binding)[0]);
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
 $('helpFightBody').textContent+=' '+I18n.t('help.pointerLock');
 if(Dawnblade.owned())$('helpFightBody').textContent+=' '+I18n.format('help.dawnblade',[bindingKeyLabel(Bindings.read('ultimate')[0])]);
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
$('exportBindings').onclick=()=>{const blob=new Blob([JSON.stringify(Bindings.exportData(),null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='kiba-realms-keybindings.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);};
$('importBindings').onclick=()=>$('bindingFile').click();
$('bindingFile').onchange=async event=>{const file=event.target.files?.[0];if(!file)return;let valid=false;try{valid=Bindings.importData(JSON.parse(await file.text()));}catch{}event.target.value='';captureAction=null;renderHelp();$('bindingMessage').textContent=I18n.t(valid?'help.bindings.import.done':'help.bindings.import.error');};
function keyName(e){return Bindings.normalize(e.code==='Space'?' ':e.key);}
function finishBindingCapture(key){
 const action=captureAction;if(!action)return;
 const result=Bindings.setPrimary(action,key);captureAction=null;renderHelp();
 $('bindingMessage').textContent=I18n.t(result.ok?'help.bindings.saved':'help.bindings.invalid');
 $('bindingRows').querySelector(`[data-action="${action}"]`).focus();
}
let mousePointerSource='mouse';
function recordMousePointerSource(e){mousePointerSource=e.pointerType||'mouse';}
function isMouseInput(e){return (!e.pointerType||e.pointerType==='mouse')&&!e.sourceCapabilities?.firesTouchEvents&&mousePointerSource==='mouse';}
function handleMouseDown(e){
 if(resolutionBlocked||!isMouseInput(e))return;
 const key=Bindings.mouseKey(e.button);suppressedMouseClick=null;
 if(state==='help'&&captureAction&&key){
  e.preventDefault();e.stopPropagation();suppressedMouseClick={button:e.button,timeStamp:e.timeStamp};finishBindingCapture(key);return;
 }
 // Native menu controls keep their ordinary click behaviour. Only the game
 // canvas supplies held mouse input, through the same action dispatcher.
 Cursor.request(e);
 if(typeof DuelMode!=='undefined'&&DuelMode.active){if(e.target===canvas&&key&&DuelMode.input(key,true,e.target))e.preventDefault();return;}
 if(state!=='play'||e.target!==canvas||!key||!Bindings.uses(key))return;
 handleKeyDown({key,code:'',repeat:false,target:canvas,preventDefault:()=>e.preventDefault()});
}
function handleMouseUp(e){
 const key=Bindings.mouseKey(e.button);if(!key)return;
 if(typeof DuelMode!=='undefined'&&DuelMode.active&&DuelMode.input(key,false,e.target))e.preventDefault();
 // Release an already held mouse button even if a touch/pen gesture happened
 // between its press and release. Device provenance only gates new actions.
 if(keys.has(key)||isMouseInput(e)&&e.target===canvas&&Bindings.uses(key))e.preventDefault();
 keys.delete(key);
}
function handleMouseCancel(){for(const key of Object.values(KEY_BINDINGS.mouseButtons)){keys.delete(key);pressed.delete(key);if(typeof DuelMode!=='undefined'&&DuelMode.active)DuelMode.input(key,false,null);}}
function mouseCaptureGesture(e){return suppressedMouseClick&&e.button===suppressedMouseClick.button&&e.timeStamp-suppressedMouseClick.timeStamp>=0&&e.timeStamp-suppressedMouseClick.timeStamp<1000;}
function handleMouseClick(e){if(isMouseInput(e)&&mouseCaptureGesture(e)){e.preventDefault();e.stopPropagation();suppressedMouseClick=null;}}
function handleMouseContextMenu(e){
 if(Cursor.contextMenu(e)){e.stopPropagation?.();return;}
 if(isMouseInput(e)&&(mouseCaptureGesture(e)||e.target===canvas&&Bindings.uses(Bindings.mouseKey(2)))){e.preventDefault();e.stopPropagation();}
}
function handleKeyDown(e){
 if(resolutionBlocked||state==='developer')return;
 const k=keyName(e);
 if(typeof DuelMode!=='undefined'&&DuelMode.active){if(DuelMode.input(k,true,e.target))e.preventDefault();return;}
 if(state==='dungeonMenu'){DungeonRun.keydown(e);return;}if(state==='dialog'){Dialogue.keydown(e);return;}
 if(state==='slayerSpell'){const target=e.target||document.activeElement,editing=target===$('slayerSpellInput')||target?.matches?.('input,textarea,[contenteditable="true"]');if(!e.repeat&&(k==='escape'||!editing&&Bindings.read('pause').includes(k))){e.preventDefault();SlayerDialog.close();}return;}
 if(state==='shop'){if(!e.repeat&&(k==='escape'||Bindings.read('pause').includes(k))){e.preventDefault();Merchant.close();}return;}
 if(state==='inventory'){if(!e.repeat&&(k==='escape'||Bindings.read('pause').includes(k)||Bindings.read('inventory').includes(k))){e.preventDefault();Inventory.close();}return;}
 if(state==='help'){
  if(captureAction){e.preventDefault();if(e.repeat)return;if(k==='escape'){captureAction=null;renderHelp();$('bindingMessage').textContent='';return;}
   finishBindingCapture(k);return;
  }
  if(k==='escape'){e.preventDefault();closeHelp();}return;
 }
 if(state!=='play'&&e.target?.closest?.('button,summary,select,input,textarea,a')&&k!=='escape')return;
 if(state==='play'&&Bindings.uses(k))e.preventDefault();if(e.repeat)return;
 if(k==='escape'&&(state!=='play'||!Bindings.uses(k))||Bindings.read('pause').includes(k)){if(state==='training'){closeTraining();return;}if(state==='map'){closeMap();return;}pause();return;}
 if(Bindings.read('map').includes(k)){if(state==='map')closeMap();else showMap();return;}
 if(Bindings.read('inventory').includes(k)){if(state==='play'){e.preventDefault();Inventory.open();}return;}
 if(state==='play'){keys.add(k);pressed.add(k);if(Bindings.read('moveLeft').includes(k))DevLog.action('moveLeft');if(Bindings.read('moveRight').includes(k))DevLog.action('moveRight');}
}
function handleKeyUp(e){const k=keyName(e);keys.delete(k);if(typeof DuelMode!=='undefined'&&DuelMode.active)DuelMode.input(k,false,e.target);}
Cursor.init();
addEventListener('keydown',e=>{handleKeyDown(e);Cursor.update();});addEventListener('keyup',handleKeyUp);
// Pointer Events report only the first press and last release of a mouse chord.
// Record device provenance here; native mouse events dispatch every button.
addEventListener('pointerdown',recordMousePointerSource,true);
addEventListener('mousedown',e=>{handleMouseDown(e);Cursor.update();},true);addEventListener('mouseup',handleMouseUp);addEventListener('pointercancel',handleMouseCancel);
addEventListener('click',handleMouseClick,true);addEventListener('contextmenu',handleMouseContextMenu,true);
AssetCache.load(sheet,'assets/images/momo.png',ok=>{if(ok){loadingReady=true;if(DevTools.isOpen)DevTools.refresh();}else toast(I18n.t("text.momo.s.artwork.could.not.be.loaded.please.reload"));});
AssetCache.load(menuSheet,'assets/images/momo-menu-idle-v2.png');
function frame(ms){const dt=Math.min((ms-last)/1000||0,.033);last=ms;update(dt);draw();if(typeof DuelMode==='undefined'||!DuelMode.active)Merchant.drawMinimap();DevLog.frame();DevBossHealth.hud();requestAnimationFrame(frame);}requestAnimationFrame(frame);
Inventory.init();Merchant.init();SlayerDialog.init();if(typeof DuelMode!=='undefined')DuelMode.init();
BugReport.init(()=>Prologue.active?'dream':level===councilHall?'council':CampQuest.locationId()||['japan','yomi','heaven','shadow'][realm]);
I18n.onChange(()=>{$('resolutionMessage').textContent=I18n.t('display.minimum');});
I18n.onChange(()=>Dialogue.render());
I18n.applyDOM();
DevSession.init();DevBoss.init();DevTeleport.init();DevLevel.init();DevItems.init();DevAbilities.init();DevWeapons.init();DevImmortality.init();DevDamage.init();DevLog.init();DevCache.init();DevTools.init();
I18n.onChange(()=>{if(typeof DuelMode!=='undefined'&&DuelMode.active)return;if(player)updateHUD();if(state==='map')showMap();if(state==='training')refreshTraining();if(state==='inventory')Inventory.render();renderHelp();$('soundButton').textContent=I18n.t(sound?I18n.t("text.sound.on"):I18n.t("text.sound.off"));if($('toast').textContent)$('toast').textContent=I18n.t($('toast').textContent);});
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
function drawMomo(x,feet,size,row,frame,face){if(row===4)size*=198/MOMO_AIR_INK_HEIGHT[frame];if(!sheet.complete||!sheet.naturalWidth)return;ctx.save();ctx.translate(x,feet);if(row!==1&&row!==2&&face<0)ctx.scale(-1,1);const hh=size*208/192,baseline=MOMO_FRAME_BOTTOM[row]?.[frame]??208;DuelAppearance.paint(ctx,sheet,frame*192,row*208,192,208,-size/2,-baseline*size/192,size,hh);ctx.restore();}
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
function drawEnemy(e,r){if(!HannahArt.actor(e)&&!FiaArt.actor(e)&&!DungeonArt.actor(e)&&!ArenaArt.actor(e)&&!KitsuneArt.actor(e)&&!PrisonArt.actor(e)&&!CampArt.actor(e))Visuals.actor(e,r);if(e.denResidentRole||e.denRetaliation)Visuals.healthBar(e);}

function drawBoss(r){Visuals.actor(boss,r,true);}

function drawSpirit(x,y,color){ctx.save();ctx.translate(x,y+Math.sin(time*2)*6);const g=ctx.createRadialGradient(0,0,1,0,0,50);g.addColorStop(0,color+'65');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(-50,-50,100,100);ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,0,5,10,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawSlash(){ctx.save();ctx.translate(player.x+22,player.y+32);if(attackFace<0)ctx.scale(-1,1);const fire=defeated[1],elapsed=attackElapsed/WeaponStyles.profile(weaponStyle).tempo;ctx.globalAlpha=clamp((.3-elapsed)/.14,0,1);ctx.strokeStyle=fire?'#ffcf83':'#ecedce';ctx.lineWidth=7;ctx.shadowColor=fire?'#ec9153':'#d9e8ce';ctx.shadowBlur=18;ctx.beginPath();ctx.arc(15,0,82,-1.15,1.05);ctx.stroke();ctx.lineWidth=2;ctx.beginPath();ctx.arc(15,0,96,-.9,.8);ctx.stroke();ctx.restore();}

$('trainButton').onclick=showTraining;$('closeTraining').onclick=closeTraining;
for(const key of ['vitality','strength','spirit','shield'])$('train-'+key).onclick=()=>spendPoint(key);


function drawPlayer(){
 FiaArt.player();if(HannahArt.player())return;
 const feet=player.y+player.h+1,x=player.x+player.w/2,visualElapsed=attackElapsed/WeaponStyles.profile(weaponStyle).tempo;
 const row=!player.onGround?4:Math.abs(player.vx)>35?(player.face>0?1:2):0;
 const frame=row===4?(player.vy< -260?1:player.vy<100?2:3):Math.floor(player.animationTime*(row===0?5:12))%(row===0?6:8);
 ctx.save();
 if(dash>0&&!reducedMotion.matches){ctx.globalAlpha=.2;if(attack>0)Visuals.momoSlash(x-player.face*50,feet,92,visualElapsed,attackFace,attackKind);else drawMomo(x-player.face*50,feet,92,row,frame,player.face);ctx.globalAlpha=1;}
 // Protection is a steady translucent cue rather than a flashing disappearing sprite.
 ctx.globalAlpha=player.inv>0&&state==='play'?.82:1;
 if(attack<=0&&weaponStyle==='naginata')Visuals.momoCarry(x,feet,96,player.face);
 if(attack>0)Visuals.momoSlash(x,feet,96,visualElapsed,attackFace,attackKind);else drawMomo(x,feet,96,row,frame,player.face);
 if(attack<=0&&weaponStyle==='swordShield')Visuals.momoCarry(x,feet,96,player.face);
 // Heavy art includes its painted sweep; the normal slash retains its existing cue.
 if(weaponStyle!=='naginata'&&attack>0&&attackKind==='normal'&&visualElapsed>=SWORD_IMPACT&&visualElapsed<.3)drawSlash();
 ctx.restore();
}
function collectedRelics(){return flags[2].includes('eclipseRelic')?['eclipseRelic']:['angelHalo','demonHorn'].filter(id=>flags[0].includes(id));}
