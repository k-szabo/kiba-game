/* Main-menu adventure slots; portable files contain progress, never profile keys. */
'use strict';
const SaveManager=(()=>{
 let opened=false,busy=false,slots=[],status='',pending=null,importTarget=1;
 const node=id=>document.getElementById(id),tr=(key,args)=>args?I18n.format('saves.'+key,args):I18n.t('saves.'+key);
 function accept(data){saved=data;node('continueButton').hidden=!data;}
 function render(){
  node('saveTitle').textContent=tr('title');node('saveInfo').textContent=tr('info');node('saveBack').textContent=I18n.t('weapon.choose.back');
  node('saveStatus').textContent=status?tr(status):'';node('saveBack').disabled=busy;
  const list=node('saveSlots');list.replaceChildren();
  for(const item of slots){
   const row=document.createElement('section'),title=document.createElement('h3'),actions=document.createElement('div');
   row.className='save-slot';title.textContent=tr('slot',[item.slot])+(item.slot===SaveVault.activeSlot?' · '+tr('active'):'')+(!item.occupied?' · '+tr('empty'):'');row.append(title);actions.className='save-actions';
   for(const [key,run,disabled] of [['select',()=>select(item.slot),item.slot===SaveVault.activeSlot],['export',()=>exportFile(item.slot),!item.occupied],['import',()=>{importTarget=item.slot;node('saveFile').value='';node('saveFile').click();},false]]){
    const button=document.createElement('button');button.type='button';button.textContent=tr(key);button.disabled=busy||!!pending||disabled;button.onclick=run;actions.append(button);
   }row.append(actions);list.append(row);
  }
  node('saveConfirmation').hidden=!pending;
  node('saveConfirmPrompt').textContent=pending?(pending.kind==='new'?tr('newConfirm'):tr('overwrite',[pending.slot])):'';
  node('saveConfirm').textContent=pending?.kind==='new'?node('startButton').textContent:tr('import');node('saveCancel').textContent=I18n.t('merchant.sell.cancel');
  node('saveConfirm').disabled=busy;node('saveCancel').disabled=busy;
 }
 async function perform(action,error='failed'){
  if(busy)return;busy=true;status='';render();
  try{await action();slots=await SaveVault.listSlots();}catch(failure){status=error;if(failure.code==='stale_slot'){node('startButton').disabled=true;node('continueButton').disabled=true;slots=[];}}
  finally{busy=false;render();if(opened)node('saveBack').focus();}
 }
 async function select(slot){await perform(async()=>accept(await SaveVault.selectSlot(slot)));}
 async function exportFile(slot){await perform(async()=>{
  const text=await SaveVault.exportSlot(slot),url=URL.createObjectURL(new Blob([text],{type:'application/json'})),link=document.createElement('a');
  link.href=url;link.download='kiba-journey-'+slot+'.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status='exported';
 });}
 async function readFile(file){
  if(!file||busy)return;
  if(file.size>262144){status='invalid';render();return;}
  await perform(async()=>{const text=await file.text();pending={kind:'import',slot:importTarget,text};},'invalid');
  if(pending)node('saveCancel').focus();
 }
 async function confirm(){
  if(!pending||busy)return;const task=pending;pending=null;
  if(task.kind==='new'){close();startGame(false);return;}
  await perform(async()=>{const data=await SaveVault.importSlot(task.slot,task.text);if(task.slot===SaveVault.activeSlot)accept(data);status='imported';},'invalid');
 }
 async function open(){
  if(opened||state!=='menu'||resolutionBlocked||!storageReady)return false;
  opened=true;state='saves';node('menu').hidden=true;node('savePanel').hidden=false;keys.clear();pressed.clear();pending=null;status='';
  await perform(async()=>{});node('saveBack').focus();Cursor.update();return true;
 }
 function close(){if(!opened||busy)return false;opened=false;pending=null;node('savePanel').hidden=true;node('menu').hidden=false;state='menu';node('savesButton').focus();return true;}
 function newJourney(){
  if(state!=='menu'||!storageReady)return;
  if(!saved){startGame(false);return;}
  void open().then(()=>{if(!opened)return;pending={kind:'new'};render();node('saveCancel').focus();});
 }
 function init(){
  node('savesButton').onclick=open;node('startButton').onclick=newJourney;node('saveBack').onclick=close;node('saveConfirm').onclick=confirm;
  node('saveCancel').onclick=()=>{pending=null;render();node('saveBack').focus();};node('saveFile').onchange=event=>void readFile(event.target.files?.[0]);
  const labels=()=>{node('savesButton').textContent=tr('title');if(opened)render();};labels();I18n.onChange(labels);
  addEventListener('keydown',event=>{
   if(!opened||resolutionBlocked)return;
   if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();if(busy)return;if(pending){pending=null;render();node('saveBack').focus();}else close();}
   else if(event.key==='Tab'){
    const controls=[...node('savePanel').querySelectorAll('button')].filter(el=>!el.disabled&&!el.closest('[hidden]'));
    if(!controls.length)return;event.preventDefault();event.stopImmediatePropagation();const index=controls.indexOf(document.activeElement);controls[(index+(event.shiftKey?-1:1)+controls.length)%controls.length].focus();
   }
  },true);
 }
 return Object.freeze({init,open,close});
})();
