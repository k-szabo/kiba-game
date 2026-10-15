# Kiadások és visszakereshető hibajavítások

Új funkcióhoz továbbra is egyszerű `major.minor.patch` verziót használunk, például `0.9.10`. Kisebb hibajavításhoz ugyanez az alap kap egy aláhúzást és nyolc karaktert: `0.9.10_8as86fg7` a formátum példája. A generátor `0–9`, `a–f` karaktereket használ, így minden kód nyolc kisbetűs alfanumerikus karakterből áll.

A kód a javítás **rögzített leírásának** SHA-256 lenyomatából az első nyolc hexadecimális karakter. Nem véletlenszám, dátum, gépfüggő adat vagy a generált runtime hash-e. Azonos metaadatból minden gépen ugyanaz lesz; a build nem készít új verziót. A javítás tartalmát a leírás és a Git-diff együtt azonosítja; a rövid kód nem biztonsági ellenőrzőösszeg.

## Hibajavítás előkészítése

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
node scripts/release.mjs validate
```

A JSON mezősorrendje és a szélső szóközök nem módosítják a kódot. A szöveg Unicode NFC-re és LF sortörésekre normalizálódik; a javítások listájának sorrendje számít. A hiányzó fordítások és ismeretlen mezők hibát okoznak. Kódütközésnél a parancs leáll: válassz másik, továbbra is beszédes `slug` értéket. Ugyanazon aktuális rekord ismételt rögzítése nem duplikál; régi kiadást nem aktivál újra.

## Visszakeresés

```sh
node scripts/release.mjs lookup 1234abcd
node scripts/release.mjs lookup 0.9.10_1234abcd
```

Ezek szintén formátumpéldák: tényleges, korábban generált kódot adj meg. Az eredmény az alapverziót, a `slug` azonosítót és az összes javítást kiírja. A `docs/releases.json` ember által is olvasható és Gitben követett; **korábbi rekordot ne írj át és ne törölj**, új javításhoz új rekord kell. Ez a nyilvántartás a rendszer bevezetése utáni kódos hibajavításokat tartalmazza; a korábbi egyszerű verziók a főmenü változásnaplójában és a Git történetében maradnak visszakereshetők.

## Build és publikálás

Frissítsd a játék HU/EN változásnaplóját is az új teljes verzióval; a belső nyilvántartás nem helyettesíti a játékosoknak szánt szöveget. Ezután:

```sh
npm run build
npm test
```

A build elfogadja az egyszerű verziókat és a nyilvántartásban szereplő kódos verziókat. A teljes azonosító kerül a főmenübe, a CSS/runtime cache URL-jeibe és a mentések kiadási kulcsába. Ismételt buildnél nincs dupla utótag. Alfa/béta alatt **egy új kódos hibajavítás is törli az előző kiadás haladását**, a nyelv és billentyűkiosztás megmarad. Új funkciónál kézzel növeld az `assets/config/release.json` egyszerű verzióját; a korábbi nyilvántartási rekordokat őrizd meg.

A runtime `GAME_RELEASE.bugfixHistory` mezőjében a build alapverziónként beágyazza a kódokat a nyilvántartás hozzáfűzési sorrendjében. A mentésvédelem ezt használja az ugyanazon alapverzióhoz tartozó javítások időrendi összehasonlításához; a hash betűrendje nem jelent időrendet. A nyilvántartás változása is elavulttá teszi a buildet. Korábbi böngészőlap egy számára ismeretlen új kódú profilt nem írhat felül.

A CLI nem buildel, nem commitol, nem pushol és nem publikál. A dokumentációs nyilvántartás nem kerül a Pages-csomagba; a build idején szükséges. A `node scripts/test-release-ids.mjs` elkülönített ideiglenes projektben ellenőrzi a CLI-t és a valódi buildet, a checkout verzióját és generált fájljait nem módosítja.
