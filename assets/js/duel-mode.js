/* Match coordinator. Journey globals are never used as duel combat state. */
'use strict';
const DuelMode=(()=>{
 let active=false,session=null,epoch=0,loader=null,sim=null,local=0,ready=[false,false],loadouts=['katana','katana'];
 let match=0,round=1,scores=[0,0],finished=false,rematch=[false,false],countdown=0,scored=false;
 let held=new Set(),pulses=new Set(),remoteInput=DuelRules.input(),remoteBlocked=false,blocked=false;
 let accumulator=0,networkClock=0,seq=0,remoteSeq=-1,lastRemote=0,statusKey='duel.waiting',connected=false;
 const node=id=>document.getElementById(id),tr=(key,args)=>args?I18n.format(key,args):I18n.t(key);
 const record=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
 const safe=n=>Number.isSafeInteger(n)&&n>=0,now=()=>performance.now();
 const role=()=>session?.role;
 function loadPeer(){
  if(globalThis.Peer)return Promise.resolve(globalThis.Peer);
  if(loader)return loader;
  loader=new Promise((resolve,reject)=>{
   const script=document.createElement('script'),timer=setTimeout(()=>fail(),20000);
   function fail(){clearTimeout(timer);script.remove();loader=null;reject(Error('connection'));}
   script.src='assets/vendor/peerjs-1.5.5.min.js?v=1.5.5';script.onload=()=>{clearTimeout(timer);if(globalThis.Peer)resolve(globalThis.Peer);else fail();};script.onerror=fail;document.head.append(script);
  });return loader;
 }
 function clearInput(){held.clear();pulses.clear();remoteInput=DuelRules.input();accumulator=0;keys.clear();pressed.clear();}
 function selected(){return node('duelWeapon').value;}
 function setStatus(key){statusKey=key;render();}
 function error(detail){connected=false;clearInput();const old=session;session=null;epoch++;old?.close();ready=[false,false];setStatus('duel.error.'+(Object.hasOwn({invalid:1,full:1,version:1,unsupported:1},detail)?detail:'connection'));}
 function open(){
  if(state!=='menu'||resolutionBlocked||DevSession.active||!loadingReady)return false;
  active=true;epoch++;sim=null;session=null;local=0;connected=false;statusKey='duel.waiting';loadouts=['katana','katana'];ready=[false,false];finished=false;match=0;scores=[0,0];round=1;clearInput();
  state='duel';node('menu').hidden=true;showHUD(false);node('duelPanel').hidden=false;node('duelHUD').hidden=true;node('duelWeapon').value='katana';node('duelCode').value='';render();node('duelCreate').focus();return true;
 }
 function leave(){
  if(!active)return false;active=false;epoch++;const old=session;session=null;old?.close();sim=null;connected=false;ready=[false,false];clearInput();
  node('duelPanel').hidden=true;node('duelHUD').hidden=true;node('duelResult').hidden=true;mainMenu();node('duelButton').focus();return true;
 }
 async function connect(host){
  if(!active||session)return false;
  const code=node('duelCode').value.trim().toUpperCase();
  if(!host&&!PeerSession.validCode(code)){setStatus('duel.error.invalid');return false;}
  const token=++epoch;local=host?0:1;ready=[false,false];connected=false;setStatus('duel.connecting');node('duelCreate').disabled=true;node('duelJoin').disabled=true;
  try{
   const Peer=await loadPeer();if(!active||token!==epoch)return false;
   session=PeerSession.create({Peer,version:GAME_RELEASE.version,onState:(next,detail)=>{
    if(!active||token!==epoch)return;
    if(next==='connected'){
     connected=true;ready=[false,false];lastRemote=now();loadouts[local]=selected();node('duelCode').value=session.code;setStatus('duel.waiting');sendLoadout();
    }else if(next==='waiting'){node('duelCode').value=session?.code||'';setStatus('duel.waiting');}
    else if(next==='error')error(detail);
    else if(next==='closed'){connected=false;ready=[false,false];clearInput();setStatus('duel.disconnected');}
   },onMessage:data=>{if(active&&token===epoch)receive(data);}});
   if(host)session.host();else session.join(code);render();return true;
  }catch{if(active&&token===epoch){session?.close();session=null;error('connection');}return false;}
 }
 function send(data){return !!session?.send(data);}
 function sendLoadout(){send({type:'loadout',weapon:loadouts[local],ready:ready[local]});}
 function markReady(){if(!connected||sim)return;loadouts[local]=selected();ready[local]=true;sendLoadout();maybeStart();render();}
 function maybeStart(){if(role()==='host'&&ready.every(Boolean)&&!sim)startMatch();}
 function randomArena(){const n=new Uint32Array(1);crypto.getRandomValues(n);return n[0]%DuelRules.arenas.length;}
 function startMatch(){scores=[0,0];round=1;finished=false;rematch=[false,false];match++;startRound(randomArena());}
 function startRound(arena){
  sim=DuelRules.create({arena,weapons:loadouts});scored=false;countdown=0;clearInput();seq=0;remoteSeq=-1;remoteBlocked=true;lastRemote=now();
  sendState('start');enterArena();
 }
 function enterArena(){node('duelPanel').hidden=true;node('duelHUD').hidden=false;node('duelResult').hidden=true;render();canvas.focus?.();}
 function sendState(type='state'){
  if(!sim)return;send({type,match,round,scores:[...scores],finished,countdown,paused:blocked||remoteBlocked,snapshot:DuelRules.snapshot(sim)});
 }
 function validState(data){
  return record(data,['type','match','round','scores','finished','countdown','paused','snapshot'])&&safe(data.match)&&data.match>0&&safe(data.round)&&data.round>0&&data.round<10000&&Array.isArray(data.scores)&&data.scores.length===2&&data.scores.every(n=>Number.isInteger(n)&&n>=0&&n<=2)&&typeof data.finished==='boolean'&&typeof data.paused==='boolean'&&Number.isFinite(data.countdown)&&data.countdown>=0&&data.countdown<=3&&DuelRules.validSnapshot(data.snapshot)&&data.finished===data.scores.some(n=>n===2);
 }
 function receive(data){
  if(!connected||!data||typeof data!=='object')return;
  if(data.type==='loadout'&&record(data,['type','weapon','ready'])&&!sim&&WeaponStyles.valid(data.weapon)&&typeof data.ready==='boolean'){
   loadouts[1-local]=data.weapon;ready[1-local]=data.ready;maybeStart();render();return;
  }
  if(role()==='host'){
   if(data.type==='input'&&record(data,['type','match','round','seq','input','blocked'])&&sim&&data.match===match&&data.round===round&&safe(data.seq)&&data.seq>remoteSeq&&DuelRules.validInput(data.input)&&typeof data.blocked==='boolean'){
    remoteSeq=data.seq;remoteInput=DuelRules.input(data.input);remoteBlocked=data.blocked;lastRemote=now();
   }else if(data.type==='rematch'&&record(data,['type','match'])&&data.match===match&&finished){rematch[1]=true;if(rematch.every(Boolean))startMatch();else render();}
   return;
  }
  if((data.type==='start'||data.type==='state')&&validState(data)){
   if(data.match<match||data.match===match&&data.round<round||data.match===match&&data.round===round&&sim&&data.snapshot.tick<sim.tick)return;
   if(data.type==='start'&&data.match===match&&data.round===round&&sim)return;
   if(data.type==='state'&&(!sim||data.match!==match||data.round!==round))return;
   const fresh=data.match!==match||data.round!==round||!sim;match=data.match;round=data.round;scores=[...data.scores];finished=data.finished;countdown=data.countdown;remoteBlocked=data.paused;sim=data.snapshot;lastRemote=now();
   if(fresh){clearInput();seq=0;rematch=[false,false];enterArena();focusChanged();}render();
  }else if(data.type==='rematch'&&record(data,['type','match'])&&data.match===match&&finished){rematch[0]=true;render();}
 }
 function voteRematch(){if(!sim||!finished||!connected)return;rematch[local]=true;send({type:'rematch',match});if(role()==='host'&&rematch.every(Boolean))startMatch();render();}
 function controls(){
  const down=action=>Bindings.read(action).some(k=>held.has(k)||pulses.has(k));
  return {move:Number(down('moveRight'))-Number(down('moveLeft')),jump:down('jump'),dash:down('dash'),attack:down('attack'),heavy:down('heavyAttack')};
 }
 function input(key,down,target){
  if(!active)return false;
  if(down&&sim&&!target?.closest?.('input,select')&&Bindings.read('pause').includes(key)){node('duelMatchLeave').focus();return true;}
  if(!sim||finished||down&&target?.closest?.('button,input,select,a,summary'))return false;
  const used=['moveLeft','moveRight','jump','dash','attack','heavyAttack'].some(action=>Bindings.read(action).includes(key));if(!used)return false;
  if(down&&!held.has(key))pulses.add(key);if(down)held.add(key);else held.delete(key);return true;
 }
 function focusChanged(){
  if(!active)return;clearInput();blocked=resolutionBlocked||document.hidden||!document.hasFocus();
  if(connected&&sim){if(role()==='host')sendState();else send({type:'input',match,round,seq:++seq,input:DuelRules.input(),blocked});}
 }
 function update(dt,small=false){
  if(!active)return;
  const nextBlocked=small||document.hidden||!document.hasFocus();if(blocked!==nextBlocked){clearInput();blocked=nextBlocked;}
  if(!sim||!connected)return;
  networkClock+=Math.min(.1,Math.max(0,dt));
  if(role()==='guest'){
   if(networkClock>=1/30){networkClock=0;send({type:'input',match,round,seq:++seq,input:blocked?DuelRules.input():controls(),blocked});pulses.clear();}return;
  }
  if(!blocked&&!remoteBlocked&&!finished){
   accumulator=Math.min(.1,accumulator+Math.max(0,dt));
   while(accumulator>=1/60){
    accumulator-=1/60;
    if(sim.winner!==null){
     if(!scored){scored=true;if(Number.isInteger(sim.winner))scores[sim.winner]++;finished=scores.some(n=>n===2);countdown=finished?0:3;render();}
     else if(!finished){countdown=Math.max(0,countdown-1/60);if(countdown<=0){round++;startRound(sim.arena);break;}}
    }else{DuelRules.step(sim,[controls(),now()-lastRemote<250?remoteInput:DuelRules.input()],1/60);pulses.clear();}
   }
  }else accumulator=0;
  if(networkClock>=1/30){networkClock=0;sendState();render();}
 }
 function render(){
  if(!active)return;
  const labels={duelTitle:'duel.title',duelButton:'duel.title',duelCreate:'duel.create',duelJoin:'duel.join',duelCodeLabel:'duel.code',duelWeaponLabel:'inventory.weapon.slot',duelReady:'duel.ready',duelLeave:'duel.leave',duelMatchLeave:'duel.leave',duelRematch:'duel.rematch',duelPrivacy:'duel.privacy',duelRules:'duel.rules',duelPauseInfo:'duel.pauseInfo'};
  for(const [id,key]of Object.entries(labels))node(id).textContent=tr(key);
  for(const option of node('duelWeapon').options)option.textContent=tr('weapon.'+option.value+'.name');
  node('duelStatus').textContent=tr(statusKey);node('duelCode').readOnly=!!session;node('duelCreate').disabled=!!session;node('duelJoin').disabled=!!session;
  node('duelWeapon').disabled=ready[local]||!!sim;node('duelReady').disabled=!connected||ready[local]||!!sim;
  node('duelReady').setAttribute('aria-pressed',String(ready[local]));
  renderParticipants();
  if(!sim)return;
  node('duelScore').textContent=tr('duel.score',[round,scores[local],scores[1-local]]);
  for(let i=0;i<2;i++){const p=sim.players[i],label=node('duelFighter'+i),health=node('duelHealth'+i);label.textContent=tr(i===local?'duel.you':'duel.opponent')+' · '+tr('weapon.'+p.weapon+'.name');health.max=p.maxHp;health.value=p.hp;health.setAttribute('aria-label',label.textContent+' '+CampHealth.number(p.hp)+' / '+p.maxHp);node('duelHP'+i).textContent=CampHealth.number(p.hp)+' / '+p.maxHp;}
  const result=sim.winner===null?'':tr(sim.winner==='draw'?'duel.draw':sim.winner===local?'duel.victory':'duel.defeat');
  node('duelResult').hidden=sim.winner===null;node('duelResultTitle').textContent=result;
  node('duelNext').textContent=finished?(rematch[1-local]?tr('duel.rematchWaiting'):''):tr('duel.next',[Math.ceil(countdown)]);
  node('duelRematch').hidden=!finished;node('duelRematch').disabled=rematch[local]||!connected;
  node('duelLiveStatus').textContent=!connected?tr(statusKey):(blocked||remoteBlocked)?tr('binding.action.pause'):'';
  node('duelInputHints').textContent=['moveLeft','moveRight','jump','dash','attack','heavyAttack'].map(action=>bindingKeyLabel(Bindings.read(action)[0])+' · '+tr('binding.action.'+action)).join('   |   ');
 }
 function renderParticipants(){
  // PeerSession emits connected only after the versioned hello/ack exchange.
  // A generated room code, signaling socket or stale ready bit is insufficient.
  const waiting=statusKey==='duel.connecting'?'duel.connecting':statusKey==='duel.disconnected'||statusKey.startsWith('duel.error.')?'duel.disconnected':'duel.waiting';
  const attribute=(element,key,value)=>{if(element.getAttribute?.(key)!==value)element.setAttribute(key,value);},text=(element,value)=>{if(element.textContent!==value)element.textContent=value;};
  attribute(node('duelParticipants'),'aria-live','polite');
  for(const [suffix,index,label]of [['Local',local,'duel.you'],['Remote',1-local,'duel.opponent']]){
   const row=node('duelParticipant'+suffix),icon=node('duelParticipant'+suffix+'Icon'),status=node('duelParticipant'+suffix+'Ready');
   DuelAppearance.icon(icon,index);attribute(row,'data-team',String(index));attribute(row,'data-connected',String(connected));attribute(row,'data-ready',String(connected&&ready[index]));if(icon.hidden!==!connected)icon.hidden=!connected;
   text(node('duelParticipant'+suffix+'Name'),tr(label));
   text(node('duelParticipant'+suffix+'Connection'),tr(connected?'duel.connected':waiting));
   if(status.hidden!==!connected)status.hidden=!connected;text(status,connected&&ready[index]?'✓ '+tr('duel.readyStatus'):tr('duel.notReady'));
  }
 }
 function draw(){
  if(!active)return false;
  const arena=sim?DuelRules.arenas[sim.arena]:DuelRules.arenas[0],image=Visuals.images[['japanBackdrop','yomiBackdrop','heavenBackdrop','shadowBackdrop'][arena.realm]];
  ctx.save();ctx.fillStyle='#101b20';ctx.fillRect(0,0,viewW,H);
  if(image?.complete&&image.naturalWidth){const cover=Math.max(viewW/image.naturalWidth,H/image.naturalHeight);ctx.drawImage(image,(viewW-image.naturalWidth*cover)/2,(H-image.naturalHeight*cover)/2,image.naturalWidth*cover,image.naturalHeight*cover);}
  ctx.fillStyle='#08121938';ctx.fillRect(0,0,viewW,H);
  if(sim){ctx.translate((viewW-1280)/2,0);Visuals.duelTerrain(arena.platforms,arena.realm);
   for(let i=0;i<2;i++)DuelAppearance.scope(i,()=>{
    const p=sim.players[i],x=p.x+p.w/2,feet=p.y+p.h;
    ctx.save();ctx.globalAlpha=p.hp<=0?.4:p.inv>0?.8:1;
    if(p.dashTime>0&&!reducedMotion.matches)Visuals.dashTrail(x-p.face*20,feet-35,p.face,1-p.dashTime/.16);
    if(p.attack)Visuals.momoSlash(x,feet,96,p.attack.elapsed/WeaponStyles.profile(p.weapon).tempo,p.attack.face,p.attack.kind,p.weapon);
    else{const row=!p.onGround?4:Math.abs(p.vx)>35?(p.face>0?1:2):0,frame=row===4?(p.vy< -260?1:p.vy<100?2:3):Math.floor(p.animationTime*(row===0?5:12))%(row===0?6:8);if(p.weapon==='naginata')Visuals.momoCarry(x,feet,96,p.face,p.weapon);drawMomo(x,feet,96,row,reducedMotion.matches?0:frame,p.face);if(p.weapon==='swordShield')Visuals.momoCarry(x,feet,96,p.face,p.weapon);}
    ctx.restore();ctx.fillStyle=i===0?'#ffaaa0':'#a9ceff';ctx.strokeStyle='#10212b';ctx.lineWidth=4;ctx.font='700 16px "Kiba UI",sans-serif';ctx.textAlign='center';const title=tr(i===local?'duel.you':'duel.opponent');ctx.strokeText(title,x,p.y-38);ctx.fillText(title,x,p.y-38);
    if(p.attack&&p.attack.elapsed<p.attack.impact){const box=WeaponStyles.hitbox(p.weapon,p,p.attack.face);ctx.save();ctx.strokeStyle='#ffd383';ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.strokeRect(box.x,box.y,box.w,box.h);ctx.restore();}
   });
  }ctx.restore();return true;
 }
 function init(){
  node('duelButton').onclick=open;node('duelCreate').onclick=()=>connect(true);node('duelJoin').onclick=()=>connect(false);node('duelReady').onclick=markReady;node('duelLeave').onclick=leave;node('duelMatchLeave').onclick=leave;node('duelRematch').onclick=voteRematch;
  node('duelWeapon').onchange=()=>{if(sim)return;loadouts[local]=selected();ready[local]=false;sendLoadout();render();};
  I18n.onChange(()=>{node('duelButton').textContent=tr('duel.title');render();});node('duelButton').textContent=tr('duel.title');
  node('duelButton').disabled=!loadingReady;
  sheet.addEventListener('load',()=>{node('duelButton').disabled=false;});
  document.addEventListener('visibilitychange',focusChanged);addEventListener('blur',focusChanged);addEventListener('focus',focusChanged);addEventListener('pagehide',()=>{if(active)session?.close();});
 }
 return Object.freeze({init,open,leave,update,draw,input,focusChanged,get active(){return active;}});
})();
