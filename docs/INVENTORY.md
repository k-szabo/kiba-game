# Hátizsák és felszerelés – 0.9.7

Az alapértelmezett **I** billentyű vagy a HUD hátizsák gombja két panelt nyit meg. A festett szamuráj útravaló zsák dinamikus rácsa kapacitáskorlát nélkül jeleníti meg a birtokolt tárgyakat; a másik panel Momót és a külön fegyver-/talizmánhelyet mutatja. Az ablak görgethető.

A mobilos felület és az érintőképernyős irányítás megszűnt. A legkisebb támogatott nézet 1280×720; a játék billentyűzettel és egérrel használható.

A megszerzett tárgyak listája kizárólag a hátizsák ablakában jelenik meg. A korábbi bal felső HUD-lista megszűnt; a küldetéscél és a birtokolt iránytű kijelzése megmarad.

Az inventoryban megjelenő egyedi küldetéstárgyak az angyalglória, a démon szarva, a négy tanácsos csontkulcsa, a titkos végső boss után összeolvadó Alkonyat Pecsétje és a lávakígyó pikkelye. A lista közvetlenül a meglévő mentett küldetésjelzőkből épül fel. Az egyedi küldetéstárgyakhoz nincs második példány-adatbázis; a fogyasztható készletek és a megvásárolt fegyverek külön, mentett mennyiségeket és tulajdonlistát használnak. A kapunyitáskor elfogyasztott kulcs és az egyesítés után lecserélt ereklyék eltűnnek; az új Pecsét megmarad, a pikkelyek Fumi egyszeri egyesítéséig birtokolhatók. Tárgykiválasztáskor név és leírás jelenik meg, eldobás vagy küldetéstárgy-felszerelés nincs.

A felszerelt fegyver az ébredés után választott katana, naginata vagy kard és pajzs; Ren megmentése után a megvett profilok is felszerelhetők. Yomi őrzőjének legyőzése mindhárom stílus sebzését javítja; a katana neve ekkor Hajnalkard. A profilokat és mentési szabályokat a [fegyverútmutató](WEAPONS.md) írja le. A fegyver részletei a tényleges fejlesztésekből számított normál és erős támadás sebzését mutatják. A megjelenítés nem módosítja a harcot.

Nyitott inventory alatt a játék `inventory` állapotba kerül, így a mozgás, ellenfelek, támadások, lövedékek, platformok és prológus megállnak. A nyitóbillentyű, Escape, az átállított szünetbillentyű vagy a bezáró gomb folytatja a játékot. A Tab fókusza az ablakban marad, bezáráskor visszatér a megnyitó vezérlőre.

A billentyűkiosztás `inventory` művelete az `assets/config/keybindings.json` fájlban van. Korábbi egyéni kiosztásban már használt I esetén az új művelet szabad alternatív billentyűt kap, a korábbi beállítások megtartásával. A korábbi JSON-exportok importálhatók. A súgó és a vezérlők az aktuális kiosztást mutatják.

## Forrás és grafika

- `assets/js/inventory.js`: a tárgylista, panelrajzolás, részletek és fókuszkezelés.
- `assets/js/game.js`: a menüállapot és az akcióhoz kötött megnyitás/bezárás.
- `assets/images/ui/samurai-travel-bag-v1.png`: jóváhagyott koncepcióból, beépített `image_gen` eszközzel készült indigókék szövetzsák; az eredeti generált alfa megmarad. Az `ART_MANIFEST.inventoryTravelBag` tölti be, a panel CSS-háttérként használja. A [generálási prompt és eredet](art-prompts/inventory-samurai-v1.json) rögzíti a végleges assetet.
- A korábbi bőrhátizsák [történeti generálási promptja és illesztési adatai](art-prompts/inventory-ui-v1.json) megmaradnak referenciának.
- A küldetéstárgyak ikonjai az eredeti sprite-okból készülnek.
- A 0.9.8-as frissítéstől Momo külön, nagy felbontású portrét kapott (`assets/images/ui/momo-inventory-v1.png`); a fegyver festett grafikája az `assets/images/ui/katana-inventory-v1.png`. A [generálási promptok és kivágások](art-prompts/inventory-hd-v1.json) rögzítik a referenciákat és az illesztést.
- A portré és a katana rajzfelülete követi a kijelző pixelsűrűségét (legfeljebb 3×), a panel méretaránya változatlan.

