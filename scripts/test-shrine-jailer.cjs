const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const harness=require('./test-harness.cjs');
const locales=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/i18n/locales.json'),'utf8'));

// Exercise the rendered prompt, not just the translated catalog entry.
for(const lang of ['hu','en']){
 const h=harness(),r=h.run;
 r(`Object.assign(TEST_LOCALE,${JSON.stringify(locales[lang].dict)});I18n.locale='${lang}';`);
 for(const destination of ['0','1','2','3','camp']){
  if(destination==='camp')r('defeated[0]=true;enterForestCamp({save:false,atShrine:true});');
  else r(`enterRealm(${destination});`);
  r("flags[3].push('shadowAltar');initPlayer(level.rests[0]);player.inv=999;state='play';enemies=[];");
  for(const bindings of [[],[['interact','f'],['train','t']],[['interact','u']],[['train','mouse2']]]){
   r('Bindings.reset();');
   for(const [action,input] of bindings)assert(r(`Bindings.setPrimary('${action}','${input}').ok`));
   h.tick();
   assert.equal(r('context.type'),'checkpoint',`${lang} ${destination}`);
   const prompt=h.elements.get('prompt');
   assert.equal(prompt.hidden,false);
   const expected=[r("bindingKeyLabel(Bindings.read('interact')[0])"),lang==='en'?'Rest, heal, and save':'Pihenés, gyógyulás és mentés',r("bindingKeyLabel(Bindings.read('train')[0])"),lang==='en'?'Train':'Fejlesztés'].join(' · ');
   assert.equal(prompt.textContent,expected,`${lang} ${destination}: bindings replaced once, including swapped E/U and mouse`);
  }
  r('Bindings.reset();');h.press('u');h.tick();h.release('u');
  assert.equal(r('state'),'training','Advertised action opens shrine training');r('closeTraining();');
 }
}

// Capture the jailer's actual Canvas warning commands and ensure no dash leaks.
{
 const h=harness(),r=h.run,ctx=h.sandbox.document.getElementById('world').getContext('2d');
 let dash=[],calls=[];ctx.setLineDash=value=>{dash=[...value];};
 ctx.strokeRect=(...rect)=>calls.push({rect,dash:[...dash]});
 r("enterRealm(3);state='play';var jailer=enemies.find(e=>e.id==='cultJailer');jailer.move='axe';");
 for(const face of [-1,1])for(const phase of ['wait','windup','strike','recover']){
  r(`jailer.face=${face};setMiniPhase(jailer,'${phase}',1);`);
  const before=r('JSON.stringify([player,enemies,boss,platforms,projectiles])');calls=[];dash=[];
  r('Visuals.actor(jailer,realms[3]);');
  assert.equal(r('JSON.stringify([player,enemies,boss,platforms,projectiles])'),before,'Drawing must not advance combat');
  const expected=r('[jailer.face>0?jailer.x+jailer.w*.4:jailer.x-185,jailer.y-8,185+jailer.w*.6,jailer.h+20]');
  const warning=calls.find(call=>JSON.stringify(call.rect)===JSON.stringify(expected));
  if(phase==='windup')assert.deepEqual(warning?.dash,[7,6],'Both axe directions use the shared dashed warning style');
  else assert.equal(warning,undefined,'Warning only appears before impact');
  assert.deepEqual(dash,[],'Subsequent drawing uses solid lines again');
 }
}
console.log('PASS: HU/EN shrine prompts advertise working training with default, swapped, custom and mouse bindings; jailer axe warnings are dashed, phase-specific and render-only.');
