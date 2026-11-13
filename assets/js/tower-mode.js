/* Independent tower runs borrow the combat engine, never the journey's save slot. */
'use strict';
const TowerMode=(()=>{
 let active=false,run=null,normalSave=null,floorElapsed=0,currentSpec=null,stage='lobby',initialized=false,warning=false,pendingExit=null,wallet=null,resultReadyAt=0,resultRevision=0;
 const node=id=>document.getElementById(id),clone=value=>value?JSON.parse(JSON.stringify(value)):null;
 const ready=()=>!resolutionBlocked&&storageReady&&loadingReady&&Visuals.loaded===Visuals.total&&!Visuals.failures.length;
 const formatTime=seconds=>{const value=Math.floor(seconds);return Math.floor(value/60)+':'+String(value%60).padStart(2,'0');};
 const score=()=>run?{...TowerRules.score(run),kills:run.kills+(currentSpec?.enemies.filter(spec=>enemies.find(e=>e.id===spec.id)?.dead).length||0),elapsed:run.elapsed+floorElapsed}:null;
 function stored(result){if(result&&!result.persisted)warning=true;return result?.ok===true;}
 function syncWallet(){if(!wallet)return;wallet={...wallet,coins,items:{roastMeat:meatCount,tea:teaCount,healingBrew:campServices.potions,roastChicken:chickenCount}};}
 function applyWallet(){coins=wallet.coins;meatCount=wallet.items.roastMeat;teaCount=wallet.items.tea;campServices.potions=wallet.items.healingBrew;chickenCount=wallet.items.roastChicken;Merchant.selectAvailable();}
 function record(){if(run){syncWallet();stored(TowerStore.finish(score()));}}
 const resultLocked=()=>['clear','result'].includes(stage)&&Date.now()<resultReadyAt;
 function checkpointWallet(){if(run?.checkpoint&&wallet?.rewardedFloor===run.cleared&&TowerRewards.vendor(run.cleared))stored(TowerStore.saveCheckpoint(run.checkpoint,wallet));}
 function lockResult(){resultReadyAt=Date.now()+3000;const revision=++resultRevision;if(typeof setTimeout==='function')setTimeout(()=>{if(active&&revision===resultRevision&&['clear','result'].includes(stage)){showResult(false);const target=node(stage==='clear'&&wallet.claimedFloor<run.cleared?'towerPower0':stage==='clear'?'towerNext':'towerRetry');target.focus();}},3000);}
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
  applyWallet();resultReadyAt=0;
  node('towerPanel').hidden=true;node('towerResult').hidden=true;$('pause').hidden=true;showHUD(true);floorElapsed=0;
 }
 function start(){
  if(!active||stage!=='lobby'||!ready())return false;const weapon=node('towerWeapon').value;if(!TowerRules.validWeapon(weapon))return false;
  run=TowerRules.fresh(seed(),weapon);wallet=TowerRewards.fresh();stored(TowerStore.start({seed:run.seed,weapon:run.weapon}));prepare();enterFloor(true);return true;
 }
 function resume(){
  if(!active||!['lobby','result'].includes(stage)||resultLocked()||!ready())return false;const data=TowerStore.read(),point=data.checkpoint;
  const next=point?.cleared===0?TowerRules.fresh(point.seed,point.weapon):TowerRules.fromCheckpoint(point);if(!next)return false;
  run=next;wallet=TowerRewards.copy(data.checkpointRewards);prepare();
  if(!enterFloor(true))return false;
  if(wallet.claimedFloor<run.cleared){
   stage='clear';state='tower';currentSpec=null;enemies=[];clearInput();showResult();hud();
  }
  return true;
 }
 function enterFloor(initial=false){
  if(!active||!TowerRules.valid(run)||stage!=='clear'&&initial!==true||initial!==true&&(resultLocked()||wallet.claimedFloor!==run.cleared))return false;
  syncWallet();checkpointWallet();
  currentSpec=TowerRules.floor(run.floor,run.seed);if(!currentSpec)return false;
  const preserveHp=stage==='clear',previousHp=player?.hp,layout=TowerRules.layout;
  realm=currentSpec.realm;level=MapCatalog.build('infiniteTowerTemplate');level.id='infiniteTower';level.start={x:layout.spawnX,y:layout.groundY};level.tower=true;level.name='tower.name';level.enemyRealm=realm;
  level.grappleAnchors=MAP_DATA.infiniteTowerTemplate.tower.anchors.map(anchor=>({...anchor}));
  level.arena={x:0,y:layout.groundY,w:layout.width};level.enemies=currentSpec.enemies;platforms=level.platforms;
  boss={dead:true,hp:0,x:-10000,y:0};bossStarted=false;projectiles=[];particles=[];drops=[];checkpoint={...level.start};
  stage='fight';Dawnblade.resetJourney();initPlayer(level.start);if(preserveHp&&Number.isFinite(previousHp))player.hp=Math.min(player.maxHp,previousHp);
  enemies=currentSpec.enemies.map((spec,i)=>{const e=createEnemy(spec,i);e.hp=e.maxHp=spec.maxHp;e.damageValue=spec.damageValue;return e;});
  floorElapsed=0;state='play';clearInput();node('towerResult').hidden=true;canvas.tabIndex=-1;canvas.focus?.();resetCamera();hud();return true;
 }
 function clearFloor(){
  if(stage!=='fight'||enemies.some(e=>!e.dead))return false;
  const next=TowerRules.advance(run,{kills:currentSpec.enemyCount,elapsed:floorElapsed});if(!next.ok){fail();return false;}
  syncWallet();const reward=TowerRewards.award(wallet,next.state.cleared);if(!reward.ok)return false;
  wallet=reward.wallet;applyWallet();run=next.state;floorElapsed=0;currentSpec=null;projectiles=[];particles=[];
  Grapple.clear();Dawnblade.resetJourney();player.hp=TowerRules.heal(player.hp,player.maxHp,run.cleared);stored(TowerStore.finish(TowerRules.score(run)));
  stage='clear';state='tower';checkpointWallet();clearInput();lockResult();showResult();return true;
 }
 function fail(){
  if(!active||stage!=='fight')return false;syncWallet();const revival=TowerRewards.revive(wallet);
  if(revival.ok){wallet=revival.wallet;initPlayer(level.start);player.hp=Math.min(player.maxHp,revival.heal);player.inv=2;projectiles=[];clearInput();resetCamera();hud();toast(I18n.t('tower.revived'));return true;}
  record();Grapple.clear();Dawnblade.resetJourney();player.hp=0;projectiles=[];particles=[];stage='result';state='tower';clearInput();lockResult();showResult();hud();return true;
 }
 function leave(){
  if(!active||resultLocked())return false;pendingExit=null;node('towerExitConfirm').hidden=true;if(stage==='fight')record();if(stage==='clear'){syncWallet();checkpointWallet();}active=false;stage='lobby';run=null;currentSpec=null;wallet=null;resultRevision++;
  saved=clone(normalSave);normalSave=null;projectiles=[];particles=[];node('towerPanel').hidden=true;node('towerResult').hidden=true;restoreMenuControls();clearInput();mainMenu();node('towerButton').focus();return true;
 }
 function exitCopy(){
  if(!pendingExit)return;const data=TowerStore.read(),point=score(),best=Math.max(data.best?.cleared||0,point?.cleared||0);
  node('towerExitPrompt').textContent=I18n.format('tower.exit.confirm',[(data.checkpoint?.cleared||0)+1,best]);
  node('towerConfirmExit').textContent=I18n.t('tower.end');node('towerCancelExit').textContent=I18n.t('merchant.sell.cancel');
 }
 function requestLeave(){
  if(!active||pendingExit||resultLocked())return false;if(!run)return leave();
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
 function lobby(){if(!active||!['clear','result'].includes(stage)||resultLocked())return false;stage='lobby';node('towerResult').hidden=true;node('towerPanel').hidden=false;node('towerHUD').hidden=true;showHUD(false);render();node('towerStart').focus();return true;}
 const hasRelic=id=>active&&stage==='fight'&&wallet?.relic===id;
 const relicNames={dawnblade:'ability.dawnblade',shield:'ability.kibaShield',grapple:'islands.hook'};
 function stats(){return TowerRewards.stats(wallet||TowerRewards.fresh(),run?.weapon||'katana');}
 function claim(id){
  if(!active||stage!=='clear'||resultLocked())return false;syncWallet();const result=TowerRewards.claim(wallet,{seed:run.seed,cleared:run.cleared,id});if(!result.ok)return false;
  wallet=result.wallet;applyWallet();player.maxHp=stats().maxHp;player.hp=Math.min(player.maxHp,player.hp+result.heal);checkpointWallet();showResult(false);hud();
  const firstPurchase=TowerRewards.vendor(run.cleared)&&Object.keys(TowerRewards.items).map(id=>node('towerBuy-'+id)).find(button=>!button.disabled);
  (firstPurchase||node('towerNext')).focus();return true;
 }
 function buy(id){
  if(!active||stage!=='clear'||resultLocked()||!TowerRewards.vendor(run.cleared)||wallet.claimedFloor!==run.cleared)return false;syncWallet();const result=TowerRewards.buy(wallet,id);if(!result.ok){toast(I18n.t('tower.poor'));return false;}
  wallet=result.wallet;applyWallet();checkpointWallet();showResult(false);hud();return true;
 }
 function selectHealing(id){if(!active||stage!=='clear'||resultLocked()||!TowerRewards.vendor(run.cleared)||wallet.claimedFloor!==run.cleared||!Object.hasOwn(wallet.items,id)||!wallet.items[id])return false;quickHeal=id;showResult(false);return true;}
 function hud(){
  if(!active)return false;if(!player||stage==='lobby')return true;
  $('realmLabel').textContent=I18n.format('tower.floor',[stage==='clear'?run.cleared:run.floor]);CampHealth.render($('health'),player.hp,player.maxHp);$('kibaCurrent').textContent=I18n.t('tower.name');
  for(const id of ['quest','coinPurse','trainButton','inventoryButton','mapButton','bossHud','campExecutionWarning','mainMenuButton'])node(id).hidden=true;
  node('towerEnd').hidden=false;node('towerHUD').hidden=false;node('towerEnemies').textContent=I18n.format('tower.enemies',[enemies.filter(e=>!e.dead).length]);
  node('towerClock').textContent=I18n.format('tower.time',[formatTime(run.elapsed+floorElapsed)]);node('towerObjective').textContent=I18n.t('tower.objective');node('towerWarning').hidden=!warning;node('towerWarning').textContent=I18n.t('tower.storage');
  node('towerCoins').textContent=I18n.format('tower.coins',[coins]);const relic=node('towerRelics');relic.hidden=stage!=='fight'||!wallet.relic;relic.textContent=relic.hidden?'':I18n.t(relicNames[wallet.relic]);
  if(!relic.hidden&&wallet.relic!=='shield'){
   const action=wallet.relic==='dawnblade'?'ultimate':'grapple';
   relic.textContent+=' · '+Bindings.read(action).map(bindingKeyLabel).join(' / ');
  }node('towerRevivals').textContent=I18n.format('tower.revivals',[wallet.revivals]);
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
  if((stage==='clear'||stage==='result')&&!TowerLeaderboard.active)showResult(false);
 }
 function showResult(focus=true){
  const point=stage==='clear'?TowerRules.score(run):score(),data=TowerStore.read();node('towerResult').hidden=false;node('towerPanel').hidden=true;
  node('towerResultTitle').textContent=I18n.t(stage==='clear'?'tower.cleared':'tower.over');node('towerSummary').textContent=[I18n.format('tower.completed',[point.cleared]),I18n.format('tower.kills',[point.kills]),I18n.format('tower.time',[formatTime(point.elapsed)]),I18n.format('tower.best',[data.best?.cleared||0])].join(' · ');
  node('towerCheckpoint').hidden=!data.checkpoint?.cleared;node('towerCheckpoint').textContent=I18n.format('tower.checkpoint',[data.checkpoint?.cleared||0]);node('towerNext').hidden=stage!=='clear';node('towerRetry').hidden=stage!=='result'||!data.checkpoint;
  node('towerRetry').textContent=I18n.format('tower.continue',[(data.checkpoint?.cleared||0)+1]);
  renderRewards();for(const id of ['towerNext','towerRetry','towerNew','towerResultLeaderboard','towerExit'])node(id).disabled=resultLocked()||id==='towerNext'&&wallet.claimedFloor!==run.cleared;
  if(focus){node('towerResultBody').tabIndex=-1;node('towerResultBody').focus();}
 }
 function renderRewards(){
  const cleared=stage==='clear',pending=cleared&&wallet.claimedFloor<run.cleared,shop=cleared&&!pending&&TowerRewards.vendor(run.cleared);
  node('towerRewards').hidden=!cleared;node('towerRewardTitle').textContent=I18n.t(pending?'tower.reward.choose':'tower.reward.selected');node('towerNext').title=pending?I18n.t('tower.reward.required'):'';node('towerRewardCoins').textContent=I18n.format('tower.reward.coins',[20+5*run.cleared])+' · '+I18n.format('tower.coins',[wallet.coins]);
  const choices=cleared?TowerRewards.choices(run.seed,run.cleared):[];for(let i=0;i<3;i++){const button=node('towerPower'+i),id=choices[i];button.hidden=!pending;button.disabled=resultLocked()||!pending;const nameKey='tower.power.'+id+'.name',descKey='tower.power.'+id+'.desc';
   const name=I18n.t(nameKey),desc=I18n.t(descKey);
   button.textContent=id?(name===nameKey?I18n.t(relicNames[id]):name)+(desc===descKey?'':' — '+desc):'';button.onclick=()=>claim(id);}
  node('towerVendor').hidden=!shop;node('towerVendorTitle').textContent=I18n.t('tower.vendor');
  for(const id of Object.keys(TowerRewards.items)){const count=wallet.items[id],name=I18n.t('item.'+id),price=TowerRewards.items[id];node('towerItem-'+id).textContent=name+' × '+count;const button=node('towerBuy-'+id);button.textContent=I18n.format('tower.buy',[price]);button.disabled=!shop||resultLocked()||pending||wallet.coins<price;button.onclick=()=>buy(id);const select=node('towerSelect-'+id);select.textContent=quickHeal===id?I18n.format('merchant.quick.selected',[name]):I18n.t('merchant.quick.assign');select.disabled=!shop||resultLocked()||pending||!count;select.onclick=()=>selectHealing(id);}
 }
 function update(dt){
  if(!active||stage!=='fight'||state!=='play'||!Number.isFinite(dt)||dt<=0)return;
  Merchant.update(dt);floorElapsed+=dt;movingPlatforms(dt);input(dt);if(state!=='play')return;const victim=player;movePlayer(dt);if(state!=='play'||player!==victim)return;
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
  if(run&&stage!=='lobby'){ctx.save();ctx.translate(-camera,-cameraY);Visuals.terrain(realms[realm],platforms);if(hasRelic('grapple'))IslandsArt.anchors();for(const enemy of enemies)if(!enemy.dead){if(!TowerBossArt.actor(enemy))drawEnemy(enemy,realms[realm]);if(enemy.towerBoss){Visuals.healthBar(enemy,enemy.x+enemy.w/2,enemy.y+enemy.h,enemy.h,150,5);DevBossHealth.bar(enemy,enemy.x+enemy.w/2,enemy.y-17,150);ctx.save();ctx.textAlign='center';ctx.font='bold 15px "Kiba UI", sans-serif';ctx.fillStyle='#fff1cd';ctx.shadowColor='#07111c';ctx.shadowBlur=5;ctx.fillText(I18n.t(enemy.name),enemy.x+enemy.w/2,enemy.y-29);ctx.restore();}}for(const enemy of enemies)if(!enemy.dead)TowerBossArt.effects(enemy);for(const p of projectiles)if(!IslandsArt.projectile(p)&&!SerpentArt.projectile(p)&&!FiaRitualArt.projectile(p))Visuals.projectile(p);drawParticles();drawPlayer();DevDamage.draw();ctx.restore();}
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
    const panel=node(stage==='lobby'?'towerPanel':'towerResult');if(panel.hidden)return;
    const items=[...panel.querySelectorAll('button,select')].filter(el=>!el.closest('[hidden]')&&!el.disabled);
    if(!items.length)return;event.preventDefault();const index=items.indexOf(document.activeElement);items[(index+(event.shiftKey?-1:1)+items.length)%items.length].focus();
   }
  });
  addEventListener('pagehide',()=>{if(active&&stage==='fight')record();});
 }
 return Object.freeze({open,start,resume,enterFloor:()=>enterFloor(),fail,leave,requestLeave,cancelLeave,confirmLeave,lobby,hud,update,draw,init,stats,render,hasRelic,claim,buy,selectHealing,get wallet(){syncWallet();return TowerRewards.copy(wallet);},get resultLocked(){return resultLocked();},get active(){return active;},get running(){return active&&!!run&&stage!=='lobby';},get phase(){return stage;},snapshot:()=>run?{...TowerRules.copy(run),floorElapsed}:null});
})();
