# Erdei menedék

Az első változat külön, biztonságos oldalhelyszín: Japán őrzőjének legyőzése után a templomi aréna nyugati részén, a `(8870, 1000)` ponton megjelenő torii vezet a táborba. Az interakció a beállított `interact` műveletet használja. A visszaút ugyanide vezet; a következő halálhoz a japán templomi szentély lesz a mentőpont.

A táborban a szentélynél gyógyulás és fejlesztés, a három túlélőnél beszélgetés érhető el. Daichi, Natsu és Sora külön, statikus, átlátszó sprite-ot kapott. Nem harci szereplők: nincs HP-juk, jutalmuk vagy találati célpontjuk. A beszélgetés a közös dialógussávot nyitja, amely megállítja a játékot. Daichi beszélgetése Japán őrzőjének legyőzése után a falusiak mentőküldetését indítja; Natsu és Sora saját beszélgetése megmarad.

## Állapot és mentés

- A `forestCamp` önálló `2800 × 1080` pálya, folyamatos talajjal az `y=820` magasságban; nem kerül a `levels` négy birodalma közé. A `realm` értéke `0` marad.
- A `realmRests(0)` egyesíti Japán és a tábor szentélyeinek utazási katalógusát. A tábor szentélye nem kerül a japán pálya fizikai `rests` listájába.
- Az első belépés regisztrálja a `visitedRests[0]` listában az egyedi `forestCamp` azonosítót. A feloldott, még meg nem látogatott cél látható, de letiltott. A saját tábori térkép a helyi geometriát és Momo helyét mutatja; a birodalmak között a meglévő gyorsutazási felület használható.
- A mentés `location` mezője a táborban `forestCamp`, az új oldalhelyszíneken a `SIDE_LOCATIONS` megfelelő azonosítója, a főpályákon `null`. Folytatás és halál után Momo a tábori szentélynél jelenik meg. A csarnok eddigi, átmeneti helyszínkezelése nem változik.
- A validátor megköveteli az első boss legyőzését, a befejezett prológust, a felfedezett tábori szentélyt és annak pontos koordinátáit. Ismeretlen helyszín vagy a tábori mentőpont normál japán mentésben nem fogadható el.
- Az utazás a meglévő világállapotokat, képességeket, XP-t, fejlesztéseket és egyszeri bossjutalom-jogcímeket megőrzi. Normál ellenfelek a meglévő gyorsutazási/újraéledési szabályt követik.

## Daisy az oltár mellett

A már megszerzett Daisy a meglévő szentélytől balra, a `(1130,820)` pont közelében helyezhető el a beállított interakciógombbal. A `CampQuest` csak aktív játékban, a menedékben, közelség és tényleges birtoklás mellett engedi a műveletet; egy régi interakció sem fogyaszthat tárgyat máshonnan vagy kétszer. Az elhelyezés végleges az adott utazáson, rövid, szüneteltető jelenettel és Sora új párbeszédével. A démonok elleni oltalom és a tábor jobb morálja történeti hatás, nem HP-, páncél- vagy sebzésbónusz. A szentély pihenése és fejlesztése változatlan.

A `flags[0].daisyPlaced` jelző mentődik, az eredeti Yomi-beli megszerzési és bossgyőzelmi jelzők megmaradnak. Az inventory közös `consumedBy` szabálya miatt Daisy kikerül a hátizsákból, nem eladható és dev tárgyadással sem duplázható. A validátor megköveteli Daisy megszerzését, őrzőjének legyőzését és kizárja az eladott nyúl kihelyezését. Halál, pihenés, helyszínváltás és ugyanazon kiadás folytatása megőrzi; új utazás vagy új kiadás reseteli. A meglévő alfás inventorygrafika teljes kivágása, álló pózban, a járható talajra illesztve jelenik meg, külön új szentély vagy animáció nélkül.

Célzott regresszió: `npm run test:refuge-keepsake`. A titkosított mentési ellenőrzések a `test-save-release.cjs` részei; tényleges böngészős tárolás és vizuális minőség külön ellenőrzendő.

## NPC-k és grafika bővítése

A `forestCamp.npcs` katalógus bejegyzései: `id`, `x`, `y`, `name`, `dialogue`, `image`, `height`. A `name` és `dialogue` lokalizációs kulcs. Később egy NPC `requiresFlag: {realm, id}` feltételt kaphat; ezt a megjelenítés és az interakció ugyanazzal a `campNPCVisible` függvénnyel ellenőrzi. Új NPC-hez külön jóváhagyott szöveg, grafikai koncepció és mentési/küldetésfeltétel szükséges.

