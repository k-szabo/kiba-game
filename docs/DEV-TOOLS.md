# Fejlesztői eszközpanel

A képek Cache API tárolója a panel checkboxával tesztmód nélkül is kikapcsolható. A `cacheDisable` böngészőpreferencia és a kiadásonkénti takarítás részletei: [képgyorsítótár](ASSET-CACHE.md). A már betöltött képek ellenőrzéséhez újratöltés szükséges.

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

Aktív tesztmódban a játék térképéről is minden birodalom kültéri és normál oldalhelyszíni szentélye elérhető, az Erdei menedékkel együtt. Ehhez nem kell korábbi felfedezés, bossgyőzelem vagy az árnyékoltár aktiválása. A dungeon belső pihenői azonban csak ugyanazon dungeon belsejéből érhetők el térképes gyorsutazással; kívülről a fejlesztői teleporttal lehet közvetlenül belépni. Az álomprológus továbbra is csak a fejlesztői teleport külön célpontja; térképes gyorsutazás nincs benne. A teszt befejezésével az összes utazási kivétel megszűnik, a normál mentés és feloldási feltételei megmaradnak.

A fejlesztői kapcsolók a teszt végén törlődnek, nem kerülnek a mentési sémába. Az eszközök belső állapotát nem exportáljuk a `window` objektumra.

A képességválasztót az `assets/js/dev-abilities.js` `catalogue` listája építi fel: egy bejegyzés stabil `id`, a játék `abilities` tömbjére mutató `index`, valamint lokalizációs `label` kulcs. Új, már játékba épített képességhez ezt a listát kell bővíteni; a mező és a megszerzés művelete közös marad. Új képesség játékmenete és mentési sémája külön fejlesztést igényel. A dev művelet nem teljesít küldetést, nem ad XP-t és nem ír normál mentést.

## RCA: dev módban blokkolt gyorsutazás

