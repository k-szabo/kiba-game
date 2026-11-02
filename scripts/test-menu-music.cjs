const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 const events={},tracks=[];let allowed=false,reject=false,resolvePlay;
 class Audio{
  paused=true;plays=0;
  constructor(src){this.src=src;tracks.push(this);}
  play(){this.plays++;return new Promise((resolve,fail)=>{resolvePlay=()=>{if(reject)fail(Error('blocked'));else{this.paused=false;resolve();}};});}
  pause(){this.paused=true;}
 }
 const doc={hidden:false,addEventListener:(name,fn)=>events[name]=fn};
 const box=vm.createContext({Audio,Promise,document:doc,window:{addEventListener:(name,fn)=>events[name]=fn}});
 vm.runInContext(fs.readFileSync('assets/js/menu-music.js','utf8')+'\nthis.music=MenuMusic',box);
 box.music.init(()=>allowed);box.music.sync();assert.equal(tracks.length,0,'No audio download before sound opt-in');
 allowed=true;box.music.sync(true);const track=tracks[0];assert(track.loop);assert.equal(track.src,'assets/audio/main-menu-theme-v1.mp3');
 for(let i=0;i<10;i++)box.music.sync();assert.equal(track.plays,1,'One pending play only');
 allowed=false;box.music.sync();resolvePlay();await Promise.resolve();assert(track.paused,'Late play must not leak into gameplay');
 allowed=true;box.music.sync(true);resolvePlay();await Promise.resolve();assert(!track.paused);
 doc.hidden=true;events.visibilitychange();assert(track.paused);doc.hidden=false;events.visibilitychange();resolvePlay();await Promise.resolve();assert(!track.paused);
 allowed=false;box.music.sync();allowed=true;reject=true;box.music.sync();resolvePlay();await Promise.resolve();const attempts=track.plays;
 for(let i=0;i<10;i++)box.music.sync();assert.equal(track.plays,attempts,'No autoplay rejection loop');
 reject=false;events.keydown();resolvePlay();await Promise.resolve();assert(!track.paused);assert.equal(tracks.length,1,'Reuse a single audio element');
 events.pagehide();assert(track.paused);
 const h=require('./test-harness.cjs')();h.run("mainMenu();$('menuSoundButton').onclick()");assert(h.run('sound'));h.run("$('soundButton').onclick()");assert(!h.run('sound'));
 console.log('PASS: lazy menu music, shared toggle, single pending play, late completion, visibility, blocked autoplay retry and page exit.');
})().catch(error=>{console.error(error);process.exitCode=1;});
