# Festett hátterek helyi animációja

A `background-motion.js` mind a 47 háttérfestmény natív méretű második fázisából készít maszkolt, finoman átúszó részleteket. A fő pályák mellett a rejtett arénák, táborok, belső terek és dungeonök is saját festett fázist kaptak. Az alternatív képek az `ART_MANIFEST` részei, de a `Visuals` induló képlistája kizárja őket: az első jelenetrajzoláskor az `AssetCache` tölti be őket. A sor egyszerre egy képet tölt, legfeljebb három fázist tart meg, és 64 MiB memóriafoglalási kerettel számol. Hiányzó vagy hibás B képnél a korábbi, kis forrásmaszkos tartalék rajzolás marad.

Az új részletek kézzel kijelölt területei befelé halványulnak. Yomi lámpásának teteje és talapzata védett terület. A tartalék forrásmaszk legfeljebb 512 pixel széles; a sikeresen betöltött festett fázisok nem használják a régi fényerőpulzálást. Hiányzó vagy eltérő méretű B kép esetén a régi rajzolás marad. A forráskép vetítési és vágási koordinátái változatlanok.

`BackgroundMotion.draw(image, ...drawImageArgs)` a háttérrajzoló helyeken használatos, szereplőkön és terepsprite-okon nem. Ugyanazokat a kivágási és célkoordinátákat követi, így a vágott, tükrözött és áttetsző panel is illeszkedik. A panelgyorsítótár `BackgroundMotion.alias(surface, source)` hívása őrzi meg a forráskép azonosságát és a már meglévő peremhalványítást.

## Képkivágás és természetes lépték

A `background-framing.js` külön kezeli az érintett hátterek méretezését. A `BackgroundFraming.cover` a natív képarányt megtartva a teljes nézetet lefedi; a vízszintes kameramozgás csak a kilógó képrészt járja be, nem nagyítja a képet a pálya teljes szélességére. Az egypaneles dungeonhátterek függőleges illesztése külön aránnyal szabályozható.

A kovács, herbalista és bűvölő belső tere a `ground` / `floor` paraméterrel a forrásfestmény talajpontját az aktuális világbeli padlóhoz rögzíti. Az építészet egyenletesen skálázódik; ha alatta külön fedés kell, csak a forrás padlórésze folytatódik a képernyő aljáig, ugyanazzal a vízszintes vetítéssel. A klippelt kiegészítés nem rajzolja újra vagy nyújtja meg a falakat, és a közös A/B animációt használja. Így a karakterek a festett talajon állnak, nem a háttér bútorain lebegnek.

A `BackgroundFraming.panels` az Árnyékzug és az első dungeon előudvarának teljes panelcsoportját közös magassággal és átfedéssel illeszti. A normált kamerahelyzet a teljes panoráma szabad tartományát járja be. A meglévő áttetsző peremeket a hívó által adott forrásvászon és az alias őrzi meg, így az A/B animáció ugyanarra a maszkolt képre kerül. Új panelnél ellenőrizni kell a képarányt, az átfedési mértékegységet, mindkét szélső kameraállást és az alsó képszél fedését.

Az aréna szándékos kivétel: saját panorámavetítése legfeljebb a kamera vízszintes mozgásának 18%-át és függőleges mozgásának 8%-át követi; csökkentett mozgás mellett áll. Csak a szükséges fedési méretet használja, a korábbi plusz magasság nélkül. Fia lakosztályának bútorai pedig a világ részei: a saját vetítésük egy az egyben követi a világkamerát, stabil talajregisztrációval. Ezeket a helyszíneket nem szabad általános normált panorámára vagy képernyőhöz kötött coverre cserélni; támadás, ugrás, szünet és csökkentett mozgás közben is meg kell tartani a meglévő stabilitási invariánsokat.

A zikkurat saját rajzolója ugyancsak a natív képarány és a nézet lefedéséből számol; a korábbi, extra magasság miatti nagyítás megszűnt. A felső és viharos csarnok festménye továbbra is a jelenet padlóemeléséhez igazodik. A képkivágás változása nem módosítja a platformokat, útvonalakat vagy az animáció önálló óráját. A többi helyszín megtartja a saját, már kialakított illesztését.

A közös `update()` egyszer, aktív játékképkockánként lépteti az önálló órát, még a prológus külön frissítése előtt. Szünet, dialógus, térkép, inventory, fejlesztés, dev panel és túl kicsi nézet közben nem telik. A jelenet inicializálása törli a múló fázist; a csökkentett mozgás beállítás mindig az eredeti, statikus festményt mutatja. A rajzolás nem módosítja az órát vagy a játékmenetet.

A fő birodalmak, a szentély- és barlanghátterek, az erdei menedék, a szolgáltatások, a börtön, az Árnyékzug/arénája/lakosztálya és mindkét dungeon ugyanazt a réteget használja. A képek hiánya vagy egy nem olvasható Canvas esetén az eredeti festmény marad a visszaesési megoldás. A maszkok memóriában, megtartott gyorsítótár-bejegyzésenként készülnek; sem a mentés, sem a tartós képcache nem tartalmazza őket.

