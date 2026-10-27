# Képgyorsítótár

A `asset-cache.js` a Cache API-val tárolja a manifest képeit, Momo sprite-ját és a főmenü animációját. A `graphics.js` és a `game.js` ugyanazt a betöltőt használja. A statikus HTML, CSS, JavaScript és a betűk betöltését továbbra is a böngésző kezeli: nincs service worker vagy háttérből futó régi runtime.

## Elnevezés és élettartam

A cache neve `kiba-images:<URL-kódolt projektútvonal>:<teljes kiadásazonosító>`. A projektútvonal elkülöníti az egy origin alatt hostolt Pages-projekteket. A képkérések `v=<teljes kiadásazonosító>` paramétert kapnak, így új kiadásnál a HTTP-cache is elkülöníti a képváltozatokat.

Az első használat törli az adott projekt korábbi cache-eit. Az alapverziót számszerűen, azonos alapverzió kódjait a beágyazott kiadási nyilvántartás sorrendjével hasonlítja össze; a hash betűrendje nem időrend. Más projektek, idegen cache-ek, újabb kiadások és ismeretlen azonosítók megmaradnak. Régi böngészőlap így nem törölheti egy újabb kiadás képgyorsítótárát. A mentés, IndexedDB-profil, nyelv és billentyűkiosztás nem része ennek a tárolónak.

Csak sikeres, olvasható `image/*` válasz kerülhet be, az Image sikeres dekódolása után. A betöltés Blob URL-t használ, amelyet siker és hiba után is felszabadít. Hibás cache-kép törlődik, a betöltő normál képkérésre esik vissza. Elérhetetlen API, privát böngésző, tárolási jogosultsági hiba vagy kvótahiba nem akadályozhatja a játék indulását. A böngésző a cache-t később felszabadíthatja; minden hiány újra letölthető.

## Fejlesztői kikapcsolás

`localStorage.setItem('cacheDisable','true')` kikapcsolja a Cache API olvasását és írását. A rejtett fejlesztői panel checkboxa ugyanezt a böngészőpreferenciát állítja, tesztmód indítása nélkül is. Kikapcsolva az új fetch-kérések `cache: 'no-store'` beállítást használnak. A már memóriába töltött képeket nem cseréli le; teljes ellenőrzéshez újra kell tölteni az oldalt. A kapcsoló nem ürít mentést és nem ír játékhaladást. Tárolási hiba esetén a panel a meglévő hibajelzést használja, a beállítást nem jelzi sikeresnek.

A folyamatban lévő régi betöltés a kikapcsolás után már nem írhat cache-be. Más böngészőlap `storage` eseménye szintén frissíti a preferenciát. A már eltárolt képek kikapcsoláskor megmaradnak; visszakapcsoláskor újra használhatók.

## Ellenőrzés

`npm run test:cache-camera`: cache-találat/hiány, kiadási sorrend, projekt- és jövőbeli cache-ek megőrzése, kvóta/hálózat/dekódolási hibák, letiltási versenyhelyzet, Blob URL-ek felszabadítása, stale dev callback és mentésizoláció. A valódi böngészős hideg/meleg betöltést és CacheStorage-újratöltést külön kell mérni; a VM nem bizonyít gyorsulást.

A kamera javítása a közös világtranszformációból eltávolítja az előtérre korlátozott shake-eltolást. Az összes regisztrált pálya, oldalhelyszín és dungeon ugyanazt a kamerát használja a terephez és a háttérhez. A normál mozgáskövetés, parallax, támadásidőzítés és találati test változatlan.

Forrás: [MDN Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache), [MDN CacheStorage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage). A Cache API ablakból is használható, service worker nélkül; HTTPS és a böngésző tárolási feltételei szükségesek.
