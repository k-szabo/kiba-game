# Fejlesztői eszközpanel

A panel jelszó és külön konfiguráció nélkül elérhető, helyi futtatásban és GitHub Pagesen is. A külön eszközök elkülönített tesztmódban használhatók.

## Megnyitás és bezárás

A játék címéhez add hozzá a `#devtools` fragmentet:

- Helyben: `http://localhost:8000/#devtools`
- GitHub Pagesen, a verzió publikálása után: `https://k-szabo.github.io/kiba-game/#devtools`

A panel azonnal megnyílik, nincs belépés vagy jelszóbeállító script. Főmenüből, aktív játékból és minden játékablakból nyitható, beleértve az inventoryt, térképet, fejlesztést, súgót és párbeszédet. Az URL-fragment megváltoztatásával futás közben is megnyitható.

A panel megállítja a játékot, ideiglenesen elrejti a korábbi ablakokat és törli a lenyomva maradt játékbillentyűket. A Bezárás gomb vagy az Escape művelet nélkül visszaállítja az előző ablakokat, állapotot és fókuszt; az URL-ből eltűnik a fragment. Szünetmenüből nyitva bezárás után is szünet marad. Tesztindítás, teleport vagy boss-újraélesztés után a régi ablakok helyett közvetlenül a játék folytatódik. A Tab és Shift+Tab a panel kezelőszervei között mozog. A feliratok követik a játék HU/EN nyelvét.

A megnyitását csak fejlesztői dokumentációban ismertetjük: a README, a játékmeneti útmutató, a játék súgója és a játékosoknak szóló változásnapló nem hirdeti.

## Elkülönített tesztmód

A **Tesztmód indítása** külön, csak memóriában futó próbát kezd. A főmenüből Japán első pihenőhelyén indít, a meglévő mentés haladásának másolatával, vagy mentés hiányában új karakterrel. Aktív játékból a pillanatnyi helyzetet tartja meg; az álomprológusból biztonságosan Japánba lép.

A teszt alatt a közös `persist()` nem módosítja sem a normál folytatáshoz használt adatot, sem a SaveVault rekordját. A panel bezárása után a próba játszható; a látható tesztjelzés megmarad. A **Teszt befejezése**, illetve a főmenübe visszatérés eldobja a tesztet. A normál mentés a Folytatással ismét használható. A lap újratöltése is eldobja a memóriában futó tesztet. A puszta panelnyitás továbbra sem kezd tesztet és nem ír mentést.

## Eszközök

| Eszköz | Működés |
| --- | --- |
| Boss újraélesztése | Az aktuális birodalom őrzőjének harcát tiszta állapotban újraindítja, teljes HP-val, az aréna megközelítési oldalára helyezett Momóval. A láva, veszélyek, idézések, küszöbök, boss-lövedékek és fázisok törlődnek. Az álom őrzőjének tesztje újrakezdi az álmot; az üres tanácsosi csarnokban nincs boss. |
| Teleportálás | Bármelyik birodalom valódi pihenőhelyét választhatod, feloldottságtól függetlenül. A célpontokat a pályaadatokból olvassa; csak alátámasztott érkezést fogad el. Az álomprológus külön tesztcélpont. Nem ad automatikusan képességet és nem jelöl legyőzöttnek őrzőt. |
| Játékos szintje | Egész szint 1 és a kódbeli `LEVEL_LIMIT` között, jelenleg 12-ig. Az XP az adott szint kezdetére áll. A megfizethető statelosztás megmarad; a normalizáló a csökkentett kerethez igazítja, a maradék szabad pont. A 30-as limit külön fejlesztési kártya. |
| Tárgy hozzáadása | Az `ART_INVENTORY.items` katalógus összes regisztrált tárgyát listázza, a meglévő nevekkel. Már birtokolt vagy felhasznált tárgy nem duplikálható. A felszerelt alapfegyver nem külön hátizsáktárgy. |
| Képesség megszerzése | A szél áldása (dupla ugrás) vagy a szellemlépés kiválasztható és a tesztkarakternek adható. A HUD azonnal frissül, a dash fejlesztése elérhetővé válik a szentélynél. Már megszerzett képesség nem duplikálható. |
| Halhatatlanság | Ki/be kapcsolható védelem a normál harcban, a halálos lávában és az álomban is. Lezuhanásnál biztonságos pontra kerül Momo. Külön jelzés látható a próba közben; a teszt végén kikapcsol. A normál játék halál- és lezuhanásszabályai változatlanok. |
| Sebzésszámok | Alapból kikapcsolt harci mérőeszköz; a tényleges HP-veszteséget mutatja. Blokkolás és sérthetetlenség nem kap fiktív találatot, az overkill és a boss-fázishatárok korlátozzák az értéket. Szünetben az effektek is megállnak; csökkentett mozgásnál helyben jelennek meg. |

