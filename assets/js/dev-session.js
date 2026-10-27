/* In-memory developer runs never replace normal progression or stored records. */
'use strict';
const DevSession=(()=>{
 let active=false,normalSave=null,initialized=false;
 const endHandlers=new Set();
 const clone=value=>value?JSON.parse(JSON.stringify(value)):null;
 const ready=()=>storageReady&&loadingReady&&Visuals.loaded===Visuals.total&&!Visuals.failures.length;
 function refresh(){
  const badge=$('devTestNotice');badge.hidden=!active;badge.textContent=I18n.t('dev.session.active');
  $('devSessionInfo').textContent=I18n.t('dev.session.info');
 }
 function begin(){
  if(state!=='developer'||!DevTools.isOpen||!ready())return false;
  if(active)return true;
  FiaConflict.abort();normalSave=clone(saved);active=true;weaponChoicePending=false;campServices=clone(campServices);dungeonState=DungeonRules.copy(dungeonState)||DungeonRules.fresh();
  if(DevTools.menuBackground){
   const old=normalSave;
   abilities=old?[...old.abilities]:[false,false];defeated=old?[...old.defeated]:levels.map(()=>false);
   flags=old?old.flags.map(f=>[...f]):levels.map(()=>[]);visitedRests=old?old.visitedRests.map(f=>[...f]):levels.map(()=>[]);
   weaponStyle=old?.weaponStyle??'katana';shards=old?old.shards:0;coins=old?.coins??0;meatCount=old?.meatCount??0;teaCount=old?.teaCount??0;chickenCount=old?.chickenCount??0;soldItems=old?[...old.soldItems]:[];quickHeal=old?.quickHeal??'roastMeat';progression=normalizeProgression(old?.progression,flags);
   campServices=clone(old?.campServices)||CampServiceRules.fresh(weaponStyle);dungeonState=DungeonRules.copy(old?.dungeon)||DungeonRules.fresh();equippedTalisman=old?.equippedTalisman??null;
   Prologue.stop();enterRealm(0);
  }else if(Prologue.active){Prologue.stop();enterRealm(0);}
  $('menu').hidden=true;$('pause').hidden=true;showHUD(true);DevTools.setReturnState('play');
  refresh();updateHUD();return true;
 }
 function end(){
  if(!active)return false;
  FiaConflict.clear();active=false;saved=clone(normalSave);normalSave=null;
  chickenCount=saved?.chickenCount??0;equippedTalisman=saved?.equippedTalisman??null;weaponStyle=saved?.weaponStyle??'katana';campServices=clone(saved?.campServices)||CampServiceRules.fresh(weaponStyle);dungeonState=DungeonRules.copy(saved?.dungeon)||DungeonRules.fresh();
  for(const handler of endHandlers)handler();
  if(DevTools.isOpen)DevTools.close();
  refresh();mainMenu();return true;
 }
 function init(){
  if(initialized)return;initialized=true;
  DevTools.register({id:'test-start',labelKey:'dev.session.start',available:()=>!active&&ready(),run:begin});
  DevTools.register({id:'test-end',labelKey:'dev.session.end',available:()=>active,run:end});
  Visuals.ready.then(()=>{if(DevTools.isOpen)DevTools.refresh();});
  I18n.onChange(refresh);refresh();
 }
 return Object.freeze({begin,end,init,refresh,onEnd(handler){endHandlers.add(handler);},get active(){return active;},get ready(){return ready();}});
})();
