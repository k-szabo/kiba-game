# Összemosódott zikkurat

A negyedik birodalom folytatása három `SIDE_LOCATIONS` helyszín: `zigguratApproach`, `zigguratInterior`, `zigguratSummit`. A fizikai bejutás egyetlen feltétele az őrült pap legyőzése. Fia megmentése, a börtön és a két mozgásképesség opcionális; a fő út és az alsó ág visszaútja egyszeres ugrással is bejárható.

## Modulok

- `ziggurat-maps.js`: pályaépítő; a `levels.js` regisztrálja a pályákat és a pihenőket. A dev-teleport ugyanebből a katalógusból dolgozik.
- `hannah-rules.js`: módosíthatatlan egyensúly és tiszta sebzési/fázisküszöb-szabályok.
- `hannah-combat.js`: entitáshoz kötött harc, idézett ellenfelek, rögzített célzású támadások és Kiba-visszhangok.
- `hannah-encounter.js`: útvonalak, párbeszédek, emelkedő padló, újrapróbálás és tartós történeti mérföldkövek.
- `dawnblade.js`: fegyverstílustól független ultimate, egyszer léptetett aktív játékidővel.
- `hannah-art.js` és a generált `hannah-art-data.js`: hátterek, natív alfás képkockák és olvasási műveletként működő rajzolás.

## Harc és életciklus

Hannah első élete 1200, második élete 1600 HP. Az első 10%-os küszöbnél teljes életre töltődik. A második élet 60%, 40%, majd 10% küszöbét sorban kezeli; a túl nagy találat fölös sebzése nem ugorhat át történeti eseményt. A gyógyulás nem aktivál újra már elfogyasztott küszöböt.

Az első fázis kaszakombókat, ugrócsapást, oda-vissza rohamot, négycsapásos váltott kombót és három lépcsőben feltörő területi mágiát használ; idézéssel legfeljebb négy élő, jutalmat nem adó kultista/démon segédet tart fenn. A második fázisban nincs új idézés; az eredeti célzást őrző késleltetett visszhang a forráscsapás sebzésének 80%-ával ismétli a támadást.

A támadási ablakok közös táblájából készül a tényleges találat és az előjelzés; a jelzés a későbbi, hosszabb kombócsapásokat és a visszatérő roham teljes söprését is lefedi. A visszaút és a visszhang kivárja a játékos érvényes sérthetetlenségi idejét; az elutasított kontaktus nem fogyasztja el a találatot, a teljesen elnyelt, de elfogadott pajzstalálat igen. Aktív harcban az aréna határai a játékos mozgása után is érvényesülnek, a kifelé mutató sebesség megszűnik.

A két szívásnál a megszakítási cél `max(12, 6 × alap fegyversebzés)`. Haru 50 HP-ja közös a két esemény között. A szívás nyolc másodperces ablakban megszakítható, aktív másodpercenként 4 HP-t vesz el Harutól; sikertelenségkor a teljes harc az eredeti padlóval és első élettel próbálható újra. A normál halál sem vesz el történeti haladást.

Minden idézés, lövedék és visszhang saját próbálkozásazonosítót kap. Kilépés, teleportálás, főmenü és újrapróbálás törli ezeket. A rajzolás nem változtat harci órán. Szünetben, párbeszédben és a minimális nézet alatt megállnak az órák.

## Hajnalkard

Alapgombja F, az `ultimate` akció átállítható. A régi egyéni F-kiosztás megmarad, az új akció szabad gombot kap. Sebzése a közös alap fegyversebzés nyolcszorosa, újratöltése 60 aktív másodperc. A visszahatás közvetlenül 10 HP, legalább 1 HP marad; a páncél és a pajzs nem csökkenti a költséget. A fegyvercsere és helyszínváltás nem nullázza az újratöltést. Az első történeti használat azonnal kész, és lezárja Hannah harcát. A képesség nem kap külön szentélyes fejlesztést.

## Kiszabadítás és látható befejezés

A második fázis utolsó küszöbe előbb a kiszabadítás bevezetőjét nyitja meg, majd 3,6 aktív másodperces jelenetet játszik le. Haru 1,8 másodpercig az oszlopon marad, csak ezután szabadul ki; az ébredési párbeszéd alatt is szabad marad. A megemelt padlóhoz igazított Momo ugyanazon a talajon áll. A korábban vagy dev módban megszerzett Hajnalkard sem ugorhatja át ezt a jelenetet.

