/* Watchtower and balloon route geometry is maintained in JSON. */
'use strict';
function createWatchtowerBalloonMaps(){
 return Object.fromEntries(['ninjaWatchtower','balloonJourney','skyLanding','stormIslands']
  .map(id=>[id,MapCatalog.build(id)]));
}
