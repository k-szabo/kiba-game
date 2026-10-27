# Fia második megbízása és titkos harca

Spoileres fejlesztői referencia. Kártyák: [Fia quest #2](https://trello.com/c/bOTc8aP0), [Fia legyen megtámadható](https://trello.com/c/oDJB4Y0y).

## Második küldetés

Az arénagyőzelem után az első lakosztályi beszélgetés megtartja Haru korábban jóváhagyott nyomát; `fiaChambersHeard` rögzíti a meghallgatását. A következő beszélgetés egyszer felveszi az `fiaTalismanAccepted` megbízást. A marker `!`, a megszerzett talizmán leadásakor `?`. A `priestessTalisman` csak felvett, befejezetlen küldetés mellett, a Szekta Bukása dungeon főpapnőjének új, rendes legyőzéséből szerezhető. Korábbi győzelem nem adja visszamenőleg, dev boss replay nem adja; ha a boss már halott, új emlékút szükséges.

Leadáskor a történeti talizmánjelző megmarad, de `consumedBy: fiaTalismanCompleted` eltávolítja a tárgyat az inventory birtoklási nézetéből. A jutalom egyszer 600 XP és 3 sült csirkecomb; a `chickenCount` biztonságos egész készlet. Egy adag legfeljebb 4 HP-t gyógyít, teljes életen nem fogy. A közös gyógyító gyorshasználatba választható, kifogyáskor más elérhető gyógyító tárgyra vált. A művelet akciókötést használ, nem hardkódolt Q-t.

## Provokáció és visszaállítás

Fia a látható, barátságos NPC törzsének valódi kardtalálatával támadható meg az Árnyékzugban és a lakosztályban; nincs előzetes ellenséges jelölés vagy új interakciógomb. A külön `fiaVengeance` találkozás nem az aréna 1 HP-s, megadással végződő ellenfele. 900 HP, 480 egység/másodperces üldözés; hat mozdulat: foxfire, földjelek, teleport, életerőszívás, charm, gyors lövedéklegyező. Idézés nincs. A célok a legalább 0,65–0,9 másodperces jelzések elején rögzülnek. A pajzs 3 másodperces védelmet ad 12 másodperces ciklusban, nyitott támadási időkkel. A charm 1,25 másodpercig lassít és korlátozottan húz; ugrás/dash használható marad. A drain csak a valóban elvesztett HP-t gyógyítja vissza, immunitásból vagy visszaállított játékospéldányból nem nyerhet életet.

A `captureProgress()` tiszta teljes haladásképet ad. Provokációkor ehhez egyszer egy szűk `fiaRecovery` horgony kerül: helyszín, középpont X, talpmagasság, aktuális HP, irány, hátramaradt tea-hatás. Nem írunk tetszőleges koordinátákat a kanonikus shrine-checkpointba és nem ágyazunk teljes mentést másik mentésbe. A harc alatt a `persist()` a fagyasztott előzményt tartja meg, nem az elfogyasztott tárgyakkal módosított kísérletet.

Halál/lezuhanás a normál shrine-respawn előtt visszaállítja a teljes előzményt és az aktuális HP/pozíció/tea-hatást. Menü és félbehagyás ugyanazt a visszaállítást használja. A szokásos kijárat, gyorsutazás, beszélgetés és training harc közben blokkolt. Az ugyanazon kiadású böngészős újratöltés a validált horgonyt alkalmazza a normál map-bootstrap után. Régi kiadásból nem migrálunk. A `save-vault.js` szigorúan ellenőrzi a helyszínt, feloldást, véges koordinátákat, HP-t, irányt és tea-részállapotot.

## Tartós győzelem és ellenséges tábor

Első győzelemkor együtt kerül be a `fiaSlain`, `fiaRewardClaimed`, `kitsuneSoul`, `kibaShield`. A jutalom egyszer 1200 XP és +1 fejlesztéspont; a közös pontkeret a claimet számolja, nem a lélek pillanatnyi birtoklását. A korábbi megmentési, aréna- és teljesített küldetéstörténet megmarad. A további Fia-megbízások a halál miatt elérhetetlenek.

A barátságos Fia és táborlakó-példányok eltűnnek. Az Árnyékzug nindzsája és tolvaja valódi, animált ellenségként jelenik meg; két külön küklopsztestőr is támad. A lakosztályban szintén két testőr marad. Ezek nem adnak új Fia-/arénajutalmat. A normál halál/pihenés újra létrehozhatja őket, a tábor tartós ellenségességét nem törli.

A passzív Kiba-pajzs alapból 2 sebzést nyel el a fegyveres blokk/páncél számítása után. Ha teljesen elfogy, alapból 12 aktív játékmásodperc múlva újratölt. A feladatpanel időzítője a hátralévő időt, töltött állapotban az aktuális/maximális elnyelést mutatja. Szünet, dialógus és játékablak alatt áll; a halálos lezuhanás továbbra is halálos. A mozgásképesség-tömb változatlan, a pajzs külön jelző.

A megszerzett pajzs a szentélyeknél külön fejleszthető. A `progression.stats.shield` fokozat 0–12 közötti; egy fokozat egy fejlesztéspont, +0,25 elnyelés és −0,5 másodperc újratöltés. A maximum 5 elnyelés / 6 másodperc. A szabályokat a `KIBA_SHIELD_RULES` rögzíti. Fejlesztéskor az aktuális töltés nem nő; a futó visszaszámláló legfeljebb az új újratöltési időre rövidül. A statpont a közös pontkeret része, tulajdonjog nélkül pozitív fokozat nem menthető. A dev-szintcsökkentés a közös normalizálással visszavágja a meg nem fizethető fokozatokat és a pajzs aktuális kapacitását. Halál/utazás/folytatás továbbra is a fejlesztett kapacitásra inicializál.

Az ellenséges nindzsa, tolvaj és a két külön testőr a közös `Visuals.healthBar` rajzolót használja a natív sprite-jától függetlenül. Teljes életnél is látszik a csík, a halott ellenfélnél nem. A rajzolás nem módosít harci állapotot, jutalmat vagy találati testet.

## Modulok, grafika és ellenőrzés

- `fia-quest.js`: küldetés, feltételes drop, leadás és csirkecomb.
- `fia-conflict.js`: előzmény, visszaállítás, ellenséges tábor, passzív pajzs és egyszeri jutalom.
- `fia-combat.js`: külön bossharc, példányhoz kötött lövedékek, charm és drain.
- `fia-art.js`: csak olvasó rajzolás; Fia/testőr meglévő pózai, 12 új táborlakópóz és 20 natív effektképkocka.
- `register-fia-art.py`: megőrzött forrásalfa, teljes sziluettek, fix testméret és talpillesztés. Az inventory tárgyai a közös DPR-követő rajzolót használják.

`node --run test:fia` futtatja a küldetés-, harc-, mentési és art-regressziókat. A harc/haláltesztek 30/60/120 FPS-t vizsgálnak. A mentési suite valódi WebCryptót és szintetikus IDB-t használ; a valódi böngészős IndexedDB/újratöltés, HU/EN, 1280×720 és nagyobb nézetek külön ellenőrzés. A dev panel mindkét helyszínen jutalommentes Fia-replayt, az új tárgyakat és a passzív pajzs megszerzését is kezeli; a tesztkészlet nem ír normál mentést.
