# Kiba – Három világ · 0.3

GitHub Pagesre előkészített, telepítés és build nélkül működő 2D metroidvania. Kiba, a kis shiba szamuráj Japánon, Yomi mélységein és az égi birodalmon át keresi édesapját.

A 0.3 változat részletes, illusztrált tájakat, textúrázott platformokat és birodalmanként eltérő katonákat, démonokat és angyalokat hoz. Az íjászok, pajzsosok és varázslók saját harci viselkedést kaptak. Kiba eredeti animációi megmaradtak.

## Meglévő GitHub Pages-oldal frissítése

A ZIP teljes tartalmával frissítsd a repository megfelelő fájljait és mappáit, majd commitold és pushold a változást. Az új **assets/images** almappák, az **art-data.js** és a **graphics.js** is szükségesek. A helyi **.git** mappát őrizd meg; a csomag nem tartalmaz Git-előzményeket. A már működő Pages-beállítást nem kell átállítani.

A 0.2 mentések ugyanazon a GitHub Pages-címen tovább használhatók. A 0.3 új fájlnevekkel és verziózott script-hivatkozásokkal frissíti a grafikát; ha a böngésző még a régi menüt mutatja, frissíts Ctrl+F5-tel. A menüben **V0.3** jelzi az új változatot.

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
│   │   └── game.js
│   └── images/
│       ├── kiba.png
│       ├── backgrounds/       # három birodalom tájai
│       ├── enemies/           # három ellenfél-sprite sheet
│       ├── terrain-v3.png
│       └── props-v3.png
├── scripts/
│   └── check-site.mjs
└── docs/
    ├── GAMEPLAY.md
    ├── ART-DESIGN.md
    ├── ART-PROMPTS.json
    └── SCENERY-PROMPTS.json
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
```

Az ellenőrzőscript a fájlhivatkozásokat, a kis- és nagybetűket, a repository alatti URL-eket, a JavaScript szintaxisát és Kiba képét ellenőrzi.

## Játék

**A/D:** mozgás · **Space:** ugrás · **J:** kard · **K:** szellemlépés · **E:** interakció · **M:** térkép · **S + Space:** leugrás.

[A pályák, irányítás és mentés részletes leírása](docs/GAMEPLAY.md).

[A grafikai frissítés, az assetek és a képgenerálási promptok leírása](docs/ART-DESIGN.md).

A mentés a böngészőben, az oldal címéhez tartozó localStorage-ban található. A korábbi offline fájl mentése nem kerül át automatikusan a GitHub Pages címére. A játékhoz nem kell szerveroldali kód vagy adatbázis.
