# Fejlesztői útmutató

## Helyi indítás

A repository gyökerében az `index.html` és a mellette lévő `assets/` alkotja a játékot. A mentés a böngésző biztonságos tárhelyét használja, ezért helyi fejlesztéshez indíts HTTP-előnézetet:

```sh
python -m http.server 8000
```

Ezután nyisd meg a [helyi játékot](http://localhost:8000/). A már generált `assets/js/runtime.js` a repository része, így a játékhoz nincs telepítés vagy szerveroldali alkalmazás. A `file://` címről futtatott változat mentése böngészőtől függően nem érhető el.

## A forrás felépítése

| Útvonal | Feladat |
| --- | --- |
| `index.html` | A játék belépési pontja és kezelőfelülete. |
| `assets/js/game.js` | Mozgás, kamera, interakciók, térkép és a fő játékciklus. |
| `assets/js/levels.js` | A három birodalom pályái, objektumai és ellenfelei. |
| `assets/js/combat.js` | Ellenfélviselkedés, boss-támadások, idézés és lávamechanikák. |
| `assets/js/prologue.js` | A néma álompálya, Árnyék harca, vereség és ébredési átvezetés. |
| `assets/js/shadow-animation.js` | Árnyék 24 festett póza, szemekhez igazított kivágásai és harci időzítése. |
| `assets/js/progression.js` | XP, szintek és fejlesztések. |
| `assets/js/graphics.js` | Tájak, szereplők, animációk és vizuális effektek. |
| `assets/js/art-data.js` | A betöltött képek listája és sprite-kivágások. |
| `assets/js/i18n.js`, `assets/i18n/locales.json` | Futás közbeni nyelvváltás és az összes nyelv fordításai. |
| `assets/js/keybindings.js`, `assets/config/keybindings.json` | Alapbillentyűk, UK/FR profilok, egyéni átállítások és JSON import/export. |
| `assets/js/save-vault.js` | Titkosított, profilhoz kötött mentés és a régi mentés egyszeri átvétele. |
| `assets/js/runtime.js` | A Pagesen futó, egyetlen zárt játékmodul; a build generálja. |
| `scripts/build-game.mjs` | A forrásokból frissíti a futó modult és a fordításokat. |
| `assets/css/style.css` | A kezelőfelület megjelenése. |
| `assets/images/` | Momo, a világok, az ellenfelek és a tárgyak képei. |
| `assets/config/colormaps.json` | Karakterek, tárgyak és összes képfájl referencia-színpalettái, zászlók és kódbeli színek. |
| `scripts/export-colormaps.py` | A színreferencia reprodukálható frissítése a képekből és a rajzolási metaadatokból. |
| `scripts/` | Strukturális és játékmeneti ellenőrzések. |
| `.github/workflows/pages.yml` | Ellenőrzés és GitHub Pages publikálás. |
| `docs/` | Játékleírás, fejlesztési dokumentáció és grafikai háttéranyagok. |

## Ellenőrzés

A workflow Node.js 24-et használ. A repository gyökeréből az ellenőrzések külső npm-csomagok nélkül futtathatók:

```sh
node scripts/check-site.mjs
node scripts/test-combat.cjs
node scripts/test-v05.cjs
node scripts/test-v06.cjs
node scripts/test-routes.cjs
node scripts/test-bindings.cjs
node scripts/test-prologue.cjs
node scripts/test-shadow-animation.cjs
```

- A statikus ellenőrzés a fájlhivatkozásokat, a fájlnevek pontos írásmódját, a gyökérből és repository-almappából történő kiszolgálást, a JavaScript szintaxisát és Momo sprite sheetjét vizsgálja.
- A generált `runtime.js` forráslenyomatát is ellenőrzi, így elmaradt builddel nem publikálható frissítés.
- A harci tesztek az ellenfelek viselkedését, az XP-t, a fejlesztéseket, a mentést és a szentélynél történő újraéledést ellenőrzik.
- A 0.5 tesztjei a kardtalálat időzítését, a boss-fázisokat, az idézést és az ereklyéket vizsgálják.
- Az útvonalteszt a tényleges játékfizikával ellenőrzi a továbbjutást és a fontos platformok elérhetőségét.
- A kiosztásteszt a profilváltást, ütköző billentyűk kezelését, mentést, JSON-átvitelt és a francia mozgásbillentyűket ellenőrzi.
- A prológusteszt az üres álompályát, a harci támadásokat, az elkerülhetetlen vereséget, az ébredést és a mentések kompatibilitását ellenőrzi.
- Árnyék animációtesztje a 24 pózt, a szemek illesztését, az előjelzések és találatok időzítését, a szünetet és az elnyelés végső pózát vizsgálja.

Forrásmódosítás után `npm run build` szükséges a futó fájl újragenerálásához. A build Node.js-en kívül nem igényel csomagokat; a kész Pages-csomag továbbra is statikus.

Az összes fordítás és a nyelvválasztó metaadata az `assets/i18n/locales.json` fájlban van. A felső szintű kulcs a kétbetűs ISO nyelvkód (`hu`, `en`); minden nyelvben `flag` (SVG data URL), `lang_orig` (saját nyelvű név), `lang_en` (angol név) és `dict` (szövegazonosító → fordítás) szerepel. A választó a két nevet együtt mutatja, ha különböznek. Új nyelvhez adj hozzá egy ilyen objektumot az összes meglévő `dict`-azonosító fordításával, majd futtasd az `npm run build` és `npm test` parancsot. A választó automatikusan felveszi az új nyelvet. A változó részeket `{0}`, `{1}` jelöli; ezeknek minden fordításban egyezniük kell.

Az `assets/config/keybindings.json` tartalmazza az eredeti kiosztást (`original`), a profilokat (`presets`) és az induló módosításokat (`modified`). A statikus GitHub Pages nem tudja átírni ezt a fájlt futás közben, ezért a játékos módosításai böngészőnként a `localStorage` területén maradnak. A súgó JSON-exportja és importja hordozható mentést ad a kiosztáshoz. Az új kiosztásokat és alapértékeket a forrás JSON-ban lehet bővíteni; ehhez új build szükséges.

Ezek automatizált ellenőrzések; egy teljes böngészős végigjátszás további vizuális és kezelési hibákat is feltárhat.

## GitHub Pages

Az élő játék: **[k-szabo.github.io/kiba-game](https://k-szabo.github.io/kiba-game/)**.

A mellékelt workflow az alapértelmezett branchre érkező push után, illetve kézi indítással fut. Először végrehajtja az ellenőrzéseket, majd kizárólag az `index.html`, `.nojekyll` és `assets/` tartalmát csomagolja a Pages-oldalhoz. A README, a dokumentáció és a tesztek a repository részei, a publikált játékcsomagba nem kerülnek bele.

A meglévő, működő Pages-beállítást frissítéskor nem kell megváltoztatni. Új repository esetén a **Settings → Pages → Build and deployment → Source → GitHub Actions** beállítás használható a mellékelt workflow-val. Lásd a [GitHub hivatalos workflow-útmutatóját](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

A játék relatív útvonalakat használ. Az `index.html` maradjon a repository gyökerében, az `assets/`, `scripts/` és `.github/` mappákkal együtt. A `.nojekyll` fájlt is őrizd meg.

## Frissítés és mentések

A 0.8 új játékai a prológusban kezdődnek. A mentés opcionális `prologueComplete` mezője jelzi, hogy Momo már felébredt-e. Megszakított álomnál a Folytatás az álompálya elejére visz; az ébredéstől a megszokott szentélyes mentés működik. A mezőt még nem tartalmazó régi mentések a korábbi kalandhoz térnek vissza. A három normál birodalom sorszáma és mentési adatszerkezete megmaradt.

A mentés AES-GCM titkosított rekordként kerül az IndexedDB tárhelyére, minden mentéshez új sóval és nonce-szal. A feloldáshoz szükséges, nem exportálható kulcsot ugyanabban a böngészőprofilban tárolja; a `localStorage` csak a titkosított rekord másolatát tartalmazza. A másolat átmásolása önmagában nem ad használható mentést egy másik profilban. Az oldaladatok törlése a mentést is törli.

A 0.6 és a régebbi, érvényes mentéseket a 0.7 egyszer átveszi és titkosítja ugyanazon a címen; a régi rekordot érintetlenül hagyja tartalékként. Az új mentések már csak a v2 formátumot használják. A böngészőprofil, a webcím vagy az oldaladatok cseréje új utazást jelent.

Ha frissítés után régi tartalmat látsz, próbálj teljes újratöltést (Ctrl+F5). A főmenüben a V0.8 jelzi ezt a változatot.

## Képek cseréje

A titkos területek és minibossok a 0.6 változatban négy új képet használnak; lásd az [új változat leírását](SECRETS-0.6.md).

A képek verziószáma nem jelenti, hogy elavultak: a játék v3 háttereket, v4 animációkat és v5/v6 kiegészítéseket együtt használ. A ténylegesen betöltött képeket az `ART_MANIFEST` sorolja fel az `assets/js/art-data.js` fájlban; Momo eredeti sprite lapja `assets/images/momo.png`.

Képcsere után a kivágások és illesztési pontok is ellenőrzendők. A törölhető régi képek listáját az [asset-útmutató](ASSET-CLEANUP.md) tartalmazza.

## Színpaletta-referencia

Az [assets/config/colormaps.json](../assets/config/colormaps.json) az összes jelenlegi PNG-t, Momót, Harut, a három világ négy ellenféltípusát, a bossokat, a minibossokat és Árnyék négy animációját tartalmazza. A `pc`, `npcs` és `objects` bejegyzései az `assets` vagy `paletteGroups` palettáira mutatnak; a külön boss-formák külön bejegyzést kapnak. A `realmColors`, `flags` és `codeColors` őrzi a világok alapszíneit, az SVG-zászlókat és a rajzolókód/CSS színértékeit.

A paletták legfeljebb 16 reprezentatív HEX-színt és 6 élénk kiemelőszínt adnak meg lefedettséggel. A mintavétel figyelembe veszi a PNG alfáját, a sprite-kivágásokat és a Canvas vágópoligonjait. Az átlátszó háttér RGB-értékei nem kerülnek a palettába. Ez grafikai referencia: a fények, szűrők és átlátszóságok miatt a képernyőn látott szín eltérhet. A fájl nem módosítja a játék megjelenését.

Újrageneráláshoz Python 3, Pillow, NumPy és Node.js kell; a játék futtatásához ezek a Python-csomagok nem szükségesek:

```sh
python scripts/export-colormaps.py
python scripts/export-colormaps.py --check
```

Ha a Node.js nincs a PATH-ban, add meg a `--node /path/to/node` kapcsolóval. A PNG-k SHA-256 lenyomata és a `--check` segít észrevenni, ha képcsere után a színreferencia elavult.
