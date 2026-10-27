# Kiba Birodalmak · Játékmenet és segítség

[English gameplay guide](GAMEPLAY.en.md)

Böngészős 2D metroidvania Momo eredeti animációival. A kis shiba szamuráj négy eltérő felépítésű világon át keresi édesapját, Harut. A Kiba az összes világot átszövő energia: tápláló, gyenge, torzult vagy különösen erős áramlatait a felső kijelző és a környezeti fények mutatják.

## Indítás és frissítés

Az **index.html** indítja a játékot a mellette található **assets** mappával együtt. GitHub Pagesen vagy helyi HTTP-kiszolgálón játszható mentéssel; a generált runtime már a repository része.

Új utazáshoz válaszd **Az utazás kezdetét**, a korábbi mentés folytatásához pedig a **Folytatás** gombot. Az alfa/béta időszakban minden új játékverzió alaphelyzetbe állítja a haladást, hogy a változó pályák és mentési szabályok ne keveredjenek. A nyelv- és billentyűbeállítások megmaradnak. Azonos verzió újratöltése megőrzi a mentést; részletek a [fejlesztői útmutatóban](DEVELOPMENT.md).

## Eltérő kalandok

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
| J vagy Z | Normál támadás; a hajnalkarddal pecsétek feltörése |
| H | Erős támadás; lassabban indul és nagyobbat sebez |
| K vagy Shift | Szellemlépés az árnyék szentélye után |
| E | Harang, lélek, emlék, szentély, torii, apa |
| U / Fejlesztés gomb | Fejlesztéspontok elköltése a pihenőszentélynél |
| M | Térkép és gyorsutazás az ismert pihenőhelyekhez |
| I | Hátizsák és Momo felszerelése; megnyitva szünetelteti a játékot |
| O | Étel használata |
| Esc | Szünet |

A mobilos felület és az érintőképernyős irányítás megszűnt. A legkisebb támogatott nézet 1280×720; a játék billentyűzettel és egérrel használható.

A leugráshoz a lefelé és az ugrás gombot együtt kell használni. A hang a felső gombbal kapcsolható.

A főmenüből és a szünetmenüből a **Hogyan játszunk** ablak nyitja a tagolt játékleírást és a billentyűkiosztás szerkesztőjét. Az alapértelmezett, brit QWERTY és francia AZERTY profil közül választhatsz, majd egy-egy művelet billentyűjét külön átállíthatod. Az egyéni módosításokat a böngésző megjegyzi; a teljes kiosztás JSON-fájlként exportálható és importálható. Az irányítás egérgombokra is kiosztható. Ha a gomb már foglalt, a két művelet gombja felcserélődik.

A szélfolyamokba **bele kell ugrani**. Maguktól magasba emelnek; oldalirányú mozgással szállhatsz ki belőlük a felhőszigetekre. A torii használatához állj a kapu alá, és nyomj E-t; az oszlopaira nem kell felugrani.

## Pihenők és mentés

A közelről felfedezett pihenőhely felkerül a térképre és mentőponttá válik. E-vel az életerőt is feltölti. A térképen az elérhető pihenőhelyek gombjai gyorsutazást indítanak, így Yomiban a felső termekbe is visszatérhetsz. A további birodalmak külön csoportokban jelennek meg: visszautazhatsz a már befejezett pályák ismert szentélyeihez, majd az éppen folyamatban lévő, korábban már felkeresett birodalomba is. Minden gyorsutazás újraéleszti a normál ellenfeleket, de a legyőzött bossok, minibossok, tárgyak, képességek és megnyitott utak állapota megmarad. Az álomprológus és az ismeretlen pihenőhelyek nem választhatók.

A megszerzett képességek, megnyitott pecsétek, harangok, kiszabadított lelkek, összegyűjtött emlékek és legyőzött őrzők mentődnek. Halál után a legutóbbi pihenőhelyhez térsz vissza. A dupla ugrást a szél szentélyénél, a szellemlépést az árnyék szentélyénél szerezheted meg; az őrzők legyőzése nem helyettesíti ezeket.

