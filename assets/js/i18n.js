/* Source texts are canonical keys; dynamic values stay separate from translated copy. */
'use strict';
const I18n=(()=>{
 let locale;try{locale=localStorage.getItem('momo-language');}catch{}
 if(!['hu','en'].includes(locale))locale=(navigator.language||'hu').toLowerCase().startsWith('hu')?'hu':'en';
 const reverse=new Map(Object.entries(ENGLISH).map(([hu,en])=>[en,hu])),listeners=[];
 const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const patterns=Object.entries(ENGLISH).filter(([hu])=>/\{\d+\}/.test(hu)).map(([hu,en])=>({hu,en,matchHu:new RegExp('^'+hu.split(/\{\d+\}/).map(escape).join('(.*?)')+'$'),matchEn:new RegExp('^'+en.split(/\{\d+\}/).map(escape).join('(.*?)')+'$')}));
 function format(key,args){const source=locale==='en'?(ENGLISH[key]||key):key;return source.replace(/\{(\d+)\}/g,(_,i)=>t(String(args[i]??'')));}
 function t(value){
  if(typeof value!=='string')return value;
  const key=Object.hasOwn(ENGLISH,value)?value:reverse.get(value);if(key)return locale==='en'?ENGLISH[key]:key;
  for(const entry of patterns){const match=value.match(entry.matchHu)||value.match(entry.matchEn);if(match)return format(entry.hu,match.slice(1));}
  return value;
 }
 function applyDOM(){
  if(document.documentElement)document.documentElement.lang=locale;
  if(!document.createTreeWalker)return;
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){if(['SCRIPT','STYLE','KBD','OPTION'].includes(node.parentElement?.tagName))continue;const text=node.nodeValue,trim=text.trim();if(trim)node.nodeValue=text.replace(trim,t(trim));}
  for(const element of document.querySelectorAll('[title],[aria-label],meta[name="description"]'))for(const attr of ['title','aria-label','content'])if(element.hasAttribute(attr))element.setAttribute(attr,t(element.getAttribute(attr)));
  document.title=t(document.title);for(const select of document.querySelectorAll('.language-picker select'))select.value=locale;
 }
 function setLocale(value){if(!['hu','en'].includes(value))return;locale=value;try{localStorage.setItem('momo-language',value);}catch{}applyDOM();for(const fn of listeners)fn();}
 return Object.freeze({t,format,applyDOM,setLocale,onChange(fn){listeners.push(fn);},get locale(){return locale;}});
})();
