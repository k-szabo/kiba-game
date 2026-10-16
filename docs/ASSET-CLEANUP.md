# Projektleltár és takarítás

Az ellenőrzés dátuma: **2026-10-16**, a 0.9.12 funkciókiadás. A teljes kiadásazonosítót az `assets/config/release.json`, a korábbi kódos hibajavításokat a [kiadási nyilvántartás](releases.json) tartalmazza.

## Képek és hivatkozások

Az `assets/images/` jelenlegi 54 PNG-jéből 51 az `ART_MANIFEST` listából töltődik be. Momo alapképe és menüanimációja két közvetlen `Image.src` hivatkozás. A fennmaradó `enemies/shadow-prologue-v1.png` az Árnyék-animációk dokumentált eredeti karakterreferenciája; a [prológus](PROLOGUE.md) és a [generálási prompt](art-prompts/shadow-combat-v2.json) használja.

A fájlnevekben a v3/v4 grafikai generációt jelent. A v3 tájak, v4 terep, tárgyak és ellenfélanimációk továbbra is aktívak. A korábban eltávolított v3 ellenfélképek, terep és tárgylapok nincsenek már a projektben. Verziószám alapján ne törölj készleteket.

Az asset- és dokumentációs képek között nincs byte-azonos duplikátum. A `docs/images/` három képe a README és a titkos területek illusztrációja; a helyi dokumentációs linkeket is ellenőriztük.

## A működéshez és fejlesztéshez szükséges fájlok

- Az `index.html`, `.nojekyll` és `assets/` a statikus GitHub Pages-csomag.
- Az `assets/js/` forrásmoduljai a generált `runtime.js` újraépítéséhez szükségesek. A runtime is Gitben marad, mert ezt szolgálja ki a játék.
- A `scripts/` összes fájlja build, kiadáskezelő, palette-export, teszt vagy ezek importált segédmodulja. Mind a 23 tesztcsomag npm- és CI-ellenőrzés része, beleértve a Tally-hibajelentés ellenőrzését.
- A `.github/workflows/pages.yml` végzi az ellenőrzést és a publikálást. A Git-előzmények, `.gitignore`, `.gitattributes` és `package.json` a repository működéséhez kellenek.
- Az `AGENTS.md`, `.codex/config.toml`, `.codex/agents/`, `.agents/skills/` és `docs/` a közös fejlesztési folyamat, QA, lokalizáció, grafikai referencia és kiadáskezelés része.
- A `colormaps.json` a kért színreferencia; a `lava-serpent-art.json` a natív képkockák kivágásainak és kontúrjainak ellenőrzött referenciája.

A projektben nincs fölösleges `dist/`, `_site/`, `node_modules/` vagy elhagyott `.tmp`, `.bak`, `.orig`, `.rej`, `.pyc` fájl. Új törlés előtt a manifest, közvetlen HTML/JS/CSS-hivatkozások, importok, tesztek és dokumentáció együtt vizsgálandó.

## Eltávolított helyi maradványok

A korábbi, ignorált `.codex/work/` munkaterületről **2047 fájlt, 1 237 911 205 bájtot** töröltünk: régi QA-futtatások saját profiljait, screenshotokat, jelentéseket, átmeneti képelemzéseket és másolt tesztprojekteket. Ezek a jelenlegi játékhoz és a verziókezelt fejlesztési folyamathoz már nem szükségesek.

A 2026-10-16-i takarítás a lezárt verziójelzés-tesztek `current-cleanup/` mappájából további **48 fájlt, 31 017 770 bájtot** távolított el. A hibajelentés-funkció hasznos PR-tervezete az ignorált `.codex/work/bug-report/pr.md` fájlban marad meg; tesztprofil, fölösleges kép vagy másolt játékcsomag nincs mellette.

Ez a helyi takarítás nem csökkenti a Git előzményeinek méretét: a munkaterület eleve ignorált volt. A GitHub Pages workflow továbbra is kizárólag az `index.html`, `.nojekyll` és `assets/` tartalmát publikálja. Személyes böngészőprofil vagy mentés a projektmappán kívül nem része a takarításnak.
