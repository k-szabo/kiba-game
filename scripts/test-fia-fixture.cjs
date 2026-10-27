'use strict';
const assert=require('node:assert/strict'),harness=require('./test-harness.cjs');
function setup(room=true){
 const h=harness(),r=h.run;
 r("Prologue.stop();abilities=[true,true];defeated=[true,true,true,true];flags=[['forestBell','villageBell','guardian:oldCultist'],['soulUpper','soulLower','akashRescued'],['dawnSeal','shadowEntered'],['guardian:cultJailer','prisonOpen','guardian:prisonHunter','fiaSeen','fiaRescued','shadowAltar']];visitedRests=levels.map(map=>[map.rests[0].id]);progression=freshProgression();dungeonState=DungeonRules.fresh();enterRealm(3);state='play';");
 if(room)r("flags[3].push('arenaQuestAccepted','arenaRewardCaptain','arenaRewardSerpent','arenaSerpentScale','arenaRewardGuards','arenaChampion');");
 assert(r('CampQuest.enter('+JSON.stringify(room?'fiaChambers':'shadowDen')+')'));return h;
}
module.exports=setup;