A `scripts/test-inventory.cjs` a tárgyakat, kulcsfogyasztást, szünetet, egyéni vezérlést és a korábbi I-kiosztások megtartását ellenőrzi. A látványt, billentyűzetfókuszt, asztali HUD-ot és tényleges böngészős tárolást külön böngészős QA ellenőrzi, legalább 1280×720-as nézetben.

## Tárgyikonok olvashatósága – 0.9.9

Az `ART_INVENTORY.items` a közös ikonkatalógus: tárgyazonosítónként a fordítási kulcsot, képreferenciát és az inventoryhoz illő kivágást tartalmazza. A glória és a szarv itt talapzat nélkül látható; a világban használt képek és kivágások változatlanok. A forrásképek alfáját megőrizzük.

Minden tárgy ugyanazon a rajzolón keresztül, pixelsűrűséghez igazított felbontással (legfeljebb 3×) és teljes rajzolási átlátszatlansággal jelenik meg. Az egységes, sötét kékesszürke ikonhátteret és enyhe fényerő-/kontrasztkiemelést a közös CSS adja. Ez a háttér kijelöléskor és hover alatt is megmarad, a színes tárgyak így elkülönülnek a zsák anyagától.

A tárgy- és fegyverkijelölés csak a keret színét, a belső árnyékot és a hátteret módosítja. A keret vastagsága, a padding, a betűméret és a betűvastagság állandó maradjon: kattintás, hover és billentyűzetes fókusz nem tördelheti újra a nevet, és nem méretezheti át a képet vagy a gombot. Ellenőrzéskor HU/EN asztali nézetben, a támogatott 1280×720-as minimumon és nagyobb ablakban is össze kell hasonlítani a kijelölt/kijelöletlen feliratok méreteit; különösen az „Az esküszegő lelke” és „Soul of the Oathbreaker” nevekkel.

Új tárgyhoz ebbe a katalógusba kell felvenni a grafikát, a kivágást és a HU/EN fordítási kulcsot; külön rajzolóág vagy halványító stílus helyett a közös megjelenítést kell használni. A katalógus minden bejegyzésére automatikusan fut a képhatár-, DPR- és rajzolási alfaellenőrzés. A tényleges olvashatóságot böngészőben is ellenőrizni kell: magyar/angol, 1280×720 és nagyobb asztali nézetben, normál/kijelölt/hover/fókusz állapotban, a teljes tárgysziluettel és olvasható névvel. Asztali nagyítás mellett is maradjon elérhető a görgetés és a billentyűzetes fókusz; a minimum alá csökkent nézet a méretjelzést mutassa.

## Szamuráj útravaló zsák – 0.9.17

A korábbi bőrhátteret indigókék szövet, világos vászonszegély, fonott kötél és vörös csomó váltja. A díszítés a panel szélén marad; a sötét belső felület fölött továbbra is valódi HTML-rács és feliratok jelennek meg, így a tárgylista bővíthető és billentyűzettel kezelhető. A tárgyikonok közös kontrasztos stílusa, a kijelölés és a fókuszkeret megmarad. A megújulás nem ad új tárgyat és nem változtatja meg az inventory vagy a mentés működését.

## Főbossok lélektárgyai – 0.9.19

| Főboss | XP | Extra fejlesztéspont | Lélektárgy |
| --- | ---: | ---: | --- |
| Japán | 250 | 1 | Az esküszegő lelke |
| Yomi | 400 | 1 | Yomi őrzőjének lelke |
| Mennyország | 600 | 1 | A szeráf lelke |
| Árnyékvilág | 800 | 1 | Az őrült pap lelke |

