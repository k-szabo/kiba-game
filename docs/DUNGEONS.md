# Dungeonok – spoileres fejlesztői referencia

Az első dungeon, **A Yomi Királyság bukása**, a Négy Tanácsos Csarnokának emléktekercséből indul. A csarnok továbbra is harcmentes belső tér; a tekercs három külön pályából álló, megismételhető emlékutat nyit. Ez Yomi opcionális oldalága, nem új birodalom. A kapukulcs megszerzését és egyszeri felhasználását a [tanácsosi ág referenciája](COUNCIL-BRANCH.md) írja le.

## Belépés és a három szint

A `councilHall.memoryScroll` melletti interakció szüneteltető választóablakot nyit (`state='dungeonMenu'`). Folytatni csak már elkezdett emlékutat lehet. Az új emlékút elindítása növeli a `dungeonState.run` számlálót, rögzíti a láda véletlen eredményét, majd a bevezető párbeszéd után az első pályára léptet. Bezárt ablak régi callbackje nem indíthat utazást.

| Pályaazonosító | Helyszín és útvonal | Boss | HP | Győzelem jutalma |
| --- | --- | --- | --- | --- |
| `yomiDungeon1` | A lángoló előudvar; hosszú, vízszintes út | Az utolsó őrség kapitánya (`dungeonCaptain`) | 220 | 300 XP, 80 érme; elsőre +1 fejlesztéspont |
| `yomiDungeon2` | A néma sírboltok; levezető, visszafelé is járható galériák | Kultista nekromanta (`dungeonNecromancer`) | 280 | 450 XP, 120 érme; elsőre +1 fejlesztéspont |
| `yomiDungeon3` | A négyek alkonya; a trónokhoz vezető hosszú út | A Négy Tanácsos (`dungeonCouncil`), egy összeolvadt ellenfél | 400 | 650 XP, 200 érme; elsőre +1 fejlesztéspont és `councilSoul` |

A következő szinthez az aktuális boss legyőzése kell. A második és harmadik pálya normál belépése a megelőző szint jelzőjét is ellenőrzi. Az előző szintekre vissza lehet térni; az első szint kijárata, illetve a harmadik szint végpontja a tekercses csarnokba vezet. A dungeon fő útvonalainak nem előfeltétele sem a dupla ugrás, sem a dash.

Minden szinten egy valódi, a boss megközelítési oldalán álló szentély van. A külön belépési pontok `checkpointOnly` jelölésűek, nem további szentélyek és nem gyorsutazási célok.

## Harc és frakciók

A bossokat a `DungeonCombat` közös állapotgépe kezeli: várakozás, célrögzítés és előjelzés, támadás, majd felépülés. A célpont és a figyelmeztető terület a felkészülés alatt rögzített; minden boss támadását legalább 1 másodperces előjelzés vezeti be. A bossoknak nincs külön passzív érintési sebzése.

- A kapitány naginatás hosszú vágást, előre jelzett rohamot és rögzített érkezési helyű ugrócsapást használ.
- A nekromanta árnylövedékekkel, talajjelekkel és feltámasztott szamurájokkal támad. A portálok a varázslat előjelzése után további 0,8 másodpercet várnak; az élő szolgák és függő portálok közös maximuma négy. A szolgák nem adnak külön jutalmat.
- A négy tanácsos egyetlen boss, egy HP- és jutalomkészlettel. Két időzített karcsapást, négy talajjelet és lövedéklegyezőt használ. Az erős karcsapás 3, a többi támadás 2 alap sebzést okoz. A talajjelek között járható rések maradnak, szélre igazításkor sem rakódnak egymásra.

A normál ellenfelek `dungeonEnemy` és `dungeonSide` mezőket kapnak. A japán szamurájok és az árnykultisták a másik oldal közeli tagjait, illetve Momót is célba vehetik. Saját oldalukat nem sebzik; a frakciólövedékek megőrzik oldaluk azonosítóját. Az NPC által megölt ellenfél nem ad Momónak XP-t, érmét vagy más ölési jutalmat. A nekromanta által feltámasztott szamurájok külön, `necromancer` oldalhoz tartoznak, miközben japán megjelenésűek.

A bossok lövedékforrása `dungeon:<boss-id>`. A boss halála vagy visszaállítása a saját lövedékeit és jelzéseit törli; a győzelem a runvezérlőben a hozzá tartozó idézéseket is lezárja. A közös játékciklus aktív képkockánként egyszer frissíti a harcot; szünetben, párbeszédben és játékablakok alatt az órák állnak. Halál vagy pályaváltás után a korábbi játékos-/ellenfélpéldány nem folytathatja a sebzést vagy jutalmazást.

## Egyszeri és ismételhető jutalmak

A `flags[1]` két külön réteget tárol:

- `dungeonStage1Clear`, `dungeonStage2Clear`, `dungeonStage3Clear` és `dungeonChestClaimed`: az aktuális emlékút előrehaladása, új emlékútnál törlődik.
- `dungeonCaptainReward`, `dungeonNecromancerReward`, `dungeonCouncilReward`: a három egyszeri fejlesztéspont jogcíme. Ezek, valamint a megszerzett `councilSoul` állapot új emlékútnál megmaradnak.

Egy boss az aktuális emlékúton csak egyszer jutalmazható. Kifejezetten új emlékút indítása után az XP és érme ismét jár; további fejlesztéspont vagy újabb tanácsosi lélek nem. Az első teljes győzelmi sor összesen 1400 XP-t, 400 érmét és három extra pontot ad, a ládán felül. Az XP-ből kapott szintlépések pontjai a szokásos fejlődési szabályt követik. Az egyszeri bossjelzők a közös pontkeret-számítás részei; a lélek későbbi eladása nem vonja vissza a pontot.

