# Grafikai stílus és assetek

A Kiba Birodalmak részletes, festett japán fantasy világot használ. Momo a játszható shiba szamuráj; a Kiba a világot átszövő energia. Az aktuális képek listáját és forráskivágásait az assets/js/art-data.js, a színreferenciákat az assets/config/colormaps.json tartalmazza. A fájlnévben lévő v3/v4/v5 szám grafikai generáció, nem törlési jelzés.

## Tájak és szereplők

| Birodalom | Környezet | Ellenfelek |
| --- | --- | --- |
| Japán | Hajnali hegyek, bambusz, vörös juhar, mohás és gyökerekkel átszőtt párkányok. | Szamuráj, íjász, pajzsos katona, onmyoji. |
| Yomi | Mély sziklahasadékok, bazalt, láncok, hamu, szentélyek és lávafény. | Oni harcos, tengu, pajzsos démon, démonmágus. |
| Takamagahara | Felhők, elefántcsont és arany paloták, márványpárkányok. | Égi katona, íjász, pajzsos angyal, mágus. |

A v3 tájképek, a v4 terep/kellékek és normálellenfél-animációk továbbra is aktívak. A külön szamuráj- és angyalbossok, a titkos őrzők, Árnyék és a lávakígyó későbbi készleteket használnak. Az ellenfelek és interaktív tárgyak legyenek a tájhoz illők, mégis felismerhetők; ne helyettesítsük a festett effektusokat egyszerű síkidomokkal.

Az angyali romokat ködös, festett felhők és romos párkányok rejtik. A titkos arénák festett falai az ART_SECRET_WALLS leírásból rajzolódnak; a háttér vizuális határa az egész dupla ugrást lefedi, hogy ugráskor ne villanjon át a falu képe. A széláramlatok vége fokozatosan halványul, a járható platformokhoz igazítva.

## Animáció, kivágás és illesztés

A közös alsó dialógusfelület négy festett, natív alfás papírtekercset használ (`dialogue-japan/yomi/heaven/shadow-v1.png`). A motívumok helyszínhez kötöttek: bambusz, perzselt láva, angyali aranyozás, démoni árnyék. Az erdei menedék a japán, az álom az árnyékos változatot használja. A keret natív aránya és teljes dekorációja megmarad; a szöveg a promptmetaadatban rögzített belső papírfelületre kerül. A feliratok élő HTML-elemek, soha ne égessük őket a képbe. A korábbi jóváhagyott karakterképek DPR-felbontású portrékanvászokra kerülnek. Részletek és bővítés: [DIALOGUE.md](DIALOGUE.md).

- Őrizzük meg a PNG eredeti alfáját. Kivágással és átlátszó hézagot követő kontúrral válasszuk szét a sprite-okat; ne töröljünk valódi fegyver-, szárny- vagy füstrészletet.
- A teljes sziluett férjen el minden képkockán mindkét irányban. A kiálló kardhegy, glória, pajzs és talp ne vágódjon le, a szomszédos figura ne szivárogjon át.
- Momo pózainak méretét a valódi alfa-tartalomhoz és rögzített talppontokhoz igazítjuk; a 43 × 69-es ütközőtest ettől független. Ugrás közben sem változhat a látszólagos testmérete.
- A normál ellenfelek mozgási és támadási atlaszai hat-hat pózt használnak szerepkörönként. A fordulási késleltetés és a járőrhatár kezelése akadályozza meg a helyben forgást; grafikai változtatás ezeket ne írja át.
- Momo nyolcpózos kardcsapása a mozgás/ugrás elé kerül. Az irány a gombnyomáskor rögzül, a találat a vágás pillanatában egyszer történik. A rajzolás a meglévő harci állapotot követi.
- Árnyék négy, egyenként hatpózos animációját a szemekhez illesztjük; a részletes időzítések és prioritások a [prológus útmutatójában](PROLOGUE.md) vannak.
- A spawn talppontja a platformra kerüljön. A sebezhetetlenség látható, állandó áttetszőséget használjon villódzás helyett; a levegőpóz a függőleges sebességet kövesse.

## Effektek és olvashatóság

A japán környezethez illő cím- és történetbetűk, a magyar ékezetek helyi tartalékfontja, valamint az olvasható UI-betű részletei: [tipográfia](TYPOGRAPHY.md).

A világos égi háttéren a fehér-arany tárgyak és támadásjelzések sötét alátétet vagy kontúrt kapnak. A szín mellett a forma és a felkészülési animáció is jelezze a veszélyt. A festett fénynyíl csúcsa a tényleges lövedékponthoz, az óriási lándzsa a jelzett talajbecsapódáshoz igazodik: [angyali grafika](ANGEL-ART-0.8.3.md).

A láva, földrepedés, becsapódás, kardcsóva, árnyékmágia és idézőkapu közös festett atlaszokat használ. A BOSS_FX_ART kivágásai és a BossVFX rajzoló a támadás tényleges helyéhez és fázisához igazítják a grafikát: [boss-effektusok](BOSS-VFX-0.8.4.md). A dash füstnyoma a meglévő árnymágia-textúrából készül.

A díszítő effektek és animációs órák álljanak meg pause, dialógus, térkép, inventory és fejlesztés alatt. Csökkentett mozgásnál a dekoratív sodródás/forgás szünetel, a szükséges harci előjelzés megmarad. Art-only változtatás nem módosíthat sebzést, támadási időt, hitboxot vagy járható geometriát.

A felület asztali billentyűzethez és egérhez készül; a támogatott minimum 1280×720 CSS-pixel. A grafika és a feliratok HU/EN olvashatóságát ezen a minimumon és nagyobb asztali nézetben ellenőrizzük, az asztali nagyítást, a görgetést és a billentyűzetes fókuszt megtartva. Mobilos kompozíciót és érintésre épülő vezérlőt ne tervezzünk vissza.

## Források és ellenőrzés

A generálási promptok és történeti stílusreferenciák a [docs/art-prompts/](art-prompts/README.md) alatt vannak. Új promptnál repository-relatív útvonalakat használjunk. Egy régi generálás referenciája lehet már lecserélt kép; ez nem indok arra, hogy visszategyük a runtime-ba.

A speciális grafikai szerződések: [inventory](INVENTORY.md), [titkos helyek](SECRETS-0.6.md), [Yomi boss](YOMI-BOSS.md), [tanácsosi csarnok](COUNCIL-BRANCH.md). Új inventory-képet az ART_INVENTORY.items katalógusba kell regisztrálni, és a közös, DPR-t figyelembe vevő, kontrasztos rajzolóval megjeleníteni.

Kép-, kivágás- és színváltozás után frissítsd és ellenőrizd a colormaps.json fájlt. Futtasd az érintett sprite/VFX regressziókat, a buildet és a statikus ellenőrzést; kiadás előtt a teljes tesztcsomagot. A tesztek listája a [fejlesztői útmutatóban](DEVELOPMENT.md) van. A mockolt Canvas-teszt nem bizonyítja a látványt: valódi böngészőben is vizsgáld a képkockák folytonosságát, az illesztést, a telegráfok kontrasztját, a szünetet és a csökkentett mozgást.
