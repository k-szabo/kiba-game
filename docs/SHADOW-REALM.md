# A negyedik birodalom

A [54-es Trello-kártya](https://trello.com/c/P5aSKhN9) az égi történet folytatása. Haru megtalálása után az örvény Momót és apját az Árnyékvilágba sodorja. A templom előtt Haru nyoma található; az Őrült pap legyőzése után a keresés folytatása nyitva marad.

## Útvonal és tartós állapot

A `levels[3]` / `shadowRealm` 11 200 × 2 600 játékegység. A parttól a kolostoron és az árnyékoltáron át közvetlen főút vezet Haru nyomához és a katedrálishoz. A [88-as kártya](https://trello.com/c/vmqAKasf) óta a börtön és őre ugyanazon a vízszintes szakaszon, de 800 egységgel lejjebb, opcionális, nem rejtett mellékágon található. Az oltár utáni leejthető párkányról nyíló lépcsős út vezet le; a hét, egyenként 100 egység szintkülönbségű lépcsőn egyszeres ugrással vissza lehet jutni a főútra. Az alsó platformokat a térkép felfedezési jelző nélkül mutatja. Az orgonista karzata továbbra is külön, a főút kamerája fölé vezető platformos mellékág; oda-vissza járható dupla ugrással. A börtönkaput a főboss legyőzése sem nyitja ki automatikusan.

- A mennyországi `shadowEntered` jelző rögzíti a történeti belépést. A szeráf legyőzése önmagában nem nyitja meg a negyedik világot a normál gyorsutazáshoz.
- A `shadowAltar` csak az oltár kifejezett használatakor aktiválódik. Pihenőhely felfedezése, gyógyulás és halál nem helyettesíti ezt.
- Az oltár külön, 260 játékegység magas feketekő grafikát és kontrasztos `影` jelölést kapott. Az első aktiválás megőrzi a feloldásjelzőt, majd két bekezdéses HU/EN párbeszéd alatt megállítja a játékot. Későbbi használata a helyi pihenő gyógyítása, a párbeszédet halál és visszatérés sem ismétli. A `test-shadow-altar.cjs` ezt tényleges, átállított interakcióbillentyűvel ellenőrzi.
- Aktiválásig sem az Árnyékvilágból, sem oda nem indítható normál gyorsutazás. A térkép továbbra is megnyitható; az utazógombok zároltak. Halálkor a helyi mentőpont használható.
- A börtönőr legyőzése feloldja az alsó udvarban felvehető `prisonKey` tárgyat. Nyitáskor a kulcs elfogy, a `prisonOpen` megmarad. A zárt alsó csarnokot tartós kőtető, keleti fal és a halálsík alá nyúló alapzat védi: a felső útról leejtéssel, keletről vagy az egyirányú padló alól sem kerülhető meg. Ezek a kőelemek a pap legyőzése után is ütköznek.
- A templom előtt, a felső főúton a `prisonTrace` külön interakcióval rögzíti Haru nyomát. A belső azonosító megmarad, de a nyomhoz és a paphoz nem kell a börtönkulcs, a kapunyitás vagy az őr legyőzése. A fő cél először Haru nyoma, majd a pap; az iránytű nem küldi a játékost kötelező célként az opcionális börtönhöz.
- A templomút börtönőri szakaszán rövid, emelt platformhurok vezet át a főúton; egy íjász és egy varázsló őrzi. A mellékút visszacsatlakozik, nem változtatja meg a Haru-nyomhoz vagy a katedrálishoz vezető fő útvonalat.
- A [89-es kártya](https://trello.com/c/IkDv8T91) óta a nyom első vizsgálata két bekezdéses HU/EN jelenetet nyit, és legfeljebb 2 HP-t gyógyít, a maximális életerőig. A jutalom és a jelző a párbeszéd előtt rögzül; teljes életerőn is elfogy az egyszeri alkalom. A bezárt jelenet után csak tényleges gyógyuláskor jelenik meg a visszatöltött HP mennyisége. Nem pihenőhely: nem változtat mentőpontot, nem éleszti újra az ellenfeleket és nem ad sérthetetlenséget. Halál, pihenés, utazás és azonos kiadású folytatás nem ismétli a jutalmat vagy a jelenetet.
- Az opcionális orgonista legyőzése feloldja a `corruptedHymn` kottát. A két miniboss és jutalmaik nem ismétlődnek halál, pihenés vagy visszatérés után.

## Harc

A négy normál kultista a meglévő kardos, íjász, varázsló és pajzsos állapotgépet használja. A pap saját támadássorrendje: árnyéklövedékek, jelzett talajpecsétek, harangszó, közelharci csapás. A pap 180 HP-val indul.

A harang 1,5 másodperces előjelzésekor rögzíti a cél közepét. A hatás 145 egység vízszintes és 110 egység talajtól mért távolságon belül bénít; elmozdulással, ugrással vagy szellemlépéssel kerülhető el. A harang előkészítését egy erős kardtalálat megszakítja. A bénítás 0,65 másodperc, az elszívás egyszer 2 HP-t sebez. A pap a ténylegesen elvesztett HP háromszorosát gyógyulja, legfeljebb a maximumáig. A halál közben újraindult bossra nem kerül át a gyógyulás. Szünet és párbeszéd alatt a közös játékosóra és a bossóra is áll.

A börtönőr 75 HP-s, közeledő fejszés miniboss; arénája és indulópontja az alsó, 2200-as talajszinten van. A felső főúton haladó játékos nem aktiválja. Az orgonista 105 HP-s, helyben maradó, legyezős lövedékekkel és orgonasípokat idéző talajtámadásokkal harcoló miniboss. A pap egyszeri jutalma 800 XP, 1 extra fejlesztéspont és `madPriestSoul`; a lélek a közös bossjutalom-katalógust használja.

## Forrás és ellenőrzés

A pályaadat a `levels.js`, a külön harc/interakció a `shadow-realm.js` része. A `game.js` a történeti belépést, közös időzítőket és utazási korlátot kapcsolja hozzá. A `prison` pihenő azonosítója megmarad, koordinátája 6100/2200; a dev-teleport és boss-visszahívás a közös pályakatalógusból használja az új talajszintet. A mentés minden birodalomtömb méretét a `levels.length` alapján ellenőrzi; a mozgásképességek száma továbbra is kettő. Új kiadáskor a megszokott alfa/béta reset érvényes.

`scripts/test-shadow-realm.cjs`: történeti belépés, oltár és pihenés különbsége, kétirányú utazási zár, minibossok és tárgyaik, kulcsfogyasztás, bénítás és elszívás 30/60/120 FPS-en, szünet, megszakítás, egyszeri bossjutalom. A `test-routes.cjs` a tényleges ugrásfizikával vizsgálja a börtönzárat, a katedrálishoz vezető utat és az orgonakarzat visszaútját. A grafika és a valódi böngészős mentés külön ellenőrzést igényel.

`scripts/test-haru-trace.cjs`: normál/átállított interakció, börtönállapottól független nyom és távolság, 0/1/2 HP gyógyulás emelt HP-plafonnál is, párbeszéd alatti álló játékórák, ismételt kontextusok és bezárások, szentélyhatások hiánya, illetve tartós egyszeriség. A `test-save-release.cjs` titkosított újratöltéssel ellenőrzi az önállóan felhasznált nyomot; a kulcshoz és kapunyitáshoz továbbra is megköveteli az őr legyőzését.

`scripts/test-shadow-prison-route.cjs`: 30/60/120 FPS-es tényleges input és teljes játékciklus a lejutáshoz, a hét lépcső egyszeres ugrásos visszaútjához és a felső főúthoz minden képességkombinációval. Ellenőrzi a zárt csarnok felülről, keletről és alulról való megkerülési kísérleteit, a pap utáni ütközést, a kulcsnyitást és a szabad visszautat.

A nyitott külső börtönkapu immár külön belső pályára is vezet, új börtönnaggyal és Zen megmentésével. A külső őr, kulcs és zár megmarad; a részletes működés és a mentési előfeltételek a [Zen és a börtön mélye](ZEN-PRISON.md) dokumentumban találhatók.
