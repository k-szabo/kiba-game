# Tipográfia

A játék három helyben hosztolt, SIL Open Font License 1.1 alatt terjesztett betűcsaládot használ. A betűk a statikus `assets/fonts/` csomag részei, futás közben nem töltenek be külső Google Fonts-stíluslapot.

| Szerep | Betűcsalád | CSS-azonosító |
| --- | --- | --- |
| Címek, történet, papírtekercses dialógus, japán jelölések | Noto Serif JP | `--font-story`, `Kiba Story` |
| A történet magyar ékezeteinek és törtjeleinek helyi tartaléka | Noto Serif | `Kiba Story Latin` |
| Kezelőszervek, HUD, inventory, adatok és Canvas-feliratok | Noto Sans | `--font-ui`, `Kiba UI` |

A Mincho jellegű cím- és történetbetű illeszkedik a japán környezethez; a kisebb, gyorsan olvasandó kezelőfelületi szöveg talpatlan marad. A párbeszédek 500-as, a címek 600-as vastagságot kapnak. A főmenü, az inventory és a súgó meglévő elrendezését, kontrasztját, fókuszait és görgethetőségét meg kell őrizni. A szöveg nem kerül bitmapbe.

A CSS és a Canvas ugyanazokat a családneveket használja. A 400/500/600/700-as, illetve a Noto Sansnál 800-as változat valódi helyi betűfájl. A japán Noto Serif JP nem tartalmazza az ő/ű, Ő/Ű és ⅔/⅓ jeleket: ezekhez a történetfont következő, szintén helyi Noto Serif tagját használjuk. A böngésző `font-display: swap` mellett azonnal használhat rendszerfontot is; a következő Canvas-képkockák már a betöltött betűvel rajzolódnak. A fontos normál UI- és történetváltozatot az index relatív font-preload hivatkozása előkészíti. A japán jelek a helyi Noto Serif JP családból érhetők el; a Noto Sans tartaléklistájában is szerepel a történetbetű.

## Karakterek, eredet, bővítés

A kért karakterkészlet Basic Latin, Latin-1, Extended Latin U+024F-ig, a jelenlegi fordítások karakterei és a HTML/JS japán jelölései. A kérés nem jelenti azt, hogy minden font minden karaktert tartalmaz: az elvárt magyar/angol betűket és japán jeleket a `test-fonts.cjs` a TrueType `cmap` tábláiban és a tényleges helyi betűláncban is ellenőrzi. Az ő/ű és Ő/Ű nem helyettesülhet más karakterrel vagy észrevétlenül rendszerfonttal.

Az eredeti szolgáltatói URL-ek, súlyok, fájlméretek és SHA256-azonosítók az `assets/fonts/manifest.json` fájlban vannak. A három eredeti OFL-licenc a betűfájlok mellett marad. Új betű vagy karakterkészlet esetén verziózott új fájlnév, friss manifest és CSS/preload szükséges; régi assetet csak a hivatkozások átnézése után törölj. A rendes build és teszt nem használ hálózatot és nem tölti újra a betűket.

## Ellenőrzés

- `node scripts/test-fonts.cjs`: valódi binárisok, hash, súly, karakterlefedettség és helyi referencia.
- `npm run build`, `npm test`: generált runtime, statikus Pages-útvonalak, kapcsolódó felületi és játékmeneti regressziók.
- Valódi böngésző: HU/EN főmenü, súgó, inventory és hosszú dialógus 1280×720-as és nagyobb nézetben; fontbetöltés, ékezetek, fókusz és görgetés. A mockolt Canvas-teszt nem bizonyítja a betűk valódi megjelenését.
