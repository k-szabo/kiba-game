'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {setup}=require('./test-duel-mode.cjs');
async function host(){
 const h=setup();h.sandbox.duel.open();await h.node('duelCreate').onclick();
 h.callbacks[0].onState('connected');
 h.callbacks[0].onMessage({type:'loadout',weapon:'naginata',ready:true});h.node('duelReady').onclick();
 h.callbacks[0].onMessage({type:'input',match:1,round:1,seq:0,input:{move:0,jump:false,dash:false,attack:false,heavy:false},blocked:false});
 // Use the real game keyboard dispatcher, with the node that receives focus
 // after pointer unlock. A null target would miss this regression entirely.
 const source=fs.readFileSync('assets/js/game.js','utf8');
 const start=source.indexOf('function handleKeyDown(e)'),end=source.indexOf('function handleKeyUp(e)',start);
 assert(start>=0&&end>start);h.sandbox.keyName=e=>e.key;
 vm.runInContext(source.slice(start,end),h.sandbox);
 return h;
}
const control=kind=>({closest:selector=>selector.split(',').some(s=>s.trim()===kind)?{}:null});
function dispatch(h,key,target){
 const event={key,target,repeat:false,prevented:false,preventDefault(){this.prevented=true;}};
 h.sandbox.handleKeyDown(event);return event;
}
(async()=>{
 const h=await host(),s=h.sandbox,leave=h.node('duelMatchLeave');
 leave.closest=selector=>selector.split(',').some(value=>value.trim()==='button')?leave:null;
 s.duel.input('d',true,null);h.tick();assert(h.run('__duelTest.sim.players[0].vx>0'));
 s.duel.releasePointer(true);h.tick();assert.equal(h.run('__duelTest.sim.players[0].vx'),0,'Unlock clears previous held input');
 assert.deepEqual(h.events.at(-1),['focus','duelMatchLeave']);
 const before=h.run('__duelTest.sim.players[0].x');
 assert(dispatch(h,'d',leave).prevented,'Focused leave control accepts gameplay keyboard input');
 h.tick();assert(h.run('__duelTest.sim.players[0].x')>before,'Movement resumes without another canvas click');
 s.duel.input('d',false,leave);h.tick();assert.equal(h.run('__duelTest.sim.players[0].vx'),0);
 // Space is both the native button activation key and the default jump key.
 h.run('__duelTest.sim.players[0].onGround=true');
 assert(dispatch(h,' ',leave).prevented,'Jump suppresses native Space activation of Leave');
 h.tick();assert(h.run('__duelTest.sim.players[0].vy<0'));s.duel.input(' ',false,leave);
 assert.equal(s.duel.active,true);assert.equal(s.state,'duel');
 assert.equal(dispatch(h,'Enter',leave).prevented,false,'Unbound Enter keeps native keyboard activation available');
 assert.equal(dispatch(h,'Tab',leave).prevented,false,'Tab retains normal focus navigation');
 assert.equal(s.duel.input('mouse0',true,leave),false,'Clicking Leave never becomes a combat input');
 for(const kind of ['button','input','select','textarea','a','summary']){
  assert.equal(dispatch(h,'d',control(kind)).prevented,false,kind+' keeps native editing/activation');
 }
 assert.equal(dispatch(h,'d',{isContentEditable:true,closest:()=>null}).prevented,false,'Contenteditable text remains editable');
 assert.equal(dispatch(h,'escape',control('textarea')).prevented,false,'Editing controls do not redirect pause focus');
 s.duel.input('d',true,null);h.tick();assert.equal(s.duel.input('d',false,control('input')),true,'Release over an editor clears a held key');h.tick();assert.equal(h.run('__duelTest.sim.players[0].vx'),0);
 h.run('__duelTest.sim.players[1].hp=0');h.tick();h.tick();
 assert.equal(dispatch(h,'d',leave).prevented,false,'Round result controls do not accept gameplay');
 s.duel.leave();assert.equal(s.state,'menu');
 console.log('PASS: duel keyboard movement and jump after Escape focus, no accidental Leave activation, native controls/editors preserved, held releases and result isolation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
