/* The atlas groups existing, canonical travel destinations; it grants no progress. */
'use strict';
const TravelAtlas=(()=>{
 let selectedRealm=null,selectedArea=null,localMap=null;
 const make=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
 const kindLabel=kind=>I18n.t(kind==='dungeon'?'travel.dungeonEntrance':kind==='raid'?'travel.atlas.raid':'travel.atlas.rest');
 const type=map=>map?.dungeon?'dungeon':map?.id==='dragonCatacombs'?'raid':'rest';
 function areas(n){
  if(!levels[n]||!DevSession.active&&!realmUnlocked(n))return [];
  const groups=new Map();
  for(const rest of realmRests(n)){
   if(rest.checkpointOnly||!travelScope(rest,n))continue;
   const side=travelSide(rest,n),map=side?.[1].map||levels[n];
   if(!DevSession.active){
    if(side&&!sideLocationUnlocked(side[0],flags,defeated))continue;
    if(rest.travelOnly){if(!defeated[n]||!flags[n].includes(rest.unlockFlag)||rest===CULT_TRAVEL&&!abilities[1])continue;}
    else if(!visitedRests[n].includes(rest.id))continue;
   }
   const id=rest.travelOnly?rest.id:map.id,kind=rest.dungeonEntrance?'dungeon':type(map),name=rest.travelOnly?rest.name:map.name||realms[n].name;
   if(!groups.has(id))groups.set(id,{id,realm:n,map,name,kind,rests:[]});
   groups.get(id).rests.push(rest);
  }
  const order={rest:0,dungeon:1,raid:2};
  return [...groups.values()].sort((a,b)=>(a.id===levels[n].id?-1:b.id===levels[n].id?1:order[a.kind]-order[b.kind]||I18n.t(a.name).localeCompare(I18n.t(b.name),I18n.locale)));
 }
 const knownRealms=()=>levels.map((_,n)=>n).filter(n=>areas(n).length);
 const button=(text,action,className='')=>{const b=make('button',className,text);b.type='button';b.onclick=action;return b;};
 function mark(b,kind){
  b.setAttribute('data-travel-kind',kind);b.setAttribute('data-type-label',kindLabel(kind));
  if(b.className!=='atlas-type'){const icon=make('span','atlas-kind-icon');icon.setAttribute('aria-hidden','true');b.append(icon);}
 }
 function select(n,id=null){
  if(state!=='map'||!knownRealms().includes(n))return false;
  const list=areas(n);if(id&&!list.some(a=>a.id===id))return false;
  selectedRealm=n;selectedArea=id||list.find(a=>a.map===level)?.id||list[0]?.id;render(true);return true;
 }
 function overview(){selectedRealm=selectedArea=null;render(true);}
 function render(focus=false){
  if(state!=='map')return;
  const content=$('mapContent'),known=knownRealms(),localLegend=document.querySelector?.('#map .map-legend');content.replaceChildren();
  if(selectedRealm!==null&&!known.includes(selectedRealm))selectedRealm=selectedArea=null;
  const atlas=make('section','travel-atlas'),title=make('h3','atlas-heading',I18n.t(selectedRealm===null?'travel.atlas.realms':realms[selectedRealm].name));atlas.append(title);
  let focusTarget;
  if(selectedRealm===null){
   const worlds=make('div','atlas-worlds');
   for(const n of known){
    const b=button('',()=>select(n),'atlas-world');b.setAttribute('data-atlas-realm',String(n));b.setAttribute('aria-label',I18n.t(realms[n].name));
    const art=make('span','atlas-painting');art.setAttribute('data-atlas-art',String(n));art.setAttribute('aria-hidden','true');
    b.append(art,make('span','atlas-world-name',I18n.t(realms[n].short)));worlds.append(b);if(n===realm)focusTarget=b;
   }
   atlas.append(worlds);
  }else{
   const back=button('← '+I18n.t('travel.atlas.back'),overview,'atlas-back');atlas.append(back);
   const list=areas(selectedRealm),area=list.find(a=>a.id===selectedArea)||list[0];selectedArea=area?.id;
   const layout=make('div','atlas-layout'),painting=make('div','atlas-region atlas-painting');painting.setAttribute('data-atlas-art',String(selectedRealm));painting.setAttribute('aria-label',I18n.t(realms[selectedRealm].name));
   const regionNodes=make('div','atlas-map-nodes');
   const areaSection=make('section','atlas-areas');areaSection.append(make('h4','',I18n.t('travel.atlas.areas')));
   const areaList=make('div','atlas-area-list');
   for(const [i,entry]of list.entries()){
    const active=entry.id===selectedArea,label=I18n.t(entry.name),b=button((i+1)+'. '+label,()=>select(selectedRealm,entry.id),'atlas-area');mark(b,entry.kind);
    b.setAttribute('data-atlas-area',entry.id);b.setAttribute('aria-pressed',String(active));areaList.append(b);if(active)focusTarget=b;
    const pin=button(String(i+1),()=>select(selectedRealm,entry.id),'atlas-pin');mark(pin,entry.kind);pin.setAttribute('aria-label',label+' · '+kindLabel(entry.kind));pin.setAttribute('aria-pressed',String(active));pin.title=label;regionNodes.append(pin);
   }
   painting.append(regionNodes);areaSection.append(areaList);
   const targets=make('section','atlas-targets');targets.append(make('h4','',area?I18n.t(area.name):I18n.t('travel.atlas.rest')));
   const grid=make('div','travel-grid'),targetRealm=selectedRealm;
   if(area)for(const rest of area.rests){
    const kind=rest.dungeonEntrance?'dungeon':area.kind,b=button(I18n.t(rest.name),()=>fastTravel(rest,targetRealm));mark(b,kind);b.disabled=!travelDestination(rest,targetRealm);b.setAttribute('data-realm',String(targetRealm));b.setAttribute('data-rest',rest.id);
    b.setAttribute('aria-label',kindLabel(kind)+' · '+I18n.format('travel.destination',[I18n.t(realms[selectedRealm].short),I18n.t(rest.name)]));grid.append(b);
   }
   targets.append(grid);layout.append(painting,areaSection,targets);atlas.append(layout);
  }
  const legend=make('div','atlas-type-legend');for(const kind of ['rest','dungeon','raid']){const entry=make('span','atlas-type',kindLabel(kind));mark(entry,kind);legend.append(entry);}atlas.append(legend);content.append(atlas);
  if(!DevSession.active&&!ShadowRealm.travelAllowed(realm,realm))content.append(make('p','travel-label',I18n.t('shadow.travel.locked')));
  if(localMap){const details=make('details','atlas-local-map');details.append(make('summary','',I18n.t('text.map.of.the.soul')),localMap());if(localLegend)details.append(localLegend);content.append(details);}
  if(focus)(focusTarget||$('closeMap')).focus();
 }
 function open(renderer){localMap=renderer;selectedRealm=selectedArea=null;render();}
 I18n.onChange(()=>{if(typeof state!=='undefined'&&state==='map')render();});
 return Object.freeze({areas,knownRealms,open,select,overview,render});
})();
