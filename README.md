# Kiba – Három világ

Egy kis shiba szamuráj. Három birodalom. Egy apa, akit haza kell hozni.

**[Játssz a böngészőben →](https://k-szabo.github.io/kiba-game/)** · [Játékmenet és segítség](docs/GAMEPLAY.md) · [Fejlesztői útmutató](docs/DEVELOPMENT.md)

![Kiba karddal küzd a japán templom őrzőjével](docs/images/kiba-game.png)

*Előnézet a játék saját Canvas-rajzolókódjával renderelve.*

## A történet

Kiba, a kis shiba szamuráj útnak indul, hogy megmentse szeretett édesapját, Harut. Japán erdei és templomai után a japán alvilág mélységeibe ereszkedik, majd a felhők fölé emelkedik az égi birodalomban. Az utat őrzők, elfeledett emlékek és új képességekkel megnyíló ösvények kísérik.

A **Kiba – Három világ** böngészőben játszható, 2D metroidvania: kardharc, platformozás és felfedezés, japán mitológia ihlette világban.

## Három világ, háromféle kaland

| Birodalom | Az utazás | Ellenfelek |
| --- | --- | --- |
| **Japán – A harangok útja** | Hosszú erdei ösvények, falusi tetők, folyójáratok és egy bambusztemplom. Két harang hangja mutatja a továbbvezető utat. | Szamurájok, íjászok, pajzsos katonák és onmyoji varázslók. |
| **Yomi – Az alvilág** | Ereszkedés a mélybe, fogoly lelkek, hamupárkányok és lávával elárasztott termek. | Oni démonok, tenguk és egy csatlósokat idéző démoni őrző. |
| **Takamagahara – Az égi birodalom** | Emelkedés szélfolyamokkal, mozgó felhőszigetekkel és égi pecsétekkel. | Szárnyas angyalok és egy több alakot öltő szeráf. |

## Játékmenet

- **Kard és szellemlépés:** animált kardcsapások, kitérés és eltérő támadási mintájú ellenfelek. Az őrzők előre jelzik a veszélyes támadásokat.
- **Új képességek, új utak:** a kettős ugrás, a szellemlépés és a hajnalkard a kaland során válik elérhetővé.
- **XP és fejlődés:** az ellenfelek legyőzésével szintet léphetsz, majd a szentélyeknél fejlesztheted Kiba életerejét, kardját és szellemerejét.
- **Szentélyek:** gyógyulás, mentőpontok és a térképről elérhető gyorsutazás. Gyógyuláskor a normál ellenfelek újraélednek.
- **Felfedezés:** mellékutak, Haru emlékei és rejtett ereklyék jutalmazzák a kíváncsiságot. Egyes titkok a végső összecsapást is megváltoztatják.
- **Helyi mentés:** a haladás a böngészőben megmarad; a főmenüben a Folytatás gombbal térhetsz vissza.

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

**Tipp:** a torii kapu alá állva nyomj E-t; a szélfolyamokba ugorj bele, hogy magasba emeljenek.

## A projektről

A játék **HTML5 Canvas**, **JavaScript** és **CSS** használatával készült. Kiba eredeti animált pet sprite sheetjére épül, illusztrált tájakkal, külön mozgási és támadási animációkkal, valamint a játékban rajzolt fény- és részecskehatásokkal.

A weboldal statikus, GitHub Pagesen fut. A játék indításához nincs szükség telepítésre, felhasználói fiókra vagy buildre. Helyben az `index.html` megnyitásával is kipróbálható; HTTP-előnézethez és ellenőrzéshez lásd a [fejlesztői útmutatót](docs/DEVELOPMENT.md).

## Dokumentáció

- [Játékmenet, képességek és mentés](docs/GAMEPLAY.md) – részletes segítség, később boss- és titokleírásokkal.
- [Helyi futtatás, ellenőrzés és GitHub Pages](docs/DEVELOPMENT.md).
- [Assetek és a repository rendbetétele](docs/ASSET-CLEANUP.md).
- [Grafikai koncepció és assetek](docs/ART-DESIGN.md).
- [A 0.5 harci és animációs frissítés](docs/BOSSES-0.5.md) – a titkos fázis leírását is tartalmazza.
