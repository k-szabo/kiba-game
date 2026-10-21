const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const h=require('./test-harness.cjs')(),r=h.run;
r("Prologue.stop();abilities=[true,true];defeated=[true,true,true,false];flags=[['forestBell','villageBell'],['soulUpper','soulLower'],['dawnSeal','shadowEntered'],[]];enterRealm(3);state='play';initPlayer(level.altar);player.hp=2;");
assert.equal(r('getContext().type'),'shadowAltar');
assert(!r('ShadowRealm.travelAllowed(3,0)'));
r("Bindings.setPrimary('interact','q');");h.press('e');h.tick();h.release('e');assert.equal(r('state'),'play');
h.press('q');h.tick();h.release('q');assert.equal(r('state'),'dialog');
assert(r("flags[3].includes('shadowAltar')"));assert(r('ShadowRealm.travelAllowed(3,0)'));
assert.equal(r("flags[3].filter(f=>f==='shadowAltar').length"),1);
const before=r('JSON.stringify([time,player,particles,levelTime])');h.tick(100);
assert.equal(r('JSON.stringify([time,player,particles,levelTime])'),before,'First-activation dialogue freezes gameplay');
h.dismiss();assert.equal(r('state'),'play');assert.equal(r('getContext().type'),'checkpoint');
assert(r("fastTravel(levels[0].rests[0],0)"));assert(r("fastTravel(levels[3].rests[1],3)"));
r("player.hp=2;interact();");assert.equal(r('state'),'play');assert.equal(r('player.hp'),r('player.maxHp'));
r('revive();initPlayer(level.altar);interact();');assert.equal(r('state'),'play','Rest/death cannot replay activation dialogue');
const ctx=h.sandbox.document.getElementById('world').getContext('2d'),images=[],labels=[];
ctx.drawImage=(...a)=>images.push(a);ctx.fillText=(...a)=>labels.push(a);
r("state='pause';resetCamera();draw();");
assert.equal(images.filter(a=>a[0]===r('Visuals.images.shadowAltar')).length,1,'Altar renders its painted prop exactly once');
assert(labels.some(a=>a[0]==='影'),'Dedicated kanji marker must be visible');
assert(labels.some(a=>a[0]===r("I18n.t('shadow.place.altar')")),'Altar name must be localized');
const art=r('ART_SHADOW_ALTAR'),file=r('ART_MANIFEST.shadowAltar'),png=fs.readFileSync(path.join(__dirname,'..',file));
assert.equal(png[25],6,'Altar keeps source alpha');assert.equal(art.w,png.readUInt32BE(16));assert.equal(art.h,png.readUInt32BE(20));
assert(art.anchorX>0&&art.anchorX<art.w&&art.anchorY>0&&art.anchorY<art.h);
// Desktop markers keep their world-space registration at every supported size.
const plates=[];ctx.fillRect=(...a)=>{if(a[3]===64)plates.push(a);};
for(const [width,height] of [[1280,720],[1920,1080],[2560,1440]]){
 h.sandbox.innerWidth=width;h.sandbox.innerHeight=height;
 r('resize();resetCamera();');plates.length=0;labels.length=0;r('Visuals.objects(realms[3]);');
 assert.equal(plates.length,1);assert.equal(plates[0][1],r('level.altar.y')-260-68,'Desktop marker keeps original world placement');
 assert(labels.some(a=>a[0]==='影')&&labels.some(a=>a[0]===r("I18n.t('shadow.place.altar')")));
}
console.log('PASS: distinct painted altar/kanji, remapped one-time dialogue, pause, persistent unlock, travel and later shrine healing.');
