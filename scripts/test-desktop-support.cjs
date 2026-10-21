'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const harness=require('./test-harness.cjs');
const root=path.join(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
for(const [width,height,blocked] of [[1280,720,false],[1920,1080,false],[2560,1440,false],[1279,720,true],[1280,719,true],[720,1280,true],[390,844,true],[1,1,true]]){
 const h=harness(),r=h.run;
 r("Bindings.setPrimary('attack','mouse2');keys.add('d');pressed.add('j');dash=.12;dashCooldown=.5;player.inv=.7;");
 const preferences=JSON.stringify([...h.storage]),writes=r('__saveSnapshots.length');
 h.sandbox.innerWidth=width;h.sandbox.innerHeight=height;h.sandbox.devicePixelRatio=2;r('resize()');
 assert.equal(r('resolutionBlocked'),blocked,`${width}x${height}`);
 assert.equal(h.elements.get('resolutionNotice').hidden,!blocked);
 assert.equal(h.elements.get('game').inert,blocked);
 assert(r('Number.isFinite(scale)&&Number.isFinite(viewW)'));
 if(!blocked)continue;
 assert.equal(r('state'),'pause');assert.equal(r('keys.size+pressed.size'),0);
 const frozen=r('JSON.stringify([time,levelTime,player,attack,attackElapsed,dash,dashCooldown,boss,enemies,particles,projectiles,toastTimer])');
 h.press('d');r("handleMouseDown({button:2,pointerType:'mouse',target:canvas,preventDefault(){}})");h.tick(120);
 assert.equal(r('JSON.stringify([time,levelTime,player,attack,attackElapsed,dash,dashCooldown,boss,enemies,particles,projectiles,toastTimer])'),frozen,'All gameplay/effect clocks freeze below minimum');
 assert.equal(r('keys.size+pressed.size'),0);assert.equal(r('DevTools.open()'),false);
 r('startGame(false)');assert.equal(r('state'),'pause','Undersized windows cannot start another game');
 assert.equal(JSON.stringify([...h.storage]),preferences);assert.equal(r('__saveSnapshots.length'),writes,'Resolution changes must not write progress');
 h.sandbox.innerWidth=1280;h.sandbox.innerHeight=720;r('resize()');
 assert.equal(r('state'),'pause','Returning to supported size must require deliberate resume');
 assert.equal(h.elements.get('game').inert,false);assert(h.elements.get('resolutionNotice').hidden);
 assert.equal(r("Bindings.read('attack')[0]"),'mouse2');
 h.press('Escape');h.tick();h.release('Escape');
 assert.equal(r('state'),'play');assert(r('dash<.12&&dashCooldown<.5'));
 assert.equal(r('keys.size'),0,'Cleared held movement cannot resume unexpectedly');
}
for(const state of ['menu','help','dialog','inventory','map','developer']){
 const h=harness();h.run(`state=${JSON.stringify(state)};`);h.sandbox.innerWidth=1000;h.run('resize()');h.tick(20);
 assert.equal(h.run('state'),state,'Resolution notice preserves an already-open screen');
 h.sandbox.innerWidth=1280;h.run('resize()');assert.equal(h.run('state'),state);
}
const html=read('index.html'),css=read('assets/css/style.css'),game=read('assets/js/game.js');
assert(!/touchControls|foodTouch|viewport-fit/.test(html));assert(!/touchControls|foodTouch|pointer:coarse|safe-area-inset|touch-action/.test(css));
for(const media of css.matchAll(/@media\s*([^{}]+)\{/g))assert(/prefers-reduced-motion/.test(media[1]),'Only motion-preference media rules remain');
assert(!/touchControls|foodTouch|setPointerCapture/.test(game));
assert(html.includes('id="resolutionNotice"')&&html.includes('aria-describedby="resolutionMessage"'));
for(const lang of ['hu','en']){const dict=JSON.parse(read('assets/i18n/locales.json'))[lang].dict;assert(dict['display.minimum'].includes('1280×720'));assert(!Object.hasOwn(dict,'bugReport.touch'));}
console.log('PASS:1280x720 minimum in CSS pixels, undersize freeze/inert notice, deliberate resume, preserved screens/preferences/saves, keyboard/mouse-only UI and reduced-motion retention.');