A képek az `ART_MANIFEST`, az eredeti méretek és talpillesztések az `ART_CAMP` metaadatában szerepelnek. A háttér három natív 1254 × 1254 képpanelből áll, 160 világ-egységes átfedéssel, egyszer elkészített natív felbontású alfa-maszkkal. Két festett cédrus takarja a szerkezeti illesztéseket a járható út mögött. A korábbi kép tartalék és referencia; a `groundY=532 / h=724` arány továbbra is a járható `y=820` talajhoz igazít. A panelenkénti részletsűrűség kb. 1,55-szörös a korábbihoz képest; nem a régi bitmap egyszerű nagyítása. A sprite-ok és a cédrus eredeti RGBA-pixelei megmaradnak. Promptok: [eredeti tábor](art-prompts/forest-camp-v1.json), [részletes panelek](art-prompts/forest-camp-hd-panels.json), [cédrus](art-prompts/camp-cedar-v1.json).

A tábor ugyanazt a részecskerajzolót hívja Momo előtt, mint a normál pályák: a szellemlépés nyoma látható, szünetben áll, csökkentett mozgásnál nem keletkezik. A háttér részletsűrűségét és talajillesztését a `test-camp-backdrop.cjs`, a nyomot tényleges inputtal a `test-camp-dash.cjs` ellenőrzi; a látványhoz külön böngészős ellenőrzés kell.

## Ellenőrzés

`npm run test:forest-camp` ellenőrzi a belépési és mentési feltételeket, a beállított interakcióbillentyűt, a dialógus alatti megállást, a gyógyítást/fejlesztést, a halált és lezuhanást, az utazást és a jutalmak egyszeriségét. A mozgás, a dash lejárata és a gravitáció 30/60/120 FPS mellett, minden képességkombinációval fut. A `test-save-release.cjs` valódi WebCryptóval, szimulált IndexedDB mellett a tábor titkosított mentését is ellenőrzi. A látvány és a valódi böngészős mentés külön böngészőtesztet igényel.

## Akash – 0.9.21

Yomiban történt kiszabadítása után a táborban megjelenik Akash ember kereskedő. A `(930,820)` ponton áll, `requiresFlag:{realm:1,id:"akashRescued"}` feltétellel és `merchant:true` szereppel. A közös NPC-láthatóságot használja; interakciója szüneteltető boltot nyit. Natsu és Sora meglévő párbeszéde megmarad; Daichi mentőküldetésének leírása fentebb található. [Gazdaság, portékák és mentés](MERCHANT.md).
## Daichi mentőküldetése és a tábori szolgáltatások

A küldetés felvétele után négy feltételes lépcső jelenik meg a japán templom fölött, és a `(9770,600)` kapu az opcionális Szamurájtáborba vezet. A lépcsők nem részei az első boss eredeti harci geometriájának, és dupla ugrás/dash nélkül is járhatók. A tábor külön `4400×1600` helyszín katonákkal, két pihenőhellyel, három ketreccel és a Tábormesterrel. A polgármester jelenete egyszer fut; a Tábormester legyőzése nyitja a ketreceket. Ren, Sofiye és Fumi külön menthető ki, ezután Daichi lezáró beszélgetése elérhető. A főbossok és a világok közötti továbbjutás ettől független marad.

| Helyszínazonosító | Belépés az erdei menedékből | Feloldás |
| --- | --- | --- |
| `forgeInterior` | `(1520,820)` | `smithRescued` |
| `herbalHut` | `(1980,820)` | `herbalistRescued` |
| `mysticTent` | `(2530,820)` | `enchanterRescued` |

Mindhárom külön, bejárható `1500×1080` belső tér, saját pihenőhellyel és visszaúttal. A szolgáltatás csak a megfelelő NPC közelében nyitható; az ablak megállítja a játékot. Bezárás, helyszínváltás vagy újrarenderelés után a régi gombkezelők nem végezhetnek új tranzakciót.

Ren a fegyvert és a páncélt külön-külön öt fokozatig fejleszti. A következő fokozat ára 50 × fokozat érme; a fegyverfokozat minden birtokolt stílusnak közös +0,5 alap sebzést, a páncélfokozat +20 Armort ad. A szentélyes statpontfejlesztés külön megmarad. Másik kezdőfegyver 100 érméért vehető, 50-ért adható el; a felszerelt/utolsó fegyver nem eladható. A megvásárolt fegyver a hátizsákból is felszerelhető. A relikviafegyverek és Fumi bűvölése egyelőre letiltott szolgáltatáshelyek.

Sofiye megbízásának felvétele után Japán mind a hat főútszakaszán összesen kilenc gyógynövényfolt szedhető. A pontos helyek a `CampHerbs.patches` katalógusban vannak; minden folt járható talajon áll, és a platformok után rajzolódik, ezért a növényeket nem takarja el a terepgrafika. Három csokorból egy, legfeljebb 3 HP-t azonnal gyógyító főzet készül. A foltok pihenés/halál/helyszín-újratöltés után újrateremnek; a már gyűjtött mennyiség megmarad. A főzet a közös gyógyító gyorshasználathoz rendelhető, a meglévő hús és tea mellett; elfogyáskor a következő elérhető gyógyító tárgyra vált.

## Adat- és mentési határok