**E-vel gyógyuláskor és halál után a normál ellenfelek újraélednek** az adott birodalomban. A legyőzött bossok és minibossok, kiszabadított lelkek és megnyitott utak megmaradnak. Minden lezuhanás halálos, az aktuális életerőtől és sérthetetlenségtől függetlenül: Momo teljes életerővel tér vissza a pihenőhelyre, és a normál ellenfelek újraélednek. A folyamatban lévő boss-harc a szentélynél újrakezdődik; a láva eltűnik, a kőszigetek visszatérnek. Az XP és a fejlesztések halál után is megmaradnak.

## Yomi opcionális oldalága

Yomi középső mélységének jobb oldalán egy [láncos kapu és opcionális kastélybelső](COUNCIL-BRANCH.md) is felfedezhető. A kulcs titkos feltétele, hogy egyetlen boss-harcban mind a **nyolc** megidézett szolgát legyőzd, majd magát a bosst is. A boss nem hívható vissza: ha a feltétel kimarad, az opcionális kastély azon az utazáson elérhetetlenné válik. A kulcs a kapu első kinyitásakor megsemmisül, a kapu ezután nyitva marad.

## XP és fejlesztés

Momo életereje szintlépéskor visszatöltődik az aktuális maximumra.

Az első világ normál ellenfeleinek legyőzése 18–26 XP-t ad; a későbbi világokban az ellenfelek erősebbek és több XP-t érnek. Az őrzők 250 / 400 / 600 / 800 XP-t és egyenként 1 extra fejlesztéspontot adnak. Az első szintlépéshez 60 XP kell, minden következőhöz 35-tel több. Minden új szint egy elkölthető pontot ad; a felső határ 30. szint, tulajdonságonként legfeljebb 12 fejlesztéssel. Az újraélesztett ellenfelek ismét adnak XP-t. Maximális szinten a teljes megszerzett XP továbbra is megmarad, a szintjelző MAX állapotot mutat.

A szentély mellett **U-val** vagy a felső **Fejlesztés** gombbal nyithatod meg a három választást: életerő (+1 maximum), kard (+0,5 alap kardsebzés), szellem (rövidebb szellemlépés-várakozás és hosszabb védettség találat után). A Szellem fejlesztést csak a szellemlépés megszerzése után választhatod; a menü addig zárolja. Az XP, szint és kiosztott pontok automatikusan mentődnek.

## Ellenfelek

Japánban szamurájok és onmyoji varázslók, Yomiban oni démonok és tenguk, a mennyországban szárnyas angyalok őrzik az utakat. Mindhárom birodalomban vannak közelharcosok, íjászok, pajzsosok és varázslók; az őrzők külön megjelenést kaptak.

- **Íjász:** lövés előtt felkészül. Mozgással és ugrással kerülheted el a nyilat.
- **Pajzsos:** elölről véd. Kerülj mögé, támadj felülről, vagy három blokkolt csapással törd meg rövid időre a védelmét. A szellemlépéses roham is áttörhet rajta.
- **Varázsló:** lassabb, fényjelzéssel előkészített szellemlövedéket indít. Yomiban és az égben szórt lövedékeket is használ.

## Az őrzők támadásai

