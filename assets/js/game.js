/* Kiba: Három világ — v0.7. */
'use strict';
const $=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d');
const sheet=new Image();sheet.src = 'assets/images/momo.png';
const menuSheet=new Image();menuSheet.src='assets/images/momo-menu-idle-v2.png';
const menuFrameBottom=[500,491,498,451,451,450];
const reducedMotion=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
const SWORD_DURATION=.42,SWORD_IMPACT=.16;
const H=720;
let viewW=1280,scale=1,camera=0,cameraY=0,time=0,levelTime=0,last=0,state='menu',realm=0,level=levels[0],platforms=[];
let abilities=[false,false],defeated=[false,false,false],flags=[[],[],[]],visitedRests=[[],[],[]],shards=0,saved=null;
let player,enemies=[],boss,particles=[],drops=[],projectiles=[],checkpoint=null,visits=new Set();
let attackElapsed=0,attackFace=1,attackHit=false;
let attack=0,attackCooldown=0,dash=0,dashCooldown=0,jumpBuffer=0,coyote=0,dropTimer=0;
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
function resize(){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);scale=innerHeight/H;viewW=innerWidth/scale;ctx.setTransform(dpr*scale,0,0,dpr*scale,0,0);}
addEventListener('resize',resize);resize();
SaveVault.ready.then(data=>{storageReady=true;saved=data;$('continueButton').hidden=!data;if(SaveVault.notice)toast(I18n.t(SaveVault.notice));});
function persist(){saved={version:2,layout:2,realm,abilities:[...abilities],defeated:[...defeated],flags:flags.map(f=>[...f]),visitedRests:visitedRests.map(f=>[...f]),shards,progression:JSON.parse(JSON.stringify(progression)),checkpoint:checkpoint?{...checkpoint}:null,won:state==='won'};$('continueButton').hidden=false;try{SaveVault.write(saved).catch(saveFailed);}catch{saveFailed();}}
function saveFailed(){if(!saveWarning){saveWarning=true;toast(I18n.t("text.saving.failed.check.your.browser.storage"));}}
function toast(msg){$('toast').textContent=I18n.t(msg);$('toast').classList.add('visible');toastTimer=5;}
function tone(freq,duration=.15,type='sine',volume=.05){if(!sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}}
function burst(x,y,color,n=12){for(let i=0;i<n;i++)particles.push({x,y,vx:(noise(time*100+i)-.5)*280,vy:-noise(time*200+i)*230,life:.4+noise(i+time)*.5,color,size:2+noise(i)*4});}
function initPlayer(point=level.start){player={x:point.x-21.5,y:point.y-69,w:43,h:69,vx:0,vy:0,face:1,hp:momoStats().maxHp,maxHp:momoStats().maxHp,inv:1,onGround:false,jumps:0,support:null};attack=0;attackElapsed=0;attackFace=1;attackHit=false;dash=0;attackCooldown=0;dashCooldown=0;jumpBuffer=0;coyote=0;dropTimer=0;}
function resetCamera(){camera=clamp(player.x-viewW*.43,0,Math.max(0,level.width-viewW));cameraY=clamp(player.y-H*.54,0,Math.max(0,level.height-H));}
function enterRealm(n,point=null){realm=n;level=levels[n];platforms=level.platforms.map(p=>({...p,dx:0}));levelTime=0;checkpoint={...(level.rests.find(r=>r.id===point?.id)||level.rests[0])};initPlayer(checkpoint);bossStarted=false;particles=[];drops=[];projectiles=[];visits=new Set();
 enemies=createEnemies();boss=createBoss();if(!visitedRests[n].includes('start'))visitedRests[n].push('start');resetCamera();updateHUD();}
function startGame(resume=false){if(!storageReady){toast(I18n.t("text.the.save.is.still.loading"));return;}if(!loadingReady||Visuals.loaded<Visuals.total){toast(I18n.t("text.the.artwork.is.still.loading"));return;}if(Visuals.failures.length){toast(I18n.t("text.an.artwork.file.could.not.be.loaded.please.reload"));return;}const old=resume?saved:null;abilities=old?[...old.abilities]:[false,false];defeated=old?[...old.defeated]:[false,false,false];flags=old?.layout===2?old.flags.map(f=>[...f]):[[],[],[]];visitedRests=old?.layout===2?old.visitedRests.map(f=>[...f]):[[],[],[]];shards=old?old.shards:0;progression=normalizeProgression(old?.progression);const r=old?old.realm:0;if(defeated[0]||r>0)abilities[0]=true;if(defeated[1]||r>1)abilities[1]=true;
 // Old progress survives; coordinates from the shorter maps do not.
 if(old&&old.layout!==2){if(defeated[0])flags[0].push('forestBell','villageBell');if(defeated[1])flags[1].push('soulUpper','soulLower');}
 const point=old?.layout===2?old.checkpoint:null;enterRealm(r,point);state='play';$('menu').hidden=true;showHUD(true);persist();if(!resume)story(I18n.t("text.the.lost.amulet"),I18n.t("text.the.path.of.bells"),realms[0].intro);else toast(old?.layout!==2?I18n.t("text.your.progress.has.been.preserved.continue.from.the.entrance"):I18n.t("text.your.journey.continues.where.you.last.rested"));}
