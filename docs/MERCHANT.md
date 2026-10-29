# Akash kereskedője

Akash magas, vékony ember, indiai utazó; Yomi `secret-tomb` párkányán, a `(710,2350)` ponton két normál őr fogva tartja. Az őrök legyőzése után a beállított interakcióval szabadítható ki. A `flags[1].akashRescued` egyszeri állapot; utána eltűnik a ketrecből és az erdei menedék `(930,820)` pontjára költözik. A táborban a többi túlélő változatlanul beszélgethető.

## Érmék és árak

Az érmék a kereskedés pénzneme. A zsákmány automatikusan bekerül a pénztárcába, és az XP-vel együtt mentődik.

| Forrás | Érme | Ismétlés |
| --- | --- | --- |
| Normál ellenfél | 5 | Halál/szentély/utazás utáni újraéledéskor ismét jár. |
| Idézett minion | 0 | Nem farmolható pénzért. |
| Őrzött miniboss | 20 | Az első győzelemkor. |
| Lávakígyó | 20 | Az első pikkely megszerzésekor. |
| Világ főbossa | 50 | Az egyszeri bossjutalom része. |

| Portéka | Ár | Tárolás és működés |
| --- | --- | --- |
| Ismeretlen eredetű sült hús | 10 | Korlátlanul gyűjthető stack; inventoryból vagy az átállítható `useMeat` művelettel, alapból Q-val (FR AZERTY: A) használható. |
| Akash teája | 25 | Külön `teaCount` stack; 6 aktív másodperc alatt három, egyenként 1 HP-s gyógyulás. |
| Iránytű | 220 | Egyszeri vétel; a bal felső feladatpanel alatt külön ikonnal, célmegnevezéssel, nyolcirányú nyíllal és közelségi jelzéssel mutatja a fő célt. |
| Kis útitérkép | 360 | Egyszeri vétel; helyi minimap a képernyő sarkában. |

A hús vásárláskor nem hat. Elfogyasztáskor egyszer sorsol: ⅔ eséllyel +2 HP, ⅓ eséllyel −1 HP; az eredmény 1 és a maximális HP között marad. A darab akkor is elfogy, ha a korlát miatt a HP nem változik. Szünetben, dialógusban, boltban, más menüben és a prológusban a gyorshasználat tiltott. Az inventory külön fogyasztógombja csak a kiválasztott húsra hat, a háttérben a játék fagyasztva marad. Az utolsó darab után a kijelölés és a fókusz érvényes tárgyra lép.

A hús utáni HP-visszajelzés a közös `CampHealth.number` formázóját használja az aktuális és a maximális értékre is. A páncél miatt keletkezett tört HP szám marad a játékmenetben; a kijelzés nem írja vissza a kerekített szöveget a karakterállapotba.

A minimap az aktuális helyszín közeli párkányait, a már ismert szentélyeket és Momo helyét rajzolja. A titkos területek felfedezésig rejtve maradnak; nincs boss-, tárgy- vagy fogolyjelölő. A nagy térkép és a gyorsutazás vásárlás nélkül is elérhető. A minimap DPR-érzékeny, a játék szünetében nem frissül, a főmenüben és az álomban rejtett.

## Állapot, UI és bővítés

A `coins`, `meatCount` és `teaCount` nemnegatív biztonságos egész a mentésben. Az eszközöket a Yomi-jelzők `compass` és `minimap` értékei birtokolják. Vásárlás csak a látható boltból, kiszabadított Akash közelében végezhető; az érmelevonás és a tárgyjóváírás egy mentési állapot. Halál, utazás és azonos kiadású újratöltés megőrzi az adatokat. A kompatibilis frissítések a kereskedőhöz kapcsolódó adatokat is megőrzik.

A `merchant.js` kezeli a katalógust, a gazdaságot, a boltot, az ételt és a minimapot. Az inventory közös `ART_INVENTORY.items` katalógusát, teljes sziluettet őrző cropjait és DPR-es ikonrajzolóját használja; `stack:true` és `category:'travelGear'` egészíti ki a korábbi egyedi küldetéstárgyakat. A shop asztali elrendezésű, görgethető, legalább 48px-es vásárlógombokkal és körbezárt billentyűfókusszal. Minden felirat a közös HU/EN locale-katalógusban szerepel.

A fejlesztői tárgyadó a húsból és a teából ismételten egy-egy darabot ad, az egyszeri eszközöket nem duplikálja. A fejlesztői tesztmód vásárlása és fogyasztása csak memóriában él; befejezés és normál Folytatás visszaállítja az eredeti mentést.

