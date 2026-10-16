# Grafikai promptok és referenciák

A JSON-fájlok a megtartott képgenerálások promptjait, szerkesztési lépéseit és illesztési jegyzeteit őrzik. Fejlesztési források, nem a játék által betöltött konfigurációk, és nem kerülnek a GitHub Pages-csomagba.

A referenciaútvonalak a repository gyökeréhez képest értendők. A korai generálások már lecserélt v3 képekre is hivatkozhatnak; ezek történeti bemenetek, nem hiányzó runtime-függőségek. Egy prompt önmagában nem reprodukálja pixelpontosan a generált képet. Az aktuális PNG-k, az art-data.js kivágásai és a colormaps.json a jelenlegi integráció forrásai.

| Fájl | Tartalom |
| --- | --- |
| [base-art-v3.json](base-art-v3.json) | Alaptájak és az eredeti frakciótervek. |
| [scenery-v3.json](scenery-v3.json) | A később átdolgozott terep és kellékek eredeti terve. |
| [enemy-animation-v4.json](enemy-animation-v4.json) | Frakciónkénti mozgás/támadás és bossatlasz. |
| [enemy-animation-repairs-v4.json](enemy-animation-repairs-v4.json) | Sisak- és pajzsazonosság javításai. |
| [scenery-repairs-v4.json](scenery-repairs-v4.json) | Az aktív terep/kellékatlasz elrendezési javításai. |
| [combat-v5.json](combat-v5.json) | Momo kardcsapása, szamuráj, angyalformák és ereklyék. |
| [secrets-v6.json](secrets-v6.json) | Öreg angyal, kultista és titkos helyszínek. |
| [shadow-combat-v2.json](shadow-combat-v2.json) | Árnyék harci animációi. |
| [japan-clouds-v1.json](japan-clouds-v1.json) | A titkos torony festett felhői. |
| [angel-vfx-heaven-phases-v1.json](angel-vfx-heaven-phases-v1.json) | Fénynyilak és a sötét/napfogyatkozásos ég. |
| [boss-vfx-v1.json](boss-vfx-v1.json) | Boss-effektusok és atlaszjavítások. |
| [secret-walls-v1.json](secret-walls-v1.json) | Titkos arénák falai. |
| [council-branch-v1.json](council-branch-v1.json) | Kapu, kulcs és kastélybelső. |
| [inventory-ui-v1.json](inventory-ui-v1.json) | Hátizsákpanel. |
| [inventory-hd-v1.json](inventory-hd-v1.json) | Momo-portré és katana. |
| [eclipse-relic-v1.json](eclipse-relic-v1.json) | Egyesült ereklye. |
| [lava-serpent-v1.json](lava-serpent-v1.json) | Lávakígyó és pikkely. |

A közös vizuális szabályok a [grafikai útmutatóban](../ART-DESIGN.md) vannak. Új képekhez ide mentsük a promptot; átmeneti generálási fájlnevek, személyes gépútvonalak és helyi tesztjelentések ne kerüljenek a katalógusba.