function showHUD(on){for(const id of ['hud','quest','controls'])$(id).hidden=!on;$('relicInventory').hidden=!on||!collectedRelics().length;$('touchControls').hidden=!on||!matchMedia('(pointer:coarse)').matches;}
function story(label,title,text,onClose){state='dialog';keys.clear();pressed.clear();$('dialogLabel').textContent=I18n.t(label);$('dialogTitle').textContent=I18n.t(title);$('dialogText').replaceChildren();const p=document.createElement('p');p.textContent=I18n.t(text);$('dialogText').append(p);$('dialog').hidden=false;$('dialogOk').textContent=I18n.t("text.next.0ed851");$('dialogOk').onclick=()=>{$('dialog').hidden=true;state='play';onClose?.();};$('dialogOk').focus();}
function pointNear(p,dx=100,dy=90){return Math.abs(player.x+player.w/2-p.x)<dx&&Math.abs(player.y+player.h-p.y)<dy;}
function direction(p){const dx=p.x-player.x,dy=p.y-(player.y+player.h);return Math.abs(dy)>Math.abs(dx)*.6?(dy>0?'↓':'↑'):(dx>0?'→':'←');}
function nextObjective(){if(defeated[realm])return{point:realm===2?level.father:level.exit,text:realm===2?I18n.t("text.ride.the.final.wind.stream.up.to.your.father"):I18n.t("text.stand.beneath.the.glowing.torii.and.press.e")};
 if(realm===0){if(!abilities[0])return{point:level.ability,text:I18n.t("text.visit.the.wind.shrine.beside.the.path")};const bell=level.objects.find(o=>o.type==='bell'&&!hasFlag(o.id));if(bell)return{point:bell,text:I18n.format("message.ring.arg0.bells.arg1.2",[bell.name,flags[0].filter(f=>f.endsWith('Bell')).length])};return{point:level.boss,text:I18n.t("text.the.two.bells.have.opened.the.bamboo.temple.find")};}
 if(realm===1){const soul=level.objects.find(o=>o.type==='rescue'&&!hasFlag(o.id));if(soul)return{point:soul,text:I18n.format("message.free.arg0.souls.arg1.2",[soul.name,flags[1].filter(f=>f.startsWith('soul')).length])};if(!abilities[1])return{point:level.ability,text:I18n.t("text.the.shrine.of.shadows.grants.spirit.dash.use.the")};return{point:level.boss,text:I18n.t("text.the.abyss.gate.is.open.descend.to.the.bottom")};}
 const upcoming=level.winds.find(w=>!w.afterBoss&&w.y+50<player.y&&w.y+w.h>player.y-250);return{point:upcoming?{x:upcoming.x+upcoming.w/2,y:upcoming.y}:level.boss,text:hasFlag('dawnSeal')?I18n.t("text.the.dawn.seal.is.broken.the.guardian.awaits.at"):I18n.t("text.jump.into.the.wind.streams.and.move.sideways.onto")};}
