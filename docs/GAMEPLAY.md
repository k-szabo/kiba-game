# Kiba – Három világ · 0.3

Böngészős 2D metroidvania Kiba eredeti animációival. A kis shiba szamuráj három eltérő felépítésű világon át keresi édesapját, Harut.

## Indítás és frissítés

A 0.3 csomagban az **index.html** indítja a játékot, a mellette található **assets** mappával együtt. Közvetlenül is megnyitható böngészőben, vagy GitHub Pagesen hosztolható. A korábbi külön csomagolt **Kiba-Harom-vilag.html** még a 0.2 változatot tartalmazza.

Új végigjátszáshoz válaszd **Az utazás kezdetét**. A **Folytatás** megőrzi a régi képességeket, legyőzött őrzőket és lélektöredékeket, de a 0.1 változat helykoordinátái helyett az adott új birodalom bejáratához helyez. A 0.2 és 0.3 mentések közös pihenőhelyeket használnak; a grafikai frissítés miatt nem kell új játékot kezdeni.

Frissítéskor a csomag teljes tartalmát ugyanott cseréld le. A mentések böngészőnként és címenként különböznek; a fájlokhoz tartozó helyi tárolás viselkedése a böngészőtől függ.

## Három eltérő kaland

| Világ | Felépítés | Fő feladat | Mellékutak |
| --- | --- | --- | --- |
| Japán | 10 400 széles, 1 700 magas játéktér | Szerezd meg a szél áldását, szólaltasd meg az erdei és falusi harangot, majd keresd fel a bambusztemplom őrzőjét. | Lombkorona, folyó fölötti út, föld alatti folyójárat és visszavezető lépcsők. |
| Yomi | 3 300 széles, 6 250 mély játéktér | Ereszkedj le a két fogoly lélekhez, győzd le őreiket, majd a világ fenekén az őrzőt. Az árnyék szentélye félúton ad szellemlépést. | Elfeledett sírkamra, árnyékfüggöny, veszélyes hamupárkányok. |
| Takamagahara | 3 200 széles, 6 650 magas játéktér | Szélfolyamokkal, felhőszigetekkel és ugrásokkal emelkedj az őrzőhöz. A végső pecsétet karddal törd fel. Az apa még az őrző fölött vár. | Mozgó felhőplatformok, pecsét mögötti emlék, távoli alsó felhősziget. |

Japán 2,6-szor szélesebb az előző változatnál. Yomi és az ég több mint nyolc képernyőnyi függőleges pályateret kapott. A kamera mindkét tengelyen követi Kibát.

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
| M | Térkép és gyorsutazás az ismert pihenőhelyekhez |
| Esc | Szünet |

Érintőképernyőn a képernyő gombjai használhatók. A leugráshoz a lefelé és az ugrás gombot együtt kell használni. A hang a felső gombbal kapcsolható.

A szélfolyamokba **bele kell ugrani**. Maguktól magasba emelnek; oldalirányú mozgással szállhatsz ki belőlük a felhőszigetekre. A torii használatához állj a kapu alá, és nyomj E-t; az oszlopaira nem kell felugrani.

## Pihenők és mentés

A közelről felfedezett pihenőhely felkerül a térképre és mentőponttá válik. E-vel az életerőt is feltölti. A térképen az elérhető pihenőhelyek gombjai gyorsutazást indítanak, így Yomiban a felső termekbe is visszatérhetsz.

A megszerzett képességek, megnyitott pecsétek, harangok, kiszabadított lelkek, összegyűjtött emlékek és legyőzött őrzők mentődnek. Halál után a legutóbbi pihenőhelyhez térsz vissza. Az első és második őrző a kihagyott szentélyképességet is megadja, hogy ne záródjon el a továbbjutás.

## Ellenfelek

Japánban szamurájok és onmyoji varázslók, Yomiban oni démonok és tenguk, a mennyországban szárnyas angyalok őrzik az utakat. Mindhárom birodalomban vannak közelharcosok, íjászok, pajzsosok és varázslók; az őrzők külön megjelenést kaptak.

- **Íjász:** lövés előtt felkészül. Mozgással és ugrással kerülheted el a nyilat.
- **Pajzsos:** elölről véd. Kerülj mögé, támadj felülről, vagy három blokkolt csapással törd meg rövid időre a védelmét. A szellemlépéses roham is áttörhet rajta.
- **Varázsló:** lassabb, fényjelzéssel előkészített szellemlövedéket indít. Yomiban és az égben szórt lövedékeket is használ.

## Forrás

- **assets/js/levels.js**: a három pálya, szigetek, pihenők, mellékutak, kapuk, szélfolyamok és ellenfelek.
- **assets/js/game.js**: mozgás, harc, kétirányú kamera, küldetések, térkép, mentés és rajzolás.
- **assets/js/graphics.js**: képek betöltése, tájak, textúrázott terep, ellenfélpózok és grafikai effektek.
- **assets/js/art-data.js**: képútvonalak, sprite-kivágások és illesztési pontok.
- **assets/css/style.css**: kezelőfelület.
- **assets/images/kiba.png**: Kiba eredeti, 1536×2288 méretű pet sprite sheetje.

Telepítés és build nem szükséges. A forrás változat HTTP-kiszolgálóval is használható. A 0.3 hátterei, tereptextúrái és ellenfelei illusztrált képek; a köd, fények, részecskék és mozgás a játékban készülnek. Az ellenfelek két rajzolt pózt és programozott mozgást használnak. A helyi mentés törlődik az oldaladatok törlésével.

## Ellenőrzés

A játékfolyamat ellenőrzése kiterjed a billentyűeseményekre, a kettős ugrásra, a leugrásra, a harangokra, a fogoly őrök elleni harcra, a három őrzőre, az átjárókra, a szélfolyamokra, a függőleges kamerára, a mozgó platformokra, a pecsétekre, a gyorsutazásra, az apa megmentésére és a régi mentések átvételére.

A fizikai útvonalkeresés a játék tényleges ugrás-, gravitáció-, leszállás- és szélfolyam-függvényeivel ellenőrzi a fontos pályarészek elérhetőségét és a folyójáratból való visszatérést. A 0.3 ellenőrzése a szerepköröket, pajzsblokkolást, védelmi törést, támadási előkészítést és a sprite-kivágások képen belüli helyzetét is lefedi.

A három birodalom vizuális előnézete a játék tényleges rajzolókódjával és Canvas-képkönyvtárral készült. Az új változat teljes böngészős végigjátszását ebben a környezetben nem lehetett elvégezni.
