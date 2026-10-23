/* Pure loadout rules: no Canvas/storage mock can establish visual or save quality. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const styles=vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js/weapons.js'),'utf8')+'\nWeaponStyles');
const near=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const normal={duration:.42,impact:.16,cooldown:.34,damageScale:.75},heavy={duration:.9,impact:.38,cooldown:.9,damageScale:1.75};
for(const id of styles.ids){
 const p=styles.profile(id);
 assert(Object.isFrozen(p));
 for(const base of [normal,heavy]){
  const a=styles.attack(id,base);near(a.impact/a.duration,base.impact/base.duration);
  assert(a.impact>0&&a.impact<a.duration);assert(a.cooldown>=0);
 }
 const body={x:200,y:300};
 const right=styles.hitbox(id,body,1),left=styles.hitbox(id,body,-1);
 near(220-left.x,right.w);near(right.x,220);assert.equal(right.w,left.w);
 assert.equal(right.h,105);assert.equal(left.y,286);
}
near(styles.attack('katana',normal).duration,.357);
near(styles.attack('naginata',heavy).damageScale,2.1875);
assert.equal(styles.hitbox('naginata',{x:0,y:0},1).w,180);
assert.equal(styles.profile('swordShield').health,2);
const ready={face:1,direction:-1,grounded:true,attacking:false,dashing:false,cooldown:0};
for(const face of [-1,1]){
 const result=styles.guard('swordShield',2,{...ready,face,direction:-face});
 assert.equal(result.damage,1);assert(result.blocked);assert.equal(result.cooldown,2);
 assert.equal(styles.guard('swordShield',1,{...ready,face,direction:-face}).damage,0);
}
for(const patch of [{direction:1},{direction:0},{grounded:false},{attacking:true},{dashing:true},{cooldown:.01},{environmental:true}]){
 const result=styles.guard('swordShield',2,{...ready,...patch});
 assert.equal(result.damage,2);assert(!result.blocked);
}
for(const id of ['katana','naginata'])assert(!styles.guard(id,2,ready).blocked);
for(const id of ['__proto__','constructor',null,{},'unknown']){
 assert(!styles.valid(id));assert.throws(()=>styles.profile(id),/Unknown weapon style/);
}
assert.equal(normal.duration,.42);assert.equal(heavy.damageScale,1.75);
console.log('PASS: starter weapon timing, damage, mirrored reach, immutable profiles and directional shield exclusions.');
