# Fejlesztői útmutató

## Helyi indítás

A repository gyökerében az `index.html` és a mellette lévő `assets/` alkotja a játékot. Az HTML közvetlenül megnyitható böngészőben. HTTP-előnézethez Python használatával:

```sh
python -m http.server 8000
```

Ezután nyisd meg a [helyi játékot](http://localhost:8000/). A játékhoz nem kell npm install, build, szerveroldali alkalmazás vagy adatbázis.

## A forrás felépítése

| Útvonal | Feladat |
| --- | --- |
| `index.html` | A játék belépési pontja és kezelőfelülete. |
| `assets/js/game.js` | Mozgás, kamera, interakciók, térkép, mentés és a fő játékciklus. |
| `assets/js/levels.js` | A három birodalom pályái, objektumai és ellenfelei. |
| `assets/js/combat.js` | Ellenfélviselkedés, boss-támadások, idézés és lávamechanikák. |
| `assets/js/progression.js` | XP, szintek és fejlesztések. |
| `assets/js/graphics.js` | Tájak, szereplők, animációk és vizuális effektek. |
| `assets/js/art-data.js` | A betöltött képek listája és sprite-kivágások. |
| `assets/css/style.css` | A kezelőfelület megjelenése. |
| `assets/images/` | Kiba, a világok, az ellenfelek és a tárgyak képei. |
| `scripts/` | Strukturális és játékmeneti ellenőrzések. |
| `.github/workflows/pages.yml` | Ellenőrzés és GitHub Pages publikálás. |
| `docs/` | Játékleírás, fejlesztési dokumentáció és grafikai háttéranyagok. |

## Ellenőrzés

A workflow Node.js 24-et használ. A repository gyökeréből ugyanazok az ellenőrzések kézzel is futtathatók, külső npm-csomagok nélkül:

```sh
node scripts/check-site.mjs
node scripts/test-combat.cjs
node scripts/test-v05.cjs
node scripts/test-routes.cjs
```

- A statikus ellenőrzés a fájlhivatkozásokat, a fájlnevek pontos írásmódját, a gyökérből és repository-almappából történő kiszolgálást, a JavaScript szintaxisát és Kiba sprite sheetjét vizsgálja.
- A harci tesztek az ellenfelek viselkedését, az XP-t, a fejlesztéseket, a mentést és a szentélynél történő újraéledést ellenőrzik.
- A 0.5 tesztjei a kardtalálat időzítését, a boss-fázisokat, az idézést és az ereklyéket vizsgálják.
- Az útvonalteszt a tényleges játékfizikával ellenőrzi a továbbjutást és a fontos platformok elérhetőségét.

Ezek automatizált ellenőrzések; egy teljes böngészős végigjátszás további vizuális és kezelési hibákat is feltárhat.

## GitHub Pages

Az élő játék: **[k-szabo.github.io/kiba-game](https://k-szabo.github.io/kiba-game/)**.

A mellékelt workflow az alapértelmezett branchre érkező push után, illetve kézi indítással fut. Először végrehajtja a négy ellenőrzést, majd kizárólag az `index.html`, `.nojekyll` és `assets/` tartalmát csomagolja a Pages-oldalhoz. A README, a dokumentáció és a tesztek a repository részei, a publikált játékcsomagba nem kerülnek bele.

A meglévő, működő Pages-beállítást frissítéskor nem kell megváltoztatni. Új repository esetén a **Settings → Pages → Build and deployment → Source → GitHub Actions** beállítás használható a mellékelt workflow-val. Lásd a [GitHub hivatalos workflow-útmutatóját](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

A játék relatív útvonalakat használ. Az `index.html` maradjon a repository gyökerében, az `assets/`, `scripts/` és `.github/` mappákkal együtt. A `.nojekyll` fájlt is őrizd meg.

## Frissítés és mentések

A mentés az adott webcímhez tartozó böngészőtárhelyen, `localStorage`-ban él. A helyi fájlból indított játék mentése nem kerül át automatikusan a GitHub Pages-oldalra. Az oldaladatok törlése a mentést is törli.

A 0.2–0.4 mentések tovább használhatók a 0.5 változatban ugyanazon a címen; a korábban megszerzett XP és fejlesztések megmaradnak. A Japánban megjelent új ereklyék kereséséhez indíts új utazást, ha a mentésedben már túljutottál azon a birodalmon. A már legyőzött végső őrző győzelme megmarad.

Ha frissítés után régi tartalmat látsz, próbálj teljes újratöltést (Ctrl+F5). A főmenüben a V0.5 jelzi ezt a változatot.

## Képek cseréje

A képek verziószáma nem jelenti, hogy elavultak: a 0.5 játék v3 háttereket, v4 animációkat és v5 kiegészítéseket együtt használ. A ténylegesen betöltött képeket az `ART_MANIFEST` sorolja fel az `assets/js/art-data.js` fájlban; az eredeti `kiba.png` külön töltődik be a `game.js` fájlból.

Képcsere után a kivágások és illesztési pontok is ellenőrzendők. A törölhető régi képek listáját az [asset-útmutató](ASSET-CLEANUP.md) tartalmazza.
