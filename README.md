# Kiba: Három világ

Egy kis shiba szamuráj. Három birodalom. Egy apa, akit haza kell hozni.

**[Játssz a böngészőben →](https://k-szabo.github.io/kiba-game/)** · [Játékmenet és segítség](docs/GAMEPLAY.md) · [Fejlesztői útmutató](docs/DEVELOPMENT.md)

![Momo karddal küzd a japán templom őrzőjével](docs/images/kiba-game.png)

*Előnézet a játék saját Canvas-rajzolókódjával renderelve.*

## A történet

Momo, a kis shiba szamuráj útnak indul, hogy megmentse szeretett édesapját, Harut. Japán erdei és templomai után a japán alvilág mélységeibe ereszkedik, majd a felhők fölé emelkedik az égi birodalomban. A **Kiba** az egész világot átszövő energia: táplálhat, pusztíthat, és minden vidéken másként áramlik. Japánban a szentélyek körül éltető, a föld alatti járatokban elhalványul, Yomiban eltorzul, az ég szélfolyamaiban pedig felerősödik.

A **Kiba: Három világ** böngészőben játszható, 2D metroidvania: kardharc, platformozás és felfedezés, japán mitológia ihlette világban.

## Három világ, háromféle kaland

| Birodalom | Az utazás | Ellenfelek |
| --- | --- | --- |
| **Japán – A harangok útja** | Hosszú erdei ösvények, falusi tetők, folyójáratok és egy bambusztemplom. Két harang hangja mutatja a továbbvezető utat. | Szamurájok, íjászok, pajzsos katonák és onmyoji varázslók. |
| **Yomi – Az alvilág** | Ereszkedés a mélybe, fogoly lelkek, hamupárkányok és lávával elárasztott termek. | Oni démonok, tenguk és egy csatlósokat idéző démoni őrző. |
| **Takamagahara – Az égi birodalom** | Emelkedés szélfolyamokkal, mozgó felhőszigetekkel és égi pecsétekkel. | Szárnyas angyalok és egy több alakot öltő szeráf. |

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
| Esc | Szünet |

\* A megfelelő képesség megszerzése után. Érintőképernyőn a képernyőn megjelenő gombok is használhatók.

Az alapértelmezett kiosztást az `assets/config/keybindings.json` tartalmazza. A főmenü vagy a szünetmenü **Hogyan játszunk** gombjával nyithatod meg a kiosztásválasztót és a billentyűk átállítását. A személyes módosításokat a böngésző helyben tárolja; a JSON-exporttal átviheted őket másik böngészőbe, majd az importtal visszatöltheted.

**Tipp:** a torii kapu alá állva nyomj E-t; a szélfolyamokba ugorj bele, hogy magasba emeljenek.

## A projektről

A játék **HTML5 Canvas**, **JavaScript** és **CSS** használatával készült. Momo eredeti animált pet sprite sheetjére épül, illusztrált tájakkal, külön mozgási és támadási animációkkal, valamint a játékban rajzolt fény- és részecskehatásokkal.

A weboldal statikus, GitHub Pagesen fut. A játékhoz nincs szükség felhasználói fiókra vagy szerveroldali alkalmazásra. Helyi kipróbáláshoz HTTP-kiszolgálót használj, hogy a böngésző biztonságos tárhelye és a mentés is működjön; az elkészült `runtime.js` a repository része. A fejlesztés és az ellenőrzés lépései a [fejlesztői útmutatóban](docs/DEVELOPMENT.md) vannak.

## Dokumentáció

- [Yomi oldalága: a Négy Tanácsos Csarnoka](docs/COUNCIL-BRANCH.md) – láncos kapu, csontkulcs és egy üres démoni kastélybelső.
- [Agentek, skillek és QA-jóváhagyási folyamat](docs/AGENT-WORKFLOW.md) – projektspecialisták, fájlfelelősségek és kötelező javítási terv QA-visszadobás után.

- [A 0.8.4 boss-effektusai](docs/BOSS-VFX-0.8.4.md) – részletes láva, földrengés, kardcsóvák, árnymágia és idézés.
- [A 0.8.3 angyali grafikái](docs/ANGEL-ART-0.8.3.md) – festett fénynyilak, sötét ég és napfogyatkozásos titkos fázis.
- [A 0.8.2 pálya- és animációjavításai](docs/POLISH-0.8.2.md) – stabil Momo, rendezett platformok, festett felhők és átdolgozott ébredés.
- [A 0.8 prológusa](docs/PROLOGUE.md) – az új kezdés, Árnyék és az ébredési átvezetés; spoileres történetrész lenyitható leírásban.
- [Játékmenet, képességek és mentés](docs/GAMEPLAY.md) – részletes segítség, később boss- és titokleírásokkal.
- [Helyi futtatás, ellenőrzés és GitHub Pages](docs/DEVELOPMENT.md).
- [Assetek és a repository rendbetétele](docs/ASSET-CLEANUP.md).
- [Grafikai koncepció és assetek](docs/ART-DESIGN.md).
- [Karakterek és assetek színpaletta-referenciája](assets/config/colormaps.json) – HEX-paletták, boss-formák, környezet és effektusszínek.
- [A 0.6 titkos területei és harci frissítése](docs/SECRETS-0.6.md) – spoileres részletek lenyitható leírásban.
- [A 0.5 harci és animációs frissítés](docs/BOSSES-0.5.md) – a titkos fázis leírását is tartalmazza.
