'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function encounter({far=false}={}){
 const sandbox={state:'play',realm:3,level:{id:'zigguratDepths',arena:{x:1700,y:2920,w:1700,triggerX:1850}},flags:[[],[],[],['zigguratDescentAccepted']],
  player:{x:far?1900:2450,y:2850,w:42,h:70,vx:0,inv:0,hp:40},enemies:[],projectiles:[],DevSession:{active:false},damageCalls:0,awards:0,
  clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),overlap:(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y};
 vm.createContext(sandbox);
 vm.runInContext(require('./test-only-bootstrap.cjs').bossCatalog,sandbox);vm.runInContext(`function damage(amount){if(player.inv>0)return false;damageCalls++;player.hp-=amount;player.inv=1;return true;}function shoot(x,y,vx,vy,color,life,kind){projectiles.push({x,y,vx,vy,color,life,kind});}const ZigguratDescent={gateVictory(e){if(flags[3].includes('guardian:VoidGatekeeper'))return false;flags[3].push('guardian:VoidGatekeeper');awards++;return true;}};`+fs.readFileSync('assets/js/ziggurat-gatekeeper.js','utf8')+`;var gate=GatekeeperCombat.create({id:'voidGatekeeper',miniboss:'voidGatekeeper',x:2650,y:2920});enemies.push(gate);GatekeeperCombat.update(gate,.001);`,sandbox);
 const run=s=>vm.runInContext(s,sandbox),advance=(seconds,fps=60)=>{for(let t=0;t<seconds-1e-8;t+=1/fps)run(`player.inv=Math.max(0,player.inv-${Math.min(1/fps,seconds-t)});GatekeeperCombat.update(gate,${Math.min(1/fps,seconds-t)});`);};
 return {run,advance};
}
for(const fps of [30,60,120]){
 const h=encounter();h.run('gate.clock=0;');h.advance(1/fps,fps);assert.equal(h.run('gate.move'),'crescentSweep');assert.equal(h.run('gate.phase'),'windup');
 const box=h.run('JSON.stringify([gate.attackFace,gate.targetX,gate.targetY,gate.attackBox])');
 h.advance(.7,fps);assert.equal(h.run('damageCalls'),0,'Tell is harmless at '+fps+'FPS');
 h.run('player.x=1900;');h.advance(.1,fps);assert.equal(h.run('JSON.stringify([gate.attackFace,gate.targetX,gate.targetY,gate.attackBox])'),box,'Locked tell does not follow target');
 h.advance(.2,fps);assert.equal(h.run('damageCalls'),0,'Leaving the marked side dodges');
 const hit=encounter();hit.run('gate.clock=0;');hit.advance(1.2,fps);assert.equal(hit.run('damageCalls'),1,'Sweep hits exactly once');assert.equal(hit.run('player.hp'),37);
 const ground=encounter();ground.run('gate.cycles=2;gate.clock=0;');ground.advance(1/fps,fps);assert.equal(ground.run('gate.hazards.length'),3);
 assert(ground.run('gate.hazards.every(h=>h.y+h.h===gate.arena.y&&!h.active&&h.warning>0)'));
 const targets=ground.run('JSON.stringify(gate.hazards.map(h=>[h.x,h.y,h.w,h.h]))');ground.run('player.x=1900;');ground.advance(.9,fps);
 assert.equal(ground.run('JSON.stringify(gate.hazards.map(h=>[h.x,h.y,h.w,h.h]))'),targets);assert.equal(ground.run('damageCalls'),0);
 ground.advance(.6,fps);assert.equal(ground.run('damageCalls'),0,'Leaving every marked eruption dodges');
 const pulse=encounter();pulse.run('gate.cycles=2;gate.clock=0;');pulse.advance(1.6,fps);assert.equal(pulse.run('damageCalls'),1,'Eruptions hit once through normal invulnerability');
}
{
 const h=encounter({far:true});h.run('gate.clock=0;');h.advance(.01);assert.equal(h.run('gate.move'),'riftFan','A distant player prompts ranged opening');h.advance(1);assert.equal(h.run('projectiles.length'),5);
 assert(h.run("projectiles.every(p=>p.source==='mini:voidGatekeeper'&&p.kind==='shadowBolt'&&p.damage===2)"));
 const rage=encounter();rage.run('gate.hp=1100;gate.cycles=1;gate.clock=0;');rage.advance(.01);assert.equal(rage.run('gate.phaseDuration'),.95*.8);rage.advance(.85);assert.equal(rage.run('projectiles.length'),7);
}
// An invulnerable overlap does not spend the strike, while accepted absorption does.
{
 const h=encounter();h.run('gate.clock=0;player.inv=10;');h.advance(.92);assert.equal(h.run('damageCalls'),0);assert.equal(h.run('gate.hitDone'),false);
 h.run('player.inv=0;');h.advance(.03);assert.equal(h.run('damageCalls'),1);assert(h.run('gate.hitDone'));h.advance(.2);assert.equal(h.run('damageCalls'),1);
 const blocked=encounter();blocked.run('gate.clock=0;damage=function(){damageCalls++;return true;};');blocked.advance(1.2);assert.equal(blocked.run('damageCalls'),1,'Accepted shield absorption consumes one strike');
}
for(const state of ['pause','dialog','inventory','developer','map']){
 const h=encounter();h.run(`gate.cycles=2;gate.clock=0;GatekeeperCombat.update(gate,.01);state='${state}';`);const before=h.run('JSON.stringify([gate,player,projectiles])');h.run('GatekeeperCombat.update(gate,3)');assert.equal(h.run('JSON.stringify([gate,player,projectiles])'),before);
}
{
 const h=encounter();h.run('player.x=1600;player.vx=-300;GatekeeperCombat.enforceBounds()');assert.equal(h.run('player.x'),1715);assert.equal(h.run('player.vx'),0);
 h.run('player.x=3500;player.vx=300;GatekeeperCombat.enforceBounds()');assert.equal(h.run('player.x'),3343);assert.equal(h.run('player.vx'),0);
 h.run('gate.hp=0;projectiles.push({source:"mini:voidGatekeeper"},{source:"other"});');assert.equal(h.run('GatekeeperCombat.defeat(gate)'),true);assert.equal(h.run('awards'),1);assert.equal(h.run('GatekeeperCombat.defeat(gate)'),false);
 assert.equal(h.run('projectiles.length'),1);assert.equal(h.run('projectiles[0].source'),'other');h.run('GatekeeperCombat.reset(gate)');assert(h.run('gate.dead'));
 h.run('DevSession.active=true;gate.replay=true;GatekeeperCombat.reset(gate);gate.active=true;gate.hp=0;');assert.equal(h.run('GatekeeperCombat.defeat(gate)'),false);assert.equal(h.run('awards'),1);
}
{
 const stale=encounter();stale.run('enemies=[];');const before=stale.run('JSON.stringify([gate,player,projectiles])');stale.run('GatekeeperCombat.update(gate,2)');assert.equal(stale.run('JSON.stringify([gate,player,projectiles])'),before);assert.equal(stale.run('GatekeeperCombat.defeat(gate)'),false);
 const fatal=encounter();fatal.run('gate.clock=0;damage=function(){player={...player,hp:40};enemies=[];return true;};');fatal.advance(1);assert.equal(fatal.run('gate.attackElapsed'),0,'Replacement Momo ends the old attack immediately');
 const unavailable=encounter();unavailable.run('flags[3]=[];GatekeeperCombat.reset(gate);');unavailable.advance(4);assert.equal(unavailable.run('gate.active'),false,'Story fight cannot start before acceptance');
}
console.log('PASS: Gatekeeper tells/hits at 30/60/120FPS, ranged opening, enrage, locked targeting, pause, arena containment, cleanup and replay-safe defeat.');
