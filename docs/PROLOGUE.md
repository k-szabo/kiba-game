# 0.8 · Az árnyak álma

Az új utazás egy 4500 egység széles, külön árnyvilágban kezdődik. Momo egyedül járja a ködös, elhagyatott ösvényt: nincs normál ellenfél, társ, szentély vagy felvehető tárgy. A játékos a beállított mozgás-, ugrás- és kardbillentyűket használhatja; a szünetmenü és a nyelvváltás elérhető.

A fekete lyuknál **Árnyék / Shadow** jelenik meg. A festett felsőtest négy animációja összesen 24 külön pózt használ: nyugalmi mozgás, karmolás, varázslás és elnyelés. A füst és az örvénylő fekete lyuk a képkockákat egészíti ki. A két lila szem és a földi támadásjelzések kontrasztosak. A kisebb képernyőkön az aréna távolabbról látszik, hogy Momo és a hatalmas entitás együtt elférjen. A csökkentett mozgást kérő böngészőbeállítás leállítja a díszítő örvénylést, ringást és nyugalmi képkockaváltást; a harci előjelzések megmaradnak.

<details>
<summary>A harc és az ébredés története – spoilerek</summary>

Árnyék 100 000 életerővel rendelkezik. Momo kardja eltalálhatja, de a történeti összecsapás nem végződhet boss-győzelemmel. A lesöprő auto attack 4, az árnyéklövedék 5, a földhasadás 8, az árnyékzápor 7, a talajon futó hullám 6 sebzést okoz. A közelharci támadások és a varázslatok egymás mellett is működnek.

Aki sokáig kitér, az egész arénát elnyelő támadással találkozik. Ezt 2,8 másodpercnyi erős előjelzés vezeti be; a levegőt és a földet is eléri, ezért a harc legkésőbb ekkor vereséggel zárul. Nem ad XP-t, lélektöredéket vagy boss-jutalmat, és nem nyitja meg a japán kapukat.

Momo összeesik, a kép elsötétül. Az ébredés egy festett japán szobában történik, először a „Csak egy álom…” szöveggel. Utána sikolyokat hall; bekapcsolt hang mellett szintetizált hanghatás is megszólal. Momo feláll, majd megtudjuk, hogy katonák támadták meg a falut, Haru pedig eltűnt. Teljes élettel és az eredeti kezdő képességekkel kerül a japán pálya elejére. A falu körüli füst és parázs jelzi a támadást.

</details>

## Mentés és ellenőrzés

Az álomhoz a mentés egy érvényes japán kezdőszentélyt és `prologueComplete: false` állapotot tárol. A Folytatás ilyenkor újrakezdi az álmot. Ébredés után a mező igaz lesz; a korábbi verziókban készült, ilyen mezőt még nem tartalmazó mentések átugorják a prológust. A titkosított mentés formátumát és a normál világok sorszámait nem kellett lecserélni.

Az álom állapotgépe az `assets/js/prologue.js` fájlban van. A `scripts/test-prologue.cjs` a támadásokat, a vereség és ébredés sorrendjét, az XP és jutalmak hiányát, a megszakított álom folytatását, valamint a régi mentések működését ellenőrzi. Ez a teszt a GitHub Pages workflow része is.

## Új illusztrációk és generálási promptok

A képek a beépített **image_gen** eszközzel készültek. Az eredeti démonkép megmaradt tervezési referenciaként; futás közben a négy új animációs lapot tölti be a játék. A két háttér és a négy animációs lap az `ART_MANIFEST` része, az `assets/` mappával együtt kerül a statikus Pages-csomagba. A démonlapok generált PNG-átlátszósága megmaradt.

- [Árnyék eredeti felsőteste – referencia](../assets/images/enemies/shadow-prologue-v1.png)
- [Nyugalmi animáció](../assets/images/enemies/shadow-idle-v2.png)
- [Karmoló támadás](../assets/images/enemies/shadow-melee-v2.png)
- [Varázslás](../assets/images/enemies/shadow-cast-v2.png)
- [Elnyelés](../assets/images/enemies/shadow-devour-v2.png)
- [Az árnyvilág háttere](../assets/images/backgrounds/shadow-world-v1.png)
- [Momo szobája](../assets/images/backgrounds/momo-room-v1.png)

### Árnyék harci animációi