function updateHUD(){if(!player)return;const current=realm===0?(player.y>1150?I18n.t("energy.faint"):I18n.t("energy.nourishing")):realm===1?I18n.t("energy.distorted"):level.winds.some(w=>overlap(player,w))?I18n.t("energy.powerful"):I18n.t("energy.pure");$('kibaCurrent').textContent=I18n.t(current);$('realmLabel').textContent=I18n.t(realms[realm].label);$('health').innerHTML=I18n.t('<span>♥</span>'.repeat(player.hp)+'<span class="empty">♥</span>'.repeat(player.maxHp-player.hp));$('health').setAttribute('aria-label',I18n.format("message.arg0.of.arg1.health",[player.hp,player.maxHp]));$('souls').textContent=I18n.t(shards);$('dashHint').hidden=!abilities[1];$('jumpHint').textContent=I18n.t(abilities[0]?I18n.t("text.twice.double.jump"):I18n.t("text.jump.4e09c3"));$('dropHint').hidden=realm===0;updateProgressHUD();updateRelicHUD();const objective=nextObjective();$('objective').textContent=I18n.t(objective.text+' '+direction(objective.point));}
function revive(fall=false){const hp=fall?Math.max(1,player.hp-1):momoStats().maxHp;initPlayer(checkpoint);player.hp=hp;if(!boss.dead)resetBossBattle();resetMinibosses();projectiles=[];resetCamera();updateHUD();toast(fall?I18n.t("text.the.shrine.s.light.has.brought.you.back.you"):I18n.t("text.the.shrine.has.called.you.back.your.abilities.and"));}
function damage(amount=1,dir=0){if(player.inv>0||dash>0)return;player.hp=Math.max(0,player.hp-amount);player.inv=momoStats().invulnerability;player.vx=dir*240;player.vy=-220;shake=.22;tone(100,.22,'sawtooth',.03);burst(player.x+20,player.y+35,'#dd9480');if(!player.hp)revive();else updateHUD();}
function getContext(){if(realm===2&&defeated[2]&&pointNear(level.father,110,100))return{type:'father',text:I18n.t("text.e.embrace.your.father")};if(realm<2&&pointNear(level.exit,115,100))return{type:'portal',text:defeated[realm]?I18n.format("message.e.travel.to.arg0.from.the.ground",[realms[realm+1].short]):I18n.t("text.e.the.guardian.s.oath.seals.the.passage")};
 const object=level.objects.find(o=>!hasFlag(o.id)&&relicUnlocked(o)&&pointNear(o));if(object)return{type:object.type,object,text:I18n.format("message.e.arg0.arg1",[object.type==='bell'?I18n.t("text.ring"):object.type==='rescue'?I18n.t("text.free"):object.type==='relic'?I18n.t('action.pick.up'):I18n.t("text.recall"),object.name])};if(level.ability&&pointNear(level.ability))return{type:'ability',text:`E · ${abilities[realm]?I18n.t("text.shrine.of.memory"):level.ability.name}`};const rest=level.rests.find(r=>pointNear(r,90,80));if(rest)return{type:'checkpoint',rest,text:I18n.t("text.e.rest.heal.and.save")};
 const weakWall=level.gates.find(g=>g.kind==='fragile'&&!gatePass(g)&&overlap({x:player.x-90,y:player.y-10,w:player.w+180,h:player.h+20},g));if(weakWall)return{type:'weakWall',text:I18n.t("text.j.the.cracked.rock.sounds.hollow")};
 const seal=level.gates.find(g=>g.kind==='fire'&&!gatePass(g)&&overlap({x:player.x-95,y:player.y-70,w:player.w+190,h:player.h+140},g));if(seal)return{type:'seal',text:I18n.t("text.j.break.the.seal.with.the.dawnblade")};return null;}
function interact(){const c=getContext();if(!c)return;if(c.type==='checkpoint'){checkpoint={...c.rest};player.hp=player.maxHp;respawnEnemies();if(!boss.dead)resetBossBattle();if(!visitedRests[realm].includes(c.rest.id))visitedRests[realm].push(c.rest.id);persist();updateHUD();burst(c.rest.x,c.rest.y-35,realms[realm].gold,18);toast(I18n.t("text.health.restored.enemies.have.respawned.u.train"));tone(440,.3);}
 if(c.type==='relic'){const o=c.object;if(hasFlag(o.id)||!relicUnlocked(o))return;flags[realm].push(o.id);persist();updateHUD();burst(o.x,o.y-55,o.id==='angelHalo'?'#ffe29a':'#d58cf3',28);story(I18n.t("text.ancient.relic"),o.name,o.id==='angelHalo'?I18n.t("text.the.broken.halo.s.faint.light.curls.around.the"):I18n.t("text.the.horn.feels.cold.yet.embers.pulse.within.it"));}
 if(c.type==='ability'){if(!abilities[realm]){abilities[realm]=true;persist();updateHUD();story(I18n.t("text.new.ability"),level.ability.name,realm===0?I18n.t("story.space.jump.release.it.and.press.it.again.in"):I18n.t("story.k.spirit.dash.you.are.briefly.invulnerable.and.can"));}else story(I18n.t("text.haru.s.memory"),I18n.t("text.we.always.find.our.way.home"),I18n.t("text.if.you.lose.your.way.seek.the.shrines.light"));}
 if(['bell','rescue','memory'].includes(c.type)){const o=c.object;if(o.group&&enemies.some(e=>e.group===o.group&&!e.dead)){toast(I18n.t("text.the.soul.s.captors.are.still.alive.defeat.them"));return;}flags[realm].push(o.id);shards+=o.type==='memory'?8:5;if(o.type==='memory')player.hp=player.maxHp;persist();updateHUD();burst(o.x,o.y-70,realms[realm].gold,28);tone(660,.6);const text=o.type==='bell'?(hasFlag('forestBell')&&hasFlag('villageBell')?I18n.t("text.the.two.bells.ring.together.the.bamboo.temple.s"): I18n.t("text.the.bell.echoes.through.the.forest.another.may.answer")):o.type==='rescue'?(hasFlag('soulUpper')&&hasFlag('soulLower')?I18n.t("text.the.two.freed.souls.have.broken.the.abyss.seal"):I18n.t("text.the.soul.thanks.you.the.other.captive.awaits.deeper")):I18n.t("text.an.old.memory.of.haru.warms.the.amulet.you");story(o.type==='memory'?I18n.t("text.a.gift.from.a.hidden.path"):I18n.t("text.the.path.answers"),o.name,text);}
 if(c.type==='portal'){if(!defeated[realm])toast(I18n.t("text.the.guardian.s.oath.seals.this.passage"));else{const n=realm+1;enterRealm(n);persist();story(realms[n].label,realms[n].name,realms[n].intro);}}
 if(c.type==='father'){state='won';persist();showHUD(false);story(I18n.t("text.the.three.worlds.are.united"),I18n.t('story.home.title'),I18n.t("story.haru.kneels.before.the.little.samurai.i.knew.you"),()=>{state='won';$('dialog').hidden=false;$('dialogLabel').textContent=I18n.t("text.the.journey.s.end");$('dialogTitle').textContent=I18n.t("text.together.again");$('dialogText').innerHTML=I18n.t("text.both.bells.have.rung.the.captive.souls.are.free");$('dialogOk').textContent=I18n.t("text.back.to.main.menu");$('dialogOk').onclick=mainMenu;});}}
