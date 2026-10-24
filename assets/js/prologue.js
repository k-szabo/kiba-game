/* A playable nightmare. Its defeat leads to Japan, never to a shrine or boss reward. */
'use strict';
const Prologue=(()=>{
  const FLOOR=720,ARENA_LEFT=2940,ARENA_RIGHT=4230,SHADOW_X=3790,MAX_HP=100000;
  const dream=makeLevel('dream',4500,1000,{x:240,y:FLOOR});
  ledge(dream,'silent-path',0,FLOOR,4500,'ground',280);
  let phase='off',clock=0,battleTime=0,zoom=1,castIndex=0,heartbeat=0;
  let hazards=[],bolts=[],auto=null,cast=null;
  let animationTime=0,castVisual=null,deathPose=null,currentPose={clip:'idle',frame:0},previousPose=null,blendClock=.12;
  const active=()=>phase!=='off';
  function stop(){DevDamage.clear();phase='off';hazards=[];bolts=[];auto=cast=null;animationTime=0;castVisual=deathPose=previousPose=null;currentPose={clip:'idle',frame:0};blendClock=.12;$('game').classList.remove('dream-active');}
  function samplePose(){return ShadowAnimation.sample({auto,cast,release:castVisual,idleTime:reducedMotion.matches?0:animationTime,deathPose});}
  function setPose(pose){
    if(currentPose.clip!==pose.clip){previousPose={...currentPose};blendClock=0;}
    currentPose=pose;if(boss)boss.animation={...pose};
  }
  function start(){
    stop();if(!DevSession.active)weaponStyle='katana';phase='walk';clock=battleTime=castIndex=heartbeat=0;zoom=1;
    level=dream;platforms=dream.platforms.map(p=>({...p,dx:0}));enemies=[];particles=[];drops=[];projectiles=[];
    initPlayer(dream.start);player.inv=0;bossStarted=false;
    boss={x:SHADOW_X-270,y:FLOOR-440,w:460,h:440,hp:MAX_HP,max:MAX_HP,dead:false,inv:0,flash:0};
    camera=0;cameraY=FLOOR-H*.82;state='play';keys.clear();pressed.clear();
    $('game').classList.add('dream-active');showHUD(true);hud();
  }
  function hud(){
    $('realmLabel').textContent=I18n.t('prologue.label');$('questLabel').textContent=I18n.t('prologue.label');
    $('kibaCurrent').textContent=I18n.t('prologue.energy');$('areaLabel').textContent=I18n.t('prologue.place');
    CampHealth.render($('health'),player.hp,player.maxHp);
    $('dashHint').hidden=true;$('dropHint').hidden=true;
    $('jumpHint').textContent=I18n.t('text.jump.4e09c3');
    $('objective').textContent=I18n.t(phase==='walk'?'prologue.objective.walk':'prologue.objective.battle');
    $('bossHud').hidden=!['reveal','battle'].includes(phase);$('bossName').textContent=I18n.t('prologue.boss');
    $('bossHealth').style.width=(boss.hp/boss.max*100)+'%';
    $('bossHealth').parentElement?.setAttribute('aria-label',I18n.format('prologue.boss.health',[boss.hp,boss.max]));
    let warning=cast?.stage==='windup'?'prologue.warning.'+cast.kind:auto?.stage==='windup'?'prologue.warning.sweep':null;
    if(phase==='reveal')warning='prologue.warning.arrival';
    $('prompt').hidden=!warning;if(warning)$('prompt').textContent=I18n.t(warning);
  }
  function reveal(){
    phase='reveal';clock=0;player.vx=0;keys.clear();pressed.clear();bossStarted=true;
    tone(45,2,'sine',.035);
  }
  function lose(){
    if(!active()||['death','awakening'].includes(phase))return;
    deathPose=samplePose();setPose(deathPose);
    phase='death';clock=0;const before=player.hp;player.hp=0;DevDamage.record('incoming',player,before,player.hp);player.vx=player.vy=0;attack=dash=0;
    keys.clear();pressed.clear();hazards=[];bolts=[];auto=cast=castVisual=null;shake=.25;
    burst(player.x+21,player.y+30,'#bd91df',35);showHUD(false);$('bossHud').hidden=true;$('prompt').hidden=true;
    tone(48,1.5,'sawtooth',.025);
  }
  function hurt(amount,unavoidable=false,bypassArmor=false){
    if(DevImmortality.active)return;
    if(phase!=='battle'||!unavoidable&&player.inv>0)return;
    const received=unavoidable||bypassArmor?amount:Armor.damage(amount,momoStats().armor);
    const before=player.hp;player.hp=Math.max(0,player.hp-received);DevDamage.record('incoming',player,before,player.hp);player.inv=1.15;shake=reducedMotion.matches?0:.15;
    burst(player.x+21,player.y+30,'#d6a4f5',18);tone(80,.25,'sawtooth',.03);
    if(!player.hp)lose();else hud();
  }
  function hit(amount,box){
    if(phase!=='battle'||boss.inv>0||box&&!overlap(box,boss)||!Number.isFinite(amount)||amount<=0)return false;
    // A normal sword can harm the apparition, but cannot end this story encounter.
    const before=boss.hp;boss.hp=Math.max(1,boss.hp-Math.min(amount,playerAttackDamage()));DevDamage.record('outgoing',boss,before,boss.hp);boss.inv=.28;boss.flash=.2;
    burst(Math.min(boss.x+50,player.x+130),player.y+28,'#d9b3f8',14);tone(145,.1,'triangle',.02);return true;
  }
  function hazard(kind,x,y,w,h,warning,life,amount){hazards.push({kind,x,y,w,h,warning,life,amount,active:false});}
  function releaseCast(kind){
    if(kind!=='devour')castVisual={kind,elapsed:0,duration:SHADOW_ATTACK_TIMING.spellRelease};
    if(kind==='bolts'){
      const x=SHADOW_X-150,y=FLOOR-300,a=Math.atan2(player.y+30-y,player.x+21-x);
      for(const offset of [-.22,0,.22])bolts.push({x,y,vx:Math.cos(a+offset)*420,vy:Math.sin(a+offset)*420,life:5,radius:17,damage:5,color:'#c598ff',kind:'shadowBolt'});
    }else if(kind==='rifts'){
      for(const d of [-2,-1,0,1,2])hazard('rift',clamp(player.x+d*155,ARENA_LEFT+20,ARENA_RIGHT-100),FLOOR-230,85,230,.8+Math.abs(d)*.12,1.1,8);
    }else if(kind==='storm'){
      for(let i=0;i<7;i++)hazard('storm',ARENA_LEFT+60+i*170,160,70,FLOOR-160,.65+i*.1,.65,7);
    }else if(kind==='wave'){
      bolts.push({x:ARENA_RIGHT-30,y:FLOOR-38,vx:-520,vy:0,life:4,radius:34,damage:6,color:'#d4b3fc',kind:'wave'});
    }else if(kind==='devour'){
      // The black hole engulfs the whole arena, including airborne Momo and invulnerability frames.
      hurt(player.hp+100,true);return;
    }
    tone(90,.55,'triangle',.025);
  }
  function combat(dt){
    battleTime+=dt;
    if(battleTime>=28&&cast?.kind!=='devour'&&!hazards.some(h=>h.kind==='sweep'&&h.life>0)){
      cast={kind:'devour',stage:'windup',remaining:SHADOW_ATTACK_TIMING.devourWindup,duration:SHADOW_ATTACK_TIMING.devourWindup};auto=null;
      hazard('devour',ARENA_LEFT,0,ARENA_RIGHT-ARENA_LEFT,FLOOR,SHADOW_ATTACK_TIMING.devourWindup,.5,100);
    }
    if(cast?.kind!=='devour'){
      if(!auto)auto={stage:'wait',remaining:.8};
      auto.remaining-=dt;
      if(auto.remaining<=0){
        if(auto.stage==='wait')auto={stage:'windup',remaining:SHADOW_ATTACK_TIMING.meleeWindup,duration:SHADOW_ATTACK_TIMING.meleeWindup,targetX:player.x+21};
        else if(auto.stage==='windup'){
          hazard('sweep',auto.targetX-210,FLOOR-135,420,135,0,SHADOW_ATTACK_TIMING.meleeStrike,4);auto={stage:'recover',remaining:SHADOW_ATTACK_TIMING.meleeRecovery,duration:SHADOW_ATTACK_TIMING.meleeRecovery,targetX:auto.targetX};
          tone(60,.3,'sawtooth',.025);
        }else auto={stage:'wait',remaining:.6};
      }
    }
    if(!cast)cast={stage:'wait',remaining:1.1};
    cast.remaining-=dt;
    if(cast.remaining<=0){
      if(cast.stage==='wait'){
        const kind=['bolts','rifts','storm','wave'][castIndex++%4];cast={kind,stage:'windup',remaining:SHADOW_ATTACK_TIMING.spellWindup,duration:SHADOW_ATTACK_TIMING.spellWindup};
      }else if(cast.stage==='windup'){const kind=cast.kind;releaseCast(kind);if(phase!=='battle')return;cast={stage:'wait',remaining:1.7};}
    }
    for(const h of hazards){
      if(h.warning>0){h.warning-=dt;if(h.warning<=0){h.active=true;shake=reducedMotion.matches?0:.08;}}
      else{h.active=true;h.life-=dt;}
      if(h.active&&h.life>0&&overlap(player,h))hurt(h.amount);
      if(phase!=='battle')return;
    }
    hazards=hazards.filter(h=>h.life>0);
    for(const p of bolts){
      p.life-=dt;const x=p.x,y=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(overlap(player,{x:Math.min(x,p.x)-p.radius,y:Math.min(y,p.y)-p.radius,w:Math.abs(p.x-x)+p.radius*2,h:Math.abs(p.y-y)+p.radius*2})){hurt(p.damage);p.life=0;}
      if(phase!=='battle')return;
    }
    bolts=bolts.filter(p=>p.life>0);
    heartbeat-=dt;if(heartbeat<=0){tone(46,.18,'sine',.025);heartbeat=.85;}
  }
  function scream(){
    if(!sound)return;
    try{
      audio ||= new (window.AudioContext||window.webkitAudioContext)();
      for(const offset of [0,.26]){
        const o=audio.createOscillator(),g=audio.createGain(),at=audio.currentTime+offset;
        o.type='sawtooth';o.frequency.setValueAtTime(510+offset*500,at);o.frequency.linearRampToValueAtTime(950,at+.17);o.frequency.exponentialRampToValueAtTime(340,at+.85);
        g.gain.setValueAtTime(.001,at);g.gain.linearRampToValueAtTime(.018,at+.14);g.gain.exponentialRampToValueAtTime(.001,at+.95);
        o.connect(g);g.connect(audio.destination);o.start(at);o.stop(at+1);
      }
    }catch{}
  }
  function wake(){
    const choose=active()&&!DevSession.active;
    stop();if(choose){weaponStyle='katana';weaponChoicePending=true;}enterRealm(0);state='play';showHUD(true);persist();scream();
    story(I18n.t('prologue.wake.label'),I18n.t('prologue.wake.title'),I18n.t('prologue.wake.story'),()=>{if(weaponChoicePending)WeaponSelection.open();});
  }
  function update(dt){
    clock+=dt;
    animationTime+=dt;blendClock=Math.min(.12,blendClock+dt);
    if(castVisual){castVisual.elapsed+=dt;if(castVisual.elapsed>=castVisual.duration+SHADOW_ATTACK_TIMING.spellRecovery)castVisual=null;}
    if(phase==='death'){if(clock>=2.6){phase='awakening';clock=0;scream();}return;}
    if(phase==='awakening'){if(clock>=4.3)wake();return;}
    boss.inv=Math.max(0,boss.inv-dt);boss.flash=Math.max(0,boss.flash-dt);
    if(phase==='reveal'){
      if(clock>=2.8){phase='battle';clock=0;player.inv=.6;keys.clear();pressed.clear();}
    }else{
      input(dt);if(state!=='play')return;movePlayer(dt);advanceSwordAttack(dt);
      if(phase==='walk'&&player.x>=3100)reveal();
      else if(phase==='battle'){player.x=clamp(player.x,ARENA_LEFT+25,ARENA_RIGHT-player.w-25);combat(dt);}
    }
    for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=350*dt;}particles=particles.filter(p=>p.life>0);
    const targetZoom=phase==='walk'?1:Math.min(1,viewW/1280);
    zoom+=(targetZoom-zoom)*Math.min(1,dt*3);
    const targetX=phase==='walk'?clamp(player.x-viewW*.38,0,dream.width-viewW):ARENA_LEFT-35;
    camera+=(targetX-camera)*Math.min(1,dt*4);cameraY=FLOOR-H*.82/zoom;
    boss.move=cast?.kind||null;boss.autoPhase=auto?.stage||null;boss.hazards=hazards;boss.projectiles=bolts;
    setPose(samplePose());
    if(['walk','reveal','battle'].includes(phase))hud();
  }
  function cover(image,alpha=1){
    if(!image?.complete||!image.naturalWidth)return;
    const s=Math.max(viewW/image.naturalWidth,H/(image.naturalHeight||image.naturalWidth));
    ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(image,(viewW-image.naturalWidth*s)/2,(H-(image.naturalHeight||image.naturalWidth)*s)/2,image.naturalWidth*s,(image.naturalHeight||image.naturalWidth)*s);ctx.restore();
  }
  function fog(x,y,w,h,alpha=.2){
    const g=ctx.createRadialGradient(x,y,1,x,y,w);g.addColorStop(0,'#b999d6');g.addColorStop(1,'#35214600');
    ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,w,h,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function blackHole(){
    const y=FLOOR-295;ctx.save();ctx.translate(SHADOW_X,y);
    const halo=ctx.createRadialGradient(0,0,60,0,0,415);halo.addColorStop(0,'#010106');halo.addColorStop(.62,'#08040e');halo.addColorStop(.8,'#58357b99');halo.addColorStop(1,'#25103400');
    ctx.fillStyle=halo;ctx.fillRect(-425,-425,850,850);
    ctx.fillStyle='#010106';ctx.beginPath();ctx.ellipse(0,0,237,285,0,0,Math.PI*2);ctx.fill();
    for(let i=0;i<6;i++){
      ctx.save();ctx.rotate((reducedMotion.matches?0:time*.065)+i*.35);ctx.strokeStyle=i%2?'#ac7ddd55':'#58367888';ctx.lineWidth=i===0?4:1.5;
      ctx.beginPath();ctx.ellipse(0,0,250+i*17,285+i*9,0,.2,Math.PI*1.72);ctx.stroke();ctx.restore();
    }
    ctx.restore();
  }
  function apparition(){
    if(phase==='walk')return;
    const appear=phase==='reveal'?clamp(clock/2.4,0,1):1;
    const bob=reducedMotion.matches||currentPose.clip!=='idle'?0:Math.sin(animationTime*.7)*3;
    const x=SHADOW_X+20,y=FLOOR-385+bob;
    ctx.save();ctx.globalAlpha=appear*.9;
    if(previousPose&&blendClock<.12){
      const blend=blendClock/.12;ShadowAnimation.draw(previousPose,x,y,1-blend);ShadowAnimation.draw(currentPose,x,y,blend);
    }else ShadowAnimation.draw(currentPose,x,y);
    if(boss.flash>0){fog(SHADOW_X,FLOOR-350,230,260,boss.flash*.4);}
    ctx.restore();
    for(let i=0;i<13;i++){
      const drift=reducedMotion.matches?0:Math.sin(time*.5+i)*60;
      fog(SHADOW_X-360+i*57+drift,FLOOR-85+Math.sin(i)*45,155,65,appear*.2);
    }
  }
  function drawHazards(){
    if(auto?.stage==='recover'&&auto.remaining>auto.duration-SHADOW_ATTACK_TIMING.meleeStrike){
      const progress=(auto.duration-auto.remaining)/SHADOW_ATTACK_TIMING.meleeStrike;
      BossVFX.slash('slashShadow',auto.targetX,FLOOR-80,420,145,-1,progress);
    }
    for(const h of hazards){
      if(h.kind==='devour')BossVFX.devour(h);
      else if(h.kind!=='sweep')BossVFX.column(h);
    }
    if(auto?.stage==='windup'){
      ctx.save();ctx.strokeStyle='#e6c1ff';ctx.lineWidth=3;ctx.setLineDash([12,7]);ctx.beginPath();ctx.ellipse(auto.targetX,FLOOR-8,205,20,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    for(const p of bolts)Visuals.projectile(p);
  }
  function awakening(){
    cover(Visuals.images.momoRoom);ctx.fillStyle='#09131933';ctx.fillRect(0,0,viewW,H);
    const feet=H*.76,size=Math.min(170,viewW*.35),mx=viewW*.34;
    ctx.fillStyle='#09131955';ctx.beginPath();ctx.ellipse(mx,feet,size*.35,9,0,0,Math.PI*2);ctx.fill();
    if(clock<2.25&&menuSheet.complete&&menuSheet.naturalWidth)ctx.drawImage(menuSheet,1024,512,512,512,mx-size/2,feet-450*size/512,size,size);
    else drawMomo(mx,feet,size*.85,0,0,1);
    const shade=clamp(1-clock/1.6,0,1);ctx.fillStyle=`rgba(0,0,0,${shade})`;ctx.fillRect(0,0,viewW,H);
    caption(I18n.t(clock<2?'prologue.awakening.dream':'prologue.awakening.screams'),H*.14,true);
  }
  function caption(text,y,dawn=false){
    ctx.save();ctx.textAlign='center';
    const size=Math.min(24,Math.max(16,viewW*.035)),width=Math.min(660,viewW-36),maxText=width-36;
    ctx.font=`600 ${size}px "Kiba UI", "Kiba Story", sans-serif`;
    const lines=[];let line='';
    for(const word of text.split(/\s+/)){const next=line?line+' '+word:word;const measured=ctx.measureText(next)?.width??next.length*size*.55;if(line&&measured>maxText){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);
    if(dawn){
      ctx.fillStyle='#132a32ed';ctx.fillRect((viewW-width)/2,y-38,width,lines.length*(size+9)+48);
      ctx.strokeStyle='#d9ba7b99';ctx.lineWidth=1;ctx.strokeRect((viewW-width)/2,y-38,width,lines.length*(size+9)+48);
      ctx.fillStyle='#d9ba7b';ctx.font='600 11px "Kiba UI", "Kiba Story", sans-serif';ctx.fillText(I18n.t('prologue.wake.label'),viewW/2,y-15,maxText);ctx.font=`600 ${size}px "Kiba UI", "Kiba Story", sans-serif`;
    }
    lines.forEach((value,index)=>{const baseline=y+16+index*(size+9);if(!dawn){ctx.strokeStyle='#070b16';ctx.lineWidth=5;ctx.strokeText(value,viewW/2,baseline);}ctx.fillStyle=dawn?'#f2e6cc':'#efddff';ctx.fillText(value,viewW/2,baseline);});
    ctx.restore();
  }
  function draw(){
    ctx.fillStyle='#03040b';ctx.fillRect(0,0,viewW,H);
    if(phase==='awakening'){awakening();return;}
    cover(Visuals.images.shadowBackdrop,.8);
    const dim=ctx.createLinearGradient(0,0,0,H);dim.addColorStop(0,'#08051277');dim.addColorStop(.65,'#100d2044');dim.addColorStop(1,'#02050ed9');ctx.fillStyle=dim;ctx.fillRect(0,0,viewW,H);
    ctx.save();ctx.scale(zoom,zoom);ctx.translate(-camera,-cameraY);
    blackHole();apparition();
    ctx.fillStyle='#0b101c';ctx.fillRect(camera-100,FLOOR,viewW/zoom+200,400);
    ctx.save();ctx.filter='grayscale(1) brightness(.4)';Visuals.terrain(realms[1],platforms);ctx.restore();
    for(let i=0;i<14;i++){
      const drift=reducedMotion.matches?0:Math.sin(time*.23+i)*55;
      fog(camera+i*140+drift,FLOOR+8,180,32,.14);
    }
    drawHazards();
    for(const p of particles){ctx.globalAlpha=clamp(p.life*2,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);}ctx.globalAlpha=1;
    if(phase==='death'){
      ctx.save();ctx.translate(player.x+21,player.y+55);ctx.rotate(Math.min(clock,1)*Math.PI*.45);ctx.globalAlpha=clamp(1-clock/2,0,1);drawMomo(0,12,96,0,0,player.face);ctx.restore();
    }else drawPlayer();
    DevDamage.draw();
    ctx.restore();
    if(phase==='death'){ctx.fillStyle=`rgba(1,1,6,${clamp(clock/2.1,0,1)})`;ctx.fillRect(0,0,viewW,H);caption(I18n.t('prologue.death'),H*.48);}
  }
  function village(){
    if(realm!==0||camera>1700)return;
    for(const x of [680,1130,1450]){
      for(let i=0;i<5;i++)fog(x+(reducedMotion.matches?0:Math.sin(time*.3+i)*23),1000-70-i*50,60+i*22,50,.14);
      for(let i=0;i<7;i++){
        const t=reducedMotion.matches?.5:(time*.25+i*.13)%1;ctx.save();ctx.globalAlpha=(1-t)*.6;ctx.fillStyle='#e6a176';ctx.fillRect(x+Math.sin(i*19)*45,985-t*145,3,5);ctx.restore();
      }
    }
  }
  return Object.freeze({start,stop,update,draw,hud,hit,hurt,lose,wake,village,get active(){return active();},get phase(){return phase;}});
})();
