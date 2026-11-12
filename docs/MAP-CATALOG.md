# Pályaadatok JSON-katalógusban

## Javasolt felépítés

Egy pályához egy verziózott JSON-fájl tartozzon az `assets/config/maps/` könyvtárban. Az azonosító, méret, kezdőpont, platformok, pihenők, zónák, ellenfélpozíciók és átjárók adatok. A feliratokhoz a jelenlegi lokalizációs kulcsokat, a képekhez az `ART_MANIFEST` kulcsait használjuk. A fájlnév egyezzen a pálya azonosítójával.

A `build-game.mjs` a bosskatalógushoz hasonlóan ellenőrizze és ágyazza be a pályaadatokat a generált böngészős csomagba. A beolvasó a meglévő `makeLevel`, `ledge`, `rest` és `zone` függvényeken keresztül állítsa elő a pálya objektumát. Így a platformok alapértékei, köztük a `drop` és a `baseX`, ugyanonnan származnak, ahonnan ma. A pályánkénti vezérlők JavaScriptben kezeljék a harcokat, az eseményeket és a küldetés feltételeit.

A `thirdClanCave` egyik lehetséges formája, a jelenlegi adataival:

```json
{
  "schemaVersion": 1,
  "id": "thirdClanCave",
  "name": "thirdClan.cave",
  "width": 2690,
  "height": 1430,
  "start": { "x": 300, "y": 1030 },
  "platforms": [
    { "id": "third-clan-cave-floor", "x": 0, "y": 1030, "w": 2690, "h": 300, "kind": "ground" }
  ],
  "rests": [
    { "id": "thirdClanCaveThreshold", "x": 330, "y": 1030, "name": "thirdClan.rest.threshold" }
  ],
  "points": {
    "returnPoint": { "x": 130, "y": 1030 },
    "haruTrail": { "x": 2400, "y": 1030 }
  },
  "returnDestination": { "location": "thirdClanPath", "point": "caveEntrance" }
}
```

A példa a geometriát és a visszautat mutatja. A teljes rekord tartalmazná a zónát és a guardian arénájának adatait is. A szimbolikus `point` hivatkozást a beolvasó oldaná fel a célpálya azonosítójából és pontnevéből, miután minden pálya létrejött.

## Mentések és ellenőrzés

- Pályánként egyetlen közös objektumpéldány készüljön. A `CampQuest.locationId()` többek között objektumazonosság alapján azonosítja az aktív oldalhelyszínt. A `levels`, a `SIDE_LOCATIONS` és a dungeon-katalógus ugyanazokat a példányokat használja.
- Az első átköltöztetés őrizze meg a pálya-, pihenő-, ellenfél- és haladási azonosítókat, valamint a checkpoint koordinátáit. A mentésvalidátor a helyszínt, a pihenőt és a koordinátát a pályaadatokhoz ellenőrzi. A kezdőpihenő és a sorrendfüggő listák sorrendje is számít.
- A build jelezze a duplikált azonosítót, a hibás koordinátát, az ismeretlen lokalizációs vagy képkulcsot és a hibás pályahivatkozást. Az átjárók és arénahatárok külön ellenőrzést kapjanak. A pálya határán túli, szándékosan elrejtett bossjelölők és platformok külön engedélyezett esetek legyenek.
- A migrációs teszt hasonlítsa össze a régi és az új pályaobjektumot. A pihenőket és átjárókat a játékmenetből is járja be, és ellenőrizze a régi mentés betöltését a költöztetett pályán. A JSON kerüljön be a runtime forráslenyomatába, hogy adatváltozás után a build ellenőrzése jelezze az elavult csomagot.

## Migrációs sorrend

1. `thirdClanCave` és `thirdClanPath`. Már külön gyárfüggvényben élnek, egymásra hivatkoznak, és a bossvezérlőjük külön modul. A barlang a kisebb próba, az útvonal pedig ellenőrzi a kapaszkodók és az ismétlődő platformok átvitelét.
2. A dungeonök és a Második Zikkurat. Ezeknél a pihenők, a szintenkénti átjárók és a bossarénák legyenek a katalógusban. Az ismétlődő pályaszakaszokat a meglévő JS gyárak is építhetik a JSON-ban tárolt paraméterekből.
3. A négy nagy birodalom és az összetett oldalhelyszínek. Ezek több egymásra épülő bejegyzést és futás közben feloldott geometriát használnak. A lépcsők megjelenése, a mozgó platformok órája és a kapuk feltételrendszere a vezérlőknél maradjon.
