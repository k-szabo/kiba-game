# Hátizsák és felszerelés – 0.9.7

Az alapértelmezett **I** billentyű vagy a HUD hátizsák gombja két panelt nyit meg. A festett bőrhátizsák dinamikus rácsa kapacitáskorlát nélkül jeleníti meg a birtokolt tárgyakat; a másik panel Momót és a fegyver helyét mutatja. Kis kijelzőn a panelek egymás alá kerülnek, és az ablak görgethető.

A jelenlegi tárgytípusok egyedi küldetéstárgyak: angyalglória, démon szarv és a négy tanácsos csontkulcsa. A lista közvetlenül a meglévő mentett küldetésjelzőkből épül fel. Nincs második tárgypéldány-adatbázis vagy új mentésmező. A kapunyitáskor elfogyasztott kulcs eltűnik; a glória és a szarv megmarad. Tárgykiválasztáskor név és leírás jelenik meg, eldobás vagy küldetéstárgy-felszerelés nincs.

A felszerelt fegyver Momo katanája, Yomi őrzőjének legyőzése után a Hajnalkard. A fegyver részletei a tényleges fejlesztésekből számított sebzést mutatják. A megjelenítés nem módosítja a harcot.

Nyitott inventory alatt a játék `inventory` állapotba kerül, így a mozgás, ellenfelek, támadások, lövedékek, platformok és prológus megállnak. A nyitóbillentyű, Escape, az átállított szünetbillentyű vagy a bezáró gomb folytatja a játékot. A Tab fókusza az ablakban marad, bezáráskor visszatér a megnyitó vezérlőre.

A billentyűkiosztás `inventory` művelete az `assets/config/keybindings.json` fájlban van. Korábbi egyéni kiosztásban már használt I esetén az új művelet szabad alternatív billentyűt kap, a korábbi beállítások megtartásával. A korábbi JSON-exportok importálhatók. A súgó és a vezérlők az aktuális kiosztást mutatják.

## Forrás és grafika

- `assets/js/inventory.js`: a tárgylista, panelrajzolás, részletek és fókuszkezelés.
- `assets/js/game.js`: a menüállapot és az akcióhoz kötött megnyitás/bezárás.
- `assets/images/ui/backpack-leather-v1.png`: eredeti alfát megőrző, beépített `image_gen` eszközzel készült hátizsák.
- [Generálási prompt és illesztési adatok](art-prompts/inventory-ui-v1.json).
- A tárgyikonok és Momo az eredeti sprite-okból készülnek. A kis katanaikon natív SVG; a meglévő képek változatlanok.

A `scripts/test-inventory.cjs` a tárgyakat, kulcsfogyasztást, szünetet, egyéni vezérlést és a korábbi I-kiosztások megtartását ellenőrzi. A látványt, billentyűzetfókuszt, mobil HUD-ot és tényleges böngészős tárolást külön Chrome QA ellenőrzi.
