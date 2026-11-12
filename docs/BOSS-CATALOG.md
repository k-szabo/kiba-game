# Közös bosskatalógus

Az `assets/config/bosses/` a közös bosskatalógus. Minden találkozásnak egy JSON-fájlja van, amelynek neve megegyezik az `id` mezővel. A `name` a magyar és az angol fordításhoz használt lokalizációs kulcs.

- `classificationOrder` és `group`: a fejlesztői besorolás sorrendje és a találkozás kategóriája.
- `story`: a történeti profil. A Második Zikkurat sorrendjét a `raidOrder`, a találkozás mechanikáját a `raidKind` adja meg. A Mimic a kampányban Momo aktuális maximális HP-ját másolja.
- `tower`: a `baseHealth` az emeletszorzó előtti HP, az `order` a rotáció helye. A Torony a katalógus összes rekordjából építi fel a rotációt.
- `assets`: az `ART_MANIFEST` képkulcsai, beleértve a boss saját effektjeit. Ezekből dolgozik a közös előtöltés és a torony grafikai függőséglistája.

A build a JSON-fájlokat validálva beágyazza a runtime-ba; nincs új hálózati kérés vagy futás közbeni fájlbetöltés. A `BossCatalog` mélyen fagyasztott adatokat ad a vezérlőknek. A történeti események, mentésírások, jutalmak és az aktív támadási állapotgépek továbbra is a hozzájuk tartozó forrásmodulokban élnek.

Új bossnál a saját JSON-fájlt és a szükséges harci és grafikai integrációt együtt kell hozzáadni. A `scripts/test-boss-catalog.cjs` ellenőrzi a katalógus lefedését, a képkulcsokat, a közös profilt és az adatváltozás hatását a történeti és toronybeli bossokra.

Tower health display is owned by `TowerMode.draw`: native serpent, prison warden, hunter and legacy miniboss renderers omit their campaign health panels for `towerBoss` actors, while keeping their attack cues. Numeric HP overlays the same common bar. The full roster is covered by `scripts/test-tower-vfx-parity.cjs`.
