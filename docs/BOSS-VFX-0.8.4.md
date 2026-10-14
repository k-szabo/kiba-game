# 0.8.4 · Festett boss-effektusok

A bossok támadásai közös, eredeti PNG-átlátszóságot megőrző effektuscsomagot használnak. A látvány a meglévő harci állapotból rajzolódik; nem módosítja a sebzést, a támadások idejét, a találati területeket vagy a lávaplatformok összeomlását. A talajjelzések és támadásfeliratok továbbra is külön, kontrasztos segítséget adnak.

## A támadások áttekintése

| Szereplő | Grafikai frissítés |
| --- | --- |
| Démoni őrző | Folyó, bazaltkéreggel tarkított lávafelszín; izzó földrepedések; törmeléket és lávát felvető földrengés; tüzes kalapácscsapás; festett parázslövedékek és idézőkapuk. |
| Japán szamuráj | Festett arany-ezüst kardcsóva a vágásnál, rohamnál és a kettős csapás két sebző szakaszában. |
| Végső angyal | Festett szárnycsapások; új árnyéklövedékek a bolt/nova támadásokhoz; füstös árnyoszlopok az árnyékzáporhoz; festett átalakulási és idézőeffektusok. A korábbi részletes fénynyilak és fázishátterek megmaradtak. |
| Titkos angyalforma | Az angyali fény és a démoni tűz új effektusai együtt jelennek meg, az apokaliptikus háttér előtt. |
| Árnyék | Festett karmoláscsóva, árnyéklövedék és talajhullám; füstös földhasadások és zápor; részletes ürességkapu az elnyeléshez. A 24 festett harci póz változatlanul működik. |
| Angyal- és kultista-miniboss | Festett közelharci csapások, árnyékmágia és kultista idézőjelek; az öreg angyal korábban frissített fénynyilai is ugyanebben a rajzolórendszerben működnek. |

## Új assetek

Mind a hat lap a beépített `image_gen` eszközzel készült. A két több-effektusos lap külön javítást kapott a kivágások elválasztására. A forrás PNG-k alfaértékeit a játék nem színezi át és nem írja felül.

- [Lávafelszín](../assets/images/effects/lava-surface-v1.png)
- [Földrengés és kitörés](../assets/images/effects/earth-impact-v1.png)
- [Izzó földrepedés](../assets/images/effects/ground-fissure-v1.png)
- [Háromféle közelharci csóva](../assets/images/effects/boss-slashes-v1.png)
- [Árnyéklövedék, árnyoszlop és idézőkapu](../assets/images/effects/dark-magic-v1.png)
- [Parázslövedék](../assets/images/effects/ember-bolt-v1.png)

A [generálási és javítási promptok](art-prompts/boss-vfx-v1.json) külön JSON-ban vannak. A lapokból tíz effektusváltozatot használ a játék. Kivágásaik és illesztési pontjaik az `assets/js/boss-vfx.js` fájl `BOSS_FX_ART` objektumában szerepelnek; az új paletták és referenciaadatok a [colormaps.json](../assets/config/colormaps.json) részei.

## Rajzolás és ellenőrzés

A `BossVFX` rajzoló a karakter vagy tényleges talajpont köré illeszti a képeket. A láva egymást átfedő, tükrözött textúrarészletekkel áramlik, az alsó széle átlátszóságba halványul. Az előjelzések halványabb, a sebző szakaszok teljesebb effektust kapnak. Szünetben az áramlás és minden időfüggő effektus is megáll; csökkentett mozgás mellett a dekoratív sodródás és forgás szünetel.

A `scripts/test-boss-vfx.cjs` minden fő boss támadáscsaládját, az automatikus csapásokat, a kultista jeleit és a prológus területi támadásait ellenőrzi. A képkivágások és illesztési pontok határait vizsgálja, és a rajzolás előtt/után összehasonlítja a teljes harci állapotot. A teszt a Pages workflow része.
