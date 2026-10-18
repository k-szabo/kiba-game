# Erdei menedék

Az első változat külön, biztonságos oldalhelyszín: Japán őrzőjének legyőzése után a templomi aréna nyugati részén, a `(8870, 1000)` ponton megjelenő torii vezet a táborba. Az interakció a beállított `interact` műveletet használja. A visszaút ugyanide vezet; a következő halálhoz a japán templomi szentély lesz a mentőpont.

A táborban a szentélynél gyógyulás és fejlesztés, a három túlélőnél beszélgetés érhető el. Daichi, Natsu és Sora külön, statikus, átlátszó sprite-ot kapott. Nem harci szereplők: nincs HP-juk, jutalmuk vagy találati célpontjuk. A beszélgetés a meglévő dialógust nyitja, amely megállítja a játékot. Nem kapcsolódik automatikusan más, későbbi NPC-kártya küldetéseihez.

## Állapot és mentés

- A `forestCamp` önálló `2800 × 1080` pálya, folyamatos talajjal az `y=820` magasságban; nem kerül a `levels` három birodalma közé. A `realm` értéke `0` marad.
- A `realmRests(0)` egyesíti Japán és a tábor szentélyeinek utazási katalógusát. A tábor szentélye nem kerül a japán pálya fizikai `rests` listájába.
- Az első belépés regisztrálja a `visitedRests[0]` listában az egyedi `forestCamp` azonosítót. Addig a gyorsutazási cél rejtett. A saját tábori térkép a helyi geometriát és Momo helyét mutatja; a birodalmak között a meglévő gyorsutazási felület használható.
- A mentés `location` mezője a táborban `forestCamp`, egyébként `null`. Folytatás és halál után Momo a tábori szentélynél jelenik meg. A csarnok eddigi, átmeneti helyszínkezelése nem változik.
- A validátor megköveteli az első boss legyőzését, a befejezett prológust, a felfedezett tábori szentélyt és annak pontos koordinátáit. Ismeretlen helyszín vagy a tábori mentőpont normál japán mentésben nem fogadható el.
- Az utazás a meglévő világállapotokat, képességeket, XP-t, fejlesztéseket és egyszeri bossjutalom-jogcímeket megőrzi. Normál ellenfelek a meglévő gyorsutazási/újraéledési szabályt követik.

## Bővítés

A `forestCamp.npcs` katalógus bejegyzései: `id`, `x`, `y`, `name`, `dialogue`, `image`, `height`. A `name` és `dialogue` lokalizációs kulcs. Később egy NPC `requiresFlag: {realm, id}` feltételt kaphat; ezt a megjelenítés és az interakció ugyanazzal a `campNPCVisible` függvénnyel ellenőrzi. Új NPC-hez külön jóváhagyott szöveg, grafikai koncepció és mentési/küldetésfeltétel szükséges.

A képek az `ART_MANIFEST`, az eredeti méretek és talpillesztések az `ART_CAMP` metaadatában szerepelnek. A háttér egységesen skálázódik; a forrás `groundY=532` pontja illeszkedik a járható talajhoz. A sprite-ok eredeti RGBA-pixelei megmaradnak. A promptok a [grafikai nyilvántartásban](art-prompts/forest-camp-v1.json), a referencia-paletták a `colormaps.json` NPC-bejegyzéseiben találhatók.

## Ellenőrzés

`npm run test:forest-camp` ellenőrzi a belépési és mentési feltételeket, a beállított interakcióbillentyűt, a dialógus alatti megállást, a gyógyítást/fejlesztést, a halált és lezuhanást, az utazást és a jutalmak egyszeriségét. A mozgás, a dash lejárata és a gravitáció 30/60/120 FPS mellett, minden képességkombinációval fut. A `test-save-release.cjs` valódi WebCryptóval, szimulált IndexedDB mellett a tábor titkosított mentését is ellenőrzi. A látvány és a valódi böngészős mentés külön böngészőtesztet igényel.
