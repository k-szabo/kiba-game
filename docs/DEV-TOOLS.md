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
| Teleportálás | Bármelyik birodalom valódi pihenőhelyét választhatod, feloldottságtól függetlenül. Az Erdei menedék külön célpont, a tábor szentélyére érkezik; aktív tesztmódban az első boss legyőzése sem szükséges. A célpontokat a pályaadatokból olvassa; csak alátámasztott érkezést fogad el. Az álomprológus külön tesztcélpont. Nem ad automatikusan képességet és nem jelöl legyőzöttnek őrzőt. |
| Játékos szintje | Egész szint 1 és a közös `LEVEL_LIMIT` között, jelenleg 30-ig. Az XP az adott szint kezdetére áll. A megfizethető statelosztás megmarad; a normalizáló a csökkentett kerethez igazítja, a maradék szabad pont. A mező és a mentésvalidátor is a közös fejlődési szabályokat követi. |
| Tárgy hozzáadása | Az `ART_INVENTORY.items` katalógus összes regisztrált tárgyát listázza, a meglévő nevekkel. Már birtokolt vagy felhasznált tárgy nem duplikálható. A felszerelt alapfegyver nem külön hátizsáktárgy. |
| Képesség megszerzése | A szél áldása (dupla ugrás) vagy a szellemlépés kiválasztható és a tesztkarakternek adható. A HUD azonnal frissül, a dash fejlesztése elérhetővé válik a szentélynél. Már megszerzett képesség nem duplikálható. |
| Halhatatlanság | Ki/be kapcsolható védelem a normál harcban, a halálos lávában és az álomban is. Lezuhanásnál biztonságos pontra kerül Momo. Külön jelzés látható a próba közben; a teszt végén kikapcsol. A normál játék halál- és lezuhanásszabályai változatlanok. |
| Sebzésszámok | Alapból kikapcsolt harci mérőeszköz; a tényleges HP-veszteséget mutatja. Blokkolás és sérthetetlenség nem kap fiktív találatot, az overkill és a boss-fázishatárok korlátozzák az értéket. Szünetben az effektek is megállnak; csökkentett mozgásnál helyben jelennek meg. |

A tesztmódban hozzáadott csontkulcs a boss legyőzése nélkül is nyitja a tanácsosi kaput, és használatkor elfogy. Az így megnyitott kapu újra használható. Ez csak a memóriában futó tesztre érvényes; normál játékban a boss- és kulcsszabályok változatlanok.

Aktív tesztmódban a játék térképéről is minden birodalom minden szentélye elérhető, az Erdei menedékkel együtt. Ehhez nem kell korábbi felfedezés, bossgyőzelem vagy az árnyékoltár aktiválása. Az álomprológus továbbra is csak a fejlesztői teleport külön célpontja; térképes gyorsutazás nincs benne. A teszt befejezésével az összes utazási kivétel megszűnik, a normál mentés és feloldási feltételei megmaradnak.

A fejlesztői kapcsolók a teszt végén törlődnek, nem kerülnek a mentési sémába. Az eszközök belső állapotát nem exportáljuk a `window` objektumra.

A képességválasztót az `assets/js/dev-abilities.js` `catalogue` listája építi fel: egy bejegyzés stabil `id`, a játék `abilities` tömbjére mutató `index`, valamint lokalizációs `label` kulcs. Új, már játékba épített képességhez ezt a listát kell bővíteni; a mező és a megszerzés művelete közös marad. Új képesség játékmenete és mentési sémája külön fejlesztést igényel. A dev művelet nem teljesít küldetést, nem ad XP-t és nem ír normál mentést.

## RCA: dev módban blokkolt gyorsutazás

