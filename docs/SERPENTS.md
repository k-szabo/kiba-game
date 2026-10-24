# Kígyók és a három pikkely

A kapcsolódó kártyák egy közös enemy-template-re épülnek: [fehér kígyó](https://trello.com/c/xHHdWtz2), [lávapikkely kapcsolata](https://trello.com/c/CkeH2Fe6), [szárnyas kígyó](https://trello.com/c/7BDLMxmh), [pikkelyleírás](https://trello.com/c/h96gbvfv), [fúzió](https://trello.com/c/8c3wni1V).

## Közös viselkedés

Az `assets/js/serpents.js` egyetlen állapotgépet használ a három változathoz. A változtathatatlan `Serpents.profiles` adja a méreteket, HP-t, támadásadatokat, mozgást és jutalomjelzőket. A `create/reset/update/defeat` műveleteket a harci modul dispatch-eli. A korábbi `createLavaSerpent/updateLavaSerpent/defeatLavaSerpent` hostfüggvények delegáló belépési pontként megmaradnak.

| Változat | Birodalom | HP | Támadások | Egyszeri XP |
| --- | --- | ---: | --- | ---: |
| `white` | Japán | 72 | Harapás, fagyos legyező, három előre jelzett földi kitörés | 100 |
| `lava` | Yomi bosskísérlete | 24 | Harapás, három parázslövedék | 70 |
| `winged` | Mennyország | 150 | Harapás, öt fénynyíl, előre jelzett árnyékroham | 180 |

Az állapotok `wait → windup → strike → recover`; a támadás iránya és célpontja az előjelzés kezdetén rögzül. A roham figyelmeztetése a teljes későbbi találati útvonalat lefedi. Az entitás a saját arénájában marad; szünetben és párbeszédben nem lépnek az órák, a veszélyek vagy az animációk. A sebzés után a kód újra ellenőrzi az aktuális karaktert és encountert: a halálkor lecserélt Momo vagy egy korábbi pálya kígyója nem folytathat támadást.

Csak a Yomi által idézett változat kapja a történeti `serpent:true` jelölést. Az önálló fehér és szárnyas miniboss `serpentType`-ot használ, ezért a démon lávafázisainak takarítása nem távolítja el őket, és a normál miniboss-visszaállítás kezeli a próbálkozásaikat.

## Opcionális útvonalak

Japánban a kultista barlangtól jobbra lévő `whiteSerpentCave` mellékág lefelé vezet a `(6770,1790,1700)` arénába. A mennyei pálya jobb oldalán a `wingedSerpentRoost` külön híd/platform útja a `(3500,2500,1600)` arénához vezet. A közös főpályák részei, nem új birodalmak vagy `SIDE_LOCATIONS` bejegyzések. A visszautak és a meglévő fő történeti zárak külön ellenőrzendők; egy opcionális ág nem kerülheti meg a kapukat.

A főbossok legyőzése, a képességek, a fő cél és az átjárók sorrendje nem függ az opcionális kígyóktól. Yomi meglévő félidei menedékfázisa, a kígyó maradék HP-jának visszatérése és az utolsó lávafutam változatlan; részletek: [YOMI-BOSS.md](YOMI-BOSS.md).

## Pikkelyek és tartós állapot

| Tárgyazonosító | Világjelző | Legyőzési előzmény |
| --- | --- | --- |
| `whiteSerpentScale` | `flags[0]` | `guardian:whiteSerpent` |
| `serpentScale` | `flags[1]` | A tényleges Yomi-kígyó legyőzése |
| `wingedSerpentScale` | `flags[2]` | `guardian:wingedSerpent` |
| `triuneSerpentTalisman` | `flags[0]` | Fumi és mindhárom pikkely |

A Yomi-pikkely korábbi `serpentScale` azonosítója megmarad, nem keletkezik külön helyettesítő tárgy. A jutalom egyszer jár; a talált vagy egyesített tárgy aktuális inventory-nézete nem lehet az ismételt XP-jogcím. A három pikkely és az eredmény védett, Akash nem vásárolja meg őket.

Fumi a misztikus sátor élő, közeli szolgáltatásablakából egyesíti a három pikkelyt. Normál játékban előbb ki kell szabadítani. A művelet egyszeri: az eredményjelzőt menti, a régi megszerzési jelzőket történeti bizonyítékként megtartja, és a közös inventory `consumedBy` nézete elrejti a felhasznált pikkelyeket. Nem írható ugyanaz a tárgy két külön megszerzési adatbázisba. Régi bezárt ablakkezelő, hiányzó pikkely vagy távoli Fumi nem indíthat fúziót.

## Felszerelt talizmán

A birtoklás és felszerelés külön állapot. Az új `equippedTalisman` mező értéke `null` vagy `'triuneSerpentTalisman'`. Az inventory külön talizmánhelyén viselhető; nem váltja le a fegyvert. A táskában az éppen nem felszerelt talizmán jelenik meg. Csak viselve ad +20 Armort a kovácsrangból származó védelemhez. A százalékos képlet közös: `Armor / (Armor + 100)`; ez nem +20 százalékpont.

A felszerelés, levétel és fúzió nem gyógyít, nem emel maximális HP-t, nem ad sebzést, XP-t vagy fejlesztéspontot. Normál halál, pihenés és azonos kiadású folytatás megőrzi a viselt állapotot. Új végigjátszás és új kiadás az alfa/béta szabály szerint törli; korábbi kiadás haladása nem migrálható. A validátor nem fogad el viselt, de meg nem szerzett talizmánt vagy hiányzó fúziós előzményt.

## Grafika és tesztelés

A képek a közös `ART_MANIFEST`, a pikkelyek és talizmán az `ART_INVENTORY.items` katalógusban szerepelnek. Az inventory ugyanazt a kontrasztos, DPR-követő rajzolót használja; az alfát nem módosítjuk. Az animáció a harci fázist követi, nem külön, rajzolás közben léptetett órát. Új változatnál külön profil, pályabejegyzés, jóváhagyott szöveg/grafika és az inventory/mentési jogcím szükséges, az alap állapotgép másolása helyett.

A `test-serpent-template.cjs` a közös és eltérő támadásokat, rögzített előjelzést, mozgáshatárokat, szünetet, egyszeri jutalmakat, replayt és stale-encounter védelmet ellenőrzi. A `test-serpent-fusion.cjs` a tényleges Fumi-gombot, fogyasztást, felszerelést és dev-izolációt, a `test-serpent-saves.cjs` a szigorú szintetikus mentési feltételeket vizsgálja. A meglévő `test-yomi-redesign.cjs` és `test-serpent-art.cjs` a korábbi lávás harcot és natív képkivágásokat továbbra is ellenőrzi.

A VM-állapotellenőrzések nem bizonyítják a képi minőséget vagy a böngészős tárolást. Az új kiadás előtt külön HU/EN böngészőteszt szükséges legalább 1280×720 és nagyobb asztali nézetben, teljes kígyósziluettel, olvasható telegráfokkal, inventoryfókusszal, szünettel/csökkentett mozgással és valódi IndexedDB-újratöltéssel.

A két önálló kígyó háttere a teljes böngészőnézetet lefedő, képarányt tartó képként jelenik meg, enyhe, széleken korlátozott kameraeltolással. A világba helyezett kép téglalapjának szélei így nem látszanak. A `Visuals.secretBackdropState` ezeknél 220 világ-egységes belépési sávot használ, a `SerpentArt.updateBackdrop` pedig csak aktív képkockán közelít a cél-áttetszőséghez (legfeljebb 2,8 alfaegység/másodperc). Kilépéskor a korábbi képet a nullára halványulásig megtartja. A rajzolás nem lépteti ezt az órát; szünetben megáll, karakterinicializáláskor, teleportáláskor és főmenübe lépéskor törlődik. A pályageometria és a titkok felfedezési feltétele változatlan.

A harapás, az árnyékroham és a földi kitörések előjelzése a közös `BossCues.color` aranyszínét használja. A fajokra jellemző HP-csík, lövedék és tényleges becsapódási effekt külön színe megmarad. A `test-serpent-presentation.cjs` a nézet lefedését, a 30/60/120 FPS-es átmenetet, az állapotváltások tisztítását, a geometria változatlanságát és a közös figyelmeztető színt ellenőrzi.
