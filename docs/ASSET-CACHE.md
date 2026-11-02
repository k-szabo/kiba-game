# Képgyorsítótár

A `asset-cache.js` a Cache API-val tárolja a manifest képeit, Momo sprite-ját és a főmenü animációját. A `graphics.js` és a `game.js` ugyanazt a betöltőt használja. A statikus HTML, CSS, JavaScript és a betűk betöltését továbbra is a böngésző kezeli: nincs service worker vagy háttérből futó régi runtime. A betöltő önmagában nem kér le képeket; a hívó szabályozza, hogy mikor melyik kép szükséges.

## Elnevezés és élettartam

A kiadások között közös cache neve `kiba-images:<URL-kódolt projektútvonal>:content-v1`. A projektútvonal elkülöníti az egy origin alatt hostolt Pages-projekteket. A build által beágyazott `IMAGE_REVISIONS` a relatív képútvonalhoz a kép SHA-256 lenyomatát rendeli. A képkérés `v=<képtartalom lenyomata>` paramétert kap: változatlan kép új kiadásban is ugyanazt az URL-t és választ használja, megváltozott kép új kulcsot kap. A HTTP-fetch tartalomcímzett képnél `force-cache`, fejlesztői kikapcsolás mellett `no-store` módot használ.

Az első használat a közös cache-ből csak a jelenlegi képlenyomatokhoz már nem tartozó, bizonyíthatóan korábbi kiadásból származó válaszokat törli. A sikeresen dekódolt válasz `X-Kiba-Cache-Release` fejlécben kapja meg a betöltő kiadásazonosítóját. Az alapverziót számszerűen, azonos alapverzió kódjait a beágyazott kiadási nyilvántartás sorrendjével hasonlítja össze; a hash betűrendje nem időrend. A már nem használt képek régi változatai is eltávolíthatók. Más projektek, külső URL-ek, idegen cache-ek, újabb kiadások és ismeretlen azonosítók megmaradnak. Régi böngészőlap így nem törölheti egy újabb kiadás képgyorsítótárát. A mentés, IndexedDB-profil, nyelv és billentyűkiosztás nem része ennek a tárolónak.

Az átállás eltávolítja a bizonyíthatóan korábbi, kiadásonként elnevezett projektcache-eket is. Ha nincs beágyazott tartalomjegyzék, vagy egy kép nem szerepel benne, a korábbi `kiba-images:<projektútvonal>:<kiadás>` és `v=<kiadás>` eljárás működik tovább; ez a VM-tesztkörnyezetekkel és a nem katalogizált képekkel is kompatibilis.

Csak sikeres, olvasható `image/*` válasz kerülhet be, az Image sikeres dekódolása után. A tartalomcímzett válasz bájtjainak SHA-256 lenyomatát a betöltő WebCrypto-val is ellenőrzi, meleg cache-olvasásnál is. Ez azért szükséges, mert a statikus host új deploy után egy régi böngészőlap régi hash-es kérésére már új bájtokat adhat. Eltérő lenyomatú kép nem renderelődik régi sprite-kivágással és nem kerül rossz kulcs alá a cache-be: a kérés sikertelen lesz, hibás tárolt válasz törlődik, majd a hívó újrapróbálhatja. A tartalomcímzett kép ismert integritási, hálózati vagy dekódolási hibája nem esik vissza ellenőrizetlen natív képkérésre. A verziócímzett kompatibilitási ág megtartja a korábbi natív fallbacket.

A betöltés Blob URL-t használ, amelyet siker és hiba után is felszabadít. Elérhetetlen Cache API, privát böngésző, tárolási jogosultsági hiba vagy kvótahiba mellett a letöltött, ellenőrzött kép továbbra is használható. A tartalomcímzett ellenőrzés WebCrypto-t igényel; a GitHub Pages HTTPS és a helyi localhost környezet ezt biztosítja. A böngésző a cache-t később felszabadíthatja; minden hiány újra letölthető.

## Fejlesztői kikapcsolás

`localStorage.setItem('cacheDisable','true')` kikapcsolja a Cache API olvasását és írását. A rejtett fejlesztői panel checkboxa ugyanezt a böngészőpreferenciát állítja, tesztmód indítása nélkül is. Kikapcsolva az új fetch-kérések `cache: 'no-store'` beállítást használnak. A már memóriába töltött képeket nem cseréli le; teljes ellenőrzéshez újra kell tölteni az oldalt. A kapcsoló nem ürít mentést és nem ír játékhaladást. Tárolási hiba esetén a panel a meglévő hibajelzést használja, a beállítást nem jelzi sikeresnek.

A folyamatban lévő régi betöltés a kikapcsolás után már nem írhat cache-be. Más böngészőlap `storage` eseménye szintén frissíti a preferenciát. A már eltárolt képek kikapcsoláskor megmaradnak; visszakapcsoláskor újra használhatók.

## Ellenőrzés

`node scripts/test-asset-cache.cjs`: kiadások közötti változatlan tartalom újrahasználata, megváltozott bájtok új kulcsa, integritási hiba és újrapróbálás, ismert elavult hash-ek törlése, jövőbeli és más projekthez tartozó bejegyzések megőrzése, opcionális cache-hibák, korábbi verziócímzett működés, letiltási versenyhelyzet, Blob URL-ek felszabadítása, stale dev callback és mentésizoláció. A valódi böngészős hideg/meleg betöltést és CacheStorage-újratöltést külön kell mérni; a VM nem bizonyít gyorsulást.

A kamera javítása a közös világtranszformációból eltávolítja az előtérre korlátozott shake-eltolást. Az összes regisztrált pálya, oldalhelyszín és dungeon ugyanazt a kamerát használja a terephez és a háttérhez. A normál mozgáskövetés, parallax, támadásidőzítés és találati test változatlan.

Forrás: [MDN Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache), [MDN CacheStorage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage). A Cache API ablakból is használható, service worker nélkül; HTTPS és a böngésző tárolási feltételei szükségesek.
