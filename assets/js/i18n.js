/* Locale IDs and translations live in assets/i18n/locales.json. */
'use strict';
const I18n=(()=>{
 const languages=Object.keys(LOCALES),fallback='hu',listeners=[];
 let locale;try{locale=localStorage.getItem('momo-language');}catch{}
 if(!languages.includes(locale)){
  const preferred=(navigator.language||'').toLowerCase().split('-')[0];
  locale=languages.includes(preferred)?preferred:languages.includes('en')?'en':fallback;
 }
 const reverse=new Map(),patterns=[];
 for(const language of languages)for(const [id,value] of Object.entries(LOCALES[language]))if(!reverse.has(value))reverse.set(value,id);
 const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 for(const id of Object.keys(LOCALES[fallback])){
  const variants=languages.map(language=>LOCALES[language][id]).filter(value=>typeof value==='string'&&/\{\d+\}/.test(value));
  if(variants.length)patterns.push({id,matchers:variants.map(value=>new RegExp('^'+value.split(/\{\d+\}/).map(escape).join('(.*?)')+'$'))});
 }
 const lookup=id=>LOCALES[locale]?.[id]??LOCALES[fallback][id]??id;
 function format(id,args){return lookup(id).replace(/\{(\d+)\}/g,(_,index)=>t(String(args[index]??'')));}
 function t(value){
  if(typeof value!=='string')return value;
  if(Object.hasOwn(LOCALES[fallback],value))return lookup(value);
  const id=reverse.get(value);if(id)return lookup(id);
  for(const entry of patterns)for(const matcher of entry.matchers){const match=value.match(matcher);if(match)return format(entry.id,match.slice(1));}
  return value;
 }
 function applyDOM(){
  if(document.documentElement)document.documentElement.lang=locale;
  if(!document.createTreeWalker)return;
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){if(['SCRIPT','STYLE','KBD','OPTION'].includes(node.parentElement?.tagName))continue;const source=node.nodeValue,trim=source.trim();if(trim)node.nodeValue=source.replace(trim,t(trim));}
  for(const element of document.querySelectorAll('[title],[aria-label],meta[name="description"]'))for(const attr of ['title','aria-label','content'])if(element.hasAttribute(attr))element.setAttribute(attr,t(element.getAttribute(attr)));
  document.title=t(document.title);
  for(const select of document.querySelectorAll('.language-picker select')){
   for(const language of languages)if(![...select.options].some(option=>option.value===language)){
    const option=document.createElement('option');option.value=language;
    try{option.textContent=new Intl.DisplayNames([language],{type:'language'}).of(language);}catch{option.textContent=language.toUpperCase();}
    select.append(option);
   }
   select.value=locale;
  }
 }
 function setLocale(value){if(!languages.includes(value))return;locale=value;try{localStorage.setItem('momo-language',value);}catch{}applyDOM();for(const fn of listeners)fn();}
 return Object.freeze({t,format,applyDOM,setLocale,onChange(fn){listeners.push(fn);},get locale(){return locale;},get languages(){return [...languages];}});
})();
