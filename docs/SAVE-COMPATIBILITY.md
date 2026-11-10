# Mentések kompatibilis frissítése

A `0.9.52` UI-frissítéstől az új kiadásazonosító önmagában nem törli a haladást. A `release.json` `savePolicy: "preserve-compatible"` és `saveCompatibility` mezője választja el a megjelenített verziót a mentések kompatibilitási korszakától.

Az első korszak a `0.9.51_2d78d59b` mentését is átveszi. Csak ez a megnevezett, még korszakbélyeg nélküli kiadás kapcsolható az új rendszerhez; régebbi, korábban érvénytelenített haladás nem áll vissza.

## Kiadás készítése

- Első átállás: `release --metadata <fájl> --preserve-saves-from 0.9.51_2d78d59b --write`.
- Kompatibilis kiadás: a szokásos `release` vagy `bugfix` parancs. A korszakot automatikusan megőrzi.
- Mentést érintő kompatibilitástörés: `--reset-saves`. Csak akkor használjuk, ha a korábbi haladás a módosítás után nem tartható meg érvényesen. Az ok szerepeljen a kiadás leírásában. Az új verzió lesz az új korszak határa.

Ne módosítsd kézzel a verziót vagy a korszakot, és ne lazítsd a validátort azért, hogy hibás adat betölthető legyen. A nyelv, a billentyűkiosztás és a képgyorsítótár kikapcsolási beállítása külön preferencia, resetkor is megmarad.

## Hitelesítés és tranzakció

A régi ciphertext a forrás kiadásával, eszközazonosítójával, saltjával és revíziójával fejthető vissza. A visszafejtett rekord kiadásának is egyeznie kell. Ezután a teljes adatot a jelenlegi pálya- és készletszabályok ellenőrzik. Csak érvényes adat kapja meg az aktuális kiadásbélyeget és záródik újra; a kulcs és az eszközazonosító megmarad.

Az aszinkron kriptográfiai munka után egy IndexedDB-tranzakció ismét ellenőrzi a forrásprofilt és a pontos ciphertextet. Ha másik lap közben mentett vagy frissített, a művelet legfeljebb nyolcszor újraolvassa az aktuális állapotot. Nem írja felül a másik lap újabb adatát. A profil és a mentés együtt frissül, a helyi tükör csak ezt követi. Sérült vagy az új szabályokkal érvénytelen kompatibilis adatnál az eredeti rekord megmarad; nincs automatikus törlési kerülőút.

Régebbi böngészőlap nem írhat az újabb kiadás profiljába. Ismeretlen vagy újabb kiadásból származó rekordot egy régi kliens nem próbál visszafelé átalakítani vagy resetelni. A teljes kiadásazonosítók sorrendjét a verzió és a rögzített kódlista határozza meg, nem a hash betűrendje.

## Ellenőrzés

`node scripts/test-save-compatibility.cjs` valódi WebCryptóval és szimulált IndexedDB-tranzakciókkal ellenőrzi a kompatibilis átállást, párhuzamos lapokat, félbemaradt kriptográfiai műveletet, korrupciót és az explicit resetet. A `test-save-release.cjs` a korábbi resetpolitika és az általános validálás regresszióit is megtartja. A tényleges böngészős IndexedDB-átállást friss, szintetikus profilon külön ellenőrizni kell.

## Három kalandhely és hordozható mentés

Az IndexedDB `vault` tárolójában a `slots` háromelemes tömb tárolja a külön titkosított kalandokat és hitelesített revízióikat. A profil `slotSchema: 1`, `activeSlot` és `selection` mezője rögzíti a kiválasztást. A régi egyetlen `save` rekord az első helyre kerül egy atomikus tranzakcióban; a ciphertext, profilkulcs, eszközazonosító és revízió megmarad. A `save` rekord és a localStorage titkosított másolata ezután az aktív hely tükre. A tükör önmagában továbbra sem hordozható másik böngészőbe.

A közös profil revíziója minden íráskor és helyváltáskor nő; az egyes helyek saját revízióval fejthetők vissza. A kompatibilis frissítés minden foglalt helyet ellenőriz és egy tranzakcióban zár újra. Egyetlen hibás hely esetén az eredeti adatok megmaradnak. Kifejezett korszakváltáskor mindhárom hely együtt ürül. Másik lap helyváltása után a régi lap nem menthet tovább az előző kijelöléssel; a felületnek újra ki kell választania a kívánt helyet.

A `SaveVault.listSlots()` leválasztott, validált snapshotokat ad vissza a helyi kezelőfelületnek; a `selectSlot(1..3)` visszaadja a kiválasztott kalandot vagy `null` értéket. Az `exportSlot()` külön, olvasható JSON-dokumentumot készít (`format: "kiba-realms-save"`, `version: 1`, `release`, `compatibility`, `snapshot`). Ez szándékosan hordozható játékadat, személyes profilkulcs nélkül. Nem tekinthető szerver által hitelesített ranglistaeredménynek vagy manipulálhatatlan bizonyítéknak.

Az `importSlot(slot, text)` a megadott helyet frissíti, de nem váltja át az aktív helyet. Az aktív hely importja a kijelölési generációt is atomikusan növeli: másik nyitott lap régi kalandja nem írhatja felül az importált haladást. Legfeljebb 30 000 karakteres dokumentumot fogad, ellenőrzi a formátumot, a kompatibilitási korszakot, a regiszter szerinti kiadási sorrendet, majd a teljes szigorú játékmeneti validátort futtatja. Ismeretlen, újabb vagy korábbi korszakú kiadás nem tölthető be. Siker esetén új salt/nonce mellett a fogadó böngésző saját, nem exportálható profilkulcsával titkosít; hiba esetén nem írja át egyik kalandot sem. A torony és a párbaj tárolása ettől független.

A `scripts/test-save-transfer.cjs` valódi WebCryptóval ellenőrzi a három helyet, az örökölt egyhelyes átállást, másik profilba importálást és visszatöltést, az érvénytelen fájlok atomikus elutasítását, sorba rendezett írás/helyváltást, régi böngészőlapokat, mindhárom hely kompatibilis frissítését és explicit korszakresetjét. A fájlválasztó/letöltés és a tényleges IndexedDB külön böngészős ellenőrzést igényel.

## Hannah szívjutalmának javítása

A `0.9.58_7eabbd35` kiadás a tényleges, történetileg rögzített `hannahFiaRescue` befejezéshez köti a `demonLordHeart` jutalmat. Fia későbbi halála nem vonja vissza a korábban jogosan megszerzett szívet. A hitelesített, kompatibilis, legfeljebb `0.9.57_b9f518f8` forráskiadású mentésekből a migráció csak a korábban tévesen kiosztott `demonLordHeart` és `demonLordHeartGiven` jelzőt távolítja el, ha a tényleges Fia-befejezés hiányzik. A forráskiadást a regiszter sorrendje ellenőrzi; ismeretlen vagy újabb kiadás nem kap kivételt.

A teljes validáció a szűk történeti kivétellel is lefut, majd a javított állapot ismét szigorúan ellenőrződik. Nem keletkeznek Fia-küldetésjelzők, a lélek, XP, fejlesztéspontok és minden más haladás megmarad; a mentéskompatibilitási korszak nem változik. Az új kiadás saját írója már csak a szigorú jutalomszabálynak megfelelő rekordot fogadja el. Regresszió: `scripts/test-hannah-heart.cjs` és a valódi WebCrypto-fordulókat futtató `scripts/test-hannah-saves.cjs`.