Az `assets/js/shadow-animation.js` tárolja a négy, egyenként hat képkockás lap kivágásait és a szemekhez igazított illesztési pontokat. A karmolás 0,9 másodperces felkészülést, 0,3 másodperces sebző időszakot és visszaállást használ. A varázslat 1,25 másodpercig töltődik, majd 0,58 másodperces kibocsátás és 0,12 másodperces visszaállás követi. Az elnyelés hat póza a 2,8 másodperces előjelzés alatt váltakozik; a végső póz megmarad Momo vereségekor.

A szemek rögzített pozíciója megakadályozza a test ugrálását, a különböző animációk között 0,12 másodperces átmenet van. Egyidejű közelharc és varázslat esetén a sebző karmolás póza elsőbbséget kap. Az elnyelés megvárja az előző karmolás sebző időszakának végét. Szünetben a képkockák sem haladnak tovább.

A `scripts/test-shadow-animation.cjs` ellenőrzi mind a 24 pózt, a lapok méretét és átlátszóságát, a kivágási határokat, a szemek illesztését, a tényleges harci időzítést, az egymásra futó támadásokat, a szünetet és a végső elnyelési pózt. A [generálási promptok és illesztési jegyzetek](art-prompts/shadow-combat-v2.json) külön JSON-ban vannak.

<details>
<summary>A felhasznált végső promptok</summary>

**Árnyék – átlátszó háttérrel:**

Create a production-ready transparent PNG game asset for a richly illustrated 2D side-scrolling Japanese fantasy action game. One colossal nightmare entity named Shadow (no text). Only an enormous upper torso, shoulders, two long smoky arms and claw hands, and a faint hidden face are visible. No legs or lower body: torso dissolves into dense wisps of charcoal-black and muted violet smoke. Near-black spirit/demon, obscure silhouette, exactly two narrow frightening luminous purple eyes, the clearest focal point. Its face is mostly hidden under smoke, no bright facial details, no goofy skull grin. Broad shoulders, towering threatening presence, slightly hunched looking down at the viewer, hands poised for crushing sweeping attacks. Painterly, detailed polished fantasy concept art, dark atmospheric Japanese underworld influence, compatible with elaborate painted platformer scenery. Three-quarter frontal view, entire upper body and both hands within frame with generous transparent margin on every side, softly feathered semi-transparent smoke edges, no hard crop. The feet/waist end should fade completely into transparency. Square composition. No scene background, no floor, no blackhole drawn into the asset, no writing, no logos, no interface.

**Árnyvilág – nem átlátszó háttérrel:**

Production game background illustration for a richly painted 2D side-scrolling Japanese fantasy metroidvania nightmare prologue. Wide landscape panorama, abandoned dark shadow world, endless desolate obsidian cliffs and a dry riverbed fading into a deep black-violet void, distant ruined Japanese torii silhouettes, gnarled leafless trees and layers of ash-grey mountains. No living characters, no enemies, no companions, no humanoid figures. Restrained charcoal black, midnight blue, desaturated lavender palette, subtle violet mist, no sunlight, no bright white moon, no text. Painterly intricate atmospheric fantasy illustration with elegant detailed silhouettes and believable depth, polished game art rather than flat primitives. The lower quarter is unobtrusive dark rocks and mist, a clear horizontally navigable side-view ground path will be drawn in the game separately. Middle has generous negative space for gameplay characters and a later giant boss blackhole overlay. Distant foggy landscape continues across entire width, no blackhole or monster in this background asset, no hard architectural obstacles in foreground. Cinematic oppressive quiet, mysterious rather than graphic horror. Wide 16:9 composition.

**Ébredési szoba – nem átlátszó háttérrel:**

Production background illustration for the awakening scene of a richly painted 2D Japanese fantasy side-scrolling game. Wide landscape 16:9, view into a modest traditional Japanese village bedroom at dawn, seen from a low frontal slightly side-on camera. Detailed aged wooden beams, woven tatami floor with visible texture, pale shoji paper screens with soft warm sunrise glow, folded blanket and a low dark muted-blue futon mattress on the floor at the lower middle-left. The mattress should be unobtrusive and occupy the lower third, leaving a clear empty seat for the game character to be overlaid around 42 percent from the left and 84 percent from the top. Absolutely no characters, no animals, no people. On the right, a partially open wooden door reveals a hazy Japanese village silhouette and a faint distant dark smoke plume, suggesting urgent trouble outside. Quiet just-before-panic mood; sunrise gold, aged cedar brown, desaturated teal shadows. Highly detailed painterly fantasy game environment, compatible with elaborately illustrated Japanese landscapes, polished illustrative art not flat primitive shapes, no text, no UI, no symbols or logos. Keep a generous open central floor area for gameplay sprite composition.

</details>