Grafikai forrás: hat önálló, jóváhagyott RGBA PNG az `assets/images/npcs/` és `assets/images/ui/` könyvtárban; a [gyártási rekord](art-prompts/akash-v1.json) tartalmazza a promptokat, alpha-határokat és a talpillesztést. Akash statikus sprite, új animáció nincs.

## Ellenőrzés

`npm run test:merchant` ellenőrzi a mentési pillanatképek érvényességét, az őrökhöz kötött kiszabadítást, a vásárlás egyszeriségét, a stacket, a gyorshasználatot, a HP-korlátokat, a szünetet, az érmejutalmak ismétlési szabályát és a dev izolációt. A `test-save-release.cjs` tényleges WebCryptóval, szimulált IndexedDB mellett teszteli az új mezők titkosított mentését és a hibás adatok elutasítását. A valódi böngészős reload, grafika, fókusz és HU/EN asztali elrendezés külön ellenőrzést igényel, 1280×720-as minimumon és nagyobb ablakban.

## Iránytű-kijelzés

A `compass.js` a `nextObjective()` közös célját jeleníti meg; a `Compass.objective(localObjective())` a tartós fő történeti mérföldkövekhez igazítja a helyi javaslatot. A dungeon, az aréna és az aktív mellékhelyszínek saját azonnali útmutatója megmarad. Egy már befejezett birodalomba visszatérve a főút a következő szükséges helyszínt követi, Hannah után pedig az egyelőre elért történeti végpontot jelzi. Másik helyszín koordinátájához nem rajzol hamis helyi iránynyilat: a cél neve és külön távoli jelzés jelenik meg.

Helyi cél esetén Momo középvonalához és talppontjához viszonyít, nyolc irányt különböztet meg. 90 világpixel vízszintes és 85 függőleges távolságon belül pipa és közelségi szöveg jelenik meg. A jelzés irányt mutat; nem útvonalkereső és nem fed fel titkos mellékcélokat. Az irány nélküli `compass:false` cél üresjárati vagy történeti végpontjelzést ad. A megvásárolt és devben adott tárgy ugyanazt a nézetet kapcsolja be.

A `journeyHUD` függőleges elrendezése a feladatot és a birtokolt iránytűt egymás alá teszi, elkerülve a korábbi rögzített pozíciók átfedését. A kijelző a támogatott, legalább 1280×720-as asztali nézetben ellenőrizendő, a telegráfok szabadon hagyásával. Nincs forgó/pulzáló animáció; pause alatt a kijelzés változatlan, nyelvváltás a szöveget frissíti. A festett iránytű eredeti képét használja, új bitmap vagy képátalakítás nincs.

`npm run test:compass` ellenőrzi a birtoklást, irányokat, közelséget, fő célok váltását, titkos helyek kihagyását, mellékterületeket, prológus/főmenü rejtést és a játékmenetet nem módosító renderelést.

## Tea és közös gyorshasználat

A Q alapértelmezésű (FR AZERTY: A), átállítható művelet belső azonosítója kompatibilitás miatt továbbra is `useMeat`; az elnevezése már gyógyító tárgy használata. A hátizsákban a hús vagy tea részleteinél választható ki a gyorshasználati tárgy. A mentett `quickHeal` értéke `roastMeat`, `tea` vagy Sofiye főzeténél `healingBrew`. Ha a kijelölt készlet elfogy, a másik készletre vált, ha abból van adag; az adott gombnyomás csak egy tárgyat használ el.

A tea 2, 4 és 6 aktív másodpercnél legfeljebb 1–1 HP-t gyógyít. Nem lépi túl a maximumot, teljes HP-n és aktív teahatás mellett újabb adag nem fogyasztható. Az inventory, szünet, dialógus és egyéb panelek fagyasztják az időzítőt. Halál, helyszínváltás, főmenü és a tesztmód befejezése törli a hatást, az el nem fogyasztott készletet megőrzi. A hatás átmeneti, mentésbe nem kerül. A készlet és a gyorshasználati választás szigorúan validált és az aktuális kiadáson belül mentődik.

A `test-merchant-tea.cjs` ellenőrzi a hús pontos valószínűségi határát, a teát 30/60/120 FPS mellett, a szünetet, a készletek elkülönítését, a dev adást, az aktuális inputot és az automatikus váltást. A tea teljes natív alpha-képe a közös `ART_INVENTORY.items` rendererrel jelenik meg; gyártási rekord: [akash-tea-v1.json](art-prompts/akash-tea-v1.json).

