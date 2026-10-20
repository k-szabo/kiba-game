const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const inputTag=html.match(/<input id="slayerSpellInput"[^>]*>/)?.[0];
assert(inputTag,'Incantation input exists');
assert(inputTag.includes('maxlength="32"')&&inputTag.includes('autocomplete="off"'));
assert(!/placeholder=|pattern=|iddqd/i.test(inputTag),'The input must not reveal the answer');
assert(!html.toLowerCase().includes('iddqd'),'No incantation hint is shipped in HTML');
const elements=new Map(),document={activeElement:null};
function element(id){
 const listeners=new Map(),attributes=new Map(),classes=new Set();
 const node={id,hidden:false,isConnected:true,textContent:'',value:'',disabled:false,
  addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},
  emit(type,event={}){for(const fn of listeners.get(type)||[])fn(event);},
  listenerCount:type=>(listeners.get(type)||[]).length,
  setAttribute:(key,value)=>attributes.set(key,value),removeAttribute:key=>attributes.delete(key),getAttribute:key=>attributes.get(key),
  classList:{add:key=>classes.add(key),remove:key=>classes.delete(key),contains:key=>classes.has(key)},
  focus(){document.activeElement=this;},getClientRects(){return this.hidden?[]:[{}];},
  querySelectorAll(){return ['slayerSpellInput','slayerSpellSubmit','closeSlayerSpell'].map(id=>elements.get(id));}
 };
 elements.set(id,node);return node;
}
for(const id of ['slayerSpell','slayerSpellTitle','slayerSpellText','slayerSpellLabel','slayerSpellSubmit','slayerSpellInput','slayerSpellMessage','closeSlayerSpell','slayerSpellForm','dialog','dialogOk','pauseButton','invoker'])element(id);
elements.get('slayerSpell').hidden=true;elements.get('invoker').focus();
let locale='hu',localeChange,starts=0,pauseBinding='escape';
const realm={},enemy={dead:false,active:false};
const context=vm.createContext({document,$:id=>elements.get(id),state:'play',level:realm,yomi:realm,enemies:[enemy],keys:new Set(['j']),pressed:new Set([' ']),
 Bindings:{normalize:key=>String(key).toLowerCase(),read:action=>action==='pause'?[pauseBinding]:[]},
 I18n:{t:key=>`${locale}:${key}`,onChange:fn=>{localeChange=fn;}},
 DoomSlayer:{start:e=>{assert.equal(e,enemy);starts++;}},
 story:(label,title,text,callback)=>{context.state='dialog';context.warning={label,title,text,callback};}
});
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/slayer-dialog.js'),'utf8')+';globalThis.dialogAPI=SlayerDialog;',context);
const api=context.dialogAPI,modal=elements.get('slayerSpell'),input=elements.get('slayerSpellInput'),invoker=elements.get('invoker');
function event(key,extras={}){return {key,code:'Key'+key,repeat:false,prevented:false,stopped:false,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...extras};}
function submit(value){input.value=value;const e=event('Enter');elements.get('slayerSpellForm').emit('submit',e);assert(e.prevented);}
function confirm(){context.state='play';context.warning.callback();}
api.init();api.init();assert.equal(elements.get('slayerSpellForm').listenerCount('submit'),1,'Initialization is idempotent');
assert(api.open(enemy));assert.equal(context.state,'slayerSpell');assert(!modal.hidden);assert.equal(document.activeElement,input);
assert.equal(context.keys.size,0);assert.equal(context.pressed.size,0);assert.equal(input.value,'');
submit('wrong');assert.equal(context.state,'slayerSpell');assert(!modal.hidden);assert.equal(input.getAttribute('aria-invalid'),'true');
assert.equal(elements.get('slayerSpellMessage').textContent,'hu:slayer.silent');assert.equal(starts,0);
locale='en';localeChange();assert.equal(elements.get('slayerSpellMessage').textContent,'en:slayer.silent');assert.equal(elements.get('slayerSpellTitle').textContent,'en:slayer.name');
input.emit('input');assert.equal(elements.get('slayerSpellMessage').textContent,'');assert.equal(input.getAttribute('aria-invalid'),undefined);
const typed=event('j');modal.emit('keydown',typed);assert(typed.stopped&&!typed.prevented,'Typed letters stay in the input and do not reach game hotkeys');
const released=event('j');modal.emit('keyup',released);assert(released.stopped);
const backward=event('Tab',{shiftKey:true});modal.emit('keydown',backward);assert(backward.prevented);assert.equal(document.activeElement,elements.get('closeSlayerSpell'));
const forward=event('Tab');modal.emit('keydown',forward);assert(forward.prevented);assert.equal(document.activeElement,input);
for(const binding of ['d','q','i','enter']){
 pauseBinding=binding;input.focus();const key=event(binding==='enter'?'Enter':binding);modal.emit('keydown',key);
 assert(key.stopped&&!key.prevented,'Editable incantation must accept custom pause '+binding);assert.equal(context.state,'slayerSpell');
}
pauseBinding='p';input.value='unfinished';elements.get('slayerSpellSubmit').focus();const pause=event('p');modal.emit('keydown',pause);
assert(pause.stopped&&pause.prevented);assert.equal(context.state,'play');assert(modal.hidden);assert.equal(input.value,'');assert.equal(document.activeElement,invoker);
assert(api.open(enemy));const repeated=event('Escape',{repeat:true});modal.emit('keydown',repeated);assert.equal(context.state,'slayerSpell');
const escape=event('Escape');modal.emit('keydown',escape);assert.equal(context.state,'play');assert(escape.prevented);
assert(api.open(enemy));pauseBinding='enter';input.focus();const enter=event('Enter');modal.emit('keydown',enter);assert(!enter.prevented,'Native Enter submits even when bound to Pause');submit('  IDDQD  ');assert.equal(context.state,'dialog');assert(modal.hidden);assert.equal(input.value,'');assert.equal(starts,0);
assert(elements.get('dialog').classList.contains('slayer-warning'));assert.deepEqual([context.warning.label,context.warning.title,context.warning.text],['slayer.name','slayer.warning','slayer.epitaph']);
confirm();assert.equal(starts,1);assert(!elements.get('dialog').classList.contains('slayer-warning'));
for(const race of ['level','dead','removed','active','cancel']){
 context.state='play';context.level=realm;context.enemies=[enemy];enemy.dead=false;enemy.active=false;
 assert(api.open(enemy));submit('iddqd');
 if(race==='level')context.level={};
 if(race==='dead')enemy.dead=true;
 if(race==='removed')context.enemies=[];
 if(race==='active')enemy.active=true;
 if(race==='cancel')api.cancel();
 confirm();assert.equal(starts,1,`Pending warning must not summon after ${race}`);
 assert(!elements.get('dialog').classList.contains('slayer-warning'));
}
context.state='menu';context.level=realm;context.enemies=[enemy];enemy.active=false;assert(!api.open(enemy));
context.state='play';context.level={};assert(!api.open(enemy));context.level=realm;enemy.dead=true;assert(!api.open(enemy));enemy.dead=false;enemy.active=true;assert(!api.open(enemy));
enemy.active=false;context.enemies=[];assert(!api.open(enemy));context.enemies=[enemy];
assert(api.open(enemy));input.value='partial';context.keys.add('d');api.cancel();assert.equal(context.state,'play');assert(modal.hidden);assert.equal(input.value,'');assert.equal(context.keys.size,0);
console.log('PASS: secret grave modal input isolation, wrong-answer status, HU/EN refresh, focus trap/restore, pause/Escape, delayed confirmation and stale-encounter cancellation.');
