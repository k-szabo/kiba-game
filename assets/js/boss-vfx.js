/* Painted boss effects. Source pixels are never recolored; gameplay owns timing and collision. */
'use strict';
const BOSS_FX_ART={
  "lava": {
    "image": "fxLava",
    "rect": {
      "x": 0,
      "y": 236,
      "w": 2168,
      "h": 376
    },
    "anchorX": 1086.0,
    "anchorY": 75.32
  },
  "impact": {
    "image": "fxImpact",
    "rect": {
      "x": 191,
      "y": 16,
      "w": 1185,
      "h": 986
    },
    "anchorX": 577.0,
    "anchorY": 895.36
  },
  "fissure": {
    "image": "fxFissure",
    "rect": {
      "x": 9,
      "y": 185,
      "w": 2160,
      "h": 395
    },
    "anchorX": 1077.0,
    "anchorY": 271.12
  },
  "ember": {
    "image": "fxEmber",
    "rect": {
      "x": 112,
      "y": 72,
      "w": 1646,
      "h": 622
    },
    "anchorX": 1443.2,
    "anchorY": 332.5
  },
  "slashGold": {
    "image": "fxSlashes",
    "rect": {
      "x": 104,
      "y": 103,
      "w": 814,
      "h": 389
    },
    "anchorX": 408.0,
    "anchorY": 153
  },
  "slashFire": {
    "image": "fxSlashes",
    "rect": {
      "x": 89,
      "y": 558,
      "w": 848,
      "h": 433
    },
    "anchorX": 423.0,
    "anchorY": 210
  },
  "slashShadow": {
    "image": "fxSlashes",
    "rect": {
      "x": 81,
      "y": 1051,
      "w": 868,
      "h": 426
    },
    "anchorX": 431.0,
    "anchorY": 229
  },
  "shadowBolt": {
    "image": "fxDarkMagic",
    "rect": {
      "x": 32,
      "y": 318,
      "w": 480,
      "h": 404
    },
    "anchorX": 368,
    "anchorY": 227
  },
  "shadowColumn": {
    "image": "fxDarkMagic",
    "rect": {
      "x": 512,
      "y": 59,
      "w": 512,
      "h": 903
    },
    "anchorX": 258,
    "anchorY": 816
  },
  "portal": {
    "image": "fxDarkMagic",
    "rect": {
      "x": 1024,
      "y": 321,
      "w": 487,
      "h": 605
    },
    "anchorX": 246,
    "anchorY": 414
  }
};
const BossVFX=(()=>{
  function stamp(key,x,y,width,height,{face=1,angle=0,alpha=1}={}){
    const art=BOSS_FX_ART[key],image=Visuals.images[art?.image];
    if(!art||!image?.complete||!image.naturalWidth)return;
    const r=art.rect;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(face,1);ctx.globalAlpha*=alpha;
    ctx.drawImage(image,r.x,r.y,r.w,r.h,-art.anchorX*width/r.w,-art.anchorY*height/r.h,width,height);ctx.restore();
  }
  function marker(x,feet,width,color='#dda8f3'){
    ctx.save();ctx.fillStyle='#102236d9';ctx.strokeStyle=color;ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(x,feet-2,Math.max(18,width/2),6,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
  }
  function fissure(x,feet,width=150,alpha=1){stamp('fissure',x,feet,width,42,{alpha});}
  function impact(x,feet,width=190,height=160,alpha=1){stamp('impact',x,feet,width,height,{alpha});}
  function portal(x,feet,width=115,alpha=1){stamp('portal',x,feet,width,width*.64,{alpha});}
  function slash(kind,x,y,width,height,face=1,progress=.5){
    stamp(kind,x,y,width,height,{face,alpha:.7+Math.sin(clamp(progress,0,1)*Math.PI)*.3,
      angle:reducedMotion.matches?0:(progress-.5)*.2*face});
  }
  function lava(l){
    ctx.save();ctx.beginPath();ctx.rect(l.x,l.y-18,l.w,l.h+85);ctx.clip();
    if(l.active){
      const depth=ctx.createLinearGradient(0,l.y+4,0,l.y+94);
      depth.addColorStop(0,'#a93b2680');depth.addColorStop(.45,'#631916aa');depth.addColorStop(1,'#49152200');
      ctx.fillStyle=depth;ctx.fillRect(l.x,l.y+4,l.w,90);
      const drift=reducedMotion.matches?0:(time*24)%440,start=l.x-drift-260;
      for(let i=0,x=start;x<l.x+l.w+260;i++,x+=440)stamp('lava',x,l.y,520,100,{face:i%2?-1:1});
    }else for(let x=l.x+80;x<l.x+l.w;x+=230)fissure(x,l.y+22,195,.65);
    ctx.restore();
  }
  function column(h){
    const x=h.x+h.w/2,feet=h.y+h.h,alpha=h.active?1:.16+clamp(1-h.warning,0,1)*.25;
    marker(x,feet,h.w+12);portal(x,feet,h.w+42,h.active?.9:.5);
    stamp('shadowColumn',x,feet,h.w+46,h.h,{alpha});
  }
  function eruption(h){
    const x=h.x+h.w/2,feet=h.y+h.h;
    fissure(x,feet,h.w+36,h.active?1:.7);marker(x,feet,h.w+8,'#efb07c');
    if(h.active)impact(x,feet,h.w+28,h.h+24);
  }
  function projectile(p){
    const ember=p.kind==='ember',wave=p.kind==='wave',radius=p.radius||(ember?9:10);
    if(!ember&&!wave&&p.kind!=='shadowBolt')return false;
    const width=wave?168:ember?96:Math.max(90,radius*6),height=wave?92:ember?46:Math.max(42,radius*3.5);
    stamp(ember?'ember':'shadowBolt',p.x,p.y,width,height,{angle:Math.atan2(p.vy,p.vx)});return true;
  }
  function devour(h){
    const x=h.x+h.w/2,feet=h.y+h.h;
    ctx.save();const glow=ctx.createRadialGradient(x,feet-120,35,x,feet-120,h.w*.62);
    glow.addColorStop(0,'#13091fd9');glow.addColorStop(.55,'#4e24607c');glow.addColorStop(1,'#170c2500');
    ctx.fillStyle=glow;ctx.fillRect(h.x-h.w*.2,h.y-h.h*.3,h.w*1.4,h.h*1.7);ctx.restore();
    portal(x,feet-4,Math.min(740,h.w*.7),.85);
  }
  return Object.freeze({stamp,marker,fissure,impact,portal,slash,lava,column,eruption,projectile,devour});
})();

/* Geometry-only boss warnings share their readable dash style. No combat clock is advanced. */
const BossCues=Object.freeze({
 box(box,color='#ffe2a0',fill=null){
  if(!box||![box.x,box.y,box.w,box.h].every(Number.isFinite)||box.w<=0||box.h<=0)return;
  ctx.save();ctx.shadowBlur=0;if(fill){ctx.fillStyle=fill;ctx.fillRect(box.x,box.y,box.w,box.h);}
  ctx.setLineDash([7,6]);ctx.lineDashOffset=0;ctx.lineJoin='round';ctx.strokeStyle='#091521';ctx.lineWidth=7;ctx.strokeRect(box.x,box.y,box.w,box.h);
  ctx.strokeStyle=color;ctx.lineWidth=3;ctx.strokeRect(box.x,box.y,box.w,box.h);ctx.setLineDash([]);ctx.restore();
 }
});
