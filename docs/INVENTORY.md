# Hátizsák és felszerelés – 0.9.7

Az alapértelmezett **I** billentyű vagy a HUD hátizsák gombja két panelt nyit meg. A festett bőrhátizsák dinamikus rácsa kapacitáskorlát nélkül jeleníti meg a birtokolt tárgyakat; a másik panel Momót és a fegyver helyét mutatja. Kis kijelzőn a panelek egymás alá kerülnek, és az ablak görgethető.

Az inventoryban megjelenő egyedi küldetéstárgyak az angyalglória, a démon szarva, a négy tanácsos csontkulcsa, a titkos végső boss után összeolvadó Alkonyat Pecsétje és a lávakígyó pikkelye. A lista közvetlenül a meglévő mentett küldetésjelzőkből épül fel. Nincs második tárgypéldány-adatbázis vagy új mentésmező. A kapunyitáskor elfogyasztott kulcs és az egyesítés után lecserélt ereklyék eltűnnek; az új Pecsét és a pikkely megmarad. Tárgykiválasztáskor név és leírás jelenik meg, eldobás vagy küldetéstárgy-felszerelés nincs.

A felszerelt fegyver Momo katanája, Yomi őrzőjének legyőzése után a Hajnalkard. A fegyver részletei a tényleges fejlesztésekből számított sebzést mutatják. A megjelenítés nem módosítja a harcot.

Nyitott inventory alatt a játék `inventory` állapotba kerül, így a mozgás, ellenfelek, támadások, lövedékek, platformok és prológus megállnak. A nyitóbillentyű, Escape, az átállított szünetbillentyű vagy a bezáró gomb folytatja a játékot. A Tab fókusza az ablakban marad, bezáráskor visszatér a megnyitó vezérlőre.

A billentyűkiosztás `inventory` művelete az `assets/config/keybindings.json` fájlban van. Korábbi egyéni kiosztásban már használt I esetén az új művelet szabad alternatív billentyűt kap, a korábbi beállítások megtartásával. A korábbi JSON-exportok importálhatók. A súgó és a vezérlők az aktuális kiosztást mutatják.

## Forrás és grafika

- `assets/js/inventory.js`: a tárgylista, panelrajzolás, részletek és fókuszkezelés.
- `assets/js/game.js`: a menüállapot és az akcióhoz kötött megnyitás/bezárás.
- `assets/images/ui/backpack-leather-v1.png`: eredeti alfát megőrző, beépített `image_gen` eszközzel készült hátizsák.
- [Generálási prompt és illesztési adatok](art-prompts/inventory-ui-v1.json).
- A küldetéstárgyak ikonjai az eredeti sprite-okból készülnek.
- A 0.9.8-as frissítéstől Momo külön, nagy felbontású portrét kapott (`assets/images/ui/momo-inventory-v1.png`); a fegyver festett grafikája az `assets/images/ui/katana-inventory-v1.png`. A [generálási promptok és kivágások](art-prompts/inventory-hd-v1.json) rögzítik a referenciákat és az illesztést.
- A portré és a katana rajzfelülete követi a kijelző pixelsűrűségét (legfeljebb 3×), a panel méretaránya változatlan. Mobilon a fegyverkártya továbbra is Momo alatt jelenik meg, átfedés nélkül.

A `scripts/test-inventory.cjs` a tárgyakat, kulcsfogyasztást, szünetet, egyéni vezérlést és a korábbi I-kiosztások megtartását ellenőrzi. A látványt, billentyűzetfókuszt, mobil HUD-ot és tényleges böngészős tárolást külön Chrome QA ellenőrzi.

## Tárgyikonok olvashatósága – 0.9.9

Az `ART_INVENTORY.items` a közös ikonkatalógus: tárgyazonosítónként a fordítási kulcsot, képreferenciát és az inventoryhoz illő kivágást tartalmazza. A glória és a szarv itt talapzat nélkül látható; a világban használt képek és kivágások változatlanok. A forrásképek alfáját megőrizzük.

Minden tárgy ugyanazon a rajzolón keresztül, pixelsűrűséghez igazított felbontással (legfeljebb 3×) és teljes rajzolási átlátszatlansággal jelenik meg. Az egységes, sötét kékesszürke ikonhátteret és enyhe fényerő-/kontrasztkiemelést a közös CSS adja. Ez a háttér kijelöléskor és hover alatt is megmarad, a színes tárgyak így elkülönülnek a barna bőrtől.

Új tárgyhoz ebbe a katalógusba kell felvenni a grafikát, a kivágást és a HU/EN fordítási kulcsot; külön rajzolóág vagy halványító stílus helyett a közös megjelenítést kell használni. A katalógus minden bejegyzésére automatikusan fut a képhatár-, DPR- és rajzolási alfaellenőrzés. A tényleges olvashatóságot böngészőben is ellenőrizni kell: magyar/angol, asztali/320 px, normál/kijelölt/hover/fókusz állapotban, a teljes tárgysziluettel és olvasható névvel.

## Az Alkonyat Pecsétje – 0.9.10

A glória és a démonúr szarva csak a titkos harmadik bossforma végleges legyőzésekor egyesül. Az átváltozás vagy a szokásos kétfázisos győzelem nem adja a jutalmat. A Pecsét új grafikát, HU/EN leírást és egyszer megjelenő győzelmi párbeszédet kapott; statisztikai bónuszt nem ad.

A mentett `flags[2].eclipseRelic` jelző az egyesült ereklyét birtokolja. A két eredeti gyűjtési jelző történeti adatként megmarad, hogy Japánban ne jelenjenek meg újra a felvett tárgyak; birtokolt tárgyként azonban a hátizsák és a HUD csak a Pecsétet mutatja. Halál, visszautazás és azonos kiadáson belüli újratöltés megőrzi. A validátor az utolsó boss legyőzését és a két őrzött ereklye megszerzését is megköveteli.

A katalógus `realm` mezője adja meg a birtoklási jelző birodalmát. Az opcionális `consumedBy: {realm, id}` a felhasznált tárgyat elrejti, így a kulcsfogyasztás és az ereklyeegyesítés ugyanazt a közös inventory-megjelenítést használja. Az új grafika és prompt: `assets/images/ui/eclipse-relic-v1.png`, [generálási adatok](art-prompts/eclipse-relic-v1.json).

A 0.9.11-es kiadástól a lávakígyó egyszer megszerezhető pikkelye (`serpentScale`, Yomi) is megjelenik. A megölt kígyótól automatikusan bekerül a hátizsákba, és a félbemaradt bosskísérlet után is megmarad. Jelenleg nincs felhasználása vagy statbónusza. A közös kontrasztos ikonkatalógust használja; [a harc szabályai](YOMI-BOSS.md).
