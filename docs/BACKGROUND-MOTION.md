# Festett hátterek helyi animációja

A `background-motion.js` Japán és Yomi fő hátterén a festmény natív méretű, második fázisából készít maszkolt, finoman átúszó részleteket. Japánban a lomb, a bokor, a felhő és a lámpafény; Yomiban a láng, a láva és a füst változik. A kőépületek és a járható terep helyben maradnak. A két alternatív kép az `ART_MANIFEST` része, de a `Visuals` induló képlistája kizárja őket: az első jelenetrajzoláskor az `AssetCache` tölti be őket. A böngészőfül idejére legfeljebb két alternatív kép és a hozzájuk tartozó vágott részletrétegek maradnak memóriában; a többi helyszín a korábbi, kis forrásmaszkos animációt használja.

Az új japán és yomi részletek kézzel kijelölt területei befelé halványulnak. Yomi lámpásának teteje és talapzata védett terület. A tartalék, legfeljebb 512 pixel széles forrásmaszk csak a többi háttéren marad; Yomi és Japán új főképe nem használja a régi fényerőpulzálást, ha a B fázis sikeresen betöltött. Hiányzó vagy eltérő méretű B kép esetén a régi rajzolás marad. A forráskép vetítési és vágási koordinátái változatlanok.

`BackgroundMotion.draw(image, ...drawImageArgs)` a háttérrajzoló helyeken használatos, szereplőkön és terepsprite-okon nem. Ugyanazokat a kivágási és célkoordinátákat követi, így a vágott, tükrözött és áttetsző panel is illeszkedik. A panelgyorsítótár `BackgroundMotion.alias(surface, source)` hívása őrzi meg a forráskép azonosságát és a már meglévő peremhalványítást.

A közös `update()` egyszer, aktív játékképkockánként lépteti az önálló órát, még a prológus külön frissítése előtt. Szünet, dialógus, térkép, inventory, fejlesztés, dev panel és túl kicsi nézet közben nem telik. A jelenet inicializálása törli a múló fázist; a csökkentett mozgás beállítás mindig az eredeti, statikus festményt mutatja. A rajzolás nem módosítja az órát vagy a játékmenetet.

A fő birodalmak, a szentély- és barlanghátterek, az erdei menedék, a szolgáltatások, a börtön, az Árnyékzug/arénája/lakosztálya és mindkét dungeon ugyanazt a réteget használja. A képek hiánya vagy egy nem olvasható Canvas esetén az eredeti festmény marad a visszaesési megoldás. A maszkok memóriában, képenként egyszer készülnek; sem a mentés, sem a tartós képcache nem tartalmazza őket.

`node scripts/test-background-motion.cjs` az órát, megállítást, forráskivágást és állapotmegőrzést vizsgálja. A vizuális minőséghez és a tényleges pixelváltozáshoz külön, valódi böngészős ellenőrzés szükséges.

## Festett A/B fázisok következő helyszínei

Ez a kiadás a `japanBackdrop` és `yomiBackdrop` főképet váltja át a jóváhagyott, visszafogott A/B mozgásra. Az alábbi 45 háttér továbbra is a korábbi forrásmaszkos megoldást használja; mindegyikhez külön, az épített elemeket és a pályageometriát változatlanul hagyó B fázis, kézzel ellenőrzött mozgásterület és böngészős vizuális próba szükséges. Ezt a listát a teljes feladaton belül nyitva kell tartani:

| Helyszíncsoport | Háttérkulcsok |
| --- | --- |
| Mennyország, romok, barlang | `heavenBackdrop`, `heavenDarkBackdrop`, `heavenEclipseBackdrop`, `angelRuinBackdrop`, `cultCaveBackdrop`, `whiteSerpentBackdrop`, `wingedSerpentBackdrop` |
| Árnyékvilág és zikkurat | `shadowBackdrop`, `shadowCultBackdrop`, `zigguratApproach`, `zigguratInterior`, `zigguratThrone`, `zigguratStorm` |
| Erdei menedék és szolgáltatások | `campBackdrop`, `campHDLeft`, `campHDCenter`, `campHDRight`, `forgeBackdrop`, `herbalBackdrop`, `mysticBackdrop`, `samuraiCampBackdrop`, `samuraiCampHDWest`, `samuraiCampHDCenter`, `samuraiCampHDEast` |
| Börtön és Árnyékzug | `zenPrisonWest`, `zenPrisonCenter`, `zenPrisonEast`, `fiaPrisonDepths`, `fiaDenWest`, `fiaDenEast`, `arenaWest`, `arenaCenter`, `arenaEast`, `fiaChambersBackdrop` |
| Dungeonök és egyéb terek | `cultDungeonForecourt`, `cultDungeonHall`, `cultDungeonSanctum`, `dungeonCourtyardWest`, `dungeonCourtyardCenter`, `dungeonCourtyardEast`, `dungeonCrypt`, `dungeonThrones`, `councilHall`, `slayerArena`, `momoRoom` |

A játék a listából szereplő képeken már most is megállítja a régi háttérmozgást szünetben, és csökkentett mozgásnál az eredeti festményt mutatja. Az új festett fázisokat kisebb, környezetenként ellenőrizhető csoportokban kell hozzáadni; a fő világok és bossfázisok elsőbbséget élveznek.