`node scripts/test-background-motion.cjs` az órát, megállítást, forráskivágást és állapotmegőrzést vizsgálja. A vizuális minőséghez és a tényleges pixelváltozáshoz külön, valódi böngészős ellenőrzés szükséges.

## Teljes festett A/B lefedettség

Mind a 47 forrásképhez külön, natív méretű B fázis és kézzel kijelölt mozgásterület tartozik. A 46 elérhető kép mellett az egyelőre nem használt `samuraiCampBackdrop` tartalékkép is szerepel. Az épített környezet és a pályageometria változatlan. A teljes leltárt a fő birodalmak, a mennyország három bossfázisa, a prológus és ébredés, az öt rejtett arénakép, a zikkurat négy képe, a három szolgáltatói belső tér, a tanácsosi csarnok és az alábbi panelek alkotják:

| Helyszíncsoport | Háttérkulcsok |
| --- | --- |
| Erdei menedék és szolgáltatások | `campBackdrop`, `campHDLeft`, `campHDCenter`, `campHDRight`, `samuraiCampBackdrop`, `samuraiCampHDWest`, `samuraiCampHDCenter`, `samuraiCampHDEast` |
| Börtön és Árnyékzug | `zenPrisonWest`, `zenPrisonCenter`, `zenPrisonEast`, `fiaPrisonDepths`, `fiaDenWest`, `fiaDenEast`, `arenaWest`, `arenaCenter`, `arenaEast`, `fiaChambersBackdrop` |
| Dungeonök és egyéb terek | `cultDungeonForecourt`, `cultDungeonHall`, `cultDungeonSanctum`, `dungeonCourtyardWest`, `dungeonCourtyardCenter`, `dungeonCourtyardEast`, `dungeonCrypt`, `dungeonThrones` |

A teljességet, a fájlok meglétét és az eredeti képpel azonos natív méretet a `test-background-motion.cjs` is ellenőrzi. Új háttér felvételekor a festett fázist és a mozgásterületet is ki kell dolgozni. Az összes helyszín megáll szünetben; csökkentett mozgásnál az eredeti festményt mutatja.

A több képből összeállított tábori, börtön-, dungeon- és arénaháttereknél az áttetsző peremű paneleket a forrásképből külön vászonra rajzoljuk. Mind a 12 panelalias a natív forrásképet és az eredeti bal oldali átúszás arányát őrzi. A motor ugyanazon foglaláson belül az A/B kép összeállítása után alkalmazza a panelmaszkot; az első, fedett panel nem kap halványítást. A gyorsítótár a képazonosságot is figyeli, így ugyanazon óraállásban a normál és maszkolt rajzolás között is helyesen vált. Új panelnél az illesztéseket böngészőben is ellenőrizni kell.

### Bossok külön háttérellenőrzése

- Öreg angyal és öreg kultista: `angelRuinBackdrop`, `cultCaveBackdrop`.
- Fehér és szárnyas kígyó: `whiteSerpentBackdrop`, `wingedSerpentBackdrop`; a yomi lávakígyó a fő `yomiBackdrop` képet használja.
- Démonölő: `slayerArena`; a pap, orgonista és külső börtönőr az árnyékvilági `shadowCultBackdrop` képen osztozik.
- Tábormester: a `samuraiCampHDWest/Center/East` panelek; belső börtönnagy: `zenPrisonWest/Center/East`; vadász: `fiaPrisonDepths`.
- Árnyékzug arénájának bossai: `arenaWest/Center/East`; a dungeonbossok mindkét dungeon saját szintképeit használják.
- Hannah: `zigguratApproach`, `zigguratInterior`, `zigguratThrone`, `zigguratStorm`; a mennyországi titkos fázis: `heavenEclipseBackdrop`.
- Árnyék a prológusban: `shadowBackdrop`; az ébredés külön `momoRoom` képet használ.

A leltár 47 külön háttérképet tartalmaz; ebből 46-nak van jelenleg elérhető háttérrajzolási útvonala. Az ellenőrzés a rejtett arénák áttűnésére és a panelek illesztésére is terjedjen ki.

Ezen felül az öreg angyal romjainál a `japanClouds` külön előtéri felhőréteg: a közös aktív órával néhány képpontnyit sodródik, csökkentett mozgásnál az eredeti helyén áll. Ez nem teljes háttérkép. A prológus eljárással rajzolt köde és fekete lyuka külön effekt, nem része a 47 képes leltárnak.

A börtön csak a képernyőt metsző paneleket küldi animálásra. Amint a vadász külön háttere teljesen fedővé válik, a börtön statikus festményként megmarad alatta: az alsó képszélen sincs rés, és a takart panelek nem foglalják el a vadász animációjának gyorsítótárát. Hiányzó vadászképnél az animált börtön marad.
