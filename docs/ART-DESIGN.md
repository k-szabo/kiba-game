# Kiba – grafikai frissítés · 0.3

A frissítés részletes, festett japán fantasy környezetet ad a három birodalomnak. Kiba eredeti, 1536×2288 méretű sprite sheetje változatlan maradt; a tájak és ellenfelek köré épültek. A pályák méretei, ugrási fizikája és küldetései megmaradtak, a 0.2 mentések tovább használhatók.

## Tájak és kellékek

| Birodalom | Új látvány |
| --- | --- |
| Japán | Hajnali hegyvidék, rizsteraszok, pagodák, bambusz, vörös juharlevelek, mohás és gyökerekkel átszőtt platformok. |
| Yomi | Mély sziklahasadékok, bazalt, függő láncok, elhagyott szentélyek, izzó hamu és lávafény. |
| Takamagahara | Felhőtenger, lebegő szigetek, elefántcsontszínű és arany paloták, márványpárkányok. |

A háttér a kamera mozgására eltérő sebességgel reagál. Japánban tükrözött háttérszakaszok kísérik a széles pályát; Yomiban és az égben a kép a függőleges haladással változik. Köd, parázs, fény és részecskék adnak mozgást a tájnak. A platformok képi felső széle a járható felülethez illeszkedik.

## Ellenfelek

| Szerepkör | Japán | Yomi | Mennyország |
| --- | --- | --- | --- |
| Közelharcos | Páncélos szamuráj | Vörös oni | Égi katona |
| Íjász | Japán íjász | Szárnyas tengu | Szárnyas íjász |
| Pajzsos | Nehéz katonai pajzs | Kék oni | Arany pajzsos angyal |
| Varázsló | Onmyoji | Ibolyaszínű démonmágus | Égi mágus |
| Őrző | Hadvezér | Vulkáni oni király | Szeráf |

Mindegyik szereplő két illusztrált pózt kapott: nyugalmi és támadó. A játék programozott lépéssel, finom testmozgással, árnyékkal, támadásjelzéssel és találati effektekkel egészíti ki ezeket. A pajzsosok, íjászok és varázslók külön harci viselkedést is használnak; a taktikai leírás a [GAMEPLAY.md](GAMEPLAY.md) fájlban található.

## Képfájlok és generálás

A nyolc új PNG a beépített **ImageGen** eszközzel készült. A képek generálásához használt teljes promptok az [ART-PROMPTS.json](ART-PROMPTS.json) és a [SCENERY-PROMPTS.json](SCENERY-PROMPTS.json) fájlban találhatók. Az áttetsző sprite sheetek és atlaszok eredeti alfa-csatornája megmaradt; a játék forráskivágásokkal használja őket.

| Fájl a projektben | Tartalom |
| --- | --- |
| `assets/images/backgrounds/japan-v3.png` | Japán panoráma |
| `assets/images/backgrounds/yomi-v3.png` | Yomi függőleges tája |
| `assets/images/backgrounds/heaven-v3.png` | Az égi birodalom függőleges tája |
| `assets/images/enemies/japan-v3.png` | Japán szereplők, öt oszlop és két póz |
| `assets/images/enemies/yomi-v3.png` | Démonok, öt oszlop és két póz |
| `assets/images/enemies/heaven-v3.png` | Angyalok, öt oszlop és két póz |
| `assets/images/terrain-v3.png` | Három birodalom platformtextúrái |
| `assets/images/props-v3.png` | Torii, szentély, harang, ház, lélekketrec és növényzet |

A `graphics.js` tölti be és rajzolja a képeket, az `art-data.js` a sprite-kivágásokat és illesztési pontokat tartalmazza. A játék kezdőgombja a grafikák betöltésének állapotát mutatja.

## Ellenőrzés

A statikus oldallellenőrzés, a három világ küldetés- és fizikai útvonaltesztje, valamint az új harci szerepkörök tesztje sikeres. A tényleges rajzolókód mindhárom világhoz Canvas-előnézetet készített; ellenőrizve az áttetszőség, a méretarány és a platformok illeszkedése. Kiba fájljának SHA256-értéke változatlan: `662cb7c1ade03bd801be53fd459fef5ecce04b13ca20bb857a8614adf77fcb85`.

A 0.3 teljes böngészős végigjátszása ebben a környezetben nem történt meg. A csomag a korábban működő GitHub Pages-szerkezetet használja; az éles oldalhoz a repository fájljait frissíteni kell.