function gatePass(g){if(g.kind==='secretRock')return false;if(g.kind==='fragile')return hasFlag(g.id);if(defeated[realm])return true;if(g.kind==='root')return false;if(g.kind==='bells')return hasFlag('forestBell')&&hasFlag('villageBell');if(g.kind==='souls')return hasFlag('soulUpper')&&hasFlag('soulLower');if(g.kind==='shadow')return dash>0;return hasFlag(g.id);}
function guardianDefeated(){if(boss.dead||boss.hp>0||!bossStarted)return;boss.dead=true;finishBossBattle();defeated[realm]=true;awardXP(100+realm*50);if(realm<2)abilities[realm]=true;shards+=20;checkpoint={...level.rests.find(r=>r.id===level.arena.restId)};persist();updateHUD();burst(boss.x+40,boss.y+40,realms[realm].gold,55);$('bossHud').hidden=true;story(I18n.t("text.a.soul.fragment.returns.home"),realm===0?I18n.t("text.the.bells.call.you.home"):realm===1?I18n.t("text.the.dawnblade.awakens"):I18n.t("text.the.last.wind"),realm===0?I18n.t("story.haru.s.first.memory.returns.the.glowing.torii.has"):realm===1?I18n.t("story.haru.s.second.memory.has.set.momo.s.sword"):I18n.t("text.the.final.guardian.bows.a.new.wind.stream.shines"));}
function melee(){if(attackCooldown>0)return false;attack=SWORD_DURATION;attackCooldown=.34;attackElapsed=0;attackFace=player.face;attackHit=false;tone(defeated[1]?430:300,.1,'triangle',.025);return true;}
function advanceSwordAttack(dt){if(attack<=0)return;attackElapsed=Math.min(SWORD_DURATION,attackElapsed+dt);if(!attackHit&&attackElapsed>=SWORD_IMPACT){attackHit=true;shake=.04;resolveMeleeHit();}}
function resolveMeleeHit(){const hit={x:attackFace>0?player.x+20:player.x-105,y:player.y-14,w:125,h:105};for(const e of enemies){if(e.dead||!overlap(hit,e))continue;if(e.miniboss){if(!e.active||e.inv>0)continue;e.hp-=momoStats().damage;e.inv=.22;burst(e.x+e.w/2,e.y+30,realms[realm].gold);if(e.hp<=0)killEnemy(e);continue;}const front=Math.sign(player.x+player.w/2-e.x-e.w/2)===e.face,above=player.y+player.h<e.y+e.h*.55;
 if(e.kind==='shield'&&front&&!above&&dash<=0&&e.guardBreak<=0&&e.recovery<=0){e.blocks++;e.blockFlash=.3;burst(e.x+e.w/2+e.face*24,e.y+30,'#eee0ad',9);tone(610,.08,'triangle',.03);if(e.blocks>=3){e.blocks=0;e.guardBreak=1.6;e.recovery=1.6;e.windup=0;toast(I18n.t("text.the.shield.is.broken.strike.now.or.get.behind"));}continue;}
 e.hp-=momoStats().damage;e.stun=.35;e.windup=0;e.guardBreak=Math.max(e.guardBreak,dash>0?.7:0);e.x=clamp(e.x+attackFace*18,e.origin-e.patrol,e.origin+e.patrol);burst(e.x+20,e.y+20,realms[realm].gold);if(e.hp<=0)killEnemy(e);}
 if(bossStarted&&!boss.dead&&overlap(hit,boss))hitBoss(momoStats().damage);
 for(const g of level.gates)if(g.kind==='fragile'&&!gatePass(g)&&overlap(hit,g)){flags[realm].push(g.id);persist();burst(g.x+g.w/2,player.y+35,'#b4a99b',32);toast(I18n.t("text.cold.air.flows.from.behind.the.rock.wall"));}
 if(defeated[1])for(const g of level.gates){if(g.kind==='fire'&&!gatePass(g)&&overlap(hit,g)){flags[realm].push(g.id);persist();burst(player.x+20,player.y-10,'#f3d494',30);toast(I18n.t("text.the.dawnblade.has.broken.the.seal"));updateHUD();}}
 for(const p of projectiles)if(overlap(hit,{x:p.x-7,y:p.y-7,w:14,h:14}))p.life=0;}
