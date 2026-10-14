# Momo – Fény és árnyék · 0.5

## Kardok

A szamuráj boss hat külön, nagyobb helyet biztosító animációs képkockát kapott. A lecsengő és nyugalmi pózok a teljes pengét tartalmazzák. Ezeket a képkivágásokat külön ellenőrzött forrásterületek adják, nem a korábbi közös boss-atlasz szűk oszlopai. A kard hegye mindkét irányban renderelve ellenőrzött.

Momo új, nyolcképkockás támadási sorozata kihúzza, felemeli és előrevágja a katanát, majd visszatér az alapállásba. A támadás rajzolása elsőbbséget kap a futással és ugrással szemben. A csapás iránya a gombnyomáskor rögzül; a találat a 0,16 másodperces vágási ponton egyszer történik, nem már a fegyver előkészítésekor. Az eredeti 0,34 másodperces újratámadási idő megmarad. Az új csapás megszakíthatja az előző csapás lecsengését. Momo eredeti pet-képfájlja változatlan.

## Az oni harca

A kalapácsvágás a földrengés, láva és parázsszórás mellé került. A boss közeledik Kibához, és a lávafázis alatt is képes 0,7 másodperces előjelzéssel külön közelharci csapást indítani. A vágás a közeli alacsony platformon álló Kibát is eléri; a platform a lávától véd, a fegyvertől kitéréssel vagy szellemlépéssel kell védekezni.

Az idézés megjelenő vörös-ibolya kapukkal figyelmeztet. A kapuk 0,95 másodperc után oni közelharcost és démonmágust hoznak. Legfeljebb négy élő csatlós lehet az arénában. A csatlós legyőzése egyszer 8 XP-t ad. Az idézések, csatlósok és lövedékeik eltűnnek halálkor, szentélyes újrakezdéskor, gyorsutazáskor és a boss legyőzésekor.

## Az angyal fázisai

| Alak | Mikor jelenik meg? | Támadások |
| --- | --- | --- |
| A hajnal angyala | A harc kezdetén | Óriási fénynyilak, szent nyílzápor. Fehér szárnyak, ép glória. |
| A sötét angyal | 50% életerőnél | Shadow bolt párok, körkörös árnyéknóva, felülről érkező árnyékzápor. Fekete szárnyak, repedt glória. |
| A két világ ura | A II. alak legyőzése után, csak mindkét ereklyével | Teljes életerőre gyógyul; vegyes fény- és árnyéktámadások, pokoltűz és démonidézés. Fehér és fekete szárny, démoni szarvak. |

A kötelező első átalakulás nem tölti vissza az életerőt. A titkos harmadik fázis teljesen visszatölti, egy próbálkozáson belül egyszer. Az átalakulás 1,8 másodperces látványos szünetet kap; közben további kardcsapással nem lehet átugrani a következő alakot. Az égi átjáró, a végső szélfolyam és a 200 XP-s bossjutalom csak az utolsó szükséges alak legyőzése után nyílik meg. Halál után a harc az első alak és teljes életerő mellett kezdődik újra.

## Ereklyék és mentés

Az **angyali glória** és a **démonlord szarva** a japán pálya két opcionális mellékútján található, E-vel felvehető tárgyak. A gyűjtés a meglévő mentésben megmarad; egyetlen ereklye önmagában nem oldja fel a titkos fázist. Az új helyek a játék tényleges ugrási fizikájával elérhetők.

<details><summary>Az ereklyék helye – spoiler</summary>

- Glória: a lombkoronában, a lombok emléke melletti útból keletre és magasabbra nyíló oltáron.
- Szarv: a folyó alatti járat nyugati részén, a barlang padlója fölötti kis párkányon.

</details>

A 0.2–0.4 mentések képességei, tárgyállapotai és XP-je tovább használhatók. A korábban legyőzött angyal győzelmét a frissítés megőrzi. Ha már túljutottál Japánon vagy végigjátszottad a játékot, a titkos fázis felfedezéséhez válaszd az új utazást.

## Képek és promptok

A hat új atlasz a beépített **ImageGen** eszközzel készült. A teljes promptkészlet és referencia-szerepek: [V05-ART-PROMPTS.json](V05-ART-PROMPTS.json).

- `assets/images/momo-slash-v5.png`: nyolc kardcsapási képkocka.
- `assets/images/enemies/samurai-v5.png`: hat teljes kardpóz.
- `assets/images/enemies/angel-light-v5.png`: hat angyali fénypóz.
- `assets/images/enemies/angel-dark-v5.png`: hat sötét angyali póz.
- `assets/images/enemies/angel-eclipse-v5.png`: hat titkos, vegyes póz.
- `assets/images/relics-v5.png`: a két ereklye.

A forrás-PNG-k alfa-csatornája megmarad. Momo és az angyalok hosszú fegyverei mellett a kivágási útvonal az áttetsző hézagot követi, hogy a szomszédos figura ne rajzolódjon bele a támadásba.

## Ellenőrzés

```sh
node scripts/check-site.mjs
node scripts/test-combat.cjs
node scripts/test-v05.cjs
node scripts/test-routes.cjs
```

A tesztek vizsgálják a szinkronizált kardtalálatot, mozgás közbeni rajzolást, a teljes penge forrásterületét, mentett ereklyéket, láva alatti auto attackot, az idézési előjelzést és létszámkorlátot, csatlósjutalmat és törlést, 50%-os fázisváltást, mindkét tárgy szükségességét, egyszeri teljes visszagyógyulást és a végső jutalom késleltetését. A korábbi küldetések és mindkét új ereklye útvonalai a tényleges ugrási fizikával ellenőrzöttek.

Az összes kardképkocka mindkét irányban, a csatlósok, ereklyék és három angyali alak a játék tényleges Canvas-rajzolókódjával ellenőrzött. Teljes böngészős végigjátszás ebben a környezetben nem történt. Az élő GitHub Pages-oldal a repository frissítése után vált 0.5-re.
