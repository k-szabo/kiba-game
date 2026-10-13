/* Illustrated game art. Images are original, alpha-preserving PNG assets. */
'use strict';
const Visuals = (() => {
  const images = {};
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
    if (button) button.innerHTML = completed === entries.length
      ? 'Az utazás kezdete <span>→</span>'
      : `Grafika betöltése · ${completed}/${entries.length}`;
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
        const s = Math.max(viewW / image.naturalWidth, H / image.naturalHeight);
        const width = image.naturalWidth * s, height = image.naturalHeight * s;
        const ratio = clamp(cameraY / Math.max(1, level.height - H), 0, 1);
        ctx.drawImage(image, (viewW - width) * .5 + Math.sin(camera * .0003) * 6,
          -(height - H) * ratio, width, height);
      }
    }
    ctx.fillStyle = realm === 1 ? '#140c2028' : realm === 2 ? '#24314820' : '#11252d30';
    ctx.fillRect(0, 0, viewW, H);
    // Fog layers and particles move at different speeds to retain depth.
    for (let layer = 0; layer < 3; layer++) {
      ctx.save();ctx.globalAlpha = realm === 1 ? .045 : .05;
      ctx.fillStyle = r.fog;
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
      ctx.fillStyle = realm === 0 ? '#e5a184' : r.gold;
      ctx.beginPath();ctx.ellipse(x, y, realm === 0 ? 2.6 : 1.4, 1.2, time + i, 0, Math.PI * 2);ctx.fill();ctx.restore();
    }
  }
  function tile(rect, x, y, width, height) {
    if (!usable('terrain') || width <= 0) return;
    const top=y-((rect.surfaceY??rect.y)-rect.y)*height/rect.h;
    ctx.save();
    ctx.translate(x,top);ctx.scale(width/rect.w,height/rect.h);ctx.translate(-rect.x,-rect.y);sourceClip(rect);
    ctx.drawImage(images.terrain, rect.x, rect.y, rect.w, rect.h, rect.x,rect.y,rect.w,rect.h);
    ctx.restore();
  }
  function terrain(r, items) {
    const row = ART_FRAMES.terrain[realm];
    for (const p of items) {
      if(p.broken)continue;
      if (state !== 'menu' && (p.x + p.w < camera - 100 || p.x > camera + viewW + 100 || p.y + p.h < cameraY - 140 || p.y > cameraY + H + 100)) continue;
      const height = p.kind === 'ground' ? Math.max(130, p.h) : realm === 2 ? 90 : 70;
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
      ctx.fillText((realm < 2 ? realms[realm + 1].short : 'ÁTJÁRÓ').toUpperCase() + ' · E', x, feet - 145);
      ctx.font = '10px Manrope, sans-serif';ctx.fillText('Lépj a kapu alá', x, feet - 126);
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
      ctx.fillText(realm === 0 ? '風' : '影', x, feet - 136 + Math.sin(time * 2) * 3);ctx.restore();
    }
  }
  function objects(r) {
    for (const o of level.objects) {
      if (!visiblePoint(o)) continue;
      const taken = hasFlag(o.id);
      if (o.type === 'bell') {shadow(o.x, o.y, 45);prop('bell', o.x, o.y + 2, 158, taken ? .62 : 1);}
      else if (o.type === 'rescue') {if (!taken) prop('cage', o.x, o.y + 2, 125);drawSpirit(o.x, o.y - 58, r.gold);}
      else drawSpirit(o.x, o.y - 35, r.gold);
      ctx.save();ctx.font = '10px Manrope, sans-serif';ctx.fillStyle = r.gold;ctx.textAlign = 'center';
      ctx.fillText(taken ? '✓' : o.name, o.x, o.y - (o.type === 'bell' ? 175 : 148));ctx.restore();
    }
  }

  function actor(e, r, isBoss = false) {
    const role=isBoss?'boss':enemyRole(e),feet=e.y+e.h,x=e.x+e.w/2;
    const height=isBoss?[164,180,176][realm]:role==='shield'?102:role==='mage'?101:94;
    const face=isBoss?e.face:e.face;
    let index=0,key,rect;
    if(isBoss){
      if(e.phase==='windup')index=1+Math.min(1,Math.floor(clamp(1-e.clock/e.phaseDuration,0,1)*2));
      else if(e.phase==='strike')index=3+Math.min(1,Math.floor(clamp(1-e.clock/e.phaseDuration,0,1)*2));
      else if(e.phase==='recover')index=5;
      key='bosses';rect=ART_FRAMES.bosses[realm][index];
    }else{
      let action='walk';
      if(e.windup>0){action='attack';index=Math.min(2,Math.floor(clamp(1-e.windup/e.windupDuration,0,1)*3));}
      else if(e.attackTime>0){action='attack';index=3+Math.min(1,Math.floor(e.attackElapsed/e.attackDuration*2));}
      else if(e.recovery>0||e.stun>0){action='attack';index=5;}
      else if(Math.abs(e.walkSpeed)>2)index=Math.floor(e.animTime*12)%6;
      key=faction()+(action==='walk'?'Walk':'Attack');rect=ART_FRAMES.animations[faction()][action][role][index];
    }
    shadow(x,feet,isBoss?57:e.kind==='fly'?17:26,e.kind==='fly'?.1:.3);
    ctx.save();ctx.globalAlpha=e.stun>0||e.inv>0?.65:1;
    const bob=isBoss&&realm===2?Math.sin(time*2)*3:!isBoss&&e.kind==='fly'?Math.sin(time*3)*2:0;
    frame(key,rect,x,feet+1,height,face,bob,0);ctx.restore();
    if(e.blockFlash>0){
      ctx.save();ctx.globalAlpha=Math.min(1,e.blockFlash*5);ctx.strokeStyle='#fff0b3';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(x+face*18,feet-35,32,face>0?-1.1:2,face>0?1.1:4.2);ctx.stroke();ctx.restore();
    }
    const winding=isBoss?e.phase==='windup':e.windup>0;
    if(winding){
      const charged=clamp(1-(isBoss?e.clock:e.windup)/(isBoss?e.phaseDuration:e.windupDuration),0,1);
      const color=isBoss&&realm===2&&e.move==='shadowBolts'?'#c393ff':role==='mage'?r.accent:'#ffe098';
      ctx.save();ctx.strokeStyle=color;ctx.lineWidth=isBoss?4:2.5;ctx.globalAlpha=.6+charged*.4;ctx.shadowColor=color;ctx.shadowBlur=isBoss?20:8;
      ctx.beginPath();ctx.ellipse(x,feet+4,isBoss?76:32,isBoss?12:7,0,-Math.PI,-Math.PI+charged*Math.PI*2);ctx.stroke();
      const handX=x+face*30,handY=feet-height*.44;
      const glow=ctx.createRadialGradient(handX,handY,0,handX,handY,isBoss?33:22);glow.addColorStop(0,'#fffbe6');glow.addColorStop(.25,color+'b0');glow.addColorStop(1,color+'00');
      ctx.fillStyle=glow;ctx.fillRect(handX-60,handY-60,120,120);ctx.restore();
      if(isBoss){
        ctx.save();ctx.font='bold 13px Manrope, sans-serif';ctx.textAlign='center';ctx.fillStyle=color;ctx.shadowColor='#080512';ctx.shadowBlur=5;
        const labels={cleave:'KARDCSAPÁS',dash:'ROHAM',doubleCut:'KETTŐS VÁGÁS',slam:'FÖLDRENGÉS',lava:'LÁVA · UGROJ A PLATFORMOKRA',embers:'PARÁZSZÁPOR',lightArrows:'FÉNYNYILAK',shadowBolts:'ÁRNYÉKLÖVEDÉKEK',eclipse:'NAPFOGYATKOZÁS'};
        ctx.fillText(labels[e.move]||'TÁMADÁS',x,feet-height-38);ctx.restore();
      }
    }
    if(!isBoss&&e.hp<e.maxHp){ctx.fillStyle='#0a172bcc';ctx.fillRect(x-19,feet-height-17,38,3);ctx.fillStyle=e.kind==='shield'?'#ddba72':'#d99583';ctx.fillRect(x-19,feet-height-17,38*Math.max(0,e.hp/e.maxHp),3);}
  }
  function winds(r) {
    for(const w of level.winds){
      if(w.afterBoss&&!defeated[realm]||w.x+w.w<camera||w.x>camera+viewW||w.y+w.h<cameraY||w.y>cameraY+H)continue;
      const cx=w.x+w.w/2,top=Math.max(w.y,cameraY-50),bottom=Math.min(w.y+w.h,cameraY+H+50);
      ctx.save();ctx.beginPath();ctx.rect(w.x-40,top-15,w.w+80,bottom-top+30);ctx.clip();
      const gradient=ctx.createLinearGradient(w.x,0,w.x+w.w,0);
      gradient.addColorStop(0,'#ffe6a300');gradient.addColorStop(.22,'#3c819274');gradient.addColorStop(.5,'#84cad58c');gradient.addColorStop(.78,'#3c819274');gradient.addColorStop(1,'#ffe6a300');
      ctx.fillStyle=gradient;ctx.fillRect(w.x,top,w.w,bottom-top);
      ctx.shadowColor='#a8e8ff';ctx.shadowBlur=16;
      for(let band=0;band<5;band++){
        ctx.strokeStyle=band%2?'#e4f7ffbc':'#ffe6a79c';ctx.lineWidth=band===2?3:1.5;ctx.beginPath();
        for(let y=top;y<=bottom;y+=12){const x=w.x+w.w*(band+1)/6+Math.sin(y*.023+time*3+band)*12;if(y===top)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
      }
      for(let i=0;i<Math.ceil(w.h/125);i++){
        const y=w.y+((i*125-time*210)%w.h+w.h)%w.h;
        if(y<top-30||y>bottom+30)continue;
        ctx.strokeStyle='#234559cc';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(cx-14,y+12);ctx.lineTo(cx,y-3);ctx.lineTo(cx+14,y+12);ctx.stroke();ctx.strokeStyle='#fff5c6';ctx.lineWidth=3.5;ctx.stroke();
        ctx.lineWidth=2;ctx.strokeStyle='#c7f2ffbb';ctx.beginPath();ctx.moveTo(cx-10,y+23);ctx.lineTo(cx,y+12);ctx.lineTo(cx+10,y+23);ctx.stroke();
      }
      for(let i=0;i<24;i++){
        const x=w.x+noise(i+w.x)*w.w,y=w.y+((noise(i+1)*w.h-time*(180+i*2))%w.h+w.h)%w.h;
        ctx.fillStyle=i%3?'#d0f5ffcc':'#fff0b3';ctx.fillRect(x,y,2,10);
      }
      ctx.restore();
      if(w.y+w.h>cameraY&&w.y+w.h<cameraY+H+100){
        ctx.save();ctx.strokeStyle='#ffe8a6';ctx.lineWidth=3;ctx.shadowColor='#ffe8a6';ctx.shadowBlur=18;ctx.beginPath();ctx.ellipse(cx,w.y+w.h-8,w.w*.53,13,0,0,Math.PI*2);ctx.stroke();
        ctx.shadowBlur=0;ctx.fillStyle='#163847dd';ctx.fillRect(cx-122,w.y+w.h-49,244,27);ctx.fillStyle='#fff4c9';ctx.font='bold 13px Manrope, sans-serif';ctx.textAlign='center';ctx.fillText('UGORJ A SZÉLÁRAMLATBA',cx,w.y+w.h-30);ctx.restore();
      }
    }
  }
  function bossEffects(r) {
    if(!bossStarted||!boss||boss.dead)return;
    ctx.save();
    if(boss.phase==='windup'&&['cleave','dash','doubleCut'].includes(boss.move)){
      const x=boss.face>0?boss.x+40:boss.x-220,width=boss.move==='dash'?460:240;
      ctx.fillStyle='#ffe0a229';ctx.fillRect(boss.face>0?x:x-width+240,boss.y+30,width,85);
      ctx.strokeStyle='#ffe2a0';ctx.lineWidth=2;ctx.setLineDash([12,8]);ctx.strokeRect(boss.face>0?x:x-width+240,boss.y+30,width,85);ctx.setLineDash([]);
    }
    if(boss.lava){
      const lava=boss.lava,y=lava.y;
      ctx.beginPath();ctx.rect(lava.x,y-110,lava.w,150);ctx.clip();
      if(lava.active){
        const g=ctx.createLinearGradient(0,y-40,0,y+35);g.addColorStop(0,'#ffb84c00');g.addColorStop(.45,'#ffab35b8');g.addColorStop(1,'#de3922');ctx.fillStyle=g;ctx.fillRect(lava.x,y-40,lava.w,80);
        ctx.strokeStyle='#ffe591';ctx.lineWidth=5;ctx.beginPath();
        for(let x=lava.x;x<lava.x+lava.w;x+=12){const yy=y+9+Math.sin(x*.04+time*7)*5;if(x===lava.x)ctx.moveTo(x,yy);else ctx.lineTo(x,yy);}ctx.stroke();
        for(let x=lava.x+20;x<lava.x+lava.w;x+=95){ctx.fillStyle='#ffd568';ctx.globalAlpha=.6;ctx.beginPath();ctx.ellipse(x+Math.sin(time+x)*10,y-((time*65+x)%75),3,7,0,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
      }else{
        ctx.strokeStyle='#ffb067';ctx.lineWidth=3;ctx.shadowColor='#ff6945';ctx.shadowBlur=15;
        for(let x=lava.x+12;x<lava.x+lava.w;x+=75){ctx.beginPath();ctx.moveTo(x,y+20);ctx.lineTo(x+18,y+5);ctx.lineTo(x+10,y-5);ctx.lineTo(x+35,y-14);ctx.stroke();}
      }
      ctx.restore();ctx.save();
    }
    for(const h of boss.hazards){
      if(h.kind==='lightPillar'){
        ctx.shadowColor='#ffefb4';ctx.shadowBlur=h.active?26:10;
        if(h.active){
          const glow=ctx.createLinearGradient(h.x-24,0,h.x+h.w+24,0);glow.addColorStop(0,'#fff1b300');glow.addColorStop(.5,'#fff8d7');glow.addColorStop(1,'#ffe48a00');ctx.fillStyle=glow;ctx.fillRect(h.x-24,h.y,h.w+48,h.h);
          ctx.fillStyle='#fffbe5';ctx.fillRect(h.x+h.w*.4,h.y,h.w*.2,h.h-25);ctx.beginPath();ctx.moveTo(h.x-12,h.y+h.h-40);ctx.lineTo(h.x+h.w/2,h.y+h.h+5);ctx.lineTo(h.x+h.w+12,h.y+h.h-40);ctx.closePath();ctx.fill();
        }else{
          ctx.strokeStyle='#fff0a3';ctx.lineWidth=2;ctx.setLineDash([10,10]);ctx.strokeRect(h.x-5,h.y,h.w+10,h.h);ctx.setLineDash([]);
          ctx.fillStyle='#ffe39666';ctx.fillRect(h.x-28,h.y+h.h-12,h.w+56,12);
          ctx.beginPath();ctx.moveTo(h.x+h.w/2,h.y+h.h-22);ctx.lineTo(h.x+h.w/2-15,h.y+h.h-43);ctx.lineTo(h.x+h.w/2+15,h.y+h.h-43);ctx.closePath();ctx.fill();
        }
      }else{
        const x=h.x+h.w/2,y=h.y+h.h;
        ctx.shadowColor='#ff8b41';ctx.shadowBlur=20;
        if(h.active){const g=ctx.createLinearGradient(0,h.y,0,y);g.addColorStop(0,'#ffd37c00');g.addColorStop(.45,'#ffb256');g.addColorStop(1,'#ea402a');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(h.x-10,y);ctx.quadraticCurveTo(x-28,h.y+25,x,h.y);ctx.quadraticCurveTo(x+30,h.y+15,h.x+h.w+10,y);ctx.closePath();ctx.fill();}
        else{ctx.strokeStyle='#ffb060';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y-2,h.w/2,8,0,0,Math.PI*2);ctx.stroke();}
      }
    }
    ctx.restore();
  }
  function gates(r) {
    for (const g of level.gates) {
      if (gatePass(g) || g.x + g.w < camera - 80 || g.x > camera + viewW + 80 || g.y + g.h < cameraY - 80 || g.y > cameraY + H + 80) continue;
      if (g.kind === 'root') {
        const rect = ART_FRAMES.terrain[0][1];
        tile(rect,g.x-4,g.y,g.w+8,g.h+40);
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
  return {ready,images,failures,get loaded(){return completed;},get total(){return entries.length;},backdrop,terrain,torii,shrine,objects,actor,projectile,gates,hazards,winds,bossEffects};
})();
