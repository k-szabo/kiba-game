# Kiba – Három világ

GitHub Pagesre előkészített, telepítés és build nélkül működő 2D metroidvania. Kiba, a kis shiba szamuráj Japánon, Yomi mélységein és az égi birodalmon át keresi édesapját.

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
│   │   └── game.js
│   └── images/
│       └── kiba.png
├── scripts/
│   └── check-site.mjs
└── docs/
    └── GAMEPLAY.md
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

A mentés a böngészőben, az oldal címéhez tartozó localStorage-ban található. A korábbi offline fájl mentése nem kerül át automatikusan a GitHub Pages címére. A játékhoz nem kell szerveroldali kód vagy adatbázis.
