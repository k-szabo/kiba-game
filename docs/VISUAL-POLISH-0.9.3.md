# 0.9.3 – Titkos arénák és vizuális javítások

Momo ugrás közbeni képkockái az eredeti sprite lapon kisebbek az álló figuránál. A megjelenítés az egyes ugrópózok tényleges alfa-tartalmát az álló figura magasságához igazítja, a meglévő talppontok megtartásával. A mozgás, ugrásmagasság és a 43 × 69 egységes ütközőtest változatlan.

Az öreg angyal hátterének vizuális határa a teljes dupla ugrást lefedi. Ez nem módosítja a titok felfedezését, a platformokat vagy a harcteret. Az angyali romfal és a kultista barlang falai új, átlátszóságot megőrző festett képeket használnak:

- `assets/images/angel-ruin-wall-v1.png`
- `assets/images/cult-cave-wall-v1.png`

A képek a beépített `image_gen` eszközzel készültek; az eredeti promptok és stílusreferenciák a [grafikai promptfájlban](art-prompts/secret-walls-v1.json) vannak. Az illesztési adatok az `ART_SECRET_WALLS` leírásban, a paletták a közös `assets/config/colormaps.json` fájlban szerepelnek.

A dash a meglévő festett árnymágia textúrájából elnyújtott, elhalványuló füstnyomot hagy. A nyom szünet alatt megáll, csökkentett mozgás mellett nem jelenik meg. A dash ideje, sebessége és sérthetetlensége változatlan.

A főmenü jobb felső verziójelzése billentyűzettel és érintéssel is megnyitható. Az alatta megjelenő, görgethető változásnapló magyarul és angolul olvasható. A szövegek a közös lokalizációs katalógusban vannak; az Escape bezárja és visszaadja a fókuszt a verziójelzésnek.

A kiadás a meglévő alfa/béta szabály szerint reseteli a korábbi verziók haladását, a nyelv és a billentyűkiosztás megőrzésével.

Automatizált regresszió: `test-visual-polish.cjs`, `test-secret-art.cjs`, `test-changelog.cjs`, valamint a teljes meglévő tesztcsomag. A sprite-méretteszt a tényleges PNG alfa-csatornáját olvassa, nem pusztán a kirajzolókód konstansait hasonlítja össze. A tényleges látvány és a kezelőfelület külön böngészős ellenőrzést igényel.