function input(dt){const move=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);if(move)player.face=move;
 if(pressed.has(' ')||pressed.has('w')||pressed.has('arrowup'))jumpBuffer=.13;
 const support=platforms.find(p=>p.id===player.support);
 if(jumpBuffer>0&&keys.has('s')&&player.onGround&&support?.drop){dropTimer=.22;player.y+=8;player.vy=100;player.onGround=false;player.support=null;player.jumps=1;jumpBuffer=0;coyote=0;}
 const grounded=player.onGround||coyote>0;if(jumpBuffer>0&&(grounded||(abilities[0]&&player.jumps<2))){const airJump=!grounded;player.vy=airJump?-650:-590;player.jumps=airJump?2:1;player.onGround=false;player.support=null;coyote=0;jumpBuffer=0;burst(player.x+20,player.y+69,airJump?'#f0df9c':'#d8e3c9',airJump?16:7);tone(airJump?550:380,.12);}
 if(pressed.has('j')||pressed.has('z'))melee();if((pressed.has('k')||pressed.has('shift'))&&abilities[1]&&dashCooldown<=0){dash=.2;dashCooldown=momoStats().dashCooldown;player.vy=0;burst(player.x+20,player.y+30,'#c8a8ed',14);tone(180,.2,'triangle',.035);}if(pressed.has('e'))interact();if(pressed.has('u'))showTraining();const target=move*285;player.vx=dash>0?player.face*1100:player.vx+(target-player.vx)*Math.min(1,dt*13);}
function movingPlatforms(dt){levelTime+=dt;for(const p of platforms){const oldX=p.x;if(p.kind==='moving')p.x=p.baseX+Math.sin(levelTime*p.speed+p.phase)*p.range;p.dx=p.x-oldX;if(player.onGround&&player.support===p.id)player.x+=p.dx;}}
function movePlayer(dt){const before={x:player.x,y:player.y},wasGround=player.onGround;player.x=clamp(player.x+player.vx*dt,0,level.width-player.w);
 for(const g of level.gates){if(gatePass(g)||!overlap(player,g))continue;if(before.x+player.w<=g.x+1){player.x=g.x-player.w;player.vx=0;}else if(before.x>=g.x+g.w-1){player.x=g.x+g.w;player.vx=0;}}
 player.vy=Math.min(980,player.vy+(dash>0?0:1550*dt));if(!player.onGround&&dash<=0)for(const w of level.winds){if(w.afterBoss&&!defeated[realm])continue;if(overlap(player,w)){player.vy=Math.min(player.vy,-430);player.inv=Math.max(player.inv,.03);}}
 player.y+=player.vy*dt;player.onGround=false;player.support=null;
 for(const p of platforms){if(p.broken||dropTimer>0&&p.drop)continue;if(player.x+player.w>p.x&&player.x<p.x+p.w&&player.vy>=0&&before.y+player.h<=p.y+3&&player.y+player.h>=p.y){player.y=p.y-player.h;player.vy=0;player.onGround=true;player.jumps=0;player.support=p.id;}}
 for(const g of level.gates){if(gatePass(g)||!overlap(player,g))continue;if(player.vy>=0&&before.y+player.h<=g.y+3){player.y=g.y-player.h;player.vy=0;player.onGround=true;player.jumps=0;player.support='gate:'+g.id;}else if(player.vy<0&&before.y>=g.y+g.h-3){player.y=g.y+g.h;player.vy=0;}else{player.x=before.x;}}
 if(wasGround&&!player.onGround&&player.vy>=0)coyote=.1;if(player.y>level.height+180)revive(true);}
function shoot(x,y,vx,vy,color,life=4,kind='orb'){projectiles.push({x,y,vx,vy,color,life,kind});}

