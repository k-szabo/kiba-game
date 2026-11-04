# A zikkurat gyökerei – grafikai eredet

A felhasználó jóváhagyta a hárompaneles környezet-/bosskoncepciót, a javított 12 pózos animációvázlatot és Haru sérthetetlen követését. Haru a meglévő idősebb, indigókimonós shiba megjelenését tartja meg; a kapuőr egyetlen, azonos méretű, félholdas rúdfegyvert használ.

## Végleges források

- `assets/images/backgrounds/ziggurat-depths-v1.png`: egyetlen széles, részletesen festett japán fantasy mélységi táj; bazaltkarzatok, faragott gerendák, láncok, láva, lila hasadékok és távoli torii. Karakterek, UI és feliratok nélkül.
- `assets/images/backgrounds/japan-heights-v1.png`: egyetlen panoráma hajnalban; hatalmas japán hegyek, lebegő sziklaszigetek, fenyők, távoli szentélyek, felhőtenger és vízesések. Karakterek és kezelőfelület nélkül.
- `assets/images/enemies/void-gatekeeper-v1.png`: 3×2 képkockás, natív alfás festett atlasz; alapállás, lépés, előkészítés, söprés, mágia és szúrás. Az utolsó javítás a teljes köpeny- és fegyversziluett margóját őrizte meg.
- `assets/images/npcs/haru-follow-v1.png`: 3×2 képkockás Haru-atlasz; alapállás, váltott lépések, elrugaszkodás, ugrás és érkezés. Az utolsó szerkesztés az eredetileg fehér hátteret valódi alfára cserélte; a karakter fehér szőrzete megmaradt.

A generálás a beépített képgenerátorral történt. A képek eredeti RGBA/PNG forrásként kerülnek a projektbe; Python csak a képkockahatárokat és a metaadatot regisztrálja. A forráslenyomatokat a generált `ziggurat-descent-art-data.js` fejléce tartalmazza. A portré továbbra is az eredeti `haruElder` képet használja.

A hátterek méretezése a nézet lefedéséből és a natív képarányból származik. A platformokat a pálya írja le; a háttér nem határoz meg ütközést. A megjelenítés sem a követő, sem a boss mozgásóráját nem lépteti.

A `ziggurat-depths-motion-b-v1.png` és `japan-heights-motion-b-v1.png` az előzőleg jóváhagyott, minden helyszínre kiterjedő visszafogott háttéranimáció irányát követi. A szerkesztési prompt a távoli köd/felhő néhány fodrának átrendezését kérte, rögzített építészettel és változatlan kompozícióval. A renderer kizárólag a megadott távoli maszkrégiókat használja belőlük.