A `SIDE_LOCATIONS` az új kis helyszínek közös katalógusa a helyszínváltás, mentésvalidáció, gyorsutazás és dev-teleport számára. A főpályák fizikai geometriája és a teljes utazási katalógus külön marad. Normál gyorsutazáshoz a helyszín feloldása és saját pihenőjének felfedezése is szükséges. A helyi térkép/minimap az aktuális oldalhelyszínt mutatja. Mentés/folytatás a helyszín egyedi pihenőjére helyez, a helyszínváltás pedig megőrzi a pozitív tört HP-t.

A mentés új `campServices` mezője: `ownedWeapons`, `weaponRank`, `armorRank`, `herbs`, `potions`. A megengedett rangok 0–5, az egész készletek nemnegatív biztonságos egészek, a felszerelt stílusnak a birtokolt listában kell lennie. A validátor ellenőrzi a küldetés, a bossjelenet és a mentések sorrendjét; kovácsfejlődéshez a kovács megmentése, növény/főzet készlethez Sofiye megbízása szükséges. Kompatibilis frissítéskor a tábor és a szolgáltatások haladása megmarad.

Modulok: `camp-services.js` tiszta tranzakciók; `camp-quest.js` küldetés és helyszínváltás; `camp-master.js` harc; `camp-workshop.js` szolgáltatásablak; `camp-herbs.js` gyűjtés; `camp-health.js` tört HP; `camp-art.js` festett látvány. Az új tesztcsoport `npm run test:camp-npcs`; a valódi képi minőséget és böngészős tárolást külön böngészőteszt ellenőrzi.

## Küldetésjelölések és a Tábormester harca

A küldetésadó feje felett az elérhető megbízást **!**, a leadhatót **?** jelzi. Daichi lezárásakor a `campQuestCompleted` mentett jelző eltünteti a jelet és a visszatérési célt. Sofiye új főzethez ismét megbízást kínál; a `herbalistQuestTurnedIn` a következő műhelybeszélgetéskor törlődik. Fumi első látogatása a `serpentRitualKnown` jelzőt állítja be; három birtokolt pikkelynél kérdőjel, elkészült talizmánnál semmilyen jel nem látszik. A jelölések álló, nagy kontrasztú jelek, szünetben sem animálnak.

A Tábormester 150 világ-egység magas. A régi 15 pózt hat külön ugrópóz egészíti ki; az ugrás célpontja a felkészüléskor rögzül. A 60 és 40 százalékos HP-küszöb egyenként két katonát idéz, nagy sebzésugrás esetén is pontosan egyszer. Tíz százaléknál három íjász célozza a foglyokat: az előjelzés után 15 másodperc áll rendelkezésre az íjászok vagy a boss legyőzésére. Az összes íjász halála megállítja a kivégzést. Sikertelen kísérletkor a harc teljesen újrapróbálható, a foglyok nem vesznek el végleg. A közös frissítési út és a párbeszéd alatti megállás a számlálóra is vonatkozik. Az idézések nem adnak farmolható XP-t vagy pénzt.

Első győzelemkor a meglévő 150 XP és 60 érme mellett a `campMasterSoul` tárgy is jár, és megjelenik a győzelmi párbeszéd. A dev-újrajátszás nem ad új jutalmat. A lélek ugyanúgy eladható Akashnak, mint a többi bosslélek. A `BossCues.box` közös rajzoló egyező szaggatott útvonalon rajzolja a sötét kontrasztkeretet és a világos jelzést; a sötét vonal nem tölti ki a szaggatás hézagait.

A szamurájtábor három natív 1536×1024-es háttérpanelt és külön nagy felbontású talaj-/kőplatform-atlaszt használ. A távoli háttér a teljes natív képmagasságot használja: normál asztali nézetben a panelek 1080×720 világ-egységesek, nem egy sátor felnagyított részletei. A kamera vízszintes elmozdulásának 40%-át követi, a kép széléhez korlátozva; függőlegesen a nézethez igazodik, ezért ugráskor sincs képszéli rés. Szélsőségesen széles nézetnél a teljes panelcsoport arányosan fedi le az ablakot. Csak a belépő panel keskeny széle halványul, így nincs dupla sötétedés vagy széles, szellemképes átfedés. A panelek natív felbontású, egyszer készülő maszkja és a külön felszínrajzolás nem változtatja meg az ütközési geometriát. A `test-camp-art.cjs` 1280–3840 világ-egység széles nézeteken és különböző kamerahelyzetekben ellenőrzi a lefedést és a platformok változatlanságát. A belső terekben a támadási képernyőrázás kikapcsolt, így a háttérbe festett és külön rajzolt tárgyak együtt maradnak.

A megmentett Zen a szentély mellett kap helyet, közvetlen, gyerekkori barátként beszél Momóval és a túlélőkért imádkozik. Csak a flags[3].zenRescued történeti állapot után látható; a külön börtönág részletei: [Zen](ZEN-PRISON.md).
