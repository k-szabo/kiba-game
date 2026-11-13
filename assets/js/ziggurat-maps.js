/* Ziggurat approach, interior and summit load from the map catalogue. */
'use strict';
function createZigguratMaps(){
 return {
  zigguratApproach:MapCatalog.build('zigguratApproach'),
  zigguratInterior:MapCatalog.build('zigguratInterior'),
  zigguratSummit:MapCatalog.build('zigguratSummit')
 };
}
