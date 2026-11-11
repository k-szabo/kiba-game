/* Opt-in community scores. No gameplay or journey state is changed here. */
'use strict';
const TowerLeaderboard=(()=>{
 let opened=false,busy=false,revision=0,source=null,returnFocus=null,rows=[],status='';
 const node=id=>document.getElementById(id),tr=id=>I18n.t('leaderboard.'+id);
 function render(){
  for(const [id,key]of Object.entries({leaderboardTitle:'title',leaderboardNameLabel:'name',leaderboardSubmit:'submit',leaderboardRefresh:'refresh',leaderboardInfo:'info'}))node(id).textContent=tr(key);
  node('leaderboardBack').textContent=I18n.t('weapon.choose.back');node('leaderboardStatus').textContent=status?tr(status):'';
  for(const id of ['leaderboardSubmit','leaderboardRefresh','leaderboardName'])node(id).disabled=busy;
  node('leaderboardRows').replaceChildren();node('leaderboardEmpty').hidden=busy||rows.length>0;node('leaderboardEmpty').textContent=tr('empty');
  const head=node('leaderboardHead');head.replaceChildren();for(const key of ['rank','player','floors','time']){const cell=document.createElement('th');cell.scope='col';cell.textContent=tr(key);head.append(cell);}
  for(const item of rows){const row=document.createElement('tr'),seconds=Math.floor(item.elapsed_ms/1000);for(const value of [item.rank,item.display_name,item.cleared,Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')]){const cell=document.createElement('td');cell.textContent=String(value);row.append(cell);}node('leaderboardRows').append(row);}
 }
 async function refresh(){
  if(!opened||busy)return;const token=revision;busy=true;status='loading';render();
  try{const data=await TowerLeaderboardAPI.list();if(token!==revision)return;rows=data;status='';}catch{if(token!==revision)return;status='unavailable';}
  finally{if(token===revision){busy=false;render();}}
 }
 async function submit(){
  if(!opened||busy)return;const name=node('leaderboardName').value.trim().normalize('NFC'),score=TowerStore.read().ranking?.best;
  if(!TowerLeaderboardAPI.nameValid(name)){status='invalidName';render();return;}
  if(!TowerLeaderboardAPI.scoreValid(score)){status='noScore';render();return;}
  const token=revision;busy=true;status='loading';render();
  try{
   await TowerLeaderboardAPI.submit(name,score);try{localStorage.setItem('kiba-tower-display-name',name);}catch{}
   if(token!==revision)return;status='submitted';
   // A successful write stays successful even when the subsequent read fails.
   try{const data=await TowerLeaderboardAPI.list();if(token===revision)rows=data;}catch{}
  }catch(e){if(token!==revision)return;status=e.code==='rate_limited'?'rateLimited':e.code==='invalid_name'?'invalidName':'unavailable';}
  finally{if(token===revision){busy=false;render();}}
 }
 function open(){
  if(opened||state!=='tower'||!TowerMode.active||TowerMode.resultLocked)return false;opened=true;revision++;busy=false;rows=[];status='';
  source=node(TowerMode.phase==='lobby'?'towerPanel':'towerResult');returnFocus=document.activeElement;source.hidden=true;node('towerLeaderboard').hidden=false;
  let name='';try{name=localStorage.getItem('kiba-tower-display-name')||'';}catch{}node('leaderboardName').value=name;render();node('leaderboardBack').focus();void refresh();return true;
 }
 function close(){if(!opened)return false;opened=false;revision++;busy=false;node('towerLeaderboard').hidden=true;source.hidden=false;if(returnFocus?.isConnected)returnFocus.focus();return true;}
 function init(){
  node('towerLeaderboardOpen').onclick=open;node('towerResultLeaderboard').onclick=open;node('leaderboardBack').onclick=close;node('leaderboardRefresh').onclick=refresh;node('leaderboardSubmit').onclick=submit;
  const labels=()=>{for(const id of ['towerLeaderboardOpen','towerResultLeaderboard'])node(id).textContent=tr('title');if(opened)render();};labels();I18n.onChange(labels);
  addEventListener('keydown',event=>{
   if(!opened||resolutionBlocked)return;
   if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}
   else if(event.key==='Tab'){
    event.preventDefault();event.stopImmediatePropagation();const controls=['leaderboardName','leaderboardSubmit','leaderboardRefresh','leaderboardBack'].map(node).filter(el=>!el.disabled),index=controls.indexOf(document.activeElement);controls[(index+(event.shiftKey?-1:1)+controls.length)%controls.length].focus();
   }
  },true);
 }
 return Object.freeze({init,open,close,get active(){return opened;}});
})();