function update(dt){time+=dt;toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('visible');if(state!=='play')return;attack=Math.max(0,attack-dt);attackCooldown-=dt;dash=Math.max(0,dash-dt);dashCooldown-=dt;jumpBuffer-=dt;coyote-=dt;dropTimer-=dt;player.inv=Math.max(0,player.inv-dt);shake=Math.max(0,shake-dt);movingPlatforms(dt);input(dt);if(state!=='play'){pressed.clear();return;}movePlayer(dt);discoverSecrets();advanceSwordAttack(dt);if(state!=='play'){pressed.clear();return;}updateEnemies(dt);
 for(const h of level.hazards)if(overlap(player,h))damage(1,player.vx>=0?-1:1);
 const a=level.arena;if(!boss.dead&&player.x+player.w>(a.triggerX??a.x)&&player.x<a.x+a.w&&Math.abs(player.y+player.h-a.y)<160){bossStarted=true;if(!visits.has('boss')){visits.add('boss');checkpoint={...level.rests.find(r=>r.id===a.restId)};if(!visitedRests[realm].includes(checkpoint.id))visitedRests[realm].push(checkpoint.id);persist();toast(realm===0?I18n.t("text.raised.sword.dodge.the.guardian.is.vulnerable.after.the"):realm===1?I18n.t("text.watch.for.cracks.in.the.ground.when.lava.rises"):I18n.t("text.gold.signals.light.arrows.violet.signals.shadow.magic.keep"));}}
 updateBoss(dt);for(const p of projectiles){p.life-=dt;if(p.kind==='arrow')p.vy+=55*dt;if(p.gravity)p.vy+=p.gravity*dt;const beforeX=p.x,beforeY=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;const radius=p.radius||7;const swept={x:Math.min(beforeX,p.x)-radius,y:Math.min(beforeY,p.y)-radius,w:Math.abs(p.x-beforeX)+radius*2,h:Math.abs(p.y-beforeY)+radius*2};if(p.life>0&&overlap(player,swept)){damage(p.damage||1,p.vx>0?1:-1);p.life=0;}}projectiles=projectiles.filter(p=>p.life>0);
 for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=500*dt;}particles=particles.filter(p=>p.life>0);
 for(const r of level.rests)if(pointNear(r,105,85)&&!visitedRests[realm].includes(r.id)){visitedRests[realm].push(r.id);checkpoint={...r};persist();toast(I18n.t("text.new.shrine")+r.name+I18n.t("text.fast.travel.here.from.the.map"));}
 camera+=(clamp(player.x-viewW*.43,0,Math.max(0,level.width-viewW))-camera)*Math.min(1,dt*6);cameraY+=(clamp(player.y-H*.54,0,Math.max(0,level.height-H))-cameraY)*Math.min(1,dt*8);
 context=getContext();$('prompt').hidden=!context;if(context)$('prompt').textContent=I18n.t(context.text);const region=(level.secrets||[]).find(z=>overlap(player,z))||level.zones.find(z=>overlap(player,z));$('areaLabel').textContent=I18n.t((region?.name||realms[realm].name)+(realm===1?' · '+Math.max(0,Math.round((player.y+69-450)/10))+I18n.t("text.m.deep"):realm===2?' · '+Math.max(0,Math.round((6300-player.y-69)/10))+I18n.t("text.m.high"):''));updateHUD();
 if(sound){musicClock-=dt;if(musicClock<=0){const notes=[220,261.63,293.66,329.63,392];tone(notes[Math.floor(time*.3)%5]*(realm===2?2:1),1.8,'sine',.02);musicClock=1.6;}}pressed.clear();}
function draw(){ctx.save();ctx.clearRect(0,0,viewW,H);const r=realms[realm];background(r);if(state==='menu'){ctx.save();ctx.translate(-500,-400);drawLandscape(r,levels[0].platforms);ctx.restore();drawTorii(Math.min(viewW*.8,1180),600,r);drawMenuMomo(Math.min(viewW*.68,880),616,Math.min(180,Math.max(100,viewW*.28)));ctx.restore();return;}
 ctx.save();ctx.translate(-camera+(shake>0?(noise(time*500)-.5)*10:0),-cameraY);Visuals.secretScenery(r);drawWinds(r);drawLandscape(r,platforms);drawKibaCurrent();for(const rest of level.rests)if(visiblePoint(rest))drawShrine(rest.x,rest.y,r,false);if(level.ability&&visiblePoint(level.ability))drawShrine(level.ability.x,level.ability.y,r,true);if(level.exit&&visiblePoint(level.exit))drawTorii(level.exit.x,level.exit.y,r);drawGates(r);drawObjects(r);drawHazards(r);Visuals.bossEffects(r);
 for(const e of enemies)if(!e.dead&&visiblePoint({x:e.x,y:e.y},190))drawEnemy(e,r);if(visiblePoint({x:boss.x,y:boss.y},200)){if(!boss.dead)drawBoss(r);else drawSpirit(boss.x+45,boss.y+60,r.gold);}
 if(realm===2&&boss.dead&&visiblePoint(level.father)){drawMomo(level.father.x,level.father.y+4,90,0,Math.floor(time*3)%6,1);ctx.font='11px Manrope, sans-serif';ctx.fillStyle=r.gold;ctx.textAlign='center';ctx.fillText(I18n.t('HARU'),level.father.x,level.father.y-105);}
 for(const p of projectiles)Visuals.projectile(p);
 for(const p of particles){ctx.globalAlpha=clamp(p.life*2,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);}ctx.globalAlpha=1;
 drawPlayer();ctx.restore();const v=ctx.createLinearGradient(0,0,0,H);v.addColorStop(0,'#08121945');v.addColorStop(.3,'#08121900');v.addColorStop(.75,'#08121900');v.addColorStop(1,'#08121988');ctx.fillStyle=v;ctx.fillRect(0,0,viewW,H);ctx.restore();}
function visiblePoint(p,margin=280){return p.x>camera-margin&&p.x<camera+viewW+margin&&p.y>cameraY-margin&&p.y<cameraY+H+margin;}
function drawKibaCurrent(){const weak=realm===0&&player.y>1150;ctx.save();ctx.lineWidth=realm===1?2:1.5;ctx.strokeStyle=realm===1?'#c872b8':realm===2?'#e8d89b':'#addbb5';for(let i=0;i<(weak?7:22);i++){const x=camera+noise(i*14.7+realm)*viewW+Math.sin(time*.7+i)*18,y=cameraY+noise(i*29.3+realm*17)*H;ctx.globalAlpha=(weak?.14:.24)+Math.sin(time*2+i)*.08;ctx.beginPath();ctx.moveTo(x,y);if(realm===1){ctx.lineTo(x+8,y-9);ctx.lineTo(x+2,y-18);}else{ctx.quadraticCurveTo(x+8+Math.sin(time+i)*5,y-12,x+6,y-26);}ctx.stroke();}ctx.restore();}
function background(r){Visuals.backdrop(r);}

