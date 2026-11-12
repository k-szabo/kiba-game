/* Campaign objectives, in priority order. */
'use strict';

function nextObjective(){return Compass.objective(localObjective());}
function localObjective(){
 const optional=SkyDragonRaid.objective()||StoryRaid.objective()||ThirdClan.objective()||
  WatchtowerBalloon.objective({remote:false})||FloatingIslands.objective({remote:false})||FiaRitual.objective()||FiaVoidJourney.objective()||
  DragonRaid.objective()||ZigguratDescent.objective({remote:false})||HannahEncounter.objective()||
  DungeonRun.objective()||ArenaChallenge.objective()||KitsuneQuest.objective()||
  PrisonQuest.objective()||CampQuest.objective();
 if(optional)return optional;
 if(ShadowRealm.active())return ShadowRealm.objective();
 if(level===forestCamp)return{point:level.rests[0],compass:false,text:I18n.t('camp.objective')};
 if(level.id==='councilHall')return{point:level.inscription,compass:false,text:I18n.t('council.hall.objective')};
 if(defeated[realm])return{point:realm===2?level.father:level.exit,name:realm===2?I18n.t('HARU'):realms[realm+1].name,text:realm===2?I18n.t("text.ride.the.final.wind.stream.up.to.your.father"):I18n.t("text.stand.beneath.the.glowing.torii.and.press.e")};
 if(realm===0){if(!abilities[0])return{point:level.ability,name:level.ability.name,text:I18n.t("text.visit.the.wind.shrine.beside.the.path")};const bell=level.objects.find(o=>o.type==='bell'&&!hasFlag(o.id));if(bell)return{point:bell,name:bell.name,text:I18n.format("message.ring.arg0.bells.arg1.2",[bell.name,flags[0].filter(f=>f.endsWith('Bell')).length])};return{point:level.boss,name:realms[realm].boss,text:I18n.t("text.the.two.bells.have.opened.the.bamboo.temple.find")};}
 if(realm===1){const soul=level.objects.find(o=>o.type==='rescue'&&!hasFlag(o.id));if(soul)return{point:soul,name:soul.name,text:I18n.format("message.free.arg0.souls.arg1.2",[soul.name,flags[1].filter(f=>f.startsWith('soul')).length])};if(!abilities[1])return{point:level.ability,name:level.ability.name,text:I18n.t("text.the.shrine.of.shadows.grants.spirit.dash.use.the")};return{point:level.boss,name:realms[realm].boss,text:I18n.t("text.the.abyss.gate.is.open.descend.to.the.bottom")};}
 const upcoming=level.winds.find(w=>!w.afterBoss&&w.y+50<player.y&&w.y+w.h>player.y-250);return{point:upcoming?{x:upcoming.x+upcoming.w/2,y:upcoming.y}:level.boss,name:upcoming?(level.zones.find(z=>upcoming.x+upcoming.w/2>=z.x&&upcoming.x+upcoming.w/2<=z.x+z.w&&upcoming.y+10>=z.y&&upcoming.y+10<=z.y+z.h)?.name||realms[realm].name):realms[realm].boss,text:hasFlag('dawnSeal')?I18n.t("text.the.dawn.seal.is.broken.the.guardian.awaits.at"):I18n.t("text.jump.into.the.wind.streams.and.move.sideways.onto")};}
