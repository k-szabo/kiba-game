# Kiadások és visszakereshető hibajavítások

A játék a `0.9.48_9c622a1b` kiadástól béta állapotú. A főmenü HU/EN verziójelölése `BÉTA` / `BETA`; minden új kiadás nyolckarakteres azonosítót kap. A `0.9.52` UI-frissítéstől a kompatibilis kiadások megőrzik a haladást. A korábbi kiadások történeti rekordjai változatlanok.

Minden új kiadás, funkció és hibajavítás egyaránt `major.minor.patch_8hex` formátumot használ, például `0.9.14_8a586f97`. A feature új alapverziót kap, a javítás megtartja az aktuális alapverziót. A generátor `0–9`, `a–f` karaktereket használ. A korábbi, már közzétett egyszerű verzióazonosítókat nem írjuk át.

A kód a kiadás **jóváhagyott HU/EN metaadatának** SHA-256 lenyomatából az első nyolc hexadecimális karakter. Nem véletlenszám, dátum, gépfüggő adat vagy a generált runtime hash-e. Azonos metaadatból minden gépen ugyanaz lesz; a build nem készít új verziót. A normalizált alapverzió, slug, összefoglaló és változáslista egyszerre dokumentálja a kiadást és adja a kód bemenetét. A rövid kód nem biztonsági ellenőrzőösszeg.

A játékosoknak szóló kiadási összefoglaló és változásnapló leírásnak számít. A release agent megmutatja a HU/EN tervezetet a felhasználónak, és megvárja a kifejezett jóváhagyását, mielőtt a szöveget metaadatba, játékba vagy kiadásba véglegesíti. A kódot csak a jóváhagyott változatból generálja.

## Kiadási metadata előkészítése

Készíts egy JSON-fájlt a javítás alapverziójával, egy rövid egyedi azonosítóval és HU/EN szövegekkel. A `fixes` a kiadás összes javítását sorolja fel. Az azonos alapverzióhoz tartozó `slug` nem használható újra.

```json
{
  "baseVersion": "0.9.10",
  "slug": "inventory-icon-contrast",
  "summary": {
    "hu": "Olvashatóbb tárgyikonok",
    "en": "Readable item icons"
  },
  "fixes": [
    {
      "hu": "A sötét ikonok kontrasztja javult.",
      "en": "Improved dark item icon contrast."
    }
  ]
}
```

Az előnézet nem ír fájlt. A `--write` kifejezetten frissíti a `release.json` verzióját, és hozzáfűzi a rekordot a [kiadási nyilvántartáshoz](releases.json).

```sh
node scripts/release.mjs bugfix --metadata path/to/fix.json
node scripts/release.mjs bugfix --metadata path/to/fix.json --write
node scripts/release.mjs release --metadata path/to/feature.json
node scripts/release.mjs release --metadata path/to/feature.json --write
node scripts/release.mjs release --metadata path/to/feature.json --preserve-saves-from 0.9.51_2d78d59b --write
node scripts/release.mjs bugfix --metadata path/to/breaking-fix.json --reset-saves --write
node scripts/release.mjs validate
```

Bugfixnél a `baseVersion` egyezzen a jelenlegi kiadás egyszerű alapjával. Feature-nél a `release` parancs olyan új `baseVersion`-t követel, amely nagyobb az aktuálisnál; ehhez is ugyanazt a nyolckarakteres kódot generálja. Például a `0.9.13` után egy feature `0.9.14_XXXXXXXX` verziót kap. A `releases` nyilvántartási lista a feature kiadásokat, a `bugfixes` lista a javításokat tartalmazza; mindkettő hozzáfűzéses és egyik rekordját sem írjuk át.

