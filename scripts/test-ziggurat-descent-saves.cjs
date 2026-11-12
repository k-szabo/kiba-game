'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const validate=require('./test-save-validation.cjs'),fixtures=require('./test-save-release.cjs');
const definitions=vm.createContext({I18n:{t:key=>key}});
for(const name of ['dungeon-rules','fia-journey-rules','fia-ritual-rules','fia-void-maps','dragon-raid','floating-islands-rules','floating-islands-maps','watchtower-balloon-rules','watchtower-balloon-maps','ziggurat-descent-rules','ziggurat-descent-maps','ziggurat-maps','third-clan-rules','third-clan-maps','levels'])vm.runInContext(fs.readFileSync('assets/js/'+name+'.js','utf8'),definitions);
const get=source=>JSON.parse(JSON.stringify(vm.runInContext(source,definitions))),copy=value=>JSON.parse(JSON.stringify(value));
const base=fixtures.fixture();Object.assign(base,{realm:3,location:'zigguratSummit',prologueComplete:true,abilities:[false,false],defeated:[true,true,true,true],flags:[['forestBell','villageBell'],['soulUpper','soulLower'],['dawnSeal','shadowEntered'],['dawnblade','guardian:Hannah','hannahDefeated']],visitedRests:[['start'],['start'],['start'],['start','zigguratSummitEntrance']],checkpoint:get('zigguratSummit.rests[0]')});base.progression.points=1;
assert.doesNotThrow(()=>validate(base),'Compatible pre-descent Hannah save remains valid');
const accepted=copy(base);accepted.flags[3].push('zigguratDescentAccepted');assert.doesNotThrow(()=>validate(accepted));
const clear=copy(accepted);clear.flags[3].push('zigguratGateCleared','guardian:VoidGatekeeper');clear.progression.points++;assert.doesNotThrow(()=>validate(clear));
const arrived=copy(clear);arrived.flags[3].push('japanHeightsReached');arrived.realm=0;arrived.location='japanHeights';arrived.checkpoint=get('japanHeights.rests[0]');arrived.visitedRests[0].push('japanHeightsArrival');assert.doesNotThrow(()=>validate(arrived),'Japan checkpoint accepts cross-realm story prerequisites');
const completed=copy(arrived);completed.flags[3].push('zigguratReturnCompleted');assert.doesNotThrow(()=>validate(completed));
for(const [key,source]of [['zigguratDescentAccepted',clear],['zigguratGateCleared',arrived],['guardian:VoidGatekeeper',clear],['japanHeightsReached',completed],['hannahDefeated',accepted]]){const bad=copy(source);bad.flags[3]=bad.flags[3].filter(id=>id!==key);assert.throws(()=>validate(bad),/Invalid/,'Reject missing story prerequisite '+key);}
for(const points of [0,1,3]){const bad=copy(clear);bad.progression.points=points;assert.throws(()=>validate(bad),/Invalid/,'Gate contributes exactly one point');}
const forged=copy(accepted);forged.realm=0;forged.location='japanHeights';forged.checkpoint=get('japanHeights.rests[0]');forged.visitedRests[0].push('japanHeightsArrival');assert.throws(()=>validate(forged),/Invalid/,'No mountain location before portal arrival');
const shifted=copy(arrived);shifted.checkpoint.y++;assert.throws(()=>validate(shifted),/Invalid/,'New checkpoints retain exact coordinate validation');
console.log('PASS: Compatible old saves, ordered descent milestones, strict bonus-point budget and cross-realm checkpoint/portal gating.');
