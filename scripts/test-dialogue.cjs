const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');

// Supply DOM focus/attributes omitted by the Canvas VM harness. These checks
// exercise actual Dialogue/gameplay code, not browser layout or image quality.
function fixture(){
 const h=harness(),r=h.run,d=h.sandbox.document;
 for(const id of ['dialog','dialogText','dialogOk','dialogSpeaker','dialogTitle','dialogPage','dialogPortraitLeft','dialogPortraitRight','pauseButton','devClose','devPanel','devToolsList','game'])d.getElementById(id);
 for(const [id,node]of h.elements){
  node.id=id;node.isConnected=true;node.attributes={};node.classes=new Set();
  node.setAttribute=(key,value)=>node.attributes[key]=value;
  node.classList={add:name=>node.classes.add(name),remove:name=>node.classes.delete(name),contains:name=>node.classes.has(name)};
  node.focus=()=>{d.activeElement=node;};node.closest=()=>null;node.matches=()=>true;node.getClientRects=()=>node.hidden?[]:[{}];
 }
 d.getElementById('game').children=[d.getElementById('world'),d.getElementById('devPanel')];
 const click=()=>h.elements.get('dialogOk').onclick();
 const visible=()=>h.elements.get('dialogText').children.filter(p=>!p.hidden).map(p=>p.textContent);
 return {...h,r,d,click,visible};
}

// Paragraphs are pages, retain their exact text, and finish only on the last.
{
 const f=fixture(),{r,click,visible}=f;
 r("var completed=0;keys.add('d');pressed.add(' ');story('label','title','one\\n\\ntwo\\n  \\nthree',()=>completed++);");
 assert.equal(r('state'),'dialog');assert(r('keys.size===0&&pressed.size===0'));
 assert.deepEqual(visible(),['one']);assert.equal(f.elements.get('dialogPage').textContent,'1 / 3');
 const stale=f.elements.get('dialogOk').onclick;
 click();assert.deepEqual(visible(),['two']);assert.equal(r('completed'),0);assert.equal(r('state'),'dialog');
 click();assert.deepEqual(visible(),['three']);assert.equal(f.elements.get('dialogPage').textContent,'3 / 3');
 r("keys.add('j');pressed.add(' ')");click();stale();assert.equal(r('completed'),1);assert.equal(r('state'),'play');assert(r('keys.size===0&&pressed.size===0'));
}

// Replacing a scene and direct Slayer cancellation invalidate old callbacks.
{
 const f=fixture(),{r,click}=f;
 r("var first=0,second=0;story('a','a','old',()=>first++);");const old=f.elements.get('dialogOk').onclick;
 r("story('b','b','new',()=>second++);");old();assert.equal(r('first'),0);assert.equal(r('state'),'dialog');assert.deepEqual(f.visible(),['new']);click();assert.equal(r('second'),1);
 r("story('slayer.name','slayer.warning','slayer.epitaph',()=>first++);");const warning=f.elements.get('dialogOk').onclick;
 r("$('dialogOk').onclick=null;");warning();assert.equal(r('first'),0);assert.equal(r('state'),'dialog');
 r('Dialogue.cancel();');warning();assert.equal(r('first'),0);assert(f.elements.get('dialog').hidden);
}

// NPC identity is semantic metadata; a matching narrative title is not speech.
{
 const f=fixture(),{r}=f;
 r("defeated[0]=true;enterForestCamp({save:false});initPlayer(forestCamp.npcs.find(n=>n.id==='daichi'));interact();");
 assert.equal(r('state'),'dialog');assert(!f.elements.get('dialogPortraitLeft').hidden);assert(!f.elements.get('dialogPortraitRight').hidden);
 assert(f.elements.get('dialogPortraitRight').classes.has('speaking'));assert(!f.elements.get('dialogPortraitLeft').classes.has('speaking'));
 assert.equal(f.elements.get('dialogPortraitRight').attributes['aria-label'],r("I18n.t('camp.npc.daichi.name')"));
 assert.equal(f.elements.get('dialogTitle').textContent,r("I18n.t('camp.npc.daichi.name')"));assert(f.elements.get('dialogSpeaker').hidden,'Do not duplicate an identical name heading');
 f.dismiss();r("story('camp.dialogue.label','camp.npc.daichi.name','camp.npc.daichi.dialogue');");
 assert(f.elements.get('dialogPortraitRight').hidden,'Narrative headings must not infer an NPC');assert(f.elements.get('dialogSpeaker').hidden);
 r("story('label','title','body',null,{right:'not-an-actor',speaker:'not-an-actor'});");assert(f.elements.get('dialogPortraitRight').hidden);assert(f.elements.get('dialogSpeaker').hidden);
}

// Realm themes use world identity, including the dream rather than Japan.
for(const [realm,theme]of [[0,'japan'],[1,'yomi'],[2,'heaven'],[3,'shadow']]){
 const f=fixture();f.r(`enterRealm(${realm});story('label','title','body');`);assert.equal(f.elements.get('dialog').dataset.theme,theme);
 f.dismiss();assert(f.elements.get('dialog').hidden);
}
{
 const f=fixture();f.r("Prologue.start();story('label','title','body');");assert.equal(f.elements.get('dialog').dataset.theme,'shadow');
}

