# Végtelen torony

A főmenüből indítható külön kihívás a meglévő mozgást, fegyvereket, bossokat és kísérő ellenfeleket használja. A torony festett hátterén a kijelölt lángok és ablakködök a közös háttéranimációs rendszerrel változnak; szünetben megállnak, csökkentett mozgásnál az eredeti kép látszik. A kaland felszerelése és fejlődése nem kerül a futamba: az indulás 20 alap HP, a három kezdő fegyver egyike, dupla ugrás és szellemlépés. A kard–pajzs saját +2 HP-ja és elülső védése megmarad.

## Futam és checkpoint

- Egy emelet akkor teljesített, ha minden ellenfele meghalt. A következő emelet külön gombbal indul; az emeletközi képernyőn az idő áll.
- Normál teljesítés 2 HP-t gyógyít. Minden ötödik teljesített emelet teljesen gyógyít és checkpointot ír; az indulás egy külön, nulladik visszatérési pont.
- Halál, lezárás vagy újratöltés után a checkpointot követő első emelet teljes HP-val indul. A checkpoint óta eltelt részleges blokk harca újrajátszandó, a rekord viszont megmarad.
- A rekord a teljesített emeleteket hasonlítja először, majd az ellenfelek számát, végül a rövidebb aktív játékidőt. Új futam a checkpointot törli, a rekordot megtartja.

## Modulok

`tower-rules.js`: tiszta, determinisztikus emeletgenerátor és futamszabályok. A seed és az emeletszám választja az ellenfeleket. Számuk 3-ról legfeljebb 8-ra nő, HP-juk és sebzésük folyamatosan skálázódik; az első emelettől egy boss, a 11.-től kettő, a 26.-tól három harcol kísérőkkel. A bossok a régi ellenfélslotokat váltják fel, ezért a checkpointok pontos történeti legyőzésszámai érvényesek maradnak. A témák öt emeletenként váltanak. A számlálók végesek és biztonságos számhatárok között maradnak.

`tower-mode.js`: a közös harci motor elkülönített vezérlője. A közös játékos-időzítők egyszer, a fő ciklusban lépnek, a torony pedig saját emeletet, ellenfeleket, lövedékeket és UI-t futtat. Szünetben, dialógusban, emeletközi képernyőn és túl kicsi nézetnél nem lép a futamóra. A toronyban nincs XP-, érme- vagy kalandjutalom, inventory-, fejlesztés-, gyorsutazás- vagy dev-mód belépés. Kilépéskor a kaland korábbi mentéspéldánya tér vissza; a rendes Folytatás a normál betöltési útvonalat használja.

`tower-store.js`: külön `kiba-infinite-tower-v1` helyi rekord. A sémában checkpoint, legjobb és utolsó eredmény van; a checkpoint seedet, fegyvert, teljesített emeletet, ellenfélszámot és aktív időt rögzít. A modul nem olvassa vagy írja a kaland titkosított SaveVault-rekordját, profilját vagy preferenciáit. Sérült/jövőbeli rekordot nem ír felül; tárolási hiba esetén memóriában folytatja, látható figyelmeztetéssel. Másik futam seedjével a régi lap nem írhat checkpointot. A rekord helyi, játékos által vezérelt adat, nem szerver által hitelesített ranglista.

## Ellenőrzések

A futam kilépésgombjai és a szünetmenü főmenügombja megerősítést kérnek. Az ablak az aktuális checkpoint utáni emeletet és a rekordot mutatja; megnyitása megállítja a futam óráját és törli a lenyomott bemeneteket. A Mégse az előző állapotot állítja vissza. A fókusz alapból a megszakítás visszavonásán van, a végleges kilépés 400 ms-ig tiltott, így a harcból érkező ismételt kattintás nem zárja le véletlenül a futamot. A ranglista saját Escape-kezelése továbbra is csak a ranglistát zárja be.

- `test-tower-rules.cjs`: determinisztikus emeletek, nehezedés, gyógyítás, checkpoint és hibás adatok.
- `test-tower-store.cjs`: újratöltés, új futam, rekordmegőrzés, elavult lap, hibás/jövőbeli rekord és tárolási hibák; a kaland kulcsai változatlanok.
- `test-tower-mode.cjs`: három felszerelés, közös mozgás/harc, kalandmentés-írás tiltása, halál/checkpoint, szünet és 30/60/120 FPS melletti dash/gravitáció.
- Valódi böngésző: friss szintetikus profil, a kaland titkosított rekordjának összehasonlítása, ötödik emeleti checkpoint, halál/folytatás, tényleges újratöltés, HU/EN és asztali nézetméretek. A felgyorsított checkpoint-próba nem bizonyít teljes nehézségi végigjátszást.