function drawLandscape(r,items){Visuals.terrain(r,items);}

function drawWinds(r){Visuals.winds(r);}
function drawGates(r){Visuals.gates(r);}

function drawObjects(r){Visuals.objects(r);}

function drawHazards(r){Visuals.hazards(r);}

function drawBat(e,r){Visuals.actor(e,r);}

function fastTravel(rest){if(!visitedRests[realm].includes(rest.id))return;$('map').hidden=true;state='play';keys.clear();pressed.clear();checkpoint={...rest};initPlayer(rest);projectiles=[];if(!boss.dead)resetBossBattle();resetMinibosses();bossStarted=false;resetCamera();persist();updateHUD();toast(I18n.t("text.light.path")+rest.name);}
function showMap(){if(state!=='play')return;state='map';keys.clear();pressed.clear();$('mapContent').replaceChildren();const box=document.createElement('div');box.className='world-map';const width=620,height=320,pad=16,s=Math.min((width-pad*2)/level.width,(height-pad*2)/level.height),ox=(width-level.width*s)/2,oy=(height-level.height*s)/2;const X=x=>ox+x*s,Y=y=>oy+y*s;
 let svg=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${realms[realm].name} térképe"><rect x="${ox}" y="${oy}" width="${level.width*s}" height="${level.height*s}" fill="#0b1920" stroke="#60706a" stroke-width="1"/>`;for(const p of platforms.filter(p=>!p.secretArea||secretKnown(p.secretArea)))svg+=`<line x1="${X(p.x)}" y1="${Y(p.y)}" x2="${X(p.x+p.w)}" y2="${Y(p.y)}" stroke="#9da68e" stroke-width="2"/>`;for(const w of level.winds)if(!w.afterBoss||defeated[realm])svg+=`<rect x="${X(w.x)}" y="${Y(w.y)}" width="${Math.max(3,w.w*s)}" height="${w.h*s}" fill="#dfc68844"/>`;for(const o of level.objects.filter(o=>!o.secretArea||secretKnown(o.secretArea)&&relicUnlocked(o)))svg+=`<circle cx="${X(o.x)}" cy="${Y(o.y)}" r="3" fill="${hasFlag(o.id)?'#718679':'#dfba76'}"/>`;if(level.ability)svg+=`<text x="${X(level.ability.x)-4}" y="${Y(level.ability.y)-5}" fill="#f4cf8a" font-size="12">✦</text>`;svg+=`<text x="${X(level.boss.x)-4}" y="${Y(level.boss.y)-6}" fill="${defeated[realm]?'#718679':'#d98877'}" font-size="12">◆</text>`;
 for(const r of level.rests)svg+=`<circle cx="${X(r.x)}" cy="${Y(r.y)}" r="3" fill="${visitedRests[realm].includes(r.id)?'#a6c9c5':'#465959'}"/>`;svg+=`<circle cx="${X(player.x+21)}" cy="${Y(player.y+69)}" r="5" fill="#f0dfb1" stroke="#fff" stroke-width="1"/></svg>`;box.innerHTML=I18n.t(svg);$('mapContent').append(box);
 const label=document.createElement('p');label.className='travel-label';label.textContent=I18n.t(realms[realm].name+I18n.t("text.light.paths.to.discovered.shrines"));$('mapContent').append(label);const grid=document.createElement('div');grid.className='travel-grid';for(const r of level.rests){const b=document.createElement('button');b.textContent=I18n.t((visitedRests[realm].includes(r.id)?'⛩ ':'· ')+I18n.t(r.name));b.disabled=!visitedRests[realm].includes(r.id);b.onclick=()=>fastTravel(r);grid.append(b);}$('mapContent').append(grid);$('map').hidden=false;$('closeMap').focus();}