A tesztmódban hozzáadott csontkulcs a boss legyőzése nélkül is nyitja a tanácsosi kaput, és használatkor elfogy. Az így megnyitott kapu újra használható. Ez csak a memóriában futó tesztre érvényes; normál játékban a boss- és kulcsszabályok változatlanok.

A fejlesztői kapcsolók a teszt végén törlődnek, nem kerülnek a mentési sémába. Az eszközök belső állapotát nem exportáljuk a `window` objektumra.

A képességválasztót az `assets/js/dev-abilities.js` `catalogue` listája építi fel: egy bejegyzés stabil `id`, a játék `abilities` tömbjére mutató `index`, valamint lokalizációs `label` kulcs. Új, már játékba épített képességhez ezt a listát kell bővíteni; a mező és a megszerzés művelete közös marad. Új képesség játékmenete és mentési sémája külön fejlesztést igényel. A dev művelet nem teljesít küldetést, nem ad XP-t és nem ír normál mentést.

## Git ágak

A közös integrációs ág `FEATURE-dev-tools-works`. Az alapozó `FEATURE-dev-tools-test-session` és a hat kártyához tartozó `FEATURE-dev-*` ág innen indul; a helyi integráció `--no-ff` merge-dzsel megőrzi a kártyák határait. A kész csomag később egyetlen PR-ként kerülhet mainre. Push, PR-nyitás és main-merge külön felhasználói engedély alapján történik.

## Új eszköz hozzáadása

A zárt runtime modulon belül regisztrálj műveletet:

```js
DevTools.register({
  id: 'example-tool',
  labelKey: 'dev.example',
  run: () => { /* Az adott kártya szinkron művelete. */ },
  available: () => true
});
```

Az `available` feltétel opcionális; a felirat mindkét nyelven az `assets/i18n/locales.json` fájlba kerül. A művelet csak nyitott panelen, fejlesztői játékállapotban és teljesülő elérhetőségi feltétellel indul. Bezárt vagy korábbi panelnyitáshoz tartozó gomb callbackje nem futtat műveletet. A regisztráció és a játékállapot nem kap közvetlen `window`-exportot.

A panel használata szabad, nem jogosultságkezelés. A játékállapotot módosító eszközök csak aktív `DevSession` alatt legyenek elérhetők. A `fields()` opcionális mezőleírásai számbemenetet vagy listát adhatnak a gomb mellé; az értékeket a `run(values)` kapja. A `toggled()` kapcsolóállapotot és `aria-pressed` visszajelzést biztosít. A mezők és műveletek callbackjei is csak az aktuális panelnyitásban és renderben futnak.

## Ellenőrzés

Forrásmódosítás után `node scripts/build-game.mjs`, majd a releváns `scripts/test-dev-*.cjs` és a `node scripts/check-site.mjs` futtatandó. A panelteszt a közvetlen megnyitást, az elérhetőségi feltételeket, az elavult callbackek elutasítását, a fókuszt és a szünetet vizsgálja. A session- és eszköztesztek a mentésizolációt, a valódi játékmeneti írási útvonalakat és az eszközök szélértékeit fedik le. A teljes integrációhoz az összes `package.json` teszt kell; a HU/EN megjelenést, billentyűzetet és valódi mentés-visszatöltést böngészőben is ellenőrizd.
