# Akash kereskedője

Akash magas, vékony ember, indiai utazó; Yomi `secret-tomb` párkányán, a `(710,2350)` ponton két normál őr fogva tartja. Az őrök legyőzése után a beállított interakcióval szabadítható ki. A `flags[1].akashRescued` egyszeri állapot; utána eltűnik a ketrecből és az erdei menedék `(930,820)` pontjára költözik. A táborban a többi túlélő változatlanul beszélgethető.

## Érmék és árak

Az érmék a meglévő fejlesztési szilánkoktól független pénznem. A zsákmány automatikusan bekerül a pénztárcába, és az XP-vel együtt mentődik.

| Forrás | Érme | Ismétlés |
| --- | --- | --- |
| Normál ellenfél | 5 | Halál/szentély/utazás utáni újraéledéskor ismét jár. |
| Idézett minion | 0 | Nem farmolható pénzért. |
| Őrzött miniboss | 20 | Az első győzelemkor. |
| Lávakígyó | 20 | Az első pikkely megszerzésekor. |
| Világ főbossa | 50 | Az egyszeri bossjutalom része. |

| Portéka | Ár | Tárolás és működés |
| --- | --- | --- |
| Ismeretlen eredetű sült hús | 10 | Korlátlanul gyűjthető stack; inventoryból vagy az átállítható `useMeat` művelettel, alapból O-val használható. |
| Iránytű | 220 | Egyszeri vétel; a bal felső feladatpanel alatt külön ikonnal, célmegnevezéssel, nyolcirányú nyíllal és közelségi jelzéssel mutatja a fő célt. |
| Kis útitérkép | 360 | Egyszeri vétel; helyi minimap a képernyő sarkában. |

A hús vásárláskor nem hat. Elfogyasztáskor egyszer sorsol: 50% +1 HP, 50% −1 HP; az eredmény 1 és a maximális HP között marad. A darab akkor is elfogy, ha a korlát miatt a HP nem változik. Szünetben, dialógusban, boltban, más menüben és a prológusban a gyorshasználat tiltott. Az inventory külön fogyasztógombja csak a kiválasztott húsra hat, a háttérben a játék fagyasztva marad. Az utolsó darab után a kijelölés és a fókusz érvényes tárgyra lép.

A minimap az aktuális helyszín közeli párkányait, a már ismert szentélyeket és Momo helyét rajzolja. A titkos területek felfedezésig rejtve maradnak; nincs boss-, tárgy- vagy fogolyjelölő. A nagy térkép és a gyorsutazás vásárlás nélkül is elérhető. A minimap DPR-érzékeny, a játék szünetében nem frissül, a főmenüben és az álomban rejtett.

## Állapot, UI és bővítés

A `coins` és `meatCount` nemnegatív biztonságos egész a mentésben. Az eszközöket a Yomi-jelzők `compass` és `minimap` értékei birtokolják. Vásárlás csak a látható boltból, kiszabadított Akash közelében végezhető; az érmelevonás és a tárgyjóváírás egy mentési állapot. Halál, utazás és azonos kiadású újratöltés megőrzi az adatokat. Az új kiadás a szokásos haladásresetet használja; nincs korábbi verziójú merchant-adat migráció.

A `merchant.js` kezeli a katalógust, a gazdaságot, a boltot, az ételt és a minimapot. Az inventory közös `ART_INVENTORY.items` katalógusát, teljes sziluettet őrző cropjait és DPR-es ikonrajzolóját használja; `stack:true` és `category:'travelGear'` egészíti ki a korábbi egyedi küldetéstárgyakat. A shop három oszlopról egy oszlopra tördel, görgethető, legalább 48px-es vásárlógombokkal és körbezárt billentyűfókusszal. Minden felirat a közös HU/EN locale-katalógusban szerepel.

A fejlesztői tárgyadó a húsból ismételten egy-egy darabot ad, az egyszeri eszközöket nem duplikálja. A fejlesztői tesztmód vásárlása és fogyasztása csak memóriában él; befejezés és normál Folytatás visszaállítja az eredeti mentést.

Grafikai forrás: öt önálló, jóváhagyott RGBA PNG az `assets/images/npcs/` és `assets/images/ui/` könyvtárban; a [gyártási rekord](art-prompts/akash-v1.json) tartalmazza a promptokat, alpha-határokat és a talpillesztést. Akash statikus sprite, új animáció nincs.

## Ellenőrzés

`npm run test:merchant` ellenőrzi a mentési pillanatképek érvényességét, az őrökhöz kötött kiszabadítást, a vásárlás egyszeriségét, a stacket, a gyorshasználatot, a HP-korlátokat, a szünetet, az érmejutalmak ismétlési szabályát és a dev izolációt. A `test-save-release.cjs` tényleges WebCryptóval, szimulált IndexedDB mellett teszteli az új mezők titkosított mentését és a hibás adatok elutasítását. A valódi böngészős reload, grafika, fókusz és keskeny HU/EN elrendezés külön ellenőrzést igényel.

## Iránytű-kijelzés

A `compass.js` tiszta HUD-nézet a `nextObjective()` pontjára és jóváhagyott, meglévő célnevére. Momo középvonalához és talppontjához viszonyít, nyolc irányt különböztet meg. 90 világpixel vízszintes és85 függőleges távolságon belül pipa és közelségi szöveg jelenik meg. A jelzés irányt mutat; nem útvonalkereső és nem fed fel titkos mellékcélokat. A tábor és a csarnok `compass:false` célja üresjárati jelzést ad. A megvásárolt és devben adott tárgy ugyanazt a nézetet kapcsolja be.

A `journeyHUD` függőleges elrendezése a feladatot, az iránytűt és az ereklyelistát egymás alá teszi, elkerülve a korábbi rögzített pozíciók átfedését. Keskeny kijelzőn harc közben az iránytű a feladatpanellel együtt elrejtőzik, hogy a telegráfok szabadon maradjanak. Alacsony ablakban a célpanel tömörül. Nincs forgó/pulzáló animáció; pause alatt a kijelzés változatlan, nyelvváltás a szöveget frissíti. A festett iránytű eredeti képét használja, új bitmap vagy képátalakítás nincs.

`npm run test:compass` ellenőrzi a birtoklást, irányokat, közelséget, fő célok váltását, titkos helyek kihagyását, mellékterületeket, prológus/főmenü rejtést és a játékmenetet nem módosító renderelést.
