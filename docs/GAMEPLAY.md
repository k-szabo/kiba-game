# Kiba: Három világ · 0.8

Böngészős 2D metroidvania Momo eredeti animációival. A kis shiba szamuráj három eltérő felépítésű világon át keresi édesapját, Harut. A Kiba az összes világot átszövő energia: tápláló, gyenge, torzult vagy különösen erős áramlatait a felső kijelző és a környezeti fények mutatják.

## Indítás és frissítés

A 0.8 csomagban az **index.html** indítja a játékot, a mellette található **assets** mappával együtt. GitHub Pagesen vagy helyi HTTP-kiszolgálón játszható mentéssel. A korábbi külön csomagolt HTML még a 0.2 változatot tartalmazza.

Új végigjátszáshoz válaszd **Az utazás kezdetét**. A **Folytatás** megőrzi a régi képességeket, legyőzött őrzőket és lélektöredékeket, de a 0.1 változat helykoordinátái helyett az adott új birodalom bejáratához helyez. A 0.2 és 0.3 mentések közös pihenőhelyeket használnak; a grafikai frissítés miatt nem kell új játékot kezdeni.

Frissítéskor a csomag teljes tartalmát ugyanott cseréld le. A mentések böngészőnként és címenként különböznek; a fájlokhoz tartozó helyi tárolás viselkedése a böngészőtől függ.

## Három eltérő kaland

Az új játék egy külön, néma árnyvilágban indul. A prológusban mozgással, ugrással és karddal haladhatsz; nincs térkép, pihenőszentély vagy fejlesztés. A történet innen vezet a japán falut ért támadáshoz. Ugyanazon verzión belül a Folytatás visszatölt; új alfa/béta verziónál a haladás törlődik és újra a prológusban kezdhetsz. [A prológus részletes leírása](PROLOGUE.md) a történeti lezárását is tartalmazza lenyitható részben.

| Világ | Felépítés | Fő feladat | Mellékutak |
| --- | --- | --- | --- |
| Japán | 10 400 széles, 3 600 magas játéktér | Szerezd meg a szél áldását, szólaltasd meg az erdei és falusi harangot, majd keresd fel a bambusztemplom őrzőjét. | Lombkorona, folyó fölötti út, föld alatti folyójárat, visszavezető lépcsők és a felhők fölé rejtett ősi angyaltorony. |
| Yomi | 3 300 széles, 6 250 mély játéktér | Ereszkedj le a két fogoly lélekhez, győzd le őreiket, majd a világ fenekén az őrzőt. Az árnyék szentélye félúton ad szellemlépést. | Elfeledett sírkamra, árnyékfüggöny, veszélyes hamupárkányok. |
| Takamagahara | 3 200 széles, 6 650 magas játéktér | Szélfolyamokkal, felhőszigetekkel és ugrásokkal emelkedj az őrzőhöz. A végső pecsétet karddal törd fel. Az apa még az őrző fölött vár. | Mozgó felhőplatformok, pecsét mögötti emlék, távoli alsó felhősziget. |

Japán 2,6-szor szélesebb az előző változatnál; az ősi angyaltorony külön, felfelé vezető szakaszát a fő útról nem lehet belátni. Yomi és az ég több mint nyolc képernyőnyi függőleges pályateret kapott. A kamera mindkét tengelyen követi Momót.

## Irányítás

| Billentyű | Művelet |
| --- | --- |
| A / D, bal / jobb nyíl | Mozgás |
| Space, W, fel nyíl | Ugrás |
| Space → felengedés → újra Space | Kettős ugrás a szél áldása után |
| S + Space | Leugrás a kő- vagy felhőpárkányról |
| J vagy Z | Kardcsapás; a hajnalkarddal pecsétek feltörése |
| K vagy Shift | Szellemlépés az árnyék szentélye után |
| E | Harang, lélek, emlék, szentély, torii, apa |
| U / Fejlesztés gomb | Fejlesztéspontok elköltése a pihenőszentélynél |
| M | Térkép és gyorsutazás az ismert pihenőhelyekhez |
| Esc | Szünet |

Érintőképernyőn a képernyő gombjai használhatók. A leugráshoz a lefelé és az ugrás gombot együtt kell használni. A hang a felső gombbal kapcsolható.

