# 0.8.3 · Angyali fény és az ég átalakulása

Az öreg angyal legyezős varázslata és a végső boss repülő fénynyilai közös, festett fehér-arany nyílsprite-ot használnak. A boss égből érkező óriási nyilai külön, függőleges lándzsaassetet kaptak. A tollas díszítés, a fémes-filigrán mag és az áttetsző fénycsóva a szereplők részletes festett grafikájához igazodik. Az új képek eredeti PNG-átlátszósága megmaradt.

- [Repülő fénynyíl](../assets/images/effects/holy-arrow-v1.png)
- [Égből lesújtó óriási fénynyíl](../assets/images/effects/holy-lance-v1.png)

Az `ART_EFFECTS` metaadatai a lövedék csúcsát illesztik a tényleges repülési ponthoz, az óriási nyíl csúcsát pedig a talajon jelzett becsapódáshoz. Az előjelzés alatt az óriási nyíl halványan kirajzolódik, a talajon sötét alátét és arany céljel marad látható. A repülés, sebzés, előjelzési idő és találati terület a harci szabályokat követi.

## Az égi háttér három változata

Az új változatok az eredeti, 1024 × 1536 képből készültek, azonos kameraállással és a felismerhető sziget-, híd- és templomelrendezés megtartásával.

| Állapot | Háttér |
| --- | --- |
| A pálya és az első bossfázis | Az eredeti [világos ég](../assets/images/backgrounds/heaven-v3.png). |
| Második bossfázis | [Sötét, viharfelhős ég](../assets/images/backgrounds/heaven-dark-v1.png), lila köddel és hideg kristályfénnyel. |
| Titkos bossfázis | [Apokaliptikus napfogyatkozás](../assets/images/backgrounds/heaven-eclipse-v1.png), vörös viharral, izzó repedésekkel és hulló törmelékkel. |

A fázisváltás finom áttűnést indít. Azonos képméret és kivágás mellett a váltás nem mozgatja el a háttér épületeit. Szünetben, történetablakban és más játékmeneti menükben az áttűnés is megáll. A harc újrakezdésekor és a győzelem után a világos ég tér vissza; az első pálya angyal-minibossának varázslata nem változtatja meg Japán hátterét.

## Forrás és ellenőrzés

Mind a négy kép a beépített `image_gen` eszközzel készült. A két háttér az eredeti égi kép szerkesztése; a két nyíl új, átlátszó grafika. A [teljes generálási és szerkesztési promptok](art-prompts/angel-vfx-heaven-phases-v1.json) megmaradtak. Az új assetek és illesztési metaadataik a [colormap-referenciába](../assets/config/colormaps.json) is bekerültek.

A `scripts/test-angel-art.cjs` ellenőrzi a két szereplő tényleges nyílvarázslatait, a csúcsok illesztését, az előjelzés és becsapódás átlátszóságát, a háttérképek azonos kivágását, az 50%-os és titkos átalakulást, a szünetet és a harc végén/újrakezdésekor visszatérő világos hátteret. A Pages workflow része.