// Intermediate pages cannot advance simulation, tea, projectiles or input.
{
 const f=fixture(),{r,click}=f;
 r("player.hp=1;teaCount=1;Merchant.drink();attack=.3;dash=.15;projectiles.push({x:1,y:2,vx:10,vy:5,life:5});story('label','title','one\\n\\ntwo');");
 const before=r('JSON.stringify([time,levelTime,player,attack,dash,dashCooldown,boss,enemies,particles,projectiles])');
 for(const key of ['d',' ','j','k','i','m','u','Escape']){f.press(key);f.release(key);}
 f.tick(360);assert.equal(r('JSON.stringify([time,levelTime,player,attack,dash,dashCooldown,boss,enemies,particles,projectiles])'),before);assert(r('keys.size===0&&pressed.size===0'));
 click();f.tick(360);assert.equal(r('player.hp'),1);assert.equal(r('state'),'dialog');assert.deepEqual(f.visible(),['two']);
 click();r('Merchant.update(2);');assert.equal(r('player.hp'),2,'Tea resumes rather than expiring during pages');
 // The native browser click advances Enter/Space; held key repeat is stopped.
 r("story('label','title','one\\n\\ntwo');var repeatPrevented=false;handleKeyDown({key:'Enter',repeat:true,preventDefault(){repeatPrevented=true;}});");assert(r('repeatPrevented'));assert.deepEqual(f.visible(),['one']);
}

// Tab remains within reading text/Next. Restoring focus never resumes gameplay.
{
 const f=fixture(),{r,d}=f;r("story('label','title','one');");assert.equal(d.activeElement.id,'dialogOk');
 r("Dialogue.keydown({key:'Tab',preventDefault(){}});");assert.equal(d.activeElement.id,'dialogText');
 r("Dialogue.keydown({key:'Tab',preventDefault(){}});");assert.equal(d.activeElement.id,'dialogOk');
 r("Dialogue.keydown({key:'Tab',shiftKey:true,preventDefault(){}});");assert.equal(d.activeElement.id,'dialogText');assert.equal(r('state'),'dialog');
}

// DevTools temporarily hides the scene; close restores its exact page/owner.
{
 const f=fixture(),{r,click}=f;r("var completions=0;story('label','title','one\\n\\ntwo\\n\\nthree',()=>completions++);");click();
 const owner=f.elements.get('dialogOk').onclick;assert(r('DevTools.open()'));assert(f.elements.get('dialog').hidden);owner();assert.equal(r('completions'),0);
 r('DevTools.close();');assert.equal(r('state'),'dialog');assert(!f.elements.get('dialog').hidden);assert.deepEqual(f.visible(),['two']);assert.equal(f.elements.get('dialogOk').onclick,owner);
 click();assert.deepEqual(f.visible(),['three']);click();assert.equal(r('completions'),1);
}

// A replaced world cannot complete a scene that belonged to its old player.
// Ordinary placement/spawn also calls cancel with no scene; it must not erase
// an unrelated held action (including a rebound input pending its first tick).
{
 const f=fixture(),{r}=f;
 r("keys.add('d');pressed.add('j');Dialogue.cancel();");
 assert(r("keys.has('d')&&pressed.has('j')"),'Inactive cancellation must preserve gameplay input');
 r('initPlayer();');
 assert(r("keys.has('d')&&pressed.has('j')"),'Placement outside a scene must preserve held/pending actions');
 r("story('label','title','one');keys.add('d');pressed.add('j');Dialogue.cancel();");
 assert(r('keys.size===0&&pressed.size===0'),'Active cancellation still prevents input leaking out of dialogue');
}
for(const transition of ['mainMenu();','initPlayer();','enterRealm(1);']){
 const f=fixture(),{r}=f;r("var completions=0;story('label','title','one',()=>completions++);");const old=f.elements.get('dialogOk').onclick;
 r(transition);const after=r('state');old();assert.equal(r('completions'),0,transition);assert.equal(r('state'),after);assert(f.elements.get('dialog').hidden,transition);
}
{
 const f=fixture(),{r}=f;assert(r('DevTools.open()'));assert(r('DevSession.begin()'));r('DevTools.close();');
 r("var completions=0;story('label','title','one',()=>completions++);");const old=f.elements.get('dialogOk').onclick;
 assert(r('DevTools.open()'));assert(r("DevTeleport.teleport({realm:'1',rest:levels[1].rests[0].id})"));r('DevTools.close();');old();
 assert.equal(r('completions'),0);assert.equal(r('state'),'play');assert(f.elements.get('dialog').hidden);
}
console.log('PASS: paged shared dialogue, semantic speakers/portraits, realm themes, once-only/stale callbacks, frozen gameplay/tea, keyboard isolation, focus and dev/world transitions.');
