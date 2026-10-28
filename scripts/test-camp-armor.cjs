'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
const close=(a,b,label)=>assert(Math.abs(a-b)<1e-10,label+': '+a+' != '+b);
{
 const h=harness(),r=h.run;
 for(let rank=0;rank<=5;rank++){
  r('campServices.armorRank='+rank+';player.hp=5;player.inv=0;dash=0;damage(2,1,true);');
  close(r('player.hp'),5-2*300/(300+rank*20),'Rank '+rank+' actual incoming hit');
  assert.equal(r('momoStats().armor'),rank*20);
 }
 // Guard's one point is absorbed first, and armor mitigates the remainder.
 r("weaponStyle='swordShield';campServices.ownedWeapons=['swordShield'];campServices.armorRank=5;initPlayer(level.rests[0]);player.hp=5;player.inv=0;player.face=1;player.onGround=true;player.guardCooldown=0;damage(3,-1,true);");
 close(r('player.hp'),3.5,'Frontal shield then armor');assert(r('player.guardCooldown>0'));
 r('player.hp=5;player.inv=0;player.guardCooldown=0;damage(3,1,true);');close(r('player.hp'),2.75,'Rear hit bypasses directional shield only');
 r('player.hp=5;player.inv=0;player.guardCooldown=0;damage(3,-1,false);');close(r('player.hp'),2.75,'Environmental damage skips shield but uses armor');
 r('player.hp=5;player.inv=0;damage(3,-1,false,true);');close(r('player.hp'),2,'Explicit execution damage bypasses armor');
 r('player.hp=.4;updateHUD();');assert(h.elements.get('health').innerHTML.includes('clip-path'),'Fractional health remains visible');assert(!h.elements.get('health').innerHTML.includes('NaN'));
 r('player.hp=.4;player.inv=1;damage(2,1,true);');close(r('player.hp'),.4,'Invulnerability still precedes armor');
 r('player.inv=0;dash=.2;damage(2,1,true);');close(r('player.hp'),.4,'Dash immunity still precedes armor');
 r('dash=0;var oldArmorPlayer=player;player.y=level.height+200;movePlayer(1/120);');assert(r('player!==oldArmorPlayer'),'Armor cannot survive lethal falls');assert.equal(r('player.hp'),r('player.maxHp'));
}
// The actual grab contact path must remain lethal at low HP through both defenses.
for(const protectedBy of ['none','invulnerability','dash']){
 const h=harness(),r=h.run;
 r("realm=1;level={...levels[1],width:3400,secrets:[...(levels[1].secrets||[]),{id:'armorGrabTest',arena:{x:100,y:-1700,w:3000}}]};platforms=[];checkpoint={x:1800,y:-1700};weaponStyle='swordShield';campServices.ownedWeapons=['swordShield'];campServices.armorRank=5;initPlayer(checkpoint);state='play';var armorSlayer=DoomSlayer.create({id:'doomSlayer',miniboss:'slayer',secretArea:'armorGrabTest',x:2200,y:-1700});enemies=[armorSlayer];DoomSlayer.start(armorSlayer);player.x=armorSlayer.x-65;player.y=armorSlayer.baseY+armorSlayer.h-player.h;player.hp=2;player.inv=0;player.face=1;player.onGround=true;player.guardCooldown=0;dash=0;armorSlayer.move='grab';armorSlayer.phase='windup';armorSlayer.clock=0;armorSlayer.phaseDuration=.8;armorSlayer.attackFace=armorSlayer.face=-1;armorSlayer.targetX=player.x+player.w/2;armorSlayer.targetY=player.y+player.h/2;var beforeGrabPlayer=player;");
 if(protectedBy==='invulnerability')r('player.inv=1;');if(protectedBy==='dash')r('dash=.2;');
 r('DoomSlayer.update(armorSlayer,1/120);DoomSlayer.update(armorSlayer,1/120);');
 if(protectedBy==='none'){assert(r('player!==beforeGrabPlayer'),'Low HP execution kills even with frontal shield and100armor');assert.equal(r('player.hp'),r('player.maxHp'));}
 else{assert(r('player===beforeGrabPlayer'));assert.equal(r('player.hp'),2,protectedBy+' protects from execution');}
}
{
 const h=harness({prologue:true}),r=h.run;
 r('campServices.armorRank=5;player.x=3110;Prologue.update(1/120);Prologue.update(3);player.hp=5;player.inv=0;');
 assert.equal(r('Prologue.phase'),'battle');r('Prologue.hurt(2);');close(r('player.hp'),3.5,'Normal dream attack uses player mitigation');
 r('player.inv=0;Prologue.hurt(player.hp,true);');assert.equal(r('Prologue.phase'),'death','Mandatory dream defeat remains unavoidable');assert.equal(r('player.hp'),0);
}
console.log('PASS: all player armor ranks, shield ordering, fractional health, immunity, lethal falls and actual low-HP execution/dream defeat paths.');
