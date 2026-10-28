# Hannah és a birodalmak javításainak grafikai eredete

A felhasználó kifejezetten jóváhagyta a kapcsolódó HU/EN szövegeket és az ötrészes koncepciólapot: idősebb Haru, láncos oszlop, Hannah lélekjutalma, a démon lord szíve és a mancskurzor. A szereplő őszes, idősebb shiba kopott indigó kimonóban; a jutalmak Hannah fekete–narancs–lila színvilágát követik. Ez a rekord a jóváhagyott irányt és az integrált asseteket rögzíti, nem rekonstruál hiányzó generálási promptot.

| Asset | Szerep | Integráció |
| --- | --- | --- |
| `assets/images/npcs/haru-elder-v1.png` | Haru külön, idősebb megjelenése | `haruElder`; mennyország, zikkurat, dialógusportré |
| `assets/images/ui/haru-binding-pillar-v1.png` | Haru fogságának oszlopa | `haruBindingPillar`; a láncjelzés és a kiszabadítás a jelenet állapotát követi |
| `assets/images/items/first-demon-lord-soul-v1.png` | Az első démon lord lelke | `ART_INVENTORY.items.demonLordSoul`, közös DPR- és kontrasztkezeléssel |
| `assets/images/items/demon-lord-heart-v1.png` | Démon lord szíve | `ART_INVENTORY.items.demonLordHeart`; a `demonLordHeartGiven` jelző fogyasztja el |
| `assets/images/ui/paw-cursor-v1.png` | Menük mancskurzora | CSS-kurzor; aktív játék közben rejtett, pointer lock nincs |

Az inventoryképek külön RGBA assetek, nem újrarajzolt HTML-ikonok; a közös katalógus teljes sziluettet és az eredeti alfát tartja meg. A kész képek pontos mérete és színpalettája a generált `assets/config/colormaps.json` referencia része. Az interakciós és találati geometria nem a díszítő kép széléből számolódik.

Hannah meglévő sprite-forrásai megmaradnak. A `scripts/register-hannah-art.py` a natív alfa alapján izolált kivágásokat, explicit talppontokat és stabil testléptéket generál. A rituális lap második forráspóza extra kéz miatt nem része a futó animációnak. A járási ciklus a biztosan kétkaros fogású pózokat választja: nulla alapú forrásindexek `[0,2,4,5,2,4]`. Ez a változás képkockaválogatás; nem jelent új, külön jóváhagyást igénylő mozgástervet vagy a forrásrajzok átfestését.

A regisztráció `--check` módja, a közös inventoryhatár-/DPR-/alfaellenőrzés és a palettaellenőrzés reprodukálható műszaki kontroll. A teljes kasza, a karok folytonossága, Haru talajhoz illesztése, a kurzor olvashatósága és a fényhatások tényleges látványa külön böngészős QA-feladat.