A JSON mezősorrendje és a szélső szóközök nem módosítják a kódot. A szöveg Unicode NFC-re és LF sortörésekre normalizálódik; a változáslista sorrendje számít. A hiányzó fordítások és ismeretlen mezők hibát okoznak. Kódütközésnél a parancs leáll: válassz másik, továbbra is beszédes `slug` értéket. Ugyanazon aktuális rekord ismételt rögzítése nem duplikál; régi kiadást nem aktivál újra. A build a történeti plain verziókat kompatibilitás miatt továbbra is beolvassa, de új kiadáshoz a két release parancs valamelyikével kell nyolckarakteres kódot készíteni.

## Visszakeresés

```sh
node scripts/release.mjs lookup 5434103e
node scripts/release.mjs lookup 0.9.11_5434103e
```

Az aktuális kód példaként szerepel; később a ténylegesen keresett kódot add meg. Az eredmény az alapverziót, a `slug` azonosítót és az összes javítást kiírja. A `docs/releases.json` ember által is olvasható és Gitben követett; **korábbi rekordot ne írj át és ne törölj**, új javításhoz új rekord kell. Ez a nyilvántartás a rendszer bevezetése utáni kódos hibajavításokat tartalmazza; a korábbi egyszerű verziók a főmenü változásnaplójában és a Git történetében maradnak visszakereshetők.

## Build és publikálás

Frissítsd a játék HU/EN változásnaplóját is az új teljes verzióval; a belső nyilvántartás nem helyettesíti a játékosoknak szánt szöveget. Ezután:

```sh
npm run build
npm test
```

Az előkészített kiadást `--write` után a build teljes azonosítóként használja a főmenüben, CSS/runtime cache URL-jeiben és a mentések kiadási kulcsában. Ismételt buildnél nincs dupla utótag. A kiadásazonosító és a mentéskompatibilitási korszak külön adat: **a normál kiadás változatlanul hagyja a `saveCompatibility` értékét**, így a haladás megmarad. Csak dokumentált, mentést törő változáskor használd a `--reset-saves` kapcsolót; ez az új kiadásra lépteti a korszakot. A nyelv és billentyűkiosztás resetkor is megmarad. A kezdeti átállás a `--preserve-saves-from 0.9.51_2d78d59b` kapcsolóval köti össze a korábbi profilt az új korszakkal. Részletek és tárolási ellenőrzések: [SAVE-COMPATIBILITY.md](SAVE-COMPATIBILITY.md). Kiadáskor a megfelelő `release.mjs` parancs frissítse a regisztert és a konfigurációt; ne szerkeszd kézzel a verziót vagy a kompatibilitási határt.

A runtime `GAME_RELEASE.bugfixHistory` mezőjében a build alapverziónként beágyazza a kódokat a nyilvántartás hozzáfűzési sorrendjében. A mentésvédelem ezt használja az ugyanazon alapverzióhoz tartozó javítások időrendi összehasonlításához; a hash betűrendje nem jelent időrendet. A nyilvántartás változása is elavulttá teszi a buildet. Korábbi böngészőlap egy számára ismeretlen új kódú profilt nem írhat felül.

A CLI nem buildel, nem commitol, nem pushol és nem publikál. A dokumentációs nyilvántartás nem kerül a Pages-csomagba; a build idején szükséges. A `node scripts/test-release-ids.mjs` elkülönített ideiglenes projektben ellenőrzi a CLI-t és a valódi buildet, a checkout verzióját és generált fájljait nem módosítja.

A build a változásnapló `Jelenlegi kiadás / Current release` jelölését is automatikusan szinkronizálja. A teljes, nyolckarakteres kódot is tartalmazó aktív verzióhoz tartozó szakaszt keresi, minden korábbi ilyen jelölést eltávolít, és pontosan egyet helyez az aktuális cím mellé. A történeti verzióazonosítókat nem írja át. Hiányzó vagy többértelmű aktuális szakasz esetén a build hibával leáll; `--check` módban az elavult jelölés is ellenőrzési hibát okoz. Regresszió: `node scripts/test-current-release-marker.mjs`.