A lélek automatikusan a közös inventoryba kerül. A pontbónusz a szintlépési pontokon felül jár, és a szentélyeknél költhető el. A végső boss titkos formája esetén a jutalom csak a teljes harc végén jár. Az álomprológus és a minibossok nem adnak ilyen jutalomcsomagot.

Fejlesztői részletek: a `BOSS_REWARDS` a `levels.js` közös táblája. A birodalmonkénti `bossRewardClaimed` jelző az egyszeri csomagot és az extra pontkeretet rögzíti; a külön lélektárgy-jelző a birtoklást. A normalizálás és a mentésvalidátor ugyanebből számolja a `szint − 1 + bossbónusz` keretet. A jutalom halál, pihenés, gyorsutazás és azonos kiadáson belüli folytatás után is megmarad. A fejlesztői tárgyadás csak a tárgyat adja, az újraélesztett boss pedig nem ismétli a jutalmat; a fejlesztői szintváltás megőrzi a már elnyert bónuszkeretet.

A három eredeti RGBA kép az `assets/images/ui/` mappában található: `oathbreaker-soul-v1.png`, `yomi-guardian-soul-v1.png`, `seraph-soul-v1.png`. Az `ART_INVENTORY.items` teljes sziluettet őrző kivágásai ugyanazt a DPR- és kontrasztkezelést használják, mint a többi tárgy. A jóváhagyott koncepció és a beépített ImageGen gyártási adatai a [grafikai rekordban](art-prompts/boss-souls-v1.json) szerepelnek.

## Az Alkonyat Pecsétje – 0.9.10

A glória és a démonúr szarva csak a titkos harmadik bossforma végleges legyőzésekor egyesül. Az átváltozás vagy a szokásos kétfázisos győzelem nem adja a jutalmat. A Pecsét új grafikát, HU/EN leírást és egyszer megjelenő győzelmi párbeszédet kapott; statisztikai bónuszt nem ad.

A mentett `flags[2].eclipseRelic` jelző az egyesült ereklyét birtokolja. A két eredeti gyűjtési jelző történeti adatként megmarad, hogy Japánban ne jelenjenek meg újra a felvett tárgyak; birtokolt tárgyként azonban a hátizsák és a HUD csak a Pecsétet mutatja. Halál, visszautazás és azonos kiadáson belüli újratöltés megőrzi. A validátor az utolsó boss legyőzését és a két őrzött ereklye megszerzését is megköveteli.

A katalógus `realm` mezője adja meg a birtoklási jelző birodalmát. Az opcionális `consumedBy: {realm, id}` a felhasznált tárgyat elrejti, így a kulcsfogyasztás és az ereklyeegyesítés ugyanazt a közös inventory-megjelenítést használja. Az új grafika és prompt: `assets/images/ui/eclipse-relic-v1.png`, [generálási adatok](art-prompts/eclipse-relic-v1.json).

A 0.9.11-es kiadástól a lávakígyó egyszer megszerezhető pikkelye (`serpentScale`, Yomi) is megjelenik. A megölt kígyótól automatikusan bekerül a hátizsákba, és a félbemaradt bosskísérlet után is megmarad. A pikkely önmagában nem ad statbónuszt; a japán és mennyei pikkellyel együtt Fuminál egyesíthető, a megmaradó történeti jelző mellett. A közös kontrasztos ikonkatalógust használja; [a harc szabályai](YOMI-BOSS.md).

## Akash portékái – 0.9.21

Az iránytű és a kis útitérkép egyszer megszerezhető úti felszerelés. A sült hús és Akash teája külön `stack:true` bejegyzés, mennyiségük a mentett `meatCount` és `teaCount`; nem puszta küldetésjelző. A kártyán mennyiségjelvény, a részleteknél darabszám és fogyasztógomb jelenik meg. A Q alapú (FR AZERTY: A) `useMeat` közös gyorshasználati billentyű átállítható és exportálható; a részleteknél kiválasztható hozzá hús vagy tea. A `quickHeal` kijelölés mentődik, és kifogyáskor a másik elérhető készletre vált; a leírás az aktuális kötést használja. Az utolsó darab után a kiválasztás/fókusz érvényes tárgyra tér vissza. A közös ikonrenderer minden új portéka eredeti alpha-cropját ugyanolyan kontrasztos, DPR-érzékeny háttéren rajzolja. Részletek: [Akash](MERCHANT.md).

