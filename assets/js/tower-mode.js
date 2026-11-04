/* Independent tower runs borrow the combat engine, never the journey's save slot. */
'use strict';
const TowerMode=(()=>{
 let active=false,run=null,normalSave=null,floorElapsed=0,currentSpec=null,stage='lobby',initialized=false,warning=false,pendingExit=null;
 const node=id=>document.getElementById(id),clone=value=>value?JSON.parse(JSON.stringify(value)):null;
 const ready=()=>!resolutionBlocked&&storageReady&&loadingReady&&Visuals.loaded===Visuals.total&&!Visuals.failures.length;
 const formatTime=seconds=>{const value=Math.floor(seconds);return Math.floor(value/60)+':'+String(value%60).padStart(2,'0');};
 const score=()=>run?{...TowerRules.score(run),kills:run.kills+(currentSpec?.enemies.filter(spec=>enemies.find(e=>e.id===spec.id)?.dead).length||0),elapsed:run.elapsed+floorElapsed}:null;
 function stored(result){if(result&&!result.persisted)warning=true;return result?.ok===true;}
 function record(){if(run)stored(TowerStore.finish(score()));}
 function clearInput(){keys.clear();pressed.clear();context=null;$('prompt').hidden=true;}
 function restoreMenuControls(){for(const id of ['trainButton','inventoryButton','mapButton','mainMenuButton'])node(id).hidden=false;const progress=document.querySelector?.('.progression');if(progress)progress.hidden=false;node('towerEnd').hidden=true;node('towerHUD').hidden=true;}
 function open(){
  if(state!=='menu'||active||DevSession.active||!ready())return false;
  normalSave=clone(saved);active=true;stage='lobby';run=null;currentSpec=null;warning=false;
  state='tower';clearInput();$('menu').hidden=true;showHUD(false);node('towerHUD').hidden=true;node('towerPanel').hidden=false;render();node('towerStart').focus();return true;
 }
 function seed(){let value=0;const old=TowerStore.read().checkpoint?.seed;do{const words=new Uint32Array(1);crypto.getRandomValues(words);value=words[0];}while(!value||value===old);return value;}
 function prepare(){
  HannahEncounter.clear();Dawnblade.resetJourney();FiaRitual.clear();FiaConflict.clear();Prologue.stop();Dialogue.cancel();WeaponSelection.cancel();
  abilities=[true,true];defeated=levels.map(()=>false);flags=levels.map(()=>[]);visitedRests=levels.map(()=>[]);visits=new Set();
  shards=coins=meatCount=teaCount=chickenCount=0;soldItems=[];quickHeal=equippedTalisman=null;weaponChoicePending=false;weaponStyle=run.weapon;
  progression=freshProgression();campServices=CampServiceRules.fresh(run.weapon);dungeonState=DungeonRules.fresh();fiaJourney=FiaJourneyRules.fresh();councilReturn=null;
  node('towerPanel').hidden=true;node('towerResult').hidden=true;$('pause').hidden=true;showHUD(true);floorElapsed=0;
 }
 function start(){
  if(!active||stage!=='lobby'||!ready())return false;const weapon=node('towerWeapon').value;if(!TowerRules.validWeapon(weapon))return false;
  run=TowerRules.fresh(seed(),weapon);stored(TowerStore.start({seed:run.seed,weapon:run.weapon}));prepare();enterFloor(true);return true;
 }
 function resume(){
  if(!active||!['lobby','result'].includes(stage)||!ready())return false;const point=TowerStore.read().checkpoint;
  const next=point?.cleared===0?TowerRules.fresh(point.seed,point.weapon):TowerRules.fromCheckpoint(point);if(!next)return false;
  run=next;prepare();enterFloor(true);return true;
 }
 function enterFloor(initial=false){
  if(!active||!TowerRules.valid(run)||stage!=='clear'&&initial!==true)return false;
  currentSpec=TowerRules.floor(run.floor,run.seed);if(!currentSpec)return false;
  const previousHp=player?.hp,layout=TowerRules.layout;
  realm=currentSpec.realm;level=makeLevel('infiniteTower',layout.width,layout.height,{x:layout.spawnX,y:layout.groundY});level.tower=true;level.name='tower.name';level.enemyRealm=realm;
  ledge(level,'towerGround',0,layout.groundY,layout.width,'ground',240);ledge(level,'towerLedgeLeft',460,640,190);ledge(level,'towerLedgeRight',1120,620,190);
  level.arena={x:0,y:layout.groundY,w:layout.width};level.enemies=currentSpec.enemies;platforms=level.platforms;
  boss={dead:true,hp:0,x:-10000,y:0};bossStarted=false;projectiles=[];particles=[];drops=[];checkpoint={...level.start};
  initPlayer(level.start);if(stage==='clear'&&Number.isFinite(previousHp))player.hp=Math.min(player.maxHp,previousHp);
  enemies=currentSpec.enemies.map((spec,i)=>{const e=createEnemy(spec,i);e.hp=e.maxHp=spec.maxHp;e.damageValue=spec.damageValue;return e;});
  floorElapsed=0;stage='fight';state='play';clearInput();node('towerResult').hidden=true;canvas.tabIndex=-1;canvas.focus?.();resetCamera();hud();return true;
 }
 function clearFloor(){
  if(stage!=='fight'||enemies.some(e=>!e.dead))return false;
  const next=TowerRules.advance(run,{kills:currentSpec.enemyCount,elapsed:floorElapsed});if(!next.ok){fail();return false;}
  run=next.state;floorElapsed=0;currentSpec=null;projectiles=[];particles=[];
  player.hp=TowerRules.heal(player.hp,player.maxHp,run.cleared);stored(TowerStore.finish(TowerRules.score(run)));if(next.checkpoint)stored(TowerStore.saveCheckpoint(run.checkpoint));
  stage='clear';state='tower';clearInput();showResult();return true;
 }
 function fail(){
  if(!active||stage!=='fight')return false;record();player.hp=0;projectiles=[];particles=[];stage='result';state='tower';clearInput();showResult();return true;
 }
 function leave(){
  if(!active)return false;pendingExit=null;node('towerExitConfirm').hidden=true;if(stage==='fight')record();active=false;stage='lobby';run=null;currentSpec=null;
  saved=clone(normalSave);normalSave=null;projectiles=[];particles=[];node('towerPanel').hidden=true;node('towerResult').hidden=true;restoreMenuControls();clearInput();mainMenu();node('towerButton').focus();return true;
 }
 function exitCopy(){
  if(!pendingExit)return;const data=TowerStore.read(),point=score(),best=Math.max(data.best?.cleared||0,point?.cleared||0);
  node('towerExitPrompt').textContent=I18n.format('tower.exit.confirm',[(data.checkpoint?.cleared||0)+1,best]);
  node('towerConfirmExit').textContent=I18n.t('tower.end');node('towerCancelExit').textContent=I18n.t('merchant.sell.cancel');
 }
 function requestLeave(){
  if(!active||pendingExit)return false;if(!run)return leave();
  pendingExit={state,focus:document.activeElement,readyAt:Date.now()+400};state='towerConfirm';clearInput();exitCopy();
  node('towerExitConfirm').hidden=false;node('towerConfirmExit').disabled=true;node('towerCancelExit').focus();
  const request=pendingExit;if(typeof setTimeout==='function')setTimeout(()=>{if(pendingExit===request)node('towerConfirmExit').disabled=false;},400);
  return true;
 }
 function cancelLeave(){
  if(!pendingExit)return false;const request=pendingExit;pendingExit=null;node('towerExitConfirm').hidden=true;state=request.state;clearInput();
  if(request.focus?.isConnected)request.focus.focus();else{canvas.tabIndex=-1;canvas.focus?.();}return true;
 }
 function confirmLeave(){if(!pendingExit||state!=='towerConfirm'||Date.now()<pendingExit.readyAt)return false;return leave();}
 function lobby(){if(!active||!['clear','result'].includes(stage))return false;stage='lobby';node('towerResult').hidden=true;node('towerPanel').hidden=false;node('towerHUD').hidden=true;showHUD(false);render();node('towerStart').focus();return true;}
 function stats(){const weapon=run?.weapon||'katana';return {maxHp:TowerRules.maxHp(weapon),damage:2,armor:0,dashCooldown:.8,invulnerability:1.25};}
 function hud(){
  if(!active)return false;if(!player||stage==='lobby')return true;
  $('realmLabel').textContent=I18n.format('tower.floor',[stage==='clear'?run.cleared:run.floor]);CampHealth.render($('health'),player.hp,player.maxHp);$('kibaCurrent').textContent=I18n.t('tower.name');
  for(const id of ['quest','coinPurse','trainButton','inventoryButton','mapButton','bossHud','campExecutionWarning','mainMenuButton'])node(id).hidden=true;
  node('towerEnd').hidden=false;node('towerHUD').hidden=false;node('towerEnemies').textContent=I18n.format('tower.enemies',[enemies.filter(e=>!e.dead).length]);
  node('towerClock').textContent=I18n.format('tower.time',[formatTime(run.elapsed+floorElapsed)]);node('towerObjective').textContent=I18n.t('tower.objective');node('towerWarning').hidden=!warning;node('towerWarning').textContent=I18n.t('tower.storage');
  const progress=document.querySelector?.('.progression');if(progress)progress.hidden=true;
  $('dropHint').hidden=false;$('dashHint').hidden=false;$('jumpHint').textContent=I18n.t('text.twice.double.jump');$('areaLabel').textContent=I18n.t('tower.name');
  return true;
 }
 function render(){
  if(!active)return;const data=TowerStore.read(),point=data.checkpoint;warning=warning||!TowerStore.available;
  node('towerTitle').textContent=I18n.t('tower.name');node('towerInfo').textContent=I18n.t('tower.info');node('towerStart').textContent=I18n.t('tower.start');node('towerBack').textContent=I18n.t('weapon.choose.back');
  node('towerWeaponLabel').textContent=I18n.t('weapon.training.title');node('towerBest').textContent=I18n.format('tower.best',[data.best?.cleared||0]);node('towerNewInfo').textContent=I18n.t('tower.new.info');
  for(const id of ['towerContinue','towerRetry']){node(id).hidden=!point||point.cleared>0&&!TowerRules.validCheckpoint(point);node(id).textContent=I18n.format('tower.continue',[(point?.cleared||0)+1]);}
  node('towerNext').textContent=I18n.t('tower.next');node('towerNew').textContent=I18n.t('tower.new');node('towerExit').textContent=I18n.t('tower.end');node('towerEnd').textContent=I18n.t('tower.end');node('towerButton').textContent=I18n.t('tower.name');
  node('towerStorage').hidden=!warning;node('towerStorage').textContent=I18n.t('tower.storage');
  if(stage==='clear'||stage==='result')showResult(false);
 }
 function showResult(focus=true){
  const point=stage==='clear'?TowerRules.score(run):score(),data=TowerStore.read();node('towerResult').hidden=false;node('towerPanel').hidden=true;
  node('towerResultTitle').textContent=I18n.t(stage==='clear'?'tower.cleared':'tower.over');node('towerSummary').textContent=[I18n.format('tower.completed',[point.cleared]),I18n.format('tower.kills',[point.kills]),I18n.format('tower.time',[formatTime(point.elapsed)]),I18n.format('tower.best',[data.best?.cleared||0])].join(' · ');
  node('towerCheckpoint').hidden=!data.checkpoint?.cleared;node('towerCheckpoint').textContent=I18n.format('tower.checkpoint',[data.checkpoint?.cleared||0]);node('towerNext').hidden=stage!=='clear';node('towerRetry').hidden=stage!=='result'||!data.checkpoint;
  node('towerRetry').textContent=I18n.format('tower.continue',[(data.checkpoint?.cleared||0)+1]);
  if(focus)node(stage==='clear'?'towerNext':'towerRetry').focus();
 }
 function update(dt){
  if(!active||stage!=='fight'||state!=='play'||!Number.isFinite(dt)||dt<=0)return;
  floorElapsed+=dt;movingPlatforms(dt);input(dt);if(state!=='play')return;const victim=player;movePlayer(dt);if(state!=='play'||player!==victim)return;
  dashTrailClock-=dt;if(dash>0&&dashTrailClock<=0){emitDashWisp();dashTrailClock=.035;}advanceSwordAttack(dt);if(state!=='play')return;for(const enemy of [...enemies]){
   if(enemy.dead)continue;
   DevLog.scope(enemy,()=>enemy.towerSummonOwner?TowerBossCombat.updateSupport(enemy,dt):updateEnemy(enemy,dt));
   if(state!=='play')return;
  }
  for(const p of projectiles){p.life-=dt;if(p.kind==='arrow')p.vy+=55*dt;const x=p.x,y=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;const radius=p.radius||7,box={x:Math.min(x,p.x)-radius,y:Math.min(y,p.y)-radius,w:Math.abs(x-p.x)+radius*2,h:Math.abs(y-p.y)+radius*2};
   if(p.life>0&&overlap(player,box)){TowerBossCombat.projectile(p);p.life=0;if(state!=='play')return;}}
  projectiles=projectiles.filter(p=>p.life>0);
  for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.kind!=='dashWisp')p.vy+=500*dt;}particles=particles.filter(p=>p.life>0);
  camera+=(clamp(player.x-viewW*.43,0,Math.max(0,level.width-viewW))-camera)*Math.min(1,dt*6);cameraY+=(clamp(player.y-H*.54,0,Math.max(0,level.height-H))-cameraY)*Math.min(1,dt*8);
  if(enemies.every(e=>e.dead))clearFloor();hud();pressed.clear();
 }
 function draw(){
  if(!active)return false;BackgroundMotion.beginFrame();ctx.save();ctx.clearRect(0,0,viewW,H);ctx.fillStyle='#161b26';ctx.fillRect(0,0,viewW,H);
  const image=Visuals.images.towerBackdrop;if(image?.complete&&image.naturalWidth){const s=Math.max(viewW/image.naturalWidth,H/image.naturalHeight),top=run&&stage!=='lobby'?TowerRules.layout.groundY-cameraY-image.naturalHeight*s*.82:0;BackgroundMotion.draw(image,(viewW-image.naturalWidth*s)/2,top,image.naturalWidth*s,image.naturalHeight*s);}
  if(run&&stage!=='lobby'){ctx.save();ctx.translate(-camera,-cameraY);Visuals.terrain(realms[realm],platforms);for(const enemy of enemies)if(!enemy.dead){if(!TowerBossArt.actor(enemy))drawEnemy(enemy,realms[realm]);if(enemy.towerBoss){Visuals.healthBar(enemy,enemy.x+enemy.w/2,enemy.y+enemy.h,enemy.h,150,5);DevBossHealth.bar(enemy,enemy.x+enemy.w/2,enemy.y-17,150);ctx.save();ctx.textAlign='center';ctx.font='bold 15px "Kiba UI", sans-serif';ctx.fillStyle='#fff1cd';ctx.shadowColor='#07111c';ctx.shadowBlur=5;ctx.fillText(I18n.t(enemy.name),enemy.x+enemy.w/2,enemy.y-29);ctx.restore();}}for(const enemy of enemies)if(!enemy.dead)TowerBossArt.effects(enemy);for(const p of projectiles)if(!IslandsArt.projectile(p)&&!SerpentArt.projectile(p)&&!FiaRitualArt.projectile(p))Visuals.projectile(p);drawParticles();drawPlayer();DevDamage.draw();ctx.restore();}
  ctx.restore();return true;
 }
 function init(){
  if(initialized)return;initialized=true;node('towerButton').textContent=I18n.t('tower.name');
  for(const [id,fn]of Object.entries({towerButton:open,towerStart:start,towerContinue:resume,towerBack:requestLeave,towerNext:enterFloor,towerRetry:resume,towerNew:lobby,towerExit:requestLeave,towerEnd:requestLeave,towerConfirmExit:confirmLeave,towerCancelExit:cancelLeave}))node(id).onclick=fn;
  const select=node('towerWeapon');for(const id of TowerRules.weapons){const option=document.createElement('option');option.value=id;option.textContent=I18n.t('weapon.'+id+'.name');select.append(option);}select.value='katana';
  I18n.onChange(()=>{node('towerButton').textContent=I18n.t('tower.name');for(const option of select.children)option.textContent=I18n.t('weapon.'+option.value+'.name');if(active){render();hud();exitCopy();}});
  addEventListener('keydown',event=>{
   if(!active||resolutionBlocked||!pendingExit)return;
    event.stopImmediatePropagation();
    if(event.key==='Escape'){event.preventDefault();if(!event.repeat)cancelLeave();}
    if(event.key==='Tab'){event.preventDefault();const controls=[node('towerCancelExit'),node('towerConfirmExit')].filter(el=>!el.disabled),index=controls.indexOf(document.activeElement);controls[(index+(event.shiftKey?-1:1)+controls.length)%controls.length].focus();}
  },true);
  addEventListener('keydown',event=>{
   if(!active||resolutionBlocked)return;
   if(state!=='tower')return;if(event.key==='Escape'){event.preventDefault();if(!event.repeat)requestLeave();return;}
   if(event.key==='Tab'){
    const panel=node(stage==='lobby'?'towerPanel':'towerResult'),items=[...panel.querySelectorAll('button,select')].filter(el=>!el.hidden&&!el.disabled);
    if(!items.length)return;event.preventDefault();const index=items.indexOf(document.activeElement);items[(index+(event.shiftKey?-1:1)+items.length)%items.length].focus();
   }
  });
  addEventListener('pagehide',()=>{if(active&&stage==='fight')record();});
 }
 return Object.freeze({open,start,resume,enterFloor,fail,leave,requestLeave,cancelLeave,confirmLeave,lobby,hud,update,draw,init,stats,render,get active(){return active;},get running(){return active&&!!run&&stage!=='lobby';},get phase(){return stage;},snapshot:()=>run?{...TowerRules.copy(run),floorElapsed}:null});
})();
