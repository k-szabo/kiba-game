# Célzott képletöltés

A GitHub Pages-változat nem tölti le induláskor a teljes képkatalógust. A `graphics.js` `Visuals` betöltője stabil `Image` objektumokat ad a meglévő renderelőknek, és csak a szükséges képeket kéri le. Az `asset-loading.js` kapcsolja ehhez a helyszíntervezőt és a lokalizált betöltési ablakot. Nincs backend vagy service worker.

## Igények és várakozás

- Induláskor a főmenü háttere, terepe és kellékei, valamint a két közvetlen Momo-képlap szükséges. A `Visuals.ready` a menücsomagot jelenti, nem a teljes manifestet.
- A helyszíntervező teljes, explicit helyszíncsomagot kér belépéskor: a pálya és rejtett szektorainak háttereit, NPC-it, lehetséges ellenfeleit, későbbi harci fázisait és helyi jutalmainak képeit is. A csomag nem szűkül a kamera előtt látható szereplőkre. Így például Japán rejtett kígyója és barlangja, Yomi titkos arénája, Hannah viharos fázisa és a sárkány összes póza már a pályaindítási várakozás alatt előkészül.
- A torony a forgó bosskészletet előre kéri; az aktuális ellenféllista vagy a kilépési megerősítés nem dobja el ezt a csomagot. A dungeonök minden emelete saját hátteret és bosst tölt, mindkét harcoló frakcióval és az idézhető katonákkal. A párbaj mindhárom kezdőfegyvert és az összes lehetséges arénahátteret előkészíti a készenlét előtt.
- A betöltési ablak az adott pálya meglévő festményét használja háttérként, változatlan tartalomazonosított URL-lel. Nem készül új háttérgrafika. A dialóguskeret, hátizsák és térkép alapképei, valamint a már birtokolt inventorytárgyak a helyszíncsomaggal együtt érkeznek.
- A renderelés közben olvasott `Visuals.images[key]` továbbra is regisztrál további kötelező igényt biztonsági tartalékként; a normál felfedezés és az előre ismert bossfázisok már a helyszíncsomagra támaszkodnak. A dialógus, inventory és bolt a képletöltés után újrarajzolódik. A képkörnyezet tokenje a helyszínt és fegyvert követi, a panelváltás, ellenfélhalál és idézés nem törli a korábbi kötelező portré- és ikonigényeket.
- A manifest képei legfeljebb négy párhuzamos betöltést/dekódolást használnak. A két közvetlen Momo-képlap külön indul. Helyszínváltáskor a még sorban álló, már nem szükséges munkák kiesnek; a legfeljebb négy folyamatban lévő kérés befejeződhet.
- A kötelező kép hiánya alatt a játék órái, fizikája és harca áll. A betöltési ablak elnyeli a játékinputot, billentyűzettel is kezelhető. Sikertelen kérésnél újrapróbálás vagy visszalépés lehetséges. Egy elhagyott helyszín hibája nem akadályozza az új helyszínt.
- Párbajban a hálózati koordináció tovább fut, és a meglévő szünetjelzés továbbítja a helyi betöltési várakozást. A minimumfelbontás értesítése elsőbbséget kap a betöltési ablak fókuszával szemben.

A `Visuals.peek(key)` csak a már létrehozott objektum azonosságát olvassa, és nem indít letöltést. Ilyet használj katalóguskeresésnél, például a háttéranimáció forrásképének azonosításakor. A `prefetch()` opcionális: jelenleg a legyőzött őrző utáni közeli portál előkészítheti a következő birodalom hátterét. Ennek hibája nem blokkol, a befejezése nem építi újra az aktív menüt. A háttéranimáció kiegészítő képeinek betöltése a kötelező képek után indul.

## Gyorsítótár és build

A build az `assets/images/` fájljaihoz teljes SHA-256 lenyomatot ágyaz a runtime-ba. A változatlan képek URL-je kiadások között azonos marad. A betöltő a hálózati és eltárolt bájtokat is ellenőrzi; régi böngészőlap nem használhat új képet régi sprite-kivágással. A CSS-es dialóguskeret, hátizsák és utazási térkép szintén tartalomazonosított URL-t kap. Részletek: [ASSET-CACHE.md](ASSET-CACHE.md).

Képváltoztatás után ezért is szükséges a build. Az eredeti PNG-k, alfacsatornák, kivágások és harci geometriák változatlanok. A mentéskompatibilitási korszak megmaradt.

## Mérés és korlátok

Valódi Edge-böngészővel, friss profillal, 1280×720-as nézetben, helyi HTTP-kiszolgálón, a `/kiba-game/` útvonalon mért képkérések:

| Főmenü | Képkérések | Letöltött képbájtok |
| --- | ---: | ---: |
| Korábbi, teljes katalógust betöltő runtime | 224 | 530,93 MB |
| Új betöltő, üres gyorsítótár | 11 | 22,33 MB |
| Újratöltés, meleg gyorsítótár | 0 | 0 MB |
| Szimulált kompatibilis kiadás, azonos képek | 0 | 0 MB |

Ez körülbelül 95,8%-kal kevesebb induló képadat. A számok decimális MB-ban értendők, a HTML/JS/CSS/font/audio forgalom nélkül. A helyi, sebességkorlátozás nélküli mérés nem internetes betöltési időígéret. A böngésző HTTP-cache-e és a Cache API egyaránt részt vehet az újrahasználatban.

Az ellenőrzés lefedte a négy fő pálya és mind a 24 regisztrált oldalhelyszín fejlesztői belépését, a hibás képkérés alatti álló játékot és újrapróbálást, a párbaj betöltési szünetjelzését helyi szimulált kapcsolattal, valamint a valódi titkosított kalandmentés megőrzését tesztmód után. Ez nem teljes végigjátszás vagy külső hálózati párbajteszt. A bizonyítékok az ignorált munkamappában maradnak.

A sikeresen betöltött képek egy böngészőmunkameneten belül memóriában maradnak. A változás az induló letöltést és a szükségtelen korai dekódolást csökkenti; hosszú, sok helyszínt bejáró játék memóriahasználatát nem korlátozza külön LRU-ürítéssel. A statikus host új deploy után nem szolgálja ki a már lecserélt képfájl régi bájtjait: ilyen régi lap integritási hibát jelezhet, és oldalfrissítés szükséges.

## Ellenőrzések

- `node scripts/test-asset-loading.cjs`: menücsomag, négyes sor, elhagyott munkák és hibák, kötelező renderigények, portrék scope-váltása, opcionális előtöltés, újrapróbálás, megállított játékmenet és párbajjelzés; az összes regisztrált helyszín csomagja, a rejtett bossok és későbbi fázisok, a változatlanul kis főmenü és a panelváltást túlélő helyszínkörnyezet.
- `node scripts/test-asset-cache.cjs`: tartalomazonosság, integritás, verzióváltás, biztonságos takarítás, cache-hibák és fejlesztői kapcsoló.
- `node scripts/build-game.mjs --check`: a forrás és a képlenyomatok szerinti generált runtime ellenőrzése.
