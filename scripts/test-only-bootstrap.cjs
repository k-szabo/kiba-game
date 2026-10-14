// VM-only seam for gameplay regression tests. Never included in runtime.js.
exports.before=`
const I18n={t:value=>value,format:(key,args)=>key.replace(/\\{(\\d+)\\}/g,(_,i)=>args[i]),applyDOM(){},onChange(){},setLocale(){},locale:'hu'};
window.__saveSnapshots=[];
const SaveVault={ready:Promise.resolve(null),isReady:true,notice:'',write(data){window.__saveSnapshots.push(JSON.stringify(data));localStorage.setItem('momo-three-worlds-v2',JSON.stringify(data));return Promise.resolve();}};
`;
exports.after=`
storageReady=true;
window.momo={getState:()=>({state,realm,abilities:[...abilities],defeated:[...defeated],flags:flags.map(f=>[...f]),shards,relics:collectedRelics(),attack:{active:attack>0,elapsed:attackElapsed,face:attackFace,hit:attackHit},progression:JSON.parse(JSON.stringify(progression)),stats:momoStats(),player:player?{...player}:null,boss:boss?{...boss}:null,checkpoint:checkpoint?{...checkpoint}:null,camera,cameraY,world:{width:level.width,height:level.height}})};
`;
