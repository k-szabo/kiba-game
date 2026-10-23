# Kezdő fegyverstílusok

Új játék előtt Momo három fegyverstílus közül választhat. A választás az adott végigjátszásra szól; a visszalépés nem módosítja a mentést. A normál és erős támadás a meglévő, átállítható műveletet használja.

| Stílus | Harci profil |
| --- | --- |
| Katana – ügyesség | A támadás hossza, találati időpontja és újratöltése az alapérték 85%-a. |
| Naginata – erő | 1,25× sebzés, 180 egység széles találati terület a kard 125 egysége helyett; az időzítések 1,3× hosszúak. |
| Kard és pajzs – állóképesség | +2 maximális HP. A pajzs talajon, támadáson és dashen kívül elölről legfeljebb 1 sebzést fog fel, majd 2 másodpercig töltődik. |

Az életerő-, erő- és szellemfejlesztések közösek maradnak. A naginata szorzója a fejlesztett alapsebzésre is érvényes; Yomi őrzőjének legyőzése mindhárom stílus sebzését javítja. A pajzs nem véd lávától, környezeti veszélyektől és lezuhanástól. A prológus Árnyékjának kötelező vereségét nem akadályozza meg.

## Források és állapot

- `assets/js/weapons.js`: változtathatatlan profilok, közös támadásidőzítés, tükrözött találati terület és pajzsfeltételek.
- `assets/js/weapon-selection.js`: rádiógombos HU/EN választó; nyilak, Home/End, Tab és Escape. Az Indulás hívja a `startGame(false, selectedStyle)` függvényt.
- `assets/js/game.js`: a végigjátszáshoz tartozó `weaponStyle`; a karakter újrainicializálása csak a pajzs átmeneti újratöltését törli.
- `assets/js/save-vault.js`: kizárólag saját, szöveges `katana`, `naginata` vagy `swordShield` értéket enged. Nincs régi verziós mentésmigráció.
- `assets/js/dev-session.js`: a tesztmenet a normál választás másolatával indul; a tesztben végzett változtatások nem kerülnek a normál mentésbe.
- `scripts/test-weapon-profiles.cjs`, `scripts/test-starter-weapons.cjs`: a profilok, valódi harci találatok, halál/ébredés/pályaváltás, pajzs és dev elkülönítés ellenőrzése.
- `scripts/test-save-release.cjs`: mindhárom stílus titkosított mentése és visszatöltése, hibás értékek és verzióváltás elutasítása.

A pajzs újratöltése a közös játékosórával lép, szünetben és párbeszédben áll. A gyorsabb vagy lassabb támadások animációideje a közös alapidőre normalizálódik, így a találat és a csapás képe együtt mozog.
