# Fia megmentése és az Árnyékzug

A [Kitsune-kártya](https://trello.com/c/AtUX7Ziq) a megmentést, az átváltozást és a tábort alapozza meg. A megmentett Fia az Árnyékzugban már az ötmenetes arénakihívást is felajánlja; a harcok és a későbbi történeti jutalom részleteit a **spoileres** [arénareferencia](SHADOW-DEN-ARENA.md) írja le.

## Útvonal és feloldás

A külső börtönőr, az elhasználódó kulcs és Zen belső börtönnagya megmarad. A külön `shadowPrison` pálya 5400 × 2720 egységre bővült. Zen szárnyától keletre tizenhárom, legfeljebb 100 egységes lépcső vezet a 2360-as talajszint alsó szárnyába. Az út alapugrással mindkét irányban járható, a felső alapzat rajzán kívül fut.

A `shadowPrisonDepths` pihenő a vadász arénájától keletre, aktiválási területén kívül áll. A `prisonHunter` után, nyugaton található Fia cellája. A vadász legyőzése előtt nem nyitható.

A `shadowDen` az Őrült pap legyőzése után, a katedrális keleti végéről nyílik. A főbirodalmak száma nem változik: a tábor az Árnyékvilág állapotát és pihenőkatalógusát használja. A ninja és a tolvaj Fia sorsától függetlenül jelen van; Fia csak megmentés után jelenik meg. Egy pihenő és HU/EN beszélgetések érhetők el. Megmentett Fia fölött a felvehető arénaküldetést `!` jelzi. A felvétel után az Árnyékzug külön arénabejárata nyílik meg; az ötödik menet ellenfelét a feladat csak jelenlegi bajnokként említi. A teljesítés külön lakosztályt old fel.

## Tartós állapot

Minden jelző az Árnyékvilág `flags[3]` listájába kerül:

| Jelző | Jelentés |
| --- | --- |
| `guardian:prisonHunter` | A vadász egyszeri legyőzése. |
| `fiaSeen` | Momo a vadász legyőzése után elérte a cella környékét. |
| `fiaRescued` | Fia kiszabadítása; végleges az adott utazáson. |
| `fiaMissed` | Momo a cella elérése után, megmentés nélkül elhagyta a börtönt. |

A megmentett és kihagyott állapot kizárja egymást. Mindkettőhöz szükséges a cella elérése, a vadász legyőzése és a külső kapu megnyitása. A mentésvalidátor ezeket külön ellenőrzi.

A kihagyást csak érvényes, szándékos helyszínváltás váltja ki: kijárat, más helyszínre gyorsutazás, vagy az elkülönített dev teszt teleportja. Halál, pihenés, menü, újratöltés, sikertelen utazás és börtönön belüli utazás nem zárja le Fia történetét. A vadász győzelme önmagában sem elég. Fia sorsa nem blokkolja Haru nyomát vagy a főbosst.

Kiszabadításkor a végleges jelző a párbeszéd előtt mentődik. Bezárás után Fia rövid jelenetben lila rókává változik és távozik. A jelenet csak aktív játékban telik, szünetben/párbeszédben áll; csökkentett mozgásnál visszafogott. Újratöltéskor a megmentés megmarad, a jelenet nem ismétlődik.

## Harc és modulok

A `prison-hunter.js` 140 HP-s, lándzsás–íjas minibosst kezel. A lándzsa 0,8, az íj 1 másodpercig jelez; az irány és a cél előre rögzül. A támadások 2 sebzést okoznak, az íj három, fél HP alatt öt nyilat lő ki. Rövid, arénán belüli visszalépés követi a csapásokat. Első legyőzése 200 XP-t és a közös miniboss-érmejutalmat adja; halál és pihenés nem hozza vissza.

A `kitsune-quest.js` a megmentés, kihagyás és kiszabadítási jelenet állapotgazdája; az Árnyékzugban Fia beszélgetését az `ArenaChallenge.talkFia()` kezeli, hogy a feladatfelvétel és a későbbi meghívás ugyanazt az interakciót használja. A `kitsune-art.js` csak olvassa ezt és a harci állapotot. A `SIDE_LOCATIONS` kezeli a tábor feloldását és utazási pontjait. A dev-integráció a [fejlesztői eszközök](DEV-TOOLS.md) dokumentációjában szerepel.

## Ellenőrzés

`npm run test:kitsune`: harc, teljes lépcsős út oda-vissza 30/60/120 FPS-en alapugrással; megmentés, halál, pihenés, menü/folytatás, sikeres és sikertelen utazás, kizáró állapotok, táborfeloldás és dev-izoláció. Mindkét teszt a teljes `npm test` része. A valódi böngészős tárolás és natív grafika külön QA-t igényel.

A tábori folytatás célzott regressziói a `test-arena-combat.cjs` és `test-arena-challenge.cjs` fájlokban vannak. Fia kihagyása továbbra sem blokkolja az Árnyékvilág fő történeti útvonalát; az aréna és a lakosztály opcionális marad.

Fia második, templomemlékhez kötött megbízása és az opcionális provokáció tartós következményei a **spoileres** [Fia-referenciában](FIA-JOURNEY.md) szerepelnek.
