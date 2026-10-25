/* A public Tally form; never exports saves or raw browser/session data. */
'use strict';
const BugReport=(()=>{
 const endpoint='https://tally.so/r/8Nojjr';
 const areas=new Set(['menu','dream','japan','yomi','heaven','council','forestCamp','yomiDungeon1','yomiDungeon2','yomiDungeon3']);
 function browserName(){
  const agent=navigator.userAgent||'';
  for(const [pattern,name] of [[/(?:Edg|EdgA|EdgiOS)\/(\d+)/,'Edge'],[/(?:Firefox|FxiOS)\/(\d+)/,'Firefox'],[/(?:OPR|OPiOS)\/(\d+)/,'Opera'],[/(?:Chrome|CriOS)\/(\d+)/,'Chrome'],[/Version\/(\d+).*Safari\//,'Safari']]){
   const match=agent.match(pattern);if(match)return name+' '+match[1];
  }
  return I18n.t('bugReport.unknown');
 }
 function createURL(area='menu'){
  const url=new URL(endpoint),safeArea=areas.has(area)?area:'menu';
  const fields={
   version:GAME_RELEASE.version,language:I18n.locale,area:I18n.t('bugReport.area.'+safeArea),browser:browserName(),
   viewport:`${Math.round(innerWidth)} × ${Math.round(innerHeight)}`,pixel_ratio:Number(devicePixelRatio||1).toFixed(2),
   input:I18n.t('bugReport.pointer')
  };
  for(const [key,value] of Object.entries(fields))url.searchParams.set(key,value);
  return url.href;
 }
 function init(currentArea){
  const refreshers=[];
  for(const link of document.querySelectorAll('[data-bug-report]')){
   const refresh=()=>{
    link.href=createURL(link.dataset.bugReport==='menu'?'menu':currentArea());
    link.setAttribute('aria-label',I18n.t('bugReport.label'));
    link.title=I18n.t('bugReport.hint');
   };
   refresh();refreshers.push(refresh);
   for(const event of ['focus','pointerdown','click'])link.addEventListener(event,refresh);
  }
  I18n.onChange(()=>refreshers.forEach(refresh=>refresh()));
 }
 return Object.freeze({createURL,init});
})();