## Eladás Akashnak

A bolt eladásgombja az inventoryt nyitja meg. Eladás csak a kiszabadított Akash közelében, a látható inventoryból végezhető, külön megerősítéssel. A kijelölés, nyelvváltás, újrarajzolás vagy bezárás érvényteleníti a függő megerősítést. A szükséges kulcsok, glória, szarv, Alkonyat Pecsétje, megrontott ének és a felszerelt kard nem eladható.

| Holmi | Vétel | Eladás |
| --- | ---: | ---: |
| Hús | 10 | 4 |
| Tea | 25 | 10 |
| Iránytű | 220 | 90 |
| Kis útitérkép | 360 | 140 |
| Telefontok | 1500 | 50 |
| Esküszegő / Yomi-őrző / szeráf / őrült pap lelke | — | 200 / 300 / 500 / 600 |
| Az első démon lord lelke | — | 800 |
| Démon lord szíve | — | Nem eladható; Fiának átadható |
| Kígyópikkelyek / Három birodalom talizmánja | — | Nem eladható |
| Daisy / Démonölő számszeríja | — | 120 / 300 |

Daisy csak a kihelyezése előtt adható el. Az oltárnál hagyott nyulat a közös `consumedBy` szabály az inventory és a kereskedő birtoklási nézetéből is eltávolítja; a megszerzés történeti jelzője megmarad.

A telefontok egyszerre egy példányban birtokolható, eladás után újravásárolható, használati hatása nincs. A közös árlista és egyedi tárgy–világ hozzárendelés a `levels.js` `MERCHANT_SALES` táblája; a bolti vételárak a `Merchant.catalogue` adatai. Eladáskor az érmejóváírás és a tárgy levonása egyetlen mentési állapot. Biztonságos egész túlcsordulás esetén a művelet módosítás nélkül elutasított.

Az egyedi tárgyak eredeti megszerzési jelzője megmarad, a birtoklást a mentett, szigorúan validált `soldItems` lista szűri. Így a bossjutalom, XP és statpont nem vész el, a zsákmány nem jelenik meg újra, a kígyók egyszeri jutalma a fúzió után sem farmolható újra. A három pikkely és a talizmán védett: Fumi rítusa fogyasztja a pikkelyek birtoklási nézetét, az eladási rendszer nem. Az eladott iránytű/minimap kikapcsol, visszavásárláskor a régi megszerzési jelző duplikálása nélkül áll helyre. A fogyó holmik a meglévő készletből fogynak; az utolsó kijelölt adag eladása a másik készletre kapcsol, ha van belőle. A már elfogyasztott tea átmeneti hatása független a megmaradt készlet eladásától.

A `test-merchant-sales.cjs` a tranzakciókat, megerősítést, védett tárgyakat, visszavásárlást és ismételt eladás kizárását ellenőrzi; a titkosított mentési köröket a `test-save-release.cjs` végzi.

A kultista templom dungeonjének `sectSeal` pecsétje 50, a `highPriestessSoul` lelke 400 érméért adható el. A pecsét halmozható közös dungeon-készlet; a lélek egyszeri, japán világhoz tartozó tulajdonjelző. Eladásuk nem engedi az egyszeri boss-pont vagy lélekjutalom újratermelését.

## Üres gyógyító gyorshasználat

A `quickHeal` kezdőértéke `null`; üres készlethez nem tartozik látszólag kijelölt hús. A `Merchant.selectAvailable()` megtartja a ténylegesen birtokolt kijelölést, egyébként az első elérhető gyógyító tárgyat választja, vagy üres készletnél `null`-t ad. Az első megszerzett gyógyító tárgy automatikusan kijelölődik, a játékos későbbi választása megmarad, amíg az adott készlet el nem fogy. A közös mentési pillanatkép is normalizál, így a főzetkészítéshez hasonló készletváltozások ugyanazt a szabályt használják.

A mentésvalidátor az explicit `null`-t fogadja el az üres választáshoz; a hiányzó mezőt és az ismeretlen azonosítókat továbbra is elutasítja. A régi, ismert tárgyazonosítókat tartalmazó mentések érvényesek maradnak: folytatáskor a készlethez igazodik a kijelölés, haladásvesztés nélkül. Az inventory üres készletnél elrejti a gyorshasználati tárgysort. Regresszió: `scripts/test-quick-heal-empty.cjs`, valamint a titkosított üres kijelölés oda-vissza tesztje a `test-save-release.cjs` fájlban.
