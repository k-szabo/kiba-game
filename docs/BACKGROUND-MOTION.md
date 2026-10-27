# Festett hátterek helyi animációja

A `background-motion.js` a meglévő festményekből készít kis, memóriában maradó részletrétegeket. Nincs teljes képkockacsere és nincs új háttérletöltés. A négy közeli mozgásfázis sima átmenettel követi egymást: enyhe lombszélmozgás és helyhez rögzített fényerő-változás. A már létező ködrajzolás megmarad. A grafikai irány a jóváhagyott háttér-storyboardot követi.

A forrásképből legfeljebb 512 pixel széles maszk készül, eredeti színekkel és alfával. A meleg/lila fények helyhez kötve változnak. Eltolható lombmaszk csak a japán háttér kézzel ellenőrzött bal felső szigetén készül (x: 2–15%, y: 1–10%, fényes vörös levélpixelek). A torii, a fatörzsek és a többi kép kívül marad a mozgó régión. Belső terekre és még nem ellenőrzött képekre nem kerül általános lomb- vagy ködeltolás. Erdei képeknél a világos ég és a nap nem pulzál. Az alapfestmény mindig az eredeti vetítéssel kerül a vászonra; a falak és a platformok helye változatlan.

`BackgroundMotion.draw(image, ...drawImageArgs)` a háttérrajzoló helyeken használatos, szereplőkön és terepsprite-okon nem. Ugyanazokat a kivágási és célkoordinátákat követi, így a vágott, tükrözött és áttetsző panel is illeszkedik. A panelgyorsítótár `BackgroundMotion.alias(surface, source)` hívása őrzi meg a forráskép azonosságát és a már meglévő peremhalványítást.

A közös `update()` egyszer, aktív játékképkockánként lépteti az önálló órát, még a prológus külön frissítése előtt. Szünet, dialógus, térkép, inventory, fejlesztés, dev panel és túl kicsi nézet közben nem telik. A jelenet inicializálása törli a múló fázist; a csökkentett mozgás beállítás mindig az eredeti, statikus festményt mutatja. A rajzolás nem módosítja az órát vagy a játékmenetet.

A fő birodalmak, a szentély- és barlanghátterek, az erdei menedék, a szolgáltatások, a börtön, az Árnyékzug/arénája/lakosztálya és mindkét dungeon ugyanazt a réteget használja. A képek hiánya vagy egy nem olvasható Canvas esetén az eredeti festmény marad a visszaesési megoldás. A maszkok memóriában, képenként egyszer készülnek; sem a mentés, sem a tartós képcache nem tartalmazza őket.

`node scripts/test-background-motion.cjs` az órát, megállítást, forráskivágást és állapotmegőrzést vizsgálja. A vizuális minőséghez és a tényleges pixelváltozáshoz külön, valódi böngészős ellenőrzés szükséges.
