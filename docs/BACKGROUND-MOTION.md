# Festett hátterek helyi animációja

A `background-motion.js` a festmény natív méretű második fázisából készít maszkolt, finoman átúszó részleteket. Japánban a lomb, a bokor, a felhő és a lámpafény; Yomiban a láng, a láva és a füst változik. A mennyország és az árnyékvilág öt további képének integrációja és ellenőrzése folyamatban van. Az alternatív képek az `ART_MANIFEST` részei, de a `Visuals` induló képlistája kizárja őket: az első jelenetrajzoláskor az `AssetCache` tölti be őket. A sor egyszerre egy képet tölt, legfeljebb három fázist tart meg, és 64 MiB memóriafoglalási kerettel számol. A többi helyszín a korábbi, kis forrásmaszkos animációt használja.

Az új japán és yomi részletek kézzel kijelölt területei befelé halványulnak. Yomi lámpásának teteje és talapzata védett terület. A tartalék, legfeljebb 512 pixel széles forrásmaszk csak a többi háttéren marad; Yomi és Japán új főképe nem használja a régi fényerőpulzálást, ha a B fázis sikeresen betöltött. Hiányzó vagy eltérő méretű B kép esetén a régi rajzolás marad. A forráskép vetítési és vágási koordinátái változatlanok.

`BackgroundMotion.draw(image, ...drawImageArgs)` a háttérrajzoló helyeken használatos, szereplőkön és terepsprite-okon nem. Ugyanazokat a kivágási és célkoordinátákat követi, így a vágott, tükrözött és áttetsző panel is illeszkedik. A panelgyorsítótár `BackgroundMotion.alias(surface, source)` hívása őrzi meg a forráskép azonosságát és a már meglévő peremhalványítást.

A közös `update()` egyszer, aktív játékképkockánként lépteti az önálló órát, még a prológus külön frissítése előtt. Szünet, dialógus, térkép, inventory, fejlesztés, dev panel és túl kicsi nézet közben nem telik. A jelenet inicializálása törli a múló fázist; a csökkentett mozgás beállítás mindig az eredeti, statikus festményt mutatja. A rajzolás nem módosítja az órát vagy a játékmenetet.

A fő birodalmak, a szentély- és barlanghátterek, az erdei menedék, a szolgáltatások, a börtön, az Árnyékzug/arénája/lakosztálya és mindkét dungeon ugyanazt a réteget használja. A képek hiánya vagy egy nem olvasható Canvas esetén az eredeti festmény marad a visszaesési megoldás. A maszkok memóriában, megtartott gyorsítótár-bejegyzésenként készülnek; sem a mentés, sem a tartós képcache nem tartalmazza őket.

`node scripts/test-background-motion.cjs` az órát, megállítást, forráskivágást és állapotmegőrzést vizsgálja. A vizuális minőséghez és a tényleges pixelváltozáshoz külön, valódi böngészős ellenőrzés szükséges.

## Festett A/B fázisok következő helyszínei

Japán és Yomi főképe már ellenőrzött A/B fázisokat használ. A mennyország három bossfázisa, valamint a prológus és az árnyékvilág főképe jelenleg beépítés és ellenőrzés alatt áll. Az alábbi 40 háttérhez még külön, az épített elemeket és a pályageometriát változatlanul hagyó B fázis, kézzel ellenőrzött mozgásterület és böngészős vizuális próba szükséges. A listában az egyelőre nem használt `samuraiCampBackdrop` tartalékkép is szerepel:

| Helyszíncsoport | Háttérkulcsok |
| --- | --- |
| Mennyország, romok, barlang | `angelRuinBackdrop`, `cultCaveBackdrop`, `whiteSerpentBackdrop`, `wingedSerpentBackdrop` |
| Árnyékvilág és zikkurat | `zigguratApproach`, `zigguratInterior`, `zigguratThrone`, `zigguratStorm` |
| Erdei menedék és szolgáltatások | `campBackdrop`, `campHDLeft`, `campHDCenter`, `campHDRight`, `forgeBackdrop`, `herbalBackdrop`, `mysticBackdrop`, `samuraiCampBackdrop`, `samuraiCampHDWest`, `samuraiCampHDCenter`, `samuraiCampHDEast` |
| Börtön és Árnyékzug | `zenPrisonWest`, `zenPrisonCenter`, `zenPrisonEast`, `fiaPrisonDepths`, `fiaDenWest`, `fiaDenEast`, `arenaWest`, `arenaCenter`, `arenaEast`, `fiaChambersBackdrop` |
| Dungeonök és egyéb terek | `cultDungeonForecourt`, `cultDungeonHall`, `cultDungeonSanctum`, `dungeonCourtyardWest`, `dungeonCourtyardCenter`, `dungeonCourtyardEast`, `dungeonCrypt`, `dungeonThrones`, `councilHall`, `slayerArena`, `momoRoom` |

A játék a listából szereplő képeken már most is megállítja a régi háttérmozgást szünetben, és csökkentett mozgásnál az eredeti festményt mutatja. Az új festett fázisokat kisebb, környezetenként ellenőrizhető csoportokban kell hozzáadni; a fő világok és bossfázisok elsőbbséget élveznek.

A több képből összeállított tábori, börtön-, dungeon- és arénaháttereknél az áttetsző peremű paneleket a forrásképből külön vászonra rajzoljuk. Ezek jelenleg a régi mozgást használják akkor is, ha a forrásképhez A/B fázis készülne: a további beépítéshez az animált forrást és az eredeti panelmaszkot együtt kell kezelni, majd az illesztéseket és az áttetszőséget böngészőben ellenőrizni.

### Bossok külön háttérellenőrzése

- Öreg angyal és öreg kultista: `angelRuinBackdrop`, `cultCaveBackdrop`.
- Fehér és szárnyas kígyó: `whiteSerpentBackdrop`, `wingedSerpentBackdrop`; a yomi lávakígyó a fő `yomiBackdrop` képet használja.
- Démonölő: `slayerArena`; a pap, orgonista és külső börtönőr az árnyékvilági `shadowCultBackdrop` képen osztozik.
- Tábormester: a `samuraiCampHDWest/Center/East` panelek; belső börtönnagy: `zenPrisonWest/Center/East`; vadász: `fiaPrisonDepths`.
- Árnyékzug arénájának bossai: `arenaWest/Center/East`; a dungeonbossok mindkét dungeon saját szintképeit használják.
- Hannah: `zigguratApproach`, `zigguratInterior`, `zigguratThrone`, `zigguratStorm`; a mennyországi titkos fázis: `heavenEclipseBackdrop`.
- Árnyék a prológusban: `shadowBackdrop`; az ébredés külön `momoRoom` képet használ.

A leltár 47 külön háttérképet tartalmaz; ebből 46-nak van jelenleg elérhető háttérrajzolási útvonala. Az ellenőrzés a rejtett arénák áttűnésére és a panelek illesztésére is terjedjen ki.

Ezen felül az öreg angyal romjainál a `japanClouds` külön, statikus előtéri felhőréteg. Ez nem teljes háttérkép, de a mozgás és a teljes vizuális lefedettség ellenőrzésénél szintén vizsgálandó. A prológus eljárással rajzolt köde és fekete lyuka külön effekt, nem része a 47 képes leltárnak.
