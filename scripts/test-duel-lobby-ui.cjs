'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{setup}=require('./test-duel-mode.cjs');
const actor=(h,side)=>({row:h.node('duelParticipant'+side),icon:h.node('duelParticipant'+side+'Icon'),status:h.node('duelParticipant'+side+'Ready'),connection:h.node('duelParticipant'+side+'Connection'),name:h.node('duelParticipant'+side+'Name')});
const assertState=(h,side,connected,ready=false)=>{
 const a=actor(h,side);assert.equal(a.row.getAttribute('data-connected'),String(connected));assert.equal(a.row.getAttribute('data-ready'),String(connected&&ready));assert.equal(a.icon.hidden,!connected);assert.equal(a.status.hidden,!connected);
 if(connected){assert.equal(a.connection.textContent,'duel.connected');assert.equal(a.status.textContent,ready?'✓ duel.readyStatus':'duel.notReady');}
};
(async()=>{
 const h=setup();h.sandbox.duel.open();assertState(h,'Local',false);assertState(h,'Remote',false);
 await h.node('duelCreate').onclick();assertState(h,'Local',false);assertState(h,'Remote',false);
 // A signaling room/code is not proof that the other player completed the
 // transport's versioned hello/ack exchange. Unverified messages do not help.
 h.callbacks[0].onMessage({type:'loadout',weapon:'naginata',ready:true});assertState(h,'Remote',false);
 h.callbacks[0].onState('connected');assertState(h,'Local',true);assertState(h,'Remote',true);
 const status=actor(h,'Remote').status;let statusText=status.textContent,textWrites=0;Object.defineProperty(status,'textContent',{get:()=>statusText,set:value=>{statusText=value;textWrites++;}});
 for(let i=0;i<3;i++)h.callbacks[0].onMessage({type:'loadout',weapon:'katana',ready:false});assert.equal(textWrites,0,'Unchanged lobby updates do not mutate the polite status text');
 assert.equal(actor(h,'Local').name.textContent,'duel.you');assert.equal(actor(h,'Remote').name.textContent,'duel.opponent');
 h.callbacks[0].onMessage({type:'loadout',weapon:'naginata',ready:true});assertState(h,'Remote',true,true);assertState(h,'Local',true,false);
 h.callbacks[0].onMessage({type:'loadout',weapon:'swordShield',ready:false});assertState(h,'Remote',true,false);
 h.node('duelReady').onclick();assertState(h,'Local',true,true);assertState(h,'Remote',true,false);
 h.node('duelWeapon').value='naginata';h.node('duelWeapon').onchange();assertState(h,'Local',true,false);assert.equal(h.sent.at(-1).ready,false);
 h.callbacks[0].onState('closed');assertState(h,'Local',false);assertState(h,'Remote',false);assert.equal(h.node('duelReady').getAttribute('aria-pressed'),'false');
 const stale=h.callbacks[0];h.sandbox.duel.leave();h.sandbox.duel.open();assertState(h,'Remote',false);stale.onState('connected');stale.onMessage({type:'loadout',weapon:'katana',ready:true});assertState(h,'Remote',false);
 h.node('duelCode').value='ABCDEFGH';await h.node('duelJoin').onclick();h.callbacks[1].onState('connected');assertState(h,'Local',true,false);assertState(h,'Remote',true,false);
 h.node('duelReady').onclick();assertState(h,'Local',true,true);assertState(h,'Remote',true,false);
 h.callbacks[1].onState('error','version');assertState(h,'Local',false);assertState(h,'Remote',false);
 // Reconnecting after an error cannot inherit either participant's ready bit.
 h.node('duelCode').value='ABCDEFGH';await h.node('duelJoin').onclick();assertState(h,'Remote',false);h.callbacks[2].onState('connected');assertState(h,'Local',true,false);assertState(h,'Remote',true,false);
 h.sandbox.duel.leave();
 const css=fs.readFileSync('assets/css/style.css','utf8');assert(css.includes('grid-template-columns:minmax(0,280px)'));assert(/\.duel-actions button,\.duel-panel>button,#duelMatchLeave,\.duel-result button\{[^}]*width:280px;[^}]*height:48px;/.test(css),'Lobby/leave/rematch buttons share a bounded explicit size and design');
 console.log('PASS: two-player connection/readiness indicators follow verified host/guest state, weapon changes, disconnect, stale callbacks and reconnect; all duel buttons share dimensions.');
})().catch(error=>{console.error(error);process.exitCode=1;});
