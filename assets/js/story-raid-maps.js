/* Story raid stages load their geometry from the shared map catalogue. */
'use strict';
function createStoryRaidMaps(){
 return [1,2,3].map(tier=>MapCatalog.build('storyRaidTier'+tier));
}
