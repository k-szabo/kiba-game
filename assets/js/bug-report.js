/* A user-reviewed GitHub draft; never exports saves or raw browser/session data. */
'use strict';
const BugReport=(()=>{
 const endpoint='https://github.com/k-szabo/kiba-game/issues/new';
 const areas=new Set(['menu','dream','japan','yomi','heaven','council']);
 function browserName(){
  const agent=navigator.userAgent||'';
  for(const [pattern,name] of [[/(?:Edg|EdgA|EdgiOS)\/(\d+)/,'Edge'],[/(?:Firefox|FxiOS)\/(\d+)/,'Firefox'],[/(?:OPR|OPiOS)\/(\d+)/,'Opera'],[/(?:Chrome|CriOS)\/(\d+)/,'Chrome'],[/Version\/(\d+).*Safari\//,'Safari']]){
   const match=agent.match(pattern);if(match)return name+' '+match[1];
  }
  return I18n.t('bugReport.unknown');
 }
 function createURL(area='menu'){
  const url=new URL(endpoint),safeArea=areas.has(area)?area:'menu';
  url.searchParams.set('title',I18n.format('bugReport.issueTitle',[GAME_RELEASE.version]));
  url.searchParams.set('body',I18n.format('bugReport.template',[
   GAME_RELEASE.version,I18n.locale,I18n.t('bugReport.area.'+safeArea),browserName(),
   `${Math.round(innerWidth)} × ${Math.round(innerHeight)}`,Number(devicePixelRatio||1).toFixed(2),
   I18n.t(typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches?'bugReport.touch':'bugReport.pointer')
  ]));
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