A főmenüből és a szünetmenüből a **Hogyan játszunk** ablak nyitja a tagolt játékleírást és a billentyűkiosztás szerkesztőjét. Az alapértelmezett, brit QWERTY és francia AZERTY profil közül választhatsz, majd egy-egy művelet billentyűjét külön átállíthatod. Az egyéni módosításokat a böngésző megjegyzi; a teljes kiosztás JSON-fájlként exportálható és importálható.

A szélfolyamokba **bele kell ugrani**. Maguktól magasba emelnek; oldalirányú mozgással szállhatsz ki belőlük a felhőszigetekre. A torii használatához állj a kapu alá, és nyomj E-t; az oszlopaira nem kell felugrani.

## Pihenők és mentés

A közelről felfedezett pihenőhely felkerül a térképre és mentőponttá válik. E-vel az életerőt is feltölti. A térképen az elérhető pihenőhelyek gombjai gyorsutazást indítanak, így Yomiban a felső termekbe is visszatérhetsz.

A megszerzett képességek, megnyitott pecsétek, harangok, kiszabadított lelkek, összegyűjtött emlékek és legyőzött őrzők mentődnek. Halál után a legutóbbi pihenőhelyhez térsz vissza. Az első és második őrző a kihagyott szentélyképességet is megadja, hogy ne záródjon el a továbbjutás.

**E-vel gyógyuláskor és halál után a normál ellenfelek újraélednek** az adott birodalomban. A legyőzött bossok és minibossok, kiszabadított lelkek és megnyitott utak megmaradnak. Az életerő-vesztéssel járó, nem halálos leesés nem éleszti újra a normál ellenfeleket. A folyamatban lévő boss-harc a szentélynél újrakezdődik; a láva eltűnik, a kőszigetek visszatérnek. Az XP és a fejlesztések halál után is megmaradnak.

## Yomi opcionális oldalága

Yomi középső mélységének jobb oldalán egy [láncos kapu és opcionális kastélybelső](COUNCIL-BRANCH.md) is felfedezhető. A kapu kulcsát az őrző dobja, ha egyetlen boss-harcban legalább négy megidézett szolgáját legyőzted. A boss nem hívható vissza: ha a feltétel kimarad, az opcionális kastély csak új játékban érhető el. A kulcs a kapu első kinyitásakor megsemmisül, a kapu ezután nyitva marad.

## XP és fejlesztés

Az ellenfelek legyőzése 18–26 XP-t ad, az őrzőké 100 / 150 / 200 XP-t. Az első szintlépéshez 60 XP kell, minden következőhöz 35-tel több. Minden új szint egy elkölthető pontot ad; a felső határ 12. szint. Az újraélesztett ellenfelek ismét adnak XP-t.

A szentély mellett **U-val** vagy a felső **Fejlesztés** gombbal nyithatod meg a három választást: életerő (+1 maximum), kard (+0,5 sebzés), szellem (rövidebb szellemlépés-várakozás és hosszabb védettség találat után). A Szellem fejlesztést csak a szellemlépés megszerzése után választhatod; a menü addig zárolja. Az XP, szint és kiosztott pontok automatikusan mentődnek. A 0.2/0.3 mentések első betöltéskor 1. szintű Momóval indulnak.

## Ellenfelek

Japánban szamurájok és onmyoji varázslók, Yomiban oni démonok és tenguk, a mennyországban szárnyas angyalok őrzik az utakat. Mindhárom birodalomban vannak közelharcosok, íjászok, pajzsosok és varázslók; az őrzők külön megjelenést kaptak.

- **Íjász:** lövés előtt felkészül. Mozgással és ugrással kerülheted el a nyilat.
- **Pajzsos:** elölről véd. Kerülj mögé, támadj felülről, vagy három blokkolt csapással törd meg rövid időre a védelmét. A szellemlépéses roham is áttörhet rajta.
- **Varázsló:** lassabb, fényjelzéssel előkészített szellemlövedéket indít. Yomiban és az égben szórt lövedékeket is használ.

## Az őrzők támadásai