## Árnyékvilág

Az Őrült pap lelke automatikus főbossjutalom. A Megrontott szent ének az opcionális orgonista után vehető fel; a Börtönkulcs a börtönőr után. A kulcs az első börtönnyitáskor elfogy, a nyitás tartós. Mindhárom ikon a közös DPR- és kontrasztkezelést használja. A [pálya és mentés részletei](SHADOW-REALM.md), valamint a [grafikai promptok](art-prompts/shadow-realm-v1.json) tartalmazzák az integrációt.

## Eladás és jelenlegi birtoklás

Akash közelében az eladható kijelölt tárgy eladási gombot kap, külön megerősítéssel. A `quantity` az egyedi megszerzési jelző mellett a `soldItems` listát és az elfogyasztási jelzőket is ellenőrzi. Az eladott tárgy eltűnik, a világ történeti jelzői megmaradnak. A telefontok `trinket` kategória, közös kontrasztos DPR-es ikonrajzolóval. Árak és mentési részletek: [Akash kereskedője](MERCHANT.md#eladás-akashnak).

## Sofiye készletei és Ren fegyverei

Az erdei gyógynövény és a gyógyfőzet az `ART_INVENTORY.items` közös kontrasztos, DPR-követő megjelenítését használja. Készletük a `campServices.herbs` és `campServices.potions` mezőben marad meg. A főzet legfeljebb 3 HP-t azonnal visszatölt, teljes HP-n nem fogy; kiválasztható gyógyító gyorshasználatra, és kifogyáskor a többi elérhető gyógyító tárgyra vált. A tea időzített hatása külön marad.

A birtokolt, de nem felszerelt fegyverek `weapon-<style>` azonosítóval jelennek meg a hátizsákban; az adat a tulajdonlistából származik, nem új questflag. Ikonjuk és valós sebzésleírásuk a közös fegyverkatalógust használja. Felszerelésük nem növeli az aktuális HP-t; a pajzs levétele levághatja a maximális HP feletti részt.

## Három pikkely és talizmánhely

A `whiteSerpentScale`, `serpentScale` és `wingedSerpentScale` három külön védett tárgy. Fumi a misztikus sátorban egyszer egyesíti őket; a történeti megszerzési jelzők megmaradnak, de a fúzió után a felhasznált pikkelyek `consumedBy` feltétele elrejti őket a birtoklási nézetből. A korábbi Yomi-pikkely azonosítója változatlan.

A `triuneSerpentTalisman` új, fegyvertől független felszereléshelyet kap. Felszerelés előtt a táskában látható, viselve a talizmánhelyen; a levétel visszahelyezi a táskába. A `quantity` a felszerelt példányt nem számolja a táskába, a tartós tulajdont a megszerzési jelző őrzi. A +20 Armor kizárólag viselve aktív; fel-/levétel és fúzió nem gyógyít és nem változtatja Momo maximális HP-ját. A külön ikon ugyanazt a DPR- és kontrasztkezelést használja, mint minden más inventorygrafika. Részletek: [SERPENTS.md](SERPENTS.md).

## A karakter aktuális harci értékei

A karakterkártya külön, kontrasztos panelen mutatja Momo aktuális/maximális HP-ját, a felszerelt fegyver normál és erős sebzését, valamint a páncélt és a százalékos sebzéscsökkentést. A számok a tényleges `playerAttackDamage`, `momoStats` és `Armor.reduction` függvényekből származnak; a táskában kijelölt, de nem felszerelt fegyver nem módosítja őket. A talizmán fel-/levétele, a kovácsfejlesztés és a gyógyítás után újrarendereléskor frissülnek. A Tábormester lelke a közös `ART_INVENTORY.items` katalógus része, teljes sziluettel és DPR-követő megjelenítéssel.
