/* Illustrated game art. Images are original, alpha-preserving PNG assets. */
'use strict';
const Visuals = (() => {
  const images = {};
  const heavenMix=[1,0,0];
  function backdropPhase(){return realm===2&&bossStarted&&boss&&!boss.dead?clamp(boss.stage,1,3):1;}
  function resetAtmosphere(){heavenMix.splice(0,3,1,0,0);}
  function updateAtmosphere(dt){
    if(realm!==2){resetAtmosphere();return;}
    const phase=backdropPhase()-1;
    for(let i=0;i<3;i++)heavenMix[i]+=((i===phase?1:0)-heavenMix[i])*Math.min(1,dt*3);
    if(heavenMix[phase]>.998)heavenMix.splice(0,3,...[0,1,2].map(i=>i===phase?1:0));
  }
  const clipPaths=new WeakMap();
  function sourceClip(rect){
    if(!rect.outlines)return;
    if(typeof Path2D==='function'){
      let paths=clipPaths.get(rect);
      if(!paths){paths=rect.outlines.map(outline=>{const p=new Path2D();outline.forEach(([x,y],i)=>{if(i)p.lineTo(x,y);else p.moveTo(x,y);});p.closePath();return p;});clipPaths.set(rect,paths);}
      for(const p of paths)ctx.clip(p);
    }else for(const outline of rect.outlines){ctx.beginPath();outline.forEach(([x,y],i)=>{if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});ctx.closePath();ctx.clip();}
  }
  let completed = 0;
  const failures = [];
  const entries = Object.entries(ART_MANIFEST);
  function progress() {
    const button = document.getElementById('startButton');
    if (button) button.innerHTML = I18n.t(completed === entries.length
      ? I18n.t("text.begin.the.journey")
      : I18n.format("message.loading.artwork.arg0.arg1",[completed,entries.length]));
  }
  const ready = Promise.all(entries.map(([key, src]) => new Promise(resolve => {
    const image = new Image();
    images[key] = image;
    let finished = false;
    const finish = ok => {
      if (finished) return;
      finished = true;
      completed++;
      if (!ok) failures.push(key);
      progress();
      resolve(ok);
    };
    image.onload = () => finish(true);
    image.onerror = () => finish(false);
    image.src = src;
    if (image.complete && image.naturalWidth) finish(true);
  })));
  const usable = key => images[key]?.complete && images[key].naturalWidth > 0;
  const faction = () => ['japan', 'yomi', 'heaven'][realm];
  function frame(key, rect, x, feet, bodyHeight, face = 1, bob = 0, stretch = 0) {
    if (!usable(key) || !rect) return;
        const image = images[key];
    const s = bodyHeight / (rect.bodyHeight || rect.h);
    ctx.save();
    ctx.translate(x, feet + bob);
    ctx.scale(face * (1 + stretch), 1 - stretch * .5);
    ctx.scale(s,s);ctx.translate(-rect.anchorX,-rect.anchorY);sourceClip(rect);
    ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h,
      rect.x,rect.y,rect.w,rect.h);
    ctx.restore();
  }
  function shadow(x, y, width, alpha = .3) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(x, y, 0, x, y, width);
    g.addColorStop(0, '#050c12bb');g.addColorStop(1, '#050c1200');
    ctx.fillStyle = g;
    ctx.beginPath();ctx.ellipse(x, y + 2, width, Math.max(4, width * .15), 0, 0, Math.PI * 2);ctx.fill();
    ctx.restore();
  }
  // Visual bounds include the whole jump arc; discovery and collision retain
  // the authored secret rectangle in levels.js.
  function secretBackdropState(entity=player){
    if(state==='menu'||!entity)return null;
    for(const area of level.secrets||[]){
      const top=area.id==='angelRuin'?Math.min(area.y,area.arena.y-780):area.y-120;
      const feet=entity.y+entity.h,cx=entity.x+entity.w/2;
      if(cx<area.x||cx>area.x+area.w||feet<top||entity.y>area.y+area.h)continue;
      const edge=Math.min(cx-area.x,area.x+area.w-cx,feet-top,area.y+area.h-entity.y);
      return {area,alpha:clamp(edge/75,0,1)};
    }
    return null;
  }
  function campBackdrop(){
    const art=ART_CAMP.backdrop,s=forestCamp.width/art.w,top=forestCamp.start.y-art.groundY*s;
    ctx.fillStyle='#0e202c';ctx.fillRect(0,0,viewW,H);
    if(!usable(art.image))return;
    ctx.drawImage(images[art.image],-camera,top-cameraY,forestCamp.width,art.h*s);
    // The canopy keeps its proportions; a short fade joins the quiet upper sky.
    const fade=ctx.createLinearGradient(0,top-cameraY,0,top-cameraY+42);
    fade.addColorStop(0,'#0e202c');fade.addColorStop(1,'#0e202c00');
    ctx.fillStyle=fade;ctx.fillRect(-camera,top-cameraY,forestCamp.width,42);
  }
  function campScenery(){
    for(const npc of forestCamp.npcs){
      if(!campNPCVisible(npc)||!visiblePoint(npc,180))continue;
      shadow(npc.x,npc.y,26,.22);
      frame(npc.image,ART_CAMP[npc.id],npc.x,npc.y,npc.height);
      const label=I18n.t(npc.name),y=npc.y-npc.height-18;
      ctx.save();ctx.font='600 15px Manrope, sans-serif';ctx.textAlign='center';
      const w=ctx.measureText(label).width+20;ctx.fillStyle='#0d1b29ed';ctx.fillRect(npc.x-w/2,y-16,w,26);
      ctx.fillStyle='#fff0cc';ctx.fillText(label,npc.x,y+2);ctx.restore();
    }
  }
  function campPathMarker(point,label){
    if(!visiblePoint(point,200))return;
    prop('torii',point.x,point.y,150,.9);
    ctx.save();ctx.font='600 15px Manrope, sans-serif';ctx.textAlign='center';
    const w=ctx.measureText(label).width+24,y=point.y-172;
    ctx.fillStyle='#0d1b29ed';ctx.fillRect(point.x-w/2,y-19,w,30);
    ctx.fillStyle='#fff0cc';ctx.fillText(label,point.x,y+2);ctx.restore();
  }
  function backdrop(r) {
    const key = faction() + 'Backdrop';
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    r.sky.forEach((color, i) => sky.addColorStop(i / 2, color));
    ctx.fillStyle = sky;ctx.fillRect(0, 0, viewW, H);
    if (usable(key)) {
      const image = images[key];
      if (realm === 0) {
        const height = H + 80;
        const width = height * image.naturalWidth / image.naturalHeight;
        const offset = camera * .13;
        const start = Math.floor(offset / width);
        for (let i = start - 1; i < start + Math.ceil(viewW / width) + 2; i++) {
          const x = i * width - offset;
          ctx.save();
          if (Math.abs(i % 2) === 1) {ctx.translate(x + width, -35);ctx.scale(-1, 1);}
          else ctx.translate(x, -35);
          ctx.drawImage(image, 0, 0, width + 1, height);
          ctx.restore();
        }
      } else {
        const paintCover=image=>{
          const s=Math.max(viewW/image.naturalWidth,H/image.naturalHeight),width=image.naturalWidth*s,height=image.naturalHeight*s;
          const ratio=clamp(cameraY/Math.max(1,level.height-H),0,1);
          ctx.drawImage(image,(viewW-width)*.5+Math.sin(camera*.0003)*6,-(height-H)*ratio,width,height);
        };
        if(realm===2){
          let accumulated=0;
          for(const [index,phaseKey] of ['heavenBackdrop','heavenDarkBackdrop','heavenEclipseBackdrop'].entries()){
            const weight=heavenMix[index];if(weight<=0||!usable(phaseKey))continue;
            accumulated+=weight;ctx.save();ctx.globalAlpha*=weight/accumulated;paintCover(images[phaseKey]);ctx.restore();
          }
        }else paintCover(image);
      }
    }
    ctx.fillStyle = realm === 1 ? '#140c2028' : realm === 2 ? '#24314820' : '#11252d30';
    const secretState=secretBackdropState();
    if(secretState){
      const secret=secretState.area;
      const key=secret.id==='angelRuin'?'angelRuinBackdrop':'cultCaveBackdrop';
      if(usable(key)){
        const image=images[key],s=Math.max(viewW/image.naturalWidth,H/image.naturalHeight),width=image.naturalWidth*s,height=image.naturalHeight*s;
        ctx.save();ctx.globalAlpha=secretState.alpha;ctx.drawImage(image,(viewW-width)/2,-(height-H)*.35,width,height);ctx.restore();
      }
    }
    ctx.fillRect(0, 0, viewW, H);
    // Fog layers and particles move at different speeds to retain depth.
    for (let layer = 0; layer < 3; layer++) {
      ctx.save();ctx.globalAlpha = realm === 1 ? .045 : .05;
      ctx.fillStyle = realm===2&&backdropPhase()>1?(backdropPhase()===2?'#83749f':'#a5787d'):r.fog;
      ctx.beginPath();
      ctx.ellipse(viewW * .5 + Math.sin(time * .07 + layer) * viewW * .4,
        H * .53 + layer * 70 + Math.sin(time * .11) * 12,
        viewW * .7, 21 + layer * 13, 0, 0, Math.PI * 2);
      ctx.fill();ctx.restore();
    }
    for (let i = 0; i < 38; i++) {
      const x = (noise(i + 80) * viewW + time * (realm === 1 ? 6 : 12)) % viewW;
      const y = ((noise(i + 29) * H + time * (realm === 1 ? -18 : 9)) % H + H) % H;
      ctx.save();ctx.globalAlpha = .25 + Math.sin(time * 1.2 + i) * .15;
      ctx.fillStyle = realm===2&&backdropPhase()>1?(backdropPhase()===2?'#a893d0':'#ef8b65'):realm===0?'#e5a184':r.gold;
      ctx.beginPath();ctx.ellipse(x, y, realm === 0 ? 2.6 : 1.4, 1.2, time + i, 0, Math.PI * 2);ctx.fill();ctx.restore();
    }
  }
  function councilBackdrop() {
    const art=ART_COUNCIL.hall;
    ctx.fillStyle='#160f16';ctx.fillRect(0,0,viewW,H);
    if(!usable(art.image))return;
    const floor=art.worldFloorY,width=level.width,height=level.height;
    // Anchor the painted wall/floor join to the real walking surface. Both
    // original source regions remain visible as the camera follows the room.
    ctx.drawImage(images[art.image],0,0,art.w,art.floorY,-camera,-cameraY,width,floor);
    ctx.drawImage(images[art.image],0,art.floorY,art.w,art.h-art.floorY,
      -camera,floor-cameraY,width,Math.max(1,height-floor));
  }
  function councilGate(g,open=false) {
    const art=open?ART_COUNCIL.gateOpen:ART_COUNCIL.gateClosed;
    if(!usable(art.image))return;
    const height=g.h??415,width=g.w??height*art.inkWidth/art.bodyHeight;
    const sx=width/art.inkWidth,sy=height/art.bodyHeight;
    ctx.drawImage(images[art.image],g.x-art.anchorX*sx,g.y-art.anchorY*sy,art.w*sx,art.h*sy);
  }
  function councilKey(x,feet,size=48) {
    const art=ART_COUNCIL.key;
    if(!usable(art.image))return;
    const scale=size/art.bodyHeight;
    ctx.drawImage(images[art.image],x-art.anchorX*scale,feet-art.anchorY*scale,art.w*scale,art.h*scale);
  }
  function tile(rect, x, y, width, height, proportional = false, cropAnchor = .5) {
    if (!usable('terrain') || width <= 0) return;
    // Tall, narrow root barriers need a slice of the painted material, not
    // an entire horizontal platform squeezed into a column.
    const sourceWidth=proportional?Math.min(rect.w,width*rect.h/height):rect.w;
    const sourceX=rect.x+(rect.w-sourceWidth)*cropAnchor;
    const drawWidth=proportional?sourceWidth*height/rect.h:width;
    const top=y-((rect.surfaceY??rect.y)-rect.y)*height/rect.h;
    ctx.save();
    ctx.translate(x+(width-drawWidth)/2,top);ctx.scale(drawWidth/sourceWidth,height/rect.h);ctx.translate(-sourceX,-rect.y);sourceClip(rect);
    ctx.drawImage(images.terrain, sourceX, rect.y, sourceWidth, rect.h, sourceX,rect.y,sourceWidth,rect.h);
    ctx.restore();
  }
  function terrain(r, items) {
    for (const p of items) {
      const row=ART_FRAMES.terrain[p.secretArea==='cultCave'?1:p.secretArea==='angelRuin'?2:realm];
      if(p.broken)continue;
      if (state !== 'menu' && (p.x + p.w < camera - 100 || p.x > camera + viewW + 100 || p.y + p.h < cameraY - 140 || p.y > cameraY + H + 100)) continue;
      const height = p.kind === 'ground' ? Math.max(130, p.h) : realm === 2||p.secretArea==='angelRuin' ? 90 : 70;
      const lift = 0;
      shadow(p.x + p.w / 2, p.y + height * .75, Math.min(p.w / 2, 220), .18);
      if (usable('terrain')) {
        const cap = Math.min(78, p.w * .22);
        tile(row[0], p.x - 3, p.y - lift, cap + 4, height);
        const interior = p.w - cap * 2;
        ctx.save();ctx.beginPath();ctx.rect(p.x + cap - 2, p.y - 85, interior + 4, height + 170);ctx.clip();
        for (let x = p.x + cap - 2; x < p.x + p.w - cap; x += 128)
          tile(row[1], x, p.y - lift, 132, height);
        ctx.restore();
        tile(row[2], p.x + p.w - cap - 1, p.y - lift, cap + 4, height);
      } else {
        ctx.fillStyle = r.floor;ctx.fillRect(p.x, p.y, p.w, p.h);
      }
      if(p.secretArea==='angelRuin'){
        // Weathered tower masonry keeps the secret route distinct from the forest.
        ctx.save();ctx.fillStyle='#c9d0cb62';ctx.fillRect(p.x+5,p.y+3,p.w-10,12);
        ctx.strokeStyle='#526673d9';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x+6,p.y+2);ctx.lineTo(p.x+p.w-6,p.y+2);ctx.stroke();
        ctx.strokeStyle='#455764ad';ctx.lineWidth=2;
        for(let i=0;i<Math.floor(p.w/90);i++){
          const x=p.x+28+i*86;ctx.beginPath();ctx.moveTo(x,p.y+5);ctx.lineTo(x+8,p.y+18);ctx.lineTo(x+3,p.y+30);ctx.stroke();
        }
        for(const x of [p.x+8,p.x+p.w-21]){ctx.fillStyle='#aab6b1b8';ctx.fillRect(x,p.y-15,13,16);ctx.fillStyle='#d8c998bb';ctx.fillRect(x-3,p.y-18,19,4);}
        ctx.restore();
      }
      if(p.crumble>0){
        ctx.save();ctx.strokeStyle='#ffac69';ctx.lineWidth=2+p.crumble*2;ctx.shadowColor='#ff7850';ctx.shadowBlur=10;
        for(let i=0;i<4;i++){const x=p.x+p.w*(i+.5)/4;ctx.beginPath();ctx.moveTo(x-10,p.y+3);ctx.lineTo(x+9,p.y+15);ctx.lineTo(x-4,p.y+30);ctx.stroke();}ctx.restore();
      }
      // A subtle material-colored rim identifies the true collision surface.
      ctx.strokeStyle = realm === 0 ? '#abb78d66' : realm === 1 ? '#d199aa55' : '#ffe8b98c';
      ctx.lineWidth = 1;ctx.beginPath();ctx.moveTo(p.x + 4, p.y + .5);ctx.lineTo(p.x + p.w - 4, p.y + .5);ctx.stroke();
      if (realm === 0 && p.kind === 'ground') {
        for (let x = p.x + 130; x < p.x + p.w - 90; x += 470) {
          if (state !== 'menu' && !visiblePoint({x, y: p.y}, 180)) continue;
          prop('foliage', x, p.y + 2, 125 + noise(x) * 45, .75);
        }
      }
    }
    if (realm === 0) for (const house of [{x:7040,y:960},{x:7410,y:960},{x:8380,y:1000}])
      if (visiblePoint(house, 500)) prop('house', house.x, house.y, 240, .88);
  }
  function prop(name, x, feet, height, alpha = 1) {
    const rect = ART_FRAMES.props[name];
    if (!rect) return;
    ctx.save();ctx.globalAlpha *= alpha;
    frame('props', rect, x, feet, height);
    ctx.restore();
  }
  function torii(x, feet, r) {
    const active = defeated[realm];
    if (active) {
      ctx.save();
      const g = ctx.createRadialGradient(x, feet - 105, 5, x, feet - 105, 170);
      g.addColorStop(0, r.gold + '65');g.addColorStop(1, r.gold + '00');
      ctx.fillStyle = g;ctx.fillRect(x - 170, feet - 280, 340, 300);
      ctx.strokeStyle = r.gold + '90';ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {ctx.beginPath();ctx.ellipse(x, feet - 100, 46 + i * 5, 88 + i * 6, 0, 0, Math.PI * 2);ctx.stroke();}
      ctx.font = 'bold 12px Manrope, sans-serif';ctx.fillStyle = r.gold;ctx.textAlign = 'center';
      ctx.fillText(I18n.t((realm < 2 ? realms[realm + 1].short : I18n.t("text.passage")).toUpperCase()) + ' · ' + bindingKeyLabel(Bindings.read('interact')[0]), x, feet - 145);
      ctx.font = '10px Manrope, sans-serif';ctx.fillText(I18n.t("text.stand.beneath.the.gate"), x, feet - 126);
      ctx.restore();
    }
    shadow(x, feet, 95, .3);
    prop(realm === 2 ? 'skyTorii' : 'torii', x, feet + 2, 260);
  }
  function shrine(x, feet, r, ability) {
    const g = ctx.createRadialGradient(x, feet - 40, 1, x, feet - 40, 90);
    g.addColorStop(0, r.gold + '38');g.addColorStop(1, r.gold + '00');ctx.fillStyle = g;ctx.fillRect(x - 90, feet - 130, 180, 150);
    shadow(x, feet, 31, .3);prop(realm === 2 ? 'skyShrine' : 'shrine', x, feet + 3, ability ? 120 : 105);
    if (ability) {
      ctx.save();ctx.fillStyle = r.gold;ctx.textAlign = 'center';ctx.font = '20px serif';
      ctx.fillText(I18n.t(realm === 0 ? '風' : '影'), x, feet - 136 + Math.sin(time * 2) * 3);ctx.restore();
    }
  }
  function objects(r) {
    for (const o of level.objects) {
      if(!objectVisible(o))continue;
      if (!visiblePoint(o)) continue;
      const taken = hasFlag(o.id);if(o.type==='relic'&&!relicUnlocked(o))continue;
      if(o.type==='councilKey'&&taken)continue;
      if(realm===2&&!taken){
        const cy=o.type==='bell'?o.y-80:o.y-42;
        ctx.save();ctx.fillStyle='#193549b8';ctx.strokeStyle='#f5df9f';ctx.lineWidth=2;
        ctx.beginPath();ctx.ellipse(o.x,cy,o.type==='bell'?62:37,o.type==='bell'?75:42,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
      }
      if (o.type === 'councilKey') {shadow(o.x,o.y,28,.35);councilKey(o.x,o.y,92);}
      else if (o.type === 'bell') {shadow(o.x, o.y, 45);prop('bell', o.x, o.y + 2, 158, taken ? .62 : 1);}
      else if (o.type === 'rescue') {if (!taken) prop('cage', o.x, o.y + 2, 125);drawSpirit(o.x, o.y - 58, r.gold);}
      else if(o.type==='relic'){if(!taken){shadow(o.x,o.y,33,.35);frame('relics',ART_FRAMES.relics[o.id],o.x,o.y+2,118);}}
      else drawSpirit(o.x, o.y - 35, r.gold);
      ctx.save();ctx.font = 'bold 12px Manrope, sans-serif';ctx.textAlign = 'center';
      const label=I18n.t(taken ? '✓' : o.name),labelY=o.y-(o.type==='bell'?175:148);
      if(realm===2){const width=ctx.measureText(label).width+20;ctx.fillStyle='#183246e8';ctx.fillRect(o.x-width/2,labelY-15,width,21);}
      ctx.fillStyle = realm===2?'#fff0ba':r.gold;ctx.fillText(label,o.x,labelY);ctx.restore();
    }
  }

  function actor(e, r, isBoss = false) {
    if(!isBoss&&e.serpent===true){serpentActor(e);return;}
    const role=isBoss?'boss':enemyRole(e),feet=e.y+e.h,x=e.x+e.w/2;
    const height=isBoss?[164,180,176][realm]:e.miniboss?(e.miniboss==='angel'?156:145):role==='shield'?102:role==='mage'?101:94;
    const face=isBoss&&e.autoPhase?e.autoFace:e.face;
    const actorFaction=e.factionOverride||faction();
    const palette=e.factionOverride==='yomi'?realms[1]:e.factionOverride==='heaven'?realms[2]:r;
    let index=0,key,rect;
    if(e.miniboss){
      index=e.phase==='windup'?(e.clock/e.phaseDuration>.5?1:2):e.phase==='strike'?(['holyFan','curse','sigils'].includes(e.move)?4:3):e.phase==='recover'?5:0;
      key=e.miniboss==='angel'?'oldAngel':'oldCultist';rect=ART_FRAMES[key][index];
    }else if(isBoss){
      const pose=e.autoPhase||e.phase,duration=e.autoPhase?e.autoDuration:e.phaseDuration,remaining=e.autoPhase?e.autoClock:e.clock;
      if(pose==='windup')index=1+Math.min(1,Math.floor(clamp(1-remaining/duration,0,1)*2));
      else if(pose==='strike')index=3+Math.min(1,Math.floor(clamp(1-remaining/duration,0,1)*2));
      else if(pose==='recover')index=5;
      else if(pose==='transform')index=2;
      if(realm===0){key='samurai';rect=ART_FRAMES.samurai[index];}
      else if(realm===2){key=['','angelLight','angelDark','angelEclipse'][e.stage];rect=ART_FRAMES[key][index];}
      else{key='bosses';rect=ART_FRAMES.bosses[realm][index];}
    }else{
      let action='walk';
      if(e.windup>0){action='attack';index=Math.min(2,Math.floor(clamp(1-e.windup/e.windupDuration,0,1)*3));}
      else if(e.attackTime>0){action='attack';index=3+Math.min(1,Math.floor(e.attackElapsed/e.attackDuration*2));}
      else if(e.recovery>0||e.stun>0){action='attack';index=5;}
      else if(Math.abs(e.walkSpeed)>2)index=Math.floor(e.animTime*12)%6;
      key=actorFaction+(action==='walk'?'Walk':'Attack');rect=ART_FRAMES.animations[actorFaction][action][role][index];
    }
    shadow(x,feet,isBoss?57:e.kind==='fly'?17:26,e.kind==='fly'?.1:.3);
    ctx.save();ctx.globalAlpha=e.stun>0||e.inv>0?.65:1;
    const bob=isBoss&&realm===2?Math.sin(time*2)*3:!isBoss&&e.kind==='fly'?Math.sin(time*3)*2:0;
    frame(key,rect,x,feet+1,height,face,bob,0);ctx.restore();
    if(isBoss&&realm===1&&e.yomiStage==='shelter'){
      BossVFX.portal(x,feet+8,168,.85);
      const label=I18n.t('yomi.phase.immune');
      ctx.save();ctx.font='bold 12px Manrope, sans-serif';ctx.textAlign='center';
      const width=ctx.measureText(label).width+22;ctx.fillStyle='#112b3fee';ctx.fillRect(x-width/2,feet-height-88,width,24);
      ctx.fillStyle='#fff0bc';ctx.fillText(label,x,feet-height-71);ctx.restore();
    }
    if(e.blockFlash>0){
      ctx.save();ctx.globalAlpha=Math.min(1,e.blockFlash*5);ctx.strokeStyle='#fff0b3';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(x+face*18,feet-35,32,face>0?-1.1:2,face>0?1.1:4.2);ctx.stroke();ctx.restore();
    }
    const winding=isBoss?(e.autoPhase?e.autoPhase==='windup':e.phase==='windup'):e.windup>0;
    if(winding){
      const charged=clamp(1-(isBoss?(e.autoPhase?e.autoClock:e.clock):e.windup)/(isBoss?(e.autoPhase?e.autoDuration:e.phaseDuration):e.windupDuration),0,1);
      const color=isBoss&&realm===2&&e.stage===2?'#c393ff':isBoss&&e.autoPhase?'#ffb385':role==='mage'?palette.accent:'#ffe098';
      ctx.save();ctx.strokeStyle=color;ctx.lineWidth=isBoss?4:2.5;ctx.globalAlpha=.6+charged*.4;ctx.shadowColor=color;ctx.shadowBlur=isBoss?20:8;
      if(realm===2){ctx.shadowBlur=0;ctx.strokeStyle='#26374d';ctx.lineWidth=isBoss?10:6;ctx.beginPath();ctx.ellipse(x,feet+4,isBoss?76:32,isBoss?12:7,0,-Math.PI,-Math.PI+charged*Math.PI*2);ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=isBoss?4:2.5;ctx.shadowBlur=isBoss?20:8;}
      ctx.beginPath();ctx.ellipse(x,feet+4,isBoss?76:32,isBoss?12:7,0,-Math.PI,-Math.PI+charged*Math.PI*2);ctx.stroke();
      const handX=x+face*30,handY=feet-height*.44;
      const glow=ctx.createRadialGradient(handX,handY,0,handX,handY,isBoss?33:22);glow.addColorStop(0,'#fffbe6');glow.addColorStop(.25,color+'b0');glow.addColorStop(1,color+'00');
      ctx.fillStyle=glow;ctx.fillRect(handX-60,handY-60,120,120);ctx.restore();
      if(isBoss){
        ctx.save();ctx.font='bold 13px Manrope, sans-serif';ctx.textAlign='center';ctx.fillStyle=color;ctx.shadowColor='#080512';ctx.shadowBlur=5;
        const labels={cleave:I18n.t("text.sword.slash"),dash:'ROHAM',doubleCut:I18n.t("text.double.slash"),hammer:I18n.t("text.hammer.swing"),slam:I18n.t("text.earthquake"),lava:I18n.t("text.lava.jump.onto.the.platforms"),embers:I18n.t("text.ember.rain"),summon:I18n.t("text.summoning.minions"),lightArrows:I18n.t("text.light.arrows"),holySweep:I18n.t("text.holy.arrow.rain"),shadowBolts:I18n.t("text.shadow.bolts"),shadowNova:I18n.t("text.shadow.nova"),shadowRain:I18n.t("text.shadow.rain"),eclipse:I18n.t("text.eclipse"),hellfire:I18n.t("text.hellfire.and.light")};
        const label=I18n.t(e.autoPhase?(realm===2?I18n.t("text.wing.slash"):I18n.t("text.hammer.swing")):labels[e.move]||I18n.t("text.attack"));
        if(realm===2){const width=ctx.measureText(label).width+22;ctx.shadowBlur=0;ctx.fillStyle='#172b42e8';ctx.fillRect(x-width/2,feet-height-55,width,24);ctx.fillStyle=color;}
        ctx.fillText(label,x,feet-height-38);ctx.restore();
      }
    }
    if(e.miniboss)miniEffects(e,height);
    if(!isBoss&&!e.miniboss&&e.hp<e.maxHp){ctx.fillStyle='#0a172bcc';ctx.fillRect(x-19,feet-height-17,38,3);ctx.fillStyle=e.kind==='shield'?'#ddba72':'#d99583';ctx.fillRect(x-19,feet-height-17,38*Math.max(0,e.hp/e.maxHp),3);}
  }
  function serpentActor(e){
    if(e.dead||!e.active||e.phase==='dormant')return;
    const phase=['windup','strike','recover'].includes(e.phase)?e.phase:'idle',clip=ART_SERPENT.clips[phase];
    const progress=clamp(1-e.clock/(e.phaseDuration||1),0,1);
    const index=phase==='idle'?(reducedMotion.matches?0:Math.floor(e.animTime*5)%clip.length):Math.min(clip.length-1,Math.floor(progress*clip.length));
    const x=e.x+e.w/2,feet=e.y+e.h,height=138;
    ctx.save();ctx.globalAlpha=e.inv>0?.85:1;
    frame(ART_SERPENT.image,ART_SERPENT.frames[clip[index]],x,feet,height,e.face*ART_SERPENT.facing);ctx.restore();
    ctx.save();ctx.font='bold 12px Manrope, sans-serif';ctx.textAlign='center';
    const label=I18n.t('yomi.serpent.name'),width=Math.max(146,ctx.measureText(label).width+28);
    ctx.fillStyle='#10283fee';ctx.fillRect(x-width/2,feet-height-46,width,42);
    ctx.fillStyle='#fff0bd';ctx.fillText(label,x,feet-height-26);
    ctx.fillStyle='#070e18';ctx.fillRect(x-width/2+8,feet-height-17,width-16,7);
    ctx.fillStyle='#ffcc89';ctx.fillRect(x-width/2+8,feet-height-17,(width-16)*Math.max(0,e.hp/e.maxHp),7);
    if(e.phase==='windup'){
      const tell=I18n.t('yomi.serpent.'+e.move),tellWidth=ctx.measureText(tell).width+20;
      ctx.fillStyle='#10283fee';ctx.fillRect(x-tellWidth/2,feet+11,tellWidth,23);ctx.fillStyle='#fff0bd';ctx.fillText(tell,x,feet+27);
      BossVFX.marker(x,feet,170,'#fff0bd');
      if(e.move==='bite'){
        const hitX=e.face>0?e.x+e.w*.45:e.x-125;
        ctx.strokeStyle='#fff0bd';ctx.lineWidth=2.5;ctx.setLineDash([7,5]);ctx.strokeRect(hitX,e.y-20,125+e.w*.55,e.h+35);ctx.setLineDash([]);
      }else BossVFX.stamp('ember',x+e.face*37,e.y+e.h*.35,65,32,{face:e.face,alpha:.6+progress*.4});
    }else if(e.phase==='strike'&&e.move==='bite')BossVFX.slash('slashFire',x+e.face*60,e.y+e.h*.5,160,86,e.face,progress);
    ctx.restore();
  }
  function miniEffects(e,height){
    const x=e.x+e.w/2,feet=e.y+e.h,color=e.miniboss==='angel'?'#ffe0a2':'#c39ae7';
    ctx.save();
    if(e.active){
      ctx.fillStyle='#122739df';ctx.fillRect(x-98,feet-height-79,196,e.phase==='windup'?57:53);
      ctx.fillStyle='#08121cdd';ctx.fillRect(x-90,feet-height-34,180,7);ctx.fillStyle=color;ctx.fillRect(x-90,feet-height-34,180*Math.max(0,e.hp/e.maxHp),7);
      ctx.font='bold 11px Manrope, sans-serif';ctx.textAlign='center';ctx.fillStyle=color;ctx.shadowColor='#07111c';ctx.shadowBlur=4;ctx.fillText(I18n.t(e.name),x,feet-height-43);
      if(e.phase==='windup'){
        const names={glaive:I18n.t("text.ancient.blade"),holyFan:I18n.t("text.broken.light"),lunge:I18n.t('attack.angelic.charge'),staff:I18n.t("text.ritual.slash"),curse:I18n.t("text.shadow.curse"),sigils:I18n.t("text.cult.sigils")};
        ctx.fillText(I18n.t(names[e.move]),x,feet-height-63);
        if(['glaive','staff','lunge'].includes(e.move)){ctx.shadowBlur=0;ctx.fillStyle=color+'25';const w=e.move==='lunge'?300:175;ctx.fillRect(e.face>0?x:x-w,feet-95,w,95);ctx.strokeStyle=color;ctx.setLineDash([7,6]);ctx.strokeRect(e.face>0?x:x-w,feet-95,w,95);ctx.setLineDash([]);}
      }
    }
    if(e.phase==='strike'&&['glaive','staff','lunge'].includes(e.move))BossVFX.slash(e.miniboss==='angel'?'slashGold':'slashShadow',x+e.face*60,feet-62,165,112,e.face,1-e.clock/e.phaseDuration);
    for(const h of e.hazards)BossVFX.column(h);
    ctx.restore();
  }
  function secretScenery(r){
    if(realm!==0)return;
    for(const area of level.secrets||[]){
      if(area.x+area.w<camera||area.x>camera+viewW||area.y+area.h<cameraY||area.y>cameraY+H)continue;
      ctx.save();
      if(area.id==='angelRuin'){
        if(usable('japanClouds'))for(const [x,y,width,height,flip] of [[2700,-500,610,260,1],[3040,-330,510,220,-1],[2800,-145,550,235,1]]){
          ctx.save();ctx.globalAlpha*=.82;ctx.translate(x,y);ctx.scale(flip,1);
          ctx.drawImage(images.japanClouds,-width/2,-height/2,width,height);ctx.restore();
        }
        const altarY=area.arena.y;
        prop('skyShrine',2585,altarY,82,.65);
        for(const [x,height,face] of [[2545,420,1],[2985,330,-1]])
          secretWallProp(ART_SECRET_WALLS.angel,x,altarY+6,height,face);
        ctx.strokeStyle='#8b764eaa';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(2790,altarY-2,160,15,0,0,Math.PI*2);ctx.stroke();
      }else{
        const gate=level.cultPassage?.ruinedGate;
        if(gate&&usable('cultRuinedGate')){
          const art=ART_CULT_GATE,s=Math.min(gate.w/art.w,gate.h/art.bodyHeight);
          ctx.drawImage(images.cultRuinedGate,gate.x-art.anchorX*s,gate.y-art.anchorY*s,art.w*s,art.h*s);
        }
        for(const [x,height,face] of [[2690,330,1],[3550,290,-1]])
          secretWallProp(ART_SECRET_WALLS.cult,x,area.arena.y+5,height,face);
        for(const px of [2860,3100,3450]){
          ctx.fillStyle='#b5a777';ctx.fillRect(px-4,2140,8,21);const flame=ctx.createRadialGradient(px,2137,0,px,2137,70);flame.addColorStop(0,'#f6a47580');flame.addColorStop(1,'#dd744a00');ctx.fillStyle=flame;ctx.fillRect(px-70,2067,140,140);ctx.fillStyle='#ffe2a0';ctx.beginPath();ctx.ellipse(px,2133+Math.sin(time*6+px)*2,3,7,0,0,Math.PI*2);ctx.fill();
        }
        ctx.strokeStyle='#9b626b88';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(3115,2161,190,21,0,0,Math.PI*2);ctx.stroke();
      }
      ctx.restore();
    }
  }
  function secretWallProp(art,x,feet,height,face=1){
    if(!usable(art.image))return;
    const s=height/art.bodyHeight;
    ctx.save();ctx.translate(x,feet);ctx.scale(face,1);
    ctx.drawImage(images[art.image],-art.anchorX*s,-art.anchorY*s,art.w*s,art.h*s);
    ctx.restore();
  }
  function secretRock(g){
    const art=ART_SECRET_WALLS.cult;
    ctx.save();ctx.beginPath();ctx.rect(g.x,g.y,g.w,g.h);ctx.clip();
    ctx.fillStyle='#182025';ctx.fillRect(g.x,g.y,g.w,g.h);
    if(usable(art.image)){
      const tile=150,m=art.material;
      for(let y=Math.max(g.y,Math.floor(cameraY/tile)*tile);y<Math.min(g.y+g.h,cameraY+H+tile);y+=tile)
        for(let x=g.x;x<g.x+g.w;x+=tile){
          ctx.save();ctx.translate(x+tile/2,y+tile/2);
          if((Math.floor(x/tile)+Math.floor(y/tile))%2)ctx.scale(-1,1);
          ctx.drawImage(images[art.image],m.x,m.y,m.w,m.h,-tile/2,-tile/2,tile,tile);ctx.restore();
        }
    }
    if(g.kind==='fragile'){
      ctx.strokeStyle='#d1c9acaf';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(g.x+g.w*.7,g.y);ctx.lineTo(g.x+g.w*.3,g.y+g.h*.3);
      ctx.lineTo(g.x+g.w*.65,g.y+g.h*.55);ctx.lineTo(g.x+g.w*.2,g.y+g.h*.8);ctx.stroke();
    }
    ctx.restore();
  }
  function momoSlash(x,feet,height,elapsed,face,kind='normal'){
    if(kind==='heavy'){
      const index=ART_FRAMES.momoHeavy.findIndex(pose=>elapsed<pose.end);
      frame('momoHeavy',ART_FRAMES.momoHeavy[index<0?5:index],x,feet,height,face);
      return;
    }
    const index=Math.min(7,Math.floor(clamp(elapsed/SWORD_DURATION,0,.999)*8));
    frame('momoSlash',ART_FRAMES.momoSlash[index],x,feet,height,face);
  }
  function dashTrail(x,y,face=1,progress=0){
    const age=clamp(progress,0,1);
    if(age>=1)return;
    // Reuse the alpha-preserving painted shadow smoke as long tapering wisps.
    // The renderer is pure; the particle clock belongs to the gameplay update.
    BossVFX.stamp('shadowBolt',x,y,112+age*72,30-age*12,
      {face,alpha:(1-age)**1.35*.68});
  }
  function winds(r) {
    for(const w of level.winds){
      if(w.afterBoss&&!defeated[realm]||w.x+w.w<camera||w.x>camera+viewW||w.y+w.h<cameraY||w.y>cameraY+H)continue;
      const cx=w.x+w.w/2;
      const landing=platforms.find(p=>p.x<=cx&&cx<=p.x+p.w&&p.y>=w.y&&p.y<=w.y+260);
      const visualTop=Math.max(w.y,landing?landing.y+12:w.y);
      const top=Math.max(visualTop,cameraY-50),bottom=Math.min(w.y+w.h,cameraY+H+50);
      if(top>=bottom)continue;
      const fade=y=>clamp(Math.min((y-visualTop)/135,(w.y+w.h-y)/55),0,1);
      ctx.save();ctx.beginPath();ctx.rect(w.x,top,w.w,bottom-top);ctx.clip();
      const gradient=ctx.createLinearGradient(w.x,0,w.x+w.w,0);
      gradient.addColorStop(0,'#ffe6a300');gradient.addColorStop(.22,'#326e8fa3');gradient.addColorStop(.5,'#72b4c9af');gradient.addColorStop(.78,'#326e8fa3');gradient.addColorStop(1,'#ffe6a300');
      ctx.fillStyle=gradient;
      for(let y=top;y<bottom;y+=16){const height=Math.min(16,bottom-y);ctx.globalAlpha=fade(y+height/2);ctx.fillRect(w.x,y,w.w,height);}
      ctx.globalAlpha=1;
      ctx.shadowColor='#a8e8ff';ctx.shadowBlur=16;
      for(let band=0;band<5;band++){
        ctx.strokeStyle=band%2?'#e4f7ffbc':'#ffe6a79c';ctx.lineWidth=band===2?3:1.5;ctx.beginPath();
        for(let y=top;y<bottom;y+=12){const x=w.x+w.w*(band+1)/6+Math.sin(y*.023+time*3+band)*12;ctx.globalAlpha=fade(y);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.sin((y+12)*.023+time*3+band)*3,y+12);ctx.stroke();}
      }
      for(let i=0;i<Math.ceil(w.h/125);i++){
        const y=w.y+((i*125-time*210)%w.h+w.h)%w.h;
        if(y<top-30||y>bottom+30)continue;
        ctx.globalAlpha=fade(y);
        ctx.strokeStyle='#234559cc';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(cx-14,y+12);ctx.lineTo(cx,y-3);ctx.lineTo(cx+14,y+12);ctx.stroke();ctx.strokeStyle='#fff5c6';ctx.lineWidth=3.5;ctx.stroke();
        ctx.lineWidth=2;ctx.strokeStyle='#c7f2ffbb';ctx.beginPath();ctx.moveTo(cx-10,y+23);ctx.lineTo(cx,y+12);ctx.lineTo(cx+10,y+23);ctx.stroke();
      }
      for(let i=0;i<24;i++){
        const x=w.x+noise(i+w.x)*w.w,y=w.y+((noise(i+1)*w.h-time*(180+i*2))%w.h+w.h)%w.h;
        ctx.globalAlpha=fade(y);
        ctx.fillStyle=i%3?'#d0f5ffcc':'#fff0b3';ctx.fillRect(x,y,2,10);
      }
      ctx.restore();
      if(w.y+w.h>cameraY&&w.y+w.h<cameraY+H+100){
        ctx.save();ctx.strokeStyle='#ffe8a6';ctx.lineWidth=3;ctx.shadowColor='#ffe8a6';ctx.shadowBlur=18;ctx.beginPath();ctx.ellipse(cx,w.y+w.h-8,w.w*.53,13,0,0,Math.PI*2);ctx.stroke();
        ctx.shadowBlur=0;ctx.fillStyle='#163847dd';ctx.fillRect(cx-122,w.y+w.h-49,244,27);ctx.fillStyle='#fff4c9';ctx.font='bold 13px Manrope, sans-serif';ctx.textAlign='center';ctx.fillText(I18n.t("text.jump.into.the.wind.stream"),cx,w.y+w.h-30);ctx.restore();
      }
    }
  }
  function bossEffects(r) {
    if(!bossStarted||!boss||boss.dead)return;
    ctx.save();
    if(boss.phase==='transform'){
      const x=boss.x+boss.w/2,y=boss.y+45,pulse=1-boss.clock/boss.phaseDuration;
      const g=ctx.createRadialGradient(x,y,5,x,y,210);g.addColorStop(0,boss.stage===2?'#c596ffad':'#ffe6adbb');g.addColorStop(.45,'#ab83d955');g.addColorStop(1,'#aa77dd00');ctx.fillStyle=g;ctx.fillRect(x-210,y-210,420,420);
      BossVFX.portal(x,boss.y+boss.h,205,.7);
      BossVFX.stamp('shadowColumn',x,boss.y+boss.h,180,230,{alpha:.35+Math.sin(pulse*Math.PI)*.4});
      ctx.fillStyle='#fff0ce';ctx.font='bold 16px Manrope, sans-serif';ctx.textAlign='center';ctx.fillText(I18n.t(boss.stage===2?I18n.t("text.light.turns.to.shadow"):I18n.t("text.the.ritual.of.halo.and.horn")),x,boss.y-105);
    }
    for(const portal of boss.summons){
      const x=portal.x+20,y=portal.y,charge=clamp(1-portal.warning/portal.life,0,1);
      BossVFX.portal(x,y,105+charge*25,.5+charge*.5);
      ctx.font='bold 10px Manrope, sans-serif';ctx.textAlign='center';ctx.fillStyle='#f7c0a4';ctx.shadowColor='#102236';ctx.shadowBlur=4;ctx.fillText(I18n.t("text.summoning"),x,y-90);ctx.shadowBlur=0;
    }
    if(boss.autoPhase==='windup'){
      const x=boss.autoFace>0?boss.x+boss.w*.4:boss.x-175;
      ctx.fillStyle=realm===2?'#253c5899':'#ff9c6238';ctx.fillRect(x,boss.y-55,238,205);ctx.strokeStyle=realm===2?'#fff0bd':'#ffb889';ctx.lineWidth=3;ctx.setLineDash([9,6]);ctx.strokeRect(x,boss.y-55,238,205);ctx.setLineDash([]);
    }
    const elapsed=boss.phaseDuration-boss.clock,feet=boss.y+boss.h;
    const autoStrike=boss.autoPhase==='strike',strike=boss.phase==='strike';
    if(realm===0&&strike&&['cleave','dash','doubleCut'].includes(boss.move)){
      if(boss.move!=='doubleCut'||elapsed<.2||elapsed>.58&&elapsed<.8){
        const progress=boss.move==='doubleCut'?(elapsed<.2?elapsed/.2:(elapsed-.58)/.22):elapsed/boss.phaseDuration;
        BossVFX.slash('slashGold',boss.x+boss.w/2+boss.face*75,feet-78,190,132,boss.face,progress);
      }
    }
    if(realm===1&&(autoStrike||strike&&['hammer','slam'].includes(boss.move))){
      const face=autoStrike?boss.autoFace:boss.face,progress=autoStrike?1-boss.autoClock/boss.autoDuration:elapsed/boss.phaseDuration;
      BossVFX.slash('slashFire',boss.x+boss.w/2+face*85,feet-75,235,150,face,progress);
      BossVFX.impact(boss.x+boss.w/2+face*90,feet,230,105,.9);
    }
    if(realm===2&&autoStrike)BossVFX.slash(boss.stage===2?'slashShadow':'slashGold',boss.x+boss.w/2+boss.autoFace*70,feet-78,200,148,boss.autoFace,1-boss.autoClock/boss.autoDuration);
    if(realm===1&&boss.phase==='windup'&&boss.move==='slam'){
      const target=clamp(boss.targetX,level.arena.x+100,level.arena.x+level.arena.w-100);
      for(const d of [-1,0,1])BossVFX.fissure(target+d*170,level.arena.y,112,.75);
    }
    if(boss.phase==='windup'&&['cleave','dash','doubleCut'].includes(boss.move)){
      const x=boss.face>0?boss.x+40:boss.x-220,width=boss.move==='dash'?460:240;
      ctx.fillStyle='#ffe0a229';ctx.fillRect(boss.face>0?x:x-width+240,boss.y+30,width,85);
      ctx.strokeStyle='#ffe2a0';ctx.lineWidth=2;ctx.setLineDash([12,8]);ctx.strokeRect(boss.face>0?x:x-width+240,boss.y+30,width,85);ctx.setLineDash([]);
    }
    if(boss.lava)BossVFX.lava(boss.lava);
    for(const h of boss.hazards){
      if(h.kind==='lightPillar'){
        const x=h.x+h.w/2,feet=h.y+h.h,charge=clamp(1-h.warning/.95,0,1);
        ctx.save();ctx.shadowBlur=0;
        ctx.fillStyle='#132b42d9';ctx.strokeStyle='#ffe5a2';ctx.lineWidth=2;
        ctx.beginPath();ctx.ellipse(x,feet-2,h.w*.8,7,0,0,Math.PI*2);ctx.fill();ctx.stroke();
        if(!h.active){
          ctx.strokeStyle='#d8bd827d';ctx.lineWidth=1.5;ctx.setLineDash([8,12]);
          ctx.beginPath();for(const edge of [h.x,h.x+h.w]){ctx.moveTo(edge,h.y);ctx.lineTo(edge,feet-10);}ctx.stroke();ctx.setLineDash([]);
        }
        holySpell('holyLance',x,feet,h.h-10,h.w+22,0,h.active?1:.16+charge*.28);
        ctx.restore();
      }else if(h.kind==='shadowPillar')BossVFX.column(h);
      else BossVFX.eruption(h);
    }
    ctx.restore();
  }
  function gates(r) {
    for (const g of level.gates) {
      if(g.kind==='council'){
        if(level.councilGate)councilGate(level.councilGate,hasFlag('councilGateOpen'));
        continue;
      }
      if (g.x + g.w < camera - 80 || g.x > camera + viewW + 80 || g.y + g.h < cameraY - 80 || g.y > cameraY + H + 80) continue;
      if(g.kind==='shadow'&&g.requiresDash){
        // Painted Kiba smoke remains visible while Momo phases through it.
        const pulse=reducedMotion.matches?1:.94+Math.sin(time*1.7)*.06;
        ctx.save();ctx.globalAlpha*=dash>0?.3:.8;
        ctx.fillStyle='#171020c7';ctx.fillRect(g.x,g.y,g.w,g.h);
        BossVFX.stamp('shadowColumn',g.x+g.w/2,g.y+g.h+15,g.w*2.15,g.h*1.22,{alpha:pulse});
        ctx.restore();continue;
      }
      if(gatePass(g))continue;
      if(g.kind==='secretRock'||g.kind==='fragile'){
        secretRock(g);continue;
      }
      if (g.kind === 'root') {
        const rect = ART_FRAMES.terrain[0][1];
        // This strip retains long roots that overlap the road beneath it.
        tile(rect,g.x-4,g.y,g.w+8,g.h+40,true,.925);
        continue;
      }
      const horizontal = g.w > g.h;
      const color = g.kind === 'fire' || g.kind === 'bells' ? '#edcd88' : '#c293dd';
      ctx.save();
      const gradient = horizontal ? ctx.createLinearGradient(0,g.y-15,0,g.y+g.h+15) : ctx.createLinearGradient(g.x-15,0,g.x+g.w+15,0);
      gradient.addColorStop(0,color+'00');gradient.addColorStop(.5,color+'68');gradient.addColorStop(1,color+'00');
      ctx.fillStyle=gradient;ctx.fillRect(g.x-15,g.y-15,g.w+30,g.h+30);
      ctx.strokeStyle=color+'c0';ctx.lineWidth=1.2;ctx.shadowColor=color;ctx.shadowBlur=8;
      const length=horizontal?g.w:g.h;
      for(let t=40;t<length;t+=96){
        const x=horizontal?g.x+t:g.x+g.w/2,y=horizontal?g.y+g.h/2:g.y+t;
        if(!visiblePoint({x,y},100))continue;
        ctx.save();ctx.translate(x,y);ctx.rotate(time*.15+t*.01);ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.stroke();
        ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(8,5);ctx.lineTo(-8,5);ctx.closePath();ctx.stroke();ctx.restore();
      }
      ctx.restore();
    }
  }
  function hazards(r) {
    for(const h of level.hazards){
      if(!visiblePoint(h))continue;
      const glow=ctx.createLinearGradient(0,h.y-28,0,h.y+22);glow.addColorStop(0,'#ed896700');glow.addColorStop(.65,'#e7616355');glow.addColorStop(1,'#f3be9b11');ctx.fillStyle=glow;ctx.fillRect(h.x-4,h.y-28,h.w+8,50);
      for(let i=0;i<h.w/16;i++){const x=h.x+i*16+Math.sin(time*2+i)*3,y=h.y-((time*32+i*13)%38);ctx.save();ctx.globalAlpha=.35+(1-(h.y-y)/40)*.4;const g=ctx.createRadialGradient(x,y,0,x,y,7);g.addColorStop(0,'#ffd5a2');g.addColorStop(1,'#e1778800');ctx.fillStyle=g;ctx.fillRect(x-7,y-7,14,14);ctx.restore();}
    }
  }
  function projectile(p) {
    if(BossVFX.projectile(p))return;
    if(p.kind==='holyArrow'){
      holySpell('holyArrow',p.x,p.y,p.source?.startsWith('mini:')?100:124,32,Math.atan2(p.vy,p.vx));return;
    }
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.vy,p.vx));
    if (p.kind === 'arrow') {
      ctx.strokeStyle = '#d0af77';ctx.lineWidth = 2;ctx.beginPath();ctx.moveTo(-19,0);ctx.lineTo(13,0);ctx.stroke();
      ctx.fillStyle = '#f2e3b9';ctx.beginPath();ctx.moveTo(19,0);ctx.lineTo(10,-4);ctx.lineTo(12,0);ctx.lineTo(10,4);ctx.closePath();ctx.fill();
      ctx.strokeStyle = '#d9dfd4';ctx.lineWidth = 1;for(const d of [-1,1]){ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(-21,d*4);ctx.lineTo(-16,d*4);ctx.stroke();}
    } else {
      if(p.kind==='shadowBolt'){ctx.shadowColor='#b683ff';ctx.shadowBlur=22;ctx.fillStyle='#251339';ctx.beginPath();ctx.ellipse(0,0,14,9,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d9a9ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-30,-7);ctx.quadraticCurveTo(-8,-13,10,-3);ctx.stroke();}
      const g=ctx.createRadialGradient(0,0,0,0,0,p.kind==='shadowBolt'?28:19);g.addColorStop(0,'#fff3e3');g.addColorStop(.22,p.color);g.addColorStop(1,p.color+'00');ctx.fillStyle=g;ctx.fillRect(-19,-19,38,38);
      ctx.strokeStyle=p.color;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,9+Math.sin(time*9)*1.5,-1.5,1.5);ctx.stroke();
      ctx.globalAlpha=.45;ctx.beginPath();ctx.moveTo(-10,0);ctx.quadraticCurveTo(-22,-6,-34,0);ctx.stroke();
    }
    ctx.restore();
  }
  function holySpell(key,x,y,length,span,angle=0,alpha=1){
    const art=ART_EFFECTS[key];if(!art||!usable(art.image))return;
    const sx=key==='holyArrow'?length/(art.tipX-art.start):span/art.inkWidth;
    const sy=key==='holyArrow'?span/art.inkHeight:length/(art.tipY-art.start);
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha*=alpha;
    ctx.shadowColor='#142b3f';ctx.shadowBlur=3;
    ctx.drawImage(images[art.image],-art.tipX*sx,-art.tipY*sy,art.w*sx,art.h*sy);
    ctx.restore();
  }
  return {ready,images,failures,get loaded(){return completed;},get total(){return entries.length;},backdropPhase,updateAtmosphere,resetAtmosphere,secretBackdropState,backdrop,campBackdrop,campScenery,campPathMarker,councilBackdrop,councilGate,councilKey,terrain,torii,shrine,objects,actor,projectile,gates,hazards,winds,bossEffects,momoSlash,dashTrail,secretScenery};
})();
