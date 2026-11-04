# Haru hazavezető útja

A [Trello-kártya](https://trello.com/c/fNyKT8NN) Hannah történeti legyőzése után folytatja a fő történetet. A trónteremben Haruval végiglapozott beszélgetés indítja a követést. A zikkurat belsejének alsó pihenőjénél, `(2350,2420)` helyen nyílik a `zigguratDepths` külön pálya. A sárkányrajtaütés bejárata külön marad.

## Állapot és útvonal

- `ziggurat-descent-rules.js`: másolással dolgozó mérföldkövek és mentési sorrendvalidálás.
- `ziggurat-descent-maps.js`: két regisztrált oldalhelyszín, `zigguratDepths` a harmadik indexű birodalomban, `japanHeights` Japánban. A japán célpont `flagRealm:3` alapján kap jogosultságot.
- `ziggurat-descent.js`: párbeszédek, interakciók, portál, célok, egyszeri jutalom és Haru átmeneti állapota.
- `haru-follower.js`: talajhoz igazított, platformgráfot követő mozgás, 78 világpixel távolsággal; nincs önálló harc vagy sebződés.
- `ziggurat-gatekeeper.js`: 2200 HP-s portálőr, söprés, szúrás, célzott lövedéklegyező és előre jelzett talajkitörés. Fél életerő alatt gyorsabb és sűrűbb támadások.
- `ziggurat-descent-art.js` és `ziggurat-descent-art-data.js`: olvasó grafikai réteg és eredeti alfás képlapregisztráció.

A mélységi út 31, egymást részben fedő 80 pixeles lépcsőn vezet le. Az alsó aréna padlója Y=2920; a visszaút egyszeres ugrással is bejárható. Haru mozgását a fő ciklus egyszer lépteti, a rajzolás csak pillanatképet olvas. Szünetben, párbeszédben és betöltéskor mindkét mozgás és az animáció órája áll. Helyszínváltáskor és újraéledéskor Haru a játékos ismert, biztos talaján indul újra. A befejező beszélgetés után a japán találkozási ponton marad.

Aktív kapuőrharc lezárja az aréna szélét, a helyi visszautat és a gyorsutazást. A portál csak a győzelem után használható. A győzelem egyszer 1800 XP-t és egy fejlesztéspontot ad; dev visszajátszás nem ad történeti jelzőt vagy jutalmat. A japán oldalon egy további Haru-beszélgetés zárja az aktuális történeti szakaszt, a bejárható világok megmaradnak.

## Mentés

A harmadik indexű világ jelzői sorrendben:

1. `zigguratDescentAccepted` — Haru megbízása befejeződött.
2. `zigguratGateCleared` és `guardian:VoidGatekeeper` — együtt, egyszeri győzelem.
3. `japanHeightsReached` — átlépés a japán célhelyszínre.
4. `zigguratReturnCompleted` — az érkezés utáni beszélgetés.

A korábbi mentéseknek egyik új jelzőre sincs szükségük. Az új jelzők Hannah győzelmét, a Hajnalkardot és a helyes megelőző mérföldköveket igénylik. A kapuőr pontosan egy ponttal növeli a validált fejlesztéspontkeretet. A követő pozíciója, támadások, boss-HP és fázisórák nem részei a mentésnek. Az új pihenők és a japán helyszín pontos checkpoint-ellenőrzést használnak; a kompatibilitási korszak változatlan.

## Fejlesztői integráció és ellenőrzés

A helyszínek a közös `SIDE_LOCATIONS` / `realmRests` katalógus miatt szerepelnek a dev teleportban. A bossválasztó a mélységi helyszínen visszajátszhatja a kapuőrt. Az internal boss classification JSON külön fő bossként sorolja fel.

`npm run test:ziggurat-descent` ellenőrzi a követést, Momo egyszeres ugrásos visszaútját, a teljes történeti útvonalat, az arénazárat, az egyszeri jutalmakat, a japán helyszínre váltást és a szigorú mentési sorrendet. A mozgás és harc 30/60/120 FPS ellenőrzést is kap. A VM-tesztek különböznek a valódi böngészőben végzett grafikai és titkosított mentési ellenőrzéstől.

A `register-descent-art.py --check` a két hatpózos atlasz eredeti alfáját, teljes képkockáit és talppontregisztrációját ellenőrzi. A script nem írja át a forrásképeket. [Grafikai eredet](art-prompts/ziggurat-descent.md).

## Rögzített ellenőrzési eredmény

A `0.9.69_1e6d43a0` kiadás előkészítésekor mind a 212 csomagellenőrzés sikeres volt. A teljes kör után a számszerű kapuőr-HP integrációja külön történeti/HUD-tesztet és friss build-/statikus ellenőrzést kapott. A colormapok és atlaszmetaadatok aktuálisak.

Friss Edge-profilban, `/kiba-game/` alútvonalon ellenőriztük a tényleges billentyűzetes beszélgetés-/portálinterakciókat, Haru mozgását és szünetét, a magyar/angol felületet 1280×720 és 1920×1080 méretben, a csökkentett mozgást és a minimum alatti játékfagyasztást. A Japánban készített titkosított mentés valódi újratöltés és Folytatás után ugyanarra a helyszínre állt vissza. Nem volt oldalhiba vagy hibás statikus kérés. A történeti előfeltételek, néhány helyezés és az egy HP-sra állított tesztboss helyi, csak tesztkiszolgáláskor befűzött seamen át készült; ez nem teljes, segítség nélküli harci végigjátszás. A screenshotok és a részletes JSON-jelentés az ignorált munkamappában maradnak.
