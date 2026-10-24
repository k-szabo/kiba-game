/* Developer utilities, reached outside the player menus. */
'use strict';
const DevTools=(()=>{
 const tools=new Map();
 let initialized=false,opened=false,session=0,render=0,origin='menu',returnFocus=null,message='';
 let inertSiblings=[],overlays=[];
 const overlayIds=['menu','pause','inventory','map','training','help','dialog','shop','slayerSpell','campService'];
 const node=id=>document.getElementById(id);
 function text(id,key){node(id).textContent=I18n.t(key);}
 function refresh(){
  if(!initialized)return;
  for(const [id,key] of Object.entries({devEyebrow:'dev.eyebrow',devTitle:'dev.title',devIntro:'dev.intro',devClose:'dev.close',devEmpty:'dev.empty'}))text(id,key);
  node('devVersion').textContent=I18n.format('dev.version',[GAME_RELEASE.version]);
  node('devStatus').textContent=message?I18n.t(message):'';node('devStatus').hidden=!message;
  const focusId=document.activeElement?.id,list=node('devToolsList');list.replaceChildren();
  const currentSession=session,currentRender=++render;
  if(opened)for(const tool of tools.values()){
   const valid=()=>opened&&currentSession===session&&currentRender===render&&state==='developer'&&(!tool.available||tool.available());
   const controls=[],fields=tool.fields?.()||[];
   const group=fields.length?document.createElement('section'):list;
   if(fields.length){group.className='dev-tool-fields';list.append(group);}
   for(const field of fields){
    const label=document.createElement('label'),input=document.createElement(field.type==='select'?'select':'input');
    input.id='dev-'+tool.id+'-'+field.id;label.htmlFor=input.id;label.textContent=I18n.t(field.labelKey);
    if(field.type==='select')for(const entry of field.options){const option=document.createElement('option');option.value=String(entry.value);option.textContent=I18n.t(entry.label);input.append(option);}
    else{input.type='number';input.min=field.min;input.max=field.max;input.step=1;}
    input.value=String(field.value);input.disabled=!!tool.available&&!tool.available();
    input.onchange=()=>{if(!valid())return;if(field.change){field.change(input.value);refresh();}};
    controls.push([field.id,input]);group.append(label);group.append(input);
   }
   const button=document.createElement('button');button.type='button';button.textContent=I18n.t(tool.labelKey);
   button.id='dev-tool-'+tool.id;
   if(tool.toggled){const on=!!tool.toggled();button.setAttribute('aria-pressed',String(on));button.textContent+=' · '+I18n.t(on?'dev.on':'dev.off');}
   button.disabled=!!tool.available&&!tool.available();
   button.onclick=()=>{
    if(!valid())return;
    try{const result=tool.run(Object.fromEntries(controls.map(([id,input])=>[id,input.value])));message=typeof result==='string'?result:result===false?'dev.invalid':result===true?'dev.applied':'';refresh();}catch{message='dev.toolError';refresh();}
   };
   group.append(button);
  }
  node('devEmpty').hidden=tools.size>0;
  if(opened&&focusId){const previous=node(focusId);if(previous&&!previous.disabled&&previous.getClientRects().length)previous.focus();}
 }
 function register(tool){
  if(!tool||!/^[-a-z0-9]+$/.test(tool.id)||typeof tool.labelKey!=='string'||typeof tool.run!=='function'||tool.available!==undefined&&typeof tool.available!=='function'||tools.has(tool.id))throw Error('Invalid developer tool registration');
  tools.set(tool.id,Object.freeze({...tool}));if(opened)refresh();
 }
 function open(){
  if(!initialized||resolutionBlocked)return false;if(opened)return true;
  if(!['menu','play','pause','inventory','map','training','help','dialog','shop','slayerSpell','campService','won'].includes(state))return false;
  origin=state;returnFocus=document.activeElement;opened=true;session++;message='';state='developer';keys.clear();pressed.clear();
  overlays=overlayIds.map(id=>[node(id),node(id).hidden]);
  for(const [overlay] of overlays)overlay.hidden=true;
  inertSiblings=[...node('game').children].filter(child=>child!==node('devPanel')).map(child=>[child,child.inert]);
  for(const [child] of inertSiblings)child.inert=true;
  node('devPanel').hidden=false;node('devPanel').scrollTop=0;refresh();node('devClose').focus();return true;
 }
 function close(){
  if(!opened)return false;opened=false;session++;message='';refresh();node('devPanel').hidden=true;
  for(const [child,wasInert] of inertSiblings)child.inert=wasInert;inertSiblings=[];
  for(const [overlay,wasHidden] of overlays)overlay.hidden=wasHidden;overlays=[];
  state=origin;keys.clear();pressed.clear();
  if(origin==='inventory')Inventory.render();
  if(origin==='shop')Merchant.render();
  if(origin==='campService')CampWorkshop.render();
  if(window.location?.hash==='#devtools')window.history.replaceState(null,'',window.location.pathname+window.location.search);
  if(returnFocus?.isConnected&&returnFocus.matches?.('button,a[href],input,select,textarea,summary,[tabindex]')&&!returnFocus.disabled&&!returnFocus.closest('[inert]')&&returnFocus.getClientRects().length)returnFocus.focus();
  else node(({menu:'startButton',pause:'resumeButton',inventory:'closeInventory',map:'closeMap',training:'closeTraining',help:'helpTitle',dialog:'dialogOk',won:'dialogOk',shop:'closeShop',campService:'closeCampService'})[origin]||'pauseButton').focus();
  return true;
 }
 function init(){
  if(initialized)return;initialized=true;
  node('devClose').onclick=close;
  node('devPanel').addEventListener('keydown',event=>{
   if(!opened)return;
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();return;}
   if(event.key!=='Tab')return;
   const controls=[...node('devPanel').querySelectorAll('input:not([disabled]),select:not([disabled]),button:not([disabled])')].filter(control=>control.getClientRects().length);
   if(!controls.length)return;const first=controls[0],last=controls[controls.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  const fromHash=()=>{if(window.location?.hash==='#devtools')open();};
  window.addEventListener('hashchange',fromHash);I18n.onChange(refresh);refresh();fromHash();
 }
 function setReturnState(value){
  if(!opened||!['menu','play','pause'].includes(value))return false;
  if(origin==='campService')CampWorkshop.cancel();
  origin=value;overlays=overlays.map(([overlay])=>[overlay,overlay!==node(value)]);
  if(typeof captureAction!=='undefined')captureAction=null;
  returnFocus=null;return true;
 }
 return Object.freeze({init,open,close,register,refresh,setReturnState,get isOpen(){return opened;},get returnState(){return origin;},get menuBackground(){return opened&&(origin==='menu'||origin==='help'&&helpOrigin==='menu');}});
})();
