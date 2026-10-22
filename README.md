# Kiba Birodalmak

[English](README.en.md)

Egy kis shiba szamuráj. Három birodalom. Egy apa, akit haza kell hozni.

**[Játssz a böngészőben →](https://k-szabo.github.io/kiba-game/)** · [Játékmenet és segítség](docs/GAMEPLAY.md) · [Fejlesztői útmutató](docs/DEVELOPMENT.md)

![Momo karddal küzd a japán templom őrzőjével](docs/images/kiba-game.png)

*Előnézet a játék saját Canvas-rajzolókódjával renderelve.*

## A történet

Momo, a kis shiba szamuráj útnak indul, hogy megmentse szeretett édesapját, Harut. Japán erdei és templomai után a japán alvilág mélységeibe ereszkedik, majd a felhők fölé emelkedik az égi birodalomban. A **Kiba** az egész világot átszövő energia: táplálhat, pusztíthat, és minden vidéken másként áramlik. Japánban a szentélyek körül éltető, a föld alatti járatokban elhalványul, Yomiban eltorzul, az ég szélfolyamaiban pedig felerősödik.

A **Kiba Birodalmak** böngészőben játszható, 2D metroidvania: kardharc, platformozás és felfedezés, japán mitológia ihlette világban.

## A birodalmak

| Birodalom | Az utazás | Ellenfelek |
| --- | --- | --- |
| **Japán – A harangok útja** | Hosszú erdei ösvények, falusi tetők, folyójáratok és egy bambusztemplom. Két harang hangja mutatja a továbbvezető utat. | Szamurájok, íjászok, pajzsos katonák és onmyoji varázslók. |
| **Yomi – Az alvilág** | Ereszkedés a mélybe, fogoly lelkek, hamupárkányok és lávával elárasztott termek. | Oni démonok, tenguk és egy csatlósokat idéző démoni őrző. |
| **Takamagahara – Az égi birodalom** | Emelkedés szélfolyamokkal, mozgó felhőszigetekkel és égi pecsétekkel. | Szárnyas angyalok és egy több alakot öltő szeráf. |
| **Árnyékvilág** | A kihunyt part, árnyékoltár, börtön és katedrális; Haru keresése folytatódik. | Kultisták, Őrült pap, Kultista börtönőr és rejtett Őrült orgonista. |

## Játékmenet

- **Játszható prológus:** egy néma árnyvilágban Momo egyedül keresi a továbbvezető utat. A fekete lyuknál egy hatalmas, füstbe burkolózó entitás, Árnyék vár rá.
- **Kard és szellemlépés:** animált kardcsapások, kitérés és eltérő támadási mintájú ellenfelek. Az őrzők előre jelzik a veszélyes támadásokat.
- **Új képességek, új utak:** a kettős ugrás, a szellemlépés és a hajnalkard a kaland során válik elérhetővé.
- **XP és fejlődés:** az ellenfelek legyőzésével szintet léphetsz, majd a szentélyeknél fejlesztheted Momo életerejét, kardját és szellemerejét. A szellemlépés fejlesztése a képesség megszerzése után nyílik meg.
- **Szentélyek:** gyógyulás, mentőpontok és a térképről elérhető gyorsutazás. Gyógyuláskor a normál ellenfelek újraélednek.
- **Felfedezés:** mellékutak, Haru emlékei, rejtett szentélyek és saját minibossokkal őrzött ereklyék jutalmazzák a kíváncsiságot. Egyes titkok a végső összecsapást is megváltoztatják.
- **Magyar és angol nyelv:** a zászlós választó a nyelvek saját és angol nevét mutatja; a választást a böngésző megjegyzi.
- **Állítható irányítás:** a „Hogyan játszunk” ablakban brit és francia kiosztás választható, az egyes műveletek billentyűi átállíthatók, a beállítások JSON-fájlként exportálhatók és importálhatók.
- **Helyi mentés:** a haladás titkosított formában, az adott böngészőprofilhoz kötve marad meg; a főmenüben a Folytatás gombbal térhetsz vissza. Az alfa/béta időszakban új játékverziónál a haladás törlődik; a nyelv és a billentyűkiosztás megmarad.

- Kiszabadítható kereskedő, gyűjthető érmék, megvásárolható iránytű és minimap, valamint inventoryból és átállítható gyorsbillentyűvel használható sült hús került a játékba.

## Irányítás

| Billentyű | Művelet |
| --- | --- |
| A / D vagy ← / → | Mozgás |
| Space, W vagy ↑ | Ugrás; felengedés után újra megnyomva kettős ugrás* |
| J vagy Z | Kardcsapás |
| K vagy Shift | Szellemlépés* |
| E | Interakció, gyógyulás, kapuk és tárgyak használata |
| U | Fejlesztés a pihenőszentélynél |
| M | Térkép és gyorsutazás |
| S + Space | Leugrás a párkányról |
| O | Étel használata |
| Esc | Szünet |
| I | Hátizsák és felszerelés, a játék szüneteltetésével |

\* A megfelelő képesség megszerzése után.

A mobilos felület és az érintőképernyős irányítás megszűnt. A legkisebb támogatott nézet 1280×720; a játék billentyűzettel és egérrel használható.

Az alapértelmezett kiosztást az `assets/config/keybindings.json` tartalmazza. A főmenü vagy a szünetmenü **Hogyan játszunk** gombjával nyithatod meg a kiosztásválasztót és a billentyűk átállítását. A személyes módosításokat a böngésző helyben tárolja; a JSON-exporttal átviheted őket másik böngészőbe, majd az importtal visszatöltheted.

**Tipp:** a torii kapu alá állva nyomj E-t; a szélfolyamokba ugorj bele, hogy magasba emeljenek.

## A projektről

A főmenü és a szünetmenü **Hibajelentés** hivatkozása új lapon nyitja a [hibajelentő űrlapot](https://tally.so/r/8Nojjr), amely bejelentkezés nélkül kitölthető. A játék átadja a verziót, a nyelvet, az aktuális birodalmat és néhány technikai adatot; a hiba leírását te adod meg. Mentést vagy személyes adatot a játék nem ad át. Képernyőképet és kapcsolattartási e-mailt önként adhatsz meg az űrlapon.

A játék **HTML5 Canvas**, **JavaScript** és **CSS** használatával készült. Momo eredeti animált pet sprite sheetjére épül, illusztrált tájakkal, külön mozgási és támadási animációkkal, valamint a játékban rajzolt fény- és részecskehatásokkal.

A weboldal statikus, GitHub Pagesen fut. A játékhoz nincs szükség felhasználói fiókra vagy szerveroldali alkalmazásra. Helyi kipróbáláshoz HTTP-kiszolgálót használj, hogy a böngésző biztonságos tárhelye és a mentés is működjön; az elkészült `runtime.js` a repository része. A fejlesztés és az ellenőrzés lépései a [fejlesztői útmutatóban](docs/DEVELOPMENT.md) vannak.

## Dokumentáció

- [Játékmenet, képességek és mentés](docs/GAMEPLAY.md).
- [Helyi futtatás, ellenőrzés, GitHub Pages és repository-rend](docs/DEVELOPMENT.md).
- [Grafikai stílus, animáció és assetek](docs/ART-DESIGN.md).
- [Titkos helyek és minibossok](docs/SECRETS-0.6.md) – spoileres részletek lenyitható leírásban.
- [Prológus és Árnyék](docs/PROLOGUE.md).
- [A Yomi boss és a lávakígyó](docs/YOMI-BOSS.md).
- [Yomi oldalága: a Négy Tanácsos Csarnoka](docs/COUNCIL-BRANCH.md).
- [Inventory és tárgyak](docs/INVENTORY.md).
- [Agentek, skillek és QA-jóváhagyási folyamat](docs/AGENT-WORKFLOW.md).
- [Kiadásazonosítók és hibajavítások](docs/RELEASES.md).
- [Karakterek és assetek színpaletta-referenciája](assets/config/colormaps.json).