- **Japán:** széles kardvágás, előre jelzett roham és két egymást követő csapás. A felemelt kard előjelzés, a leengedett kard a visszatámadás ideje.
- **Yomi:** közelharci kalapácsvágás, kalapácscsapásból feltörő lávaoszlopok, parázsszórás, csatlósok idézése és az egész arénát érintő láva. A lávafázis alatt is rád csaphat a kalapáccsal. Az idézési kapuk megjelenése után csaknem egy másodperced van kitérni; egyszerre legfeljebb négy csatlós élhet. A nagy lávafázis előtt 1,8 másodperc figyelmeztetést kapsz. Ugorj a hét alacsony kőszigetre; balról jobbra repedeznek és omlanak le. A repedés egy másodperccel az omlás előtt látható, az utolsó sziget a láva visszahúzódásáig biztonságos. Halálkor és győzelemkor a platformok és idézett ellenfelek visszaállnak.
- **Ég, I. fázis:** fehér szárnyú angyal fénynyilakkal és szent nyílzáporral. 50% életerőnél átalakul.
- **Ég, II. fázis:** fekete szárnyú sötét angyal célzott árnyéklövedékekkel, árnyéknóvával és árnyékzáporral. Az átalakulás nem gyógyítja vissza.
- **Titkos III. fázis:** ha Japánban megtaláltad az angyali glóriát ÉS a démonlord szarvát, a II. alak legyőzése után teljes életerővel feléled. Egyszerre használ fényt és árnyékot, pokoltüzet és démonidézést. Az újjáéledés egy harcon belül egyszer történik; a győzelem és jutalom csak ezután jár.

A két ereklyét a 0.6 változatban külön titkos hely és miniboss őrzi. A végső angyal 140 HP-val, a rejtett alak 180 HP-val rendelkezik, és mindhárom alak a varázslatai mellett előre jelzett közelharci vágásokat is használ. [Részletek a 0.6 leírásában](SECRETS-0.6.md).

Momo **J-vel nyolcképkockás kardcsapást** indít. A kard tényleges vágásakor történik a találat; futás és ugrás közben is látszik. Egy csapás egy célpontot egyszer sebez. Az ereklyéket E-vel veszed fel, a gyűjtemény és a mentés megőrzi őket a következő világokban.

## Forrás

- **assets/js/levels.js**: a három pálya, szigetek, pihenők, mellékutak, kapuk, szélfolyamok és ellenfelek.
- **assets/js/game.js**: mozgás, harc, kétirányú kamera, küldetések, térkép, mentés és rajzolás.
- **assets/js/graphics.js**: képek betöltése, tájak, textúrázott terep, ellenfélpózok és grafikai effektek.
- **assets/js/art-data.js**: képútvonalak, sprite-kivágások és illesztési pontok.
- **assets/js/combat.js**: járőrözés, szerepkörök, bossok, láva és pusztuló platformok.
- **assets/js/progression.js**: XP, szintek, fejlesztési menü és statok.
- **assets/css/style.css**: kezelőfelület.
- **assets/images/momo.png**: Momo eredeti, 1536×2288 méretű pet sprite sheetje.

A kész játékhoz telepítés és build nem szükséges. Helyi kipróbáláshoz HTTP-kiszolgálót használj. A tájak és szereplők illusztrált képek; a köd, fények és Kiba-áramlatok a játékban készülnek. A normál ellenfelek hat mozgási és hat támadási képkockát használnak szerepkörönként és birodalmanként. A helyi mentés törlődik az oldaladatok törlésével.

A nyelvet a főmenüben vagy a szünetmenüben válthatod magyar és angol között. A titkosított mentés az adott böngészőprofilban tölthető vissza; az alfa/béta időszakban minden új játékverzió törli a korábbi haladást. A nyelv- és billentyűbeállítások megmaradnak.

## Ellenőrzés

A játékfolyamat ellenőrzése kiterjed a billentyűeseményekre, a kettős ugrásra, a leugrásra, a harangokra, a fogoly őrök elleni harcra, a három őrzőre, az átjárókra, a szélfolyamokra, a függőleges kamerára, a mozgó platformokra, a pecsétekre, a gyorsutazásra, az apa megmentésére és a verzióváltásos mentésresetre.

A fizikai útvonalkeresés a játék tényleges ugrás-, gravitáció-, leszállás- és szélfolyam-függvényeivel ellenőrzi a fontos pályarészek elérhetőségét és a folyójáratból való visszatérést. A 0.3 ellenőrzése a szerepköröket, pajzsblokkolást, védelmi törést, támadási előkészítést és a sprite-kivágások képen belüli helyzetét is lefedi.

A három birodalom, az animációs ciklusok, a bossok és az erősebb széláramlat vizuális előnézete a játék tényleges rajzolókódjával és Canvas-képkönyvtárral készült. A 0.4 tesztjei a szentélyes újraéledést, XP-t, fejlesztést, mentést, boss-támadásokat és a hét lávasziget fizikai elérhetőségét is lefedik. Az új változat teljes böngészős végigjátszását ebben a környezetben nem lehetett elvégezni.