A [66-os hibajegynél](https://trello.com/c/zd5FSRSR) a dev teleport megkerülte a normál belépési feltételeket, de a térkép külön végrehajtója továbbra is bossgyőzelmet, felfedezett szentélyt és az árnyékoltár jelzőjét kérte. A megjelenített és a ténylegesen használható célpontok ezért eltérhettek. A `game.js` közös `travelDestination` függvénye most a térkép és a végrehajtó egyetlen jogosultsági forrása: a katalógus és a célazonosító mindig ellenőrzött, a normál előfeltételek kizárólag aktív, nem mentődő `DevSession` alatt hagyhatók ki. A `test-dev-fast-travel.cjs` az összes szentélyt tényleges térképgombbal járja be minden birodalomból, ellenőrzi a talajra érkezést, a mentés izolációját, a hibás célok elutasítását és a normál zárak visszaállását.

## RCA: hiányzó tábori teleport

Az [51-es hibajegynél](https://trello.com/c/kG5Dtu8Q) a választó a háromelemű `levels` tömbből és egy külön álombejegyzésből épült; a végrehajtó ettől függetlenül, kézzel felsorolt azonosítókat engedett. A tábor nem birodalom, ezért mindkét helyről kimaradt. A tábori belépés normál bossfeltétele a lista egyszerű bővítése után is blokkolta volna a tesztelést.

A `DevTeleport` közös, késleltetve felépített célpontkatalógust használ a mezőkhöz és a végrehajtáshoz. A birodalmak pihenőhelyei és a külön tábori/álomcél ugyanitt szerepelnek. A tábor a meglévő `enterForestCamp` belépést használja; a bossfeltétel csak aktív `DevSession` alatt kerülhető meg. A képességek, legyőzött bossok és normál mentések nem változnak. Új oldalhelyszín dev támogatásához ezt a katalógust kell bővíteni, nem a három birodalom tömbjét.

A `test-dev-teleport.cjs` a ténylegesen felépített select opcióit és változáskezelőit is ellenőrzi: minden listázott cél összes érkezési pontjának működnie kell. Külön lefedi a táborba érkezést az álomból és későbbi birodalmakból, a hibás pont elutasítását állapotváltozás nélkül, a normál feloldás és a mentés izolációját. A `test-player-timers.cjs` a dev képességadás → tábori teleport → tényleges input útvonalat is vizsgálja 30/60/120 FPS, mindkét irány és minden képességkombináció mellett.

## RCA: beragadó dash a prológusban

A [46-os hibajegy](https://trello.com/c/jcC3vvm4) reprodukciója: tesztmód, dupla ugrás és dash megszerzése, teleport az álomba, dash, billentyűfelengedés, majd ugrás. Az eredeti kódban egy másodperc után is `dash=0.2`, `dashCooldown=0.8` és `vx=1100` maradt. Ugrás után a `vy=-590` sem változott.

A közös `input()` és `movePlayer()` a dash állapotát használta, de a külső `update()` a prológushoz érve a közös időzítők előtt visszatért. A prológus saját másolatában a dash és a dash-cooldown csökkentése hiányzott. Az állandóan aktív dash ezért folyamatosan előírta a vízszintes sebességet és kikapcsolva tartotta a gravitációt. A teleport az átmeneti állapotokat helyesen nullázta; a hiba az első új dash után keletkezett. A normál prológus képességek nélkül indul, ezért ez az állapot a képességadó eszközzel vált könnyen elérhetővé.

A játékos közös időzítőinek egyetlen gazdája a `game.js` `updatePlayerTimers(dt)` függvénye: minden aktív játékképkockán, a normál/prológus elágazás előtt egyszer fut. A prológus csak a saját boss- és történetidőzítőit kezeli. Szünetben és játékablakoknál a közös óra is áll; az `initPlayer()` átmenetkor törli a mozgás átmeneti állapotát.

A korábbi tesztek külön ellenőrizték a képességadást és a teleport célpontját, de a megszerzett képesség használatát nem az alternatív játékhurokban. A CI emellett külön, elavult tesztlistát tartott fenn. A `scripts/test-player-timers.cjs` most a képességadás → teleport → tényleges gombnyomás útvonalat vizsgálja mindkét irányban, képességkombinációkkal és 30/60/120 FPS-en: lejárat, megállás, gravitáció, talajra érkezés, újrahasználat, szünet és pályaváltás. Az eredeti forrásokat memóriában visszatöltve a teszt hibát jelez; a javított kódon sikeres. A Pages CI most ugyanazt az `npm test` parancsot futtatja, mint a helyi teljes ellenőrzés, így a később hozzáadott tesztek sem maradnak ki egy második lista miatt.

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

### Akash portékái

Az iránytű és útitérkép az inventory katalógusából adható egyszeri teszttárgy. A sült hús és Akash teája ugyaninnen ismételten hozzáadható, kattintásonként egy adaggal, egymástól független készletbe; az aktuális gyorsbillentyűvel vagy az inventoryból használható. A pénz, a vásárlások és az étel mennyisége is az elkülönített dev session része; a normál mentést nem módosítják.

Az érmeadó mezőben pozitív egész mennyiség adható meg (alapérték:100). Az eszköz kizárólag aktív tesztmódban és nyitott dev panelen működik; az érméket a HUD azonnal mutatja. Hibás vagy túlcsorduló mennyiség teljesen elutasított, részleges jóváírás nincs. A normál mentést nem írja. A tárgyválasztó hozzáadás és panel-frissítés után megőrzi a kiválasztást, ezért több adag sült hús vagy tea ismételten hozzáadható. Az iránytű és a kis útitérkép egyszeri tárgy marad.

Ha a panelt nyitott inventoryból vagy boltból nyitod, a visszatérés újrarajzolja az adott ablakot: a hozzáadott étel darabszáma, az új érmeegyenleg és a megfizethető vásárlógombok rögtön frissülnek.

### Árnyékvilág

A negyedik birodalom minden pihenőhelye a közös teleportkatalógus része; a normál történeti belépést és az oltár utazási zárját a dev teleport nem kéri. A Boss újraélesztése eszköz találkozásválasztójából a főboss és az aktuális pálya minibossai külön indíthatók. A miniboss újraindítása a tartós győzelmi és jutalomjelzőket megőrzi; ismételt jutalom nincs. A pap lelke, a kotta és a börtönkulcs a közös tárgykatalóguson keresztül adható. A tesztmód továbbra sem ír normál mentést.

A tárgyadó a telefontokot is tartalmazza. Egy eladott, egyedi tárgy ismételt hozzáadása a tesztmódban törli az eladásjelzőt, a megszerzési jelzőt nem duplikálja; már felhasznált kulcsok továbbra sem támadnak fel. A `soldItems` a többi inventory-állapottal együtt elszigetelt a normál mentéstől.

## Fegyvercsere tesztmódban

A Fegyver mező az aktív fegyverkatalógust használja, jelenleg katana, naginata és kard–pajzs opcióval. A felszerelési gomb csak aktív tesztmódban használható; a változtatás nem írja a normál mentést. Az eszköz a `WeaponEquipment.equip(id)` útvonalat hívja, nem saját statmásolatot tart fenn. A nagyobb maximális HP nem gyógyít automatikusan; a kisebb maximum levágja a fölös HP-t. A csere megszakítja a folyamatban lévő támadást, de nem nullázza a támadás és a pajzs újratöltését. Új profil a közös `WeaponStyles` katalógus bővítésével megjelenik a listában. A normál történet katanás prológusát ez nem írja át; tesztmódban az álompályán is ellenőrizhetők a fegyverek.
## Tábori helyszínek és szolgáltatások

A `SIDE_LOCATIONS` katalógusból a teleportlistába az Erdei menedék mellett a Szamurájtábor, Kovácsműhely, Erdei kunyhó és Misztikus sátor is bekerül, minden saját pihenőjével. A tesztmód a mentési/feloldási feltételeket megkerüli, de a geometriai alátámasztást ellenőrzi. A normál játékban továbbra is a küldetés és a megfelelő NPC megmentése oldja fel ezeket.

A Tábormester újraélesztése kizárólag a Szamurájtáborban érhető el. A replay nem játszik valódi polgármester-jelenetet, nem teljesíti a küldetést, és nem ad újabb XP-t/érmét/jelzőt. A biztonságos belső terekben nincs feléleszthető főboss-helykitöltő. A szolgáltatásablak fölött megnyitott dev-panel visszaállítja a korábbi ablakot és fókuszt; teleport/tesztváltás eldobja a régi tranzakciókezelőket.

A tesztindítás a `campServices` objektumot és a birtokolt fegyverek listáját is mélyen másolja. A tesztmódban vett fejlesztés, készített főzet, gyűjtött növény és dev-fegyvercsere nem ír normál mentést. Dev-felszereléskor a fegyver memóriabeli tulajdonjoga is megjelenik, hogy a kovács szabályai a tesztben is érvényes állapotot kapjanak. Tesztbefejezéskor a normál állapot helyreáll. A gyógynövény és a főzet a tárgykatalógusból halmozható készletként hozzáadható, Akash kínálatának módosítása nélkül.

Célzott regressziók: `test-camp-dev.cjs`, `test-camp-consumables.cjs`, `test-camp-integration.cjs`.
