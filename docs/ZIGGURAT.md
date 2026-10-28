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

Az első fázis kaszakombókat, ugrócsapást, oda-vissza rohamot és legfeljebb négy élő, jutalmat nem adó kultista/démon segédet használ. A második fázisban nincs új idézés; az eredeti célzást őrző késleltetett visszhang ismétli a csapásokat.

A két szívásnál a megszakítási cél `max(12, 6 × alap fegyversebzés)`. Haru 50 HP-ja közös a két esemény között. A szívás nyolc másodperces ablakban megszakítható, aktív másodpercenként 4 HP-t vesz el Harutól; sikertelenségkor a teljes harc az eredeti padlóval és első élettel próbálható újra. A normál halál sem vesz el történeti haladást.

Minden idézés, lövedék és visszhang saját próbálkozásazonosítót kap. Kilépés, teleportálás, főmenü és újrapróbálás törli ezeket. A rajzolás nem változtat harci órán. Szünetben, párbeszédben és a minimális nézet alatt megállnak az órák.

## Hajnalkard

Alapgombja F, az `ultimate` akció átállítható. A régi egyéni F-kiosztás megmarad, az új akció szabad gombot kap. Sebzése a közös alap fegyversebzés nyolcszorosa, újratöltése 60 aktív másodperc. A visszahatás közvetlenül 10 HP, legalább 1 HP marad; a páncél és a pajzs nem csökkenti a költséget. A fegyvercsere és helyszínváltás nem nullázza az újratöltést. Az első történeti használat azonnal kész, és lezárja Hannah harcát. A képesség nem kap külön szentélyes fejlesztést.

## Mentés és dev mód

A `dawnblade` mérföldkő az ébredés után megmarad. A `hannahDefeated` és `guardian:Hannah` együtt jelzi a győzelmet; az egyszeri jutalom 1600 XP és egy fejlesztéspont. A `hannahFiaRescue` a megmentés történeti ágát őrzi, Fia későbbi sorsától függetlenül. A mentés nem tartalmaz félbehagyott támadást, padlóemelést, boss-HP-t vagy szívási órát. Félbehagyott harc a bejárattól újrakezdhető.

Fia akkor segít, ha megmentettük, az arénát és talizmánküldetését befejeztük, és életben van. Más esetben a villám szabadítja ki Harut. A folytatás nyitott marad a zikkuratnál; nem állítunk be végleges játéklezárást.

A dev-teleport mindhárom pályát és pihenőit ismeri. A képességadó listában szerepel a Hajnalkard, a bossújraélesztő visszaállítja az ép arénát. A visszajátszás nem ad történeti jutalmat és nem írja a normál mentést. A kompatibilitási korszak változatlan marad.

## Grafikai regisztráció és ellenőrzés

`python scripts/register-hannah-art.py` generálja a képkockák kivágását, kontúrját és talppontját, a forrásképek alfájának módosítása nélkül. A `--check` ellenőrzi az eredményt. A fegyver vagy szárny kiterjedése nem változtatja a testméretet. A rituális lap hibás második forráspóza nincs regisztrálva és nem jelenik meg; az eredeti kép megmarad.

`npm run test:hannah` futtatja a fázis-, útvonal-, ultimate-, életciklus- és mentésteszteket, többek között 30/60/120 FPS mellett. A böngészős megjelenítés és IndexedDB-újratöltés ettől külön ellenőrzés.