Az ébredés párbeszédének bezárása után használható a történeti végső csapás. Az ultimate hatása 0,55 másodpercnél érkezik; a győzelem nem nyit rögtön párbeszédet, hanem további 0,8 aktív másodpercet hagy a látható becsapódásnak és visszaállásnak. Csak ezután áll vissza a padló és nyílik meg a nyitott folytatás. Szünet és más panel megállítja ezeket az órákat.

## Mentés és dev mód

A `dawnblade` mérföldkő az ébredés után megmarad. A `hannahDefeated` és `guardian:Hannah` együtt jelzi a győzelmet; az egyszeri jutalom 1600 XP, egy fejlesztéspont, `demonLordSoul` és `demonLordHeart`. A `hannahFiaRescue` a megmentés történeti ágát őrzi, Fia későbbi sorsától függetlenül. A mentés nem tartalmaz félbehagyott támadást, padlóemelést, boss-HP-t vagy szívási órát. Félbehagyott harc a bejárattól újrakezdhető.

A korábbi, kompatibilis Hannah-győzelemhez a következő birodalomba lépéskor a hiányzó lélek- és szívtárgyjelzők pótlódnak, újabb XP vagy pont nélkül. A tárgyakhoz kötelező az érvényes Hannah-győzelem; a szív átadási jelzőjéhez a szív történeti birtoklása és Fia korábbi megmentése is szükséges. Eladás vagy átadás nem törli a megszerzés történetét.

Fia akkor segít, ha megmentettük, az arénát és talizmánküldetését befejeztük, és életben van. Más esetben a villám szabadítja ki Harut. A folytatás nyitott marad a zikkuratnál; nem állítunk be végleges játéklezárást.

A segítő Fia a trónteremben a győzelem után is látható. A démon lord szíve a közelében egyszer átadható; a lakosztályában, illetve az arénagyőzelem előtti tábori helyén is elérhető ugyanez az interakció. A `demonLordHeartGiven` elrejti a tárgyat az inventoryból. Ha Fia később meghal, az egykori segítség története megmarad, de a tróntermi élő megjelenése és az átadás megszűnik.

A felső belső szentély (`zigguratInteriorUpper`) a kaputól balra, `(820,440)` helyen áll. A validátor kizárólag a korábbi `(1500,440)` checkpointot fogadja el régi változatként, ugyanazzal a helyszínnel és szentélyazonosítóval; a másolt, normalizált mentésben az új koordinátát adja vissza. Más ismeretlen koordináták továbbra is hibásak, a kompatibilitási korszak nem változik.

A dev-teleport mindhárom pályát és pihenőit ismeri. A képességadó listában szerepel a Hajnalkard, a bossújraélesztő visszaállítja az ép arénát. A visszajátszás nem ad történeti jutalmat és nem írja a normál mentést. A végső találat után ugyanúgy kivárja a 0,8 másodperces látható visszaállást, majd párbeszéd nélkül visszaállítja a padlót és a kamerát. A kompatibilitási korszak változatlan marad.

## Grafikai regisztráció és ellenőrzés

`python scripts/register-hannah-art.py` generálja a képkockák kivágását, kontúrját és talppontját, a forrásképek alfájának módosítása nélkül. A `--check` ellenőrzi az eredményt. A fegyver vagy szárny kiterjedése nem változtatja a testméretet. A rituális lap hibás második forráspóza nincs regisztrálva és nem jelenik meg; az eredeti kép megmarad. A járási ciklus a tiszta, kétkaros fogású forráspózokat használja, nulla alapú sorrendben `[0,2,4,5,2,4]`; ez tudatos képkockaválogatás, nem a hibás forrásrajzok átfestése.

Haru külön idősebb shiba-grafikát használ a mennyországban, a zikkuratban és a párbeszédportrén. Az oszlop, a lélek és a szív önálló grafika; az inventory a közös kontrasztos, DPR-követő katalógust használja. A Hajnalkard képkockái a valódi játékoskoordinátákból rajzolódnak; betöltetlen animáció esetén Momo alaprajzolása marad. A grafikai eredet és jóváhagyási határok: [Hannah-javítások](art-prompts/bugs-hannah-realm.md).

`npm run test:hannah` futtatja a fázis-, útvonal-, ultimate-, életciklus- és mentésteszteket, többek között 30/60/120 FPS mellett. A böngészős megjelenítés és IndexedDB-újratöltés ettől külön ellenőrzés.
