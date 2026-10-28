/* Cursor visibility follows the current UI state without capturing the pointer. */
'use strict';
const Cursor=(()=>{
 function update(){
  const game=$('game');
  const mode=state==='play'&&!resolutionBlocked?'hidden':'paw';
  if(game.dataset.gameCursor!==mode)game.dataset.gameCursor=mode;
 }
 function contextMenu(event){
  const game=$('game'),target=event.target;
  if(target!==canvas&&!game.contains?.(target))return false;
  event.preventDefault();return true;
 }
 return Object.freeze({update,contextMenu});
})();
