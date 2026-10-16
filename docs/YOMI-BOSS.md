# A pokol ura és a lávakígyó

A démon a szokásos kalapácsütéseket, földrengést és parázslövedékeket használja. A minionok nem ismétlődő véletlen támadásból érkeznek: **80%, 60%, 40% és 20% HP-nál pontosan két-két démon** jelenik meg, egy harcos és egy mágus. A korábbi életben maradt szolgák nem csökkentik a következő pár létszámát. Minden küszöb egy kísérleten belül egyszer aktiválódik.

## Félidő: menedék a láva fölött

50%-nál a boss megszakítja a támadását és sebezhetetlenné válik. Két másodperc előjelzés után láva borítja a földet, és megjelenik a 24 HP-s **lávakígyó**. A platformok balról jobbra omlanak össze; az utolsó menedék megmarad. Minden omlást 1,1 másodpercnyi repedezés jelez, az első az aktív hullám 2. másodpercében következik be, a többi 1,45 másodpercenként.

A szakasz a kígyó megölésekor vagy az utolsó előtti sziget összeomlásakor ér véget. A láva visszahúzódik, a platformok helyreállnak, és a démon ismét sebezhető. A túlélő kígyó eltűnik és megőrzi a maradék HP-ját. A démon platformmagasságban lebeg, és az előjelzett közelharci ütéseit a lávás szakaszokban is használja.

A szakasz után a démon addig közelít, amíg ismét támadási távolságba ér, így a jobb szélső menedéknél nem kezdi távolról újra és újra a közelharci kombinációját. Az aktuális kísérlet idézett szolgái az aréna teljes szélességében követik Momót, a talaj és az alacsony menedékek magasságában. A talajon az aréna határai között járhatnak; az összeomlott menedékről, illetve a szakasz után Momo által elhagyott szigetről a talajra kerülnek. A támadások hatótávja, előjelzése és időzítése megmarad; ez a követés nem vonatkozik a pálya normál ellenfeleire vagy korábbi kísérletből származó idézésekre.

## Az utolsó 10%: verseny az összeomlással

10%-nál újabb kétszekundumos előjelzés után a láva visszatér. A boss ezúttal **sebezhető marad**, és az utolsó platform fölött, karddal elérhető magasságban áll. A félidőben életben maradt kígyó ugyanazzal a HP-val tér vissza; a megölt kígyó nem éled újra.

Ezúttal az utolsó sziget is összeomlik az aktív hullám 10,7. másodpercében. Nincs időzített platform-visszaállítás. A földre érkező játékost a láva azonnal visszaküldi a szentélyhez; a dash és ideiglenes sérthetetlenség ezt nem akadályozza meg. A nagy sebzés sem ugorhatja át sem az 50%-os, sem a 10%-os határt.

## Jutalmak és tartós állapot

A kígyó legyőzésekor egyszer jár a `serpentScale` tárgy és 70 XP. A tárgy megszerzése mentődik; a boss halála pusztán eltávolítja a megmaradt kígyót, jutalmat nem ad érte. Egy későbbi kísérletben megölt új kígyó nem ad második pikkelyt vagy ismételt XP-t.

A négy tanácsos kulcsa kizárólag a valódi, eredeti pokolbeli bosskísérletben **mind a nyolc idézett minion** megölése után jár a démon legyőzésekor. Nem látszik ölési számláló vagy elmaradt jutalomra figyelmeztető bossüzenet. A korábbi `councilKeyEarned`, `councilKey` és `councilGateOpen` zászlók, az egyszer megszerezhető kulcs és az egyszeri felhasználás szabályai megmaradnak.

Halál, pihenés vagy pályaváltás megszakítja az aktuális kísérletet: a küszöbök, minionok, kígyó, láva, lövedékek és platformomlások visszaállnak. Az új kígyó teljes HP-val érkezik; a már megszerzett pikkely tartós. A kísérlet belső állapota nem kerül a mentésbe.

## Fejlesztői ellenőrzés

```sh
node scripts/test-yomi-redesign.cjs
node scripts/test-serpent-art.cjs
```

A célzott regresszió a küszöböket, túlméretezett sebzést, szakaszváltásokat, a kígyó HP-megőrzését és jutalmát, a végső platform tényleges kard-elérhetőségét és fizikai összeomlását, a halálos lávát, a szünetet és a takarítást ellenőrzi. A grafikai illesztést, az előjelzések láthatóságát és a harc nehézségét valódi böngészőben is ellenőrizni kell.

A kígyó natív atlasza 12 eltérő pózt tartalmaz: 3 nyugalmi, 3 támadásjelző, 3 harapó és 3 visszaálló képet. A grafikát a közös láva-, parázs- és csapáseffektusok egészítik ki; a sérthetetlenséget külön, a támadásnevektől elválasztott jelzés mutatja. A generálási promptok: [lava-serpent-v1.json](art-prompts/lava-serpent-v1.json).

A `lava-serpent-art.json` és az `art-data.js` beágyazott `ART_SERPENT` értéke együtt frissítendő. A grafikai teszt az eredeti PNG alfáját dekódolva bizonyítja, hogy egyik teljes kígyósziluett sem vágódik le és szomszédos képkocka sem szivárog át. A kontúrok a forráspixelek teljes négyzetét fogják körbe; az eredeti alfa változatlan. A külön pikkelykép a közös, kontrasztos inventory-rajzolót használja.
