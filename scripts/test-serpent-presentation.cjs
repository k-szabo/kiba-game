'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
for(const realm of [0,2])for(const fps of [30,60,120])for(const width of [1280,1920,2560]){
 const h=harness(),r=h.run,d=h.sandbox.document.getElementById('world').getContext('2d');
 r("state='play';enterRealm("+realm+");viewW="+width+";enemies=[];boss.dead=true;var area=level.secrets.find(a=>SerpentArt.hasBackdrop(a));initPlayer({x:area.arena.x+500,y:area.arena.y});player.inv=999;");
 const geometry=r('JSON.stringify([level.platforms,level.gates,level.secrets])');
 const before=r('JSON.stringify([enemies,player,projectiles,flags,levelTime])');r('draw();draw();');assert.equal(r('SerpentArt.backdropState()'),null,'Drawing cannot start a temporal fade');assert.equal(r('JSON.stringify([enemies,player,projectiles,flags,levelTime])'),before);
 r('update('+1/fps+');');const first=r('SerpentArt.backdropState().alpha');assert(first>0&&first<.1,'Arena fades in instead of appearing on the first frame');
 let last=first;for(let n=0;n<fps;n++){r('update('+1/fps+');');const alpha=r('SerpentArt.backdropState().alpha');assert(alpha>=last&&alpha-last<=2.8/fps+1e-10,'Bounded fade at '+fps+' FPS');last=alpha;}assert.equal(last,1);
 const imageKey=realm===0?'whiteSerpentBackdrop':'wingedSerpentBackdrop';r('Visuals.images.'+imageKey+'={complete:true,naturalWidth:2172,naturalHeight:724,key:'+JSON.stringify(imageKey)+'};');
 let draws=[],stack=[];d.globalAlpha=1;d.save=()=>stack.push(d.globalAlpha);d.restore=()=>d.globalAlpha=stack.pop();d.drawImage=(img,...args)=>{if(img.key===imageKey)draws.push({args,alpha:d.globalAlpha});};
 for(const [x,y]of [[0,0],[500,700],[9000,2600]]){
  r('camera='+x+';cameraY='+y+';');draws=[];r('SerpentArt.backdrop();');assert.equal(draws.length,1);const [px,py,w,hh]=draws[0].args;assert(px<=0&&py<=0&&px+w>=width-1e-8&&py+hh>=720-1e-8,'No visible bitmap edge at '+width+'px');assert.equal(draws[0].alpha,1);
 }
 r("state='pause';");const frozen=r('JSON.stringify(SerpentArt.backdropState())');h.tick(30);r('SerpentArt.updateBackdrop(1);');assert.equal(r('JSON.stringify(SerpentArt.backdropState())'),frozen,'Pause freezes fade');
 r("state='play';player.x=area.x-250;");r('SerpentArt.updateBackdrop('+1/fps+');');assert(r('SerpentArt.backdropState().alpha<1&&SerpentArt.backdropState().alpha>0'),'Outgoing background survives outside the rectangle');
 for(let n=0;n<fps;n++)r('SerpentArt.updateBackdrop('+1/fps+');');assert.equal(r('SerpentArt.backdropState()'),null);
 r('initPlayer({x:area.arena.x+500,y:area.arena.y});SerpentArt.updateBackdrop(.4);');assert(r('SerpentArt.backdropState()'));r('revive();');assert.equal(r('SerpentArt.backdropState()'),null,'Death resets old arena blend before shrine rendering');
 r('initPlayer({x:area.arena.x+500,y:area.arena.y});SerpentArt.updateBackdrop(.4);mainMenu();');assert.equal(r('SerpentArt.backdropState()'),null,'Menu cannot inherit an arena');
 r("state='play';enterRealm("+realm+");var area=level.secrets.find(a=>SerpentArt.hasBackdrop(a));initPlayer({x:area.arena.x+500,y:area.arena.y});SerpentArt.updateBackdrop(.4);enterRealm(1);");assert.equal(r('SerpentArt.backdropState()'),null,'Teleport resets blend');
 r('enterRealm('+realm+');');assert.equal(r('JSON.stringify([level.platforms,level.gates,level.secrets])'),geometry,'Presentation changes no geometry');
}
for(const realm of [0,2]){
 const h=harness(),r=h.run,d=h.sandbox.document.getElementById('world').getContext('2d');let strokes=[];d.strokeRect=()=>strokes.push(d.strokeStyle);
 r('enterRealm('+realm+');var snake=enemies.find(e=>e.serpentType==='+JSON.stringify(realm===0?'white':'winged')+');snake.phase="windup";snake.attackBox={x:snake.x-100,y:snake.y,w:200,h:100};snake.hazards=[{x:snake.x,y:snake.y,w:100,h:100,active:false}];');
 const before=r('JSON.stringify([snake,player,flags,projectiles])');r('SerpentArt.actor(snake);');assert.equal(r('JSON.stringify([snake,player,flags,projectiles])'),before);
 assert.equal(strokes.length,4);assert.equal(strokes[1],r('BossCues.color'));assert.equal(strokes[3],r('BossCues.color'),'Both melee and ground hazard warnings use the shared gold');
 assert(!strokes.includes('#c4f2ec')&&!strokes.includes('#e0b9ff'),'Species colors are not danger outlines');
}
console.log('PASS: both serpent backdrops cover desktop/wide viewports, bounded active-frame fades at30/60/120FPS, pure rendering, outgoing blend, pause/death/menu/teleport reset, unchanged geometry and shared gold warning outlines.');
