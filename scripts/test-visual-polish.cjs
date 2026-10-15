const assert=require('node:assert/strict'),fs=require('node:fs'),zlib=require('node:zlib');
const {run,press,release,tick,sandbox}=require('./test-harness.cjs')();

// Decode the actual source alpha, so a changed sprite cannot silently invalidate sizing.
const png=fs.readFileSync(require('node:path').join(__dirname,'../assets/images/momo.png'));
assert.equal(png[24],8);assert.equal(png[25],6);assert.equal(png[28],0);
const width=png.readUInt32BE(16),height=png.readUInt32BE(20),chunks=[];
for(let p=8;p<png.length;){const size=png.readUInt32BE(p);if(png.toString('ascii',p+4,p+8)==='IDAT')chunks.push(png.subarray(p+8,p+8+size));p+=size+12;}
const raw=zlib.inflateSync(Buffer.concat(chunks)),stride=width*4,pixels=Buffer.alloc(stride*height);
for(let y=0;y<height;y++){
 const type=raw[y*(stride+1)];assert(type<=4);
 for(let x=0;x<stride;x++){
  const a=x>=4?pixels[y*stride+x-4]:0,b=y?pixels[(y-1)*stride+x]:0,c=y&&x>=4?pixels[(y-1)*stride+x-4]:0;
  const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
  const predictor=[0,a,b,Math.floor((a+b)/2),pa<=pb&&pa<=pc?a:pb<=pc?b:c][type];
  pixels[y*stride+x]=(raw[y*(stride+1)+x+1]+predictor)&255;
 }
}
const ctx=sandbox.document.getElementById('world').getContext('2d'),calls=[];
ctx.drawImage=(...args)=>calls.push(args);
function body(){
 calls.length=0;run('drawPlayer()');const images=calls.filter(c=>c[0]===run('sheet'));assert.equal(images.length,1);
 const [,sx,sy,sw,sh,dx,dy,dw,dh]=images[0];let min=sh,max=-1;
 for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)if(pixels[((sy+y)*width+sx+x)*4+3]>0){min=Math.min(min,y);max=Math.max(max,y);}
 return {height:(max-min+1)*dh/sh,paws:dy+max*dh/sh,source:images[0].slice(1,5)};
}
run("state='play';player.inv=0;player.vx=0;player.onGround=true;attack=0;dash=0;player.animationTime=0;");
const standing=body();
for(const face of [-1,1])for(const velocity of [-400,0,400]){
 run(`player.face=${face};player.onGround=false;player.vy=${velocity};`);const air=body();
 assert(Math.abs(air.height-standing.height)<.5,'Aerial Momo visibly shrinks relative to the standing source alpha');
 assert(Math.abs(air.paws)<3,'Aerial paw registration drifted from the collision feet');
}
assert(run('player.w===43&&player.h===69'),'Presentation sizing must not alter collision geometry');

run("abilities=[true,true];enterRealm(1);state='play';enemies=[];initPlayer({x:1600,y:2700});keys.clear();pressed.clear();");
press('k');tick();release('k');tick(8);
assert(run("particles.filter(p=>p.kind==='dashWisp').length>=2"),'Dash must leave a continuous wisp trail');
assert(!run("particles.some(p=>p.color==='#c8a8ed')"),'Old purple dash dots remain');
run('draw();pause();var frozenDashParticles=JSON.stringify(particles);');tick(60);
assert(run('JSON.stringify(particles)===frozenDashParticles'),'Pause advances the dash trail');
run('pause();');tick(120);assert(!run("particles.some(p=>p.kind==='dashWisp')"),'Dash trail never expires');
run("reducedMotion.matches=true;dashCooldown=0;particles=[];keys.clear();pressed.clear();");press('k');tick(10);release('k');
assert(!run("particles.some(p=>p.kind==='dashWisp')"),'Reduced motion must suppress the moving trail');
console.log('PASS: actual PNG alpha confirms stable Momo jump size/paw registration in both directions; unchanged hitbox, continuous painted dash particles, pause freezing, cleanup and reduced motion.');
