# Zen és a börtön mélye

A [Trello-kártya](https://trello.com/c/y5Vq6UtU) az Árnyékvilág opcionális börtönágát bővíti. A külső kultista börtönőr és az egyszer használatos börtönkulcs megmarad; a nyitott kapunál újabb interakció visz a külön belső pályára. A főúton lévő Haru-nyom és a pap továbbra is elérhető a teljes börtönág nélkül.

## Helyszín és belépés

A shadowPrison 5400×2720 világ-egységes oldalhelyszín a negyedik birodalomhoz tartozik, nem egy ötödik világ. A SIDE_LOCATIONS katalógusban realm=3, requiredFlags=[prisonOpen], requiresRealmBoss=false: az Őrült pap legyőzése nem előfeltétel. Az általános tábori belépési segéd a katalógus szerinti birodalmat használja; Japán korábbi oldalhelyszíneinek feloldása változatlan.

A bejárat a meglévő külső kapunál van, a visszaút a börtönelőcsarnokban. Belépés és visszatérés megőrzi az aktuális HP-t; gyógyítás a szentélynél, halálkor vagy szabályos gyorsutazáskor történik. Az érkezés a közös initPlayer útvonalon törli a dash, ugrás, támadás, sebesség és gravitáció régi átmeneti állapotát. A fő talajszintek 1000/1080/1040; a két rés és a visszaút egyszeres ugrással járható, az emelt cellasorok opcionális útvonalak.

A felső szárny két pihenőhelye shadowPrisonEntrance és shadowPrisonCourt; a Fia megmentéséhez vezető mélyebb szárnyban a shadowPrisonDepths egészíti ki őket. A bővítés részletei a [Kitsune-referenciában](KITSUNE.md) találhatók. Felfedezésük visitedRests[3]-ba kerül. Normál gyorsutazásnál a meglévő árnyékoltár-zár érvényes; a pálya puszta felkeresése nem aktiválja az oltárt. A belső őr külön miniboss, a főbirodalmi boss csak inaktív helyettesítő.

## Harc és megmentés

A normál ellenfelek között a negyedik világ kultistái és külön rajzolt élőhalott foglyok szerepelnek. A belső pálya enemyRealm=3 jelölése biztosítja a negyedik világ HP-, sebzés- és XP-szorzóit; a Japánhoz tartozó régi oldalhelyszínek egyensúlya megmarad.

A PrisonWarden önálló, 150 HP-s miniboss. Állapotai wait → windup → strike → recover. A láncos söprés 1 másodperces, a lámpáslövedék 1,2 másodperces, a három talajkitörés 1,3 másodperces előjelzést kap. A cél és az irány az előkészítéskor rögzül. Fél HP alatt a három lövedék helyett öt érkezik, és a visszaállás 0,9-ről 0,65 másodpercre rövidül. A rajzolás nem lépteti ezeket az órákat. Az entitás és a játékos cseréjét minden halált okozó találat után újra ellenőrzi.

Az első győzelem guardian:prisonWarden jelzőt, 180 XP-t és a közös miniboss-érmejutalmat adja. A jutalom és a jelző a narráció előtt rögzül; újrajátszás nem duplikálja. A kulcs a külső őrhöz tartozik, a belső őr nem ad új kulcsot.

Zen cellája a börtönnagy legyőzése után külön interakcióval nyitható. A zenRescued jelző a párbeszéd előtt rögzül. Zen ezután eltűnik a cellából, és az erdei menedék szentélye mellett jelenik meg. Momo gyerekkori barátja, nyíltan szeretetteljes, belé szerelmes csaucsau papnő. A szentélyt gondozza és imádkozik; a későbbi saját küldetések ebben a verzióban még nincsenek megírva, ezért nincs megtévesztő küldetésjelölése.

## Mentés és tesztmód

A két tartós jelző flags[3]-ban van. Az érvényes lánc: külső őr legyőzése → kapunyitás → belső őr legyőzése → Zen megmentése. Azonos kiadású újratöltés, halál, pihenés és utazás őrzi a haladást. A normál ellenfelek halálkor/pihenéskor visszatérnek, a legyőzött börtönnagy és a kiszabadított Zen nem áll vissza. A mentésvalidátor tiltja a hiányzó előfeltételt, a hamis pihenőkoordinátát, a hibás birodalmat és a korábbi kiadás mentését. Alfa/béta alatt az új kiadás továbbra is haladásresetet jelent, nyelv és gombkiosztás megtartásával.

A fejlesztői teleport a közös oldalhelyszín-katalógusból automatikusan listázza a börtönt és mindkét érkezési pontot. Tesztmódban kulcs, külső őr és főbossgyőzelem nélkül kipróbálható. A Boss újraélesztése a belső őrt külön listázza; a replay jelző megakadályozza a jutalom és a történeti haladás megváltoztatását. A tesztmód nem ír normál mentést.

## Forrás és ellenőrzés

- levels.js: pályák, ellenfelek, Zen tábori pontja és oldalhelyszín-regisztráció.
- prison-quest.js: helyi célok, kapu, visszaút, cella és jelenetek.
- prison-warden.js: harc és egyszeri jutalom.
- prison-art.js: natív képlapok, fázishoz kötött pózok, környezet és közös támadásjelzések.
- test-prison-warden.cjs: 30/60/120 FPS-es előjelzés, sebzés, kitérés, erősödés, szünet és stale/death védelem.
- test-prison-quest.cjs: tényleges fegyvertalálat és interakció, megmentés, halál/pihenés/folytatás, tábor, dev replay, egyugrásos oda-vissza út és mozgásképesség-kombinációk.
- test-prison-saves.cjs: szintetikus mentésvalidáció a részleges és kész történeti állapotokkal.

A VM-tesztek mellett friss böngészőprofillal kell ellenőrizni a grafikát, a HU/EN párbeszédet és az IndexedDB újratöltését; egy beállított képkocka nem teljes végigjátszás.

A börtön saját, natív RGBA feketekő-/bronzszegélyes talajatlaszt használ. A járható felső elemek és az alsó falazat képaránya megmarad: a mély talajtest ismételt téglatextúrából áll, a lebegő párkány teljes sziluettje egyenletes léptékű. A source surfaceY pontosan az eredeti ütközési felületre kerül; más birodalmak továbbra is a korábbi anyagaikat használják. A talajatlasz eredete: [prompt és regisztráció](art-prompts/zen-prison-terrain-v1.json).

Zen aktuális képlapja a `zen-priestess-v2.png`: Momo rajzos, festett világához igazított csaucsau papnő, négy változatlan rendeltetésű pózzal. A `ART_PRISON.zen` rögzített testméretet és képkockánként ellenőrzött talpillesztést használ; a megmentés, személyiség és játékmenet változatlan. A grafika eredete: [prompt](art-prompts/zen-priestess-v2.json).