## Bossválaszték és skálázás

A seedhez rögzített hétlépéses forgó választék: fogoly kultista kapitány, az utolsó őrség kapitánya, kultista templomőr, megkínzott kétfejű kígyó, sebesült angyal fanatikus, a Négy Tanácsos és Fia küklopsz testőrei. Az utóbbi közös bossként két önálló testet használ. A történeti arénához, rituáléhoz, idézéshez vagy különleges terephez kötött többi találkozás nem szerepel a választékban.

A bossok saját, már meglévő animációi, támadásai, őrzése és előjelzései maradnak. Toronybeli alap HP-juk 32–48, emeletszorzójuk `1 + (emelet−1) × 0,1`. A sebzés a saját támadás alapértékének `0,5 + (emelet−1) × 0,0125` része; a mozgás és a támadási óra szorzója `1 + min(0,6; (emelet−1) × 0,0125)`. A sebesség így legfeljebb 1,6-szoros. A lövedékek sebzése és sebessége kilövéskor egyszer skálázódik, hatótávjuk megmarad. A bossok közös dungeon-/arénavezérlőjének toronyága kihagyja a történeti győzelmi callbacket; nincs XP, érme, relikvia vagy küldetésjelző.

A `test-tower-bosses.cjs` minden kiválasztott boss valódi támadásait, közös közelharci találatát, külön jutalomkezelését, a 26. emelet három párhuzamos bossát, szünetet és a régi checkpointok legyőzésszámait is ellenőrzi.

## Közösségi ranglista

A torony menüje és eredményképernyője külön online ranglistát nyit. Csak megnyitáskor kér listát, anonim Supabase-fiókot pedig csak kifejezett eredménybeküldéskor hoz létre. A felhasználó választott neve mellett a helyi legjobb eredményt küldi el. A kiszolgáló játékosonként egy rekordot őriz: több teljesített emelet, majd kevesebb aktív ezredmásodperc a jobb. A helyi rekord korábbi ellenfélszám szerinti köztes rendezése megmarad; a két lista eltérhet.

A kliens `tower-leaderboard-api.js` modulja natív fetch-et használ; nincs új böngészős npm-függőség. A `tower-leaderboard.js` a HU/EN felületet, fókuszt és aszinkron állapotokat kezeli. Az `assets/config/leaderboard.json` nyilvános projekt-URL-t és a telepítéskor generált kulcsfájl relatív útvonalát tartalmazza. A publishable kulcs nem része a Git-forrásnak vagy a runtime-nak: helyi környezeti változóból, illetve GitHub Actions repository variable-ből készül az ignorált `assets/config/leaderboard-public.json`. A böngésző ezt a ranglista használatakor olvassa; a kulcs a telepített oldalon szükségszerűen nyilvános. Hozzáférést a SQL-grantok, az auth.uid() és az RLS ad. Titkos vagy service-role kulcs nem kerül a játékba.

A belépési és frissítési tokenek külön projektazonosítós böngészőtárolóban élnek; nem részei a TowerStore vagy a SaveVault rekordjának. Hálózati hiba nem töröl identitást, rekordot vagy kalandot. Böngészőadat-törlés és másik eszköz új játékosazonosítót jelent. A nevek nem egyediek és nem igazolják a személyazonosságot.

A backend fájljai és a Dashboard telepítési lépései: [supabase/README.md](../supabase/README.md). A ranglista játékosok által beküldött közösségi adat, nem hitelesített harci visszajátszás. A SQL a tárolási határokat és a percenkénti beküldést ellenőrzi, de a módosított kliens hamis pontját nem képes felismerni. A schema első verziója `tower-v1`; egy későbbi lényeges egyensúlyváltáshoz külön szezonterv szükséges. Az anonim fiókok tömeges létrehozásának megfogásához külön CAPTCHA-integráció bővíthető.

Ellenőrzés: `test-tower-leaderboard.cjs` a klienskéréseket, identitásújrahasználatot, hibákat és mentésizolációt ellenőrzi; `test-leaderboard-backend.cjs` mockolt Auth/REST mellett futtatja az Edge handlert. A böngészős felület HU/EN, 1280×720 és nagyobb asztali nézetben, fókusz- és minimumfelbontás-próbával ellenőrizhető. A valódi Supabase SQL és telepített funkció külön élő ellenőrzés, helyi mock nem bizonyítja.
