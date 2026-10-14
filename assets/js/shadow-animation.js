/* Eye-registered, alpha-preserving painted poses for Shadow's combat. */
'use strict';
const SHADOW_ATTACK_TIMING=Object.freeze({meleeWindup:.9,meleeStrike:.3,meleeRecovery:1.4,spellWindup:1.25,spellRelease:.58,spellRecovery:.12,devourWindup:2.8});
const SHADOW_CLIPS={
  "idle": {
    "image": "shadowIdle",
    "scale": 1.1,
    "frames": [
      {
        "x": 0,
        "y": 0,
        "w": 512,
        "h": 512,
        "anchorX": 292.52,
        "anchorY": 162.56
      },
      {
        "x": 512,
        "y": 0,
        "w": 512,
        "h": 512,
        "anchorX": 291.36,
        "anchorY": 150.96
      },
      {
        "x": 1024,
        "y": 0,
        "w": 512,
        "h": 512,
        "anchorX": 286.12,
        "anchorY": 149.33
      },
      {
        "x": 0,
        "y": 512,
        "w": 512,
        "h": 512,
        "anchorX": 290.89,
        "anchorY": 152.86
      },
      {
        "x": 512,
        "y": 512,
        "w": 512,
        "h": 512,
        "anchorX": 282.49,
        "anchorY": 161.2
      },
      {
        "x": 1024,
        "y": 512,
        "w": 512,
        "h": 512,
        "anchorX": 292.43,
        "anchorY": 163.16
      }
    ]
  },
  "melee": {
    "image": "shadowMelee",
    "scale": 1.4,
    "frames": [
      {
        "x": 0,
        "y": 0,
        "w": 512,
        "h": 512,
        "anchorX": 285.73,
        "anchorY": 205.63
      },
      {
        "x": 512,
        "y": 0,
        "w": 512,
        "h": 512,
        "anchorX": 281.51,
        "anchorY": 209.23
      },
      {
        "x": 1024,
        "y": 0,
        "w": 512,
        "h": 512,
        "anchorX": 298.2,
        "anchorY": 228.66
      },
      {
        "x": 0,
        "y": 512,
        "w": 512,
        "h": 512,
        "anchorX": 359.72,
        "anchorY": 176.33
      },
      {
        "x": 512,
        "y": 512,
        "w": 532,
        "h": 512,
        "anchorX": 388.71,
        "anchorY": 174.31
      },
      {
        "x": 1044,
        "y": 512,
        "w": 492,
        "h": 512,
        "anchorX": 277.44,
        "anchorY": 176.85
      }
    ]
  },
  "cast": {
    "image": "shadowCast",
    "scale": 1.45,
    "frames": [
      {
        "x": 0,
        "y": 0,
        "w": 512,
        "h": 512,
        "anchorX": 283.75,
        "anchorY": 203.17
      },
      {
        "x": 512,
        "y": 0,
        "w": 512,
        "h": 512,
        "anchorX": 266.68,
        "anchorY": 203.33
      },
      {
        "x": 1024,
        "y": 0,
        "w": 512,
        "h": 512,
        "anchorX": 247.69,
        "anchorY": 205.12
      },
      {
        "x": 0,
        "y": 512,
        "w": 512,
        "h": 512,
        "anchorX": 319.29,
        "anchorY": 182.68
      },
      {
        "x": 512,
        "y": 512,
        "w": 512,
        "h": 512,
        "anchorX": 310.91,
        "anchorY": 182.63
      },
      {
        "x": 1024,
        "y": 512,
        "w": 512,
        "h": 512,
        "anchorX": 268.4,
        "anchorY": 187.55
      }
    ]
  },
  "devour": {
    "image": "shadowDevour",
    "scale": 1.36,
    "frames": [
      {
        "x": 0,
        "y": 0,
        "w": 512,
        "h": 512,
        "anchorX": 286.55,
        "anchorY": 212.94
      },
      {
        "x": 512,
        "y": 0,
        "w": 512,
        "h": 512,
        "anchorX": 258.01,
        "anchorY": 230.26
      },
      {
        "x": 1024,
        "y": 0,
        "w": 512,
        "h": 512,
        "anchorX": 255.68,
        "anchorY": 256.8
      },
      {
        "x": 0,
        "y": 512,
        "w": 512,
        "h": 512,
        "anchorX": 285.24,
        "anchorY": 185.62
      },
      {
        "x": 512,
        "y": 512,
        "w": 512,
        "h": 512,
        "anchorX": 267.37,
        "anchorY": 178.27
      },
      {
        "x": 1024,
        "y": 512,
        "w": 512,
        "h": 512,
        "anchorX": 271.26,
        "anchorY": 192.34
      }
    ]
  }
};
const ShadowAnimation=(()=>{
  function sample({auto=null,cast=null,release=null,idleTime=0,deathPose=null}={}){
    if(deathPose)return {...deathPose};
    if(cast?.kind==='devour')return {clip:'devour',frame:Math.min(5,Math.floor(clamp(1-cast.remaining/cast.duration,0,1)*6))};
    if(auto?.stage==='windup'){
      const progress=clamp(1-auto.remaining/(auto.duration||SHADOW_ATTACK_TIMING.meleeWindup),0,1);
      return {clip:'melee',frame:progress<.17?0:progress<.6?1:2};
    }
    const recovery=auto?.stage==='recover'?(auto.duration||SHADOW_ATTACK_TIMING.meleeRecovery)-auto.remaining:null;
    if(recovery!==null&&recovery<SHADOW_ATTACK_TIMING.meleeStrike+.12)return {clip:'melee',frame:recovery<SHADOW_ATTACK_TIMING.meleeStrike*.43?3:4};
    if(release){const progress=release.elapsed/release.duration;return {clip:'cast',frame:progress>=1?0:progress<.34?3:progress<.72?4:5};}
    if(cast?.stage==='windup'){
      const progress=clamp(1-cast.remaining/cast.duration,0,1);
      return {clip:'cast',frame:progress<.15?0:progress<.55?1:2};
    }
    if(recovery!==null)return {clip:'melee',frame:5};
    return {clip:'idle',frame:Math.floor(Math.max(0,idleTime)*3)%6};
  }
  function draw(pose,x,y,alpha=1){
    const clip=SHADOW_CLIPS[pose.clip],rect=clip?.frames[pose.frame],image=Visuals.images[clip?.image];
    if(!rect||!image?.complete||!image.naturalWidth)return;
    const sy=clip.scale,sx=sy*1.18;
    ctx.save();ctx.globalAlpha*=alpha;
    ctx.drawImage(image,rect.x,rect.y,rect.w,rect.h,x-rect.anchorX*sx,y-rect.anchorY*sy,rect.w*sx,rect.h*sy);
    ctx.restore();
  }
  return Object.freeze({sample,draw});
})();