A [66-os hibajegynél](https://trello.com/c/zd5FSRSR) a dev teleport megkerülte a normál belépési feltételeket, de a térkép külön végrehajtója továbbra is bossgyőzelmet, felfedezett szentélyt és az árnyékoltár jelzőjét kérte. A megjelenített és a ténylegesen használható célpontok ezért eltérhettek. A `game.js` közös `travelDestination` függvénye most a térkép és a végrehajtó egyetlen jogosultsági forrása: a katalógus és a célazonosító mindig ellenőrzött, a normál előfeltételek kizárólag aktív, nem mentődő `DevSession` alatt hagyhatók ki. A dungeon helyszíni korlátját a `travelScope` a dev kivételek előtt érvényesíti. A `test-dev-fast-travel.cjs` tényleges térképgombokkal ellenőrzi a birodalmak közti utazást, a dungeon belső céljainak elkülönítését, a talajra érkezést, a mentés izolációját, a hibás célok elutasítását és a normál zárak visszaállását.

## RCA: hiányzó tábori teleport

Az [51-es hibajegynél](https://trello.com/c/kG5Dtu8Q) a választó a háromelemű `levels` tömbből és egy külön álombejegyzésből épült; a végrehajtó ettől függetlenül, kézzel felsorolt azonosítókat engedett. A tábor nem birodalom, ezért mindkét helyről kimaradt. A tábori belépés normál bossfeltétele a lista egyszerű bővítése után is blokkolta volna a tesztelést.

A `DevTeleport` közös, késleltetve felépített célpontkatalógust használ a mezőkhöz és a végrehajtáshoz. A birodalmak pihenőhelyei és a külön tábori/álomcél ugyanitt szerepelnek. A tábor a meglévő `enterForestCamp` belépést használja; a bossfeltétel csak aktív `DevSession` alatt kerülhető meg. A képességek, legyőzött bossok és normál mentések nem változnak. Az oldalhelyszínek ma a közös `SIDE_LOCATIONS` katalógusból kerülnek ide; új helyszínnél ezt a regisztrációt és a valódi pihenőpontot kell hozzáadni, nem a főbirodalmak tömbjét.

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

### Három birodalom kígyói

Az önálló fehér és szárnyas kígyó a saját birodalom miniboss-választójában indítható újra. A replay nem ad normál guardian-jelzőt, pikkelyt, XP-t vagy érmét; a normál mentést a tesztmód továbbra sem írja. A meglévő lávakígyó Yomi bossának fázisa, ezért a démonharc részeként vizsgálható.

A három pikkely és a `triuneSerpentTalisman` a közös tárgyadóból hozzáadható. A tárgyadás nem adja meg a kígyók legyőzését vagy a Fumi-mentőküldetés teljesítését. A talizmán külön slotban felszerelhető a tesztben, és csak ott viselve ad +20 Armort; az `equippedTalisman` állapot ugyanúgy elkülönül és a normál mentésből visszaáll, mint a fegyver és a tábori tulajdonlista. A már felhasznált pikkely nem hozható vissza a fúzió után.

Célzott regressziók: `test-serpent-template.cjs`, `test-serpent-fusion.cjs`, `test-serpent-saves.cjs`; pálya- és grafikai ellenőrzések a [kígyóreferenciában](SERPENTS.md).

Zen börtöne külön teleportcél a pályakatalógusban, két pihenőhellyel. Aktív tesztmódban a külső kapu vagy a pap legyőzése nélkül is elérhető, és a Kultista börtönnagy önállóan újraéleszthető. A replay megőrzi a normál megmentési/jutalomjelzőket; a próba nem ír mentést.

## Kitsune és alsó börtön

A teleportkatalógus a börtön `shadowPrisonDepths` pihenőjét és a külön `shadowDen` tábort is tartalmazza. A tesztmód megkerülheti a normál kapu- és papfeltételeket; a bosslistában a `prisonHunter` külön újraindítható. Visszahívása nem ad újabb XP-t, érmét vagy megmentési előfeltételt. A Fia-cellát már elért tesztkarakter börtönből teleportálása csak az elkülönített állapotban jelöli a kihagyást; a normál mentés megmarad.

## Árnyékzug arénája – spoileres fejlesztői rész

Az `Árnyékzug arénája` (`shadowArena`) és `Fia lakosztálya` (`fiaChambers`) külön teleportcél, saját `shadowArenaEntrance`, illetve `fiaChambersRest` pihenővel. A tesztmód normál küldetés- vagy bajnoki jelzők nélkül is beléphet. A teleport nem teljesíti az arénát és nem ad normál jutalmat. Az aréna előteréből az interakcióval az egész ötmenetes próba indítható, 45 másodperces első menettel; vereség után itt is az első menettől kezdődik újra.

Az arénában a bossválasztó a `level.arenaEncounters` listát használja: `arenaCaptain`, `arenaSerpent`, `arenaCyclops` és `arenaFia` külön újraindítható. A két küklopsz egy találkozásként, közös HP-val indul. A Fia-replay ugyanúgy 90 másodpercig immunis, majd ereszkedés után sebezhető; a győzelmi küldetést nem adja meg. Az egyedi replayek `replay=true` jelölése tiltja az XP-, pikkely- és küldetésjutalmat, és nem kezd önálló arénapróbát. Újraindítás előtt a korábbi átmeneti arénaharci állapot törlődik.

A megkínzott kígyó pikkelyének azonosítója `arenaSerpentScale`. Az `ART_INVENTORY.items` regisztrációjából kerül a közös tárgyadóba; tesztbeli hozzáadása nem teljesíti a kígyó menetét, és nem ír normál mentést. Nem keverendő a három világ kígyópikkelyéből készülő, felszerelhető talizmánnal.

A teljes kihívás tesztmódban adhat átmeneti jutalomjelzőket és megnyithatja a lakosztályt, de a `persist()` a DevSession alatt nem írja felül a normál mentést. A teszt befejezése eldobja ezeket. Célzott ellenőrzés: `node scripts/test-arena-combat.cjs` és `node scripts/test-arena-challenge.cjs`; a natív grafika és az IndexedDB tényleges viselkedése külön böngészős QA-t igényel. Részletes működés és spoilerkezelés: [SHADOW-DEN-ARENA.md](SHADOW-DEN-ARENA.md).

## Yomi emlékdungeonja – spoileres fejlesztői rész

A `yomiDungeon1`, `yomiDungeon2` és `yomiDungeon3` a közös `SIDE_LOCATIONS` katalógusból külön teleportcélként jelenik meg. Mindegyik egy saját, boss előtti szentélyre érkezik (`yomiDungeon1Shrine`, `yomiDungeon2Shrine`, `yomiDungeon3Shrine`). A dev teleport a normál kapu-, run- és előzőszint-feltételeket megkerülheti, de nem teljesíti azokat és nem ad képességet. A rejtett belépési checkpointok nem további választóelemek.

Az aktuális szint egyedi bossa a Boss újraélesztése listájából újraindítható: `dungeonCaptain`, `dungeonNecromancer` vagy `dungeonCouncil`. A replay megőrzi a run- és jutalomjelzőket; nem nyit következő szintet, nem ad XP-t, érmét, fejlesztéspontot vagy lelket. A teljes dungeon normál játékmeneti indítása tesztmódban viszont fejlesztheti a tesztkarakter állapotát; ez továbbra sem normál mentés. A tanácsosi csarnokban magában nincs feléleszthető boss.

A `dungeonSeal`, `weaponEnhancement`, `armorEnhancement` és `spiritEnhancement` a tárgykatalógus halmozható elemei; az egyedi `councilSoul` is hozzáadható teszteléshez. A tárgyadás nem teljesít bossfázist, nem állít jutalomjogcímet, és nem ad extra statpontot. A megerősítések felhasználása a normál inventory műveletét követi: típusonként legfeljebb öt fokozat, a szellemmegerősítéshez előbb dash kell. Az inventoryból vagy Akash eladási folyamatán keresztül a készlet és az árak ugyanúgy ellenőrizhetők, mint a többi tárgynál.

A `dungeonState` készlete, fokozatai, runazonosítója és előre kisorsolt ládajutalma a DevSession másolatának része. Új teszt vagy kilépés után a normál állapot helyreáll; a `persist()` a tesztben nem ír SaveVault-rekordot. A láda újranyitása nem sorsolhat új jutalmat; az explicit új emlékút tesztelése a csarnok tekercsénél kezdhető.

Célzott ellenőrzések: `test-dungeon-rules.cjs`, `test-dungeon-run.cjs`, `test-dungeon-combat.cjs`, `test-dungeon-routes.cjs`, `test-dungeon-items.cjs`, `test-dungeon-factions.cjs`. Ezek nem helyettesítik a valódi böngészős grafikai és mentési ellenőrzést. A teljes run-, checkpoint-, frakció- és jutalomszabályokat a [DUNGEONS.md](DUNGEONS.md) rögzíti.

## A Szekta Bukása – spoileres fejlesztői rész

A `cultDungeon1`, `cultDungeon2`, `cultDungeon3` külön teleportcélok, saját boss előtti oltárral. Az újraélesztő az adott szint `cultTempleGuard`, `woundedAngel`, illetve `cultHighPriestess` bossát használja; a replay nem oszt jutalmat vagy haladást. A `highPriestessSoul` és a halmozható `sectSeal` az inventoryba adható. A két dungeon runja különálló, készletük és ötös enhancement-korlátjuk közös. Tesztmódban a normál mentés változatlan marad. Célzott ellenőrzés: `node --run test:cult-dungeon`.

## Fia új megbízása és titkos harca – spoileres fejlesztői rész

Az Árnyékzugban és Fia lakosztályában a boss-választó külön `fiaVengeance` replayt kínál. Ez nem írja a halál-, aréna- vagy küldetésjelzőket, és nem ad jutalmat. A `priestessTalisman`, `roastChicken` és `kitsuneSoul` a tárgyadóban elérhető; a Kiba-pajzs a képességadóban külön passzív elem, nem változtatja a dupla ugrás/dash indexeit. A dev-kísérlet megszakítása és vége megőrzi a normál mentést. Részletek és validálás: [FIA-JOURNEY.md](FIA-JOURNEY.md).
