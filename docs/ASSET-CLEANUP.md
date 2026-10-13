# Assetek és a repository rendbetétele

Az útmutató a jelenlegi **0.5** forrás ellenőrzésén alapul. A képfájlok verziószámai együtt használt grafikai generációkat jelölnek, ezért egy teljes v3 vagy v4 készlet törlése eltörné a játékot.

## Törölhető régi képek

A következő öt PNG nincs a játék betöltési listájában, és az eredeti Kiba-kép külön betöltése sem hivatkozik rájuk:

```text
assets/images/enemies/japan-v3.png
assets/images/enemies/yomi-v3.png
assets/images/enemies/heaven-v3.png
assets/images/terrain-v3.png
assets/images/props-v3.png
```

Összesen **14 819 986 bájt**, körülbelül **14,13 MiB** a munkakönyvtárban és a következő publikált csomagban. Egy külön másolatból kihagyva őket mind a négy meglévő ellenőrzés sikeresen lefutott: `check-site.mjs`, `test-combat.cjs`, `test-v05.cjs`, `test-routes.cjs`.

A törlés a korábbi Git-commitok méretét nem csökkenti: azokban a régi képek továbbra is megmaradnak. Nincs szükség az előzmények átírására.

## Megtartandó képek

| Készlet | Mit használ a játék? |
| --- | --- |
| Eredeti Kiba | `assets/images/kiba.png` |
| v3 hátterek | A `backgrounds/` mappa mindhárom képe: `japan-v3.png`, `yomi-v3.png`, `heaven-v3.png`. |
| v4 terep és tárgyak | `terrain-v4.png`, `props-v4.png`. |
| v4 ellenfelek | Mindhárom világ `*-walk-v4.png` és `*-attack-v4.png` animációi, valamint `bosses-v4.png`. |
| v5 kiegészítések | `kiba-slash-v5.png`, `relics-v5.png`, `samurai-v5.png` és az angyal három `angel-*-v5.png` alakja. |

A jelenlegi játék összesen **19 képfájlt** tölt be. A listát az `assets/js/art-data.js` fájl `ART_MANIFEST` objektuma és a `game.js` Kiba-képre mutató hivatkozása határozza meg. Régi képekre a grafikai dokumentáció még hivatkozhat; ez történeti háttéranyag, nem a játék betöltési útvonala.

## Egyéb fájlok

- **Tartsd meg:** `index.html`, az `assets/js/` összes fájlja, `assets/css/style.css` és a fenti aktív képek.
- **Tartsd meg a jelenlegi ellenőrzéshez és publikáláshoz:** `.github/workflows/pages.yml`, `.nojekyll` és a teljes `scripts/` mappa. A workflow közvetlenül futtatja a teszteket, amelyek a közös `test-harness.cjs` fájlt is használják.
- **Érdemes megtartani:** `.gitignore`, `.gitattributes`, a README és a dokumentáció. Nem futtatnak játéklogikát, de segítenek a repository karbantartásában.
- **A helyi `.git` mappát őrizd meg:** ez tárolja a repository előzményeit és beállításait. Kézi GitHub-feltöltéshez nem kell külön feltölteni.
- **Opcionális háttéranyag:** a `docs/*PROMPTS.json`, `docs/ART-DESIGN.md`, `docs/POLISH-0.4.md` és `docs/BOSSES-0.5.md` a játék működéséhez nem szükséges. Ha ezekből törölsz, frissítsd a rájuk mutató dokumentációs hivatkozásokat is. Az új README az ART-DESIGN és BOSSES leírásokra hivatkozik.

Ha a repositoryban vannak helyi ZIP-ek, régi teljes játékcsomagok vagy `_site/` kimenetek, és semmi nem hivatkozik rájuk, ezeknek nem kell a verziókezelt forrásban szerepelniük. Az ellenőrzött jelenlegi forrásban nem volt szükséges `dist/` mappa.

Az itt elkészített dokumentációfrissítés nem töröl automatikusan semmilyen assetet.
