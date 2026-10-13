# Kiba – Három világ · 0.4

GitHub Pagesre előkészített, telepítés és build nélkül működő 2D metroidvania. Kiba, a kis shiba szamuráj Japánon, Yomi mélységein és az égi birodalmon át keresi édesapját.

A 0.4 változat hatképkockás ellenfélmozgást és támadásokat, három külön boss-movesetet, lávát és pusztuló platformokat, megrontott angyalt, szentélyes újraéledést és XP-alapú fejlesztéseket ad a részletes három világhoz. Kiba eredeti animációi megmaradtak. [A változások és a tesztek részletei](docs/POLISH-0.4.md).

## Meglévő GitHub Pages-oldal frissítése

A ZIP teljes tartalmával frissítsd a repository megfelelő fájljait és mappáit, majd commitold és pushold a változást. Az új **assets/images** képek, valamint az **art-data.js**, **graphics.js**, **progression.js** és **combat.js** is szükségesek. A helyi **.git** mappát őrizd meg; a csomag nem tartalmaz Git-előzményeket. A már működő Pages-beállítást nem kell átállítani.

A 0.2 és 0.3 mentések ugyanazon a GitHub Pages-címen tovább használhatók; az új XP-rendszer ezeknél 1. szintről indul. Ha a böngésző még a régi menüt mutatja, frissíts Ctrl+F5-tel. A menüben **V0.4** jelzi az új változatot.

## Mappaszerkezet

```text
.
├── index.html
├── .nojekyll
├── .gitignore
├── .gitattributes
├── .github/
│   └── workflows/
│       └── pages.yml
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── levels.js
│   │   ├── art-data.js
│   │   ├── graphics.js
│   │   ├── progression.js
│   │   ├── combat.js
│   │   └── game.js
│   └── images/
│       ├── kiba.png
│       ├── backgrounds/       # három birodalom tájai
│       ├── enemies/           # mozgás-, támadás- és boss-animációk
│       ├── terrain-v4.png
│       └── props-v4.png
├── scripts/
│   ├── check-site.mjs
│   ├── test-harness.cjs
│   ├── test-combat.cjs
│   └── test-routes.cjs
└── docs/
    ├── GAMEPLAY.md
    ├── ART-DESIGN.md
    ├── ART-PROMPTS.json
    ├── POLISH-0.4.md
    └── *PROMPTS.json
```

Az **index.html a repository gyökerében legyen**, az assets, scripts és .github mappák mellette. A ZIP kibontott tartalmát tedd a repositoryba, ne egy új kiba-github-pages almappába. A játék relatív hivatkozásokat használ, ezért a `https://FELHASZNALO.github.io/REPOSITORY/` és a saját domain gyökeréből is működik.

## GitHub Pages: automatikus telepítés

1. Csomagold ki a ZIP-et, és tedd a tartalmát egy GitHub repository gyökerébe. A rejtett **.github** mappa és **.nojekyll** fájl is kerüljön fel.
2. A repositoryban nyisd meg: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Pushold a fájlokat a repository alapértelmezett branchére. A workflow ennek a branchnek a nevét automatikusan követi, így main és master esetén is működik.
4. Az **Actions → Deploy Kiba to GitHub Pages** futás mutatja a telepítés eredményét és a játék URL-jét. A workflow a **Run workflow** gombbal is indítható az alapértelmezett branchről.

A workflow ellenőrzi a fájlokat és a hivatkozásokat, majd az index.html-t, a .nojekyll fájlt és az assets mappát telepíti. Nincs npm install vagy build, és nem kell saját titkos kulcsot megadni.

[Hivatalos GitHub Pages workflow-útmutató](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Egyszerűbb, branch alapú publikálás

Ha Actions-workflow helyett branchből szeretnél publikálni, hagyd ki a **.github/workflows/pages.yml** fájlt. Ezután válaszd a **Settings → Pages → Source → Deploy from a branch** lehetőséget, az alapértelmezett branchet és a **/(root)** mappát, majd mentsd el. A gyökérben lévő .nojekyll fájl kikapcsolja a Jekyll feldolgozását.

[Hivatalos publikálási beállítások](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Helyi indítás és ellenőrzés

Az **index.html** közvetlenül megnyitható böngészőben. HTTP-előnézethez a repository gyökerében például:

```sh
python -m http.server 8000
```

Ezután nyisd meg a `http://localhost:8000/` címet.

A strukturális ellenőrzés Node.js 24-gyel futtatható:

```sh
node scripts/check-site.mjs
node scripts/test-combat.cjs
node scripts/test-routes.cjs
```

Az ellenőrzőscript a fájlhivatkozásokat, a kis- és nagybetűket, a repository alatti URL-eket, a JavaScript szintaxisát és Kiba képét ellenőrzi.

A két játékteszt a harci állapotokat, az XP-t, mentést, szentélyes újraéledést, boss-mechanikákat és a tényleges fizikai útvonalakat vizsgálja. Ezek a GitHub Actions telepítés előtt is lefutnak. Külső npm-csomag nem kell hozzájuk.

## Játék

**A/D:** mozgás · **Space:** ugrás · **J:** kard · **K:** szellemlépés · **E:** interakció · **U:** fejlesztés a szentélynél · **M:** térkép · **S + Space:** leugrás.

[A pályák, irányítás és mentés részletes leírása](docs/GAMEPLAY.md).

[A grafikai frissítés, az assetek és a képgenerálási promptok leírása](docs/ART-DESIGN.md).

A mentés a böngészőben, az oldal címéhez tartozó localStorage-ban található. A korábbi offline fájl mentése nem kerül át automatikusan a GitHub Pages címére. A játékhoz nem kell szerveroldali kód vagy adatbázis.