A harmadik boss után a ládát külön, közelről kell kinyitni. Emlékutanként egyszer ad **250 érmét és egy `dungeonSeal` tárgyat**, valamint 25% eséllyel egy megerősítést. A 25%-os ágon a három megerősítéstípus egyenlő eséllyel választható. Az eredmény már az emlékút indításakor a `dungeonState.roll` mezőbe kerül; a láda nyitása vagy ugyanazon kiadás mentésének visszatöltése nem sorsol újra. A pecsét gyűjthető és eladható csecsebecse, jelenleg nincs használati művelete.

## Tárgykészlet és megerősítések

A dungeon halmozható tárgyait a `dungeonState.stock`, a felhasznált fokozatokat a `dungeonState.boosts` tárolja. A tiszta tranzakciókat a `DungeonRules` végzi; a felület és az érvényesítő ugyanazokat a korlátokat használja.

| Tárgyazonosító | Fokozatonkénti hatás | Maximum |
| --- | --- | --- |
| `weaponEnhancement` | +0,25 alap fegyversebzés | 5, összesen +1,25 |
| `armorEnhancement` | +5 Armor, a közös százalékos védelmi képletben | 5, összesen +25 Armor |
| `spiritEnhancement` | A meglévő dash-újratöltés szorzója `1 − 0,03 × fokozat` | 5, a kiinduló érték 85%-a |

Felhasználás az inventoryból történik, egy adagot fogyaszt és egy fokozatot ad. A szellemmegerősítéshez előbb a szellemlépés képességét kell megszerezni; a tárgy nem ad képességet. Hiányzó képességnél, az ötös korláton vagy elégtelen készletnél a művelet nem fogyaszt tárgyat. Ezek a tárgyak nem gyógyító gyorshasználati elemek.

Akashnál a pecsét 50, a megerősítések darabonként 20, a tanácsosi lélek 350 érméért adható el. Az eladás a tényleges tárgykészletet csökkenti, a már alkalmazott megerősítést és az egyszeri jutalomjogcímet nem törli.

## Mentés, halál és új emlékút

A mentés a `dungeon` mezőben tárolja a `run`, `roll`, `stock` és `boosts` adatokat; a világjelzők az előrehaladás és a jutalmak jogcímei. A validátor a pályasorrendet, a kapu- és Yomi-boss-előfeltételt, a készleteket és az ötös korlátokat is ellenőrzi. Korábbi kiadásból nincs migráció: az alfa/béta kiadásreset itt is érvényes.

Halálkor a legutóbbi valódi dungeon-szentélyhez tér vissza Momo, akkor is, ha az egy korábbi szinten van. Az első szentély előtt külön belépési checkpoint gondoskodik az érvényes visszatérésről. Szintváltás önmagában nem gyógyít, és nem írja át a korábbi valódi szentélyt. A már legyőzött szintboss, készlet, megerősítés és jutalomjelző megmarad; a normál ellenfelek újrateremtődnek.

A `DungeonRun.saveLocation()` a tényleges checkpoint pályáját menti. Ezért az azonos kiadáson belüli Folytatás nem ad ingyenes előrejutást a következő szint belépési pontjára. A tekercs Folytatás művelete a legmélyebb már felkeresett dungeon-szentélyt választja, vagy ennek hiányában az első szint kezdetét.

Új emlékút csak a tekercsnél, kifejezett művelettel indul. Törli az aktuális szint- és ládajelzőket, valamint a dungeon korábbi látogatott pontjait; új sorsolást és új runazonosítót ad. Megtartja a készletet, alkalmazott megerősítéseket, XP-t, érméket, egyszeri bossjutalmakat és az egyéb világok haladását. Egy korábbi runból maradt boss callbackje nem teljesítheti az új runt.

## Fejlesztői eszközök és ellenőrzés

A három pálya a `SIDE_LOCATIONS` közös katalógusában szerepel, ezért tesztmódban külön teleportcél a saját szentélyével. A dev teleport megkerülheti a normál feloldást, de nem teljesíti automatikusan az előző szintet. Az egyedi boss-replay `replay=true` jelölése minden dungeon-jutalmat és szintteljesítést tilt. Egy teljes emlékút tesztmódban viszont az izolált tesztállapotot fejlesztheti. A készlet és a fokozatok a DevSession mély másolatának részei; a normál mentés nem módosul. Részletek: [DEV-TOOLS.md](DEV-TOOLS.md).

A fő gazdák: `levels.js` (pályák, katalógusok, jutalmak), `dungeon-rules.js` (tiszta készlet- és állapotszabályok), `dungeon-run.js` (utazás, checkpoint, frakciók, jutalmak), `dungeon-combat.js` (bossok) és `dungeon-art.js` (megjelenítés). A runtime-ot csak a közös build generálja.

Célzott regressziók:

```sh
node scripts/test-dungeon-rules.cjs
node scripts/test-dungeon-run.cjs
node scripts/test-dungeon-combat.cjs
node scripts/test-dungeon-routes.cjs
node scripts/test-dungeon-items.cjs
node scripts/test-dungeon-factions.cjs
node scripts/test-dungeon-art.cjs
```

Ezek az állapot- és jutalomszabályokat, ugyanazon kiadás folytatását, a tényleges inputtal járható útvonalakat és harcot, az inventory műveleteit és a frakciósebzést ellenőrzik. A Canvas/DOM/mentési környezetet részben modellezik; nem igazolnak kész grafikai minőséget vagy valódi böngészős IndexedDB-viselkedést. A HU/EN tekercsmenü, fókusz, 1280×720-as olvashatóság, támadásjelzések, natív képek és mentés-visszatöltés külön böngészős QA-t igényel.
