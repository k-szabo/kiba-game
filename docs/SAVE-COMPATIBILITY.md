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
