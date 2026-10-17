# Fejlesztői eszközpanel

A panel jelszó és külön konfiguráció nélkül elérhető, helyi futtatásban és GitHub Pagesen is. A 0.9.13 a panel alapját és a későbbi eszközök regisztrációját tartalmazza; a boss-visszahívás, teleport, halhatatlanság, sebzésszámok és tárgyidézés külön fejlesztési feladatok.

## Megnyitás és bezárás

A játék címéhez add hozzá a `#devtools` fragmentet:

- Helyben: `http://localhost:8000/#devtools`
- GitHub Pagesen, a verzió publikálása után: `https://k-szabo.github.io/kiba-game/#devtools`

A panel azonnal megnyílik, nincs belépés vagy jelszóbeállító script. Főmenüből, aktív játékból és szünetmenüből nyitható; más felületek és átvezetők közben nem lép a játékállapotuk helyére. Az URL-fragment megváltoztatásával futás közben is megnyitható.

A panel megállítja a játékot és törli a lenyomva maradt játékbillentyűket. A Bezárás gomb vagy az Escape visszaállítja az előző állapotot és fókuszt; az URL-ből eltűnik a fragment. Szünetmenüből nyitva bezárás után is szünet marad. A Tab és Shift+Tab a panel kezelőszervei között mozog. A feliratok követik a játék HU/EN nyelvét.

A megnyitását csak fejlesztői dokumentációban ismertetjük: a README, a játékmeneti útmutató, a játék súgója és a játékosoknak szóló változásnapló nem hirdeti.

## Elkülönített tesztmód

A **Tesztmód indítása** külön, csak memóriában futó próbát kezd. A főmenüből Japán első pihenőhelyén indít, a meglévő mentés haladásának másolatával, vagy mentés hiányában új karakterrel. Aktív játékból a pillanatnyi helyzetet tartja meg; az álomprológusból biztonságosan Japánba lép.

A teszt alatt a közös `persist()` nem módosítja sem a normál folytatáshoz használt adatot, sem a SaveVault rekordját. A panel bezárása után a próba játszható; a látható tesztjelzés megmarad. A **Teszt befejezése**, illetve a főmenübe visszatérés eldobja a tesztet. A normál mentés a Folytatással ismét használható. A lap újratöltése is eldobja a memóriában futó tesztet. A puszta panelnyitás továbbra sem kezd tesztet és nem ír mentést.

## Új eszköz hozzáadása

A zárt runtime modulon belül regisztrálj műveletet:

```js
DevTools.register({
  id: 'example-tool',
  labelKey: 'dev.example',
  run: () => { /* Az adott kártya szinkron művelete. */ },
  available: () => true
});
```

Az `available` feltétel opcionális; a felirat mindkét nyelven az `assets/i18n/locales.json` fájlba kerül. A művelet csak nyitott panelen, fejlesztői játékállapotban és teljesülő elérhetőségi feltétellel indul. Bezárt vagy korábbi panelnyitáshoz tartozó gomb callbackje nem futtat műveletet. A regisztráció és a játékállapot nem kap közvetlen `window`-exportot.

A panel használata szabad, nem jogosultságkezelés. A játékállapotot módosító eszközök csak aktív `DevSession` alatt legyenek elérhetők. A `fields()` opcionális mezőleírásai számbemenetet vagy listát adhatnak a gomb mellé; az értékeket a `run(values)` kapja. A `toggled()` kapcsolóállapotot és `aria-pressed` visszajelzést biztosít. A mezők és műveletek callbackjei is csak az aktuális panelnyitásban és renderben futnak.

## Ellenőrzés

Forrásmódosítás után `node scripts/build-game.mjs`, majd `node scripts/test-dev-tools.cjs` és `node scripts/check-site.mjs` szükséges. A panelteszt a közvetlen megnyitást, az eszközök elérhetőségi feltételeit, a bezárt és korábbi munkamenetből megtartott callbackek elutasítását, a fókuszt, a szünetet és a változatlan mentést vizsgálja. A HU/EN megjelenést és a billentyűzetes használatot valódi böngészőben is ellenőrizd.
