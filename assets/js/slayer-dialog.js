/* A deliberately unhinted incantation; the encounter starts only after confirmation. */
const SlayerDialog=(()=>{
 let initialized=false,returnFocus=null,encounter=null,revision=0,hasError=false,warningOpen=false;
 const modal=()=>$('slayerSpell');
 const clearKeys=()=>{keys.clear();pressed.clear();};
 function render(){
  $('slayerSpellTitle').textContent=I18n.t('slayer.name');
  $('slayerSpellText').textContent=I18n.t('slayer.epitaph');
  $('slayerSpellLabel').textContent=I18n.t('slayer.incantation');
  $('slayerSpellSubmit').textContent=I18n.t('slayer.speak');
  $('closeSlayerSpell').textContent=I18n.t('inventory.close');
  $('slayerSpellMessage').textContent=hasError?I18n.t('slayer.silent'):'';
 }
 function clearInput(){
  $('slayerSpellInput').value='';
  $('slayerSpellInput').removeAttribute?.('aria-invalid');
  $('slayerSpellMessage').textContent='';hasError=false;
 }
 function restoreFocus(){
  if(returnFocus?.isConnected&&typeof returnFocus.focus==='function')returnFocus.focus();
  else $('pauseButton')?.focus();
  returnFocus=null;
 }
 function open(e){
  if(state!=='play'||level!==yomi||!e||e.dead||e.active||!enemies.includes(e))return false;
  init();revision++;encounter=e;returnFocus=document.activeElement;
  clearInput();render();clearKeys();state='slayerSpell';modal().hidden=false;
  $('slayerSpellInput').focus();return true;
 }
 function close(){
  if(state!=='slayerSpell')return false;
  revision++;encounter=null;modal().hidden=true;clearInput();clearKeys();state='play';restoreFocus();return true;
 }
 // Also invalidates an already-open warning when main menu/travel cancels an encounter.
 function cancel(){
  const wasOpen=state==='slayerSpell';
  revision++;encounter=null;modal().hidden=true;clearInput();clearKeys();returnFocus=null;
  if(warningOpen){$('dialog').hidden=true;$('dialogOk').onclick=null;if(state==='dialog')state='play';warningOpen=false;}
  $('dialog').classList.remove('slayer-warning');
  if(wasOpen)state='play';
 }
 function submit(event){
  event.preventDefault();
  if(state!=='slayerSpell')return;
  if($('slayerSpellInput').value.trim().toLowerCase()!=='iddqd'){
   hasError=true;render();$('slayerSpellInput').setAttribute('aria-invalid','true');$('slayerSpellInput').focus();return;
  }
  const e=encounter,origin=level;
  close();const expected=revision;
  warningOpen=true;$('dialog').classList.add('slayer-warning');
  story('slayer.name','slayer.warning','slayer.epitaph',()=>{
   warningOpen=false;
   $('dialog').classList.remove('slayer-warning');
   if(expected!==revision||state!=='play'||level!==origin||level!==yomi||!enemies.includes(e)||e.dead||e.active)return;
   DoomSlayer.start(e);
  });
 }
 function keydown(event){
  if(state!=='slayerSpell')return;
  // Stop all typed letters before the window-level gameplay hotkeys see them.
  event.stopPropagation();
  const key=Bindings.normalize(event.code==='Space'?' ':event.key);
  const target=event.target||document.activeElement,editing=target===$('slayerSpellInput')||target?.matches?.('input,textarea,[contenteditable="true"]');
  if(key==='escape'||!editing&&Bindings.read('pause').includes(key)){
   event.preventDefault();if(!event.repeat)close();return;
  }
  if(key!=='tab')return;
  const nodes=[...modal().querySelectorAll('input:not([disabled]),button:not([disabled])')].filter(node=>!node.hidden&&node.getClientRects().length);
  const first=nodes[0],last=nodes[nodes.length-1];
  if(!first)return;
  if(event.shiftKey&&(document.activeElement===first||!nodes.includes(document.activeElement))){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&(document.activeElement===last||!nodes.includes(document.activeElement))){event.preventDefault();first.focus();}
 }
 function init(){
  if(initialized)return;initialized=true;
  $('slayerSpellForm').addEventListener('submit',submit);
  $('closeSlayerSpell').addEventListener('click',close);
  $('slayerSpellInput').addEventListener('input',()=>{if(hasError){hasError=false;render();$('slayerSpellInput').removeAttribute?.('aria-invalid');}});
  modal().addEventListener('keydown',keydown);
  modal().addEventListener('keyup',event=>{if(state==='slayerSpell')event.stopPropagation();});
  I18n.onChange(()=>{if(state==='slayerSpell')render();});
 }
 return Object.freeze({init,open,close,cancel});
})();
