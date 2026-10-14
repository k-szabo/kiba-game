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
 for(const language of languages)for(const [id,value] of Object.entries(LOCALES[language].dict))if(!reverse.has(value))reverse.set(value,id);
 const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 for(const id of Object.keys(LOCALES[fallback].dict)){
  const variants=languages.map(language=>LOCALES[language].dict[id]).filter(value=>typeof value==='string'&&/\{\d+\}/.test(value));
  if(variants.length)patterns.push({id,matchers:variants.map(value=>new RegExp('^'+value.split(/\{\d+\}/).map(escape).join('(.*?)')+'$'))});
 }
 const lookup=id=>LOCALES[locale]?.dict[id]??LOCALES[fallback].dict[id]??id;
 function format(id,args){return lookup(id).replace(/\{(\d+)\}/g,(_,index)=>t(String(args[index]??'')));}
 function t(value){
  if(typeof value!=='string')return value;
  if(Object.hasOwn(LOCALES[fallback].dict,value))return lookup(value);
  const id=reverse.get(value);if(id)return lookup(id);
  for(const entry of patterns)for(const matcher of entry.matchers){const match=value.match(matcher);if(match)return format(entry.id,match.slice(1));}
  return value;
 }
 const flagFor=code=>LOCALES[code].flag;
 const bilingualName=code=>{
  const {lang_orig:native,lang_en:translated}=LOCALES[code];
  return native===translated?native:`${native} | ${translated}`;
 };
 function applyDOM(){
  if(document.documentElement)document.documentElement.lang=locale;
  if(!document.createTreeWalker)return;
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){if(['SCRIPT','STYLE','KBD','OPTION'].includes(node.parentElement?.tagName))continue;const source=node.nodeValue,trim=source.trim();if(trim)node.nodeValue=source.replace(trim,t(trim));}
  for(const element of document.querySelectorAll('[title],[aria-label],meta[name="description"]'))for(const attr of ['title','aria-label','content'])if(element.hasAttribute(attr))element.setAttribute(attr,t(element.getAttribute(attr)));
  document.title=t(document.title);
  for(const picker of document.querySelectorAll('.language-picker')){
   const select=picker.querySelector('select'),details=picker.querySelector('.language-chooser');
   if(!select)continue;
   for(const language of languages){
    let option=[...select.options].find(item=>item.value===language);
    if(!option){option=document.createElement('option');option.value=language;select.append(option);}
    option.textContent=bilingualName(language);
   }
   select.value=locale;
   if(!details)continue;
   select.hidden=true;details.hidden=false;
   const summary=details.querySelector('summary'),caption=t('menu.language.label');
   summary.querySelector('.language-flag').src=flagFor(locale);
   const current=summary.querySelector('.language-current');current.replaceChildren();
   const currentNative=document.createElement('span');currentNative.lang=locale;currentNative.textContent=LOCALES[locale].lang_orig;current.append(currentNative);
   if(LOCALES[locale].lang_orig!==LOCALES[locale].lang_en){const english=document.createElement('span');english.lang='en';english.textContent=LOCALES[locale].lang_en;current.append(' | ',english);}
   summary.setAttribute('aria-label',`${caption}: ${bilingualName(locale)}`);
   const group=details.querySelector('.language-options');group.setAttribute('aria-label',caption);group.replaceChildren();
   for(const language of languages){
    const button=document.createElement('button');button.type='button';button.className='language-option';
    button.setAttribute('aria-pressed',String(language===locale));
    const flag=document.createElement('img');flag.className='language-flag';flag.src=flagFor(language);flag.alt='';
    const label=document.createElement('span');label.dir='auto';
    const native=document.createElement('span');native.lang=language;native.textContent=LOCALES[language].lang_orig;label.append(native);
    if(LOCALES[language].lang_orig!==LOCALES[language].lang_en){const english=document.createElement('span');english.lang='en';english.textContent=LOCALES[language].lang_en;label.append(' | ',english);}
    button.append(flag,label);button.addEventListener('click',()=>{details.open=false;setLocale(language);summary.focus();});group.append(button);
   }
   if(!details.dataset.bound){
    details.dataset.bound='true';
    details.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();details.open=false;summary.focus();}});
    details.addEventListener('toggle',()=>{if(details.open)for(const other of document.querySelectorAll('.language-chooser'))if(other!==details)other.open=false;});
   }
  }
 }
 document.addEventListener('pointerdown',event=>{for(const chooser of document.querySelectorAll('.language-chooser[open]'))if(!chooser.contains(event.target))chooser.open=false;});
 function setLocale(value){if(!languages.includes(value))return;locale=value;try{localStorage.setItem('momo-language',value);}catch{}applyDOM();for(const fn of listeners)fn();}
 return Object.freeze({t,format,applyDOM,setLocale,onChange(fn){listeners.push(fn);},get locale(){return locale;},get languages(){return [...languages];}});
})();
