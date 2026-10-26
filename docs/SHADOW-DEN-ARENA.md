# Árnyékzug arénája – fejlesztői referencia

Ez technikai, **spoileres dokumentum**: a bajnok kilétét és Haru új nyomát is ismerteti. A játék küldetésismertetője, publikus változásnaplója és játékosútmutatója az utolsó ellenfelet csak jelenlegi bajnokként nevezi meg.

Kapcsolódó kártyák: [aréna](https://trello.com/c/BSvqa7Kr), [visszatérő boss](https://trello.com/c/1UyT7ovy), [Zen stílusjavítása](https://trello.com/c/GUeJPZ1K). A megmentési előzmény a [Kitsune-referenciában](KITSUNE.md) található.

## Belépés és helyszínek

Fia megmentése és az Őrült pap legyőzése után az Árnyékzugban Fia beszélgetése adja az `arenaQuestAccepted` jelzőt. A küldetésjelölő addig `!`; a felvétel nem jelenti a kihívás teljesítését. Ha Fia megmentése végleg kimaradt, normál játékban az arénaküldetés sem indul el.

A `shadowArena` 2900 × 2100 egységes külön oldalhelyszín, 1700-as talajszinttel. Az előtér pihenője `shadowArenaEntrance`; a kihívás indítópontja a harctértől nyugatra áll. Az aréna az Árnyékzug nyugati bejáratára vezet vissza. A `fiaChambers` külön, 1600 × 1080 egységes helyiség, 820-as talajszinttel és `fiaChambersRest` pihenővel; az Árnyékzug keleti bejáratához tér vissza. Mindkettő a `SIDE_LOCATIONS` katalógusban, az Árnyékvilág (`realm=3`) alatt szerepel, nem új főbirodalom.

Normál feloldás:

| Helyszín | Feltétel |
| --- | --- |
| `shadowArena` | Az Őrült pap legyőzése, `fiaRescued`, `arenaQuestAccepted`. |
| `fiaChambers` | Az Őrült pap legyőzése, `fiaRescued`, `arenaChampion`. |

A menetek között az interakcióművelet indítja a következő harcot. A kihívás közben a játékos az aréna határain belül marad; a visszaút nem szakítja félbe a harcot. Új próba teljes életerővel indul, a menetek közötti továbblépés nem gyógyít automatikusan.

## Öt menet és jutalmak

| Menet | Találkozás | Lezárás | Egyszeri jutalom |
| --- | --- | --- | --- |
| 1 | Folyamatosan érkező arénatolvajok és arénaőrök. | 45 másodperc túlélése. | Nincs XP vagy érme a hullám ellenfeleiért. |
| 2 | Fogoly kultista kapitány, 180 HP. | A kapitány legyőzése. | 350 XP. |
| 3 | Megkínzott kétfejű kígyó, 220 HP. | A kígyó legyőzése. | 450 XP és `arenaSerpentScale`. |
| 4 | Két páncélozott küklopsz, közös 300 HP-val. | A közös életerő elfogy. | 600 XP. |
| 5 | A jelenlegi bajnok: Fia. | 90 másodperc immunitás után, földet érve 5 másodperc a befejező találatra. | Nincs XP; `arenaChampion` és meghívás a lakosztályba. |

A túlélőhullámoknál egyszerre legfeljebb négy élő vagy előkészített ellenfél lehet. Az új ellenfelek 0,85 másodperces portáljelzés után jelennek meg. Az idézett minionok `arenaMinion` és `noReward` jelölést kapnak; a teljes arénában követik Momót, és nem teszik farmolhatóvá a kihívást.

A két küklopsz egyetlen jutalom- és HP-egység, két valódi, egymástól elválasztott találati testtel. Saját pozíciójuk, nézésirányuk, támadási órájuk és pózuk van; a lándzsás csapást és a dobbantást eltérő sorrendben és időzítéssel váltogatják. A dobbantás középső jelzése Momo felkészüléskori helyét célozza; a két oldalsó jel között kitérési hely marad. A köztük lévő üres tér nem sebezhető; egyetlen kardcsapás mindkettőt átfogva is egyszer sebez. HP-juk, blokkolásuk és találat utáni védelmük közös. Az erős támadás megtöri a pajzsot, három elölről blokkolt normál csapás után is nyílik rövid támadási lehetőség.

A megkínzott kígyó pikkelye külön zsákmány: nem része a három korábbi világ kígyópikkely-fúziójának. Megszerzési jelzője `arenaSerpentScale`, az Árnyékvilágban él. A közös inventory-katalógusban kell regisztrálni, hogy a DPR-t követő ikonrajzoló és a dev-tárgyadó egyaránt használja. A `MERCHANT_SALES` 80 érmés eladási szabályt tartalmaz hozzá; az eladás a jelenlegi birtoklást, nem a megszerzési előzményt törli.

## Fia harca és a történeti jutalom

Fia harci ruhában lebeg az aréna fölött. Egy HP-ja van, de az immunitás és a rövid ereszkedés idején nem sebezhető: a közös közelharci találatfeldolgozó az `ArenaCombat.hit` ágat használja. Az immunitás alatt rögzített célra leadott 5+3+3 lövedékes kombinációt, nagyobb, legalább 0,8 másodpercig jelzett talajmágiát és idézést váltogat. Egyszerre legfeljebb egy 90 HP-s küklopszszolgája lehet; ez különálló testőrként működik, nem ad XP-t, érmét vagy menetjutalmat. A cél és a veszélyterület a felkészüléskor rögzül.

A 90 másodperc lejártakor saját lövedékei és területi veszélyei törlődnek, majd 0,8 másodperc alatt földre ereszkedik. Csak a `phase='exhausted'` állapot sebezhető. Az öt másodperces ablak a földet érés után indul és szünetben áll. Ha nincs befejező találat, új 90 másodperces pajzsciklus indul, rövidebb felkészüléssel/felépüléssel és gyorsabb lövedékekkel; az agresszió növekedése korlátos. Ereszkedéskor, új pajzsciklusnál, bossresetnél és győzelemkor az összes hozzá tartozó élő/függő idézés és lövedék törlődik. A befejező találat nem öli meg a történetben: `spared=true` állapot, győzelmi párbeszéd, majd rövid távozás következik. A távozás órája szünetben áll; csökkentett mozgásnál nincs oldalirányú mozgás.

A győzelmi párbeszéd kizárólag a bajnoki címről és a lakosztályba szóló meghívásról beszél. Haru börtönbeli jelenléte, élve elhurcolása és az említett démon lord **csak a lakosztály beszélgetésében** derül ki. Fia közvetlenebb, flörtölő stílusa az elfogadott HU/EN szövegeket követi; a tábori és a harci öltözet külön grafika.

## Állapotgazdák és mentés

| Modul | Felelősség |
| --- | --- |
| `assets/js/arena-challenge.js` | Küldetésfelvétel, átmeneti próba, hullámok, menetek, egyszeri jutalmak, interakciók, HUD és lakosztály. |
| `assets/js/arena-combat.js` | Négy adatprofilból felépített harci állapotgép, rögzített előjelzés, sebzés, immunitás, két testőr és Fia megadása. |
| `assets/js/arena-art.js` | Kizárólag rajzolás és dialógusportrék; harci órát vagy jutalomállapotot nem léptethet. |
| `assets/js/levels.js` | Helyszínek, pihenők, feloldási feltételek, találkozáskatalógus és `ARENA_REWARDS`. |
| `assets/js/save-vault.js` | A tartós jelzőlánc és az oldalhelyszíni mentőpont érvényesítése. |

Az `attempt` objektum (`round`, `status`, `clock`, `pending`, azonosító) és a távozási jelenet csak memóriában él. Halál, karakter-inicializálás, helyszínváltás, menü/folytatás vagy újratöltés nem állít vissza félbehagyott menetet: a következő kihívás az **első menettől** indul. A már megszerzett jutalmak megmaradnak, az új próba nem adja őket ismét.

Tartós jelzők a `flags[3]` listában:

| Jelző | Jelentés |
| --- | --- |
| `arenaQuestAccepted` | Fia küldetését felvettük. |
| `arenaRewardCaptain` | A kapitány egyszeri XP-jutalmát megkaptuk. |
| `arenaRewardSerpent` | A kétfejű kígyó egyszeri jutalmát megkaptuk. |
| `arenaSerpentScale` | A pikkely megszerzési előzménye. |
| `arenaRewardGuards` | A testőrök egyszeri XP-jutalmát megkaptuk. |
| `arenaChampion` | Az ötödik menet teljesült; a lakosztály elérhető. |

A validátor megköveteli a sorrendet: megmentés és papgyőzelem → küldetés → kapitányjutalom → kígyójutalom és pikkely → testőrjutalom → bajnoki cím. A pikkely eladása a közös `soldItems` listába kerül; az `arenaSerpentScale` előzménynek a kígyójutalom jelzőjével együtt kell megmaradnia. A jutalomjelző az XP-jóváírás előtt kerül be, így egy köztes mentési hívás sem kap hiányos állapotot.

A harci entitások és lövedékek forrásazonosítóval élnek (`arena:<id>`, `arena-minion`). Menetváltáskor a vezérlő a saját ellenfeleket és hatásokat takarítja. Az entitáslista vagy a játékos cseréje után a régi támadás nem folytathatja ugyanabban a képkockában a sebzést. A bossvezérlő nem oszt jutalmat önállóan; a kihívás ellenőrzi az aktuális próba és a boss azonosságát.

## Dev és ellenőrzés

Az aréna és a lakosztály a közös `SIDE_LOCATIONS` listából kerül a fejlesztői teleportba. Aktív tesztmódban a normál feloldások nélkül is bejárhatók. Az aréna négy bossa külön újraindítható a `level.arenaEncounters` katalógusból; a `replay` harc nem ad XP-t, pikkelyt vagy küldetésjelzőt. Részletes használat: [DEV-TOOLS.md](DEV-TOOLS.md).

Célzott forrásteszt:

```sh
node scripts/test-arena-combat.cjs
node scripts/test-arena-challenge.cjs
node scripts/test-arena-art.cjs
node scripts/test-instruction-bindings.cjs
node scripts/test-arena-backdrop-stability.cjs
node scripts/test-arena-rework.cjs
```

A harci teszt a felkészülést, rögzített célokat, forrásazonosítókat, szünetet, 90 másodperces immunitást, két testőr találati testét és valódi támadásinputot vizsgálja. A kihívásteszt a normál feloldást, 45 másodperces hullámot, egyszeri jutalmakat, újrapróbálást/folytatást, megadást, lakosztályt, hibás mentési láncot és dev-izolációt ellenőrzi. Az új helyszínek és az álom dupla ugrás/dash kombinációja 30/60/120 FPS-es inputtesztet is kapott.

Ezek VM-alapú regressziók; nem bizonyítják a natív grafika minőségét, a teljes végigjátszás egyensúlyát vagy a valódi IndexedDB-visszatöltést. Kiadás előtt külön böngészős ellenőrzés kell HU/EN nyelven, 1280×720 és nagyobb asztali nézetben: portrék, teljes fegyverek és fejek, telegráfok, szünet/csökkentett mozgás, inventoryikon, pihenő/újratöltés és normál mentés izolációja.

## Natív grafika

Az `ART_ARENA` a kapitány, a kétfejű kígyó és a testőr hat-hat pózát, a két normál ellenfél négy-négy pózát, Fia nyolc harci és négy külön járáspózát, valamint a két helyszín háttereit regisztrálja. Fia harca két natív atlaszt használ, a távozás pedig a külön `fia-arena-walk-v1.png` képlapot. A járás a szimuláció távozási óráját követi, másodpercenként nyolc képkockával; szünetben nem lép tovább, csökkentett mozgásnál a meglévő statikus távozási póz látszik. A négy új képkocka a felhasználó által jóváhagyott járásvázlatból készült, azonos testmérettel és talpillesztéssel. A `scripts/register-arena-art.py` az eredeti alfa alapján készít kontúrokat és rögzített testméretű illesztést; a PNG-k pixeleit nem írja át. Ellenőrzése: `python scripts/register-arena-art.py --check`. Ezután a közös colormap-export frissítendő. A keresztező képlaprácsot átlépő fegyverek saját kontúrjukon belül teljesek maradnak; másik póz nem kerül a kivágásba. A második küklopsz a közös mozgást eltérő színjelöléssel használja.

Az aréna és a lakosztály a közös natív börtönkő-elemeket ismétli, képaránytartó felső járófelülettel. A rajzoló a harci állapotot olvassa; a szünet és a csökkentett mozgás nem indít külön animációs órát. A kész képek promptjai az `art-prompts/` könyvtárban vannak.

## Méret és kényelmes háttérmozgás

A kapitány teste 88 × 180, a kétfejű kígyóé 380 × 360 világkoordináta-egység. A talpuk továbbra is a padlóhoz illeszkedik; a látható törzs, a sebezhető test és a nagyított támadásjelzések együtt változnak. A kígyó körül marad kitérhető és bejárható terület.

A három jóváhagyott háttérpanel natív képarányt használ. A dekoratív kép vízszintesen legfeljebb a kamera útjának 18%-ával, függőlegesen 8%-ával mozdul, a teljes képfedést megtartva. A nagyítás nem változik kameramozgáskor, a képernyőrázás és a harci órák nem módosítják a panorámát. Csökkentett mozgás mellett a dekoratív háttér álló marad. A célzott teszt a korábbi, egynél nagyobb háttér/kamera sebességarány visszatérését is megfogja.

A gombjelölések cseréje Unicode-betűk, számok és kombináló ékezetek között nem történhet meg: a „Következő” szó része nem kezelhető külön K billentyűként. Az aktuális interakciót és a különálló E/J/K/U/Space jelöléseket a tényleges kiosztás továbbra is egyszer, láncolt csere nélkül alakítja át.
