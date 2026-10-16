# Fejlesztői eszközpanel

A panel jelszó és külön konfiguráció nélkül elérhető, helyi futtatásban és GitHub Pagesen is. A 0.9.13 a panel alapját és a későbbi eszközök regisztrációját tartalmazza; a boss-visszahívás, teleport, halhatatlanság, sebzésszámok és tárgyidézés külön fejlesztési feladatok.

## Megnyitás és bezárás

A játék címéhez add hozzá a `#devtools` fragmentet:

- Helyben: `http://localhost:8000/#devtools`
- GitHub Pagesen, a verzió publikálása után: `https://k-szabo.github.io/kiba-game/#devtools`

A panel azonnal megnyílik, nincs belépés vagy jelszóbeállító script. Főmenüből, aktív játékból és szünetmenüből nyitható; más felületek és átvezetők közben nem lép a játékállapotuk helyére. Az URL-fragment megváltoztatásával futás közben is megnyitható.

A panel megállítja a játékot és törli a lenyomva maradt játékbillentyűket. A Bezárás gomb vagy az Escape visszaállítja az előző állapotot és fókuszt; az URL-ből eltűnik a fragment. Szünetmenüből nyitva bezárás után is szünet marad. A Tab és Shift+Tab a panel kezelőszervei között mozog. A feliratok követik a játék HU/EN nyelvét.

A panel jelenleg nem ír játékmentést. A megnyitását csak fejlesztői dokumentációban ismertetjük: a README, a játékmeneti útmutató, a játék súgója és a játékosoknak szóló változásnapló nem hirdeti.

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

A panel használata szabad, nem jogosultságkezelés. Az alap nem hoz létre elkülönített tesztmentést: a későbbi, játékállapotot módosító eszközök kártyáin kell meghatározni és ellenőrizni a normál mentésre gyakorolt hatást és az esetleges tesztállapot elkülönítését.

## Ellenőrzés

Forrásmódosítás után `node scripts/build-game.mjs`, majd `node scripts/test-dev-tools.cjs` és `node scripts/check-site.mjs` szükséges. A panelteszt a közvetlen megnyitást, az eszközök elérhetőségi feltételeit, a bezárt és korábbi munkamenetből megtartott callbackek elutasítását, a fókuszt, a szünetet és a változatlan mentést vizsgálja. A HU/EN megjelenést és a billentyűzetes használatot valódi böngészőben is ellenőrizd.