function closeMap(){$('map').hidden=true;state='play';pressed.clear();}
function pause(){if(state==='play'){state='pause';keys.clear();$('pause').hidden=false;$('resumeButton').focus();}else if(state==='pause'){state='play';$('pause').hidden=true;pressed.clear();}}
function mainMenu(){state='menu';realm=0;level=levels[0];camera=500;cameraY=400;for(const id of ['dialog','map','pause','training','prompt','bossHud'])$(id).hidden=true;$('menu').hidden=false;showHUD(false);keys.clear();$('continueButton').hidden=!saved;}
$('startButton').onclick=()=>startGame(false);$('continueButton').onclick=()=>startGame(true);$('pauseButton').onclick=pause;$('resumeButton').onclick=pause;$('mainMenuButton').onclick=mainMenu;$('mapButton').onclick=showMap;$('closeMap').onclick=closeMap;
$('helpButton').onclick=()=>story(I18n.t("text.rules.of.the.path"),I18n.t("text.three.worlds.three.directions.db9129"),I18n.t("story.a.d.or.arrow.keys.move.space.jump.after"),mainMenu);
$('soundButton').onclick=()=>{sound=!sound;$('soundButton').textContent=I18n.t(sound?I18n.t("text.sound.on"):I18n.t("text.sound.off"));if(sound){tone(440,.2);audio?.resume();}};
function keyName(e){return e.code==='Space'||e.key==='Spacebar'?' ':e.key.toLowerCase();}
function handleKeyDown(e){const k=keyName(e);if(e.target?.closest?.('button,summary,select,input,textarea,a')&&[' ','enter','arrowup','arrowdown','arrowleft','arrowright'].includes(k))return;if(state==='play'&&[' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(e.repeat)return;if(k==='escape'){if(state==='training'){closeTraining();return;}if(state==='map')closeMap();else pause();return;}if(k==='m'){if(state==='map')closeMap();else showMap();return;}if(state==='play'){keys.add(k);pressed.add(k);}}
function handleKeyUp(e){keys.delete(keyName(e));}
addEventListener('keydown',handleKeyDown);addEventListener('keyup',handleKeyUp);addEventListener('blur',()=>{keys.clear();pressed.clear();if(state==='play')pause();});
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();if(state!=='play')return;b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);pressed.add(b.dataset.key);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(b.dataset.key));});
sheet.onload=()=>{loadingReady=true;};sheet.onerror=()=>toast(I18n.t("text.momo.s.artwork.could.not.be.loaded.please.reload"));if(sheet.complete&&sheet.naturalWidth)loadingReady=true;
function frame(ms){const dt=Math.min((ms-last)/1000||0,.033);last=ms;update(dt);draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
I18n.applyDOM();
I18n.onChange(()=>{if(player)updateHUD();if(state==='map')showMap();if(state==='training')refreshTraining();$('soundButton').textContent=I18n.t(sound?I18n.t("text.sound.on"):I18n.t("text.sound.off"));if($('toast').textContent)$('toast').textContent=I18n.t($('toast').textContent);});
for(const select of document.querySelectorAll('.language-picker select'))select.addEventListener('change',e=>I18n.setLocale(e.target.value));

/* Sprite and character rendering */
function tree(x,y,h,layer,r){ctx.save();const w=h*.24;ctx.fillStyle=layer===0?r.sky[0]+'88':layer===1?r.sky[0]+'dd':(realm===1?'#231d30':'#1c3837');ctx.fillRect(x-4,y-h,8,h);if(realm===2){ctx.globalAlpha=.4;}for(let j=0;j<5;j++){const yy=y-h+j*h*.15;ctx.beginPath();ctx.moveTo(x,yy);ctx.lineTo(x-w*(.45+j*.13),yy+h*.28);ctx.quadraticCurveTo(x,yy+h*.19,x+w*(.45+j*.13),yy+h*.28);ctx.closePath();ctx.fill();}ctx.restore();}
function drawTorii(x,y,r){Visuals.torii(x,y,r);}

function drawShrine(x,y,r,ability){Visuals.shrine(x,y,r,ability);}

function drawMomo(x,feet,size,row,frame,face){if(!sheet.complete||!sheet.naturalWidth)return;ctx.save();ctx.translate(x,feet);if(row!==1&&row!==2&&face<0)ctx.scale(-1,1);const hh=size*208/192;ctx.drawImage(sheet,frame*192,row*208,192,208,-size/2,-hh,size,hh);ctx.restore();}
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
 const feet=player.y+player.h+5,x=player.x+player.w/2;
 const row=!player.onGround?4:Math.abs(player.vx)>35?(player.face>0?1:2):0,counts=[6,8,8,4,5,8,6,6,6],frame=Math.floor(time*(row===1||row===2?12:5))%counts[row];
 if(dash>0){ctx.globalAlpha=.2;if(attack>0)Visuals.momoSlash(x-player.face*50,feet,92,attackElapsed,attackFace);else drawMomo(x-player.face*50,feet,92,row,frame,player.face);ctx.globalAlpha=1;}
 if(!(player.inv>0&&Math.floor(time*14)%2)){if(attack>0)Visuals.momoSlash(x,feet,96,attackElapsed,attackFace);else drawMomo(x,feet,96,row,frame,player.face);}
 if(attack>0&&attackElapsed>=SWORD_IMPACT&&attackElapsed<.3)drawSlash();
}
function collectedRelics(){return ['angelHalo','demonHorn'].filter(id=>flags[0].includes(id));}
function updateRelicHUD(){const items=collectedRelics();$('relicInventory').hidden=!items.length;$('relicInventory').textContent=I18n.t(items.map(id=>id==='angelHalo'?I18n.t("text.angel.s.halo"):I18n.t("text.demon.lord.s.horn")).join(' · '));}
