/* Side-view route geometry, independent of the final background crops. */
'use strict';
function createThirdClanMaps(){
 const route=MapCatalog.build('thirdClanPath');
 route.boss={x:-10000,y:625};
 route.ballistae=route.ballistae.map((point,index)=>({...point,id:ThirdClanRules.progress.ballistae[index]}));

 const cave=MapCatalog.build('thirdClanCave');
 cave.boss={x:-10000,y:1030};
 cave.returnDestination={location:route.id,...route.caveEntrance};
 route.returnDestination={location:'ninjaClanCamp',x:1920,y:1020};
 return {route,cave};
}
