/* A browser preference, available without starting a developer test run. */
'use strict';
const DevCache=(()=>{
 function init(){DevTools.register({id:'image-cache',labelKey:'dev.cache.disable',descriptionKey:'dev.cache.help',checkbox:true,toggled:()=>AssetCache.disabled,run:values=>AssetCache.setDisabled(values.checked)});}
 return Object.freeze({init});
})();
