# Yomi oldalága: a Négy Tanácsos Csarnoka

Yomi középső mélységének jobb oldalán, a keleti folyópárkányon egy nagy, láncokkal lezárt fakapu áll. Az oldalág opcionális: a két lélek felszabadítása, a démoni őrző és a mennyország felé vezető fő út változatlanul működik.

## A csontkulcs

- Egyetlen démonboss-harc során legalább **négy megidézett miniont** kell legyőzni, majd magát a bosst.
- A boss életerősávjánál megjelenő számláló mutatja a feltétel teljesítését. Csak az aktív Yomi-összecsapás idézett ellenfelei számítanak; a normál katonák és ugyanazon holttest ismételt találatai nem.
- Négy vagy több minion után a boss legyőzése megjeleníti a **4 tanácsos kulcsát** a boss termének közepén. Ez külön felvehető, csontból készült tárgy; az interakciógombbal kell megszerezni.
- Halál, szentélypihenés vagy az összecsapás elhagyása új próbát jelent. A külön harcok ölési számai nem adódnak össze.
- A kulcsdobás jogosultsága és a kapu feloldása az adott verzión belül mentődik, halál után is megmarad. Az első kapunyitáskor a kulcs elporlad és eltűnik a tárgyak közül; a nyitott kapun később kulcs nélkül is átjárhatsz.

A boss nem hívható vissza. Ha a győzelemkor nem volt meg a négy minion, az opcionális ág azon az utazáson kimarad; új játékban próbálható ismét. A fő történet továbbra is végigjátszható.

## A kastély

A láncos kapu a megszerzett kulccsal nyitható. Bent egy **ellenfelek nélküli**, démoni japán kastélybelső járható be, a négy üres tanácsosi hellyel és egy elolvasható felirattal. A bejáratnál az interakciógombbal lehet visszatérni Yomiba.

Ez külön belső pálya Yomi birodalmán belül, nem negyedik birodalom. A fő térkép és a gyorsutazás továbbra is Yomi szentélyeit mutatja. A normál kijárat visszavisz a kapu előtti párkányra az előző életerővel és kültéri ellenfélállapottal. Halál, leesés vagy gyorsutazás a megfelelő kültéri szentélyre vezet.

A mentés a megszokott, érvényes Yomi-szentélyt őrzi: **újratöltés/Folytatás után a kültéri mentőpontnál ébredsz**, a még fel nem használt kulcs vagy a már nyitott kapu viszont megmarad. Új alfa/béta verziónál ez a haladás is törlődik. A belső pálya nem ad új szentélyt vagy mentési sémaverziót.

## Grafika és referencia

A négy festett PNG a beépített image_gen eszközzel készült. Az eredeti átlátszóság megmaradt; a nyitott kapu átjárója szándékosan sötét, a külső háttér átlátszó.

- [Láncos fakapu](../assets/images/council-gate-closed-v1.png)
- [Nyitott fakapu](../assets/images/council-gate-open-v1.png)
- [A négy tanácsos csontkulcsa](../assets/images/council-key-v1.png)
- [Démoni kastélybelső](../assets/images/backgrounds/council-hall-v1.png)
- [Generálási promptok](art-prompts/council-branch-v1.json)

Az ART_COUNCIL metaadatok őrzik a méreteket és illesztési pontokat. A kastély fal- és padlórészlete a járható felszínhez, y=820-hoz illeszkedik. A paletták és regisztrációk az [assets/config/colormaps.json](../assets/config/colormaps.json) fájlban is szerepelnek.

## Ellenőrzés

A scripts/test-council-branch.cjs a 0/3/4/5 minionos feltételt, tényleges kardtalálatos minionölést, számláló-visszaállítást, a végleg kimaradt kulcsot, a visszahívás hiányát, egyszeri bossjutalmat, tárgyfelvételt, mentési láncot, verzióhoz kötött mentéseket, az üres belső pályát és a visszatérési útvonalakat ellenőrzi. Része az npm test parancsnak és a Pages workflow-nak; a képméreteket, alfát és padlóregisztrációt is vizsgálja.

A független Chrome QA HU/EN asztali és mobilnézetben ellenőrizte a kaput, a kulcsot, az átjárást, a feliratot, a szünetet, a térképes visszatérést és a valódi titkosított IndexedDB-mentés újratöltését. A böngészős teszt szintetikus haladási adatot, pozicionálást és sebzést használt egy kizárólag tesztként kiszolgált példányban; a valódi idézést, öléskezelést, bossgyőzelmet és interakciókat futtatta. A kardtalálat időzítését külön a VM-teszt ellenőrzi. Ez nem teljes, kézi végigjátszás.