- **Japán:** széles kardvágás, előre jelzett roham és két egymást követő csapás. A felemelt kard előjelzés, a leengedett kard a visszatámadás ideje.
- **Yomi:** közelharci kalapácsvágás, kalapácscsapásból feltörő lávaoszlopok, parázsszórás és csatlósok idézése. 80%, 60%, 40% és 20% életerőnél két-két minion jelenik meg. 50%-nál a boss sebezhetetlenné válik, és a lávaszakaszban egy lávakígyó minibosst kell legyőznöd vagy túl kell élned, amíg az utolsó előtti platform is leomlik. A boss a láva alatt is támad. 10%-nál újabb, ezúttal halálos lávahullám kezdődik: a boss sebezhető marad, az utolsó sziget is összeomlik, és a kígyó visszatér, ha a korábbi szakaszban életben hagytad. A pikkelyért és a kulcs feltételéért lásd a [pokolboss útmutatóját](YOMI-BOSS.md) és a [tanácsosok oldalágát](COUNCIL-BRANCH.md). Halálkor a harc és a platformok újrakezdődnek.
- **Ég, I. fázis:** fehér szárnyú angyal fénynyilakkal és szent nyílzáporral. 50% életerőnél átalakul.
- **Ég, II. fázis:** fekete szárnyú sötét angyal célzott árnyéklövedékekkel, árnyéknóvával és árnyékzáporral. Az átalakulás nem gyógyítja vissza.
- **Titkos III. fázis:** ha Japánban megtaláltad az angyali glóriát ÉS a démonlord szarvát, a II. alak legyőzése után teljes életerővel feléled. Egyszerre használ fényt és árnyékot, pokoltüzet és démonidézést. Az újjáéledés egy harcon belül egyszer történik; a győzelem és jutalom csak ezután jár.

A glóriát és a démonúr szarvát külön titkos helyen minibossok őrzik. Ha mindkettőt megszerezted, a végső boss titkos harmadik formája teljes életerővel éled újjá, és fény- valamint árnyéktámadásokat vegyít. Minden alak varázslatai mellett előre jelzett közelharci vágásokat is használ. [Részletek a rejtett helyekről](SECRETS-0.6.md).

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

A fejlesztői ellenőrzések a játékfolyamatot, a három világ útvonalait, a harcot és bossfázisokat, a mentést, az inventoryt, a fordításokat, a grafikai kivágásokat és a generált Pages-csomagot fedik le. A futtatási parancsokat és azok szerepét a [fejlesztői útmutató](DEVELOPMENT.md) sorolja fel.

A mockolt játékteszt nem ellenőrzi a tényleges böngészőmegjelenítést vagy a profilhoz kötött mentést. Képernyőméret, fókusz, billentyűzet, grafikai olvashatóság és valós böngészős mentés ellenőrzéséhez külön, friss Chrome-profillal végzett QA szükséges.

## Akash portékái

O: étel használata. Akash portékáit az erdei menedékben találod, ha kiszabadítottad Yomiban.

- **Iránytű:** A bal felső feladatpanel alatt, nagy nyíllal és a cél nevével mutatja a következő fő feladat irányát. Az irányt jelzi, nem a bejárható útvonalat; a rejtett ösvényeket magadnak kell felfedezned.
- **Kis útitérkép:** A közeli párkányokat, ismert szentélyeket és Momo helyét mutatja a képernyő sarkában.
- **Ismeretlen eredetű sült hús:** Akash nem árulja el, miből készült. Elfogyasztva azonos eséllyel visszaad vagy elvesz 1 életerőt, de nem ölhet meg. Gyorshasználat: O.

## Árnyékvilág

Haru megtalálása után új árnyékvilág nyílik kultistákkal, három új bossal, gyűjthető jutalmakkal és oltárnál feloldható gyorsutazással. A gyorsutazást az árnyékoltárnál oldhatod fel.

Az árnyékvilág börtöne és őre a főút alatti, jól látható mellékágra került. Haru nyoma és a katedrális a börtönkulcs nélkül is elérhető. A börtönőr kulcsát vedd fel, majd a börtön ajtajánál használd az interakciót; a kulcs elfogy, a kapu nyitva marad. A pap harangszava előtt hagyd el a jelzett kört, vagy szakítsd meg erős támadással. Az orgonista opcionális, magasba vezető platformos mellékágon rejtőzik. Haru templom előtti nyoma egy rövid történeti jelenettel és egyszeri, legfeljebb 2 HP gyógyulással ad erőt Momónak. A pap után a keresés folytatása nyitva marad.
