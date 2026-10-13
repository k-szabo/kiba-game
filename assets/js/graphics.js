/* Illustrated game art. Images are original, alpha-preserving PNG assets. */
'use strict';
const Visuals = (() => {
  const images = {};
  const patterns = new Map();
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
    ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h,
      -(rect.anchorX - rect.x) * s, -(rect.anchorY - rect.y) * s,
      rect.w * s, rect.h * s);
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
    ctx.drawImage(images.terrain, rect.x, rect.y, rect.w, rect.h, x, top, width, height);
  }
  function terrain(r, items) {
    const row = ART_FRAMES.terrain[realm];
    for (const p of items) {
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
    const role = isBoss ? 'boss' : e.kind === 'fly' ? (realm === 0 ? 'mage' : 'archer') : e.kind;
    const rows = ART_FRAMES.enemies[faction()][role] || ART_FRAMES.enemies[faction()].guard;
    const attacking = isBoss ? e.phase === 'strike' : e.attackTime > 0;
    const rect = rows[attacking ? 1 : 0];
    const feet = e.y + e.h, x = e.x + e.w / 2;
    const height = isBoss ? [164,180,176][realm] : role === 'shield' ? 102 : role === 'mage' ? 101 : 94;
    const face = isBoss ? e.phase === 'wait' ? (player.x > e.x ? 1 : -1) : (e.vx || 1) : e.face;
    shadow(x, feet, isBoss ? 57 : e.kind === 'fly' ? 17 : 26, e.kind === 'fly' ? .1 : .3);
    ctx.save();ctx.globalAlpha = e.stun > 0 || e.inv > 0 ? .65 : 1;
    const walking = !isBoss && Math.abs(e.walkSpeed || 0) > 10 && !e.windup;
    const bob = walking ? Math.sin(time * 11 + e.origin) * 1.6 : Math.sin(time * 2 + x) * .6;
    frame(faction() + 'Enemies', rect, x, feet + 1, height, face, bob, walking ? Math.sin(time * 11 + e.origin) * .014 : 0);
    ctx.restore();
    if (e.blockFlash > 0) {
      ctx.save();ctx.globalAlpha = Math.min(1, e.blockFlash * 5);ctx.strokeStyle = '#fff0b3';ctx.lineWidth = 3;
      ctx.beginPath();ctx.arc(x + face * 18, feet - 35, 32, face > 0 ? -1.1 : 2, face > 0 ? 1.1 : 4.2);ctx.stroke();ctx.restore();
    }
    const winding = isBoss ? e.phase === 'windup' : e.windup > 0;
    if (winding) {
      const duration = isBoss ? .85 : e.windupDuration;
      const remaining = isBoss ? e.clock : e.windup;
      const charged = clamp(1 - remaining / duration, 0, 1);
      ctx.save();ctx.strokeStyle = role === 'mage' ? r.accent : '#f0cf88';ctx.lineWidth = 2;
      ctx.globalAlpha = .45 + charged * .55;ctx.beginPath();ctx.ellipse(x, feet + 4, isBoss ? 66 : 32, 7, 0, -Math.PI, -Math.PI + charged * Math.PI * 2);ctx.stroke();
      if (role === 'mage') {const g = ctx.createRadialGradient(x + face * 30, feet - 57, 1, x + face * 30, feet - 57, 28);g.addColorStop(0,'#ecddff');g.addColorStop(.3,r.accent+'bb');g.addColorStop(1,r.accent+'00');ctx.fillStyle=g;ctx.fillRect(x+face*30-28,feet-85,56,56);}
      ctx.restore();
    }
    if (!isBoss && e.hp < e.maxHp) {
      ctx.fillStyle = '#0a172bcc';ctx.fillRect(x - 19, feet - height - 17, 38, 3);
      ctx.fillStyle = e.kind === 'shield' ? '#ddba72' : '#d99583';ctx.fillRect(x - 19, feet - height - 17, 38 * Math.max(0,e.hp/e.maxHp), 3);
    }
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
      const g=ctx.createRadialGradient(0,0,0,0,0,19);g.addColorStop(0,'#fff3e3');g.addColorStop(.22,p.color);g.addColorStop(1,p.color+'00');ctx.fillStyle=g;ctx.fillRect(-19,-19,38,38);
      ctx.strokeStyle=p.color;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,9+Math.sin(time*9)*1.5,-1.5,1.5);ctx.stroke();
      ctx.globalAlpha=.45;ctx.beginPath();ctx.moveTo(-10,0);ctx.quadraticCurveTo(-22,-6,-34,0);ctx.stroke();
    }
    ctx.restore();
  }
  return {ready,images,failures,get loaded(){return completed;},get total(){return entries.length;},backdrop,terrain,torii,shrine,objects,actor,projectile,gates,hazards};
})();
